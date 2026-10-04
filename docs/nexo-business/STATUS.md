# NEXO Business — STATUS

**Last update:** 2026-10-02
**Pilots:** Casa Viva (Pilot 01, complex reference) · Colo Shop + AxisSoft (connector pilot) · Estilo y Hogar (next full reusable NEXO-native pilot)
**Current phase:** Phase 0 — Implementation Spike
**Overall state:** Cash shift ledger, receivables (fiado), messenger custody, sale returns, location inventory and consignment backends, an operations UI and live cloud sync (Supabase, both pilots) implemented; migrations 3–10 verified as in-place upgrades on the Windows and Android pilot DBs (no cash/credit UI yet). Windows native offline core PASS. Android physical-device core PASS. Multi-line cart and digital receipt are proven on Windows/Android. Android camera decoding on Redmi 9A remains partial. Product direction is now explicitly reusable/white-label for Cuban businesses: online store + POS/cash + inventory + gestora + messenger + management, with merchant-specific behavior handled by configuration/adapters rather than forks.

## What we are building
Offline-first, hardware-optional Android + Windows POS/business OS integrated with NEXO online stores. The minimum viable setup is one Android phone.

Two deployment modes share the same platform:
- **NEXO-native:** NEXO supplies POS/inventory/cash/orders. Pilot 01 = Casa Viva.
- **Existing-system connector:** merchant keeps its POS/ERP and NEXO connects the digital channel. Pilot 02 = Colo Shop + AxisSoft.

## Current decisions
- Android + Windows are first-class POS clients using a shared Tauri 2 + React + TypeScript core where practical.
- SQLite local on POS-capable clients.
- Android camera barcode/QR scanning is a Phase-1 requirement and must work offline after installation.
- Printer, dedicated scanner, cash drawer and scale are optional progressive enhancements; checkout must not depend on them.
- Supabase/Postgres cloud.
- Next.js web/admin.
- Offline sales are non-negotiable.
- Accounting and AI are later phases.
- Casa Viva validates the full NEXO-native flow; Colo Shop validates the external-POS connector flow.
- NEXO Sync is inside NEXO Business, not a separate repository.
- Axis is initially source of truth for Colo Shop physical catalog/price/stock; read-only/assisted sync first.
- Casa Viva + Colo Shop must converge on the same provider-neutral domain and sync semantics.
- Reusable/white-label is now the primary product architecture, not a later afterthought.

## Work completed
- Existing NEXO reuse audit: cart, pricing, delivery, checkout/idempotency, Woo connector, admin inventory, Casa Viva contracts.
- Target Android + Windows package boundaries documented.
- schema-v0 SQL design created (not applied to production).
- ADR-001 offline synchronization accepted for spike.
- Phase-1 Casa Viva checklist created.
- Public AxisCloud product/ERP audit.
- NEXO Business scope and phased roadmap.
- Initial domain/data model.
- Offline sync principles.
- Casa Viva acceptance scenarios.
- Hardware accessibility ladder: phone-only → phone/PC → cheap peripherals → full POS counter.
- Shared `apps/business-pos` vertical-slice scaffold added for the converged Windows + Android path.
- Demo POS frontend currently opens local SQLite, seeds/searches demo products, records a demo sale and queues a demo outbox record.
- NEXO Sync / external connector architecture accepted.
- Colo Shop + AxisSoft designated Pilot 02.
- Added `docs/nexo-business/CONNECTORS_AND_SYNC.md`.
- Added `docs/nexo-business/AI_HANDOFF.md` for chat-independent continuation.
- Added `docs/nexo-business/COLO_SHOP_PILOT.md` to lock Pilot 02 merchant experience, source-of-truth rules, sync boundaries and acceptance criteria.
- Added official Tauri barcode-scanner integration to `apps/business-pos`, including mobile capability permissions, Android/iOS-scoped Rust dependency and QR/UPC/EAN scan-to-local-barcode lookup flow.
- Verified the scanner integration does not break the Windows build and that the Android debug APK/AAB builds successfully after integration.

## Next task — DO THIS FIRST
Continue from the current shared `apps/business-pos` scaffold without changing production commerce behavior:

### Core POS spike
1. turn the shared scaffold into a proven native Tauri 2 executable shell;
2. wire the versioned `packages/business-db` migrations instead of demo-only CREATE TABLE statements;
3. make sale + payment + inventory movement + outbox atomic against the real local schema;
4. prove Windows restart/persistence behavior;
5. then prove Android build + offline camera barcode scan;
6. rerun NEXO regression tests/typecheck/build and record results.

### Parallel connector contract work — safe to do without blocking core POS
1. create provider-neutral external catalog/import types and fixtures;
2. create an Axis fixture/import adapter boundary only;
3. implement mapping + diff + repeated-import idempotency tests;
4. do not access undocumented Axis databases;
5. do not promise or implement Axis writes until supported capability is verified.

Do not apply schema-v0 to production Supabase yet. Do not migrate Woo data yet.

## Guardrails
- Do not rewrite working NEXO commerce blindly.
- Do not build accounting yet.
- Do not make cloud connectivity mandatory for checkout/POS.
- Do not expose Supabase service-role secrets client-side.
- Do not mark a phase complete without tests and updating this file.

## Resume protocol for any agent
Read in order:
1. docs/nexo-business/STATUS.md
2. docs/nexo-business/AI_HANDOFF.md
3. docs/nexo-business/MASTER_BLUEPRINT.md
4. docs/nexo-business/TECHNICAL_ARCHITECTURE.md
5. docs/nexo-business/CONNECTORS_AND_SYNC.md
6. docs/nexo-business/COLO_SHOP_PILOT.md
7. repository README and current code/recent commits
Then inspect current code before changing anything. Update STATUS.md at the end of every completed work block.

## Implementation spike checkpoint — 2026-09-28
- Added packages/business-domain with money, sale validation, outbox identity and scanner normalization.
- Added first offline SQLite migration under packages/business-db.
- Added Android and Windows app boundaries under apps/.
- Official Tauri SQL + barcode-scanner plugins selected for spike.
- Casa Viva integration remains read-only/contract-first.
- GitHub workflow had not yet surfaced a run at the immediate checkpoint; do not claim CI green until a run completes.

### Windows native offline-core checkpoint — PASS — 2026-09-29
Verified on the pilot Windows laptop:
- Tauri 2 native NEXO Business window launches successfully.
- Formal migrations run from `packages/business-db/migrations`; demo tables are no longer used by the active sale path.
- Formal product, barcode and price records are readable locally.
- Sale completion is executed in Rust on one SQLite connection and one transaction.
- A completed sale writes sale + line + cash payment + inventory movement + outbox.
- The formal sale and pending outbox survive full app close/restart.
- Built-in integrity audit reported: sales 1, lines 1, payments 1, inventory 1, outbox 1, incomplete sales 0.
- Built-in rollback probe reported rollback OK with no residual probe sale.
- Windows prerequisite stack proven: Node 24.19.0, npm 11.17.0, Rust 1.98.1, Cargo 1.98.1, Visual Studio Build Tools C++ workload/MSVC 14.44.35207.
- This is a Phase-0/Phase-1 implementation checkpoint, not production certification.

