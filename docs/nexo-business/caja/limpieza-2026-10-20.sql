-- «Pon la caja en cero» (Lennys 20-oct 15:48, aprobado por Ernesto como limpieza de datos).
-- Proyecto Supabase: nexo-production. NO se pega a mano: se prepara con
--     node docs/nexo-business/caja/limpieza-2026-10-20.mjs
-- que lee las existencias de la WEB del perchero (la web manda para este producto, Lennys 18:00) y escribe
-- limpieza-2026-10-20-listo.sql (y la prueba sin guardar limpieza-2026-10-20-prueba-listo.sql) con esa cifra.
-- Si no hay claves de la web a mano:  node …/limpieza-2026-10-20.mjs --web 3   (la cifra que dice la web).
--
-- NO borra nada: añade eventos con los mismos mecanismos de la caja (devolución = sale.returned,
-- conteo = inventory.counted «Igualar la web», cierre = cash_shift.closed). Idempotente: ids fijos
-- «limpieza-20261020-*»; si se pega dos veces, la segunda no hace nada. Para deshacer: …-deshacer.sql.
--
-- Lo encontrado (lectura del 20-oct, 16:40 hora de Cuba):
--  * Nana, 11-oct 16:09 y 16:10: 2 ventas de «Perchero Multifuncional 160x36x173cm» (cv-2547, web 2547), 33 USD
--    cada una, efectivo, sin turno, sin «Atiende», sin comisiones (ventas 18537e0a… y 8735d2b1…).
--  * Existencias cv-2547 en la caja: 8 (conteo 11-oct) − 5 pedidos web − esas 2 ventas = 1. El puente restó esas 2
--    también en la web; desde entonces no hubo recuento.
--  * Pruebas de Lennys (12-oct 22 USD y hoy 54 USD) ya tienen devolución: quedan en 0. No se tocan.
--  * Turno de Lennys 86227ecc: YA se cerró hoy 15:12 (Cuba) desde su teléfono. Nada que hacer.
--  * Turno de Zaymi 12025c00 (15-oct 9:31): abierto en la nube y nunca cerrado (huérfano).
--
-- Qué decide (la web manda):
--  * web = caja        → 1B: se anula solo el dinero; las existencias no se tocan (los percheros no están).
--  * web = caja + 2    → 1A: el dinero y las 2 unidades vuelven a la caja. Se hace con un conteo «Igualar la web»
--                        (no con una devolución con unidades) para que el puente NO le sume otras 2 a la web.
--  * otra cifra        → 1B + la caja se iguala a la web con un conteo «Igualar la web».
DO $limpieza$
DECLARE
  v_web BIGINT := NULL; -- WEB_STOCK (lo rellena limpieza-2026-10-20.mjs; sin cifra no hace nada)
  v_caja BIGINT;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_choice TEXT;
