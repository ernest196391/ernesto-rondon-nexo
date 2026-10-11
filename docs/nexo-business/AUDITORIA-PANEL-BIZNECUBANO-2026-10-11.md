# Auditoría: panel de BizneCubano vs panel de Casa Viva (NEXO)

**Fecha:** 2026-10-11 · **Quién:** Claude Code, con la sesión de Ernesto en Chrome, **solo lectura** (no se cambió nada en BizneCubano).
**Objetivo (Ernesto y Lennys):** que el panel de Casa Viva haga todo lo bueno de BizneCubano, mejor, y poder dejar BizneCubano.

## 1. Qué tiene BizneCubano (lo que usa Lennys hoy)

| Sección | Qué hace | Datos de Casa Viva vistos |
|---|---|---|
| **Inicio** | Resumen del mes: monto total, ganancias concretadas / pendientes / perdidas (USD); pedidos totales / completados / pendientes / cancelados; productos publicados / agotados / categorías; aviso "tienes N pedidos pendientes" | Oct: 9.391 USD, 192 pedidos (131 completados, 17 pendientes, 43 cancelados); 202 productos, 53 agotados |
| **Pedidos** | Lista con filtros (estado, gestor, fechas) y buscador; tarjetas total / pendientes / pagados / completados; por pedido: productos con variante, cliente, gestor, monto USD + mensajería CUP, entrega/recogida, estado | 8.715 pedidos históricos |
| **Detalle de pedido** | Enviar pedido al cliente por WhatsApp, Completar, Marcar como pagado, Editar, Cancelar; dirección por reparto/municipio/provincia; "pagará en CUP" con su equivalente; notas; datos del gestor y del cliente | Muestra "El cambio actual es a 0.00" aunque calcula 38.750 CUP (fallo de BizneCubano) |
| **Gestores** | Lista (90 de 200 permitidos), vista rápida, ver detalles, despedir; **en prueba** (12, con pedidos, monto y comisión esperada; aprobar o despedir); **propuestas de colaboración**; **eliminar inactivos**; aviso de **solicitudes de extracción** pendientes | Ficha: pedidos completos, monto aportado, pagos recibidos, solicitud de extracción, **historial de pagos** (p. ej. Roxana: 395 pedidos, 19.808 USD, 62 pagos) |
| **Comisiones** | General + "sobrescribir comisión" por producto o por gestor (plugin gratis activo) | Las 209 comisiones por producto ya se copiaron a la web (D36) |
| **Estadísticas** | Ventas históricas (251.399 USD), promedio por pedido (35,63 USD), ganancias por año → mes → semana | — |
| **Catálogo** | Productos (filtros, acciones en masa, estado, tipo), categorías con foto y jerarquía, **inventario y precios en masa** (una tabla para cambiar precio, oferta y cantidad), **atributos de variaciones**, **búsquedas de clientes** (qué buscan y cuántas veces: alfombra 3.254, cortina 3.053…) | — |
| **Ficha de producto** | Publicado sí/no, nombre, URL, precio y precio de descuento, descripción, tangible (entrega), SEO, foto principal + 12, categorías, cantidad y **mínimo para avisar**, campos personalizados, detalles destacados, colecciones, productos relacionados | — |
| **Marketing** | Cupones de descuento (1 activo: "2026"), banners, colecciones, reseñas, lista de clientes, publicidad | — |
| **Configuración** | Negocio (descripción, dirección, horarios, ubicación GPS, redes), diseño, tienda, monedas, métodos de pago, envío y recogida, SEO | — |
| **Plugins** | Zelle (activo), sobrescribir comisión (activo), cancelación por el cliente (activo), aviso de stock bajo (activo); de pago: PayPal, Tarjeta Clásica/Tropical, QvaPay, mínimo de compra, estadísticas avanzadas, varias direcciones de recogida, envío gratis desde X, beneficiario del pedido | — |
| **Empleados** | Accesos por área (1 USD/mes por persona; desactivado) | — |
| **Otros** | Exportar datos, FAQs, Telegram, modo mantenimiento | — |

## 2. Qué tenemos ya (dos paneles)

- **Panel NEXO** (`casaviva.company/panel/`, `negocio.nexocuba.com`): Resumen (ventas por día/hora, cobros por forma de pago, lo más vendido, ranking de gestoras, quedan pocas unidades, necesita tu atención), Pedidos *(de NEXO: hoy 0, los reales están en la web)*, Productos (catálogo, costos, socias, web casaviva.company, recibir mercancía, digitalizar), Equipo (gestoras, dependientas, socias, enlaces de registro, compra de personal, estado de cuenta PDF, retiros por pagar), Ajustes (tasas de cambio, gastos fijos, variables de costo, equipos de caja). Entrada con WhatsApp.
- **Casa Viva Core** (`casaviva.company/ventas/`, WordPress): los **pedidos reales de la web**, reparto con mensajeros, vale, cobro y cierre, devoluciones, comisiones y altas de gestoras.

## 3. Huecos (lo que falta para dejar BizneCubano)

| # | Hueco | Por qué importa | Prioridad |
|---|---|---|---|
| 1 | **Dos paneles distintos** (NEXO y `/ventas/`) y los pedidos reales no se ven en el panel NEXO | Lennys tiene que mirar dos sitios; en BizneCubano todo está en uno | **Alta** |
| 2 | Inicio del mes como BizneCubano (concretado / pendiente / perdido, pedidos por estado, agotados) con datos de la web **y** de la caja juntos | Es lo primero que mira Lennys | Alta |
| 3 | Gestoras: historial de pagos, **solicitudes de extracción**, periodo de prueba con aprobación, monto aportado | Es su programa de gestores; hoy se paga por BizneCubano | Alta |
| 4 | Comisión por producto editable en el panel (y que la caja use la misma: hoy NEXO tiene 51, la web 209) | Pedido expreso de Lennys (feedback 10-oct) | Alta |
| 5 | Inventario y precios en masa (una tabla) | Lo usa para actualizar rápido | Alta |
| 6 | Estadísticas históricas: año → mes → semana, promedio por pedido | — | Media |
| 7 | Búsquedas de clientes (qué buscan y no encuentran) | Dice qué comprar | Media |
| 8 | Pedido: "Enviar al cliente por WhatsApp", marcar pagado, editar, cancelar con un toque; filtros por estado/gestora/fechas | — | Alta (Core ya tiene parte) |
| 9 | Ficha de producto: precio de oferta, mínimo para avisar, medidas y materiales (feedback de Lennys), variantes | — | Media |
| 10 | Cupones, banners, colecciones, reseñas | Marketing | Baja (fase tienda) |
| 11 | Configuración de tienda, pagos, envíos | — | Fase tienda web |
| 12 | Empleados con permisos por área | Dependientas que no vean todo | Media |
| 13 | Migrar el histórico (8.715 pedidos, pagos a gestoras) desde "Exportar datos" | Para no perder la historia | Media |

## 4. Decisión que necesita Ernesto

¿Un solo panel? Propuesta: **el panel NEXO (`casaviva.company/panel/`) es el panel de administración único**, y lee los pedidos, gestoras y comisiones de la web (Core) por su API, en lugar de tener dos. `/ventas/` queda solo para el reparto del día a día hasta que el panel lo absorba.