### Android physical-device checkpoint — CORE PASS — 2026-10-02
Verified manually on a physical Android device:
- Tauri 2 Android debug APK and AAB build completed successfully.
- Universal debug APK installed through ADB and launches on the physical phone.
- Formal local catalog/products load in the Android app.
- With the phone in airplane mode, a product can be added and one cash sale completes successfully.
- The sale is recorded as pending synchronization in the local outbox.
- After fully closing and reopening the app while still offline, the formal local sale and pending outbox remain present.
- After an in-place APK update (`adb install -r`), the existing local SQLite data remained intact.
- Post-update Android integrity audit reported: sales 6, lines 6, payments 6, inventory movements 6, outbox 6, incomplete sales 0, rollback OK.
- The sale path now assigns a platform-specific pilot device ID: `android-pilot-01` on Android and `windows-pilot-01` on Windows.
- This proves the Android offline core path, but does **not** yet certify camera scanning, cloud synchronization, an 8-hour offline shift, backup/restore, or production readiness.

### Scanner integration checkpoint — PARTIAL PASS — 2026-10-02
Verified manually:
- `@tauri-apps/plugin-barcode-scanner` and the Rust mobile plugin are integrated.
- Mobile capability includes `barcode-scanner:default`.
- Windows debug build still passes with the mobile plugin gated by `cfg(mobile)`.
- Android universal debug APK and AAB build successfully with the scanner integration.
- Updated APK installs in place with `adb install -r`, preserving existing app data.
- On the Redmi 9A, NEXO opens the camera while offline, so camera permission/plugin invocation works.
- The Redmi 9A native scanner can decode the same test QR to `850000000001`, but the NEXO scanner on that phone does not yet decode it. Therefore end-to-end `scan -> local_barcodes -> cart` is **not** certified yet.
- Compatibility tuning / second-device validation remains pending. Do not mark Android offline scanner acceptance complete yet.

### Multi-line cart checkpoint — PASS — 2026-10-02
Verified manually on Windows and Android:
- cart supports multiple products;
- quantity increase/decrease works;
- line removal works;
- totals update correctly;
- cash checkout persists as one atomic local transaction;
- multi-line sale writes sale lines, inventory movements, payment and outbox consistently;
- Android APK builds successfully with the multi-line cart;
- in-place Android update succeeds and preserves existing local data;
- completed Android sale remains persisted after full app close/reopen.

Scanner compatibility on Redmi 9A remains a separate open item and does not block the cart checkpoint.

### Windows HID scanner checkpoint — FUNCTIONAL SIMULATION PASS — 2026-10-02
Verified manually on Windows:
- vendor-neutral keyboard-wedge/HID capture is implemented;
- exact barcode lookup reuses the same local barcode path used by camera/manual entry;
- a simulated HID scan (`850000000001` + Enter with focus outside the search field) adds the expected product to the cart;
- manual barcode entry + Enter is also supported;
- no vendor SDK is required.

A physical USB/Bluetooth barcode reader has not yet been tested, so hardware acceptance remains pending.

### Digital receipt checkpoint — PASS — 2026-10-02
Verified manually on Windows and Android:
- completed sale renders a digital receipt;
- receipt includes products, quantities, unit prices, total, date/time, cash payment method and sale ID;
- `Copiar texto` works;
- Windows share flow works;
- Android fallback copy works when native share is unavailable;
- mobile-first bottom sheet appears immediately after sale completion;
- fixed toast feedback confirms copy/share without requiring the user to scroll;
- printing remains optional and checkout does not depend on printer hardware.

Native Android share sheet remains an optional enhancement, not a blocker because copy-to-clipboard is proven.

### Product-direction checkpoint — 2026-10-02
- Added `CUBA_RETAIL_PLATFORM_MODEL.md` defining NEXO Business as a reusable retail operating platform for Cuban merchants.
- Casa Viva remains the reference complex pilot, but its WordPress/Woo internals must not become the generic core.
- Shared core must cover online store, POS/cash, inventory, gestora, messenger and management coordination.
- Merchant differences belong in configuration/adapters whenever possible.
- The generic cash model must support multiple currencies, physical vs non-cash payments, source-aware movements and external order references before UI expansion.

### Owner decision checkpoint — 2026-10-02
Product requirements confirmed:
- multi-currency CUP/USD/MLC, extensible to crypto/digital assets;
- transfer as generic non-cash category initially;
- optional multi-store gestora module with configurable commissions;
- merchant + shared-network messengers;
- delivery pricing by zone, km or manual;
- multiple simultaneous devices/shifts;
- one branch initially but multi-branch-ready;
- location-based warehouse/store/branch inventory;
- operator-attributed POS sales and configurable operator commissions;
- CRM/customer purchase history;
- credit/fiado, partial payments and consignment;
- returns/exchanges;
- structured expenses;
- owner multi-business portfolio;
- guided onboarding first, self-service later;
- offline for hours, then idempotent sync;
- progressively move critical workflows into NEXO;
- next full reusable native pilot: Estilo y Hogar.

See `PRODUCT_DECISIONS_V1.md`.

### Reusable financial model + cash shift ledger checkpoint — BACKEND IMPLEMENTED, NOT DEVICE-TESTED — 2026-10-02
Branch `claude/reusable-financial-model` (Claude Code lane; includes the earlier `claude/cash-shift-foundation` commits). Design: `FINANCIAL_MODEL.md` (model, invariants, Casa Viva mapping, receivables/consignment design) and `CASH_SHIFT_LEDGER.md` (drawer details).
- **Implemented:** additive migration `0004_cash_ledger_multicurrency.sql` (0003 kept unchanged); multi-currency drawer per shift; opening float per currency; cash in/out, expense, order cash, messenger return and referenced corrections with mandatory reason; expected cash per currency (transfers excluded); close with count and difference per currency; append-only/immutability rules as SQLite triggers; outbox events `cash_shift.opened`, `cash_movement.recorded`, `cash_shift.closed`; idempotent retries.
- **Implemented:** Rust crate `packages/business-db/rust` (`nexo-business-db`) with the shared migration list and the transactional repository; Tauri commands `cash_shift_current/open/record_movement/close/summary`; `complete_sale` attaches the sale to the device's open shift (no behavior change without an open shift; sale outbox payload gains nullable `shift_id`).
- **Implemented:** additive migration `0005_financial_rails_and_refs.sql`: payment rail (`cash`/`transfer`/`card`/`digital_asset`/`other`) + provider/channel/external_ref metadata, with cash-only drawer rule; operator/customer/location hooks on sales; location on shifts; `source_system` on movements; order-backed cash (pickup, messenger return) must name its source and enters one drawer once per order/currency; `local_external_refs` one-to-one identity map.
- **Implemented:** TS domain invariants for the multi-currency ledger, rails and order-cash sources in `packages/business-domain/src/cash-shift.ts`.
- **Designed only:** messenger custody, receivables/fiado/partial payment, consignment, refunds, commissions, accounting (see `FINANCIAL_MODEL.md` §6).
- **Compiled:** `cargo check` + `cargo clippy` of `apps/business-pos/src-tauri` on Linux (cloud session, placeholder icon/dist only for the check; nothing committed). Not compiled for Windows or Android.
- **Tests passed:** `cargo test` in `packages/business-db/rust` 24/24 against real in-memory SQLite with the shipped migrations (atomic rollback, idempotency, multi-device, transfer exclusion, per-currency close, schema-level immutability, legacy 0003 shift, sale with/without shift). Root `vitest run` 37 files / 160 tests.
- **Not manually tested, not hardware tested, not production:** no UI exists yet; migrations 0003/0004 have not run through the Tauri SQL plugin on a real Windows or Android install; `complete_sale` with an open shift has not been exercised on a device.
- Root `tsc --noEmit` errors are pre-existing (`apps/business-pos/src/main.ts` Tauri modules not installed at root). CI on `main` is red at `npm audit` (critical advisory in `next` 16.3.4), also pre-existing.

