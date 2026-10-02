use nexo_business_db::cash_shift::*;
use nexo_business_db::{apply_all_migrations, cash_ledger_ready, MIGRATIONS};
use rusqlite::{params, Connection};

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn
}

fn scope(device: &str) -> ShiftScope {
    ShiftScope {
        business_id: "casa-viva".into(),
        branch_id: "casa-viva-main".into(),
        device_id: device.into(),
    }
}

fn open_input(id: &str, floats: &[(&str, i64)]) -> OpenShiftInput {
    OpenShiftInput {
        shift_id: id.into(),
        outbox_id: format!("{id}-outbox"),
        operator_id: Some("op-ana".into()),
        primary_currency: "cup".into(),
        opening_floats: floats
            .iter()
            .map(|(currency, amount)| OpeningFloatInput {
                movement_id: format!("{id}-float-{currency}"),
                currency: (*currency).into(),
                amount_minor: *amount,
            })
            .collect(),
        opened_at: "2026-10-02T08:00:00Z".into(),
    }
}

fn movement(
    id: &str,
    shift: &str,
    kind: MovementKind,
    currency: &str,
    amount: i64,
    reason: &str,
) -> RecordMovementInput {
    RecordMovementInput {
        movement_id: id.into(),
        outbox_id: format!("{id}-outbox"),
        shift_id: shift.into(),
        kind,
        direction: None,
        currency: currency.into(),
        amount_minor: amount,
        reason: reason.into(),
        category: None,
        source_type: None,
        source_id: None,
        corrects_movement_id: None,
        operator_id: Some("op-ana".into()),
        occurred_at: "2026-10-02T10:00:00Z".into(),
    }
}

fn count(id: &str, currency: &str, counted: i64) -> CountInput {
    CountInput {
        count_id: id.into(),
        currency: currency.into(),
        counted_minor: counted,
    }
}

fn close_input(shift: &str, counts: Vec<CountInput>) -> CloseShiftInput {
    CloseShiftInput {
        shift_id: shift.into(),
        outbox_id: format!("{shift}-close-outbox"),
        counts,
        closed_by: Some("op-ana".into()),
        note: None,
        closed_at: "2026-10-02T18:00:00Z".into(),
    }
}

/// Mirrors the POS sale transaction: sale + one payment, attached to a shift.
fn insert_sale(
    conn: &Connection,
    id: &str,
    shift: Option<&str>,
    method: &str,
    currency: &str,
    amount: i64,
) {
    conn.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status,shift_id)
         VALUES (?1,'casa-viva','casa-viva-main','android-pilot-01',?2,?3,'2026-10-02T12:00:00Z','pending',?4)",
        params![id, currency, amount, shift],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO local_payments (id,sale_id,method,currency,amount_minor,occurred_at) VALUES (?1,?2,?3,?4,?5,'2026-10-02T12:00:00Z')",
        params![format!("{id}-pay"), id, method, currency, amount],
    )
    .unwrap();
}

fn currency<'a>(summary: &'a ShiftSummary, code: &str) -> &'a CurrencySummary {
    summary
        .currencies
        .iter()
        .find(|c| c.currency == code)
        .unwrap()
}

