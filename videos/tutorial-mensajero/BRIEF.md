---
workflow: general-video
flow: automation
storyboard: no
message: "Una gestora de Casa Viva puede elegir qué mensajero lleva su pedido; ese pedido no sale al grupo y el vale le llega directo a ese mensajero por WhatsApp."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras (vendedoras) de Casa Viva en La Habana, no técnicas, viéndolo en el teléfono dentro de WhatsApp
length: 36s
narration: yes
---

## Intent

Tutorial vertical corto (~36 s, igual que la locución) para que las gestoras de Casa Viva
aprendan a elegir qué mensajero lleva su pedido. Tono calmado, amable, sin trucos; palabras
sencillas en español de Cuba. Texto grande en pantalla (máx. ~6 palabras a la vez).
Brief confirmado por el dueño (Ernesto); ejecución autónoma, sin storyboard de revisión.

## Assets

- assets/voz.mp3 — locución ya generada y revisada (copia de docs/nexo-business/tutoriales/tutorial-mensajero-voz.mp3). Pista de narración; no regenerar.
- docs/nexo-business/tutoriales/tutorial-mensajero-voz-tiempos.json — tiempos por segmento; los cortes de escena se alinean además con las pausas reales de la voz (ffmpeg silencedetect).
- docs/nexo-business/tutoriales/tutorial-mensajero-guion.txt — guion.
- assets/fonts/figtree-*.woff2 — Figtree 400/600/700/800 embebida con @font-face local.

## Customizations

- Marca Casa Viva: verde profundo #0f3d3a, arena #f6f1e6 (fondo), superficie #fffdf9, tinta #25231f, gris #6f6a62, oro #c39443, verde suave #e4ece8. Tarjetas redondeadas (~14px).
- Escenas aprobadas: 1 título "Elige tú quién lleva tu pedido 🛵"; 2 móvil con app de gestora (menú ☰ → Ventas → pedido #2896 · Cama plegable · Duniel → "Mensajero que lo lleva" → Pedri → "Guardado ✓"); 3 "Nota del pedido" escribiendo "mensajero: Pedri"; 4 grupo "Mensajerías CASA Viva" con marca "no sale aquí" + chat privado de Pedri con el VALE; 5 aviso a la gestora "🛵 Tu pedido #2896 lo lleva Pedri, hoy 4 pm. Avísale a tu cliente."; 6 cierre "Si no eliges, sale al grupo y lo coge el primero que diga «Yo»." + casaviva.company.
- UI de teléfono/WhatsApp hecha en HTML/CSS. Sin capturas reales, sin números reales, sin datos de clientes reales (solo los nombres ficticios del brief).

## Notes

- Sin música de fondo.
- Salida final: docs/nexo-business/tutoriales/tutorial-mensajero.mp4, 1080x1920, 30 fps, H.264 + AAC, < ~16 MB (para WhatsApp).
- No publicar nada en línea, no enviar nada a nadie.
- Los tiempos del storyboard aprobado (0–4, 4–13, 13–19, 19–28, 28–33, 33–36) se ajustaron a la locución real: la frase "y a ti te aviso…" termina en ~28 s y el cierre "Si no eliges…" ocupa 28.3–36 s.
