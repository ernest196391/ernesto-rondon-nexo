# Panda26 — menú digital en 3D (prospecto NEXO)

Kiosco de hot dogs con servicio a domicilio. WhatsApp +53 6369 4210 · todos los días de 10:00 a.m. a 8:00 p.m.
Ernesto mandó las fotos y el menú a su chat «Tú» el 3-nov-2026 (`entrada-2026-11-03/`).

## Qué hay hecho (3-nov-2026)
| Pieza | Dónde | Estado |
|---|---|---|
| App del menú (buscador, categorías, pedido, «Pedir por WhatsApp», 3 productos en 3D) | `apps/menu-panda26/` | Probada en local (móvil 375 px). **Falta publicar** en `casaviva.company/panda26/` |
| 3D con IA de sus fotos (Higgsfield SAM 3, 1 crédito c/u) | `generado/*.glb` | Hot dog bien; pan con croquetas regular (el papel sale raro); frappé bien |
| Video gancho de 10 s (Seedance 2.5, 70 créditos + imagen 0,25) | `generado/video-gancho-panda26.mp4` | Hecho, con etiqueta del frappé y sonidos de toque (gratis) |
| QR de mesa (4 por hoja A4, para recortar) | `qr/qr-mesas-panda26.pdf` | Apunta a `https://casaviva.company/panda26/`: sirve cuando se publique |

Gasto total de Higgsfield: ~74,25 créditos (de 406,5).

## Versión premium (3-nov noche, D134)
Ernesto pidió que se viera «como si costara 10.000 dólares». Eligió: **modo holograma**, **giro 360° fotorreal**, **4 combos + frappé** y **premium pero ligera**.
- 5 fotos de estudio con IA a partir de sus fotos reales (`generado/estudio/`, 0,25 créditos c/u). **El sándwich de jamón y queso no tiene foto real: su foto la inventó la IA** → cambiarla cuando el dueño mande la suya.
- 5 giros con Kling 3.0 Pro 5 s (`generado/giros/*.mp4`, 8,75 créditos c/u) → hojas de 36 fotogramas en `apps/menu-panda26/giros/` (220–370 KB c/u). Hot dog de res, jamón y queso y frappé giran bien; pan con croquetas gira medio lado y vuelve; **hot dog mixto casi no gira** (repetirlo cuesta 8,75).
- App rehecha: entrada con logo animado, escenario con etiqueta de cristal, giro con el dedo, mandos anterior / pausa / siguiente, sonidos sintetizados (botón para silenciar), vibración, «abierto / cerrado» con la hora de Cuba, cinta de avisos, carta con tarjetas 360°, producto que vuela al pedido, hoja del pedido con «a domicilio / lo recojo», letras Anton + Inter guardadas en la app, y se guarda en el móvil (sw.js) para abrir sin conexión.
- Ya no usa el 3D de malla ni model-viewer (se quitó «ponlo en tu mesa»).
- Peso al entrar: ~0,5 MB (incluido el primer giro). Cada giro más se baja solo al verlo.
- Capturas en `capturas/premium-*.jpg`. Gasto de esta parte: ~45 créditos (quedan ~287).

## Decisiones de Ernesto (3-nov)
- Video con IA (Higgsfield), versión buena (Seedance, ~75 créditos).
- Primera versión: menú + WhatsApp + 3D en 3 productos (hot dog 100 % res, pan con croquetas, frappé de guayaba).
- Precios: los del menú escrito (la pizarra tiene precios más viejos: p. ej. pan con croquetas 1200 en la pizarra y 2500 en el texto).

## Lo que NO está (decirlo claro)
- No hay panel para que el dueño cambie precios: hoy se cambian en `apps/menu-panda26/menu.js` y se vuelve a subir.
- «Ponlo en tu mesa» (realidad aumentada) solo funciona en iPhone y en Android con ARCore. En Cuba muchos Android no lo tienen; ahí se ve el 3D girando en pantalla. No se ha probado en un móvil cubano real.
- Sandwich, papas, croquetas, bebidas y salsas no tienen foto (sale un icono). Con fotos suyas se completan.
- La pizarra tiene productos que el texto no trae (frappés de piña/naranja, café, expreso, pollo): preguntar al dueño si siguen.

## Qué mandarle (lo envía Ernesto) — desde el 4-nov, UNA página web
Página para el dueño: **https://casaviva.company/panda26/propuesta/** (fuente `apps/menu-panda26/propuesta/`). Dentro: el menú de verdad para probar, el video para ver y bajar, las 2 caras de la tarjeta (imagen) y los PDF de tarjeta y cartel para imprimir, mensajeros, valor → GRATIS, «un expreso al día» y botones de WhatsApp a Ernesto. Al mandar el enlace, WhatsApp muestra la vista previa «Esto ya es suyo».
> Hola 👋 Soy Ernesto, de NEXO. Le hicimos a Panda26 su menú digital: ya funciona y es gratis.
> Aquí está todo lo que ya es suyo (pruébenlo, vean el video y bajen las tarjetas):
> https://casaviva.company/panda26/propuesta/
> ¿Lo ponemos esta semana en las mesas?

(El PDF `presentacion/panda26-presentacion.pdf` queda de respaldo.)

## Presentación (4-nov, D135)
`presentacion/panda26-presentacion.pdf` (fuente `presentacion/presentacion.html`): portada → la idea (compran con los ojos) → menú 360° → carta y pedido directo → video → cartel y tarjeta → mensajeros de Casa Viva → pila de valor (1.190 USD de valor, **gratis**, se queda puesto) → mantenimiento por **un expreso al día** («nos ponemos de acuerdo») → 3 pasos + los 2 QR. Los valores en USD son estimaciones de Claude: Ernesto puede cambiarlos.

## Tarjeta de regalo (4-nov)
`qr/tarjeta-regalo-panda26.pdf` (fuente `qr/cartel/tarjeta-regalo.html`): 8,5 × 5,5 cm, 10 por A4; hoja 1 = cara del menú, hoja 2 = cara del grupo. **Imprimir a doble cara, voltear por el borde largo.** Los 20 QR comprobados con zxing.

## Cartel de mesa de 2 caras (3-nov)
`qr/cartel-mesa-panda26.pdf`: 2 por A4. Cara 1 «Míralo antes de pedirlo» → QR del menú. Cara 2 «Únete al grupo Panda 26 Delivery» → QR de `https://chat.whatsapp.com/KN9LPzgjmn10eJWlIRTqCL`. Los 4 QR comprobados. Fuente editable: `qr/cartel/cartel-mesa.html`.