fn scalar(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn migrations_apply_in_order_and_enable_ledger() {
    let conn = db();
    assert!(cash_ledger_ready(&conn).unwrap());
    let versions: Vec<i64> = MIGRATIONS.iter().map(|m| m.version).collect();
    assert_eq!(versions, vec![1, 2, 3, 4]);
}

#[test]
fn legacy_0003_shift_keeps_opening_float_after_0004() {
    let conn = Connection::open_in_memory().unwrap();
    for migration in &MIGRATIONS[..3] {
        conn.execute_batch(migration.sql).unwrap();
    }
    assert!(!cash_ledger_ready(&conn).unwrap());
    conn.execute(
        "INSERT INTO local_cash_shifts (id,business_id,branch_id,device_id,currency,opening_float_minor,opened_at)
         VALUES ('legacy','casa-viva','casa-viva-main','android-pilot-01','USD',5000,'2026-10-01T08:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute_batch(MIGRATIONS[3].sql).unwrap();
    let summary = shift_summary(&conn, "legacy").unwrap();
    assert_eq!(currency(&summary, "USD").expected_minor, 5000);
}

#[test]
fn opens_multi_currency_shift_with_outbox() {
    let mut conn = db();
    let summary = open_shift(
        &mut conn,
        &scope("android-pilot-01"),
        &open_input("s1", &[("CUP", 100_000), ("usd", 2_000), ("MLC", 0)]),
    )
    .unwrap();
    assert_eq!(summary.status, "open");
    assert_eq!(summary.primary_currency, "CUP");
    assert_eq!(currency(&summary, "CUP").expected_minor, 100_000);
    assert_eq!(currency(&summary, "USD").expected_minor, 2_000);
    assert_eq!(currency(&summary, "MLC").expected_minor, 0);
    // Zero float tracks the currency without writing a zero movement.
    assert_eq!(
        scalar(&conn, "SELECT COUNT(*) FROM local_cash_movements"),
        2
    );
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_outbox WHERE operation_type='cash_shift.opened'"
        ),
        1
    );
}

#[test]
fn rejects_negative_or_duplicate_opening_floats() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    assert!(matches!(
        open_shift(&mut conn, &s, &open_input("s1", &[("CUP", -1)])),
        Err(CashError::Validation(_))
    ));
    assert!(matches!(
        open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 1), ("cup", 2)])),
        Err(CashError::Validation(_))
    ));
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_cash_shifts"), 0);
}

#[test]
fn one_open_shift_per_device_but_devices_run_in_parallel() {
    let mut conn = db();
    open_shift(
        &mut conn,
        &scope("android-pilot-01"),
        &open_input("s1", &[("CUP", 100)]),
    )
    .unwrap();
    let second = open_shift(
        &mut conn,
        &scope("android-pilot-01"),
        &open_input("s2", &[("CUP", 100)]),
    );
    assert!(matches!(second, Err(CashError::Conflict(_))));
    open_shift(
        &mut conn,
        &scope("windows-pilot-01"),
        &open_input("s3", &[("CUP", 100)]),
    )
    .unwrap();
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_cash_shifts WHERE status='open'"
        ),
        2
    );
}

#[test]
fn open_retry_is_idempotent() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    let input = open_input("s1", &[("CUP", 100)]);
    let first = open_shift(&mut conn, &s, &input).unwrap();
    let again = open_shift(&mut conn, &s, &input).unwrap();
    assert_eq!(first, again);
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_cash_shifts"), 1);
    assert_eq!(
        scalar(&conn, "SELECT COUNT(*) FROM local_cash_movements"),
        1
    );
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_outbox"), 1);
}

#[test]
fn open_is_atomic_when_outbox_write_fails() {
    let mut conn = db();
    conn.execute(
        "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at)
         VALUES ('s1-outbox','casa-viva','x','x','x','x','{}','x')",
        [],
    )
    .unwrap();
    assert!(open_shift(
        &mut conn,
        &scope("android-pilot-01"),
        &open_input("s1", &[("CUP", 100)])
    )
    .is_err());
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_cash_shifts"), 0);
    assert_eq!(
        scalar(&conn, "SELECT COUNT(*) FROM local_cash_movements"),
        0
    );
    assert_eq!(
        scalar(&conn, "SELECT COUNT(*) FROM local_cash_shift_currencies"),
        0
    );
}

