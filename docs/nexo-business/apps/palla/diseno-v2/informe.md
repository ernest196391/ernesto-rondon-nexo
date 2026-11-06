# Pa'llá · informe del diseño completo (4-nov-2026, tarde)

Hecho por Claude, solo, de 17:10 a ~20:30 (hora de Cuba). **Es solo diseño:** no se programó la app de verdad, no se tocó
la web, el bot, la base de datos, Caddy ni el mapa. No se mandó nada a nadie ni se gastaron créditos.

## ⚠️ Lo primero: la dirección todavía no funciona
`https://179-236-242-212.sslip.io/palla-diseno/` **responde 404** (todos los archivos). La carpeta `/srv/palla-diseno/`
existe y tiene todo, pero el servidor web (Caddy) no la sirve todavía, y yo no tengo permiso para tocar Caddy (ni para
leer su configuración). **Hace falta que alguien añada `/palla-diseno/*` en Caddy** (igual que `/mapa/*`, como archivos
estáticos de `/srv/palla-diseno`). Todo lo probé con un servidor local de solo lectura (127.0.0.1:8765) y Chrome sin pantalla.

## Qué hay (todo en `/srv/palla-diseno/`)
| Archivo | Qué es |
|---|---|
| `index.html` | Portada para Ernesto: enlaces, los 3 logos y lo que tiene que decidir (5 cosas, cada una con mi recomendación). |
| `prototipo/` | Prototipo clicable a tamaño móvil (HTML/CSS/JS sin compilar). 31 pantallas por `#nombre`. En el ordenador sale dentro de un móvil con la lista de pantallas al lado. |
| `lienzo.html` | Las 31 pantallas juntas (iframes del prototipo), por Cliente / Mensajero / Chofer, con el porqué de cada una. Botones para verlo en oscuro y sin mapa (más rápido en el móvil). |
| `sistema.html` + `tokens.css` + `iconos.svg` | Sistema de diseño: colores claro/oscuro, colores por servicio, estados, letra, espacios, radios, sombras, botones, chips, campos, interruptor, tarjeta de oferta, hoja inferior, 56 iconos propios, vehículos, mapa, movimiento y reglas. Se copia tal cual al código. |
| `logo/` | 3 propuestas × (icono 512 oscuro y claro + logotipo horizontal claro y oscuro) = 12 SVG. La palabra «Pa’llá» va en trazos (no depende de la letra instalada). |
| `vehiculos/` | 9 vehículos provisionales en SVG, de lado (elegir) y desde arriba (mapa) = 18 SVG + `prompts-vehiculos.md` (10 prompts para Higgsfield) + `ver.html` (vista rápida). |
| `fonts/` | Archivo variable (pesos y ancho expandido en un solo archivo de 35 KB, de Google Fonts, licencia OFL). |
| `capturas/` | Capturas 390×844 de cada pantalla en claro y de 10 en oscuro. |
| `informe.md` | Copia de este informe. |

**Peso:** el prototipo sin el mapa pesa **~216 KB** sin comprimir (meta < 300 KB). `app.js` comprimido: 20 KB.

