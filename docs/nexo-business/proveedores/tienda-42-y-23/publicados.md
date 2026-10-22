# Tienda 42 y 23 — publicados en casaviva.company (20-oct-2026)

Ernesto (20-oct): «usa el precio de la pegatina y súmale lo que nosotros ganamos en Casa Viva por cada uno de sus productos. Y ya ponlos publicados en la web».

- **23 productos web publicados** (20 nuevos + 3 que ya estaban en privado: 1015, 1019, 1146). Los dos paneles (#22 18 V y #23 36 V) son **un solo producto** (1146, variable, con las 2 versiones a 110 USD).
- **Precio** = regla del bot (`vivabot/src/market-price.js`, importada tal cual). **Gestora gana** = 40 % del margen (comisión fija, como MK-1192). **Costo** = etiqueta; donde había pegatina negra, la pegatina (#9 85, #24 55, #25 350, #26 427).
- Todos: «Bajo pedido» + departamento, SKU `MK-<id bolsa>`, sin control de stock, aviso corto de bajo pedido, `_cvd_cost` = costo (fuente «proveedor»). Sin nombre de la tienda, sin precio de etiqueta, sin costo en la página.
- **Bolsa** (`crm_market_items` 1779–1801): vendedor «TRD 42 y 23» (ficha 103, `sin-whatsapp:trd-42-y-23`) → el bajo pedido le pregunta a Ernesto (recoge y paga él). Estado «publicado» + `published_url`. Foto en Storage `mercado/<negocio>/<id>/limpia-1.jpg`.
- **No publicados:** #1 split Parker (sin precio; el 1013 sigue privado, sin tocar) · #11 cocina Arox CG-05: publicada el 22-oct (4978, MK-1890) con foto provisional hecha con sharp de la foto real (`arox-foto-2026-10-22/`); falta una foto buena.
- **1028** (cocina Royal REG202V, privado): no se tocó. La foto de la web está rota y en la nuestra no se ve el modelo → se creó la #10 aparte (4858).
- **Fotos «revisar»:** bombas Thebe e Hyundai = fieles a la caja (se usan). Cocina Royal 2 hornillas: la IA inventó «JAYCE» encima del logo (era el reflejo de la caja) → se tapó con sharp; queda solo «ROYAL» (`fotos-pro/10b-…-logo-corregido.jpg`).
- **No se mandó nada a WhatsApp.** El selector diario de novedades los cogerá solo (estado «publicado»).

| # | Producto | Web id | SKU | URL | Costo USD | Precio USD | Gestora gana USD |
|---|---|---|---|---|---|---|---|
| 2 | Motobomba periférica Thebe TP-70 Junior | 4843 | MK-1779 | https://casaviva.company/producto/motobomba-periferica-thebe-tp-70-junior/ | 66.35 | 85 | 7.46 |
| 3 | Bomba de agua periférica Hyundai 1/2 HP (370 W) | 4845 | MK-1780 | https://casaviva.company/producto/bomba-de-agua-periferica-hyundai-1-2-hp-370-w/ | 51 | 68 | 6.80 |
| 4 | Batidora Hamilton Beach blanca de 5 botones | 1015 (ya existía, privado → publicado) | MK-1781 | https://casaviva.company/producto/licuadora-hamilton-beach-blanca-de-5-velocidades/ | 39.80 | 56 | 6.48 |
| 5 | Batidora Hamilton Beach negra con jarra de vidrio | 4848 | MK-1782 | https://casaviva.company/producto/batidora-hamilton-beach-negra-con-jarra-de-vidrio/ | 44.20 | 62 | 7.12 |
| 6 | Batidora Kenwood gris | 4850 | MK-1783 | https://casaviva.company/producto/batidora-kenwood-gris/ | 36 | 51 | 6 |
| 7 | Batidora Philco blanca con jarra de 1,5 L | 4852 | MK-1784 | https://casaviva.company/producto/batidora-philco-blanca-con-jarra-de-15-l/ | 29.80 | 42 | 4.88 |
| 8 | Batidora Continental blanca | 4854 | MK-1785 | https://casaviva.company/producto/batidora-continental-blanca/ | 23.70 | 34 | 4.12 |
| 9 | Cocina de gas Royal REG404BK de 4 hornillas | 4856 | MK-1786 | https://casaviva.company/producto/cocina-de-gas-royal-reg404bk-de-4-hornillas/ | 85 | 105 | 8 |
| 10 | Cocina de gas Royal de 2 hornillas con tope de vidrio | 4858 | MK-1787 | https://casaviva.company/producto/cocina-de-gas-royal-de-2-hornillas-con-tope-de-vidrio/ | 43 | 60 | 6.80 |
| 11 | Cocina de gas Arox CG-05 de 2 hornillas (22-oct, foto provisional) | 4978 | MK-1890 | https://casaviva.company/producto/cocina-de-gas-arox-cg-05-de-2-hornillas/ | 53.95 | 71 | 6.82 |
| 12 | Olla arrocera Kenwood gris con vaporera | 4860 | MK-1788 | https://casaviva.company/producto/olla-arrocera-kenwood-gris-con-vaporera/ | 27.35 | 39 | 4.66 |
| 13 | Olla arrocera Kenwood blanca con vaporera | 4862 | MK-1789 | https://casaviva.company/producto/olla-arrocera-kenwood-blanca-con-vaporera/ | 23.90 | 34 | 4.04 |
| 14 | Olla arrocera Continental blanca | 4864 | MK-1790 | https://casaviva.company/producto/olla-arrocera-continental-blanca/ | 22.30 | 32 | 3.88 |
| 15 | Olla arrocera Philco blanca | 4866 | MK-1791 | https://casaviva.company/producto/olla-arrocera-philco-blanca/ | 33.35 | 47 | 5.46 |
| 16 | Olla arrocera Hamilton Beach negra | 4868 | MK-1792 | https://casaviva.company/producto/olla-arrocera-hamilton-beach-negra/ | 47.10 | 65 | 7.16 |
| 17 | Olla arrocera Hamilton Beach roja | 4870 | MK-1793 | https://casaviva.company/producto/olla-arrocera-hamilton-beach-roja/ | 43.10 | 61 | 7.16 |
| 18 | Olla de presión eléctrica RCA | 4872 | MK-1794 | https://casaviva.company/producto/olla-de-presion-electrica-rca/ | 72.10 | 90 | 7.16 |
| 19 | Olla de presión eléctrica Philco | 4874 | MK-1795 | https://casaviva.company/producto/olla-de-presion-electrica-philco/ | 68.75 | 90 | 8.50 |
| 20 | Olla de presión eléctrica GWELL roja | 4876 | MK-1796 | https://casaviva.company/producto/olla-de-presion-electrica-gwell-roja/ | 46.25 | 64 | 7.10 |
| 21 | Olla de presión eléctrica Ariete digital | 4878 | MK-1797 | https://casaviva.company/producto/olla-de-presion-electrica-ariete-digital/ | 45 | 62 | 6.80 |
| 22 + 23 | Panel solar plegable 120 W (18 V o 36 V) | 1146 (ya existía, privado → publicado) | MK-1798 | https://casaviva.company/producto/panel-solar-portatil-plegable-120w-18v-36v/ | 93 | 110 | 6.80 |
| 24 | Ventilador recargable Royal RA12RSL de 12" con panel solar y 2 bombillos | 1019 (ya existía, privado → publicado) | MK-1799 | https://casaviva.company/producto/ventilador-recargable-royal-ra12rsl-12-con-panel-solar-y-2-bombillos/ | 55 | 72 | 6.80 |
| 25 | Estación de energía GWELL 600 W / 672 Wh | 4882 | MK-1800 | https://casaviva.company/producto/estacion-de-energia-gwell-600-w-672-wh/ | 350 | 385 | 14 |
| 26 | Estación de energía GWELL con 3 tomas de 110 V | 4884 | MK-1801 | https://casaviva.company/producto/estacion-de-energia-gwell-con-3-tomas-de-110-v/ | 427 | 470 | 17.20 |

## Copias de seguridad y cómo deshacer
- Web: `~/bak-20261020-42y23-creados.json` (lo hecho) y `~/bak-20261020-42y23-antes.json` (estado anterior completo de 1015, 1019 y 1146: nombre, SKU, precios, categorías, fotos, textos, metas, variaciones). Copia de los dos en esta carpeta.
- Deshacer un nuevo: `wp post delete <id>` (SIN --force = papelera). Deshacer 1015/1019/1146: restaurar desde `bak-…-antes.json` (y volver a ponerlos en privado).
- Bolsa: `bak-bolsa-creados.json` y `bolsa-ids.json` (n → id). Retirar: *AGOTADO n* en «Tú» (o status «agotado»).
- Cambios a mano además del script: slug de 1019 → `ventilador-recargable-royal-ra12rsl-12-con-panel-solar-y-2-bombillos` (antes `…-ra123sl-…`); quitado el aviso del plugin nexo-marketplace (`nexo_availability_confirmation`) en 1015, 1019 y 1146.

## Ojo
- A los 21 días sin «anuncio» el bot avisa a Ernesto de que los publicados podrían estar agotados (`markStale`): esta tienda no anuncia, así que hará falta pasar por la tienda o refrescar `last_seen`.
- Si al recoger cobran el precio de la etiqueta y no el de la pegatina (#9, #24, #25), hay que subir el precio: *PRECIO n* con el nuevo costo.
- `nexo_product_knowledge` aún guarda SKU antiguos (NEXO-RA123SL para 1019): no lo usa el bot.

## Archivos
`armar-publicar.mjs` (productos.json → publicar.json) · `bolsa-crear.mjs` (VPS: bolsa + marcar publicado) · `crear-productos.php` (web: crear/actualizar) · `publicar.json` · `fuera.txt`. En el VPS: `/root/archivos/42y23-2026-10-20/`; en la web: `~/42y23-2026-10-20/` y fotos en `~/42y23-fotos/`.