#[test]
fn expected_cash_counts_cash_sales_but_not_transfers() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 10_000)])).unwrap();
    insert_sale(&conn, "sale-cash", Some("s1"), "cash", "CUP", 25_000);
    insert_sale(
        &conn,
        "sale-transfer",
        Some("s1"),
        "transfer",
        "CUP",
        40_000,
    );
    insert_sale(&conn, "sale-no-shift", None, "cash", "CUP", 99_000);
    record_movement(
        &mut conn,
        &s,
        &movement(
            "m-in",
            "s1",
            MovementKind::CashIn,
            "CUP",
            5_000,
            "Cambio adicional",
        ),
    )
    .unwrap();
    let mut expense = movement(
        "m-exp",
        "s1",
        MovementKind::Expense,
        "CUP",
        3_000,
        "Mensajería",
    );
    expense.category = Some("transporte".into());
    let summary = record_movement(&mut conn, &s, &expense).unwrap();

    let cup = currency(&summary, "CUP");
    assert_eq!(cup.opening_float_minor, 10_000);
    assert_eq!(cup.sales_cash_minor, 25_000);
    assert_eq!(cup.other_in_minor, 5_000);
    assert_eq!(cup.other_out_minor, 3_000);
    assert_eq!(cup.expected_minor, 37_000);
}

#[test]
fn movement_validation_writes_nothing() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 1_000)])).unwrap();
    let before = scalar(&conn, "SELECT COUNT(*) FROM local_cash_movements");

    let cases = vec![
        movement("m1", "s1", MovementKind::CashIn, "CUP", 100, "   "),
        movement("m2", "s1", MovementKind::CashIn, "CUP", 0, "Cambio"),
        movement(
            "m3",
            "s1",
            MovementKind::CashOut,
            "CUP",
            1_001,
            "Retiro mayor que la caja",
        ),
        movement(
            "m4",
            "s1",
            MovementKind::Correction,
            "CUP",
            10,
            "Sin dirección ni objetivo",
        ),
        movement(
            "m5",
            "s1",
            MovementKind::CashIn,
            "C$",
            10,
            "Moneda inválida",
        ),
    ];
    for case in cases {
        assert!(
            matches!(
                record_movement(&mut conn, &s, &case),
                Err(CashError::Validation(_))
            ),
            "{}",
            case.movement_id
        );
    }
    let mut wrong_direction = movement("m6", "s1", MovementKind::Expense, "CUP", 10, "Gasto");
    wrong_direction.direction = Some(Direction::In);
    assert!(record_movement(&mut conn, &s, &wrong_direction).is_err());

    assert_eq!(
        scalar(&conn, "SELECT COUNT(*) FROM local_cash_movements"),
        before
    );
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_outbox WHERE entity_type='cash_movement'"
        ),
        0
    );
}

#[test]
fn corrections_reference_a_movement_and_adjust_expected() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 1_000)])).unwrap();
    record_movement(
        &mut conn,
        &s,
        &movement("m-in", "s1", MovementKind::CashIn, "CUP", 500, "Cambio"),
    )
    .unwrap();

    let mut fix = movement(
        "m-fix",
        "s1",
        MovementKind::Correction,
        "CUP",
        50,
        "Se tecleó 500 en vez de 450",
    );
    fix.direction = Some(Direction::Out);
    fix.corrects_movement_id = Some("m-in".into());
    let summary = record_movement(&mut conn, &s, &fix).unwrap();
    assert_eq!(currency(&summary, "CUP").expected_minor, 1_450);

    let mut orphan = movement(
        "m-orphan",
        "s1",
        MovementKind::Correction,
        "CUP",
        50,
        "Objetivo inexistente",
    );
    orphan.direction = Some(Direction::In);
    orphan.corrects_movement_id = Some("nope".into());
    assert!(record_movement(&mut conn, &s, &orphan).is_err());
}

#[test]
fn movement_retry_is_idempotent() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 1_000)])).unwrap();
    let m = movement(
        "m-in",
        "s1",
        MovementKind::MessengerReturn,
        "CUP",
        700,
        "Mensajero devuelve cobro",
    );
    record_movement(&mut conn, &s, &m).unwrap();
    let summary = record_movement(&mut conn, &s, &m).unwrap();
    assert_eq!(currency(&summary, "CUP").expected_minor, 1_700);
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_outbox WHERE entity_type='cash_movement'"
        ),
        1
    );
}

