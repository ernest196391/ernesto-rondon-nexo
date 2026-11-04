# Auditoría de los resúmenes y mensajes diarios — 28-oct

Datos: buzón del bot (crm_outbox), del 21 al 28-oct, y el reloj del servidor (crontab).

## 1. Lo que ya cambié hoy (falta subirlo)
- **General, 20:00:** ya no dice «Entre todos vendimos 451 USD». Ahora dice «Entre todos entregamos 9 pedidos».
- La frase de arriba («30 % más que ayer») también va en pedidos, nunca en dinero.
- Lo de cada gestora se queda: estrellas, ranking del mes, «ganas 2 USD por cada uno», premio del mes.
- **Lennys** sigue recibiendo todo el dinero: lo vendido, el cajón, el cuadre y las comisiones por pagar.
- **Freno:** si algún día se cuela el total en la tarjeta del General, la tarjeta no sale. Sale el texto corto, que no lleva dinero.
- Rama `feat/resumenes-1028` del bot. Falta tu SÍ para subirlo.

## 2. Todos los mensajes automáticos de cada día

| Hora | Quién lo recibe | Qué dice | Cuántos al día |
|---|---|---|---|
| 8:40 | Ernesto | Lista de novedades del día | 1 |
| 8:50 | Ernesto y Lennys | Tasa del día (3 de 7 días salió «SIN elToque») | 1 + 1 |
| 8:55 y 20:55 | Ernesto | Anuncio para Revolico, listo para copiar | 2 (con su copia, ~4) |
| 9:00 | General | Buenos días: tasa, recogida, 3 productos con foto, reto, avisos | 1 texto + 3 fotos |
| 9:00 | Mensajerías | Carreras de hoy + «el dinero antes de las 4» | 1 |
| 9:02 a 19:00 | Grupo Actualización de productos | Un producto por minuto | **~33** (233 en 7 días) |
| 9:30 y 14:30 | Cada mensajero, por privado | «Tienes un vale…»; el de 14:30 lleva el dinero que debe | ~10 |
| 10:00 | Dependienta de turno | «Para hoy: 5 recogidas y 4 paquetes» | 1 |
| 10:00 a 17:00 | Dependienta de turno | Preguntas de gestoras y avisos juntos | ~2 |
| 16:15 | Dependienta de turno | Dinero que sigue sin llegar a la tienda | 1 |
| 19:00 | General o Actualización | Reel del día o producto para el estado | 1 |
| 20:00 | General | Resumen del día (tarjeta de gestoras) | 1 |
| 20:00 | Lennys | Resumen administrativo + Cuadre | 2 |
| 20:00 | Ernesto | Parte técnico | 1 |
| 21:00 | Ernesto (correo) | Gastos de las herramientas | 1 |
| 21:40 | Ernesto | Errores del bot del día | 1 |
| Al momento | Lennys | «Fulana pide su comisión» | ~4 (26 en 7 días) |
| Al momento | Dependienta de turno | «Pago a una gestora: dale 63 USD + 664 CUP» | ~2 (14 en 7 días) |

Apagado desde el 23-oct por la restricción: el parte de decisiones de las 9:00. Las decisiones esperan en la bandeja web.

## 3. Qué sobra, qué falta y qué se repite
- **Actualización de productos (33 al día):** es lo más masivo que manda el número. WhatsApp ya lo restringió el 23-oct. Además se repite: «Lo están pidiendo: colchón» salió 6 veces en 7 días.
- **General 9:00:** son ~15 líneas más 3 fotos. Sobran el reto y los avisos viejos. Bastan la tasa, la recogida y un producto.
- **General 20:00:** todas las noches repite la misma duda («¿Lo hay? Pregúntale al bot…»). Esa línea sobra.
- **Tono de anuncio:** «¡A vender bonito! 💛», «¡A seguir vendiendo!», «Juntos crecemos cada día». Se pueden quitar. Que quede como hablas tú con tu equipo.
- **Lennys:** recibe ~12 mensajes al día, pero sus decisiones de verdad son 2. «Tu decisión de hoy» del 27-oct era «Félix confirma que la carrera #5604 ya tiene mensajero». Eso no es una decisión.
- **Se repite:** «13 pedidos con el teléfono de la propia gestora» sale todas las noches y nadie lo cierra.
- **Tasa:** 2 de 7 mañanas el General salió con «la tasa sale en cuanto la mande la tienda». El 22-oct hubo que corregirla a las 11:32.
- **Falta:** las gestoras no saben qué pedido suyo está atascado. Un «tu #N sigue sin mensajero» por privado les sirve más que el ranking.
- **Pregunta para ti:** Nana ve por privado «Ayer en tienda: X USD». ¿Le quitamos el dinero también?

