# Simulación del motor de precios — Casa Viva, 2026-10-11 (fotos de datos del 2026-10-12 02:52 UTC)

**Solo simulación: no se cambió ningún precio, comisión ni dato.** Reglas: `packages/business-domain/src/pricing/config/casa-viva.v1.json` (versión 1.0.0-borrador, borrador). Motor 1.0.0.

## Resumen para Lennys

| | Cuántos |
|---|---|
| Productos con costo apuntado (nube) | 152 (149 activos) |
| Con la regla, el precio **sube** | 112 |
| Con la regla, el precio **baja** | 24 |
| Se queda igual | 13 |
| La comisión de hoy cambia con la regla de Lennys (al precio de hoy) | 72 (sube en 27, baja en 45) |
| **Pierden dinero** (precio − compra − comisión < 0, la misma cuenta que la lista enviada) | **20** |
| Pierden dinero contando también gastos fijos (1,58 USD/unidad) e imprevistos | 28 |
| Se venden por debajo de lo que costó comprarlos | 19 |
| La tienda gana menos de 2,5 USD (y no pierde) | 58 |
| ¿Costo del paquete en vez de la unidad? | 18 |
| ¿Costo en CUP apuntado como USD? | 1 |
| **Costo probablemente cruzado con otra fila del Excel** | **14 productos** (18 contando colores) + 2 por revisar |

- Tasa del CUP: la web usa **780** y la nube **775**. Tiene que quedar una sola (la de la web).
- Precio web distinto del de la nube: 0 productos. Comisión web distinta de la nube: 45.
- Hoy la tienda gana de mediana **2,11 USD** por unidad (11,47 %), y la gestora **2 USD**.
- Con la regla (precio sugerido): tienda **3,47 USD** (16,92 %), gestora **2 USD**.

**Ojo:** muchos de los que pierden dinero tienen el costo cruzado con otra fila del Excel de octubre (ver `posibles-costos-cruzados.md`). Primero hay que corregir esos costos; después la simulación cambia.

## Las reglas que se simularon (borrador, Lennys decide)

- Costo total = compra + flete + gastos fijos (1,58 USD por unidad: 407.408,5 CUP al mes ÷ 780 ÷ 330 unidades), + 1 % de imprevistos.
- Gastos variables: 2.5 % del precio (otros cargos 2 % + dependienta 0,5 %).
- Precio sugerido: el menor precio en dólares enteros que deja a la tienda un **15 % limpio** (consignación: 10 %). Nunca por debajo del 5 %.
- Comisión de la gestora: **10 % del precio, hacia arriba al dólar**; sube hasta el 12 % si la tienda sigue ganando al menos lo mismo que la gestora. Si la tienda gana menos de **2.5 USD**, la comisión baja (nunca de 1 USD).
- El recargo propio de la gestora va aparte (suma), como hoy en la web.

**Si el margen limpio objetivo fuera otro** (con los costos de hoy, incluidos los cruzados):

| Margen limpio objetivo | Suben | Bajan | Igual |
|---|---|---|---|
| 8 % | 70 | 61 | 18 |
| 10 % | 82 | 47 | 20 |
| 12 % | 93 | 45 | 11 |
| 15 % (el simulado) | 112 | 24 | 13 |
| 18 % | 127 | 17 | 5 |

## Los 20 que pierden dinero

Son **11 productos distintos** (cada color cuenta como un renglón). En 9 renglones el costo parece cruzado con otra fila del Excel.

