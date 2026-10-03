-- Read models over nexo_business.sync_events plus an owner summary.
--
-- Views parse the append-only events, so they are always consistent with what
-- devices pushed and need no extra writes. They live in `nexo_business`, which
-- anon/authenticated cannot reach. business_summary() is the only reader
-- exposed, through a service-role-only wrapper called by the
-- nexo-business-summary Edge Function with a device token.

CREATE OR REPLACE VIEW nexo_business.sales AS
SELECT
  e.business_id,
  e.envelope->'payload'->>'sale_id' AS sale_id,
  e.device_id AS sender_device_id,
  e.occurred_at::timestamptz AS occurred_at,
  upper(e.envelope->'payload'->>'currency') AS currency,
  (e.envelope->'payload'->>'total_minor')::BIGINT AS total_minor,
  coalesce(e.envelope->'payload'->>'payment_method', 'cash') AS payment_method,
  e.envelope->'payload'->>'shift_id' AS shift_id,
  e.received_at
FROM nexo_business.sync_events e
WHERE e.operation_type = 'sale.completed';

CREATE OR REPLACE VIEW nexo_business.sale_returns AS
SELECT
  e.business_id,
  e.envelope->'payload'->>'return_id' AS return_id,
  e.envelope->'payload'->>'sale_id' AS sale_id,
  e.occurred_at::timestamptz AS occurred_at,
  upper(e.envelope->'payload'->>'currency') AS currency,
  (e.envelope->'payload'->>'refund_minor')::BIGINT AS refund_minor,
  e.envelope->'payload'->>'refund_rail' AS refund_rail,
  e.envelope->'payload'->>'reason' AS reason
FROM nexo_business.sync_events e
WHERE e.operation_type = 'sale.returned';

CREATE OR REPLACE VIEW nexo_business.cash_movements AS
SELECT
  e.business_id,
  e.envelope->'payload'->>'movement_id' AS movement_id,
  e.envelope->'payload'->>'shift_id' AS shift_id,
  e.device_id AS sender_device_id,
  e.occurred_at::timestamptz AS occurred_at,
  e.envelope->'payload'->>'kind' AS kind,
  e.envelope->'payload'->>'direction' AS direction,
  upper(e.envelope->'payload'->>'currency') AS currency,
  (e.envelope->'payload'->>'amount_minor')::BIGINT AS amount_minor,
  e.envelope->'payload'->>'reason' AS reason,
  e.envelope->'payload'->>'category' AS category
FROM nexo_business.sync_events e
WHERE e.operation_type = 'cash_movement.recorded';

CREATE OR REPLACE VIEW nexo_business.receivable_balances AS
SELECT
  o.business_id,
  o.envelope->'payload'->>'receivable_id' AS receivable_id,
  o.envelope->'payload'->>'customer_id' AS customer_id,
  upper(o.envelope->'payload'->>'currency') AS currency,
  (o.envelope->'payload'->>'amount_minor')::BIGINT AS original_minor,
  coalesce(sum((p.envelope->'payload'->>'amount_minor')::BIGINT), 0) AS settled_minor,
  (o.envelope->'payload'->>'amount_minor')::BIGINT
    - coalesce(sum((p.envelope->'payload'->>'amount_minor')::BIGINT), 0) AS balance_minor
FROM nexo_business.sync_events o
LEFT JOIN nexo_business.sync_events p
  ON p.operation_type IN ('receivable.payment_recorded', 'receivable.written_off')
 AND p.business_id = o.business_id
 AND p.envelope->'payload'->>'receivable_id' = o.envelope->'payload'->>'receivable_id'
WHERE o.operation_type = 'receivable.opened'
GROUP BY o.business_id, o.envelope;

CREATE OR REPLACE VIEW nexo_business.messenger_custody AS
SELECT
  e.business_id,
  e.envelope->'payload'->>'messenger_id' AS messenger_id,
  upper(e.envelope->'payload'->>'currency') AS currency,
  sum(CASE WHEN e.operation_type = 'messenger_custody.collected'
           THEN (e.envelope->'payload'->>'amount_minor')::BIGINT
           ELSE -(e.envelope->'payload'->>'amount_minor')::BIGINT END) AS outstanding_minor
