-- Import the real Casa Viva catalog from its website (WooCommerce Store API,
-- public and read-only; the site mirrors BizneCubano, the approved catalog
-- source). Bridge 1 of docs/NEXO_BUSINESS_INTEGRATION.md in the Casa-Viva repo:
-- NEXO reads, never writes to WooCommerce.
--
-- * catalog_products gains category, image, variant info and external refs.
-- * import_catalog(): upserts products/variants, deactivates products that are
--   no longer published, and records stock as `inventory.counted` events from
--   the virtual device `<business>-web` when the website quantity differs from
--   NEXO's derived stock. Repeating an import with the same data changes
--   nothing (no new seq, no new events).

ALTER TABLE nexo_business.catalog_products
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS variant_of TEXT,
  ADD COLUMN IF NOT EXISTS variant_label TEXT,
  ADD COLUMN IF NOT EXISTS external_refs JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Rows only take a new seq when something devices care about changes.
CREATE OR REPLACE FUNCTION nexo_business.catalog_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.sku IS NOT DISTINCT FROM OLD.sku AND NEW.name IS NOT DISTINCT FROM OLD.name
     AND NEW.active IS NOT DISTINCT FROM OLD.active AND NEW.barcodes IS NOT DISTINCT FROM OLD.barcodes
     AND NEW.prices IS NOT DISTINCT FROM OLD.prices AND NEW.min_stock IS NOT DISTINCT FROM OLD.min_stock
     AND NEW.category IS NOT DISTINCT FROM OLD.category AND NEW.image_url IS NOT DISTINCT FROM OLD.image_url
     AND NEW.variant_of IS NOT DISTINCT FROM OLD.variant_of AND NEW.variant_label IS NOT DISTINCT FROM OLD.variant_label
     AND NEW.external_refs IS NOT DISTINCT FROM OLD.external_refs THEN
    NEW.seq := OLD.seq;
    NEW.updated_at := OLD.updated_at;
    RETURN NEW;
  END IF;
  NEW.seq := nextval('nexo_business.catalog_seq');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- p_items: [{productId, sku, name, category, imageUrl, variantOf, variantLabel,
--            prices: {"USD": minor}, active, stockQuantity (null = not tracked),
--            externalRefs: {...}}]
CREATE OR REPLACE FUNCTION nexo_business.import_catalog(p_business TEXT, p_source TEXT, p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_device TEXT := p_business || '-web';
  v_item JSONB;
  v_before BIGINT;
  v_upserted INT := 0;
  v_changed INT := 0;
  v_stock_events INT := 0;
  v_deactivated INT := 0;
  v_current BIGINT;
  v_target BIGINT;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_ids TEXT[] := '{}';
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('error', 'empty import');
  END IF;

  -- Virtual device that owns imported stock counts (cannot sync: no usable token).
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Importación web (' || p_source || ')',
          encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;

  SELECT coalesce(max(seq), 0) INTO v_before FROM nexo_business.catalog_products WHERE business_id = p_business;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_ids := v_ids || (v_item->>'productId');
    INSERT INTO nexo_business.catalog_products AS c
      (business_id, product_id, sku, name, active, barcodes, prices, category, image_url,
       variant_of, variant_label, external_refs, seq)
    VALUES
      (p_business, v_item->>'productId', nullif(v_item->>'sku', ''), v_item->>'name',
       coalesce((v_item->>'active')::boolean, TRUE), '{}', coalesce(v_item->'prices', '{}'::jsonb),
       v_item->>'category', v_item->>'imageUrl', v_item->>'variantOf', v_item->>'variantLabel',
       coalesce(v_item->'externalRefs', '{}'::jsonb), 0)
    ON CONFLICT (business_id, product_id) DO UPDATE SET
      sku = EXCLUDED.sku, name = EXCLUDED.name, active = EXCLUDED.active, prices = EXCLUDED.prices,
      category = EXCLUDED.category, image_url = EXCLUDED.image_url, variant_of = EXCLUDED.variant_of,
      variant_label = EXCLUDED.variant_label, external_refs = EXCLUDED.external_refs;
    v_upserted := v_upserted + 1;

    -- Stock: record a count only when the website quantity differs.
    IF v_item->'stockQuantity' IS NOT NULL AND jsonb_typeof(v_item->'stockQuantity') = 'number' THEN
      v_target := (v_item->>'stockQuantity')::BIGINT;
      SELECT coalesce(sum(quantity_delta), 0) INTO v_current FROM nexo_business.stock_movements
       WHERE business_id = p_business AND product_id = v_item->>'productId';
      IF v_target <> v_current THEN
        INSERT INTO nexo_business.sync_events
          (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
        VALUES (
          gen_random_uuid()::text, p_business, v_device, 'inventory.counted', 'inventory_count',
          v_item->>'productId', v_now,
          jsonb_build_object('contract_version', 1, 'source_system', p_source, 'payload', jsonb_build_object(
            'product_id', v_item->>'productId', 'location_id', NULL,
            'expected_quantity', v_current, 'counted_quantity', v_target,
            'difference_quantity', v_target - v_current, 'reason', 'Existencias de la web (' || p_source || ')')));
        v_stock_events := v_stock_events + 1;
      END IF;
    END IF;
  END LOOP;

  -- Products from this source that the website no longer publishes stop selling.
  UPDATE nexo_business.catalog_products
     SET active = FALSE
   WHERE business_id = p_business AND active
     AND (external_refs ? p_source OR product_id IN ('casa-viva-demo-001', 'nexo-demo-002'))
     AND NOT (product_id = ANY (v_ids));
  GET DIAGNOSTICS v_deactivated = ROW_COUNT;

  SELECT count(*) INTO v_changed FROM nexo_business.catalog_products
   WHERE business_id = p_business AND seq > v_before;

  RETURN jsonb_build_object('items', v_upserted, 'catalogChanges', v_changed,
                            'stockCounts', v_stock_events, 'deactivated', v_deactivated);
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.import_catalog(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION nexo_business.import_catalog(TEXT, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.nexo_business_import_catalog(p_business TEXT, p_source TEXT, p_items JSONB)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT nexo_business.import_catalog(p_business, p_source, p_items);
$$;
REVOKE ALL ON FUNCTION public.nexo_business_import_catalog(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_import_catalog(TEXT, TEXT, JSONB) TO service_role;

-- The device pull also carries the new descriptive fields (POS ignores unknown ones).
CREATE OR REPLACE FUNCTION nexo_business.catalog_pull(p_token TEXT, p_after BIGINT, p_limit INT DEFAULT 200)
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
  RETURN jsonb_build_object('changes', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'seq', c.seq, 'productId', c.product_id, 'sku', c.sku, 'name', c.name, 'active', c.active,
      'barcodes', to_jsonb(c.barcodes), 'prices', c.prices, 'updatedAt', c.updated_at,
      'category', c.category, 'imageUrl', c.image_url, 'variantOf', c.variant_of,
      'variantLabel', c.variant_label) ORDER BY c.seq)
    FROM (SELECT * FROM nexo_business.catalog_products
          WHERE business_id = v_business AND seq > coalesce(p_after, 0)
          ORDER BY seq LIMIT least(greatest(coalesce(p_limit, 200), 1), 500)) c
  ), '[]'::jsonb));
END;
$$;
