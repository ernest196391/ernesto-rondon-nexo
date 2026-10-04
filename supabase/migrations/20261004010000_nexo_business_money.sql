-- Money view for the owner dashboard: payments by method, non-cash payments
-- with their reference (to reconcile with the bank, Zelle or the wallet) and
-- cash shifts with expected vs counted per currency. Read-only, members only.
CREATE OR REPLACE FUNCTION public.nexo_business_money(p_business TEXT, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_tz CONSTANT TEXT := 'America/Havana';
  v_since TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members WHERE user_id = auth.uid() AND business_id = p_business) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  v_since := (((now() AT TIME ZONE v_tz)::date - (least(greatest(coalesce(p_days, 7), 1), 90) - 1))::timestamp AT TIME ZONE v_tz);

  RETURN jsonb_build_object(
    'since', v_since,
    'byMethod', coalesce((
      SELECT jsonb_agg(jsonb_build_object('method', method, 'rail', rail, 'provider', provider, 'currency', currency,
               'count', n, 'amountMinor', amount, 'usdMinor', usd) ORDER BY usd DESC)
      FROM (SELECT method, rail, provider, currency, count(*) n, sum(amount_minor) amount, sum(coalesce(usd_minor, amount_minor)) usd
              FROM nexo_business.sale_payments
             WHERE business_id = p_business AND occurred_at >= v_since
             GROUP BY method, rail, provider, currency) t
    ), '[]'::jsonb),
    'transfers', coalesce((
      SELECT jsonb_agg(jsonb_build_object('saleId', sale_id, 'occurredAt', occurred_at, 'method', method, 'provider', provider,
               'currency', currency, 'amountMinor', amount_minor, 'usdMinor', usd_minor, 'reference', external_ref) ORDER BY occurred_at DESC)
      FROM (SELECT * FROM nexo_business.sale_payments
             WHERE business_id = p_business AND occurred_at >= v_since AND coalesce(rail, 'cash') <> 'cash'
             ORDER BY occurred_at DESC LIMIT 200) t
    ), '[]'::jsonb),
    'shifts', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'shiftId', o.shift_id, 'deviceId', o.device_id, 'deviceLabel', d.label,
               'openedAt', o.opened_at, 'openingFloats', o.floats,
               'closedAt', c.closed_at, 'note', c.note, 'counts', c.counts) ORDER BY o.opened_at DESC)
      FROM (SELECT e.envelope->'payload'->>'shift_id' shift_id, e.device_id, e.occurred_at::timestamptz opened_at,
                   e.envelope->'payload'->'opening_floats' floats
              FROM nexo_business.sync_events e
             WHERE e.business_id = p_business AND e.operation_type = 'cash_shift.opened') o
      LEFT JOIN (SELECT e.envelope->'payload'->>'shift_id' shift_id, e.occurred_at::timestamptz closed_at,
                        e.envelope->'payload'->>'note' note, e.envelope->'payload'->'counts' counts
                   FROM nexo_business.sync_events e
                  WHERE e.business_id = p_business AND e.operation_type = 'cash_shift.closed') c USING (shift_id)
      LEFT JOIN nexo_business.devices d ON d.business_id = p_business AND d.device_id = o.device_id
      WHERE o.opened_at >= v_since OR c.closed_at IS NULL
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_money(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_money(TEXT, INT) TO authenticated;
