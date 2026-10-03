use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::{CashError, ShiftScope};
use nexo_business_db::consignment::*;
use nexo_business_db::inventory::{self, CountInput, CreateLocationInput, LocationKind, TransferInput};
use nexo_business_db::receivables::{record_receivable_payment, PaymentRail, ReceivablePaymentInput};
use rusqlite::Connection;

fn scope() -> ShiftScope {
    ShiftScope {
        business_id: "biz".into(),
        branch_id: "main".into(),
        device_id: "pos-1".into(),
    }
}

fn loc(id: &str, name: &str, kind: LocationKind, is_default: bool) -> CreateLocationInput {
    CreateLocationInput {
        location_id: id.into(),
        outbox_id: format!("ob-{id}"),
        name: name.into(),
        kind,
        branch_id: None,
        is_default,
        authority_system: None,
        created_at: "t".into(),
    }
}

/// Store with 10 chairs, 6 of them placed at client "mayorista-1" on consignment.
fn setup() -> Connection {
    let mut conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn.execute(
        "INSERT INTO local_products (id,business_id,name,updated_at) VALUES ('p1','biz','Silla','t'),('p2','biz','Mesa','t')",
        [],
    )
    .unwrap();
    inventory::create_location(&mut conn, &scope(), &loc("store", "Tienda", LocationKind::Store, true)).unwrap();
    inventory::create_location(&mut conn, &scope(), &loc("cons-1", "Mayorista 1", LocationKind::Consignment, false)).unwrap();
    inventory::record_count(
        &mut conn,
        &scope(),
        &CountInput {
            count_id: "c1".into(),
            outbox_id: "ob-c1".into(),
            adjustment_movement_id: "adj-c1".into(),
            location_id: "store".into(),
            product_id: "p1".into(),
            counted_quantity: 10,
            reason: "Inventario inicial".into(),
            operator_id: None,
            counted_at: "t".into(),
        },
    )
    .unwrap();
    inventory::transfer_stock(
        &mut conn,
        &scope(),
        &TransferInput {
            transfer_id: "t1".into(),
            outbox_id: "ob-t1".into(),
            out_movement_id: "t1-out".into(),
            in_movement_id: "t1-in".into(),
            product_id: "p1".into(),
            from_location_id: "store".into(),
            to_location_id: "cons-1".into(),
            quantity: 6,
            reason: "Entrega en consignación".into(),
            operator_id: None,
            occurred_at: "t".into(),
        },
    )
    .unwrap();
    open_consignment_account(
        &mut conn,
        &scope(),
        &OpenConsignmentAccountInput {
            location_id: "cons-1".into(),
            outbox_id: "ob-acc".into(),
            customer_id: "mayorista-1".into(),
            currency: "usd".into(),
            created_at: "t".into(),
        },
    )
    .unwrap();
    conn
}

fn settle(id: &str, qty: i64, price: i64) -> SettleConsignmentInput {
    SettleConsignmentInput {
        settlement_id: id.into(),
        outbox_id: format!("ob-{id}"),
        receivable_id: format!("rcv-{id}"),
        receivable_outbox_id: format!("ob-rcv-{id}"),
        location_id: "cons-1".into(),
        lines: vec![SettlementLineInput {
            line_id: format!("{id}-l1"),
            inventory_movement_id: format!("{id}-mv1"),
            product_id: "p1".into(),
            quantity: qty,
            unit_price_minor: price,
        }],
        due_at: Some("2026-11-01".into()),
        note: None,
        operator_id: None,
        occurred_at: "2026-10-10T10:00:00Z".into(),
    }
}

fn scalar(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn settlement_reduces_consignment_stock_and_opens_debt() {
    let mut conn = setup();
    let debt = settle_consignment(&mut conn, &scope(), &settle("s1", 4, 2_500)).unwrap();
    assert_eq!(debt.customer_id, "mayorista-1");
    assert_eq!(debt.currency, "USD");
    assert_eq!(debt.balance_minor, 10_000);
    assert_eq!(debt.source_type, "consignment_settlement");
    assert_eq!(inventory::stock_at(&conn, "biz", "cons-1", "p1").unwrap(), 2);
    // Store stock is unaffected by the settlement.
    assert_eq!(inventory::stock_at(&conn, "biz", "store", "p1").unwrap(), 4);

    let paid = record_receivable_payment(
        &mut conn,
        &scope(),
        &ReceivablePaymentInput {
            entry_id: "pay-1".into(),
            outbox_id: "ob-pay-1".into(),
            receivable_id: "rcv-s1".into(),
            amount_minor: 10_000,
            rail: PaymentRail::Transfer,
            provider: None,
            channel: None,
            external_ref: None,
            cash_movement_id: None,
            operator_id: None,
            occurred_at: "t".into(),
        },
    )
    .unwrap();
    assert_eq!(paid.status, "settled");
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type IN ('consignment.settled','receivable.opened')"), 2);
}

#[test]
fn cannot_settle_more_than_is_on_consignment() {
    let mut conn = setup();
    let err = settle_consignment(&mut conn, &scope(), &settle("s1", 7, 100)).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_receivables"), 0);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_consignment_settlements"), 0);
}

#[test]
fn settlement_retry_is_idempotent() {
    let mut conn = setup();
    settle_consignment(&mut conn, &scope(), &settle("s1", 2, 100)).unwrap();
    let again = settle_consignment(&mut conn, &scope(), &settle("s1", 2, 100)).unwrap();
    assert_eq!(again.balance_minor, 200);
    assert_eq!(inventory::stock_at(&conn, "biz", "cons-1", "p1").unwrap(), 4);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_receivables"), 1);
}

#[test]
fn account_needs_a_consignment_location_and_stays_with_its_client() {
    let mut conn = setup();
    let err = open_consignment_account(
        &mut conn,
        &scope(),
        &OpenConsignmentAccountInput {
            location_id: "store".into(),
            outbox_id: "x".into(),
            customer_id: "c".into(),
            currency: "USD".into(),
            created_at: "t".into(),
        },
    )
    .unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    let err = open_consignment_account(
        &mut conn,
        &scope(),
        &OpenConsignmentAccountInput {
            location_id: "cons-1".into(),
            outbox_id: "y".into(),
            customer_id: "otro".into(),
            currency: "USD".into(),
            created_at: "t".into(),
        },
    )
    .unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
}

#[test]
fn settlement_without_account_or_with_zero_total_is_rejected() {
    let mut conn = setup();
    let mut no_account = settle("s1", 1, 100);
    no_account.location_id = "store".into();
    assert!(matches!(
        settle_consignment(&mut conn, &scope(), &no_account).unwrap_err(),
        CashError::NotFound(_)
    ));
    assert!(settle_consignment(&mut conn, &scope(), &settle("s2", 1, 0)).is_err());
    assert!(conn.execute("DELETE FROM local_consignment_accounts", []).is_err());
}
