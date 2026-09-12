# NEXO — Bloque 0: Certificación Operativa

Fecha: 2026-09-11
Estado: AVANZADO / DOS DEPENDENCIAS EXTERNAS PENDIENTES

## Objetivo

Certificar y proteger la cadena operativa completa:

GESTORA → TIENDA → CLIENTE → CARRITO → CHECKOUT → PEDIDO → WOOCOMMERCE → STOCK → ATRIBUCIÓN → COMISIÓN → GESTORA → ADMIN → ESTADO

## Infraestructura

- Repositorio principal: `ernest196391/ernesto-rondon-nexo`
- Rama: `main`
- Render app: `ernesto-rondon-nexo`
- Render worker: `nexo-content-worker`
- Auto deploy: activo
- Producción principal: `https://nexotienda.casavivadecuba.com`
- WooCommerce continúa como fuente transaccional de catálogo, precio, stock y pedidos.
- NEXO DB conserva gestoras, atribución, snapshots, ledger, payouts, configuración administrativa y reconciliación.

## Estado de la cadena comercial

### E2E de gestora
Estado: CERTIFICADO

La prueba real de gestora completó registro, autenticación, referral, selección de producto, carrito, checkout, pedido WooCommerce, atribución `gestora_store`, snapshot comercial, ledger de comisión, visibilidad en la oficina de gestora y cancelación del pedido QA.

### Centro de Control v1
Estado: CERTIFICADO

Admin, pedidos, productos/inventario, variantes, gestoras, clientes, comisiones/pagos, marketing, analítica, configuración e incidencias están construidos y desplegados. Smoke técnico de producción: `NEXO_ADMIN_V1_QA_RESULT status=passed`.

## Riesgo 1 — Registro sin verificación real de email
Estado: CORREGIDO EN CÓDIGO / PROVEEDOR DE CORREO PENDIENTE

### FIX
- `app/api/gestoras/auth/register/route.ts` ahora exige que el email firmado en `nexo_email_verified` coincida exactamente con el email que intenta registrarse.
- Un registro sin cookie de email verificado responde 403 y no crea la gestora.
- `app/impulsa/login/page.tsx` ya no pasa directamente del correo al formulario de registro: primero solicita un código, obliga a verificarlo y después abre el registro.
- El correo del formulario final queda bloqueado para evitar cambiarlo después de verificar otro email.
- Reenvío de código separado del submit para evitar una ruta incorrecta.

### QA real
Resultado de producción:

`NEXO_BLOCK0_AUTH_QA_RESULT {"status":"passed","checks":{"login":200,"invalidEmailRequest":true,"unverifiedRegistrationBlocked":true},"emailConfig":{"resend":false,"from":false}}`

Esto certifica la protección del registro, pero también confirma que Render NO tiene configurados todavía:

- `RESEND_API_KEY`
- `NEXO_EMAIL_FROM`

Sin esas dos variables nadie puede recibir el código. La aplicación falla de forma segura: no deja saltarse la verificación.

## Riesgo 2 — Continuidad de la base de datos
Estado: COPIA CERTIFICADA / CORTE DE CONEXIÓN PENDIENTE

Postgres Render `nexo-studio` sigue en plan Free y expira el `2026-09-23T04:29:20.163684Z`.

La conexión directa del conector de Render sigue fallando porque exige SSL/TLS, aunque la aplicación sí conecta mediante `DATABASE_URL` y las pruebas dentro del servicio confirman que la base está operativa.

### Supabase comprobado el 11-sep-2026
Organización: `Ernesto Rondón` / `bwlootmoaihlmfpphlee`.

Proyectos:
- `gestor-remesas` — ACTIVE_HEALTHY — us-east-1
- `cuyana` — ACTIVE_HEALTHY — us-east-1
- `ernest196391's Project` — INACTIVE — eu-west-3

El plan Free permite 2 proyectos activos. Un intento de restaurar el proyecto inactivo fue rechazado por Supabase con el límite de `2 project limit`.

La capacidad se liberó y se creó el proyecto Supabase independiente `nexo-production`
(`viwwlriwlwodrfukbgbj`). El 11-sep-2026 se ejecutó la copia Render → Supabase.
El log `NEXO_DB_COPY_RESULT` terminó en `passed`, sin tablas desconocidas, y los
conteos de las 27 tablas coinciden exactamente con el destino.

El importador temporal quedó desactivado con JWT obligatorio y respuesta 404. La ruta
de exportación y el script temporal se retiraron del repositorio después de certificar
la copia.

El despliegue de Render quedó conectado a Supabase. La lectura productiva de
`/api/knowledge/products` alcanzó `nexo-production` y detectó un conflicto entre
dos semillas que describían el mismo SKU con identificadores distintos. El código
ahora deduplica las semillas por ID, SKU y producto WooCommerce, dando prioridad al
registro canónico enlazado con WooCommerce. No se pausó, borró ni sobrescribió Cuyana.

## Riesgo 3 — Scripts de QA/seed en cada arranque
Estado: ELIMINADO

Se retiraron del `start` normal los harness E2E, verificadores y el seed de proveedor que seguían ejecutándose en cada inicio aunque estuvieran protegidos. El arranque productivo queda reducido a la reconciliación de catálogo necesaria y `next start`.

## Estado actual del Bloque 0

PASS:
- E2E transaccional real de gestora;
- checkout e idempotencia;
- atribución y fallback de metadata WooCommerce;
- snapshot y comisión/ledger;
- oficina de gestora;
- Centro de Control v1;
- protección de registro contra email no verificado;
- onboarding obliga a pasar por código;
- build y producción;
- limpieza de scripts QA/seed del arranque.

PENDIENTE EXTERNO:
- configurar proveedor real de email (`RESEND_API_KEY` + `NEXO_EMAIL_FROM`) y realizar prueba de entrega;
- repetir el E2E comercial completo contra Supabase;
- mantener Render como rollback hasta certificar el corte.

## Regla de cierre

El Bloque 0 queda CERTIFICADO cuando:

1. una gestora real puede recibir y verificar el email de alta;
2. NEXO opera contra una base persistente que no tenga la caducidad actual del Render Free;
3. los conteos/esquema críticos coinciden antes y después de la migración;
4. una prueba E2E posterior al cambio de base vuelve a pasar.

## Siguiente acción exacta

La corrección de semillas quedó desplegada en Render mediante `c10b196`. Health y
conocimiento responden HTTP 200 y no hubo errores de runtime posteriores al
despliegue. La siguiente acción es repetir login, panel administrativo y E2E
comercial contra Supabase. Después, configurar el proveedor de correo y ejecutar
una alta real con verificación.
