//! Field-test stand-ins: crashes, failures mid-sale, a long day offline and
//! retries after a lost answer. Each test checks that nothing is half-saved,
//! lost or counted twice — locally and in a simulated cloud that, like
//! `nexo_business.sync_events`, stores each event ID once.

use nexo_business_db::apply_all_migrations;
use nexo_business_db::cash_shift::ShiftScope;
use nexo_business_db::sale::*;
use nexo_business_db::stock::{current_stock, replace_snapshot, CloudStock};
use nexo_business_db::sync::*;
use rusqlite::Connection;
use std::collections::HashSet;
use std::path::PathBuf;

fn scope() -> ShiftScope {
    ShiftScope { business_id: "casa-viva".into(), branch_id: "casa-viva-main".into(), device_id: "android-pilot-01".into() }
}

fn seed(conn: &Connection) {
    apply_all_migrations(conn).unwrap();
    conn.execute_batch(
        "INSERT INTO local_products (id,business_id,name,active,version,updated_at) VALUES
           ('toalla','casa-viva','Toalla',1,1,'t'),('sarten','casa-viva','Sartén',1,1,'t');",
    )
    .unwrap();
    // Los ensayos offline parten de un último conteo verificable; sin él
    // una caja no debe autorizar ventas aunque no tenga internet.
    conn.execute_batch("INSERT INTO local_stock_snapshot (business_id,product_id,quantity,min_stock,fetched_at) VALUES
        ('casa-viva','toalla',10000,NULL,'2026-10-03T07:00:00Z'),
        ('casa-viva','sarten',10000,NULL,'2026-10-03T07:00:00Z');").unwrap();
}

fn memory_db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    seed(&conn);
    conn
}

/// A real file, so a "crash" can drop the connection and reopen the data.
fn file_db(name: &str) -> (PathBuf, Connection) {
    let path = std::env::temp_dir().join(format!("nexo-resilience-{name}-{}.db", std::process::id()));
    let _ = std::fs::remove_file(&path);
    let conn = Connection::open(&path).unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    conn.pragma_update(None, "journal_mode", "WAL").unwrap();
    seed(&conn);
    (path, conn)
}

fn reopen(path: &PathBuf) -> Connection {
    let conn = Connection::open(path).unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    conn
}

fn count(conn: &Connection, table: &str) -> i64 {
    conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0)).unwrap()
}

fn sale_input(id: &str, product: &str, qty: i64, price: i64, at: &str) -> CompleteSaleInput {
    CompleteSaleInput {
        sale_id: id.into(),
        outbox_id: format!("{id}-out"),
        total_minor: qty * price,
        occurred_at: at.into(),
        lines: vec![SaleLineInput {
            line_id: format!("{id}-l1"),
            movement_id: format!("{id}-m1"),
            product_id: product.into(),
            quantity: qty,
            unit_price_minor: price,
            line_total_minor: qty * price,
            extra: false,
        }],
        payments: vec![PaymentInput {
            payment_id: format!("{id}-p1"),
            method: "cash".into(),
            currency: "USD".into(),
            amount_minor: qty * price,
            usd_minor: qty * price,
            exchange_rate: None,
            provider: None,
            external_ref: None,
        }],
        payment_id: None,
        gestor_id: None,
        staff_id: None,
    }
}

/// Simulated cloud: stores each event ID once, answers like nexo-sync-push.
#[derive(Default)]
struct Cloud {
    events: HashSet<String>,
    received: usize,
}

impl Cloud {
    fn push(&mut self, batch: &[OutboxEvent]) -> Vec<PushResult> {
        batch
            .iter()
            .map(|e| {
                self.received += 1;
                let status = if self.events.insert(e.event_id.clone()) { PushStatus::Applied } else { PushStatus::Duplicate };
                PushResult { event_id: e.event_id.clone(), status, error: None }
            })
            .collect()
    }
}

/// Drains the outbox the way the POS does (batches of 100).
fn sync_all(conn: &mut Connection, cloud: &mut Cloud, now: &str) {
    for _ in 0..50 {
        let batch = pending_batch(conn, now, 100).unwrap();
        if batch.is_empty() {
            return;
        }
        let results = cloud.push(&batch);
        record_push_results(conn, &results, now).unwrap();
    }
    panic!("outbox never drained");
}

#[test]
fn a_crash_before_commit_leaves_no_trace_of_the_sale() {
    let (path, conn) = file_db("crash");
    {
        // The app dies with the transaction open: same writes as complete_sale, no commit.
        let tx = conn.unchecked_transaction().unwrap();
        tx.execute(
            "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status) VALUES ('s1','casa-viva','b','d','USD',1000,'t','pending')",
            [],
        )
        .unwrap();
        tx.execute("INSERT INTO local_sale_lines (id,sale_id,product_id,quantity,unit_price_minor,line_total_minor) VALUES ('l1','s1','toalla',1,1000,1000)", []).unwrap();
        std::mem::forget(tx); // no rollback call: like a killed process
    }
    drop(conn);
    let conn = reopen(&path);
    assert_eq!((count(&conn, "local_sales"), count(&conn, "local_sale_lines"), count(&conn, "local_outbox")), (0, 0, 0));
    // The POS can sell again normally after the restart.
    let mut conn = conn;
    complete_sale(&mut conn, &scope(), &sale_input("s2", "toalla", 1, 1000, "t")).unwrap();
    assert_eq!(count(&conn, "local_sales"), 1);
    drop(conn);
    let _ = std::fs::remove_file(&path);
}

