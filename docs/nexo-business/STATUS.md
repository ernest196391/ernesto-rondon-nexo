# NEXO Business — STATUS

**Last update:** 2026-09-28
**Pilot:** Casa Viva
**Current phase:** Phase 0 — Foundation
**Overall state:** Blueprint created; implementation not started in this repo.

## What we are building
Offline-first Windows POS/business OS integrated with NEXO online stores. Casa Viva is Pilot 01.

## Current decisions
- Tauri + React + TypeScript desktop.
- SQLite local.
- Supabase/Postgres cloud.
- Next.js web/admin.
- Offline sales are non-negotiable.
- Accounting and AI are later phases.
- Casa Viva first, then reusable/white-label.

## Work completed
- Public AxisCloud product/ERP audit.
- NEXO Business scope and phased roadmap.
- Initial domain/data model.
- Offline sync principles.
- Casa Viva acceptance scenarios.

## Next task — DO THIS FIRST
Audit the existing NEXO codebase and Casa Viva integration points, then propose the exact monorepo/package structure without breaking current production behavior.

Expected output:
1. inventory of reusable existing modules;
2. proposed apps/packages layout;
3. schema-v0 SQL/ERD;
4. ADR-001 offline sync strategy;
5. Phase-1 task checklist;
6. tests required before implementation.

## Guardrails
- Do not rewrite working NEXO commerce blindly.
- Do not build accounting yet.
- Do not make cloud connectivity mandatory for checkout/POS.
- Do not expose Supabase service-role secrets client-side.
- Do not mark a phase complete without tests and updating this file.

## Resume protocol for any agent
Read in order:
1. docs/nexo-business/STATUS.md
2. docs/nexo-business/MASTER_BLUEPRINT.md
3. repository README and relevant architecture/docs
Then inspect current code before changing anything. Update STATUS.md at the end of every completed work block.
