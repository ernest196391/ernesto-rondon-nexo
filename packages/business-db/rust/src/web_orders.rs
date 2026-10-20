//! Web orders charged at the counter («Pedidos web», 20-oct).
//!
//! A web order (pickup «Listo para recoger», or a delivery whose messenger
//! brought the cash) is NOT a caja sale: the web already took the stock and
//! the gestora's commission lives in Core. The caja only records the money:
//!
//! * the cash parts go into the drawer as `order_cash` movements (source
//!   woocommerce / web_order / <order id>, category `web_order`);
//! * one `local_web_order_charges` row per order: the local guard against
//!   charging twice and the offline queue that tells Core «cobrado»
//!   (status queued → done, or refused when Ventas had already charged it);
//! * a `web_order.charged` outbox event, so the cloud knows the charge even
//!   before Core does.
//!
//! When Core refuses because the order was already charged in Ventas, the
//! cash this phone added is taken back out with correction movements (if the
//! shift is still open), so the drawer never counts the same money twice.

use crate::cash_shift::{
    enqueue_outbox, non_empty, normalize_reason, record_movement_in, require_id, require_owned_shift,
    CashError, CashResult, Direction, MovementKind, RecordMovementInput, ShiftScope,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

pub const SOURCE_SYSTEM: &str = "woocommerce";
pub const SOURCE_TYPE: &str = "web_order";
pub const CATEGORY: &str = "web_order";
/// «Vuelto en la calle»: change the messenger takes from the FUND (cash_out).
pub const VUELTO_OUT: &str = "vuelto";
/// «Vuelto devuelto»: that change comes back to the fund (cash_in). Never a sale.
pub const VUELTO_BACK: &str = "vuelto_devuelto";
pub const VUELTO_SOURCE: &str = "web_order_change";

/// Change of one order still in the street (given − returned), per currency, on this phone.
pub fn outstanding_vuelto(conn: &Connection, business_id: &str, order_id: i64) -> CashResult<Vec<(String, i64)>> {
    let mut stmt = conn.prepare(
        "SELECT currency,
                SUM(CASE WHEN category=?3 AND direction='out' THEN amount_minor ELSE 0 END)
              - SUM(CASE WHEN category=?4 AND direction='in' THEN amount_minor ELSE 0 END)
           FROM local_cash_movements
          WHERE business_id=?1 AND source_type=?5 AND source_id=?2
          GROUP BY currency ORDER BY currency",
    )?;
    let rows = stmt.query_map(params![business_id, order_id.to_string(), VUELTO_OUT, VUELTO_BACK, VUELTO_SOURCE], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))
    })?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VueltoInput {
    pub movement_id: String,
    pub outbox_id: String,
    pub shift_id: String,
    pub order_id: i64,
    pub order_number: String,
    /// Who takes it (messenger name), for the reason line.
    #[serde(default)]
    pub messenger: Option<String>,
    pub currency: String,
    pub amount_minor: i64,
    pub staff_id: Option<String>,
    pub occurred_at: String,
}

/// «Vuelto en la calle» (out = true): the change leaves the fund with the messenger.
/// «Vuelto devuelto» (out = false): it comes back without a charge (order failed…),
/// never more than what is still in the street. Linked to the order number.
pub fn record_vuelto(conn: &mut Connection, scope: &ShiftScope, input: &VueltoInput, out: bool) -> CashResult<()> {
    if input.order_id <= 0 || input.order_number.trim().is_empty() {
        return Err(CashError::Validation("Falta el pedido del vuelto".into()));
    }
    let tx = conn.transaction()?;
    let currency = crate::cash_shift::normalize_currency(&input.currency)?;
    if !out {
        let still = outstanding_vuelto(&tx, &scope.business_id, input.order_id)?
            .into_iter()
            .find(|(c, _)| *c == currency)
            .map(|(_, v)| v)
            .unwrap_or(0);
        if input.amount_minor > still {
            return Err(CashError::Validation(format!(
                "Ese vuelto no está en la calle: del pedido #{} quedan {:.2} {currency}",
                input.order_number.trim(),
                still as f64 / 100.0
            )));
        }
    }
    let who = non_empty(&input.messenger).map(|m| format!(" · {m}")).unwrap_or_default();
    let reason = if out {
        format!("Vuelto en la calle · pedido #{}{who}", input.order_number.trim())
    } else {
        format!("Vuelve el vuelto · pedido #{}{who}", input.order_number.trim())
    };
    record_movement_in(
        &tx,
        scope,
        &RecordMovementInput {
            movement_id: input.movement_id.clone(),
            outbox_id: input.outbox_id.clone(),
            shift_id: input.shift_id.clone(),
            kind: if out { MovementKind::CashOut } else { MovementKind::CashIn },
            direction: Some(if out { Direction::Out } else { Direction::In }),
            currency,
            amount_minor: input.amount_minor,
            reason: normalize_reason(&reason)?,
            category: Some(if out { VUELTO_OUT } else { VUELTO_BACK }.into()),
            source_system: Some(SOURCE_SYSTEM.into()),
            source_type: Some(VUELTO_SOURCE.into()),
            source_id: Some(input.order_id.to_string()),
            corrects_movement_id: None,
            operator_id: non_empty(&input.staff_id),
            occurred_at: input.occurred_at.clone(),
        },
    )?;
    tx.commit()?;
    Ok(())
}

