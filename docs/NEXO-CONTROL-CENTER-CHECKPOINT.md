# NEXO — Centro de Control · Checkpoint vivo

Fecha inicial: 7 septiembre 2026  
Última actualización: 8 septiembre 2026

## Propósito
Documento de continuidad para que otro chat o agente pueda auditar el estado real y continuar sin reiniciar el bloque.

## Estado del bloque

### VALIDADO EN PRODUCCIÓN
- `/admin` protegido por sesión con rol `admin`.
- Login administrativo independiente disponible en `/admin/login`.
- WooCommerce actúa como fuente transaccional de pedidos e inventario.
- Checkout NEXO persiste metadata de atribución, incluyendo referral solicitado/efectivo, gestora efectiva y origen.
- Ledger de comisiones y reconciliación existen en PostgreSQL.
- Inicio administrativo mobile-first comprobado visualmente en capturas reales.
- `/admin/pedidos` comprobado visualmente en móvil con pedidos reales.
- `/admin/pedidos/[id]` comprobado visualmente con productos, entrega, origen y trazabilidad.

### IMPLEMENTADO DESPUÉS DEL QA MÓVIL — pendiente validación del último deploy
- Se eliminaron de la navegación los placeholders `Productos · Gestoras · Más` porque parecían acciones disponibles pero no tenían rutas funcionales.
- Los filtros de pedidos dejaron de ser anclas decorativas y ahora filtran realmente por query param: todos, abiertos, procesando, completados y cancelados.
- El CTA de `Atender ahora` ahora cambia según la prioridad real: pedidos abiertos o stock.
- El detalle de pedido recupera acciones operativas seguras: marcar entregado/cobrado, cancelar o registrar reembolso según estado.
- Se aclararon etiquetas históricas: `Dirección registrada` y `Método de pago registrado` para no confundir datos antiguos con reglas actuales.

## Auditoría visual del 8 septiembre 2026

### HECHO
- Header y navegación son legibles en móvil.
- Dashboard responde bien a la pregunta `¿Qué necesita atención?`.
- KPIs se adaptan a dos columnas sin overflow.
- Prioridades, actividad reciente y stock se leen correctamente en pantalla estrecha.
- Lista de pedidos y detalle de pedido son utilizables en móvil.
- WooCommerce muestra correctamente estados históricos cancelados y NEXO muestra atribución/ledger cuando existe.

### CORREGIDO A PARTIR DE LAS CAPTURAS
- ROTO: `Productos · Gestoras · Más` era texto visible no accionable. Eliminado hasta que existan módulos reales.
- ROTO: filtros de pedidos parecían controles pero no filtraban. Convertidos a filtros funcionales.
- INCOHERENTE: `Ver pedidos` aparecía aunque la prioridad visible fuera inventario. Ahora la acción corresponde a la prioridad real.
- REGRESIÓN: durante la separación por pantallas se perdió la capacidad de cambiar estado del pedido desde admin. Restaurada en detalle.

### DATOS HISTÓRICOS DETECTADOS, NO BUG DE UI
- Existen pedidos antiguos con direcciones mezcladas/incompletas y campos de entrega vacíos.
- Existen pedidos históricos con método `Confirmar y coordinar por WhatsApp`; debe mostrarse como valor histórico, no como opción vigente del checkout.
- Pedidos directos correctamente aparecen como `organic`, sin gestora y sin movimiento de comisión.

## Arquitectura vigente
- WooCommerce = pedido, estado, precio, stock, SKU, imagen pública.
- NEXO DB = gestoras, atribución, ledger/comisiones, payouts, reconciliación.
- Admin consume ambas fuentes y no mantiene un inventario paralelo.

## Estado funcional
- HECHO: autenticación/rol admin en páginas y API de acciones de pedido.
- HECHO: lectura de pedidos reales WooCommerce.
- HECHO: lectura de gestoras, ledger, payouts y reconciliación en NEXO DB.
- HECHO: acciones `completed/cancelled/refunded` actualizan WooCommerce y transición comercial existente.
- HECHO: filtros básicos de pedidos funcionales.
- PARCIAL: inventario se lee y alerta, pero edición administrativa todavía no pertenece a este bloque.
- PARCIAL: atribución se visualiza desde metadata WooCommerce; falta ejecutar una compra E2E nueva en este bloque para validar persistencia real de punta a punta.
- FALTA: dependienta/responsable como entidad operativa visible si no existe metadata actual.
- FALTA: búsqueda/paginación avanzada de pedidos.
- FALTA: módulos Productos/Inventario, Gestoras, Clientes, Marketing, Analítica y Configuración como rutas administrativas completas.
- BLOQUEADO: reutilización de código Casa Viva no se realizó porque no apareció un repositorio Casa Viva accesible mediante el conector GitHub en esta auditoría.

## FIX + RULE + TEST

### FIX 2026-09-08-A
Controles de navegación y filtros que parecían funcionales pero no lo eran.

### RULE
Todo control visible en administración debe ejecutar una acción real, navegar a una ruta existente o no mostrarse. No usar texto gris o chips como promesa de módulos futuros.

### TEST
QA manual obligatorio: tocar cada elemento visible de navegación/filtro en 360–430 px y confirmar que cambia de pantalla/estado o no aparece si el módulo no existe.

### FIX 2026-09-08-B
Separar datos históricos de reglas comerciales vigentes.

### RULE
El admin puede mostrar valores históricos de un pedido aunque ya no sean opciones vigentes, pero debe etiquetarlos como datos registrados del pedido para no confundirlos con configuración actual.

### TEST
Revisar un pedido legado y uno creado con el checkout vigente; ambos deben preservar su snapshot sin reinterpretación retroactiva.

## Commits relevantes
- `993079d6` — navegación del Centro de Control.
- `99733268` — datos enriquecidos y detalle de pedidos.
- `9e39eb6a` — workspace `/admin/pedidos`.
- `e7d50597` — detalle `/admin/pedidos/[id]`.
- `b03221ce` — inicio action-first.
- `0f70d8eb` — UX responsive del Centro de Control.
- `cc4fcd25` — elimina navegación inerte.
- `754f49d9` — alinea prioridad con acción real.
- `68e9ea02` — filtros de pedidos funcionales.
- `b9e3a95d` / `13111737` / `6bc41ae5` — acciones operativas seguras en detalle de pedido.

## QA obligatorio para cerrar BLOQUE 1
1. Confirmar Render LIVE del último commit.
2. En móvil, abrir `/admin/pedidos` y probar todos los filtros.
3. Abrir un pedido pendiente/procesando si existe y comprobar botones de cambio de estado.
4. No modificar un pedido real importante durante la prueba si no corresponde operativamente.
5. Ejecutar una venta E2E nueva desde tienda gestora y comprobar referral/origen/ledger en admin.

## Siguiente acción exacta
Cerrar deploy/QA de estas correcciones. Después ejecutar una venta E2E de prueba desde una tienda de gestora para validar: tienda → checkout → pedido → metadata de origen → detalle admin → ledger/comisión. Una vez validado, avanzar a Productos/Inventario administrativo sin crear una segunda fuente de stock.
