//! Location-based inventory (inventario por ubicación).
//!
//! Stock is derived from append-only movements per location and product and is
//! never overwritten. Transfers write a paired decrease/increase in one
//! transaction; physical counts store expected/counted/difference and write one
//! reconciliation movement when they differ. Movements without a location
//! (legacy rows, POS sales today) belong to the business's default location.
//! Every write is idempotent by caller-supplied IDs and enqueues its outbox
//! event in the same transaction.

use crate::cash_shift::{
    enqueue_outbox, non_empty, normalize_reason, require_id, CashError, CashResult, ShiftScope,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LocationKind {
    Warehouse,
    Store,
    Branch,
    Transit,
    Consignment,
    Damaged,
}

impl LocationKind {
    fn as_str(self) -> &'static str {
        match self {
            LocationKind::Warehouse => "warehouse",
            LocationKind::Store => "store",
            LocationKind::Branch => "branch",
            LocationKind::Transit => "transit",
            LocationKind::Consignment => "consignment",
            LocationKind::Damaged => "damaged",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLocationInput {
    pub location_id: String,
    pub outbox_id: String,
    pub name: String,
    pub kind: LocationKind,
    pub branch_id: Option<String>,
    #[serde(default)]
    pub is_default: bool,
    /// System that owns stock truth here; "nexo" when omitted.
    pub authority_system: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub location_id: String,
    pub name: String,
    pub kind: String,
    pub branch_id: Option<String>,
    pub is_default: bool,
    pub authority_system: String,
    pub active: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferInput {
    pub transfer_id: String,
    pub outbox_id: String,
    pub out_movement_id: String,
    pub in_movement_id: String,
    pub product_id: String,
    pub from_location_id: String,
    pub to_location_id: String,
    pub quantity: i64,
    pub reason: String,
    pub operator_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CountInput {
    pub count_id: String,
    pub outbox_id: String,
    /// Used only when the count differs from the expected stock.
    pub adjustment_movement_id: String,
    pub location_id: String,
    pub product_id: String,
    pub counted_quantity: i64,
    pub reason: String,
    pub operator_id: Option<String>,
    pub counted_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockLine {
    pub location_id: String,
    pub product_id: String,
    pub quantity: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CountResult {
    pub count_id: String,
    pub location_id: String,
    pub product_id: String,
    pub expected_quantity: i64,
    pub counted_quantity: i64,
    pub difference_quantity: i64,
}

fn location_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Location> {
    Ok(Location {
        location_id: row.get(0)?,
        name: row.get(1)?,
        kind: row.get(2)?,
        branch_id: row.get(3)?,
        is_default: row.get::<_, i64>(4)? == 1,
        authority_system: row.get(5)?,
        active: row.get::<_, i64>(6)? == 1,
    })
}

const LOCATION_COLUMNS: &str = "id, name, kind, branch_id, is_default, authority_system, active";

pub fn list_locations(conn: &Connection, business_id: &str) -> CashResult<Vec<Location>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {LOCATION_COLUMNS} FROM local_locations WHERE business_id=?1 ORDER BY is_default DESC, name"
    ))?;
    let rows = stmt
        .query_map([business_id], location_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

fn load_location(conn: &Connection, business_id: &str, location_id: &str) -> CashResult<Location> {
    conn.query_row(
        &format!("SELECT {LOCATION_COLUMNS} FROM local_locations WHERE id=?1 AND business_id=?2"),
        params![location_id, business_id],
        location_row,
    )
    .optional()?
    .ok_or_else(|| CashError::NotFound("Ubicación no encontrada".into()))
}

/// Current stock of one product at one location (default location includes
/// movements without a location).
pub fn stock_at(
    conn: &Connection,
    business_id: &str,
    location_id: &str,
    product_id: &str,
) -> CashResult<i64> {
    Ok(conn.query_row(
        "SELECT COALESCE(SUM(quantity),0) FROM local_stock_by_location WHERE business_id=?1 AND location_id=?2 AND product_id=?3",
        params![business_id, location_id, product_id],
        |row| row.get(0),
    )?)
}

pub fn location_stock(
    conn: &Connection,
    business_id: &str,
    location_id: &str,
) -> CashResult<Vec<StockLine>> {
    let mut stmt = conn.prepare(
        "SELECT location_id, product_id, quantity FROM local_stock_by_location
         WHERE business_id=?1 AND location_id=?2 ORDER BY product_id",
    )?;
    let rows = stmt
        .query_map(params![business_id, location_id], |row| {
            Ok(StockLine {
                location_id: row.get(0)?,
                product_id: row.get(1)?,
                quantity: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

fn require_product(conn: &Connection, business_id: &str, product_id: &str) -> CashResult<()> {
    let found: Option<i64> = conn
        .query_row(
            "SELECT 1 FROM local_products WHERE id=?1 AND business_id=?2",
            params![product_id, business_id],
            |row| row.get(0),
        )
        .optional()?;
    found
        .map(|_| ())
        .ok_or_else(|| CashError::NotFound("Producto no encontrado".into()))
}

pub fn create_location(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &CreateLocationInput,
) -> CashResult<Location> {
    require_id(&input.location_id, "ubicación")?;
    require_id(&input.outbox_id, "evento")?;
    let name = input.name.trim();
    if name.is_empty() {
        return Err(CashError::Validation("La ubicación necesita un nombre".into()));
    }
    let authority = non_empty(&input.authority_system)
        .map(|s| s.to_lowercase())
        .unwrap_or_else(|| "nexo".into());
    let branch = non_empty(&input.branch_id);

    let tx = conn.transaction()?;
    let existing: Option<String> = tx
        .query_row(
            "SELECT business_id FROM local_locations WHERE id=?1",
            [&input.location_id],
            |row| row.get(0),
        )
        .optional()?;
    if let Some(business) = existing {
        if business != scope.business_id {
            return Err(CashError::Conflict("La ubicación pertenece a otro negocio".into()));
        }
        drop(tx);
        return load_location(conn, &scope.business_id, &input.location_id);
    }
    let same_name: Option<String> = tx
        .query_row(
            "SELECT id FROM local_locations WHERE business_id=?1 AND name=?2",
            params![scope.business_id, name],
            |row| row.get(0),
        )
        .optional()?;
    if same_name.is_some() {
        return Err(CashError::Conflict("Ya existe una ubicación con ese nombre".into()));
    }
    if input.is_default
        && tx
            .query_row(
                "SELECT 1 FROM local_locations WHERE business_id=?1 AND is_default=1",
                [&scope.business_id],
                |_| Ok(()),
            )
            .optional()?
            .is_some()
    {
        return Err(CashError::Conflict("El negocio ya tiene una ubicación principal".into()));
    }

    tx.execute(
        "INSERT INTO local_locations (id,business_id,branch_id,name,kind,is_default,authority_system,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![
            input.location_id,
            scope.business_id,
            branch,
            name,
            input.kind.as_str(),
            input.is_default as i64,
            authority,
            input.created_at
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "location.created",
        "location",
        &input.location_id,
        &input.created_at,
        serde_json::json!({
            "location_id": input.location_id,
            "name": name,
            "kind": input.kind.as_str(),
            "branch_id": branch,
            "is_default": input.is_default,
            "authority_system": authority,
        }),
    )?;
    tx.commit()?;
    load_location(conn, &scope.business_id, &input.location_id)
}

pub fn transfer_stock(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &TransferInput,
) -> CashResult<Vec<StockLine>> {
    require_id(&input.transfer_id, "transferencia")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.out_movement_id, "movimiento de salida")?;
    require_id(&input.in_movement_id, "movimiento de entrada")?;
    if input.out_movement_id == input.in_movement_id {
        return Err(CashError::Validation("Los dos movimientos necesitan identificadores distintos".into()));
    }
    if input.quantity <= 0 {
        return Err(CashError::Validation("La cantidad debe ser mayor que cero".into()));
    }
    if input.from_location_id == input.to_location_id {
        return Err(CashError::Validation("El origen y el destino deben ser distintos".into()));
    }
    let reason = normalize_reason(&input.reason)?;

    let tx = conn.transaction()?;
    let summary = |conn: &Connection| -> CashResult<Vec<StockLine>> {
        Ok(vec![
            StockLine {
                location_id: input.from_location_id.clone(),
                product_id: input.product_id.clone(),
                quantity: stock_at(conn, &scope.business_id, &input.from_location_id, &input.product_id)?,
            },
            StockLine {
                location_id: input.to_location_id.clone(),
                product_id: input.product_id.clone(),
                quantity: stock_at(conn, &scope.business_id, &input.to_location_id, &input.product_id)?,
            },
        ])
    };

    if tx
        .query_row(
            "SELECT 1 FROM local_inventory_transfers WHERE id=?1 AND business_id=?2",
            params![input.transfer_id, scope.business_id],
            |_| Ok(()),
        )
        .optional()?
        .is_some()
    {
        return summary(&tx);
    }

    let from = load_location(&tx, &scope.business_id, &input.from_location_id)?;
    let to = load_location(&tx, &scope.business_id, &input.to_location_id)?;
    if !from.active || !to.active {
        return Err(CashError::Conflict("La ubicación está desactivada".into()));
    }
    require_product(&tx, &scope.business_id, &input.product_id)?;
    let available = stock_at(&tx, &scope.business_id, &from.location_id, &input.product_id)?;
    if input.quantity > available {
        return Err(CashError::Validation(
            "La transferencia supera el stock disponible en el origen".into(),
        ));
    }

    let operator = non_empty(&input.operator_id);
    tx.execute(
        "INSERT INTO local_inventory_transfers (id,business_id,product_id,from_location_id,to_location_id,quantity,reason,operator_id,occurred_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![
            input.transfer_id,
            scope.business_id,
            input.product_id,
            from.location_id,
            to.location_id,
            input.quantity,
            reason,
            operator,
            input.occurred_at
        ],
    )?;
    for (movement_id, location_id, delta) in [
        (&input.out_movement_id, &from.location_id, -input.quantity),
        (&input.in_movement_id, &to.location_id, input.quantity),
    ] {
        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at,location_id,operator_id,transfer_id)
             VALUES (?1,?2,?3,?4,'transfer','transfer',?5,?6,?7,?8,?5)",
            params![
                movement_id,
                scope.business_id,
                input.product_id,
                delta,
                input.transfer_id,
                input.occurred_at,
                location_id,
                operator
            ],
        )?;
    }
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "inventory.transferred",
        "inventory_transfer",
        &input.transfer_id,
        &input.occurred_at,
        serde_json::json!({
            "transfer_id": input.transfer_id,
            "product_id": input.product_id,
            "from_location_id": from.location_id,
            "to_location_id": to.location_id,
            "quantity": input.quantity,
            "reason": reason,
            "operator_id": operator,
        }),
    )?;
    let result = summary(&tx)?;
    tx.commit()?;
    Ok(result)
}

pub fn record_count(
    conn: &mut Connection,
    scope: &ShiftScope,
    input: &CountInput,
) -> CashResult<CountResult> {
    require_id(&input.count_id, "conteo")?;
    require_id(&input.outbox_id, "evento")?;
    require_id(&input.adjustment_movement_id, "movimiento de ajuste")?;
    if input.counted_quantity < 0 {
        return Err(CashError::Validation("La cantidad contada no puede ser negativa".into()));
    }
    let reason = normalize_reason(&input.reason)?;

    let tx = conn.transaction()?;
    let existing = tx
        .query_row(
            "SELECT id, location_id, product_id, expected_quantity, counted_quantity, difference_quantity
             FROM local_inventory_counts WHERE id=?1 AND business_id=?2",
            params![input.count_id, scope.business_id],
            |row| {
                Ok(CountResult {
                    count_id: row.get(0)?,
                    location_id: row.get(1)?,
                    product_id: row.get(2)?,
                    expected_quantity: row.get(3)?,
                    counted_quantity: row.get(4)?,
                    difference_quantity: row.get(5)?,
                })
            },
        )
        .optional()?;
    if let Some(existing) = existing {
        return Ok(existing);
    }

    let location = load_location(&tx, &scope.business_id, &input.location_id)?;
    require_product(&tx, &scope.business_id, &input.product_id)?;
    let expected = stock_at(&tx, &scope.business_id, &location.location_id, &input.product_id)?;
    let difference = input
        .counted_quantity
        .checked_sub(expected)
        .ok_or_else(|| CashError::Validation("Desbordamiento en el conteo".into()))?;
    let operator = non_empty(&input.operator_id);

    let adjustment = if difference != 0 {
        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at,location_id,operator_id)
             VALUES (?1,?2,?3,?4,'count_adjustment','inventory_count',?5,?6,?7,?8)",
            params![
                input.adjustment_movement_id,
                scope.business_id,
                input.product_id,
                difference,
                input.count_id,
                input.counted_at,
                location.location_id,
                operator
            ],
        )?;
        Some(input.adjustment_movement_id.as_str())
    } else {
        None
    };
    tx.execute(
        "INSERT INTO local_inventory_counts (id,business_id,location_id,product_id,expected_quantity,counted_quantity,difference_quantity,adjustment_movement_id,reason,operator_id,counted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        params![
            input.count_id,
            scope.business_id,
            location.location_id,
            input.product_id,
            expected,
            input.counted_quantity,
            difference,
            adjustment,
            reason,
            operator,
            input.counted_at
        ],
    )?;
    enqueue_outbox(
        &tx,
        &input.outbox_id,
        &scope.business_id,
        &scope.device_id,
        "inventory.counted",
        "inventory_count",
        &input.count_id,
        &input.counted_at,
        serde_json::json!({
            "count_id": input.count_id,
            "location_id": location.location_id,
            "product_id": input.product_id,
            "expected_quantity": expected,
            "counted_quantity": input.counted_quantity,
            "difference_quantity": difference,
            "reason": reason,
            "operator_id": operator,
        }),
    )?;
    tx.commit()?;
    Ok(CountResult {
        count_id: input.count_id.clone(),
        location_id: location.location_id,
        product_id: input.product_id.clone(),
        expected_quantity: expected,
        counted_quantity: input.counted_quantity,
        difference_quantity: difference,
    })
}
