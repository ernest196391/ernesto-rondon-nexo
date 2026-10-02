//! Cash shift (turno de caja) repository.
//!
//! Every mutation runs in one SQLite transaction that writes the domain rows
//! and their outbox event together. Calls are idempotent by caller-supplied
//! IDs: retrying an open/movement/close with the same ID never duplicates
//! anything. The schema triggers from migration 0004 enforce the append-only
//! rules even if a future caller bypasses this module.

use rusqlite::{params, Connection, OptionalExtension, Transaction};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fmt;

const REASON_MAX_CHARS: usize = 280;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CashError {
    Validation(String),
    Conflict(String),
    NotFound(String),
    Db(String),
}

impl fmt::Display for CashError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CashError::Validation(m)
            | CashError::Conflict(m)
            | CashError::NotFound(m)
            | CashError::Db(m) => f.write_str(m),
        }
    }
}

impl std::error::Error for CashError {}

impl From<rusqlite::Error> for CashError {
    fn from(e: rusqlite::Error) -> Self {
        CashError::Db(e.to_string())
    }
}

pub type CashResult<T> = Result<T, CashError>;

fn invalid<T>(message: &str) -> CashResult<T> {
    Err(CashError::Validation(message.to_string()))
}

/// Business/branch/device that owns the shift. Supplied by the POS shell, not
/// by the UI, so one device can only operate its own drawer.
#[derive(Debug, Clone)]
pub struct ShiftScope {
    pub business_id: String,
    pub branch_id: String,
    pub device_id: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Direction {
    In,
    Out,
}

impl Direction {
    fn as_str(self) -> &'static str {
        match self {
            Direction::In => "in",
            Direction::Out => "out",
        }
    }
}

/// Manual ledger entries an operator can record on an open shift. Opening
/// floats are written only by `open_shift`; POS sale cash is derived from
/// payments and never recorded here.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MovementKind {
    CashIn,
    CashOut,
    Expense,
    Correction,
    OrderCash,
    MessengerReturn,
}

