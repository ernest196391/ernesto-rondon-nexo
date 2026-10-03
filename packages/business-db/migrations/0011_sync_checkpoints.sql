-- 0011 — Pull checkpoints (ADR-001 pull side).
--
-- One row per stream (e.g. 'catalog') with the last cloud sequence applied.
-- Applying a page of changes and advancing the checkpoint happen in the same
-- transaction, so a crash can never skip or half-apply a page.

CREATE TABLE IF NOT EXISTS local_sync_checkpoints (
  stream TEXT PRIMARY KEY CHECK(length(trim(stream)) > 0),
  last_seq INTEGER NOT NULL DEFAULT 0 CHECK(last_seq >= 0),
  updated_at TEXT NOT NULL
);

-- Checkpoints only move forward.
CREATE TRIGGER IF NOT EXISTS trg_sync_checkpoints_forward_only
BEFORE UPDATE OF last_seq ON local_sync_checkpoints
WHEN NEW.last_seq < OLD.last_seq
BEGIN
  SELECT RAISE(ABORT, 'sync checkpoints only move forward');
END;
