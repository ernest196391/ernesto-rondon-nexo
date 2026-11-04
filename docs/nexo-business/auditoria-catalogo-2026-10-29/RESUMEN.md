# Auditoría del catálogo de casaviva.company — 29-oct-2026 (Fase 1, solo lectura)

Hecha por Claude el 29-oct (19:00–19:40 Cuba). **No se cambió nada en la web.** Lo único que se tocó fue la biblioteca de fotos del bot: 79 fotos «sin producto» asignadas a su producto (copia previa en el VPS: `/root/backups/fotos-reales-json-antes-auditoria-20261029.tgz`; se deshace con `cv fotos quitar <id>`).

Decisiones de Ernesto (Paso 0, 29-oct): orden = **mezcla** (ventas + preguntas + sin foto real + descripción pobre) · SEO = **decidir tras esta auditoría** · tope = **100 productos al día** · slugs = **solo los malos, con 301**.

## Archivos

| Archivo | Qué es |
|---|---|
| `productos.csv` | Una fila por producto (1.129: publicados, privados y borradores), ordenada por prioridad |
| `resumen.json` | Todos los conteos, por problema y por categoría |
| `SEO-TECNICO.md` | Cómo sale hoy lo que ve Google y WhatsApp, y qué falta |
| `fotos-asignadas.csv` | Las 79 fotos de la biblioteca asignadas hoy (y por qué) |
| `fotos-dudosas.csv` | Las 231 fotos que siguen sin producto (14 con sugerencia revisada a ojo) |
| `fotos-reales-por-subir.csv` | 102 productos con fotos reales ya en la biblioteca que **no están en la web** (233 fotos) |
| `fotos-para-la-tienda.csv` | 73 productos propios, con existencias, sin ninguna foto real: la lista única para Zaymi o Nana (**no enviada**) |

## Cómo se midió (para no engañarnos)
- **Ventas 60 días** = pedidos de la web completados o en espera (wc_order_stats). Las ventas de la caja (NEXO) no entran.
- **Foto real** = la misma foto (huella dHash, ≤ 4 bits) está en la biblioteca del equipo (`/root/archivos/fotos-reales`), o el archivo/pie lo dice. Fotos viejas de BizneCubano que fueran reales no cuentan si no están en la biblioteca.
- **Preguntas de gestoras** = mensajes de gestoras (privado + General, 60 días) con pinta de pregunta, sin las citas del bot ni las fichas de pedido, emparejados con el nombre del producto. Es una **estimación** (226 de 1.538 preguntas se pudieron asignar a un producto concreto).
- **Medidas / material / garantía / qué incluye** = se busca el dato en título + descripciones. «Sí» no quiere decir que esté confirmado.

## Números (publicados = 923)

| Problema | Productos |
|---|---|
| Bajo pedido (proveedor) / propios | 699 / 224 |
| 1 foto o ninguna | 683 (1 sin ninguna) |
| Menos de 3 fotos | 785 |
| **Sin ninguna foto real** | **813** (propios: 130) |
| Listos en fotos (3 o más y al menos 1 real) | 73 (8 %) |
| Descripción vacía / < 250 / < 400 letras | 7 / 415 / 545 |
| Descripción de 400 o más | 378 (41 %) |
| Sin medidas · sin material · sin garantía · sin «qué incluye» | 285 · 736 · 896 · 771 |
| Título < 25 letras · > 65 · MAYÚSCULAS · emoji | 131 · 71 · 13 · 1 |
| Títulos duplicados | 42 productos en 21 parejas (todos bajo pedido, el mismo artículo publicado 2 veces desde 2 avisos, a veces con precio distinto) |
| Slug con problema | 186 (161 con «-2» al final por duplicado) |
| Con título SEO y meta description propios | 7 |
| Fotos sin texto alt | 1.386 de 1.547 |
| Fotos originales de más de 150 KB | 265 |
| Productos con ventas en 60 días | 110 (367 unidades) |
| Productos con preguntas de gestoras | 144 |

