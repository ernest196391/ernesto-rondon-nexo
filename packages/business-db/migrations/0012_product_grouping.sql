-- 0012 — Product category and variant grouping for the POS catalog.
--
-- The cloud catalog already sends category, variantOf and variantLabel; the
-- POS keeps them so the seller can filter by category and see variants of
-- one product together. Variants stay separate sellable products.
--
-- Devices that already pulled the catalog have a checkpoint past every
-- product, so the catalog checkpoint is dropped once to re-pull it with the
-- new fields (applying a page is idempotent; deleting the row is allowed,
-- only lowering last_seq is not).

ALTER TABLE local_products ADD COLUMN category TEXT;
ALTER TABLE local_products ADD COLUMN variant_of TEXT;
ALTER TABLE local_products ADD COLUMN variant_label TEXT;

CREATE INDEX IF NOT EXISTS idx_local_products_category ON local_products(business_id, category);

DELETE FROM local_sync_checkpoints WHERE stream = 'catalog';
