//! Consignment (consignación): goods at a client's `consignment` location stay
//! owned by the business until the client reports them sold.
//!
//! Goods move to and from the consignment location with ordinary transfers
//! (`inventory::transfer_stock`). A settlement records the units sold at agreed
//! prices; one transaction writes the settlement and its lines, decreases stock
//! at the consignment location and opens a receivable for the total, each with
//! its outbox event. Idempotent by caller-supplied IDs.

use crate::cash_shift::{
    enqueue_outbox, non_empty, normalize_currency, require_id, CashError, CashResult, ShiftScope,
};
use crate::inventory::{load_location, require_product, stock_at};
use crate::receivables::{insert_receivable, receivable_balance, OpenReceivableInput, ReceivableBalance};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenConsignmentAccountInput {
    pub location_id: String,
    pub outbox_id: String,
    pub customer_id: String,
    pub currency: String,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConsignmentAccount {
    pub location_id: String,
    pub customer_id: String,
    pub currency: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettlementLineInput {
    pub line_id: String,
    pub inventory_movement_id: String,
    pub product_id: String,
    pub quantity: i64,
    pub unit_price_minor: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettleConsignmentInput {
    pub settlement_id: String,
    pub outbox_id: String,
    pub receivable_id: String,
    pub receivable_outbox_id: String,
    pub location_id: String,
    pub lines: Vec<SettlementLineInput>,
    pub due_at: Option<String>,
    pub note: Option<String>,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

fn load_account(
    conn: &Connection,
    business_id: &str,
    location_id: &str,
) -> CashResult<Option<ConsignmentAccount>> {
    Ok(conn
        .query_row(
            "SELECT location_id, customer_id, currency FROM local_consignment_accounts WHERE location_id=?1 AND business_id=?2",
            params![location_id, business_id],
            |row| {
                Ok(ConsignmentAccount {
                    location_id: row.get(0)?,
                    customer_id: row.get(1)?,
                    currency: row.get(2)?,
                })
            },
        )
        .optional()?)
}

pub fn open_consignment_account(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &OpenConsignmentAccountInput,
) -> CashResult<ConsignmentAccount> {
    require_id(&input.location_id, "ubicación de consignación")?;
    require_id(&input.outbox_id, "evento")?;
    let customer_id = input.customer_id.trim().to_string();
    if customer_id.is_empty() {
        return Err(CashError::Validation("Falta el cliente".into()));
    }
    let currency = normalize_currency(&input.currency)?;

    let tx = conn.transaction()?;
    if let Some(existing) = load_account(&tx, &scope.business_id, &input.location_id)? {
        if existing.customer_id != customer_id || existing.currency != currency {
            return Err(CashError::Conflict(
                "Esa ubicación ya está asignada a otro cliente o moneda".into(),
            ));
        }
        return Ok(existing);
    }
    let location = load_location(&tx, &scope.business_id, &input.location_id)?;
    if location.kind != "consignment" {
        return Err(CashError::Validation(
            "La ubicación debe ser de tipo consignación".into(),
        ));
    }
    tx.execute(
        "INSERT INTO local_consignment_accounts (location_id,business_id,customer_id,currency,created_at) VALUES (?1,?2,?3,?4,?5)",
        params![input.location_id, scope.business_id, customer_id, currency, input.created_at],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "consignment.account_opened",
        "consignment_account",
        &input.location_id,
        &input.created_at,
        serde_json::json!({
            "location_id": input.location_id,
            "customer_id": customer_id,
            "currency": currency,
        }),
    )?;
    tx.commit()?;
    Ok(ConsignmentAccount {
        location_id: input.location_id.clone(),
        customer_id,
        currency,
    })
}

pub fn settle_consignment(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &SettleConsignmentInput,
) -> CashResult<ReceivableBalance> {
    require_id(&input.settlement_id, "liquidación")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.receivable_id, "cuenta por cobrar")?;
    require_id(&input.receivable_outbox_id, "evento de la cuenta por cobrar")?;
    if input.lines.is_empty() {
        return Err(CashError::Validation("La liquidación no tiene productos".into()));
    }
    let mut total: i64 = 0;
    let mut per_product: BTreeMap<&str, i64> = BTreeMap::new();
    for line in &input.lines {
        require_id(&line.line_id, "línea")?;
        require_id(&line.inventory_movement_id, "movimiento de inventario")?;
        if line.quantity <= 0 || line.unit_price_minor < 0 {
            return Err(CashError::Validation(
                "Cantidad y precio deben ser válidos".into(),
            ));
        }
        let line_total = line
            .quantity
            .checked_mul(line.unit_price_minor)
            .ok_or_else(|| CashError::Validation("Desbordamiento en la liquidación".into()))?;
        total = total
            .checked_add(line_total)
            .ok_or_else(|| CashError::Validation("Desbordamiento en la liquidación".into()))?;
        *per_product.entry(line.product_id.as_str()).or_default() += line.quantity;
    }
    if total <= 0 {
        return Err(CashError::Validation(
            "El total de la liquidación debe ser mayor que cero".into(),
        ));
    }

    let tx = conn.transaction()?;
    let existing: Option<String> = tx
        .query_row(
            "SELECT receivable_id FROM local_consignment_settlements WHERE id=?1 AND business_id=?2",
            params![input.settlement_id, scope.business_id],
            |row| row.get(0),
        )
        .optional()?;
    if let Some(receivable_id) = existing {
        drop(tx);
        return receivable_balance(conn, &receivable_id);
    }

    let account = load_account(&tx, &scope.business_id, &input.location_id)?.ok_or_else(|| {
        CashError::NotFound("Esa ubicación no tiene cuenta de consignación".into())
    })?;
    for (product_id, quantity) in &per_product {
        require_product(&tx, &scope.business_id, product_id)?;
        if *quantity > stock_at(&tx, &scope.business_id, &account.location_id, product_id)? {
            return Err(CashError::Validation(
                "Se liquidan más unidades de las que hay en consignación".into(),
            ));
        }
    }

    let operator = non_empty(&input.operator_id);
    let note = non_empty(&input.note);
    insert_receivable(
        &tx,
        scope,
        &OpenReceivableInput {
            receivable_id: input.receivable_id.clone(),
            outbox_id: input.receivable_outbox_id.clone(),
            customer_id: account.customer_id.clone(),
            source_system: "nexo".into(),
            source_type: "consignment_settlement".into(),
            source_id: input.settlement_id.clone(),
            currency: account.currency.clone(),
            amount_minor: total,
            due_at: input.due_at.clone(),
            note: note.clone(),
            operator_id: operator.clone(),
            created_at: input.occurred_at.clone(),
        },
    )?;
    tx.execute(
        "INSERT INTO local_consignment_settlements (id,business_id,location_id,customer_id,currency,total_minor,receivable_id,note,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![
            input.settlement_id,
            scope.business_id,
            account.location_id,
            account.customer_id,
            account.currency,
            total,
            input.receivable_id,
            note,
            operator,
            input.occurred_at
        ],
    )?;

    let mut lines_payload = Vec::new();
    for line in &input.lines {
        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at,location_id,operator_id)
             VALUES (?1,?2,?3,?4,'consignment_sale','consignment_settlement',?5,?6,?7,?8)",
            params![
                line.inventory_movement_id,
                scope.business_id,
                line.product_id,
                -line.quantity,
                input.settlement_id,
                input.occurred_at,
                account.location_id,
                operator
            ],
        )?;
        tx.execute(
            "INSERT INTO local_consignment_settlement_lines (id,settlement_id,product_id,quantity,unit_price_minor,line_total_minor,inventory_movement_id)
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![
                line.line_id,
                input.settlement_id,
                line.product_id,
                line.quantity,
                line.unit_price_minor,
                line.quantity * line.unit_price_minor,
                line.inventory_movement_id
            ],
        )?;
        lines_payload.push(serde_json::json!({
            "product_id": line.product_id,
            "quantity": line.quantity,
            "unit_price_minor": line.unit_price_minor,
        }));
    }

    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "consignment.settled",
        "consignment_settlement",
        &input.settlement_id,
        &input.occurred_at,
        serde_json::json!({
            "settlement_id": input.settlement_id,
            "location_id": account.location_id,
            "customer_id": account.customer_id,
            "currency": account.currency,
            "total_minor": total,
            "receivable_id": input.receivable_id,
            "operator_id": operator,
            "lines": lines_payload,
        }),
    )?;
    tx.commit()?;
    receivable_balance(conn, &input.receivable_id)
}
