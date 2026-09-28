# NEXO Business — Master Blueprint

**Status:** PLANNED / Pilot 01 = Casa Viva
**Repository:** ernest196391/ernesto-rondon-nexo
**Updated:** 2026-09-28
**Purpose:** Offline-first, hardware-optional business operating system for NEXO-powered stores. Android + Windows POS, inventory, orders, cash, cloud sync and web-store integration. A business must be able to start with only an Android phone.

## Product thesis
NEXO Business is not a clone of AxisSoft. It borrows validated ERP/POS concepts while owning its UX, code, data model and integrations. Its differentiator is one source of truth shared by physical POS, online store, inventory, fulfillment and management.

## Pilot
Casa Viva is the first production laboratory. Success means an operator can complete daily work even with poor/no Internet and management can see synchronized truth when connectivity returns.

## Architecture
- Android and Windows are first-class clients: Tauri 2 + React + TypeScript, with native mobile integrations where required.
- Android barcode/QR capture: phone camera; prefer bundled on-device scanning so first-use scanning does not depend on Internet. Evaluate Tauri barcode-scanner plugin vs native ML Kit bridge during Phase 0.
- Local persistence: SQLite on every POS-capable client.
- Cloud: Supabase/Postgres + Auth + RLS.
- Web/admin/storefront: Next.js + TypeScript.
- Hosting: Vercel initially.
- Source: GitHub.
- Sync: local outbox/event queue, idempotent cloud writes, conflict policy, retry/backoff.
- Principle: cloud outage must not stop a cash sale.
- Principle: dedicated POS hardware is optional. Minimum viable hardware = one supported Android phone. PC, scanner, printer, cash drawer, scale and customer display are progressive enhancements.

## Core bounded contexts
1. Identity/Tenant: businesses, branches, users, roles, devices.
2. Catalog: products, variants, barcodes, categories, prices.
3. Inventory: stock ledger, locations, receipts, adjustments, transfers, shrinkage.
4. Sales/POS: carts, sales, sale lines, discounts, payment splits, refunds.
5. Cash: shifts, opening float, cash movements, closing/reconciliation.
6. Orders: online/manual orders, status, pickup/delivery.
7. Customers: customer profile and purchase history.
8. Suppliers/Purchases: suppliers, purchase orders/receipts, costs.
9. Delivery: assignment/status/proof fields; Casa Viva tariffs integrate here.
10. Reporting: sales, margin, stock, cash, order performance.
11. Accounting (later): journal, chart of accounts, periods, trial balance.
12. AI (later): read-only grounded assistant with traceable report/source.

## Offline-first rules
- SQLite is authoritative for an active offline POS session.
- Every mutation gets UUID, tenant_id, device_id, created_at and sync status.
- Outbox records unsynced mutations.
- Server operations are idempotent.
- Never use last-write-wins blindly for stock/cash.
- Inventory uses immutable movement ledger; balances are derived/materialized.
- Cash shifts are append-only except explicit corrective entries.
- Product/catalog conflicts prefer server-managed versioning with operator warning.
- UI exposes Online / Offline / Syncing / Sync error clearly.

## Minimum data model
businesses, branches, users, memberships, roles, devices,
products, product_variants, barcodes, categories, price_lists, prices,
inventory_locations, inventory_movements, stock_snapshots,
customers, suppliers,
sales, sale_lines, payments, refunds,
cash_shifts, cash_movements,
orders, order_lines, fulfillment_events, delivery_quotes,
purchase_orders, purchase_lines, goods_receipts,
sync_outbox, sync_checkpoints, audit_log.

All business tables are tenant scoped. RLS is mandatory in cloud.

## Phase plan
### Phase 0 — Foundation [ACTIVE]
- Freeze blueprint and product boundaries.
- Audit current NEXO/Casa Viva integration points.
- Create /docs/nexo-business source of truth.
- Decide monorepo layout and package boundaries.
- Define schema v0 and sync ADR.
Exit: another coding agent can resume without chat history.

### Phase 1 — Casa Viva Core POS MVP (Android + Windows)
- Login/PIN and role.
- Product/category search.
- Barcode input from keyboard/HID on desktop.
- Camera barcode/QR scanning on Android, fully on-device/offline after installation.
- Manual product search and favorites/quick tiles so barcode is never mandatory.
- Cart and quantity editing.
- Cash sale and configurable payment methods.
- Digital receipt first: on-screen + share/export; physical printing is optional.
- Shift open/close and cash movements.
- Sales history.
- Fully usable offline.
Exit: Casa Viva can run a simulated full day disconnected on an Android phone and on Windows, without scanner or printer.

