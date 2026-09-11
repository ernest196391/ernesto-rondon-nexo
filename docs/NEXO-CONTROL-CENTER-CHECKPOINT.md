# NEXO — Centro de Control · Checkpoint vivo

Fecha inicial: 7 septiembre 2026  
Última actualización: 11 septiembre 2026

## Propósito
Documento de continuidad para que otro chat o agente pueda auditar el estado real y continuar sin reiniciar el bloque.

## Estado confirmado en producción
- `/admin` protegido por sesión con rol `admin`.
- Login administrativo independiente disponible en `/admin/login`.
- WooCommerce es la fuente transaccional de pedidos, precio, stock, SKU, imágenes públicas y estado de publicación.
- NEXO DB conserva gestoras, atribución, snapshots, ledger/comisiones, payouts y reconciliación.
- `/admin/pedidos` y `/admin/pedidos/[id]` están operativos con filtros y acciones de estado.
- La compra E2E de gestora del Bloque 1 terminó PASS con margen +5 USD, pedido WooCommerce, atribución `gestora_store`, snapshot, ledger, visibilidad en dashboard de gestora y cancelación del pedido QA.

## SUBBLOQUE PRODUCTOS / INVENTARIO — CERRADO Y CERTIFICADO

### Implementado
- Ruta administrativa real `/admin/productos`.
- Navegación `Productos` visible únicamente después de existir un módulo funcional.
- Búsqueda por nombre/SKU.
- Filtro de publicados y borradores.
- Tarjetas mobile-first con imagen, SKU, estado y disponibilidad.
- Edición de precio directamente en WooCommerce.
- Edición de existencia directamente en WooCommerce.
- Stock 0 cambia a `outofstock`; stock positivo cambia a `instock`.
- Publicar / pasar a borrador con confirmación explícita.
- Los productos sin control de stock no se presentan falsamente como si tuvieran cantidad 0: se indica `Sin control` hasta que el administrador decida activar cantidad.
- Productos variables no permiten editar precio/stock del padre como si fueran simples.
- Ruta `/admin/productos/[id]` para administrar variantes individualmente.
- Precio, stock y estado de cada variante se escriben en la variación WooCommerce correspondiente.
- API `/api/admin/products` exige rol `admin` y valida producto, variante, precio, cantidad y estado.
- No existe inventario paralelo en NEXO.
- Eliminado el cliente de UI duplicado/obsoleto para evitar dos implementaciones divergentes del mismo módulo.

### QA / evidencia
- Build Render del 11-sep-2026: SUCCESS.
- Servicio LIVE en el dominio principal.
- Next.js incluye `/admin/productos`, `/admin/productos/[id]` y `/api/admin/products` en el build productivo.
- Smoke productivo seguro `products-block-close-20260911-1202`: PASS.
- Producto simple probado mediante escritura no-op en WooCommerce: producto `1017`, respuesta verificada `ok=true`.
- Producto variable probado mediante escritura no-op en WooCommerce: producto `1146`, variante `1148`, respuesta verificada `ok=true`.
- La prueba escribió exactamente los valores ya existentes; no modificó precio, stock ni estado comercial real.
- Resultado de Render: `NEXO_PRODUCT_ADMIN_SMOKE_RESULT` con `status=passed`.

## FIX + RULE + TEST

### FIX 2026-09-11-PRODUCTS-01
Se añadió edición administrativa de catálogo sin crear una segunda fuente de stock.

### RULE
Todo cambio administrativo de precio, stock o publicación debe escribirse en WooCommerce. NEXO puede presentar y auditar la operación, pero no duplicar el valor operativo.

### TEST
Prueba productiva segura de lectura + escritura no-op contra WooCommerce y verificación de respuesta para producto simple. Para una modificación comercial real, el valor recargado en NEXO debe coincidir con WooCommerce.

### FIX 2026-09-11-PRODUCTS-02
Los productos variables dejaron de tratarse como simples.

### RULE
Nunca modificar precio o existencia del producto padre cuando el valor comercial vive en variaciones. Las variantes se administran de forma independiente.

### TEST
Prueba productiva segura de una variante mediante lectura + escritura no-op y verificación de la misma variante, sin alterar las demás.

## Estado de la etapa Centro de Control

### Cerrado
- Inicio administrativo.
- Pedidos y detalle.
- Cambio operativo de estado del pedido.
- Atribución y ledger comprobados E2E.
- Productos / inventario simples.
- Productos variables / variantes.

### Pendiente para considerar la ETAPA COMPLETA
1. **Gestoras**: listado, búsqueda, perfil, estado activo/suspendido, tienda, ventas, comisiones y enlace atribuible.
2. **Clientes**: directorio derivado de pedidos NEXO, historial y contacto sin crear una segunda fuente comercial contradictoria.
3. **Comisiones / pagos**: vista administrativa de ledger, disponibles, retenidas, pagadas y payout.
4. **Marketing**: banners/promociones operativas, sin controles decorativos.
5. **Analítica**: ventas, productos, gestoras, ticket promedio y periodos.
6. **Configuración**: reglas operativas esenciales y mensajería desde un módulo seguro.
7. **Incidencias / reconciliación**: hacer visibles errores pendientes y acciones de reparación.
8. **QA final móvil** de todas las rutas administrativas antes de declarar Centro de Control v1 terminado.

## Riesgos fuera de este subbloque
- Migración/continuidad de la base Render sigue aplazada por decisión del usuario.
- Verificación de email de gestoras sigue registrada para retomar después; no pertenece a Productos/Inventario.

## Siguiente acción exacta
Construir el módulo **Gestoras** del Centro de Control: listado → búsqueda → detalle → estado → tienda → pedidos/ventas → comisiones, manteniendo NEXO DB como fuente de datos de gestora y WooCommerce como fuente de pedidos.
