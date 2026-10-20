// «Un cajón por tienda» (20-oct) and web orders charged at the counter.
use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::*;
use nexo_business_db::web_orders::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn
}

fn scope(device: &str) -> ShiftScope {
    ShiftScope { business_id: "casa-viva".into(), branch_id: "casa-viva-main".into(), device_id: device.into() }
}

fn open(id: &str, role: Option<&str>, floats: &[(&str, i64)]) -> OpenShiftInput {
    OpenShiftInput {
        shift_id: id.into(),
        outbox_id: format!("{id}-{}-out", role.unwrap_or("legacy")),
        operator_id: Some("staff-nana".into()),
        primary_currency: "USD".into(),
        location_id: None,
        opening_floats: floats
            .iter()
            .map(|(c, a)| OpeningFloatInput { movement_id: format!("{id}-f-{c}"), currency: (*c).into(), amount_minor: *a })
            .collect(),
        opened_at: "2026-10-20T09:00:00Z".into(),
        store_role: role.map(str::to_string),
    }
}

fn close(id: &str, counts: &[(&str, i64)], expected: Option<Vec<ExpectedInput>>) -> CloseShiftInput {
    CloseShiftInput {
        shift_id: id.into(),
        outbox_id: format!("{id}-close"),
        counts: counts.iter().map(|(c, v)| CountInput { count_id: format!("{id}-c-{c}"), currency: (*c).into(), counted_minor: *v }).collect(),
        closed_by: Some("staff-zaymi".into()),
        note: None,
        closed_at: "2026-10-20T18:00:00Z".into(),
        expected,
        details: None,
    }
}

fn outbox(conn: &Connection, op: &str) -> Vec<serde_json::Value> {
    let mut stmt = conn.prepare("SELECT payload_json FROM local_outbox WHERE operation_type=?1 ORDER BY rowid").unwrap();
    stmt.query_map([op], |r| r.get::<_, String>(0))
        .unwrap()
        .map(|p| serde_json::from_str::<serde_json::Value>(&p.unwrap()).unwrap()["payload"].clone())
        .collect()
}

fn cash(method: &str, currency: &str, amount: i64) -> WebPayment {
    WebPayment { method: method.into(), currency: currency.into(), amount_minor: amount, external_ref: None, provider: None }
}

#[test]
fn selling_requires_an_open_shift() {
    let mut conn = db();
    let err = require_open_shift(&conn, &scope("nana")).unwrap_err();
    assert!(err.to_string().contains("No hay turno abierto"));
    open_shift(&mut conn, &scope("nana"), &open("S1", Some("opener"), &[("USD", 5_000)])).unwrap();
    assert_eq!(require_open_shift(&conn, &scope("nana")).unwrap(), "S1");
    // Another phone of the store has no shift until it joins.
    assert!(require_open_shift(&conn, &scope("zaymi")).is_err());
}

#[test]
fn a_second_phone_joins_the_same_store_shift_without_counting() {
    let mut a = db();
    let mut b = db();
    let opened = open_shift(&mut a, &scope("nana"), &open("S1", Some("opener"), &[("USD", 5_000), ("CUP", 100_000)])).unwrap();
    assert_eq!(opened.store_role.as_deref(), Some("opener"));
    assert_eq!(opened.opened_by.as_deref(), Some("staff-nana"));

    // Joining with money is refused: the opener already counted the drawer.
    let err = open_shift(&mut b, &scope("zaymi"), &open("S1", Some("joiner"), &[("USD", 5_000)])).unwrap_err();
    assert!(err.to_string().contains("ya lo contó"));

    let joined = open_shift(&mut b, &scope("zaymi"), &open("S1", Some("joiner"), &[])).unwrap();
    assert_eq!(joined.shift_id, "S1");
    assert_eq!(joined.store_role.as_deref(), Some("joiner"));
    assert!(joined.currencies.iter().all(|c| c.opening_float_minor == 0));
    assert_eq!(require_open_shift(&b, &scope("zaymi")).unwrap(), "S1");

    let events = outbox(&b, "cash_shift.joined");
    assert_eq!(events.len(), 1);
    assert_eq!(events[0]["shift_id"], "S1");
    assert_eq!(events[0]["store_role"], "joiner");
    assert_eq!(outbox(&a, "cash_shift.opened")[0]["store_role"], "opener");
    assert!(StoreRole::parse(&Some("jefa".into())).is_err());
}

