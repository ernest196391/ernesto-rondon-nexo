-- Exchange rates set by hand by the business owners (no elTOQUE API key):
-- units of a currency per 1 USD, e.g. CUP 490. Append-only: each change is a
-- new row, the latest per currency is in force, so past rates stay auditable.
-- Owners write from the dashboard; members read; devices pull with their key.
CREATE TABLE IF NOT EXISTS nexo_business.exchange_rates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id TEXT NOT NULL CHECK (length(trim(business_id)) > 0),
  currency TEXT NOT NULL CHECK (currency IN ('CUP', 'MLC', 'USDT')),
  per_usd NUMERIC(14, 4) NOT NULL CHECK (per_usd > 0),
  set_by UUID,
  set_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exchange_rates_latest ON nexo_business.exchange_rates (business_id, currency, set_at DESC);
ALTER TABLE nexo_business.exchange_rates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.exchange_rates FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON nexo_business.exchange_rates TO service_role;

CREATE OR REPLACE FUNCTION nexo_business.current_rates(p_business TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('currency', currency, 'perUsd', per_usd, 'setAt', set_at) ORDER BY currency), '[]'::jsonb)
  FROM (SELECT DISTINCT ON (currency) currency, per_usd, set_at
          FROM nexo_business.exchange_rates WHERE business_id = p_business
         ORDER BY currency, set_at DESC, id DESC) r;
$$;
REVOKE ALL ON FUNCTION nexo_business.current_rates(TEXT) FROM PUBLIC, anon, authenticated;

-- Owners set a rate.
CREATE OR REPLACE FUNCTION public.nexo_business_set_rate(p_business TEXT, p_currency TEXT, p_per_usd NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_currency TEXT := upper(trim(coalesce(p_currency, '')));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members
    WHERE user_id = auth.uid() AND business_id = p_business AND role = 'owner') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF v_currency NOT IN ('CUP', 'MLC', 'USDT') THEN
    RETURN jsonb_build_object('error', 'Moneda no admitida');
  END IF;
  IF p_per_usd IS NULL OR p_per_usd <= 0 OR p_per_usd > 1000000 THEN
    RETURN jsonb_build_object('error', 'La tasa debe ser mayor que cero');
  END IF;
  INSERT INTO nexo_business.exchange_rates (business_id, currency, per_usd, set_by)
  VALUES (p_business, v_currency, round(p_per_usd, 4), auth.uid());
  RETURN jsonb_build_object('rates', nexo_business.current_rates(p_business));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_rate(TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_rate(TEXT, TEXT, NUMERIC) TO authenticated;

-- Members read the rates in force.
CREATE OR REPLACE FUNCTION public.nexo_business_rates(p_business TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members WHERE user_id = auth.uid() AND business_id = p_business) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  RETURN jsonb_build_object('rates', nexo_business.current_rates(p_business));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_rates(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_rates(TEXT) TO authenticated;

-- Devices pull them with their key (Edge Function nexo-rates-pull).
CREATE OR REPLACE FUNCTION public.nexo_business_device_rates(p_token TEXT)
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
  RETURN jsonb_build_object('rates', nexo_business.current_rates(v_business));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_rates(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_rates(TEXT) TO service_role;

-- Payments of each synced sale (sales from before split payments: one cash
-- payment of the sale total).
CREATE OR REPLACE VIEW nexo_business.sale_payments AS
SELECT s.business_id, s.envelope->'payload'->>'sale_id' AS sale_id, s.occurred_at::timestamptz AS occurred_at,
       p->>'method' AS method, p->>'rail' AS rail, upper(p->>'currency') AS currency,
       (p->>'amount_minor')::BIGINT AS amount_minor, (p->>'usd_minor')::BIGINT AS usd_minor,
       p->>'provider' AS provider, p->>'external_ref' AS external_ref
FROM nexo_business.sync_events s
CROSS JOIN LATERAL jsonb_array_elements(coalesce(s.envelope->'payload'->'payments', jsonb_build_array(jsonb_build_object(
  'method', 'cash', 'rail', 'cash', 'currency', s.envelope->'payload'->>'currency',
  'amount_minor', s.envelope->'payload'->>'total_minor', 'usd_minor', s.envelope->'payload'->>'total_minor')))) p
WHERE s.operation_type = 'sale.completed';
REVOKE ALL ON nexo_business.sale_payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON nexo_business.sale_payments TO service_role;