/// One payment of the web order, as entered in the payment screen.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebPayment {
    /// "cash" | "transfer" | "crypto" (same as caja sales).
    pub method: String,
    pub currency: String,
    pub amount_minor: i64,
    #[serde(default)]
    pub external_ref: Option<String>,
    #[serde(default)]
    pub provider: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChargeWebOrderInput {
    pub charge_id: String,
    pub outbox_id: String,
    pub shift_id: String,
    pub order_id: i64,
    pub order_number: String,
    pub payments: Vec<WebPayment>,
    /// «Atiende»: the clerk who took the money.
    pub staff_id: Option<String>,
    pub staff_name: Option<String>,
    pub note: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebOrderCharge {
    pub charge_id: String,
    pub order_id: i64,
    pub order_number: String,
    pub shift_id: String,
    /// Core collection method: cash_usd | cash_cup | transfer | mixed | other.
    pub method: String,
    pub usd_minor: i64,
    pub cup_minor: i64,
    pub cash_usd_minor: i64,
    pub cash_cup_minor: i64,
    pub reference: Option<String>,
    pub note: Option<String>,
    pub staff_id: Option<String>,
    pub staff_name: Option<String>,
    pub status: String,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub core_message: Option<String>,
    pub created_at: String,
    pub done_at: Option<String>,
}

/// What Core receives, derived from the payments: method, USD and CUP
/// amounts, cash parts (they go into the drawer) and the first reference.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Collection {
    pub method: &'static str,
    pub usd_minor: i64,
    pub cup_minor: i64,
    pub cash_usd_minor: i64,
    pub cash_cup_minor: i64,
    pub reference: Option<String>,
}

/// Maps the payment rows to Core's collection («Dinero recibido» form):
/// only cash → cash_usd / cash_cup (both currencies in cash → cash_usd with
/// both amounts); only transfers → transfer; cash + transfer → mixed.
/// Currencies other than USD and CUP (MLC, USDT…) → other.
pub fn collection_of(payments: &[WebPayment]) -> CashResult<Collection> {
    if payments.is_empty() {
        return Err(CashError::Validation("Elige cómo pagó el cliente".into()));
    }
    let mut c = Collection { method: "other", usd_minor: 0, cup_minor: 0, cash_usd_minor: 0, cash_cup_minor: 0, reference: None };
    let (mut cash, mut transfer, mut other) = (false, false, false);
    for p in payments {
        if p.amount_minor <= 0 {
            return Err(CashError::Validation("Hay un pago sin importe".into()));
        }
        let currency = p.currency.trim().to_uppercase();
        let is_cash = p.method == "cash";
        if !is_cash && c.reference.is_none() {
            c.reference = non_empty(&p.external_ref);
        }
        match (currency.as_str(), is_cash) {
            ("USD", true) => { c.usd_minor += p.amount_minor; c.cash_usd_minor += p.amount_minor; cash = true; }
            ("CUP", true) => { c.cup_minor += p.amount_minor; c.cash_cup_minor += p.amount_minor; cash = true; }
            ("USD", false) => { c.usd_minor += p.amount_minor; transfer = true; }
            ("CUP", false) => { c.cup_minor += p.amount_minor; transfer = true; }
            _ => other = true,
        }
    }
    c.method = if other {
        "other"
    } else if cash && transfer {
        "mixed"
    } else if transfer {
        "transfer"
    } else if c.cup_minor > 0 && c.usd_minor == 0 {
        "cash_cup"
    } else {
        "cash_usd"
    };
    Ok(c)
}

