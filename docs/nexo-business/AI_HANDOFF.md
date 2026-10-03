# NEXO Business — AI Handoff / Resume Here

**Updated:** 2026-10-02  
**Repository:** `ernest196391/ernesto-rondon-nexo`  
**Default branch:** `main`  
**Primary active app:** `apps/business-pos`

## Purpose
This file is the coordination contract for any coding agent (Claude Code, ChatGPT, Codex, etc.) working on NEXO Business while another agent may be changing the same repository at the same time.

Repository state is the implementation truth. Documentation defines intent. Never trust an old chat snapshot over current `main`.

## Before touching code
Always do this first:
1. `git status`
2. `git fetch origin`
3. inspect current `origin/main` and recent commits;
4. if local work is clean, update from `main`;
5. read the files below in order;
6. inspect the exact implementation files you intend to change;
7. identify one bounded functional block and its acceptance test before editing.

If another agent has pushed newer work, rebase/pull before editing. Do not overwrite or roll back newer code to match stale instructions.

## Read in this order
1. `docs/nexo-business/STATUS.md`
2. `docs/nexo-business/AI_HANDOFF.md`
3. `docs/nexo-business/MASTER_BLUEPRINT.md`
4. `docs/nexo-business/TECHNICAL_ARCHITECTURE.md`
5. `docs/nexo-business/PHASE-1-CHECKLIST.md`
6. `docs/nexo-business/ADR-001-OFFLINE-SYNC.md`
7. `docs/nexo-business/CONNECTORS_AND_SYNC.md`
8. `docs/nexo-business/CASA_VIVA_COMPATIBILITY.md`
9. `docs/nexo-business/COLO_SHOP_PILOT.md`
10. repository `README`, `AGENTS.md` if present, workflows, current code and recent commits.

## Product in one sentence
NEXO Business is an offline-first, hardware-optional business operating system for Android + Windows that connects physical sales, inventory, cash, online commerce, customers and management, with cloud synchronization when Internet is available.

## Product modes
### NEXO-native
NEXO supplies POS + inventory + cash + orders + sync.
- Pilot 01: Casa Viva.

### Existing-system connector
Merchant keeps its POS/ERP and NEXO connects the digital channel.
- Pilot 02: Colo Shop + AxisSoft.

These are two modes of the same platform, not separate products.

## Accepted architecture
- Shared POS shell: `apps/business-pos`
- Tauri 2 + TypeScript
- Windows + Android first-class clients
- SQLite local
- Cloud later: Supabase/Postgres + Auth + RLS
- Web/admin/storefront: Next.js
- Domain: `packages/business-domain`
- Local migrations: `packages/business-db`
- Future sync mechanics: `packages/business-sync`
- Future external adapters: `packages/business-connectors`
- Offline checkout is non-negotiable
- Printer, dedicated scanner, cash drawer and scale are optional adapters, never checkout dependencies
- No service-role key in clients
- Inventory is movement-ledger based
- Cash must be auditable/append-only with corrective entries, not silent edits
- Sync must be idempotent; retry must never duplicate sale/payment/stock movement

## Proven implementation as of 2026-10-02
### Windows offline core — PASS
- Native Tauri app launches.
- Formal migrations run.
- SQLite local catalog works.
- Sale completion is transactional in Rust.
- Sale + lines + payment + inventory movements + outbox commit atomically.
- Restart persistence proven.
- Rollback probe proven.

### Android offline core — PASS
- APK/AAB build successfully.
- Physical-device install/launch proven.
- Airplane-mode sale proven.
- Local outbox persists.
- Full close/reopen persistence proven.
- In-place APK update preserves SQLite data.

### Multi-line cart — PASS on Windows + Android
- Multiple products.
- Increase/decrease quantity.
- Remove line.
- Correct total.
- Multi-line atomic checkout.
- Persistence after restart.

### Windows scanner/HID — functional simulation PASS
- Vendor-neutral keyboard-wedge path.
- Exact local barcode lookup.
- Manual code + Enter supported.
- Simulated HID code `850000000001` + Enter adds correct product.
- Physical USB/Bluetooth scanner hardware still needs a real-device test.

### Android camera scanner — PARTIAL
- Official Tauri barcode scanner plugin integrated.
- Permissions and camera opening work offline.
- APK builds/install works.
- Redmi 9A native scanner decodes the test QR.
- NEXO scanner on Redmi 9A opens camera but does not decode the same QR.
- Therefore camera -> SQLite -> cart is not yet certified.
- Do not mark scanner Phase-1 requirement complete until end-to-end decode is proven on at least one physical Android device.

