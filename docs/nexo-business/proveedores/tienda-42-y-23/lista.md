# Tienda 42 y 23 (TRD de calle 42 y 23, Playa) — productos de las fotos del 20-oct-2026

> **Solo preparación.** No se ha publicado nada, no se ha escrito a nadie y no se ha cambiado ninguna base de datos.
> Fotos: las 32 de WhatsApp que guardó Ernesto (`Downloads/42 y 23`), copiadas con su nombre en `fotos/`. Revisadas una por una.

## Resumen
- **26 productos** (25 con precio + 1 sin precio: el split Parker).
- **Moneda:** todas las etiquetas dicen **«PRECIO USD»**. Los dos paneles solares solo tienen «93.00» en el estante, pero la web ya guarda 93 USD como costo de ese panel (producto 1146): USD.
- **Precios que hay que confirmar (4):** tres llevan una **pegatina negra con un precio más bajo encima** de la etiqueta (parece rebaja) y en la estación grande el viejo está **tachado**:
  - Cocina Royal 4 hornillas: 106 → **85** · Ventilador Royal con panel: 68 → **55** · Estación GWELL 600 W: 455 → **350** · Estación GWELL grande: ~~550~~ → **427** (este sí está claro).
  - Se calculó con el precio de la pegatina. Si al recoger cobran el de la etiqueta, el precio de Casa Viva sube (va en la nota de cada uno).
- **Sin precio:** split Parker (no tiene etiqueta en la foto).
- **Ningún teléfono, nombre de tienda ni marca de agua** en las fotos. Lo que hay que quitar antes de publicar es la **etiqueta de precio** «Garantía comercial / Precio USD» (enseña el costo) y los códigos escritos a mano (C-0134 521-…, 198/528-…: son códigos de la tienda, no teléfonos).
- **En la bolsa del bot (crm_market_items): ninguno.** No hay ninguna de estas marcas (Thebe, Hyundai, Hamilton Beach, Kenwood, Philco, Continental, Arox, RCA, GWELL, Ariete, Parker). Solo arroceras genéricas de Kevin (MK-1180, MK-1189).
- **En la web:** ya están **en privado** (cargados a mano a principios de septiembre, SKU «NEXO-…»): split Parker (1013) y panel plegable 120 W 18 V/36 V (1146, con costo 93 USD = esta tienda). **Parecidos** que pueden ser el mismo: batidora Hamilton Beach blanca (1015), cocina Royal 2 hornillas REG202V (1028), ventilador Royal «RA123SL» (1019; la caja de la foto dice **RA12RSL**). Ninguno publicado.
- **El bot ya conoce la tienda:** ficha «TRD 42 y 23» (id 103) en `crm_suppliers`: sin WhatsApp, Calle 42 y 23 (Playa), 9:00–17:00, **se recoge** y **paga Ernesto al recoger** (D47).

## Reglas usadas (las mismas de `electro-2026-10-20`)
- **Precio Casa Viva** = regla del bot (`vivabot/src/market-price.js`, D43/D45): menos de 60 USD → +40 % (mín. 5, máx. 17 USD) redondeado al dólar hacia arriba; de 60 a 300 → +17 USD; más de 300 → +10 %; estos dos redondeados hacia arriba a 5 USD.
- **Ganas gestora** = 40 % de lo que gana Casa Viva (precio Casa Viva − precio proveedor), como MK-1192. El 60 % restante es de Casa Viva/NEXO.
- **Ojo:** esta tienda no lleva a domicilio; el precio no incluye ir a recogerlo ni la mensajería.

## Lista

