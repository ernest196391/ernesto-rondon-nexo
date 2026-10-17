---
workflow: general-video
flow: automation
storyboard: no
message: "Programa de gestoras (las piedras): 1 punto = 1 USD limpio para la tienda por venta entregada y cobrada; los vales y sus puntos en Mi piedra; piedras por los puntos del equipo (Bronce 65 → 5.000 CUP, Plata 130 → 10.000, Oro 195 → 15.000… Corona); invitar desde Mi equipo → Mandar por WhatsApp; 1 % de las invitadas 12 meses y 0,5 % del 2.º nivel si es Plata; el bono sale de un fondo del 15 % y si no alcanza se paga una parte; se cobra en Pedir mi pago; está en prueba."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono dentro de WhatsApp
length: ~64s
narration: yes
---

## Intent

Tutorial «Las piedras» (programa de gestoras, Core 3.14.33, D75/D77/D79), para GESTORAS. Pedido de Ernesto 16-oct noche (LANZAMIENTO C1).
Primero lo aprueba Lennys; no se manda a nadie sin su sí. Copia la estructura y la marca de tutorial-estudio-fotos / tutorial-nexo-busca.

## Assets

- assets/screens/*.jpg: el área renderizada en el servidor como la CUENTA DE PRUEBA 45 (nunca una gestora real), con wp eval-file
  (_work/capture-render-piedras.php): estado «approved» fingido en memoria y la lectura del libro del programa cambiada en memoria por un
  cálculo de ejemplo (María/Ana de AUDITORIA §0.2: 300 + 400 USD, Plata, 9.066 de 10.000 CUP, red 4 USD, Ana Ejemplo Bronce). Nada se
  guardó; el .php y el HTML se borraron del servidor en el acto. Limpieza: _work/capture-sanitize-piedras.py (nombre → «Tu nombre»,
  código → TUCODIGO, vales de ejemplo #4106/#4119/#4142). Captura: Chrome sin interfaz, iframe 375x812 @2x, red bloqueada
  (_work/capture-build-piedras.py, _work/capture-inject-piedras.html, _work/shot.sh).
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B, 3-4 tomas por escena (_work/gen-voz-vps.mjs). Elegidas
  con Whisper (Groq) por trozos sin contexto (_work/tx-vps.mjs): s0 t1 · s1 t2 · s2 t2 · s3 t4 · s4 t3 · s5 t2 · s6 t1 · s7 t3.
  «Bronce»: Whisper con contexto escribe «Bronze», aislada oye «bronce» y el espectrograma tiene la «e» final (bron-se). La frase de las
  piedras se reescribió con «puntos» y «pesos» en cada una: «ciento treinta, diez mil» aislado se oía «130.000 a 10.000».
- Música: make-music.mjs (propia), tallada con carve.mjs. SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.

## Notes

- Generador: _work/splice-gen.py une cabecera/final de _work/gen-scenes-base-estudio.mjs con _work/scenes-piedras.part.mjs →
  _work/gen-scenes.mjs. Después de generar, volver a tallar la música (carve.mjs --core ../tutorial-fotos-para-publicar).
- 0 créditos de Higgsfield. Nada enviado a nadie. MP4 en el VPS: /root/archivos/tutoriales/tutorial-piedras.mp4.
