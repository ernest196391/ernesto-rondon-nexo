use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::{open_shift, shift_summary, OpenShiftInput, OpeningFloatInput, ShiftScope};
use nexo_business_db::sale::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    apply_all_migrations(&conn).unwrap();
    conn.execute_batch("INSERT INTO local_products (id,business_id,name,active,version,updated_at) VALUES ('silla','casa-viva','Silla',1,1,'t');").unwrap();
    conn
}

fn scope() -> ShiftScope {
    ShiftScope { business_id: "casa-viva".into(), branch_id: "casa-viva-main".into(), device_id: "pos-1".into() }
}

fn pay(id: &str, method: &str, currency: &str, amount: i64, usd: i64, rate: Option<&str>) -> PaymentInput {
    PaymentInput {
        payment_id: id.into(),
        method: method.into(),
        currency: currency.into(),
        amount_minor: amount,
        usd_minor: usd,
        exchange_rate: rate.map(Into::into),
        provider: None,
        external_ref: None,
    }
}

/// One line of 2 × $18.50 = $37.00.
fn sale(id: &str, payments: Vec<PaymentInput>) -> CompleteSaleInput {
    CompleteSaleInput {
        sale_id: id.into(),
        outbox_id: format!("{id}-out"),
        total_minor: 3700,
        occurred_at: "2026-10-03T15:00:00Z".into(),
        lines: vec![SaleLineInput {
            line_id: format!("{id}-l1"),
            movement_id: format!("{id}-m1"),
            product_id: "silla".into(),
            quantity: 2,
            unit_price_minor: 1850,
            line_total_minor: 3700,
        }],
        payments,
        payment_id: None,
    }
}

fn scalar(conn: &Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |r| r.get(0)).unwrap()
}

#[test]
fn records_a_three_way_split_with_rates_and_references() {
    let mut conn = db();
    let mut transfer = pay("p2", "transfer", "CUP", 833_000, 1700, Some("490"));
    transfer.provider = Some(" EnZona ".into());
    transfer.external_ref = Some(" 4821 ".into());
    let input = sale("s1", vec![pay("p1", "cash", "USD", 1000, 1000, None), transfer, pay("p3", "crypto", "USDT", 1000, 1000, Some("1"))]);
    complete_sale(&mut conn, &scope(), &input).unwrap();

    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_payments WHERE sale_id='s1'"), 3);
    assert_eq!(scalar(&conn, "SELECT SUM(usd_minor) FROM local_payments WHERE sale_id='s1'"), 3700);
    let (rail, provider, reference, rate): (String, String, String, String) = conn
        .query_row("SELECT rail,provider,external_ref,exchange_rate FROM local_payments WHERE id='p2'", [], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)))
        .unwrap();
    assert_eq!((rail.as_str(), provider.as_str(), reference.as_str(), rate.as_str()), ("transfer", "enzona", "4821", "490"));
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_payments WHERE id='p3' AND rail='digital_asset'"), 1);

    let payload: String = conn.query_row("SELECT payload_json FROM local_outbox WHERE entity_id='s1'", [], |r| r.get(0)).unwrap();
    let v: serde_json::Value = serde_json::from_str(&payload).unwrap();
    assert_eq!(v["payload"]["payment_method"], "split");
    assert_eq!(v["payload"]["payments"].as_array().unwrap().len(), 3);
    assert_eq!(v["payload"]["payments"][1]["external_ref"], "4821");
}

#[test]
fn rejects_payments_that_do_not_add_up_to_the_total() {
    let mut conn = db();
    let short = sale("s1", vec![pay("p1", "cash", "USD", 3000, 3000, None)]);
    assert!(complete_sale(&mut conn, &scope(), &short).unwrap_err().to_string().contains("no cubren"));
    let over = sale("s2", vec![pay("p1", "cash", "USD", 4000, 4000, None)]);
    assert!(complete_sale(&mut conn, &scope(), &over).unwrap_err().to_string().contains("cambio"));
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_sales"), 0);
}

#[test]
fn rejects_a_foreign_currency_payment_that_does_not_match_its_rate() {
    let mut conn = db();
    // 3700 USD cents at 490 = 1,813,000 CUP cents; 1,700,000 is off by far more than a cent.
    let wrong = sale("s1", vec![pay("p1", "cash", "CUP", 1_700_000, 3700, Some("490"))]);
    assert!(complete_sale(&mut conn, &scope(), &wrong).is_err());
    let no_rate = sale("s2", vec![pay("p1", "cash", "CUP", 1_813_000, 3700, None)]);
    assert!(complete_sale(&mut conn, &scope(), &no_rate).unwrap_err().to_string().contains("tasa"));
    let ok = sale("s3", vec![pay("p1", "cash", "CUP", 1_813_000, 3700, Some("490"))]);
    complete_sale(&mut conn, &scope(), &ok).unwrap();
}

#[test]
fn rejects_unknown_methods_and_too_many_payments() {
    let mut conn = db();
    assert!(complete_sale(&mut conn, &scope(), &sale("s1", vec![pay("p1", "cheque", "USD", 3700, 3700, None)])).is_err());
    let five = (0..5).map(|i| pay(&format!("p{i}"), "cash", "USD", 740, 740, None)).collect();
    assert!(complete_sale(&mut conn, &scope(), &sale("s2", five)).unwrap_err().to_string().contains("máximo"));
}

#[test]
fn older_pos_builds_still_record_one_usd_cash_payment() {
    let mut conn = db();
    let mut input = sale("s1", vec![]);
    input.payment_id = Some("legacy-pay".into());
    complete_sale(&mut conn, &scope(), &input).unwrap();
    assert_eq!(scalar(&conn, "SELECT COUNT(*) FROM local_payments WHERE id='legacy-pay' AND rail='cash' AND currency='USD' AND amount_minor=3700"), 1);
}

#[test]
fn cash_in_each_currency_reaches_the_open_drawer() {
    let mut conn = db();
    open_shift(&mut conn, &scope(), &OpenShiftInput {
        shift_id: "sh1".into(),
        outbox_id: "sh1-out".into(),
        operator_id: None,
        primary_currency: "USD".into(),
        location_id: None,
        opening_floats: vec![OpeningFloatInput { movement_id: "f1".into(), currency: "USD".into(), amount_minor: 0 }],
        opened_at: "2026-10-03T14:00:00Z".into(),
    })
    .unwrap();
    let input = sale("s1", vec![
        pay("p1", "cash", "USD", 2000, 2000, None),
        pay("p2", "cash", "CUP", 833_000, 1700, Some("490")),
    ]);
    assert_eq!(complete_sale(&mut conn, &scope(), &input).unwrap().as_deref(), Some("sh1"));
    let summary = shift_summary(&conn, "sh1").unwrap();
    let cash = |c: &str| summary.currencies.iter().find(|x| x.currency == c).map(|x| x.sales_cash_minor);
    assert_eq!((cash("USD"), cash("CUP")), (Some(2000), Some(833_000)));
}

#[test]
fn keeps_the_rates_in_force() {
    let mut conn = db();
    let rate = |c: &str, r: &str| ExchangeRate { currency: c.into(), per_usd: r.into(), set_at: "t".into() };
    replace_rates(&mut conn, "casa-viva", &[rate("cup", "490"), rate("MLC", "1.2")], "now").unwrap();
    replace_rates(&mut conn, "casa-viva", &[rate("CUP", "495")], "later").unwrap();
    assert_eq!(current_rates(&conn, "casa-viva").unwrap(), vec![rate("CUP", "495")]);
    assert!(replace_rates(&mut conn, "casa-viva", &[rate("CUP", "-1")], "x").is_err());
}
