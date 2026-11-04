# Maratón de ideas · General · sábado 24-oct-2026 (15:00–16:00)

Pregunta publicada a las 14:58 (#2880): mejor venta del mes · qué frena las ventas · qué falló (pedido, entrega, cobro) · una cosa nueva para vender más · día y hora de la reunión semanal.

## Lo que dijeron (tal cual, resumido)

| Hora | Quién | Tema | Lo que dijo |
|---|---|---|---|
| 15:05 | Dany (…4351) | Frenos | Sin producto estrella; ventas variadas. Pierde ventas por precio, por no haber lo que piden y por **desconfianza**: al decir que llena un vale para reservar, hay clientes que no quieren dar ni el nombre. |
| 15:06 | Dany | Pide | **Electrodomésticos en la tienda**: los clientes los quieren ya; mientras espera la confirmación del proveedor, compran en otro sitio. |
| 15:07 | Dany | Frenos | Piden justo lo que se agotó. |
| 15:26 | Katia (…9037) | Mejor venta | Producto estrella: **alfombras estilo Persia**. Le gusta la plataforma nueva (galería de fotos propia). |
| 15:26 | Katia | Frenos | Clientes desconfían de dar datos para el vale; piden la **dirección de la tienda** y si ella la esconde para cerrar el vale, desconfían más. **«Bajo pedido»**: creen que ya está disponible y se van con otro gestor. Revolico: ahora «pesca» menos. |
| 15:26 | Katia | Pide | Herramientas de IA / «cazadora de clientes». **Artículos del hogar que resuelvan problemas: pequeños electrodomésticos.** |
| 15:27 | Oliuska (…3737) | Web | En la tienda, «Todo» sigue saliendo por departamento: pide **orden alfabético** como opción. El botón **«En tienda» fue muy bueno**. **«Bajo pedido» es un problema.** |
| 15:33 | Dany | Frenos | Confianza «por tantas estafas»: una clienta que quería ir a la tienda no quiso dar ni su nombre ni la moneda, y se perdió. |
| 15:35 | Dany | — | 2 notas de voz (no se pueden oír desde aquí: el bot no baja audios de grupos). |
| 15:37 | Oliuska | Vale | Si el cliente va a la tienda con el vale del producto, **el nombre puede ser opcional** (ella no ha tenido problemas). |
| 15:37 | Nadielys (…2217) | Mejor venta | **Cortinas tapasol**. |
| 15:37 | Nadielys | Frenos | Mala conexión o sin batería para atender clientes y publicar; clientes piden productos que no hay en la página. |
| 15:37 | Nadielys | Pide | **Comprar:** tapasol en más colores (negro, rojo, rosa…), cortinas translúcidas, cortineros de otros colores/diseños, edredones de otros modelos, fregonas, protectores de colchón Full. **Web:** tabla de precios de mensajería por zona visible para el cliente. |
| 15:44 | Dany | — | Otra nota de voz (sin oír). |
| 15:51 | Katia | Equipo | **Escuchar a los mensajeros**: «la otra mitad de nuestro trabajo es cuando ellos lo entregan». |
| 15:26 | AA (…5949, nueva) | Frenos | Cuando el cliente sabe que es gestora, «se arruina la venta». La espera los desespera: tener **todos los datos a mano**; que la web muestre existencia, lo agotado y **cuándo entra**. |

Después del cierre: 16:09 Zulien (…0827) — una clienta no quiso dar datos ni contestó · 16:11 Caridad (…5855) — «cómo complican las cosas en este país» · 16:13 Zulien — **no debería haber tantos productos bajo pedido**: el cliente lo quiere al momento y son cosas que vende todo el mundo · 16:12 Dany — otra nota de voz.

## En marcha (16:15)
- Lennys: lista de compras enviada (#2898).
- Sesión `web-maraton` (Core 3.14.62, rama `feat/maraton-confianza`): vale tel+zona (nombre opcional), «llega en 24 h», quedan X / vuelve, orden alfabético, tabla de mensajería, caja a nombre de gestora.
- Sesión `bot-maraton` (VivaBot, rama `feat/maraton-voz-bajopedido`): voz transcrita en General y Mensajerías; bajo pedido confirmado al momento (app del proveedor + pregunta inmediata) con medición antes/después.
- Ernesto: proveedores de electrodomésticos.

## Respuestas en el grupo
- 15:20 (#2884) a Dany: anotado; vale más fácil + fotos reales y opiniones; electrodomésticos en tienda; lista «avísame cuando llegue».
- 15:27 (#2885) a Katia y AA: tema común = confianza; menos datos al inicio; «Bajo pedido» que diga «llega en 24 h»; existencias y cuándo vuelve; pequeños electrodomésticos (3 lo piden).

## Ideas para mejorar (propuestas de Claude, sin decidir)
1. **Vale con menos datos** para el primer contacto (nombre + barrio; teléfono al confirmar) y un enlace de la tienda de la gestora con fotos reales y opiniones → baja la desconfianza.
2. **Stock de electrodomésticos rápidos** (los 5 más pedidos) en la tienda o «recoger hoy en el local del proveedor» con hora confirmada.
3. **Lista «avísame cuando llegue»** por producto agotado: el bot avisa a la gestora cuando vuelve.
4. **Etiqueta «Bajo pedido · llega en 24 h»** bien visible en la ficha, en el anuncio que copia la gestora y en el enlace de su tienda (hoy se lee como «disponible»).
5. **Dirección de la tienda como argumento de confianza**: decidir si la gestora puede darla sin miedo (está en los vales) — Katia pierde ventas por esconderla.
6. **Ficha con «quedan X» y «vuelve el día…»** para que la gestora tenga los datos a mano sin preguntar.
7. **«Ve a la tienda y di mi nombre/código»**: el cliente que no quiere dar datos compra en la caja y la venta sale a nombre de la gestora (la caja ya registra ventas de mostrador a nombre de una gestora, 21-oct). **Confirmar con Lennys/Nana** y explicarlo con una guía. Dicho en el grupo a las 15:34 como «lo confirmo con la tienda».
8. **Orden alfabético** en «Todo» de la tienda (Oliuska).
9. **Tabla de mensajería por zona** pública en la web (Nadielys).
10. **Lista de compras pedida por las gestoras** (tapasol colores, translúcidas, cortineros, edredones, fregonas, protector Full, pequeños electrodomésticos) → a Lennys para la próxima compra.
12. **Maratón con los mensajeros** en Mensajerías (Katia) y traer sus respuestas al General. Dicho en el grupo 15:52 como «apuntado».
11. **Mala conexión / batería**: anuncios del día listos para reenviar en 1 toque y respuestas del bot por ellas (mismo problema que resuelve Pa'llá para mensajeros).

## Cierre (16:06, #2897, estilo Hormozi)
Publicado en el General: «el cliente no se va por el precio, se va por desconfianza y por esperar» + 5 compromisos (confianza, bajo pedido 24 h, datos a mano, productos pedidos, maratón con mensajeros) + «cada semana les contamos qué ya está listo». Mensajerías invitada al debate a las 15:53 (#2896); ningún mensajero escribió.

## Para hacer (prometido en el grupo)
1. **Vale con menos datos** al principio (Core: nombre opcional; teléfono al confirmar).
2. **«Ve a la tienda y di el nombre de tu gestora»**: confirmar con Nana/Lennys que la caja lo registra y explicarlo con guía.
3. **«Bajo pedido · llega en 24 h»** visible en ficha, anuncio copiable y tienda de la gestora.
4. **Web:** «quedan X» y «vuelve el día…», orden alfabético en «Todo», tabla de mensajería por zona.
5. **Compras (Lennys):** pequeños electrodomésticos en tienda, tapasol colores, translúcidas, cortineros, edredones, fregonas, protector Full.
6. **Maratón en Mensajerías.**
7. **Reunión semanal:** nadie contestó la pregunta 5 (día y hora) → preguntarla aparte.
8. Notas de voz de Dany (3) sin oír → Ernesto.
