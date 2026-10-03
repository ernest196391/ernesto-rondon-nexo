-- 0014 — Product photos and cloud stock on the POS.
--
-- * local_products.image_url: photo URL from the cloud catalog (already sent
--   as imageUrl); the catalog checkpoint is dropped once to re-pull it.
-- * local_stock_snapshot: cloud stock per tracked product at fetched_at.
--   The POS shows snapshot minus local sales the snapshot cannot include yet
--   (not synced, or synced after it was taken). Products without a row are
--   not tracked ("sin control") and show no quantity.

ALTER TABLE local_products ADD COLUMN image_url TEXT;

CREATE TABLE IF NOT EXISTS local_stock_snapshot (
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  min_stock INTEGER CHECK(min_stock IS NULL OR min_stock >= 0),
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (business_id, product_id)
);

DELETE FROM local_sync_checkpoints WHERE stream = 'catalog';
