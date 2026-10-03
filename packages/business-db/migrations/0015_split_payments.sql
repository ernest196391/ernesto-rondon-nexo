-- 0015 — Split payments and exchange rates.
--
-- * local_payments.usd_minor: USD value of each payment at the sale's rate;
--   the payments of a sale add up exactly to its USD total.
-- * local_payments.exchange_rate: units of the payment currency per USD used
--   (text, as entered by the owner; NULL for USD).
-- * local_exchange_rates: rates in force pulled from the cloud (set by hand
--   by the owners in the dashboard).

ALTER TABLE local_payments ADD COLUMN usd_minor INTEGER;
ALTER TABLE local_payments ADD COLUMN exchange_rate TEXT;

CREATE TABLE IF NOT EXISTS local_exchange_rates (
  business_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  per_usd TEXT NOT NULL,
  set_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (business_id, currency)
);
