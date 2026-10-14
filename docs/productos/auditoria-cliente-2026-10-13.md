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

## Segunda tanda: Core 3.13.88 → 3.13.94 (18:40–20:05, en vivo)

**Pedido por:** Ernesto, 18:40: «usamos el wp de la gestora en toda su tienda, arregla todo lo de la auditoría en segundo plano también… lo del plan de Hostinger lo vemos pendiente». Hecho por un agente de Claude Code. Nada de precios, comisiones, existencias ni pedidos. No se mandó ningún mensaje a nadie.

| Versión | Qué arregla | Commit Casa-Viva | Copia para volver atrás (en el servidor) |
|---|---|---|---|
| 3.13.88 | WhatsApp de la gestora en toda su tienda (punto 5, **D52**) | `3fc0d0e` | `~/bak-20261013-cvd-3.13.87-antes-3.13.88` + `~/bak-20261013-tema-footer-antes-3.13.88.php` + `~/bak-20261013-marca-antes-3.13.88.php` |
| 3.13.89 | Ver el pedido sin cuenta (18), armado solo en lo que se arma (19), «Regala» en una línea (20), `/ayuda/` sin «hasta un 30 %» | `83a6cc7` | `~/bak-20261013-cvd-3.13.88-antes-3.13.89` + `~/bak-20261013-marca-antes-3.13.89.php` + `~/bak-20261013-pagina-2815-antes-3.13.89.html` |
| 3.13.90 | **Fallo nuevo, de privacidad:** la caché servía el carrito de una persona a otra | `75af109` | `~/bak-20261013-cvd-3.13.89-antes-3.13.90` |
| 3.13.91 | Menos datos (11) y páginas «con carrito» fuera de la caché | `aaefcb2` | `~/bak-20261013-cvd-3.13.90-antes-3.13.91` |
| 3.13.92 | Quita también el resto de la pre-descarga del carrito | `208a9f5` | `~/bak-20261013-cvd-3.13.91-antes-3.13.92` |
| 3.13.93 | Mi cuenta: «¿Compraste sin cuenta? Ver mi pedido» y sin título vacío (23) | `73df935` | `~/bak-20261013-cvd-3.13.92-antes-3.13.93` |
| 3.13.94 | Tarjeta de Mi cuenta sin hueco y un detalle de «Mi pedido» | `bb77220` | `~/bak-20261013-cvd-3.13.93-antes-3.13.94` |

**1. WhatsApp de la gestora en toda su tienda (3.13.88, D52).**
- **Regla, en una sola función** (`CVD_Gestora_Store::contact()`):
  - si se entró por el enlace de una gestora (ahora o antes en ese teléfono), todo WhatsApp va a **ella**;
  - un cliente con cuenta, sin enlace, va a su gestora de siempre;
  - sin gestora, a Casa Viva (5405 6173).
  - Nunca sale el número de otra gestora. El equipo (gestoras, mensajeros, tienda) habla con Casa Viva. La gestora que abre **su** tienda con su sesión ve su número, lo mismo que sus clientes.
- **Dónde:**
  - el pie («WhatsApp de Thalia: 5841 2987»);
  - el botón verde del ordenador;
  - «Pedir por WhatsApp» y «Avísame por WhatsApp» de la ficha;
  - Ayuda (Cúrru);
  - las páginas Atención al cliente, Formas de pago y Condiciones de mensajería;
  - `/contacto/`;
  - el carrito vacío (pie);
  - el pedido recibido («Corrige tu pedido», a la gestora del pedido).
