# NEXO-GESTORAS-001 — Commercial Foundation

## Decisión

WooCommerce sigue siendo la autoridad única de producto, precio base, stock, carrito y pedido. PostgreSQL NEXO conserva únicamente el dominio comercial: perfil, selección, reglas, atribución, snapshots, ledger, payout y auditoría. No se duplican productos ni pedidos.

## Persistencia y migración

`lib/commercial/db.ts` instala tablas idempotentes mediante `CREATE TABLE IF NOT EXISTS`. La migración es aditiva y no modifica tablas de Product Studio. Los índices únicos protegen slug, referencia, identidad, evento, idempotencia de checkout, snapshot de pedido y pertenencia de una entrada a un payout.

La versión inicial no importa automáticamente comisiones históricas CVD. Los pedidos anteriores conservan su autoridad histórica; los nuevos pedidos con `_nexo_ledger_owner=nexo` pertenecen al ledger NEXO.

## Configuración

- `DATABASE_URL`: PostgreSQL NEXO existente.
- `NEXO_GESTORA_SESSION_SECRET`: firma sesiones de oficina.
- `NEXO_GESTORA_ACCESS_KEYS`: lista `clave:userId:gestoraId` separada por comas.
- `NEXO_GESTORA_ADMIN_KEY`: acceso administrativo y Bearer de `/api/gestoras/admin`.
- `NEXO_IDENTITY_PEPPER`: hash de identidades de atribución.
- `NEXO_ORDER_WEBHOOK_SECRET`: firma HMAC SHA-256 de eventos de pedido.

## Puesta en marcha

1. Desplegar código y variables.
2. Crear perfil con `POST /api/gestoras/admin`, Bearer admin y acción `profile`.
3. Activarlo con acción `status` y valor `active`.
4. Añadir `clave:userId:gestoraId` a `NEXO_GESTORA_ACCESS_KEYS` y redeploy.
5. La gestora entra por `/impulsa/login` y comparte `/g/{slug}`.
6. Instalar/actualizar `wordpress/nexo-marketplace` 0.2.0 en el WooCommerce que recibe el checkout.

## Eventos económicos

WooCommerce/operación envía a `/api/gestoras/order-events` un JSON `{orderId,event,actorId}` firmado en `x-nexo-signature`. Eventos permitidos: `delivered_paid`, `cancelled`, `refunded`. Son idempotentes por pedido y evento.

## Rollback

Revertir la versión web y el plugin a 0.1.0 detiene nuevas escrituras del Foundation. Las tablas son aditivas y deben conservarse para auditoría; no borrarlas. Los pedidos oficiales permanecen en WooCommerce. Antes de rollback, bloquear eventos y payouts, y reconciliar filas `nexo_commercial_reconciliation.status='pending'`.

## Garantía anti-doble-ledger

El checkout escribe `_nexo_ledger_owner=nexo`. El plugin NEXO 0.2.0 convierte cualquier comisión CVD de ese pedido en `cancelled`, fija su importe en cero y bloquea payout CVD. La obligación económica válida se conserva únicamente en `nexo_commission_ledger`.
