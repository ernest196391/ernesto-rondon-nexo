-- 0006 — Receivables: credit sales (fiado), partial payments and write-offs.
--
-- Additive on top of 0001–0005. See docs/nexo-business/FINANCIAL_MODEL.md §6.
--
-- * A receivable is money a customer owes the business, in one currency,
--   created from a source (a NEXO sale, a Woo order…). Debt is never stored
--   as free text or as a negative cash movement.
-- * Payments and write-offs are append-only entries. The balance is derived:
--   original − payments − write-offs, and it can never go below zero.
-- * A cash payment collected while the device has an open shift also writes
--   a 'cash_in' movement (category 'receivable_payment') to that drawer, in the
--   same transaction; the entry keeps the movement id. Non-cash payments never
--   touch the drawer.

CREATE TABLE IF NOT EXISTS local_receivables (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  customer_id TEXT NOT NULL CHECK(length(trim(customer_id)) > 0),
  source_system TEXT NOT NULL CHECK(length(trim(source_system)) > 0),
  source_type TEXT NOT NULL CHECK(length(trim(source_type)) > 0),
  source_id TEXT NOT NULL CHECK(length(trim(source_id)) > 0),
  currency TEXT NOT NULL CHECK(length(currency) BETWEEN 3 AND 16 AND currency = upper(currency)),
  original_minor INTEGER NOT NULL CHECK(original_minor > 0),
  due_at TEXT,
  note TEXT,
  operator_id TEXT,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  -- The same source debt exists once per currency.
  UNIQUE(business_id, source_system, source_type, source_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_local_receivables_customer
  ON local_receivables(business_id, customer_id);

CREATE TABLE IF NOT EXISTS local_receivable_entries (
  id TEXT PRIMARY KEY,
  receivable_id TEXT NOT NULL REFERENCES local_receivables(id),
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('payment','write_off')),
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  rail TEXT CHECK(rail IS NULL OR rail IN ('cash','transfer','card','digital_asset','other')),
  provider TEXT,
  channel TEXT,
  external_ref TEXT,
  reason TEXT,
  cash_movement_id TEXT REFERENCES local_cash_movements(id),
  operator_id TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  -- A payment names its rail; a write-off has no rail and needs a reason.
  CHECK(
    (kind = 'payment' AND rail IS NOT NULL)
    OR (kind = 'write_off' AND rail IS NULL AND reason IS NOT NULL AND length(trim(reason)) > 0)
  ),
  -- Only physical cash can land in a drawer.
  CHECK(cash_movement_id IS NULL OR rail = 'cash')
);

CREATE INDEX IF NOT EXISTS idx_local_receivable_entries_receivable
  ON local_receivable_entries(receivable_id);

CREATE TRIGGER IF NOT EXISTS trg_receivable_entries_same_currency
BEFORE INSERT ON local_receivable_entries
WHEN NEW.currency IS NOT (SELECT currency FROM local_receivables WHERE id = NEW.receivable_id)
  OR NEW.business_id IS NOT (SELECT business_id FROM local_receivables WHERE id = NEW.receivable_id)
BEGIN
  SELECT RAISE(ABORT, 'receivable entry must match the receivable business and currency');
END;

CREATE TRIGGER IF NOT EXISTS trg_receivable_entries_no_overpay
BEFORE INSERT ON local_receivable_entries
WHEN (SELECT COALESCE(SUM(amount_minor), 0) FROM local_receivable_entries WHERE receivable_id = NEW.receivable_id)
     + NEW.amount_minor
     > (SELECT original_minor FROM local_receivables WHERE id = NEW.receivable_id)
BEGIN
  SELECT RAISE(ABORT, 'receivable entries cannot exceed the amount owed');
END;

-- Append-only: only sync bookkeeping may change.
CREATE TRIGGER IF NOT EXISTS trg_receivables_immutable
BEFORE UPDATE OF id, business_id, branch_id, device_id, customer_id, source_system, source_type, source_id,
  currency, original_minor, due_at, note, operator_id, created_at
ON local_receivables
BEGIN
  SELECT RAISE(ABORT, 'receivables are append-only; record a payment or write-off instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_receivables_no_delete
BEFORE DELETE ON local_receivables
BEGIN
  SELECT RAISE(ABORT, 'receivables are append-only; record a payment or write-off instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_receivable_entries_immutable
BEFORE UPDATE OF id, receivable_id, business_id, device_id, kind, currency, amount_minor, rail, provider,
  channel, external_ref, reason, cash_movement_id, operator_id, occurred_at
ON local_receivable_entries
BEGIN
  SELECT RAISE(ABORT, 'receivable entries are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_receivable_entries_no_delete
BEFORE DELETE ON local_receivable_entries
BEGIN
  SELECT RAISE(ABORT, 'receivable entries are append-only');
END;

CREATE VIEW IF NOT EXISTS local_receivable_balances AS
SELECT
  r.id AS receivable_id,
  r.business_id,
  r.customer_id,
  r.currency,
  r.original_minor,
  COALESCE(SUM(CASE WHEN e.kind = 'payment' THEN e.amount_minor END), 0) AS paid_minor,
  COALESCE(SUM(CASE WHEN e.kind = 'write_off' THEN e.amount_minor END), 0) AS written_off_minor,
  r.original_minor - COALESCE(SUM(e.amount_minor), 0) AS balance_minor
FROM local_receivables r
LEFT JOIN local_receivable_entries e ON e.receivable_id = r.id
GROUP BY r.id;
