//! «Pedido web: cancelar o devolver» (Ernesto 31-oct, caso de la olla Ariete).
//!
//! A web order (#5xxx) is cancelled or returned in Core, never in the caja:
//! Core puts the stock back and voids the gestora's commission. The caja only
//!
//! * keeps one `local_web_order_actions` row per action: the offline queue that
//!   tells Core (queued → done | refused) and the guard against doing it twice.
//!   Its id goes to Core as `actionId`, so a retry is a no-op there too;
//! * for a return that gives CASH back, takes that cash out of the drawer at
//!   once (the clerk already handed it over) as a `cash_out` movement linked
//!   to the order: category `devolucion_pedido`, source woocommerce /
//!   web_order_return / <order id>, reason «Devolución pedido #N · producto ·
//!   causa». The cloud sends it to Lennys for approval (fund_exit_approvals);
//! * emits a `web_order.action_recorded` outbox event with the whole action
//!   (transfers included, which do not touch the drawer).
//!
//! If Core later refuses, the cash movement is NOT undone: the money did leave
//! the drawer, and Lennys decides with the order number in front of her.

use crate::cash_shift::{
    enqueue_outbox, non_empty, normalize_currency, normalize_reason, record_movement_in, require_id, require_owned_shift,
    CashError, CashResult, Direction, MovementKind, RecordMovementInput, ShiftScope,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

pub const SOURCE_SYSTEM: &str = "woocommerce";
pub const SOURCE_TYPE: &str = "web_order_return";
pub const CATEGORY: &str = "devolucion_pedido";

/// One line of the order that comes back.
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReturnLine {
    pub item_id: i64,
    pub name: String,
    pub qty: i64,
}

/// Money given back: "cash" | "transfer", USD or CUP.
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Refund {
    pub method: String,
    pub currency: String,
    pub amount_minor: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebOrderActionInput {
    /// Also the idempotency key Core receives (actionId).
    pub action_id: String,
    pub outbox_id: String,
    /// "cancel" | "return".
    pub kind: String,
    pub order_id: i64,
    pub order_number: String,
    pub reason: String,
    #[serde(default)]
    pub lines: Vec<ReturnLine>,
    #[serde(default)]
    pub refunds: Vec<Refund>,
    /// Needed when cash leaves the drawer.
    #[serde(default)]
    pub shift_id: Option<String>,
    pub staff_id: Option<String>,
    pub staff_name: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebOrderAction {
    pub action_id: String,
    pub kind: String,
    pub order_id: i64,
    pub order_number: String,
    pub shift_id: Option<String>,
    pub reason: String,
    pub products_text: Option<String>,
    pub lines: Vec<ReturnLine>,
    pub refunds: Vec<Refund>,
    pub refund_method: String,
    pub refund_usd_minor: i64,
    pub refund_cup_minor: i64,
    pub cash_usd_minor: i64,
    pub cash_cup_minor: i64,
    pub staff_id: Option<String>,
    pub staff_name: Option<String>,
    pub status: String,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub core_message: Option<String>,
    pub created_at: String,
    pub done_at: Option<String>,
}

/// Totals of the refund rows: (method, usd, cup, cash usd, cash cup).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RefundTotals {
    pub method: &'static str,
    pub usd_minor: i64,
    pub cup_minor: i64,
    pub cash_usd_minor: i64,
    pub cash_cup_minor: i64,
}

pub fn refund_totals(refunds: &[Refund]) -> CashResult<RefundTotals> {
    let mut t = RefundTotals { method: "none", usd_minor: 0, cup_minor: 0, cash_usd_minor: 0, cash_cup_minor: 0 };
    let (mut cash, mut transfer) = (false, false);
    for r in refunds {
        if r.amount_minor < 0 {
            return Err(CashError::Validation("El dinero devuelto no puede ser negativo".into()));
        }
        if r.amount_minor == 0 {
            continue;
        }
        let is_cash = match r.method.as_str() {
            "cash" => true,
            "transfer" => false,
            _ => return Err(CashError::Validation("Di si el dinero se devolvió en efectivo o por transferencia".into())),
        };
        match normalize_currency(&r.currency)?.as_str() {
            "USD" => {
                t.usd_minor += r.amount_minor;
                if is_cash { t.cash_usd_minor += r.amount_minor; }
            }
            "CUP" => {
                t.cup_minor += r.amount_minor;
                if is_cash { t.cash_cup_minor += r.amount_minor; }
            }
            _ => return Err(CashError::Validation("La devolución de un pedido web se hace en USD o en CUP".into())),
        }
        if is_cash { cash = true } else { transfer = true }
    }
    t.method = match (cash, transfer) {
        (true, true) => "mixed",
        (true, false) => "cash",
        (false, true) => "transfer",
        _ => "none",
    };
    Ok(t)
}

/// «1× Olla de presión eléctrica Ariete digital, 2× Taza».
pub fn products_text(lines: &[ReturnLine]) -> String {
    lines.iter().map(|l| format!("{}× {}", l.qty, l.name.trim())).collect::<Vec<_>>().join(", ")
}

/// The drawer line Lennys reads in the bot: order, product and cause.
pub fn exit_reason(order_number: &str, products: &str, reason: &str) -> String {
    let text = if products.is_empty() {
        format!("Devolución pedido #{order_number} · causa: {reason}")
    } else {
        format!("Devolución pedido #{order_number} · {products} · causa: {reason}")
    };
    text.chars().take(280).collect()
}

const COLUMNS: &str = "id,kind,order_id,order_number,shift_id,reason,products_text,lines_json,refunds_json,refund_method,refund_usd_minor,refund_cup_minor,cash_usd_minor,cash_cup_minor,staff_id,staff_name,status,attempts,last_error,core_message,created_at,done_at";

fn row_to_action(row: &rusqlite::Row) -> rusqlite::Result<WebOrderAction> {
    let lines: String = row.get(7)?;
    let refunds: String = row.get(8)?;
    Ok(WebOrderAction {
        action_id: row.get(0)?,
        kind: row.get(1)?,
        order_id: row.get(2)?,
        order_number: row.get(3)?,
        shift_id: row.get(4)?,
        reason: row.get(5)?,
        products_text: row.get(6)?,
        lines: serde_json::from_str(&lines).unwrap_or_default(),
        refunds: serde_json::from_str(&refunds).unwrap_or_default(),
        refund_method: row.get(9)?,
        refund_usd_minor: row.get(10)?,
        refund_cup_minor: row.get(11)?,
        cash_usd_minor: row.get(12)?,
        cash_cup_minor: row.get(13)?,
        staff_id: row.get(14)?,
        staff_name: row.get(15)?,
        status: row.get(16)?,
        attempts: row.get(17)?,
        last_error: row.get(18)?,
        core_message: row.get(19)?,
        created_at: row.get(20)?,
        done_at: row.get(21)?,
    })
}

pub fn action(conn: &Connection, action_id: &str) -> CashResult<WebOrderAction> {
    conn.query_row(&format!("SELECT {COLUMNS} FROM local_web_order_actions WHERE id=?1"), [action_id], row_to_action)
        .optional()?
        .ok_or_else(|| CashError::NotFound("Acción de pedido web no encontrada".into()))
}

/// Records the action in one transaction: the queue row, the drawer exit for
/// cash refunds (linked to the order) and the outbox event. A retry with the
/// same action id returns the stored action without doing anything again.
pub fn record_action(conn: &mut Connection, scope: &ShiftScope, input: &WebOrderActionInput) -> CashResult<WebOrderAction> {
    require_id(&input.action_id, "acción")?;
    require_id(&input.outbox_id, "evento")?;
    if input.order_id <= 0 {
        return Err(CashError::Validation("Pedido web inválido".into()));
    }
    let number = input.order_number.trim().trim_start_matches('#').to_string();
    if number.is_empty() {
        return Err(CashError::Validation("Falta el número del pedido".into()));
    }
    let kind = match input.kind.as_str() {
        "cancel" | "return" => input.kind.as_str(),
        _ => return Err(CashError::Validation("Elige cancelar o devolución".into())),
    };
    let reason = input.reason.split_whitespace().collect::<Vec<_>>().join(" ");
    if reason.chars().count() < 3 {
        return Err(CashError::Validation(if kind == "cancel" {
            "Escribe la causa de la cancelación (una frase corta)".into()
        } else {
            "Escribe la causa de la devolución (una frase corta)".into()
        }));
    }
    let reason: String = reason.chars().take(200).collect();
    let mut lines: Vec<ReturnLine> = Vec::new();
    let mut refunds: Vec<Refund> = Vec::new();
    let totals = if kind == "return" {
        for l in &input.lines {
            if l.qty < 0 || l.item_id <= 0 {
                return Err(CashError::Validation("Hay una línea de la devolución mal escrita".into()));
            }
            if l.qty > 0 {
                lines.push(ReturnLine { item_id: l.item_id, name: l.name.trim().to_string(), qty: l.qty });
            }
        }
        if lines.is_empty() {
            return Err(CashError::Validation("Elige qué producto vuelve y cuántos".into()));
        }
        refunds = input.refunds.iter().filter(|r| r.amount_minor != 0).cloned().collect();
        for r in &mut refunds {
            r.currency = normalize_currency(&r.currency)?;
        }
        refund_totals(&refunds)?
    } else {
        if !input.refunds.is_empty() && input.refunds.iter().any(|r| r.amount_minor != 0) {
            return Err(CashError::Validation("Al cancelar no se devuelve dinero desde aquí: si el cliente ya pagó, que lo decida Lennys".into()));
        }
        RefundTotals { method: "none", usd_minor: 0, cup_minor: 0, cash_usd_minor: 0, cash_cup_minor: 0 }
    };
    let products = products_text(&lines);
    let shift_id = non_empty(&input.shift_id);
    let operator = non_empty(&input.staff_id);

    let tx = conn.transaction()?;
    if let Some(existing) = tx
        .query_row(&format!("SELECT {COLUMNS} FROM local_web_order_actions WHERE id=?1"), [&input.action_id], row_to_action)
        .optional()?
    {
        return Ok(existing);
    }
    if let Some(previous) = tx
        .query_row(
            &format!("SELECT {COLUMNS} FROM local_web_order_actions WHERE business_id=?1 AND order_id=?2 AND kind=?3 AND status<>'refused'"),
            params![scope.business_id, input.order_id, kind],
            row_to_action,
        )
        .optional()?
    {
        return Err(CashError::Conflict(format!(
            "El pedido #{} ya tiene una {} hecha en esta caja ({})",
            previous.order_number,
            if kind == "cancel" { "cancelación" } else { "devolución" },
            previous.created_at
        )));
    }
    let cash_out = totals.cash_usd_minor > 0 || totals.cash_cup_minor > 0;
    if cash_out {
        let shift_ref = match &shift_id {
            Some(id) => id.clone(),
            None => return Err(CashError::Conflict("Para devolver efectivo abre el turno de caja: el dinero sale del cajón".into())),
        };
        let shift = require_owned_shift(&tx, scope, &shift_ref)?;
        if shift.status != "open" {
            return Err(CashError::Conflict("El turno de caja está cerrado: abre el turno para devolver efectivo".into()));
        }
        let exit = normalize_reason(&exit_reason(&number, &products, &reason))?;
        for (currency, amount, suffix) in [("USD", totals.cash_usd_minor, "usd"), ("CUP", totals.cash_cup_minor, "cup")] {
            if amount <= 0 {
                continue;
            }
            record_movement_in(
                &tx,
                scope,
                &RecordMovementInput {
                    movement_id: format!("{}-{suffix}", input.action_id),
                    outbox_id: format!("{}-{suffix}", input.outbox_id),
                    shift_id: shift_ref.clone(),
                    kind: MovementKind::CashOut,
                    direction: Some(Direction::Out),
                    currency: currency.into(),
                    amount_minor: amount,
                    reason: exit.clone(),
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
    }
    let lines_json = serde_json::to_string(&lines).map_err(|e| CashError::Db(e.to_string()))?;
    let refunds_json = serde_json::to_string(&refunds).map_err(|e| CashError::Db(e.to_string()))?;
    tx.execute(
        "INSERT INTO local_web_order_actions (id,business_id,device_id,kind,order_id,order_number,shift_id,reason,products_text,lines_json,refunds_json,refund_method,refund_usd_minor,refund_cup_minor,cash_usd_minor,cash_cup_minor,staff_id,staff_name,status,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,'queued',?19)",
        params![
            input.action_id,
            scope.business_id,
            scope.device_id,
            kind,
            input.order_id,
            number,
            shift_id,
            reason,
            if products.is_empty() { None } else { Some(products.clone()) },
            lines_json,
            refunds_json,
            totals.method,
            totals.usd_minor,
            totals.cup_minor,
            totals.cash_usd_minor,
            totals.cash_cup_minor,
            operator,
            non_empty(&input.staff_name),
            input.occurred_at,
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "web_order.action_recorded",
        "web_order_action",
        &input.action_id,
        &input.occurred_at,
        serde_json::json!({
            "action_id": input.action_id,
            "kind": kind,
            "shift_id": shift_id,
            "order_id": input.order_id,
            "order_number": number,
            "reason": reason,
            "products": products,
            "lines": lines,
            "refunds": refunds,
            "refund_method": totals.method,
            "refund_usd_minor": totals.usd_minor,
            "refund_cup_minor": totals.cup_minor,
            "cash_usd_minor": totals.cash_usd_minor,
            "cash_cup_minor": totals.cash_cup_minor,
            "staff_id": operator,
        }),
    )?;
    tx.commit()?;
    action(conn, &input.action_id)
}

/// Actions still waiting to reach Core (oldest first).
pub fn queued_actions(conn: &Connection, business_id: &str) -> CashResult<Vec<WebOrderAction>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLUMNS} FROM local_web_order_actions WHERE business_id=?1 AND status='queued' ORDER BY created_at, rowid"
    ))?;
    let rows = stmt.query_map([business_id], row_to_action)?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

/// Latest actions of this phone, for the screen.
pub fn recent_actions(conn: &Connection, business_id: &str, limit: i64) -> CashResult<Vec<WebOrderAction>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLUMNS} FROM local_web_order_actions WHERE business_id=?1 ORDER BY created_at DESC, rowid DESC LIMIT ?2"
    ))?;
    let rows = stmt.query_map(params![business_id, limit.clamp(1, 100)], row_to_action)?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

