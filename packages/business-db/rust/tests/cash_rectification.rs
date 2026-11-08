use nexo_business_db::{apply_all_migrations, cash_rectification::*, cash_shift::ShiftScope};
use rusqlite::{types::Value, Connection};

fn scope() -> ShiftScope {
    ShiftScope {
        business_id: "biz".into(),
        branch_id: "branch".into(),
        device_id: "device".into(),
    }
}
fn plan() -> ApprovedRectification<'static> {
    ApprovedRectification {
        id: "rect",
        event_id: "rect-event",
        business_id: "biz",
        device_id: "device",
        approval_ref: "owner:1258",
        shift_id: "shift",
        target_id: "cup",
        currency: "CUP",
        amount_minor: 200,
        reason: "Error de moneda autorizado",
        protected_id: "usd",
        protected_currency: "USD",
        protected_amount_minor: 200,
        expected_counts: &[("CUP", 4261210, 4264000), ("USD", 64300, 64300)],
    }
}
fn fixture() -> Connection {
    let c = Connection::open_in_memory().unwrap();
    c.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&c).unwrap();
    c.execute_batch("INSERT INTO local_cash_shifts(id,business_id,branch_id,device_id,currency,opening_float_minor,status,opened_at) VALUES('shift','biz','branch','device','CUP',0,'open','2026-11-08T10:00:00Z');
 INSERT INTO local_cash_movements(id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind) VALUES
 ('cup','shift','biz','branch','device','out',200,'pago Ely','2026-11-08T16:50:00Z','CUP','cash_out'),
 ('usd','shift','biz','branch','device','out',200,'pago Ely','2026-11-08T17:00:00Z','USD','cash_out');
 INSERT INTO local_cash_shift_currencies VALUES('shift','CUP'),('shift','USD');
 INSERT INTO local_cash_shift_counts(id,shift_id,currency,expected_minor,counted_minor,difference_minor,counted_at) VALUES
 ('count-cup','shift','CUP',4261210,4264000,2790,'2026-11-08T20:13:23Z'),
 ('count-usd','shift','USD',64300,64300,0,'2026-11-08T20:13:23Z');
 UPDATE local_cash_shifts SET status='closed',closed_at='2026-11-08T20:13:23Z' WHERE id='shift';
 INSERT INTO local_cash_shifts(id,business_id,branch_id,device_id,currency,opening_float_minor,status,opened_at) VALUES('next','biz','branch','device','CUP',4264000,'open','2026-11-09T10:00:00Z');").unwrap();
    c
}
fn snapshot(c: &Connection) -> Vec<Vec<Vec<Value>>> {
    [
        "local_cash_movements",
        "local_cash_shifts",
        "local_cash_shift_counts",
    ]
    .iter()
    .map(|t| {
        let mut stmt = c
            .prepare(&format!("SELECT * FROM {t} ORDER BY id"))
            .unwrap();
        let n = stmt.column_count();
        stmt.query_map([], |r| (0..n).map(|i| r.get::<_, Value>(i)).collect())
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap()
    })
    .collect()
}
const AT: &str = "2026-11-08T21:00:00Z";
#[test]
fn rectifies_history_without_modifying_cash_close_usd_or_next_shift() {
    let mut c = fixture();
    let before = snapshot(&c);
    let r = apply(&mut c, &scope(), &plan(), "clerk", AT).unwrap();
    assert!(r.applied);
    assert!(!r.synced);
    assert_eq!(snapshot(&c), before);
    assert_eq!(r.original_counts[0].difference_minor, 2790);
    assert_eq!(r.revised_counts[0].difference_minor, 2590);
    assert_eq!(r.original_counts[1], r.revised_counts[1]);
    let payload: String = c
        .query_row(
            "SELECT payload_json FROM local_outbox WHERE id='rect-event'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    let json: serde_json::Value = serde_json::from_str(&payload).unwrap();
    assert_eq!(json["payload"]["drawer_effect_minor"], 0);
}
#[test]
fn retries_create_one_annotation_and_one_event() {
    let mut c = fixture();
    for _ in 0..4 {
        apply(&mut c, &scope(), &plan(), "clerk", AT).unwrap();
    }
    for t in ["local_cash_rectifications", "local_outbox"] {
        assert_eq!(
            c.query_row(&format!("SELECT count(*) FROM {t}"), [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
    c.execute(
        "UPDATE local_outbox SET synced_at=?1 WHERE id='rect-event'",
        [AT],
    )
    .unwrap();
    assert!(preview(&c, &scope(), &plan()).unwrap().synced);
}
#[test]
fn wrong_device_branch_amount_currency_or_protected_movement_are_rejected() {
    let mut c = fixture();
    let before = snapshot(&c);
    let mut s = scope();
    s.device_id = "other".into();
    assert!(apply(&mut c, &s, &plan(), "clerk", AT).is_err());
    s = scope();
    s.branch_id = "other".into();
    assert!(apply(&mut c, &s, &plan(), "clerk", AT).is_err());
    let mut p = plan();
    p.amount_minor = 200000;
    assert!(apply(&mut c, &scope(), &p, "clerk", AT).is_err());
    p = plan();
    p.currency = "USD";
    assert!(apply(&mut c, &scope(), &p, "clerk", AT).is_err());
    p = plan();
    p.protected_amount_minor = 300;
    assert!(apply(&mut c, &scope(), &p, "clerk", AT).is_err());
    assert_eq!(snapshot(&c), before);
}
#[test]
fn original_records_and_rectification_cannot_be_changed_or_deleted() {
    let mut c = fixture();
    apply(&mut c, &scope(), &plan(), "clerk", AT).unwrap();
    for sql in [
        "DELETE FROM local_cash_rectifications",
        "UPDATE local_cash_rectifications SET delta_minor=300",
        "DELETE FROM local_cash_movements",
        "UPDATE local_cash_movements SET currency='USD'",
        "UPDATE local_cash_shifts SET status='open' WHERE id='shift'",
    ] {
        assert!(c.execute(sql, []).is_err(), "{sql}");
    }
}
#[test]
fn outbox_failure_rolls_back_annotation() {
    let mut c = fixture();
    c.execute_batch("CREATE TRIGGER fail_event BEFORE INSERT ON local_outbox BEGIN SELECT RAISE(ABORT,'failure fixture'); END;").unwrap();
    let before = snapshot(&c);
    assert!(apply(&mut c, &scope(), &plan(), "clerk", AT).is_err());
    assert_eq!(snapshot(&c), before);
    assert_eq!(
        c.query_row("SELECT count(*) FROM local_cash_rectifications", [], |r| {
            r.get::<_, i64>(0)
        })
        .unwrap(),
        0
    );
}
#[test]
fn approval_reuse_and_backdating_are_rejected() {
    let mut c = fixture();
    assert!(apply(&mut c, &scope(), &plan(), "clerk", "2026-11-08T20:00:00Z").is_err());
    assert!(apply(&mut c, &scope(), &plan(), "", AT).is_err());
    apply(&mut c, &scope(), &plan(), "clerk", AT).unwrap();
    let mut p = plan();
    p.id = "another";
    p.event_id = "another-event";
    assert!(apply(&mut c, &scope(), &p, "clerk", AT).is_err());
}
#[test]
fn changed_close_is_not_rectified() {
    let mut c = fixture();
    let mut p = plan();
    p.expected_counts = &[("CUP", 1, 2), ("USD", 64300, 64300)];
    assert!(apply(&mut c, &scope(), &p, "clerk", AT).is_err());
    assert_eq!(
        c.query_row("SELECT count(*) FROM local_cash_rectifications", [], |r| {
            r.get::<_, i64>(0)
        })
        .unwrap(),
        0
    );
}
#[test]
fn consistent_backup_and_restart_retain_history_and_single_rectification() {
    let c = fixture();
    let original = snapshot(&c);
    let path = std::env::temp_dir().join(format!(
        "cv1258-test-{}.db",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    c.execute("VACUUM INTO ?1", [path.to_str().unwrap()])
        .unwrap();
    {
        let mut copy = Connection::open(&path).unwrap();
        copy.pragma_update(None, "foreign_keys", "ON").unwrap();
        assert_eq!(snapshot(&copy), original);
        apply(&mut copy, &scope(), &plan(), "clerk", AT).unwrap();
    }
    {
        let mut reopened = Connection::open(&path).unwrap();
        assert_eq!(snapshot(&reopened), original);
        let result = apply(&mut reopened, &scope(), &plan(), "clerk", AT).unwrap();
        assert!(result.applied);
        assert_eq!(
            reopened
                .query_row("SELECT count(*) FROM local_outbox", [], |r| r
                    .get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
    std::fs::remove_file(path).unwrap();
}
