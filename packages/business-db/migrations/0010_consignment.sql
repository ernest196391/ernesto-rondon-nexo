-- 0010 — Consignment: goods placed at a client's location stay owned by the
-- business until the client reports them sold; the settlement turns those
-- units into debt (a receivable).
--
-- Additive on top of 0001–0009. See docs/nexo-business/FINANCIAL_MODEL.md §6.
--
-- * A consignment account binds one 'consignment' location to one client and
--   one currency. Goods move there (and back, for unsold units) with ordinary
--   paired transfers from 0009, so ownership stays with the business.
-- * A settlement lists units the client sold at agreed prices. One transaction
--   writes the settlement, its lines, the stock decrease at the consignment
--   location (reason 'consignment_sale') and a receivable for the total
--   (source_type 'consignment_settlement'). Payments then use the receivable.

CREATE TABLE IF NOT EXISTS local_consignment_accounts (
  location_id TEXT PRIMARY KEY REFERENCES local_locations(id),
  business_id TEXT NOT NULL,
  customer_id TEXT NOT NULL CHECK(length(trim(customer_id)) > 0),
  currency TEXT NOT NULL CHECK(length(currency) BETWEEN 3 AND 16 AND currency = upper(currency)),
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TRIGGER IF NOT EXISTS trg_consignment_accounts_location_kind
BEFORE INSERT ON local_consignment_accounts
WHEN (SELECT kind FROM local_locations WHERE id = NEW.location_id) IS NOT 'consignment'
  OR (SELECT business_id FROM local_locations WHERE id = NEW.location_id) IS NOT NEW.business_id
BEGIN
  SELECT RAISE(ABORT, 'consignment account needs a consignment location of the same business');
END;

CREATE TABLE IF NOT EXISTS local_consignment_settlements (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  location_id TEXT NOT NULL REFERENCES local_consignment_accounts(location_id),
  customer_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_minor INTEGER NOT NULL CHECK(total_minor > 0),
  receivable_id TEXT NOT NULL REFERENCES local_receivables(id),
  note TEXT,
  operator_id TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS local_consignment_settlement_lines (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES local_consignment_settlements(id),
  product_id TEXT NOT NULL REFERENCES local_products(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price_minor INTEGER NOT NULL CHECK(unit_price_minor >= 0),
  line_total_minor INTEGER NOT NULL CHECK(line_total_minor = quantity * unit_price_minor),
  inventory_movement_id TEXT NOT NULL REFERENCES local_inventory_movements(id)
);

CREATE TRIGGER IF NOT EXISTS trg_consignment_settlements_match_account
BEFORE INSERT ON local_consignment_settlements
WHEN NOT EXISTS (
  SELECT 1 FROM local_consignment_accounts a
  WHERE a.location_id = NEW.location_id AND a.business_id = NEW.business_id
    AND a.customer_id = NEW.customer_id AND a.currency = NEW.currency
)
BEGIN
  SELECT RAISE(ABORT, 'settlement must match its consignment account');
END;

CREATE TRIGGER IF NOT EXISTS trg_consignment_accounts_immutable
BEFORE UPDATE OF location_id, business_id, customer_id, currency, created_at ON local_consignment_accounts
BEGIN
  SELECT RAISE(ABORT, 'consignment accounts are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_consignment_accounts_no_delete
BEFORE DELETE ON local_consignment_accounts
BEGIN
  SELECT RAISE(ABORT, 'consignment accounts are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_consignment_settlements_immutable
BEFORE UPDATE OF id, business_id, location_id, customer_id, currency, total_minor, receivable_id, note,
  operator_id, occurred_at
ON local_consignment_settlements
BEGIN
  SELECT RAISE(ABORT, 'consignment settlements are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_consignment_settlements_no_delete
BEFORE DELETE ON local_consignment_settlements
BEGIN
  SELECT RAISE(ABORT, 'consignment settlements are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_consignment_settlement_lines_immutable
BEFORE UPDATE ON local_consignment_settlement_lines
BEGIN
  SELECT RAISE(ABORT, 'consignment settlement lines are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_consignment_settlement_lines_no_delete
BEFORE DELETE ON local_consignment_settlement_lines
BEGIN
  SELECT RAISE(ABORT, 'consignment settlement lines are append-only');
END;