### Financial migrations upgrade checkpoint — WINDOWS + ANDROID DEVICE PASS — 2026-10-02
Merged to `main` as PR #130 (`bb9b135`); follow-up branch `claude/cash-ci-and-rail`.
- **Windows (pilot laptop, existing pilot DB at migration 2, 7 sales, backed up first):** `cargo test` 24/24, root `vitest` 160/160, `tauri build --debug --no-bundle` OK. On launch the Tauri SQL plugin applied migrations 3, 4 and 5 with no checksum error (`_sqlx_migrations` 1–5 success, 17 triggers, `integrity_check` ok, `foreign_key_check` empty). Startup audit OK; one test sale without a shift saved completely and the audit stayed OK (sales 8).
- **Android (Redmi 9A, armeabi-v7a, existing DB at migration 2, 12 sales, backed up first):** arm debug APK installed with `adb install -r` (data kept). Migrations 3–5 applied on first launch; startup audit OK with 12 sales. One test sale without a shift saved completely, with `rail='cash'`; after force-stop and relaunch the sale persisted (13 sales, `integrity_check` ok, audit OK).
- **Follow-up (`claude/cash-ci-and-rail`):** CI job `business-db-rust` runs `cargo test --locked`; `complete_sale` writes `rail='cash'` instead of relying on the legacy NULL-rail fallback.
- **Not exercised on a device:** opening/closing a cash shift and cash movements (append-only rows would stay in the pilot DBs; covered only by `cargo test`). No UI exists yet.
- **Windows Android build note:** `tauri android build` fails on this laptop at the jniLibs symlink step (Windows Developer Mode is off). Workaround used: `tauri android build --debug --apk --target armv7` (compiles Rust, then fails at the symlink), copy `D:\NexoBuild\target\armv7-linux-androideabi\debug\libnexo_business_pos_lib.so` into `gen/android/app/src/main/jniLibs/armeabi-v7a/`, then `gradlew.bat assembleArmDebug -x rustBuildArmDebug`. APK: `gen/android/app/build/outputs/apk/arm/debug/app-arm-debug.apk`. Enabling Developer Mode restores the normal flow.
- **Device DB inspection:** the Android DB uses WAL; copy it with `adb exec-out run-as com.nexo.business cat nexo-business.db` only after a relaunch (checkpoint), or the newest rows may be missing from the copy.

### Receivables (fiado / partial payment) checkpoint — BACKEND + DEVICE UPGRADE PASS — 2026-10-02
Branch `claude/receivables-fiado`. Design and rules: `FINANCIAL_MODEL.md` §6.
- **Implemented:** additive migration `0006_receivables.sql` (receivables + append-only entries + balance view, overpay/currency/immutability triggers); Rust `receivables.rs` (open, payment by rail, write-off with reason, customer open balances; idempotent; outbox in the same transaction; cash payment enters the open drawer as `cash_in`/`receivable_payment`); Tauri commands `receivable_open`, `receivable_record_payment`, `receivable_write_off`, `receivables_for_customer`; TS `receivables.ts` (balance, credit-sale split).
- **Tests passed:** `cargo test` 35/35 (11 new), `cargo clippy` clean on the crate and POS shell, root `vitest` 164/164.
- **Windows:** debug build OK; migration 6 applied on the pilot DB (backed up first); audit OK (8 sales).
- **Android (Redmi 9A):** arm debug APK installed with `adb install -r` over existing data (backed up first); migration 6 applied; audit OK (13 sales); `receivables_for_customer` and a payment on a missing receivable answered correctly from the device (no rows written).
- **Not exercised on a device:** creating a receivable or recording payments/write-offs (would leave permanent rows in the pilot DBs). The sale flow does not open receivables yet; that needs customer selection in the UI.

### Messenger custody checkpoint — BACKEND + DEVICE UPGRADE PASS — 2026-10-02
Branch `claude/messenger-custody`. Rules: `FINANCIAL_MODEL.md` §6.
- **Implemented:** additive migration `0007_messenger_custody.sql` (append-only custody entries collected/returned/write_off, once-per-order-and-currency indexes, settlement and return-pairing triggers, balance view); Rust `messenger_custody.rs`; Tauri commands `messenger_custody_collect`, `messenger_custody_return`, `messenger_custody_write_off`, `messenger_custody_balances`; TS `messenger-custody.ts`.
- **Tests passed:** `cargo test` 44/44 (8 custody + 1 migration line-ending guard), clippy clean, root `vitest` 167/167.
- **Windows + Android (Redmi 9A):** migration 7 applied over the existing pilot DBs (backed up first); audit OK (8 and 13 sales); `messenger_custody_balances` answers on both. No custody rows were written to the pilot DBs.
- **Migration checksum incident (fixed before merge):** after committing 0006, Git re-checked it out with CRLF on Windows, its bytes changed and the POS refused to start (`migration 6 was previously applied but has been modified`). `.gitattributes` now pins 0001–0005 to CRLF (how the pilot devices applied them) and 0006+ to LF, and `tests/migration_bytes.rs` fails if that drifts. Never re-save an applied migration with different line endings.

### Sale returns / refunds checkpoint — BACKEND + DEVICE UPGRADE PASS — 2026-10-02
Branch `claude/sale-returns`. Rules: `FINANCIAL_MODEL.md` §6.
- **Implemented:** additive migration `0008_sale_returns.sql` (returns linked to the sale and its lines, restock movements, quantity/refund limits, append-only); Rust `sale_returns.rs`; Tauri `sale_return_record`, `sale_return_summary`; TS `sale-return.ts`.
- **Tests passed:** `cargo test` 51/51 (7 new), clippy clean, root `vitest` 170/170.
- **Windows + Android (Redmi 9A):** migration 8 applied over the existing pilot DBs (backed up first); audit OK (8 and 13 sales); `sale_return_summary` answers for a real pilot sale on both. No returns were written to the pilot DBs.

