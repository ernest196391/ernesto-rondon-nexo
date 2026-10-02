use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::CashError;
use nexo_business_db::external_refs::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    apply_all_migrations(&conn).unwrap();
    conn
}

fn input(id: &str, entity: &str, system: &str, external: &str) -> ExternalRefInput {
    ExternalRefInput {
        id: id.into(),
        entity_type: "order".into(),
        entity_id: entity.into(),
        system: system.into(),
        external_id: external.into(),
        created_at: "2026-10-02T12:00:00Z".into(),
    }
}

#[test]
fn links_and_resolves_external_identity() {
    let conn = db();
    assert_eq!(
        link_external_ref(
            &conn,
            "casa-viva",
            &input("r1", "order-uuid-1", "WooCommerce", "2608")
        )
        .unwrap(),
        "r1"
    );
    assert_eq!(
        resolve_external_ref(&conn, "casa-viva", "order", "woocommerce", "2608")
            .unwrap()
            .as_deref(),
        Some("order-uuid-1")
    );
    // Same pair again (new ref ID from a retry) is a no-op.
    assert_eq!(
        link_external_ref(
            &conn,
            "casa-viva",
            &input("r2", "order-uuid-1", "woocommerce", "2608")
        )
        .unwrap(),
        "r1"
    );
    // Tenants are isolated.
    assert_eq!(
        resolve_external_ref(&conn, "estilo-y-hogar", "order", "woocommerce", "2608").unwrap(),
        None
    );
}

#[test]
fn never_maps_one_identity_to_two_entities() {
    let conn = db();
    link_external_ref(
        &conn,
        "casa-viva",
        &input("r1", "order-uuid-1", "woocommerce", "2608"),
    )
    .unwrap();
    assert!(matches!(
        link_external_ref(
            &conn,
            "casa-viva",
            &input("r2", "order-uuid-2", "woocommerce", "2608")
        ),
        Err(CashError::Conflict(_))
    ));
    assert!(matches!(
        link_external_ref(
            &conn,
            "casa-viva",
            &input("r3", "order-uuid-1", "woocommerce", "2609")
        ),
        Err(CashError::Conflict(_))
    ));
    // A different system for the same entity is fine.
    link_external_ref(
        &conn,
        "casa-viva",
        &input("r4", "order-uuid-1", "axis", "A-77"),
    )
    .unwrap();
    assert!(conn
        .execute("UPDATE local_external_refs SET external_id='x'", [])
        .is_err());
    assert!(matches!(
        link_external_ref(
            &conn,
            "casa-viva",
            &input("r5", "order-uuid-3", "woocommerce", "  ")
        ),
        Err(CashError::Validation(_))
    ));
}
