-- Service-role read of a business's imported catalog, so the catalog import
-- can keep following BizneCubano while the website is unreachable (the
-- website normally supplies variants and IDs; NEXO's own copy stands in).
CREATE OR REPLACE FUNCTION public.nexo_business_catalog_items(p_business TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'productId', product_id, 'sku', sku, 'name', name, 'category', category, 'imageUrl', image_url,
    'variantOf', variant_of, 'variantLabel', variant_label, 'prices', prices, 'externalRefs', external_refs)
    ORDER BY product_id), '[]'::jsonb)
  FROM nexo_business.catalog_products
  WHERE business_id = p_business AND external_refs <> '{}'::jsonb;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_catalog_items(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_catalog_items(TEXT) TO service_role;
