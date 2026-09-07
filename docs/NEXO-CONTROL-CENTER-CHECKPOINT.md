# NEXO — Centro de Control · Checkpoint vivo

Fecha inicial: 7 septiembre 2026

## Propósito
Documento de continuidad para que otro chat o agente pueda auditar el estado real y continuar sin reiniciar el bloque.

## Estado del bloque

### VALIDADO EN PRODUCCIÓN antes de este bloque
- `/admin` protegido por sesión con rol `admin`.
- Login administrativo independiente disponible en `/admin/login`.
- WooCommerce ya actúa como fuente transaccional de pedidos e inventario.
- Checkout NEXO persiste metadata de atribución, incluyendo referral solicitado/efectivo, gestora efectiva y origen.
- Ledger de comisiones y reconciliación existen en PostgreSQL.

### IMPLEMENTADO EN ESTE BLOQUE — pendiente validación de deploy/producción
- Inicio administrativo convertido de página infinita a dashboard orientado a acciones.
- Navegación administrativa persistente con Inicio y Pedidos; próximos módulos se anuncian sin simular rutas inexistentes.
- `/admin/pedidos` con lista reciente, estado, importe, gestora/origen, modalidad y acceso a detalle.
- `/admin/pedidos/[id]` con productos, subtotal, mensajería, total, cliente, entrega, pago, origen, gestora, referral solicitado/efectivo, comisión/ledger e incidencias de reconciliación.
- `adminOverview` enriquecido y nueva función `adminOrderDetail` usando WooCommerce + PostgreSQL.
- Fuente de verdad preservada: WooCommerce para pedido/stock; NEXO DB para atribución, ledger y reconciliación.
- Diseño responsive 360–430 px y desktop, con progressive disclosure por rutas en lugar de scroll infinito.

## Auditoría resumida
- HECHO: autenticación/rol admin en páginas y API de acciones de pedido.
- HECHO: lectura de pedidos reales WooCommerce.
- HECHO: lectura de gestoras, ledger, payouts y reconciliación en NEXO DB.
- HECHO: acciones `completed/cancelled/refunded` actualizan WooCommerce y transición comercial existente.
- PARCIAL: inventario se lee y alerta, pero edición administrativa todavía no pertenece a este bloque.
- PARCIAL: atribución se visualiza desde metadata WooCommerce; falta ejecutar una compra E2E nueva en este bloque para validar persistencia real de punta a punta.
- FALTA: dependienta/responsable como entidad operativa visible si no existe metadata actual.
- FALTA: filtros interactivos/búsqueda/paginación avanzada de pedidos; la primera versión muestra últimos 30 pedidos.
- FALTA: módulos Productos/Inventario, Gestoras, Clientes, Marketing, Analítica y Configuración como rutas administrativas completas.
- BLOQUEADO: reutilización de código Casa Viva no se realizó porque no apareció un repositorio Casa Viva accesible mediante el conector GitHub en esta auditoría.

## Principios aplicados
- Product OS P02 Mobile first.
- P03 Una pantalla, una intención dominante.
- P04 Divulgación progresiva.
- P09 Fuente de verdad explícita.
- P10 Persistencia comercial.
- P11 Seguridad/aislamiento.
- R003 Una métrica, una verdad.
- R012 Producción debe verificarse.

## Commits de este bloque
- `993079d6` — navegación del Centro de Control.
- `99733268` — datos enriquecidos y detalle de pedidos.
- `9e39eb6a` — workspace `/admin/pedidos`.
- `e7d50597` — detalle `/admin/pedidos/[id]`.
- `b03221ce` — inicio action-first.
- `0f70d8eb` — UX responsive del Centro de Control.

## QA obligatorio para cerrar
1. Esperar deploy Render LIVE del último commit.
2. Abrir `/admin` autenticado y comprobar dashboard.
3. Abrir `/admin/pedidos` y confirmar pedidos reales.
4. Abrir un pedido real y revisar `/admin/pedidos/{id}`.
5. Verificar en móvil 360–430 px navegación, cards, detalle y no-overflow.
6. Confirmar que una sesión no-admin va a `/admin/login`.
7. Realizar en siguiente prueba una compra desde tienda gestora y comprobar referral/origen/ledger en admin.

## Siguiente acción exacta
Cerrar QA de producción de Inicio + Pedidos. Después ejecutar una venta E2E de prueba desde una tienda de gestora para validar: tienda → checkout → pedido → metadata de origen → detalle admin → ledger/comisión. Una vez validado, avanzar a Productos/Inventario administrativo sin crear una segunda fuente de stock.
