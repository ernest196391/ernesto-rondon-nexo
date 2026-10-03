-- Device identity for POS provisioning: the device key tells the POS which
-- business and device it is. Read-only; only the key's hash is compared.
CREATE OR REPLACE FUNCTION public.nexo_business_device_identity(p_token TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT coalesce(
    (SELECT jsonb_build_object('businessId', business_id, 'deviceId', device_id, 'label', label)
       FROM nexo_business.devices
      WHERE coalesce(length(p_token), 0) >= 32
        AND token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
        AND active),
    jsonb_build_object('error', 'unauthorized'));
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_identity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_identity(TEXT) TO service_role;
