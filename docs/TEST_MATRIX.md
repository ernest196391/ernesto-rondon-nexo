# Matriz de pruebas — línea base 2026-09-11

| Proyecto | Comando/comprobación | Resultado |
|---|---|---|
| NEXO | `npm ci` | PASS; warning porque auditor usa Node 24 y repo exige 20 |
| NEXO | `npm test` | PASS: 33 archivos, 144 tests |
| NEXO | `npm run typecheck` | PASS |
| NEXO | `npm run lint` | PASS con 27 warnings, 0 errores |
| NEXO | `npm run build` | PASS; 52 páginas/rutas generadas |
| Cuyana | `npm ci` | PASS |
| Cuyana | `npm run build` | PASS; 6 rutas, sin ecommerce/legal |
| Cuyana | `npm run lint` | PASS, sin warnings |
| Casa Viva | `npm ci`, typecheck, lint, build | PASS; lint 77 warnings, 0 errores |
| Casa Viva | `npm run test:order-center` | PASS |
| Supabase Cuyana | listar esquema/migraciones | PASS: RLS en 7 tablas, 7 migraciones |
| URLs desktop/móvil | curl con UA desktop/Android | PASS: NEXO 200, Studio redirect/login 200, Cuyana 200 |
| 390 px visual autenticado | navegador con sesión | NOT RUN: sesión/conector no disponible |
| NEXO E2E transaccional | pedido real y reversión | NOT RUN: fuera de Bloque 0 y altera datos |
| secretos en cambios | patrones y diff staged | ejecutar antes de commit |

El build no demuestra funcionamiento E2E de servicios externos. Los `CREATE TABLE IF NOT EXISTS` en runtime de NEXO no sustituyen migraciones versionadas; riesgo registrado para Bloque 1.
