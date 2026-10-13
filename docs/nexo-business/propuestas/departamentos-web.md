# Propuesta: la tienda por departamentos y una lista en texto por departamento

**Fecha:** 12-oct-2026, noche · **Lo pidió:** Cely Vega (gestora), por WhatsApp, 23:34–23:40
**Estado:** PROPUESTA. **No se cambió nada en la web.** Lo decide Lennys.
**Datos:** leídos de la web (casaviva.company) y de la nube NEXO el 12-oct a las 23:50, solo lectura.

---

## 1. En pocas palabras

- Cely dice que en la tienda los productos «salen regados»: «lo mismo sale una alfombra de baño que de cocina». En BizneCubano estaban por departamentos.
- También quiere un **resumen en texto por departamento** (como el de BizneCubano) para mandárselo a sus clientes y que le pidan varias cosas de un área.
- **Lo bueno:** los departamentos ya existen en la web (se copiaron de BizneCubano): Baño, Cocina, Habitación… El problema es **cómo se enseñan**, y que muchos productos están en 3 o 4 departamentos a la vez.
- **Propuesta:** 10 departamentos claros (más Navidad solo en temporada), cada producto en **uno** (dos como mucho), la página Tienda con los departamentos siempre a la vista, y un botón **«Copiar lista»** por departamento en el área de la gestora, con sus precios y su enlace.

---

## 2. Cómo está hoy

**La página Tienda (casaviva.company/tienda/):**
- Enseña **457 productos** de 16 en 16 (29 páginas), **por orden alfabético**, todos mezclados.
  - 207 son de la tienda.
  - 250 son «Bajo pedido» (del mercado de proveedores).
- En la primera página salen juntos «Absorbente para batidos» (bajo pedido), «Adaptador para tarjeta gráfica», «Aceite capilar», «Albornoz»…
- Las alfombras salen juntas por la letra A: de baño, de entrada, de sala… Las de cocina salen lejos, por la S («Set de 2 alfombras para cocina»). Por eso Cely las ve «regadas».
- Para ver un departamento hay que abrir **«Filtrar productos»** (está cerrado) y elegirlo en una lista. Casi nadie lo encuentra.
- La portada sí tiene «Comprar por habitación», pero con solo 6: Baño, Cocina, Electrodomésticos, Habitación, Organización, Sala y muebles.

**Las categorías de la web** (productos visibles de cada una):

| Categoría | Productos | Nota |
|---|---|---|
| Habitación | 79 | incluye 9 mochilas, alfombras de baño, espejos y muebles de oficina |
| Baño | 47 | incluye cortinas roller, puertas de corredera y azulejo |
| Cocina | 47 | incluye cortinas roller, puertas de corredera y un soporte de TV |
| Sala y muebles | 44 | casi todo repetido de otras categorías |
| Cuidado personal | 23 | |
| Organización | 18 | incluye fajas, cojines, manteles y flores |
| Accesorios | 8 | 4 mochilas (las otras 9 están en Habitación) |
| Ferretería | 5 | cables solares, válvulas y una rasuradora |
| Navidad | 5 | |
| Apagones y energía | 5 | |
| Electrodomésticos | 4 | |
| Movilidad | 3 | |
| Tecnología | 2 | |
| Bajo pedido | 250 | no tienen otro departamento |

- **56 productos** están en 2, 3 o 4 categorías a la vez. Ejemplo: las cortinas roller y las puertas de corredera salen en Baño, Cocina, Habitación y Sala.
- Hay **16 categorías viejas vacías**: Aires acondicionados, Celulares, Cocinas y hornos, Colchones, Energía, Energía solar, Licuadoras, Motos, Muebles, Otros, Refrigeradores, Servicios, Tabletas, Televisión digital, Televisores y Ventiladores. No salen en el filtro, pero estorban.

