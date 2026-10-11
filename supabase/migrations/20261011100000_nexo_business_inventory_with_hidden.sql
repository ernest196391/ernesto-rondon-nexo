-- Panel: una sola pantalla de Productos. La lista incluye los ocultos (active=false) para el filtro "Ocultos".
CREATE OR REPLACE FUNCTION public.nexo_business_inventory(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object('products', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'productId', p.product_id, 'name', p.name, 'variant', p.variant_label, 'category', p.category,
      'imageUrl', p.image_url, 'priceUsd', round((p.prices->>'USD')::numeric / 100, 2),
      'stock', coalesce(st.quantity, 0), 'minStock', p.min_stock, 'active', p.active,
      'wooId', (p.external_refs->'casaviva.company'->>'wooId')::bigint) ORDER BY p.active DESC, p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
     WHERE p.business_id = p_business), '[]'::jsonb));
END;
$$;
