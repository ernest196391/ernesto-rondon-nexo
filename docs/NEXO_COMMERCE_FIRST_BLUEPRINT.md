# NEXO — Commerce First Blueprint

Fecha: 2026-08-26
Estado: decisión operativa vigente

## 1. Objetivo inmediato

Poner NEXO Marketplace en condiciones de vender desde móvil lo antes posible. La cara pública de NEXO será temporalmente una tienda. NEXO Studio y sus ocho especialistas permanecen en el repositorio y en sus rutas protegidas, pero no se promocionan ni aparecen en la navegación pública.

La prioridad se evalúa mediante dos recorridos:

1. gestora abre y comparte un producto atribuible;
2. cliente consulta, añade al carrito e inicia un pedido oficial en WooCommerce.

## 2. Principios

- WooCommerce conserva productos, precios, inventario y pedidos oficiales.
- Casa Viva conserva las capacidades operativas reutilizadas: gestoras, atribución, comisiones, mensajería y conciliación.
- NEXO Marketplace es la experiencia pública comercial.
- NEXO Studio prepara productos y evoluciona en segundo plano.
- Ninguna capacidad de Studio se elimina para simplificar la tienda.
- Los datos comerciales no confirmados bloquean publicación, no el desarrollo restante.
- La experiencia se diseña primero para Android y conexiones lentas.

## 3. Carril A — vender ahora

### A1. Superficie pública

- inicio comercial;
- búsqueda;
- categorías;
- catálogo;
- ficha de producto;
- disponibilidad por confirmar;
- carrito y checkout WooCommerce;
- contacto y WhatsApp;
- atribución de gestora;
- condiciones comerciales reales.

### A2. Catálogo piloto

Orden de salida:

1. GWELL GF-8816;
2. Royal RA123SL;
3. restantes productos con precio, garantía, disponibilidad e imágenes verificadas.

Un producto puede estar `publicado`, `borrador` o `bloqueado`. El bloqueo debe identificar el campo exacto que falta.

### A3. Preparación manual asistida durante el piloto

Para publicar hoy se permite preparar las imágenes de los ventiladores mediante una herramienta visual asistida y revisión humana. Cada imagen aprobada se exporta en WebP cuadrado, se carga en WordPress y queda vinculada al producto WooCommerce. Este proceso temporal sirve también como conjunto de referencia para entrenar las reglas de la automatización futura.

### A4. Gate de publicación

No se entrega a gestoras hasta comprobar:

- dominio y HTTPS;
- móvil sin desplazamiento horizontal;
- producto y precio correctos;
- galería;
- búsqueda y categoría;
- carrito;
- checkout;
- pedido visible en WooCommerce;
- atribución de gestora;
- advertencia de disponibilidad;
- contacto y WhatsApp.

## 4. Carril B — plataforma automática

Flujo objetivo:

`captura → control de calidad → OCR/códigos → identificación → edición → investigación → precio → revisión → borrador WooCommerce → publicación`

### B1. Enrutador de procesamiento de imágenes

1. Ruta gratuita: Sharp, OpenCV, rembg, OCR local y WebP.
2. Ruta económica: proveedor especializado de fondo/estudio.
3. Ruta avanzada: edición generativa controlada.
4. Ruta humana: solicitar otra fotografía o revisión.

La ruta se elige por calidad, riesgo, costo y tipo de producto. La imagen principal generativa no se publica automáticamente.

### B2. Arquitectura escalable

- `commerce_id` en todas las entidades comerciales;
- originales y derivados en almacenamiento de objetos;
- PostgreSQL para estado, contratos y auditoría;
- trabajos asíncronos y reintentos;
- adaptadores sustituibles para IA, imágenes, almacenamiento y ecommerce;
- cuotas y costo por producto/comercio;
- roles administrador, dueño, dependiente y gestora;
- WooCommerce por comercio sin duplicar el catálogo canónico;
- Product Knowledge Record reutilizable por modelo;
- aprobación humana para datos críticos.

### B3. Métricas del piloto de siete días

- tiempo desde captura hasta borrador;
- porcentaje aprobado sin retoque;
- precisión de marca, modelo, precio y garantía;
- alteraciones críticas de producto;
- costo total de IA por producto;
- éxito de creación de borrador;
- éxito de publicación;
- pedidos y ventas atribuibles.

## 5. Fases y estado

| Fase | Entrega | Estado inicial |
|---|---|---|
| 0 | Fuente de verdad y blueprint | En curso |
| 1 | Ocultar plataforma en superficie pública | En curso |
| 2 | Rebranding ecommerce y navegación móvil | Pendiente |
| 3 | Dos ventiladores preparados | Pendiente |
| 4 | Productos publicados en WooCommerce | Pendiente |
| 5 | Compra, atribución y pedido certificados | Pendiente |
| 6 | URL entregada a gestoras | Pendiente |
| 7 | Automatización progresiva de Studio | Pendiente |

## 6. Feature flags y reversibilidad

- `NEXO_MARKETPLACE_ENABLED=true`: la raíz pública muestra Marketplace.
- `NEXO_PLATFORM_PUBLIC=false`: Studio, proyectos, herramientas y especialistas no aparecen en la navegación pública.

Las rutas de plataforma no se borran. Su acceso directo continúa sujeto a la autenticación vigente.

## 7. Fuente de diseño

El Brand Kit oficial de NEXO es la fuente visual. La Skill 1 de construcción web mencionada en el proyecto se evaluará cuando su paquete ZIP esté disponible. Antes de aplicarla se comprobará que no sustituya contratos WooCommerce, atribución, accesibilidad ni capacidades ya funcionales.

## 8. Criterio de avance

Se trabaja una fase hasta superar su gate, se registra el resultado y se continúa sin detener los trabajos ordinarios. Un fallo recuperable abre una corrección; no reinicia el proyecto ni autoriza una reconstrucción.
