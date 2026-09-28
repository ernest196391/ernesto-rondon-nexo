# NEXO Business — Phase 0 Technical Architecture

## Existing assets audited
| Existing asset | Decision |
|---|---|
| lib/commerce/cart.ts | Reuse concepts/tests; extract provider-neutral cart domain |
| lib/commercial/pricing.ts | Reuse rule logic after money/tenant contract |
| lib/commerce/delivery.ts + shipping rates | Adapt behind DeliveryQuote provider |
| checkout idempotency | Preserve principle; replace process-memory protection with durable operation IDs |
| order-whatsapp | Reuse formatter as output adapter; never source of truth |
| WooCommerce adapter | Keep as external connector |
| storefront/catalog | Keep public channel; map to NEXO Business IDs |
| admin product inventory | UX/reference only; current writes go directly to Woo |
| audit patterns | Reuse concepts; redesign tenant/RBAC |
| Casa Viva Woo/PHP core | Reuse states/contracts/fixtures, not PHP implementation |

## Target layout
Do not move production code in Phase 0.

apps/
- business-web — later management SaaS
- business-pos        # one Tauri 2 application targeting Windows + Android

packages/
- business-domain — pure TypeScript entities/commands/money/invariants
- business-db — SQLite migrations/repositories
- business-sync — outbox/push/pull/conflicts
- business-ui — shared touch-first UI
- business-scanner — camera scanner + HID abstraction
- business-connectors — Woo/Casa Viva/WhatsApp/printer adapters
- business-testing — fixtures/offline/sync harness

supabase/migrations — cloud schema/RLS/functions

## Hard boundary
business-domain imports no Next.js, Tauri, WooCommerce, Supabase SDK, camera SDK or printer SDK.

## Phase-1 surfaces
Provisioning; PIN/login; POS scan/search/favorites; product quantity; cart; payment; sale success/digital receipt; shift open/close; sales history; sync status; minimal product/barcode maintenance.

## Android scanner spike
Test EAN-8/EAN-13/UPC-A/UPC-E/Code128/QR in airplane mode, low/mid Android, torch, duplicate debounce and permission recovery. Scanner returns a normalized ScanResult only.

## Peripheral rule
Dedicated scanners first use keyboard/HID. Printer/cash drawer are retryable adapters after sale commit; their failure cannot block checkout.

## ADR refinement — one POS shell (2026-09-28)
The implementation spike uses one `apps/business-pos` Tauri 2 shell for Windows and Android instead of duplicated desktop/mobile applications. Platform-specific behavior lives behind adapters (camera scanner on Android, HID keyboard scanner on Windows). Shared UI, domain, SQLite repositories and sync semantics remain one codebase.
