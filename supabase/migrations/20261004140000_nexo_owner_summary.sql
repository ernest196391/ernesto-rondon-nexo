-- Owner summary for VivaBot's owner mode (read-only, service_role only).
-- Sales and profit for today / last 7 days / this month (America/Havana),
-- gestora ranking for the month, people balances and pending payouts, what is
-- owed to each socio, low stock and stuck orders. No phones, cards, payout data
-- or customer data. Profit uses the same rules as nexo_business_report (cost
-- from product_unit_economics, minus what each sale paid to people).

CREATE OR REPLACE FUNCTION nexo_business.period_totals(p_business TEXT, p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  WITH sales AS (
    SELECT e.envelope->'payload'->>'sale_id' AS sale_id, (e.envelope->'payload'->>'total_minor')::BIGINT AS total_minor, e.envelope->'payload' AS p
      FROM nexo_business.sync_events e
     WHERE e.business_id = p_business AND e.operation_type = 'sale.completed'
       AND e.occurred_at::timestamptz >= p_from AND e.occurred_at::timestamptz < p_to),
  lines AS (
    SELECT s.sale_id, l->>'product_id' AS product_id, (l->>'quantity')::BIGINT AS qty,
           coalesce((l->>'line_total_minor')::BIGINT, (l->>'quantity')::BIGINT * (l->>'unit_price_minor')::BIGINT, s.total_minor) AS line_minor
      FROM sales s, jsonb_array_elements(CASE WHEN jsonb_typeof(s.p->'lines') = 'array' THEN s.p->'lines'
             ELSE jsonb_build_array(jsonb_build_object('product_id', s.p->>'product_id', 'quantity', coalesce(s.p->>'quantity', '1'), 'line_total_minor', s.total_minor)) END) l),
  econ AS (SELECT * FROM nexo_business.product_unit_economics(p_business)),
  other AS (SELECT coalesce((SELECT other_pct FROM nexo_business.cost_settings WHERE business_id = p_business), 0) AS pct),
  paid AS (
    SELECT ce.sale_id, ce.product_id, sum(ce.amount_usd) AS usd
      FROM nexo_business.commission_entries ce LEFT JOIN nexo_business.people pp ON pp.id = ce.person_id
     WHERE ce.business_id = p_business AND ce.status = 'available' AND ce.sale_id IN (SELECT sale_id FROM sales)
       AND NOT (ce.kind = 'partner' AND pp.partner_rule = 'supplier_price')
     GROUP BY 1, 2),
  priced AS (
    SELECT l.*, x.total_cost IS NOT NULL AS has_cost,
           CASE WHEN x.total_cost IS NOT NULL THEN l.line_minor / 100.0 - l.qty * x.total_cost
                - (l.line_minor / 100.0) * (SELECT pct FROM other) / 100 - coalesce(pd.usd, 0) END AS profit
      FROM lines l LEFT JOIN econ x ON x.product_id = l.product_id
      LEFT JOIN paid pd ON pd.sale_id = l.sale_id AND pd.product_id = l.product_id)
  SELECT jsonb_build_object(
    'sales', (SELECT count(*) FROM sales),
    'salesUsd', round((SELECT coalesce(sum(total_minor), 0) FROM sales) / 100.0, 2),
    'units', (SELECT coalesce(sum(qty), 0) FROM lines),
    'profitUsd', (SELECT round(coalesce(sum(profit), 0), 2) FROM priced),
    'costedSharePct', (SELECT CASE WHEN coalesce(sum(line_minor), 0) = 0 THEN 0
                         ELSE round(100.0 * coalesce(sum(line_minor) FILTER (WHERE has_cost), 0) / sum(line_minor)) END FROM priced));
$$;
REVOKE ALL ON FUNCTION nexo_business.period_totals(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nexo_owner_summary(p_business TEXT DEFAULT 'casa-viva')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_tz CONSTANT TEXT := 'America/Havana';
  v_today DATE := (now() AT TIME ZONE v_tz)::date;
  v_t0 TIMESTAMPTZ := v_today::timestamp AT TIME ZONE v_tz;
  v_t1 TIMESTAMPTZ := (v_today + 1)::timestamp AT TIME ZONE v_tz;
  v_w0 TIMESTAMPTZ := (v_today - 6)::timestamp AT TIME ZONE v_tz;
  v_m0 TIMESTAMPTZ := date_trunc('month', v_today)::timestamp AT TIME ZONE v_tz;
BEGIN
  RETURN jsonb_build_object(
    'business', p_business,
    'generatedAt', now(),
    'currency', 'USD',
    'today', nexo_business.period_totals(p_business, v_t0, v_t1),
    'last7Days', nexo_business.period_totals(p_business, v_w0, v_t1),
    'thisMonth', nexo_business.period_totals(p_business, v_m0, v_t1),
    'gestorasRankingMonth', coalesce((SELECT jsonb_agg(jsonb_build_object('name', g.full_name, 'sales', t.n, 'salesUsd', round(t.m / 100.0, 2),
          'commissionUsd', round(coalesce((SELECT sum(ce.amount_usd) FROM nexo_business.commission_entries ce
            WHERE ce.person_id = g.id AND ce.status = 'available' AND ce.created_at >= v_m0), 0), 2)) ORDER BY t.m DESC)
        FROM (SELECT e.envelope->'payload'->>'gestor_id' AS gid, count(*) n, sum((e.envelope->'payload'->>'total_minor')::BIGINT) m
                FROM nexo_business.sync_events e
               WHERE e.business_id = p_business AND e.operation_type = 'sale.completed' AND e.occurred_at::timestamptz >= v_m0
                 AND e.envelope->'payload'->>'gestor_id' IS NOT NULL GROUP BY 1 ORDER BY 3 DESC LIMIT 10) t
        JOIN nexo_business.people g ON g.id::text = t.gid AND g.business_id = p_business), '[]'::jsonb),
    'balances', coalesce((SELECT jsonb_agg(jsonb_build_object('name', p.full_name, 'kind', p.kind,
          'availableUsd', (nexo_business.person_balance(p.id)->>'availableUsd')::numeric,
          'pendingUsd', (nexo_business.person_balance(p.id)->>'pendingUsd')::numeric) ORDER BY p.kind, p.full_name)
        FROM nexo_business.people p WHERE p.business_id = p_business AND p.status = 'active' AND p.kind IN ('gestor', 'staff')
          AND ((nexo_business.person_balance(p.id)->>'availableUsd')::numeric <> 0 OR (nexo_business.person_balance(p.id)->>'pendingUsd')::numeric <> 0)), '[]'::jsonb),
    'pendingPayouts', coalesce((SELECT jsonb_agg(jsonb_build_object('name', p.full_name, 'kind', p.kind, 'amountUsd', x.amount_usd,
          'requestedAt', x.requested_at) ORDER BY x.requested_at)
        FROM nexo_business.payouts x JOIN nexo_business.people p ON p.id = x.person_id
        WHERE x.business_id = p_business AND x.status = 'requested'), '[]'::jsonb),
    'owedToPartners', coalesce((SELECT jsonb_agg(jsonb_build_object('name', p.full_name, 'type', p.partner_type, 'rule', p.partner_rule,
          'owedUsd', (nexo_business.person_balance(p.id)->>'availableUsd')::numeric,
          'products', (SELECT count(*) FROM nexo_business.product_costs c WHERE c.partner_id = p.id)) ORDER BY p.full_name)
        FROM nexo_business.people p WHERE p.business_id = p_business AND p.kind = 'partner' AND p.status = 'active'), '[]'::jsonb),
    'lowStock', coalesce((SELECT jsonb_agg(jsonb_build_object('product', c.name, 'stock', s.quantity, 'min', coalesce(c.min_stock, 2)) ORDER BY s.quantity, c.name)
        FROM (SELECT * FROM nexo_business.stock_by_product WHERE business_id = p_business) s
        JOIN nexo_business.catalog_products c ON c.business_id = s.business_id AND c.product_id = s.product_id AND c.active
        WHERE s.quantity <= coalesce(c.min_stock, 2) LIMIT 40), '[]'::jsonb),
    'stuckOrders', coalesce((SELECT jsonb_agg(jsonb_build_object('number', o.number, 'status', o.status, 'gestora', g.full_name,
          'totalUsd', round(o.total_minor / 100.0, 2), 'delivery', o.delivery,
          'ageDays', floor(extract(epoch FROM now() - o.created_at) / 86400)) ORDER BY o.created_at)
        FROM nexo_business.orders o LEFT JOIN nexo_business.people g ON g.id = o.gestor_id
        WHERE o.business_id = p_business AND o.status IN ('pending', 'paid') AND o.created_at < now() - interval '2 days'), '[]'::jsonb),
    'reviewPending', (SELECT count(*) FROM nexo_business.import_review WHERE business_id = p_business AND status = 'needs_review'));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_owner_summary(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_owner_summary(TEXT) TO service_role;