- **El texto ya escrito** nombra el producto en la ficha, por ejemplo: «Hola, vi en tu tienda de Casa Viva. Quiero pedir: Organizador con ruedas · US$35.00 · enlace · Municipio de entrega:». El precio es el de la gestora.
- **No cambia:** en `/ayuda/`, el botón «Entrar con WhatsApp» (*mi acceso*) sigue yendo a Casa Viva, porque es una orden para el bot.
- **Comprobado:** con el enlace de Thaly (`CV36THALYHG0`), en inicio, tienda, ficha, carrito, Atención al cliente y `/contacto/`, todos los enlaces van a 5358412987. Sin enlace, todos van a 5354056173. Probado con curl y en un Chrome sin pantalla, a 390 px.
- **También comprobado:** quien abrió el enlace antes y vuelve sin él sigue viendo a Thaly, y esa página no se guarda en caché. Otro visitante sigue viendo a Casa Viva (desde la caché, sin mezclar).
- **Fuera del repositorio** (solo en el servidor, con copia):
  - el pie del tema (`footer.php`);
  - el plugin de marca (`casa-viva-marca.php`).
  - Los dos llaman a la función de Core.

**2. Ver el pedido sin cuenta (3.13.89 y 3.13.93; punto 18).**
- **«Pedidos» de la barra de abajo**, sin sesión, lleva a `casaviva.company/seguimiento/` («Busca tu pedido»):
  - número del pedido + teléfono del pedido, y lleva al seguimiento del pedido (el mismo enlace con clave que ya va en el vale);
  - si no coinciden, un aviso que no dice si el número existe;
  - como mucho 8 intentos por conexión cada media hora;
  - el teléfono va por formulario, nunca en la dirección.
- **Pedido recibido** (quien compró sin cuenta): botón «Ver mi pedido» y una nota con el número del pedido. El teléfono lo recuerda en «Tus pedidos en este teléfono».
- **Mi cuenta** (pestaña Clientes): arriba sale «¿Compraste sin cuenta? Ver mi pedido».
- **Cúrru** («Mis pedidos»), sin sesión, también lleva ahí.
- **Recogida en tienda:** tiene sus propios pasos (confirmado, preparando, listo para recoger, recogido) y la dirección.
- **Comprobado** con 3 pedidos de prueba («PRUEBA»; sin enseñar teléfonos ni claves): número + teléfono → su seguimiento. Un dato equivocado → aviso.
- **No se pudo probar:** la página de pedido recibido con un pedido de verdad, porque no se hizo ningún pedido.

**3. «Armado por el mensajero» solo donde se arma (3.13.89; punto 19).**
- Sale si en el carrito hay algo que se arma, según el nombre: escritorio, silla, mesa, estante, zapatera, perchero, corral/cuna, sofá, butaca, mueble, góndola, organizador de niveles o con ruedas…
- No sale con lo que solo nombra un mueble: «forro para sillas», «lámpara de mesa», «cama plegable», «soporte de TV».
- Hoy son **20 productos**: organizador con ruedas, estante 5 niveles, góndola, 3 sofás/butacas, escritorio, silla de oficina, 2 zapateras, perchero, percha doble con zapatera, 2 organizadores de baño, organizador de 2 niveles, 2 estantes de baño y 2 corrales.
- **Las gestoras y la tienda lo ven siempre**, por si la regla falla.
- **Para forzar un producto:** dato `_cvd_needs_assembly` = `yes` o `no`.
- **Comprobado** en el pago real: con la sombrilla no sale; con la zapatera sí. Carritos de prueba vaciados.

**4. «Regala a tu familia» (3.13.89; punto 20).**
- En la ficha ya no es la franja grande entre los botones y la descripción.
- Ahora es **una línea** debajo de «Características y descripción»: «🎁 ¿Vives fuera de Cuba? Regala a tu familia en La Habana… Formas de pago».
- La función sigue.

**5. `/ayuda/` y el «hasta un 30 %».**
- **La regla:** no hay tope.
  - `/root/supervisor/CLAUDE.md`: «Ya no hay límite del 30 %… (Ernesto, 2026-10-09)».
  - Core no tiene tope desde 3.13.42.
  - En la base hay 0 productos y 0 gestoras con tope propio.
- **Se cambió solo esa frase** (página 2815): «Puedes subir tu precio lo que quieras: la diferencia también es tuya.»
- Precios y comisiones, sin tocar.
- La imagen de la guía 3 sigue diciendo 30 % (ver ESTADO L5).

