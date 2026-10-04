use nexo_business_db::apply_all_migrations;
use nexo_business_db::stock::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn.execute_batch(
        "INSERT INTO local_products (id,business_id,name,active,version,updated_at) VALUES ('silla','biz','Silla',1,1,'t'),('mesa','biz','Mesa',1,1,'t'),('vaso','biz','Vaso',1,1,'t');",
    )
    .unwrap();
    conn
}

fn sale(conn: &Connection, id: &str, product: &str, qty: i64, synced_at: Option<&str>) {
    conn.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status) VALUES (?1,'biz','b','d','USD',100,'t','pending')",
        [id],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO local_sale_lines (id,sale_id,product_id,quantity,unit_price_minor,line_total_minor) VALUES (?1,?1,?2,?3,100,100)",
        rusqlite::params![id, product, qty],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at,synced_at) VALUES (?1,'biz','d','sale.completed','sale',?2,'{}','t',?3)",
        rusqlite::params![format!("o-{id}"), id, synced_at],
    )
    .unwrap();
}

fn cloud(product: &str, quantity: i64, min_stock: Option<i64>) -> CloudStock {
    CloudStock { product_id: product.into(), quantity, min_stock }
}

#[test]
fn subtracts_sales_the_snapshot_cannot_include_yet() {
    let mut conn = db();
    sale(&conn, "old", "silla", 1, Some("2026-10-03T10:00:00Z")); // already in the snapshot
    sale(&conn, "late", "silla", 1, Some("2026-10-03T12:30:00Z")); // synced after it
    sale(&conn, "offline", "silla", 2, None); // not synced
    replace_snapshot(&mut conn, "biz", &[cloud("silla", 6, None), cloud("mesa", 3, Some(5))], "2026-10-03T12:00:00Z").unwrap();
    let stock = current_stock(&conn, "biz", &[]).unwrap();
    assert_eq!(stock, vec![
        ProductStock { product_id: "mesa".into(), quantity: 3, low_at: 5 },
        ProductStock { product_id: "silla".into(), quantity: 3, low_at: DEFAULT_LOW_STOCK },
    ]);
}

#[test]
fn a_new_snapshot_replaces_the_old_one_and_untracked_products_have_no_stock() {
    let mut conn = db();
    replace_snapshot(&mut conn, "biz", &[cloud("silla", 6, None), cloud("mesa", 3, None)], "t1").unwrap();
    replace_snapshot(&mut conn, "biz", &[cloud("silla", 4, None)], "t2").unwrap();
    let stock = current_stock(&conn, "biz", &["silla".into(), "vaso".into()]).unwrap();
    assert_eq!(stock, vec![ProductStock { product_id: "silla".into(), quantity: 4, low_at: 2 }]);
}

fn store_location(conn: &Connection) {
    conn.execute_batch(
        "INSERT INTO local_locations (id,business_id,name,kind,is_default,active,created_at) VALUES ('tienda','biz','Tienda','store',1,1,'t'),('cons','biz','Consignación · Ana','consignment',0,1,'t');",
    )
    .unwrap();
}

fn at(conn: &Connection, loc: &str, product: &str) -> i64 {
    conn.query_row(
        "SELECT COALESCE(SUM(quantity),0) FROM local_stock_by_location WHERE location_id=?1 AND product_id=?2",
        [loc, product],
        |r| r.get(0),
    )
    .unwrap()
}

#[test]
fn aligns_the_store_with_cloud_stock_without_outbox_events() {
    let mut conn = db();
    store_location(&conn);
    replace_snapshot(&mut conn, "biz", &[cloud("silla", 5, None), cloud("mesa", 2, None)], "t1").unwrap();
    assert_eq!(align_default_location(&mut conn, "biz", "t1").unwrap(), 2);
    assert_eq!((at(&conn, "tienda", "silla"), at(&conn, "tienda", "mesa")), (5, 2));
    // Nothing is sent to the cloud.
    let outbox: i64 = conn.query_row("SELECT COUNT(*) FROM local_outbox", [], |r| r.get(0)).unwrap();
    assert_eq!(outbox, 0);
    // Aligned already: no new movements.
    assert_eq!(align_default_location(&mut conn, "biz", "t2").unwrap(), 0);
}

#[test]
fn stock_held_in_consignment_is_not_put_back_in_the_store() {
    let mut conn = db();
    store_location(&conn);
    conn.execute_batch(
        "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,occurred_at,location_id) VALUES ('m1','biz','silla',2,'transfer_in','transfer','t','cons');",
    )
    .unwrap();
    replace_snapshot(&mut conn, "biz", &[cloud("silla", 5, None)], "t1").unwrap();
    align_default_location(&mut conn, "biz", "t1").unwrap();
    assert_eq!((at(&conn, "tienda", "silla"), at(&conn, "cons", "silla")), (3, 2));
}

#[test]
fn without_a_store_location_nothing_is_aligned() {
    let mut conn = db();
    replace_snapshot(&mut conn, "biz", &[cloud("silla", 5, None)], "t1").unwrap();
    assert_eq!(align_default_location(&mut conn, "biz", "t1").unwrap(), 0);
}
