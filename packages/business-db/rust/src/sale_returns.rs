//! Sale returns and refunds (devoluciones).
//!
//! A return references the original sale, which is never edited. Returned
//! lines put stock back with an inventory movement (reason `return`). A refund
//! names its rail; a cash refund taken while this device has an open shift
//! leaves the drawer as `cash_out` with category `sale_refund`. Everything is
//! written in one transaction with its outbox event and is idempotent by the
//! caller-supplied return ID. Migration 0008 enforces the same limits.

use crate::cash_shift::{
    currency_totals, current_open_shift, enqueue_outbox, non_empty, normalize_reason, require_id,
    track_currency, CashError, CashResult, ShiftScope,
};
use crate::receivables::PaymentRail;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnLineInput {
    pub return_line_id: String,
    pub sale_line_id: String,
    pub quantity: i64,
    pub inventory_movement_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordSaleReturnInput {
    pub return_id: String,
    pub outbox_id: String,
    pub sale_id: String,
    pub lines: Vec<ReturnLineInput>,
    /// 0 for an exchange/store credit decided outside the drawer.
    pub refund_minor: i64,
    pub refund_rail: Option<PaymentRail>,
    pub refund_provider: Option<String>,
    pub refund_external_ref: Option<String>,
    /// ID for the drawer movement, used only for cash with an open shift.
    pub cash_movement_id: Option<String>,
    pub reason: String,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnableLine {
    pub sale_line_id: String,
    pub product_id: String,
    pub sold_quantity: i64,
    pub returned_quantity: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleReturnSummary {
    pub sale_id: String,
    pub currency: String,
    pub total_minor: i64,
    pub refunded_minor: i64,
    pub lines: Vec<ReturnableLine>,
}

struct SaleRow {
    business_id: String,
    currency: String,
    total_minor: i64,
}

fn load_sale(conn: &Connection, sale_id: &str) -> CashResult<SaleRow> {
    conn.query_row(
        "SELECT business_id, currency, total_minor FROM local_sales WHERE id=?1",
        [sale_id],
        |row| {
            Ok(SaleRow {
                business_id: row.get(0)?,
                currency: row.get(1)?,
                total_minor: row.get(2)?,
            })
        },
    )
    .optional()?
    .ok_or_else(|| CashError::NotFound("Venta no encontrada".into()))
}

/// What was sold, returned and refunded so far for one sale.
pub fn sale_return_summary(conn: &Connection, sale_id: &str) -> CashResult<SaleReturnSummary> {
    let sale = load_sale(conn, sale_id)?;
    let refunded_minor: i64 = conn.query_row(
        "SELECT COALESCE(SUM(refund_minor),0) FROM local_sale_returns WHERE sale_id=?1",
        [sale_id],
        |row| row.get(0),
    )?;
    let mut stmt = conn.prepare(
        "SELECT l.id, l.product_id, l.quantity,
                COALESCE((SELECT SUM(r.quantity) FROM local_sale_return_lines r WHERE r.sale_line_id = l.id), 0)
         FROM local_sale_lines l WHERE l.sale_id=?1 ORDER BY l.id",
    )?;
    let lines = stmt
        .query_map([sale_id], |row| {
            Ok(ReturnableLine {
                sale_line_id: row.get(0)?,
                product_id: row.get(1)?,
                sold_quantity: row.get(2)?,
                returned_quantity: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(SaleReturnSummary {
        sale_id: sale_id.to_string(),
        currency: sale.currency,
        total_minor: sale.total_minor,
        refunded_minor,
        lines,
    })
}

pub fn record_sale_return(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &RecordSaleReturnInput,
) -> CashResult<SaleReturnSummary> {
    require_id(&input.return_id, "devolución")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.sale_id, "venta")?;
    let reason = normalize_reason(&input.reason)?;
    if input.refund_minor < 0 {
        return Err(CashError::Validation("El reembolso no puede ser negativo".into()));
    }
    match (input.refund_minor > 0, input.refund_rail) {
        (true, None) => {
            return Err(CashError::Validation(
                "Indica cómo se devuelve el dinero".into(),
            ))
        }
        (false, Some(_)) => {
            return Err(CashError::Validation(
                "Sin reembolso no se indica forma de pago".into(),
            ))
        }
        _ => {}
    }
    if input.lines.is_empty() && input.refund_minor == 0 {
        return Err(CashError::Validation(
            "La devolución no tiene productos ni reembolso".into(),
        ));
    }
    let mut seen = BTreeSet::new();
    for line in &input.lines {
        require_id(&line.return_line_id, "línea devuelta")?;
        require_id(&line.inventory_movement_id, "movimiento de inventario")?;
        if line.quantity <= 0 {
            return Err(CashError::Validation(
                "La cantidad devuelta debe ser mayor que cero".into(),
            ));
        }
        if !seen.insert(line.sale_line_id.as_str()) {
            return Err(CashError::Validation("Línea de venta repetida".into()));
        }
    }

    let tx = conn.transaction()?;

    let existing: Option<String> = tx
        .query_row(
            "SELECT sale_id FROM local_sale_returns WHERE id=?1",
            [&input.return_id],
            |row| row.get(0),
        )
        .optional()?;
    if let Some(sale_id) = existing {
        if sale_id != input.sale_id {
            return Err(CashError::Conflict(
                "El identificador de devolución ya existe en otra venta".into(),
            ));
        }
        drop(tx);
        return sale_return_summary(conn, &input.sale_id);
    }

    let sale = load_sale(&tx, &input.sale_id)?;
    if sale.business_id != scope.business_id {
        return Err(CashError::Conflict("La venta pertenece a otro negocio".into()));
    }
    let summary = sale_return_summary(&tx, &input.sale_id)?;
    if input.refund_minor > summary.total_minor - summary.refunded_minor {
        return Err(CashError::Validation(
            "El reembolso supera lo pendiente de la venta".into(),
        ));
    }
    let mut products = Vec::new();
    for line in &input.lines {
        let sold = summary
            .lines
            .iter()
            .find(|l| l.sale_line_id == line.sale_line_id)
            .ok_or_else(|| CashError::Validation("Esa línea no pertenece a la venta".into()))?;
        if line.quantity > sold.sold_quantity - sold.returned_quantity {
            return Err(CashError::Validation(
                "La cantidad devuelta supera lo vendido".into(),
            ));
        }
        products.push(sold.product_id.clone());
    }

    let operator = non_empty(&input.operator_id);
    let provider = non_empty(&input.refund_provider);
    let external_ref = non_empty(&input.refund_external_ref);

    // Physical cash leaves this device's drawer when a shift is open.
    let mut shift_id = None;
    let mut cash_movement_id = None;
    if input.refund_rail == Some(PaymentRail::Cash) && crate::cash_ledger_ready(&tx)? {
        if let Some(open) = current_open_shift(&tx, scope)? {
            let movement_id = non_empty(&input.cash_movement_id).ok_or_else(|| {
                CashError::Validation("Falta el identificador del movimiento de caja".into())
            })?;
            let available = currency_totals(&tx, &open)?
                .get(&sale.currency)
                .map(|c| c.expected_minor)
                .unwrap_or(0);
            if input.refund_minor > available {
                return Err(CashError::Validation(
                    "El reembolso supera el efectivo esperado en caja".into(),
                ));
            }
            track_currency(&tx, &open, &sale.currency)?;
            tx.execute(
                "INSERT INTO local_cash_movements (id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind,category,source_system,source_type,source_id,operator_id)
                 VALUES (?1,?2,?3,?4,?5,'out',?6,?7,?8,?9,'cash_out','sale_refund','nexo','sale_return',?10,?11)",
                params![
                    movement_id,
                    open,
                    scope.business_id,
                    scope.branch_id,
                    scope.device_id,
                    input.refund_minor,
                    reason,
                    input.occurred_at,
                    sale.currency,
                    input.return_id,
                    operator
                ],
            )?;
            shift_id = Some(open);
            cash_movement_id = Some(movement_id);
        }
    }

    tx.execute(
        "INSERT INTO local_sale_returns (id,business_id,branch_id,device_id,sale_id,currency,refund_minor,refund_rail,refund_provider,refund_external_ref,cash_movement_id,reason,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)",
        params![
            input.return_id,
            scope.business_id,
            scope.branch_id,
            scope.device_id,
            input.sale_id,
            sale.currency,
            input.refund_minor,
            input.refund_rail.map(PaymentRail::as_str),
            provider,
            external_ref,
            cash_movement_id,
            reason,
            operator,
            input.occurred_at
        ],
    )?;

    let mut lines_payload = Vec::new();
    for (line, product_id) in input.lines.iter().zip(&products) {
        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at)
             VALUES (?1,?2,?3,?4,'return','sale_return',?5,?6)",
            params![
                line.inventory_movement_id,
                scope.business_id,
                product_id,
                line.quantity,
                input.return_id,
                input.occurred_at
            ],
        )?;
        tx.execute(
            "INSERT INTO local_sale_return_lines (id,return_id,sale_line_id,product_id,quantity,inventory_movement_id)
             VALUES (?1,?2,?3,?4,?5,?6)",
            params![
                line.return_line_id,
                input.return_id,
                line.sale_line_id,
                product_id,
                line.quantity,
                line.inventory_movement_id
            ],
        )?;
        lines_payload.push(serde_json::json!({
            "sale_line_id": line.sale_line_id,
            "product_id": product_id,
            "quantity": line.quantity,
        }));
    }

    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "sale.returned",
        "sale_return",
        &input.return_id,
        &input.occurred_at,
        serde_json::json!({
            "return_id": input.return_id,
            "sale_id": input.sale_id,
            "currency": sale.currency,
            "refund_minor": input.refund_minor,
            "refund_rail": input.refund_rail.map(PaymentRail::as_str),
            "refund_provider": provider,
            "refund_external_ref": external_ref,
            "shift_id": shift_id,
            "cash_movement_id": cash_movement_id,
            "reason": reason,
            "operator_id": operator,
            "lines": lines_payload,
        }),
    )?;

    tx.commit()?;
    sale_return_summary(conn, &input.sale_id)
}
