-- La dueña crea desde el panel el código de 6 letras para dar de alta una caja (48 h, un solo uso).
CREATE OR REPLACE FUNCTION public.nexo_business_owner_enrollment(p_business TEXT, p_label TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN public.nexo_business_create_enrollment(p_business, p_label, 'panel');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_owner_enrollment(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_owner_enrollment(TEXT, TEXT) TO authenticated;
