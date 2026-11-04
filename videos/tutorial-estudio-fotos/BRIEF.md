---
workflow: general-video
flow: automation
storyboard: no
message: "Mi estudio de fotos: área → Herramientas → Mi estudio de fotos: eliges producto e idea, copias la instrucción, guardas la foto del producto, Gemini (gratis con Gmail, con VPN en Cuba) hace la foto bonita, la subes y la descargas, compartes o pones en tu tienda."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono dentro de WhatsApp
length: ~55s
narration: yes
---

## Intent

Tutorial «Mi estudio de fotos», para GESTORAS (16-oct, tras auditar la herramienta; Core 3.14.31). Gancho con casos reales:
Nana (12-oct, «la tienda está oscura… mi teléfono no tira buenas fotos») y Dayami (13-oct, «fotos de todas las cortinas de baño para
enviar a un cliente»). Lo más importante: el ANTES y DESPUÉS en grande (escena 3), con la foto REAL que hizo Dany con su estudio el 14-oct
(galería de la gestora 18) frente a la foto de catálogo que adjuntó (adjunto 2574, 375 px). Copia la estructura y la marca de tutorial-nexo-busca.

## Assets

- assets/screens/ef-*.jpg: el área renderizada en el servidor como Dany (user 18) con wp eval-file (solo lectura, sin contraseña), limpiada con
  _work/capture-sanitize.py (nombre → «Tu nombre», código → TUCODIGO, sin clientes/ventas, nonces a cero) y capturada con Chrome sin interfaz
  (iframe 375x812 @2x). Estados con _work/capture-inject-estudio.html; red falsa con respuestas reales guardadas (_work/capture-build-estudio.py):
  nada se guardó en la web. ef-home = Inicio con todo difuminado menos la barra (sus cifras son de Dany).
- assets/screens/antes.jpg (foto de catálogo del set 2573) y despues.jpg (foto de Gemini de la galería de Dany).
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B, una toma por escena (_work/gen-voz-vps.mjs), Whisper (Groq) en
  cada toma y en el MP4 final (assets/audio/whisper-mp4-final.json). Montaje _work/build-voz.mjs (2,6 s de respiro tras el antes/después).
- Música: make-music.mjs (propia), tallada con carve.mjs. SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.

## Notes

- 0 créditos de Higgsfield, 0 fotos de Gemini nuevas. Nada enviado a nadie.
- Generador: _work/splice-gen.py une la cabecera/final del generador de NEXO Busca (_work/tmp/gen-scenes-nexo-busca.mjs) con
  _work/scenes-estudio.part.mjs → _work/gen-scenes.mjs. Después de generar, volver a tallar la música (carve.mjs).
