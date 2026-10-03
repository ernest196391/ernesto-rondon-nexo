use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::{
    self, CashError, MovementKind, OpenShiftInput, OpeningFloatInput, RecordMovementInput, ShiftScope,
};
use nexo_business_db::messenger_custody::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn
}

fn scope() -> ShiftScope {
    ShiftScope {
        business_id: "biz".into(),
        branch_id: "main".into(),
        device_id: "pos-1".into(),
    }
}

fn order(id: &str) -> CustodySource {
    CustodySource {
        source_system: "WooCommerce".into(),
        source_type: "order".into(),
        source_id: id.into(),
    }
}

fn collect(entry: &str, messenger: &str, order_id: &str, currency: &str, amount: i64) -> RecordCollectionInput {
    RecordCollectionInput {
        entry_id: entry.into(),
        outbox_id: format!("ob-{entry}"),
        messenger_id: messenger.into(),
        source: order(order_id),
        currency: currency.into(),
        amount_minor: amount,
        operator_id: None,
        occurred_at: "2026-10-02T12:00:00Z".into(),
    }
}

fn hand_over(entry: &str, messenger: &str, order_id: &str, currency: &str, amount: i64) -> RecordReturnInput {
    RecordReturnInput {
        entry_id: entry.into(),
        outbox_id: format!("ob-{entry}"),
        cash_movement_id: format!("mv-{entry}"),
        messenger_id: messenger.into(),
        source: order(order_id),
        currency: currency.into(),
        amount_minor: amount,
        operator_id: None,
        occurred_at: "2026-10-02T18:00:00Z".into(),
    }
}

fn write_off(entry: &str, order_id: &str, amount: i64, reason: &str) -> CustodyWriteOffInput {
    CustodyWriteOffInput {
        entry_id: entry.into(),
        outbox_id: format!("ob-{entry}"),
        messenger_id: "msg-1".into(),
        source: order(order_id),
        currency: "USD".into(),
        amount_minor: amount,
        reason: reason.into(),
        operator_id: None,
        occurred_at: "2026-10-02T19:00:00Z".into(),
    }
}

fn open_shift(conn: &mut Connection) {
    cash_shift::open_shift(
        conn,
        &scope(),
        &OpenShiftInput {
            shift_id: "shift-1".into(),
            outbox_id: "ob-shift-1".into(),
            operator_id: None,
            primary_currency: "USD".into(),
            location_id: None,
            opening_floats: vec![OpeningFloatInput {
                movement_id: "float-1".into(),
                currency: "USD".into(),
                amount_minor: 1_000,
            }],
            opened_at: "2026-10-02T08:00:00Z".into(),
        },
    )
    .unwrap();
}

fn count(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

fn usd(balances: &[CustodyBalance]) -> &CustodyBalance {
    balances.iter().find(|b| b.currency == "USD").unwrap()
}

#[test]
fn collected_cash_is_custody_until_returned_into_the_drawer() {
    let mut conn = db();
    open_shift(&mut conn);
    let held = record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "usd", 2_500)).unwrap();
    assert_eq!(usd(&held).outstanding_minor, 2_500);
    // Custody never changes the drawer.
    let before = cash_shift::currency_totals(&conn, "shift-1").unwrap()["USD"].expected_minor;
    assert_eq!(before, 1_000);

    let after = record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 2_500)).unwrap();
    assert_eq!(usd(&after).outstanding_minor, 0);
    assert_eq!(usd(&after).returned_minor, 2_500);
    assert_eq!(cash_shift::currency_totals(&conn, "shift-1").unwrap()["USD"].expected_minor, 3_500);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type LIKE 'messenger_custody.%'"), 2);
}

#[test]
fn split_usd_cup_collection_is_tracked_per_currency() {
    let mut conn = db();
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 2_000)).unwrap();
    let both = record_collection(&mut conn, &scope(), &collect("c2", "msg-1", "2608", "CUP", 150_000)).unwrap();
    assert_eq!(both.len(), 2);
    assert_eq!(both.iter().find(|b| b.currency == "CUP").unwrap().outstanding_minor, 150_000);
}

#[test]
fn return_requires_an_open_shift_and_rolls_back_cleanly() {
    let mut conn = db();
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 500)).unwrap();
    let err = record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 500)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_messenger_custody_entries WHERE kind='returned'"), 0);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_cash_movements"), 0);
}