#[test]
fn a_committed_sale_survives_a_restart_whole() {
    let (path, mut conn) = file_db("restart");
    complete_sale(&mut conn, &scope(), &sale_input("s1", "toalla", 2, 1400, "t")).unwrap();
    drop(conn); // app closed or killed right after the sale
    let conn = reopen(&path);
    assert_eq!(
        (count(&conn, "local_sales"), count(&conn, "local_sale_lines"), count(&conn, "local_payments"), count(&conn, "local_inventory_movements"), count(&conn, "local_outbox")),
        (1, 1, 1, 1, 1)
    );
    drop(conn);
    let _ = std::fs::remove_file(&path);
}

#[test]
fn a_failing_line_rolls_back_the_whole_sale() {
    let mut conn = memory_db();
    let mut input = sale_input("s1", "toalla", 1, 1000, "t");
    input.lines.push(SaleLineInput {
        line_id: "s1-l2".into(),
        movement_id: "s1-m2".into(),
        product_id: "no-existe".into(),
        quantity: 1,
        unit_price_minor: 500,
        line_total_minor: 500,
        extra: false,
    });
    input.total_minor = 1500;
    input.payments[0].amount_minor = 1500;
    input.payments[0].usd_minor = 1500;
    assert!(complete_sale(&mut conn, &scope(), &input).is_err());
    for table in ["local_sales", "local_sale_lines", "local_payments", "local_inventory_movements", "local_outbox"] {
        assert_eq!(count(&conn, table), 0, "{table} kept a partial sale");
    }
}

#[test]
fn the_same_sale_id_is_never_stored_twice() {
    let mut conn = memory_db();
    complete_sale(&mut conn, &scope(), &sale_input("s1", "toalla", 1, 1000, "t")).unwrap();
    assert!(complete_sale(&mut conn, &scope(), &sale_input("s1", "toalla", 1, 1000, "t")).is_err());
    assert_eq!((count(&conn, "local_sales"), count(&conn, "local_payments"), count(&conn, "local_outbox")), (1, 1, 1));
}

#[test]
fn a_long_day_offline_reaches_the_cloud_once() {
    let mut conn = memory_db();
    // 8 hours, one sale every two minutes, nothing sent.
    for i in 0..240 {
        let at = format!("2026-10-03T{:02}:{:02}:00Z", 8 + i / 30, (i % 30) * 2);
        let product = if i % 3 == 0 { "sarten" } else { "toalla" };
        complete_sale(&mut conn, &scope(), &sale_input(&format!("s{i:03}"), product, 1, 1000, &at)).unwrap();
    }
    assert_eq!(sync_state(&conn).unwrap().pending, 240);

    let mut cloud = Cloud::default();
    sync_all(&mut conn, &mut cloud, "2026-10-03T17:00:00Z");
    let state = sync_state(&conn).unwrap();
    assert_eq!((state.pending, state.synced), (0, 240));
    assert_eq!((cloud.events.len(), cloud.received), (240, 240));
    // A second sync sends nothing.
    sync_all(&mut conn, &mut cloud, "2026-10-03T17:05:00Z");
    assert_eq!(cloud.received, 240);
}

#[test]
fn a_lost_answer_is_resent_and_the_cloud_keeps_one_copy() {
    let mut conn = memory_db();
    for i in 0..5 {
        complete_sale(&mut conn, &scope(), &sale_input(&format!("s{i}"), "toalla", 1, 1000, "t")).unwrap();
    }
    let mut cloud = Cloud::default();
    // The cloud stores the batch but the answer never arrives (signal lost).
    let batch = pending_batch(&conn, "now", 100).unwrap();
    cloud.push(&batch);
    record_transport_failure(&mut conn, &batch.iter().map(|e| e.event_id.clone()).collect::<Vec<_>>(), "timeout", "2026-10-03T12:00:00Z").unwrap();
    assert_eq!(sync_state(&conn).unwrap().pending, 5);
    // After the backoff the POS resends: the cloud answers duplicate, still one copy each.
    sync_all(&mut conn, &mut cloud, "2026-10-03T13:00:00Z");
    assert_eq!(sync_state(&conn).unwrap().pending, 0);
    assert_eq!((cloud.events.len(), cloud.received), (5, 10));
}

#[test]
fn stock_stays_right_through_an_offline_day_and_the_next_snapshot() {
    let mut conn = memory_db();
    replace_snapshot(&mut conn, "casa-viva", &[CloudStock { product_id: "toalla".into(), quantity: 20, min_stock: None }], "2026-10-03T07:00:00Z").unwrap();
    for i in 0..6 {
        complete_sale(&mut conn, &scope(), &sale_input(&format!("s{i}"), "toalla", 1, 1000, &format!("2026-10-03T1{i}:00:00Z"))).unwrap();
    }
    let qty = |conn: &Connection| current_stock(conn, "casa-viva", &["toalla".into()]).unwrap()[0].quantity;
    assert_eq!(qty(&conn), 14, "offline sales are taken off the old snapshot");
    let mut cloud = Cloud::default();
    sync_all(&mut conn, &mut cloud, "2026-10-03T18:00:00Z");
    assert_eq!(qty(&conn), 14, "synced after the snapshot: still not in it");
    // The next pull includes them (20 - 6): nothing is subtracted twice.
    replace_snapshot(&mut conn, "casa-viva", &[CloudStock { product_id: "toalla".into(), quantity: 14, min_stock: None }], "2026-10-03T18:01:00Z").unwrap();
    assert_eq!(qty(&conn), 14);
}
