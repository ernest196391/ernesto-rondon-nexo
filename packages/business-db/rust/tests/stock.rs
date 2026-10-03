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
