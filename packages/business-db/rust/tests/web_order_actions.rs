// «Pedido web: cancelar o devolver» desde la caja (Ernesto 31-oct, caso de la olla Ariete).
use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::*;
use nexo_business_db::web_order_actions::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn
}

fn scope() -> ShiftScope {
    ShiftScope { business_id: "casa-viva".into(), branch_id: "casa-viva-main".into(), device_id: "telefono-2".into() }
}

/// Opens the store shift with 100 USD and 5 000 CUP in the drawer.
fn open_drawer(conn: &mut Connection) {
    open_shift(
        conn,
        &scope(),
        &OpenShiftInput {
            shift_id: "turno-31".into(),
            outbox_id: "turno-31-open".into(),
            operator_id: Some("staff-zaymi".into()),
            primary_currency: "USD".into(),
            location_id: None,
            opening_floats: vec![
                OpeningFloatInput { movement_id: "f-usd".into(), currency: "USD".into(), amount_minor: 10_000 },
                OpeningFloatInput { movement_id: "f-cup".into(), currency: "CUP".into(), amount_minor: 500_000 },
            ],
            opened_at: "2026-10-31T13:00:00Z".into(),
            store_role: Some("opener".into()),
        },
    )
    .unwrap();
}

fn olla(action_id: &str) -> WebOrderActionInput {
    WebOrderActionInput {
        action_id: action_id.into(),
        outbox_id: format!("{action_id}-out"),
        kind: "return".into(),
        order_id: 5612,
        order_number: "5612".into(),
        reason: "La olla no calienta, la clienta la trajo".into(),
        lines: vec![ReturnLine { item_id: 701, name: "Olla de presión eléctrica Ariete digital".into(), qty: 1 }],
        refunds: vec![Refund { method: "cash".into(), currency: "USD".into(), amount_minor: 6_200 }],
        shift_id: Some("turno-31".into()),
        staff_id: Some("staff-zaymi".into()),
        staff_name: Some("Zaymi".into()),
        occurred_at: "2026-10-31T15:10:00Z".into(),
    }
}

fn outbox(conn: &Connection, op: &str) -> Vec<serde_json::Value> {
    let mut stmt = conn.prepare("SELECT payload_json FROM local_outbox WHERE operation_type=?1 ORDER BY rowid").unwrap();
    stmt.query_map([op], |r| r.get::<_, String>(0))
        .unwrap()
        .map(|p| serde_json::from_str::<serde_json::Value>(&p.unwrap()).unwrap()["payload"].clone())
        .collect()
}

fn usd_expected(conn: &Connection) -> i64 {
    shift_summary(conn, "turno-31").unwrap().currencies.iter().find(|c| c.currency == "USD").unwrap().expected_minor
}

