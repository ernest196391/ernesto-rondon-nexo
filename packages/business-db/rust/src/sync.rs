//! Outbox push bookkeeping (ADR-001). The transport (HTTP) lives in the shell;
//! this module only decides what to send next and records the server's answer.
//!
//! * Pending = not synced and due (`next_attempt_at` empty or past), oldest first.
//! * `applied` and `duplicate` both mean the server holds the event: the row is
//!   marked synced. A duplicate is the normal answer to a retry.
//! * `rejected` and transport failures keep the row, store the error and back
//!   off exponentially (30 s, 1 min, 2 min… capped at 1 h). Nothing is deleted:
//!   the queue can never be cleared destructively.

use crate::cash_shift::{CashError, CashResult};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

const BASE_BACKOFF_SECS: i64 = 30;
const MAX_BACKOFF_SECS: i64 = 3_600;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboxEvent {
    pub event_id: String,
    pub business_id: String,
    pub device_id: String,
    pub operation_type: String,
    pub entity_type: String,
    pub entity_id: String,
    pub occurred_at: String,
    pub attempts: i64,
    /// The stored envelope (contract_version, idempotency_key, payload…).
    pub envelope: serde_json::Value,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PushStatus {
    Applied,
    Duplicate,
    Rejected,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PushResult {
    pub event_id: String,
    pub status: PushStatus,
    pub error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncState {
    pub pending: i64,
    pub failing: i64,
    pub synced: i64,
    pub oldest_pending_at: Option<String>,
    pub last_error: Option<String>,
}

/// Seconds to wait after the n-th failed attempt (n starts at 1).
pub fn backoff_secs(attempts: i64) -> i64 {
    let exp = (attempts - 1).clamp(0, 20) as u32;
    (BASE_BACKOFF_SECS.saturating_mul(1_i64 << exp)).min(MAX_BACKOFF_SECS)
}

/// Up to `limit` events that are due at `now` (RFC 3339 UTC), oldest first.
pub fn pending_batch(conn: &Connection, now: &str, limit: i64) -> CashResult<Vec<OutboxEvent>> {
    let mut stmt = conn.prepare(
        "SELECT id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, attempts, payload_json
         FROM local_outbox
         WHERE synced_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?1)
         ORDER BY occurred_at, rowid
         LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![now, limit.clamp(1, 500)], |row| {
        Ok((
            OutboxEvent {
                event_id: row.get(0)?,
                business_id: row.get(1)?,
                device_id: row.get(2)?,
                operation_type: row.get(3)?,
                entity_type: row.get(4)?,
                entity_id: row.get(5)?,
                occurred_at: row.get(6)?,
                attempts: row.get(7)?,
                envelope: serde_json::Value::Null,
            },
            row.get::<_, String>(8)?,
        ))
    })?;
    let mut events = Vec::new();
    for row in rows {
        let (mut event, payload) = row?;
        event.envelope = serde_json::from_str(&payload)
            .map_err(|e| CashError::Db(format!("outbox {} payload: {e}", event.event_id)))?;
        events.push(event);
    }
    Ok(events)
}

fn add_secs(now: &str, secs: i64) -> CashResult<String> {
    // `now` is produced by the shell as RFC 3339 UTC; SQLite does the math so
    // the crate needs no date library.
    let conn = Connection::open_in_memory()?;
    let at: Option<String> = conn
        .query_row(
            "SELECT strftime('%Y-%m-%dT%H:%M:%fZ', ?1, ?2)",
            params![now, format!("+{secs} seconds")],
            |row| row.get(0),
        )
        .optional()?
        .flatten();
    at.ok_or_else(|| CashError::Validation("Fecha de sincronización inválida".into()))
}

fn record_failure(conn: &Connection, event_id: &str, error: &str, now: &str) -> CashResult<()> {
    let attempts: Option<i64> = conn
        .query_row(
            "SELECT attempts FROM local_outbox WHERE id=?1 AND synced_at IS NULL",
            [event_id],
            |row| row.get(0),
        )
        .optional()?;
    let Some(attempts) = attempts else { return Ok(()) };
    let next = add_secs(now, backoff_secs(attempts + 1))?;
    let error: String = error.chars().take(500).collect();
    conn.execute(
        "UPDATE local_outbox SET attempts=attempts+1, next_attempt_at=?2, last_error=?3 WHERE id=?1 AND synced_at IS NULL",
        params![event_id, next, error],
    )?;
    Ok(())
}

/// Applies the server's per-event answers in one transaction.
pub fn record_push_results(conn: &mut Connection, results: &[PushResult], now: &str) -> CashResult<SyncState> {
    let tx = conn.transaction()?;
    for result in results {
        match result.status {
            PushStatus::Applied | PushStatus::Duplicate => {
                tx.execute(
                    "UPDATE local_outbox SET synced_at=?2, last_error=NULL, next_attempt_at=NULL WHERE id=?1 AND synced_at IS NULL",
                    params![result.event_id, now],
                )?;
            }
            PushStatus::Rejected => {
                let error = result.error.as_deref().unwrap_or("rechazado por el servidor");
                record_failure(&tx, &result.event_id, error, now)?;
            }
        }
    }
    tx.commit()?;
    sync_state(conn)
}

/// A transport failure (no network, timeout, 5xx) for a whole batch.
pub fn record_transport_failure(
    conn: &mut Connection,
    event_ids: &[String],
    error: &str,
    now: &str,
) -> CashResult<SyncState> {
    let tx = conn.transaction()?;
    for event_id in event_ids {
        record_failure(&tx, event_id, error, now)?;
    }
    tx.commit()?;
    sync_state(conn)
}

pub fn sync_state(conn: &Connection) -> CashResult<SyncState> {
    Ok(conn.query_row(
        "SELECT
           COALESCE(SUM(synced_at IS NULL), 0),
           COALESCE(SUM(synced_at IS NULL AND attempts > 0), 0),
           COALESCE(SUM(synced_at IS NOT NULL), 0),
           MIN(CASE WHEN synced_at IS NULL THEN occurred_at END),
           (SELECT last_error FROM local_outbox WHERE synced_at IS NULL AND last_error IS NOT NULL ORDER BY rowid DESC LIMIT 1)
         FROM local_outbox",
        [],
        |row| {
            Ok(SyncState {
                pending: row.get(0)?,
                failing: row.get(1)?,
                synced: row.get(2)?,
                oldest_pending_at: row.get(3)?,
                last_error: row.get(4)?,
            })
        },
    )?)
}
