PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS local_products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_local_products_sku ON local_products(business_id, sku) WHERE sku IS NOT NULL;

CREATE TABLE IF NOT EXISTS local_barcodes (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES local_products(id),
  code TEXT NOT NULL,
  format TEXT,
  UNIQUE(business_id, code)
);

CREATE TABLE IF NOT EXISTS local_sales (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_minor INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS local_sale_lines (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES local_sales(id),
  product_id TEXT NOT NULL REFERENCES local_products(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price_minor INTEGER NOT NULL,
  line_total_minor INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS local_payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES local_sales(id),
  method TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_inventory_movements (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES local_products(id),
  quantity_delta INTEGER NOT NULL CHECK(quantity_delta <> 0),
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_outbox (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  synced_at TEXT,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_outbox_pending ON local_outbox(synced_at, next_attempt_at, occurred_at);
