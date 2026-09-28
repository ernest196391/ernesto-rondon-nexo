# ADR-001 — Offline-first synchronization
**Status:** Accepted for implementation spike
**Date:** 2026-09-28

## Context
Casa Viva and future low-resource businesses must keep selling without Internet. Android phone-only operation is mandatory; Android and Windows may both create transactions.

## Decision
SQLite is the operational database on POS clients; Supabase/Postgres is the converged cloud system. Client transactional IDs are UUIDs. Every local mutation commits its domain rows and an outbox record atomically. Sync is idempotent push plus ordered pull/checkpoint.

## Push
1. Commit domain rows + outbox operation in one SQLite transaction.
2. Send operation UUID, device, tenant, entity and payload.
3. Server authenticates membership/device and validates invariants.
4. Server records operation UUID uniquely while applying effect.
5. Retry returns prior success; it never duplicates sale/payment/movement.

## Pull
Cloud exposes ordered tenant changes. Each device persists a checkpoint and pulls pages after it.

## Conflicts
- Sales/payments/cash/inventory movements: append-only; never generic last-write-wins.
- Product/category edits: optimistic version check.
- Prices: versioned/effective records.
- Stock: derived from immutable inventory movements.
- Cash: derived from shift/movement ledger.
- Web orders: stable external reference; duplicates rejected.

## Offline auth
A provisioned device retains scoped local capability/PIN for permitted offline work. Cloud-sensitive administration requires reconnection. Secure credential storage is finalized after Android/Windows spike.

## Recovery
Outbox survives restart. Failed operations retry with bounded backoff and visible Sync Error. No destructive clear-queue control.

## WooCommerce boundary
Current NEXO checkout/catalog depend on Woo/network calls. Woo remains a storefront connector, not POS source of truth. Stable NEXO Business IDs map to Woo IDs via external_refs.
