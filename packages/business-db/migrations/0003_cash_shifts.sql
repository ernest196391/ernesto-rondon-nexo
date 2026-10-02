CREATE TABLE IF NOT EXISTS local_cash_shifts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  opening_float_minor INTEGER NOT NULL CHECK(opening_float_minor >= 0),
  status TEXT NOT NULL CHECK(status IN ('open','closed')) DEFAULT 'open',
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  counted_cash_minor INTEGER CHECK(counted_cash_minor >= 0),
  expected_cash_minor INTEGER,
  difference_minor INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_cash_shifts_one_open
  ON local_cash_shifts(business_id, branch_id, device_id)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_local_cash_shifts_lookup
  ON local_cash_shifts(business_id, branch_id, device_id, status, opened_at);

CREATE TABLE IF NOT EXISTS local_cash_movements (
  id TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL REFERENCES local_cash_shifts(id),
  business_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in','out')),
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  reason TEXT NOT NULL CHECK(length(trim(reason)) > 0),
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_local_cash_movements_shift
  ON local_cash_movements(shift_id, occurred_at);

ALTER TABLE local_sales ADD COLUMN shift_id TEXT REFERENCES local_cash_shifts(id);
CREATE INDEX IF NOT EXISTS idx_local_sales_shift ON local_sales(shift_id);
