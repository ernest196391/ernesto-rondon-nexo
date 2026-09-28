# NEXO Business — AI Handoff / Resume Here

**Updated:** 2026-09-28  
**Purpose:** Let any coding AI resume the project safely without prior chat history.

## Read this first

Do not infer project state from an old chat. Read, in this order:
1. `docs/nexo-business/STATUS.md`
2. `docs/nexo-business/MASTER_BLUEPRINT.md`
3. `docs/nexo-business/TECHNICAL_ARCHITECTURE.md`
4. `docs/nexo-business/CONNECTORS_AND_SYNC.md`
5. `docs/nexo-business/PHASE-1-CHECKLIST.md`
6. current code and recent commits

At the end of every completed work block:
- run relevant tests/typecheck/build;
- update `STATUS.md`;
- record what is proven vs only planned;
- leave the next executable task explicit.

## Product in one sentence

NEXO Business is an offline-first, hardware-optional business operating system and integration platform connecting physical sales, inventory, online orders, customers and management across Windows, Android and the web.

## Product strategy

There are two complementary modes.

### 1. NEXO-native businesses
NEXO Business supplies POS + inventory + cash + orders + sync.

**Pilot 01: Casa Viva.**

### 2. Existing-system businesses
The merchant keeps its current POS/ERP and NEXO adds the digital-commerce, synchronization and automation layer.

**Pilot 02: Colo Shop using AxisSoft.**

Do not fork these into separate products.

## Accepted architecture

- Shared POS shell: `apps/business-pos`
- Target: Windows + Android through Tauri 2
- Local persistence: SQLite
- Cloud: Supabase/Postgres + Auth + RLS
- Web/admin/storefront: Next.js
- Provider-neutral business rules: `packages/business-domain`
- Local DB/migrations: `packages/business-db`
- Sync/outbox/conflict logic: target `packages/business-sync`
- External adapters: target `packages/business-connectors`
- Offline selling is non-negotiable
- Scanner/printer/cash drawer are adapters, never core checkout dependencies

## Current implementation reality

As of this document:
- the repository has the shared `apps/business-pos` vertical-slice scaffold;
- current frontend code opens a Tauri SQL SQLite database;
- the demo seeds/searches products, creates a demo sale and queues a demo outbox record;
- `packages/business-domain` contains initial money/sale/outbox/scanner primitives;
- `packages/business-db/migrations/0001_local_core.sql` contains initial local core tables;
- the main NEXO Windows verification previously passed Vitest 151/151, TypeScript and Next.js production build;
- architecture converged Windows + Android onto one shared POS shell.

Important: inspect the actual repository before claiming native Windows packaging, Android APK, scanner integration, production migrations or cloud sync are complete. Distinguish scaffold/prototype from proven executable behavior.

## Accepted decision — NEXO Sync

NEXO Sync is **inside NEXO Business**, not a new repository.

It consists of:
- provider-neutral sync mechanics in `business-sync`;
- provider adapters in `business-connectors`;
- audit/checkpoint/diff behavior;
- storefront/cloud propagation.

First external connector: AxisSoft for Colo Shop.

### Axis rule
Axis remains the source of truth for physical catalog/price/stock during the first stage.

Implementation sequence:
1. supported export/import if available;
2. semi-automatic diff + review;
3. watched/scheduled export if feasible;
4. official API read integration if Axis supports it;
5. bidirectional writes only through documented/supported Axis capability.

Never write directly to undocumented Axis internals.

## Desired merchant experience

```text
Axis / existing POS
        |
        v
NEXO connector
        |
        v
NEXO normalized catalog + sync
        |
        +--> online store
        +--> orders
        +--> analytics
        +--> future automations
```

For a business with no existing POS, NEXO itself supplies the source system.

## Domain invariant to preserve

A product can have external identities. The existing `ProductIdentity.externalRefs` concept is the mapping anchor.

Do not make Axis-specific fields part of the core product entity unless generalized as external-reference concepts.

## Guardrails

- Do not rewrite working NEXO commerce blindly.
- Do not break the current storefront while building POS.
- Do not apply unfinished schema to production Supabase.
- Do not migrate Woo data until migration design is proven.
- No service-role secrets in clients.
- No blind last-write-wins for stock/cash.
- No duplicate products on repeated import.
- No online sale should silently oversell because of an unhandled sync race.
- Do not promise Axis API support until verified.
- Do not expand into accounting before sales/inventory/cash invariants are stable.

## Current commercial context

Colo Shop already has a working online-store implementation and uses AxisSoft in the physical operation.

NEXO's commercial promise is not another website or another POS. The operational direction is:
- merchant keeps running the business;
- NEXO removes technical/duplicate work;
- online catalog becomes easier to keep current;
- NEXO progressively connects storefront, inventory, orders, analytics and automation.

Unsupported external integration must remain labeled planned/experimental until proven.

## How to choose the next task

First read `STATUS.md`.

If the shared Tauri shell/native packaging is still incomplete, continue that implementation spike before deep Axis integration.

Axis/Colo Shop work may proceed in parallel at the contract/fixture/import-adapter level without blocking the core POS spike.

The first Axis implementation should be a provider-neutral import fixture + mapping/diff test, not undocumented database access.

## Definition of done for any AI work block

A change is not complete until:
1. code is committed;
2. relevant tests/typecheck/build are run;
3. offline/error behavior is considered;
4. docs reflect reality;
5. `STATUS.md` states the new checkpoint and the next executable task.