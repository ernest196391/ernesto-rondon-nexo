# Phase 1 — Casa Viva POS Checklist
## 1A Skeleton
- [ ] Add workspace tooling without breaking current Next app.
- [ ] Create pure business-domain.
- [ ] SQLite migration runner/local schema.
- [ ] Validate shared Tauri Android + Windows structure.
- [ ] Existing NEXO build/tests remain green.

## 1B Offline catalog
- [ ] Casa Viva seed/import fixture.
- [ ] Product/category/SKU/barcode local repository.
- [ ] Search by name/SKU/barcode.
- [ ] Favorites/quick products.
- [ ] Android camera scanner offline.
- [ ] Desktop HID scanner.

## 1C Sale
- [ ] Cart quantity/add/remove.
- [ ] Explicit safe money contract.
- [ ] Configurable payment methods.
- [ ] Atomic sale + lines + payment + inventory movement + outbox.
- [ ] Digital receipt/share.
- [ ] Sale survives forced restart.

## 1D Cash shift
- [ ] Open shift.
- [ ] Cash in/out with reason.
- [ ] Expected cash.
- [ ] Close/count/difference.
- [ ] No printer required.

## 1E Sync prototype
- [ ] Test business/branch/device provisioning.
- [ ] Idempotent push.
- [ ] Pull catalog/order changes.
- [ ] 8-hour airplane-mode simulation.
- [ ] Retry never duplicates sale/payment/stock movement.

## Required tests
Domain; SQLite migrations; atomicity/crash; idempotency; inventory invariants; cash reconciliation; Android offline scanner; narrow touch UI; Windows HID; existing NEXO regression.

## Pilot exit
Casa Viva completes a simulated operating day on Android phone only and Windows, survives restart/Internet outage, and converges to cloud without duplicates.