**6. Menos datos y menos carga (3.13.90–3.13.92; punto 11).**
- **La «pre-descarga de ~550 KB» del informe tenía una causa:** la caché (LiteSpeed) guardaba la página que se pintó para alguien con productos en el carrito y se la daba a todos.
  - El contador del carrito salía en 1 a gente con el carrito vacío.
  - Cada visita bajaba 51 archivos del carrito de WooCommerce (React…), **~627 KB comprimidos**.
  - **Arreglado:** una página pintada con carrito ya no se guarda, y esa pre-descarga ya no se pide nunca.
- **Fallo de privacidad encontrado al probar (3.13.90):** la caché también guardaba la API del carrito (`/wp-json/wc/store/v1/cart`). Un visitante sin cookies recibió el carrito de prueba de otra persona. El panel lateral del carrito del plugin de marca usa esa API. **Arreglado:** esa API ya no se guarda nunca. Probado.
- **El contador del carrito** ya no pregunta al servidor en cada página: solo si hay carrito. Es una carga menos de WordPress por visita, y ayuda con los errores 500.
- **En la ficha:**
  - en el teléfono, sin lupa; tocar la foto la abre igual. La lupa bajaba la foto grande nada más abrir;
  - las fotos 3, 4… de la galería se bajan al verlas;
  - las tarjetas de producto piden la foto de media pantalla.
- **Interruptor:** `wp option update cvd_data_saver no`.
- **Medido** en un Chrome de teléfono (390 px, perfil limpio): ficha ~400–500 KB y tienda ~500 KB sin carrito. Varía con los productos de «Completa tu compra». Con algo en el carrito ya no se suman los ~627 KB.
- **Plan de Hostinger:** sin tocar (pendiente, como dijo Ernesto).

## Tercera tanda: Core 3.13.96 y departamentos (22:40–23:00, en vivo)

**Pedido por:** Lennys, 22:01. Ella es la administradora: su pedido cuenta como aprobado. Ernesto pidió hacerlo esa misma noche. Lo hizo un agente de Claude Code. No se tocaron precios de productos, comisiones ni pedidos, y no se mandó ningún mensaje.

**Armado (Core 3.13.96, commit Casa-Viva `a400222`).** Lo que dijo Lennys:
- «Ofrece armado en soporte de TV (el mensajero tiene que llevar taladro)».
- «Las puertas correderas también… está en las ofertas más altas».
- «Arbolitos de Navidad… de 2 a 4 USD».

| Producto | En el pago sale | Precio | Nota |
|---|---|---|---|
| Soporte de TV (los 3: 2595, 822, 367) | «Sí, instalar el soporte en la pared (5 USD)» | 5 USD (la opción baja) | **Taladro:** sale en la nota del pedido, el vale de WhatsApp, la carrera del mensajero (portal y «Nueva carrera») y el aviso de VivaBot: «lleva TALADRO para abrir los huecos del soporte de TV» |
| Puerta de corredera (2555, 2525) | «Sí, instalar la puerta (10 USD)» | 10 USD, la más alta | Solo esa opción |
| Árbol de Navidad (2381) | «Sí, armar el árbol (3 USD)» | **3 USD**, una opción nueva, «armado sencillo» | Las otras opciones son 5 y 10 USD, así que ni 2 ni 4 encajaban mejor: se usó el punto medio |

- Todo lo demás sigue igual: los 20 muebles de antes con 5 o 10 USD, y la sombrilla sin armado.
- Las gestoras y la tienda siguen viendo todas las opciones.
- Si en el carrito hay varias cosas, salen las opciones de todas.
- **Dato nuevo por producto:** `_cvd_assembly_kind` = `simple`, `small` o `large`, para fijar el precio de armado de un producto.
- **El soporte de TV a 5 USD es deducción:** Lennys dijo que la puerta «es un poco más complicada», y por eso el soporte va en la opción baja. Que lo confirme.
- **Comprobado** en el pago real, como visitante, con curl y con Chrome sin pantalla a 390 px:
  - con los 3 productos juntos salen las 3 opciones y la nota del taladro;
  - el total se queda en 140 USD, porque el armado no se suma;
  - cada producto solo enseña su opción;
  - la sombrilla, sin campo;
  - la zapatera, con 5 y 10 USD.
  - Los carritos de prueba se vaciaron.