### Digital receipt
- Windows receipt/share/copy — PASS.
- Android copy fallback works.
- Native share sheet is not yet reliable in current Tauri/WebView path.
- Latest UI work adds mobile-first sale confirmation bottom sheet + fixed toast feedback so the user does not need to scroll to see success.
- Verify latest UI build/device behavior before marking Android receipt UX PASS.

## Important current implementation files
- `apps/business-pos/src/main.ts`
- `apps/business-pos/src/style.css`
- `apps/business-pos/src-tauri/src/lib.rs`
- `apps/business-pos/src-tauri/Cargo.toml`
- `apps/business-pos/src-tauri/capabilities/mobile.json`
- `packages/business-db/migrations/0001_local_core.sql`
- `packages/business-db/migrations/0002_local_prices.sql`

## Current local sale schema
Core entities:
- `local_products`
- `local_barcodes`
- `local_prices`
- `local_sales`
- `local_sale_lines`
- `local_payments`
- `local_inventory_movements`
- `local_outbox`

Do not replace the ledger/outbox model with direct stock overwrites.

## Phase-1 work still missing
Use `PHASE-1-CHECKLIST.md` as the formal checklist, but verify reality before checking boxes.

High-priority remaining blocks:
- Android camera scan end-to-end compatibility.
- Physical Windows HID scanner test.
- Mobile-first Android digital receipt UX final verification.
- Native Android share sheet if practical; copy-to-clipboard must remain fallback.
- Favorites/quick products.
- Explicit safe-money contract coverage.
- Configurable payment methods.
- Cash shift:
  - open shift;
  - cash in/out with reason;
  - expected cash;
  - close/count/difference.
- Sync prototype:
  - business/branch/device provisioning;
  - idempotent push;
  - pull changes;
  - retry without duplication;
  - 8-hour airplane-mode simulation.
- Backup/restore drill.
- Full regression tests after current POS work.
- Real Casa Viva catalog/seed path instead of demo-only data.
- Real operating-day pilot on Android phone-only and Windows.

## What not to do yet
- Do not build full accounting.
- Do not make Internet mandatory.
- Do not require printer/scanner hardware for checkout.
- Do not write to undocumented Axis internals.
- Do not apply unfinished schema to production Supabase.
- Do not migrate Woo data yet.
- Do not claim CI green unless current CI is actually inspected.
- Do not mark hardware or mobile behavior PASS from compilation alone.

## Recommended parallel-work split
Because ChatGPT and Claude Code may work simultaneously, avoid both agents editing the same hot files at once.

### Claude Code — preferred parallel lane
Take one isolated block that minimizes collision with active mobile UX work. Good choices:
1. **Cash-shift domain + migration + Rust command layer** in new/isolated files.
2. **Tests** for atomic multi-line sale, totals, quantity validation, inventory movement invariants and outbox idempotency.
3. **Provider-neutral sync prototype contracts** in new `packages/business-sync` files.
4. **Real Casa Viva seed/import fixture** without altering current transaction semantics.

Do not start by refactoring `apps/business-pos/src/main.ts` unless the user explicitly assigns that file to Claude, because it is currently being modified by another agent.

## Suggested immediate Claude task
Audit current repository state, then implement the **cash-shift foundation** without changing existing sale behavior:
- design a versioned SQLite migration for shifts and cash movements;
- add domain types/invariants;
- add Rust commands or repository boundary for open shift, cash in/out, expected cash, close/count/difference;
- keep all mutations transactional;
- add tests where possible;
- do not wire a large UI yet unless requested;
- preserve current sale/cart/scanner/receipt code;
- document exactly what is implemented and what remains unproven.

If cash-shift work would collide with newer main changes, stop and choose tests/sync contracts instead.

## Coordination protocol for simultaneous work
Before every commit:
1. `git fetch origin`
2. compare your branch with `origin/main`
3. rebase if needed
4. resolve conflicts by preserving newer working behavior
5. run relevant tests/build
6. commit one functional block
7. push
8. update `docs/nexo-business/STATUS.md`
9. add a short checkpoint here only when coordination rules/current reality materially change.

Prefer a feature branch for Claude Code, e.g. `claude/cash-shift-foundation`, then merge only after verification. This reduces collisions while ChatGPT continues on `main`.

## Definition of done for any agent block
A block is not complete until:
1. code is committed;
2. relevant tests/typecheck/build are run;
3. offline/error behavior is considered;
4. no known working behavior is regressed;
5. docs reflect reality;
6. `STATUS.md` says what is proven vs only implemented;
7. next executable task is explicit.