FROM nexo_business.sync_events e
WHERE e.operation_type IN ('messenger_custody.collected', 'messenger_custody.returned', 'messenger_custody.written_off')
GROUP BY 1, 2, 3;

REVOKE ALL ON ALL TABLES IN SCHEMA nexo_business FROM PUBLIC, anon, authenticated;
GRANT SELECT ON nexo_business.sales, nexo_business.sale_returns, nexo_business.cash_movements,
  nexo_business.receivable_balances, nexo_business.messenger_custody TO service_role;

-- Owner summary for the business of the calling device (any provisioned device).
-- Days are in the business's local time zone (Cuba).
CREATE OR REPLACE FUNCTION nexo_business.business_summary(p_token TEXT, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_device nexo_business.devices%ROWTYPE;
  v_since DATE;
  v_tz CONSTANT TEXT := 'America/Havana';
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  SELECT * INTO v_device FROM nexo_business.devices
   WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  v_since := (now() AT TIME ZONE v_tz)::date - (least(greatest(coalesce(p_days, 7), 1), 90) - 1);

  RETURN jsonb_build_object(
    'businessId', v_device.business_id,
    'generatedAt', now(),
    'since', v_since,
    'days', coalesce((
      SELECT jsonb_agg(d ORDER BY d->>'day' DESC, d->>'currency')
      FROM (
        SELECT jsonb_build_object(
          'day', s.day, 'currency', s.currency,
          'salesCount', s.sales_count, 'salesMinor', s.sales_minor,
          'refundsMinor', coalesce(r.refunds_minor, 0)) AS d
        FROM (
          SELECT (occurred_at AT TIME ZONE v_tz)::date AS day, currency,
                 count(*) AS sales_count, sum(total_minor) AS sales_minor
          FROM nexo_business.sales
          WHERE business_id = v_device.business_id AND (occurred_at AT TIME ZONE v_tz)::date >= v_since
          GROUP BY 1, 2
        ) s
        LEFT JOIN (
          SELECT (occurred_at AT TIME ZONE v_tz)::date AS day, currency, sum(refund_minor) AS refunds_minor
          FROM nexo_business.sale_returns
          WHERE business_id = v_device.business_id
          GROUP BY 1, 2
        ) r ON r.day = s.day AND r.currency = s.currency
      ) x
    ), '[]'::jsonb),
    'totals', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'salesCount', n, 'salesMinor', total) ORDER BY currency)
      FROM (SELECT currency, count(*) n, sum(total_minor) total FROM nexo_business.sales
            WHERE business_id = v_device.business_id GROUP BY currency) t
    ), '[]'::jsonb),
    'receivables', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'openCount', n, 'balanceMinor', bal) ORDER BY currency)
      FROM (SELECT currency, count(*) n, sum(balance_minor) bal FROM nexo_business.receivable_balances
            WHERE business_id = v_device.business_id AND balance_minor > 0 GROUP BY currency) t
    ), '[]'::jsonb),
    'messengerCash', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'outstandingMinor', o) ORDER BY currency)
      FROM (SELECT currency, sum(outstanding_minor) o FROM nexo_business.messenger_custody
            WHERE business_id = v_device.business_id GROUP BY currency HAVING sum(outstanding_minor) <> 0) t
    ), '[]'::jsonb),
    'devices', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'deviceId', d.device_id, 'label', d.label, 'lastSeenAt', d.last_seen_at,
        'events', (SELECT count(*) FROM nexo_business.sync_events e
                   WHERE e.business_id = d.business_id AND e.device_id = d.device_id)) ORDER BY d.device_id)
      FROM nexo_business.devices d WHERE d.business_id = v_device.business_id AND d.active
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION nexo_business.business_summary(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION nexo_business.business_summary(TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION public.nexo_business_summary(p_token TEXT, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT nexo_business.business_summary(p_token, p_days);
$$;

REVOKE ALL ON FUNCTION public.nexo_business_summary(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_summary(TEXT, INT) TO service_role;
