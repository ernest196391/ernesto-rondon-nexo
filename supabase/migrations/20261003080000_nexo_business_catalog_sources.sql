-- Configurable catalog source per business, so a business can follow its
-- marketplace today and its own website later without duplicating products
-- (items are matched by SKU across sources).
--
-- kinds:
-- * 'biznecubano': BizneCubano decides what is sold, price and stock (public
--   snapshot published by the Casa-Viva repo); the website supplies variants
--   and WooCommerce IDs.
-- * 'woocommerce': the business website (public Store API) is the whole truth.

CREATE TABLE IF NOT EXISTS nexo_business.catalog_sources (
  business_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('biznecubano', 'woocommerce')),
  website_url TEXT NOT NULL CHECK (website_url ~ '^https://'),
  snapshot_url TEXT CHECK (snapshot_url IS NULL OR snapshot_url ~ '^https://'),
  auto_import BOOLEAN NOT NULL DEFAULT TRUE,
  last_import_at TIMESTAMPTZ,
  last_import_result JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (kind <> 'biznecubano' OR snapshot_url IS NOT NULL)
);
ALTER TABLE nexo_business.catalog_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.catalog_sources FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON nexo_business.catalog_sources TO service_role;

INSERT INTO nexo_business.catalog_sources (business_id, kind, website_url, snapshot_url)
VALUES ('casa-viva', 'biznecubano', 'https://casavivadecuba.com',
        'https://raw.githubusercontent.com/ernest196391/Casa-Viva/evidence/catalog-snapshot/biznecubano.json')
ON CONFLICT (business_id) DO NOTHING;

-- Edge Function helpers (service role only).
CREATE OR REPLACE FUNCTION public.nexo_business_catalog_source(p_business TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT to_jsonb(s) FROM nexo_business.catalog_sources s WHERE s.business_id = p_business;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_catalog_source(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_catalog_source(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.nexo_business_record_import(p_business TEXT, p_result JSONB)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE nexo_business.catalog_sources
     SET last_import_at = now(), last_import_result = p_result
   WHERE business_id = p_business;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_record_import(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_record_import(TEXT, JSONB) TO service_role;

-- Owner reads and switches the source from the dashboard.
CREATE OR REPLACE FUNCTION public.nexo_business_get_catalog_source(p_business TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM nexo_business.members WHERE user_id = auth.uid() AND business_id = p_business)
    THEN (SELECT jsonb_build_object('kind', kind, 'websiteUrl', website_url, 'autoImport', auto_import,
                                    'lastImportAt', last_import_at, 'lastImportResult', last_import_result)
          FROM nexo_business.catalog_sources WHERE business_id = p_business)
    ELSE jsonb_build_object('error', 'forbidden') END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_get_catalog_source(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_get_catalog_source(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_set_catalog_source(p_business TEXT, p_kind TEXT, p_auto_import BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members
    WHERE user_id = auth.uid() AND business_id = p_business AND role = 'owner') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF p_kind NOT IN ('biznecubano', 'woocommerce') THEN
    RETURN jsonb_build_object('error', 'Fuente desconocida');
  END IF;
  UPDATE nexo_business.catalog_sources
     SET kind = p_kind, auto_import = coalesce(p_auto_import, auto_import), updated_at = now()
   WHERE business_id = p_business;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Este negocio no tiene fuente de catálogo configurada');
  END IF;
  RETURN jsonb_build_object('kind', p_kind);
EXCEPTION WHEN check_violation THEN
  RETURN jsonb_build_object('error', 'Falta la instantánea de BizneCubano para este negocio');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_catalog_source(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_catalog_source(TEXT, TEXT, BOOLEAN) TO authenticated;

-- Deactivation in import_catalog now covers every item that came from any
-- known source (not just the one named in this run), so switching sources
-- retires what the new source no longer lists.
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

  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Importación de catálogo',
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
            'difference_quantity', v_target - v_current, 'reason', 'Existencias de ' || p_source)));
        v_stock_events := v_stock_events + 1;
      END IF;
    END IF;
  END LOOP;

  UPDATE nexo_business.catalog_products
     SET active = FALSE
   WHERE business_id = p_business AND active
     AND (external_refs <> '{}'::jsonb OR product_id IN ('casa-viva-demo-001', 'nexo-demo-002'))
     AND NOT (product_id = ANY (v_ids));
  GET DIAGNOSTICS v_deactivated = ROW_COUNT;

  SELECT count(*) INTO v_changed FROM nexo_business.catalog_products
   WHERE business_id = p_business AND seq > v_before;

  RETURN jsonb_build_object('items', v_upserted, 'catalogChanges', v_changed,
                            'stockCounts', v_stock_events, 'deactivated', v_deactivated);
END;
$$;
