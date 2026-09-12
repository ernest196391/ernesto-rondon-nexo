# Relevo actual

- Fecha: 2026-09-11 UTC.
- Objetivo: continuar el Bloque 0 operativo de NEXO y certificar Render → Supabase.
- Resultado: copia certificada por conteos exactos de 27 tablas; `nexo-production`
  está saludable y conectado al runtime; importador temporal desactivado y artefactos
  temporales retirados. Corregido el conflicto de semillas duplicadas por SKU/Woo ID.
- Archivos: `docs/NEXO-BLOCK-0-CERTIFICATION-2026-09-11.md`,
  `docs/HANDOFF.md`, `lib/commerce/knowledge.ts` y
  `lib/commerce/knowledge-seeds.test.ts`; los artefactos temporales fueron eliminados
  por los commits `8590431` y `d42a52b`.
- Pruebas: typecheck PASS; Vitest 147/147 PASS; Next build PASS.
- Despliegue observado: Render principal desplegando desde `d42a52b`; conexión a
  Supabase confirmada por escritura/lectura productiva.
- Bloqueos: falta desplegar y validar la corrección de semillas; Vercel no devuelve
  equipos/proyectos autorizados; proveedor de email aún pendiente.
- Siguiente acción exacta: desplegar este commit, verificar
  `/api/knowledge/products` y repetir login/admin/E2E comercial contra Supabase.