#[test]
fn other_device_cannot_write_to_shift() {
    let mut conn = db();
    open_shift(
        &mut conn,
        &scope("android-pilot-01"),
        &open_input("s1", &[("CUP", 1_000)]),
    )
    .unwrap();
    let result = record_movement(
        &mut conn,
        &scope("windows-pilot-01"),
        &movement("m", "s1", MovementKind::CashIn, "CUP", 1, "x"),
    );
    assert!(matches!(result, Err(CashError::Conflict(_))));
}

#[test]
fn close_requires_every_currency_and_is_atomic() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(
        &mut conn,
        &s,
        &open_input("s1", &[("CUP", 10_000), ("USD", 2_000)]),
    )
    .unwrap();
    let missing = close_shift(
        &mut conn,
        &s,
        &close_input("s1", vec![count("c-cup", "CUP", 10_000)]),
    );
    assert!(matches!(missing, Err(CashError::Validation(_))));
    assert_eq!(
        scalar(&conn, "SELECT COUNT(*) FROM local_cash_shift_counts"),
        0
    );
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_cash_shifts WHERE status='open'"
        ),
        1
    );
}

#[test]
fn close_records_difference_per_currency() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(
        &mut conn,
        &s,
        &open_input("s1", &[("CUP", 10_000), ("USD", 2_000)]),
    )
    .unwrap();
    insert_sale(&conn, "sale-1", Some("s1"), "cash", "CUP", 25_000);
    record_movement(
        &mut conn,
        &s,
        &movement(
            "m-out",
            "s1",
            MovementKind::CashOut,
            "USD",
            500,
            "Pago a proveedor",
        ),
    )
    .unwrap();

    let summary = close_shift(
        &mut conn,
        &s,
        &close_input(
            "s1",
            vec![count("c-cup", "CUP", 34_500), count("c-usd", "usd", 1_500)],
        ),
    )
    .unwrap();
    assert_eq!(summary.status, "closed");
    let cup = summary.counts.iter().find(|c| c.currency == "CUP").unwrap();
    assert_eq!(
        (cup.expected_minor, cup.counted_minor, cup.difference_minor),
        (35_000, 34_500, -500)
    );
    let usd = summary.counts.iter().find(|c| c.currency == "USD").unwrap();
    assert_eq!((usd.expected_minor, usd.difference_minor), (1_500, 0));

    // Legacy 0003 columns mirror the primary currency.
    let legacy: (i64, i64, i64) = conn
        .query_row(
            "SELECT expected_cash_minor, counted_cash_minor, difference_minor FROM local_cash_shifts WHERE id='s1'",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap();
    assert_eq!(legacy, (35_000, 34_500, -500));
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_outbox WHERE operation_type='cash_shift.closed'"
        ),
        1
    );
}

#[test]
fn close_retry_is_idempotent_but_different_counts_conflict() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 100)])).unwrap();
    let input = close_input("s1", vec![count("c", "CUP", 100)]);
    let first = close_shift(&mut conn, &s, &input).unwrap();
    assert_eq!(close_shift(&mut conn, &s, &input).unwrap(), first);
    let other = close_input("s1", vec![count("c2", "CUP", 90)]);
    assert!(matches!(
        close_shift(&mut conn, &s, &other),
        Err(CashError::Conflict(_))
    ));
    assert_eq!(
        scalar(
            &conn,
            "SELECT COUNT(*) FROM local_outbox WHERE operation_type='cash_shift.closed'"
        ),
        1
    );
}

