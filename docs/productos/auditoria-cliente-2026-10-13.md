# Auditoría de la web como cliente, en el teléfono — 13-oct-2026

**Pedido por:** Ernesto, 17:22, con una captura del móvil: «Cúrru está metida en el medio en muchas pantallas, corregir eso y auditar lo que no funcione para el cliente y cambiar».
**Hecho por:** Claude Code, en el navegador interno (no en el Chrome de Ernesto), con pantalla de teléfono (390 × 844 y 375 × 812), como visitante sin cuenta.
**Recorrido:** inicio → tienda → categoría Baño → búsqueda («sombrilla», «toalla») → ficha simple (sombrilla) → ficha con colores (sábanas Majestic) → añadir al carrito → carrito → pago (**sin pulsar «Continuar por WhatsApp»**, no se hizo ningún pedido) → Mi cuenta → tienda de Thaly (`?ref=CV36THALYHG0`). El carrito de prueba quedó vacío.
**No se probó:** la página de «pedido recibido» (habría que hacer un pedido de verdad) ni un producto agotado del todo.
**Capturas:** carpeta `auditoria-cliente-2026-10-13/` (al lado de este archivo). `antes-…` = como estaba; `despues-…` = como quedó.

## Qué se publicó

**Core 3.13.84 (17:59) → 3.13.86 (18:12, hora de Cuba), en vivo.** Commit Casa-Viva `b0849ee`. Los retoques 3.13.85 y 3.13.86 solo hicieron el botón más estrecho y lo apartan de botones y precios; se subió el número para que los teléfonos no se queden con la versión vieja guardada. Solo cambia cómo se ve; no toca precios, existencias, comisiones ni pedidos.

**Cúrru («Ayuda»), cómo se comporta ahora:**
- En vez de dos círculos grandes (Cúrru + WhatsApp verde), hay **un solo botón pequeño «Ayuda»**: la cara de Cúrru con la palabra debajo. Mide 52 × 59 px, va pegado abajo a la derecha, encima de la barra de abajo y de la barra de compra.
- **En el móvil ya no sale el círculo verde de WhatsApp.** WhatsApp está dentro de Ayuda: al abrirla hay un botón «WhatsApp» arriba. Si se entró por el enlace de una gestora, ese WhatsApp es el de ella (en la tienda de Thaly va a su número).
- **En la ficha de un producto no sale** hasta que la persona baja más allá de los botones de compra. Junto a los botones ya estaba «¿Dudas? Pregúntale a Curru».
- **Se aparta sola:**
  - cuando la persona baja leyendo la lista (vuelve al subir un poco);
  - mientras escribe en un campo (por ejemplo, el correo en Mi cuenta);
  - cuando, al parar, quedaría encima de un botón, un precio o un nombre de producto.
- **En el carrito y en el pago no hay nada flotando** (ya era así).
- **Al abrir Cúrru en el teléfono ya no salta el teclado**, así se ven los botones de preguntas rápidas.
- En el ordenador queda «Ayuda» encima del círculo de WhatsApp, como antes pero más pequeño.

Antes y después:
- `antes-03-ficha-sombrilla.jpg` y `despues-03-ficha-sombrilla.jpg`.
- `antes-13-mi-cuenta-flotantes-tapan-campos.jpg` y `despues-13-mi-cuenta.jpg`.

**Para volver atrás (en el servidor):**
- `~/bak-20261013-cvd-3.13.83-antes-3.13.84`: todo el plugin como estaba.
- `~/bak-20261013-cvd-3.13.84-retoque1` y `~/bak-20261013-cvd-3.13.85-antes-3.13.86`: los retoques.

## Tabla de problemas

Gravedad: **Alta** = puede hacer perder la venta · **Media** = molesta o confunde · **Baja** = detalle.