**Importante (decisión D37):** la categoría de cada producto de la tienda **se cambia en el panel de Lennys** (campo «Categoría» del producto, en la nube NEXO). Cuando Lennys guarda un producto en el panel, la web se queda con esa **única** categoría. Si solo se cambia en WordPress, el panel la pisa la próxima vez que se guarde el producto.
En la nube cada producto ya tiene una sola categoría: Habitación 124, Baño 67, Cocina 49, Cuidado personal 23, Organización 15, sin categoría 14, Accesorios 8, Sala y muebles 6…

---

## 3. Departamentos propuestos

Son 10, más Navidad solo en temporada. **Regla:** cada producto va en **un** departamento. Solo puede ir en dos si el cliente lo buscaría de verdad en los dos (un cesto de basura: Baño y Cocina; un ventilador recargable: Electrodomésticos y Energía).

| # | Departamento | Qué lleva | Sale de (hoy) |
|---|---|---|---|
| 1 | **Baño** | toallas, batas y albornoces, alfombras de baño, cortinas de baño y cortineros, cestos, estantes y organizadores de baño, espejos LED, asiento de inodoro | Baño (sin cortinas roller ni puertas) |
| 2 | **Cocina** | ollas, utensilios, cuchillos, ralladores, alfombras de cocina, doyles, manteles y forros de sillas, termos, grifo, cocina de gas | Cocina (sin roller, puertas ni soporte de TV) |
| 3 | **Dormitorio** (o seguir llamándolo Habitación) | colchones, sábanas, edredones, mantas, sobrecamas, fundas y protectores, corrales de bebé, cama plegable | Habitación (sin mochilas, alfombras de baño, espejos ni muebles de oficina) |
| 4 | **Sala y decoración** | alfombras grandes y de entrada, cojines, cortinas (roller, tapa sol) y cortineros decorativos, flores, macetas, búcaro, soportes de TV, muebles (sofás, escritorio, silla de oficina), lámparas | Sala y muebles + parte de Organización |
| 5 | **Hogar y organización** | zapateras, percheros, colgadores, organizadores, tendederos, tablas de planchar, carritos de mandado, carretón, puertas de corredera, azulejo, válvulas, bombas de agua | Organización + Ferretería + parte de Habitación |
| 6 | **Electrodomésticos** | ventiladores, licuadoras, batidoras, neveras, splits, ollas arroceras, calentadores | Electrodomésticos + unos 25 de Bajo pedido |
| 7 | **Energía y apagones** | faroles y lámparas solares, power banks, paneles, cables fotovoltaicos, estaciones de energía, inversores | Apagones y energía + cables de Ferretería + unos 34 de Bajo pedido |
| 8 | **Tecnología** | celulares, tablets, cables, cargadores, adaptadores, luces LED | Tecnología + unos 125 de Bajo pedido |
| 9 | **Cuidado personal** | cremas, kits de skincare, aceites, champú, fajas, rasuradoras, depiladora, masajeadores, pesa | Cuidado personal |
| 10 | **Mochilas, accesorios y viaje** | mochilas, riñoneras, bolsos, paraguas, brazalete para celular, relojes, gafas, capas y cascos de moto, compresor y sombrilla de auto, patines | Accesorios + Movilidad + las 9 mochilas de Habitación |
| — | **Navidad** (solo temporada) | árbol, bolas, colcha navideña, casitas | Navidad. Se quita en enero |

**«Bajo pedido» no es un departamento: es una etiqueta.** Cada producto bajo pedido va también en su departamento (un split en Electrodomésticos, un celular en Tecnología) y en su tarjeta sale «Bajo pedido: confirmamos en 1 hora». En la Tienda salen **primero los que hay en la tienda** y después los bajo pedido.

---

## 4. Productos mal puestos (lista para revisar)

Entre corchetes, el número del producto en la web.

