-- 0018 — Un cajón por tienda y pedidos web cobrados en la caja (20-oct).
--
-- * The store has ONE cash drawer. The first phone that opens the day counts
--   the floats (store_role 'opener'); the other phones join that same shift
--   (store_role 'joiner'): their local row reuses the store shift id and has
--   no floats, so every sale and movement of the day points to one shift.
--   NULL store_role = shifts opened before this migration (one per device).
-- * A store shift that another phone counted and closed is closed here
--   without counts (closed_remote = 1): the counts live on the phone that
--   counted. Legacy per-device shifts (store_role NULL) cannot.
-- * local_web_order_charges: web orders (gestoras: «Listo para recoger» and
--   deliveries whose messenger brought the cash) charged at the counter. The
--   cash goes into the drawer as order_cash movements (source woocommerce /
--   web_order / <order id>), never as a sale: the web already took the stock.
--   The row is also the offline queue for telling Core «cobrado» and the
--   local guard against charging the same order twice.

ALTER TABLE local_cash_shifts ADD COLUMN store_role TEXT CHECK(store_role IS NULL OR store_role IN ('opener','joiner'));
ALTER TABLE local_cash_shifts ADD COLUMN closed_remote INTEGER NOT NULL DEFAULT 0 CHECK(closed_remote IN (0,1));

DROP TRIGGER IF EXISTS trg_cash_shifts_close_requires_counts;
CREATE TRIGGER IF NOT EXISTS trg_cash_shifts_close_requires_counts
BEFORE UPDATE OF status ON local_cash_shifts
WHEN NEW.status = 'closed' AND NEW.closed_remote = 0 AND EXISTS (
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

CREATE TRIGGER IF NOT EXISTS trg_cash_shifts_remote_close_store_only
BEFORE UPDATE OF status ON local_cash_shifts
WHEN NEW.status = 'closed' AND NEW.closed_remote = 1 AND NEW.store_role IS NULL
BEGIN
  SELECT RAISE(ABORT, 'only a store shift can be closed by another device');
END;

CREATE TABLE IF NOT EXISTS local_web_order_charges (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  order_id INTEGER NOT NULL CHECK(order_id > 0),
  order_number TEXT NOT NULL,
  shift_id TEXT NOT NULL REFERENCES local_cash_shifts(id),
  method TEXT NOT NULL CHECK(method IN ('cash_usd','cash_cup','transfer','mixed','other')),
  usd_minor INTEGER NOT NULL DEFAULT 0 CHECK(usd_minor >= 0),
  cup_minor INTEGER NOT NULL DEFAULT 0 CHECK(cup_minor >= 0),
  cash_usd_minor INTEGER NOT NULL DEFAULT 0 CHECK(cash_usd_minor >= 0),
  cash_cup_minor INTEGER NOT NULL DEFAULT 0 CHECK(cash_cup_minor >= 0),
  payments_json TEXT NOT NULL DEFAULT '[]',
  reference TEXT,
  collection_account TEXT,
  note TEXT,
  staff_id TEXT,
  staff_name TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','done','refused')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  core_message TEXT,
  created_at TEXT NOT NULL,
  done_at TEXT,
  UNIQUE(business_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_local_web_order_charges_status
  ON local_web_order_charges(business_id, status, created_at);
