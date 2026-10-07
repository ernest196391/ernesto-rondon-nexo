-- Digitaliza tus productos, bloque 1: recepción de un producto con fotos.
-- * product_intakes: una fila por recepción confirmada. Su id lo genera el
--   teléfono al abrir la recepción y es la clave de operación: repetir el
--   envío devuelve el mismo resultado y nunca crea otro producto ni suma
--   otra vez el stock.
-- * intake_commit(): en una sola transacción crea el producto (nuevo) o lo
--   vincula (reposición / corrección) y escribe el movimiento de inventario:
--     nuevo y reposición -> 'inventory.received' (suma, nunca reemplaza);
--     corrección         -> 'inventory.counted' (fija la cifra contada).
--   El stock sigue siendo el libro de eventos de Core (stock_movements).
-- * Productos con variantes: como en la importación, no hay fila padre; cada
--   variante es un producto con variant_of común y nombre "Producto — Variante".
-- * Las fotos originales van al bucket privado 'product-intake'
--   (<negocio>/<recepción>/<archivo>); la fila guarda sus rutas.
-- * Ojo: un producto que llega de BizneCubano (external_refs) se recuenta en
--   la importación horaria. La respuesta lo marca (stockAuthority) para que la
--   pantalla avise. Aditiva.

CREATE TABLE IF NOT EXISTS nexo_business.product_intakes (
  id UUID PRIMARY KEY,
  business_id TEXT NOT NULL CHECK (length(trim(business_id)) > 0),
  number BIGINT GENERATED ALWAYS AS IDENTITY,
  kind TEXT NOT NULL CHECK (kind IN ('new', 'restock', 'correction')),
  fingerprint TEXT NOT NULL,
  group_id TEXT NOT NULL,
  sheet JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(sheet) = 'object'),
  ai_suggestions JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(ai_suggestions) = 'object'),
  photos JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(photos) = 'array'),
  lines JSONB NOT NULL CHECK (jsonb_typeof(lines) = 'array' AND jsonb_array_length(lines) > 0),
  content_status TEXT NOT NULL DEFAULT 'sheet_confirmed'
    CHECK (content_status IN ('sheet_confirmed', 'content_in_production', 'review', 'ready')),
  event_id TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_intakes_business ON nexo_business.product_intakes (business_id, created_at DESC);
ALTER TABLE nexo_business.product_intakes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.product_intakes FROM PUBLIC, anon, authenticated;

