---
workflow: general-video
flow: automation
storyboard: no
message: "Las 5 dudas del primer día, resueltas: mi acceso (7 días, una vez, luego contraseña), mi enlace (no caduca), #número / mis pedidos (y avisos de cada paso), mensajero en la nota + CUP con la tasa, recogida de 10 a 5."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono dentro de WhatsApp
length: ~72s
narration: yes
---

## Intent

Tutorial #4 «Tus dudas del primer día, resueltas», para GESTORAS (pedido de Ernesto, 11-oct-2026).
Fuente: docs/nexo-business/aprendizajes/2026-10-11-dia1.md §2-3, conocimiento 136–163 y ESTADO (recogida desde las 10).
Hecho con la skill video-tutorial-casa-viva: marca exacta, subtítulos quemados, voz B «cercano».

## Assets

- assets/screens: a01-area (entrada pública con WhatsApp + contraseña), t01-tienda (tienda con nombre de gestora difuminado),
  n00-recogida / n01-nota-vacia / n02-nota (checkout real, sin enviar: POST bloqueado), l01-como-llegar (página pública),
  gestora-inicio (captura aprobada del tutorial 2, nombre difuminado). Chats: renderizados con respuestas reales del bot (VivaBot src).
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B «cercano»; tomas 1 y 2 (take1/take2.wav), montaje _work/build-voz.mjs; Whisper (Groq) whisper-final.json.
- Música: make-music.mjs (propia). SFX: Pixabay (CREDITS.md). Logo: SVG oficiales de docs/sistemas-de-diseno/casa-viva/logo.

## Notes

- No se crearon pedidos ni cuentas; no se entró con contraseña. Nada enviado.