| # | Problema | Dónde | Gravedad | ¿Arreglado? | Captura |
|---|---|---|---|---|---|
| 1 | Cúrru y el círculo de WhatsApp flotaban encima de la foto, del nombre del producto y de los campos para escribir (correo y contraseña en Mi cuenta). Eran dos botones grandes a la vez. | Todas las páginas, sobre todo la ficha, el inicio y Mi cuenta | Alta | **Sí** (un solo botón «Ayuda», pequeño; ver arriba) | antes-01, antes-03, antes-07, antes-13 · despues-01, despues-03, despues-13 |
| 2 | La barra fija de compra dejaba ver el texto de detrás (el «US$15.0» fantasma). Con la barra de abajo y Cúrru ocupaban ~25 % de la pantalla, y salía desde el principio porque el botón quedaba fuera de la pantalla. | Ficha | Alta | **Sí**: barra opaca. Ahora el botón «Añadir al carrito» se ve en la primera pantalla, así que la barra solo sale al bajar. | antes-06, antes-07 · despues-03, despues-04 |
| 3 | La ventana «Ofertas» se abría sola encima de todo (en la búsqueda y en las categorías). El toque caía en otra oferta: se buscaba «sombrilla» y se abría una crema facial. | Búsqueda, tienda, categorías | Alta | **Sí**: en el teléfono y en la búsqueda ya no se abre sola. Las ofertas siguen en el inicio («A buen precio») y en «Ver todas». | antes-17 |
| 4 | «Comprar ahora» sin haber elegido color (en la ficha y en la barra fija) recargaba la página con un error rojo. Eso gasta datos y confunde. | Ficha de productos con colores o tallas | Alta | **Sí**: ahora baja hasta «Elige el color» y lo marca. La barra dice «Elegir color» hasta que se elige. | antes-16 · despues-16 |
| 5 | En la tienda de una gestora, el círculo de WhatsApp, «Pedir por WhatsApp» de la ficha, el pie y el botón «WhatsApp» del inicio llevan a Casa Viva (5405 6173), no a la gestora. Cúrru sí llevaba a la gestora. | Tienda de Thaly (`?ref=…`) | Alta (para las gestoras) | **En parte**: el WhatsApp de Ayuda va a la gestora. Lo demás es una **propuesta** (decide a quién escribe el cliente). | antes-14 |
| 6 | Con varias personas a la vez (8 páginas de producto al mismo tiempo), 9 de 289 páginas dieron **error 500**. Una a una, todas dan 200. Parece el límite del plan de Hostinger. | Fichas, sobre todo con `?ref=` (no se guardan en caché) | Alta | **No** → propuesta | — |
| 7 | El nombre del producto salía a 32 px en 3 líneas. Además había un hueco de 52 px arriba. El precio y el botón quedaban debajo del borde. | Ficha | Media | **Sí**: nombre a 22 px y menos hueco. Foto, nombre, precio, «Disponible» y «Añadir al carrito» caben en la primera pantalla. | antes-03 · despues-03 |
| 8 | En la tienda había ~425 px de títulos, buscador, filtros, conteo y orden antes del primer producto. No se veía ningún precio en la primera pantalla. | Tienda, categorías, búsqueda | Media | **Sí**: menos hueco, título más pequeño, conteo y orden más juntos. Ya se ven los precios de la primera fila. | antes-02, antes-05 · despues-02, despues-05 |
| 9 | Tres botones igual de fuertes («Añadir al carrito», «Comprar ahora» y «Pedir por WhatsApp» relleno). No se sabe cuál tocar. | Ficha | Media | **Sí**: «Pedir por WhatsApp» pasa a botón de borde. «Comprar ahora» queda como el único fuerte. | antes-04 · despues-16 |
| 10 | Fotos de proveedor con letreros, iconos, medidas o textos en inglés (va contra nuestras reglas de fotos). | Sombrilla para auto, rasuradora portátil, cortinero expandible, albornoces (talla L) azul y beige, crema facial (caja en inglés) | Media | **No**: es trabajo del agente de fotos | antes-03, antes-05, antes-17 |
| 11 | Páginas pesadas para datos caros. Una ficha pesa ~1,5 MB. WooCommerce **pre-descarga ~550 KB** del carrito (React y otros) en cada ficha. Además, cada página pregunta al servidor cuántos productos hay en el carrito. | Todas | Media | **No** → propuesta | — |
| 12 | Nombres de producto en MAYÚSCULAS en las cuadrículas («SOMBRILLA RECTANGULAR…»). Se leen peor y van contra la marca: mayúsculas solo para títulos cortos. | Tienda, búsqueda, relacionados | Media | **Sí** | antes-02, antes-05 · despues-02, despues-05 |
| 13 | Colores escritos como código («azul-claro», «gris-oscuro», «verde» en minúscula). Además, con un solo color disponible había que elegirlo igual en la lista. | Ficha con colores | Baja | **Sí**: se ve «Azul claro» y «Verde», y si queda una sola opción se elige sola. El valor guardado no cambia. | — |
| 14 | Al abrir Cúrru en el móvil se abría el teclado y tapaba las preguntas rápidas. | Cúrru | Baja | **Sí** | antes-15 · despues-15 |
| 15 | «Completa tu compra» y «Productos relacionados» enseñaban los mismos productos, uno debajo del otro. | Ficha | Baja | **Sí**: queda uno (menos fotos que bajar) | — |
| 16 | «Entre calles, apartamento o piso» no tenía etiqueta visible: solo se veía el ejemplo dentro del campo. | Pago | Baja | **Sí** | antes-10 |
| 17 | En el pago dice «¿Cómo paga el cliente?», pero quien llena es el propio cliente. | Pago | Media | **No** → propuesta. Ese texto lo pidió Lennys el 12-oct. | antes-11 |
| 18 | «Pedidos» en la barra de abajo lleva a entrar con usuario y contraseña. Quien compró sin cuenta no puede ver cómo va su pedido. | Barra de abajo, Mi cuenta | Media | **No** → propuesta | antes-13 |
| 19 | «Armado por el mensajero (5 o 10 USD)» sale con cualquier producto, también con una sombrilla. | Pago | Baja | **No** → propuesta | antes-11 |
| 20 | La franja grande «Regala a tu familia en La Habana» sale en cada ficha entre los botones y la descripción. La descripción y las medidas quedan escondidas en «Características y descripción». | Ficha | Baja | **No** → propuesta | antes-04 |
| 21 | Datos de producto con fallos: «Paragua» (es «Paraguas»), «Juego de sabanas» sin tilde, «Casas en Miniatura – 8 cm c- 89045» con el código del proveedor en el nombre. | Inicio, búsqueda | Baja | **No**: son datos de producto | — |
| 22 | En el inicio nuevo, «Recién llegados» son casi todo electrónica bajo pedido (móviles, fundas, laptop de 595 USD). Para una tienda del hogar, eso confunde. | Inicio (portada nueva 3.13.83) | Baja | **No** → propuesta para quien lleva la portada | despues-01 |
| 23 | La tarjeta de entrar en Mi cuenta tiene un hueco vacío arriba. | Mi cuenta | Baja | No | despues-13 |