### Location inventory checkpoint — BACKEND + DEVICE UPGRADE PASS — 2026-10-02
Branch `claude/location-inventory`. Rules: `PRODUCT_DECISIONS_V1.md` §5.
- **Implemented:** additive migration `0009_location_inventory.sql`: locations (warehouse/store/branch/transit/consignment/damaged, one default per business, configurable authority system), `location_id`/`operator_id`/`transfer_id` on inventory movements, append-only movements (no update/delete), paired transfers, physical counts with expected/counted/difference and one reconciliation movement, `local_stock_by_location` view (movements without location belong to the default location). Rust `inventory.rs`; Tauri `inventory_locations`, `inventory_create_location`, `inventory_location_stock`, `inventory_transfer`, `inventory_count`; TS `location-inventory.ts`.
- **Tests passed:** `cargo test` 58/58 (7 new), clippy clean, root `vitest` 173/173.
- **Windows:** migration 9 applied over the pilot DB (backed up first); one test sale after the upgrade saved completely, audit OK (9 sales).
- **Android (Redmi 9A):** migration 9 applied over existing data (backed up first); audit OK (13 sales); `inventory_locations` answers (empty).
- **Pending:** no location exists yet on the pilot devices, so stock per location is not shown until onboarding/UI creates the default store location. POS sales still write movements without a location (they count toward the default).

### Consignment checkpoint — BACKEND + DEVICE UPGRADE PASS — 2026-10-02
Branch `claude/consignment`. Rules: `FINANCIAL_MODEL.md` §6, `PRODUCT_DECISIONS_V1.md` §8.
- **Implemented:** additive migration `0010_consignment.sql`: consignment account (one `consignment` location ↔ one client and currency), append-only settlements and lines (line total = qty × price). Rust `consignment.rs`: goods move with ordinary transfers; a settlement decreases stock at the consignment location (reason `consignment_sale`) and opens a receivable (`source_type=consignment_settlement`) in one transaction; payments use the receivable API. `receivables::insert_receivable` is now shared. Tauri `consignment_open_account`, `consignment_settle`.
- **Tests passed:** `cargo test` 63/63 (5 new), clippy clean, root `vitest` 173/173.
- **Windows + Android (Redmi 9A):** migration 10 applied over the pilot DBs (backed up first); audit OK (9 and 13 sales); `consignment_settle` answers with the expected rejection for an unknown location. No consignment rows written.

### POS operations UI checkpoint — WINDOWS FUNCTIONAL PASS, ANDROID RENDER PASS — 2026-10-03
Branch `claude/pos-finance-ui`. Owner approved Claude taking this UI ("haz lo que sea mejor para avanzar y escalar").
- **Implemented:** `apps/business-pos/src/finance.ts` + `finance.css`, an "Operaciones" panel under the cart: cash shift (open with floats per currency, cash in/out/expense with reason, per-currency summary, close with count and difference), fiado (note debt per customer, list open debts, record payments by rail), messenger cash (collected / handed over into the drawer), returns (pick a recent sale, quantities, refund by rail, reason) and locations (create; first one is the default; stock of the default). `main.ts` only gained 4 hook lines (import, container, mount, refresh after sale).
- **Windows functional pass (on a copy of the pilot DB, restored afterwards byte-identical by SHA-256):** open shift (USD 50, CUP 1000) → cash in 10 USD → expense 200 CUP → POS sale 125 USD (linked to the shift) → fiado 20 USD + cash payment 5 → messenger collected/handed over 30 USD → return 1 unit with 125 USD cash refund → create "Tienda principal" → close: USD expected 95, counted 100, difference +5; CUP expected 800, counted 800. Integrity audit OK throughout.
- **Android (Redmi 9A):** APK installed with `adb install -r`; panel renders with existing data; no writes made on the phone. Visual layout on the phone not yet reviewed by a person (screen was locked).
- **Not done:** consignment UI, location transfers/counts UI, customer list (customers are free text), operator login.

### Outbox push client checkpoint — WINDOWS FUNCTIONAL PASS (LOCAL STAND-IN SERVER) — 2026-10-03
Branch `claude/outbox-sync`. Contract: `SYNC_PUSH_CONTRACT.md`.
- **Implemented:** Rust `sync.rs` (due batch oldest first, applied/duplicate → synced, rejected/transport failure → kept with exponential backoff 30 s…1 h, queue never cleared), Tauri `sync_state`, `sync_pending_batch`, `sync_record_results`, `sync_record_failure`; TS contract `sync-contract.ts` (response check + reference server classifier); POS `sync.ts` with a "Sincronización" section (endpoint per device, "Sincronizar ahora", queue state).
- **Tests passed:** `cargo test` 68/68 (5 new), clippy clean, root `vitest` 176/176, POS `tsc` clean.
- **Windows (copy of the pilot DB, restored byte-identical afterwards):** against a local stand-in server, 9 pending events were sent and stored once; a second sync sent nothing; after a new sale with the server down the event stayed pending with `attempts=1` and the error shown. Audit OK.
- **Android (Redmi 9A):** APK installed; the Sincronización section shows 13 pending events. No endpoint configured, so nothing left the phone.
- **Not built (needs owner approval, production cloud):** cloud endpoint + Supabase tables, device authentication, pull side.

### Cloud ingestion checkpoint — DATABASE LIVE, FUNCTION PENDING DEPLOY — 2026-10-03
Owner approved ("sí, crea la sincronización en Supabase"). Project `nexo-production` (`viwwlriwlwodrfukbgbj`).
- **Applied:** migration `20261003010000_nexo_business_sync.sql` (isolated schema `nexo_business`, devices with hashed tokens, append-only unique events, service-role-only ingestion function). Checked: anon/authenticated cannot execute it or read the tables; a rolled-back self-test returned applied/duplicate/rejected/unauthorized as specified and left no rows.
- **Written, not deployed:** Edge Function `supabase/functions/nexo-sync-push` (the MCP deploy tool rejected its typed arguments; granting anon execute on the RPC was blocked as a permission change). The POS sync section now defaults to that URL and asks for a device token.
- **Next:** deploy the function, provision `windows-pilot-01` and `android-pilot-01`, and run a real sync from both pilots.