#[test]
fn closing_with_the_cloud_total_uses_the_whole_store() {
    let mut conn = db();
    open_shift(&mut conn, &scope("nana"), &open("S1", Some("opener"), &[("USD", 5_000)])).unwrap();
    // Cloud: this phone's 50 USD + the other phone's cash sales + web cash = 180 USD and 2.000 CUP.
    let expected = vec![
        ExpectedInput { currency: "USD".into(), expected_minor: 18_000 },
        ExpectedInput { currency: "CUP".into(), expected_minor: 200_000 },
        ExpectedInput { currency: "MLC".into(), expected_minor: 0 },
    ];
    // CUP is expected by the cloud: it must be counted; MLC (0) need not.
    let missing = close_shift(&mut conn, &scope("nana"), &close("S1", &[("USD", 18_000)], Some(expected.clone()))).unwrap_err();
    assert!(missing.to_string().contains("CUP"));
    let closed = close_shift(&mut conn, &scope("nana"), &close("S1", &[("USD", 17_500), ("CUP", 200_000)], Some(expected))).unwrap();
    let usd = closed.counts.iter().find(|c| c.currency == "USD").unwrap();
    assert_eq!((usd.expected_minor, usd.difference_minor), (18_000, -500));
    assert_eq!(closed.counts.len(), 2);
    assert_eq!(closed.closed_by.as_deref(), Some("staff-zaymi"));
    let payload = &outbox(&conn, "cash_shift.closed")[0];
    assert_eq!(payload["expected_source"], "cloud");
    assert_eq!(payload["local_expected"][0]["expectedMinor"], 5_000);
}

#[test]
fn closing_offline_uses_this_phone_only_and_says_so() {
    let mut conn = db();
    open_shift(&mut conn, &scope("nana"), &open("S1", Some("opener"), &[("USD", 5_000)])).unwrap();
    let closed = close_shift(&mut conn, &scope("nana"), &close("S1", &[("USD", 5_000)], None)).unwrap();
    assert_eq!(closed.counts[0].difference_minor, 0);
    assert_eq!(outbox(&conn, "cash_shift.closed")[0]["expected_source"], "local");
}

#[test]
fn a_store_shift_closed_on_another_phone_closes_here_without_counts() {
    let mut conn = db();
    open_shift(&mut conn, &scope("zaymi"), &open("S1", Some("joiner"), &[])).unwrap();
    let closed = mark_closed_remote(&mut conn, &scope("zaymi"), "S1", "2026-10-20T18:05:00Z", Some("staff-nana"), None).unwrap();
    assert_eq!(closed.status, "closed");
    assert!(closed.closed_remote);
    assert!(closed.counts.is_empty());
    // Idempotent, and the phone can open or join the next day.
    mark_closed_remote(&mut conn, &scope("zaymi"), "S1", "2026-10-20T18:06:00Z", None, None).unwrap();
    let mut next = open("S2", Some("joiner"), &[]);
    next.outbox_id = "S2-join".into();
    open_shift(&mut conn, &scope("zaymi"), &next).unwrap();
    assert_eq!(require_open_shift(&conn, &scope("zaymi")).unwrap(), "S2");

    // A legacy per-device shift is never closed that way.
    let mut legacy = db();
    open_shift(&mut legacy, &scope("pc"), &open("L1", None, &[("USD", 100)])).unwrap();
    assert!(mark_closed_remote(&mut legacy, &scope("pc"), "L1", "2026-10-20T18:05:00Z", None, None).is_err());
    let raw = legacy.execute("UPDATE local_cash_shifts SET status='closed', closed_remote=1 WHERE id='L1'", []);
    assert!(raw.is_err(), "the trigger also forbids it");
}

#[test]
fn payments_map_to_cores_collection_form() {
    let c = collection_of(&[cash("cash", "USD", 3_300)]).unwrap();
    assert_eq!((c.method, c.usd_minor, c.cash_usd_minor), ("cash_usd", 3_300, 3_300));
    let c = collection_of(&[cash("cash", "CUP", 2_640_000)]).unwrap();
    assert_eq!((c.method, c.cup_minor, c.cash_cup_minor), ("cash_cup", 2_640_000, 2_640_000));
    let c = collection_of(&[cash("cash", "USD", 1_000), cash("cash", "CUP", 1_000_000)]).unwrap();
    assert_eq!(c.method, "cash_usd");
    let mut transfer = cash("transfer", "CUP", 500_000);
    transfer.external_ref = Some("TM123".into());
    let c = collection_of(&[transfer.clone()]).unwrap();
    assert_eq!((c.method, c.cash_cup_minor, c.reference.as_deref()), ("transfer", 0, Some("TM123")));
    let c = collection_of(&[cash("cash", "USD", 1_000), transfer]).unwrap();
    assert_eq!((c.method, c.cash_usd_minor, c.cup_minor), ("mixed", 1_000, 500_000));
    assert_eq!(collection_of(&[cash("crypto", "USDT", 100)]).unwrap().method, "other");
    assert!(collection_of(&[]).is_err());
    assert!(collection_of(&[cash("cash", "USD", 0)]).is_err());
}