## 4. Cuellos de botella, de más a menos importante

**1. El dinero se queda en la calle.** Lo tienen 4 mensajeros a las 16:15 (27-oct), y Fernando lo tiene desde hace 1 día (#5470). Hoy se avisa a la dependienta y al mensajero, pero nadie cierra.
- **Hoy:** a las 24 h, un aviso al mensajero con el importe exacto. A las 48 h, el aviso va a Lennys.
- **En el bot:** `src/dispatch-rules.js` no le da vales nuevos a quien debe dinero de hace más de 48 h. Toca a los mensajeros: decides tú.

**2. Cada cobro de comisión interrumpe a Lennys** (26 en 7 días, a cualquier hora, hasta las 23:00 y las 4:16).
- **Hoy:** juntar los pedidos de comisión en un solo mensaje a las 10:00 y otro a las 16:00, con un solo enlace para revisarlos todos.
- **En el bot:** `src/avisos-pago.js` los guarda y los manda juntos, como ya hace `tienda-turno.js` con Nana. No mueve dinero.

**3. Hay 159 escalaciones abiertas, y 131 llevan más de 2 días.** Las elige el resumen de Lennys y le llegan cosas que no son decisiones.
- **Hoy:** cerrar solas las que solo informan (confirmaciones de mensajería, fallos viejos de la IA) cuando pasen 3 días.
- **En el bot:** una regla nueva, `src/escalaciones-rules.js`. «Tu decisión de hoy» solo coge las que hablan de dinero o de un pedido.

**4. Pedidos que se atascan.** El 28-oct, 2 de las 4 carreras «eran del 27/10» y seguían «listas para recoger». Y los 13 pedidos con el teléfono de la gestora siguen sin revisar.
- **Hoy:** a las 11:00, si una carrera de ayer sigue sin recoger, preguntarle al mensajero «¿la recoges hoy?». Si dice «no puedo», pasa a otro.
- Lo de los 13 pedidos sale una sola vez, con la lista, y se cierra con *REVISADO #N*.
- **En el bot:** `src/avisos-mensajeros.js` y el resumen de Lennys, en `calcularHormozi` (alarmas).

**5. Riesgo de otro bloqueo de WhatsApp** por los 33 mensajes al día al grupo de productos.
- **Hoy:** bajar a 8 al día, uno cada 10 minutos, y que el mismo producto no salga dos veces en 7 días. Son dos ajustes: `novedades_max_dia` = 8 y `novedades_cada_min` = 10.
- **En el bot:** la regla de no repetir va en `novedades.mjs`. Se puede deshacer; decides tú.

**6. La tasa llega tarde.** El buenos días sale a las 9:00, pero los reintentos de elToque son a las 9:20 y a las 9:50.
- **Hoy:** si a las 9:00 no hay tasa, el mensaje lleva la de ayer como «provisional» y se corrige con una sola línea cuando llegue.
- **En el bot:** `rateLine` en `src/grupo-diario-rules.js`.

## 5. Mensajes más cortos (para programar después de tu SÍ)
- Máximo 6 líneas, una idea por línea y sin frases de anuncio, en el General (9:00 y 20:00) y en el resumen de Lennys.
- Lennys solo recibe: el dinero del día, quién debe dinero y como mucho 2 decisiones.
- El /cierre a mano tiene que seguir la misma regla: en el General, nada de dinero de la tienda.