| Producto | Compra | Precio hoy | Comisión | Queda | Qué parece | Costo del Excel que podría ser |
|---|---|---|---|---|---|---|
| Toallas pequeña | 140 | 10 | 5 | **-135** | costo cruzado con otra fila | — |
| Alfombra antirresbalante — azul | 40 | 11 | 5 | **-34** | costo cruzado con otra fila | 7 |
| Alfombra peluche 40×60 cm — beige | 35 | 8 | 5 | **-32** | costo cruzado con otra fila | 5 |
| Bata de baño — verde | 30 | 20 | 2 | **-12** | ¿costo del paquete? | 13,2 |
| Bata de baño — azul | 30 | 20 | 2 | **-12** | ¿costo del paquete? | 13,2 |
| Bata de baño — negro | 30 | 20 | 2 | **-12** | ¿costo del paquete? | 13,2 |
| Bata de baño — gris | 30 | 20 | 2 | **-12** | ¿costo del paquete? | 13,2 |
| Bata de baño — arena | 30 | 20 | 2 | **-12** | ¿costo del paquete? | 13,2 |
| Set de 2 alfombras para baño — rojo | 20 | 13 | 3 | **-10** | costo cruzado con otra fila | 8 |
| Rasuradora portatil recargable | 19,5 | 14 | 3 | **-8,5** | costo cruzado con otra fila | 8 |
| Cesto de basura encimera | 10 | 6 | 1 | **-5** | costo cruzado con otra fila | 3,5 |
| Cortina de baño 180×180 cm — rojo | 10 | 8 | 2 | **-4** | costo cruzado con otra fila | 4,1 |
| Toallas Cisne Blanco 40×70 — verde | 10 | 8 | 2 | **-4** | ¿costo del paquete? | — |
| Toallas Cisne Blanco 40×70 — azul | 10 | 8 | 2 | **-4** | ¿costo del paquete? | — |
| Toallas Cisne Blanco 40×70 — rosado | 10 | 8 | 2 | **-4** | ¿costo del paquete? | — |
| Toallas Cisne Blanco 40×70 — blanco | 10 | 8 | 2 | **-4** | ¿costo del paquete? | — |
| Toallas Cisne Blanco 40×70 — gris-oscuro | 10 | 8 | 2 | **-4** | ¿costo del paquete? | — |
| Toallas Cisne Blanco 40×70 — beige-oscuro | 10 | 8 | 2 | **-4** | ¿costo del paquete? | — |
| Alfombra de entrada 40×60 cm — verde | 10 | 8 | 1 | **-3** | costo cruzado con otra fila | 5 |
| Luminoliss | 12 | 12 | 2 | **-2** | costo cruzado con otra fila | 5 |

## Los 20 que más conviene revisar (sin contar los de arriba)

