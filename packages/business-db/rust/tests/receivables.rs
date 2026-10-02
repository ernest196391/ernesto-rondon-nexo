use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::{self, CashError, OpenShiftInput, OpeningFloatInput, ShiftScope};
use nexo_business_db::receivables::*;
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

fn open_input(id: &str, source: &str, currency: &str, amount: i64) -> OpenReceivableInput {
    OpenReceivableInput {
        receivable_id: id.into(),
        outbox_id: format!("ob-{id}"),
        customer_id: "cust-1".into(),
        source_system: "nexo".into(),
        source_type: "sale".into(),
        source_id: source.into(),
        currency: currency.into(),
        amount_minor: amount,
        due_at: Some("2026-10-30".into()),
        note: None,
        operator_id: Some("op-1".into()),
        created_at: "2026-10-02T10:00:00Z".into(),
    }
}

fn pay(entry: &str, receivable: &str, amount: i64, rail: PaymentRail) -> ReceivablePaymentInput {
    ReceivablePaymentInput {
        entry_id: entry.into(),
        outbox_id: format!("ob-{entry}"),
        receivable_id: receivable.into(),
        amount_minor: amount,
        rail,
        provider: None,
        channel: None,
        external_ref: None,
        cash_movement_id: Some(format!("mv-{entry}")),
        operator_id: None,
        occurred_at: "2026-10-03T10:00:00Z".into(),
    }
}

fn write_off(entry: &str, receivable: &str, amount: i64, reason: &str) -> ReceivableWriteOffInput {
    ReceivableWriteOffInput {
        entry_id: entry.into(),
        outbox_id: format!("ob-{entry}"),
        receivable_id: receivable.into(),
        amount_minor: amount,
        reason: reason.into(),
        operator_id: None,
        occurred_at: "2026-10-04T10:00:00Z".into(),
    }
}

fn open_shift(conn: &mut Connection, currency: &str) -> String {
    cash_shift::open_shift(
        conn,
        &scope(),
        &OpenShiftInput {
            shift_id: "shift-1".into(),
            outbox_id: "ob-shift-1".into(),
            operator_id: None,
            primary_currency: currency.into(),
            location_id: None,
            opening_floats: vec![OpeningFloatInput {
                movement_id: "float-1".into(),
                currency: currency.into(),
                amount_minor: 1_000,
            }],
            opened_at: "2026-10-03T08:00:00Z".into(),
        },
    )
    .unwrap();
    "shift-1".into()
}

fn count(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn credit_sale_partial_payments_settle_the_balance() {
    let mut conn = db();
    let opened = open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "cup", 10_000)).unwrap();
    assert_eq!(opened.currency, "CUP");
    assert_eq!(opened.balance_minor, 10_000);
    assert_eq!(opened.status, "open");

    let after = record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 4_000, PaymentRail::Transfer)).unwrap();
    assert_eq!(after.paid_minor, 4_000);
    assert_eq!(after.balance_minor, 6_000);

    let settled = record_receivable_payment(&mut conn, &scope(), &pay("p2", "r1", 6_000, PaymentRail::Cash)).unwrap();
    assert_eq!(settled.balance_minor, 0);
    assert_eq!(settled.status, "settled");

    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type LIKE 'receivable.%'"), 3);
    assert!(customer_open_receivables(&conn, "biz", "cust-1").unwrap().is_empty());
}

#[test]
fn cannot_overpay_or_over_write_off() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 500)).unwrap();
    let err = record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 501, PaymentRail::Cash)).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    let err = write_off_receivable(&mut conn, &scope(), &write_off("w1", "r1", 600, "Cliente se fue")).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_receivable_entries"), 0);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox"), 1);
}

#[test]
fn schema_rejects_overpayment_even_without_the_repository() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 500)).unwrap();
    let result = conn.execute(
        "INSERT INTO local_receivable_entries (id,receivable_id,business_id,device_id,kind,currency,amount_minor,rail,occurred_at)
         VALUES ('x','r1','biz','pos-1','payment','USD',900,'cash','t')",
        [],
    );
    assert!(result.unwrap_err().to_string().contains("cannot exceed"));
    let result = conn.execute(
        "INSERT INTO local_receivable_entries (id,receivable_id,business_id,device_id,kind,currency,amount_minor,rail,occurred_at)
         VALUES ('y','r1','biz','pos-1','payment','CUP',100,'cash','t')",
        [],
    );
    assert!(result.unwrap_err().to_string().contains("currency"));
}

