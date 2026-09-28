# NEXO Business — STATUS

**Last update:** 2026-09-28
**Pilot:** Casa Viva
**Current phase:** Phase 0 — Implementation Spike
**Overall state:** Implementation spike started: shared domain + local SQLite schema committed; Tauri shells/scanner integration next.

## What we are building
Offline-first, hardware-optional Android + Windows POS/business OS integrated with NEXO online stores. The minimum viable setup is one Android phone. Casa Viva is Pilot 01.

## Current decisions
- Android + Windows are first-class POS clients using a shared Tauri 2 + React + TypeScript core where practical.
- SQLite local on POS-capable clients.
- Android camera barcode/QR scanning is a Phase-1 requirement and must work offline after installation.
- Printer, dedicated scanner, cash drawer and scale are optional progressive enhancements; checkout must not depend on them.
- Supabase/Postgres cloud.
- Next.js web/admin.
- Offline sales are non-negotiable.
- Accounting and AI are later phases.
- Casa Viva first, then reusable/white-label.

## Work completed
- Existing NEXO reuse audit: cart, pricing, delivery, checkout/idempotency, Woo connector, admin inventory, Casa Viva contracts.
- Target Android + Windows package boundaries documented.
- schema-v0 SQL design created (not applied to production).
- ADR-001 offline synchronization accepted for spike.
- Phase-1 Casa Viva checklist created.
- Public AxisCloud product/ERP audit.
- NEXO Business scope and phased roadmap.
- Initial domain/data model.
- Offline sync principles.
- Casa Viva acceptance scenarios.
- Hardware accessibility ladder: phone-only → phone/PC → cheap peripherals → full POS counter.

## Next task — DO THIS FIRST
Start the implementation spike, without changing production commerce behavior:
1. establish workspace/package skeleton;
2. create pure business-domain package;
3. create local SQLite schema/migration prototype;
4. prove Tauri Android + Windows build strategy;
5. prove Android offline camera barcode scanning;
6. run existing NEXO tests/build and record regression result.

Do not apply schema-v0 to production Supabase yet. Do not migrate Woo data yet.

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

## Implementation spike checkpoint — 2026-09-28
- Added packages/business-domain with money, sale validation, outbox identity and scanner normalization.
- Added first offline SQLite migration under packages/business-db.
- Added Android and Windows app boundaries under apps/.
- Official Tauri SQL + barcode-scanner plugins selected for spike.
- Casa Viva integration remains read-only/contract-first.
- GitHub workflow had not yet surfaced a run at the immediate checkpoint; do not claim CI green until a run completes.

### Next executable block
Create the actual Tauri 2 shell in an isolated app workspace, wire SQLite migration, then Android barcode scan adapter. Validate Windows build strategy separately and record build prerequisites/costs.

## Local verification — Windows laptop — 2026-09-28
Verified on Node.js 24.19.0 / npm 11.17.0 / Git 2.55.0.windows.3:
- npm install completed (398 packages).
- Vitest: 35/35 test files passed, 151/151 tests passed.
- TypeScript: tsc --noEmit passed with no errors.
- Next.js 16.3.4 production build compiled successfully; 54/54 static pages generated.
- Node engine baseline updated from obsolete Node 20 range to >=24 <25 after this verification.

Next: Tauri 2 executable shell + local SQLite wiring. Android APK/device scan comes after desktop/local persistence proof.
