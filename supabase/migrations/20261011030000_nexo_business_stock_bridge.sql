-- D37 fase 2 (2026-10-11, Lennys deja BizneCubano): un solo stock para la caja y la web.
-- La nube NEXO manda. Un puente (función nexo-stock-bridge, cada 2 minutos) mueve
-- MOVIMIENTOS, nunca totales: lo que vende la caja se resta en la web y lo que vende la web
-- se resta en la caja. Cada movimiento tiene una clave única: nunca se aplica dos veces.

ALTER TABLE nexo_business.catalog_sources
  ADD COLUMN IF NOT EXISTS stock_bridge_from TIMESTAMPTZ,       -- desde cuándo funciona el puente (NULL = apagado)
  ADD COLUMN IF NOT EXISTS web_sales_checkpoint TIMESTAMPTZ;     -- último pedido web leído

CREATE TABLE IF NOT EXISTS nexo_business.web_stock_sync (
  business_id TEXT NOT NULL,
  stock_key TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('to_web', 'from_web')),
  product_id TEXT NOT NULL,
  delta BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, stock_key)
);
ALTER TABLE nexo_business.web_stock_sync ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.web_stock_sync FROM PUBLIC, anon, authenticated;

-- Movimientos de la caja/panel aún no enviados a la web (no incluye lo que vino de la web ni de BizneCubano).
CREATE OR REPLACE FUNCTION public.nexo_business_stock_to_web(p_business TEXT, p_limit INT DEFAULT 200)
RETURNS TABLE(stock_key TEXT, product_id TEXT, woo_id BIGINT, delta BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT m.event_id || ':' || m.product_id, m.product_id,
         (p.external_refs->'casaviva.company'->>'wooId')::bigint, m.quantity_delta
    FROM nexo_business.stock_movements m
    JOIN nexo_business.sync_events e ON e.event_id = m.event_id
    JOIN nexo_business.catalog_sources s ON s.business_id = m.business_id
    JOIN nexo_business.catalog_products p ON p.business_id = m.business_id AND p.product_id = m.product_id
   WHERE m.business_id = p_business AND s.stock_bridge_from IS NOT NULL
     AND e.received_at >= s.stock_bridge_from
     AND e.device_id NOT IN (p_business || '-web', p_business || '-web-bridge')
     AND m.quantity_delta <> 0
     AND p.external_refs->'casaviva.company'->>'wooId' IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM nexo_business.web_stock_sync w
                      WHERE w.business_id = m.business_id AND w.stock_key = m.event_id || ':' || m.product_id)
   ORDER BY e.received_at
   LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_stock_mark_sent(p_business TEXT, p_items JSONB)
RETURNS INT LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  WITH ins AS (
    INSERT INTO nexo_business.web_stock_sync (business_id, stock_key, direction, product_id, delta)
    SELECT p_business, i->>'key', 'to_web', i->>'productId', (i->>'delta')::bigint FROM jsonb_array_elements(p_items) i
    ON CONFLICT DO NOTHING RETURNING 1)
  SELECT count(*)::int FROM ins;
$$;

-- Una línea de pedido web que movió stock entra en la caja como ajuste (una sola vez por clave).
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
  IF v_product IS NULL THEN RETURN 'sin_producto'; END IF;
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

CREATE OR REPLACE FUNCTION public.nexo_business_stock_checkpoint(p_business TEXT, p_value TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_value IS NOT NULL THEN
    UPDATE nexo_business.catalog_sources SET web_sales_checkpoint = p_value WHERE business_id = p_business;
  END IF;
  RETURN (SELECT jsonb_build_object('from', stock_bridge_from, 'checkpoint', web_sales_checkpoint)
            FROM nexo_business.catalog_sources WHERE business_id = p_business);
END;
$$;

REVOKE ALL ON FUNCTION public.nexo_business_stock_to_web(TEXT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nexo_business_stock_mark_sent(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nexo_business_stock_from_web(TEXT, TEXT, BIGINT, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nexo_business_stock_checkpoint(TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_stock_to_web(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.nexo_business_stock_mark_sent(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.nexo_business_stock_from_web(TEXT, TEXT, BIGINT, BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.nexo_business_stock_checkpoint(TEXT, TIMESTAMPTZ) TO service_role;
