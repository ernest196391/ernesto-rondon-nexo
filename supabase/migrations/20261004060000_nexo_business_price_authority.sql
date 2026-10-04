-- Price authority and the website bridge.
-- * catalog_sources.price_authority: 'source' (today: the hourly import copies
--   prices from BizneCubano) or 'nexo' (Casa Viva Core owns prices: the import
--   still brings new products, photos and stock but never overwrites a price).
--   The owner flips it in the dashboard; it starts as 'source'.
-- * web_sync_core(): what Core says per SKU (price, stock) for the bridge.
-- * web_sync_log: every publication to the website (who, when, what changed).
ALTER TABLE nexo_business.catalog_sources
  ADD COLUMN IF NOT EXISTS price_authority TEXT NOT NULL DEFAULT 'source' CHECK (price_authority IN ('source', 'nexo'));

CREATE TABLE IF NOT EXISTS nexo_business.web_sync_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'woocommerce',
  changes JSONB NOT NULL,
  result JSONB,
  run_by UUID,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE nexo_business.web_sync_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.web_sync_log FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON nexo_business.web_sync_log TO service_role;

CREATE OR REPLACE FUNCTION nexo_business.import_catalog(p_business text, p_source text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  v_keep_prices BOOLEAN := coalesce((SELECT price_authority = 'nexo' FROM nexo_business.catalog_sources WHERE business_id = p_business), FALSE);
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
      sku = EXCLUDED.sku, name = EXCLUDED.name, active = EXCLUDED.active,
      prices = CASE WHEN v_keep_prices AND c.prices <> '{}'::jsonb THEN c.prices ELSE EXCLUDED.prices END,
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
                            'stockCounts', v_stock_events, 'deactivated', v_deactivated,
                            'pricesKept', v_keep_prices);
END;
$function$;

CREATE OR REPLACE FUNCTION public.nexo_business_price_authority(p_business TEXT, p_value TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' AND (p_value IS NOT NULL OR NOT nexo_business.is_admin(p_business)) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF p_value IS NOT NULL THEN
    IF p_value NOT IN ('source', 'nexo') THEN RETURN jsonb_build_object('error', 'invalid'); END IF;
    UPDATE nexo_business.catalog_sources SET price_authority = p_value, updated_at = now() WHERE business_id = p_business;
    INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
    VALUES (p_business, 'price_authority', jsonb_build_object('price_authority', p_value), auth.uid());
  END IF;
  RETURN jsonb_build_object('priceAuthority', (SELECT price_authority FROM nexo_business.catalog_sources WHERE business_id = p_business),
    'lastPublish', (SELECT jsonb_build_object('at', run_at, 'result', result) FROM nexo_business.web_sync_log
                     WHERE business_id = p_business ORDER BY run_at DESC LIMIT 1));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_price_authority(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_price_authority(TEXT, TEXT) TO authenticated;

-- What Core says per product for the website bridge (service role only).
CREATE OR REPLACE FUNCTION public.nexo_business_web_sync_core(p_business TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('productId', p.product_id, 'sku', p.sku, 'name', p.name,
           'priceMinor', (p.prices->>'USD')::BIGINT, 'stock', st.quantity)), '[]'::jsonb)
    FROM nexo_business.catalog_products p
    LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
   WHERE p.business_id = p_business AND p.active AND p.sku IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_web_sync_core(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_web_sync_core(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.nexo_business_web_sync_record(p_business TEXT, p_changes JSONB, p_result JSONB, p_user UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO nexo_business.web_sync_log (business_id, changes, result, run_by) VALUES (p_business, p_changes, p_result, p_user);
$$;
REVOKE ALL ON FUNCTION public.nexo_business_web_sync_record(TEXT, JSONB, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_web_sync_record(TEXT, JSONB, JSONB, UUID) TO service_role;
