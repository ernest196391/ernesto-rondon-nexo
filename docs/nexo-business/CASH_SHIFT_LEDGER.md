# NEXO Business — Cash Shift Ledger (Turno de Caja)

**Updated:** 2026-10-02
**Status:** backend foundation implemented on branch `claude/reusable-financial-model`; no UI yet. Rails, sources and external refs (0005) are described in `FINANCIAL_MODEL.md`.
**Applies to:** `packages/business-db`, `packages/business-domain`, `apps/business-pos/src-tauri`

## Scope of this block
Open shift, opening float, cash in/out, mandatory reason, expected cash, close, real count, difference, traceability, offline operation. Multi-currency (CUP/USD/MLC, extensible) and physical cash vs non-cash, per `PRODUCT_DECISIONS_V1.md` §1 and §10 and `CUBA_RETAIL_PLATFORM_MODEL.md` §6.

Out of scope here: POS UI, cloud sync of the new events, receivables/fiado, consignment, returns/refunds, messenger settlement workflow, accounting journal.

## Migration strategy
- `0003_cash_shifts.sql` (spike from main) is **kept unchanged**. It was never registered in the device migration list before this block, but keeping its bytes avoids a checksum mismatch on any device that may have applied it from a local build.
- `0004_cash_ledger_multicurrency.sql` is purely additive (`ALTER TABLE ADD COLUMN`, new tables, triggers).
- The device migration list now lives in `packages/business-db/rust/src/lib.rs` (`MIGRATIONS`) and `apps/business-pos/src-tauri/src/lib.rs` registers it with the Tauri SQL plugin. Tests run the exact same list.

## Data model
| Table | Role |
|---|---|
| `local_cash_shifts` (0003 + 0004 cols) | One row per shift: business/branch/device, primary currency, open/closed, operator who opened/closed, close note. 0003 single-currency columns mirror the primary currency. |
| `local_cash_shift_currencies` | Currencies tracked by the shift drawer. Each must be counted to close. |
| `local_cash_movements` (0003 + 0004 cols) | Append-only ledger. `kind`: `opening_float`, `cash_in`, `cash_out`, `expense`, `correction`, `order_cash`, `messenger_return`. Each row has currency, amount > 0, direction, reason, optional category/source_type/source_id/operator/corrects_movement_id. |
| `local_cash_shift_counts` | Immutable close result per currency: expected, counted, difference (`difference = counted − expected` enforced by CHECK). |
| `local_sales.shift_id` (0003) | Links a POS sale to the device's open shift. |

## Expected cash
Per currency:

```
expected = opening floats + POS cash payments + other cash in − cash out
```

- POS sale cash is derived from `local_payments` on rail `cash` (or legacy rows with `method = 'cash'` and no rail) of sales whose `shift_id` is the shift. It is not copied into the movement ledger, so it can never be double-counted.
- Transfers and any non-`cash` method never change expected drawer cash.
- A cash out (or out-correction) cannot exceed the current expected cash of that currency.

## Invariants (enforced in SQLite triggers, not only in code)
- One open shift per business/branch/device (0003 unique partial index); several devices can have open shifts at the same time.
- Movements and sales can only be attached to an **open** shift.
- Movement business columns cannot be updated or deleted; only `sync_status` may change. Mistakes are fixed with a `correction` that references a movement of the same shift.
- Kind/direction coherence; currency required on 0004 movements.
- Shift opening data is immutable; a closed shift cannot be reopened or re-closed; shifts cannot be deleted.
- A shift can only close when every tracked currency has a count row.
- Counts are immutable and written only while the shift is open (same transaction as the close).

## Repository (Rust, `nexo-business-db` crate)
`packages/business-db/rust/src/cash_shift.rs`

| Function | Transaction contents |
|---|---|
| `open_shift` | shift + tracked currencies + opening-float movements + outbox `cash_shift.opened` |
| `record_movement` | movement + outbox `cash_movement.recorded` |
| `close_shift` | counts per currency + shift close + outbox `cash_shift.closed` |
| `shift_summary`, `current_open_shift`, `currency_totals` | read only |
| `shift_for_sale` | used inside `complete_sale`'s transaction to attach the sale and track its currency |

All writes use caller-supplied IDs and are idempotent: re-sending the same open/movement/close returns the existing result without new rows or outbox events. A close retry with different counts is rejected.

## Tauri commands
`cash_shift_current`, `cash_shift_open`, `cash_shift_record_movement`, `cash_shift_close`, `cash_shift_summary`. Inputs are camelCase JSON (`OpenShiftInput`, `RecordMovementInput`, `CloseShiftInput`); amounts are integer minor units. The business/branch/device scope comes from the Rust side (`pilot_scope()`), not from the UI.

`complete_sale` now attaches the sale to the open shift when one exists and adds a nullable `shift_id` to the sale outbox payload. With no open shift, the sale insert is the same as before.

## TypeScript domain
`packages/business-domain/src/cash-shift.ts`: original single-currency helpers kept; added `CashLedgerKind`, `validateLedgerEntry`, `isDrawerCash`, `expectedCashByCurrency`, `reconcileShiftClose`, `normalizeCashCurrency`. They mirror the Rust rules for UI previews and sync validation.

## Known limits / next steps
1. No POS UI yet (deliberately: `main.ts` is owned by the mobile UX lane).
2. Sale currency is still hardcoded to USD and payment to `cash` in `complete_sale`; configurable payment methods/currency is a separate block.
3. Operator identity is a free string until PIN/login exists.
4. Returns/refunds do not yet reduce shift cash.
5. Cloud sync of `cash_shift.*` / `cash_movement.*` events is not implemented.
6. CI does not run `cargo test` for `packages/business-db/rust` yet.
