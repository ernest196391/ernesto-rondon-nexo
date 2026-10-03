//! Catalog pull (ADR-001 pull side): products, barcodes and prices that the
//! cloud changed after this device's checkpoint.
//!
//! A page of changes is applied in one transaction together with the new
//! checkpoint, so a crash never skips or half-applies a page and replaying the
//! same page is a no-op. The cloud is the authority for the catalog: an
//! incoming product overwrites the local row with the same ID, prices missing
//! from the change are deactivated, and products are deactivated rather than
//! deleted (sales keep referencing them).

use crate::cash_shift::{normalize_currency, CashError, CashResult};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const CATALOG_STREAM: &str = "catalog";

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogChange {
    pub seq: i64,
    pub product_id: String,
    pub sku: Option<String>,
    pub name: String,
    pub active: bool,
    #[serde(default)]
    pub barcodes: Vec<String>,
    /// Minor units per currency, e.g. {"USD": 12500}.
    #[serde(default)]
    pub prices: BTreeMap<String, i64>,
    pub updated_at: String,
    #[serde(default)]
    pub category: Option<String>,
    /// Product ID of the parent when this item is a variant.
    #[serde(default)]
    pub variant_of: Option<String>,
    #[serde(default)]
    pub variant_label: Option<String>,
    #[serde(default)]
    pub image_url: Option<String>,
}

fn clean(value: &Option<String>) -> Option<&str> {
    value.as_deref().map(str::trim).filter(|s| !s.is_empty())
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub applied: usize,
    pub last_seq: i64,
}

pub fn checkpoint(conn: &Connection, stream: &str) -> CashResult<i64> {
    Ok(conn
        .query_row(
            "SELECT last_seq FROM local_sync_checkpoints WHERE stream=?1",
            [stream],
            |row| row.get(0),
        )
        .optional()?
        .unwrap_or(0))
}

fn validate(change: &CatalogChange) -> CashResult<()> {
    if change.seq <= 0 || change.product_id.trim().is_empty() || change.name.trim().is_empty() {
        return Err(CashError::Validation(format!(
            "Cambio de catálogo inválido (seq {})",
            change.seq
        )));
    }
    for (currency, amount) in &change.prices {
        normalize_currency(currency)?;
        if *amount < 0 {
            return Err(CashError::Validation(format!(
                "Precio negativo para {} en {}",
                change.product_id, currency
            )));
        }
    }
    Ok(())
}

/// Applies the changes newer than the checkpoint, in sequence order.
pub fn apply_catalog_page(
    conn: &mut Connection,
    business_id: &str,
    changes: &[CatalogChange],
    now: &str,
) -> CashResult<ApplyResult> {
    for change in changes {
        validate(change)?;
    }
    let mut ordered: Vec<&CatalogChange> = changes.iter().collect();
    ordered.sort_by_key(|c| c.seq);

    let tx = conn.transaction()?;
    let mut last_seq = checkpoint(&tx, CATALOG_STREAM)?;
    let mut applied = 0;

    for change in ordered {
        if change.seq <= last_seq {
            continue;
        }
        let product_id = change.product_id.trim();
        let sku = change
            .sku
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty());

        // The cloud owns SKUs: a different local product holding this SKU gives it up.
        if let Some(sku) = sku {
            tx.execute(
                "UPDATE local_products SET sku=NULL WHERE business_id=?1 AND sku=?2 AND id<>?3",
                params![business_id, sku, product_id],
            )?;
        }

        tx.execute(
            "INSERT INTO local_products (id,business_id,sku,name,active,version,updated_at,category,variant_of,variant_label,image_url)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)
             ON CONFLICT(id) DO UPDATE SET sku=excluded.sku, name=excluded.name, active=excluded.active,
               version=excluded.version, updated_at=excluded.updated_at, category=excluded.category,
               variant_of=excluded.variant_of, variant_label=excluded.variant_label, image_url=excluded.image_url",
            params![
                product_id,
                business_id,
                sku,
                change.name.trim(),
                change.active as i64,
                change.seq,
                change.updated_at,
                clean(&change.category),
                clean(&change.variant_of),
                clean(&change.variant_label),
                clean(&change.image_url).filter(|u| u.starts_with("https://"))
            ],
        )?;

        let mut currencies = Vec::new();
        for (currency, amount) in &change.prices {
            let currency = normalize_currency(currency)?;
            tx.execute(
                "INSERT INTO local_prices (id,business_id,product_id,currency,amount_minor,active,updated_at)
                 VALUES (?1,?2,?3,?4,?5,1,?6)
                 ON CONFLICT(business_id,product_id,currency) DO UPDATE SET
                   amount_minor=excluded.amount_minor, active=1, updated_at=excluded.updated_at",
                params![
                    format!("price-{product_id}-{currency}"),
                    business_id,
                    product_id,
                    currency,
                    amount,
                    change.updated_at
                ],
            )?;
            currencies.push(currency);
        }
        // Prices the cloud no longer lists stop being sold.
        let mut stmt = tx.prepare(
            "SELECT currency FROM local_prices WHERE business_id=?1 AND product_id=?2 AND active=1",
        )?;
        let active: Vec<String> = stmt
            .query_map(params![business_id, product_id], |row| row.get(0))?
            .collect::<Result<_, _>>()?;
        drop(stmt);
        for currency in active.iter().filter(|c| !currencies.contains(c)) {
            tx.execute(
                "UPDATE local_prices SET active=0, updated_at=?4 WHERE business_id=?1 AND product_id=?2 AND currency=?3",
                params![business_id, product_id, currency, change.updated_at],
            )?;
        }

        for code in change.barcodes.iter().map(|c| c.trim()).filter(|c| !c.is_empty()) {
            tx.execute(
                "INSERT INTO local_barcodes (id,business_id,product_id,code,format)
                 VALUES (?1,?2,?3,?4,NULL)
                 ON CONFLICT(business_id,code) DO UPDATE SET product_id=excluded.product_id",
                params![format!("barcode-{product_id}-{code}"), business_id, product_id, code],
            )?;
        }

        last_seq = change.seq;
        applied += 1;
    }

    tx.execute(
        "INSERT INTO local_sync_checkpoints (stream,last_seq,updated_at) VALUES (?1,?2,?3)
         ON CONFLICT(stream) DO UPDATE SET last_seq=excluded.last_seq, updated_at=excluded.updated_at
         WHERE excluded.last_seq > local_sync_checkpoints.last_seq",
        params![CATALOG_STREAM, last_seq, now],
    )?;
    tx.commit()?;
    Ok(ApplyResult { applied, last_seq })
}
