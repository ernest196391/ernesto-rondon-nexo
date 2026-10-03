# Encargo de diseño — NEXO Business POS (primera tienda: Casa Viva)

Adjunto el logo y el branding de Casa Viva.

## Qué es
NEXO Business es un sistema de punto de venta (POS) para tiendas cubanas. Funciona sin internet y sincroniza con la nube cuando hay conexión. Se vende a varios negocios. Casa Viva (artículos para el hogar) es la primera tienda que lo usa.

Por eso necesito **dos capas de diseño**:
1. **Base NEXO:** el sistema de diseño del producto (componentes, espaciado, tipografía, estados, iconos). Debe servir para cualquier tienda.
2. **Tema Casa Viva:** colores, logo, tipografía de marca y tono aplicados sobre la base, sin cambiar los componentes. Otra tienda sería solo otro tema.

Entrega los colores, tipografías, radios y espaciados como **variables CSS** (tokens): unas para la base NEXO y otras que Casa Viva sobrescribe.

## Quién lo usa y dónde
- Vendedores en el mostrador, con prisa y el cliente delante. A menudo usan una sola mano.
- **Teléfono Android de gama baja** (Redmi 9A, pantalla de 720×1600, poca potencia), **tablet** y **portátil Windows**.
- Luz de tienda y a veces sol: hace falta buen contraste. Botones de al menos 44 px.
- Todo en español.

## El problema de hoy
Todo está en una sola página larga: hay que bajar mucho para llegar a cada parte. No es intuitiva. Hay 281 artículos sin fotos ni iconos.

## Pantallas que necesito
1. **Vender (pantalla principal):**
   - buscador con botón de escanear código de barras, siempre visible;
   - categorías en chips: Baño, Cocina, Habitación, Organización, Cuidado personal, Electrodomésticos, Ferretería, Sala y muebles, Otros;
   - productos en cuadrícula con foto, nombre y precio;
   - los productos con variantes (colores o tallas) son una sola tarjeta que, al tocarla, deja elegir la variante;
   - marca «Quedan 2» cuando quedan 2 unidades o menos, y «Agotado»;
   - carrito como barra inferior: «3 artículos · Cobrar $37»; en tablet, carrito siempre visible a la derecha.
2. **Carrito y cobro:**
   - cambiar cantidades y quitar artículos;
   - **pago dividido en 2 o 3 formas**: efectivo USD, efectivo CUP, transferencia CUP, EnZona clásica, MLC, Zelle, USDT y otras criptos;
   - a cada transferencia se le anota la referencia;
   - total en USD con equivalente en CUP según la **tasa de elTOQUE**: se actualiza sola, se puede editar a mano y debe verse de cuándo es;
   - muestra cuánto falta por pagar o el cambio que hay que devolver.
3. **Venta completada:** recibo digital para compartir por WhatsApp o copiar, sin impresora.
4. **Caja:** abrir y cerrar turno, entradas y salidas de dinero con motivo, efectivo esperado contra contado, diferencia. Por moneda.
5. **Inventario:** existencias por ubicación, conteo físico, traslados entre ubicaciones, lista de «poco stock».
6. **Más:**
   - fiado (cuentas por cobrar de clientes);
   - mensajeros (dinero que tienen en mano);
   - devoluciones y consignación;
   - resumen del negocio;
   - sincronización: estado, pendientes y clave del equipo.
7. **Estados en todas las pantallas:** sin conexión (debe verse tranquilo, no como un error), sincronizando, error, lista vacía, cargando.

## Navegación
Propón tú la mejor. Mi idea inicial: menú inferior con Vender, Caja, Inventario y Más en el teléfono, y menú lateral en tablet y portátil. Lo importante: vender debe hacerse en 3 toques o menos y ninguna tarea debe obligar a bajar mucho.

## Limitaciones técnicas
- La app es HTML, CSS y TypeScript sin framework, dentro de Tauri (WebView). Nada que dependa de React o de librerías pesadas.
- Debe ir fluida en un teléfono de gama baja: pocas animaciones, imágenes ligeras, sin sombras ni desenfoques pesados.
- Funciona sin internet: las fotos se guardan en el equipo y, si no hay foto, hace falta un marcador digno (inicial o icono de la categoría).
- Iconos: propón un juego de iconos de línea libre, por ejemplo Tabler o Lucide.

## Entregables
1. Tokens en variables CSS: base NEXO y tema Casa Viva.
2. Componentes con sus estados: botón, chip, tarjeta de producto, selector de variantes, barra de carrito, fila de pago, campo de búsqueda, aviso, menú de navegación.
3. Maquetas de teléfono (360–412 px de ancho) y de tablet (768–1024 px) de las pantallas 1 a 4, y de al menos una de Inventario y una de Más.
4. Breves notas de interacción: qué pasa al tocar, al escanear, al dividir un pago, sin conexión.
5. Cómo se ve otro tema (otra tienda) cambiando solo los tokens, para comprobar que la base sirve.