1. **Alfombras de baño que también salen en Habitación y Sala:** alfombra peluche 40x60 [2375], alfombra peluche 50x80 arcos [2401], alfombra peluche lisa 50x80 crema [2377], alfombra rombo 40x60 [2403]. → Solo **Baño**.
2. **Alfombra con piecitos [2371]:** en Baño, Cocina y Sala a la vez. Es la que «sale en baño y en cocina». → Solo **Baño** (así estaba en BizneCubano).
3. **9 mochilas en Habitación:** Bolsita [2753], M-15 [2755], M-3 [2757], M-5 [2759], M-10 [2766], M-14 [2768], M-2 [2770], M-4 [2772], M-6 [2774]. Las otras 4 están en Accesorios. → **Mochilas y accesorios**.
4. **Cortinas roller enrollables** [2431, 2433, 2451, 2453] y **puertas de corredera** [2525, 2555]: en 4 departamentos. Hoy salen en la lista de Baño. → Cortinas a **Sala y decoración**; puertas a **Hogar y organización**.
5. **Azulejo INCEFRA [260]:** en 4 departamentos. → **Hogar y organización** (o Baño, como en BizneCubano: lo decide Lennys).
6. **Espejos LED** [2443, 2459]: en Baño, Habitación y Sala. → **Baño**.
7. **Albornoces** [2363, 2365, 2391]: en Baño y Habitación. → **Baño**.
8. **Soporte de TV 40"x80" [2595]:** está en Cocina. → **Sala y decoración**.
9. **Faja reductora [727]** y **brazalete deportivo para celular [553]:** están en Organización. → Faja a Cuidado personal; brazalete a Mochilas y accesorios.
10. **Cojines decorativos** [117, 692]: están en Organización. → **Sala y decoración**.
11. **Rasuradora portátil recargable [299]:** está en Ferretería. → Solo **Cuidado personal**.
12. **Cables fotovoltaicos** [2385, 2405]: están en Ferretería. → **Energía y apagones**.
13. **Manteles** [178, 514] y **forro para 6 sillas [406]:** en Cocina, Organización y Sala. → **Cocina**.
14. **Búcaro [278], maceta con suculenta [119], ramo de girasoles [534]:** en Organización. → **Sala y decoración**.
15. **Escritorio [2729] y silla de oficina [2593]:** en Habitación. → **Sala y decoración** (muebles).
16. **Ventiladores recargables F6** [2585, 2587, 2601]: solo en Electrodomésticos. → Añadir **Energía y apagones** (es lo que buscan para los apagones).

---

## 5. Los 250 «Bajo pedido»

- Los publica el bot (mercado de proveedores) con **una sola categoría, «Bajo pedido»**. Por eso salen mezclados con todo y sin departamento.
- **Ojo:** cada vez que el bot vuelve a publicar un artículo, el Core le pone otra vez solo «Bajo pedido» (`CVD_Market_Bridge`). Para que tengan departamento hay que cambiar eso: que guarde «Bajo pedido» **más** su departamento.
- Reparto aproximado por el nombre (contado con una regla sencilla, hay que revisarlo): Tecnología ~125, Energía y apagones ~34, Electrodomésticos ~25, lámparas ~15 (Sala y decoración), mochilas, relojes, patines, cascos y juguetes ~30 (Mochilas y accesorios), otros ~20 (sofás, bombas de agua, suplementos…).

---

## 6. La lista en texto por departamento (lo que pidió Cely a las 23:40)

Ella quiere mandar a sus clientes un mensaje como el de BizneCubano:
«*Baño* - albornoz - alfombra antirresbalante - alfombra con piecitos - …», para que le pidan varias cosas de un área.

**Ya existe casi todo:** en el área de la gestora, **«Fotos para publicar»** enseña lo que hay en existencia **por departamento**, con **el precio de ella** (si lo subió), el CUP de hoy y **su enlace con su código**. Solo falta el botón que junte todo en un texto.

