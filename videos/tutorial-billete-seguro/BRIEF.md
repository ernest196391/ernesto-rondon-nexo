---
workflow: general-video
flow: automation
storyboard: no
message: "Billete Seguro: casi perdemos una bici de 550 USD (#4220) y Niurka avisó de una pareja que paga con billetes falsos de 100 USD; el que pierde es el que recibe el billete. La app revisa el billete en 1 minuto (4 pruebas + número de serie → sin señales / dudoso / no lo aceptes). Úsala con billetes grandes, clientes nuevos y entregas en la calle. Está en casaviva.company/billete."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: equipo de Casa Viva (mensajeros, gestoras y dependientas), en el teléfono dentro de WhatsApp
length: ~64s
narration: yes
---

## Intent

Video «Billete Seguro» estilo Alex Hormozi (pedido de Ernesto, 20-oct): historia → aviso de Niurka (secuencia de los estafadores) → solución → cuándo → dónde.
Fuentes: incidencias del 20-oct (#4220, Cary, números de la clienta tapados en pantalla), mensaje de Niurka González (…3588) a las 13:35, app `apps/billete-seguro` (D82).

## Assets

- assets/screens/bs-*.jpg: la app real (localhost, mismos archivos que casaviva.company/billete) capturada a 375x812 @2x con la herramienta de la skill guia-paso-a-paso-casa-viva.
  Fotos del billete = rectángulo de ejemplo; bs-serie y bs-ok con `fetch` bloqueado o con una respuesta de ejemplo (no se llamó a la IA real ni se guardó nada).
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B; tomas s0 t2 · s1 t2 («Cari» para que suene bien) · s2 t1 · s3 t1 · s4 t2 · s5 t1 · s6 t2 · s7 t1. Audit Whisper del MP4 final: igual al guion.
- Música: make-music.mjs (propia), tallada con carve.mjs. SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.
- Generador: _work/scenes-billete.part.mjs (escenas) dentro de _work/gen-scenes.mjs (base del tutorial «Las piedras»), CUES con texto a mostrar opcional.
- Los archivos de «Las piedras» copiados con el proyecto (compositions/s02-puntos… y assets/screens/pi-*) no se usan.
