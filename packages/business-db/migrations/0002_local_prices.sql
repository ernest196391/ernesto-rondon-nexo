CREATE TABLE IF NOT EXISTS local_prices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES local_products(id),
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  UNIQUE(business_id, product_id, currency)
);
CREATE INDEX IF NOT EXISTS idx_local_prices_product ON local_prices(business_id, product_id, active);
