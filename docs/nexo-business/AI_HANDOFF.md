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
