-- Panel de Lennys (2026-10-11): «Diseños y colores» y «Dejar de vender».
--
-- 1. Retirar un producto (o un diseño) = no se vende más en la caja ni en la web, pero NUNCA se borra:
--    retired_at / retired_by guardan cuándo y quién. Mientras retired_at tenga valor, el producto queda
--    inactivo aunque otra cosa (una importación, una sincronización) intente activarlo: solo
--    «Volver a vender» (retired_at = NULL) lo devuelve a la venta.
-- 2. Diseños de la web que la caja aún no tenía (variaciones creadas en la web): se enlazan con su
--    cantidad de la web como punto de partida, desde el dispositivo virtual «<negocio>-web», que el
--    puente de existencias no vuelve a mandar a la web (no se duplica nada).
-- 3. Cada cambio queda anotado en cost_audit (quién y cuándo), como los precios.

ALTER TABLE nexo_business.catalog_products
  ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retired_by UUID;

-- Corre antes que catalog_products_touch (orden alfabético): si está retirado, sigue inactivo.
CREATE OR REPLACE FUNCTION nexo_business.catalog_keep_retired() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.retired_at IS NOT NULL THEN NEW.active := FALSE; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS catalog_products_keep_retired ON nexo_business.catalog_products;
CREATE TRIGGER catalog_products_keep_retired BEFORE INSERT OR UPDATE ON nexo_business.catalog_products
  FOR EACH ROW EXECUTE FUNCTION nexo_business.catalog_keep_retired();

-- Lista de Productos: + variantOf (grupo de diseños), parentWooId y retired.
CREATE OR REPLACE FUNCTION public.nexo_business_inventory(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object('products', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'productId', p.product_id, 'name', p.name, 'variant', p.variant_label, 'variantOf', p.variant_of, 'category', p.category,
      'imageUrl', p.image_url,
      'priceUsd', round(coalesce(p.regular_minor, (p.prices->>'USD')::bigint)::numeric / 100, 2),
      'offerUsd', CASE WHEN p.regular_minor IS NOT NULL THEN round((p.prices->>'USD')::numeric / 100, 2) END,
      'stock', coalesce(st.quantity, 0), 'minStock', p.min_stock, 'active', p.active,
      'retired', p.retired_at IS NOT NULL, 'retiredAt', p.retired_at,
      'wooId', (p.external_refs->'casaviva.company'->>'wooId')::bigint,
      'parentWooId', (p.external_refs->'casaviva.company'->>'parentWooId')::bigint) ORDER BY p.active DESC, p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
     WHERE p.business_id = p_business), '[]'::jsonb));
END;
$$;

