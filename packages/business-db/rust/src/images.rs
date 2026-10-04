//! Offline product photos: thumbnail bytes cached by URL.

use crate::cash_shift::{CashError, CashResult};
use rusqlite::{params, Connection};

/// Thumbnails are ~10 KB; anything far larger is not a thumbnail.
pub const MAX_IMAGE_BYTES: usize = 400 * 1024;

/// Photo URLs of active products (or any URL) not cached yet.
pub fn missing_urls(conn: &Connection, business_id: &str, limit: i64) -> CashResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT p.image_url FROM local_products p
         LEFT JOIN local_image_cache c ON c.url = p.image_url
         WHERE p.business_id=?1 AND p.active=1 AND p.image_url LIKE 'https://%' AND c.url IS NULL
         LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![business_id, limit], |r| r.get(0))?.collect::<Result<Vec<String>, _>>()?;
    Ok(rows)
}

pub fn store(conn: &Connection, url: &str, content_type: &str, bytes: &[u8], now: &str) -> CashResult<()> {
    if !url.starts_with("https://") {
        return Err(CashError::Validation("Solo se guardan fotos https".into()));
    }
    if !content_type.starts_with("image/") || bytes.is_empty() || bytes.len() > MAX_IMAGE_BYTES {
        return Err(CashError::Validation(format!("Foto no válida: {url}")));
    }
    conn.execute(
        "INSERT OR REPLACE INTO local_image_cache (url,content_type,bytes,fetched_at) VALUES (?1,?2,?3,?4)",
        params![url, content_type, bytes, now],
    )?;
    Ok(())
}

/// Every cached photo still used by a product: (url, content type, bytes).
pub fn load_all(conn: &Connection, business_id: &str) -> CashResult<Vec<(String, String, Vec<u8>)>> {
    let mut stmt = conn.prepare(
        "SELECT c.url,c.content_type,c.bytes FROM local_image_cache c
         WHERE EXISTS (SELECT 1 FROM local_products p WHERE p.business_id=?1 AND p.image_url=c.url)",
    )?;
    let rows = stmt
        .query_map([business_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

/// Drops photos no product uses any more (e.g. after the catalog changed them).
pub fn prune(conn: &Connection) -> CashResult<usize> {
    Ok(conn.execute(
        "DELETE FROM local_image_cache WHERE url NOT IN (SELECT image_url FROM local_products WHERE image_url IS NOT NULL)",
        [],
    )?)
}
