# Contratos iniciales (documentales, no implementados)

Todos los IDs son opacos; entidades privadas llevan `organization_id`, timestamps y versión. No se han creado tablas en este bloque.

| Contrato | Campos mínimos / invariantes |
|---|---|
| organización | `id`, `name`, `status`; límite de aislamiento |
| tienda | `id`, `organization_id`, `name`, `brand`, monedas/canales |
| usuario | identidad global sin secretos ni perfil comercial mezclado |
| rol/membresía | usuario + organización/tienda + rol + vigencia; permisos explícitos |
| producto canónico | `id`, identidad verificada, estado, versión; no contiene copy de canal |
| evidencia | archivo/hash/tipo/actor/fecha; datos personales minimizados |
| fuente | URL/proveedor/tipo/fecha/acceso/confianza; proveedor privado por defecto |
| dato confirmado | campo/valor/unidad/evidencias/aprobador/fecha |
| inferencia | campo/valor/razonamiento/confianza; nunca publicable como hecho |
| contradicción | campo, valores/fuentes, severidad, resolución humana |
| conocimiento | hechos, FAQ, objeciones, fuentes, audiencia, versión |
| imagen | hash, tipo, procedencia, fidelidad, dimensiones, visibilidad |
| regla de precio | ámbito, prioridad, fórmula, moneda, vigencia, versión |
| precio por canal | producto/tienda/canal, importe/moneda, regla/tasa, vigencia |
| moneda/tasa | ISO, precisión; par, valor, fuente, fecha, expiración |
| inventario | producto/variante/ubicación, cantidad/estado, fuente, snapshot |
| publicación | clave idempotente, canal, producto, versión, remote_id/url/estado |
| pedido | tenant/tienda/canal, cliente referenciado, snapshots monetarios y estado |
| atribución | pedido, actor/campaña/gestora, fuente, regla y snapshot |
| auditoría | evento append-only, actor, tenant, objeto, antes/después, correlación |

## Relación sin duplicados

PS1 mantiene identidad canónica. `product_channels` enlaza esa identidad con el `remote_id` de NEXO/Woo o Cuyana. WooCommerce sigue siendo fuente operativa de catálogo/pedidos NEXO durante la transición; Cuyana consumirá una vista/API autorizada y creará un pedido con snapshot antes de WhatsApp. `external_order_id` + canal + organización impiden duplicar pedidos.

## Fuentes reales actuales

| Dato | Fuente actual | Estado |
|---|---|---|
| producto/SKU/precio/inventario/pedido NEXO | WooCommerce, leído/adaptado por NEXO | inequívoca durante transición |
| imagen pública NEXO | WooCommerce y rutas propias NEXO | decisión pendiente de consolidación |
| cliente NEXO | WooCommerce/checkout NEXO | compartida; contrato pendiente |
| comisión/atribución NEXO | Postgres NEXO + metadata Woo | compartida; E2E pendiente |
| mensajería NEXO | NEXO + matriz CSV; Casa Viva tiene modelo más maduro | no inequívoca |
| remesa, tasa y cliente Cuyana | Supabase Cuyana | inequívoca para remesas |
| producto/pedido ecommerce Cuyana | inexistente | decisión/implementación pendiente |
