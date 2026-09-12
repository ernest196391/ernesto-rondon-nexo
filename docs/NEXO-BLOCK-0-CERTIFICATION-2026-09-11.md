# NEXO — Bloque 0: Certificación Operativa

Fecha: 2026-09-11
Estado: INFRAESTRUCTURA CERTIFICADA / PRUEBA REAL DE ENTREGA DE EMAIL PENDIENTE

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
- Supabase `nexo-production` (`viwwlriwlwodrfukbgbj`) es la base persistente de NEXO para gestoras, atribución, snapshots, ledger, payouts, configuración administrativa, reconciliación, Product Studio y Knowledge Base.

## Estado de la cadena comercial

### E2E de gestora
Estado: CERTIFICADO

La prueba real de gestora completó registro, autenticación, referral, selección de producto, carrito, checkout, pedido WooCommerce, atribución `gestora_store`, snapshot comercial, ledger de comisión, visibilidad en la oficina de gestora y cancelación del pedido QA.

### Centro de Control v1
Estado: CERTIFICADO

Admin, pedidos, productos/inventario, variantes, gestoras, clientes, comisiones/pagos, marketing, analítica, configuración e incidencias están construidos y desplegados. Smoke técnico de producción: `NEXO_ADMIN_V1_QA_RESULT status=passed`.

## Riesgo 1 — Registro sin verificación real de email
Estado: CORREGIDO EN CÓDIGO / PROVEEDOR CONFIGURADO / ENTREGA REAL PENDIENTE

### FIX
- `app/api/gestoras/auth/register/route.ts` exige que el email firmado en `nexo_email_verified` coincida exactamente con el email que intenta registrarse.
- Un registro sin cookie de email verificado responde 403 y no crea la gestora.
- `app/impulsa/login/page.tsx` solicita código, obliga a verificarlo y después abre el registro.
- El correo del formulario final queda bloqueado para evitar cambiarlo después de verificar otro email.
- Reenvío de código separado del submit para evitar una ruta incorrecta.

### Proveedor
- Resend configurado.
- Dominio `correo.nexotienda.casavivadecuba.com` verificado por DNS.
- Render contiene `RESEND_API_KEY` y `NEXO_EMAIL_FROM`.
- Remitente previsto: `NEXO <acceso@correo.nexotienda.casavivadecuba.com>`.

### QA
La protección contra registro sin verificación ya pasó en producción. Falta únicamente una prueba humana de recepción del código en un buzón real para cerrar este riesgo al 100%.

## Riesgo 2 — Continuidad de la base de datos
Estado: CERTIFICADO

La base Render Free tenía caducidad `2026-09-23T04:29:20.163684Z`, por lo que se creó Supabase `nexo-production` en `us-east-1` y se migró NEXO siguiendo la regla copiar → comparar → probar → cambiar.

### Copia
`NEXO_DB_COPY_RESULT` terminó en `passed`, sin tablas desconocidas. Se copiaron 27 tablas NEXO.

### Comparación e integridad
La validación final posterior al corte se ejecutó desde Render contra `DATABASE_URL` de producción y terminó:

`NEXO_SUPABASE_CUTOVER_RESULT status=passed`

Resultado certificado:
- host clasificado como Supabase;
- puerto 5432;
- gestoras: 15;
- storefront: 313;
- reglas comerciales: 37;
- snapshots: 8;
- ledger: 7;
- Knowledge Base: 47;
- proyectos Studio: 1;
- registros huérfanos en credenciales: 0;
- registros huérfanos en storefront: 0;
- registros huérfanos en ledger: 0;
- fuentes huérfanas de Knowledge Base: 0;
- gaps huérfanos de Knowledge Base: 0.

Los conteos de storefront, reglas y conocimiento superan los valores de la copia inicial porque producción siguió creciendo. La certificación usa mínimos de migración e integridad relacional, no conteos históricos congelados.

### Seguridad y limpieza
- RLS está habilitado en las tablas NEXO del proyecto Supabase.
- El importador temporal quedó protegido y fuera del flujo productivo.
- La ruta temporal de exportación fue eliminada.
- El script temporal de migración fue eliminado.
- El verificador temporal de cutover fue eliminado después del PASS.
- El `start` normal volvió a `reconcile-catalog-corrections` + `next start`.
- La antigua base Render se conserva solo como rollback temporal y no como fuente operativa principal.

## Riesgo 3 — Scripts de QA/seed en cada arranque
Estado: ELIMINADO

Se retiraron del `start` normal los harness E2E, verificadores y seeds temporales. El arranque productivo contiene únicamente la reconciliación necesaria de catálogo antes de `next start`.

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
- Resend y dominio de envío configurados;
- migración Render → Supabase;
- corte de producción a Supabase;
- conteos mínimos e integridad relacional certificados;
- build y producción;
- limpieza de scripts QA/migración del arranque.

PENDIENTE PARA CIERRE FUNCIONAL TOTAL:
- recibir un código real de verificación en un buzón externo y completar el alta de una gestora con ese código;
- después de esa prueba, marcar Bloque 0 como `CERTIFICADO` sin pendientes.

## Regla de cierre

El Bloque 0 queda totalmente CERTIFICADO cuando:

1. una gestora real puede recibir y verificar el email de alta;
2. NEXO opera contra Supabase sin depender de la caducidad de Render Free;
3. los conteos mínimos e integridad crítica permanecen válidos después de la migración;
4. la cadena comercial ya certificada continúa operativa después del cambio de base.

## Siguiente acción exacta

Ejecutar una única alta real de gestora usando un correo accesible, confirmar que llega el código de Resend, verificarlo y completar el registro. No tocar `DATABASE_URL` ni repetir la migración.