## Local Windows environment notes
- Repo path: `C:\Users\Ernesto\ernesto-rondon-nexo`
- POS path: `C:\Users\Ernesto\ernesto-rondon-nexo\apps\business-pos`
- Use `npm.cmd`, not `npm`, because PowerShell execution policy blocks `npm.ps1`.
- Android SDK: `D:\Android\Sdk`
- Shared Cargo target: `D:\NexoBuild\target`
- Android universal debug APK path:
  `apps\business-pos\src-tauri\gen\android\app\build\outputs\apk\universal\debug\app-universal-debug.apk`

## Testing discipline
Compilation is not the same as functional proof.
Record separately:
- implemented;
- builds;
- installed;
- manually verified;
- physical hardware/device verified;
- production-ready.

Never collapse these into one PASS.


## Owner-approved product decisions — 2026-10-02
Read `docs/nexo-business/PRODUCT_DECISIONS_V1.md` before new schema or workflow design.

Critical requirements now include:
- CUP/USD/MLC with ledger extensible to crypto/digital assets;
- generic transfer category first;
- gestora optional, multi-store, configurable commission by product/store/order/percentage;
- merchant messengers plus future shared NEXO messenger network;
- delivery rate modes: zone, per-km, manual;
- simultaneous POS devices/shifts;
- location inventory and transfers across warehouse/store/branch;
- POS operator attribution and operator commission capability;
- CRM/customer purchase history for future retention/retargeting;
- credit/fiado, partial payments and consignment;
- returns/exchanges;
- structured expenses;
- multi-business owner portfolio;
- guided onboarding now, self-service later;
- offline for hours with later idempotent reconciliation;
- WhatsApp as optional channel, not future source of truth;
- accounting grows toward receivables/payables, bank, inventory valuation and P&L;
- Estilo y Hogar is the next full reusable NEXO-native pilot.

### Immediate architecture correction
Do not continue the current simplistic `0003_cash_shifts.sql` as final design.
Treat migration 0003 and current cash-shift domain primitives as a spike/draft until reconciled with the approved multi-currency, multi-location and source-aware financial model.

Before editing those files, audit migration compatibility. Because migration 0003 already exists on `main`, do not silently rewrite an applied migration if any device may already have executed it. Prefer a safe follow-up migration when necessary.

## Cash shift checkpoint — 2026-10-02 (Claude Code lane)
Migration 0003 is no longer a standalone draft: `0004_cash_ledger_multicurrency.sql` and `0005_financial_rails_and_refs.sql` extend it additively and all are now in the device migration list, which moved to `packages/business-db/rust/src/lib.rs` (`MIGRATIONS`). Cash shift writes go through `packages/business-db/rust/src/cash_shift.rs`; do not write cash tables directly from TypeScript. Do not edit 0003–0005 once merged; add 0006+. Read `FINANCIAL_MODEL.md` before any money-related schema (receivables, refunds, consignment, messenger custody).

## Device upgrade checkpoint — 2026-10-02 (Claude Code lane)
Migrations 3–5 are verified as in-place upgrades on the Windows pilot DB and on the Android Redmi 9A (armeabi-v7a) pilot DB; see STATUS "Financial migrations upgrade checkpoint". On this Windows laptop `tauri android build` cannot create its jniLibs symlink (Developer Mode off): build `--target armv7`, copy the `.so` into `gen/android/app/src/main/jniLibs/armeabi-v7a/` and run `gradlew.bat assembleArmDebug -x rustBuildArmDebug`. CI now runs `cargo test --locked` for `packages/business-db/rust`. Next money block: receivables/fiado (migration 0006).

## Receivables checkpoint — 2026-10-02 (Claude Code lane)
`0006_receivables.sql` + `packages/business-db/rust/src/receivables.rs` implement fiado/partial payments as append-only receivable entries (never negative cash). Do not edit 0006 once merged; add 0007+. Writes go through the Rust repository, not TypeScript SQL.

## Messenger custody + migration bytes — 2026-10-02 (Claude Code lane)
`0007_messenger_custody.sql` + `messenger_custody.rs`: messenger cash is custody until `record_return` writes the `messenger_return` drawer movement and the custody entry together. **Migration bytes are checksummed on devices**: `.gitattributes` pins 0001–0005 to CRLF and 0006+ to LF; `tests/migration_bytes.rs` guards it. Never edit or re-save an applied migration; add 0008+.