**Lo que funciona bien:**
- **El carrito** está limpio, sin nada flotando.
- **El pago:**
  - explica que la mensajería se paga aparte, en CUP, al mensajero;
  - al elegir «Efectivo en pesos (CUP)» dice la cifra exacta: «Son 11.775 CUP (15 USD × 785)»;
  - La Habana ya viene puesta.
- **Los colores agotados** ya no salen en la lista.
- **El inicio nuevo** enseña el precio en CUP debajo del de USD.
- **Enlaces:** de 289 revisados, ninguno está roto (los 500 del punto 6 eran por carga).

## Propuestas para Ernesto (no se tocaron: son dinero, pedidos o reglas)

1. **WhatsApp de la gestora en todas partes (punto 5).** En la tienda de una gestora, que lleven a su WhatsApp:
   - «Pedir por WhatsApp» de la ficha;
   - el pie;
   - el botón «WhatsApp» del inicio.

   Ayuda ya lo hace. Hay que decidir si el cliente de una gestora debe escribir a ella o a Casa Viva (el bot).
2. **Errores 500 con varias visitas a la vez (punto 6).** Hay que mirar el plan de Hostinger (procesos a la vez) o guardar en caché también las fichas con `?ref=`. Es importante antes de anunciar productos en el canal, cuando entra mucha gente junta.
3. **Menos datos (punto 11):**
   - quitar la pre-descarga del carrito de WooCommerce en las fichas (~550 KB);
   - no preguntar el número del carrito al servidor en cada página;
   - usar fotos más pequeñas en la ficha (hoy baja la de 1600 px).
4. **«¿Cómo paga el cliente?» (punto 17).** Que diga «¿Cómo vas a pagar?» cuando llena un cliente, y lo de ahora cuando llena una gestora o la tienda. Lo decide Lennys, porque lo pidió ella.
5. **Ver el pedido sin cuenta (punto 18).** Por ejemplo, con el número de pedido y el teléfono. O que «Pedidos» explique «Te escribimos por WhatsApp» cuando no hay sesión.
6. **«Armado por el mensajero» (punto 19).** Que solo salga en productos que se arman (muebles, estantes, camas).
7. **Ficha más corta (punto 20).** Mover «Regala a tu familia» más abajo y mostrar las medidas cerca del precio.
8. **Elegir el color tocando su foto.** Ya es una idea de Ernesto. Hoy es una lista desplegable.
9. **Fotos (punto 10).** Pasar al agente de fotos la lista de fichas con letreros o textos.
10. **Portada (punto 22).** Que «Recién llegados» enseñe primero productos del hogar, o separar la tecnología en su propia fila.
11. **Nombres de producto (punto 21).** Corregirlos en el catálogo: «Paraguas», «sábanas», quitar códigos del proveedor.

## Pendiente: «Últimas unidades» en la portada

- **El encargo (18:20):** que «Últimas unidades» salga solo cuando queda **1** (hoy sale con 1 o 2).
- **El cambio:** una línea, en `wordpress/casa-viva-dropship-core/includes/class-cvd-home-rails.php`, línea 33: `LOW_STOCK = 2` pasa a `1`.
- **Por qué no está hecho:** el sistema de permisos lo bloqueó, porque ese archivo es de la portada nueva. Hace falta que Ernesto lo apruebe en el chat de esta sesión.
- **Cuando esté aprobado:** se sube como Core 3.13.87.
