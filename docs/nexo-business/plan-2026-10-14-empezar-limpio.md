# Miércoles 14-oct: empezar limpio

Lo pidió Ernesto el 13-oct a las 22:20: «pensar en todos los errores que cometimos hoy y mañana empezar limpio; ir trazando una estrategia para ponernos al día».

## 1. Errores del 13-oct y la regla que queda

| Error | Qué pasó | Regla desde mañana |
|---|---|---|
| Bienvenida con audios repetidos | El mismo audio genérico les llegó a 8 personas | Se prueba con Ernesto antes de encenderla. Sigue apagada |
| El bot inventó gestoras | Le dijo a Nana nombres que no eran | El bot solo da datos reales del pedido (arreglado) |
| Respuestas de la tienda mal llevadas | Lo que contestó Nana fue a otra pregunta y se guardó conocimiento basura | Una pregunta abierta cada vez. #179 y #180 desactivadas |
| Mensajes dobles | Dos sesiones de Claude escribieron a Nana y a Oliuska | Los chats los lleva **una sola sesión** |
| Precio de Thaly a 30 en vez de 35 | Mandaba el primer enlace y se perdía el `?ref` | Arreglado (3.13.79 a 3.13.81) |
| La web enseñaba el carrito de otra persona | Caché de LiteSpeed | Arreglado (3.13.90) |
| Productos «Privado» a la vista de los administradores | Lennys compró dos en una prueba (#3668) | No salen en la web para nadie (3.13.95). #3668 cancelado |
| Reel de las 8 a las 8:17 y sin texto | La pestaña de Meta estaba detrás de otra | Antes de las 7:30, la pestaña de Meta delante. El texto se revisa antes de publicar |
| El resumen confundió a Lennys | Llamó «Hoy 809 USD» a los pedidos de la web; contó la prueba de Yanet; «Para decidir» traía cosas viejas o resueltas; la pregunta del pago no se entendía | **El resumen se enseña a Ernesto antes de mandarlo.** Se separa «Pedidos de la web» de la caja. Nada de líneas internas |
| Mensajes en inglés a Ernesto | — | Siempre en español (memoria) |
| Promesas sin cumplir | Los tutoriales «Aprende» y «Tu precio» | Si no da tiempo, se dice antes, no después |
| El audio de Ernesto en «Tú» no llegó a Claude | El chat «Tú» no se guarda | Lo importante para Claude, por escrito o en este chat |
| Hostinger sin correos | Límite de 113 al día | Revisar quién manda tantos (pendiente) |

## 2. Cómo nos organizamos (propuesta)

- **Un dueño por cosa:**
  - **Chats:** la sesión de chats (TRASPASO).
  - **Web, redes y resumen:** la sesión principal.
  - **Ventas y decisiones:** Lennys y Ernesto.
- **Un tablero con tres columnas:**
  - **Ernesto decide**
  - **Lennys decide**
  - **Claude hace**

  Cada mañana se elige lo primero de cada columna. Lo que entra nuevo va al tablero, no a la cabeza.
- **Antes de mandar algo a mucha gente** (grupo, resumen o anuncio), se le enseña a Ernesto.

## 3. Inventario: la estrategia para ponernos al día

**Cómo está la web hoy (13-oct, 22:40):**
- **471 publicados.**
  - **207 están en el conteo de Maryta del 13-oct,** y casi todos dicen «ok».
  - **264 no están en el conteo;** 263 entraron desde el 12-oct. Son productos de proveedores (bajo pedido, D47), como teléfonos, laptops o electrónica, y los organizadores nuevos.
- **153 escondidos («Privado»)** por la sincronización vieja de BizneCubano, el 10 y 11-oct. 138 tienen existencias de antes, pero nadie sabe si están en la tienda.

**Del conteo de Maryta:**
- El organizador de 2 niveles está roto: ya está sin existencias.
- Los colchones EDSM «venta directa» llevan puntos en la nota: confirmar con Maryta qué significan.
- Azulejo INCEFRA: nota «caja». Confirmar.

**Pasos:**
1. **Marcar el origen de cada producto:** «En tienda» (conteo) o «Proveedor, bajo pedido 24–48 h». Que la web y el bot lo sepan y lo digan.
2. **Una hoja nueva solo con los 138 escondidos con existencias,** para que la cuenten Maryta o Nana. Lo que esté se publica con la cantidad real; lo que no, se queda escondido.
3. **El conteo de Maryta pasa a ser la verdad de la tienda.** Se cuenta un departamento por día y la web se ajusta a lo contado.
4. **Fotos (regla de Lennys, 13-oct):** cada producto lleva al menos una foto real, una comercial y una con medidas.

## 4. Pendiente por persona

**Lennys (respondió al resumen, 21:52–22:01):**
- Su cierre de caja: 767 USD en efectivo, 147 915 CUP y 8 635 CUP en transferencias. Se le corrige el resumen.
- **Decidió:**
  - mover los productos al departamento correcto;
  - armado en el soporte de TV (el mensajero lleva taladro);
  - armado en las puertas correderas, con el precio más alto;
  - árboles de Navidad: de 2 a 4 USD, solo si el cliente lo pide.
- **Hay que explicarle bien** la pregunta del texto «¿Cómo paga el cliente?».

**Niurka:**
- Sus precios **sí** se guardaron y salen con su enlace (capa de moto: 20 → 21).
- Hay que explicarle que se ven entrando por **su enlace**, no en la tienda general.
- Quiere invitar a una amiga. Ernesto le prometió el 2 % de lo que venda: es una función nueva.

**Rafael:**
- Ernesto le prometió buscar el colchón de medida especial mañana.
- Propone que el gestor vea los dos precios: el de Casa Viva y el suyo.

**Lo que se cortó del mensaje de Ernesto:** «…sin darle a confirmar el carrito de WhatsApp, el…». Hoy el pedido se crea aunque no se confirme por WhatsApp. Ernesto decide qué hacer.

**Del día:**
- Tutoriales de «Aprende» y «Tu precio».
- Ver la bienvenida.
- Bio y foto de Instagram.
- Pie de foto del reel de las sábanas.
- Fotos de 42 y 23.
- Reel de la cama plegable.

## 5. Orden de trabajo desde el 14-oct (Ernesto, 13-oct 22:50)

1. **Corregir los errores de hoy** (tabla del punto 1).
2. **Lo pendiente de Casa Viva:** inventario, catálogo y lo que esperan Lennys y las gestoras.
3. **Las apps propias, primero como ficha** (skill `idea-a-producto`), sin programarlas todavía. Se elige una cuando Casa Viva esté estable.
   - Una app propia con las claves de Google, OpenAI y Claude, que use lo mejor de cada plataforma.
   - Una app de mensajería propia para emprendimientos.
   - Un chat propio de Casa Viva que también se pueda vender.

**Regla que pidió Ernesto:** si se dispersa, Claude se lo dice directo: «Ernesto, enfoquémonos: ahora lo más urgente es X». Se trabaja en **un solo chat**.

**Lo que corre la noche del 13-oct, solo programación:**
- El resumen pone «Pedidos de la web» aparte de la caja y quita las líneas internas.
- Armado según lo que decidió Lennys, y productos movidos a su departamento.
- Hoja de conteo de los 153 escondidos y propuesta de «tienda o proveedor» para los 471 publicados.
