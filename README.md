# Ernesto Rondón — NEXO Pilot MVP

## NEXO Business active development

The repository also contains the active NEXO Business POS/business-OS work.

**Any coding AI touching NEXO Business must start here:**
1. `docs/nexo-business/STATUS.md`
2. `docs/nexo-business/AI_HANDOFF.md`
3. `docs/nexo-business/MASTER_BLUEPRINT.md`
4. `docs/nexo-business/TECHNICAL_ARCHITECTURE.md`
5. `docs/nexo-business/CONNECTORS_AND_SYNC.md`
6. `docs/nexo-business/COLO_SHOP_PILOT.md`

Current pilots:
- **Pilot 01 — Casa Viva:** NEXO-native offline-first POS/business system.
- **Pilot 02 — Colo Shop + AxisSoft:** external-system connector mode using NEXO Sync.

Do not create a separate NEXO Sync repository. NEXO Sync is an internal capability of NEXO Business.

If another chat/agent is advancing the Tauri/Windows implementation, inspect recent commits and current code before editing. Never overwrite newer working implementation to match stale chat context.


First end-to-end build produced by NEXO Skill Master.

## Run
```bash
npm install
npm run dev
```

## Current scope
- Responsive personal/business portfolio.
- Projects section.
- About page based only on previously supplied factual material.
- NEXO Business Analyzer UI.
- Safe deterministic analyzer stub; it is explicitly NOT presented as live AI.
- No personal email/phone exposed.
- No fabricated testimonials, revenue, press or metrics.

## Next build slice
1. Connect the analyzer to an AI model server-side.
2. Add structured 0–100 NEXO scoring and JSON schema.
3. Add lead capture after useful analysis.
4. Add analytics events.
5. QA and then publish through GitHub/Hostinger.
