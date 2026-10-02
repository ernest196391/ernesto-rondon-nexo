# NEXO Business — Reusable Financial Model v1

**Updated:** 2026-10-02
**Status:** design accepted for implementation. The cash drawer layer is implemented and unit-tested (branch `claude/reusable-financial-model`). Receivables, consignment, messenger custody and accounting are designed here but **not implemented**.
**Read with:** `PRODUCT_DECISIONS_V1.md` §1, §6, §8, §10 · `CUBA_RETAIL_PLATFORM_MODEL.md` §6 · `CASH_SHIFT_LEDGER.md` · Casa Viva `docs/ORDER_STATE_MODEL.md` (cash dimension) and `docs/NEXO_BUSINESS_INTEGRATION.md`.

## 1. Audit of the 0003 spike
| Item | Finding | Decision |
|---|---|---|
| `0003_cash_shifts.sql` | One currency per shift, no movement kind, no source, no operator, opening float only on the shift row, mutable rows. It was not in the device migration list on `main` (`lib.rs` registered only 1–2). | Keep the file byte-for-byte (a local build may have applied it). Extend it additively with 0004 and 0005. |
| `cash-shift.ts` | Single-currency math, a correct base for over/short. | Kept. Multi-currency, rail and source rules added beside it. |
| `cash-shift.test.ts` | 3 tests covering the spike math. | Kept unchanged and still passing. |

## 2. Core concepts (provider-neutral)
| Concept | Meaning | Where |
|---|---|---|
| **Money** | Integer minor units + currency code (`CUP`, `USD`, `MLC`; 3–16 uppercase alphanumerics, so digital assets fit later). Never floats. Currencies are never mixed in a sum, and no FX conversion happens in the ledger. | everywhere |
| **Payment** | A settlement of a sale or order. Has `method` (configurable label), **`rail`** and optional `provider`, `channel` and `external_ref`. | `local_payments` (0001 + 0005) |
| **Rail** | `cash`, `transfer`, `card`, `digital_asset`, `other`. Transfermóvil/EnZona are a `provider`/`channel` on rail `transfer`, not new rails. | 0005 |
| **Cash drawer (shift)** | Physical cash held by one device/operator at one location, per currency, between open and close. | `local_cash_shifts` + `local_cash_shift_currencies` |
| **Cash movement** | Append-only entry in a drawer. The `kind` says why the money moved. | `local_cash_movements` |
| **Source** | `source_system` (`nexo`, `woocommerce`, `axis`…) + `source_type` (`order`, `sale`, `expense`…) + `source_id`. | movements (0004/0005) |
| **External ref** | One external identity ↔ one NEXO entity, per tenant and system. | `local_external_refs` (0005) |
| **Operator / location** | Who did it and where. Nullable until PIN/login and the location model exist. | sales, shifts, movements |

## 3. Money flows and how each is recorded
| Flow | Recorded as | Drawer effect |
|---|---|---|
| POS sale paid in cash | sale + `payment(rail=cash)` linked to the open shift via `local_sales.shift_id` | + (derived, never copied into movements) |
| POS sale paid by transfer/card/digital | `payment(rail≠cash)` | none |
| Opening float | movement `opening_float` per currency | + |
| Manual cash in | movement `cash_in` + reason | + |
| Manual cash out | movement `cash_out` + reason | − (cannot exceed expected) |
| Expense (transport, messenger pay, small purchase, store) | movement `expense` + reason + `category` (configurable list) | − |
| Pickup-order cash at the counter | movement `order_cash` + source (order) | + |
| Messenger returns collected cash | movement `messenger_return` + source (order), one per currency for split USD/CUP collections | + |
| Mistake | movement `correction` + direction + `corrects_movement_id` + reason | ± |
| Close | one immutable count per currency: expected, counted, difference | none (snapshot) |

`expected(currency) = opening floats + cash-rail payments of linked sales + other in − out`.

## 4. Invariants
Enforced by **SQLite triggers/constraints** (so they hold even if a future caller skips the repository):
1. Amounts > 0; direction carries the sign. Kind and direction must agree.
2. Movements, counts and external refs are append-only. Only `sync_status` can change.
3. Movements, counts and sales attach only to an **open** shift. A closed shift cannot reopen, and shifts cannot be deleted.
4. A shift closes only when every tracked currency has a count. `difference = counted − expected` is a CHECK constraint.
5. One open shift per business/branch/device. Several devices can work in parallel.
6. A `cash` payment must be on rail `cash`, and rail `cash` must be method `cash`.
7. `order_cash` and `messenger_return` require a full source. The same order money (business, kind, source, currency) enters **one** drawer **once**, across all devices.
8. One external identity maps to one entity, and an entity has at most one identity per external system.

Enforced by the **Rust repository** (`packages/business-db/rust`):
9. Every write and its outbox event share one SQLite transaction.
10. Caller-supplied IDs make every write idempotent. A close retry with different counts is rejected.
11. Cash out cannot exceed the drawer's expected cash in that currency.
12. A device can only write to its own shift. The scope comes from the shell, not the UI.

## 5. Casa Viva mapping (adapter, not core)
Casa Viva's cash dimension `pending_return → returned → verified` stays in Casa Viva/WooCommerce. A Casa Viva adapter would:
- resolve the Woo order through `local_external_refs (entity_type='order', system='woocommerce')`;
- when Casa Viva marks `cash_returned`, record one `messenger_return` per currency from `_cvd_collection_amount_usd/_cup` with `source_system='woocommerce'`;
- never write Woo metadata from NEXO (Bridge 1 is read-only).

None of these rules name Casa Viva, Woo meta keys or gestora logic. Colo Shop/Axis and Estilo y Hogar use the same tables with different `source_system` values and configuration.

## 6. Designed, not implemented (next blocks)
- **Messenger custody:** money collected but not yet returned (`pending_return`) belongs to a *messenger custody* balance per messenger and currency, not to any drawer. It is settled by the `messenger_return` movement above, with the same source key.
- **Receivables / fiado / partial payment:** a sale with balance due creates a `receivable` (customer, currency, amount, due date). Payments later reference the receivable. Cash payments still enter the drawer through rail `cash`. Never store debt as free text or as a negative cash movement.
- **Consignment:** goods delivered to a wholesale client stay owned by the merchant at a `consignment` location (inventory ledger). Settlement creates a receivable or payment. Ownership, location and pending balance stay separate.
- **Returns/refunds:** a refund is a new payment-like entry linked to the original sale. A cash refund is an out movement (`sale_refund`, to add) with the sale as source. The original sale is never edited.
- **Gestora/operator commissions:** derived from attributed sales/orders in their own ledger, not from cash movements.
- **Accounting:** journal templates generated from these operational events (Phase 6). Not built now.

## 7. Verification status
- Implemented: migrations 0004/0005, Rust repository + Tauri commands, TS invariants.
- Tests passed: `cargo test` (24, real in-memory SQLite with the shipped migrations), `vitest` 160/160.
- Compiled: Linux `cargo check`/`clippy` of the POS shell only.
- Not tested: Windows/Android builds, migration upgrade over the existing pilot DBs, any UI, production.
