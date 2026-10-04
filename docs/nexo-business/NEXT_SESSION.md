# NEXO Business — start here (short handoff)

Read this first in a new session; open STATUS.md / AI_HANDOFF.md only for the part you touch.

## Where things are (2026-10-03)
- **Repo:** `C:\Users\Ernesto\ernesto-rondon-nexo`, branch `main`. Work on a `claude/<block>` branch, merge `--no-ff` to `main` (owner authorized merges).
- **POS (Tauri, Windows + Android):** `apps/business-pos`. Local SQLite migrations `packages/business-db/migrations` 0001–0017 (line endings pinned in `.gitattributes`; never edit an applied migration). Rust repos in `packages/business-db/rust/src` (`cargo test` there). Operations UI in `src/finance.ts`, sync/catalog pull in `src/sync.ts`; `main.ts` only mounts them.
- **Cloud:** Supabase `nexo-production` (`viwwlriwlwodrfukbgbj`), schema `nexo_business`. Migrations in `supabase/migrations` (apply with the Supabase MCP `apply_migration`). Edge Functions in `supabase/functions` (deploy: `npx.cmd supabase functions deploy <name> --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api`; CLI is logged in on this laptop).
- **Owner dashboard:** https://nexo-negocio.vercel.app (`apps/business-dashboard/index.html`), Vercel project `nexo-negocio` deploys from Git (`create_deployment` with `gitSource` ref `main`).
- **Catalog:** follows BizneCubano (`catalog_sources.kind='biznecubano'`), website `https://casaviva.company` supplies variants; hourly import at :50 (pg_cron). Never write to BizneCubano or WooCommerce.
- **Secrets (never print or commit):** `%APPDATA%\com.nexo.business\device-tokens-NO-COMPARTIR.txt`, `import-key-NO-COMPARTIR.txt`.

## Build/test shortcuts
- Windows POS: `npm.cmd run tauri -- build --debug --no-bundle` in `apps/business-pos`; exe `D:\NexoBuild\target\debug\nexo-business-pos.exe`.
- Android (Redmi 9A, armv7): `npm.cmd run tauri -- android build --debug --apk --target armv7` (fails at symlink: expected), copy `D:\NexoBuild\target\armv7-linux-androideabi\debug\libnexo_business_pos_lib.so` to `src-tauri/gen/android/app/src/main/jniLibs/armeabi-v7a/`, then `gradlew.bat assembleArmDebug -x rustBuildArmDebug`; install with `D:\Android\Sdk\platform-tools\adb.exe install -r`.
- Test UI writes only on a copy of the pilot DB and restore it (see AI_HANDOFF).

## Open items
1. Next block: field tests (scanner, USB reader, forced restart) and a full offline shift + 8-hour airplane-mode run (STATUS "Next executable block").
2. Owner: initial physical counts for untracked items; min stock in the dashboard; set CUP/MLC/USDT rates in the dashboard (Tasas de cambio). Supabase Site URL done by the owner 2026-10-03; dashboard redeployed with the rates editor (dpl_8Ficz5iYi2g5vNSzz65npieHutEX).