### Cloud sync checkpoint — LIVE, BOTH PILOTS SYNCED — 2026-10-03
- Edge Function `nexo-sync-push` deployed (owner logged in the Supabase CLI; deploy run from the repo root). Invalid tokens get 401.
- Devices `windows-pilot-01` and `android-pilot-01` provisioned for `casa-viva` (only SHA-256 token hashes in the cloud; plaintext tokens only on the owner laptop at `%APPDATA%com.nexo.businessdevice-tokens-NO-COMPARTIR.txt`).
- Windows pilot: 9/9 events pushed; a second push sent nothing. Redmi 9A: first push got HTTP 400 because its 6 oldest sales carry the label `windows-pilot-01` from an early build; fixed server-side (migration `20261003020000`: events are attributed to the authenticated sender, business must match) and the retry pushed 13/13. Cloud now holds 22 unique events, 0 duplicates. Integrity audit OK on both devices.
- Cloud events are stored, not yet projected into cloud sales/cash/stock tables.

### Auto-sync + cloud summary checkpoint — WINDOWS PASS — 2026-10-03
- **POS:** automatic background push every 60 s, when the network returns and 2 s after each sale (one push at a time; manual button kept). Verified on Windows: the state shows `Auto <hora>` right after start.
- **Cloud (applied, `20261003030000_nexo_business_projections.sql`):** read-model views `nexo_business.sales`, `sale_returns`, `cash_movements`, `receivable_balances`, `messenger_custody` parsed from `sync_events`; `business_summary(token, days)` (days in America/Havana) behind a service-role-only wrapper. Edge Function `nexo-business-summary` deployed (GET, same device token header).
- **POS "Resumen del negocio (nube)":** sales per day and currency for all devices, historic totals, open fiado, messenger cash and the last connection of each device. Verified on Windows with real data: 22 sales, 9000.00 USD (13 from the Redmi, 9 from Windows).
- **Data caveat:** the Redmi clock is about 6 days ahead (it reported 2026-10-09 on 2026-10-03), so its sales appear on 2026-10-08 in the cloud summary. Fix the phone date; events keep the time they were recorded with.

### Owner web dashboard checkpoint — LIVE, WAITING FOR OWNER ACCOUNT — 2026-10-03
- **Live:** https://nexo-negocio.vercel.app (Vercel project `nexo-negocio`, team `ernest196391s-projects`; source `apps/business-dashboard/index.html`, a static page with supabase-js). Sign-up / sign-in with email and password (Supabase Auth of `nexo-production`), period selector (7/30/90 days), sales per day and currency, totals, open fiado, messenger cash and device sync state.
- **Access control (applied, `20261003040000_nexo_business_members.sql`):** `nexo_business.members` (user ↔ business, role owner/viewer) added only by NEXO with the service role; `public.nexo_business_member_summary(days)` is executable by signed-in users and returns data only for their memberships (anon gets 401). The device-token summary now shares `summary_for()`.
- **Pending:** the owner signs up on the page and confirms the email; NEXO then inserts the membership row for `casa-viva`. Redeploy: `create_deployment` with the file, or Vercel CLI from `apps/business-dashboard`.

### Owner account + cloud catalog checkpoint — WINDOWS + ANDROID PASS — 2026-10-03
- **Owner account:** `ernest196391@gmail.com` signed up, confirmed and linked to `casa-viva` as owner; the dashboard shows the real data (22 sales, 9000.00 USD, both devices). Confirmation links redirect to `localhost:3000` (project Site URL, shared with other apps) but the confirmation itself succeeds.
- **Cloud catalog (applied, `20261003050000_nexo_business_catalog.sql`):** `nexo_business.catalog_products` (barcodes + prices per currency, global change sequence, deactivate-never-delete), owner-only `nexo_business_catalog_upsert`, member `nexo_business_catalog_list`, device `catalog_pull` behind the `nexo-catalog-pull` Edge Function (deployed). Seeded with the two pilot products.
- **POS:** local migration `0011_sync_checkpoints.sql`; Rust `catalog.rs` applies a page and advances the checkpoint in one transaction (idempotent, cloud owns SKUs, prices missing from a change are deactivated); the POS pulls after every push and refreshes the product list. `main.ts` now lists USD prices only (3-line change).
- **Dashboard:** "Catálogo y precios" editor for owners (name, SKU, barcodes, USD/CUP/MLC prices, active). Auth refresh events no longer redraw the page. Vercel now deploys from Git (`rootDirectory: apps/business-dashboard`).
- **Verified:** `cargo test` 74/74, clippy clean, POS `tsc` clean. A no-op save of "Producto NEXO Demo" in the dashboard (version 4) reached both pilots: migration 11 applied over existing data, checkpoint 4 on Windows and on the Redmi, the product updated in place with no duplicate prices, audit OK on both.

### Cloud stock + owner-managed devices checkpoint — LIVE — 2026-10-03
- **Cloud (applied, `20261003060000_nexo_business_stock_and_devices.sql`):** `nexo_business.stock_movements` / `stock_by_product` derived from synced sales (both payload formats), returns, counts, transfers and consignment settlements; `catalog_products.min_stock`; the summary returns `stock` with a `low` flag (low items first); owners create devices (`nexo_business_create_device`, token shown once, only the hash stored) and deactivate/reactivate them (`nexo_business_set_device_active`).
- **Dashboard:** stock table with low-stock banner and a hint when stock is negative (no initial count yet), min stock in the product editor, "Equipos del negocio" (add device and show its key once, deactivate/reactivate). Vercel project settings now pin `rootDirectory: apps/business-dashboard` with no build step (a Git deploy without them tried to build the whole repo and failed).
- **POS:** "Conteo físico" form in Ubicaciones e inventario (location, product, counted quantity, reason) that writes the reconciliation movement and triggers a sync.
- **Verified:** cloud stock today is −23 / −26 (sales only, no counts yet) and the dashboard explains it. A rolled-back cloud test with a +48 count and min stock 25 returned stock 22 flagged low. Windows count form on a copy of the pilot DB: expected −8, counted 40, adjustment +48; sync paused during the test, the pilot DB restored byte-identical and no test events reached the cloud. APK with the count form installed on the Redmi.
- **Pending:** the owner does the first real counts; until then stock shows negative.

### Real Casa Viva catalog checkpoint — LIVE ON BOTH PILOTS — 2026-10-03
- **Source (owner instruction):** the real catalog, variants and quantities come from BizneCubano, mirrored on casavivadecuba.com (Casa-Viva repo: `scripts/catalog/biznecubano-sync.php`, BizneCubano approved as catalog source 2026-10-02). NEXO reads the website's public WooCommerce Store API, read-only (Bridge 1 of the Casa-Viva `NEXO_BUSINESS_INTEGRATION.md`); nothing is written to WooCommerce.
- **Cloud (applied):** `20261003070000_nexo_business_catalog_import.sql` (category, image, variant and external-ref columns; catalog rows only take a new seq when something changes; `import_catalog` upserts items, deactivates unpublished ones and the demo products, and records website quantities as `inventory.counted` events from the virtual device `casa-viva-web` only when they differ) and `20261003071000` (service-only membership lookup). Edge Function `nexo-catalog-import` (deployed; owner JWT or `NEXO_IMPORT_KEY` secret, key kept only on the owner laptop at `%APPDATA%\com.nexo.business\import-key-NO-COMPARTIR.txt`).
- **Imported:** 200 website products → 281 sellable items (174 simple + 107 variants, each with its own SKU `BC-…`, USD price, category, image). 197 items with a tracked quantity got their stock (497 units in total); untracked items ("disponible sin control" on the web) have no NEXO stock yet. Second run: 0 changes, 0 new counts. Spot-checked against the live site (price, quantity, out of stock).
- **Devices:** Windows and the Redmi pulled the catalog (checkpoint 288) and now list the 281 real products; the two demo products are inactive. Audit OK on both.
- **Dashboard:** "Importar desde la web" button for owners (tested in the owner session: 200, idempotent).
- **Caveats:** quantities are what the store allows in a cart (stock minus items held in checkouts); variant names are "Producto — variante"; the POS still sells in USD only (category filters and variant grouping added later the same day).

