-- Stock for the POS: derived cloud stock per tracked product, so the POS
-- can show "Quedan N" and warn when a sale leaves 2 or fewer. Read-only;
-- device key auth like the catalog pull. Products without stock movements
-- (sold "sin control" on the website) are not listed.
CREATE OR REPLACE FUNCTION public.nexo_business_stock_pull(p_token TEXT)
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
  RETURN jsonb_build_object('generatedAt', now(), 'stock', coalesce((
    SELECT jsonb_agg(jsonb_build_object('productId', s.product_id, 'quantity', s.quantity, 'minStock', c.min_stock)
                     ORDER BY s.product_id)
    FROM nexo_business.stock_by_product s
    LEFT JOIN nexo_business.catalog_products c ON c.business_id = s.business_id AND c.product_id = s.product_id
    WHERE s.business_id = v_business
  ), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_stock_pull(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_stock_pull(TEXT) TO service_role;
