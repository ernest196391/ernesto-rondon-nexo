//! Receivables (cuentas por cobrar): credit sales / fiado, partial payments
//! and write-offs.
//!
//! A receivable is opened from a source (a NEXO sale, an external order…) for
//! one customer and one currency. Payments and write-offs are append-only
//! entries; the balance is derived and can never go below zero (also enforced
//! by triggers from migration 0006). A cash payment taken while the device has
//! an open shift lands in that drawer as a `cash_in` movement in the same
//! transaction. Every write is idempotent by caller-supplied IDs and enqueues
//! its outbox event in the same transaction.

use crate::cash_shift::{
    current_open_shift, enqueue_outbox, non_empty, normalize_currency, normalize_reason,
    require_id, track_currency, CashError, CashResult, ShiftScope,
};
use rusqlite::{params, Connection, OptionalExtension, Transaction};
use serde::{Deserialize, Serialize};

/// Payment rails from migration 0005. Only `Cash` can change a drawer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentRail {
    Cash,
    Transfer,
    Card,
    DigitalAsset,
    Other,
}

impl PaymentRail {
    pub fn as_str(self) -> &'static str {
        match self {
            PaymentRail::Cash => "cash",
            PaymentRail::Transfer => "transfer",
            PaymentRail::Card => "card",
            PaymentRail::DigitalAsset => "digital_asset",
            PaymentRail::Other => "other",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenReceivableInput {
    pub receivable_id: String,
    pub outbox_id: String,
    pub customer_id: String,
    /// System that owns the source: "nexo", "woocommerce", "axis"…
    pub source_system: String,
    /// "sale", "order", "consignment_settlement"…
    pub source_type: String,
    pub source_id: String,
    pub currency: String,
    pub amount_minor: i64,
    pub due_at: Option<String>,
    pub note: Option<String>,
    pub operator_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceivablePaymentInput {
    pub entry_id: String,
    pub outbox_id: String,
    pub receivable_id: String,
    pub amount_minor: i64,
    pub rail: PaymentRail,
    pub provider: Option<String>,
    pub channel: Option<String>,
    pub external_ref: Option<String>,
    /// ID for the drawer movement, used only for cash with an open shift.
    pub cash_movement_id: Option<String>,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceivableWriteOffInput {
    pub entry_id: String,
    pub outbox_id: String,
    pub receivable_id: String,
    pub amount_minor: i64,
    pub reason: String,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceivableBalance {
    pub receivable_id: String,
    pub customer_id: String,
    pub source_system: String,
    pub source_type: String,
    pub source_id: String,
    pub currency: String,
    pub original_minor: i64,
    pub paid_minor: i64,
    pub written_off_minor: i64,
    pub balance_minor: i64,
    /// "open" while something is owed, "settled" at zero.
    pub status: String,
    pub due_at: Option<String>,
}

fn required(raw: &str, what: &str) -> CashResult<String> {
    let value = raw.trim();
    if value.is_empty() {
        return Err(CashError::Validation(format!("Falta {what}")));
    }
    Ok(value.to_string())
}

pub fn receivable_balance(conn: &Connection, receivable_id: &str) -> CashResult<ReceivableBalance> {
    conn.query_row(
        "SELECT b.receivable_id, b.customer_id, r.source_system, r.source_type, r.source_id, b.currency,
                b.original_minor, b.paid_minor, b.written_off_minor, b.balance_minor, r.due_at
         FROM local_receivable_balances b JOIN local_receivables r ON r.id = b.receivable_id
         WHERE b.receivable_id = ?1",
        [receivable_id],
        |row| {
            let balance: i64 = row.get(9)?;
            Ok(ReceivableBalance {
                receivable_id: row.get(0)?,
                customer_id: row.get(1)?,
                source_system: row.get(2)?,
                source_type: row.get(3)?,
                source_id: row.get(4)?,
                currency: row.get(5)?,
                original_minor: row.get(6)?,
                paid_minor: row.get(7)?,
                written_off_minor: row.get(8)?,
                balance_minor: balance,
                status: if balance > 0 { "open" } else { "settled" }.into(),
                due_at: row.get(10)?,
            })
        },
    )
    .optional()?
    .ok_or_else(|| CashError::NotFound("Cuenta por cobrar no encontrada".into()))
}

/// Open (balance > 0) receivables of one customer, oldest first.
pub fn customer_open_receivables(
    conn: &Connection,
    business_id: &str,
    customer_id: &str,
) -> CashResult<Vec<ReceivableBalance>> {
    let mut stmt = conn.prepare(
        "SELECT b.receivable_id FROM local_receivable_balances b
         JOIN local_receivables r ON r.id = b.receivable_id
         WHERE b.business_id = ?1 AND b.customer_id = ?2 AND b.balance_minor > 0
         ORDER BY r.created_at, r.id",
    )?;
    let ids = stmt
        .query_map(params![business_id, customer_id], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<_>, _>>()?;
    ids.iter().map(|id| receivable_balance(conn, id)).collect()
}

fn load_business(conn: &Connection, receivable_id: &str) -> CashResult<String> {
    conn.query_row(
        "SELECT business_id FROM local_receivables WHERE id = ?1",
        [receivable_id],
        |row| row.get(0),
    )
    .optional()?
    .ok_or_else(|| CashError::NotFound("Cuenta por cobrar no encontrada".into()))
}

fn require_scope(conn: &Connection, scope: &ShiftScope, receivable_id: &str) -> CashResult<()> {
    if load_business(conn, receivable_id)? != scope.business_id {
        return Err(CashError::Conflict(
            "La cuenta por cobrar pertenece a otro negocio".into(),
        ));
    }
    Ok(())
}

/// Returns the receivable of an already-recorded entry, if the entry exists.
fn existing_entry(conn: &Connection, entry_id: &str) -> CashResult<Option<String>> {
    Ok(conn
        .query_row(
            "SELECT receivable_id FROM local_receivable_entries WHERE id = ?1",
            [entry_id],
            |row| row.get(0),
        )
        .optional()?)
}

/// Validates and inserts a new receivable plus its outbox event on an open
/// transaction. Shared by `open_receivable` and flows that create debt as part
/// of a larger write (consignment settlement).
pub(crate) fn insert_receivable(
    conn: &Transaction,
    scope: &ShiftScope,
    input: &OpenReceivableInput,
) -> CashResult<()> {
    require_id(&input.receivable_id, "cuenta por cobrar")?;
    require_id(&input.outbox_id, "evento")?;
    let customer_id = required(&input.customer_id, "el cliente")?;
    let source_system = required(&input.source_system, "el sistema de origen")?.to_lowercase();
    let source_type = required(&input.source_type, "el tipo de origen")?;
    let source_id = required(&input.source_id, "el origen")?;
    let currency = normalize_currency(&input.currency)?;
    if input.amount_minor <= 0 {
        return Err(CashError::Validation(
            "El importe pendiente debe ser mayor que cero".into(),
        ));
    }

    let duplicate: Option<String> = conn
        .query_row(
            "SELECT id FROM local_receivables
             WHERE business_id=?1 AND source_system=?2 AND source_type=?3 AND source_id=?4 AND currency=?5",
            params![scope.business_id, source_system, source_type, source_id, currency],
            |row| row.get(0),
        )
        .optional()?;
    if duplicate.is_some() {
        return Err(CashError::Conflict(
            "Ese origen ya tiene una cuenta por cobrar en esa moneda".into(),
        ));
    }

    let due_at = non_empty(&input.due_at);
    let note = non_empty(&input.note);
    let operator = non_empty(&input.operator_id);

    conn.execute(
        "INSERT INTO local_receivables (id,business_id,branch_id,device_id,customer_id,source_system,source_type,source_id,currency,original_minor,due_at,note,operator_id,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)",
        params![
            input.receivable_id,
            scope.business_id,
            scope.branch_id,
            scope.device_id,
            customer_id,
            source_system,
            source_type,
            source_id,
            currency,
            input.amount_minor,
            due_at,
            note,
            operator,
            input.created_at
        ],
    )?;

    enqueue_outbox(
        conn,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "receivable.opened",
        "receivable",
        &input.receivable_id,
        &input.created_at,
        serde_json::json!({
            "receivable_id": input.receivable_id,
            "customer_id": customer_id,
            "source_system": source_system,
            "source_type": source_type,
            "source_id": source_id,
            "currency": currency,
            "amount_minor": input.amount_minor,
            "due_at": due_at,
            "operator_id": operator,
        }),
    )?;

    Ok(())
}

pub fn open_receivable(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &OpenReceivableInput,
) -> CashResult<ReceivableBalance> {
    require_id(&input.receivable_id, "cuenta por cobrar")?;
    let tx = conn.transaction()?;

    if tx
        .query_row(
            "SELECT 1 FROM local_receivables WHERE id = ?1",
            [&input.receivable_id],
            |_| Ok(()),
        )
        .optional()?
        .is_some()
    {
        // Retry of an open that already committed.
        require_scope(&tx, scope, &input.receivable_id)?;
        drop(tx);
        return receivable_balance(conn, &input.receivable_id);
    }

    insert_receivable(&tx, scope, input)?;
    tx.commit()?;
    receivable_balance(conn, &input.receivable_id)
}

pub fn record_receivable_payment(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &ReceivablePaymentInput,
) -> CashResult<ReceivableBalance> {
    require_id(&input.entry_id, "cobro")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.receivable_id, "cuenta por cobrar")?;
    if input.amount_minor <= 0 {
        return Err(CashError::Validation(
            "El importe debe ser mayor que cero".into(),
        ));
    }

    let tx = conn.transaction()?;
    require_scope(&tx, scope, &input.receivable_id)?;

    if let Some(existing) = existing_entry(&tx, &input.entry_id)? {
        if existing != input.receivable_id {
            return Err(CashError::Conflict(
                "El identificador de cobro ya existe en otra cuenta".into(),
            ));
        }
        drop(tx);
        return receivable_balance(conn, &input.receivable_id);
    }

    let balance = receivable_balance(&tx, &input.receivable_id)?;
    if input.amount_minor > balance.balance_minor {
        return Err(CashError::Validation(
            "El cobro supera el saldo pendiente".into(),
        ));
    }

    let operator = non_empty(&input.operator_id);
    let provider = non_empty(&input.provider);
    let channel = non_empty(&input.channel);
    let external_ref = non_empty(&input.external_ref);

    // Physical cash goes into this device's drawer when a shift is open.
    let mut shift_id = None;
    let mut cash_movement_id = None;
    if input.rail == PaymentRail::Cash && crate::cash_ledger_ready(&tx)? {
        if let Some(open) = current_open_shift(&tx, scope)? {
            let movement_id = non_empty(&input.cash_movement_id).ok_or_else(|| {
                CashError::Validation("Falta el identificador del movimiento de caja".into())
            })?;
            track_currency(&tx, &open, &balance.currency)?;
            tx.execute(
                "INSERT INTO local_cash_movements (id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind,category,source_system,source_type,source_id,operator_id)
                 VALUES (?1,?2,?3,?4,?5,'in',?6,'Cobro de cuenta por cobrar',?7,?8,'cash_in','receivable_payment','nexo','receivable_entry',?9,?10)",
                params![
                    movement_id,
                    open,
                    scope.business_id,
                    scope.branch_id,
                    scope.device_id,
                    input.amount_minor,
                    input.occurred_at,
                    balance.currency,
                    input.entry_id,
                    operator
                ],
            )?;
            shift_id = Some(open);
            cash_movement_id = Some(movement_id);
        }
    }

    tx.execute(
        "INSERT INTO local_receivable_entries (id,receivable_id,business_id,device_id,kind,currency,amount_minor,rail,provider,channel,external_ref,cash_movement_id,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,'payment',?5,?6,?7,?8,?9,?10,?11,?12,?13)",
        params![
            input.entry_id,
            input.receivable_id,
            scope.business_id,
            scope.device_id,
            balance.currency,
            input.amount_minor,
            input.rail.as_str(),
            provider,
            channel,
            external_ref,
            cash_movement_id,
            operator,
            input.occurred_at
        ],
    )?;

    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "receivable.payment_recorded",
        "receivable_entry",
        &input.entry_id,
        &input.occurred_at,
        serde_json::json!({
            "entry_id": input.entry_id,
            "receivable_id": input.receivable_id,
            "currency": balance.currency,
            "amount_minor": input.amount_minor,
            "rail": input.rail.as_str(),
            "provider": provider,
            "channel": channel,
            "external_ref": external_ref,
            "shift_id": shift_id,
            "cash_movement_id": cash_movement_id,
            "operator_id": operator,
        }),
    )?;

    tx.commit()?;
    receivable_balance(conn, &input.receivable_id)
}

pub fn write_off_receivable(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &ReceivableWriteOffInput,
) -> CashResult<ReceivableBalance> {
    require_id(&input.entry_id, "condonación")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.receivable_id, "cuenta por cobrar")?;
    if input.amount_minor <= 0 {
        return Err(CashError::Validation(
            "El importe debe ser mayor que cero".into(),
        ));
    }
    let reason = normalize_reason(&input.reason)?;

    let tx = conn.transaction()?;
    require_scope(&tx, scope, &input.receivable_id)?;

    if let Some(existing) = existing_entry(&tx, &input.entry_id)? {
        if existing != input.receivable_id {
            return Err(CashError::Conflict(
                "El identificador ya existe en otra cuenta".into(),
            ));
        }
        drop(tx);
        return receivable_balance(conn, &input.receivable_id);
    }

    let balance = receivable_balance(&tx, &input.receivable_id)?;
    if input.amount_minor > balance.balance_minor {
        return Err(CashError::Validation(
            "La condonación supera el saldo pendiente".into(),
        ));
    }
    let operator = non_empty(&input.operator_id);

    tx.execute(
        "INSERT INTO local_receivable_entries (id,receivable_id,business_id,device_id,kind,currency,amount_minor,reason,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,'write_off',?5,?6,?7,?8,?9)",
        params![
            input.entry_id,
            input.receivable_id,
            scope.business_id,
            scope.device_id,
            balance.currency,
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
        "receivable.written_off",
        "receivable_entry",
        &input.entry_id,
        &input.occurred_at,
        serde_json::json!({
            "entry_id": input.entry_id,
            "receivable_id": input.receivable_id,
            "currency": balance.currency,
            "amount_minor": input.amount_minor,
            "reason": reason,
            "operator_id": operator,
        }),
    )?;

    tx.commit()?;
    receivable_balance(conn, &input.receivable_id)
}
