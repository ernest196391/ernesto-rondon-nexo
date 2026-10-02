//! Provider-neutral external identities (WooCommerce order 2608, Axis SKU…)
//! mapped to stable NEXO entity IDs. One external identity maps to exactly one
//! NEXO entity; re-linking the same pair is a no-op, never a duplicate.

use crate::cash_shift::{CashError, CashResult};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalRefInput {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub system: String,
    pub external_id: String,
    pub created_at: String,
}

fn required(value: &str, what: &str) -> CashResult<String> {
    let value = value.trim();
    if value.is_empty() {
        return Err(CashError::Validation(format!("Falta {what}")));
    }
    Ok(value.to_string())
}

/// Links an external identity to a NEXO entity and returns the reference ID.
pub fn link_external_ref(
    conn: &Connection,
    business_id: &str,
    input: &ExternalRefInput,
) -> CashResult<String> {
    let id = required(&input.id, "el identificador de la referencia")?;
    let entity_type = required(&input.entity_type, "el tipo de entidad")?;
    let entity_id = required(&input.entity_id, "la entidad NEXO")?;
    let system = required(&input.system, "el sistema externo")?.to_lowercase();
    let external_id = required(&input.external_id, "el identificador externo")?;

    let by_external: Option<(String, String)> = conn
        .query_row(
            "SELECT id, entity_id FROM local_external_refs
             WHERE business_id=?1 AND entity_type=?2 AND system=?3 AND external_id=?4",
            params![business_id, entity_type, system, external_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;
    if let Some((existing_id, existing_entity)) = by_external {
        if existing_entity == entity_id {
            return Ok(existing_id);
        }
        return Err(CashError::Conflict(format!(
            "{system}:{external_id} ya está vinculado a otra entidad"
        )));
    }

    let by_entity: Option<String> = conn
        .query_row(
            "SELECT external_id FROM local_external_refs
             WHERE business_id=?1 AND entity_type=?2 AND entity_id=?3 AND system=?4",
            params![business_id, entity_type, entity_id, system],
            |row| row.get(0),
        )
        .optional()?;
    if by_entity.is_some() {
        return Err(CashError::Conflict(format!(
            "La entidad ya tiene otro identificador en {system}"
        )));
    }

    conn.execute(
        "INSERT INTO local_external_refs (id,business_id,entity_type,entity_id,system,external_id,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7)",
        params![id, business_id, entity_type, entity_id, system, external_id, input.created_at],
    )?;
    Ok(id)
}

pub fn resolve_external_ref(
    conn: &Connection,
    business_id: &str,
    entity_type: &str,
    system: &str,
    external_id: &str,
) -> CashResult<Option<String>> {
    Ok(conn
        .query_row(
            "SELECT entity_id FROM local_external_refs
             WHERE business_id=?1 AND entity_type=?2 AND system=?3 AND external_id=?4",
            params![
                business_id,
                entity_type,
                system.trim().to_lowercase(),
                external_id.trim()
            ],
            |row| row.get(0),
        )
        .optional()?)
}
