-- 0004 — Cash shift ledger: multi-currency, source-aware, append-only.
--
-- Additive follow-up to 0003_cash_shifts.sql. 0003 is kept byte-for-byte so a
-- device that may already have applied it keeps a valid migration checksum.
--
-- Model (see docs/nexo-business/CASH_SHIFT_LEDGER.md):
-- * A shift belongs to one business/branch/device; several devices may have
--   open shifts at the same time (unique open shift per device from 0003).
-- * Opening floats, manual cash in/out, expenses, order cash, messenger
--   returns and corrections are rows in local_cash_movements, each with its
--   own currency. local_cash_shifts.currency/opening_float_minor stay as the
--   primary-currency mirror required by 0003; the ledger is authoritative.
-- * POS sale cash is NOT copied into movements: it is derived from
--   local_payments (method = 'cash') of sales linked through
--   local_sales.shift_id. Transfers and other non-cash methods never change
--   expected drawer cash.
-- * Closing writes one immutable count per currency (expected, counted,
--   difference). Mistakes are fixed with explicit 'correction' movements on
--   an open shift, never by editing or deleting rows.

ALTER TABLE local_cash_shifts ADD COLUMN opened_by TEXT;
ALTER TABLE local_cash_shifts ADD COLUMN closed_by TEXT;
ALTER TABLE local_cash_shifts ADD COLUMN close_note TEXT;

-- Currencies a shift tracks in its drawer. Every tracked currency must be
-- counted before the shift can close.
CREATE TABLE IF NOT EXISTS local_cash_shift_currencies (
  shift_id TEXT NOT NULL REFERENCES local_cash_shifts(id),
  currency TEXT NOT NULL CHECK(length(currency) BETWEEN 3 AND 16 AND currency = upper(currency)),
  PRIMARY KEY (shift_id, currency)
);

ALTER TABLE local_cash_movements ADD COLUMN currency TEXT;
ALTER TABLE local_cash_movements ADD COLUMN kind TEXT CHECK(kind IS NULL OR kind IN (
  'opening_float',
  'cash_in',
  'cash_out',
  'expense',
  'correction',
  'order_cash',
  'messenger_return'
));
ALTER TABLE local_cash_movements ADD COLUMN category TEXT;
ALTER TABLE local_cash_movements ADD COLUMN source_type TEXT;
ALTER TABLE local_cash_movements ADD COLUMN source_id TEXT;
ALTER TABLE local_cash_movements ADD COLUMN operator_id TEXT;
ALTER TABLE local_cash_movements ADD COLUMN corrects_movement_id TEXT REFERENCES local_cash_movements(id);

CREATE INDEX IF NOT EXISTS idx_local_cash_movements_shift_currency
  ON local_cash_movements(shift_id, currency);
CREATE INDEX IF NOT EXISTS idx_local_cash_movements_source
  ON local_cash_movements(source_type, source_id);

CREATE TABLE IF NOT EXISTS local_cash_shift_counts (
  id TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL REFERENCES local_cash_shifts(id),
  currency TEXT NOT NULL,
  expected_minor INTEGER NOT NULL,
  counted_minor INTEGER NOT NULL CHECK(counted_minor >= 0),
  difference_minor INTEGER NOT NULL CHECK(difference_minor = counted_minor - expected_minor),
  counted_at TEXT NOT NULL,
  counted_by TEXT,
  UNIQUE(shift_id, currency)
);

-- Kind/direction coherence for ledger rows written by 0004+ code.
CREATE TRIGGER IF NOT EXISTS trg_cash_movements_kind_direction
BEFORE INSERT ON local_cash_movements
WHEN NEW.kind IS NOT NULL AND (
  (NEW.kind IN ('opening_float','cash_in','order_cash','messenger_return') AND NEW.direction <> 'in')
  OR (NEW.kind IN ('cash_out','expense') AND NEW.direction <> 'out')
  OR NEW.currency IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'cash movement kind/direction/currency mismatch');
END;

-- Movements can only be added to an open shift.
CREATE TRIGGER IF NOT EXISTS trg_cash_movements_open_shift_only
BEFORE INSERT ON local_cash_movements
WHEN (SELECT status FROM local_cash_shifts WHERE id = NEW.shift_id) IS NOT 'open'
BEGIN
  SELECT RAISE(ABORT, 'cash movement requires an open shift');