fn row_to_charge(row: &rusqlite::Row) -> rusqlite::Result<WebOrderCharge> {
    Ok(WebOrderCharge {
        charge_id: row.get(0)?,
        order_id: row.get(1)?,
        order_number: row.get(2)?,
        shift_id: row.get(3)?,
        method: row.get(4)?,
        usd_minor: row.get(5)?,
        cup_minor: row.get(6)?,
        cash_usd_minor: row.get(7)?,
        cash_cup_minor: row.get(8)?,
        reference: row.get(9)?,
        note: row.get(10)?,
        staff_id: row.get(11)?,
        staff_name: row.get(12)?,
        status: row.get(13)?,
        attempts: row.get(14)?,
        last_error: row.get(15)?,
        core_message: row.get(16)?,
        created_at: row.get(17)?,
        done_at: row.get(18)?,
    })
}

const COLUMNS: &str = "id,order_id,order_number,shift_id,method,usd_minor,cup_minor,cash_usd_minor,cash_cup_minor,reference,note,staff_id,staff_name,status,attempts,last_error,core_message,created_at,done_at";

pub fn charge(conn: &Connection, charge_id: &str) -> CashResult<WebOrderCharge> {
    conn.query_row(&format!("SELECT {COLUMNS} FROM local_web_order_charges WHERE id=?1"), [charge_id], row_to_charge)
        .optional()?
        .ok_or_else(|| CashError::NotFound("Cobro de pedido web no encontrado".into()))
}

/// The charge of an order on this phone, if any.
pub fn charge_for_order(conn: &Connection, business_id: &str, order_id: i64) -> CashResult<Option<WebOrderCharge>> {
    Ok(conn
        .query_row(
            &format!("SELECT {COLUMNS} FROM local_web_order_charges WHERE business_id=?1 AND order_id=?2"),
            params![business_id, order_id],
            row_to_charge,
        )
        .optional()?)
}

