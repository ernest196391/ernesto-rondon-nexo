use nexo_business_db::apply_all_migrations;
use nexo_business_db::device::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn
}

fn add_sale(conn: &Connection, business: &str) {
    conn.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status) VALUES (?1,?2,'b','d','USD',100,'t','pending')",
        [format!("sale-{business}"), business.to_string()],
    )
    .unwrap();
}

#[test]
fn falls_back_to_the_pilot_identity_until_provisioned() {
    let conn = db();
    let id = current_identity(&conn, "windows-pilot-01").unwrap();
    assert_eq!(id, pilot_identity("windows-pilot-01"));
    assert_eq!(id.scope().branch_id, "casa-viva-main");
    assert!(!id.provisioned);
}

#[test]
fn pilot_keeps_its_data_when_provisioned_with_its_own_key() {
    let mut conn = db();
    add_sale(&conn, "casa-viva");
    let id = provision(&mut conn, " casa-viva ", "windows-pilot-01", Some("Caja portátil"), "now").unwrap();
    assert_eq!(id.branch_id, "casa-viva-main");
    assert_eq!(current_identity(&conn, "ignored").unwrap(), id);
}

#[test]
fn a_new_device_takes_the_identity_of_its_key() {
    let mut conn = db();
    provision(&mut conn, "tienda-2", "android-02", None, "now").unwrap();
    let id = current_identity(&conn, "android-pilot-01").unwrap();
    assert_eq!((id.business_id.as_str(), id.branch_id.as_str(), id.device_id.as_str()), ("tienda-2", "tienda-2-main", "android-02"));
    // Re-provisioning the same business (e.g. a renamed device) replaces the row.
    provision(&mut conn, "tienda-2", "android-03", Some("Mostrador"), "later").unwrap();
    assert_eq!(current_identity(&conn, "x").unwrap().device_id, "android-03");
}

#[test]
fn refuses_to_move_a_device_holding_another_business_data() {
    let mut conn = db();
    add_sale(&conn, "casa-viva");
    let err = provision(&mut conn, "tienda-2", "android-02", None, "now").unwrap_err();
    assert!(err.to_string().contains("casa-viva"), "{err}");
    assert!(!current_identity(&conn, "android-pilot-01").unwrap().provisioned);
}

#[test]
fn rejects_an_empty_identity() {
    let mut conn = db();
    assert!(provision(&mut conn, "  ", "d", None, "now").is_err());
    assert!(provision(&mut conn, "b", "", None, "now").is_err());
}