#[test]
fn write_off_needs_a_reason_and_reduces_balance() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    assert!(write_off_receivable(&mut conn, &scope(), &write_off("w0", "r1", 100, "  ")).is_err());
    let b = write_off_receivable(&mut conn, &scope(), &write_off("w1", "r1", 300, "Descuento acordado")).unwrap();
    assert_eq!(b.written_off_minor, 300);
    assert_eq!(b.balance_minor, 700);
}

#[test]
fn retries_are_idempotent() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 200, PaymentRail::Card)).unwrap();
    let again = record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 200, PaymentRail::Card)).unwrap();
    assert_eq!(again.balance_minor, 800);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_receivables"), 1);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_receivable_entries"), 1);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox"), 2);
}

#[test]
fn same_source_debt_is_opened_once_per_currency() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "order-9", "USD", 1_000)).unwrap();
    let err = open_receivable(&mut conn, &scope(), &open_input("r2", "order-9", "USD", 1_000)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
    // Split USD/CUP debt for the same order is two receivables.
    open_receivable(&mut conn, &scope(), &open_input("r3", "order-9", "CUP", 50_000)).unwrap();
    assert_eq!(customer_open_receivables(&conn, "biz", "cust-1").unwrap().len(), 2);
}

#[test]
fn cash_payment_enters_the_open_drawer_and_transfer_does_not() {
    let mut conn = db();
    let shift = open_shift(&mut conn, "USD");
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();

    record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 300, PaymentRail::Cash)).unwrap();
    record_receivable_payment(&mut conn, &scope(), &pay("p2", "r1", 200, PaymentRail::Transfer)).unwrap();

    let usd = cash_shift::currency_totals(&conn, &shift).unwrap().remove("USD").unwrap();
    assert_eq!(usd.other_in_minor, 300);
    assert_eq!(usd.expected_minor, 1_300);

    let linked: Option<String> = conn
        .query_row("SELECT cash_movement_id FROM local_receivable_entries WHERE id='p1'", [], |r| r.get(0))
        .unwrap();
    assert_eq!(linked.as_deref(), Some("mv-p1"));
    let unlinked: Option<String> = conn
        .query_row("SELECT cash_movement_id FROM local_receivable_entries WHERE id='p2'", [], |r| r.get(0))
        .unwrap();
    assert_eq!(unlinked, None);
}

#[test]
fn cash_payment_without_open_shift_is_recorded_outside_any_drawer() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    let b = record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 400, PaymentRail::Cash)).unwrap();
    assert_eq!(b.balance_minor, 600);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_cash_movements"), 0);
}

#[test]
fn failed_payment_rolls_back_drawer_and_outbox() {
    let mut conn = db();
    open_shift(&mut conn, "USD");
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    // Reusing an existing movement ID makes the drawer insert fail mid-transaction.
    let mut bad = pay("p1", "r1", 100, PaymentRail::Cash);
    bad.cash_movement_id = Some("float-1".into());
    assert!(record_receivable_payment(&mut conn, &scope(), &bad).is_err());
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_receivable_entries"), 0);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type='receivable.payment_recorded'"), 0);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_cash_movements"), 1);
}

#[test]
fn receivables_and_entries_are_append_only() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    record_receivable_payment(&mut conn, &scope(), &pay("p1", "r1", 100, PaymentRail::Card)).unwrap();
    assert!(conn.execute("UPDATE local_receivables SET original_minor=1 WHERE id='r1'", []).is_err());
    assert!(conn.execute("DELETE FROM local_receivables WHERE id='r1'", []).is_err());
    assert!(conn.execute("UPDATE local_receivable_entries SET amount_minor=1 WHERE id='p1'", []).is_err());
    assert!(conn.execute("DELETE FROM local_receivable_entries WHERE id='p1'", []).is_err());
    // Sync bookkeeping may still change.
    conn.execute("UPDATE local_receivables SET sync_status='synced' WHERE id='r1'", []).unwrap();
}

#[test]
fn other_business_cannot_touch_the_receivable() {
    let mut conn = db();
    open_receivable(&mut conn, &scope(), &open_input("r1", "sale-1", "USD", 1_000)).unwrap();
    let other = ShiftScope {
        business_id: "other".into(),
        ..scope()
    };
    let err = record_receivable_payment(&mut conn, &other, &pay("p1", "r1", 100, PaymentRail::Cash)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
}