/// Records the charge: drawer movements for the cash parts, the queue row and
/// the outbox event, in one transaction. Refuses an order already charged on
/// this phone. A retry with the same charge id returns the stored charge.
pub fn record_charge(conn: &mut Connection, scope: &ShiftScope, input: &ChargeWebOrderInput) -> CashResult<WebOrderCharge> {
    require_id(&input.charge_id, "cobro")?;
    require_id(&input.outbox_id, "evento")?;
    if input.order_id <= 0 {
        return Err(CashError::Validation("Pedido web inválido".into()));
    }
    let number = input.order_number.trim();
    if number.is_empty() {
        return Err(CashError::Validation("Falta el número del pedido".into()));
    }
    let collection = collection_of(&input.payments)?;
    let note = non_empty(&input.note).map(|n| n.chars().take(280).collect::<String>());

    let tx = conn.transaction()?;
    if let Some(existing) = tx
        .query_row(&format!("SELECT {COLUMNS} FROM local_web_order_charges WHERE id=?1"), [&input.charge_id], row_to_charge)
        .optional()?
    {
        return Ok(existing);
    }
    if let Some(previous) = tx
        .query_row(
            &format!("SELECT {COLUMNS} FROM local_web_order_charges WHERE business_id=?1 AND order_id=?2"),
            params![scope.business_id, input.order_id],
            row_to_charge,
        )
        .optional()?
    {
        return Err(CashError::Conflict(format!(
            "El pedido #{} ya se cobró en esta caja ({})",
            previous.order_number, previous.created_at
        )));
    }
    let shift = require_owned_shift(&tx, scope, &input.shift_id)?;
    if shift.status != "open" {
        return Err(CashError::Conflict("El turno de caja está cerrado: abre el turno para cobrar".into()));
    }

    let reason = normalize_reason(&format!("Pedido web #{number}"))?;
    let operator = non_empty(&input.staff_id);
    for (currency, amount, suffix) in [("USD", collection.cash_usd_minor, "usd"), ("CUP", collection.cash_cup_minor, "cup")] {
        if amount <= 0 {
            continue;
        }
        record_movement_in(
            &tx,
            scope,
            &RecordMovementInput {
                movement_id: format!("{}-{suffix}", input.charge_id),
                outbox_id: format!("{}-{suffix}", input.outbox_id),
                shift_id: input.shift_id.clone(),
                kind: MovementKind::OrderCash,
                direction: Some(Direction::In),
                currency: currency.into(),
                amount_minor: amount,
                reason: reason.clone(),
                category: Some(CATEGORY.into()),
                source_system: Some(SOURCE_SYSTEM.into()),
                source_type: Some(SOURCE_TYPE.into()),
                source_id: Some(input.order_id.to_string()),
                corrects_movement_id: None,
                operator_id: operator.clone(),
                occurred_at: input.occurred_at.clone(),
            },
        )?;
    }

    // Vueltos (Lennys 20-oct): the change this phone gave the messenger for this order
    // comes back to the fund with the charge. It is not a sale.
    for (currency, outstanding) in outstanding_vuelto(&tx, &scope.business_id, input.order_id)? {
        if outstanding <= 0 {
            continue;
        }
        record_movement_in(
            &tx,
            scope,
            &RecordMovementInput {
                movement_id: format!("{}-vb-{}", input.charge_id, currency.to_lowercase()),
                outbox_id: format!("{}-vb-{}", input.outbox_id, currency.to_lowercase()),
                shift_id: input.shift_id.clone(),
                kind: MovementKind::CashIn,
                direction: Some(Direction::In),
                currency: currency.clone(),
                amount_minor: outstanding,
                reason: normalize_reason(&format!("Vuelve el vuelto · pedido #{number}"))?,
                category: Some(VUELTO_BACK.into()),
                source_system: Some(SOURCE_SYSTEM.into()),
                source_type: Some(VUELTO_SOURCE.into()),
                source_id: Some(input.order_id.to_string()),
                corrects_movement_id: None,
                operator_id: operator.clone(),
                occurred_at: input.occurred_at.clone(),
            },
        )?;
    }

    let payments_json = serde_json::to_string(&input.payments).map_err(|e| CashError::Db(e.to_string()))?;
    tx.execute(
        "INSERT INTO local_web_order_charges (id,business_id,device_id,order_id,order_number,shift_id,method,usd_minor,cup_minor,cash_usd_minor,cash_cup_minor,payments_json,reference,note,staff_id,staff_name,status,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,'queued',?17)",
        params![
            input.charge_id,
            scope.business_id,
            scope.device_id,
            input.order_id,
            number,
            input.shift_id,
            collection.method,
            collection.usd_minor,
            collection.cup_minor,
            collection.cash_usd_minor,
            collection.cash_cup_minor,
            payments_json,
            collection.reference,
            note,
            operator,
            non_empty(&input.staff_name),
            input.occurred_at
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "web_order.charged",
        "web_order_charge",
        &input.charge_id,
        &input.occurred_at,
        serde_json::json!({
            "charge_id": input.charge_id,
            "shift_id": input.shift_id,
            "order_id": input.order_id,
            "order_number": number,
            "method": collection.method,
            "usd_minor": collection.usd_minor,
            "cup_minor": collection.cup_minor,
            "cash_usd_minor": collection.cash_usd_minor,
            "cash_cup_minor": collection.cash_cup_minor,
            "reference": collection.reference,
            "staff_id": operator,
            "payments": input.payments,
        }),
    )?;
    tx.commit()?;
    charge(conn, &input.charge_id)
}

/// Charges still waiting to reach Core (oldest first).
pub fn queued_charges(conn: &Connection, business_id: &str) -> CashResult<Vec<WebOrderCharge>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLUMNS} FROM local_web_order_charges WHERE business_id=?1 AND status='queued' ORDER BY created_at, rowid"
    ))?;
    let rows = stmt.query_map([business_id], row_to_charge)?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

