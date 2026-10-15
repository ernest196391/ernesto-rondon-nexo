-- 2026-10-15 (Lennys 14-oct): un conteo del panel deja la web con LA MISMA cifra que la caja.
-- Antes el puente mandaba a la web la diferencia del conteo (cantidad nueva − total de la caja) y la web
-- la SUMABA a lo que tuviera: si web y caja ya no coincidían, el conteo no las igualaba
-- (caja 0, web 1, Lennys pone «Quedan 1» → +1 → web 2).
--
-- Ahora, para cada conteo del panel (`inventory.counted` del equipo «<negocio>-panel"):
--   set_to = total de la caja de ese producto justo después del conteo
--            (movimientos recibidos hasta el conteo, incluido)
--          + lo que vino DE la web después del conteo (pedidos web, cancelaciones, cambios de /ventas/):
--            eso la web ya lo tiene, así que la cifra fijada no lo pisa.
-- Los movimientos de la caja/panel posteriores al conteo siguen saliendo como diferencias, en orden,
-- detrás del conteo. Ventas, devoluciones, entradas, etc.: set_to NULL, diferencia como siempre.
--
-- «Igualar la web»: si Lennys guarda en «Quedan» la misma cifra que ya tiene la caja pero la web
-- tiene otra, nexo_business_set_stock deja un conteo sin diferencia (no mueve la caja) y el puente
-- fija la web a esa cifra. Solo para productos que están en la web.
--
-- Mismas claves (event_id:product_id), misma tabla web_stock_sync, mismo nexo_business_stock_mark_sent.
-- Deshacer: volver a crear las dos funciones como estaban en 20261011030000 (stock_to_web: DROP + CREATE
-- con las 4 columnas y sus REVOKE/GRANT) y 20261011180000 (set_stock).

-- Cambia el tipo de retorno (2 columnas nuevas): hay que borrarla antes de crearla.
DROP FUNCTION IF EXISTS public.nexo_business_stock_to_web(TEXT, INT);
CREATE FUNCTION public.nexo_business_stock_to_web(p_business TEXT, p_limit INT DEFAULT 200)
RETURNS TABLE(stock_key TEXT, product_id TEXT, woo_id BIGINT, delta BIGINT, set_to BIGINT, kind TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH pending AS (
    -- Movimientos de stock (como antes).
    SELECT m.event_id, m.product_id, m.quantity_delta AS delta, e.received_at, e.device_id, e.operation_type
      FROM nexo_business.stock_movements m
      JOIN nexo_business.sync_events e ON e.event_id = m.event_id
     WHERE m.business_id = p_business AND m.quantity_delta <> 0
    UNION ALL
    -- Conteos del panel sin diferencia («Igualar la web»): no mueven la caja, solo fijan la web.
    SELECT e.event_id, e.envelope->'payload'->>'product_id', 0::bigint, e.received_at, e.device_id, e.operation_type
      FROM nexo_business.sync_events e
     WHERE e.business_id = p_business AND e.device_id = p_business || '-panel'
       AND e.operation_type = 'inventory.counted'
       AND (e.envelope->'payload'->>'difference_quantity')::bigint = 0
  )
  SELECT x.event_id || ':' || x.product_id, x.product_id,
         (p.external_refs->'casaviva.company'->>'wooId')::bigint, x.delta,
         CASE WHEN x.device_id = p_business || '-panel' AND x.operation_type = 'inventory.counted' THEN
           (SELECT coalesce(sum(m2.quantity_delta), 0)::bigint
              FROM nexo_business.stock_movements m2
              JOIN nexo_business.sync_events e2 ON e2.event_id = m2.event_id
             WHERE m2.business_id = p_business AND m2.product_id = x.product_id
               AND (e2.received_at <= x.received_at
                    OR e2.device_id IN (p_business || '-web', p_business || '-web-bridge')))
         END,
         x.operation_type
    FROM pending x
    JOIN nexo_business.catalog_sources s ON s.business_id = p_business
    JOIN nexo_business.catalog_products p ON p.business_id = p_business AND p.product_id = x.product_id
   WHERE s.stock_bridge_from IS NOT NULL
     AND x.received_at >= s.stock_bridge_from
     AND x.device_id NOT IN (p_business || '-web', p_business || '-web-bridge')
     AND p.external_refs->'casaviva.company'->>'wooId' IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM nexo_business.web_stock_sync w
                      WHERE w.business_id = p_business AND w.stock_key = x.event_id || ':' || x.product_id)
   ORDER BY x.received_at, x.event_id
   LIMIT p_limit;
$$;

-- Mismos permisos que antes: solo el puente (service_role).
REVOKE ALL ON FUNCTION public.nexo_business_stock_to_web(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_stock_to_web(TEXT, INT) TO service_role;

-- Conteos desde el panel (misma firma y permisos; CREATE OR REPLACE los conserva).
-- Único cambio: si la cifra ya es la de la caja y el producto está en la web, deja un conteo sin
-- diferencia para que el puente iguale la web (antes devolvía «unchanged» y no pasaba nada).
CREATE OR REPLACE FUNCTION public.nexo_business_set_stock(p_business TEXT, p_product TEXT, p_quantity BIGINT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_device TEXT := p_business || '-panel';
  v_current BIGINT;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_on_web BOOLEAN;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_quantity IS NULL OR p_quantity < 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'La cantidad no puede ser negativa'); END IF;
  SELECT external_refs->'casaviva.company'->>'wooId' IS NOT NULL INTO v_on_web FROM nexo_business.catalog_products
   WHERE business_id = p_business AND product_id = p_product;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  SELECT coalesce(sum(quantity_delta), 0) INTO v_current FROM nexo_business.stock_movements
   WHERE business_id = p_business AND product_id = p_product;
  IF v_current = p_quantity AND NOT v_on_web THEN RETURN jsonb_build_object('ok', true, 'unchanged', true); END IF;
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Panel de la dueña',
          encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (gen_random_uuid()::text, p_business, v_device, 'inventory.counted', 'inventory_count', p_product, v_now,
    jsonb_build_object('contract_version', 1, 'source_system', 'panel', 'payload', jsonb_build_object(
      'product_id', p_product, 'location_id', NULL, 'expected_quantity', v_current, 'counted_quantity', p_quantity,
      'difference_quantity', p_quantity - v_current,
      'reason', CASE WHEN v_current = p_quantity THEN 'Igualar la web (panel)' ELSE coalesce(nullif(p_reason, ''), 'Conteo desde el panel') END)));
  IF v_current = p_quantity THEN RETURN jsonb_build_object('ok', true, 'unchanged', true, 'web', 'igualar'); END IF;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  VALUES (p_business, 'stock:' || p_product, jsonb_build_object('quantity', v_current),
    jsonb_build_object('quantity', p_quantity, 'reason', coalesce(nullif(p_reason, ''), 'Conteo desde el panel')), auth.uid());
  RETURN jsonb_build_object('ok', true, 'from', v_current, 'to', p_quantity);
END;
$$;