- El aviso de VivaBot se probó con su propio código (`assemblyLine`): no hizo falta cambiar el bot.
- **Para volver atrás:** `~/bak-20261013-cvd-3.13.95-antes-3.13.96`.

**Departamentos: 18 productos movidos.** Solo cambió la categoría (precio, existencias, nombre, foto y estado comprobados sin cambio):
- 9 mochilas de Habitación a Accesorios, donde ya estaban las otras;
- soporte de TV 40"x80" y las 2 puertas correderas: fuera de Cocina (punto 5 de las propuestas);
- 2 cojines: fuera de Organización;
- búcaro, maceta con suculenta y ramo de girasoles: de Organización a solo Sala y muebles;
- brazalete deportivo para celular: a Accesorios.

Lista para deshacerlo: `departamentos-movidos-2026-10-13.csv` (y en el servidor, `~/bak-20261013-departamentos-movidos.csv`). Lo que tiene duda queda para Lennys en `departamentos-dudosos-2026-10-13.md`: juguetes, patines, tabla de planchar, azulejo… y el aviso de que el panel guarda su propia categoría.

## Fotos para el agente de fotos (punto 10, no se editó ninguna)

Revisadas a mano. Id del producto · nombre · foto (id del adjunto) · qué tiene:

| Producto | Foto | Qué tiene | Idea |
|---|---|---|---|
| 2579 · Sombrilla rectangular para interior de auto | principal (2877) | Collage con 4 cuadros y textos («Bloquea el calor…», «Fácil de instalar»…) | Foto limpia del producto |
| 2825 · Rasuradora portátil facial | principal (2826) | Infografía: textos, iconos, «EN USO», «INCLUYE» | La galería 3615 está limpia: ponerla de principal |
| 299 · Rasuradora portátil recargable | principal (298) | Infografía con lista de textos e «INCLUYE» | La galería 300 está limpia (con su caja): de principal |
| 391 · Cortinero expandible plateado | principal (390) | «SIN TALADROS. SIN COMPLICACIONES.», medidas e iconos | Foto limpia |
| 2363 · Albornoz (talla L) azul | principal (2834) | Letrero «Suavidad y confort para tu rutina» + iconos de tela | Recortar el letrero o foto limpia |
| 2365 · Albornoz (talla L) beige oscuro | principal (2835) | El mismo letrero | Igual |
| 2391 · Albornoz (talla L) beige | principal (2837) | El mismo letrero | Igual |
| 2363 / 2365 / 2391 · Albornoces | galería (3650 / 3649 / 3648) | En su bolsa con la etiqueta «BATHROBE» | Aceptable (es el envase); mejor sin ella |
| 268 · Crema facial arcilla, vit. C y cúrcuma | principal (267) | Caja en inglés («VITAMIN C & TURMERIC CLAY FACE MASK») | Es la caja real: lo decide Lennys |
| 340 · Crema HOYGI vit. C, cúrcuma y 5 % hialurónico | principal (339) | Caja en inglés | Igual |
| 2489 · Paragua infantil (55 cm) | principal (2654) | Collage (foto grande + 4 círculos) | Una sola foto |
| 2858 · Paragua inverso estampado 8 varillas | principal (2862) | Collage (1 grande + 6 pequeños) | Una sola foto |

Los nombres «Paragua» (2489, 2828, 2858) deberían ser «Paraguas» (punto 21).

## Tabla de problemas

Gravedad: **Alta** = puede hacer perder la venta · **Media** = molesta o confunde · **Baja** = detalle.

