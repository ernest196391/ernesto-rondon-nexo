# Repositorios y despliegues

| Componente | Repositorio/rama real | Plataforma | URL/estado |
|---|---|---|---|
| NEXO + Studio actual | `ernest196391/ernesto-rondon-nexo`, `main` | Render (`ernesto-rondon-nexo`) | `nexotienda.casavivadecuba.com`, 200 |
| worker NEXO | mismo repo, `worker/` | Render (`nexo-content-worker`) | documentado; no sondeado públicamente |
| DB NEXO | schema en código `lib/*/db.ts` | Render Postgres `nexo-studio` | app funcional; expiración Free documentada 2026-09-23 |
| Cuyana | `ernest196391/cuyana-app`, `main` | Vercel según proyecto; ID no accesible | `cuyana.casavivadecuba.com`, 200 |
| DB Cuyana | migraciones remotas | Supabase `dkiiknsfbefpkrnmbzid` | ACTIVE_HEALTHY, 7 migraciones |
| Casa Viva | `ernest196391/Casa-Viva`, `main` | WordPress/Hostinger | referencia operativa; no modificado |

No había PRs abiertos en NEXO ni Cuyana al iniciar. NEXO tenía numerosas ramas remotas históricas; no se trataron como despliegues activos. Confirmar desde panel Render/Vercel el SHA exacto antes de cualquier release.
