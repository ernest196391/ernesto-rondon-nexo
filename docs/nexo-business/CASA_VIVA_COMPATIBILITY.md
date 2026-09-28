# Casa Viva compatibility — source contract

NEXO Business is developed in parallel with Casa Viva. The authoritative transition contract is mirrored in Casa Viva at `docs/NEXO_BUSINESS_INTEGRATION.md`.

## Current compatibility findings
- Casa Viva has canonical order state mapping, immutable event history and idempotent transition service.
- Casa Viva inventory already supports product codes, camera barcode scanning and movement UUID/idempotency.
- Casa Viva currently keeps WooCommerce authoritative for web orders and stock.
- NEXO Business must not replace that authority during Casa Viva launch/certification.
- NEXO Business uses UUID canonical identities and maps Woo integer IDs as external refs.
- Initial bridge is read-only import/reconciliation. Writes to Woo stock wait for E2E reconciliation tests.

## Parallel-work rule
Never require Casa Viva to import NEXO Business internal code or database tables. Exchange versioned DTO/events through adapters. A breaking contract change must be documented in both repos before implementation.

## First bridge target
Catalog read model:
Casa Viva/Woo → adapter → NEXO Business product UUID + external_ref + SKU/barcodes + price + availability/version.

Then web-order read model. Inventory writes are later.
