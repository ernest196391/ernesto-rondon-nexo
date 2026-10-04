-- The POS rates pull also brings the active gestoras and dependientas (ID,
-- kind, name) so the clerk can mark who brought the client and who served.
-- Only names leave the cloud: no phones or payout data.
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
  RETURN jsonb_build_object(
    'rates', nexo_business.current_rates(v_business),
    'people', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'name', full_name) ORDER BY full_name)
                          FROM nexo_business.people WHERE business_id = v_business AND status = 'active'), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_rates(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_rates(TEXT) TO service_role;
