use nexo_business_db::apply_all_migrations;
use nexo_business_db::catalog::*;
use rusqlite::Connection;
use std::collections::BTreeMap;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    // What the POS seeds locally today.
    conn.execute_batch(
        "INSERT INTO local_products (id,business_id,sku,name,active,version,updated_at) VALUES ('nexo-demo-002','biz','NX-DEMO-002','Producto NEXO Demo',1,1,'t');
         INSERT INTO local_barcodes (id,business_id,product_id,code,format) VALUES ('barcode-nexo-demo-002','biz','nexo-demo-002','850000000002','EAN13');
         INSERT INTO local_prices (id,business_id,product_id,currency,amount_minor,active,updated_at) VALUES ('price-nexo-demo-002','biz','nexo-demo-002','USD',12500,1,'t');",
    )
    .unwrap();
    conn
}

fn change(seq: i64, id: &str, name: &str, prices: &[(&str, i64)]) -> CatalogChange {
    CatalogChange {
        seq,
        product_id: id.into(),
        sku: Some(format!("SKU-{id}")),
        name: name.into(),
        active: true,
        barcodes: vec![format!("77{seq:010}")],
        prices: prices.iter().map(|(c, a)| (c.to_string(), *a)).collect::<BTreeMap<_, _>>(),
        updated_at: "2026-10-03T13:00:00Z".into(),
        category: None,
        variant_of: None,
        variant_label: None,
    }
}

fn scalar(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn applies_new_products_prices_and_barcodes_and_advances_the_checkpoint() {
    let mut conn = db();
    let r = apply_catalog_page(&mut conn, "biz", &[change(2, "silla", "Silla", &[("USD", 3000), ("cup", 900000)]), change(1, "mesa", "Mesa", &[("USD", 9000)])], "now").unwrap();
    assert_eq!(r, ApplyResult { applied: 2, last_seq: 2 });
    assert_eq!(checkpoint(&conn, CATALOG_STREAM).unwrap(), 2);
    assert_eq!(scalar(&conn, "SELECT amount_minor FROM local_prices WHERE product_id='silla' AND currency='CUP'"), 900000);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_barcodes WHERE product_id='silla'"), 1);
}

#[test]
fn updates_an_existing_seeded_product_in_place() {
    let mut conn = db();
    apply_catalog_page(&mut conn, "biz", &[change(5, "nexo-demo-002", "NEXO Demo (nuevo precio)", &[("USD", 15000)])], "now").unwrap();
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_prices WHERE product_id='nexo-demo-002'"), 1);
    assert_eq!(scalar(&conn, "SELECT amount_minor FROM local_prices WHERE product_id='nexo-demo-002' AND active=1"), 15000);
    let name: String = conn.query_row("SELECT name FROM local_products WHERE id='nexo-demo-002'", [], |r| r.get(0)).unwrap();
    assert_eq!(name, "NEXO Demo (nuevo precio)");
}

#[test]
fn replaying_a_page_or_older_changes_is_a_no_op() {
    let mut conn = db();
    apply_catalog_page(&mut conn, "biz", &[change(3, "silla", "Silla", &[("USD", 3000)])], "now").unwrap();
    let again = apply_catalog_page(&mut conn, "biz", &[change(3, "silla", "Otra", &[("USD", 1)]), change(2, "silla", "Vieja", &[("USD", 2)])], "now").unwrap();
    assert_eq!(again, ApplyResult { applied: 0, last_seq: 3 });
    assert_eq!(scalar(&conn, "SELECT amount_minor FROM local_prices WHERE product_id='silla' AND currency='USD'"), 3000);
}

#[test]
fn dropped_currencies_and_deactivated_products_stop_selling() {
    let mut conn = db();
    apply_catalog_page(&mut conn, "biz", &[change(1, "silla", "Silla", &[("USD", 3000), ("CUP", 900000)])], "now").unwrap();
    let mut off = change(2, "silla", "Silla", &[("USD", 3000)]);
    off.active = false;
    apply_catalog_page(&mut conn, "biz", &[off], "now").unwrap();
    assert_eq!(scalar(&conn, "SELECT active FROM local_prices WHERE product_id='silla' AND currency='CUP'"), 0);
    assert_eq!(scalar(&conn, "SELECT active FROM local_products WHERE id='silla'"), 0);
}

#[test]
fn invalid_page_changes_nothing() {
    let mut conn = db();
    let bad = change(4, "silla", "Silla", &[("USD", -1)]);
    assert!(apply_catalog_page(&mut conn, "biz", &[change(3, "mesa", "Mesa", &[("USD", 1)]), bad], "now").is_err());
    assert_eq!(checkpoint(&conn, CATALOG_STREAM).unwrap(), 0);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_products WHERE id='mesa'"), 0);
}

#[test]
fn checkpoint_never_moves_backwards() {
    let conn = db();
    conn.execute("INSERT INTO local_sync_checkpoints (stream,last_seq,updated_at) VALUES ('catalog',10,'t')", []).unwrap();
    assert!(conn.execute("UPDATE local_sync_checkpoints SET last_seq=5 WHERE stream='catalog'", []).is_err());
}

#[test]
fn keeps_category_and_variant_grouping() {
    let mut conn = db();
    let mut azul = change(1, "cv-11", "Silla - Azul", &[("USD", 3000)]);
    azul.category = Some(" Muebles ".into());
    azul.variant_of = Some("cv-10".into());
    azul.variant_label = Some("Azul".into());
    let mut mesa = change(2, "cv-20", "Mesa", &[("USD", 9000)]);
    mesa.category = Some("  ".into());
    apply_catalog_page(&mut conn, "biz", &[azul, mesa], "now").unwrap();
    let (category, parent, label): (String, String, String) = conn
        .query_row("SELECT category,variant_of,variant_label FROM local_products WHERE id='cv-11'", [], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .unwrap();
    assert_eq!((category.as_str(), parent.as_str(), label.as_str()), ("Muebles", "cv-10", "Azul"));
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_products WHERE id='cv-20' AND category IS NULL AND variant_of IS NULL"), 1);
}
