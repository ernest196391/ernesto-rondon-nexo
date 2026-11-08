-- A post-close rectification is an annotation, never cash in a later drawer.
-- Original movements, counts and closed shifts retain their existing guards.
CREATE TABLE local_cash_rectifications (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  shift_id TEXT NOT NULL REFERENCES local_cash_shifts(id),
  target_movement_id TEXT NOT NULL UNIQUE REFERENCES local_cash_movements(id),
  approval_ref TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL,
  delta_minor INTEGER NOT NULL CHECK(delta_minor <> 0),
  reason TEXT NOT NULL CHECK(length(trim(reason)) > 0),
  operator_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  original_counts_json TEXT NOT NULL,
  revised_counts_json TEXT NOT NULL,
  outbox_id TEXT NOT NULL UNIQUE
);
CREATE TRIGGER cash_rectification_target BEFORE INSERT ON local_cash_rectifications
WHEN NOT EXISTS (
  SELECT 1 FROM local_cash_movements m JOIN local_cash_shifts s ON s.id=m.shift_id
  WHERE m.id=NEW.target_movement_id AND m.shift_id=NEW.shift_id
    AND s.status='closed' AND s.closed_remote=0
    AND s.business_id=NEW.business_id AND s.branch_id=NEW.branch_id AND s.device_id=NEW.device_id
    AND m.business_id=NEW.business_id AND m.device_id=NEW.device_id
    AND m.kind='cash_out' AND m.direction='out' AND m.currency=NEW.currency
    AND m.amount_minor=NEW.delta_minor
) BEGIN SELECT RAISE(ABORT,'rectification requires an owned closed shift and exact cash-out reversal'); END;
CREATE TRIGGER cash_rectification_immutable BEFORE UPDATE ON local_cash_rectifications
BEGIN SELECT RAISE(ABORT,'rectifications are immutable'); END;
CREATE TRIGGER cash_rectification_no_delete BEFORE DELETE ON local_cash_rectifications
BEGIN SELECT RAISE(ABORT,'rectifications cannot be deleted'); END;