**Lo que más preguntan las gestoras** (1.538 preguntas): disponibilidad 406 · fotos 341 · precio 288 · medidas 133 · color 79 · funcionamiento 62 · garantía 32 · material 30. → Fotos reales y medidas son lo que una buena ficha puede quitar de en medio.

## Por categoría (publicados)

| Categoría | Prod. | Bajo pedido | Sin foto real | < 3 fotos | Desc. < 400 | Título mal | Ventas 60 d | Preguntas |
|---|---|---|---|---|---|---|---|---|
| Apagones y energía | 205 | 198 | 201 | 194 | 166 | 44 | 12 | 29 |
| Tecnología | 164 | 161 | 160 | 152 | 28 | 41 | 1 | 17 |
| Electrodomésticos | 115 | 114 | 111 | 111 | 94 | 17 | 1 | 13 |
| Organización | 86 | 74 | 75 | 78 | 74 | 9 | 9 | 8 |
| Habitación | 66 | 6 | 40 | 35 | 28 | 19 | 207 | 57 |
| Cocina | 61 | 29 | 50 | 47 | 35 | 18 | 20 | 8 |
| Sala y muebles | 54 | 30 | 39 | 37 | 37 | 10 | 109 | 19 |
| Accesorios | 45 | 29 | 39 | 38 | 19 | 22 | 15 | 10 |
| Baño | 43 | 8 | 28 | 27 | 21 | 15 | 35 | 21 |
| Ferretería | 42 | 37 | 41 | 39 | 33 | 4 | 2 | 5 |
| Cuidado personal | 35 | 11 | 22 | 18 | 9 | 11 | 18 | 11 |
| Movilidad | 26 | 19 | 23 | 20 | 16 | 3 | 14 | 9 |
| Navidad | 11 | 4 | 10 | 8 | 5 | 3 | 9 | 8 |
| Sin categorizar | 7 | 0 | 0 | 3 | 7 | 0 | 6 | 17 |
| Sala · Baño, cocina · Aires acond. · Juguetes | 2 · 1 · 1 · 1 | 0 | — | — | — | — | — | — |

- **Habitación, Sala y muebles y Baño** son el 90 % de las ventas: ahí empieza el piloto.
- 7 productos publicados están en «Sin categorizar» y hay 4 categorías casi vacías («Sala», «Baño, cocina», «Aires acondicionados», «Juguetes») que duplican otras.
- **Ninguna categoría tiene texto** (0 letras en las 19).
- **688 productos bajo pedido tienen la misma meta description y la misma vista previa de WhatsApp** («Producto bajo pedido: confirmamos disponibilidad en 1 hora antes de cobrar.»), porque sale de la descripción corta. Es lo primero que conviene arreglar (en el Core, de una vez). Ver `SEO-TECNICO.md`.

## Hallazgo importante: la sincronización de proveedores
- Al **volver a publicar** un producto bajo pedido (APRUEBA en «Tú», botón del panel, hoja de fotos o el `supplier-feed` de Sergio cada 5 min) el Core **pisa el título, la descripción larga y la corta** (`CVD_Market_Bridge::publish_item`). La corta siempre queda en el aviso «Bajo pedido · llega en 24 h…».
- El `supplier-feed` de Sergio publica con `replace_images: true`: **borraría las fotos reales** que añadamos a esos productos.
- **No pisa** `_cvd_seo_title`, `_cvd_meta_description`, los textos alt ni la galería (fuera del caso anterior).
- Por eso: en bajo pedido, mejorar primero **título SEO, meta description y alt** (persisten). Título y descripción solo si se cambian también en `crm_market_items` (la fuente) o si el Core aprende a no pisarlos (un «bloqueo de ficha»). Queda anotado para **web-maraton**.

## Los 100 más prioritarios (publicados)
Puntaje: ventas 40 + preguntas 25 + sin foto real 20 (8 si es bajo pedido, que no está en la tienda) + descripción pobre 15 + < 3 fotos 5 + título con problema 3; propios agotados × 0,5. Fotos = total/reales (+ reales en la biblioteca que faltan por subir).

