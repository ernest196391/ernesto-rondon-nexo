-- 0005 — Reusable financial model hooks: payment rails, source identity,
-- location/operator attribution and provider-neutral external references.
--
-- Additive on top of 0003/0004. See docs/nexo-business/FINANCIAL_MODEL.md.
--
-- * Payment rail separates physical cash from every non-cash rail. Only
--   rail 'cash' (or a legacy row with method 'cash' and no rail) can change
--   expected drawer cash. Provider/channel are metadata (e.g. transfer via
--   Transfermóvil), never new accounting primitives.
-- * Cash collections that come from an order (pickup at the counter,
--   messenger returning collected cash) must name their source and can be
--   recorded only once per source/kind/currency, so a retry or a second
--   device cannot double count the same order money.
-- * External system IDs (WooCommerce, Axis, …) live in local_external_refs,
--   never as NEXO primary keys.

ALTER TABLE local_payments ADD COLUMN rail TEXT CHECK(rail IS NULL OR rail IN (
  'cash',
  'transfer',
  'card',
  'digital_asset',
  'other'
));
ALTER TABLE local_payments ADD COLUMN provider TEXT;
ALTER TABLE local_payments ADD COLUMN channel TEXT;
ALTER TABLE local_payments ADD COLUMN external_ref TEXT;

CREATE TRIGGER IF NOT EXISTS trg_local_payments_cash_rail_coherent
BEFORE INSERT ON local_payments
WHEN NEW.rail IS NOT NULL AND (
  (NEW.method = 'cash' AND NEW.rail <> 'cash')
  OR (NEW.rail = 'cash' AND NEW.method <> 'cash')
)
BEGIN
  SELECT RAISE(ABORT, 'payment method/rail mismatch: physical cash must use rail cash');
END;

ALTER TABLE local_sales ADD COLUMN operator_id TEXT;
ALTER TABLE local_sales ADD COLUMN customer_id TEXT;
ALTER TABLE local_sales ADD COLUMN location_id TEXT;

ALTER TABLE local_cash_shifts ADD COLUMN location_id TEXT;

ALTER TABLE local_cash_movements ADD COLUMN source_system TEXT;

-- Order-backed cash must say where it came from.
CREATE TRIGGER IF NOT EXISTS trg_cash_movements_collection_source
BEFORE INSERT ON local_cash_movements
WHEN NEW.kind IN ('order_cash','messenger_return')
  AND (NEW.source_type IS NULL OR NEW.source_id IS NULL OR NEW.source_system IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'order cash and messenger returns require source_system, source_type and source_id');
END;

-- The same order money enters a drawer only once per currency.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_movements_collection_once
  ON local_cash_movements(business_id, kind, source_system, source_type, source_id, currency)
  WHERE kind IN ('order_cash','messenger_return');

CREATE TRIGGER IF NOT EXISTS trg_cash_movements_source_immutable
BEFORE UPDATE OF source_system ON local_cash_movements
BEGIN
  SELECT RAISE(ABORT, 'cash movements are append-only; record a correction instead');
END;

CREATE TABLE IF NOT EXISTS local_external_refs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK(length(trim(entity_type)) > 0),
  entity_id TEXT NOT NULL CHECK(length(trim(entity_id)) > 0),
  system TEXT NOT NULL CHECK(length(trim(system)) > 0),
  external_id TEXT NOT NULL CHECK(length(trim(external_id)) > 0),
  created_at TEXT NOT NULL,
  -- One external identity maps to exactly one NEXO entity...
  UNIQUE(business_id, entity_type, system, external_id),
  -- ...and one NEXO entity has at most one identity per external system.
  UNIQUE(business_id, entity_type, entity_id, system)
);

CREATE TRIGGER IF NOT EXISTS trg_external_refs_immutable
BEFORE UPDATE ON local_external_refs
BEGIN
  SELECT RAISE(ABORT, 'external references are immutable');
END;
