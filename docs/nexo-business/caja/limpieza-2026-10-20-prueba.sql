-- PRUEBA SIN GUARDAR de limpieza-2026-10-20.sql (BEGIN … ROLLBACK): enseña antes y después y deshace todo.
-- Pegar entero en el editor SQL de nexo-production. Usa el PASO 1A (con unidades); para ver el 1B, cambiar
-- la línea marcada «-- lines» por  'lines', '[]'::jsonb))
BEGIN;
CREATE TEMP TABLE antes ON COMMIT DROP AS
SELECT coalesce(sum((envelope->'payload'->>'total_minor')::bigint) FILTER (WHERE operation_type = 'sale.completed'), 0) AS vendido,
       coalesce(sum((envelope->'payload'->>'refund_minor')::bigint) FILTER (WHERE operation_type = 'sale.returned'), 0) AS devuelto,
       (SELECT coalesce(sum(quantity_delta), 0) FROM nexo_business.stock_movements WHERE business_id = 'casa-viva' AND product_id = 'cv-2547') AS perchero
  FROM nexo_business.sync_events WHERE business_id = 'casa-viva' AND occurred_at >= '2026-10-01' AND operation_type IN ('sale.completed', 'sale.returned');

INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
SELECT v.event_id, 'casa-viva', 'telefono-de-nana-1011-cb92', 'sale.returned', 'sale_return', v.return_id,
       to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
       jsonb_build_object('contract_version', 1, 'payload', jsonb_build_object('return_id', v.return_id, 'sale_id', v.sale_id, 'currency', 'USD',
         'refund_minor', 3300, 'refund_rail', 'other', 'reason', 'prueba de limpieza',
         'lines', jsonb_build_array(jsonb_build_object('product_id', 'cv-2547', 'quantity', 1))))  -- lines
  FROM (VALUES ('limpieza-20261020-perchero-1', 'limpieza-20261020-ret-18537e0a', '18537e0a-beed-40f9-859c-29433f2dabac'),
               ('limpieza-20261020-perchero-2', 'limpieza-20261020-ret-8735d2b1', '8735d2b1-618b-48f4-80e3-04c516cd4e82')) v(event_id, return_id, sale_id)
ON CONFLICT (event_id) DO NOTHING;

SELECT 'antes' AS momento, vendido / 100.0 AS vendido_usd, devuelto / 100.0 AS devuelto_usd, (vendido - devuelto) / 100.0 AS neto_usd, perchero FROM antes
UNION ALL
SELECT 'después', s.vendido / 100.0, s.devuelto / 100.0, (s.vendido - s.devuelto) / 100.0, s.perchero
  FROM (SELECT coalesce(sum((envelope->'payload'->>'total_minor')::bigint) FILTER (WHERE operation_type = 'sale.completed'), 0) AS vendido,
               coalesce(sum((envelope->'payload'->>'refund_minor')::bigint) FILTER (WHERE operation_type = 'sale.returned'), 0) AS devuelto,
               (SELECT coalesce(sum(quantity_delta), 0) FROM nexo_business.stock_movements WHERE business_id = 'casa-viva' AND product_id = 'cv-2547') AS perchero
          FROM nexo_business.sync_events WHERE business_id = 'casa-viva' AND occurred_at >= '2026-10-01' AND operation_type IN ('sale.completed', 'sale.returned')) s;
-- Esperado hoy: antes 142 / 76 / 66 / 1 · después 142 / 142 / 0 / 3.
ROLLBACK;
