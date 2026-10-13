# Estudio de historias (y herramientas gratis en el centro de control)

**Idea de Ernesto, 13-oct-2026 11:55.** Etapa 1 hecha. Etapa 2: boceto en el chat, esperando su visto bueno.

| | |
|---|---|
| **Quién** | Gestoras (gratis) y socias-inversoras, como Maryta y Dayra, con funciones de más |
| **Problema** | Cada día publican estados de WhatsApp. Hoy copian fotos de la web o del grupo, sin precio, sin su enlace y a veces sin el color correcto |
| **Evidencia (13-oct)** | Dayra, 11:04: «quiero fotos comerciales y las medidas de este producto». Rafael, 10:41: la foto no cambia al elegir el color. Dany: foto por color en las recogidas. Cely: listas por departamento |
| **Gratis (v1, sin clave)** | Elige un producto de «Fotos para publicar». Sale una historia de 1080×1920 con la marca, la foto, el precio en USD y CUP (tasa del día), sus medidas, su enlace (`?ref=`) y un QR. Se comparte con un toque |
| **Gratis (v2, con su clave de Google)** | La gestora pega su clave de AI Studio y la IA le escribe el texto del estado o del anuncio de Revolico/Facebook. **Probado: texto y visión son gratis con clave gratis** |
| **Premium (más adelante)** | Foto con IA (otro color, el producto en una sala), video con IA y voz. Con la clave gratis de Google **no** se pueden hacer imágenes (error 429, pide facturación). Con OpenAI cuesta unos 0,01 USD por foto |
| **Cómo se mide** | Historias creadas por semana y por gestora, y ventas por su enlace en los 3 días siguientes |
| **Qué existe ya** | «Fotos para publicar» (área de la gestora, por departamento, con precios y enlace) · `vivabot/src/studio.js` (quita fondos) · `scripts/fotos-bolsa/foto-ia.mjs` (OpenAI) · tasa del día en Core · QR de su enlace |

## Cola de herramientas (gratis o premium)

1. **Estudio de historias:** gratis. Es la v1 de arriba.
2. **Video de estado de 15 s:** gratis. Con 3–5 fotos, texto y música, hecho en el propio teléfono, sin IA.
3. **Texto para vender:** gratis con su clave de Google. Escribe el anuncio para Revolico, Facebook o el estado, con su enlace.
4. **Lista por departamento para copiar:** gratis. Es lo que pidió Cely.
5. **Calculadora:** gratis. Precio en CUP con la tasa del día, cuánto gana ella y cuánto paga el cliente con la mensajería.
6. **Para socias-inversoras: «Dar entrada a mi mercancía»:** foto, costo y plus. Sale el precio sugerido, la foto blanca y la ficha, y lo aprueba Lennys. Además, ver sus productos, su stock y lo que ganó. Hay un diseño en `docs/nexo-business/entradas/FLUJO-ENTRADA-BOT.md`.
7. **Premium:** foto con IA (otro color o el producto en una sala), video con IA, voz y publicar sola en grupos.
