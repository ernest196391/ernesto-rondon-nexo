-- Precio de oferta y cambios de precio en masa desde el panel.
-- prices.USD es lo que cobra la caja. Si hay oferta, regular_minor guarda el precio normal (el de antes).
ALTER TABLE nexo_business.catalog_products ADD COLUMN IF NOT EXISTS regular_minor BIGINT;

-- items: [{productId, price?: USD normal, offer?: USD oferta, clearOffer?: bool}]
-- Devuelve lo que hay que copiar a la web: [{productId, wooId, regular, sale}] (sale = null sin oferta).
CREATE OR REPLACE FUNCTION public.nexo_business_bulk_prices(p_business TEXT, p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  i JSONB; v nexo_business.catalog_products%ROWTYPE; v_reg BIGINT; v_new_reg BIGINT; v_offer BIGINT;
  v_out JSONB := '[]'::jsonb; v_errors JSONB := '[]'::jsonb;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  FOR i IN SELECT * FROM jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) LOOP
    SELECT * INTO v FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = i->>'productId' FOR UPDATE;
    IF NOT FOUND THEN v_errors := v_errors || jsonb_build_array(i->>'productId'); CONTINUE; END IF;
    v_reg := coalesce(v.regular_minor, (v.prices->>'USD')::bigint);
    v_new_reg := CASE WHEN (i->>'price')::numeric > 0 THEN round((i->>'price')::numeric * 100)::bigint ELSE v_reg END;
    v_offer := CASE WHEN (i->>'offer')::numeric > 0 THEN round((i->>'offer')::numeric * 100)::bigint END;
    IF v_new_reg IS NULL OR v_new_reg <= 0 OR (v_offer IS NOT NULL AND v_offer >= v_new_reg) THEN
      v_errors := v_errors || jsonb_build_array(v.name); CONTINUE;
    END IF;
    IF coalesce((i->>'clearOffer')::boolean, false) THEN
      UPDATE nexo_business.catalog_products SET prices = coalesce(prices, '{}'::jsonb) || jsonb_build_object('USD', v_new_reg), regular_minor = NULL, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    ELSIF v_offer IS NOT NULL THEN
      UPDATE nexo_business.catalog_products SET prices = coalesce(prices, '{}'::jsonb) || jsonb_build_object('USD', v_offer), regular_minor = v_new_reg, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    ELSIF v.regular_minor IS NOT NULL THEN
      -- Hay oferta: cambia solo el precio normal (la oferta sigue).
      IF (v.prices->>'USD')::bigint >= v_new_reg THEN v_errors := v_errors || jsonb_build_array(v.name); CONTINUE; END IF;
      UPDATE nexo_business.catalog_products SET regular_minor = v_new_reg, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    ELSE
      UPDATE nexo_business.catalog_products SET prices = coalesce(prices, '{}'::jsonb) || jsonb_build_object('USD', v_new_reg), updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    END IF;
    SELECT * INTO v FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = v.product_id;
    INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
    VALUES (p_business, 'price:' || v.product_id, jsonb_build_object('USD', v_reg), jsonb_build_object('USD', (v.prices->>'USD')::bigint, 'regular', v.regular_minor), auth.uid());
    v_out := v_out || jsonb_build_array(jsonb_build_object('productId', v.product_id,
      'wooId', (v.external_refs->'casaviva.company'->>'wooId')::bigint,
      'regular', round(coalesce(v.regular_minor, (v.prices->>'USD')::bigint)::numeric / 100, 2),
      'sale', CASE WHEN v.regular_minor IS NOT NULL THEN round((v.prices->>'USD')::numeric / 100, 2) END));
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'items', v_out, 'skipped', v_errors);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_bulk_prices(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_bulk_prices(TEXT, JSONB) TO authenticated;

-- Lista de Productos: precio normal y oferta por separado.
CREATE OR REPLACE FUNCTION public.nexo_business_inventory(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object('products', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'productId', p.product_id, 'name', p.name, 'variant', p.variant_label, 'category', p.category,
      'imageUrl', p.image_url,
      'priceUsd', round(coalesce(p.regular_minor, (p.prices->>'USD')::bigint)::numeric / 100, 2),
      'offerUsd', CASE WHEN p.regular_minor IS NOT NULL THEN round((p.prices->>'USD')::numeric / 100, 2) END,
      'stock', coalesce(st.quantity, 0), 'minStock', p.min_stock, 'active', p.active,
      'wooId', (p.external_refs->'casaviva.company'->>'wooId')::bigint) ORDER BY p.active DESC, p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
     WHERE p.business_id = p_business), '[]'::jsonb));
END;
$$;
