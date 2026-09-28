# NEXO Business Mobile
Target: Android-first Tauri 2 client for low-cost businesses.

Implementation spike decisions:
- shared pure TypeScript domain in packages/business-domain;
- local SQLite via official Tauri SQL plugin;
- native Android camera scanning via official Tauri barcode-scanner plugin;
- no printer required;
- digital receipt/share first;
- sale commit must work in airplane mode.

Do not add production Supabase writes until local crash/idempotency tests pass.
