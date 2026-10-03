-- 0013 — Device identity from provisioning.
--
-- One row: the business, branch and device this install belongs to, as the
-- cloud reported for its device key. Until it exists the POS keeps the
-- pilot identity it has always used, so pilot data stays consistent.

CREATE TABLE IF NOT EXISTS local_device_identity (
  singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
  business_id TEXT NOT NULL CHECK(length(trim(business_id)) > 0),
  branch_id TEXT NOT NULL CHECK(length(trim(branch_id)) > 0),
  device_id TEXT NOT NULL CHECK(length(trim(device_id)) > 0),
  label TEXT,
  provisioned_at TEXT NOT NULL
);
