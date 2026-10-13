# Elegir el color tocando su foto, como en Amazon o Temu

**Idea de Ernesto, 13-oct-2026 ~16:00.** Apuntada para trabajar en ella; todavía no se construye. Etapa 1 hecha.

| | |
|---|---|
| **Quién** | Clientes de la web, y gestores y gestoras en su tienda espejo y en «Fotos para publicar». |
| **Problema** | Hoy se elige el color en un menú desplegable («Diseño: Elige una opción»). En la ficha solo sale una foto, aunque cada color ya tenga la suya, y para ver otro color hay que abrir el menú. En BizneCubano la foto cambiaba al elegir el color, y la gente lo echa de menos. |
| **Evidencia (13-oct)** | Rafael, 10:41: la foto no cambia al elegir el color. Dany: quiere foto por color en las recogidas. Luz: las sábanas tienen colores pero no sus fotos. Thaly: necesita las fotos de los colores del set de baño. Dayana, 15:40: ¿por qué la sobrecama no cambia de foto como en BizneCubano? |
| **Qué es** | Debajo del precio, una fila de **fotos pequeñas, una por color**, con su nombre debajo. Al tocar una cambia la foto grande, y ese color queda elegido para comprar, sin menú. El agotado sale gris y tachado, sin poder elegirse. Con un solo color, no sale ni la fila ni el menú. |
| **Para gestores** | Lo mismo en su tienda espejo, con su precio. En «Fotos para publicar», cada color sale como foto descargable con su nombre, para mandar la del color que pide el cliente. |
| **Cómo se mide** | Ventas de productos con colores antes y después, preguntas «¿tienen la foto del color X?» al bot (deberían bajar) y pedidos con el color equivocado. |
| **Qué existe ya** | WooCommerce ya cambia la foto al elegir la variación si esa variación tiene imagen. Ya tienen foto por color las sábanas Majestic (2491, 9 colores) y la sobrecama lisa full (118, 5 colores). Quedan unos 30 productos y unos 100 colores sin foto propia: se hacen con Gemini gratis si son lisos, con foto real si son estampados, y con la galería de BizneCubano, que se está importando. |

## Notas para construirlo

- **Dónde va:** en Core, como plugin propio. Una plantilla de «swatches» sobre el formulario de variaciones de WooCommerce, ocultando el `<select>` pero manteniéndolo para que el carrito funcione igual. Sin añadir plugins de terceros.
- **Rendimiento:** en móvil, las fotos pequeñas a 96–120 px en webp y con carga diferida, porque los datos en Cuba cuestan.
- **Accesibilidad:** cada foto es un botón con el nombre del color, usable con el teclado y con un estado claro de «elegido».
- **Cuidado con:** la tienda espejo (`?ref=`), el carrito con precio fijado por la gestora y la pestaña «Fotos para publicar».
- **Antes de programar:** boceto para móvil (etapa 2), y Ernesto lo ve.
