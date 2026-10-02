# NEXO Business — STATUS

**Last update:** 2026-10-02
**Pilots:** Casa Viva (Pilot 01, complex reference) · Colo Shop + AxisSoft (connector pilot) · Estilo y Hogar (next full reusable NEXO-native pilot)
**Current phase:** Phase 0 — Implementation Spike
**Overall state:** Cash shift ledger backend implemented and unit-tested on a branch, not device-tested. Windows native offline core PASS. Android physical-device core PASS. Multi-line cart and digital receipt are proven on Windows/Android. Android camera decoding on Redmi 9A remains partial. Product direction is now explicitly reusable/white-label for Cuban businesses: online store + POS/cash + inventory + gestora + messenger + management, with merchant-specific behavior handled by configuration/adapters rather than forks.

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

### Next executable block
1. Windows: `npm.cmd` build + launch the POS with this branch, confirm migrations 3, 4 and 5 apply on the existing pilot DB (no checksum error) and that a sale without a shift still passes the integrity audit.
2. Minimal cash-shift UI (open with float, cash in/out with reason, close with count per currency) — coordinate with the owner of `main.ts`.
3. Android: same migration/upgrade check with `adb install -r` over existing data, then one offline shift with sales + movements + close.
4. Add `cargo test` for `packages/business-db/rust` to CI.

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
