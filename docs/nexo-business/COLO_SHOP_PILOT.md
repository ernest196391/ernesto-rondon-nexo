# Colo Shop — Pilot 02 Operating Contract

**Updated:** 2026-09-28  
**Status:** ACCEPTED / implementation guidance  
**System:** Colo Shop physical operation + AxisSoft + NEXO Business / NEXO Sync

## Why this pilot exists

Colo Shop is the first real validation of NEXO Business in **existing-system connector mode**.

The store already operates with AxisSoft on a Windows/PC counter setup and uses normal physical-store hardware such as printer and barcode scanner. NEXO must add digital commerce and automation **without forcing the merchant to replace the system it already uses**.

## Merchant outcome

The target experience is:

> The merchant keeps operating the business. NEXO removes duplicate technical work and keeps the online channel aligned with the physical operation with as little manual intervention as possible.

The owner should not have to learn or maintain a second inventory system just to keep the website current.

## Source of truth — first stage

Until a supported deeper Axis integration is proven:

- Axis is authoritative for physical catalog, price and stock.
- NEXO consumes supported exports or merchant-provided inventory changes.
- NEXO normalizes and maps the information.
- NEXO computes a diff before destructive/material changes.
- NEXO updates the online channel only through controlled NEXO workflows.

Do not invent an Axis API. Do not write to undocumented Axis internals.

## Launch principle

**Do not delay Colo Shop launch waiting for perfect Axis integration.**

Initial delivery should use the least-friction supported path:

1. Supported Axis export if available.
2. Assisted import into NEXO Sync.
3. Stable mapping by external ID / SKU / barcode.
4. Diff and validation.
5. Safe changes applied to the storefront.
6. Ambiguous/destructive changes sent for review.

This is the required v0.1 direction.

## What the merchant should have to do

Minimum operational burden:

- keep the physical Axis inventory accurate as part of normal store work;
- provide or generate the supported export when required in the first assisted phase;
- communicate major catalog/business changes that cannot be inferred from stock data;
- approve ambiguous product matches or material/destructive changes.

The merchant should **not** have to:

- manually maintain the same stock in the website and Axis;
- learn a complex web admin just to mark products out of stock;
- copy prices product by product;
- recreate products already known to Axis;
- understand APIs, databases, Supabase, Vercel or NEXO internals.

## What NEXO owns

NEXO is responsible for:

- import/connector UX;
- normalization;
- durable external identity mapping;
- deduplication;
- diff computation;
- validation;
- audit history;
- safe storefront propagation;
- retry/error handling;
- preserving last known-good storefront state when an import fails;
- progressively reducing the amount of manual work.

## Product identity invariant

One physical Axis product must map to one stable NEXO product.

Use provider-neutral external references. Repeated import of the same product must never create another product merely because the source file was imported again.

Preferred matching order when data is trustworthy:

1. stable Axis external ID;
2. stable SKU;
3. barcode;
4. explicit operator-reviewed mapping.

Never guess an ambiguous identity.

## Stock behavior

Expected first-stage behavior:

- stock > 0: online availability according to storefront policy;
- stock = 0: mark unavailable/out-of-stock according to storefront policy;
- restored stock: allow reactivation;
- malformed or incomplete source: do not wipe live inventory;
- stale source: surface warning rather than silently treating it as current.

Do not use blind last-write-wins when multiple sources can mutate stock.

## Price behavior

- Axis price is initially authoritative where the business confirms that this price should also drive the online channel.
- If future online-specific pricing exists, model it explicitly as a price list/rule; do not overwrite one channel silently with another.
- Every material price change should be auditable.

## Orders from the online store

Do **not** implement Axis write-back in v0.1.

Online orders can enter NEXO and follow the existing store fulfillment flow. Bidirectional Axis registration/reservation may be added later only if a documented/supported Axis write interface is verified and reconciliation/idempotency are proven.

## Hardware

Colo Shop's existing scanner/printer/counter equipment is useful test hardware for NEXO Business, but:

- scanner/printer integration must remain adapter-based;
- printer failure must never block a committed sale/order;
- no vendor-specific hardware dependency should leak into the domain.

## Success criteria for Pilot 02

Pilot 02 is successful when:

1. Colo Shop keeps using Axis normally.
2. NEXO can ingest a supported catalog/inventory source.
3. repeated imports do not duplicate products.
4. price changes are represented correctly.
5. out-of-stock items stop being sellable online according to policy.
6. restored stock can return online.
7. import failure cannot destroy the live catalog.
8. sync/import results are auditable.
9. staff no longer maintain the same catalog twice.
10. the store can launch before deep Axis integration exists.

## Commercial promise boundary

Safe promise:

> Keep working with the system you already use. NEXO connects and manages the digital channel around it, progressively removing duplicate work.

Do not promise:

- real-time Axis API integration before verification;
- bidirectional Axis writes before supported capability exists;
- perfect inventory accuracy when the source inventory itself is not maintained correctly.

## Relationship to the broader NEXO Business product

Pilot 01 — Casa Viva validates **NEXO-native mode**.  
Pilot 02 — Colo Shop validates **existing-system connector mode**.

Both must share:

- one provider-neutral domain;
- one sync philosophy;
- one external-identity strategy;
- one audit model;
- one cloud model.

Do not fork Colo Shop into a separate product or separate NEXO Sync repository.

## Parallel-work coordination rule

Another chat/agent may be advancing the shared desktop/Tauri implementation at the same time.

Before changing code:

1. read `docs/nexo-business/STATUS.md`;
2. inspect recent commits;
3. inspect the current implementation, not an old chat description;
4. preserve newer working desktop/Tauri progress;
5. keep Axis work initially isolated to contracts, fixtures, mapping/diff logic and connector boundaries unless the current status explicitly says otherwise.

This document defines the **Pilot 02 operational intent**. The repository state defines what is already implemented.
