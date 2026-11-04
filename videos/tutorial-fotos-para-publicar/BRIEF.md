---
workflow: general-video
flow: automation
storyboard: no
message: "Fotos para publicar: en tu área → menú → Fotos para publicar está todo lo que hay en existencia, con tu precio, el CUP y cuántos quedan. Descargar foto + Copiar texto (lleva tu enlace) y Descargar todas (ZIP) por categoría."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono dentro de WhatsApp
length: ~45s
narration: yes
---

## Intent

Tutorial #5 «Fotos para publicar», para GESTORAS (aprobado por Ernesto el 11-oct-2026 por la noche).
Fuente: Core 3.13.57 (`includes/class-cvd-gestora-fotos.php`, `class-cvd-gestora-app.php`, `assets/gestora-app.js`): etiquetas reales.
Hecho con la skill video-tutorial-casa-viva: marca exacta, subtítulos quemados, voz B «cercano».

## Assets

- assets/screens: f-herr, f-menu, f-top, f-search, f-dl, f-copied, f-cat = el área real de una gestora aprobada,
  renderizada en el servidor con wp eval-file (sin contraseña), limpiada (nombre → «Tu nombre», ?ref= → TUCODIGO, sin clientes)
  y capturada con Chrome sin interfaz a 375x812 @2x. Herramientas en _work/capture-*. f-mochila-foto = recorte de f-copied.
- Chat «mi acceso»: respuesta real del bot (igual que el tutorial 4). Chat del cliente: texto real de «Copiar texto» (JSON de la página).
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B «cercano»; toma 2 (Whisper perfecta), montaje _work/build-voz.mjs; Whisper (Groq) whisper-final.json.
- Música: make-music.mjs (propia). SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.

## Notes

- No se crearon pedidos ni cuentas; no se entró con contraseña. Copias temporales borradas del servidor. Nada enviado.
