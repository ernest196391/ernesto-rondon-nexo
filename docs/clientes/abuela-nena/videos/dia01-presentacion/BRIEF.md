---
workflow: general-video
flow: automation
storyboard: no
message: "Te presento a la Abuela Nena: 68 años, más energía que sus nietos, y cada día te cuenta una costumbre."
destination: Instagram/Facebook Reels + historias de WhatsApp
aspect: "9:16"
language: es-CU
audience: adultos cubanos (sobre todo mujeres de 35 a 65 y sus mamás)
length: "~28 s"
---

## Intent
Video del día 1 de la influencer IA "Abuela Nena" (emprendimiento de bienestar de Ernesto Padre). Presentación: quién es, de dónde es, por qué tiene energía ("costumbres") y que contará una cada día. Ernesto (hijo) lo aprueba antes de publicar.

## Assets
- Voz: `assets/voz.mp3` (voz 1 de Nena, Higgsfield seed_audio, 23,9 s, comprobada con Whisper).
- Fotos del banco (Higgsfield, misma cara): N11 silbato, N08 selfie sala, N10 parque con vecinos, N02 escalera, N15 apunta, N03 cafetera, N01 parque estirando, N05 balcón al sol, N17 perfil.
- Música y silbatazo originales sintetizados (`scripts/sonidos.py`).
- Transcripción con tiempos por palabra: `transcript.json` (faster-whisper local).

## Customizations
- Subtítulos grandes palabra a palabra (Archivo Black), palabra activa resaltada en rojo silbato.
- Fotos con movimiento suave (Ken Burns).
- Etiqueta fija "DÍA 1" (sin "personaje IA" en pantalla: el aviso va en la bio y en la etiqueta de IA de la red, decisión de Ernesto 2026-10-12).
- Cierre: foto de perfil, "Abuela Nena", "68 años · Santos Suárez", "Sígueme · mañana te cuento la primera costumbre". El "escríbele a Ernesto" va en la descripción del post.

## Notes
- Reglas de Vital Health: sin nombre de la empresa, logos ni productos; sin curas ni ingresos.
- No poner el teléfono del padre en el video hasta que Ernesto lo confirme (va en la bio).
- Diseño: azul marino #1B2A41, crema #F6F1E4, rojo silbato #C8372B, verde salvia #8BA889. Idea: "la libreta de la maestra de Educación Física".
