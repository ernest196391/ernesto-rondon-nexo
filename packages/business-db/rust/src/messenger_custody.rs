//! Messenger custody (custodia del mensajero): order cash a messenger collected
//! and has not yet handed over.
//!
//! `collected` puts money in the messenger's custody (no drawer effect).
//! `returned` moves it into this device's open drawer: one transaction writes
//! the `messenger_return` cash movement, the custody entry that references it
//! and the outbox event. `write_off` settles an accepted shortfall with a
//! reason. Migration 0007 enforces the same rules as triggers. All writes are
//! idempotent by caller-supplied IDs.

use crate::cash_shift::{
    current_open_shift, enqueue_outbox, non_empty, normalize_currency, normalize_reason,
    require_id, track_currency, CashError, CashResult, ShiftScope,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

/// The order (or other source) whose cash the messenger carries.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustodySource {
    /// "nexo", "woocommerce", "axis"…
    pub source_system: String,
    pub source_type: String,
    pub source_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordCollectionInput {
    pub entry_id: String,
    pub outbox_id: String,
    pub messenger_id: String,
    pub source: CustodySource,
    pub currency: String,
    pub amount_minor: i64,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordReturnInput {
    pub entry_id: String,
    pub outbox_id: String,
    /// ID for the `messenger_return` drawer movement.
    pub cash_movement_id: String,
    pub messenger_id: String,
    pub source: CustodySource,
    pub currency: String,
    pub amount_minor: i64,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustodyWriteOffInput {
    pub entry_id: String,
    pub outbox_id: String,
    pub messenger_id: String,
    pub source: CustodySource,
    pub currency: String,
    pub amount_minor: i64,
    pub reason: String,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustodyBalance {
    pub messenger_id: String,
    pub currency: String,
    pub collected_minor: i64,
    pub returned_minor: i64,
    pub written_off_minor: i64,
    pub outstanding_minor: i64,
}

struct Source {
    system: String,
    kind: String,
    id: String,
}

fn source(raw: &CustodySource) -> CashResult<Source> {
    let field = |value: &str, what: &str| -> CashResult<String> {
        let value = value.trim();
        if value.is_empty() {
            return Err(CashError::Validation(format!("Falta {what}")));
        }
        Ok(value.to_string())
    };
    Ok(Source {
        system: field(&raw.source_system, "el sistema del pedido")?.to_lowercase(),
        kind: field(&raw.source_type, "el tipo de origen")?,
        id: field(&raw.source_id, "el pedido")?,
    })
}

fn messenger(raw: &str) -> CashResult<String> {
    let value = raw.trim();
    if value.is_empty() {
        return Err(CashError::Validation("Falta el mensajero".into()));
    }
    Ok(value.to_string())
}

fn positive(amount: i64) -> CashResult<()> {
    if amount <= 0 {
        return Err(CashError::Validation(
            "El importe debe ser mayor que cero".into(),
        ));
    }
    Ok(())
}

/// Custody balance of one messenger in every currency they have touched.
pub fn messenger_balances(
    conn: &Connection,
    business_id: &str,
    messenger_id: &str,
) -> CashResult<Vec<CustodyBalance>> {
    let mut stmt = conn.prepare(
        "SELECT messenger_id, currency, collected_minor, returned_minor, written_off_minor, outstanding_minor
         FROM local_messenger_custody_balances
         WHERE business_id=?1 AND messenger_id=?2 ORDER BY currency",
    )?;
    let rows = stmt
        .query_map(params![business_id, messenger_id], |row| {
            Ok(CustodyBalance {
                messenger_id: row.get(0)?,
                currency: row.get(1)?,
                collected_minor: row.get(2)?,
                returned_minor: row.get(3)?,
                written_off_minor: row.get(4)?,
                outstanding_minor: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

/// (messenger, collected, settled) for one order/currency, if collected.
fn order_custody(
    conn: &Connection,
    business_id: &str,
    src: &Source,
    currency: &str,
) -> CashResult<Option<(String, i64, i64)>> {
    let collected: Option<(String, i64)> = conn
        .query_row(
            "SELECT messenger_id, amount_minor FROM local_messenger_custody_entries
             WHERE kind='collected' AND business_id=?1 AND source_system=?2 AND source_type=?3 AND source_id=?4 AND currency=?5",
            params![business_id, src.system, src.kind, src.id, currency],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;
    let Some((messenger_id, collected)) = collected else {
        return Ok(None);
    };
    let settled: i64 = conn.query_row(
        "SELECT COALESCE(SUM(amount_minor),0) FROM local_messenger_custody_entries
         WHERE kind IN ('returned','write_off') AND business_id=?1 AND source_system=?2 AND source_type=?3 AND source_id=?4 AND currency=?5",
        params![business_id, src.system, src.kind, src.id, currency],
        |row| row.get(0),
    )?;
    Ok(Some((messenger_id, collected, settled)))
}

/// Checks an existing entry ID: Some(()) when it is a retry of the same kind.
fn existing_entry(conn: &Connection, entry_id: &str, kind: &str) -> CashResult<Option<()>> {
    let existing: Option<String> = conn
        .query_row(
            "SELECT kind FROM local_messenger_custody_entries WHERE id=?1",
            [entry_id],
            |row| row.get(0),
        )
        .optional()?;
    match existing {
        None => Ok(None),
        Some(k) if k == kind => Ok(Some(())),
        Some(_) => Err(CashError::Conflict(
            "El identificador ya existe con otro tipo de movimiento".into(),
        )),
    }
}

/// Outstanding custody for one order/currency, checking the messenger and amount.
fn settleable(
    conn: &Connection,
    business_id: &str,
    messenger_id: &str,
    src: &Source,
    currency: &str,
    amount: i64,
) -> CashResult<()> {
    let (holder, collected, settled) = order_custody(conn, business_id, src, currency)?
        .ok_or_else(|| {
            CashError::NotFound("Ese pedido no tiene efectivo en custodia de un mensajero".into())
        })?;
    if holder != messenger_id {
        return Err(CashError::Conflict(
            "Ese efectivo está en custodia de otro mensajero".into(),
        ));
    }
    if amount > collected - settled {
        return Err(CashError::Validation(
            "El importe supera lo pendiente de entregar".into(),
        ));
    }
    Ok(())
}

pub fn record_collection(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &RecordCollectionInput,
) -> CashResult<Vec<CustodyBalance>> {
    require_id(&input.entry_id, "cobro del mensajero")?;
    require_id(&input.outbox_id, "evento")?;
    let messenger_id = messenger(&input.messenger_id)?;
    let src = source(&input.source)?;
    let currency = normalize_currency(&input.currency)?;
    positive(input.amount_minor)?;

    let tx = conn.transaction()?;
    if existing_entry(&tx, &input.entry_id, "collected")?.is_some() {
        drop(tx);
        return messenger_balances(conn, &scope.business_id, &messenger_id);
    }
    if order_custody(&tx, &scope.business_id, &src, &currency)?.is_some() {
        return Err(CashError::Conflict(
            "El efectivo de ese pedido ya está registrado en esa moneda".into(),
        ));
    }

    let operator = non_empty(&input.operator_id);
    tx.execute(
        "INSERT INTO local_messenger_custody_entries (id,business_id,device_id,messenger_id,kind,source_system,source_type,source_id,currency,amount_minor,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,'collected',?5,?6,?7,?8,?9,?10,?11)",
        params![
            input.entry_id,
            scope.business_id,
            scope.device_id,
            messenger_id,
            src.system,
            src.kind,
            src.id,
            currency,
            input.amount_minor,
            operator,
            input.occurred_at
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "messenger_custody.collected",
        "messenger_custody_entry",
        &input.entry_id,
        &input.occurred_at,
        serde_json::json!({
            "entry_id": input.entry_id,
            "messenger_id": messenger_id,
            "source_system": src.system,
            "source_type": src.kind,
            "source_id": src.id,
            "currency": currency,
            "amount_minor": input.amount_minor,
            "operator_id": operator,
        }),
    )?;
    tx.commit()?;
    messenger_balances(conn, &scope.business_id, &messenger_id)
}

/// The messenger hands the cash over at this device: it enters the open drawer.
pub fn record_return(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &RecordReturnInput,
) -> CashResult<Vec<CustodyBalance>> {
    require_id(&input.entry_id, "entrega del mensajero")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.cash_movement_id, "movimiento de caja")?;
    let messenger_id = messenger(&input.messenger_id)?;
    let src = source(&input.source)?;
    let currency = normalize_currency(&input.currency)?;
    positive(input.amount_minor)?;

    let tx = conn.transaction()?;
    if existing_entry(&tx, &input.entry_id, "returned")?.is_some() {
        drop(tx);
        return messenger_balances(conn, &scope.business_id, &messenger_id);
    }
    let shift_id = current_open_shift(&tx, scope)?.ok_or_else(|| {
        CashError::Conflict("Abre un turno de caja para recibir el efectivo del mensajero".into())
    })?;
    settleable(&tx, &scope.business_id, &messenger_id, &src, &currency, input.amount_minor)?;
    let already: Option<String> = tx
        .query_row(
            "SELECT id FROM local_cash_movements
             WHERE business_id=?1 AND kind='messenger_return' AND source_system=?2 AND source_type=?3 AND source_id=?4 AND currency=?5",
            params![scope.business_id, src.system, src.kind, src.id, currency],
            |row| row.get(0),
        )
        .optional()?;
    if already.is_some() {
        return Err(CashError::Conflict(
            "La entrega de ese pedido ya se registró en caja para esa moneda".into(),
        ));
    }

    let operator = non_empty(&input.operator_id);
    track_currency(&tx, &shift_id, &currency)?;
    tx.execute(
        "INSERT INTO local_cash_movements (id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind,source_system,source_type,source_id,operator_id)
         VALUES (?1,?2,?3,?4,?5,'in',?6,'Entrega de efectivo del mensajero',?7,?8,'messenger_return',?9,?10,?11,?12)",
        params![
            input.cash_movement_id,
            shift_id,
            scope.business_id,
            scope.branch_id,
            scope.device_id,
            input.amount_minor,
            input.occurred_at,
            currency,
            src.system,
            src.kind,
            src.id,
            operator
        ],
    )?;
    tx.execute(
        "INSERT INTO local_messenger_custody_entries (id,business_id,device_id,messenger_id,kind,source_system,source_type,source_id,currency,amount_minor,cash_movement_id,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,'returned',?5,?6,?7,?8,?9,?10,?11,?12)",
        params![
            input.entry_id,
            scope.business_id,
            scope.device_id,
            messenger_id,
            src.system,
            src.kind,
            src.id,
            currency,
            input.amount_minor,
            input.cash_movement_id,
            operator,
            input.occurred_at
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "messenger_custody.returned",
        "messenger_custody_entry",
        &input.entry_id,
        &input.occurred_at,
        serde_json::json!({
            "entry_id": input.entry_id,
            "messenger_id": messenger_id,
            "source_system": src.system,
            "source_type": src.kind,
            "source_id": src.id,
            "currency": currency,
            "amount_minor": input.amount_minor,
            "shift_id": shift_id,
            "cash_movement_id": input.cash_movement_id,
            "operator_id": operator,
        }),
    )?;
    tx.commit()?;
    messenger_balances(conn, &scope.business_id, &messenger_id)
}

/// Accepts a shortfall (lost/short cash) with a mandatory reason.
pub fn write_off_custody(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &CustodyWriteOffInput,
) -> CashResult<Vec<CustodyBalance>> {
    require_id(&input.entry_id, "ajuste de custodia")?;
    require_id(&input.outbox_id, "evento")?;
    let messenger_id = messenger(&input.messenger_id)?;
    let src = source(&input.source)?;
    let currency = normalize_currency(&input.currency)?;
    positive(input.amount_minor)?;
    let reason = normalize_reason(&input.reason)?;

    let tx = conn.transaction()?;
    if existing_entry(&tx, &input.entry_id, "write_off")?.is_some() {
        drop(tx);
        return messenger_balances(conn, &scope.business_id, &messenger_id);
    }
    settleable(&tx, &scope.business_id, &messenger_id, &src, &currency, input.amount_minor)?;

    let operator = non_empty(&input.operator_id);
    tx.execute(
        "INSERT INTO local_messenger_custody_entries (id,business_id,device_id,messenger_id,kind,source_system,source_type,source_id,currency,amount_minor,reason,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,'write_off',?5,?6,?7,?8,?9,?10,?11,?12)",
        params![
            input.entry_id,
            scope.business_id,
            scope.device_id,
            messenger_id,
            src.system,
            src.kind,
            src.id,
            currency,
            input.amount_minor,
            reason,
            operator,
            input.occurred_at
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "messenger_custody.written_off",
        "messenger_custody_entry",
        &input.entry_id,
        &input.occurred_at,
        serde_json::json!({
            "entry_id": input.entry_id,
            "messenger_id": messenger_id,
            "source_system": src.system,
            "source_type": src.kind,
            "source_id": src.id,
            "currency": currency,
            "amount_minor": input.amount_minor,
            "reason": reason,
            "operator_id": operator,
        }),
    )?;
    tx.commit()?;
    messenger_balances(conn, &scope.business_id, &messenger_id)
}