BEGIN
  IF v_web IS NULL OR v_web < 0 THEN
    RAISE EXCEPTION 'Falta la cifra de la web del perchero cv-2547: prepara el archivo con limpieza-2026-10-20.mjs';
  END IF;
  SELECT coalesce(sum(quantity_delta), 0) INTO v_caja FROM nexo_business.stock_movements
   WHERE business_id = 'casa-viva' AND product_id = 'cv-2547';
  IF EXISTS (SELECT 1 FROM nexo_business.sync_events WHERE event_id = 'limpieza-20261020-perchero-1') THEN
    v_choice := 'ya hecha antes (no se repite el dinero)';
  ELSIF v_web = v_caja THEN
    v_choice := '1B: solo el dinero (la web dice ' || v_web || ', igual que la caja)';
  ELSIF v_web = v_caja + 2 THEN
    v_choice := '1A: el dinero y las 2 unidades vuelven a la caja (la web ya dice ' || v_web || ')';
  ELSE
    v_choice := '1B + la caja pasa de ' || v_caja || ' a ' || v_web || ' como la web';
  END IF;

  -- Dinero: devolución sin unidades (lines vacío), una por venta.
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  SELECT v.event_id, 'casa-viva', 'telefono-de-nana-1011-cb92', 'sale.returned', 'sale_return', v.return_id, v_now,
         jsonb_build_object('contract_version', 1, 'event_id', v.event_id, 'business_id', 'casa-viva', 'source_system', 'nexo-limpieza',
           'payload', jsonb_build_object('return_id', v.return_id, 'sale_id', v.sale_id, 'currency', 'USD', 'refund_minor', 3300,
             'refund_rail', 'other', 'shift_id', NULL, 'operator_id', NULL,
             'reason', 'Limpieza 20-oct (Lennys): venta de prueba del 11-oct, no fue real', 'lines', '[]'::jsonb))
    FROM (VALUES ('limpieza-20261020-perchero-1', 'limpieza-20261020-ret-18537e0a', '18537e0a-beed-40f9-859c-29433f2dabac'),
                 ('limpieza-20261020-perchero-2', 'limpieza-20261020-ret-8735d2b1', '8735d2b1-618b-48f4-80e3-04c516cd4e82')) v(event_id, return_id, sale_id)
  ON CONFLICT (event_id) DO NOTHING;

  -- Existencias: la caja igual a la web (conteo «Igualar la web», como el panel; el puente fija la web a la misma cifra).
  IF v_caja <> v_web THEN
    INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
    VALUES ('casa-viva', 'casa-viva-panel', 'Panel de la dueña',
            encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
    ON CONFLICT (business_id, device_id) DO NOTHING;
    INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
    VALUES ('limpieza-20261020-perchero-conteo', 'casa-viva', 'casa-viva-panel', 'inventory.counted', 'inventory_count', 'cv-2547', v_now,
      jsonb_build_object('contract_version', 1, 'source_system', 'nexo-limpieza', 'payload', jsonb_build_object(
        'product_id', 'cv-2547', 'location_id', NULL, 'expected_quantity', v_caja, 'counted_quantity', v_web,
        'difference_quantity', v_web - v_caja, 'reason', 'Igualar la web (limpieza 20-oct: la web manda en el perchero)')))
    ON CONFLICT (event_id) DO NOTHING;
  END IF;

  -- Turno huérfano de Zaymi (12025c00): sin ventas ni dinero.
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES ('limpieza-20261020-turno-12025c00', 'casa-viva', 'telefono-de-zaymi-1015-5583', 'cash_shift.closed', 'cash_shift',
          '12025c00-1aa2-4c78-a74b-33dfc65b04de', v_now,
          jsonb_build_object('contract_version', 1, 'event_id', 'limpieza-20261020-turno-12025c00', 'business_id', 'casa-viva', 'source_system', 'nexo-limpieza',
            'payload', jsonb_build_object('shift_id', '12025c00-1aa2-4c78-a74b-33dfc65b04de', 'closed_by', NULL,
              'note', 'Limpieza 20-oct: turno huérfano (abierto el 15-oct sin ventas ni dinero; Zaymi abrió y cerró luego 09f3f3ff)',
              'counts', '[]'::jsonb, 'expected_source', 'limpieza')))
  ON CONFLICT (event_id) DO NOTHING;

  RAISE NOTICE 'Limpieza: web % · caja antes % · elegido: %', v_web, v_caja, v_choice;
END
$limpieza$;

-- Resultado (solo lectura): octubre de la tienda en la caja y el perchero.
SELECT count(*) FILTER (WHERE operation_type = 'sale.completed') AS ventas,
       coalesce(sum((envelope->'payload'->>'total_minor')::bigint) FILTER (WHERE operation_type = 'sale.completed'), 0) / 100.0 AS vendido_usd,
       coalesce(sum((envelope->'payload'->>'refund_minor')::bigint) FILTER (WHERE operation_type = 'sale.returned'), 0) / 100.0 AS devuelto_usd,
       (SELECT coalesce(sum(quantity_delta), 0) FROM nexo_business.stock_movements WHERE business_id = 'casa-viva' AND product_id = 'cv-2547') AS perchero_caja
  FROM nexo_business.sync_events
 WHERE business_id = 'casa-viva' AND occurred_at >= '2026-10-01' AND operation_type IN ('sale.completed', 'sale.returned');
-- Esperado: 4 ventas, 142 USD vendido, 142 USD devuelto → neto 0; perchero_caja = la cifra de la web.
