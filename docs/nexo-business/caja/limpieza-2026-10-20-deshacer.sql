-- DESHACER limpieza-2026-10-20.sql (solo si hiciera falta). Quita ÚNICAMENTE las filas que añadió la limpieza
-- (ids «limpieza-20261020-*»); los eventos reales no se tocan. sync_events es de solo-añadir: su disparador
-- se apaga solo dentro de esta transacción y se vuelve a encender antes de terminar.
-- OJO existencias: si se usó el PASO 1A, el puente ya pudo subir la web +2. Después de deshacer, poner la
-- cantidad real del perchero en el panel → Inventario → «Quedan» (fija caja y web a la misma cifra).
-- Esas ventas no tenían comisiones: no hay nada que restaurar.
BEGIN;
ALTER TABLE nexo_business.sync_events DISABLE TRIGGER sync_events_append_only;
DELETE FROM nexo_business.sync_events WHERE business_id = 'casa-viva' AND event_id IN
  ('limpieza-20261020-perchero-1', 'limpieza-20261020-perchero-2', 'limpieza-20261020-turno-12025c00');
ALTER TABLE nexo_business.sync_events ENABLE TRIGGER sync_events_append_only;
-- El turno 12025c00 vuelve a «abierto» en la proyección de turnos (solo si la migración caja P0 ya está aplicada).
UPDATE nexo_business.store_shifts
   SET status = 'open', closed_at = NULL, closed_by = NULL, closed_device = NULL, counts = NULL, expected_source = NULL, note = NULL
 WHERE business_id = 'casa-viva' AND shift_id = '12025c00-1aa2-4c78-a74b-33dfc65b04de';
COMMIT;