| # | Problema | Dónde | Gravedad | ¿Arreglado? | Captura |
|---|---|---|---|---|---|
| 1 | Cúrru y el círculo de WhatsApp flotaban encima de la foto, del nombre del producto y de los campos para escribir (correo y contraseña en Mi cuenta). Eran dos botones grandes a la vez. | Todas las páginas, sobre todo la ficha, el inicio y Mi cuenta | Alta | **Sí** (un solo botón «Ayuda», pequeño; ver arriba) | antes-01, antes-03, antes-07, antes-13 · despues-01, despues-03, despues-13 |
| 2 | La barra fija de compra dejaba ver el texto de detrás (el «US$15.0» fantasma). Con la barra de abajo y Cúrru ocupaban ~25 % de la pantalla, y salía desde el principio porque el botón quedaba fuera de la pantalla. | Ficha | Alta | **Sí**: barra opaca. Ahora el botón «Añadir al carrito» se ve en la primera pantalla, así que la barra solo sale al bajar. | antes-06, antes-07 · despues-03, despues-04 |
| 3 | La ventana «Ofertas» se abría sola encima de todo (en la búsqueda y en las categorías). El toque caía en otra oferta: se buscaba «sombrilla» y se abría una crema facial. | Búsqueda, tienda, categorías | Alta | **Sí**: en el teléfono y en la búsqueda ya no se abre sola. Las ofertas siguen en el inicio («A buen precio») y en «Ver todas». | antes-17 |
| 4 | «Comprar ahora» sin haber elegido color (en la ficha y en la barra fija) recargaba la página con un error rojo. Eso gasta datos y confunde. | Ficha de productos con colores o tallas | Alta | **Sí**: ahora baja hasta «Elige el color» y lo marca. La barra dice «Elegir color» hasta que se elige. | antes-16 · despues-16 |
| 5 | En la tienda de una gestora, el círculo de WhatsApp, «Pedir por WhatsApp» de la ficha, el pie y el botón «WhatsApp» del inicio llevan a Casa Viva (5405 6173), no a la gestora. Cúrru sí llevaba a la gestora. | Tienda de Thaly (`?ref=…`) | Alta (para las gestoras) | **Sí (3.13.88, D52)**: en su tienda, todo WhatsApp va a la gestora | antes-14 |
| 6 | Con varias personas a la vez (8 páginas de producto al mismo tiempo), 9 de 289 páginas dieron **error 500**. Una a una, todas dan 200. Parece el límite del plan de Hostinger. | Fichas, sobre todo con `?ref=` (no se guardan en caché) | Alta | **En parte**: menos carga (3.13.91: sin llamada al servidor por el carrito en cada página; caché sin mezclar). El plan de Hostinger queda **pendiente** (Ernesto) | — |
| 7 | El nombre del producto salía a 32 px en 3 líneas. Además había un hueco de 52 px arriba. El precio y el botón quedaban debajo del borde. | Ficha | Media | **Sí**: nombre a 22 px y menos hueco. Foto, nombre, precio, «Disponible» y «Añadir al carrito» caben en la primera pantalla. | antes-03 · despues-03 |
| 8 | En la tienda había ~425 px de títulos, buscador, filtros, conteo y orden antes del primer producto. No se veía ningún precio en la primera pantalla. | Tienda, categorías, búsqueda | Media | **Sí**: menos hueco, título más pequeño, conteo y orden más juntos. Ya se ven los precios de la primera fila. | antes-02, antes-05 · despues-02, despues-05 |
| 9 | Tres botones igual de fuertes («Añadir al carrito», «Comprar ahora» y «Pedir por WhatsApp» relleno). No se sabe cuál tocar. | Ficha | Media | **Sí**: «Pedir por WhatsApp» pasa a botón de borde. «Comprar ahora» queda como el único fuerte. | antes-04 · despues-16 |
| 10 | Fotos de proveedor con letreros, iconos, medidas o textos en inglés (va contra nuestras reglas de fotos). | Sombrilla para auto, rasuradora portátil, cortinero expandible, albornoces (talla L) azul y beige, crema facial (caja en inglés) | Media | **Lista hecha** (arriba, «Fotos para el agente de fotos»); fotos sin tocar | antes-03, antes-05, antes-17 |
| 11 | Páginas pesadas para datos caros. Una ficha pesa ~1,5 MB. WooCommerce **pre-descarga ~550 KB** del carrito (React y otros) en cada ficha. Además, cada página pregunta al servidor cuántos productos hay en el carrito. | Todas | Media | **Sí (3.13.90–3.13.92)**: era la caché (ver arriba); sin pre-descarga del carrito, sin consulta del carrito en cada página, sin lupa en el teléfono | — |
| 12 | Nombres de producto en MAYÚSCULAS en las cuadrículas («SOMBRILLA RECTANGULAR…»). Se leen peor y van contra la marca: mayúsculas solo para títulos cortos. | Tienda, búsqueda, relacionados | Media | **Sí** | antes-02, antes-05 · despues-02, despues-05 |
| 13 | Colores escritos como código («azul-claro», «gris-oscuro», «verde» en minúscula). Además, con un solo color disponible había que elegirlo igual en la lista. | Ficha con colores | Baja | **Sí**: se ve «Azul claro» y «Verde», y si queda una sola opción se elige sola. El valor guardado no cambia. | — |
| 14 | Al abrir Cúrru en el móvil se abría el teclado y tapaba las preguntas rápidas. | Cúrru | Baja | **Sí** | antes-15 · despues-15 |
| 15 | «Completa tu compra» y «Productos relacionados» enseñaban los mismos productos, uno debajo del otro. | Ficha | Baja | **Sí**: queda uno (menos fotos que bajar) | — |
| 16 | «Entre calles, apartamento o piso» no tenía etiqueta visible: solo se veía el ejemplo dentro del campo. | Pago | Baja | **Sí** | antes-10 |
| 17 | En el pago dice «¿Cómo paga el cliente?», pero quien llena es el propio cliente. | Pago | Media | **No: lo decide Lennys** (ella pidió ese texto el 12-oct) | antes-11 |
| 18 | «Pedidos» en la barra de abajo lleva a entrar con usuario y contraseña. Quien compró sin cuenta no puede ver cómo va su pedido. | Barra de abajo, Mi cuenta | Media | **Sí (3.13.89, 3.13.93)**: «Mi pedido» con número + teléfono, sin cuenta | antes-13 |
| 19 | «Armado por el mensajero (5 o 10 USD)» sale con cualquier producto, también con una sombrilla. | Pago | Baja | **Sí (3.13.89)**: solo si el carrito trae algo que se arma; el equipo lo ve siempre. **3.13.96 (Lennys):** soporte de TV 5 USD con taladro, puerta corredera 10 USD, árbol 3 USD | antes-11 |
| 20 | La franja grande «Regala a tu familia en La Habana» sale en cada ficha entre los botones y la descripción. La descripción y las medidas quedan escondidas en «Características y descripción». | Ficha | Baja | **Sí (3.13.89)**: una línea debajo de la descripción. Las medidas cerca del precio quedan como idea | antes-04 |
| 21 | Datos de producto con fallos: «Paragua» (es «Paraguas»), «Juego de sabanas» sin tilde, «Casas en Miniatura – 8 cm c- 89045» con el código del proveedor en el nombre. | Inicio, búsqueda | Baja | **No: datos del catálogo**, se cambian en el panel (D37/D39) | — |
| 22 | En el inicio nuevo, «Recién llegados» son casi todo electrónica bajo pedido (móviles, fundas, laptop de 595 USD). Para una tienda del hogar, eso confunde. | Inicio (portada nueva 3.13.83) | Baja | **No: lo decide quien lleva la portada** (D51) | despues-01 |
| 23 | La tarjeta de entrar en Mi cuenta tiene un hueco vacío arriba. | Mi cuenta | Baja | **Sí (3.13.93–3.13.94)**: era el título «Acceder» vacío | despues-13 |
| 24 | **Nuevo:** la caché guardaba la API del carrito y servía el carrito de una persona a otra (panel lateral del carrito). | Todas | Alta (privacidad) | **Sí (3.13.90)** | — |
| 25 | **Nuevo:** la caché guardaba páginas pintadas con carrito: contador en 1 para todos y ~627 KB de pre-descarga en cada visita. | Todas | Alta | **Sí (3.13.91–3.13.92)** | — |
| 26 | **Nuevo:** `/ayuda/` decía «hasta un 30 %», pero la regla es sin tope. | `/ayuda/` | Media | **Sí (3.13.89)**: solo esa frase | — |

