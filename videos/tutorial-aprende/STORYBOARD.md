---
message: "Aprende"
audience: gestoras de Casa Viva (y mensajeros, escena 6)
mode: autonomous
canvas: 1080x1920
duration: 45.71
---

Generado con `node _work/gen-scenes.mjs .` y luego `node <hyperframes-audio>/scripts/carve.mjs --comp index.html --bed music-bed --voice voz --core ../tutorial-fotos-para-publicar` (el generador reescribe index.html: volver a tallar la música después).
Voz: `node _work/build-voz.mjs` (toma 1, cortes en silencios, pausas 0,6 s, 3 s de «ASÍ DE FÁCIL» antes de «¿Dudas? Escríbeme.»). Subtítulos: compositions/subtitulos.html desde whisper-final.json (24 frases).
Capturas: `_work/capture-render-gestora.php` (servidor) → `capture-sanitize.py` → `capture-build.py` (bloqueo de red + `capture-inject.html`) → Chrome sin interfaz con `capture-frame.html`.

## Frame 1
src: compositions/s01-portada.html · 0–5.2 · logo horizontal + «APRENDE» (Cinzel) · «¿Te perdiste algún video? Ahora están todos juntos en tu área, en: Aprende.»
## Frame 2
src: compositions/s02-donde.html · 5.2–10.4 · Herramientas → toque en el menú → «Aprende 0/6» debajo de Inicio → toque → pantalla Aprende
## Frame 3
src: compositions/s03-ver.html · 10.4–19.85 · lista en orden → «Te toca» → toque ▶ → el vídeo se abre ahí mismo → tarjeta «No gasta datos hasta que lo tocas»
## Frame 4
src: compositions/s04-visto.html · 19.85–27.7 · cerrar ✕ → toque «Marcar como visto» → «✓ Ya lo vi», «1 de 6 vistos 17 %», «Te toca» pasa al 2
## Frame 5
src: compositions/s05-dudas.html · 27.7–35.3 · «DUDAS RÁPIDAS» → toque «Mi enlace» → respuesta → «¿No está tu duda? Escríbele al asistente por WhatsApp.»
## Frame 6
src: compositions/s06-mensajeros.html · 35.3–39.1 · «¿Eres mensajero?» barra Hoy · Aprende · Ruta · Dinero · Más + «Tus dudas: Lo que escribes»
## Frame 7
src: compositions/s07-cierre.html · 39.1–45.71 · ASÍ DE FÁCIL (Menú → Aprende, Toca ▶ y míralo, ✓ Ya lo vi) + logo vertical + «¿Dudas? Escríbeme.» + casaviva.company