/// Core accepted it (or already had this same action).
pub fn mark_done(conn: &Connection, action_id: &str, message: Option<&str>, now: &str) -> CashResult<WebOrderAction> {
    conn.execute(
        "UPDATE local_web_order_actions SET status='done', done_at=?2, core_message=?3, last_error=NULL WHERE id=?1 AND status='queued'",
        params![action_id, now, message.map(|m| m.chars().take(500).collect::<String>())],
    )?;
    action(conn, action_id)
}

/// A transport or temporary error: stays queued, retried on the next sync.
pub fn record_attempt_failure(conn: &Connection, action_id: &str, error: &str) -> CashResult<WebOrderAction> {
    conn.execute(
        "UPDATE local_web_order_actions SET attempts=attempts+1, last_error=?2 WHERE id=?1 AND status='queued'",
        params![action_id, error.chars().take(500).collect::<String>()],
    )?;
    action(conn, action_id)
}

/// Core said no for good (already delivered, already returned, the messenger
/// has it…). The drawer exit, if any, stays: that cash did leave, and Lennys
/// sees it pending with the order number.
pub fn mark_refused(conn: &Connection, action_id: &str, message: &str, now: &str) -> CashResult<WebOrderAction> {
    conn.execute(
        "UPDATE local_web_order_actions SET status='refused', done_at=?2, core_message=?3 WHERE id=?1 AND status='queued'",
        params![action_id, now, message.chars().take(500).collect::<String>()],
    )?;
    action(conn, action_id)
}
