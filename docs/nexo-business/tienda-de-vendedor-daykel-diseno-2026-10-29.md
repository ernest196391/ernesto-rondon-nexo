# La tienda propia de Daykel — diseño (29-oct-2026, v2 con las respuestas de Ernesto)

**Para:** Ernesto. **Idea:** Daykel (usuario 59, mensajero) vende sus **piezas de moto** (≈30 productos, dijo él hoy 21:18) desde su teléfono, con su nombre, sin tocar nada de Casa Viva que no sea suyo.

## Decisiones de Ernesto (29-oct) que mandan
1. Compra: **solo «pedir por WhatsApp»** (sin carrito, sin pago en la web).
2. Gestoras: **ya**, por enlace en su app; **no** en el catálogo general hasta que Ernesto fije la comisión de Casa Viva.
3. Lennys: lista **«Artículos nuevos»** cada mañana, después de publicar (no bloquea).
4. Comisión de Casa Viva sobre sus ventas: la habla Ernesto con Daykel → **vacía** (nada inventado).

## 1. Qué existe hoy
- **Cuenta doble** mensajero + gestora (`CVD_Registration::is_dual`). Daykel hoy es solo mensajero (aprobado, con Pa'llá).
- **App de gestoras** (`/area-gestoras/`): menú lateral, enlace `?ref=CV…`, «Mi estudio de fotos» (clave Gemini propia), y «Mis ventas de proveedor» (solo la cuenta del dueño: es el molde de un menú «solo para ti»).
- **Lo que NO existe:** productos con dueño, ni crear/editar productos fuera del panel de Lennys. Los plugins `nexo-marketplace` y `nexo-product-studio` son esqueletos (0.1.0): no se usan.

## 2. Qué se construye y por qué así
Como no hay carrito, **los artículos de Daykel NO son productos de WooCommerce**. Van en un tipo de contenido propio (`cvd_seller_item`) dentro del Core, en un archivo nuevo (`class-cvd-seller-store.php`). Ventaja: no se mezclan con el catálogo de Casa Viva, la Caja, el bot, los mínimos ni los anuncios de Google; si algo sale mal, se borra sin tocar un solo producto.
1. **Cuenta de Daykel:** se le añade «gestora» (lógica del registro, con su `?ref=` y estado propio de mensajero) y la marca de vendedor (rol `cvd_supplier`). Pa'llá y `/area-mensajeros/` no se tocan. Se prueba antes con una cuenta de prueba.
2. **«Mis artículos»** en su menú: lista con foto, precio, stock y *Pausar / Editar / Borrar*; botón **«+ Nuevo artículo»**: fotos (cámara o galería, hasta 5), título, descripción, precio USD, stock, categoría.
3. **Su tienda pública:** `casaviva.company/vendedor/daykel/`, con «Vendedor: Daykel» y el botón **«Pedir por WhatsApp»** (abre su WhatsApp con la pieza y el código de la gestora ya escritos).
4. **Opciones por artículo:** se ve en *solo mi tienda* (el «también Casa Viva en general» sale bloqueado) · ofrecer a gestoras *sí/no + USD que gana cada una* · entrega: *yo / mensajero de Casa Viva / por la tienda* · cobro: *efectivo / transferencia / coordinar* (se muestran al cliente, solo informan).
5. **«Mis ventas» (a mano):** cuando cierra una venta pulsa *Vendí 1*; queda apuntado qué pieza, cuánto, qué gestora lo trajo y **lo que le toca a la gestora**. Es una libreta: no cobra ni paga nada.
6. **Gestoras:** sección «Artículos de vendedores» en su app, con foto, precio, lo que ganan y su enlace listo para mandar.
7. **Lennys:** en el panel, «Artículos nuevos de vendedores» con ✓ / ocultar.

## 3. Cómo se protege
- Cada ruta comprueba `dueño del artículo = quien llama`. Daykel **no** recibe permisos de WooCommerce ni entrada a wp-admin: no ve ni toca productos, pedidos, precios ni dinero de Casa Viva.
- Fotos: solo JPG/PNG/WebP, con tope de tamaño y reducidas al subir; solo ve las suyas.
- Precio máximo razonable y comisión de gestora menor que el precio. **Cero movimiento de dinero.**
- Despliegue como siempre: copia del plugin, `php -l`, cuenta de prueba, artículo de prueba, vuelta atrás = subir la copia.

## 4. Qué queda abierto
- **Comisión de Casa Viva** (Ernesto con Daykel): campo vacío; cada venta queda «comisión Casa Viva: pendiente».
- **Aviso de pedidos:** como la compra es por WhatsApp directo a Daykel, no hay pedido de Casa Viva que avisar. Cada toque en «Pedir por WhatsApp» se cuenta como consulta (Lennys y Daykel ven cuántas). Si Ernesto quiere aviso del bot a Lennys por cada consulta, lo hace la sesión del bot.
- **Clave de Google** de Daykel para «Mi estudio de fotos» (solo si él quiere; etapa 4).
- **Nombre y logo** de su tienda y el WhatsApp para clientes: se le pregunta a él, una cosa por mensaje (mañana, después de las 7:30).