#[test]
fn cannot_return_more_than_collected_or_for_another_messenger() {
    let mut conn = db();
    open_shift(&mut conn);
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 500)).unwrap();
    let err = record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 501)).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    let err = record_return(&mut conn, &scope(), &hand_over("r2", "msg-2", "2608", "USD", 500)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
    let err = record_return(&mut conn, &scope(), &hand_over("r3", "msg-1", "9999", "USD", 1)).unwrap_err();
    assert!(matches!(err, CashError::NotFound(_)));
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_cash_movements WHERE kind='messenger_return'"), 0);
}

#[test]
fn short_return_is_settled_with_a_reasoned_write_off() {
    let mut conn = db();
    open_shift(&mut conn);
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 1_000)).unwrap();
    record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 900)).unwrap();
    assert!(write_off_custody(&mut conn, &scope(), &write_off("w0", "2608", 100, " ")).is_err());
    let settled = write_off_custody(&mut conn, &scope(), &write_off("w1", "2608", 100, "Billete roto")).unwrap();
    assert_eq!(usd(&settled).outstanding_minor, 0);
    assert_eq!(usd(&settled).written_off_minor, 100);
    // A second return for the same order/currency is impossible.
    assert!(record_return(&mut conn, &scope(), &hand_over("r2", "msg-1", "2608", "USD", 1)).is_err());
}

#[test]
fn order_cash_is_collected_once_and_retries_are_idempotent() {
    let mut conn = db();
    open_shift(&mut conn);
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 500)).unwrap();
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 500)).unwrap();
    let err = record_collection(&mut conn, &scope(), &collect("c9", "msg-2", "2608", "USD", 500)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
    record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 500)).unwrap();
    record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 500)).unwrap();
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_messenger_custody_entries"), 2);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_cash_movements WHERE kind='messenger_return'"), 1);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type LIKE 'messenger_custody.%'"), 2);
}

#[test]
fn direct_messenger_return_blocks_a_later_custody_return() {
    // A drawer return recorded through the generic movement API still counts once.
    let mut conn = db();
    open_shift(&mut conn);
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 500)).unwrap();
    cash_shift::record_movement(
        &mut conn,
        &scope(),
        &RecordMovementInput {
            movement_id: "direct".into(),
            outbox_id: "ob-direct".into(),
            shift_id: "shift-1".into(),
            kind: MovementKind::MessengerReturn,
            direction: None,
            currency: "USD".into(),
            amount_minor: 500,
            reason: "Entrega".into(),
            category: None,
            source_system: Some("woocommerce".into()),
            source_type: Some("order".into()),
            source_id: Some("2608".into()),
            corrects_movement_id: None,
            operator_id: None,
            occurred_at: "2026-10-02T18:00:00Z".into(),
        },
    )
    .unwrap();
    let err = record_return(&mut conn, &scope(), &hand_over("r1", "msg-1", "2608", "USD", 500)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
}

#[test]
fn schema_rejects_unpaired_or_excess_settlements() {
    let mut conn = db();
    record_collection(&mut conn, &scope(), &collect("c1", "msg-1", "2608", "USD", 500)).unwrap();
    let excess = conn.execute(
        "INSERT INTO local_messenger_custody_entries (id,business_id,device_id,messenger_id,kind,source_system,source_type,source_id,currency,amount_minor,reason,occurred_at)
         VALUES ('x','biz','pos-1','msg-1','write_off','woocommerce','order','2608','USD',900,'r','t')",
        [],
    );
    assert!(excess.unwrap_err().to_string().contains("cannot exceed"));
    let unpaired = conn.execute(
        "INSERT INTO local_messenger_custody_entries (id,business_id,device_id,messenger_id,kind,source_system,source_type,source_id,currency,amount_minor,cash_movement_id,occurred_at)
         VALUES ('y','biz','pos-1','msg-1','returned','woocommerce','order','2608','USD',100,NULL,'t')",
        [],
    );
    assert!(unpaired.is_err());
    assert!(conn.execute("UPDATE local_messenger_custody_entries SET amount_minor=1", []).is_err());
    assert!(conn.execute("DELETE FROM local_messenger_custody_entries", []).is_err());
}
