use rusqlite::{params, Connection};
use serde::Deserialize;
use std::fs;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompleteSaleInput {
    sale_id: String,
    line_id: String,
    payment_id: String,
    movement_id: String,
    outbox_id: String,
    product_id: String,
    total_minor: i64,
    occurred_at: String,
}

#[tauri::command]
fn complete_sale(app: tauri::AppHandle, input: CompleteSaleInput) -> Result<(), String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("nexo-business.db");
    let mut conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.pragma_update(None, "foreign_keys", "ON").map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let business_id = "casa-viva";
    let branch_id = "casa-viva-main";
    let device_id = "windows-pilot-01";
    let currency = "USD";

    tx.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status) VALUES (?1,?2,?3,?4,?5,?6,?7,'pending')",
        params![input.sale_id, business_id, branch_id, device_id, currency, input.total_minor, input.occurred_at],
    ).map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO local_sale_lines (id,sale_id,product_id,quantity,unit_price_minor,line_total_minor) VALUES (?1,?2,?3,1,?4,?4)",
        params![input.line_id, input.sale_id, input.product_id, input.total_minor],
    ).map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO local_payments (id,sale_id,method,currency,amount_minor,occurred_at) VALUES (?1,?2,'cash',?3,?4,?5)",
        params![input.payment_id, input.sale_id, currency, input.total_minor, input.occurred_at],
    ).map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at) VALUES (?1,?2,?3,-1,'sale','sale',?4,?5)",
        params![input.movement_id, business_id, input.product_id, input.sale_id, input.occurred_at],
    ).map_err(|e| e.to_string())?;

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
            "product_id": input.product_id,
            "quantity": 1,
            "total_minor": input.total_minor,
            "currency": currency,
            "payment_method": "cash"
        }
    }).to_string();

    tx.execute(
        "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at) VALUES (?1,?2,?3,'sale.completed','sale',?4,?5,?6)",
        params![input.outbox_id, business_id, device_id, input.sale_id, payload, input.occurred_at],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())
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

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nexo-business.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![complete_sale])
        .run(tauri::generate_context!())
        .expect("error while running NEXO Business");
}