END;

-- A correction must reference a movement of the same shift.
CREATE TRIGGER IF NOT EXISTS trg_cash_movements_correction_target
BEFORE INSERT ON local_cash_movements
WHEN NEW.kind = 'correction' AND (
  NEW.corrects_movement_id IS NULL
  OR (SELECT shift_id FROM local_cash_movements WHERE id = NEW.corrects_movement_id) IS NOT NEW.shift_id
)
BEGIN
  SELECT RAISE(ABORT, 'correction must reference a movement of the same shift');
END;

-- Append-only ledger: business columns are immutable; only sync bookkeeping
-- (sync_status) may change.
CREATE TRIGGER IF NOT EXISTS trg_cash_movements_immutable
BEFORE UPDATE OF id, shift_id, business_id, branch_id, device_id, direction, amount_minor, reason,
  occurred_at, currency, kind, category, source_type, source_id, operator_id, corrects_movement_id
ON local_cash_movements
BEGIN
  SELECT RAISE(ABORT, 'cash movements are append-only; record a correction instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_cash_movements_no_delete
BEFORE DELETE ON local_cash_movements
BEGIN
  SELECT RAISE(ABORT, 'cash movements are append-only; record a correction instead');
END;

-- Shift identity and opening data never change after creation.
CREATE TRIGGER IF NOT EXISTS trg_cash_shifts_opening_immutable
BEFORE UPDATE OF id, business_id, branch_id, device_id, currency, opening_float_minor, opened_at, opened_by
ON local_cash_shifts
BEGIN
  SELECT RAISE(ABORT, 'cash shift opening data is immutable');
END;

-- A closed shift cannot be reopened or re-closed.
CREATE TRIGGER IF NOT EXISTS trg_cash_shifts_closed_immutable
BEFORE UPDATE OF status, closed_at, counted_cash_minor, expected_cash_minor, difference_minor, closed_by, close_note
ON local_cash_shifts
WHEN OLD.status = 'closed'
BEGIN
  SELECT RAISE(ABORT, 'closed cash shift is immutable');
END;

-- Closing requires a count for every tracked currency.
CREATE TRIGGER IF NOT EXISTS trg_cash_shifts_close_requires_counts
BEFORE UPDATE OF status ON local_cash_shifts
WHEN NEW.status = 'closed' AND EXISTS (
  SELECT 1 FROM local_cash_shift_currencies c
  WHERE c.shift_id = NEW.id
    AND NOT EXISTS (
      SELECT 1 FROM local_cash_shift_counts k
      WHERE k.shift_id = c.shift_id AND k.currency = c.currency
    )
)
BEGIN
  SELECT RAISE(ABORT, 'every tracked currency must be counted before closing');
END;

CREATE TRIGGER IF NOT EXISTS trg_cash_shifts_no_delete
BEFORE DELETE ON local_cash_shifts
BEGIN
  SELECT RAISE(ABORT, 'cash shifts cannot be deleted');
END;

CREATE TRIGGER IF NOT EXISTS trg_cash_shift_counts_immutable
BEFORE UPDATE ON local_cash_shift_counts
BEGIN
  SELECT RAISE(ABORT, 'cash shift counts are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_cash_shift_counts_no_delete
BEFORE DELETE ON local_cash_shift_counts
BEGIN
  SELECT RAISE(ABORT, 'cash shift counts are immutable');
END;

-- Counts are written only while the shift is still open (same transaction
-- that closes it).
CREATE TRIGGER IF NOT EXISTS trg_cash_shift_counts_open_shift_only
BEFORE INSERT ON local_cash_shift_counts
WHEN (SELECT status FROM local_cash_shifts WHERE id = NEW.shift_id) IS NOT 'open'
BEGIN
  SELECT RAISE(ABORT, 'cash count requires an open shift');
END;

-- A sale can only be attached to an open shift.
CREATE TRIGGER IF NOT EXISTS trg_local_sales_open_shift_only
BEFORE INSERT ON local_sales
WHEN NEW.shift_id IS NOT NULL
  AND (SELECT status FROM local_cash_shifts WHERE id = NEW.shift_id) IS NOT 'open'
BEGIN
  SELECT RAISE(ABORT, 'sale can only be attached to an open cash shift');
END;