| Opción | Cómo sería | Trabajo |
|---|---|---|
| **1. Botón «Copiar lista»** en cada departamento de «Fotos para publicar» (**recomendada**) | La gestora abre Baño, toca «Copiar lista» y la pega en WhatsApp. Lleva sus precios, el CUP del día y su enlace a ese departamento. | ~2 h + prueba con Dany |
| 2. Página pública por departamento con «Copiar lista» | Cualquiera la abre en casaviva.company. Con `?ref=` lleva el enlace de la gestora. Sirve también para clientes. | ~3–4 h |
| 3. Pedírsela al bot («LISTA BAÑO») | El bot le manda la lista por WhatsApp. | Más adelante. Hay que tocar VivaBot. Antes hay que arreglar el fallo de esta noche: el bot tomó la lista de ejemplo de Cely como si fuera un pedido. |

**Mejora opcional después:** juntar en una línea los productos parecidos, como hacía BizneCubano («alfombra peluche 40x60 y 50x80», «cestos de 12 y 70 L»). Al principio, mejor una línea por producto: así no hay errores.

El enlace de departamento con código ya funciona hoy: `casaviva.company/categoria-producto/bano/?ref=CÓDIGO`. La web guarda el código en cualquier página.

---

## 7. Ejemplo real: Baño, como sale hoy

Son los 45 productos de Baño que hay **en existencia**, con el precio normal de la web y el CUP con la tasa de hoy (**785**, puesta el 12-oct a las 07:53).
Con el botón de la opción 1, cada gestora vería **sus** precios y **su** código.

```
*Baño* — Casa Viva
- Albornoz (talla L) azul — 38 USD (29.830 CUP)
- Albornoz (talla L) beige — 38 USD (29.830 CUP)
- Albornoz (talla L) beige oscuro — 38 USD (29.830 CUP)
- Alfombra antirresbalante — 11 USD (8.635 CUP)
- Alfombra con piecitos — 14 USD (10.990 CUP)
- Alfombra de chenilla — 10 USD (7.850 CUP)
- Alfombra peluche 40x60 cm — 8 USD (6.280 CUP)
- Alfombra peluche 50×80 cm — diseño arcos — 10 USD (7.850 CUP)
- Alfombra peluche lisa 50×80 cm — crema — 10 USD (7.850 CUP)
- Alfombra rombo 40x60 cm — 8 USD (6.280 CUP)
- Azulejo INCEFRA — 35 USD (27.475 CUP)
- Bata de baño — 20 USD (15.700 CUP)
- Cesto de 12L — Diseño 1 — 7 USD (5.495 CUP)
- Cesto de 12L — Diseño 2 — 7 USD (5.495 CUP)
- Cesto de 12L — Diseño 3 — 7 USD (5.495 CUP)
- Cesto de pedal negro (15 litros) — 19 USD (14.915 CUP)
- Cesto de pedal negro (7 litros) — 12 USD (9.420 CUP)
- Cortina de baño 180x180 cm — 8 USD (6.280 CUP)
- Cortina de baño diseño de conchas — 8 USD (6.280 CUP)
- Cortina de baño diseño de cuadros — 8 USD (6.280 CUP)
- Cortina de baño diseño de flores — 8 USD (6.280 CUP)
- Cortina de baño flores amarillas y rosa — 8 USD (6.280 CUP)
- Cortina roller enrollable 100X160 — 55 USD (43.175 CUP)
- Cortina roller enrollable 140X280 — 60 USD (47.100 CUP)
- Cortina roller enrollable 160X280 — 65 USD (51.025 CUP)
- Cortina roller enrollable 172X280 — 70 USD (54.950 CUP)
- Cortinero Expandible plateado — 7 USD (5.495 CUP)
- Espejo Led 50X70 CM — 55 USD (43.175 CUP)
- Espejo Led 60X80 CM — 60 USD (47.100 CUP)
- Estante esquinero para baño — 26 USD (20.410 CUP)
- Estante Organizador — 21 USD (16.485 CUP)
- Organizador de 2 niveles — 11 USD (8.635 CUP)
- Organizador de Baño blanco — 28 USD (21.980 CUP)
- Organizador de Baño negro — 28 USD (21.980 CUP)
- Puerta de corredera (blanca) — 60 USD (47.100 CUP)
- Puerta de corredera (gris) — 60 USD (47.100 CUP)
- Set de 2 alfombras para baño — 13 USD (10.205 CUP)
- Set de alfombras para baño (3 piezas) — 15 USD (11.775 CUP)
- Set de cortina de baño + alfombra — 16 USD (12.560 CUP)
- Set para baño 3 piezas, alfombra cesta y cortina — 28 USD (21.980 CUP)
- Toalla 100% algodón 70x130 cm — 18 USD (14.130 CUP)
- Toalla Cisne Blanco 70x140 cm (azul) — 18 USD (14.130 CUP)
- Toalla Cisne Blanco 70x140 cm (rosada) — 18 USD (14.130 CUP)
- Toallas Cisne Blanco 40x70 — 8 USD (6.280 CUP)
- Toallas pequeña — 10 USD (7.850 CUP)
Pídelo aquí y te lo llevamos: https://casaviva.company/categoria-producto/bano/?ref=TU-CÓDIGO
```

