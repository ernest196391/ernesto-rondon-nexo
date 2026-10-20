-- «Pon la caja en cero» (Lennys 20-oct 15:48, aprobado por Ernesto como limpieza de datos).
-- Proyecto Supabase: nexo-production. Pegar en el editor SQL (traductor de Chrome apagado).
-- NO borra nada: añade eventos de reversión con los mismos mecanismos de la caja
-- (devolución = sale.returned, cierre = cash_shift.closed). Idempotente: ids fijos «limpieza-20261020-*»
-- y ON CONFLICT DO NOTHING; pegarlo dos veces no hace nada la segunda vez.
-- Antes, si se quiere ver el efecto sin guardar: limpieza-2026-10-20-prueba.sql (BEGIN … ROLLBACK).
--
-- Lo que se encontró (lectura del 20-oct, 16:40 hora de Cuba):
--  * Nana, 11-oct 16:09 y 16:10: 2 ventas de «Perchero Multifuncional 160x36x173cm» (cv-2547, web 2547),
--    33 USD cada una, efectivo, sin turno, sin «Atiende» y sin comisiones. Ventas 18537e0a… y 8735d2b1….
--  * Existencias de cv-2547: conteo 8 (11-oct) − 5 pedidos web − esas 2 ventas = 1 en la caja. El puente ya
--    restó esas 2 también en la web (web_stock_sync «to_web» −1 y −1) y desde entonces NO hubo recuento.
--    → Si los 2 percheros siguen en la tienda, hoy debería haber 3 y la caja/web dicen 1.
--  * Lennys: pruebas del 12-oct (22 USD) y de hoy 15:04 (54 USD) ya tienen su devolución: quedan en 0. No se tocan.
--  * Turno de Lennys 86227ecc (abierto el 11-oct): YA se cerró hoy a las 15:12 (Cuba) desde su teléfono. Nada que hacer.
--  * Turno de Zaymi 12025c00 (15-oct 9:31): abierto en la nube y nunca cerrado (huérfano: luego abrió y cerró 09f3f3ff).
--
-- PASO 0 — ANTES: Lennys (o la dependienta de turno) cuenta los percheros cv-2547 en la tienda.
--   Si hay 3 → PASO 1A (devuelve las 2 unidades: caja 3 y el puente sube la web a 3 en ≤ 2 min).
--   Si hay 1 → PASO 1B (anula el dinero, NO toca existencias).
--   Otra cifra → PASO 1B y luego poner la cifra real en el panel → Inventario → «Quedan».

-- Comprobación (solo lectura): existencias de la caja y lo que el puente mandó a la web.
SELECT (SELECT coalesce(sum(quantity_delta), 0) FROM nexo_business.stock_movements WHERE business_id = 'casa-viva' AND product_id = 'cv-2547') AS caja_ahora,
       (SELECT coalesce(sum(delta), 0) FROM nexo_business.web_stock_sync WHERE business_id = 'casa-viva' AND product_id = 'cv-2547' AND direction = 'to_web') AS mandado_a_la_web;

-- ===== PASO 1A (hay 3 percheros): devolución CON unidades =====
INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
SELECT v.event_id, 'casa-viva', 'telefono-de-nana-1011-cb92', 'sale.returned', 'sale_return', v.return_id,
       to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
       jsonb_build_object('contract_version', 1, 'event_id', v.event_id, 'business_id', 'casa-viva', 'source_system', 'nexo-limpieza',
         'payload', jsonb_build_object('return_id', v.return_id, 'sale_id', v.sale_id, 'currency', 'USD', 'refund_minor', 3300,
           'refund_rail', 'other', 'shift_id', NULL, 'operator_id', NULL,
           'reason', 'Limpieza 20-oct (Lennys): venta de prueba del 11-oct, no fue real',
           'lines', jsonb_build_array(jsonb_build_object('product_id', 'cv-2547', 'quantity', 1))))
  FROM (VALUES ('limpieza-20261020-perchero-1', 'limpieza-20261020-ret-18537e0a', '18537e0a-beed-40f9-859c-29433f2dabac'),
               ('limpieza-20261020-perchero-2', 'limpieza-20261020-ret-8735d2b1', '8735d2b1-618b-48f4-80e3-04c516cd4e82')) v(event_id, return_id, sale_id)
ON CONFLICT (event_id) DO NOTHING;

-- ===== PASO 1B (hay 1 perchero): devolución SOLO del dinero (lines vacío = no mueve existencias) =====
-- (Quitar los «--» y pegar este bloque EN LUGAR del 1A, nunca los dos.)
-- INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
-- SELECT v.event_id, 'casa-viva', 'telefono-de-nana-1011-cb92', 'sale.returned', 'sale_return', v.return_id,
--        to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
--        jsonb_build_object('contract_version', 1, 'event_id', v.event_id, 'business_id', 'casa-viva', 'source_system', 'nexo-limpieza',
--          'payload', jsonb_build_object('return_id', v.return_id, 'sale_id', v.sale_id, 'currency', 'USD', 'refund_minor', 3300,
--            'refund_rail', 'other', 'shift_id', NULL, 'operator_id', NULL,
--            'reason', 'Limpieza 20-oct (Lennys): venta de prueba del 11-oct, no fue real (sin mover existencias)',
--            'lines', '[]'::jsonb))
--   FROM (VALUES ('limpieza-20261020-perchero-1', 'limpieza-20261020-ret-18537e0a', '18537e0a-beed-40f9-859c-29433f2dabac'),
--                ('limpieza-20261020-perchero-2', 'limpieza-20261020-ret-8735d2b1', '8735d2b1-618b-48f4-80e3-04c516cd4e82')) v(event_id, return_id, sale_id)
-- ON CONFLICT (event_id) DO NOTHING;

-- ===== PASO 2: cerrar el turno huérfano de Zaymi (12025c00, sin ventas ni dinero) =====
INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
VALUES ('limpieza-20261020-turno-12025c00', 'casa-viva', 'telefono-de-zaymi-1015-5583', 'cash_shift.closed', 'cash_shift',
        '12025c00-1aa2-4c78-a74b-33dfc65b04de', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        jsonb_build_object('contract_version', 1, 'event_id', 'limpieza-20261020-turno-12025c00', 'business_id', 'casa-viva', 'source_system', 'nexo-limpieza',
          'payload', jsonb_build_object('shift_id', '12025c00-1aa2-4c78-a74b-33dfc65b04de', 'closed_by', NULL,
            'note', 'Limpieza 20-oct: turno huérfano (abierto el 15-oct sin ventas ni dinero; Zaymi abrió y cerró luego 09f3f3ff)',
            'counts', '[]'::jsonb, 'expected_source', 'limpieza')))
ON CONFLICT (event_id) DO NOTHING;

-- ===== DESPUÉS (solo lectura): octubre de la tienda en la caja =====
SELECT count(*) FILTER (WHERE operation_type = 'sale.completed') AS ventas,
       coalesce(sum((envelope->'payload'->>'total_minor')::bigint) FILTER (WHERE operation_type = 'sale.completed'), 0) / 100.0 AS vendido_usd,
       coalesce(sum((envelope->'payload'->>'refund_minor')::bigint) FILTER (WHERE operation_type = 'sale.returned'), 0) / 100.0 AS devuelto_usd
  FROM nexo_business.sync_events
 WHERE business_id = 'casa-viva' AND occurred_at >= '2026-10-01' AND operation_type IN ('sale.completed', 'sale.returned');
-- Esperado: 4 ventas, 142 USD vendido, 142 USD devuelto → neto 0 (el panel «La tienda» enseña «devuelto 142»).
