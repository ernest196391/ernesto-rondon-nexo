-- 2026-10-16 (Lennys: carteles «En la web: N · no coincide»): un pedido web hecho ANTES de que el producto
-- estuviera en la caja se restaba DOS veces en la caja.
--   1. Pedido web #3842 (15-oct) de la almohada viscoelástica: la web baja 24→23. La caja aún no tiene el producto
--      → nexo_business_stock_from_web devolvía 'sin_producto' y NO apuntaba la clave.
--   2. Alta del producto en la caja con la cifra de la web (23, que ya descuenta el #3842).
--   3. El pedido cambia (p. ej. a «completado»), el puente lo vuelve a leer, ahora sí encuentra el producto y resta
--      otra vez → caja 22, web 23.
-- Arreglo: con 'sin_producto' se apunta la clave igual (product_id = 'woo:<id>'), así esa línea ya no se resta
-- después del alta. Una cancelación posterior (:back) sí se devuelve a la caja, igual que la web la devuelve.
-- Deshacer: volver a crear la función como en 20261011030000 (mismo cuerpo sin el INSERT de 'sin_producto').
CREATE OR REPLACE FUNCTION public.nexo_business_stock_from_web(p_business TEXT, p_key TEXT, p_woo_id BIGINT, p_delta BIGINT, p_order TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_product TEXT;
  v_device TEXT := p_business || '-web-bridge';
  v_current BIGINT;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  SELECT product_id INTO v_product FROM nexo_business.catalog_products
   WHERE business_id = p_business AND (external_refs->'casaviva.company'->>'wooId')::bigint = p_woo_id LIMIT 1;
  IF v_product IS NULL THEN
    -- 16-oct: se apunta para que no se reste cuando el producto se dé de alta con la cifra de la web.
    INSERT INTO nexo_business.web_stock_sync (business_id, stock_key, direction, product_id, delta)
    VALUES (p_business, p_key, 'from_web', 'woo:' || p_woo_id, p_delta) ON CONFLICT DO NOTHING;
    RETURN 'sin_producto';
  END IF;
  -- Una devolución (":back") solo si antes entró la salida (":out") de esa misma línea.
  IF p_key LIKE '%:back' AND NOT EXISTS (SELECT 1 FROM nexo_business.web_stock_sync
       WHERE business_id = p_business AND stock_key = left(p_key, length(p_key) - 5) || ':out') THEN
    RETURN 'sin_salida';
  END IF;
  INSERT INTO nexo_business.web_stock_sync (business_id, stock_key, direction, product_id, delta)
  VALUES (p_business, p_key, 'from_web', v_product, p_delta) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'ya'; END IF;
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Ventas de la web',
          encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  SELECT coalesce(sum(quantity_delta), 0) INTO v_current FROM nexo_business.stock_movements
   WHERE business_id = p_business AND product_id = v_product;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (gen_random_uuid()::text, p_business, v_device, 'inventory.counted', 'inventory_count', v_product, v_now,
    jsonb_build_object('contract_version', 1, 'source_system', 'casaviva.company', 'payload', jsonb_build_object(
      'product_id', v_product, 'location_id', NULL, 'expected_quantity', v_current, 'counted_quantity', v_current + p_delta,
      'difference_quantity', p_delta, 'reason', 'Pedido web #' || p_order)));
  RETURN 'ok';
END;
$$;