fn charge_input(id: &str, order: i64, payments: Vec<WebPayment>) -> ChargeWebOrderInput {
    ChargeWebOrderInput {
        charge_id: id.into(),
        outbox_id: format!("{id}-out"),
        shift_id: "S1".into(),
        order_id: order,
        order_number: order.to_string(),
        payments,
        staff_id: Some("staff-nana".into()),
        staff_name: Some("Nana".into()),
        note: None,
        occurred_at: "2026-10-20T11:00:00Z".into(),
        collection_account: Some("bpa".into()),
    }
}

#[test]
fn a_web_order_charge_puts_the_cash_in_the_drawer_once() {
    let mut conn = db();
    let s = scope("nana");
    // Without a shift there is no drawer to put the money in.
    assert!(record_charge(&mut conn, &s, &charge_input("W1", 4223, vec![cash("cash", "USD", 3_300)])).is_err());
    open_shift(&mut conn, &s, &open("S1", Some("opener"), &[("USD", 5_000)])).unwrap();

    let charged = record_charge(&mut conn, &s, &charge_input("W1", 4223, vec![cash("cash", "USD", 3_300), cash("cash", "CUP", 100_000)])).unwrap();
    assert_eq!((charged.status.as_str(), charged.method.as_str()), ("queued", "cash_usd"));
    let summary = shift_summary(&conn, "S1").unwrap();
    let usd = summary.currencies.iter().find(|c| c.currency == "USD").unwrap();
    assert_eq!((usd.sales_cash_minor, usd.other_in_minor, usd.expected_minor), (0, 3_300, 8_300), "not a sale");
    let cup = summary.currencies.iter().find(|c| c.currency == "CUP").unwrap();
    assert_eq!(cup.expected_minor, 100_000);
    let event = &outbox(&conn, "web_order.charged")[0];
    assert_eq!((event["order_id"].as_i64(), event["method"].as_str()), (Some(4223), Some("cash_usd")));
    let moves = outbox(&conn, "cash_movement.recorded");
    assert!(moves.iter().all(|m| m["kind"] == "order_cash" && m["source_type"] == "web_order" && m["source_id"] == "4223"));

    // Retry with the same id: same result, nothing new. Another charge of the same order: refused.
    assert_eq!(record_charge(&mut conn, &s, &charge_input("W1", 4223, vec![cash("cash", "USD", 3_300)])).unwrap(), charged);
    let twice = record_charge(&mut conn, &s, &charge_input("W2", 4223, vec![cash("cash", "USD", 3_300)])).unwrap_err();
    assert!(twice.to_string().contains("ya se cobró"));
    assert_eq!(queued_charges(&conn, "casa-viva").unwrap().len(), 1);

    let done = mark_done(&conn, "W1", Some("Recogida completada."), "2026-10-20T11:00:05Z").unwrap();
    assert_eq!(done.status, "done");
    assert!(queued_charges(&conn, "casa-viva").unwrap().is_empty());
    assert_eq!(recent_charges(&conn, "casa-viva", 10).unwrap().len(), 1);
}

#[test]
fn an_order_already_charged_in_ventas_is_taken_back_out_of_the_drawer() {
    let mut conn = db();
    let s = scope("nana");
    open_shift(&mut conn, &s, &open("S1", Some("opener"), &[("USD", 5_000)])).unwrap();
    record_charge(&mut conn, &s, &charge_input("W1", 4300, vec![cash("cash", "USD", 3_300)])).unwrap();
    record_attempt_failure(&conn, "W1", "sin conexión").unwrap();
    let (refused, corrected) =
        mark_refused(&mut conn, &s, "W1", "Este pedido ya se cobró en Ventas.", "2026-10-20T12:00:00Z", "W1-refused").unwrap();
    assert!(corrected);
    assert_eq!((refused.status.as_str(), refused.attempts), ("refused", 1));
    let usd = shift_summary(&conn, "S1").unwrap().currencies.into_iter().find(|c| c.currency == "USD").unwrap();
    assert_eq!(usd.expected_minor, 5_000, "only the opening float is left");
    // Calling it again changes nothing.
    let (_, again) = mark_refused(&mut conn, &s, "W1", "x", "2026-10-20T12:01:00Z", "W1-refused-2").unwrap();
    assert!(!again);
}

fn vuelto(id: &str, order: i64, currency: &str, amount: i64) -> VueltoInput {
    VueltoInput {
        movement_id: id.into(),
        outbox_id: format!("{id}-out"),
        shift_id: "S1".into(),
        order_id: order,
        order_number: order.to_string(),
        messenger: Some("Daiquel".into()),
        currency: currency.into(),
        amount_minor: amount,
        staff_id: Some("staff-nana".into()),
        occurred_at: "2026-10-20T10:00:00Z".into(),
    }
}

