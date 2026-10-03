-- Cloud stock, low-stock alerts and owner-managed devices.
--
-- * stock_movements: every stock change carried by synced events (sales,
--   returns, physical counts, transfers, consignment settlements). Stock is
--   derived, never stored. Counts set the baseline: a product with no count
--   only shows the net of its sales and returns.
-- * catalog_products.min_stock: owner threshold; the summary flags products at
--   or below it.
-- * Owners create devices from the dashboard (the token is shown once and only
--   its SHA-256 hash is stored) and can deactivate them.

CREATE OR REPLACE VIEW nexo_business.stock_movements AS
-- Sales with line arrays (current POS).
SELECT e.business_id, l->>'product_id' AS product_id, NULL::text AS location_id,
       -(l->>'quantity')::BIGINT AS quantity_delta, 'sale' AS reason, e.occurred_at::timestamptz AS occurred_at, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'sale.completed' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array'
UNION ALL
-- Early single-product sales.
SELECT e.business_id, e.envelope->'payload'->>'product_id', NULL,
       -(e.envelope->'payload'->>'quantity')::BIGINT, 'sale', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e
WHERE e.operation_type = 'sale.completed' AND e.envelope->'payload'->'lines' IS NULL
  AND e.envelope->'payload'->>'product_id' IS NOT NULL
UNION ALL
SELECT e.business_id, l->>'product_id', NULL,
       (l->>'quantity')::BIGINT, 'return', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'sale.returned' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array'
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', e.envelope->'payload'->>'location_id',
       (e.envelope->'payload'->>'difference_quantity')::BIGINT, 'count', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e
WHERE e.operation_type = 'inventory.counted' AND (e.envelope->'payload'->>'difference_quantity')::BIGINT <> 0
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', e.envelope->'payload'->>'from_location_id',
       -(e.envelope->'payload'->>'quantity')::BIGINT, 'transfer_out', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e WHERE e.operation_type = 'inventory.transferred'
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', e.envelope->'payload'->>'to_location_id',
       (e.envelope->'payload'->>'quantity')::BIGINT, 'transfer_in', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e WHERE e.operation_type = 'inventory.transferred'
UNION ALL
SELECT e.business_id, l->>'product_id', e.envelope->'payload'->>'location_id',
       -(l->>'quantity')::BIGINT, 'consignment_sale', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'consignment.settled' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array';

-- Business-wide stock per product (transfers net to zero; consignment stock
-- still belongs to the business until settled).
CREATE OR REPLACE VIEW nexo_business.stock_by_product AS
SELECT business_id, product_id, sum(quantity_delta) AS quantity, max(occurred_at) AS last_movement_at
FROM nexo_business.stock_movements
GROUP BY business_id, product_id;

REVOKE ALL ON nexo_business.stock_movements, nexo_business.stock_by_product FROM PUBLIC, anon, authenticated;
GRANT SELECT ON nexo_business.stock_movements, nexo_business.stock_by_product TO service_role;

ALTER TABLE nexo_business.catalog_products
  ADD COLUMN IF NOT EXISTS min_stock INTEGER CHECK (min_stock IS NULL OR min_stock >= 0);