| # | Id | Producto | Origen | Ventas 60 d | Preg. | Fotos | Letras desc. | Título | Puntaje |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 290 | Juego de cortina tapa sol Royale | propio | 10 | 1 | 5/0 (+4 por subir) | 233 | — | 72.9 |
| 2 | 118 | Sobrecama lisa full | propio | 2 | 3.3 | 1/0 | 138 | corto(<25) | 69.9 |
| 3 | 2449 | Fundas Majestic Imperial | propio | 10 | 2.3 | 1/0 (+7 por subir) | 468 | corto(<25) | 69.7 |
| 4 | 2407 | Cama plegable portátil | propio | 16 | 4 | 3/2 (+2 por subir) | 378 | corto(<25) | 65.2 |
| 5 | 302 | Protector de colchón Queen | propio | 4 | 1.5 | 1/0 | 347 | — | 62.2 |
| 6 | 2463 | Farol solar con sensor de movimiento | propio | 7 | 2.3 | 1/0 (+3 por subir) | 543 | — | 61.7 |
| 7 | 2491 | Juego de sabanas Camera Majestic imperial | propio | 11 | 3.7 | 8/5 | 224 | — | 61 |
| 8 | 119 | Maceta con suculenta | propio | 3 | 0 | 1/0 (+1 por subir) | 139 | corto(<25) | 59.8 |
| 9 | 177 | Set de alfombras para baño (3 piezas) | propio | 4 | 0.5 | 5/0 | 160 | — | 59.5 |
| 10 | 3714 | Almohada ortopédica cervical Ceasar Palace 45 × 70 cm | propio | 17 | 6.5 | 5/5 | 829 | — | 58.4 |
| 11 | 2523 | Protector de colchón king | propio | 2 | 1.5 | 1/0 | 365 | — | 56.6 |
| 12 | 2908 | Cortina de baño diseño de flores | propio | 1 | 0.8 | 1/0 | 0 | — | 56 |
| 13 | 2906 | Cortina de baño diseño de conchas | propio | 1 | 0.8 | 1/0 | 0 | — | 56 |
| 14 | 2387 | Capas de moto (talla L) | propio | 12 | 3.5 | 2/1 (+6 por subir) | 455 | corto(<25) | 55.1 |
| 15 | 346 | Doyle Elegante Rectangular (6 piezas) | propio | 2 | 0 | 1/0 (+4 por subir) | 185 | — | 53.7 |
| 16 | 463 | Bata de baño | propio | 5 | 1 | 9/0 (+2 por subir) | 557 | corto(<25) | 51.9 |
| 17 | 2755 | MOCHILA M-15 | propio | 2 | 0 | 2/0 | 295 | corto(<25) mayusculas | 50.7 |
| 18 | 2457 | Edredón con juego de sabana (queen) | propio | 3 | 1 | 1/0 | 570 | — | 49 |
| 19 | 2397 | Alfombra Bienvenido 45x75 cm | propio | 3 | 1 | 1/0 (+8 por subir) | 574 | — | 49 |
| 20 | 3556 | Organizador multifuncional con ruedas, 3 cestas | propio | 5 | 1 | 2/1 (+5 por subir) | 240 | — | 48.9 |
| 21 | 67 | Base para electrodomésticos | propio | 5 | 1 | 7/0 | 522 | — | 48.9 |
| 22 | 2471 | Manta 180X220 cm (estampada) | propio | 4 | 0 | 9/0 (+6 por subir) | 382 | — | 48.4 |
| 23 | 117 | Cojín decorativo — Diseño 1 | propio | 4 | 0 | 5/0 (+8 por subir) | 351 | — | 48.4 |
| 24 | 362 | Colchón - EDSM A - King | propio | 1 | 2 | 1/0 | 1267 | corto(<25) | 47.9 |
| 25 | 2451 | Cortina roller enrollable 100X160 | propio | 1 | 3.3 | 1/0 | 733 | — | 47.7 |
| 26 | 2825 | Rasuradora portátil facial | propio | 2 | 1.5 | 2/0 | 626 | — | 47.6 |
| 27 | 2489 | Paragua infantil (55cm) | propio | 1 | 0 | 1/0 (+2 por subir) | 363 | corto(<25) | 46.7 |
| 28 | 2443 | Espejo Led 50X70 CM | propio | 1 | 0 | 1/0 | 366 | corto(<25) | 46.7 |
| 29 | 2453 | Cortina roller enrollable 160X280 | propio | 1 | 2.3 | 1/0 | 733 | — | 45.5 |
| 30 | 822 | Soporte TV 14”-42” | propio | 0 | 1 | 5/0 | 139 | corto(<25) | 45.2 |
| 31 | 5527 | Depiladora de nariz | propio | 1 | 1 | 2/0 | 632 | corto(<25) | 44.9 |
| 32 | 2371 | Alfombra con piecitos | propio | 3 | 0 | 1/0 | 594 | corto(<25) | 44.8 |
| 33 | 4560 | Batería 25,5 V 100 Ah | bajo ped. | 0 | 3.5 | 2/0 | 20 | corto(<25) | 44.5 |
| 34 | 1013 | Aire acondicionado split Parker con unidad interior y e | propio | 0 | 2 | 1/0 | 352 | — | 44.2 |
| 35 | 274 | Colchón 180x200cm Dawang + 2 almohadas hoteleras | propio | 0 | 2 | 1/0 | 296 | — | 44.2 |
| 36 | 3564 | Organizador de baño de metal, 3 niveles | propio | 1 | 7 | 6/6 | 127 | — | 43.8 |
| 37 | 2517 | Pesa electrónica corporal | propio | 6 | 0 | 3/0 (+2 por subir) | 1726 | — | 43.8 |
| 38 | 4644 | Todo en uno Must 6 kW con 15 kWh | bajo ped. | 0 | 4.5 | 2/0 | 48 | — | 43.3 |
| 39 | 4352 | Kit todo en uno Infinity 6 kW con 15 kWh | bajo ped. | 0 | 4.5 | 1/0 | 49 | — | 43.3 |
| 40 | 465 | Juego de sabanas Queen Majestic imperial | propio | 5 | 0.7 | 5/2 (+1 por subir) | 246 | — | 42.6 |
| 41 | 3147 | Lámpara de Piso Estilo Art Decó con diseño geométrico | bajo ped. | 3 | 3 | 1/0 | 412 | — | 42.3 |
| 42 | 2381 | Árbol de navidad (1,50 m) | propio | 6 | 3.3 | 2/1 | 430 | — | 41.9 |
| 43 | 2557 | Sabana camera 100% luxury home | propio | 3 | 0 | 1/0 (+8 por subir) | 831 | — | 41.8 |
| 44 | 2515 | Percha Doble con Zapatera 150x110x40cm | propio | 3 | 0 | 1/0 | 422 | — | 41.8 |
| 45 | 4317 | Batería 48 V 300 Ah (15360 Wh) | bajo ped. | 0 | 3.5 | 1/0 | 27 | — | 41.5 |
| 46 | 2511 | Organizador de Baño blanco | propio | 1 | 0.8 | 1/0 | 549 | — | 41.3 |
| 47 | 5674 | Protector de colchón Camero (full) | propio | 0 | 1 | 1/0 | 363 | — | 41.2 |
| 48 | 5530 | Glucometro | propio | 0 | 6 | 3/0 (+1 por subir) | 1580 | corto(<25) | 40.7 |
| 49 | 3739 | Cortinero decorativo en espiral extensible 168–305 cm | propio | 17 | 0 | 7/5 | 751 | — | 40 |
| 50 | 5536 | Máquina de mujer 4 en 1 | propio | 1 | 1 | 3/0 | 726 | corto(<25) | 39.9 |
| 51 | 2425 | Compresor portátil modelo 1 | propio | 1 | 2 | 3/0 | 800 | — | 39.9 |
| 52 | 695 | Toallas Cisne Blanco 40x70 | propio | 1 | 0 | 10/0 (+4 por subir) | 293 | — | 38.7 |
| 53 | 2411 | Cesto de pedal negro (7 litros) | propio | 1 | 1.5 | 3/0 | 449 | — | 38.5 |
| 54 | 4947 | Cesta de compra con asas | bajo ped. | 0 | 1 | 1/0 | 194 | corto(<25) | 38.2 |
| 55 | 4451 | Cafetera Espresso Royal | bajo ped. | 0 | 1 | 2/0 | 158 | corto(<25) | 38.2 |
| 56 | 4386 | Neveras con detalles pequeños (funcionan bien) | bajo ped. | 0 | 2 | 2/0 | 0 | — | 38.2 |
| 57 | 574 | Colchón - EDSM A - Queen | propio | 0 | 2 | 1/0 | 1267 | corto(<25) | 38.2 |
| 58 | 291 | Cortinero decorativo — Diseño 1 | propio | 13 | 1 | 2/0 | 358 | — | 38.1 |
| 59 | 746 | Termo térmico 1L | propio | 0 | 0 | 3/0 (+1 por subir) | 139 | corto(<25) | 38 |
| 60 | 514 | Mantel circular | propio | 0 | 0 | 3/0 | 139 | corto(<25) | 38 |
| 61 | 178 | Mantel cuadrado | propio | 0 | 0 | 5/0 | 139 | corto(<25) | 38 |
| 62 | 801 | Alfombra de chenilla | propio | 0 | 0 | 6/0 (+2 por subir) | 162 | corto(<25) | 38 |
| 63 | 684 | Toallas pequeña | propio | 0 | 0 | 8/0 | 113 | corto(<25) | 38 |
| 64 | 2593 | Silla de oficina (23_222) | propio | 6 | 0.5 | 3/1 (+1 por subir) | 329 | — | 37.9 |
| 65 | 5496 | Teléfono puzzle | propio | 1 | 0 | 1/0 | 664 | corto(<25) | 37.7 |
| 66 | 4878 | Olla de presión eléctrica Ariete digital | bajo ped. | 1 | 0 | 1/0 | 92 | — | 37.7 |
| 67 | 4485 | Inflable árbol de Navidad LYC-044 (2,1 m) | bajo ped. | 1 | 0 | 1/0 (+1 por subir) | 96 | — | 37.7 |
| 68 | 2729 | Escritorio de oficina | propio | 1 | 0 | 2/0 (+1 por subir) | 593 | corto(<25) | 37.7 |
| 69 | 745 | Sobrecama Queen | propio | 1 | 0 | 1/0 | 584 | corto(<25) | 37.7 |
| 70 | 2774 | MOCHILA M-6 | propio | 0 | 0 | 2/0 (+1 por subir) | 295 | corto(<25) mayusculas | 37 |
| 71 | 2759 | MOCHILA M-5 | propio | 0 | 0 | 2/0 (+1 por subir) | 295 | corto(<25) mayusculas | 37 |
| 72 | 2757 | MOCHILA M-3 | propio | 0 | 0 | 1/0 (+1 por subir) | 295 | corto(<25) mayusculas | 37 |
| 73 | 2503 | Mochila M- 1 | propio | 0 | 0 | 2/0 (+1 por subir) | 332 | corto(<25) | 37 |
| 74 | 2483 | Olla con tapa | propio | 0 | 0 | 2/0 | 385 | corto(<25) | 37 |
| 75 | 2405 | Cable fotovoltaico negro | propio | 0 | 0 | 1/0 (+2 por subir) | 379 | corto(<25) | 37 |
| 76 | 2385 | Cable fotovoltaico rojo | propio | 0 | 0 | 1/0 (+2 por subir) | 379 | corto(<25) | 37 |
| 77 | 2821 | Cápsulas para el cabello con vitamina A,C y E | propio | 1 | 1 | 5/0 (+1 por subir) | 547 | — | 36.9 |
| 78 | 4264 | Almohada de bambú 71x48 | propio | 2 | 0 | 3/0 | 690 | corto(<25) | 36.7 |
| 79 | 2589 | Zapatera 5 niveles | propio | 0 | 1.3 | 1/0 | 1185 | corto(<25) | 36.3 |
| 80 | 2445 | Estante Organizador | propio | 0 | 0.3 | 4/0 | 368 | corto(<25) | 36.2 |
| 81 | 5216 | Pistola de pintar 750 ml | bajo ped. | 0 | 0.5 | 1/0 | 24 | corto(<25) | 36.1 |
| 82 | 4581 | Batería Sako 10 kWh | bajo ped. | 0 | 0.5 | 1/0 | 22 | corto(<25) | 36.1 |
| 83 | 4477 | Silla de oficina | bajo ped. | 0 | 0.5 | 1/0 | 38 | corto(<25) | 36.1 |
| 84 | 3875 | Mesita redonda de 2 niveles de madera prensada (efecto  | propio | 2 | 2 | 6/3 (+4 por subir) | 387 | largo(>65) | 35.9 |
| 85 | 3128 | Paraguas doble capa con diseño resistente al viento | bajo ped. | 4 | 1 | 8/7 (+3 por subir) | 386 | — | 35.6 |
| 86 | 466 | Juego de cortina tapa sol Royale con diseño | propio | 6 | 1 | 1/0 | 233 | — | 35.5 |
| 87 | 5677 | Edredón con juego de sabana (king) | propio | 0 | 2 | 1/0 | 570 | — | 35.2 |
| 88 | 5525 | Proyector de estrellas | propio | 0 | 1 | 1/0 (+5 por subir) | 1586 | corto(<25) | 35.2 |
| 89 | 5122 | Notas Adhesivas 3''x 3'' 4 colores x 100 Hojas · paquet | bajo ped. | 0 | 1 | 1/0 | 71 | — | 35.2 |
| 90 | 4978 | Cocina de gas Arox CG-05 de 2 hornillas | bajo ped. | 0 | 1 | 1/0 | 104 | — | 35.2 |
| 91 | 4647 | Infinity 6 kW con 15 kWh de respaldo | bajo ped. | 0 | 1 | 1/0 | 33 | — | 35.2 |
| 92 | 2513 | Panel Solar Bifacial SKYMAX 620W N-TOPCon | propio | 0 | 2 | 1/0 | 566 | — | 35.2 |
| 93 | 3702 | Topper de espuma con gel refrescante 4 cm (Full) | propio | 13 | 0 | 3/3 | 809 | — | 35 |
| 94 | 406 | Forro para 6 sillas + mesa rectangular | propio | 0 | 0 | 3/0 | 139 | — | 35 |
| 95 | 3848 | Sobrecama tiwn | propio | 1 | 1 | 5/3 | 0 | corto(<25) | 34.9 |
| 96 | 2573 | Set para baño 3 piezas, alfombra cesta y cortina | propio | 1 | 0 | 1/0 (+5 por subir) | 455 | — | 34.7 |
| 97 | 4445 | Cocina Milexus de gas 6 quemadores | bajo ped. | 0 | 0.8 | 1/0 | 208 | — | 34.6 |
| 98 | 4443 | Cocina Milexus de gas 5 quemadores | bajo ped. | 0 | 0.8 | 1/0 | 66 | — | 34.6 |
| 99 | 3720 | Almohada de espuma viscoelástica Ceasar Palace 40 × 65  | propio | 9 | 0.5 | 10/8 (+1 por subir) | 799 | — | 34.2 |
| 100 | 2583 | Toalla Cisne Blanco 70x140 cm (rosada) | propio | 0 | 0 | 1/0 | 316 | — | 34 |

81 de los 100 son productos propios. 35 de los 100 ya tienen fotos reales en la biblioteca esperando a subirse.
