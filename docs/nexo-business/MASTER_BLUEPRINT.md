# NEXO Business — Master Blueprint

**Status:** ACTIVE DESIGN / Pilot 01 = Casa Viva / next reusable native pilot = Estilo y Hogar
**Repository:** ernest196391/ernesto-rondon-nexo
**Updated:** 2026-10-02
**Purpose:** Offline-first, hardware-optional business operating system for NEXO-powered stores. Android + Windows POS, inventory, orders, cash, cloud sync and web-store integration. A business must be able to start with only an Android phone.

## Product thesis
NEXO Business is not a clone of AxisSoft and not a one-off Casa Viva POS. It is a reusable/white-label retail operating platform for Cuban businesses.

The target commercial bundle is:
- online store;
- Android/Windows POS;
- cash and financial operations;
- inventory by location;
- customer/CRM;
- gestora sales network;
- messenger/delivery network;
- management/admin;
- offline-first synchronization.

The product must be adaptable primarily through tenant configuration and adapters, not repository forks. See `CUBA_RETAIL_PLATFORM_MODEL.md` and `PRODUCT_DECISIONS_V1.md`.

## Pilots

### Pilot 01 — Casa Viva
Casa Viva is the first production laboratory for the **NEXO-native** mode. Success means an operator can complete daily work even with poor/no Internet and management can see synchronized truth when connectivity returns.

### Pilot 02 — Colo Shop + AxisSoft
Colo Shop is the first production laboratory for the **existing-system connector** mode. Colo Shop keeps AxisSoft as the physical-store system while NEXO progressively connects catalog/price/stock to the online storefront, orders, analytics and automation.

The two pilots are not separate products. Both must converge on the same provider-neutral domain, identity model, inventory rules, sync semantics and cloud model.

## Architecture
- Android and Windows are first-class clients through one shared `apps/business-pos` Tauri 2 + React + TypeScript shell, with platform adapters where required.
- Android barcode/QR capture: phone camera; prefer bundled on-device scanning so first-use scanning does not depend on Internet. Evaluate Tauri barcode-scanner plugin vs native ML Kit bridge during Phase 0.
- Local persistence: SQLite on every POS-capable client.
- Cloud: Supabase/Postgres + Auth + RLS.
- Web/admin/storefront: Next.js + TypeScript.
- Hosting: Vercel initially.
- Source: GitHub.
- Sync: local outbox/event queue, idempotent cloud writes, conflict policy, retry/backoff.
- External integration: NEXO Sync lives inside NEXO Business; provider-specific adapters live behind a connector boundary (Axis/CSV/Excel/manual/Woo etc.).
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
11. CRM/Credit: customers, purchase history, receivables, partial payments, fiado, consignment.
12. Returns/Exchanges: non-destructive reversal and replacement flows.
13. Gestoras: attribution, storefront, commissions, multi-store profile.
14. Messenger: jobs, collection, cash return, settlement, multi-store profile.
15. Accounting (later): bank/cash, payables, journal, chart of accounts, periods, trial balance, P&L.
16. AI (later): read-only grounded assistant with traceable report/source.

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
- Location model: warehouse, store, branch, transit.
- Immutable movement ledger.
- Paired stock transfers between locations.
- Purchase/receipt, adjustment, shrinkage.
- Stock count and reconciliation.
- Consignment-aware stock ownership/location groundwork.
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

### Phase 4 — Online-store bridge + external-system connector

#### 4A — Casa Viva online-store bridge
- Single catalog identity.
- Web order enters NEXO Business.
- Reserve/commit/release inventory policy.
- Pickup vs delivery.
- Casa Viva delivery pricing/zone integration.
- Fulfillment status.
Exit: online and counter sales share inventory safely.

#### 4B — Colo Shop / Axis connector pilot
- Keep Axis as initial source of truth for physical catalog/price/stock.
- Build provider-neutral import contract and durable external identity mapping.
- Start with supported export/import + diff/review if no official API is available.
- Make repeated imports idempotent.
- Propagate safe price/availability changes to Colo Shop storefront.
- Add sync audit/checkpoints and failure recovery.
- Investigate official Axis API/read integration.
- Bidirectional writes only through documented/supported Axis capability after reconciliation tests.
- Never write directly to undocumented Axis internals.

Exit: Colo Shop staff do not maintain the same catalog manually in Axis and NEXO, repeated sync does not duplicate products, and failed imports cannot destroy last known-good storefront state.

### Phase 5 — Management + CRM + operational finance
- Dashboard: today sales/cash/margin/orders/stock alerts.
- Customers and purchase history.
- Optional customer capture at POS; anonymous fast sale remains possible.
- Credit/fiado, partial payment and receivable ledger.
- Suppliers, purchases and payables operational views.
- Daily expenses and structured cash movements.
- Returns/exchanges linked to original sale.
- Gestora/operator commissions.
- Owner portfolio view across authorized businesses.
- CSV/XLSX export.
- Audit log.
Exit: owner can manage daily business without spreadsheets for core flows.

### Phase 6 — Accounting
- Cash and bank reconciliation.
- Operational ledgers feed accounting.
- Chart of accounts.
- Journal templates generated from operational events.
- Periods, posting, trial balance.
- Receivable/payable ledgers.
- Inventory valuation/cost.
- Profit/loss reporting.
- Accountant review/export.
Exit: accounting invariants and reconciliation tests pass. Local legal/accounting requirements require professional validation before marketing as compliant accounting.

### Phase 7 — NEXO AI
Read-only first. Natural-language questions grounded in reports, with source/report/date shown. No autonomous mutation of accounting, cash or stock initially.

### Phase 8 — SaaS/white-label
- Guided onboarding first, then self-service "Create your business".
- Tenant onboarding, plans/entitlements and configurable commercial pricing.
- Branding/domain/storefront.
- Optional modules: gestora, messenger, credit, advanced accounting.
- Updater, backups, telemetry with consent, support tooling, installer/signing.
- Additional vertical templates.
- Estilo y Hogar is the next intended full NEXO-native pilot used to prove configuration-over-fork reuse.

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


## NEXO Sync decision

NEXO Sync is a capability of NEXO Business, not a separate repository or standalone product.

For a business without an existing POS, NEXO Business can be the source system. For a business with an established POS/ERP, NEXO uses connectors to normalize external catalog/inventory data and connect it to the digital channel.

The first connector is AxisSoft for Colo Shop. The staged plan and integrity rules are defined in `docs/nexo-business/CONNECTORS_AND_SYNC.md`.

Any coding agent must also read `docs/nexo-business/AI_HANDOFF.md` before resuming cross-cutting work.
