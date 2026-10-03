use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::{self, CashError, OpenShiftInput, OpeningFloatInput, ShiftScope};
use nexo_business_db::receivables::PaymentRail;
use nexo_business_db::sale_returns::*;
use rusqlite::{params, Connection};

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    for (id, name) in [("p1", "Silla"), ("p2", "Mesa")] {
        conn.execute(
            "INSERT INTO local_products (id,business_id,name,updated_at) VALUES (?1,'biz',?2,'t')",
            params![id, name],
        )
        .unwrap();
    }
    // Sale s1: 3 × p1 @ 1 000 + 1 × p2 @ 5 000 = 8 000 USD.
    conn.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at) VALUES ('s1','biz','main','pos-1','USD',8000,'t')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO local_sale_lines (id,sale_id,product_id,quantity,unit_price_minor,line_total_minor) VALUES ('l1','s1','p1',3,1000,3000),('l2','s1','p2',1,5000,5000)",
        [],
    )
    .unwrap();
    conn
}

fn scope() -> ShiftScope {
    ShiftScope {
        business_id: "biz".into(),
        branch_id: "main".into(),
        device_id: "pos-1".into(),
    }
}

fn line(id: &str, sale_line: &str, qty: i64) -> ReturnLineInput {
    ReturnLineInput {
        return_line_id: id.into(),
        sale_line_id: sale_line.into(),
        quantity: qty,
        inventory_movement_id: format!("inv-{id}"),
    }
}

fn ret(id: &str, lines: Vec<ReturnLineInput>, refund: i64, rail: Option<PaymentRail>) -> RecordSaleReturnInput {
    RecordSaleReturnInput {
        return_id: id.into(),
        outbox_id: format!("ob-{id}"),
        sale_id: "s1".into(),
        lines,
        refund_minor: refund,
        refund_rail: rail,
        refund_provider: None,
        refund_external_ref: None,
        cash_movement_id: Some(format!("mv-{id}")),
        reason: "Producto defectuoso".into(),
        operator_id: None,
        occurred_at: "2026-10-03T10:00:00Z".into(),
    }
}

fn open_shift(conn: &mut Connection, float: i64) {
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
                amount_minor: float,
            }],
            opened_at: "2026-10-03T08:00:00Z".into(),
        },
    )
    .unwrap();
}

fn count(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn partial_return_restocks_and_refunds_cash_from_the_drawer() {
    let mut conn = db();
    open_shift(&mut conn, 5_000);
    let s = record_sale_return(&mut conn, &scope(), &ret("r1", vec![line("rl1", "l1", 2)], 2_000, Some(PaymentRail::Cash))).unwrap();
    assert_eq!(s.refunded_minor, 2_000);
    assert_eq!(s.lines.iter().find(|l| l.sale_line_id == "l1").unwrap().returned_quantity, 2);
    assert_eq!(count(&conn, "SELECT SUM(quantity_delta) FROM local_inventory_movements WHERE source_type='sale_return' AND product_id='p1'"), 2);
    let usd = cash_shift::currency_totals(&conn, "shift-1").unwrap().remove("USD").unwrap();
    assert_eq!(usd.other_out_minor, 2_000);
    assert_eq!(usd.expected_minor, 3_000);
    // The original sale is untouched.
    assert_eq!(count(&conn, "SELECT total_minor FROM local_sales WHERE id='s1'"), 8_000);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type='sale.returned'"), 1);
}

#[test]
fn cannot_return_more_than_sold_or_refund_more_than_the_sale() {
    let mut conn = db();
    record_sale_return(&mut conn, &scope(), &ret("r1", vec![line("rl1", "l1", 2)], 0, None)).unwrap();
    let err = record_sale_return(&mut conn, &scope(), &ret("r2", vec![line("rl2", "l1", 2)], 0, None)).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    let err = record_sale_return(&mut conn, &scope(), &ret("r3", vec![], 8_001, Some(PaymentRail::Transfer))).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_sale_returns"), 1);
}

#[test]
fn transfer_refund_never_touches_the_drawer() {
    let mut conn = db();
    open_shift(&mut conn, 1_000);
    record_sale_return(&mut conn, &scope(), &ret("r1", vec![line("rl1", "l2", 1)], 5_000, Some(PaymentRail::Transfer))).unwrap();
    let usd = cash_shift::currency_totals(&conn, "shift-1").unwrap().remove("USD").unwrap();
    assert_eq!(usd.expected_minor, 1_000);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_sale_returns WHERE cash_movement_id IS NULL"), 1);
}

#[test]
fn cash_refund_cannot_exceed_drawer_cash_and_rolls_back() {
    let mut conn = db();
    open_shift(&mut conn, 500);
    let err = record_sale_return(&mut conn, &scope(), &ret("r1", vec![line("rl1", "l1", 1)], 1_000, Some(PaymentRail::Cash))).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_sale_returns"), 0);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_inventory_movements"), 0);
}

#[test]
fn refund_needs_a_rail_and_a_reason() {
    let mut conn = db();
    assert!(record_sale_return(&mut conn, &scope(), &ret("r1", vec![], 100, None)).is_err());
    assert!(record_sale_return(&mut conn, &scope(), &ret("r1", vec![line("a", "l1", 1)], 0, Some(PaymentRail::Cash))).is_err());
    let mut no_reason = ret("r1", vec![line("a", "l1", 1)], 0, None);
    no_reason.reason = "  ".into();
    assert!(record_sale_return(&mut conn, &scope(), &no_reason).is_err());
}

#[test]
fn retries_are_idempotent_and_other_business_is_rejected() {
    let mut conn = db();
    let input = ret("r1", vec![line("rl1", "l1", 1)], 1_000, Some(PaymentRail::Card));
    record_sale_return(&mut conn, &scope(), &input).unwrap();
    record_sale_return(&mut conn, &scope(), &input).unwrap();
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_sale_returns"), 1);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM local_inventory_movements"), 1);
    let other = ShiftScope { business_id: "other".into(), ..scope() };
    let err = record_sale_return(&mut conn, &other, &ret("r9", vec![line("x", "l1", 1)], 0, None)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
}

#[test]
fn schema_enforces_limits_and_append_only() {
    let mut conn = db();
    record_sale_return(&mut conn, &scope(), &ret("r1", vec![line("rl1", "l1", 3)], 3_000, Some(PaymentRail::Card))).unwrap();
    let over = conn.execute(
        "INSERT INTO local_sale_returns (id,business_id,branch_id,device_id,sale_id,currency,refund_minor,refund_rail,reason,occurred_at)
         VALUES ('x','biz','main','pos-1','s1','USD',6000,'card','r','t')",
        [],
    );
    assert!(over.unwrap_err().to_string().contains("exceed"));
    assert!(conn.execute("UPDATE local_sale_returns SET refund_minor=1", []).is_err());
    assert!(conn.execute("DELETE FROM local_sale_return_lines", []).is_err());
    conn.execute("UPDATE local_sale_returns SET sync_status='synced'", []).unwrap();
}