Con la limpieza del punto 4 saldrían de esta lista las 4 cortinas roller y las 2 puertas de corredera (y el azulejo, si Lennys lo pasa a Hogar). Quedarían unas 38 líneas, todas de baño.
El «Asiento de inodoro» no sale porque ahora está agotado.

---

## 8. Qué habría que cambiar y cuánto trabajo es

| Paso | Qué | Quién | Trabajo |
|---|---|---|---|
| 1 | Aprobar la lista de departamentos y los productos del punto 4 | Lennys | 15–30 min con esta hoja |
| 2 | Poner el departamento a cada producto de la tienda (~207) **en el panel** (nube) y pasarlo a la web. Con copia de seguridad, un script y la lista aprobada | Claude | ~2 h |
| 3 | Que los «Bajo pedido» guarden también su departamento (cambio en el Core) y repartir los 250 (lista para que la revise Ernesto) | Claude | ~2 h |
| 4 | Página Tienda por departamentos: botones de departamento siempre arriba (en el móvil se deslizan), «Todo» ordenado por departamento, primero lo de la tienda y después lo bajo pedido; portada con los 10 | Claude (Core) | ~3–4 h + prueba con Dany |
| 5 | Botón «Copiar lista» por departamento (opción 1 del punto 6) | Claude (Core) | ~2 h + prueba con Dany |
| 6 | Quitar las 16 categorías viejas vacías | Claude | 15 min (opcional) |

**Total:** algo más de un día de trabajo de Claude, repartido, y media hora de Lennys.
**Orden recomendado:** 1 → 5 (Cely lo puede usar enseguida) → 2 → 4 → 3 → 6.

---

## 9. Lo que tiene que decidir Lennys

1. ¿Le valen los 10 departamentos? ¿Se cambian los nombres («Dormitorio», «Sala y decoración») o se dejan los de BizneCubano («Habitación», «Sala y muebles»), que las gestoras ya conocen?
2. ¿Dónde van las cortinas roller, las puertas de corredera y el azulejo?
3. ¿Un producto puede estar en dos departamentos? (La propuesta es: como mucho dos.)
4. ¿Los «Bajo pedido» se mezclan en cada departamento con su etiqueta, o van aparte?
5. Para la lista en texto: ¿opción 1 (botón en «Fotos para publicar»), la 2, o las dos?

---

### Cómo se sacaron estos datos (para otro agente)

Todo en **solo lectura**, el 12-oct a las 23:50:
- En Hostinger: `wp term list product_cat` y un `wp eval-file` que solo lee productos (nombre, precio, categorías, existencia). Los scripts estaban en `~/tmp-lint-3.13.68` y se borraron al terminar.
- `curl` a `/tienda/` y a la portada.
- En la nube: `select category, count(*) from nexo_business.catalog_products group by 1`.
- Se cuentan los productos publicados y visibles. Los 155 productos «privados» no salen en la tienda y no se cuentan.
