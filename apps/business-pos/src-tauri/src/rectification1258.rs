//! Casa Viva adapter: Ernesto's single approval #1258. No editable amount or target.
use nexo_business_db::cash_rectification::{self, ApprovedRectification, RectificationPreview};
use serde::Serialize;
use tauri::Manager;

fn plan() -> ApprovedRectification<'static> {
    ApprovedRectification {
        id: "cv-cash-rectification-1258", event_id: "cv-cash-rectification-1258-event",
        business_id: "casa-viva", device_id: "pc-casa-viva-1021-281b", approval_ref: "crm_supervisor:1258",
        shift_id: "ee8809fd-c2fa-4690-a240-c33f523e5a5a",
        target_id: "47b74868-aca1-4807-873f-89a55c39f9d0", currency: "CUP", amount_minor: 200,
        reason: "Rectificación autorizada por Ernesto #1258: salida de 2 CUP registrada por error de moneda; se conserva el pago correcto de 2 USD. No hubo entrada nueva de efectivo.",
        protected_id: "df0098fd-91d6-4bfa-bdf4-c84aaed69d22", protected_currency: "USD", protected_amount_minor: 200,
        expected_counts: &[("CUP",4261210,4264000),("USD",64300,64300)],
    }
}

#[tauri::command]
pub fn preview_1258(app: tauri::AppHandle) -> Result<Option<RectificationPreview>, String> {
    let conn = super::open_local_db(&app)?;
    let scope = super::device_scope(&conn)?;
    let plan = plan();
    if scope.device_id != plan.device_id || scope.business_id != plan.business_id {
        return Ok(None);
    }
    cash_rectification::preview(&conn, &scope, &plan)
        .map(Some)
        .map_err(|e| e.to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Applied {
    state: RectificationPreview,
    backup_file: Option<String>,
}

#[tauri::command]
pub fn apply_1258(app: tauri::AppHandle, operator_id: String) -> Result<Applied, String> {
    let mut conn = super::open_local_db(&app)?;
    conn.busy_timeout(std::time::Duration::from_secs(10))
        .map_err(|e| e.to_string())?;
    let scope = super::device_scope(&conn)?;
    let plan = plan();
    let before = cash_rectification::preview(&conn, &scope, &plan).map_err(|e| e.to_string())?;
    if before.applied {
        return Ok(Applied {
            state: before,
            backup_file: None,
        });
    }
    if operator_id.trim().is_empty() {
        return Err("Elige quién eres en la caja antes de continuar".into());
    }
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("backups");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let backup = dir.join(format!("antes-rectificacion-1258-{stamp}.db"));
    // A consistent SQLite backup including WAL. Failure prevents the correction.
    conn.execute("VACUUM INTO ?1", [backup.to_string_lossy().as_ref()])
        .map_err(|e| format!("No se pudo guardar la copia: {e}"))?;
    let check =
        rusqlite::Connection::open_with_flags(&backup, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
            .map_err(|e| e.to_string())?;
    let integrity: String = check
        .query_row("PRAGMA quick_check", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if integrity != "ok" {
        return Err("La copia no pasó la comprobación; no se aplicó nada".into());
    }
    let at: String = conn
        .query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |r| {
            r.get(0)
        })
        .map_err(|e| e.to_string())?;
    let state = cash_rectification::apply(&mut conn, &scope, &plan, &operator_id, &at)
        .map_err(|e| e.to_string())?;
    Ok(Applied {
        state,
        backup_file: Some(backup.to_string_lossy().into_owned()),
    })
}

/// Runs before the SQL plugin, whose preload applies new migrations.
pub fn backup_before_upgrade(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let dir = app.path().app_config_dir()?;
    let file = dir.join("nexo-business.db");
    if !file.exists() {
        return Ok(());
    }
    let conn =
        rusqlite::Connection::open_with_flags(&file, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    conn.busy_timeout(std::time::Duration::from_secs(10))?;
    let upgraded:bool=conn.query_row("SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='local_cash_rectifications')",[],|r|r.get(0))?;
    if upgraded {
        return Ok(());
    }
    let backup_dir = dir.join("backups");
    std::fs::create_dir_all(&backup_dir)?;
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_nanos();
    let backup = backup_dir.join(format!("antes-version-1.1.5-{stamp}.db"));
    conn.execute("VACUUM INTO ?1", [backup.to_string_lossy().as_ref()])?;
    let check =
        rusqlite::Connection::open_with_flags(&backup, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    let integrity: String = check.query_row("PRAGMA quick_check", [], |r| r.get(0))?;
    if integrity != "ok" {
        return Err(std::io::Error::other(
            "La copia anterior a la actualización no pasó la comprobación",
        )
        .into());
    }
    Ok(())
}
