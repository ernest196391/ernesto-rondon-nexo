# NEXO Business POS

Single Tauri 2 shell targeting Windows and Android.

## Phase 1 vertical slice
1. Open local SQLite database.
2. Run versioned migrations.
3. Seed a tiny Casa Viva-compatible demo catalog.
4. Search/scan product.
5. Add to cart.
6. Commit sale + payment + inventory movement + outbox atomically.
7. Close/reopen app and prove the sale remains.
8. Android camera scanning is a platform adapter; Windows HID input is another adapter.

No cloud connection, printer or dedicated scanner is required to complete a sale.
