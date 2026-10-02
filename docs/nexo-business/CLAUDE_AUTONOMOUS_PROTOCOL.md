# NEXO Business — Claude Autonomous Execution Protocol

**Purpose:** allow Claude Code to advance NEXO Business with minimal owner intervention while preserving safety, repository integrity and verified checkpoints.

## Operating mode

Claude Code may work autonomously on NEXO Business when the owner asks it to continue.

It should:
1. inspect current repo state;
2. read NEXO source-of-truth docs;
3. choose the next executable task from STATUS/roadmap;
4. implement one bounded functional block;
5. run all available checks;
6. use the local Android/Windows toolchain when relevant;
7. commit and push its branch;
8. open a PR when supported, or provide the compare URL if GitHub CLI is unavailable;
9. update STATUS and handoff docs;
10. continue to the next safe block without asking about minor technical decisions.

## Source of truth order

For NEXO Business work, read:

1. `docs/nexo-business/STATUS.md`
2. `docs/nexo-business/AI_HANDOFF.md`
3. `docs/nexo-business/CUBA_RETAIL_PLATFORM_MODEL.md`
4. `docs/nexo-business/PRODUCT_DECISIONS_V1.md`
5. `docs/nexo-business/MASTER_BLUEPRINT.md`
6. `docs/nexo-business/TECHNICAL_ARCHITECTURE.md`
7. `docs/nexo-business/PHASE-1-CHECKLIST.md`
8. `docs/nexo-business/ADR-001-OFFLINE-SYNC.md`
9. integration/connector docs relevant to the task
10. current code, migrations, recent commits and CI.

Repository/migration reality beats stale documentation. Fix docs when reality changes.

## Autonomy boundaries

Claude MAY autonomously:
- create/update feature branches;
- edit NEXO Business code/docs/tests;
- add versioned migrations;
- run npm/cargo/tauri/adb commands;
- build Windows/Android artifacts;
- install debug APKs on a connected development phone;
- inspect app logs;
- run unit/integration/build checks;
- commit and push;
- resolve ordinary merge/rebase conflicts while preserving newer verified behavior;
- make small implementation choices that do not alter approved product semantics;
- continue through successive roadmap blocks when each previous block is verified.

Claude MUST stop and ask before:
- destructive production data changes;
- deleting/migrating real customer/order data;
- rotating or exposing secrets;
- changing production authority between Woo/Axis/NEXO;
- deploying irreversible schema changes to production cloud;
- purchasing services or creating paid resources;
- changing commercial pricing/product commitments;
- bypassing security controls;
- force-pushing shared main;
- removing a working subsystem instead of extending it;
- making a product decision not covered by approved docs.

## Git workflow

Prefer a feature branch per bounded block.

Before editing:
```
git status
git fetch origin
```

Base new work on current `origin/main`.

Before committing:
- fetch again;
- compare against `origin/main`;
- rebase when safe;
- preserve newer verified work.

Do not mix unrelated blocks in one commit/PR.

Never use force push on `main`.

## Local environment already available

Do not assume Android tooling is missing without checking these paths.

Repository:
`C:\Users\Ernesto\ernesto-rondon-nexo`

POS:
`C:\Users\Ernesto\ernesto-rondon-nexo\apps\business-pos`

Android SDK:
`D:\Android\Sdk`

ADB:
`D:\Android\Sdk\platform-tools\adb.exe`

NDK:
`D:\Android\Sdk\ndk\28.2.13676358`

Android Studio:
`C:\Program Files\Android\Android Studio`

JAVA_HOME target:
`C:\Program Files\Android\Android Studio\jbr`

Cargo target:
`D:\NexoBuild\target`

Universal debug APK:
`C:\Users\Ernesto\ernesto-rondon-nexo\apps\business-pos\src-tauri\gen\android\app\build\outputs\apk\universal\debug\app-universal-debug.apk`

Use `npm.cmd`, not `npm`, from PowerShell.

Before saying ADB is unavailable, run:
`D:\Android\Sdk\platform-tools\adb.exe devices`

If a phone is connected/authorized, Claude may build, install and inspect the debug app.

## Verification ladder

Always distinguish:
- implemented;
- typechecked/compiled;
- unit tested;
- installed;
- manually exercised;
- physical-device verified;
- production verified.

Compilation alone is never a physical-device PASS.

## Android autonomous test flow

When relevant:
1. check ADB device;
2. build current Android debug APK;
3. install with `adb install -r`;
4. launch/test only non-destructive development flows;
5. inspect persistence/logs;
6. record exactly what can and cannot be automatically verified.

Do not wipe app data unless explicitly necessary and approved; existing pilot SQLite data may be useful.

## Current product direction

NEXO Business is reusable/white-label for Cuban retail:
- online store;
- POS/cash;
- inventory by location;
- CRM;
- gestoras;
- messengers;
- management;
- credit/fiado;
- partial payments;
- consignment;
- returns/exchanges;
- operational finance;
- later accounting.

Casa Viva is the complex reference pilot.
Colo Shop is the connector pilot.
Estilo y Hogar is the next full reusable NEXO-native pilot.

## Current immediate technical direction

Do not treat the early cash-shift spike as final.

Advance the reusable financial foundation first:
- multi-currency;
- physical cash vs non-cash;
- payment rail;
- source type/id/external refs;
- operator;
- branch/location;
- expenses/corrections;
- expected/count/difference by currency;
- future receivable/consignment compatibility.

Avoid large UI work until the financial contract is stable, unless STATUS explicitly advances the project to UI.

## End-of-block handoff

Every completed block must leave:
- branch;
- commit SHA;
- PR or compare URL;
- files changed;
- tests/builds run and actual result;
- what was manually/device verified;
- what remains unverified;
- STATUS update;
- exact next task.

If the owner says "continúa" or equivalent, proceed to the next safe roadmap block without requesting approval for routine technical choices.
