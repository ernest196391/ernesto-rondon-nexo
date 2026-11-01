-- 0019 — Cancelar o devolver un pedido web desde la caja (Ernesto 31-oct, caso de la olla Ariete).
--
-- * local_web_order_actions: one row per «Cancelar» or «Devolución» of a web
--   order (#5xxx) done at the counter. It is the offline queue that tells Core
--   (status queued → done, or refused when Core says no) and the local guard
--   against doing the same thing twice: its id is the idempotency key Core
--   receives (actionId), so a retry never cancels or returns twice.
-- * A return that gives cash back takes it out of the drawer at once as a
--   cash_out movement LINKED to the order (category 'devolucion_pedido',
--   source woocommerce / web_order_return / <order id>), never as «Otro». The
--   cloud asks Lennys to approve it (fund_exit_approvals), like every exit.
--   Transfers do not touch the drawer: they travel in the action event.

CREATE TABLE IF NOT EXISTS local_web_order_actions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('cancel','return')),
  order_id INTEGER NOT NULL CHECK(order_id > 0),
  order_number TEXT NOT NULL,
  shift_id TEXT REFERENCES local_cash_shifts(id),
  reason TEXT NOT NULL,
  products_text TEXT,
  lines_json TEXT NOT NULL DEFAULT '[]',
  refunds_json TEXT NOT NULL DEFAULT '[]',
  refund_method TEXT NOT NULL DEFAULT 'none' CHECK(refund_method IN ('none','cash','transfer','mixed')),
  refund_usd_minor INTEGER NOT NULL DEFAULT 0 CHECK(refund_usd_minor >= 0),
  refund_cup_minor INTEGER NOT NULL DEFAULT 0 CHECK(refund_cup_minor >= 0),
  cash_usd_minor INTEGER NOT NULL DEFAULT 0 CHECK(cash_usd_minor >= 0),
  cash_cup_minor INTEGER NOT NULL DEFAULT 0 CHECK(cash_cup_minor >= 0),
  staff_id TEXT,
  staff_name TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','done','refused')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  core_message TEXT,
  created_at TEXT NOT NULL,
  done_at TEXT
);
CREATE INDEX IF NOT EXISTS local_web_order_actions_queue_idx ON local_web_order_actions (business_id, status, created_at);
-- One live action of each kind per order on this phone (a refused one can be tried again with a new id).
CREATE UNIQUE INDEX IF NOT EXISTS local_web_order_actions_live_idx ON local_web_order_actions (business_id, order_id, kind) WHERE status <> 'refused';
