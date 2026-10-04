-- 0016 — Product photo cache for offline selling.
--
-- The POS downloads each product thumbnail (~10 KB, 300 px) once and keeps
-- the bytes here, keyed by URL, so cards show photos without internet. A new
-- URL from the catalog simply gets downloaded again; unused rows are pruned.

CREATE TABLE IF NOT EXISTS local_image_cache (
  url TEXT PRIMARY KEY CHECK(url LIKE 'https://%'),
  content_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  fetched_at TEXT NOT NULL
);