-- Quién puede qué: recibir (reponer) = dueña, economista o dependienta activa;
-- crear productos y corregir existencias = dueña o economista.
CREATE OR REPLACE FUNCTION public.nexo_business_intake_access(p_business TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT jsonb_build_object('receive', nexo_business.can_receive(p_business),
                            'create', nexo_business.is_admin(p_business),
                            'correct', nexo_business.is_admin(p_business));
$$;
REVOKE ALL ON FUNCTION public.nexo_business_intake_access(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_intake_access(TEXT) TO authenticated;

-- Productos activos para vincular una reposición, con su stock y quién lo cuenta.
CREATE OR REPLACE FUNCTION public.nexo_business_intake_catalog(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object('access', public.nexo_business_intake_access(p_business), 'products', coalesce((
    SELECT jsonb_agg(jsonb_build_object('productId', p.product_id, 'name', p.name, 'sku', p.sku, 'category', p.category,
      'imageUrl', p.image_url, 'variantOf', p.variant_of, 'variantLabel', p.variant_label, 'prices', p.prices,
      'stock', coalesce(s.quantity, 0),
      'stockAuthority', CASE WHEN p.external_refs <> '{}'::jsonb THEN 'external' ELSE 'core' END) ORDER BY p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.stock_by_product s ON s.business_id = p.business_id AND s.product_id = p.product_id
     WHERE p.business_id = p_business AND p.active), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_intake_catalog(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_intake_catalog(TEXT) TO authenticated;

-- p_intake: {id (uuid), kind: new|restock|correction,
--   product (solo new): {name, sku?, category?, prices: {"USD": menor, "CUP": menor}},
--   lines: new        -> [{label|null, quantity, sku?}]  (label null = producto sin variantes)
--          restock    -> [{productId, quantity}]
--          correction -> [{productId, counted}],
--   sheet, aiSuggestions, photos: [{path, name, size, type}]}
CREATE OR REPLACE FUNCTION public.nexo_business_intake_commit(p_business TEXT, p_intake JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id UUID;
  v_kind TEXT := p_intake->>'kind';
  v_lines JSONB := coalesce(p_intake->'lines', '[]'::jsonb);
  v_fp TEXT;
  v_existing nexo_business.product_intakes%ROWTYPE;
  v_group TEXT;
  v_event TEXT;
  v_device TEXT := p_business || '-intake';
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_name TEXT;
  v_prices JSONB := '{}'::jsonb;
  v_key TEXT;
  v_val JSONB;
  v_out JSONB := '[]'::jsonb;
  v_moves JSONB := '[]'::jsonb;
  v_has_variants BOOLEAN;
  l JSONB;
  i INT := 0;
  v_pid TEXT;
  v_row nexo_business.catalog_products%ROWTYPE;
  v_qty BIGINT;
  v_current BIGINT;
  v_who TEXT;
  v_result JSONB;
  v_inserted INT;
  v_wrote BOOLEAN := FALSE;
BEGIN
  BEGIN
    v_id := (p_intake->>'id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN v_id := NULL;
  END;
  IF v_id IS NULL THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Falta el identificador de la recepción'); END IF;
  IF v_kind IS NULL OR v_kind NOT IN ('new', 'restock', 'correction') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Tipo de recepción desconocido');
  END IF;
  IF NOT nexo_business.can_receive(p_business)
     OR (v_kind IN ('new', 'correction') AND NOT nexo_business.is_admin(p_business)) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF jsonb_typeof(v_lines) <> 'array' OR jsonb_array_length(v_lines) = 0 OR jsonb_array_length(v_lines) > 50 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Añade entre 1 y 50 líneas');
  END IF;

  -- Huella de lo que se pide: el mismo id con otro contenido es un conflicto, no un reintento.
  v_fp := md5(v_kind || coalesce(p_intake->'product', 'null'::jsonb)::text || v_lines::text);
  v_group := 'nx-' || left(replace(v_id::text, '-', ''), 12);
  v_event := 'intake:' || v_id::text;

  -- Reservar la operación. Si otra llamada con el mismo id está en curso, espera a que termine.
  INSERT INTO nexo_business.product_intakes (id, business_id, kind, fingerprint, group_id, lines, event_id)
  VALUES (v_id, p_business, v_kind, v_fp, v_group, v_lines, v_event)
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    SELECT * INTO v_existing FROM nexo_business.product_intakes WHERE id = v_id;
    IF v_existing.business_id <> p_business OR v_existing.fingerprint <> v_fp THEN
      RETURN jsonb_build_object('error', 'conflict', 'message', 'Esta recepción ya se guardó con otros datos');
    END IF;
    RETURN v_existing.result || jsonb_build_object('replayed', true);
  END IF;

  IF v_kind = 'new' THEN
    v_name := trim(coalesce(p_intake->'product'->>'name', ''));
    IF length(v_name) < 2 OR length(v_name) > 120 THEN
      RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Escribe el nombre del producto (2 a 120 letras)';
    END IF;
    FOR v_key, v_val IN SELECT * FROM jsonb_each(coalesce(p_intake->'product'->'prices', '{}'::jsonb)) LOOP
      IF upper(v_key) !~ '^[A-Z]{3,4}$' OR jsonb_typeof(v_val) <> 'number' OR (v_val::text)::numeric <= 0
         OR (v_val::text)::numeric <> trunc((v_val::text)::numeric) THEN
        RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Precio inválido en ' || v_key;
      END IF;
      v_prices := v_prices || jsonb_build_object(upper(v_key), (v_val::text)::bigint);
    END LOOP;
    IF v_prices = '{}'::jsonb THEN
      RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Falta el precio de venta';
    END IF;
    v_has_variants := jsonb_array_length(v_lines) > 1 OR coalesce(trim(v_lines->0->>'label'), '') <> '';

    FOR l IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
      i := i + 1;
      v_qty := coalesce((l->>'quantity')::BIGINT, -1);
      IF v_qty < 0 OR v_qty > 100000 THEN
        RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Cantidad inválida en la línea ' || i;
      END IF;
      IF v_has_variants AND coalesce(trim(l->>'label'), '') = '' THEN
        RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Cada variante necesita un nombre (línea ' || i || ')';
      END IF;
      v_pid := CASE WHEN v_has_variants THEN v_group || '-' || i ELSE v_group END;
      INSERT INTO nexo_business.catalog_products (business_id, product_id, sku, name, active, prices, category, variant_of, variant_label, seq, updated_by)
      VALUES (p_business, v_pid, nullif(trim(coalesce(l->>'sku', CASE WHEN NOT v_has_variants THEN p_intake->'product'->>'sku' END, '')), ''),
              CASE WHEN v_has_variants THEN v_name || ' — ' || trim(l->>'label') ELSE v_name END, TRUE, v_prices,
              nullif(trim(coalesce(p_intake->'product'->>'category', '')), ''),
              CASE WHEN v_has_variants THEN v_group END, CASE WHEN v_has_variants THEN trim(l->>'label') END, 0, auth.uid())
      RETURNING * INTO v_row;
      v_out := v_out || jsonb_build_array(jsonb_build_object('productId', v_pid, 'name', v_row.name, 'variantLabel', v_row.variant_label,
        'added', v_qty, 'stockBefore', 0, 'stockAfter', v_qty, 'stockAuthority', 'core', 'created', true));
      IF v_qty > 0 THEN v_moves := v_moves || jsonb_build_array(jsonb_build_object('product_id', v_pid, 'quantity', v_qty)); END IF;
    END LOOP;

  ELSE
    FOR l IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
      i := i + 1;
      SELECT * INTO v_row FROM nexo_business.catalog_products
       WHERE business_id = p_business AND product_id = l->>'productId' AND active;
      IF v_row.product_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Producto no encontrado en Core (línea ' || i || ')';
      END IF;
      IF v_moves @> jsonb_build_array(jsonb_build_object('product_id', v_row.product_id)) THEN
        RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Producto repetido: ' || v_row.name;
      END IF;
      SELECT coalesce(sum(quantity_delta), 0) INTO v_current FROM nexo_business.stock_movements
       WHERE business_id = p_business AND product_id = v_row.product_id;
      IF v_kind = 'restock' THEN
        v_qty := coalesce((l->>'quantity')::BIGINT, 0);
        IF v_qty < 1 OR v_qty > 100000 THEN
          RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Cantidad recibida inválida para ' || v_row.name;
        END IF;
        v_moves := v_moves || jsonb_build_array(jsonb_build_object('product_id', v_row.product_id, 'quantity', v_qty));
        v_out := v_out || jsonb_build_array(jsonb_build_object('productId', v_row.product_id, 'name', v_row.name,
          'variantLabel', v_row.variant_label, 'added', v_qty, 'stockBefore', v_current, 'stockAfter', v_current + v_qty,
          'stockAuthority', CASE WHEN v_row.external_refs <> '{}'::jsonb THEN 'external' ELSE 'core' END, 'created', false));
      ELSE
        v_qty := coalesce((l->>'counted')::BIGINT, -1);
        IF v_qty < 0 OR v_qty > 100000 THEN
          RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'Cantidad contada inválida para ' || v_row.name;
        END IF;
        v_moves := v_moves || jsonb_build_array(jsonb_build_object('product_id', v_row.product_id, 'quantity', v_qty - v_current));
        v_out := v_out || jsonb_build_array(jsonb_build_object('productId', v_row.product_id, 'name', v_row.name,
          'variantLabel', v_row.variant_label, 'difference', v_qty - v_current, 'stockBefore', v_current, 'stockAfter', v_qty,
          'stockAuthority', CASE WHEN v_row.external_refs <> '{}'::jsonb THEN 'external' ELSE 'core' END, 'created', false));
        IF v_qty <> v_current THEN
          INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
          VALUES (p_business, v_device, 'Digitaliza tus productos', encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
          ON CONFLICT (business_id, device_id) DO NOTHING;
          INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
          VALUES (v_event || ':' || i, p_business, v_device, 'inventory.counted', 'inventory_count', v_row.product_id, v_now,
            jsonb_build_object('contract_version', 1, 'source_system', 'nexo-intake', 'payload', jsonb_build_object(
              'intake_id', v_id, 'product_id', v_row.product_id, 'location_id', NULL, 'expected_quantity', v_current,
              'counted_quantity', v_qty, 'difference_quantity', v_qty - v_current, 'reason', 'Corrección de existencias')));
          v_wrote := TRUE;
        END IF;
      END IF;
    END LOOP;
    SELECT coalesce(variant_of, product_id) INTO v_group FROM nexo_business.catalog_products
     WHERE business_id = p_business AND product_id = v_lines->0->>'productId';
  END IF;

  -- Entradas (nuevo y reposición): un solo evento que suma por línea.
  IF v_kind IN ('new', 'restock') AND jsonb_array_length(v_moves) > 0 THEN
    INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
    VALUES (p_business, v_device, 'Digitaliza tus productos', encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
    ON CONFLICT (business_id, device_id) DO NOTHING;
    INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
    VALUES (v_event, p_business, v_device, 'inventory.received', 'product_intake', v_id::text, v_now,
      jsonb_build_object('contract_version', 1, 'source_system', 'nexo-intake', 'payload', jsonb_build_object(
        'intake_id', v_id, 'kind', v_kind, 'location_id', NULL, 'lines', v_moves)));
    v_wrote := TRUE;
  END IF;

  v_who := coalesce((SELECT full_name FROM nexo_business.people WHERE business_id = p_business AND user_id = auth.uid() LIMIT 1),
                    (SELECT email FROM auth.users WHERE id = auth.uid()));
  v_result := jsonb_build_object('ok', true, 'id', v_id, 'kind', v_kind, 'groupId', v_group, 'lines', v_out,
                                 'eventId', CASE WHEN v_wrote THEN v_event END);
  UPDATE nexo_business.product_intakes SET
    group_id = v_group,
    sheet = CASE WHEN jsonb_typeof(p_intake->'sheet') = 'object' THEN p_intake->'sheet' ELSE '{}'::jsonb END,
    ai_suggestions = CASE WHEN jsonb_typeof(p_intake->'aiSuggestions') = 'object' THEN p_intake->'aiSuggestions' ELSE '{}'::jsonb END,
    photos = coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_intake->'photos') = 'array' THEN p_intake->'photos' ELSE '[]'::jsonb END) x
                        WHERE x->>'path' LIKE p_business || '/' || v_id::text || '/%'), '[]'::jsonb),
    result = v_result, created_by = auth.uid(), created_by_name = v_who
  WHERE id = v_id;
  RETURN v_result;
EXCEPTION
  WHEN check_violation OR invalid_text_representation OR numeric_value_out_of_range THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
  WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Ese SKU ya lo usa otro producto');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_intake_commit(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_intake_commit(TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_intakes(p_business TEXT, p_limit INT DEFAULT 30)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'number', number, 'kind', kind, 'groupId', group_id,
      'name', coalesce(sheet->'fields'->>'name', result->'lines'->0->>'name'), 'lines', result->'lines',
      'photos', jsonb_array_length(photos), 'contentStatus', content_status, 'by', created_by_name, 'at', created_at)
      ORDER BY created_at DESC)
    FROM (SELECT * FROM nexo_business.product_intakes WHERE business_id = p_business AND result <> '{}'::jsonb
           ORDER BY created_at DESC LIMIT least(greatest(coalesce(p_limit, 30), 1), 200)) r), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_intakes(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_intakes(TEXT, INT) TO authenticated;

-- Fotos originales: bucket privado; solo quien puede recibir en ese negocio
-- sube o ve archivos bajo <negocio>/. (Se salta donde no hay Storage, p. ej. pruebas locales.)
CREATE OR REPLACE FUNCTION public.nexo_business_can_receive(p_business TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT nexo_business.can_receive(p_business);
$$;
REVOKE ALL ON FUNCTION public.nexo_business_can_receive(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_can_receive(TEXT) TO authenticated;

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN RETURN; END IF;
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('product-intake', 'product-intake', FALSE, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
  ON CONFLICT (id) DO NOTHING;
  DROP POLICY IF EXISTS "product-intake read" ON storage.objects;
  DROP POLICY IF EXISTS "product-intake insert" ON storage.objects;
  DROP POLICY IF EXISTS "product-intake update" ON storage.objects;
  CREATE POLICY "product-intake read" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'product-intake' AND public.nexo_business_can_receive(split_part(name, '/', 1)));
  CREATE POLICY "product-intake insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-intake' AND public.nexo_business_can_receive(split_part(name, '/', 1)));
  CREATE POLICY "product-intake update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-intake' AND public.nexo_business_can_receive(split_part(name, '/', 1)));
END;
$$;
