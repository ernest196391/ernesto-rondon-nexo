-- 0007 — Messenger custody: cash a messenger collected for an order and has
-- not yet returned to a drawer.
--
-- Additive on top of 0001–0006. See docs/nexo-business/FINANCIAL_MODEL.md §6.
--
-- * Collected order cash belongs to the messenger's custody balance (per
--   messenger and currency), not to any drawer.
-- * 'returned' settles custody and is always paired with a 'messenger_return'
--   cash movement for the same order/currency/amount in an open drawer.
-- * 'write_off' (with reason) settles a shortfall the business accepts.
-- * Each order's cash is collected once and returned once per currency;
--   settlements can never exceed what was collected. All rows append-only.

CREATE TABLE IF NOT EXISTS local_messenger_custody_entries (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  messenger_id TEXT NOT NULL CHECK(length(trim(messenger_id)) > 0),
  kind TEXT NOT NULL CHECK(kind IN ('collected','returned','write_off')),
  source_system TEXT NOT NULL CHECK(length(trim(source_system)) > 0),
  source_type TEXT NOT NULL CHECK(length(trim(source_type)) > 0),
  source_id TEXT NOT NULL CHECK(length(trim(source_id)) > 0),
  currency TEXT NOT NULL CHECK(length(currency) BETWEEN 3 AND 16 AND currency = upper(currency)),
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  cash_movement_id TEXT REFERENCES local_cash_movements(id),
  reason TEXT,
  operator_id TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  -- Only a return lands in a drawer, and it always does.
  CHECK((kind = 'returned') = (cash_movement_id IS NOT NULL)),
  CHECK(kind <> 'write_off' OR (reason IS NOT NULL AND length(trim(reason)) > 0))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_custody_collected_once
  ON local_messenger_custody_entries(business_id, source_system, source_type, source_id, currency)
  WHERE kind = 'collected';

CREATE UNIQUE INDEX IF NOT EXISTS idx_custody_returned_once
  ON local_messenger_custody_entries(business_id, source_system, source_type, source_id, currency)
  WHERE kind = 'returned';

CREATE INDEX IF NOT EXISTS idx_custody_messenger
  ON local_messenger_custody_entries(business_id, messenger_id, currency);

-- Settlements need a matching collection by the same messenger and cannot
-- exceed it.
CREATE TRIGGER IF NOT EXISTS trg_custody_settlement_matches_collection
BEFORE INSERT ON local_messenger_custody_entries
WHEN NEW.kind IN ('returned','write_off') AND (
  NOT EXISTS (
    SELECT 1 FROM local_messenger_custody_entries c
    WHERE c.kind = 'collected' AND c.business_id = NEW.business_id AND c.messenger_id = NEW.messenger_id
      AND c.source_system = NEW.source_system AND c.source_type = NEW.source_type
      AND c.source_id = NEW.source_id AND c.currency = NEW.currency
  )
  OR (
    SELECT COALESCE(SUM(amount_minor), 0) FROM local_messenger_custody_entries s
    WHERE s.kind IN ('returned','write_off') AND s.business_id = NEW.business_id
      AND s.source_system = NEW.source_system AND s.source_type = NEW.source_type
      AND s.source_id = NEW.source_id AND s.currency = NEW.currency
  ) + NEW.amount_minor > (
    SELECT amount_minor FROM local_messenger_custody_entries c
    WHERE c.kind = 'collected' AND c.business_id = NEW.business_id
      AND c.source_system = NEW.source_system AND c.source_type = NEW.source_type
      AND c.source_id = NEW.source_id AND c.currency = NEW.currency
  )
)
BEGIN
  SELECT RAISE(ABORT, 'custody settlement must match a collection and cannot exceed it');
END;

-- A return is paired with the drawer movement for the same money.
CREATE TRIGGER IF NOT EXISTS trg_custody_return_matches_movement
BEFORE INSERT ON local_messenger_custody_entries
WHEN NEW.kind = 'returned' AND NOT EXISTS (
  SELECT 1 FROM local_cash_movements m
  WHERE m.id = NEW.cash_movement_id AND m.kind = 'messenger_return' AND m.business_id = NEW.business_id
    AND m.source_system = NEW.source_system AND m.source_type = NEW.source_type
    AND m.source_id = NEW.source_id AND m.currency = NEW.currency AND m.amount_minor = NEW.amount_minor
)
BEGIN
  SELECT RAISE(ABORT, 'custody return must match its messenger_return cash movement');
END;

CREATE TRIGGER IF NOT EXISTS trg_custody_entries_immutable
BEFORE UPDATE OF id, business_id, device_id, messenger_id, kind, source_system, source_type, source_id,
  currency, amount_minor, cash_movement_id, reason, operator_id, occurred_at
ON local_messenger_custody_entries
BEGIN
  SELECT RAISE(ABORT, 'messenger custody entries are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_custody_entries_no_delete
BEFORE DELETE ON local_messenger_custody_entries
BEGIN
  SELECT RAISE(ABORT, 'messenger custody entries are append-only');
END;

CREATE VIEW IF NOT EXISTS local_messenger_custody_balances AS
SELECT
  business_id,
  messenger_id,
  currency,
  COALESCE(SUM(CASE WHEN kind = 'collected' THEN amount_minor END), 0) AS collected_minor,
  COALESCE(SUM(CASE WHEN kind = 'returned' THEN amount_minor END), 0) AS returned_minor,
  COALESCE(SUM(CASE WHEN kind = 'write_off' THEN amount_minor END), 0) AS written_off_minor,
  COALESCE(SUM(CASE WHEN kind = 'collected' THEN amount_minor ELSE -amount_minor END), 0) AS outstanding_minor
FROM local_messenger_custody_entries
GROUP BY business_id, messenger_id, currency;