#[test]
fn olla_ariete_return_takes_62_usd_out_of_the_drawer_linked_to_the_order() {
    let mut conn = db();
    open_drawer(&mut conn);
    let a = record_action(&mut conn, &scope(), &olla("wret-olla-1")).unwrap();
    assert_eq!(a.status, "queued");
    assert_eq!(a.refund_method, "cash");
    assert_eq!((a.refund_usd_minor, a.cash_usd_minor, a.refund_cup_minor), (6_200, 6_200, 0));
    assert_eq!(a.products_text.as_deref(), Some("1× Olla de presión eléctrica Ariete digital"));

    // The drawer: 100 → 38 USD.
    assert_eq!(usd_expected(&conn), 3_800);

    // The movement is LINKED to the order, never «Otro».
    let (category, source_type, source_id, reason): (String, String, String, String) = conn
        .query_row(
            "SELECT category, source_type, source_id, reason FROM local_cash_movements WHERE id='wret-olla-1-usd'",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .unwrap();
    assert_eq!(category, "devolucion_pedido");
    assert_eq!(source_type, "web_order_return");
    assert_eq!(source_id, "5612");
    assert_eq!(reason, "Devolución pedido #5612 · 1× Olla de presión eléctrica Ariete digital · causa: La olla no calienta, la clienta la trajo");

    // The cloud gets the drawer exit (Lennys approves it) and the whole action.
    let moves = outbox(&conn, "cash_movement.recorded");
    let exit = moves.iter().find(|m| m["movement_id"] == "wret-olla-1-usd").unwrap();
    assert_eq!(exit["direction"], "out");
    assert_eq!(exit["category"], "devolucion_pedido");
    assert_eq!(exit["amount_minor"], 6_200);
    let actions = outbox(&conn, "web_order.action_recorded");
    assert_eq!(actions.len(), 1);
    assert_eq!(actions[0]["kind"], "return");
    assert_eq!(actions[0]["order_number"], "5612");
    assert_eq!(actions[0]["lines"][0]["itemId"], 701);

    // It waits in the queue until Core says «Devolución registrada».
    assert_eq!(queued_actions(&conn, "casa-viva").unwrap().len(), 1);
    let done = mark_done(&conn, "wret-olla-1", Some("Devolución registrada."), "2026-10-31T15:11:00Z").unwrap();
    assert_eq!(done.status, "done");
    assert!(queued_actions(&conn, "casa-viva").unwrap().is_empty());
}

#[test]
fn a_retry_without_network_never_takes_the_money_out_twice() {
    let mut conn = db();
    open_drawer(&mut conn);
    record_action(&mut conn, &scope(), &olla("wret-olla-1")).unwrap();
    record_attempt_failure(&conn, "wret-olla-1", "Sin conexión").unwrap();
    // The same action again (double tap, app restarted): returns the stored one.
    let again = record_action(&mut conn, &scope(), &olla("wret-olla-1")).unwrap();
    assert_eq!(again.attempts, 1);
    assert_eq!(usd_expected(&conn), 3_800);
    assert_eq!(outbox(&conn, "web_order.action_recorded").len(), 1);
    // A NEW return of the same order on this phone: refused.
    let err = record_action(&mut conn, &scope(), &olla("wret-olla-2")).unwrap_err();
    assert!(err.to_string().contains("ya tiene una devolución"), "{err}");
    assert_eq!(usd_expected(&conn), 3_800);
}

#[test]
fn refused_by_core_keeps_the_exit_for_lennys_and_allows_a_new_try() {
    let mut conn = db();
    open_drawer(&mut conn);
    record_action(&mut conn, &scope(), &olla("wret-olla-1")).unwrap();
    let r = mark_refused(&conn, "wret-olla-1", "Este pedido todavía no está cobrado.", "2026-10-31T15:12:00Z").unwrap();
    assert_eq!(r.status, "refused");
    assert_eq!(usd_expected(&conn), 3_800, "the cash did leave: it stays pending for Lennys");
    // A new try (new id) is possible; with no cash refund it does not touch the drawer.
    let mut retry = olla("wret-olla-2");
    retry.refunds.clear();
    record_action(&mut conn, &scope(), &retry).unwrap();
    assert_eq!(usd_expected(&conn), 3_800);
}

#[test]
fn rules_cause_lines_shift_and_money() {
    let mut conn = db();
    let mut no_reason = olla("a1");
    no_reason.reason = " no ".into();
    assert!(record_action(&mut conn, &scope(), &no_reason).unwrap_err().to_string().contains("causa"));

    // Cash out needs the open shift.
    let err = record_action(&mut conn, &scope(), &olla("a2")).unwrap_err();
    assert!(err.to_string().contains("abre el turno") || err.to_string().contains("Turno"), "{err}");

    open_drawer(&mut conn);
    let mut no_lines = olla("a3");
    no_lines.lines[0].qty = 0;
    assert!(record_action(&mut conn, &scope(), &no_lines).unwrap_err().to_string().contains("producto"));

    let mut too_much = olla("a4");
    too_much.refunds[0].amount_minor = 20_000; // more than the 100 USD in the drawer
    assert!(record_action(&mut conn, &scope(), &too_much).is_err());

    let mut bad_method = olla("a5");
    bad_method.refunds[0].method = "zelle".into();
    assert!(record_action(&mut conn, &scope(), &bad_method).is_err());

    // Transfer: nothing leaves the drawer; the action still says how much.
    let mut transfer = olla("a6");
    transfer.refunds = vec![Refund { method: "transfer".into(), currency: "CUP".into(), amount_minor: 2_000_000 }];
    let t = record_action(&mut conn, &scope(), &transfer).unwrap();
    assert_eq!((t.refund_method.as_str(), t.refund_cup_minor, t.cash_cup_minor), ("transfer", 2_000_000, 0));
    assert_eq!(usd_expected(&conn), 10_000);

    // Cancel: no money, no drawer, needs no shift.
    let cancel = WebOrderActionInput {
        kind: "cancel".into(),
        order_id: 5620,
        order_number: "#5620".into(),
        lines: vec![],
        refunds: vec![],
        shift_id: None,
        reason: "La clienta ya no lo quiere".into(),
        ..olla("c1")
    };
    let c = record_action(&mut conn, &scope(), &cancel).unwrap();
    assert_eq!((c.kind.as_str(), c.order_number.as_str(), c.refund_method.as_str()), ("cancel", "5620", "none"));
    let mut cancel_money = cancel.clone();
    cancel_money.action_id = "c2".into();
    cancel_money.order_id = 5621;
    cancel_money.refunds = vec![Refund { method: "cash".into(), currency: "USD".into(), amount_minor: 100 }];
    assert!(record_action(&mut conn, &scope(), &cancel_money).is_err());
}

#[test]
fn refund_totals_mix_cash_and_transfer() {
    let t = refund_totals(&[
        Refund { method: "cash".into(), currency: "usd".into(), amount_minor: 3_000 },
        Refund { method: "transfer".into(), currency: "CUP".into(), amount_minor: 1_000_000 },
    ])
    .unwrap();
    assert_eq!(t, RefundTotals { method: "mixed", usd_minor: 3_000, cup_minor: 1_000_000, cash_usd_minor: 3_000, cash_cup_minor: 0 });
    assert_eq!(refund_totals(&[]).unwrap().method, "none");
    assert!(refund_totals(&[Refund { method: "cash".into(), currency: "MLC".into(), amount_minor: 5 }]).is_err());
}
