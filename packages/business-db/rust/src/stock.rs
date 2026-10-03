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
