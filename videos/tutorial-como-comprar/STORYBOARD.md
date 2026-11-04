---
message: "Comprar en Casa Viva es fácil: abres el enlace de tu gestora, eliges, carrito, recogida o mensajero, y tu gestora te escribe para confirmarlo."
audience: clientes finales de las gestoras (La Habana), en el teléfono
mode: autonomous
canvas: 1080x1920
duration: 57.58
---

Generado con `node _work/gen-scenes.mjs .` (escenas + index.html). Tiempos alineados a las pausas de
assets/audio/voz.wav (0,35 s entre frases; ver assets/audio/voz-segmentos.json). Un solo teléfono
(compositions/phone-shell.html, 4,6–50,05 s). Capturas reales (headless Chrome 375x812 @2x, nunca se envió
un pedido; datos de ejemplo «Cliente De Ejemplo», teléfono y nombre de la gestora difuminados).

| # | archivo | tiempo | pantalla | voz |
|---|---|---|---|---|
| 1 | s01-titulo | 0–4.6 | título | «Hola, ¿quieres comprar en Casa Viva? Mira qué fácil es.» |
| 2 | s02-enlace | 4.6–10.5 | chat «Tu gestora» con enlace → t01-tienda (nombre difuminado) | «Abre el enlace que te mandó tu gestora. Esa es su tienda.» |
| 3 | s03-producto | 10.5–15.45 | t02→t05 alfombra, color rosado, Añadir al carrito | «Toca el producto…, elige el color, y aprieta Añadir al carrito.» |
| 4 | s04-carrito | 15.45–20.1 | t06 carrito, Finalizar compra | «Luego entra al carrito, y toca Finalizar compra.» |
| 5 | s05-datos | 20.1–23.2 | t10 nombre y WhatsApp | «Escribe tu nombre y tu WhatsApp.» |
| 6 | s06-entrega | 23.2–28.6 | t08/t09 Mensajería ↔ Recogida en tienda | «Ahora escoge: lo recoges en la tienda, o te lo lleva un mensajero.» |
| 7 | s07-direccion | 28.6–32.4 | t11 dirección → t12 día | «Si te lo llevan, pon tu dirección, y elige el día.» |
| 8 | s08-pago | 32.4–42.25 | t13 vuelto + moneda (USD/CUP/EUR) + nota | «Puedes pagar en efectivo o por transferencia… cambio del día.» |
| 9 | s09-finaliza | 42.25–46.4 | t15 revisa → t16 listo | «Revisa que todo esté bien, toca finalizar, y listo.» |
| 10 | s10-gestora | 46.4–50.05 | t16 + aviso «Tu gestora» | «Tu gestora te escribe por WhatsApp para confirmarlo.» |
| 11 | s11-cierre | 50.05–57.58 | cierre + casaviva.company | «¿Dudas? Escríbele a tu gestora. ¡Te esperamos en Casa Viva!» |

Audio: voz (grupo voiceover), music-bed (musica.wav con carve 0.8 contra la voz), sfx (whoosh en cortes, clic en toques, notificación).