/// Latest charges of this phone, for the «Pedidos web» screen.
pub fn recent_charges(conn: &Connection, business_id: &str, limit: i64) -> CashResult<Vec<WebOrderCharge>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLUMNS} FROM local_web_order_charges WHERE business_id=?1 ORDER BY created_at DESC, rowid DESC LIMIT ?2"
    ))?;
    let rows = stmt.query_map(params![business_id, limit.clamp(1, 200)], row_to_charge)?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

/// Core accepted the charge (or had it already from this same charge).
pub fn mark_done(conn: &Connection, charge_id: &str, message: Option<&str>, now: &str) -> CashResult<WebOrderCharge> {
    conn.execute(
        "UPDATE local_web_order_charges SET status='done', done_at=?2, core_message=?3, last_error=NULL WHERE id=?1 AND status='queued'",
        params![charge_id, now, message.map(|m| m.chars().take(500).collect::<String>())],
    )?;
    charge(conn, charge_id)
}

/// A transport or temporary error: stays queued, retried on the next sync.
pub fn record_attempt_failure(conn: &Connection, charge_id: &str, error: &str) -> CashResult<WebOrderCharge> {
    conn.execute(
        "UPDATE local_web_order_charges SET attempts=attempts+1, last_error=?2 WHERE id=?1 AND status='queued'",
        params![charge_id, error.chars().take(500).collect::<String>()],
    )?;
    charge(conn, charge_id)
}

/// Core refused for good (the order was already charged in Ventas, or it is
/// cancelled). The cash this charge put in the drawer is taken back out with
/// corrections when the shift is still open; returns whether it could.
pub fn mark_refused(
    conn: &mut Connection,
    scope: &ShiftScope,
    charge_id: &str,
    message: &str,
    now: &str,
    outbox_prefix: &str,
) -> CashResult<(WebOrderCharge, bool)> {
    let tx = conn.transaction()?;
    let current = tx
        .query_row(&format!("SELECT {COLUMNS} FROM local_web_order_charges WHERE id=?1"), [charge_id], row_to_charge)
        .optional()?
        .ok_or_else(|| CashError::NotFound("Cobro de pedido web no encontrado".into()))?;
    if current.status != "queued" {
        drop(tx);
        return Ok((charge(conn, charge_id)?, false));
    }
    let open: bool = tx
        .query_row("SELECT status='open' FROM local_cash_shifts WHERE id=?1", [&current.shift_id], |r| r.get(0))
        .optional()?
        .unwrap_or(false);
    let mut corrected = false;
    if open {
        let reason = normalize_reason(&format!("Pedido web #{} ya estaba cobrado en Ventas: no se cuenta dos veces", current.order_number))?;
        for (currency, amount, suffix) in [("USD", current.cash_usd_minor, "usd"), ("CUP", current.cash_cup_minor, "cup")] {
            if amount <= 0 {
                continue;
            }
            let target = format!("{charge_id}-{suffix}");
            let exists: bool = tx
                .query_row("SELECT COUNT(*) > 0 FROM local_cash_movements WHERE id=?1", [&target], |r| r.get(0))?;
            if !exists {
                continue;
            }
            // Best effort: if that cash already left the drawer, nothing is
            // taken out and the screen tells the clerk to check it.
            let back = record_movement_in(
                &tx,
                scope,
                &RecordMovementInput {
                    movement_id: format!("{charge_id}-{suffix}-back"),
                    outbox_id: format!("{outbox_prefix}-{suffix}"),
                    shift_id: current.shift_id.clone(),
                    kind: MovementKind::Correction,
                    direction: Some(Direction::Out),
                    currency: currency.into(),
                    amount_minor: amount,
                    reason: reason.clone(),
                    category: Some(CATEGORY.into()),
                    source_system: None,
                    source_type: None,
                    source_id: None,
                    corrects_movement_id: Some(target),
                    operator_id: current.staff_id.clone(),
                    occurred_at: now.into(),
                },
            );
            match back {
                Ok(()) => corrected = true,
                Err(CashError::Validation(_)) => {}
                Err(e) => return Err(e),
            }
        }
    }
    tx.execute(
        "UPDATE local_web_order_charges SET status='refused', done_at=?2, core_message=?3 WHERE id=?1 AND status='queued'",
        params![charge_id, now, message.chars().take(500).collect::<String>()],
    )?;
    tx.commit()?;
    Ok((charge(conn, charge_id)?, corrected))
}
