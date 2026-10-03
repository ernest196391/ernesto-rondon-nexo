use nexo_business_db::cash_shift::{
    self, CloseShiftInput, OpenShiftInput, RecordMovementInput, ShiftScope, ShiftSummary,
};
use nexo_business_db::catalog::{self, ApplyResult, CatalogChange};
use nexo_business_db::device::{self, DeviceIdentity};
use nexo_business_db::stock::{self, CloudStock, ProductStock};
use nexo_business_db::sale::{self, CompleteSaleInput, ExchangeRate};
use nexo_business_db::consignment::{
    self, ConsignmentAccount, OpenConsignmentAccountInput, SettleConsignmentInput,
};
use nexo_business_db::inventory::{
    self, CountInput, CountResult, CreateLocationInput, Location, StockLine, TransferInput,
};
use nexo_business_db::messenger_custody::{
    self, CustodyBalance, CustodyWriteOffInput, RecordCollectionInput, RecordReturnInput,
};
use nexo_business_db::receivables::{
    self, OpenReceivableInput, ReceivableBalance, ReceivablePaymentInput, ReceivableWriteOffInput,
};
use nexo_business_db::sale_returns::{self, RecordSaleReturnInput, SaleReturnSummary};
use nexo_business_db::sync::{self, OutboxEvent, PushResult, SyncState};
use rusqlite::{params, Connection};
use serde::Serialize;
use std::fs;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IntegrityReport {
    sales: i64,
    sale_lines: i64,
    payments: i64,
    inventory_movements: i64,
    outbox: i64,
    incomplete_sales: i64,
    rollback_ok: bool,
}

/// Pilot device ID per platform, used until the device is provisioned.
fn pilot_device_id() -> &'static str {
    if cfg!(target_os = "android") {
        "android-pilot-01"
    } else if cfg!(target_os = "windows") {
        "windows-pilot-01"
    } else {
        "pos-pilot-01"
    }
}

/// This device's business/branch/device, from provisioning or the pilot default.
fn device_scope(conn: &Connection) -> Result<ShiftScope, String> {
    device::current_identity(conn, pilot_device_id())
        .map(|id| id.scope())
        .map_err(|e| e.to_string())
}

fn open_local_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("nexo-business.db");
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| e.to_string())?;
    Ok(conn)
}

#[tauri::command]
fn complete_sale(app: tauri::AppHandle, input: CompleteSaleInput) -> Result<(), String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    sale::complete_sale(&mut conn, &scope, &input).map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn rates_replace(app: tauri::AppHandle, rates: Vec<ExchangeRate>, fetched_at: String) -> Result<(), String> {
    let mut conn = open_local_db(&app)?;
    let business_id = device_scope(&conn)?.business_id;
    sale::replace_rates(&mut conn, &business_id, &rates, &fetched_at).map_err(|e| e.to_string())
}