-- «Dejar de vender» (p_retire = true) o «Volver a vender» (false). Devuelve lo que hay que cambiar en la web.
CREATE OR REPLACE FUNCTION public.nexo_business_products_retire(p_business TEXT, p_products TEXT[], p_retire BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v nexo_business.catalog_products%ROWTYPE;
  v_out JSONB := '[]'::jsonb;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_retire IS NULL OR coalesce(cardinality(p_products), 0) = 0 THEN RETURN jsonb_build_object('error', 'Elige al menos un producto'); END IF;
  IF cardinality(p_products) > 500 THEN RETURN jsonb_build_object('error', 'Como máximo 500 productos a la vez'); END IF;
  FOR v IN SELECT * FROM nexo_business.catalog_products
            WHERE business_id = p_business AND product_id = ANY (p_products) ORDER BY product_id FOR UPDATE LOOP
    IF p_retire THEN
      UPDATE nexo_business.catalog_products
         SET retired_at = coalesce(retired_at, now()), retired_by = CASE WHEN retired_at IS NULL THEN auth.uid() ELSE retired_by END,
             active = FALSE, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    ELSE
      UPDATE nexo_business.catalog_products
         SET retired_at = NULL, retired_by = NULL, active = TRUE, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    END IF;
    INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
    VALUES (p_business, 'retire:' || v.product_id,
      jsonb_build_object('active', v.active, 'retiredAt', v.retired_at),
      jsonb_build_object('active', NOT p_retire, 'retired', p_retire), auth.uid());
    v_out := v_out || jsonb_build_array(jsonb_build_object('productId', v.product_id,
      'wooId', (v.external_refs->'casaviva.company'->>'wooId')::bigint,
      'parentWooId', (v.external_refs->'casaviva.company'->>'parentWooId')::bigint));
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'items', v_out);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_products_retire(TEXT, TEXT[], BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_products_retire(TEXT, TEXT[], BOOLEAN) TO authenticated;

-- Enlaza con la caja diseños de la web (variaciones). Solo la llama nexo-panel-web (que ya comprobó
-- que quien pide es dueña). p_items: [{wooId, parentWooId, label, parentName, price, sku, imageUrl,
-- category, webStock (número o null), seen: ["web:<pedido>:<línea>:out", …]}].
-- `seen`: líneas de pedidos web que la cantidad de la web ya descontó; se marcan como aplicadas para que
-- el puente no las reste otra vez en la caja.
CREATE OR REPLACE FUNCTION public.nexo_business_variant_link(p_business TEXT, p_user UUID, p_group TEXT, p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  i JSONB; k TEXT;
  v_id TEXT; v_sku TEXT; v_woo BIGINT; v_stock BIGINT; v_existing TEXT;
  v_device TEXT := p_business || '-web';
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_out JSONB := '[]'::jsonb;
BEGIN
  IF nullif(trim(coalesce(p_group, '')), '') IS NULL THEN RETURN jsonb_build_object('error', 'Falta el grupo'); END IF;
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Importación de catálogo',
          encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;

  FOR i IN SELECT * FROM jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) LOOP
    v_woo := (i->>'wooId')::bigint;
    IF v_woo IS NULL OR v_woo <= 0 OR nullif(trim(coalesce(i->>'label', '')), '') IS NULL OR coalesce((i->>'price')::numeric, 0) <= 0 THEN CONTINUE; END IF;
    SELECT product_id INTO v_existing FROM nexo_business.catalog_products
     WHERE business_id = p_business AND (external_refs->'casaviva.company'->>'wooId')::bigint = v_woo LIMIT 1;
    IF v_existing IS NOT NULL THEN
      v_out := v_out || jsonb_build_array(jsonb_build_object('wooId', v_woo, 'productId', v_existing, 'created', false));
      CONTINUE;
    END IF;
    v_id := 'cv-' || v_woo;
    IF EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = v_id) THEN
      v_id := gen_random_uuid()::text;
    END IF;
    v_sku := nullif(trim(coalesce(i->>'sku', '')), '');
    IF v_sku IS NULL OR EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND sku = v_sku) THEN
      SELECT 'nx-' || (coalesce(max(substring(sku FROM '^nx-(\d+)$')::int), 0) + 1)
        INTO v_sku FROM nexo_business.catalog_products WHERE business_id = p_business;
    END IF;
    INSERT INTO nexo_business.catalog_products
      (business_id, product_id, sku, name, active, barcodes, prices, category, image_url, variant_of, variant_label, external_refs, seq, updated_by)
    VALUES (p_business, v_id, v_sku,
      trim(coalesce(nullif(i->>'parentName', ''), 'Producto')) || ' — ' || trim(i->>'label'), TRUE, '{}',
      jsonb_build_object('USD', round((i->>'price')::numeric * 100)::bigint),
      nullif(trim(coalesce(i->>'category', '')), ''), nullif(i->>'imageUrl', ''), p_group, trim(i->>'label'),
      jsonb_build_object('casaviva.company', jsonb_strip_nulls(jsonb_build_object('wooId', v_woo, 'parentWooId', (i->>'parentWooId')::bigint))),
      0, p_user);

    -- Cantidad de partida = la de la web (no se manda de vuelta a la web: dispositivo «-web»).
    v_stock := CASE WHEN jsonb_typeof(i->'webStock') = 'number' THEN greatest((i->>'webStock')::bigint, 0) END;
    IF coalesce(v_stock, 0) > 0 THEN
      INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
      VALUES (gen_random_uuid()::text, p_business, v_device, 'inventory.counted', 'inventory_count', v_id, v_now,
        jsonb_build_object('contract_version', 1, 'source_system', 'casaviva.company', 'payload', jsonb_build_object(
          'product_id', v_id, 'location_id', NULL, 'expected_quantity', 0, 'counted_quantity', v_stock,
          'difference_quantity', v_stock, 'reason', 'Diseño de la web enlazado con la caja')));
    END IF;
    FOR k IN SELECT jsonb_array_elements_text(coalesce(i->'seen', '[]'::jsonb)) LOOP
      IF k ~ '^web:\d+:\d+:(out|back)$' THEN
        INSERT INTO nexo_business.web_stock_sync (business_id, stock_key, direction, product_id, delta)
        VALUES (p_business, k, 'from_web', v_id, 0) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
    INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
    VALUES (p_business, 'variant:' || v_id, NULL,
      jsonb_build_object('wooId', v_woo, 'group', p_group, 'label', i->>'label', 'webStock', v_stock), p_user);
    v_out := v_out || jsonb_build_array(jsonb_build_object('wooId', v_woo, 'productId', v_id, 'created', true));
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'items', v_out);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Ese diseño ya estaba enlazado; vuelve a abrir el producto');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_variant_link(TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_variant_link(TEXT, UUID, TEXT, JSONB) TO service_role;

-- Conteos desde el panel: además del motivo, quién lo cambió (misma firma que antes).
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
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  VALUES (p_business, 'stock:' || p_product, jsonb_build_object('quantity', v_current),
    jsonb_build_object('quantity', p_quantity, 'reason', coalesce(nullif(p_reason, ''), 'Conteo desde el panel')), auth.uid());
  RETURN jsonb_build_object('ok', true, 'from', v_current, 'to', p_quantity);
END;
$$;
