//! NEXO Business local SQLite layer shared by the POS shell.
//!
//! `MIGRATIONS` is the single ordered list the Tauri SQL plugin registers, so
//! tests here run exactly the schema that ships to Windows/Android devices.

pub mod cash_shift;
pub mod catalog;
pub mod consignment;
pub mod device;
pub mod stock;
pub mod external_refs;
pub mod inventory;
pub mod messenger_custody;
pub mod receivables;
pub mod sale_returns;
pub mod sync;

/// A versioned migration: (version, description, sql).
pub struct LocalMigration {
    pub version: i64,
    pub description: &'static str,
    pub sql: &'static str,
}

pub const MIGRATIONS: &[LocalMigration] = &[
    LocalMigration {
        version: 1,
        description: "create_phase1_local_core",
        sql: include_str!("../../migrations/0001_local_core.sql"),
    },
    LocalMigration {
        version: 2,
        description: "create_local_prices",
        sql: include_str!("../../migrations/0002_local_prices.sql"),
    },
    LocalMigration {
        version: 3,
        description: "create_cash_shifts",
        sql: include_str!("../../migrations/0003_cash_shifts.sql"),
    },
    LocalMigration {
        version: 4,
        description: "cash_ledger_multicurrency",
        sql: include_str!("../../migrations/0004_cash_ledger_multicurrency.sql"),
    },
    LocalMigration {
        version: 5,
        description: "financial_rails_and_refs",
        sql: include_str!("../../migrations/0005_financial_rails_and_refs.sql"),
    },
    LocalMigration {
        version: 6,
        description: "receivables",
        sql: include_str!("../../migrations/0006_receivables.sql"),
    },
    LocalMigration {
        version: 7,
        description: "messenger_custody",
        sql: include_str!("../../migrations/0007_messenger_custody.sql"),
    },
    LocalMigration {
        version: 8,
        description: "sale_returns",
        sql: include_str!("../../migrations/0008_sale_returns.sql"),
    },
    LocalMigration {
        version: 9,
        description: "location_inventory",
        sql: include_str!("../../migrations/0009_location_inventory.sql"),
    },
    LocalMigration {
        version: 10,
        description: "consignment",
        sql: include_str!("../../migrations/0010_consignment.sql"),
    },
    LocalMigration {
        version: 11,
        description: "sync_checkpoints",
        sql: include_str!("../../migrations/0011_sync_checkpoints.sql"),
    },
    LocalMigration {
        version: 12,
        description: "product_grouping",
        sql: include_str!("../../migrations/0012_product_grouping.sql"),
    },
    LocalMigration {
        version: 13,
        description: "device_identity",
        sql: include_str!("../../migrations/0013_device_identity.sql"),
    },
    LocalMigration {
        version: 14,
        description: "product_photos_and_stock",
        sql: include_str!("../../migrations/0014_product_photos_and_stock.sql"),
    },
];

/// Applies every migration in order. Used by tests and tooling; on devices the
/// Tauri SQL plugin applies the same list and tracks applied versions itself.
pub fn apply_all_migrations(conn: &rusqlite::Connection) -> rusqlite::Result<()> {
    for migration in MIGRATIONS {
        conn.execute_batch(migration.sql)?;
    }
    Ok(())
}

/// True once migrations 0004 (multi-currency cash ledger) and 0005 (payment
/// rails, source identity, external refs) are present.
pub fn cash_ledger_ready(conn: &rusqlite::Connection) -> rusqlite::Result<bool> {
    conn.query_row(
        "SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='local_cash_shift_counts')
            AND EXISTS (SELECT 1 FROM pragma_table_info('local_sales') WHERE name='shift_id')
            AND EXISTS (SELECT 1 FROM pragma_table_info('local_payments') WHERE name='rail')",
        [],
        |row| row.get(0),
    )
}
