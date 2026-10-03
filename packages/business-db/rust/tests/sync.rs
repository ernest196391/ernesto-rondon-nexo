use nexo_business_db::apply_all_migrations;
use nexo_business_db::sync::*;
use rusqlite::{params, Connection};

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    apply_all_migrations(&conn).unwrap();
    for (i, id) in ["e1", "e2", "e3"].iter().enumerate() {
        conn.execute(
            "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at)
             VALUES (?1,'biz','pos-1','sale.completed','sale',?1,?2,?3)",
            params![id, format!("{{\"event_id\":\"{id}\",\"payload\":{{\"n\":{i}}}}}"), format!("2026-10-02T10:00:0{i}Z")],
        )
        .unwrap();
    }
    conn
}

const NOW: &str = "2026-10-03T12:00:00Z";

fn ok(id: &str, status: PushStatus) -> PushResult {
    PushResult { event_id: id.into(), status, error: None }
}

#[test]
fn pending_batch_is_oldest_first_and_parses_the_envelope() {
    let conn = db();
    let batch = pending_batch(&conn, NOW, 2).unwrap();
    assert_eq!(batch.iter().map(|e| e.event_id.as_str()).collect::<Vec<_>>(), ["e1", "e2"]);
    assert_eq!(batch[1].envelope["payload"]["n"], 1);
}

#[test]
fn applied_and_duplicate_both_mark_synced() {
    let mut conn = db();
    let state = record_push_results(&mut conn, &[ok("e1", PushStatus::Applied), ok("e2", PushStatus::Duplicate)], NOW).unwrap();
    assert_eq!((state.pending, state.synced), (1, 2));
    assert_eq!(pending_batch(&conn, NOW, 10).unwrap().len(), 1);
}

#[test]
fn rejection_backs_off_and_keeps_the_event() {
    let mut conn = db();
    let rejected = PushResult { event_id: "e1".into(), status: PushStatus::Rejected, error: Some("invariant".into()) };
    let state = record_push_results(&mut conn, &[rejected], NOW).unwrap();
    assert_eq!((state.pending, state.failing), (3, 1));
    assert_eq!(state.last_error.as_deref(), Some("invariant"));
    // Not due again until the backoff passes.
    assert!(pending_batch(&conn, NOW, 10).unwrap().iter().all(|e| e.event_id != "e1"));
    let later = pending_batch(&conn, "2026-10-03T12:00:31Z", 10).unwrap();
    assert!(later.iter().any(|e| e.event_id == "e1" && e.attempts == 1));
}

#[test]
fn transport_failure_backs_off_exponentially_with_a_cap() {
    let mut conn = db();
    let ids = vec!["e1".to_string()];
    record_transport_failure(&mut conn, &ids, "sin conexión", NOW).unwrap();
    record_transport_failure(&mut conn, &ids, "sin conexión", NOW).unwrap();
    let next: String = conn.query_row("SELECT next_attempt_at FROM local_outbox WHERE id='e1'", [], |r| r.get(0)).unwrap();
    assert_eq!(next, "2026-10-03T12:01:00.000Z");
    assert_eq!(backoff_secs(1), 30);
    assert_eq!(backoff_secs(3), 120);
    assert_eq!(backoff_secs(50), 3_600);
}

#[test]
fn synced_events_are_never_resent_or_reopened() {
    let mut conn = db();
    record_push_results(&mut conn, &[ok("e1", PushStatus::Applied)], NOW).unwrap();
    // A late rejection or failure for an already synced event changes nothing.
    record_transport_failure(&mut conn, &["e1".to_string()], "late", NOW).unwrap();
    let synced: Option<String> = conn.query_row("SELECT synced_at FROM local_outbox WHERE id='e1'", [], |r| r.get(0)).unwrap();
    assert_eq!(synced.as_deref(), Some(NOW));
    assert_eq!(sync_state(&conn).unwrap().synced, 1);
}