| # | Producto | Precio proveedor | Moneda | Precio Casa Viva | Ganas gestora | Fotos (18.09.…) | ¿Ya existe? | Foto limpia |
|---|---|---|---|---|---|---|---|---|
| 1 | Aire acondicionado split Parker (unidad interior y exterior) ⚠️ | ? | ? | ? | ? | 05 | sí: web 1013 (privado, NEXO-PARKER-SPLIT, 365 USD) | sí (sin etiqueta; fondo de almacén) |
| 2 | Motobomba periférica Thebe TP-70 Junior (Ebara) · garantía 3 meses | 66.35 | USD | 85 | 7.46 | 05 (1), 06 | no | no (recortar etiqueta y otra caja detrás) |
| 3 | Bomba de agua periférica Hyundai 1/2 HP (HY-CH05HP, 370 W) · garantía 3 meses | 51 | USD | 68 | 6.80 | 06, 05 (1) | no | no (recortar etiqueta) |
| 4 | Batidora Hamilton Beach blanca, jarra plástica, 5 botones · garantía 3 meses | 39.80 | USD | 56 | 6.48 | 06 (1) | parecido: web 1015 (privado, NEXO-HB-BLENDER-WHITE, 50 USD) | no (recortar etiqueta) |
| 5 | Batidora Hamilton Beach negra, jarra de vidrio, 5 velocidades + pulso · garantía 3 meses | 44.20 | USD | 62 | 7.12 | 06 (2), 06 (1) | no | no (recortar etiqueta) |
| 6 | Batidora Kenwood gris con perilla naranja · garantía 3 meses | 36 | USD | 51 | 6 | 07 | no | no (recortar etiqueta) |
| 7 | Batidora Philco blanca, jarra plástica 1,5 L, 2 velocidades + pulso · garantía 3 meses | 29.80 | USD | 42 | 4.88 | 07 (1) | no | no (recortar etiqueta) |
| 8 | Batidora Continental blanca, 2 velocidades + pulso · garantía 3 meses | 23.70 | USD | 34 | 4.12 | 07 (2) | no | no (recortar etiqueta escrita a mano) |
| 9 | Cocina de gas Royal REG404BK de mesa, 4 hornillas, acero inoxidable · garantía 3 meses ⚠️ | 85 (etiqueta 106) | USD | 105 | 8 | 07 (3) | no | no (recortar etiqueta) |
| 10 | Cocina de gas Royal de mesa, 2 hornillas, tope de vidrio negro y azul · garantía 3 meses | 43 | USD | 60 | 6.80 | 08 | parecido: web 1028 (privado, Royal REG202V 2 hornillas, 64.80 USD); el modelo no se ve en la foto | no (recortar etiqueta y cajas) |
| 11 | Cocina de gas Arox CG-05, 2 hornillas, acero inoxidable · garantía 3 meses | 53.95 | USD | 71 | 6.82 | 09, 06 (1), 06 (2) | no | no (foto de lado, con caja y etiqueta; pedir otra) |
| 12 | Olla arrocera Kenwood gris con vaporera · garantía 6 meses | 27.35 | USD | 39 | 4.66 | 09 (1), 08 (1) | no (Kevin tiene arroceras genéricas: web 3031 y 3033) | sí (09 (1) sin etiqueta) |
| 13 | Olla arrocera Kenwood blanca con vaporera · garantía 6 meses | 23.90 | USD | 34 | 4.04 | 09 (2), 10 (1) | no | sí (09 (2) sin etiqueta) |
| 14 | Olla arrocera Continental blanca con tapa de vidrio · garantía 6 meses | 22.30 | USD | 32 | 3.88 | 08 (2), 10 | no | sí (08 (2) sin etiqueta) |
| 15 | Olla arrocera Philco blanca con tapa de acero · garantía 6 meses | 33.35 | USD | 47 | 5.46 | 10 (2) | no | no (recortar etiqueta) |
| 16 | Olla arrocera Hamilton Beach negra · garantía 6 meses | 47.10 | USD | 65 | 7.16 | 11 | no | no (recortar etiqueta) |
| 17 | Olla arrocera Hamilton Beach roja · garantía 6 meses | 43.10 | USD | 61 | 7.16 | 11 (1) | no | no (recortar etiqueta) |
| 18 | Olla de presión eléctrica RCA de acero inoxidable · garantía 6 meses | 72.10 | USD | 90 | 7.16 | 11 (2) | no | no (recortar etiqueta, ventilador y gomas de moto) |
| 19 | Olla de presión eléctrica Philco de acero inoxidable · garantía 6 meses | 68.75 | USD | 90 | 8.50 | 11 (3) | no | no (recortar etiqueta y ventilador) |
| 20 | Olla de presión eléctrica GWELL roja (perilla de tiempo) · garantía 6 meses | 46.25 | USD | 64 | 7.10 | 12 | no | no (recortar etiqueta y ventilador) |
| 21 | Olla de presión eléctrica Ariete digital (9 programas) · garantía 6 meses | 45 | USD | 62 | 6.80 | 12 (1) | no | no (recortar etiqueta) |
| 22 | Panel solar plegable 120 W · 18 V | 93 | USD | 110 | 6.80 | 12 (2) | sí: web 1146 (privado, NEXO-SOLAR-FOLD-120W, variante 18V; costo guardado 93 USD = esta tienda) | no (cartel escrito a mano y precio en el estante) |
| 23 | Panel solar plegable 120 W · 36 V | 93 | USD | 110 | 6.80 | 13 (2) | sí: web 1146 (privado, variante 36V) | no (cartel escrito a mano y precio en el estante) |
| 24 | Ventilador recargable Royal RA12RSL de 12" con panel solar y 2 bombillos LED · garantía 3 meses ⚠️ | 55 (etiqueta 68) | USD | 72 | 6.80 | 12 (3), 12 (1) | parecido: web 1019 (privado, «Royal RA123SL», 78 USD); la caja de la foto dice RA12RSL | no (recortar etiqueta y caja Philco) |
| 25 | Estación de energía GWELL 600 W / 672 Wh · garantía 6 meses ⚠️ | 350 (etiqueta 455) | USD | 385 | 14 | 13, 13 (1) | no | sí (13 sin etiqueta) |
| 26 | Estación de energía GWELL grande (3 tomas 110 V, entrada 24-50 V, con cargador) · garantía 6 meses | 427 (etiqueta 550) | USD | 470 | 17.20 | 14, 13 (3), 14 (1) | no | sí (14 y 13 (3) sin etiqueta) |

