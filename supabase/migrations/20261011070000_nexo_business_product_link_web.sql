-- D39: un producto creado en el panel se crea también en la web. Core devuelve su wooId y
-- el panel lo enlaza aquí; desde ese momento el puente de existencias lleva su stock a la web.
CREATE OR REPLACE FUNCTION public.nexo_business_product_link_web(p_business TEXT, p_product TEXT, p_woo_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_current BIGINT;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_woo_id IS NULL OR p_woo_id <= 0 THEN RETURN jsonb_build_object('error', 'invalid'); END IF;
  SELECT (external_refs->'casaviva.company'->>'wooId')::bigint INTO v_current
    FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_current IS NOT NULL AND v_current <> p_woo_id THEN RETURN jsonb_build_object('error', 'Ya está enlazado con otro producto de la web'); END IF;
  IF EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id <> p_product
               AND (external_refs->'casaviva.company'->>'wooId')::bigint = p_woo_id) THEN
    RETURN jsonb_build_object('error', 'Ese producto de la web ya está enlazado con otro');
  END IF;
  UPDATE nexo_business.catalog_products
     SET external_refs = coalesce(external_refs, '{}'::jsonb) || jsonb_build_object('casaviva.company', jsonb_build_object('wooId', p_woo_id))
   WHERE business_id = p_business AND product_id = p_product;
  RETURN jsonb_build_object('ok', true, 'wooId', p_woo_id);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_product_link_web(TEXT, TEXT, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_product_link_web(TEXT, TEXT, BIGINT) TO authenticated;