#[test]
fn sale_in_untracked_currency_must_be_counted() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 100)])).unwrap();
    let shift = shift_for_sale(&conn, &s, "USD").unwrap();
    assert_eq!(shift.as_deref(), Some("s1"));
    insert_sale(&conn, "sale-usd", shift.as_deref(), "cash", "USD", 4_000);

    let only_cup = close_shift(
        &mut conn,
        &s,
        &close_input("s1", vec![count("c", "CUP", 100)]),
    );
    assert!(matches!(only_cup, Err(CashError::Validation(_))));
    close_shift(
        &mut conn,
        &s,
        &close_input("s1", vec![count("c", "CUP", 100), count("u", "USD", 4_000)]),
    )
    .unwrap();
}

#[test]
fn sale_without_open_shift_keeps_working() {
    let conn = db();
    assert_eq!(
        shift_for_sale(&conn, &scope("android-pilot-01"), "USD").unwrap(),
        None
    );
    insert_sale(&conn, "sale-1", None, "cash", "USD", 100);

    // Before 0004 is applied the lookup is a no-op instead of an error.
    let old = Connection::open_in_memory().unwrap();
    for migration in &MIGRATIONS[..2] {
        old.execute_batch(migration.sql).unwrap();
    }
    assert_eq!(
        shift_for_sale(&old, &scope("android-pilot-01"), "USD").unwrap(),
        None
    );
}

#[test]
fn closed_shift_and_ledger_are_immutable_at_schema_level() {
    let mut conn = db();
    let s = scope("android-pilot-01");
    open_shift(&mut conn, &s, &open_input("s1", &[("CUP", 100)])).unwrap();
    record_movement(
        &mut conn,
        &s,
        &movement("m1", "s1", MovementKind::CashIn, "CUP", 10, "Cambio"),
    )
    .unwrap();

    assert!(conn
        .execute(
            "UPDATE local_cash_movements SET amount_minor=1 WHERE id='m1'",
            []
        )
        .is_err());
    assert!(conn
        .execute("DELETE FROM local_cash_movements WHERE id='m1'", [])
        .is_err());
    assert!(conn
        .execute(
            "UPDATE local_cash_shifts SET opening_float_minor=0 WHERE id='s1'",
            []
        )
        .is_err());
    assert!(
        conn.execute(
            "UPDATE local_cash_shifts SET status='closed' WHERE id='s1'",
            []
        )
        .is_err(),
        "close without counts"
    );
    // Sync bookkeeping stays writable.
    conn.execute(
        "UPDATE local_cash_movements SET sync_status='synced' WHERE id='m1'",
        [],
    )
    .unwrap();

    close_shift(
        &mut conn,
        &s,
        &close_input("s1", vec![count("c", "CUP", 110)]),
    )
    .unwrap();
    assert!(conn
        .execute(
            "UPDATE local_cash_shifts SET status='open' WHERE id='s1'",
            []
        )
        .is_err());
    assert!(conn
        .execute("UPDATE local_cash_shift_counts SET counted_minor=0", [])
        .is_err());
    assert!(conn
        .execute("DELETE FROM local_cash_shifts WHERE id='s1'", [])
        .is_err());
    assert!(matches!(
        record_movement(
            &mut conn,
            &s,
            &movement("m2", "s1", MovementKind::CashIn, "CUP", 10, "Tarde")
        ),
        Err(CashError::Conflict(_))
    ));
    assert!(conn
        .execute(
            "INSERT INTO local_cash_movements (id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind)
             VALUES ('raw','s1','casa-viva','casa-viva-main','android-pilot-01','in',5,'raw','x','CUP','cash_in')",
            [],
        )
        .is_err());
    assert!(conn
        .execute(
            "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,shift_id)
             VALUES ('late-sale','casa-viva','casa-viva-main','android-pilot-01','CUP',1,'x','s1')",
            [],
        )
        .is_err());
    conn.execute(
        "UPDATE local_cash_shifts SET sync_status='synced' WHERE id='s1'",
        [],
    )
    .unwrap();
}
