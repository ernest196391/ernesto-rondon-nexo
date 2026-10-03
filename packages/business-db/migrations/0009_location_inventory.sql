-- 0009 — Location-based inventory: locations, stock per location, paired
-- transfers and physical counts.
--
-- Additive on top of 0001–0008. See docs/nexo-business/PRODUCT_DECISIONS_V1.md §5.
--
-- * Stock is derived from immutable movements per (location, product); it is
--   never stored or overwritten.
-- * Each business has one default location. Movements written before this
--   migration (or by flows that do not pick a location yet, like POS sales)
--   have location_id NULL and count toward the default location.
-- * A transfer is two paired movements (source −, destination +) written in
--   one transaction and linked by transfer_id.
-- * A physical count stores expected, counted and difference, and writes one
--   reconciliation movement for a non-zero difference.

CREATE TABLE IF NOT EXISTS local_locations (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  kind TEXT NOT NULL CHECK(kind IN ('warehouse','store','branch','transit','consignment','damaged')),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0,1)),
  -- System that owns stock truth for this location ('nexo', 'axis', 'woocommerce'…).
  authority_system TEXT NOT NULL DEFAULT 'nexo',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(business_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_locations_one_default
  ON local_locations(business_id) WHERE is_default = 1;

CREATE TRIGGER IF NOT EXISTS trg_local_locations_identity_immutable
BEFORE UPDATE OF id, business_id, kind, is_default, created_at ON local_locations
BEGIN
  SELECT RAISE(ABORT, 'location identity, kind and default flag are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_local_locations_no_delete
BEFORE DELETE ON local_locations
BEGIN
  SELECT RAISE(ABORT, 'locations cannot be deleted; deactivate them instead');
END;

ALTER TABLE local_inventory_movements ADD COLUMN location_id TEXT REFERENCES local_locations(id);
ALTER TABLE local_inventory_movements ADD COLUMN operator_id TEXT;
ALTER TABLE local_inventory_movements ADD COLUMN transfer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_local_inventory_movements_location
  ON local_inventory_movements(business_id, location_id, product_id);

-- No silent stock overwrite: movements are append-only.
CREATE TRIGGER IF NOT EXISTS trg_inventory_movements_immutable
BEFORE UPDATE ON local_inventory_movements
BEGIN
  SELECT RAISE(ABORT, 'inventory movements are append-only; record a new movement instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movements_no_delete
BEFORE DELETE ON local_inventory_movements
BEGIN
  SELECT RAISE(ABORT, 'inventory movements are append-only; record a new movement instead');
END;

CREATE TABLE IF NOT EXISTS local_inventory_transfers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES local_products(id),
  from_location_id TEXT NOT NULL REFERENCES local_locations(id),
  to_location_id TEXT NOT NULL REFERENCES local_locations(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  reason TEXT NOT NULL CHECK(length(trim(reason)) > 0),
  operator_id TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  CHECK(from_location_id <> to_location_id)
);

CREATE TABLE IF NOT EXISTS local_inventory_counts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  location_id TEXT NOT NULL REFERENCES local_locations(id),
  product_id TEXT NOT NULL REFERENCES local_products(id),
  expected_quantity INTEGER NOT NULL,
  counted_quantity INTEGER NOT NULL CHECK(counted_quantity >= 0),
  difference_quantity INTEGER NOT NULL CHECK(difference_quantity = counted_quantity - expected_quantity),
  adjustment_movement_id TEXT REFERENCES local_inventory_movements(id),
  reason TEXT NOT NULL CHECK(length(trim(reason)) > 0),
  operator_id TEXT,
  counted_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  CHECK((difference_quantity = 0) = (adjustment_movement_id IS NULL))
);

CREATE TRIGGER IF NOT EXISTS trg_inventory_transfers_immutable
BEFORE UPDATE OF id, business_id, product_id, from_location_id, to_location_id, quantity, reason,
  operator_id, occurred_at
ON local_inventory_transfers
BEGIN
  SELECT RAISE(ABORT, 'inventory transfers are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_transfers_no_delete
BEFORE DELETE ON local_inventory_transfers
BEGIN
  SELECT RAISE(ABORT, 'inventory transfers are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_counts_immutable
BEFORE UPDATE OF id, business_id, location_id, product_id, expected_quantity, counted_quantity,
  difference_quantity, adjustment_movement_id, reason, operator_id, counted_at
ON local_inventory_counts
BEGIN
  SELECT RAISE(ABORT, 'inventory counts are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_counts_no_delete
BEFORE DELETE ON local_inventory_counts
BEGIN
  SELECT RAISE(ABORT, 'inventory counts are append-only');
END;

-- Stock per location; unassigned (legacy) movements belong to the default location.
CREATE VIEW IF NOT EXISTS local_stock_by_location AS
SELECT
  m.business_id,
  COALESCE(m.location_id, d.id) AS location_id,
  m.product_id,
  SUM(m.quantity_delta) AS quantity
FROM local_inventory_movements m
LEFT JOIN local_locations d ON d.business_id = m.business_id AND d.is_default = 1
GROUP BY m.business_id, COALESCE(m.location_id, d.id), m.product_id;
