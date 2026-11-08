//! Post-close annotations. Never updates the drawer, its closure, or any movement.
//! Only a trusted shell adapter supplies an approved plan (not frontend input).
use crate::cash_shift::{
    enqueue_outbox, require_owned_shift, CashError, CashResult, CountResult, ShiftScope,
};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::Serialize;

pub struct ApprovedRectification<'a> {
    pub id: &'a str,
    pub event_id: &'a str,
    pub business_id: &'a str,
    pub device_id: &'a str,
    pub approval_ref: &'a str,
    pub shift_id: &'a str,
    pub target_id: &'a str,
    pub currency: &'a str,
    pub amount_minor: i64,
    pub reason: &'a str,
    pub protected_id: &'a str,
    pub protected_currency: &'a str,
    pub protected_amount_minor: i64,
    pub expected_counts: &'a [(&'a str, i64, i64)],
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RectificationPreview {
    pub id: String,
    pub approval_ref: String,
    pub original_counts: Vec<CountResult>,
    pub revised_counts: Vec<CountResult>,
    pub applied: bool,
    pub synced: bool,
}

fn invalid<T>(s: &str) -> CashResult<T> {
    Err(CashError::Validation(s.into()))
}

pub fn preview(
    conn: &Connection,
    scope: &ShiftScope,
    plan: &ApprovedRectification,
) -> CashResult<RectificationPreview> {
    if scope.business_id != plan.business_id
        || scope.device_id != plan.device_id
        || plan.amount_minor <= 0
    {
        return invalid("Esta autorización no corresponde a esta caja");
    }
    require_owned_shift(conn, scope, plan.shift_id)?;
    let closed: bool = conn.query_row(
        "SELECT status='closed' AND closed_remote=0 FROM local_cash_shifts WHERE id=?1",
        [plan.shift_id],
        |r| r.get(0),
    )?;
    if !closed {
        return invalid("La rectificación requiere el cierre original en esta caja");
    }
    for (id, cur, amount) in [
        (plan.target_id, plan.currency, plan.amount_minor),
        (
            plan.protected_id,
            plan.protected_currency,
            plan.protected_amount_minor,
        ),
    ] {
        let matches: bool=conn.query_row("SELECT EXISTS(SELECT 1 FROM local_cash_movements WHERE id=?1 AND shift_id=?2 AND business_id=?3 AND device_id=?4 AND kind='cash_out' AND direction='out' AND currency=?5 AND amount_minor=?6)", params![id,plan.shift_id,scope.business_id,scope.device_id,cur,amount],|r|r.get(0))?;
        if !matches {
            return invalid("Los movimientos no coinciden con la autorización; no se cambió nada");
        }
    }
    let corrections: i64 = conn.query_row(
        "SELECT count(*) FROM local_cash_movements WHERE corrects_movement_id IN (?1,?2)",
        params![plan.target_id, plan.protected_id],
        |r| r.get(0),
    )?;
    if corrections != 0 {
        return invalid("Ya existe otra corrección: necesita revisión antes de continuar");
    }
    let other: i64 = conn.query_row(
        "SELECT count(*) FROM local_cash_rectifications WHERE shift_id=?1 AND id<>?2",
        params![plan.shift_id, plan.id],
        |r| r.get(0),
    )?;
    if other != 0 {
        return invalid("Este cierre tiene otra rectificación; revisa la autorización");
    }
    let mut stmt=conn.prepare("SELECT currency,expected_minor,counted_minor,difference_minor FROM local_cash_shift_counts WHERE shift_id=?1 ORDER BY currency")?;
    let original_counts = stmt
        .query_map([plan.shift_id], |r| {
            Ok(CountResult {
                currency: r.get(0)?,
                expected_minor: r.get(1)?,
                counted_minor: r.get(2)?,
                difference_minor: r.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    if original_counts.len() != plan.expected_counts.len()
        || plan.expected_counts.iter().any(|(cur, expected, counted)| {
            !original_counts.iter().any(|r| {
                r.currency == *cur && r.expected_minor == *expected && r.counted_minor == *counted
            })
        })
    {
        return invalid("El cierre no coincide con el aprobado; no se cambió nada");
    }
    let mut revised_counts = original_counts.clone();
    let Some(row) = revised_counts
        .iter_mut()
        .find(|r| r.currency == plan.currency)
    else {
        return invalid("Falta el conteo original de la moneda");
    };
    row.expected_minor = row
        .expected_minor
        .checked_add(plan.amount_minor)
        .ok_or_else(|| CashError::Validation("Importe fuera de rango".into()))?;
    row.difference_minor = row
        .counted_minor
        .checked_sub(row.expected_minor)
        .ok_or_else(|| CashError::Validation("Importe fuera de rango".into()))?;
    if !original_counts
        .iter()
        .any(|r| r.currency == plan.protected_currency)
    {
        return invalid("Falta el conteo de la moneda protegida");
    }
    let existing: Option<(String,String,String,i64,String,String)>=conn.query_row("SELECT approval_ref,target_movement_id,currency,delta_minor,original_counts_json,revised_counts_json FROM local_cash_rectifications WHERE id=?1",[plan.id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?,r.get(5)?))).optional()?;
    if let Some(ref e) = existing {
        if e.0 != plan.approval_ref
            || e.1 != plan.target_id
            || e.2 != plan.currency
            || e.3 != plan.amount_minor
            || e.4 != serde_json::to_string(&original_counts).unwrap()
            || e.5 != serde_json::to_string(&revised_counts).unwrap()
        {
            return invalid("La rectificación guardada no coincide; no se repetirá");
        }
    }
    let synced: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM local_outbox WHERE id=?1 AND synced_at IS NOT NULL)",
        [plan.event_id],
        |r| r.get(0),
    )?;
    Ok(RectificationPreview {
        id: plan.id.into(),
        approval_ref: plan.approval_ref.into(),
        original_counts,
        revised_counts,
        applied: existing.is_some(),
        synced,
    })
}

pub fn apply(
    conn: &mut Connection,
    scope: &ShiftScope,
    plan: &ApprovedRectification,
    operator_id: &str,
    at: &str,
) -> CashResult<RectificationPreview> {
    let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let state = preview(&tx, scope, plan)?;
    if state.applied {
        return Ok(state);
    }
    if operator_id.trim().is_empty() {
        return invalid("Elige quién aplica la rectificación");
    }
    let valid_time: bool=tx.query_row("SELECT julianday(?1) IS NOT NULL AND julianday(?1)>julianday(closed_at) FROM local_cash_shifts WHERE id=?2",params![at,plan.shift_id],|r|r.get(0))?;
    if !valid_time {
        return invalid("La rectificación debe tener fecha posterior al cierre");
    }
    tx.execute("INSERT INTO local_cash_rectifications(id,business_id,branch_id,device_id,shift_id,target_movement_id,approval_ref,currency,delta_minor,reason,operator_id,occurred_at,original_counts_json,revised_counts_json,outbox_id) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",params![plan.id,scope.business_id,scope.branch_id,scope.device_id,plan.shift_id,plan.target_id,plan.approval_ref,plan.currency,plan.amount_minor,plan.reason,operator_id,at,serde_json::to_string(&state.original_counts).unwrap(),serde_json::to_string(&state.revised_counts).unwrap(),plan.event_id])?;
    enqueue_outbox(
        &tx,
        plan.event_id,
        &scope.business_id,
        &scope.device_id,
        "cash_shift.rectified",
        "cash_rectification",
        plan.id,
        at,
        serde_json::json!({"rectification_id":plan.id,"shift_id":plan.shift_id,"target_movement_id":plan.target_id,"approval_ref":plan.approval_ref,"currency":plan.currency,"delta_minor":plan.amount_minor,"reason":plan.reason,"operator_id":operator_id,"original_counts":state.original_counts,"revised_counts":state.revised_counts,"protected_movement_id":plan.protected_id,"drawer_effect_minor":0}),
    )?;
    tx.commit()?;
    preview(conn, scope, plan)
}
