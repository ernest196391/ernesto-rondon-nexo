# NEXO Business — Connectors & NEXO Sync

**Decision date:** 2026-09-28  
**Status:** ACCEPTED  
**Applies to:** NEXO Business / shared Windows + Android POS

## Decision

NEXO Sync is **not** a separate product or repository. It is the synchronization/integration capability inside **NEXO Business**. External systems are connected through provider-specific adapters under the NEXO Business connector boundary.

The first external POS/ERP connector is **AxisSoft**, with Colo Shop as the first real external-POS pilot.

## Two operating modes

### Mode A — NEXO Business as the business system
For small businesses that do not already have a POS/ERP. NEXO can own POS sales, catalog, inventory, cash, customers, online orders, cloud sync and web-store bridge.

**Pilot 01: Casa Viva.**

### Mode B — NEXO Business as integration + digital-commerce layer
For businesses that already operate another POS/ERP. The existing system remains in place while NEXO connects it to the online storefront, orders, analytics and future automation.

**Pilot 02: Colo Shop.**

Reported Colo Shop setup: AxisSoft, Windows/PC workstation, cash-register workflow, printer, barcode scanner and an existing physical-store inventory process. Do not force Colo Shop to replace Axis to launch the web store.

## Architecture

```text
External POS / ERP
      |
      v
business-connectors/<provider>
      |
      v
Normalized NEXO catalog/inventory contract
      |
      v
business-sync
(diff / checkpoints / outbox / conflict policy)
      |
      +--> local SQLite
      +--> NEXO Cloud / Supabase
      +--> online storefront / orders / analytics
```

Target package responsibilities:

```text
packages/
  business-domain/
  business-db/
  business-sync/
  business-connectors/
    axis/
    csv/
    excel/
    manual/
    woocommerce/
  business-scanner/
  business-ui/
  business-testing/
```

`business-domain` must remain provider-neutral. Axis-specific concepts must not leak into core product entities.

## Identity mapping

NEXO already supports external identities through `ProductIdentity.externalRefs`. A stable Axis external ID/SKU/barcode must map to one stable NEXO product. Re-importing the same source must never create duplicates.

## Normalized connector contract

A provider adapter should normalize source data into provider-neutral concepts:
- external system + external ID
- SKU and/or barcode
- product name
- price + currency
- stock quantity
- active/available state
- source timestamp/version when available

Exact code shape may evolve, but those concepts must remain separable.

## Colo Shop source-of-truth policy

For the first integration stage, **Axis remains the source of truth for physical-store catalog, price and stock**. NEXO consumes and normalizes changes, then updates the online channel.

Do not ask staff to maintain the same stock manually in two systems.

## Delivery plan

### v0.1 — Assisted sync
Launch Colo Shop without waiting for an undocumented Axis API.

If Axis can export a supported inventory/catalog report:
1. operator exports the supported file;
2. NEXO imports it;
3. NEXO maps products using stable external ID/SKU/barcode;
4. NEXO computes a diff;
5. operator reviews ambiguous/material changes;
6. NEXO applies approved changes to the online-store catalog.

Detect: new product, price change, stock change, stock = 0, stock restoration and ambiguous/missing mappings.

### v0.2 — Low-touch file sync
If Axis provides a stable export file/location, NEXO watches/imports it, auto-applies safe changes and sends ambiguous/destructive changes to review.

### v1 — Supported Axis API integration
Only after confirming an official/supported Axis interface: read catalog, prices, stock and stable identifiers. **Read-only first.**

### v2 — Bidirectional integration
Only if Axis officially supports external writes and after reconciliation/idempotency tests: online-order reservation, commit/release and stock/sale registration where appropriate.

Never implement bidirectional behavior by writing directly to undocumented Axis internal databases.

## Safety and integrity rules

1. Read-only first.
2. Never modify an undocumented/proprietary Axis database directly.
3. Never make online checkout depend on a live Axis network call.
4. Keep durable external-ID mappings.
5. Do not use blind last-write-wins for stock.
6. Every import/sync must be auditable.
7. Ambiguous matches require review; never guess product identity.
8. A failed sync must preserve the last known-good storefront state.
9. Secrets must not be embedded in desktop client source.
10. Bidirectional writes require documented/supported provider capability.

## Pilot acceptance — Colo Shop

The external-POS pilot succeeds when:
1. Axis remains usable as the store expects.
2. One Axis product maps to one NEXO product.
3. Re-import does not duplicate products.
4. Price changes propagate correctly.
5. stock = 0 makes the online item unavailable according to storefront policy.
6. stock restoration can reactivate availability.
7. a malformed/partial import cannot wipe the live catalog.
8. every sync has an audit result.
9. staff do not maintain the same catalog manually twice.
10. Colo Shop launch is not blocked while deeper Axis integration is investigated.

## Commercial interpretation

Do not sell this as another technical tool.

> Keep working with the system you already use. NEXO connects the digital channel around it and progressively removes duplicate work.

Do not promise direct Axis API integration until official capability is verified.

## Relationship to roadmap

Casa Viva validates NEXO Business as a complete offline-first business system. Colo Shop validates NEXO Business as an integration layer for businesses with an established POS/ERP. Both converge on the same provider-neutral domain, inventory rules, sync semantics and cloud model.