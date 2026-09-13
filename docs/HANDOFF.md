# Relevo actual

## Hotfix 2026-09-13 — panel solar plegable

- Objetivo: reparar la imagen rota de `NEXO-SOLAR-FOLD-120W` en NEXO y en Cuyana.
- Resultado: reemplazo recibido del propietario, convertido a WebP 1080×720; eliminado el payload Base64 truncado; catálogo migrado a activo estático con versión `20260913`.
- Archivos: `public/catalog/owner/panel-solar-plegable-120w.webp`, `app/api/catalog-image/panel-120w/route.ts`, `lib/commerce/catalog-images.ts` y documentación operativa.
- Pruebas: ImageMagick decodifica el WebP; Vitest catálogo 5/5; typecheck PASS; build PASS.
- Commit/despliegue: pendiente al escribir este relevo; Render debe desplegar automáticamente desde `main`.
- Bloqueos: ninguno.
- Siguiente acción exacta: comprobar el activo versionado y las tarjetas del producto en NEXO y Cuyana después del despliegue.

- Fecha: 2026-09-11 UTC.
- Objetivo: continuar el Bloque 0 operativo de NEXO y certificar Render → Supabase.
- Resultado: copia certificada por conteos exactos de 27 tablas; `nexo-production`
  está saludable y conectado al runtime; importador temporal desactivado y artefactos
  temporales retirados. Corregido el conflicto de semillas duplicadas por SKU/Woo ID.
- Archivos: `docs/NEXO-BLOCK-0-CERTIFICATION-2026-09-11.md`,
  `docs/HANDOFF.md`, `lib/commerce/knowledge.ts` y
  `lib/commerce/knowledge-seeds.test.ts`; los artefactos temporales fueron eliminados
  por los commits `8590431` y `d42a52b`.
- Pruebas: typecheck PASS; Vitest 147/147 PASS; Next build PASS; health HTTP 200;
  `/api/knowledge/products?limit=3` HTTP 200; cero errores de runtime desde el corte.
- Despliegue: Render `c10b196` live desde 2026-09-12T01:24:57Z; conexión a
  Supabase confirmada por escritura/lectura productiva. Inventario posterior:
  47 registros, 37 SKU únicos y 29 IDs WooCommerce únicos.
- Bloqueos: Vercel no devuelve equipos/proyectos autorizados; proveedor de email aún
  pendiente; falta repetir el E2E comercial completo contra Supabase.
- Siguiente acción exacta: ejecutar login/admin/E2E comercial completo contra
  Supabase y configurar `RESEND_API_KEY` + `NEXO_EMAIL_FROM` para certificar un
  alta real de gestora.