### Catalog source (BizneCubano now, website later) + hourly import — LIVE — 2026-10-03
- **Owner decision:** follow BizneCubano for now; the goal is to follow the Casa Viva website later, switchable without rework.
- **Cloud (applied):** `20261003080000_nexo_business_catalog_sources.sql` — `nexo_business.catalog_sources` per business (`kind` = `biznecubano` | `woocommerce`, website URL, snapshot URL, `auto_import`, last result); owner RPCs to read/switch it; import deactivation now covers items from any source. `20261003081000_nexo_business_catalog_cron.sql` — `pg_cron` + `pg_net` enabled; job `nexo-business-catalog-import` hourly at :50 calls the import with a key generated and kept in Vault (`nexo_catalog_import_key`, never leaves Postgres).
- **Import function:** `biznecubano` mode reads the public snapshot `evidence/catalog-snapshot/biznecubano.json` (Casa-Viva repo): BizneCubano decides what is sold, price and stock; the website supplies variants and WooCommerce IDs; items match by SKU (`BC-…`), so switching to `woocommerce` never duplicates. Products on BizneCubano not yet on the website enter as `bc-…`. Items the owner creates in the dashboard are never touched.
- **Casa-Viva repo:** `catalog-source-snapshot.yml` now also runs hourly at :05 (merged to `main` as `bee3b77`; only the trigger changed).
- **Website outage (2026-10-03 ~16:50 UTC):** casavivadecuba.com serves a Hostinger "Parked Domain" page (nameservers `ns1/ns2.dns-parking.com`; www does not answer). Reported to the owner. The import now retries, reports the failing URL and, in BizneCubano mode, falls back to NEXO’s own copy of variants and IDs (`20261003090000_nexo_business_catalog_items.sql`); verified: 281 items, 0 changes while the site is down. The hourly Casa-Viva snapshot schedule is merged but GitHub had not run it yet at 17:21 UTC; the last snapshot is from 2026-10-02 20:45 UTC.
- **Website domain:** per the owner, the Casa Viva website now lives at **casaviva.company** (same WooCommerce store: product IDs and SKUs match). `catalog_sources.website_url` updated (`20261003100000_nexo_business_casa_viva_domain.sql`); the import ran against it with 281 items, no duplicates, and a rerun changed nothing.
- **Verified:** BizneCubano mode imported 281 items (0 stock differences with the website, 0 changes on rerun); the cron path returned HTTP 200 and stored its result. Dashboard shows the source, last import and lets the owner switch source or turn auto-import off.

### POS category filter + variant grouping — 2026-10-03
- **Local migration 0012 (`0012_product_grouping.sql`):** `local_products.category`, `variant_of`, `variant_label`; drops the `catalog` checkpoint once so devices re-pull the catalog with those fields (the cloud already sent them; applying is idempotent).
- **Rust:** `CatalogChange` carries `category` / `variantOf` / `variantLabel` (optional, trimmed, blank → NULL) and the upsert stores them. Test `keeps_category_and_variant_grouping`.
- **POS:** category chips above the list ("Todas" + each category with its product count, "Sin categoría" for NULL; hidden when there is only one), combined with the search. Variants of one product show as one card ("Alfombra de chenilla") with a button per variant (label + price); each variant is still its own cart line, SKU and barcode. Names from the cloud are HTML-escaped.
- **Verified:** `cargo test` all green, `tsc` clean, Windows debug build on the pilot DB: migration 12 applied, catalog re-pulled to checkpoint 3098, 281 active items all with category (9 categories), 107 variants → 200 cards. Redmi 9A (APK installed, verified by reading its DB with run-as because the phone was locked): same result, checkpoint 3098.

