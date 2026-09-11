# NEXO — Bloque 0: Certificación Operativa

Fecha: 2026-09-11
Estado: PARCIALMENTE CERTIFICADO / E2E TRANSACCIONAL AÚN NO CERRADO

## Objetivo

Certificar la cadena operativa completa:

GESTORA → TIENDA → CLIENTE → CARRITO → CHECKOUT → PEDIDO → WOOCOMMERCE → STOCK → ATRIBUCIÓN → COMISIÓN → GESTORA → ADMIN → ESTADO

## Infraestructura

- Repositorio principal: `ernest196391/ernesto-rondon-nexo`
- Rama: `main`
- Render app: `ernesto-rondon-nexo`
- Render worker: `nexo-content-worker`
- Auto deploy: activo en ambos servicios
- Producción principal: `https://nexotienda.casavivadecuba.com`
- Último deploy auditado: LIVE

## Certificación por tramo

### 1. Tienda pública → carrito
Estado: IMPLEMENTADO / NO EJECUTADO END-TO-END EN ESTA AUDITORÍA

`/api/commerce/cart` crea sesión de carrito, conserva referral y proyecta precios comerciales por gestora.

### 2. Carrito → checkout
Estado: IMPLEMENTADO

`/api/commerce/checkout` valida datos, crea pedido WooCommerce y aplica idempotencia.

### 3. Checkout → atribución
Estado: IMPLEMENTADO

Metadata relevante que se escribe en WooCommerce:

- `_nexo_marketplace_order`
- `_nexo_checkout_idempotency_key`
- `_nexo_referral_requested`
- `_nexo_referral_effective`
- `_nexo_effective_gestora_id`
- `_nexo_effective_gestora_name`
- `_nexo_effective_gestora_slug`
- `_nexo_order_origin`
- `_nexo_attribution_source`
- `_nexo_ledger_owner`

### 4. Checkout → snapshot comercial
Estado: IMPLEMENTADO

Se crea `nexo_order_commercial_snapshots` y se registra fallo de reconciliación si la escritura posterior al pedido falla.

### 5. Gestora → selección de productos
Estado: CORREGIDO

Una selección vacía ya no publica todo el catálogo. `commercialStorefront()` filtra exclusivamente por los IDs seleccionados.

### 6. Admin
Estado: IMPLEMENTADO Y PROTEGIDO POR ROL

`/admin` comprueba actor autenticado y exige `role === "admin"` antes de cargar el centro de control.

### 7. Pedidos admin
Estado: IMPLEMENTADO

Existen `/admin/pedidos` y `/admin/pedidos/[id]` con detalle operativo y acciones.

### 8. Render / producción
Estado: VALIDADO

Los servicios están activos y el último deploy auditado terminó `live`. Los scripts de sincronización de catálogo están ejecutándose correctamente en el arranque.

## Hallazgos críticos

### P0 — Base de datos Render expira

Postgres `nexo-studio` es Free y expira el 2026-09-23. Render elimina las bases Free tras su ventana de gracia si no se actualizan o migran.

Acción recomendada: migrar a una base Postgres persistente antes de esa fecha.

### P0 — Auditoría SQL directa bloqueada

La herramienta SQL externa no logra conectar porque el servidor exige SSL/TLS. La aplicación sí usa `DATABASE_URL`, pero la inspección directa desde el conector falla.

### P0 — Registro de gestoras no obliga verificación de email

`app/api/gestoras/auth/register/route.ts` calcula `verifiedEmail(...)`, pero actualmente no compara el email verificado con el email que intenta registrarse. Además, el flujo `app/impulsa/login/page.tsx` pasa desde la pantalla inicial directamente a registro sin solicitar el código de verificación.

Esto debe corregirse antes de considerar el onboarding certificado.

### P1 — Falta certificación transaccional completa

Aún debe ejecutarse una transacción controlada real que compruebe en una sola prueba:

1. tienda de una gestora activa;
2. producto seleccionado con stock conocido;
3. carrito con referral;
4. checkout;
5. creación de pedido Woo;
6. metadata de gestora;
7. snapshot comercial;
8. movimiento de comisión;
9. aparición en oficina de gestora;
10. aparición en admin;
11. cambio de estado;
12. efecto real sobre stock;
13. cancelación/reversión cuando corresponda.

## Resultado del Bloque 0

PASS:
- arquitectura de checkout;
- idempotencia;
- metadata de atribución;
- separación WooCommerce/NEXO;
- storefront de gestora filtrado;
- admin protegido por rol;
- Render y auto deploy;
- build actual en producción.

FAIL / BLOQUEADO:
- acceso SQL directo por SSL/TLS;
- onboarding no fuerza verificación de email;
- prueba E2E real completa no puede declararse cerrada sólo por inspección de código.

## Regla de cierre

El Bloque 0 sólo pasa a CERTIFICADO cuando una compra real de gestora atraviesa toda la cadena y sus efectos quedan comprobados en WooCommerce, Postgres, oficina de gestora y admin.

## Siguiente acción exacta

1. Resolver primero la continuidad de Postgres (migración recomendada a Supabase Free si el tamaño de la base cabe dentro del límite gratuito).
2. Corregir el flujo de verificación de email.
3. Ejecutar una compra E2E controlada con un producto de stock conocido.
4. Verificar atribución, snapshot, comisión, stock y admin.
5. Cancelar/revertir el pedido de prueba si corresponde y comprobar restauración.
