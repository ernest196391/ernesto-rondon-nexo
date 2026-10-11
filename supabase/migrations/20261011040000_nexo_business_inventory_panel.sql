-- Panel: inventario y precios en una sola tabla (D37 fase 2). Solo dueñas.
-- Precio: se guarda en la nube y el panel lo copia a la web. Cantidad: entra como conteo
-- (movimiento) y el puente de existencias (nexo-stock-bridge) la lleva a la web.

CREATE OR REPLACE FUNCTION public.nexo_business_inventory(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object('products', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'productId', p.product_id, 'name', p.name, 'variant', p.variant_label, 'category', p.category,
      'imageUrl', p.image_url, 'priceUsd', round((p.prices->>'USD')::numeric / 100, 2),
      'stock', coalesce(st.quantity, 0), 'minStock', p.min_stock,
      'wooId', (p.external_refs->'casaviva.company'->>'wooId')::bigint) ORDER BY p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
     WHERE p.business_id = p_business AND p.active), '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_set_price(p_business TEXT, p_product TEXT, p_usd NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_before JSONB; v_woo BIGINT;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_usd IS NULL OR p_usd <= 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'El precio debe ser mayor que 0'); END IF;
  SELECT prices, (external_refs->'casaviva.company'->>'wooId')::bigint INTO v_before, v_woo
    FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  UPDATE nexo_business.catalog_products
     SET prices = coalesce(prices, '{}'::jsonb) || jsonb_build_object('USD', round(p_usd * 100)::bigint)
   WHERE business_id = p_business AND product_id = p_product;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  VALUES (p_business, 'price:' || p_product, v_before, jsonb_build_object('USD', round(p_usd * 100)::bigint), auth.uid());
  RETURN jsonb_build_object('ok', true, 'wooId', v_woo);
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_set_stock(p_business TEXT, p_product TEXT, p_quantity BIGINT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_device TEXT := p_business || '-panel';
  v_current BIGINT;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_quantity IS NULL OR p_quantity < 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'La cantidad no puede ser negativa'); END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  SELECT coalesce(sum(quantity_delta), 0) INTO v_current FROM nexo_business.stock_movements
   WHERE business_id = p_business AND product_id = p_product;
  IF v_current = p_quantity THEN RETURN jsonb_build_object('ok', true, 'unchanged', true); END IF;
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Panel de la dueña',
          encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (gen_random_uuid()::text, p_business, v_device, 'inventory.counted', 'inventory_count', p_product, v_now,
    jsonb_build_object('contract_version', 1, 'source_system', 'panel', 'payload', jsonb_build_object(
      'product_id', p_product, 'location_id', NULL, 'expected_quantity', v_current, 'counted_quantity', p_quantity,
      'difference_quantity', p_quantity - v_current, 'reason', coalesce(nullif(p_reason, ''), 'Conteo desde el panel'))));
  RETURN jsonb_build_object('ok', true, 'from', v_current, 'to', p_quantity);
END;
$$;

REVOKE ALL ON FUNCTION public.nexo_business_inventory(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.nexo_business_set_price(TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.nexo_business_set_stock(TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_inventory(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_price(TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_stock(TEXT, TEXT, BIGINT, TEXT) TO authenticated;
