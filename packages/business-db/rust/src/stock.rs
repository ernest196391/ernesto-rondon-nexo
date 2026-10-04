//! Cloud stock on the POS ("Quedan N" and low-stock warnings).
//!
//! The cloud derives stock from every device's synced events. The POS keeps
//! the latest snapshot and subtracts its own sales the snapshot cannot
//! include yet: those not synced, or synced after the snapshot was taken.

use crate::cash_shift::CashResult;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

/// Warn when a product reaches this many units unless it has its own minimum.
pub const DEFAULT_LOW_STOCK: i64 = 2;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudStock {
    pub product_id: String,
    pub quantity: i64,
    #[serde(default)]
    pub min_stock: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductStock {
    pub product_id: String,
    pub quantity: i64,
    pub low_at: i64,
}

/// Replaces the snapshot with the cloud's answer (one transaction).
pub fn replace_snapshot(conn: &mut Connection, business_id: &str, items: &[CloudStock], fetched_at: &str) -> CashResult<usize> {
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM local_stock_snapshot WHERE business_id=?1", [business_id])?;
    for item in items {
        let product_id = item.product_id.trim();
        if product_id.is_empty() {
            continue;
        }
        tx.execute(
            "INSERT OR REPLACE INTO local_stock_snapshot (business_id,product_id,quantity,min_stock,fetched_at) VALUES (?1,?2,?3,?4,?5)",
            params![business_id, product_id, item.quantity, item.min_stock.filter(|m| *m >= 0), fetched_at],
        )?;
    }
    tx.commit()?;
    Ok(items.len())
}

/// Current stock of tracked products (all of them when `product_ids` is empty).
pub fn current_stock(conn: &Connection, business_id: &str, product_ids: &[String]) -> CashResult<Vec<ProductStock>> {
    let mut stmt = conn.prepare(
        "SELECT s.product_id,
                s.quantity - COALESCE((
                  SELECT SUM(l.quantity) FROM local_sale_lines l
                  JOIN local_sales sa ON sa.id = l.sale_id AND sa.business_id = s.business_id
                  LEFT JOIN local_outbox o ON o.entity_type = 'sale' AND o.entity_id = sa.id
                  WHERE l.product_id = s.product_id
                    AND (o.id IS NULL OR o.synced_at IS NULL OR o.synced_at > s.fetched_at)
                ), 0),
                COALESCE(s.min_stock, ?2)
         FROM local_stock_snapshot s
         WHERE s.business_id = ?1
         ORDER BY s.product_id",
    )?;
    let rows = stmt
        .query_map(params![business_id, DEFAULT_LOW_STOCK], |row| {
            Ok(ProductStock { product_id: row.get(0)?, quantity: row.get(1)?, low_at: row.get(2)? })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(if product_ids.is_empty() {
        rows
    } else {
        rows.into_iter().filter(|r| product_ids.contains(&r.product_id)).collect()
    })
}

/// Brings this device's default location (the store) in line with the cloud.
///
/// Business stock is what the cloud derives from every device and the
/// website import; a device only sees its own movements. After each stock
/// pull, the store gets a local-only adjustment so that store + other local
/// locations = cloud stock. These movements never go to the outbox, so the
/// cloud is never counted twice; later counts and transfers on this device
/// start from the real quantity.
pub fn align_default_location(conn: &mut Connection, business_id: &str, now: &str) -> CashResult<usize> {
    let default: Option<String> = conn
        .query_row(
            "SELECT id FROM local_locations WHERE business_id=?1 AND is_default=1 AND active=1",
            [business_id],
            |r| r.get(0),
        )
        .ok();
    let Some(store) = default else { return Ok(0) };
    let current = current_stock(conn, business_id, &[])?;
    let tx = conn.transaction()?;
    let mut adjusted = 0;
    for s in current {
        let known: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM local_products WHERE id=?1 AND business_id=?2)",
            params![s.product_id, business_id],
            |r| r.get(0),
        )?;
        if !known {
            continue;
        }
        let (here, elsewhere): (i64, i64) = tx.query_row(
            "SELECT COALESCE(SUM(CASE WHEN location_id=?3 THEN quantity END),0), COALESCE(SUM(CASE WHEN location_id<>?3 THEN quantity END),0)
             FROM local_stock_by_location WHERE business_id=?1 AND product_id=?2",
            params![business_id, s.product_id, store],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        let delta = s.quantity - elsewhere - here;
        if delta == 0 {
            continue;
        }
        tx.execute(
            "INSERT INTO local_inventory_movements (id,business_id,product_id,quantity_delta,reason,source_type,source_id,occurred_at,location_id)
             VALUES (?1,?2,?3,?4,'cloud_alignment','cloud_stock',NULL,?5,?6)",
            params![format!("align-{now}-{}", s.product_id), business_id, s.product_id, delta, now, store],
        )?;
        adjusted += 1;
    }
    tx.commit()?;
    Ok(adjusted)
}
