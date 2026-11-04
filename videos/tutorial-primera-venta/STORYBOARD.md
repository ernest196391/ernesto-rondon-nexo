---
message: "Vender con Casa Viva es fácil: mandas tu enlace, tu cliente compra solo, y te avisamos quién lo lleva y cuándo se entregó; tu comisión queda apuntada."
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono
mode: autonomous
canvas: 1080x1920
duration: 65.8
---

Arco: gancho → enlace → tienda de la gestora → buscar → comprar → mensajería/recogida → datos → precio de mensajería solo → día → revisar y finalizar → avisos a la gestora → comisión → cierre.
Tiempos alineados a las pausas de assets/audio/voz.wav (se insertaron 0,45 s entre frases; ver assets/audio/voz-segmentos.json).
Un solo teléfono (compositions/phone-shell.html, 7,2–57 s); cada escena pinta su pantalla encima. Capturas reales.

| # | archivo | tiempo | pantalla | voz |
|---|---|---|---|---|
| 1 | s01-titulo | 0–7.2 | título | «Oye, ¿quieres ver lo fácil…? Mira, te enseño tu primera venta, paso a paso.» |
| 2 | s02-enlace | 7.2–15.65 | chat con enlace → 01-tienda (banner de Harley) | «Tú le mandas tu enlace… con tu nombre arriba. Así sabe que lo atiendes tú.» |
| 3 | s03-busca | 15.65–18.75 | 02-busqueda «cesto» | «Busca lo que quiere, por ejemplo, un cesto de basura.» |
| 4 | s04-comprar | 18.75–22.35 | 03-producto, toque en Comprar ahora | «Toca el que le gusta, y aprieta Comprar ahora.» |
| 5 | s05-entrega | 22.35–28.35 | h05 Mensajería / Recogida | «Ahí escoge cómo lo quiere recibir…» |
| 6 | s06-datos | 28.35–30.9 | h06 nombre y WhatsApp | «Pone su nombre y su WhatsApp.» |
| 7 | s07-mensajeria | 30.9–36.08 | h07 municipio, reparto, 1.500 CUP | «Escoge el municipio y el reparto, y el precio… sale solito.» |
| 8 | s08-dia | 36.08–39.4 | h08 Hoy / Mañana | «Después elige el día, hoy o mañana.» |
| 9 | s09-finaliza | 39.4–44.5 | h09 revisa → 10-listo (#2925) | «Revisa… toca finalizar, y listo, su pedido está hecho.» |
| 10 | s10-aviso | 44.5–50.95 | Inicio de gestora + aviso «lo lleva Pedri» | «Y tú no tienes que estar llamando a nadie. Te llega un aviso…» |
| 11 | s11-entregado | 50.95–57 | + aviso «entregado… comisión» | «Cuando lo entregan, te avisamos también, y tu comisión queda apuntada…» |
| 12 | s12-cierre | 57–65.8 | cierre | «Así de fácil. Manda tu enlace hoy… Cualquier duda, me escribes.» |

Audio: voz (grupo voiceover), music-bed (musica.wav, carve 0.8 contra la voz ≈ −19 dB bajo la voz), sfx (whoosh en cada corte, clic en cada toque, notificación en los avisos).
