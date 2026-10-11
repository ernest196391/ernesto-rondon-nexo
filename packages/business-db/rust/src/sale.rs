//! Completing a sale: lines, inventory, one or more payments and the outbox
//! event, all in one transaction.
//!
//! A sale is priced in USD. It can be paid with up to four payments in any
//! currency (USD/CUP cash, CUP/MLC/Zelle transfers, USDT and other crypto).
//! Each payment carries its USD value at the rate the owner set; the USD
//! values must add up exactly to the sale total, so a sale is never left
//! under- or over-paid. Change is not a payment: the POS records cash net of
//! the change it gave back.

use crate::cash_shift::{self, normalize_currency, CashError, CashResult, ShiftScope};
use crate::stock;
use rusqlite::{params, Connection};
use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

pub const SALE_CURRENCY: &str = "USD";
pub const MAX_PAYMENTS: usize = 4;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleLineInput {
    pub line_id: String,
    pub movement_id: String,
    pub product_id: String,
    pub quantity: i64,
    pub unit_price_minor: i64,
    pub line_total_minor: i64,
    /// Product a gestora's client added in the shop: its commission is split
    /// gestora / business / dependienta in the cloud.
    #[serde(default)]
    pub extra: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentInput {
    pub payment_id: String,
    /// "cash", "transfer" or "crypto".
    pub method: String,
    pub currency: String,
    pub amount_minor: i64,
    pub usd_minor: i64,
    /// Units of `currency` per USD; required unless the currency is USD.
    #[serde(default)]
    pub exchange_rate: Option<String>,
    /// E.g. "transfermovil", "enzona", "zelle", "usdt".
    #[serde(default)]
    pub provider: Option<String>,
    /// Transfer or transaction reference.
    #[serde(default)]
    pub external_ref: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteSaleInput {
    pub sale_id: String,
    pub outbox_id: String,
    pub total_minor: i64,
    pub occurred_at: String,
    pub lines: Vec<SaleLineInput>,
    #[serde(default)]
    pub payments: Vec<PaymentInput>,
    /// Older POS builds: one USD cash payment of the total with this ID.
    #[serde(default)]
    pub payment_id: Option<String>,
    /// Gestora who brought the client (cloud people ID); none for a direct sale.
    #[serde(default)]
    pub gestor_id: Option<String>,
    /// Dependienta who served the sale (cloud people ID).
    #[serde(default)]
    pub staff_id: Option<String>,
    /// Cliente anotado al cobrar (opcional): va a la lista de clientes de la web.
    #[serde(default)]
    pub customer_name: Option<String>,
    #[serde(default)]
    pub customer_phone: Option<String>,
    /// Mensajero que se lleva el pedido (cloud people ID, kind messenger); none = se lo lleva el cliente.
    #[serde(default)]
    pub messenger_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeRate {
    pub currency: String,
    pub per_usd: String,
    pub set_at: String,
}

fn invalid<T>(message: impl Into<String>) -> CashResult<T> {
    Err(CashError::Validation(message.into()))
}

fn rail_for(method: &str) -> CashResult<&'static str> {
    match method {
        "cash" => Ok("cash"),
        "transfer" => Ok("transfer"),
        "crypto" => Ok("digital_asset"),
        _ => invalid(format!("Forma de pago desconocida: {method}")),
    }
}

fn clean(value: &Option<String>, max: usize) -> CashResult<Option<String>> {
    match value.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        Some(s) if s.chars().count() > max => invalid("Referencia demasiado larga"),
        other => Ok(other.map(Into::into)),
    }
}

fn parse_rate(rate: &Option<String>) -> CashResult<f64> {
    let parsed = rate
        .as_deref()
        .map(str::trim)
        .and_then(|r| r.parse::<f64>().ok())
        .filter(|r| r.is_finite() && *r > 0.0 && *r <= 1_000_000.0);
    match parsed {
        Some(r) => Ok(r),
        None => invalid("Falta la tasa de cambio de un pago"),
    }
}

struct Payment {
    id: String,
    method: String,
    rail: &'static str,
    currency: String,
    amount_minor: i64,
    usd_minor: i64,
    exchange_rate: Option<String>,
    provider: Option<String>,
    external_ref: Option<String>,
}

fn validate_payments(input: &CompleteSaleInput) -> CashResult<Vec<Payment>> {
    if input.payments.is_empty() {
        let Some(id) = input.payment_id.clone() else {
            return invalid("La venta no tiene pagos");
        };
        return Ok(vec![Payment {
            id,
            method: "cash".into(),
            rail: "cash",
            currency: SALE_CURRENCY.into(),
            amount_minor: input.total_minor,
            usd_minor: input.total_minor,
            exchange_rate: None,
            provider: None,
            external_ref: None,
        }]);
    }
    if input.payments.len() > MAX_PAYMENTS {
        return invalid(format!("Como máximo {MAX_PAYMENTS} formas de pago por venta"));
    }
    let mut payments = Vec::with_capacity(input.payments.len());
    let mut usd_total: i64 = 0;
    for p in &input.payments {
        let method = p.method.trim().to_lowercase();
        let rail = rail_for(&method)?;
        let currency = normalize_currency(&p.currency)?;
        if p.payment_id.trim().is_empty() {
            return invalid("Pago sin identificador");
        }
        if p.amount_minor <= 0 || p.usd_minor <= 0 {
            return invalid("Cada pago debe ser mayor que cero");
        }
        // A USD payment carries a rate only for a surcharge (e.g. Zelle at
        // 1.04: the customer sends 1.04 USD per USD of price, cash never does).
        let has_rate = p.exchange_rate.as_deref().is_some_and(|r| !r.trim().is_empty());
        if currency == SALE_CURRENCY && has_rate && method == "cash" {
            return invalid("El efectivo en USD no lleva recargo");
        }
        let exchange_rate = if currency == SALE_CURRENCY && !has_rate {
            if p.usd_minor != p.amount_minor {
                return invalid("Un pago en USD no puede cambiar de valor");
            }
            None
        } else {
            let rate = parse_rate(&p.exchange_rate)?;
            // The amount must match its USD value at the rate within one USD cent.
            let expected = p.usd_minor as f64 * rate;
            if (p.amount_minor as f64 - expected).abs() > rate.max(1.0) {
                return invalid(format!("El pago en {currency} no coincide con la tasa {rate}"));
            }
            Some(p.exchange_rate.as_deref().unwrap_or_default().trim().to_string())
        };
        usd_total = usd_total
            .checked_add(p.usd_minor)
            .ok_or_else(|| CashError::Validation("Desbordamiento sumando pagos".into()))?;
        payments.push(Payment {
            id: p.payment_id.trim().into(),
            method,
            rail,
            currency,
            amount_minor: p.amount_minor,
            usd_minor: p.usd_minor,
            exchange_rate,
            provider: clean(&p.provider, 40)?.map(|s| s.to_lowercase()),
            external_ref: clean(&p.external_ref, 64)?,
        });
    }
    if usd_total != input.total_minor {
        return invalid(if usd_total < input.total_minor {
            "Los pagos no cubren el total de la venta"
        } else {
            "Los pagos superan el total: registra el efectivo sin el cambio"
        });
    }
    Ok(payments)
}

fn validate_lines(input: &CompleteSaleInput) -> CashResult<()> {
    if input.lines.is_empty() {
        return invalid("La venta no puede estar vacía");
    }
    let mut total: i64 = 0;
    for line in &input.lines {
        if line.quantity <= 0 {
            return invalid("La cantidad debe ser mayor que cero");
        }
        if line.unit_price_minor < 0 {
            return invalid("El precio no puede ser negativo");
        }
        let expected = line
            .unit_price_minor
            .checked_mul(line.quantity)
            .ok_or_else(|| CashError::Validation("Desbordamiento calculando el total de línea".into()))?;
        if expected != line.line_total_minor {
            return invalid("El total de una línea no coincide con precio × cantidad");
        }
        total = total
            .checked_add(line.line_total_minor)
            .ok_or_else(|| CashError::Validation("Desbordamiento calculando el total de venta".into()))?;
    }
    if total != input.total_minor {
        return invalid("El total de la venta no coincide con sus líneas");
    }
    Ok(())
}

/// Records the sale atomically. Returns its cash shift, if any.
pub fn complete_sale(conn: &mut Connection, scope: &ShiftScope, input: &CompleteSaleInput) -> CashResult<Option<String>> {
    validate_lines(input)?;
    let payments = validate_payments(input)?;
    let tx = conn.transaction()?;

    // No se cobra sin existencias verificadas. La comprobación vive en la
    // transacción (no solamente en la pantalla) para impedir ventas inválidas
    // desde clientes viejos, lector de códigos o carritos obsoletos.
    // Se suman líneas del mismo producto para que no se eluda el límite.
    let mut requested: BTreeMap<&str, i64> = BTreeMap::new();
    for line in &input.lines {
        let qty = requested.entry(line.product_id.as_str()).or_insert(0);
        *qty = qty.checked_add(line.quantity)
            .ok_or_else(|| CashError::Validation("Cantidad de producto demasiado grande".into()))?;
    }
    let stock_rows = stock::current_stock(&tx, &scope.business_id, &[])?;
    for (product_id, wanted) in requested {
        let Some(available) = stock_rows.iter().find(|s| s.product_id == product_id) else {
            return invalid("Stock sin verificar: sincroniza o registra el conteo antes de cobrar");
        };
        if wanted > available.quantity {
            return invalid(&format!("Solo quedan {} unidades disponibles de {}", available.quantity.max(0), product_id));
        }
    }

    // The sale and its cash join this device's open shift, one drawer
    // currency per cash payment currency.
    let shift_id = cash_shift::shift_for_sale(&tx, scope, SALE_CURRENCY)?;
    for p in payments.iter().filter(|p| p.rail == "cash") {
        cash_shift::shift_for_sale(&tx, scope, &p.currency)?;
    }

    tx.execute(
        "INSERT INTO local_sales (id,business_id,branch_id,device_id,currency,total_minor,occurred_at,sync_status,shift_id) VALUES (?1,?2,?3,?4,?5,?6,?7,'pending',?8)",
        params![input.sale_id, scope.business_id, scope.branch_id, scope.device_id, SALE_CURRENCY, input.total_minor, input.occurred_at, shift_id],
    )?;

    for line in &input.lines {
        tx.execute(
            "INSERT INTO local_sale_lines (id,sale_id,product_id,quantity,unit_price_minor,line_total_minor) VALUES (?1,?2,?3,?4,?5,?6)",
            params![line.line_id, input.sale_id, line.product_id, line.quantity, line.unit_price_minor, line.line_total_minor],
        )?;
        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at) VALUES (?1,?2,?3,?4,'sale','sale',?5,?6)",
            params![line.movement_id, scope.business_id, line.product_id, -line.quantity, input.sale_id, input.occurred_at],
        )?;
    }

    for p in &payments {
        tx.execute(
            "INSERT INTO local_payments (id,sale_id,method,rail,currency,amount_minor,occurred_at,provider,external_ref,usd_minor,exchange_rate)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![p.id, input.sale_id, p.method, p.rail, p.currency, p.amount_minor, input.occurred_at, p.provider, p.external_ref, p.usd_minor, p.exchange_rate],
        )?;
    }

    let clean = |v: &Option<String>| v.as_deref().map(str::trim).filter(|s| !s.is_empty()).map(str::to_owned);
    let gestor_id = clean(&input.gestor_id);
    let staff_id = clean(&input.staff_id);
    let messenger_id = clean(&input.messenger_id);
    let customer_phone: Option<String> = clean(&input.customer_phone)
        .map(|p| p.chars().filter(char::is_ascii_digit).collect::<String>())
        .filter(|p| (8..=15).contains(&p.len()));
    let customer = customer_phone.map(|phone| serde_json::json!({ "phone": phone, "name": clean(&input.customer_name) }));
    let lines = input
        .lines
        .iter()
        .map(|l| serde_json::json!({
            "product_id": l.product_id,
            "quantity": l.quantity,
            "unit_price_minor": l.unit_price_minor,
            "line_total_minor": l.line_total_minor,
            "extra": l.extra && gestor_id.is_some()
        }))
        .collect::<Vec<_>>();
    let payment_json = payments
        .iter()
        .map(|p| serde_json::json!({
            "payment_id": p.id,
            "method": p.method,
            "rail": p.rail,
            "currency": p.currency,
            "amount_minor": p.amount_minor,
            "usd_minor": p.usd_minor,
            "exchange_rate": p.exchange_rate,
            "provider": p.provider,
            "external_ref": p.external_ref
        }))
        .collect::<Vec<_>>();
    let payment_method = if payments.len() == 1 { payments[0].method.clone() } else { "split".into() };
    let payload = serde_json::json!({
        "contract_version": 1,
        "event_id": input.outbox_id,
        "business_id": scope.business_id,
        "source_system": "nexo-business-pos",
        "source_entity_id": input.sale_id,
        "occurred_at": input.occurred_at,
        "idempotency_key": input.sale_id,
        "payload": {
            "sale_id": input.sale_id,
            "lines": lines,
            "total_minor": input.total_minor,
            "currency": SALE_CURRENCY,
            "payment_method": payment_method,
            "payments": payment_json,
            "shift_id": shift_id,
            "channel": if gestor_id.is_some() { "gestor" } else { "store" },
            "gestor_id": gestor_id,
            "staff_id": staff_id,
            "messenger_id": messenger_id,
            "customer": customer
        }
    })
    .to_string();
    tx.execute(
        "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at) VALUES (?1,?2,?3,'sale.completed','sale',?4,?5,?6)",
        params![input.outbox_id, scope.business_id, scope.device_id, input.sale_id, payload, input.occurred_at],
    )?;
    tx.commit()?;
    Ok(shift_id)
}

/// Replaces the rates in force with the cloud's.
pub fn replace_rates(conn: &mut Connection, business_id: &str, rates: &[ExchangeRate], fetched_at: &str) -> CashResult<()> {
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM local_exchange_rates WHERE business_id=?1", [business_id])?;
    for r in rates {
        let currency = normalize_currency(&r.currency)?;
        parse_rate(&Some(r.per_usd.clone()))?;
        tx.execute(
            "INSERT OR REPLACE INTO local_exchange_rates (business_id,currency,per_usd,set_at,fetched_at) VALUES (?1,?2,?3,?4,?5)",
            params![business_id, currency, r.per_usd.trim(), r.set_at, fetched_at],
        )?;
    }
    tx.commit()?;
    Ok(())
}

pub fn current_rates(conn: &Connection, business_id: &str) -> CashResult<Vec<ExchangeRate>> {
    let mut stmt = conn.prepare(
        "SELECT currency,per_usd,set_at FROM local_exchange_rates WHERE business_id=?1 ORDER BY currency",
    )?;
    let rows = stmt
        .query_map([business_id], |row| Ok(ExchangeRate { currency: row.get(0)?, per_usd: row.get(1)?, set_at: row.get(2)? }))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

