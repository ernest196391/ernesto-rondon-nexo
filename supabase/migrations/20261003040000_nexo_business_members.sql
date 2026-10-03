-- Owner dashboard access with real accounts (Supabase Auth).
--
-- * members: which signed-in users may see which business. Rows are added by
--   NEXO (service role) after the person signs up; users cannot add themselves.
-- * summary_for(business, days): the summary body shared by device-token and
--   member access.
-- * public.nexo_business_member_summary(days): callable by signed-in users;
--   returns data only for businesses where auth.uid() is a member.

CREATE TABLE IF NOT EXISTS nexo_business.members (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  business_id TEXT NOT NULL CHECK (length(trim(business_id)) > 0),
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);
ALTER TABLE nexo_business.members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.members FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON nexo_business.members TO service_role;

CREATE OR REPLACE FUNCTION nexo_business.summary_for(p_business TEXT, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_since DATE;
  v_tz CONSTANT TEXT := 'America/Havana';
BEGIN
  v_since := (now() AT TIME ZONE v_tz)::date - (least(greatest(coalesce(p_days, 7), 1), 90) - 1);
  RETURN jsonb_build_object(
    'businessId', p_business,
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
          WHERE business_id = p_business AND (occurred_at AT TIME ZONE v_tz)::date >= v_since
          GROUP BY 1, 2
        ) s
        LEFT JOIN (
          SELECT (occurred_at AT TIME ZONE v_tz)::date AS day, currency, sum(refund_minor) AS refunds_minor
          FROM nexo_business.sale_returns
          WHERE business_id = p_business
          GROUP BY 1, 2
        ) r ON r.day = s.day AND r.currency = s.currency
      ) x
    ), '[]'::jsonb),
    'totals', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'salesCount', n, 'salesMinor', total) ORDER BY currency)
      FROM (SELECT currency, count(*) n, sum(total_minor) total FROM nexo_business.sales
            WHERE business_id = p_business GROUP BY currency) t
    ), '[]'::jsonb),
    'receivables', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'openCount', n, 'balanceMinor', bal) ORDER BY currency)
      FROM (SELECT currency, count(*) n, sum(balance_minor) bal FROM nexo_business.receivable_balances
            WHERE business_id = p_business AND balance_minor > 0 GROUP BY currency) t
    ), '[]'::jsonb),
    'messengerCash', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'outstandingMinor', o) ORDER BY currency)
      FROM (SELECT currency, sum(outstanding_minor) o FROM nexo_business.messenger_custody
            WHERE business_id = p_business GROUP BY currency HAVING sum(outstanding_minor) <> 0) t
    ), '[]'::jsonb),
    'devices', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'deviceId', d.device_id, 'label', d.label, 'lastSeenAt', d.last_seen_at,
        'events', (SELECT count(*) FROM nexo_business.sync_events e
                   WHERE e.business_id = d.business_id AND e.device_id = d.device_id)) ORDER BY d.device_id)
      FROM nexo_business.devices d WHERE d.business_id = p_business AND d.active
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.summary_for(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION nexo_business.summary_for(TEXT, INT) TO service_role;

-- Device-token access now reuses the shared body.
CREATE OR REPLACE FUNCTION nexo_business.business_summary(p_token TEXT, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_business TEXT;
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  SELECT business_id INTO v_business FROM nexo_business.devices
   WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF v_business IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  RETURN nexo_business.summary_for(v_business, p_days);
END;
$$;

-- Signed-in members: one summary per business they belong to.
CREATE OR REPLACE FUNCTION public.nexo_business_member_summary(p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  RETURN jsonb_build_object('businesses', coalesce((
    SELECT jsonb_agg(nexo_business.summary_for(m.business_id, p_days) || jsonb_build_object('role', m.role)
                     ORDER BY m.business_id)
    FROM nexo_business.members m WHERE m.user_id = v_user
  ), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_member_summary(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_member_summary(INT) TO authenticated;
