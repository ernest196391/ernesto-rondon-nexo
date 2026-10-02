use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaleLineInput {
    line_id: String,
    movement_id: String,
    product_id: String,
    quantity: i64,
    unit_price_minor: i64,
    line_total_minor: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompleteSaleInput {
    sale_id: String,
    payment_id: String,
    outbox_id: String,
    total_minor: i64,
    occurred_at: String,
    lines: Vec<SaleLineInput>,
}

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
    if input.lines.is_empty() {
        return Err("La venta no puede estar vacía".into());
    }

    let calculated_total = input.lines.iter().try_fold(0_i64, |sum, line| {
        if line.quantity <= 0 {
            return Err("La cantidad debe ser mayor que cero".to_string());
        }
        if line.unit_price_minor < 0 {
            return Err("El precio no puede ser negativo".to_string());
        }

        let expected_line_total = line
            .unit_price_minor
            .checked_mul(line.quantity)
            .ok_or_else(|| "Desbordamiento calculando el total de línea".to_string())?;

        if expected_line_total != line.line_total_minor {
            return Err("El total de una línea no coincide con precio × cantidad".to_string());
        }

        sum.checked_add(line.line_total_minor)
            .ok_or_else(|| "Desbordamiento calculando el total de venta".to_string())
    })?;

    if calculated_total != input.total_minor {
        return Err("El total de la venta no coincide con sus líneas".into());
    }

    let mut conn = open_local_db(&app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let business_id = "casa-viva";
    let branch_id = "casa-viva-main";
    let device_id = if cfg!(target_os = "android") {
        "android-pilot-01"
    } else if cfg!(target_os = "windows") {
        "windows-pilot-01"
    } else {
        "pos-pilot-01"
    };
    let currency = "USD";

    tx.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status) VALUES (?1,?2,?3,?4,?5,?6,?7,'pending')",
        params![input.sale_id, business_id, branch_id, device_id, currency, input.total_minor, input.occurred_at],
    ).map_err(|e| e.to_string())?;

    for line in &input.lines {
        tx.execute(
            "INSERT INTO local_sale_lines (id,sale_id,product_id,quantity,unit_price_minor,line_total_minor) VALUES (?1,?2,?3,?4,?5,?6)",
            params![
                line.line_id,
                input.sale_id,
                line.product_id,
                line.quantity,
                line.unit_price_minor,
                line.line_total_minor
            ],
        ).map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at) VALUES (?1,?2,?3,?4,'sale','sale',?5,?6)",
            params![
                line.movement_id,
                business_id,
                line.product_id,
                -line.quantity,
                input.sale_id,
                input.occurred_at
            ],
        ).map_err(|e| e.to_string())?;
    }

    tx.execute(
        "INSERT INTO local_payments (id,sale_id,method,currency,amount_minor,occurred_at) VALUES (?1,?2,'cash',?3,?4,?5)",
        params![input.payment_id, input.sale_id, currency, input.total_minor, input.occurred_at],
    ).map_err(|e| e.to_string())?;

    let payload_lines = input
        .lines
        .iter()
        .map(|line| {
            serde_json::json!({
                "product_id": line.product_id,
                "quantity": line.quantity,
                "unit_price_minor": line.unit_price_minor,
                "line_total_minor": line.line_total_minor
            })
        })
        .collect::<Vec<_>>();

    let payload = serde_json::json!({
        "contract_version": 1,
        "event_id": input.outbox_id,
        "business_id": business_id,
        "source_system": "nexo-business-pos",
        "source_entity_id": input.sale_id,
        "occurred_at": input.occurred_at,
        "idempotency_key": input.sale_id,
        "payload": {
            "sale_id": input.sale_id,
            "lines": payload_lines,
            "total_minor": input.total_minor,
            "currency": currency,
            "payment_method": "cash"
        }
    })
    .to_string();

    tx.execute(
        "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at) VALUES (?1,?2,?3,'sale.completed','sale',?4,?5,?6)",
        params![input.outbox_id, business_id, device_id, input.sale_id, payload, input.occurred_at],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_phase1_local_core",
            sql: include_str!("../../../../packages/business-db/migrations/0001_local_core.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_local_prices",
            sql: include_str!("../../../../packages/business-db/migrations/0002_local_prices.sql"),
            kind: MigrationKind::Up,
        },
    ];

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
            audit_local_integrity
        ])
        .run(tauri::generate_context!())
        .expect("error while running NEXO Business");
}
