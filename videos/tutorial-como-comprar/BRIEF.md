---
workflow: general-video
flow: automation
storyboard: no
message: "Comprar en Casa Viva es fácil: abres el enlace de tu gestora, eliges, lo pones en el carrito, dices si lo recoges o te lo llevan, y tu gestora te escribe para confirmarlo."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: clientes finales de las gestoras de Casa Viva (La Habana), no técnicos, viéndolo en el teléfono dentro de WhatsApp
length: ~50s
narration: yes
---

## Intent

Tutorial #3 «Cómo comprar en Casa Viva», para CLIENTES. Lo comparten TODAS las gestoras junto con su
enlace personal, así que el video no muestra el nombre ni el código de ninguna gestora (difuminados).
Le habla al cliente de «tú», cálido y sencillo. Misma marca, música y efectos que el tutorial #2.

## Assets

- assets/screens/* — capturas reales de la web en móvil (copiadas del tutorial #2 y nuevas del navegador
  integrado, 375x812 @2x). Nombres y teléfonos difuminados en el video.
- Voz: ElevenLabs, voz por defecto del negocio (la de Ernesto), eleven_multilingual_v2, perfil A «cliente»
  (stability 0.35, similarity 0.8, style 0.45, speaker boost, speed 1.05); generada en el VPS y auditada con Whisper (Groq).
- Música: assets/audio/make-music.mjs (procedural, sin derechos de terceros). SFX: Pixabay (CREDITS.md).

## Notes

- Salida: docs/nexo-business/tutoriales/tutorial-como-comprar.mp4, 1080x1920, 30 fps, < 16 MB.
- No inventar precios, mensajería ni plazos. Solo formas de pago que salen en las pantallas.
- No publicar ni enviar nada. No commit. No crear pedidos de prueba.