impl MovementKind {
    fn as_str(self) -> &'static str {
        match self {
            MovementKind::CashIn => "cash_in",
            MovementKind::CashOut => "cash_out",
            MovementKind::Expense => "expense",
            MovementKind::Correction => "correction",
            MovementKind::OrderCash => "order_cash",
            MovementKind::MessengerReturn => "messenger_return",
        }
    }

    /// Fixed direction for every kind except corrections.
    fn fixed_direction(self) -> Option<Direction> {
        match self {
            MovementKind::CashIn | MovementKind::OrderCash | MovementKind::MessengerReturn => {
                Some(Direction::In)
            }
            MovementKind::CashOut | MovementKind::Expense => Some(Direction::Out),
            MovementKind::Correction => None,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpeningFloatInput {
    pub movement_id: String,
    pub currency: String,
    pub amount_minor: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenShiftInput {
    pub shift_id: String,
    pub outbox_id: String,
    pub operator_id: Option<String>,
    pub primary_currency: String,
    pub opening_floats: Vec<OpeningFloatInput>,
    pub opened_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordMovementInput {
    pub movement_id: String,
    pub outbox_id: String,
    pub shift_id: String,
    pub kind: MovementKind,
    /// Required for corrections; optional (must match) for other kinds.
    pub direction: Option<Direction>,
    pub currency: String,
    pub amount_minor: i64,
    pub reason: String,
    pub category: Option<String>,
    pub source_type: Option<String>,
    pub source_id: Option<String>,
    pub corrects_movement_id: Option<String>,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CountInput {
    pub count_id: String,
    pub currency: String,
    pub counted_minor: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloseShiftInput {
    pub shift_id: String,
    pub outbox_id: String,
    pub counts: Vec<CountInput>,
    pub closed_by: Option<String>,
    pub note: Option<String>,
    pub closed_at: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrencySummary {
    pub currency: String,
    pub opening_float_minor: i64,
    pub sales_cash_minor: i64,
    pub other_in_minor: i64,
    pub other_out_minor: i64,
    pub expected_minor: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CountResult {
    pub currency: String,
    pub expected_minor: i64,
    pub counted_minor: i64,
    pub difference_minor: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShiftSummary {
    pub shift_id: String,
    pub status: String,
    pub primary_currency: String,
    pub opened_at: String,
    pub closed_at: Option<String>,
    pub currencies: Vec<CurrencySummary>,
    pub counts: Vec<CountResult>,
}

pub fn normalize_currency(raw: &str) -> CashResult<String> {
    let currency = raw.trim().to_uppercase();
    if currency.len() < 3
        || currency.len() > 16
        || !currency.chars().all(|c| c.is_ascii_alphanumeric())
    {
        return invalid("Moneda inválida");
    }
    Ok(currency)
}

fn normalize_reason(raw: &str) -> CashResult<String> {
    let reason = raw.trim();
    if reason.is_empty() {
        return invalid("El motivo es obligatorio");
    }
    if reason.chars().count() > REASON_MAX_CHARS {
        return invalid("El motivo es demasiado largo");
    }
    Ok(reason.to_string())
}

fn require_id(raw: &str, what: &str) -> CashResult<()> {
    if raw.trim().is_empty() {
        return Err(CashError::Validation(format!(
            "Falta el identificador de {what}"
        )));
    }
    Ok(())
}

fn non_empty(value: &Option<String>) -> Option<String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(str::to_string)
}

struct ShiftRow {
    business_id: String,
    branch_id: String,
    device_id: String,
    status: String,
}

fn load_shift(conn: &Connection, shift_id: &str) -> CashResult<Option<ShiftRow>> {
    Ok(conn
        .query_row(
            "SELECT business_id, branch_id, device_id, status FROM local_cash_shifts WHERE id=?1",
            [shift_id],
            |row| {
                Ok(ShiftRow {
                    business_id: row.get(0)?,
                    branch_id: row.get(1)?,
                    device_id: row.get(2)?,
                    status: row.get(3)?,
                })
            },
        )
        .optional()?)
}

fn require_owned_shift(
    conn: &Connection,
    scope: &ShiftScope,
    shift_id: &str,
) -> CashResult<ShiftRow> {
    let shift = load_shift(conn, shift_id)?
        .ok_or_else(|| CashError::NotFound("Turno de caja no encontrado".into()))?;
    if shift.business_id != scope.business_id
        || shift.branch_id != scope.branch_id
        || shift.device_id != scope.device_id
    {
        return Err(CashError::Conflict(
            "El turno pertenece a otro dispositivo o sucursal".into(),
        ));
    }
    Ok(shift)
}

#[allow(clippy::too_many_arguments)]
fn enqueue_outbox(
    tx: &Transaction,
    outbox_id: &str,
    business_id: &str,
    device_id: &str,
    operation_type: &str,
    entity_type: &str,
    entity_id: &str,
    occurred_at: &str,
    payload: serde_json::Value,
) -> CashResult<()> {
    let envelope = serde_json::json!({
        "contract_version": 1,
        "event_id": outbox_id,
        "business_id": business_id,
        "source_system": "nexo-business-pos",
        "source_entity_id": entity_id,
        "occurred_at": occurred_at,
        "idempotency_key": entity_id,
        "payload": payload,
    })
    .to_string();
    tx.execute(
        "INSERT INTO local_outbox (id,business_id,device_id,operation_type,entity_type,entity_id,payload_json,occurred_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![outbox_id, business_id, device_id, operation_type, entity_type, entity_id, envelope, occurred_at],
    )?;
    Ok(())
}

fn track_currency(conn: &Connection, shift_id: &str, currency: &str) -> CashResult<()> {
    conn.execute(
        "INSERT OR IGNORE INTO local_cash_shift_currencies (shift_id, currency) VALUES (?1, ?2)",
        params![shift_id, currency],
    )?;
    Ok(())
}

fn add(a: i64, b: i64) -> CashResult<i64> {
    a.checked_add(b)
        .ok_or_else(|| CashError::Validation("Desbordamiento en importes de caja".into()))
}

/// Per-currency drawer totals for a shift. Expected cash =
/// opening float + POS cash payments + other cash in − cash out.
pub fn currency_totals(
    conn: &Connection,
    shift_id: &str,
) -> CashResult<BTreeMap<String, CurrencySummary>> {
    let mut totals: BTreeMap<String, CurrencySummary> = BTreeMap::new();

    let mut tracked =
        conn.prepare("SELECT currency FROM local_cash_shift_currencies WHERE shift_id=?1")?;
    for currency in tracked.query_map([shift_id], |row| row.get::<_, String>(0))? {
        let currency = currency?;
        totals
            .entry(currency.clone())
            .or_insert_with(|| CurrencySummary {
                currency,
                ..Default::default()
            });
    }

    // Shifts written only by the 0003 draft have no tracked currencies and
    // keep their opening float on the shift row.
    if totals.is_empty() {
        let legacy: Option<(String, i64)> = conn
            .query_row(
                "SELECT currency, opening_float_minor FROM local_cash_shifts WHERE id=?1",
                [shift_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()?;
        if let Some((currency, opening)) = legacy {
            let entry = totals
                .entry(currency.clone())
                .or_insert_with(|| CurrencySummary {
                    currency,
                    ..Default::default()
                });
            entry.opening_float_minor = opening;
        }
    }

    let mut movements = conn.prepare(
        "SELECT COALESCE(m.currency, s.currency), COALESCE(m.kind, ''), m.direction, SUM(m.amount_minor)
         FROM local_cash_movements m JOIN local_cash_shifts s ON s.id = m.shift_id
         WHERE m.shift_id=?1
         GROUP BY 1, 2, 3",
    )?;
    let rows = movements.query_map([shift_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, i64>(3)?,
        ))
    })?;
    for row in rows {
        let (currency, kind, direction, amount) = row?;
        let entry = totals
            .entry(currency.clone())
            .or_insert_with(|| CurrencySummary {
                currency,
                ..Default::default()
            });
        if kind == "opening_float" {
            entry.opening_float_minor = add(entry.opening_float_minor, amount)?;
        } else if direction == "in" {
            entry.other_in_minor = add(entry.other_in_minor, amount)?;
        } else {
            entry.other_out_minor = add(entry.other_out_minor, amount)?;
        }
    }

    let mut sales = conn.prepare(
        "SELECT p.currency, SUM(p.amount_minor)
         FROM local_payments p JOIN local_sales s ON s.id = p.sale_id
         WHERE s.shift_id=?1 AND p.method='cash'
         GROUP BY p.currency",
    )?;
    let rows = sales.query_map([shift_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    for row in rows {
        let (currency, amount) = row?;
        let entry = totals
            .entry(currency.clone())
            .or_insert_with(|| CurrencySummary {
                currency,
                ..Default::default()
            });
        entry.sales_cash_minor = add(entry.sales_cash_minor, amount)?;
    }

    for entry in totals.values_mut() {
        let inflow = add(
            add(entry.opening_float_minor, entry.sales_cash_minor)?,
            entry.other_in_minor,
        )?;
        entry.expected_minor = inflow
            .checked_sub(entry.other_out_minor)
            .ok_or_else(|| CashError::Validation("Desbordamiento en importes de caja".into()))?;
    }
    Ok(totals)
}

pub fn shift_summary(conn: &Connection, shift_id: &str) -> CashResult<ShiftSummary> {
    let (status, primary_currency, opened_at, closed_at): (String, String, String, Option<String>) =
        conn.query_row(
            "SELECT status, currency, opened_at, closed_at FROM local_cash_shifts WHERE id=?1",
            [shift_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()?
        .ok_or_else(|| CashError::NotFound("Turno de caja no encontrado".into()))?;

    let mut stmt = conn.prepare(
        "SELECT currency, expected_minor, counted_minor, difference_minor FROM local_cash_shift_counts WHERE shift_id=?1 ORDER BY currency",
    )?;
    let counts = stmt
        .query_map([shift_id], |row| {
            Ok(CountResult {
                currency: row.get(0)?,
                expected_minor: row.get(1)?,
                counted_minor: row.get(2)?,
                difference_minor: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(ShiftSummary {
        shift_id: shift_id.to_string(),
        status,
        primary_currency,
        opened_at,
        closed_at,
        currencies: currency_totals(conn, shift_id)?.into_values().collect(),
        counts,
    })
}

pub fn current_open_shift(conn: &Connection, scope: &ShiftScope) -> CashResult<Option<String>> {
    Ok(conn
        .query_row(
            "SELECT id FROM local_cash_shifts WHERE business_id=?1 AND branch_id=?2 AND device_id=?3 AND status='open'",
            params![scope.business_id, scope.branch_id, scope.device_id],
            |row| row.get(0),
        )
        .optional()?)
}

pub fn open_shift(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &OpenShiftInput,
) -> CashResult<ShiftSummary> {
    require_id(&input.shift_id, "turno")?;
    require_id(&input.outbox_id, "evento")?;
    let primary_currency = normalize_currency(&input.primary_currency)?;

    let mut floats: BTreeMap<String, (&str, i64)> = BTreeMap::new();
    for float in &input.opening_floats {
        require_id(&float.movement_id, "fondo inicial")?;
        if float.amount_minor < 0 {
            return invalid("El fondo inicial no puede ser negativo");
        }
        let currency = normalize_currency(&float.currency)?;
        if floats
            .insert(currency, (float.movement_id.as_str(), float.amount_minor))
            .is_some()
        {
            return invalid("Moneda repetida en el fondo inicial");
        }
    }

    let tx = conn.transaction()?;

    if load_shift(&tx, &input.shift_id)?.is_some() {
        // Retry of an open that already committed: same result, no new rows.
        require_owned_shift(&tx, scope, &input.shift_id)?;
        drop(tx);
        return shift_summary(conn, &input.shift_id);
    }

    if current_open_shift(&tx, scope)?.is_some() {
        return Err(CashError::Conflict(
            "Ya hay un turno de caja abierto en este dispositivo".into(),
        ));
    }

    let primary_float = floats
        .get(&primary_currency)
        .map(|(_, amount)| *amount)
        .unwrap_or(0);
    let operator = non_empty(&input.operator_id);

    tx.execute(
        "INSERT INTO local_cash_shifts (id,business_id,branch_id,device_id,currency,opening_float_minor,status,opened_at,opened_by,sync_status)
         VALUES (?1,?2,?3,?4,?5,?6,'open',?7,?8,'pending')",
        params![
            input.shift_id,
            scope.business_id,
            scope.branch_id,
            scope.device_id,
            primary_currency,
            primary_float,
            input.opened_at,
            operator
        ],
    )?;

    track_currency(&tx, &input.shift_id, &primary_currency)?;
    let mut floats_payload = Vec::new();
    for (currency, (movement_id, amount)) in &floats {
        track_currency(&tx, &input.shift_id, currency)?;
        floats_payload.push(serde_json::json!({ "currency": currency, "amount_minor": amount }));
        if *amount > 0 {
            tx.execute(
                "INSERT INTO local_cash_movements (id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind,operator_id)
                 VALUES (?1,?2,?3,?4,?5,'in',?6,'Fondo inicial',?7,?8,'opening_float',?9)",
                params![
                    movement_id,
                    input.shift_id,
                    scope.business_id,
                    scope.branch_id,
                    scope.device_id,
                    amount,
                    input.opened_at,
                    currency,
                    operator
                ],
            )?;
        }
    }

    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "cash_shift.opened",
        "cash_shift",
        &input.shift_id,
        &input.opened_at,
        serde_json::json!({
            "shift_id": input.shift_id,
            "branch_id": scope.branch_id,
            "device_id": scope.device_id,
            "operator_id": operator,
            "primary_currency": primary_currency,
            "opening_floats": floats_payload,
        }),
    )?;

    tx.commit()?;
    shift_summary(conn, &input.shift_id)
}

pub fn record_movement(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &RecordMovementInput,
) -> CashResult<ShiftSummary> {
    require_id(&input.movement_id, "movimiento")?;
    require_id(&input.outbox_id, "evento")?;
    if input.amount_minor <= 0 {
        return invalid("El importe debe ser mayor que cero");
    }
    let currency = normalize_currency(&input.currency)?;
    let reason = normalize_reason(&input.reason)?;

    let direction = match (input.kind.fixed_direction(), input.direction) {
        (Some(fixed), None) => fixed,
        (Some(fixed), Some(given)) if fixed == given => fixed,
        (Some(_), Some(_)) => return invalid("La dirección no corresponde al tipo de movimiento"),
        (None, Some(given)) => given,
        (None, None) => return invalid("Una corrección debe indicar entrada o salida"),
    };
    let corrects = non_empty(&input.corrects_movement_id);
    match (input.kind, &corrects) {
        (MovementKind::Correction, None) => {
            return invalid("Una corrección debe indicar el movimiento que corrige")
        }
        (MovementKind::Correction, Some(_)) => {}
        (_, Some(_)) => return invalid("Solo una corrección puede referenciar otro movimiento"),
        (_, None) => {}
    }

    let tx = conn.transaction()?;
    let shift = require_owned_shift(&tx, scope, &input.shift_id)?;

    let existing: Option<String> = tx
        .query_row(
            "SELECT shift_id FROM local_cash_movements WHERE id=?1",
            [&input.movement_id],
            |row| row.get(0),
        )
        .optional()?;
    if let Some(existing_shift) = existing {
        if existing_shift != input.shift_id {
            return Err(CashError::Conflict(
                "El identificador de movimiento ya existe en otro turno".into(),
            ));
        }
        drop(tx);
        return shift_summary(conn, &input.shift_id);
    }

    if shift.status != "open" {
        return Err(CashError::Conflict("El turno de caja está cerrado".into()));
    }

    if let Some(target) = &corrects {
        let target_shift: Option<String> = tx
            .query_row(
                "SELECT shift_id FROM local_cash_movements WHERE id=?1",
                [target],
                |row| row.get(0),
            )
            .optional()?;
        if target_shift.as_deref() != Some(input.shift_id.as_str()) {
            return invalid("La corrección debe referenciar un movimiento de este turno");
        }
    }

    if direction == Direction::Out {
        let available = currency_totals(&tx, &input.shift_id)?
            .get(&currency)
            .map(|c| c.expected_minor)
            .unwrap_or(0);
        if input.amount_minor > available {
            return invalid("La salida supera el efectivo esperado en caja para esa moneda");
        }
    }

    track_currency(&tx, &input.shift_id, &currency)?;
    let category = non_empty(&input.category);
    let source_type = non_empty(&input.source_type);
    let source_id = non_empty(&input.source_id);
    let operator = non_empty(&input.operator_id);

    tx.execute(
        "INSERT INTO local_cash_movements (id,shift_id,business_id,branch_id,device_id,direction,amount_minor,reason,occurred_at,currency,kind,category,source_type,source_id,operator_id,corrects_movement_id)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)",
        params![
            input.movement_id,
            input.shift_id,
            shift.business_id,
            shift.branch_id,
            shift.device_id,
            direction.as_str(),
            input.amount_minor,
            reason,
            input.occurred_at,
            currency,
            input.kind.as_str(),
            category,
            source_type,
            source_id,
            operator,
            corrects
        ],
    )?;

    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &shift.business_id,
        &shift.device_id,
        "cash_movement.recorded",
        "cash_movement",
        &input.movement_id,
        &input.occurred_at,
        serde_json::json!({
            "movement_id": input.movement_id,
            "shift_id": input.shift_id,
            "kind": input.kind.as_str(),
            "direction": direction.as_str(),
            "currency": currency,
            "amount_minor": input.amount_minor,
            "reason": reason,
            "category": category,
            "source_type": source_type,
            "source_id": source_id,
            "operator_id": operator,
            "corrects_movement_id": corrects,
        }),
    )?;

    tx.commit()?;
    shift_summary(conn, &input.shift_id)
}

pub fn close_shift(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &CloseShiftInput,
) -> CashResult<ShiftSummary> {
    require_id(&input.outbox_id, "evento")?;
    let mut counted: BTreeMap<String, (&str, i64)> = BTreeMap::new();
    for count in &input.counts {
        require_id(&count.count_id, "conteo")?;
        if count.counted_minor < 0 {
            return invalid("El efectivo contado no puede ser negativo");
        }
        let currency = normalize_currency(&count.currency)?;
        if counted
            .insert(currency, (count.count_id.as_str(), count.counted_minor))
            .is_some()
        {
            return invalid("Moneda repetida en el conteo");
        }
    }

    let tx = conn.transaction()?;
    let shift = require_owned_shift(&tx, scope, &input.shift_id)?;

    if shift.status == "closed" {
        // Idempotent retry: accept only if it carries the same counts.
        let summary = shift_summary(&tx, &input.shift_id)?;
        let same = summary.counts.len() == counted.len()
            && summary
                .counts
                .iter()
                .all(|c| counted.get(&c.currency).map(|(_, v)| *v) == Some(c.counted_minor));
        if same {
            return Ok(summary);
        }
        return Err(CashError::Conflict(
            "El turno de caja ya está cerrado".into(),
        ));
    }

    let mut totals = currency_totals(&tx, &input.shift_id)?;
    // Currencies that only appear through POS sales still have to be counted.
    for currency in totals.keys() {
        track_currency(&tx, &input.shift_id, currency)?;
    }
    for currency in totals.keys() {
        if !counted.contains_key(currency) {
            return Err(CashError::Validation(format!(
                "Falta el conteo de {currency}"
            )));
        }
    }

    let primary_currency: String = tx.query_row(
        "SELECT currency FROM local_cash_shifts WHERE id=?1",
        [&input.shift_id],
        |row| row.get(0),
    )?;

    let mut results = Vec::new();
    for (currency, (count_id, counted_minor)) in &counted {
        let expected = totals
            .entry(currency.clone())
            .or_insert_with(|| CurrencySummary {
                currency: currency.clone(),
                ..Default::default()
            })
            .expected_minor;
        track_currency(&tx, &input.shift_id, currency)?;
        let difference = counted_minor
            .checked_sub(expected)
            .ok_or_else(|| CashError::Validation("Desbordamiento en importes de caja".into()))?;
        tx.execute(
            "INSERT INTO local_cash_shift_counts (id,shift_id,currency,expected_minor,counted_minor,difference_minor,counted_at,counted_by)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                count_id,
                input.shift_id,
                currency,
                expected,
                counted_minor,
                difference,
                input.closed_at,
                non_empty(&input.closed_by)
            ],
        )?;
        results.push(CountResult {
            currency: currency.clone(),
            expected_minor: expected,
            counted_minor: *counted_minor,
            difference_minor: difference,
        });
    }

    let primary = results
        .iter()
        .find(|r| r.currency == primary_currency)
        .cloned()
        .unwrap_or(CountResult {
            currency: primary_currency,
            expected_minor: 0,
            counted_minor: 0,
            difference_minor: 0,
        });

    tx.execute(
        "UPDATE local_cash_shifts
         SET status='closed', closed_at=?2, closed_by=?3, close_note=?4,
             expected_cash_minor=?5, counted_cash_minor=?6, difference_minor=?7
         WHERE id=?1 AND status='open'",
        params![
            input.shift_id,
            input.closed_at,
            non_empty(&input.closed_by),
            non_empty(&input.note),
            primary.expected_minor,
            primary.counted_minor,
            primary.difference_minor
        ],
    )?;

    let counts_payload: Vec<_> = results
        .iter()
        .map(|r| {
            serde_json::json!({
                "currency": r.currency,
                "expected_minor": r.expected_minor,
                "counted_minor": r.counted_minor,
                "difference_minor": r.difference_minor,
            })
        })
        .collect();

    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &shift.business_id,
        &shift.device_id,
        "cash_shift.closed",
        "cash_shift",
        &input.shift_id,
        &input.closed_at,
        serde_json::json!({
            "shift_id": input.shift_id,
            "closed_by": non_empty(&input.closed_by),
            "note": non_empty(&input.note),
            "counts": counts_payload,
        }),
    )?;

    tx.commit()?;
    shift_summary(conn, &input.shift_id)
}

/// Used inside the sale transaction: returns the device's open shift (if the
/// cash ledger schema exists and a shift is open) and marks the sale currency
/// as tracked so it must be counted at close. A sale without an open shift is
/// still valid and keeps the pre-shift behavior.
pub fn shift_for_sale(
    conn: &Connection,
    scope: &ShiftScope,
    currency: &str,
) -> CashResult<Option<String>> {
    if !crate::cash_ledger_ready(conn)? {
        return Ok(None);
    }
    let shift_id = current_open_shift(conn, scope)?;
    if let Some(id) = &shift_id {
        track_currency(conn, id, &normalize_currency(currency)?)?;
    }
    Ok(shift_id)
}