## Sale returns — 2026-10-02 (Claude Code lane)
`0008_sale_returns.sql` + `sale_returns.rs`: returns reference the original sale (never edited), restock with `reason='return'`, and cash refunds leave the drawer as `cash_out`/`sale_refund`. The integrity audit counts only `source_type='sale'` inventory movements, so returns do not affect it. The financial backend (drawer, rails, external refs, receivables, messenger custody, returns) is ready for a UI; next money block is consignment after location inventory.

## Location inventory — 2026-10-02 (Claude Code lane)
`0009_location_inventory.sql` + `inventory.rs`: stock is derived per location from append-only movements (update/delete now blocked by triggers). Movements without `location_id` belong to the business's default location; create one default store location during onboarding. Transfers are paired movements; counts write one reconciliation movement.

## Consignment — 2026-10-02 (Claude Code lane)
`0010_consignment.sql` + `consignment.rs`: a `consignment` location is bound to one client/currency; settlements decrease its stock and open a receivable atomically (uses `receivables::insert_receivable`). The local financial core (drawer, rails, external refs, receivables, custody, returns, location inventory, consignment) is complete as backend; what remains is UI (`main.ts`, owner coordination) and cloud sync of the outbox.

## POS operations UI — 2026-10-03 (Claude Code lane)
The owner approved Claude working on the POS UI. Financial screens live in `apps/business-pos/src/finance.ts` (+ `finance.css`); `main.ts` only mounts them (`mountFinance`) and refreshes after a sale (`refreshFinance`). Keep new screens in their own modules to avoid conflicts in `main.ts`. To test UI writes without polluting pilot data on Windows: close the app, copy `%APPDATA%\com.nexo.business\nexo-business.db`, test, close, delete `-wal`/`-shm`, copy the backup back and compare SHA-256.

## Outbox push client — 2026-10-03 (Claude Code lane)
`sync.rs` + `apps/business-pos/src/sync.ts` implement the push side of ADR-001 against `SYNC_PUSH_CONTRACT.md`. To test without touching pilot data, run `node mock-sync-server.mjs`-style stand-ins locally and restore the DB copy afterwards. The cloud endpoint is not built: it changes the production Supabase schema and needs the owner's explicit approval.

## Cloud ingestion — 2026-10-03 (Claude Code lane)
Supabase `nexo-production` now has schema `nexo_business` (devices + append-only sync_events + `push_events`), applied from `supabase/migrations/`. The Edge Function `supabase/functions/nexo-sync-push` still needs deploying (`npx supabase functions deploy nexo-sync-push --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt`). Never grant anon access to the ingestion RPC or the tables.

## Cloud sync live — 2026-10-03 (Claude Code lane)
`nexo-sync-push` is deployed and both pilots are provisioned and synced (22 events). The Supabase CLI is logged in on the owner laptop; redeploy with `npx.cmd supabase functions deploy nexo-sync-push --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt` from the repo root. Device tokens: never print or commit them; provision new devices by inserting only the SHA-256 hash.

## Auto-sync + cloud summary — 2026-10-03 (Claude Code lane)
The POS pushes automatically (`startAutoSync`/`requestSync` in `sync.ts`). Cloud read models are views over `nexo_business.sync_events`; the owner summary is the `nexo-business-summary` Edge Function. Deploy functions from the repo root with `npx.cmd supabase functions deploy <name> --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api`.

## Owner web dashboard — 2026-10-03 (Claude Code lane)
https://nexo-negocio.vercel.app (`apps/business-dashboard/index.html`). Access = Supabase Auth user + row in `nexo_business.members`; never let users insert memberships themselves. The page only uses the publishable key.

## Cloud catalog — 2026-10-03 (Claude Code lane)
The catalog is owned by the cloud (`nexo_business.catalog_products`, edited in the dashboard). Devices pull it (`catalog.rs`, `pullCatalog` in `sync.ts`). Do not seed new products from `main.ts`; add them in the dashboard. The dashboard deploys to Vercel from Git (`apps/business-dashboard`).

## Cloud stock + devices — 2026-10-03 (Claude Code lane)
Cloud stock = `nexo_business.stock_by_product` (derived). Owners provision devices from the dashboard. Caveat: the POS still sends a fixed `device_id` per platform (`pilot_scope` in `lib.rs`); the cloud attributes events to the token's device, but local IDs must come from provisioning before adding more devices of the same platform or another business.

## Real Casa Viva catalog — 2026-10-03 (Claude Code lane)
Casa Viva's catalog truth is BizneCubano → casavivadecuba.com. NEXO imports it read-only with the `nexo-catalog-import` Edge Function (product IDs `cv-<wooId>`, variants as separate items with `variant_of`). Never write to WooCommerce from NEXO. Website stock lands as `inventory.counted` events from device `casa-viva-web`.
