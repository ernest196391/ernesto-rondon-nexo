-- Zelle surcharge: owners set how many USD a customer sends by Zelle per USD
-- of price (e.g. 1.04). Stored as rate key ZELLE beside CUP/MLC/USDT.
ALTER TABLE nexo_business.exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_currency_check;
ALTER TABLE nexo_business.exchange_rates
  ADD CONSTRAINT exchange_rates_currency_check CHECK (currency IN ('CUP', 'MLC', 'USDT', 'ZELLE'));

CREATE OR REPLACE FUNCTION public.nexo_business_set_rate(p_business TEXT, p_currency TEXT, p_per_usd NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_currency TEXT := upper(trim(coalesce(p_currency, '')));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members
    WHERE user_id = auth.uid() AND business_id = p_business AND role = 'owner') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF v_currency NOT IN ('CUP', 'MLC', 'USDT', 'ZELLE') THEN
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

-- Owner request 2026-10-03: Casa Viva charges Zelle at 1.04.
INSERT INTO nexo_business.exchange_rates (business_id, currency, per_usd, set_by)
SELECT 'casa-viva', 'ZELLE', 1.04, NULL
WHERE NOT EXISTS (SELECT 1 FROM nexo_business.exchange_rates WHERE business_id = 'casa-viva' AND currency = 'ZELLE');