-- Catalog upsert gains min_stock (replaces the 7-argument version).
DROP FUNCTION IF EXISTS public.nexo_business_catalog_upsert(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN);
CREATE OR REPLACE FUNCTION public.nexo_business_catalog_upsert(
  p_business TEXT, p_product_id TEXT, p_name TEXT, p_sku TEXT,
  p_barcodes TEXT[], p_prices JSONB, p_active BOOLEAN DEFAULT TRUE, p_min_stock INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_key TEXT;
  v_value JSONB;
  v_prices JSONB := '{}'::jsonb;
  v_row nexo_business.catalog_products%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members
    WHERE user_id = auth.uid() AND business_id = p_business AND role = 'owner') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF coalesce(trim(p_product_id), '') = '' OR coalesce(trim(p_name), '') = '' THEN
    RETURN jsonb_build_object('error', 'Falta el identificador o el nombre');
  END IF;
  IF p_min_stock IS NOT NULL AND p_min_stock < 0 THEN
    RETURN jsonb_build_object('error', 'El stock mínimo no puede ser negativo');
  END IF;
  IF jsonb_typeof(coalesce(p_prices, '{}'::jsonb)) <> 'object' THEN
    RETURN jsonb_build_object('error', 'Precios inválidos');
  END IF;
  FOR v_key, v_value IN SELECT * FROM jsonb_each(coalesce(p_prices, '{}'::jsonb)) LOOP
    IF upper(v_key) !~ '^[A-Z0-9]{3,16}$' OR jsonb_typeof(v_value) <> 'number'
       OR (v_value::text)::numeric < 0 OR (v_value::text)::numeric <> trunc((v_value::text)::numeric) THEN
      RETURN jsonb_build_object('error', 'Precio inválido para ' || v_key);
    END IF;
    v_prices := v_prices || jsonb_build_object(upper(v_key), (v_value::text)::bigint);
  END LOOP;

  INSERT INTO nexo_business.catalog_products AS c
    (business_id, product_id, sku, name, active, barcodes, prices, min_stock, seq, updated_by)
  VALUES
    (p_business, trim(p_product_id), nullif(trim(coalesce(p_sku, '')), ''), trim(p_name), coalesce(p_active, TRUE),
     coalesce((SELECT array_agg(DISTINCT trim(b)) FROM unnest(coalesce(p_barcodes, '{}')) b WHERE trim(b) <> ''), '{}'),
     v_prices, p_min_stock, 0, auth.uid())
  ON CONFLICT (business_id, product_id) DO UPDATE SET
    sku = EXCLUDED.sku, name = EXCLUDED.name, active = EXCLUDED.active, barcodes = EXCLUDED.barcodes,
    prices = EXCLUDED.prices, min_stock = EXCLUDED.min_stock, updated_by = EXCLUDED.updated_by
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row) - 'updated_by';
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Ese SKU ya lo usa otro producto');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_catalog_upsert(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_catalog_upsert(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN, INTEGER) TO authenticated;

