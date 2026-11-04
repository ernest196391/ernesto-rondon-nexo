---
workflow: general-video
flow: automation
storyboard: no
message: "Vender con Casa Viva es fácil: mandas tu enlace, tu cliente compra solo en tu tienda, y a ti te avisamos quién lo lleva y cuándo se entregó; tu comisión queda apuntada."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras (vendedoras) de Casa Viva en La Habana, no técnicas, viéndolo en el teléfono dentro de WhatsApp
length: ~66s
narration: yes
---

## Intent

Tutorial #2 «Tu primera venta, paso a paso». Vertical, calmado, profesional. Capturas REALES
de la web en móvil (tienda de Harley, gestor aprobado; su nombre puede verse). Locución cálida
(ElevenLabs, voz por defecto del negocio, perfil «cercano»), música suave de fondo y efectos
sutiles (clic en toques, whoosh suave en cambios de escena). Misma marca que el tutorial #1.

## Assets

- assets/screens/01–03, 10 — capturas del navegador integrado (375x812 @2x).
- assets/screens/h05–h09 — capturas del checkout en Chrome sin interfaz (375x812 @2x), mismos datos de PRUEBA; nunca se envió desde ahí (el POST de checkout se bloqueaba).
- assets/screens/gestora-inicio.jpg — pantalla real «Inicio» de una gestora (aprobada), sin barra de estado, nombre difuminado.
- Pedido de prueba creado para la pantalla final: #2925 (PRUEBA Tutorial) — hay que cancelarlo.
- assets/audio/guion.txt — guion; assets/audio/voz.wav — locución con pausas entre escenas (auditada con Whisper).
- assets/audio/musica.wav — música original procedural (make-music.mjs), sin derechos de terceros.
- assets/sfx — click-soft, whoosh-short, notification (Pixabay Content License, ver CREDITS.md).

## Notes

- Salida: docs/nexo-business/tutoriales/tutorial-primera-venta.mp4, 1080x1920, 30 fps, < 16 MB.
- No publicar ni enviar nada. No commit.