⚠️ = precio por confirmar (ver notas).

## Notas por producto
- **#1 Aire acondicionado split Parker (unidad interior y exterior):** Falta precio y capacidad (¿1 tonelada?). No se ve ninguna etiqueta.
- **#4 Batidora Hamilton Beach blanca, jarra plástica, 5 botones:** Si es la misma que la web 1015, con esta regla saldría a 56 USD (hoy tiene 50).
- **#8 Batidora Continental blanca, 2 velocidades + pulso:** Con zoom se lee 23.70; si fuera 23.90 el precio de Casa Viva no cambia (34).
- **#9 Cocina de gas Royal REG404BK de mesa, 4 hornillas, acero inoxidable:** Etiqueta 106.00 con pegatina 85.00 encima (parece rebaja). Se calculó con 85; con 106 sería 125 USD (gestora 7.60).
- **#10 Cocina de gas Royal de mesa, 2 hornillas, tope de vidrio negro y azul:** Confirmar el modelo (¿REG202V?).
- **#11 Cocina de gas Arox CG-05, 2 hornillas, acero inoxidable:** La foto está girada 90° y la cocina se ve poco.
- **#14 Olla arrocera Continental blanca con tapa de vidrio:** La etiqueta está en la foto 10 (misma olla: «CALENTAR / COCINAR»).
- **#22 Panel solar plegable 120 W · 18 V:** La etiqueta del estante no dice moneda; la web ya guarda 93.00 USD como costo de este panel.
- **#23 Panel solar plegable 120 W · 36 V:** Es la otra variante del mismo producto web 1146.
- **#24 Ventilador recargable Royal RA12RSL de 12" con panel solar y 2 bombillos LED:** Es «el ventilador recargable con panel» que dijo Ernesto. Etiqueta 68.00 con pegatina 55.00 (rebaja). Con 68 sería 85 USD (gestora 6.80).
- **#25 Estación de energía GWELL 600 W / 672 Wh:** Etiqueta 455.00 con pegatina 350.00 (rebaja). Con 455 sería 505 USD (gestora 20.00).
- **#26 Estación de energía GWELL grande (3 tomas 110 V, entrada 24-50 V, con cargador):** El precio viejo 550 está tachado con una X roja → 427. Falta la capacidad (Wh) y la potencia: no se ven en las fotos.

## Visto de fondo en las fotos, sin precio (no está en la lista)
- Ventilador de mesa Philco 16" PVM1669 (caja roja, fotos 11 (3) y 12 (3)).
- Ventiladores de mesa blancos (fotos 11 (2), 12 y 12 (1)); en la 12 (1) hay una caja azul «ROYAL».
- Gomas (neumáticos) de moto (foto 11 (2)).

## Para publicar (cuando Ernesto diga)
1. **Confirmar en la tienda** los 4 precios con pegatina, el precio del split Parker y la capacidad de la estación GWELL grande (Ernesto va en persona: la tienda no tiene WhatsApp).
2. **Recortar las fotos** (quitar la etiqueta de precio) o hacer fotos limpias.
3. **Meterlos en la bolsa del bot** (`crm_market_items`) con el vendedor **«TRD 42 y 23»**: así el bajo pedido sabe que se recoge allí y le pregunta a Ernesto (*HAY #N / NO HAY #N*). Al entrar en la bolsa cada uno recibe su id → SKU `MK-<id>`.
4. Con el `market_id` puesto, `productos.json` sirve para `electro-2026-10-20/armar-confirmados.mjs` + `crear-productos.php` (las fotos tienen que estar en el servidor o en Supabase; aquí van las rutas locales).
5. Decidir qué hacer con los privados que ya existen (1013, 1146 y los parecidos 1015, 1019, 1028): actualizar su precio con esta regla o dejarlos.
