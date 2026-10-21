# SeFué (www.sefue.app) — catálogo en seco, 2026-10-21

> Generado por `extraer.mjs`. **Nada publicado, nada escrito en la bolsa ni en la web.** Precio = `myPrice()` y comisión = `gestoraShare()` de `vivabot/src/market-price.js` (los mismos del bot).

## Lo básico

- **Plataforma:** Odoo (tienda «Catálogo Virtual», dominio real `fue.odoo.com`). Sin API pública abierta; se lee el HTML de la tienda (y su JSON-LD en cada ficha).
- **robots.txt:** **«Disallow: /» — piden que NO entren robots.** Este script hace pocas peticiones y despacio; el volcado completo, solo con su permiso.
- **Moneda:** «$ delante» = **USD** (monedas configuradas: USD ($ delante), CUP ($ detrás)). Las fichas confirman `priceCurrency: USD`.
- **Productos:** 158 (únicos por id de Odoo) · **categorías:** 12.
- **Precio del proveedor:** 0.35–4800 USD · **nuestro precio:** 6–5280 USD · **comisión gestora:** 2–192 USD.
- **Fichas abiertas (descripción y todas las fotos):** 10 de 158 (muestra). El resto solo tiene nombre, precio y foto del listado.
- **Existencias:** su web **no publica stock** (no sale «quedan X» ni «agotado»). Hay que confirmarlo en cada venta.

## Por categoría (la suya → nuestro departamento)

| Categoría SeFué | Productos | Costo USD | Nuestro precio USD | Departamento web |
|---|---|---|---|---|
| Material de Oficina y Útiles Escolares | 73 | 0.35–14 | 6–20 | revisar |
| Aseo y Limpieza | 19 | 0.38–30 | 6–42 | revisar |
| Humidores | 16 | 2.35–4800 | 8–5280 | revisar |
| Productos de Refrigeración y Clima | 12 | 10–400 | 15–440 | ferreteria |
| Ofertas | 9 | 8–170 | 13–190 | revisar |
| Insecticidas | 6 | 2–130 | 7–150 | revisar |
| Hogar y Muebles | 6 | 125–360 | 145–400 | sala-y-muebles |
| Bicicletas y accesorios | 6 | 3.3–180 | 9–200 | movilidad |
| Ferretería | 5 | 8–40 | 13–56 | ferreteria |
| Cables | 3 | 1.8–4.4 | 7–10 | ferreteria |
| Pintura | 1 | 45–45 | 62–62 | ferreteria |
| (sin categoría) | 1 | 9–9 | 14–14 | revisar |
| Electrodomésticos | 1 | 300–300 | 320–320 | electrodomesticos |

«Ofertas» (9) son sus *combos* (paquetes de varios productos); solo están en esa categoría.

## Ejemplos (costo → nuestro precio → gana la gestora)

| # | Producto | Costo | Precio CV | Gestora | Casa Viva |
|---|---|---|---|---|---|
| 44 | Pegamento Multiusos Pégalo Todo 3g | 0,35 | 6 | 2,26 | 3,39 |
| 51 | Papel sanitario 3 capas | 0,38 | 6 | 2,25 | 3,37 |
| 81 | Bisagra de arco dorada , r7 | 2,35 | 8 | 2,26 | 3,39 |
| 149 | Insecticida para mosquitos y cucarachas, 250 ml | 5,55 | 11 | 2,18 | 3,27 |
| 3 | Limpiador Alcalino Espumante Nu-Brite, Nu-Calgon (3.8L) | 30 | 42 | 4,8 | 7,2 |
| 153 | Humidor,capacidad para 1200 tabacos, modelo L5 | 4200 | 4620 | 168 | 252 |
| 154 | Humidor,capacidad para 1500 tabacos, modelo L6 | 4800 | 5280 | 192 | 288 |

## Faltas y avisos

- **Sin precio:** 0
- **Sin foto:** 0
- **Por caja/lote** (confirmar si venden por unidad): #13, #19, #20, #21, #22, #26, #27, #28, #29, #45, #90, #91, #92, #93, #94, #95, #96, #97, #98
- **Nombre repetido en su tienda:** #30, #32
- **Cinta / precio tachado en su web:** —
- **Fotos que parecen de IA** (en la muestra): #11, #14
- **Muy baratos (costo < 5 USD):** 76 — con la regla (+5 USD mínimo) salen a 2–17 veces su costo. Propuesta: no publicarlos sueltos (o en packs).
- **Precio por metro / compra mínima** (en la muestra): #77, #136, #137
- **Departamento sin equivalente claro («revisar»):** 124 productos (aseo y limpieza, insecticidas, oficina, humidores).

## Parecidos con lo que ya vendemos (casaviva.company, lectura con wp-cli)

- #35 Organizador de Documentos de Dos Niveles Plástico → web 2485 (private) «Organizador de 2 niveles»

Peticiones a su web en esta pasada: 0 (el resto salió de la copia local).