**Lo que funciona bien:**
- **El carrito** está limpio, sin nada flotando.
- **El pago:**
  - explica que la mensajería se paga aparte, en CUP, al mensajero;
  - al elegir «Efectivo en pesos (CUP)» dice la cifra exacta: «Son 11.775 CUP (15 USD × 785)»;
  - La Habana ya viene puesta.
- **Los colores agotados** ya no salen en la lista.
- **El inicio nuevo** enseña el precio en CUP debajo del de USD.
- **Enlaces:** de 289 revisados, ninguno está roto (los 500 del punto 6 eran por carga).

## Propuestas para Ernesto: cómo quedaron

**Hechas (3.13.88–3.13.94):**
1. **WhatsApp de la gestora en todas partes** (punto 5): sí, D52.
2. **Menos datos** (punto 11): sí.
3. **Ver el pedido sin cuenta** (punto 18): sí.
4. **Armado solo en lo que se arma** (punto 19): sí.
5. **«Regala a tu familia» más abajo** (punto 20): sí.
6. **Lista de fotos para el agente de fotos** (punto 10): sí, arriba.

**Quedan para decidir (no se tocaron):**
1. **Plan de Hostinger y errores 500 con mucha gente a la vez** (punto 6). Ernesto: «lo vemos pendiente». La carga ya bajó un poco. Las tiendas de gestora (`?ref=`) siguen sin caché a propósito, porque cada una tiene sus precios.
2. **«¿Cómo paga el cliente?»** (punto 17). Propuesta: «¿Cómo vas a pagar?» cuando llena un cliente. Lo decide Lennys, porque lo pidió ella.
3. **Portada, «Recién llegados»** (punto 22): casi todo es electrónica bajo pedido. Lo decide quien lleva la portada (D51).
4. **Nombres de producto** (punto 21): «Paragua» → «Paraguas» (2489, 2828, 2858), «Juego de sabanas» → «sábanas», quitar «c- 89045» de «Casas en Miniatura». Se corrigen en el panel (D37/D39), no en la web.
5. **Mover productos de departamento en bloque** (por ejemplo, el soporte de TV y la puerta de corredera, que están en Cocina). **Hecho en parte (Lennys, 22:01):** 18 casos claros movidos; las dudas, en `departamentos-dudosos-2026-10-13.md`.
6. **Medidas cerca del precio en la ficha** (resto del punto 20). Hoy siguen dentro de «Características y descripción».
7. **Elegir el color tocando su foto.** Es una idea de Ernesto; hoy es una lista desplegable.
8. **Letra «Inter» de Google.** Pesa 48 KB, más una consulta a Google que frena la carga, en tienda, fichas y carrito. La carga el plugin NEXO Marketplace y el tema la usa para el texto; la marca usa «Figtree». Quitarla cambia un poco la letra de algunos textos: decisión de diseño.
9. **Origen de los pedidos de WooCommerce** (dos scripts, ~15 KB, en cada página). Se puede apagar en Ajustes de WooCommerce si nadie mira «Origen» en los pedidos. Es un ajuste: no se tocó.
10. **Armado:** la regla por nombre deja fuera el soporte de TV, la puerta de corredera, el árbol de Navidad y la bicicleta de equilibrio (son de instalar, no de armar). Si alguno debe ofrecer armado: dato `_cvd_needs_assembly = yes` en el producto. **Hecho (3.13.96, Lennys):** soporte de TV, puerta y árbol ya lo ofrecen (ver «Tercera tanda»). La bicicleta de equilibrio sigue sin armado: Lennys no la nombró.

## «Últimas unidades» en la portada

Hecho en **Core 3.13.87** (otra sesión, commit Casa-Viva `11057e8`): sale solo cuando queda 1.
