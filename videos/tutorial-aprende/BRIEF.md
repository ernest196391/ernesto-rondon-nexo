---
workflow: general-video
flow: automation
storyboard: no
message: "Aprende: en tu área → menú → Aprende (debajo de Inicio, con cuántos llevas). Toca el botón redondo (▶) y el video se abre ahí mismo, sin gastar datos antes. Al terminar se marca solo, o «Marcar como visto» → «✓ Ya lo vi» y sube el avance. Abajo, «Dudas rápidas». Mensajeros: pestaña «Aprende» abajo."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), y mensajeros en una escena; no técnicos, en el teléfono dentro de WhatsApp
length: ~46s
narration: yes
---

## Intent

Tutorial #6 «Aprende», pedido por Ernesto el 13-oct (docs/nexo-business/tutoriales/pendientes-2026-10-13.md).
Fuente: Core 3.13.96 (`includes/class-cvd-aprende.php`, `class-cvd-gestora-app.php`, `assets/aprende.js`, `assets/messenger-simplify.js`): etiquetas reales.
Mensajeros: misma lista con ▶ y «✓ Ya lo vi», pero la pestaña va abajo (Hoy · Aprende · Ruta · Dinero · Más), sus dudas se llaman «LO QUE ESCRIBES» y tienen 2 pasos, no 6. Por eso el video es de gestoras y una escena (gráfico de marca, no captura) se lo dice a los mensajeros.

## Assets

- assets/screens/a-*.jpg = el área real de una gestora aprobada, renderizada en el servidor con wp eval-file (sin contraseña;
  «Aprende» leído como cuenta nueva, 0 de 6, con un filtro de lectura en memoria), limpiada (nombre → «Tu nombre», ?ref= → TUCODIGO, sin clientes)
  y capturada con Chrome sin interfaz a 375x812 @2x. Estados (▶ abierto, «✓ Ya lo vi», duda abierta) recreados con un script inyectado y la red bloqueada: no se guardó nada.
  El vídeo abierto lleva de póster un fotograma del tutorial 2 (el primero de la lista). Herramientas en _work/capture-*.
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B «cercano»; toma 1 (Whisper perfecta, 116/116 palabras), montaje _work/build-voz.mjs; Whisper (Groq) whisper-final.json.
- Música: make-music.mjs (propia). SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.

## Notes

- No se crearon pedidos ni cuentas; no se entró con contraseña; no se tocó la base. Copias temporales borradas de Hostinger y del VPS. Nada enviado.
