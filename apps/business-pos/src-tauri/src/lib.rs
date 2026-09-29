use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_phase1_local_core",
        sql: include_str!("../../../../packages/business-db/migrations/0001_local_core.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nexo-business.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running NEXO Business");
}