fn usd(conn: &Connection) -> CurrencySummary {
    shift_summary(conn, "S1").unwrap().currencies.into_iter().find(|c| c.currency == "USD").unwrap()
}

#[test]
fn the_change_leaves_the_fund_and_comes_back_with_the_charge_not_as_a_sale() {
    // Lennys: sale 15, the messenger takes 5 of change from the fund, brings 20: 15 sale + 5 back to the fund.
    let mut conn = db();
    let s = scope("nana");
    open_shift(&mut conn, &s, &open("S1", Some("opener"), &[("USD", 25_700)])).unwrap();
    record_vuelto(&mut conn, &s, &vuelto("V1", 4300, "USD", 500), true).unwrap();
    assert_eq!(usd(&conn).expected_minor, 25_200, "the fund lends the change");
    assert_eq!(outstanding_vuelto(&conn, "casa-viva", 4300).unwrap(), vec![("USD".to_string(), 500)]);
    // More change later (the customer needed it after all).
    record_vuelto(&mut conn, &s, &vuelto("V2", 4300, "USD", 200), true).unwrap();

    record_charge(&mut conn, &s, &charge_input("W1", 4300, vec![cash("cash", "USD", 1_500)])).unwrap();
    let after = usd(&conn);
    assert_eq!(after.sales_cash_minor, 0, "neither the order nor the change is a caja sale");
    assert_eq!(after.expected_minor, 25_700 + 1_500, "fund back whole + the order money");
    assert_eq!(outstanding_vuelto(&conn, "casa-viva", 4300).unwrap(), vec![("USD".to_string(), 0)]);
    let backs = outbox(&conn, "cash_movement.recorded").into_iter().filter(|m| m["category"] == "vuelto_devuelto").collect::<Vec<_>>();
    assert_eq!(backs.len(), 1);
    assert_eq!((backs[0]["amount_minor"].as_i64(), backs[0]["source_id"].as_str()), (Some(700), Some("4300")));
}

#[test]
fn change_can_come_back_without_a_charge_but_never_more_than_was_given() {
    let mut conn = db();
    let s = scope("nana");
    open_shift(&mut conn, &s, &open("S1", Some("opener"), &[("CUP", 100_000)])).unwrap();
    record_vuelto(&mut conn, &s, &vuelto("V1", 4400, "CUP", 50_000), true).unwrap();
    let err = record_vuelto(&mut conn, &s, &vuelto("B1", 4400, "CUP", 60_000), false).unwrap_err();
    assert!(err.to_string().contains("no está en la calle"));
    record_vuelto(&mut conn, &s, &vuelto("B2", 4400, "CUP", 50_000), false).unwrap();
    let cup = shift_summary(&conn, "S1").unwrap().currencies.into_iter().find(|c| c.currency == "CUP").unwrap();
    assert_eq!(cup.expected_minor, 100_000);
    // The old manual way (Caja → Salida / Entrada) keeps working.
    let mut manual = RecordMovementInput {
        movement_id: "M1".into(), outbox_id: "M1-out".into(), shift_id: "S1".into(), kind: MovementKind::CashOut, direction: None,
        currency: "CUP".into(), amount_minor: 10_000, reason: "Vuelto #4401 con Ely".into(), category: None, source_system: None,
        source_type: None, source_id: None, corrects_movement_id: None, operator_id: None, occurred_at: "2026-10-20T11:00:00Z".into(),
    };
    record_movement(&mut conn, &s, &manual).unwrap();
    manual.movement_id = "M2".into();
    manual.outbox_id = "M2-out".into();
    manual.kind = MovementKind::CashIn;
    manual.reason = "Vuelve el vuelto #4401".into();
    let back = record_movement(&mut conn, &s, &manual).unwrap();
    assert_eq!(back.currencies.iter().find(|c| c.currency == "CUP").unwrap().expected_minor, 100_000);
}

#[test]
fn the_close_keeps_the_paper_details() {
    let mut conn = db();
    open_shift(&mut conn, &scope("nana"), &open("S1", Some("opener"), &[("USD", 25_700)])).unwrap();
    let mut input = close("S1", &[("USD", 25_700)], None);
    input.details = Some(serde_json::json!({
        "bills": { "USD": { "100": 2, "50": 1, "5": 1, "1": 2 } },
        "transfers": [{ "type": "cup", "amountMinor": 1_215_000, "last4": "2690" }]
    }));
    close_shift(&mut conn, &scope("nana"), &input).unwrap();
    let payload = &outbox(&conn, "cash_shift.closed")[0];
    assert_eq!(payload["details"]["bills"]["USD"]["100"], 2);
    assert_eq!(payload["details"]["transfers"][0]["last4"], "2690");
}