### Phase 2 — Inventory
- Opening stock/import.
- Immutable movement ledger.
- Purchase/receipt, adjustment, shrinkage.
- Stock count.
- Low-stock warning.
- Cost and gross-margin basis.
Exit: every sale changes stock and can be audited back to a movement.

### Phase 3 — Cloud synchronization
- Supabase tenant schema/RLS.
- Device registration.
- Outbox sync.
- Retry/idempotency/conflict handling.
- Recovery tests after long disconnect.
Exit: two devices + cloud converge without duplicate sales/payments.

### Phase 4 — Casa Viva online-store bridge
- Single catalog identity.
- Web order enters NEXO Business.
- Reserve/commit/release inventory policy.
- Pickup vs delivery.
- Casa Viva delivery pricing/zone integration.
- Fulfillment status.
Exit: online and counter sales share inventory safely.

### Phase 5 — Management
- Dashboard: today sales/cash/margin/orders/stock alerts.
- Customers and suppliers.
- Purchases/accounts operational views.
- CSV/XLSX export.
- Audit log.
Exit: owner can manage daily business without spreadsheets for core flows.

### Phase 6 — Accounting
- Chart of accounts.
- Journal templates generated from operational events.
- Periods, posting, trial balance.
- Receivable/payable ledgers.
- Accountant review/export.
Exit: accounting invariants and reconciliation tests pass. Local legal/accounting requirements require professional validation before marketing as compliant accounting.

### Phase 7 — NEXO AI
Read-only first. Natural-language questions grounded in reports, with source/report/date shown. No autonomous mutation of accounting, cash or stock initially.

### Phase 8 — SaaS/white-label
Tenant onboarding, plans/entitlements, branding, updater, backups, telemetry with consent, support tooling, installer/signing, additional vertical templates.

## AxisCloud audit → NEXO decision
Validated AxisCloud concepts worth adopting as product patterns:
- POS as one component of a larger ERP.
- Shared data across sales, inventory, purchases, accounting and dispatch.
- Offline selling with later synchronization.
- Day-opening dashboard focused on money, debts and late work.
- Modular activation instead of forcing every feature on day one.
- AI assistant should cite the underlying report and remain read-only initially.
- Existing-data migration/onboarding matters.

Do NOT copy:
- UI, wording, branding, source code, proprietary schemas or implementation details.
- Full ERP breadth in V1.
- Manufacturing, reservations, contracts, HR or advanced CRM before Casa Viva proves need.
- Accounting before sales/inventory/cash invariants are stable.

## Hardware accessibility ladder
**Level 0 — Phone only:** Android app, camera scanner, manual search, digital receipt, local backup/export. No printer/scanner/PC required.

**Level 1 — Phone + PC (optional):** shared/synchronized catalog and management.

**Level 2 — Cheap peripherals:** Bluetooth/USB HID barcode scanner and Bluetooth/USB thermal printer where supported.

**Level 3 — Full counter:** cash drawer, scale integration, dedicated scanner, customer display and other POS hardware. Hardware adapters must be modular so core POS never depends on them.

## UX rules for low-resource businesses
- Big touch targets and one-hand Android checkout.
- Search, favorites and camera scan are equal entry paths.
- No forced cloud round-trip to make a local sale after device provisioning.
- Never require printing to finish a sale.
- Data export/backup must be understandable by a nontechnical operator.
- Optimize for older/low-mid Android hardware and benchmark before raising minimum requirements.

## Casa Viva acceptance scenarios
1. Internet fails for 8 hours; sales continue.
2. Restart PC mid-shift; no committed sale disappears.
3. Same barcode cannot accidentally create duplicate catalog identities.
4. Sync retry cannot duplicate a sale/payment.
5. Web order reserves stock; cancellation releases it.
6. Counter sale and web order contention is resolved explicitly.
7. Shift closing explains expected vs counted cash.
8. Every stock difference has a movement/reason/user/time.
9. Owner can trace a number on dashboard to underlying transactions.
10. Backup/restore drill succeeds before production rollout.
11. Android camera scans common Casa Viva EAN/UPC/QR codes offline.
12. A complete sale can be made with phone only: no PC, scanner or printer.
13. Windows accepts standard USB/Bluetooth HID scanner input without vendor lock-in.
14. Printer/cash-drawer failure cannot block checkout.

## Security baseline
RLS tenant isolation, least privilege, no service-role key in desktop/web client, encrypted transport, protected secrets, audit log for sensitive operations, server validation, signed releases when commercial distribution begins.

## Budget-first policy
Use open-source/free tiers while validating. Do not buy code-signing, paid hosting or enterprise services before required by production/distribution. Track thresholds that trigger upgrades.

## Definition of Done
A feature is not done until typecheck/lint/tests pass, offline behavior is tested where relevant, permissions are tested, failure/retry state is handled, and docs/status are updated.
