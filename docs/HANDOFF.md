# Relevo actual

- Fecha: 2026-09-11 UTC
- Objetivo: iniciar Bloque 1 — repositorio independiente, contratos y núcleo multiempresa.
- Resultado: Bloque 0 fusionado en NEXO mediante PR #125; scaffold independiente preparado localmente con workspace, CI, contratos TypeScript y primera migración RLS. Todavía no se aplicó a una base remota.
- Archivos: raíz/workspaces, `packages/core-contracts`, `supabase/migrations`, `supabase/tests`, adaptadores y documentación compartida.
- Pruebas: ver `TEST_MATRIX.md`.
- Commit Bloque 0: `e14702f0da323a6128e0fb30af0a9518e6593c7f`; PR #125 fusionado. Commit Bloque 1 pendiente del repositorio remoto.
- Despliegue: no requerido; documentación solamente.
- Bloqueos: acceso al panel/conector Vercel para confirmar project ID y SHA de Cuyana; sesión de Studio para visual QA autenticado a 390 px.
- Siguiente acción exacta: crear el repositorio GitHub vacío `product-studio-one`, conectar/subir este scaffold y crear un proyecto Supabase de desarrollo independiente para verificar aislamiento RLS.
