-- 0017 — Favorite products per device (the seller's quick picks).
--
-- Keyed by the card the seller sees: 'p:<product id>' for a simple product,
-- 'v:<parent id>' for a product with variants. Local only: each counter
-- keeps its own quick picks.

CREATE TABLE IF NOT EXISTS local_favorites (
  business_id TEXT NOT NULL,
  card_key TEXT NOT NULL CHECK(card_key LIKE 'p:%' OR card_key LIKE 'v:%'),
  created_at TEXT NOT NULL,
  PRIMARY KEY (business_id, card_key)
);