-- Summary gains `stock` (catalog products with derived stock and low flag).
CREATE OR REPLACE FUNCTION nexo_business.summary_for(p_business TEXT, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_since DATE;
  v_tz CONSTANT TEXT := 'America/Havana';
BEGIN
  v_since := (now() AT TIME ZONE v_tz)::date - (least(greatest(coalesce(p_days, 7), 1), 90) - 1);
  RETURN jsonb_build_object(
    'businessId', p_business,
    'generatedAt', now(),
    'since', v_since,
    'days', coalesce((
      SELECT jsonb_agg(d ORDER BY d->>'day' DESC, d->>'currency')
      FROM (
        SELECT jsonb_build_object(
          'day', s.day, 'currency', s.currency,
          'salesCount', s.sales_count, 'salesMinor', s.sales_minor,
          'refundsMinor', coalesce(r.refunds_minor, 0)) AS d
        FROM (
          SELECT (occurred_at AT TIME ZONE v_tz)::date AS day, currency,
                 count(*) AS sales_count, sum(total_minor) AS sales_minor
          FROM nexo_business.sales
          WHERE business_id = p_business AND (occurred_at AT TIME ZONE v_tz)::date >= v_since
          GROUP BY 1, 2
        ) s
        LEFT JOIN (
          SELECT (occurred_at AT TIME ZONE v_tz)::date AS day, currency, sum(refund_minor) AS refunds_minor
          FROM nexo_business.sale_returns
          WHERE business_id = p_business
          GROUP BY 1, 2
        ) r ON r.day = s.day AND r.currency = s.currency
      ) x
    ), '[]'::jsonb),
    'totals', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'salesCount', n, 'salesMinor', total) ORDER BY currency)
      FROM (SELECT currency, count(*) n, sum(total_minor) total FROM nexo_business.sales
            WHERE business_id = p_business GROUP BY currency) t
    ), '[]'::jsonb),
    'receivables', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'openCount', n, 'balanceMinor', bal) ORDER BY currency)
      FROM (SELECT currency, count(*) n, sum(balance_minor) bal FROM nexo_business.receivable_balances
            WHERE business_id = p_business AND balance_minor > 0 GROUP BY currency) t
    ), '[]'::jsonb),
    'messengerCash', coalesce((
      SELECT jsonb_agg(jsonb_build_object('currency', currency, 'outstandingMinor', o) ORDER BY currency)
      FROM (SELECT currency, sum(outstanding_minor) o FROM nexo_business.messenger_custody
            WHERE business_id = p_business GROUP BY currency HAVING sum(outstanding_minor) <> 0) t
    ), '[]'::jsonb),
    'stock', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'productId', c.product_id, 'name', c.name, 'quantity', coalesce(s.quantity, 0),
        'minStock', c.min_stock,
        'low', c.min_stock IS NOT NULL AND coalesce(s.quantity, 0) <= c.min_stock,
        'lastMovementAt', s.last_movement_at)
        ORDER BY (c.min_stock IS NOT NULL AND coalesce(s.quantity, 0) <= c.min_stock) DESC, c.name)
      FROM nexo_business.catalog_products c
      LEFT JOIN nexo_business.stock_by_product s ON s.business_id = c.business_id AND s.product_id = c.product_id
      WHERE c.business_id = p_business AND c.active
    ), '[]'::jsonb),
    'devices', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'deviceId', d.device_id, 'label', d.label, 'lastSeenAt', d.last_seen_at, 'active', d.active,
        'events', (SELECT count(*) FROM nexo_business.sync_events e
                   WHERE e.business_id = d.business_id AND e.device_id = d.device_id)) ORDER BY d.active DESC, d.device_id)
      FROM nexo_business.devices d WHERE d.business_id = p_business
    ), '[]'::jsonb)
  );
END;
$$;

-- Owner creates a device; returns the token once.
CREATE OR REPLACE FUNCTION public.nexo_business_create_device(p_business TEXT, p_device_id TEXT, p_label TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token TEXT;
  v_device TEXT := lower(trim(coalesce(p_device_id, '')));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members
    WHERE user_id = auth.uid() AND business_id = p_business AND role = 'owner') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF v_device !~ '^[a-z0-9][a-z0-9-]{2,62}$' THEN
    RETURN jsonb_build_object('error', 'Identificador inválido: usa letras, números y guiones (3 a 63)');
  END IF;
  IF EXISTS (SELECT 1 FROM nexo_business.devices WHERE business_id = p_business AND device_id = v_device) THEN
    RETURN jsonb_build_object('error', 'Ese equipo ya existe');
  END IF;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash)
  VALUES (p_business, v_device, nullif(trim(coalesce(p_label, '')), ''), encode(extensions.digest(v_token, 'sha256'), 'hex'));
  RETURN jsonb_build_object('deviceId', v_device, 'token', v_token);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_create_device(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_create_device(TEXT, TEXT, TEXT) TO authenticated;

-- Owner deactivates (lost/stolen phone) or reactivates a device.
CREATE OR REPLACE FUNCTION public.nexo_business_set_device_active(p_business TEXT, p_device_id TEXT, p_active BOOLEAN)
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
  UPDATE nexo_business.devices SET active = coalesce(p_active, FALSE)
   WHERE business_id = p_business AND device_id = p_device_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Equipo no encontrado');
  END IF;
  RETURN jsonb_build_object('deviceId', p_device_id, 'active', coalesce(p_active, FALSE));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_device_active(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_device_active(TEXT, TEXT, BOOLEAN) TO authenticated;