### POS device identity from provisioning — LIVE ON BOTH PILOTS — 2026-10-03
- **Cloud (applied):** `20261003110000_nexo_business_device_identity.sql` — read-only `public.nexo_business_device_identity(token)` (service role only; compares the key's SHA-256) returns `businessId`, `deviceId`, `label`. Edge Function `nexo-device-identity` (deployed; device key in `x-nexo-device-token`, 401 for unknown/inactive keys).
- **Local migration 0013 (`0013_device_identity.sql`):** one-row `local_device_identity`. Rust `device.rs`: `current_identity` (stored row, else the old pilot identity per platform) and `provision` (refuses a key from another business while the device holds data of a different business; branch = `casa-viva-main` for the pilot, `<business>-main` otherwise). Every Tauri command now scopes with `device_scope(conn)` instead of the fixed `pilot_scope()`.
- **POS:** each sync first asks the cloud who the key belongs to and stores it (never pushes/pulls under another identity; errors show in Sincronización). The header shows the device label and business; the app reloads if the business changes; demo seed only for the pilot business; receipts use the business name.
- **Verified:** `cargo test` green (5 new device tests), `tsc` clean. Windows: provisioned as `windows-pilot-01` / casa-viva ("Laptop piloto Windows"), header updated, sync 0 pending. Redmi 9A: APK installed, provisioned as `android-pilot-01` ("Redmi 9A piloto"). Existing pilot data unchanged (same business/device IDs).
- **New device:** owner creates it in the dashboard ("Equipos del negocio"), enters the key in Operaciones → Sincronización; the POS takes that business/device on the first sync.

### POS product photos + "Quedan N" + low-stock warning — LIVE ON BOTH PILOTS — 2026-10-03
- **Owner request:** photos on products; warn when 2 units are left. Live data: 202 tracked products, 90 with 1 unit and 51 with 2, so a standing "≤ 2" list would flag 142 at once. Decision: badge on every card ("Quedan N", "Agotado") and a warning only when a sale takes a product to its level (`min_stock` if the owner set one, else 2). 84 products sold "sin control" on the website have no stock and never warn.
- **Cloud (applied):** `20261003120000_nexo_business_stock_pull.sql` — read-only `nexo_business_stock_pull(token)` (derived stock + min stock per tracked product); Edge Function `nexo-stock-pull` deployed.
- **Local migration 0014:** `local_products.image_url` (https only; catalog re-pulled once) and `local_stock_snapshot`. Rust `stock.rs`: snapshot replace, current stock = snapshot − local sales not yet in it (unsynced, or synced after the snapshot). Every sync pulls stock after the catalog.
- **POS:** product rows with photo (letter placeholder when missing or offline), stock badges, list refresh after each sale and after each stock pull, warning toast + status line "Atención: quedan 2 de …".
- **Verified:** `cargo test` green (3 new tests), `tsc` clean; Windows (pilot DB backed up first): 202 stock rows, 284 photo URLs, 141 "Quedan" + 1 "Agotado" badges, phone-width screenshot checked. Redmi: APK installed, 203 stock rows and 284 photo URLs (screen locked, checked through its DB).
- **Caveat:** photos rely on the WebView's HTTP cache offline; a dedicated local photo cache comes with the redesign.

### Split payments + owner exchange rates — LIVE — 2026-10-03
- **Owner decisions:** charge in USD, CUP, CUP transfer (Transfermóvil or EnZona: bank transfers, only the app differs), MLC (transfer to an MLC card), Zelle, USDT and other crypto; 2 or 3 methods in one sale; no elTOQUE API key, so owners set rates by hand in the dashboard.
- **Cloud (applied):** `20261003130000_nexo_business_exchange_rates.sql` — append-only `exchange_rates` (CUP/MLC/USDT per 1 USD, latest in force, history kept), `nexo_business_set_rate` (owners), `nexo_business_rates` (members), `nexo_business_device_rates` + Edge Function `nexo-rates-pull` (devices); view `sale_payments` (old sales read as one cash payment; verified 22/22, totals match).
- **Local migration 0015:** `local_payments.usd_minor` / `exchange_rate`, `local_exchange_rates`. Rust `sale.rs` now owns `complete_sale` (moved out of the Tauri shell): up to 4 payments, method → rail (cash/transfer/digital_asset), USD values must equal the total exactly, foreign amounts must match their rate within one cent, references trimmed; cash in each currency joins the open drawer; payload gains `payments` and `payment_method` (single method or `split`). Old POS builds (one `paymentId`) still work.
- **POS:** "Cobrar" opens a checkout sheet (`checkout.ts`): method chips (disabled when the rate is missing; USDT defaults to 1), amount per method prefilled with what is left, CUP equivalent and rate age, reference required for transfers/crypto, extra cash becomes change recorded net. Receipts list every payment. Rates pull on each sync.
- **Dashboard:** "Tasas de cambio" card (owners edit, viewers read).
- **Verified:** `cargo test` green (7 new sale tests), `tsc` clean. Windows on the pilot DB with sync paused: $22 = $10 cash + 5,880 CUP Transfermóvil (rate 490, ref) and $11 paid with $20 (change $9, recorded $11); rows, rails, rates and receipt checked; DB restored byte-identical, no test event reached the cloud. Redmi: APK installed, migration 15 applied.
- **Owner to do:** set the CUP, MLC and USDT rates in the dashboard; until then only USD methods (and USDT at 1) are available.

### POS redesign (designer canvas + Casa Viva brand) — 2026-10-03
- **Source:** designer canvas "NEXO Business POS — Casa Viva" (19 artboards, owner's claude.ai artifact) from `DESIGN_BRIEF_POS.md`; official brand from `Downloads/casa-viva-logo.zip` + `Casa_Viva_Web_Rebranding_Kit.zip` (crema #F6F1E6, marrón #2B2420, petróleo #0D3B45, ámbar #A35A1F; Cinzel titles, Figtree text; isotipo vector).
- **Owner decisions kept over the canvas:** rates are set by owners in the dashboard (not edited in the POS, no elTOQUE download); 3 payments max (canvas), matching the owner's "2 or 3".
- **POS:** `src/nexo.css` = the canvas base (tokens + components); `src/themes/casaviva.css` = brand overrides only; `src/app.css` = shell layout; `src/ui.ts` = icons, isotipo, sheets. Fonts bundled offline (@fontsource Atkinson Hyperlegible, Figtree, Cinzel). One screen per task: Vender / Caja / Inventario / Más with a bottom tab bar on phones and a side rail from 900 px. Vender: search + scan, category chips, photo grid (letter in the category color when there is no photo), "Quedan N"/"Agotado", variants in a bottom sheet, cart bar → cart sheet; tablets keep the cart fixed on the right. Checkout: "Efectivo USD exacto" (3 taps on a phone, 2 on a tablet) or "Otra forma o dividir" (canvas payment rows, reference required). Sale-complete sheet with share/copy. Inventario lists low stock; Caja holds the shift and returns; Más holds receipts, fiado, messengers, summary, sync and device info. Connection pill: "Sin conexión" calm, "Enviando N", "Al día", "Revisar envío". Old `style.css` removed; operations forms keep `finance.css` themed by the shell; their results show as toasts.
- **Verified:** `tsc` clean; Windows screenshots at 360×800 (sell grid, cart sheet, variant sheet, split checkout, Caja, Más, Inventario) and 1024×768 (grid + fixed cart). No sales were made. Redmi: APK installed (screen locked, not viewed).
- **Next:** restyle the operations forms (Caja close by currency, fiado, inventory) to the canvas screens; local photo cache (WebP 200 px); undo toast and continuous scanning from the interaction notes.

### Zelle surcharge + premium mobile dashboard — 2026-10-03
- **Zelle at 1.04 (owner request):** rate key `ZELLE` (`20261003140000_nexo_business_zelle_rate.sql`, applied; Casa Viva set to 1.04; owner had already set CUP 775, MLC 1.4, USDT 1.04). A Zelle payment is USD with a surcharge rate: $37.00 is $38.48 sent, `usd_minor` 3700, `exchange_rate` "1.04". Rust accepts a rate on a USD payment only for non-cash methods (test `zelle_carries_its_surcharge_rate_but_cash_usd_cannot`); the POS checkout uses `rateKey`.
- **Dashboard redesign (`apps/business-dashboard`):** same NEXO base + Casa Viva theme as the POS (`nexo.css`, `casaviva.css` copied from `apps/business-pos/src`; keep them in sync) + `dash.css`. Branded login (isotipo, Cinzel name). Four sections with a bottom tab bar on phones and a side rail from 900 px: Resumen (KPI cards, daily sales bars, low-stock list at 2 or the product's minimum, devices), Catálogo (search, Activos/Con aviso/Inactivos chips, product rows with price/stock badges, edit in a sheet, import settings), Tasas (CUP, MLC, USDT, Zelle with age), Equipos (active/deactivated, the website import shown as "Sistema" without a switch, new device key with copy button). All RPCs unchanged.
- **Verified:** `cargo test` 91/91, `tsc` clean; dashboard checked at 375 px in the built-in browser with a local, read-only copy of Casa Viva data (login, Resumen, Catálogo, product sheet, Tasas, Equipos); POS Windows build and Redmi APK installed.

### POS operations screens in the design — 2026-10-03
- **Caja (canvas PCaja/TCaja):** status notice (no shift / shift open since hh:mm with opening floats), currency segmented control, per-currency summary (fondo, ventas en efectivo, entradas, salidas y gastos, debe haber), Entrada / Salida / Gasto as sheets, shift movements list (from `local_cash_movements`), "Contar y cerrar turno" sheet with expected vs counted per currency, live difference and a required reason when it does not match. Same Rust commands as before.
- **Inventario:** segmented "Poco stock" / "Ubicaciones y conteos"; new **Trasladar** form (existing `inventory_transfer` command) when there are two or more active locations.
- **Fiado, mensajeros, devoluciones, ubicaciones, sincronización, resumen:** forms moved to the design components (`field`/`input`/`btn`, `panel`, `tbl`); results as toasts.
- **Verified:** `tsc` clean; Windows on the pilot DB with sync paused (backup first): opened a shift ($40 + 5,000 CUP), cash entry $25 → "Debe haber $65", close sheet showed the differences and asked for a reason; DB restored byte-identical, no test event reached the cloud. Screenshots at 360×800 of Caja (no shift, open shift, close), Fiado and Inventario. Redmi APK installed.
- **Owner to do:** create the store location ("Tienda", and "Almacén" if there is one) in Inventario → Ubicaciones y conteos; counts and transfers need it.

### Thumbnails, offline photos, undo, continuous scan, store locations — 2026-10-03
- **Thumbnails:** `nexo-catalog-import` now stores the WooCommerce 300 px thumbnail (`images[0].thumbnail`, ~10–13 KB WebP) as `imageUrl` instead of the full photo (deployed; import run: 284 items, 280 photo changes, 2 stock counts). Devices re-pulled the catalog.
- **Dashboard:** product photos (thumbnails) in Catálogo rows, the product sheet and "Quedan pocas unidades".
- **POS offline photos:** local migration 0016 `local_image_cache` (bytes by URL, https and image/* only, ≤400 KB, unused rows pruned); Rust `images.rs` (tests); Tauri commands `images_cache` (downloads missing thumbnails with `ureq`/rustls, 40 per call, off the UI thread) and `images_cached` (data URLs). The POS loads cached photos at start and fills the cache in the background when online. Windows: 281 photos, 3.6 MB; all 200 cards rendered from the local cache.
- **Undo:** adding a product shows "Añadido: … · Deshacer".
- **Continuous scan:** the camera reopens after each product found (vibrates); an unknown code goes to the search box and stops.
- **Landscape phones:** a phone turned sideways (under 520 px tall) gets the rail and fixed cart like a tablet. The owner uses the Redmi upright; the 800×360 reading came from the WebView while the screen was locked, not from real use.
- **Store location (owner request):** "Tienda" (store, principal) created on the laptop and on the Redmi through each app's own command (Redmi via WebView debugging over adb, which also gives real-device screenshots).
- **Verified:** `cargo test` 93/93, `tsc` clean, Windows build + Redmi APK (ureq/rustls builds for armv7).

### Consignment screen + store aligned with cloud stock — 2026-10-03
- **Bug found:** a device's locations only held its own movements, so the new "Tienda" had 0 of everything: transfers (and consignment) were refused, and a physical count would have sent a difference against 0, adding the whole quantity again in the cloud (website counts already there).
- **Fix:** Rust `stock::align_default_location` runs after every stock pull: the default (store) location gets a local-only `cloud_alignment` movement so store + other local locations = cloud stock. No outbox event, so the cloud is never counted twice; counts and transfers now start from the real quantity. Tests: alignment, consignment stock kept out of the store, no store → nothing.
- **Consignment (Más → Consignación):** client cards with units in deposit, Enviar / Recoger (transfers store ↔ client location), Liquidar (sold units at the product price in the account currency → `consignment_settle`, the total opens a fiado), new client (creates the consignment location + account).
- **Verified:** `cargo test` green; Windows on the pilot DB with sync paused: store aligned (201 products), sent 2 desks to a test client, settled 1 at $230 → fiado $230 open, 1 left in deposit; alignment produced no outbox events; DB restored, no test event reached the cloud. Redmi APK installed. Casa-Viva hourly snapshot confirmed running (snapshot 00:40 UTC, import 00:50, 284 items).
- **PHASE-1-CHECKLIST.md** updated to what is built and verified.

### Favorites / quick products — 2026-10-03
- **Local migration 0017** `local_favorites` (per device, keyed by card: `p:<id>` or `v:<parent>`).
- **POS Vender:** star on every card (beside it, not inside the card button) pins/unpins; a "Favoritos" chip right after "Todo" shows the pinned cards, best sellers of the last 30 days first; with nothing pinned it shows the 12 best sellers of 30 days with a hint, or a hint alone when there are no sales.
- **Verified:** `tsc` clean, migration tests green; Windows: chip empty state, pinned 2 cards (chip "Favoritos 2", amber stars), unpinned them (0 rows left). Redmi APK installed.

### Next executable block
1. Field tests with the owner: camera scanner with real barcodes, the shop's USB reader, a forced restart during a sale.
2. One offline shift on Android (open, sales, movements, fiado, messenger return, refund, close) and an 8-hour airplane-mode run, then check the cloud converges without duplicates.

## Local verification — Windows laptop — 2026-09-28
Verified on Node.js 24.19.0 / npm 11.17.0 / Git 2.55.0.windows.3:
- npm install completed (398 packages).
- Vitest: 35/35 test files passed, 151/151 tests passed.
- TypeScript: tsc --noEmit passed with no errors.
- Next.js 16.3.4 production build compiled successfully; 54/54 static pages generated.
- Node engine baseline updated from obsolete Node 20 range to >=24 <25 after this verification.

Next: Tauri 2 executable shell + local SQLite wiring. Android APK/device scan comes after desktop/local persistence proof.


## Connector decision checkpoint — 2026-09-28

Accepted after reviewing Colo Shop's real operating context:
- Colo Shop already uses AxisSoft with PC/counter hardware, printer and scanner.
- Do **not** delay Colo Shop launch waiting for a deep Axis integration.
- Start with NEXO Sync assisted/semi-automatic flow using supported exports if available.
- Axis remains source of truth for physical catalog/price/stock in the first stage.
- NEXO normalizes, maps, diffs and propagates safe changes to the online channel.
- Repeated imports must not duplicate products.
- Failed/partial imports must not wipe the live storefront.
- Direct writes to undocumented Axis internals are forbidden.
- Official API/read integration is a later upgrade if Axis supports it.
- Bidirectional writes come only after supported capability + reconciliation/idempotency proof.

See:
- `docs/nexo-business/CONNECTORS_AND_SYNC.md`
- `docs/nexo-business/COLO_SHOP_PILOT.md`
- `docs/nexo-business/AI_HANDOFF.md`

Parallel-work rule: the desktop/Tauri implementation may advance from another chat/agent. Always inspect recent commits and current code before changing implementation; never roll back newer working progress to match stale chat context.
