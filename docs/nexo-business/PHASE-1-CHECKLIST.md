# Phase 1 — Casa Viva POS Checklist

Updated 2026-10-03 from STATUS.md. `[x]` = built and verified; `[~]` = built, field test pending; `[ ]` = not done.

## 1A Skeleton
- [~] Add workspace tooling without breaking current Next app (NEXO Business apps live beside it; Next regression not re-run this round).
- [x] Create pure business-domain (`packages/business-domain`, sync contract).
- [x] SQLite migration runner/local schema (migrations 0001–0016, byte-pinned, `cargo test`).
- [x] Validate shared Tauri Android + Windows structure (both pilots run the same build).
- [~] Existing NEXO build/tests remain green (business crates green; Next app not re-run this round).

## 1B Offline catalog
- [x] Casa Viva seed/import fixture (cloud import from BizneCubano + casaviva.company, 284 items).
- [x] Product/category/SKU/barcode local repository (catalog pull, categories, variants, photos cached offline).
- [x] Search by name/SKU/barcode.
- [ ] Favorites/quick products.
- [~] Android camera scanner offline (continuous scanning built; needs a field test with real barcodes).
- [~] Desktop HID scanner (keyboard-wedge reader supported; needs a test with the shop's reader).

## 1C Sale
- [x] Cart quantity/add/remove (with undo).
- [x] Explicit safe money contract (minor units, Rust validates lines and payments).
- [x] Configurable payment methods (USD/CUP cash, CUP transfer, MLC, Zelle with surcharge, USDT/crypto; owner rates).
- [x] Atomic sale + lines + payment + inventory movement + outbox.
- [x] Digital receipt/share.
- [~] Sale survives forced restart (single SQLite transaction; explicit kill-during-sale test pending).

## 1D Cash shift
- [x] Open shift.
- [x] Cash in/out with reason (and expenses).
- [x] Expected cash (per currency).
- [x] Close/count/difference (reason required when it does not match).
- [x] No printer required.

## 1E Sync prototype
- [x] Test business/branch/device provisioning (device identity from the key).
- [x] Idempotent push.
- [x] Pull catalog/order changes (catalog, stock, rates).
- [ ] 8-hour airplane-mode simulation.
- [~] Retry never duplicates sale/payment/stock movement (idempotent by IDs in tests; store alignment is local-only; long offline run pending).

## Also built (beyond the original list)
Fiado, messenger cash, returns, locations/counts/transfers, consignment, low-stock warnings, owner dashboard (summary, catalog, rates, devices), Casa Viva brand on POS and dashboard.

## Required tests
Domain; SQLite migrations; atomicity/crash; idempotency; inventory invariants; cash reconciliation; Android offline scanner; narrow touch UI; Windows HID; existing NEXO regression.

## Pilot exit
Casa Viva completes a simulated operating day on Android phone only and Windows, survives restart/Internet outage, and converges to cloud without duplicates.