#[tauri::command]
fn rates_current(app: tauri::AppHandle) -> Result<Vec<ExchangeRate>, String> {
    let conn = open_local_db(&app)?;
    let business_id = device_scope(&conn)?.business_id;
    sale::current_rates(&conn, &business_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn audit_local_integrity(app: tauri::AppHandle) -> Result<IntegrityReport, String> {
    let mut conn = open_local_db(&app)?;
    let business_id = "casa-viva";

    let count = |conn: &Connection, sql: &str| -> Result<i64, String> {
        conn.query_row(sql, [business_id], |row| row.get(0))
            .map_err(|e| e.to_string())
    };

    let sales = count(
        &conn,
        "SELECT COUNT(*) FROM local_sales WHERE business_id=?1",
    )?;
    let sale_lines = count(&conn, "SELECT COUNT(*) FROM local_sale_lines l JOIN local_sales s ON s.id=l.sale_id WHERE s.business_id=?1")?;
    let payments = count(&conn, "SELECT COUNT(*) FROM local_payments p JOIN local_sales s ON s.id=p.sale_id WHERE s.business_id=?1")?;
    let inventory_movements = count(&conn, "SELECT COUNT(*) FROM local_inventory_movements WHERE business_id=?1 AND source_type='sale'")?;
    let outbox = count(
        &conn,
        "SELECT COUNT(*) FROM local_outbox WHERE business_id=?1 AND entity_type='sale'",
    )?;
    let incomplete_sales = count(&conn, "SELECT COUNT(*) FROM local_sales s WHERE s.business_id=?1 AND (NOT EXISTS (SELECT 1 FROM local_sale_lines l WHERE l.sale_id=s.id) OR NOT EXISTS (SELECT 1 FROM local_payments p WHERE p.sale_id=s.id) OR NOT EXISTS (SELECT 1 FROM local_inventory_movements m WHERE m.source_type='sale' AND m.source_id=s.id) OR NOT EXISTS (SELECT 1 FROM local_outbox o WHERE o.entity_type='sale' AND o.entity_id=s.id))")?;

    let rollback_id = "__nexo_rollback_probe__";
    conn.execute("DELETE FROM local_sales WHERE id=?1", [rollback_id])
        .map_err(|e| e.to_string())?;
    {
        let tx = conn.transaction().map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status) VALUES (?1,?2,'probe','probe','USD',1,'probe','pending')",
            params![rollback_id, business_id],
        ).map_err(|e| e.to_string())?;
    }
    let residue: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM local_sales WHERE id=?1",
            [rollback_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(IntegrityReport {
        sales,
        sale_lines,
        payments,
        inventory_movements,
        outbox,
        incomplete_sales,
        rollback_ok: residue == 0,
    })
}

#[tauri::command]
fn cash_shift_current(app: tauri::AppHandle) -> Result<Option<ShiftSummary>, String> {
    let conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    if !nexo_business_db::cash_ledger_ready(&conn).map_err(|e| e.to_string())? {
        return Ok(None);
    }
    let shift_id = cash_shift::current_open_shift(&conn, &scope).map_err(|e| e.to_string())?;
    shift_id
        .map(|id| cash_shift::shift_summary(&conn, &id).map_err(|e| e.to_string()))
        .transpose()
}

#[tauri::command]
fn cash_shift_open(app: tauri::AppHandle, input: OpenShiftInput) -> Result<ShiftSummary, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    cash_shift::open_shift(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn cash_shift_record_movement(
    app: tauri::AppHandle,
    input: RecordMovementInput,
) -> Result<ShiftSummary, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    cash_shift::record_movement(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn cash_shift_close(app: tauri::AppHandle, input: CloseShiftInput) -> Result<ShiftSummary, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    cash_shift::close_shift(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn cash_shift_summary(app: tauri::AppHandle, shift_id: String) -> Result<ShiftSummary, String> {
    let conn = open_local_db(&app)?;
    cash_shift::shift_summary(&conn, &shift_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn receivable_open(
    app: tauri::AppHandle,
    input: OpenReceivableInput,
) -> Result<ReceivableBalance, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    receivables::open_receivable(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn receivable_record_payment(
    app: tauri::AppHandle,
    input: ReceivablePaymentInput,
) -> Result<ReceivableBalance, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    receivables::record_receivable_payment(&mut conn, &scope, &input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn receivable_write_off(
    app: tauri::AppHandle,
    input: ReceivableWriteOffInput,
) -> Result<ReceivableBalance, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    receivables::write_off_receivable(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn receivables_for_customer(
    app: tauri::AppHandle,
    customer_id: String,
) -> Result<Vec<ReceivableBalance>, String> {
    let conn = open_local_db(&app)?;
    receivables::customer_open_receivables(&conn, &device_scope(&conn)?.business_id, &customer_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn messenger_custody_collect(
    app: tauri::AppHandle,
    input: RecordCollectionInput,
) -> Result<Vec<CustodyBalance>, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    messenger_custody::record_collection(&mut conn, &scope, &input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn messenger_custody_return(
    app: tauri::AppHandle,
    input: RecordReturnInput,
) -> Result<Vec<CustodyBalance>, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    messenger_custody::record_return(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn messenger_custody_write_off(
    app: tauri::AppHandle,
    input: CustodyWriteOffInput,
) -> Result<Vec<CustodyBalance>, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    messenger_custody::write_off_custody(&mut conn, &scope, &input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn messenger_custody_balances(
    app: tauri::AppHandle,
    messenger_id: String,
) -> Result<Vec<CustodyBalance>, String> {
    let conn = open_local_db(&app)?;
    messenger_custody::messenger_balances(&conn, &device_scope(&conn)?.business_id, &messenger_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn sale_return_record(
    app: tauri::AppHandle,
    input: RecordSaleReturnInput,
) -> Result<SaleReturnSummary, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    sale_returns::record_sale_return(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn sale_return_summary(app: tauri::AppHandle, sale_id: String) -> Result<SaleReturnSummary, String> {
    let conn = open_local_db(&app)?;
    sale_returns::sale_return_summary(&conn, &sale_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn inventory_locations(app: tauri::AppHandle) -> Result<Vec<Location>, String> {
    let conn = open_local_db(&app)?;
    inventory::list_locations(&conn, &device_scope(&conn)?.business_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn inventory_create_location(
    app: tauri::AppHandle,
    input: CreateLocationInput,
) -> Result<Location, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    inventory::create_location(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn inventory_location_stock(
    app: tauri::AppHandle,
    location_id: String,
) -> Result<Vec<StockLine>, String> {
    let conn = open_local_db(&app)?;
    inventory::location_stock(&conn, &device_scope(&conn)?.business_id, &location_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn inventory_transfer(app: tauri::AppHandle, input: TransferInput) -> Result<Vec<StockLine>, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    inventory::transfer_stock(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn inventory_count(app: tauri::AppHandle, input: CountInput) -> Result<CountResult, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    inventory::record_count(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn consignment_open_account(
    app: tauri::AppHandle,
    input: OpenConsignmentAccountInput,
) -> Result<ConsignmentAccount, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    consignment::open_consignment_account(&mut conn, &scope, &input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn consignment_settle(
    app: tauri::AppHandle,
    input: SettleConsignmentInput,
) -> Result<ReceivableBalance, String> {
    let mut conn = open_local_db(&app)?;
    let scope = device_scope(&conn)?;
    consignment::settle_consignment(&mut conn, &scope, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn sync_state(app: tauri::AppHandle) -> Result<SyncState, String> {
    let conn = open_local_db(&app)?;
    sync::sync_state(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn sync_pending_batch(
    app: tauri::AppHandle,
    now: String,
    limit: i64,
) -> Result<Vec<OutboxEvent>, String> {
    let conn = open_local_db(&app)?;
    sync::pending_batch(&conn, &now, limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn sync_record_results(
    app: tauri::AppHandle,
    results: Vec<PushResult>,
    now: String,
) -> Result<SyncState, String> {
    let mut conn = open_local_db(&app)?;
    sync::record_push_results(&mut conn, &results, &now).map_err(|e| e.to_string())
}

#[tauri::command]
fn sync_record_failure(
    app: tauri::AppHandle,
    event_ids: Vec<String>,
    error: String,
    now: String,
) -> Result<SyncState, String> {
    let mut conn = open_local_db(&app)?;
    sync::record_transport_failure(&mut conn, &event_ids, &error, &now).map_err(|e| e.to_string())
}

#[tauri::command]
fn catalog_checkpoint(app: tauri::AppHandle) -> Result<i64, String> {
    let conn = open_local_db(&app)?;
    catalog::checkpoint(&conn, catalog::CATALOG_STREAM).map_err(|e| e.to_string())
}

#[tauri::command]
fn catalog_apply(
    app: tauri::AppHandle,
    changes: Vec<CatalogChange>,
    now: String,
) -> Result<ApplyResult, String> {
    let mut conn = open_local_db(&app)?;
    let business_id = device_scope(&conn)?.business_id;
    catalog::apply_catalog_page(&mut conn, &business_id, &changes, &now)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn device_identity(app: tauri::AppHandle) -> Result<DeviceIdentity, String> {
    let conn = open_local_db(&app)?;
    device::current_identity(&conn, pilot_device_id()).map_err(|e| e.to_string())
}

#[tauri::command]
fn device_provision(
    app: tauri::AppHandle,
    business_id: String,
    device_id: String,
    label: Option<String>,
    now: String,
) -> Result<DeviceIdentity, String> {
    let mut conn = open_local_db(&app)?;
    device::provision(&mut conn, &business_id, &device_id, label.as_deref(), &now).map_err(|e| e.to_string())
}

#[tauri::command]
fn stock_replace(app: tauri::AppHandle, items: Vec<CloudStock>, fetched_at: String) -> Result<usize, String> {
    let mut conn = open_local_db(&app)?;
    let business_id = device_scope(&conn)?.business_id;
    stock::replace_snapshot(&mut conn, &business_id, &items, &fetched_at).map_err(|e| e.to_string())
}

#[tauri::command]
fn stock_current(app: tauri::AppHandle, product_ids: Vec<String>) -> Result<Vec<ProductStock>, String> {
    let conn = open_local_db(&app)?;
    let business_id = device_scope(&conn)?.business_id;
    stock::current_stock(&conn, &business_id, &product_ids).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = nexo_business_db::MIGRATIONS
        .iter()
        .map(|m| Migration {
            version: m.version,
            description: m.description,
            sql: m.sql,
            kind: MigrationKind::Up,
        })
        .collect::<Vec<_>>();

    let builder = tauri::Builder::default();

    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_barcode_scanner::init());

    builder
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nexo-business.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            complete_sale,
            audit_local_integrity,
            cash_shift_current,
            cash_shift_open,
            cash_shift_record_movement,
            cash_shift_close,
            cash_shift_summary,
            receivable_open,
            receivable_record_payment,
            receivable_write_off,
            receivables_for_customer,
            messenger_custody_collect,
            messenger_custody_return,
            messenger_custody_write_off,
            messenger_custody_balances,
            sale_return_record,
            sale_return_summary,
            inventory_locations,
            inventory_create_location,
            inventory_location_stock,
            inventory_transfer,
            inventory_count,
            consignment_open_account,
            consignment_settle,
            sync_state,
            sync_pending_batch,
            sync_record_results,
            sync_record_failure,
            catalog_checkpoint,
            catalog_apply,
            device_identity,
            device_provision,
            stock_replace,
            stock_current,
            rates_replace,
            rates_current
        ])
        .run(tauri::generate_context!())
        .expect("error while running NEXO Business");
}
