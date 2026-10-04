-- Real business profit: the report subtracts what each sale actually paid to
-- people (commission ledger) instead of assuming a commission, and adds the
-- gestora ranking for the period.
CREATE OR REPLACE FUNCTION public.nexo_business_report(p_business TEXT, p_from DATE, p_to DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_tz CONSTANT TEXT := 'America/Havana';
  v_from TIMESTAMPTZ;
  v_to TIMESTAMPTZ;
BEGIN
  IF nexo_business.role_of(p_business) IS NULL OR nexo_business.role_of(p_business) = 'partner' THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Periodo inválido (máximo un año)');
  END IF;
  v_from := p_from::timestamp AT TIME ZONE v_tz;
  v_to := (p_to + 1)::timestamp AT TIME ZONE v_tz;

  RETURN (
    WITH sales AS (
      SELECT e.event_id, e.envelope->'payload'->>'sale_id' AS sale_id, e.occurred_at::timestamptz AS at,
             e.device_id, (e.envelope->'payload'->>'total_minor')::BIGINT AS total_minor, e.envelope->'payload' AS p
        FROM nexo_business.sync_events e
       WHERE e.business_id = p_business AND e.operation_type = 'sale.completed'
         AND e.occurred_at::timestamptz >= v_from AND e.occurred_at::timestamptz < v_to),
    lines AS (
      SELECT s.sale_id, l->>'product_id' AS product_id, (l->>'quantity')::BIGINT AS qty,
             coalesce((l->>'line_total_minor')::BIGINT, (l->>'quantity')::BIGINT * (l->>'unit_price_minor')::BIGINT, s.total_minor) AS line_minor
        FROM sales s, jsonb_array_elements(CASE WHEN jsonb_typeof(s.p->'lines') = 'array' THEN s.p->'lines'
               ELSE jsonb_build_array(jsonb_build_object('product_id', s.p->>'product_id', 'quantity', coalesce(s.p->>'quantity', '1'),
                    'line_total_minor', s.total_minor)) END) l),
    econ AS (SELECT * FROM nexo_business.product_unit_economics(p_business)),
    other AS (SELECT coalesce((SELECT other_pct FROM nexo_business.cost_settings WHERE business_id = p_business), 0) AS pct),
    paid AS (
      -- What the sale really paid to people: gestora, dependienta, extra split and socios.
      -- A consignment supplier's price is already the product cost, so it is not taken twice.
      SELECT ce.sale_id, ce.product_id, sum(ce.amount_usd) AS usd
        FROM nexo_business.commission_entries ce
        LEFT JOIN nexo_business.people pp ON pp.id = ce.person_id
       WHERE ce.business_id = p_business AND ce.status = 'available'
         AND ce.sale_id IN (SELECT sale_id FROM sales)
         AND NOT (ce.kind = 'partner' AND pp.partner_rule = 'supplier_price')
       GROUP BY 1, 2),
    priced AS (
      SELECT l.*, x.total_cost IS NOT NULL AS has_cost,
             CASE WHEN x.total_cost IS NOT NULL
                  THEN l.line_minor / 100.0 - l.qty * x.total_cost - (l.line_minor / 100.0) * (SELECT pct FROM other) / 100 - coalesce(pd.usd, 0) END AS profit
        FROM lines l LEFT JOIN econ x ON x.product_id = l.product_id
        LEFT JOIN paid pd ON pd.sale_id = l.sale_id AND pd.product_id = l.product_id),
    pays AS (
      SELECT s.sale_id, pe->>'method' AS method, coalesce(pe->>'rail', 'cash') AS rail, upper(coalesce(pe->>'currency', 'USD')) AS currency,
             pe->>'provider' AS provider, pe->>'external_ref' AS ref,
             (pe->>'amount_minor')::BIGINT AS amount_minor, coalesce((pe->>'usd_minor')::BIGINT, (pe->>'amount_minor')::BIGINT) AS usd_minor
        FROM sales s, jsonb_array_elements(coalesce(s.p->'payments', jsonb_build_array(jsonb_build_object(
               'method', 'cash', 'rail', 'cash', 'currency', 'USD', 'amount_minor', s.total_minor, 'usd_minor', s.total_minor)))) pe),
    refunds AS (
      SELECT coalesce(sum((e.envelope->'payload'->>'refund_minor')::BIGINT), 0) AS minor, count(*) AS n
        FROM nexo_business.sync_events e
       WHERE e.business_id = p_business AND e.operation_type = 'sale.returned'
         AND e.occurred_at::timestamptz >= v_from AND e.occurred_at::timestamptz < v_to)
    SELECT jsonb_build_object(
      'from', p_from, 'to', p_to,
      'totals', jsonb_build_object(
        'sales', (SELECT count(*) FROM sales),
        'usdMinor', (SELECT coalesce(sum(total_minor), 0) FROM sales),
        'units', (SELECT coalesce(sum(qty), 0) FROM lines),
        'refundsMinor', (SELECT minor FROM refunds), 'refunds', (SELECT n FROM refunds),
        'profitUsd', (SELECT round(coalesce(sum(profit), 0), 2) FROM priced),
        'costedMinor', (SELECT coalesce(sum(line_minor), 0) FROM priced WHERE has_cost),
        'paidToPeopleUsd', (SELECT round(coalesce(sum(usd), 0), 2) FROM paid)),
      'gestores', coalesce((SELECT jsonb_agg(jsonb_build_object('id', g.id, 'name', g.full_name, 'sales', t.n, 'usdMinor', t.m,
                    'commissionUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries ce
                       WHERE ce.person_id = g.id AND ce.status = 'available' AND ce.sale_id IN (SELECT sale_id FROM sales)), 0), 2)) ORDER BY t.m DESC)
                  FROM (SELECT p->>'gestor_id' gid, count(*) n, sum(total_minor) m FROM sales WHERE p->>'gestor_id' IS NOT NULL GROUP BY 1) t
                  JOIN nexo_business.people g ON g.id::text = t.gid AND g.business_id = p_business), '[]'::jsonb),
      'byMethod', coalesce((SELECT jsonb_agg(jsonb_build_object('method', method, 'rail', rail, 'provider', provider, 'currency', currency,
                    'count', n, 'amountMinor', amount, 'usdMinor', usd) ORDER BY usd DESC)
                  FROM (SELECT method, rail, provider, currency, count(*) n, sum(amount_minor) amount, sum(usd_minor) usd
                          FROM pays GROUP BY 1, 2, 3, 4) t), '[]'::jsonb),
      'byDay', coalesce((SELECT jsonb_agg(jsonb_build_object('day', d, 'usdMinor', m, 'sales', n) ORDER BY d)
                  FROM (SELECT (at AT TIME ZONE v_tz)::date d, sum(total_minor) m, count(*) n FROM sales GROUP BY 1) t), '[]'::jsonb),
      'byHour', coalesce((SELECT jsonb_agg(jsonb_build_object('hour', h, 'usdMinor', m, 'sales', n) ORDER BY h)
                  FROM (SELECT extract(hour FROM at AT TIME ZONE v_tz)::int h, sum(total_minor) m, count(*) n FROM sales GROUP BY 1) t), '[]'::jsonb),
      'topProducts', coalesce((SELECT jsonb_agg(jsonb_build_object('productId', t.product_id, 'name', coalesce(c.name, t.product_id),
                    'imageUrl', c.image_url, 'units', t.u, 'usdMinor', t.m, 'profitUsd', t.pr) ORDER BY t.m DESC)
                  FROM (SELECT product_id, sum(qty) u, sum(line_minor) m, round(sum(profit), 2) pr FROM priced GROUP BY 1 ORDER BY 3 DESC LIMIT 10) t
                  LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = t.product_id), '[]'::jsonb),
      'sales', coalesce((SELECT jsonb_agg(jsonb_build_object(
                    'saleId', s.sale_id, 'at', s.at, 'device', coalesce(d.label, s.device_id), 'usdMinor', s.total_minor,
                    'lines', (SELECT jsonb_agg(jsonb_build_object('name', coalesce(c.name, l.product_id), 'qty', l.qty, 'minor', l.line_minor))
                                FROM lines l LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = l.product_id
                               WHERE l.sale_id = s.sale_id),
                    'payments', (SELECT jsonb_agg(jsonb_build_object('method', method, 'rail', rail, 'provider', provider, 'currency', currency,
                                   'amountMinor', amount_minor, 'usdMinor', usd_minor, 'reference', ref)) FROM pays WHERE pays.sale_id = s.sale_id))
                  ORDER BY s.at DESC)
                  FROM sales s LEFT JOIN nexo_business.devices d ON d.business_id = p_business AND d.device_id = s.device_id), '[]'::jsonb)
    ));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_report(TEXT, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_report(TEXT, DATE, DATE) TO authenticated;
