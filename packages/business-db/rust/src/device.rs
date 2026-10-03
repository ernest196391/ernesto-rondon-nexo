//! Device identity from provisioning.
//!
//! The cloud maps each device key to a business and device. The POS stores
//! that answer once and scopes every local write with it. Without it the
//! pilot identity (fixed per platform) is used, as before provisioning.
//!
//! A device never moves to another business while it holds that business's
//! data: switching would mix two businesses in one local database.

use crate::cash_shift::{CashError, CashResult, ShiftScope};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

pub const PILOT_BUSINESS: &str = "casa-viva";
pub const PILOT_BRANCH: &str = "casa-viva-main";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceIdentity {
    pub business_id: String,
    pub branch_id: String,
    pub device_id: String,
    pub label: Option<String>,
    /// False while the pilot fallback is in use.
    #[serde(default)]
    pub provisioned: bool,
}

impl DeviceIdentity {
    pub fn scope(&self) -> ShiftScope {
        ShiftScope {
            business_id: self.business_id.clone(),
            branch_id: self.branch_id.clone(),
            device_id: self.device_id.clone(),
        }
    }
}

pub fn pilot_identity(device_id: &str) -> DeviceIdentity {
    DeviceIdentity {
        business_id: PILOT_BUSINESS.into(),
        branch_id: PILOT_BRANCH.into(),
        device_id: device_id.into(),
        label: None,
        provisioned: false,
    }
}

/// The stored identity, or the pilot one for `pilot_device_id`.
pub fn current_identity(conn: &Connection, pilot_device_id: &str) -> CashResult<DeviceIdentity> {
    let stored = conn
        .query_row(
            "SELECT business_id,branch_id,device_id,label FROM local_device_identity WHERE singleton=1",
            [],
            |row| {
                Ok(DeviceIdentity {
                    business_id: row.get(0)?,
                    branch_id: row.get(1)?,
                    device_id: row.get(2)?,
                    label: row.get(3)?,
                    provisioned: true,
                })
            },
        )
        .optional()?;
    Ok(stored.unwrap_or_else(|| pilot_identity(pilot_device_id)))
}

/// Businesses other than `business_id` that already have local records.
fn other_business_with_data(conn: &Connection, business_id: &str) -> CashResult<Option<String>> {
    for table in ["local_sales", "local_outbox", "local_cash_shifts"] {
        let found: Option<String> = conn
            .query_row(
                &format!("SELECT business_id FROM {table} WHERE business_id<>?1 LIMIT 1"),
                [business_id],
                |row| row.get(0),
            )
            .optional()?;
        if found.is_some() {
            return Ok(found);
        }
    }
    Ok(None)
}

/// Stores the identity the cloud reported for this device's key.
pub fn provision(
    conn: &mut Connection,
    business_id: &str,
    device_id: &str,
    label: Option<&str>,
    now: &str,
) -> CashResult<DeviceIdentity> {
    let business_id = business_id.trim();
    let device_id = device_id.trim();
    if business_id.is_empty() || device_id.is_empty() {
        return Err(CashError::Validation("Identidad de dispositivo incompleta".into()));
    }
    let label = label.map(str::trim).filter(|s| !s.is_empty());
    let tx = conn.transaction()?;
    if let Some(other) = other_business_with_data(&tx, business_id)? {
        return Err(CashError::Validation(format!(
            "Esta clave es del negocio «{business_id}», pero el equipo ya tiene datos de «{other}». Usa la clave de «{other}» o un equipo nuevo."
        )));
    }
    // The pilot branch keeps its ID; other businesses get one main branch.
    let branch_id = if business_id == PILOT_BUSINESS {
        PILOT_BRANCH.to_string()
    } else {
        format!("{business_id}-main")
    };
    tx.execute(
        "INSERT INTO local_device_identity (singleton,business_id,branch_id,device_id,label,provisioned_at)
         VALUES (1,?1,?2,?3,?4,?5)
         ON CONFLICT(singleton) DO UPDATE SET business_id=excluded.business_id, branch_id=excluded.branch_id,
           device_id=excluded.device_id, label=excluded.label, provisioned_at=excluded.provisioned_at",
        params![business_id, branch_id, device_id, label, now],
    )?;
    tx.commit()?;
    Ok(DeviceIdentity {
        business_id: business_id.into(),
        branch_id,
        device_id: device_id.into(),
        label: label.map(Into::into),
        provisioned: true,
    })
}
