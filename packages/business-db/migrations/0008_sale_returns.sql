-- 0008 — Sale returns and refunds.
--
-- Additive on top of 0001–0007. See docs/nexo-business/FINANCIAL_MODEL.md §6.
--
-- * A return references the original sale; the sale and its lines are never
--   edited. Each returned line references the sold line and puts the goods
--   back in stock with an inventory movement (reason 'return').
-- * Returned quantity per sold line can never exceed what was sold, and the
--   total refunded per sale can never exceed the sale total.
-- * The refund (if any) names its rail. A cash refund taken while the device
--   has an open shift leaves that drawer as a 'cash_out' movement with
--   category 'sale_refund' and the return as source (the 0004 kind list is
--   fixed, so refunds reuse cash_out). A return with refund 0 is an exchange
--   or store credit decided outside the drawer.

CREATE TABLE IF NOT EXISTS local_sale_returns (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  sale_id TEXT NOT NULL REFERENCES local_sales(id),
  currency TEXT NOT NULL,
  refund_minor INTEGER NOT NULL CHECK(refund_minor >= 0),
  refund_rail TEXT CHECK(refund_rail IS NULL OR refund_rail IN ('cash','transfer','card','digital_asset','other')),
  refund_provider TEXT,
  refund_external_ref TEXT,
  cash_movement_id TEXT REFERENCES local_cash_movements(id),
  reason TEXT NOT NULL CHECK(length(trim(reason)) > 0),
  operator_id TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  -- A refund names its rail; no refund means no rail.
  CHECK((refund_minor > 0) = (refund_rail IS NOT NULL)),
  CHECK(cash_movement_id IS NULL OR refund_rail = 'cash')
);

CREATE INDEX IF NOT EXISTS idx_local_sale_returns_sale ON local_sale_returns(sale_id);

CREATE TABLE IF NOT EXISTS local_sale_return_lines (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL REFERENCES local_sale_returns(id),
  sale_line_id TEXT NOT NULL REFERENCES local_sale_lines(id),
  product_id TEXT NOT NULL REFERENCES local_products(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  inventory_movement_id TEXT NOT NULL REFERENCES local_inventory_movements(id)
);

CREATE INDEX IF NOT EXISTS idx_local_sale_return_lines_sale_line ON local_sale_return_lines(sale_line_id);

CREATE TRIGGER IF NOT EXISTS trg_sale_returns_match_sale
BEFORE INSERT ON local_sale_returns
WHEN NEW.business_id IS NOT (SELECT business_id FROM local_sales WHERE id = NEW.sale_id)
  OR NEW.currency IS NOT (SELECT currency FROM local_sales WHERE id = NEW.sale_id)
BEGIN
  SELECT RAISE(ABORT, 'return must match the sale business and currency');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_returns_refund_limit
BEFORE INSERT ON local_sale_returns
WHEN (SELECT COALESCE(SUM(refund_minor), 0) FROM local_sale_returns WHERE sale_id = NEW.sale_id) + NEW.refund_minor
     > (SELECT total_minor FROM local_sales WHERE id = NEW.sale_id)
BEGIN
  SELECT RAISE(ABORT, 'refunds cannot exceed the sale total');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_return_lines_match_sale
BEFORE INSERT ON local_sale_return_lines
WHEN NOT EXISTS (
  SELECT 1 FROM local_sale_lines l JOIN local_sale_returns r ON r.sale_id = l.sale_id
  WHERE l.id = NEW.sale_line_id AND r.id = NEW.return_id AND l.product_id = NEW.product_id
)
BEGIN
  SELECT RAISE(ABORT, 'returned line must belong to the returned sale and product');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_return_lines_quantity_limit
BEFORE INSERT ON local_sale_return_lines
WHEN (SELECT COALESCE(SUM(quantity), 0) FROM local_sale_return_lines WHERE sale_line_id = NEW.sale_line_id) + NEW.quantity
     > (SELECT quantity FROM local_sale_lines WHERE id = NEW.sale_line_id)
BEGIN
  SELECT RAISE(ABORT, 'returned quantity cannot exceed the sold quantity');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_returns_immutable
BEFORE UPDATE OF id, business_id, branch_id, device_id, sale_id, currency, refund_minor, refund_rail,
  refund_provider, refund_external_ref, cash_movement_id, reason, operator_id, occurred_at
ON local_sale_returns
BEGIN
  SELECT RAISE(ABORT, 'sale returns are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_returns_no_delete
BEFORE DELETE ON local_sale_returns
BEGIN
  SELECT RAISE(ABORT, 'sale returns are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_return_lines_immutable
BEFORE UPDATE ON local_sale_return_lines
BEGIN
  SELECT RAISE(ABORT, 'sale return lines are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_return_lines_no_delete
BEFORE DELETE ON local_sale_return_lines
BEGIN
  SELECT RAISE(ABORT, 'sale return lines are append-only');
END;
