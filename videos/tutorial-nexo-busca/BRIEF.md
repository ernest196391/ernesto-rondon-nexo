---
workflow: general-video
flow: automation
storyboard: no
message: "NEXO Busca: ¿tu cliente pide algo que no tenemos? Área → Herramientas → NEXO Busca: sube la foto (o escribe), salen vendedores con su precio, «Usar esta» → define tu precio y ves cuánto ganas; véndelo tú (pregunta al proveedor, foto bonita, mándaselo sin decir dónde lo compras) o por Casa Viva (bajo pedido: Casa Viva confirma y te avisa con tu comisión). 20 búsquedas al día, gratis."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono dentro de WhatsApp
length: ~68s
narration: yes
---

## Intent

Tutorial «NEXO Busca», para GESTORAS (pedido por Ernesto el 16-oct: gancho «¿tu cliente te pide algo que no tenemos?», casos reales de
Dayami y Nadielys, la solución, dónde está y cómo se usa). Fuente: Core 3.14.28 (ESTADO L19) y las capturas reales
`docs/nexo-business/capturas/2026-10-16-nexo-busca/01–10`. Hecho con la skill video-tutorial-casa-viva (marca exacta, subtítulos quemados, voz B «cercano»).
Ernesto pidió 60–90 s (manda sobre los 45–70 de la skill).

## Assets

- assets/screens/nb-01…nb-10: copias en JPG de las capturas 01–10 (390x844 @2x, ya sin datos personales; «Marta (Playa)» es dato de ejemplo).
- assets/screens/nb-menu: menú del área con «Herramientas → NEXO Busca», renderizado en el servidor con wp eval-file como la gestora 65 (sin contraseña,
  solo lectura), limpiado con _work/capture-sanitize.py (nombre → «Tu nombre», código → TUCODIGO, sin zona ni clientes/ventas, nonces a cero) y
  capturado con Chrome sin interfaz (iframe 375x812 @2x). Temporales borrados de Hostinger.
- assets/screens/chat-dayami-cortinas, chat-nadielys-ventiladores: fotos reales que mandaron (entrantes del 16-oct). Los chats NO se capturaron:
  se recrean con su texto real (`cv chat`), nombre de pila y sin teléfonos.
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B «cercano», una toma POR ESCENA (_work/gen-voz-vps.mjs), cada una
  auditada con Whisper (Groq); montaje _work/build-voz.mjs (bordes recortados, pausas 0,5–0,7 s). Subtítulos con los tiempos por palabra de cada toma.
- Música: make-music.mjs (propia), tallada bajo la voz con carve.mjs. SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.

## Notes

- Sin Higgsfield (0 créditos). No se creó nada en la web ni en la base; nada enviado a nadie.
- HyperFrames subido de 0.8.157 a 0.8.166 (check pasa).
