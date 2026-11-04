---
message: "Tu precio"
audience: gestoras de Casa Viva
mode: autonomous
canvas: 1080x1920
duration: 48.84
---

Generado con `node _work/gen-scenes.mjs .` y luego `node <hyperframes-audio>/scripts/carve.mjs --comp index.html --bed music-bed --voice voz --core ../tutorial-fotos-para-publicar` (el generador reescribe index.html: volver a tallar la música después).
Voz: `node _work/build-voz.mjs` (toma 3, cortes en silencios, pausas 0,45 s). Subtítulos: compositions/subtitulos.html desde whisper-final.json (27 frases).

## Frame 1
src: compositions/s01-portada.html · 0–3.9 · logo horizontal + «TU PRECIO» (Cinzel) · «Tú decides tu precio. Lo que subas, es para ti.»
## Frame 2
src: compositions/s02-mis-precios.html · 3.9–12.47 · menú → toque en «Mis precios» → «Aumento general» → toque «Aplicar a mi tienda»
## Frame 3
src: compositions/s03-un-producto.html · 12.47–20.62 · «Ver y cambiar precios de un producto» → buscar → «Tu precio» 35 → «Guardar» → «Precio guardado.»
## Frame 4
src: compositions/s04-quien-lo-ve.html · 20.62–32.12 · ficha con ?ref= («Tienda atendida por Tu nombre») → tienda general 30 USD → con tu enlace 35 USD
## Frame 5
src: compositions/s05-tu-pedido.html · 32.12–38.89 · toque «Ver la tienda» → ficha con ?ref= → Rosa → toque «Añadir al carrito» (35)
## Frame 6
src: compositions/s06-si-cambias.html · 38.89–44.38 · tarjetas: Guardas 35 → ve 35 / Quitas tu aumento → ve 30 · «Tu enlace enseña siempre el precio que tienes guardado.»
## Frame 7
src: compositions/s07-cierre.html · 44.38–48.84 · ASÍ DE FÁCIL (Mis precios → Guardar, Comparte tu enlace, Tu pedido: Ver la tienda) + logo vertical + «¿Dudas? Escríbeme.» + casaviva.company