| Producto | Compra | Precio hoy | Sugerido | Comisión hoy → regla | Tienda gana hoy → sugerido | Avisos |
|---|---|---|---|---|---|---|
| Árbol de navidad (1,50 m) | 3,85 | 40 | **8** | 4 → 1 | 29,51 → 1,31 | costo muy bajo (¿seguro?), comisión web ≠ nube, ¿costo cruzado? |
| Silla de oficina (23_222) | 65 | 75 | **97** | 5 → 12 | 0,88 → 15,33 | tienda gana menos de 2,5, bajo el suelo |
| Ventilador recargable F6 (naranja) | 60 | 70 | **89** | 4 → 11 | 2,05 → 13,58 | tienda gana menos de 2,5, bajo el suelo |
| Corral cuna de bebé — Diseño 2 | 130 | 170 | **190** | 10 → 23 | 22,85 → 29,35 | — |
| Mochila M- 1 | 10,2 | 13 | **17** | 1 → 2 | -0,23 → 2,67 | pierde después de la comisión, bajo el suelo, comisión web ≠ nube, costo cruzado |
| Set de utensilios para cocina (5 piezas) | 6 | 8 | **12** | 2 → 1 | -1,86 → 3,04 | pierde después de la comisión, bajo el suelo, comisión web ≠ nube, costo cruzado |
| Lámparas recargables con panel solar | 10 | 25 | **17** | 3 → 2 | 9,68 → 2,88 | comisión web ≠ nube, costo cruzado |
| Cojín decorativo (5 colores) | 5,63 | 11 | **12** | 1,1 → 1 | 2,34 → 3,42 | tienda gana menos de 2,5, comisión web ≠ nube, costo cruzado |
| Utensilios de silicona con cuchillos — rosado | 26 | 30 | **40** | 1 → 5 | 0,39 → 6,14 | tienda gana menos de 2,5, bajo el suelo |
| Masajeador corporal | 45 | 56 | **68** | 2 → 9 | 5,55 → 10,25 | — |
| Protector de colchón king | 30 | 38 | **45** | 3 → 5 | 2,15 → 6,98 | tienda gana menos de 2,5 |
| Corral de bebé 11494 | 80 | 110 | **121** | 8 → 15 | 16,85 → 20,58 | — |
| Colcha navideña 180×220 (2 colores) | 15 | 18 | **24** | 2 → 3 | -1,2 → 3,65 | pierde después de la comisión, bajo el suelo, comisión web ≠ nube |
| Zapatera 5 niveles | 23 | 35 | **35** | 4 → 4 | 5,3 → 5,3 | costo cruzado |
| Colchón de resorte 180x200cm Dawang | 214 | 320 | **310** | 20 → 38 | 74,26 → 46,51 | — |
| Pesa electrónica corporal | 16,67 | 35 | **26** | 5 → 3 | 10,69 → 3,91 | — |
| Sobrecama lisa full — gris | 28 | 36 | **44** | 2 → 6 | 3,22 → 7,02 | — |
| Balsamo facial de miel hidratante | 6 | 9 | **12** | 1 → 1 | 0,12 → 3,04 | tienda gana menos de 2,5, bajo el suelo |
| Alfombra con piecitos (5 colores) | 10 | 14 | **17** | 1 → 2 | 0,95 → 2,88 | tienda gana menos de 2,5 |
| Doyle Metalizado 45×30 cm — rosado | 9 | 13 | **16** | 1 → 2 | 0,99 → 2,91 | tienda gana menos de 2,5 |

## Aire split Parker (producto 1013), perfil «NEXO bajo pedido» (D43)

- Proveedor 351 USD, precio web 380 USD, comisión en la web **fija de 10 USD**.
- Hoy, con la comisión fija: NEXO se queda **19 USD antes del transporte**. El mínimo para NEXO es 10 USD: **si el transporte pasa de 9 USD, se rompe el mínimo**; si pasa de 19 USD, NEXO pierde.
- Con D43 (40 % del margen para la gestora, sin transporte): gestora 11,6 USD / NEXO 17,4 USD. Con D43 el mínimo se rompe si el transporte pasa de 12,33 USD.
- Precio sugerido por D43 (proveedor + el mayor de 30 USD y el 9 %): **385 USD** sin transporte (suelo 370). Cada dólar de transporte se suma encima.
- Ojo: si la gestora pone su propio recargo en la web, Core le paga **comisión + recargo** (suma). D43 dice que el recargo **cuenta dentro** de su 40 %. En la web hoy no se cumple D43 para este producto.

## Cómo se hizo (para repetirlo)

1. Fotos de solo lectura en `datos/`: nube (`SELECT` a `nexo_business`), web (`scripts/precios/leer-web.php` con `wp eval-file -`) y el Excel ya importado (`docs/nexo-business/import/excel-costs-2026-10.json`).
2. `node scripts/precios/simular-precios.mjs docs/nexo-business/simulacion-precios/2026-10-11`
3. Archivos: `simulacion-precios.csv` (un renglón por producto, se abre en Excel), `posibles-costos-cruzados.csv/.md`, este informe y `mensaje-para-lennys.md`.
4. Comisión «hoy» = la que paga la web (`_cvd_commission_type/value` del producto o del padre; si no tiene, la general 10 %). Precio «hoy» = el de la web.
5. «Pierde dinero» usa la misma cuenta que la lista ya enviada a Lennys (precio de la nube − compra − flete − comisión de la nube o 10 %), para que los números coincidan.
