use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::{CashError, ShiftScope};
use nexo_business_db::inventory::*;
use rusqlite::{params, Connection};

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn.execute(
        "INSERT INTO local_products (id,business_id,name,updated_at) VALUES ('p1','biz','Silla','t')",
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

fn location(id: &str, name: &str, kind: LocationKind, is_default: bool) -> CreateLocationInput {
    CreateLocationInput {
        location_id: id.into(),
        outbox_id: format!("ob-{id}"),
        name: name.into(),
        kind,
        branch_id: Some("main".into()),
        is_default,
        authority_system: None,
        created_at: "2026-10-02T10:00:00Z".into(),
    }
}

fn setup() -> Connection {
    let mut conn = db();
    create_location(&mut conn, &scope(), &location("store", "Tienda", LocationKind::Store, true)).unwrap();
    create_location(&mut conn, &scope(), &location("wh", "Almacén", LocationKind::Warehouse, false)).unwrap();
    conn
}

fn count_input(id: &str, loc: &str, counted: i64) -> CountInput {
    CountInput {
        count_id: id.into(),
        outbox_id: format!("ob-{id}"),
        adjustment_movement_id: format!("adj-{id}"),
        location_id: loc.into(),
        product_id: "p1".into(),
        counted_quantity: counted,
        reason: "Conteo físico".into(),
        operator_id: None,
        counted_at: "2026-10-02T11:00:00Z".into(),
    }
}

fn transfer(id: &str, from: &str, to: &str, qty: i64) -> TransferInput {
    TransferInput {
        transfer_id: id.into(),
        outbox_id: format!("ob-{id}"),
        out_movement_id: format!("{id}-out"),
        in_movement_id: format!("{id}-in"),
        product_id: "p1".into(),
        from_location_id: from.into(),
        to_location_id: to.into(),
        quantity: qty,
        reason: "Reponer tienda".into(),
        operator_id: None,
        occurred_at: "2026-10-02T12:00:00Z".into(),
    }
}

fn scalar(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn legacy_sale_movements_count_toward_the_default_location() {
    let conn = setup();
    conn.execute(
        "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at)
         VALUES ('sale-mv','biz','p1',-2,'sale','sale','s1','t')",
        [],
    )
    .unwrap();
    assert_eq!(stock_at(&conn, "biz", "store", "p1").unwrap(), -2);
    assert_eq!(stock_at(&conn, "biz", "wh", "p1").unwrap(), 0);
}

#[test]
fn count_sets_opening_stock_and_transfer_moves_it_in_pairs() {
    let mut conn = setup();
    let c = record_count(&mut conn, &scope(), &count_input("c1", "wh", 10)).unwrap();
    assert_eq!((c.expected_quantity, c.difference_quantity), (0, 10));

    let lines = transfer_stock(&mut conn, &scope(), &transfer("t1", "wh", "store", 4)).unwrap();
    assert_eq!(lines[0].quantity, 6);
    assert_eq!(lines[1].quantity, 4);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_inventory_movements WHERE transfer_id='t1'"), 2);
    assert_eq!(scalar(&conn, "SELECT SUM(quantity_delta) FROM local_inventory_movements WHERE transfer_id='t1'"), 0);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_outbox WHERE operation_type IN ('inventory.counted','inventory.transferred')"), 2);
}

#[test]
fn transfer_cannot_exceed_source_stock_or_stay_in_place() {
    let mut conn = setup();
    record_count(&mut conn, &scope(), &count_input("c1", "wh", 3)).unwrap();
    let err = transfer_stock(&mut conn, &scope(), &transfer("t1", "wh", "store", 4)).unwrap_err();
    assert!(matches!(err, CashError::Validation(_)));
    assert!(transfer_stock(&mut conn, &scope(), &transfer("t2", "wh", "wh", 1)).is_err());
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_inventory_transfers"), 0);
}

#[test]
fn count_with_no_difference_writes_no_adjustment() {
    let mut conn = setup();
    record_count(&mut conn, &scope(), &count_input("c1", "store", 5)).unwrap();
    let again = record_count(&mut conn, &scope(), &count_input("c2", "store", 5)).unwrap();
    assert_eq!(again.difference_quantity, 0);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_inventory_movements WHERE source_type='inventory_count'"), 1);
    let short = record_count(&mut conn, &scope(), &count_input("c3", "store", 2)).unwrap();
    assert_eq!(short.difference_quantity, -3);
    assert_eq!(stock_at(&conn, "biz", "store", "p1").unwrap(), 2);
}

#[test]
fn retries_are_idempotent() {
    let mut conn = setup();
    record_count(&mut conn, &scope(), &count_input("c1", "wh", 10)).unwrap();
    record_count(&mut conn, &scope(), &count_input("c1", "wh", 99)).unwrap();
    transfer_stock(&mut conn, &scope(), &transfer("t1", "wh", "store", 4)).unwrap();
    transfer_stock(&mut conn, &scope(), &transfer("t1", "wh", "store", 4)).unwrap();
    assert_eq!(stock_at(&conn, "biz", "wh", "p1").unwrap(), 6);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_inventory_movements"), 3);
    create_location(&mut conn, &scope(), &location("wh", "Almacén", LocationKind::Warehouse, false)).unwrap();
    assert_eq!(list_locations(&conn, "biz").unwrap().len(), 2);
}

#[test]
fn one_default_location_and_unique_names() {
    let mut conn = setup();
    let err = create_location(&mut conn, &scope(), &location("x", "Otra", LocationKind::Store, true)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
    let err = create_location(&mut conn, &scope(), &location("y", "Tienda", LocationKind::Store, false)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
    assert_eq!(list_locations(&conn, "biz").unwrap()[0].location_id, "store");
}

#[test]
fn movements_transfers_and_counts_are_append_only() {
    let mut conn = setup();
    record_count(&mut conn, &scope(), &count_input("c1", "wh", 10)).unwrap();
    transfer_stock(&mut conn, &scope(), &transfer("t1", "wh", "store", 4)).unwrap();
    assert!(conn.execute("UPDATE local_inventory_movements SET quantity_delta=100", []).is_err());
    assert!(conn.execute("DELETE FROM local_inventory_movements", []).is_err());
    assert!(conn.execute("UPDATE local_inventory_transfers SET quantity=1", []).is_err());
    assert!(conn.execute("DELETE FROM local_inventory_counts", []).is_err());
    assert!(conn.execute("DELETE FROM local_locations", []).is_err());
    // Renaming or deactivating a location is allowed.
    conn.execute("UPDATE local_locations SET name=?1, active=0 WHERE id='wh'", params!["Almacén viejo"]).unwrap();
    let err = transfer_stock(&mut conn, &scope(), &transfer("t2", "wh", "store", 1)).unwrap_err();
    assert!(matches!(err, CashError::Conflict(_)));
}