## Lo que se hizo y cómo
- **Base:** `palla-fase1.html` (sus 10 pantallas), el recon de La Nave, la investigación de SMS y tipos de triciclo, el
  recon de Triciclub y el código de hoy (colores de `app.css` de Pa'llá, la «P» de `icon.svg`, cómo carga `mapa.js`).
- **Regla de velocidad:** el inicio se pinta y se usa al momento (Casa, Trabajo, recientes y «¿A dónde vamos?»). Detrás
  hay un fondo de calles dibujadas (CSS, 0 KB de imágenes); el mapa se pide 0,3 s después y entra con un fundido de
  240 ms cuando ya está listo. Si no carga, todo sigue funcionando (probado con `?nomapa`).
- **Mapa propio:** el de Cuba del VPS (MapLibre 4.7.1 + pmtiles 4.3.0, `/mapa/cuba-20261031.pmtiles`) con un estilo nuevo
  claro y oscuro: calles finas sin colores de carretera, agua y parques suaves, barrios en mayúsculas discretas. Ruta
  negra de día y amarilla de noche, que **se dibuja** de la recogida al destino (600 ms). Los vehículos (vista desde
  arriba) **se mueven por la calle y giran con ella** con el giro suavizado. En «Fijar en el mapa» y «Confirmar
  recogida», al soltar el mapa sale el **nombre real de la calle** (lo pregunta a nuestro motor de rutas).
- **Rutas reales** del motor de rutas del VPS (guardadas en `prototipo/datos.js` para que no dependa de la red):
  Calle N e/ 23 y 25 → Coppelia = **0,84 km**; → Obispo e/ Habana y Compostela = **4,1 km**; Línea y Paseo → Nuevo
  Vedado (envío) = **4,0 km**; chofer → recogida = 1,5 km.
- **Precio justo** (tus decisiones): Eléctrico 60 + 50/km redondeado a 10; Bici 70 %; XL y Carga 150 %; Mensajero
  100 + 60/km; Taxi Básico 20 % menos que La Nave. El cliente sube o baja de 10 en 10 entre −20 % y +50 %, sin teclear
  (los botones se apagan en los límites; una regla muestra dónde está el justo). Interruptor «Coger la 1.ª oferta»
  apagado al empezar; si se enciende, la primera oferta a su precio se coge sola. El chofer: Acepto / +10 / +20 / +30 %
  redondeado a 10. El precio acordado se escribe siempre como **fijo**.
- **Ofertas en vivo:** llegan una a una, verde «Acepta tu precio» / ámbar «Pide +N %», tiempo de llegada, estrellas,
  viajes, vehículo, cuenta atrás de 60 s (barra amarilla + segundos) y «Subir 10 %» (respeta el +50 %).
- **Oscuro automático:** de 19:00 a 7:00 por la hora del móvil; en el perfil se puede fijar «De noche / Claro / Oscuro».
- **Movimiento:** 120/180/240 ms; con «reducir movimiento» todo queda quieto (también el mapa y la ruta).
- **Revisión:** capturas de las 31 pantallas mirándolas una a una; corregí sugerencias partidas en líneas, textos
  cortados, botones que se partían, la etiqueta «Ejemplo» que tapaba botones, la cuenta atrás que pisaba el precio,
  enlaces subrayados, vehículos poco visibles en el mapa oscuro y el botón elegido invisible en oscuro.

## Lo que decidí yo (y por qué) — puedes cambiarlo
1. **Botón principal amarillo con letra negra** (uno por pantalla) y negro para lo secundario: el amarillo es la marca y
   se ve igual de bien de día y de noche (contraste 12:1).
2. **Colores por servicio sobrios:** Taxi azul tinta, Triciclo verde (sigue al de Triciclub), Mensajero naranja teja.
   Solo en sellos e iconos, nunca de fondo grande.
3. **Moto (pasajero) = 80 % del Eléctrico** (no estaba decidido) → en la portada como decisión.
4. **Taxi Clásico +10 % y Taxi XL +40 %** sobre el Básico (≈ 424 CUP/km) → en la portada como decisión. Falta un mínimo.
5. **Carga «hasta 300 kg»** (la investigación dice 100–300 kg en la práctica; el boceto de la fase 1 decía 500 kg).
6. **Tope de deuda del chofer 2.000 CUP** en el ejemplo, con aviso 2 días antes → en la portada como decisión.
7. **Entrar con código por WhatsApp** y SMS de reserva (lo que recomendaba la investigación del SMS).
8. **Botón de ayuda** en el viaje: llamar a la policía (106), avisar al contacto de confianza, hablar con Pa'llá.
9. **Mensajero:** el que recibe tiene su propio **código de entrega** (además de la foto), para que nadie se lleve el
   paquete equivocado. Tamaños: «cabe en la mano / mochila / grande (va en triciclo)».
10. **Chofer:** antes de aceptar ve barrio, km, nota y estrellas del cliente, nunca su teléfono; después de aceptar, puede
    llamar y escribir por WhatsApp. El cliente ve el número del chofer para pagarle por Transfermóvil (tu decisión 7).
11. **Pago de la comisión:** pasos de Transfermóvil con una tarjeta de Pa'llá **de ejemplo** (9205 •••• 0417) y un código
    del chofer en la nota (CH-0417); «el SMS del banco basta». Habrá que poner la tarjeta real.
12. **Logo:** recomiendo la A «En ruta» (cuenta el viaje, se anima en la carga y sigue pareciéndose a la P de hoy).

## Choques con tus decisiones (apuntados, no cambiados)
- **Taxi abierto desde el principio (decisión 1)** frente a la fase 1, que decía «Taxi solo tras consulta legal». El
  diseño trae los 3 servicios como pediste; la consulta legal sigue pendiente (después del piloto).
- **Precio del taxi para viajes cortos:** con 424 CUP/km, Calle N → Coppelia (0,8 km) sale en 360 CUP, más del triple
  del triciclo y quizá poco para un taxista. Por eso propongo un mínimo por viaje (decisión 4 de la portada).
- **«Ofertas en vivo»** necesitan conexión en vivo; el hosting de la web no la tiene (ya lo decía la fase 1): irán por el VPS.

## Lo que NO pude hacer
- **Publicarlo en la dirección pedida:** da 404 (ver arriba).
- **Las imágenes 3D de los vehículos:** en esta sesión había herramientas de Higgsfield conectadas, pero **no las usé**
  (la tarea dice que se hacen mañana desde el PC y que no se gasten créditos). Quedan los SVG provisionales y los prompts.
- **Probar en tu Redmi de verdad** ni medir tiempos con datos de ETECSA: solo Chrome sin pantalla en el VPS.
- **Pantallas del chofer de La Nave en viaje:** siguen sin verse (hace falta un viaje real); el diseño del chofer sale de
  Pa'llá/Triciclub de hoy + inDrive + Bolt.
- **Sin repasar por un abogado:** los textos legales (LOT, licencia) son los de la fase 1.

## Lo que falta (siguiente paso)
1. Montar `/palla-diseno/` en Caddy y abrir el prototipo y el lienzo en tu Redmi.
2. Que elijas logo y las 5 decisiones de la portada.
3. Generar las 10 imágenes 3D con `vehiculos/prompts-vehiculos.md` y cambiar los SVG por WebP.
4. Medir en tu Redmi (con y sin VPN) cuándo se puede usar el inicio del prototipo.
5. Iconos de la app (PNG 192/512/maskable) a partir del logo elegido.
6. Pantallas que no entraron: cancelar con motivo, chofer que no llega, reportar un problema, historial del chofer,
   aprobar choferes (Ernesto), tarifas (Ernesto).

## Para probar
- Prototipo: `/palla-diseno/prototipo/` (empieza en la carga). Una pantalla suelta: `/palla-diseno/prototipo/#precio`.
  `?tema=oscuro` o `?tema=claro` fuerzan el tema; `?nomapa` lo prueba sin mapa.
- Los botones con borde de rayas («Demo: …») solo existen en el prototipo para avanzar (en la app pasaría solo).

## Las pantallas y su `#nombre`

**Cliente**

| Dirección | Pantalla | Por qué (resumen) |
|---|---|---|
| `#carga` | Abriendo | La «P» se dibuja en menos de 1 s con CSS (0 KB de imágenes). |
| `#entrar` | Entrar con el teléfono | Como inDrive y Yango: solo el número. |
| `#codigo` | Código y nombre | Un paso por pantalla. |
| `#inicio` | Inicio | De La Nave: «¿A dónde vamos?», Casa, Trabajo y recientes. |
| `#destino` | Destino | Origen ya puesto por GPS a la cubana («Calle N e/ 23 y 25»). |
| `#fijar` | Fijar en el mapa | Como Uber: mueves el mapa, no el pin. |
| `#recogida` | Confirmar recogida | De La Nave («Confirma el punto de origen»). |
| `#tipo` | Elegir tipo | Carrusel de La Nave y Bolt, pero con el PRECIO JUSTO de cada uno y cuántos caben. |
| `#precio` | Precio justo | El modelo de inDrive, con reglas: subes o bajas de 10 en 10 sin teclear, entre −20 % y +50 %. |
| `#buscando` | Ofertas en vivo | inDrive: eliges por precio, tiempo y estrellas. |
| `#viene` | El chofer viene | Uber y Bolt: foto del vehículo, estrellas, código de 4 cifras al subir, llamar, WhatsApp, compartir y ayuda. |
| `#viaje` | En viaje | Hora de llegada grande (Yango), ruta por calles y el vehículo girando con la calle. |
| `#llegada` | Pagar y valorar | Se paga directo al chofer (como inDrive y La Nave). |
| `#viajes` | Mis viajes | Lista limpia con precio acordado y «Repetir» (pide igual en 2 toques). |
| `#perfil` | Perfil | Lo mínimo: nombre, teléfono, lugares, contactos de confianza y el modo de la pantalla (oscuro solo de noche). |
| `#sinconexion` | Sin conexión | Idea de Uber Lite, mejor resuelta: sin señal se ve todo lo guardado; el pedido queda en el móvil y sale solo al volver. |

**Mensajero**

| Dirección | Pantalla | Por qué (resumen) |
|---|---|---|
| `#envio` | Qué mandas | Como inDrive Courier y Yango Delivery, en una pantalla: qué es y el tamaño con 3 dibujos. |
| `#envio-recibe` | Quién recibe | Nombre y teléfono de quien recibe (le llega el aviso por WhatsApp). |
| `#envio-precio` | Precio del envío | El mismo precio justo que el viaje (100 + 60 por km), mismo control: aprender una vez sirve para todo.. |
| `#envio-ofertas` | Ofertas de mensajeros | Las mismas tarjetas de oferta, con el color naranja del servicio y la caja que lleva cada mensajero.. |
| `#envio-seguimiento` | Seguimiento | Tres pasos claros (recogido, en camino, entregado) y la moto moviéndose. |
| `#envio-entregado` | Foto de entrega | Prueba de entrega con foto, hora y nombre (lo hace Casa Viva hoy). |

**Chofer**

| Dirección | Pantalla | Por qué (resumen) |
|---|---|---|
| `#ch-alta` | Alta | Lo que ya existe en Pa'llá: carné, selfie con el carné, foto del vehículo y tipo. |
| `#ch-conectar` | Conectarse | La pantalla de hoy, más limpia: un botón grande y «qué acepto hoy» (pasaje, envíos, Casa Viva solo si es su mensajero). |
| `#ch-pedidos` | Pedidos con oferta | inDrive sin teclear: «Acepto» o +10 / +20 / +30 % de un toque. |
| `#ch-recoger` | Ir a recoger | Un botón grande por paso (Llegué → código → Recogí), como hoy en Pa'llá. |
| `#ch-viaje` | En viaje | Solo lo necesario mientras maneja: destino, precio acordado y «Terminé». |
| `#ch-cobrar` | Cobrar | El precio acordado, fijo, en grande. |
| `#ch-ganancias` | Ganancias | Hoy y la semana de un vistazo (barras simples), como Bolt Driver. |
| `#ch-deuda` | Lo que debo a Pa'llá | De Bolt: si la deuda pasa un tope se pausan solo los viajes en efectivo. |
| `#ch-perfil` | Perfil y vehículo | Su vehículo, tipo, plazas, LOT y papeles con su estado. |
