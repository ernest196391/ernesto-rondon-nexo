# Electrodomésticos y energía de Sergio y LJH — lista para confirmar y publicar (20-oct-2026)

> **Solo preparación.** No se ha escrito a nadie, no se ha creado nada en la web y no se ha cambiado ninguna base de datos.
> Datos leídos en vivo (solo lectura) de `crm_market_items` (Supabase `nexo-production`) y de la web (wp-cli) el 20-oct.

## Resumen
- **Anuncios leídos:** 1092 (Sergio 443, grupo de LJH 649). Cada proveedor repite su catálogo casi entero cada día, con títulos un poco distintos.
- **Productos distintos tras quitar repetidos:** 293 → **Sergio 112** y **LJH 181**.
- **Vigentes** (anunciados del 13 al 20-oct): Sergio 105, LJH 164. **Antiguos** (no los anuncian desde antes del 13-oct; pueden estar agotados): Sergio 7, LJH 17.
- **Los dos venden lo mismo:** 48 productos están en los dos grupos (casi siempre con 5–15 USD de diferencia: parecen comprar al mismo mayorista). Propuesta: en la web **un solo producto** (el más barato para el cliente; si uno ya está en la web, ese) y el otro queda de **respaldo** (el bajo pedido le pregunta al segundo proveedor a los 40 min si el primero no contesta). Así salen **245 productos distintos para la web** (223 vigentes), de ellos 3 ya publicados. Columna «Notas»: «publicar este» / «no publicar».
- **Sin foto:** 0 (ninguno).
- **Ya en la web:** Nevera Royal 5,5 pies (MK-205 → producto 2958); Split Milexus 1 tonelada 220 V (MK-131 → producto 2948); Ventilador recargable 20000 mAh (MK-172 → producto 2953). El resto no está.
- **Sin identificar (no se publican):** #128 «Artículo no identificado» 670 USD y #130 «Electrodoméstico (sin especificar)» 470 USD — el anuncio solo dice el precio.
- **Lo que Ernesto mencionó y NO está en estos grupos:** *motor de agua* y *ollas arroceras* (busqué en los 1092 artículos y en los ~2.750 mensajes de los dos grupos). En la web ya hay de Kevin (Digital Store): ollas arroceras 3033 (MK-1189) y 3031 (MK-1180); bombas de agua 3496 (MK-1138) y 3494 (MK-1096).
- **Un anuncio en CUP:** MK-29 Kit Must 3000 W + batería Must 5000 Wh (2510 CUP, del 7-oct): sin precio de Casa Viva; hay que preguntar el precio en USD.

## Reglas usadas
- **Quitar repetidos:** mismo proveedor + mismo producto (marca, modelo y capacidad, leídos en el texto original del anuncio, no en el título que puso la IA). Se queda el anuncio **más reciente** (su id = SKU `MK-<id>`); los demás ids van en la columna «ids».
- **Precio Casa Viva** = `my_price` que ya calculó el bot (regla D43/D45, `vivabot/src/market-price.js`): menos de 60 USD → +40 % (mín. 5, máx. 17 USD); de 60 a 300 → +17 USD; más de 300 → +10 %; redondeado hacia arriba a 5 USD. Comprobé que todos los `my_price` coinciden con la fórmula.
- **Comisión de la gestora** = **40 % de lo que gana Casa Viva** (precio Casa Viva − precio del proveedor), con 2 decimales. Es la misma cuenta del bot (`gestoraShare`) que tienen los MK- publicados: MK-1192 Paraguas = 14 − 8,20 = 5,80 × 40 % = **2,32 USD** (meta `_cvd_commission_type=fixed`, `_cvd_commission_value=2.32`). El 60 % restante es para Casa Viva/NEXO.
- **Si el proveedor da otro precio final:** se recalcula con la misma regla (precio y comisión) antes de crear el producto.
- **Fotos:** las del anuncio del proveedor, guardadas por el bot en Supabase Storage, cubo `mercado`, ruta `<negocio>/<id>/<foto>.jpg` (la columna da la primera). No hay copia en el VPS (`/root/archivos/fotos-bolsa/` es solo de Kevin). Solo 19 productos tienen fotos «limpias» (`photos_clean`, fondo arreglado por el bot); en esos se usan esas. Las demás son las del proveedor tal cual y muchas llevan su teléfono o texto encima: revisar antes de publicar.


## Sergio Hernández — grupo «Electrodomésticos SERGIO HERNANDEZ» (confirma Ricardo, +53 5 0817885) · 112 productos

### Estaciones de energía (EcoFlow, Jackery, Bluetti…) (10)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | OUPES Exodus 992 Wh | MK-1758 | 146, 488, 381 | 490 | 540 | 20 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1758/2A0856954D89E31E4ADB.jpg` | no | visto 20-10 |
| 2 | EcoFlow Delta 3 Classic 1024 Wh | MK-139 | 484, 376 | 600 | 660 | 24 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/139/2A47868C16AE3FA54ADC.jpg` | no | **no publicar**: es el mismo que MK-1254 (LJH, 650); este queda de respaldo; parecido: web 1133 (privado, de la tienda); visto 20-10 |
| 3 | EcoFlow Delta 3 1024 Wh (3600 W pico) | MK-1756 | 276, 140, 377 | 660 | 730 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1756/2A2552249AEFC876769B.jpg` | no | **publicar este**; LJH lo tiene a 730 (MK-1255) = respaldo; visto 20-10 |
| 4 | OUPES Mega 1 Lite | MK-382 | 147 | 670 | 740 | 28 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/382/2A313DC1C819313499BF.jpg` | no | visto 20-10 |
| 5 | EcoFlow Delta 3 Plus 1024 Wh | MK-1757 | 277, 343, 141 | 750 | 825 | 30 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1757/2A6B8C66BEEC6B7C4D1A.jpg` | no | precios vistos: 750 USD / 820 USD (vale el más reciente); **no publicar**: es el mismo que MK-1660 (LJH, 770); este queda de respaldo; visto 20-10 |
| 6 | Estación OUPES 2400 W (4500 W pico) | MK-383 | 148, 344, 312 | 1000 | 1100 | 40 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/383/2A6A9ABD18B975E6A4E3.jpg` | no | visto 20-10 |
| 7 | EcoFlow Delta 3 Max 2048 Wh | MK-311 | 278, 142 | 1150 | 1265 | 46 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/311/2A9903281EA764A1EE13.jpg` | no | precios vistos: 1150 USD / 1230 USD (vale el más reciente); **no publicar**: es el mismo que MK-1252 (LJH, 1125); este queda de respaldo; visto 20-10 |
| 8 | Jackery HomePower 3000 (3072 Wh) | MK-379 | 144, 486, 1713 | 1620 | 1785 | 66 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/379/2ADB9460737259298435.jpg` | no | visto 20-10 |
| 9 | EcoFlow Delta 3 Ultra 3072 Wh | MK-378 | 143, 485 | 1900 | 2090 | 76 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/378/2A64175638852FC640E6.jpg` | no | **no publicar**: es el mismo que MK-1663 (LJH, 1885); este queda de respaldo; parecido: web 2981 (MK-533, de Kevin); visto 20-10 |
| 10 | Jackery Explorer 3600 Plus (3584 Wh) | MK-380 | 145, 487 | 2000 | 2200 | 80 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/380/2A38A048709DD571F110.jpg` | no | visto 20-10 |

### Baterías (13)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 11 | Batería para inversores 12 V BMS (nueva en caja, sin garantía) | MK-1760 | 1423, 1220, 1641, 386, 347, 158, 284, 493, 305 | 310 | 345 | 14 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1760/2A47970D2BA87A0F4B0C.jpg` | no | **publicar este**; LJH lo tiene a 350 (MK-1667) = respaldo; visto 20-10 |
| 12 | Batería LiFePO4 12,8 V 150 Ah | MK-494 | 317, 1642, 159 | 400 | 440 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/494/2A0641E32E9778FC1659.jpg` | no | **publicar este**; LJH lo tiene a 450 (MK-1666) = respaldo; visto 20-10 |
| 13 | Batería para inversores ciclo profundo BMS (se prueba con multímetro) | MK-316 | 1442, 370, 404, 515, 206, 129 | 450 | 495 | 18 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/316/2A9F229231C8886D7A98.jpg` | no | precios vistos: 450 USD / 470 USD / 510 USD (vale el más reciente); **publicar este**; LJH lo tiene a 510 (MK-1664) = respaldo; visto 20-10 |
| 14 | Batería extra EcoFlow Delta 2 (1024 Wh) | MK-1217 | 1712, 342, 138 | 600 | 660 | 24 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1217/2A95760FE33F81BB14C7.jpg` | no | **publicar este**; LJH lo tiene a 675 (MK-25) = respaldo; visto 20-10 |
| 15 | Batería LiFePO4 25,6 V 100 Ah (2560 Wh) | MK-1761 | 1643, 318, 495, 160, 285, 348 | 660 | 730 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1761/2A03E8860F966A3ACADC.jpg` | no | **publicar este**; LJH lo tiene a 740 (MK-1665) = respaldo; visto 20-10 |
| 16 | Batería inteligente LiFePO4 5,12 kWh 51,2 V 100 Ah | MK-292 | 328, 1229, 1718, 178 | 1350 | 1485 | 54 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/292/2A46C30149AB3BC64F4F.jpg` | no | **publicar este**; LJH lo tiene a 1500 (MK-221) = respaldo; visto 20-10 |
| 17 | Batería Humsienk LiFePO4 5,12 kWh | MK-521 | 1725, 1582 | 1380 | 1520 | 56 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/521/2A0B29423CC66E342F6C.jpg` | no | visto 20-10 |
| 18 | Batería inteligente Eco-Humsienk 5,12 kWh 51,2 V 100 Ah | MK-1762 | 319, 161, 286, 1644, 1424, 387, 1221, 496, 1562, 349 | 1470 | 1620 | 60 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1762/2AE1C34E898162C06997.jpg` | no | **publicar este**; LJH lo tiene a 1630 (MK-11) = respaldo; visto 20-10 |
| 19 | Batería WattCycle LiFePO4 5,12 kWh | MK-522 | 1583, 1726 | 1550 | 1705 | 62 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/522/2AD6CD6E3303F250C8F6.jpg` | no | visto 20-10 |
| 20 | Batería Sako 10 kWh LiFePO4 | MK-186 | 508, 363, 1235 | 2770 | 3050 | 112 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/186/2A3D4AE7D5CAE0E21343.jpg` | no | **publicar este**; LJH lo tiene a 3060 (MK-16) = respaldo; visto 20-10 |
| 21 | Batería LiFePO4 15 kWh 300 Ah 51,2 V | MK-1234 | 1575, 362, 1722, 507, 185, 295, 333 | 3420 | 3765 | 138 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1234/2AC826C000963EFF4F4B.jpg` | no | **publicar este**; LJH lo tiene a 3775 (MK-1669) = respaldo; visto 20-10 |
| 22 | Batería 48 V 300 Ah (15360 Wh) | MK-137 | 1422 | 3500 | 3850 | 140 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/137/limpia-1.jpg` | no | visto 16-10 |
| 23 | Batería inteligente Eco-Worthy 16 kWh | MK-177 | 395, 358 | 3950 | 4345 | 158 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/177/2A7AD51B354447B66BAC.jpg` | no | **no publicar**: es el mismo que MK-1668 (LJH, 3655); este queda de respaldo (diferencia grande de precio: comprobar que es el mismo modelo); visto 20-10 |

### Inversores (solos) (7)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 24 | Inversor Sumry 4000 W 110 V (24 V) | MK-1759 | 345, 490, 281, 153 | 430 | 475 | 18 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1759/2A470620EAC04B5B66CB.jpg` | no | **no publicar**: es el mismo que MK-43 (LJH, 400); este queda de respaldo; parecido: web 3000 (MK-576, de Kevin); visto 20-10 |
| 25 | Inversor Sako 5 kW 110 V | MK-193 | 299, 1239 | 800 | 880 | 32 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/193/2A51F6D6415A735F7DFC.jpg` | no | **publicar este**; LJH lo tiene a 895 (MK-50) = respaldo (LJH no dice la marca: comprobar); visto 20-10 |
| 26 | Inversor híbrido 6,2 kW 110/220 V | MK-1771 | 340, 1580, 154, 1434, 403 | 850 | 935 | 34 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1771/2AC0B273E990637D92D3.jpg` | no | visto 20-10 |
| 27 | Inversor bifásico Must 6 kW | MK-157 | — | 1050 | 1155 | 42 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/157/limpia-1.jpg` | no | visto 20-10 |
| 28 | Inversor híbrido ECO-WORTHY 6 kW | MK-518 | — | 1400 | 1540 | 56 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/518/2A6B73386614E582DC1B.jpg` | no | visto 20-10 |
| 29 | Inversor híbrido WattCycle 6,5 kW | MK-519 | — | 1500 | 1650 | 60 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/519/2AA4FA86CC4870B08E31.jpg` | no | visto 20-10 |
| 30 | Inversor híbrido WattCycle Hybrid Plus 12 kW | MK-520 | 1581 | 2400 | 2640 | 96 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/520/2A523C01152A77F09A0B.jpg` | no | visto 20-10 |

### Kits inversor + batería (con o sin paneles) (16)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 31 | Combo Sumry 4000 W + 2 baterías 12,8 V 100 Ah (+ transfer) | MK-162 | 287, 350, 320, 497, 1222, 388, 1563, 1645 | 1100 | 1210 | 44 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/162/2A15E127E5B51AAABFA4.jpg` | no | visto 20-10 |
| 32 | Combo Sumry 4000 W + batería 25,6 V LiFePO4 (+ transfer) | MK-1223 | 288, 163, 351, 321, 498, 1564, 1646 | 1220 | 1345 | 50 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1223/2AA0826E82A47F23B1D8.jpg` | no | visto 20-10 |
| 33 | Combo Sumry 4000 W + 2 baterías 12,8 V 150 Ah (+ transfer) | MK-164 | 289, 352, 322, 499, 1224, 389, 1565, 1647 | 1300 | 1430 | 52 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/164/2A5270A2264FA6FB19CE.jpg` | no | visto 20-10 |
| 34 | Combo Sumry 4000 W + 2 baterías 12,8 V 200 Ah (+ transfer) | MK-165 | 290, 353, 323, 500, 1225, 390, 1566, 1648 | 1620 | 1785 | 66 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/165/2A1DDA0A3AFDBA4FA90D.jpg` | no | visto 20-10 |
| 35 | Combo Sumry 4000 W + 2 baterías 25,6 V 100 Ah (+ transfer) | MK-1763 | 166, 354, 167, 324, 501, 1649, 1226, 391 | 1940 | 2135 | 78 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1763/2AD2E46D1E38128AFD88.jpg` | no | precios vistos: 1940 USD / 1860 USD (vale el más reciente); visto 20-10 |
| 36 | Inversor todo en uno Must 3 kW con 7 kWh | MK-1432 | 298, 190, 366, 511, 1238, 336 | 2500 | 2750 | 100 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1432/2A1AFD9A0833C978CC9F.jpg` | no | **no publicar**: es el mismo que MK-1696 (LJH, 2545); este queda de respaldo; visto 16-10 |
| 37 | Combo inversor híbrido 6,2 kW + 1 batería 5,12 kWh | MK-502 | 293, 155, 282, 314, 179, 491, 1218, 384, 1426, 1571 | 2550 | 2805 | 102 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/502/2A438FFE882C3975096A.jpg` | no | **publicar este**; LJH lo tiene a 2820 (MK-1277) = respaldo; visto 20-10 |
| 38 | Combo Sumry 4000 W + 2 baterías 12,8 V 100 Ah + 2 paneles 625 W | MK-1774 | 1584, 1244, 1727, 523 | 2600 | 2860 | 104 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1774/2A75B1724CFBD67A214E.jpg` | no | visto 20-10 |
| 39 | Kit todo en uno Infinity 6 kW con 15 kWh | MK-1654 | 188, 296, 364, 509, 1576, 1236, 1430, 335 | 3780 | 4160 | 152 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1654/2ABD9393F637FEC8C27B.jpg` | no | **no publicar**: es el mismo que MK-1487 (LJH, 3865); este queda de respaldo; visto 20-10 |
| 40 | Inversor todo en uno Must 6 kW con 15 kWh | MK-1769 | 189, 297, 1655, 365, 510, 1237, 1431 | 3850 | 4235 | 154 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1769/2AE2911628B305AC3D61.jpg` | no | **no publicar**: es el mismo que MK-1457 (LJH, 3700); este queda de respaldo; visto 20-10 |
| 41 | Combo inversor híbrido 6,2 kW + 2 baterías 5,12 kWh (10,24 kWh) | MK-385 | 346, 156, 283, 315, 492, 1219, 1640, 1714 | 4000 | 4400 | 160 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/385/2A95E465B1334AED21C9.jpg` | no | **publicar este**; LJH lo tiene a 4415 (MK-1278) = respaldo; visto 20-10 |
| 42 | Inversor Must 6 kW 110/220 V + batería Sako 15 kWh | MK-401 | 302, 198, 338, 1657, 1577, 1241 | 4700 | 5170 | 188 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/401/2AE0F8AA3B5B8639858B.jpg` | no | **publicar este**; LJH lo tiene a 5185 (MK-1676) = respaldo; visto 20-10 |
| 43 | Kit fotovoltaico 6,2 kVA + 4 paneles 625 W + batería 5,12 kWh | MK-1764 | 180, 329, 1572, 503, 1719, 1230, 1427, 359, 396 | 4700 | 5170 | 188 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1764/2A466BF78E7797C16CDE.jpg` | no | **publicar este**; LJH lo tiene a 5185 (MK-1677) = respaldo; visto 20-10 |
| 44 | Kit fotovoltaico ECO-WORTHY 6 kW + batería 5,12 kWh + 6 paneles 625 W | MK-1766 | 182, 1429, 398, 1232, 504, 1653, 1574, 361, 331, 1721 | 5350 | 5885 | 214 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1766/2A4AD46BA3BD88806BFE.jpg` | no | visto 20-10 |
| 45 | Combo Must 6 kW + batería Sako 15 kWh + 6 paneles bifaciales | MK-300 | 194, 337, 512, 400, 1723, 1433, 1656, 1240 | 5700 | 6270 | 228 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/300/2AEC19CC06DBF947E49B.jpg` | no | **publicar este**; LJH lo tiene a 6285 (MK-1675) = respaldo; visto 20-10 |
| 46 | Kit fotovoltaico 6,2 kVA + 6 paneles 625 W + 2 baterías (10,24 kWh) | MK-1765 | 181, 1652, 1720, 1231, 1428, 360, 397, 1573, 330 | 6600 | 7260 | 264 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1765/2AB8C91BDF44391303BB.jpg` | no | **publicar este**; LJH lo tiene a 7275 (MK-1678) = respaldo; visto 20-10 |

### Paneles solares (3)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 47 | Panel solar 450 W Ever Solar bifacial | MK-402 | 303, 339, 200, 1578, 513, 1242, 367 | 160 | 180 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/402/2AA3BA1E5E70319451A6.jpg` | no | visto 20-10 |
| 48 | Panel solar 625 W bifacial (BIN) | MK-1768 | 294, 184, 1233, 332, 506, 1443 | 170 | 190 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1768/2A4CE26750925FC50DE6.jpg` | no | precios vistos: 170 USD / 180 USD (vale el más reciente); visto 20-10 |
| 49 | Panel solar Longi 620 W bifacial | MK-1767 | 183, 505, 399 | 210 | 230 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1767/2A1E6A29BA30B012E21B.jpg` | no | **no publicar**: es el mismo que MK-1288 (LJH, 210); este queda de respaldo; visto 20-10 |

### Cables y accesorios solares (4)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 50 | Cable solar 10 m (inversor, panel y EcoFlow) | MK-489 | 280, 313, 150 | 55 | 72 | 6,8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/489/2AC5FE170EDC62EDA08E.jpg` | no | **publicar este**; LJH lo tiene a 85 (MK-1704) = respaldo; visto 20-10 |
| 51 | Cable solar MC4 a XT60 de 6 m | MK-149 | 279 | 85 | 105 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/149/2AC72821679E765B1176.jpg` | no | **publicar este**; LJH lo tiene a 110 (MK-269) = respaldo; visto 20-10 |
| 52 | Transfer automático SACO 110 V | MK-405 | 516, 306 | 90 | 110 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/405/2A9EF0A0F04C9D3AE379.jpg` | no | visto 20-10 |
| 53 | Controlador solar Boost Q7-LUMINA MPPT 1200 W | MK-151 | — | 125 | 145 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/151/limpia-1.jpg` | no | visto 20-10 |

### Plantas eléctricas (gasolina / gas) (2)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 54 | Planta SIGMA Inverter 4000 W (3300 W continuos) | MK-168 | 1715, 1567, 355, 392 | 870 | 960 | 36 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/168/limpia-1.jpg` | no | precios vistos: 870 USD / 910 USD (vale el más reciente); **publicar este**; LJH lo tiene a 970 (MK-101) = respaldo; visto 20-10 |
| 55 | Planta SIGMA Inverter 6500 W (5000 W continuos) | MK-169 | 1716, 1568, 1227 | 1150 | 1265 | 46 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/169/2A96D8A25EFE07089FE8.jpg` | no | precios vistos: 1150 USD / 1230 USD (vale el más reciente); **publicar este**; LJH lo tiene a 1280 (MK-110) = respaldo; visto 20-10 |

### Neveras, refrigeradores y congeladores (10)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 56 | Neveras con detalles pequeños (funcionan bien) | MK-1750 | — | 240 | 260 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1750/2A9F6568C4F601EBE7B1.jpg` | no | visto 20-10 |
| 57 | Nevera Royal 3,5 pies Inverter | MK-135 | 1711 | 245 | 265 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/135/limpia-1.jpg` | no | **no publicar**: es el mismo que MK-1538 (LJH, 260); este queda de respaldo; visto 20-10 |
| 58 | Nevera Milexus 4,2 pies (119 L) | MK-136 | — | 250 | 270 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/136/limpia-1.jpg` | no | **publicar este**; LJH lo tiene a 275 (MK-245) = respaldo; visto 20-10 |
| 59 | Nevera Royal 5,5 pies | MK-205 | — | 270 | 290 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/205/limpia-1.jpg` | **sí**, producto 2958 (MK-205) | **publicar este**; LJH lo tiene a 295 (MK-247) = respaldo; visto 20-10 |
| 60 | Nevera Milexus 6 pies con llave | MK-525 | 1585 | 300 | 320 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/525/2A2798582410D503A62E.jpg` | no | **no publicar**: es el mismo que MK-1382 (LJH, 315); este queda de respaldo; visto 20-10 |
| 61 | Frío Hisense 7,3 pies | MK-1216 | 375, 134, 310 | 370 | 410 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1216/2A9D1C09ECE4643A839F.jpg` | no | **publicar este**; LJH lo tiene a 410 (MK-71) = respaldo; visto 20-10 |
| 62 | Congelador vertical Premier 145 L | MK-584 | 1586 | 385 | 425 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/584/2A18461E64A8EFD1DAB1.jpg` | no | **publicar este**; LJH lo tiene a 435 (MK-1619) = respaldo; visto 20-10 |
| 63 | Congelador vertical Premier 177 L | MK-585 | 1587, 1245 | 415 | 460 | 18 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/585/2ACDEE2E24326786A3F0.jpg` | no | **publicar este**; LJH lo tiene a 470 (MK-1620) = respaldo; visto 20-10 |
| 64 | Refrigerador LG 14 pies | MK-195 | — | 830 | 915 | 34 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/195/limpia-1.jpg` | no | **no publicar**: es el mismo que MK-1690 (LJH, 850); este queda de respaldo; visto 15-10 |
| 65 | Refrigerador Hisense Side by Side 16 pies | MK-197 | — | 840 | 925 | 34 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/197/limpia-1.jpg` | no | visto 20-10 |

### Lavadoras (7)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 66 | Lavadora semiautomática Milexus 7 kg | MK-1251 | 1438 | 180 | 200 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1251/2A2AF99F678AEB5A5A69.jpg` | no | **publicar este**; LJH lo tiene a 200 (MK-1482) = respaldo; visto 20-10 |
| 67 | Lavadora automática Milexus 7,5 kg | MK-202 | 304 | 200 | 220 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/202/limpia-1.jpg` | no | **publicar este**; LJH lo tiene a 225 (MK-1481) = respaldo; visto 19-10 |
| 68 | Lavadora semiautomática Premier 9 kg | MK-132 | 1710, 373 | 220 | 240 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/132/2A0513B386419542DCD2.jpg` | no | visto 20-10 |
| 69 | Lavadora automática LG 9 kg | MK-371 | 199, 341, 1658 | 300 | 320 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/371/2A176BEB7C8A69F5946D.jpg` | no | **publicar este**; LJH lo tiene a 340 (MK-1413) = respaldo (comprobar que es el mismo modelo); visto 20-10 |
| 70 | Lavadora secadora al vapor Milexus 10 kg | MK-1246 | 1659, 586, 1588 | 650 | 715 | 26 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1246/2A750F251265E33956CA.jpg` | no | **publicar este**; LJH lo tiene a 730 (MK-1694) = respaldo; visto 20-10 |
| 71 | Lavadora secadora Hisense 15 kg | MK-196 | 301 | 670 | 740 | 28 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/196/limpia-1.jpg` | no | **publicar este**; LJH lo tiene a 750 (MK-1483) = respaldo; visto 20-10 |
| 72 | Lavadora secadora LG 14 kg | MK-1435 | 526 | 780 | 860 | 32 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1435/2AE78606EAF2A668571D.jpg` | no | visto 20-10 |

### Splits (aire acondicionado) (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 73 | Split Milexus 1 tonelada 220 V | MK-131 | 1243, 1773 | 280 | 300 | 8 | sí (1, del #1773) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1773/2AA1AA4EAB10FE07760F.jpg` | **sí**, producto 2948 (MK-131) | **publicar este**; LJH lo tiene a 300 (MK-1478) = respaldo; visto 20-10 |

### Televisores (6)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 74 | Smart TV Insignia 32" Fire TV | MK-1717 | 291, 170, 393, 1650, 325, 356, 1569 | 155 | 175 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1717/2A44ADDAD2180CB739FB.jpg` | no | visto 20-10 |
| 75 | Smart TV ONN Vizio 32" | MK-171 | 1651, 394, 326, 1570 | 155 | 175 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/171/2A85ADEE688F7621549B.jpg` | no | visto 20-10 |
| 76 | TV Premier 32" Smart con barra de sonido | MK-1770 | 368, 514, 1579, 203 | 165 | 185 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1770/2A0ECC4D574B61D9DD75.jpg` | no | **publicar este**; LJH lo tiene a 190 (MK-124) = respaldo; visto 20-10 |
| 77 | Smart TV Samsung 40" | MK-201 | — | 245 | 265 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/201/limpia-1.jpg` | no | **publicar este**; LJH lo tiene a 270 (MK-123) = respaldo; visto 20-10 |
| 78 | Smart TV Insignia 55" 4K | MK-1639 | 1730 | 400 | 440 | 16 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1639/2ADB8FFA1F8AE05A1370.jpg` | no | visto 20-10 |
| 79 | TV Premier 50" UHD Smart con barra de sonido y soporte | MK-1775 | 1341, 1441 | 485 | 535 | 20 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1775/2A99F37FD0056CB1DBD9.jpg` | no | visto 20-10 |

### Calentadores de agua (3)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 80 | Calentador eléctrico Milexus 50 L (YB-003-50L) | MK-1589 | 1437, 1248, 588 | 170 | 190 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1589/2A696BE8764DE5FCE659.jpg` | no | visto 20-10 |
| 81 | Calentador eléctrico 11 kW (1100 W) | MK-589 | 1249, 1728 | 210 | 230 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/589/2A3C9B7CBB83D70644E3.jpg` | no | visto 20-10 |
| 82 | Calentador eléctrico 13 kW (1300 W) | MK-1436 | 1250, 590 | 220 | 240 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1436/2AFD19FA8EBF6FC31A89.jpg` | no | **no publicar**: es el mismo que MK-1495 (LJH, 220); este queda de respaldo; visto 20-10 |

### Cocinas, hornos y grill (5)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 83 | Grill a gas para parrilladas | MK-1439 | 1339 | 190 | 210 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1439/2A74845453AB902F462A.jpg` | no | visto 20-10 |
| 84 | Cocina Premier 20" con magneto | MK-204 | 369 | 210 | 230 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/204/2AC05A1FBC58066F6EAB.jpg` | no | visto 20-10 |
| 85 | Estufa de gas 6 quemadores con horno 30" | MK-1749 | 1327 | 400 | 440 | 16 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1749/2AFEFBFC6658E0D80692.jpg` | no | visto 20-10 |
| 86 | Cocina Milexus de gas 5 quemadores | MK-1777 | — | 440 | 485 | 18 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1777/2AD01EC4565AD798E992.jpg` | no | visto 20-10 |
| 87 | Cocina Milexus de gas 6 quemadores | MK-1778 | — | 470 | 520 | 20 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1778/2AF298BD0E4BFC160907.jpg` | no | visto 20-10 |

### Batidoras y cafetera (4)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 88 | Batidora de mano Midea 200 W | MK-1776 | 1228, 1425, 173 | 35 | 49 | 5,6 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1776/2A155E517FAE5EEC9D0F.jpg` | no | visto 20-10 |
| 89 | Batidora Silver Crest 2 L 1800 W | MK-1729 | 1340, 1440 | 50 | 67 | 6,8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1729/2A2739519E29AA6BC1A4.jpg` | no | visto 20-10 |
| 90 | Cafetera espresso Royal | MK-174 | — | 55 | 72 | 6,8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/174/limpia-1.jpg` | no | visto 20-10 |
| 91 | Batidora Ninja Plus Blender Duo 1400 W | MK-1247 | 587 | 190 | 210 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1247/2A998DEF5ACC5F87D679.jpg` | no | visto 20-10 |

### Ventiladores (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 92 | Ventilador industrial 30" 160 W | MK-1772 | 407, 1724, 517, 372 | 165 | 185 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1772/2A2B4DBFAA9761AD4B96.jpg` | no | visto 20-10 |

### Otros (lámparas, hielo, gomas, inflables, muebles) (13)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 93 | Goma 120/70-12 para moto eléctrica / scooter | MK-1752 | 1743, 1735 | 31 | 44 | 5,2 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1752/2A5AF3E93220FA380B60.jpg` | no | precios vistos: 31 USD / 35 USD / 30 USD (vale el más reciente); visto 20-10 |
| 94 | Goma 3.50-12 para triciclo (delantera) | MK-1745 | 1737 | 31 | 44 | 5,2 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1745/2AEEF604C44ECE1E45BF.jpg` | no | precios vistos: 31 USD / 30 USD (vale el más reciente); visto 20-10 |
| 95 | Goma 3.75-12 para triciclo (delantera) | MK-1746 | 1738 | 31 | 44 | 5,2 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1746/2AEEF604C44ECE1E45BF.jpg` | no | precios vistos: 31 USD / 30 USD (vale el más reciente); visto 20-10 |
| 96 | Goma 4.00-12 para triciclo | MK-1754 | 1747, 1739 | 31 | 44 | 5,2 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1754/2A5AF3E93220FA380B60.jpg` | no | precios vistos: 31 USD / 35 USD / 30 USD (vale el más reciente); visto 20-10 |
| 97 | Goma 80/90-14 para bici-moto | MK-1755 | 1748, 1740 | 31 | 44 | 5,2 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1755/2A5AF3E93220FA380B60.jpg` | no | precios vistos: 31 USD / 35 USD / 30 USD (vale el más reciente); visto 20-10 |
| 98 | Goma 145/70-12 para triciclo (trasera) | MK-1753 | 1744, 1736 | 33 | 47 | 5,6 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1753/2A5AF3E93220FA380B60.jpg` | no | precios vistos: 33 USD / 38 USD / 32 USD (vale el más reciente); visto 20-10 |
| 99 | Goma 130/60-13 para moto eléctrica / scooter | MK-1751 | 1742, 1734 | 48 | 65 | 6,8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1751/2A5AF3E93220FA380B60.jpg` | no | precios vistos: 48 USD / 52 USD / 46 USD (vale el más reciente); visto 20-10 |
| 100 | Silla de oficina | MK-176 | — | 55 | 72 | 6,8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/176/2AB971793F584FE62CDC.jpg` | no | visto 20-10 |
| 101 | Inflable muñeco de nieve LYC-053 (1,6 m) | MK-1590 | 1342 | 90 | 110 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1590/2AA5A0E12109F5644B7E.jpg` | no | visto 17-10 |
| 102 | Inflable muñeco de nieve LYC-054 (1,8 m) | MK-1592 | 1345 | 110 | 130 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1592/2AB73BF976AEFE8FF743.jpg` | no | visto 17-10 |
| 103 | Inflable Papá Noel gigante | MK-1344 | — | 135 | 155 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1344/2AEF2BD1468F9B1E6CCD.jpg` | no | visto 17-10 |
| 104 | Inflable árbol de Navidad LYC-044 (2,1 m) | MK-1591 | 1343 | 140 | 160 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1591/2A95653282852C14D331.jpg` | no | visto 17-10 |
| 105 | Bicicleta Silver Bike MTB 26" | MK-406 | 307 | 200 | 220 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/406/2A70390D36D2B6FB2729.jpg` | no | visto 18-10 |

### Antiguos (no anunciados desde antes del 13-oct; preguntar si siguen)

#### Baterías (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 106 | Batería inteligente Eco-Worthy 5,12 kWh 51,2 V 100 Ah | MK-207 | — | 1470 | 1620 | 60 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/207/2A309C9E1B4C75CF9CE3.jpg` | no | visto 08-10 |

#### Cables y accesorios solares (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 107 | Transfer automático ZENEOGK | MK-152 | — | 90 | 110 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/152/2AC54F3F16D3C84EA17C.jpg` | no | visto 07-10 |

#### Neveras, refrigeradores y congeladores (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 108 | Frío Royal 8,5 pies con dispensador | MK-192 | 191 | 380 | 420 | 16 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/192/2A31778F48F0B1F28F94.jpg` | no | precios vistos: 380 USD / 390 USD (vale el más reciente); visto 07-10 |

#### Lavadoras (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 109 | Lavadora automática Samsung 9 kg | MK-133 | 374 | 275 | 295 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/133/2A8C19BBE27F02A6A1F4.jpg` | no | visto 12-10 |

#### Cocinas, hornos y grill (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 110 | Horno Premier 45 L con asador | MK-175 | 357, 327 | 160 | 180 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/175/2A912823D5F759B5B463.jpg` | no | visto 12-10 |

#### Ventiladores (2)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 111 | Ventilador recargable 20000 mAh | MK-172 | — | 58 | 75 | 6,8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/172/limpia-1.jpg` | **sí**, producto 2953 (MK-172) | visto 12-10 |
| 112 | Ventilador recargable Elfo 15000 mAh con panel solar | MK-308 | 187, 334 | 90 | 110 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/308/2A523DEF22D169E51982.jpg` | no | visto 12-10 |

## LJH — grupo «Electro L Q Nesecitas ⚡» (+53 5 3847951) · 181 productos

> Dos anuncios del grupo de LJH los puso otra persona («DCH»): #1347 lavadora Estelectric 8 kg y #1348 exhibidora AUCMA 7,2 pies. Son el mismo producto y precio que LJH, así que van juntos.

### Estaciones de energía (EcoFlow, Jackery, Bluetti…) (24)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | EcoFlow River 3 Plus 286 Wh | MK-1298 | 76, 1475, 451 | 400 | 440 | 16 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1298/A5C573AB88EA9F2C3EA974466C7E10D6.jpg` | no | parecido: web 1617 (privado, de la tienda); visto 19-10 |
| 2 | SBAOH 600 W (538,7 Wh) | MK-1305 | 256, 83, 457, 1624, 1387 | 410 | 455 | 18 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1305/A573FFC279984D248B56A12C1DE75637.jpg` | no | visto 19-10 |
| 3 | Ampace Andes 600 Pro (584 Wh) | MK-1302 | 253, 80, 455 | 460 | 510 | 20 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1302/A51F8C4FA5215AF6FB3AD126E9810D22.jpg` | no | visto 19-10 |
| 4 | EcoFlow River 3 Plus + batería extra EB600 (572 Wh) | MK-1541 | 262, 77, 1621, 1385, 452, 1299 | 550 | 605 | 22 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1541/A54C192D31482995EA0BCFCDFE8FC262.jpg` | no | visto 19-10 |
| 5 | Oukitel P1000 Plus (1024 Wh, 1800 W) | MK-464 | 261, 84, 1545, 1623, 1392 | 550 | 605 | 22 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/464/A548CCAAED17EBD3AA1CF131952385D7.jpg` | no | precios vistos: 550 USD / 610 USD (vale el más reciente); visto 19-10 |
| 6 | EcoFlow Delta 3 Classic 1024 Wh | MK-1254 | 3, 210, 1445, 1558, 410, 1511, 1351 | 590 | 650 | 24 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1254/A59EC54D9B4547588F39668358F6B630.jpg` | no | **publicar este**; Sergio lo tiene a 660 (MK-139) = respaldo; parecido: web 1133 (privado, de la tienda); visto 19-10 |
| 7 | EcoFlow Delta 3 1024 Wh LiFePO4 | MK-1255 | 4, 211, 1446, 1593, 1559, 411, 1512, 1352 | 660 | 730 | 28 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1255/A55544F6FE21C4B72478D1C35F983A2B.jpg` | no | precios vistos: 660 USD / 640 USD (vale el más reciente); **no publicar**: es el mismo que MK-1756 (Sergio, 730); este queda de respaldo; visto 19-10 |
| 8 | Bluetti AC180 (1152 Wh) | MK-1306 | 257, 85, 1388, 458 | 670 | 740 | 28 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1306/A50A65C007D4958F35065DEB3A5AF631.jpg` | no | parecido: web 1143 (privado, de la tienda); visto 19-10 |
| 9 | EcoFlow Delta 3 Plus 1024 Wh | MK-1660 | 5, 212, 1515, 1355 | 700 | 770 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1660/A53C28387B69C9CA42A44AF1A85C8A69.jpg` | no | precios vistos: 700 USD / 670 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 825 (MK-1757) = respaldo; visto 19-10 |
| 10 | Bluetti AC180P (1440 Wh) | MK-1307 | 258, 86, 1389, 459 | 790 | 870 | 32 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1307/A5EA1FA98150890D97500C1BF1FDD6CA.jpg` | no | visto 19-10 |
| 11 | Oukitel P1500 Plus (1536 Wh, 1800 W) | MK-463 | 260, 89, 1391, 1544, 1626 | 870 | 960 | 36 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/463/A5E01FFC60CA4BFFA41720A6EC13C7B0.jpg` | no | visto 19-10 |
| 12 | Ampace Andes 1500 (1462 Wh) | MK-1300 | 251, 78, 453 | 880 | 970 | 36 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1300/A52B1BFFB14E937ADFE32D56D62179C5.jpg` | no | visto 19-10 |
| 13 | EcoFlow Delta 3 Max 2048 Wh | MK-1252 | 1, 208, 409, 1509, 1349 | 1020 | 1125 | 42 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1252/A55DD503461E7B7E2B1815CF281FE8C2.jpg` | no | precios vistos: 1020 USD / 1090 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 1265 (MK-311) = respaldo; visto 19-10 |
| 14 | Solar Play 2400 W (2160 Wh) | MK-1304 | 255, 82, 456, 1386 | 1040 | 1145 | 42 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1304/A5D4376BD56BB31FCFE104FF152AA884.jpg` | no | visto 19-10 |
| 15 | Anker Solix S2000 (2010 Wh) | MK-1301 | 252, 79, 454 | 1070 | 1180 | 44 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1301/A5A311F4E83C375B686113D42BAEA21B.jpg` | no | visto 19-10 |
| 16 | OUPES Mega 2 Pro (2500 W) | MK-1303 | 254, 81 | 1190 | 1310 | 48 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1303/A5029C668138E036FDDC41E83B7B95E3.jpg` | no | visto 19-10 |
| 17 | EcoFlow Delta 2 Max 2048 Wh | MK-1661 | 8, 1638, 1444, 1594, 1259, 1356 | 1260 | 1390 | 52 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1661/A55F2C86788F925811CEA5495ECE0BB0.jpg` | no | precios vistos: 1260 USD / 1420 USD (vale el más reciente); visto 19-10 |
| 18 | Estación de energía LiFePO4 3600 W 3072 Wh (sin marca) | MK-1692 | 90, 263, 1308, 461, 1477, 1390, 1625, 1543 | 1600 | 1760 | 64 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1692/A58177DC4437469F670EED4536ABBA7B.jpg` | no | visto 19-10 |
| 19 | EcoFlow Delta 3 Ultra 3072 Wh | MK-1663 | 2, 209, 408, 1510, 1350, 1253 | 1710 | 1885 | 70 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1663/A5A55EDE6DD5E045B7BEDFFD5F9A9544.jpg` | no | precios vistos: 1710 USD / 1700 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 2090 (MK-378) = respaldo; parecido: web 2981 (MK-533, de Kevin); visto 19-10 |
| 20 | EcoFlow Delta 3 Ultra Plus | MK-1256 | 6, 1357 | 1900 | 2090 | 76 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1256/A5FA9406136877E78435AC3E9A420BE4.jpg` | no | visto 19-10 |
| 21 | EcoFlow Delta Pro 3600 Wh | MK-1257 | 9, 213, 412, 1513, 1353, 1505 | 2060 | 2270 | 84 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1257/A525591D3DD265E7788F4F67D8081D5C.jpg` | no | precios vistos: 2060 USD / 2150 USD / 2070 USD (vale el más reciente); parecido: web 2977 (MK-572, de Kevin); visto 19-10 |
| 22 | Jackery Explorer 5000 Plus | MK-88 | 462 | 2950 | 3245 | 118 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/88/A53FFEFDF4D668C83F4B08721E4CF25B.jpg` | no | visto 19-10 |
| 23 | EcoFlow Delta Pro 3 4000 Wh | MK-1258 | 7, 214, 413, 1447, 1514, 1354 | 3200 | 3520 | 128 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1258/A50958D3F157E53A328B5E42CC398EED.jpg` | no | precios vistos: 3200 USD / 2800 USD / 3050 USD (vale el más reciente); visto 19-10 |
| 24 | EcoFlow Delta Pro Ultra 6144 Wh | MK-1662 | 1504, 1595 | 4550 | 5005 | 182 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1662/A576FA045122F0B5C295C871DDDE2268.jpg` | no | visto 19-10 |

### Combos estación + panel solar (7)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 25 | Combo EcoFlow Delta 3 Classic + panel 595 W | MK-1473 | 59, 1293, 445 | 730 | 805 | 30 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1473/A567F28EE37CC4D574B5890756CDBE6E.jpg` | no | visto 15-10 |
| 26 | Combo EcoFlow (modelo por confirmar) + panel 450 W + cable 10 m | MK-1686 | 1536, 1618, 1472, 1381 | 830 | 915 | 34 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1686/A5EAF6443DDFF4A5342A3E4A1107EA13.jpg` | no | visto 19-10 |
| 27 | Combo EcoFlow Delta 3 Plus + panel 450 W + cable 10 m | MK-1687 | 1470, 1616, 1291 | 880 | 970 | 36 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1687/A5D6492936DDEE75F64E0B1924D9D4E6.jpg` | no | visto 19-10 |
| 28 | Combo EcoFlow Delta 3 + panel 450 W + cable 10 m | MK-1294 | 448, 58 | 890 | 980 | 36 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1294/A5387B32409EED1C868BC5BC4007219C.jpg` | no | precios vistos: 890 USD / 930 USD (vale el más reciente); visto 13-10 |
| 29 | Combo EcoFlow Delta 3 Max + panel 450 W + cable 10 m | MK-447 | 1471, 1292, 1617, 1380 | 1190 | 1310 | 48 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/447/A5CB4DB301954F919AECF8C7DEAEAD3E.jpg` | no | visto 19-10 |
| 30 | Jackery Explorer 2000 (2042 Wh) + panel SolarSaga 200 W | MK-1691 | 259, 87, 1476, 1542, 1622, 460 | 1540 | 1695 | 62 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1691/A5A93B9EC4DDFC6479E05F40106B244C.jpg` | no | visto 19-10 |
| 31 | Combo EcoFlow Delta Pro + paneles 450 W | MK-1506 | — | 2550 | 2805 | 102 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1506/A5A6896DD205878DB116F477F98B98A6.jpg` | no | visto 16-10 |

### Baterías (21)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 32 | Batería para inversores BMS (nueva en caja, sin garantía) | MK-1667 | 13, 1596, 1517, 217, 417, 1263 | 315 | 350 | 14 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1667/A56D46FF785E01BFB022C8630B62A3D9.jpg` | no | **no publicar**: es el mismo que MK-1760 (Sergio, 345); este queda de respaldo; visto 19-10 |
| 33 | Batería LiFePO4 12,8 V 150 Ah | MK-1666 | 416, 1262, 12, 219 | 405 | 450 | 18 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1666/A5FF96F448FB1DC19A6D483B187E5A56.jpg` | no | **no publicar**: es el mismo que MK-494 (Sergio, 440); este queda de respaldo; visto 19-10 |
| 34 | Batería para inversores ciclo profundo BMS (se prueba con multímetro) | MK-1664 | 1358, 1598, 1261, 414, 26 | 460 | 510 | 20 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1664/A5308C450B8A12EC2666475E4CF4542C.jpg` | no | precios vistos: 460 USD / 480 USD / 560 USD (vale el más reciente); **no publicar**: es el mismo que MK-316 (Sergio, 495); este queda de respaldo; visto 19-10 |
| 35 | Batería extra EcoFlow Delta 2 (1024 Wh) | MK-25 | 215 | 610 | 675 | 26 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/25/A5DB067174D68FB62E308946FB96C26B.jpg` | no | **no publicar**: es el mismo que MK-1217 (Sergio, 660); este queda de respaldo; visto 19-10 |
| 36 | Batería 25,5 V 100 Ah | MK-14 | — | 610 | 675 | 26 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/14/limpia-1.jpg` | no | visto 19-10 |
| 37 | Batería LiFePO4 25,6 V 100 Ah (2560 Wh) | MK-1665 | 1359, 27, 218, 1449, 415 | 670 | 740 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1665/A547F4EDB61C976CBA1CE861A7345721.jpg` | no | **no publicar**: es el mismo que MK-1761 (Sergio, 730); este queda de respaldo; visto 19-10 |
| 38 | Batería 5 kWh | MK-1561 | 23, 1360 | 1060 | 1170 | 44 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1561/A58BAF04E38BCE5FB9EF53F2810EB23C.jpg` | no | precios vistos: 1060 USD / 1560 USD (vale el más reciente); visto 16-10 |
| 39 | Batería extra EcoFlow Delta 2 Max | MK-1448 | 1419 | 1250 | 1375 | 50 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1448/A556A3D1383312D25C062BD4EF572149.jpg` | no | visto 15-10 |
| 40 | Batería inteligente Eco-Humsienk 5,12 kWh 51,2 V 100 Ah | MK-11 | 1516, 1260, 216 | 1480 | 1630 | 60 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/11/A5ECE0798091A3D95382F5580DCB5AA2.jpg` | no | **no publicar**: es el mismo que MK-1762 (Sergio, 1620); este queda de respaldo; visto 19-10 |
| 41 | Batería extra EcoFlow Delta Pro | MK-1507 | — | 1690 | 1860 | 68 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1507/A5E42E263944DC36701E5090CEA6CD36.jpg` | no | visto 19-10 |
| 42 | Batería TBSOLARO LiFePO4 10 kWh 51 V 200 Ah | MK-1670 | — | 2560 | 2820 | 104 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1670/A5B7091EF7CEEEE7948846BBC9C07A01.jpg` | no | visto 19-10 |
| 43 | Batería 10 kWh | MK-1599 | 24 | 2610 | 2875 | 106 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1599/A557F128DEA5830BD11E2137510E6DCA.jpg` | no | visto 17-10 |
| 44 | Batería Must 10 kWh | MK-1671 | 10 | 2610 | 2875 | 106 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1671/A5DFB5F41A47A26D12B5C83338002D82.jpg` | no | precios vistos: 2610 USD / 2710 USD (vale el más reciente); visto 19-10 |
| 45 | Batería Must 15 kWh | MK-21 | — | 2760 | 3040 | 112 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/21/limpia-1.jpg` | no | visto 19-10 |
| 46 | Batería Sako 10 kWh | MK-16 | — | 2780 | 3060 | 112 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/16/A58E262589CBA5A976E655C832EDECBC.jpg` | no | **no publicar**: es el mismo que MK-186 (Sergio, 3050); este queda de respaldo; visto 19-10 |
| 47 | Batería GIGA CITY 16 kWh | MK-1420 | — | 3110 | 3425 | 126 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1420/A50A65237CCB38AD4AED3935A0349086.jpg` | no | visto 19-10 |
| 48 | Batería 16 kWh | MK-18 | 1451 | 3210 | 3535 | 130 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/18/limpia-1.jpg` | no | precios vistos: 3210 USD / 3310 USD (vale el más reciente); visto 19-10 |
| 49 | Batería EcoWorthy 16 kWh 51,2 V 314 Ah | MK-1668 | 28, 1518, 419, 222, 1266, 1346, 1597 | 3320 | 3655 | 134 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1668/A59481D3D563D450513C7B6B5323095B.jpg` | no | precios vistos: 3320 USD / 3520 USD / 3550 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 4345 (MK-177) = respaldo (diferencia grande de precio: comprobar que es el mismo modelo); visto 19-10 |
| 50 | Batería LiFePO4 15 kWh 300 Ah 51,2 V | MK-1669 | 1361, 420, 220, 1450, 1267, 17 | 3430 | 3775 | 138 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1669/A53A7C4B72CDC0743C847B22938209F4.jpg` | no | precios vistos: 3430 USD / 3390 USD (vale el más reciente); **no publicar**: es el mismo que MK-1234 (Sergio, 3765); este queda de respaldo; visto 19-10 |
| 51 | Batería Bluesun 16 kWh | MK-20 | 418, 1265 | 3450 | 3795 | 138 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/20/A5FD90D367FB722C8459ACF7B1CD34C0.jpg` | no | visto 19-10 |
| 52 | Batería Humsienk 15 kWh | MK-19 | 1264 | 3500 | 3850 | 140 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/19/A5714712B6A175708E92A9E064BE4411.jpg` | no | visto 19-10 |

### Inversores (solos) (15)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 53 | Inversor solar Sumry 4000 W híbrido 110 V | MK-43 | 234, 435 | 360 | 400 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/43/A542B2320F0DBB13B32418BA45BB1977.jpg` | no | precios vistos: 360 USD / 400 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 475 (MK-1759) = respaldo; parecido: web 3000 (MK-576, de Kevin); visto 19-10 |
| 54 | Inversor 3 kW 110 V 48 V | MK-1466 | 1285, 1375 | 460 | 510 | 20 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1466/A52B6E866569F61E9CA6A614966202D5.jpg` | no | visto 15-10 |
| 55 | Inversor Must 3 kW 110/220 V | MK-1682 | 1467, 1613, 1532, 1376, 1286 | 660 | 730 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1682/A5053D619A5BB9B1BD459F7252DDE8A0.jpg` | no | visto 19-10 |
| 56 | Inversor ECO-WORTHY 5 kW | MK-1534 | 1615 | 750 | 825 | 30 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1534/A5B6F67D4D43EA477F710977CAF43C3F.jpg` | no | visto 19-10 |
| 57 | Inversor 5 kW | MK-50 | 237, 1374 | 810 | 895 | 34 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/50/A55DEC4FDBB35961FCA31CBEFE17DE34.jpg` | no | **no publicar**: es el mismo que MK-193 (Sergio, 880); este queda de respaldo (LJH no dice la marca: comprobar); visto 19-10 |
| 58 | Inversor GIGA CITY 6 kW | MK-1614 | 1468 | 860 | 950 | 36 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1614/A548CCD2C55D3CE123907BC52D84E703.jpg` | no | visto 19-10 |
| 59 | Inversor Must 6 kW | MK-44 | — | 910 | 1005 | 38 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/44/A57D1D79E02C5C02ED3FB8DE86B48A20.jpg` | no | visto 19-10 |
| 60 | Inversor InfiniSolar 6000 W VP330 TLV | MK-1684 | — | 910 | 1005 | 38 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1684/A521431F7CD44D6D6ADA66CA056F1044.jpg` | no | visto 19-10 |
| 61 | Inversor Sako 6 kW | MK-1283 | 238, 48, 436, 1373 | 960 | 1060 | 40 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1283/A5FF84E44E0D50BBBC84F8B0DD2050BE.jpg` | no | visto 19-10 |
| 62 | Inversor híbrido 8 kW 110/220 V | MK-1683 | 49, 1560 | 1300 | 1430 | 52 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1683/A5A19B98B17E476EB516A06BB2EFE2CE.jpg` | no | visto 19-10 |
| 63 | Inversor Sako Sunsee Amery 10000 W fase dividida | MK-1681 | 236, 46, 1612, 1284, 1531, 438 | 1710 | 1885 | 70 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1681/A5B35DCCABEAD31E7D5E768339012456.jpg` | no | visto 19-10 |
| 64 | Inversor Sunpal 10 kW 110/220 V | MK-47 | — | 1730 | 1905 | 70 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/47/A554A56CBA498991E8A4A00BD074C6AA.jpg` | no | visto 19-10 |
| 65 | Inversor Sako 10 kW 110/220 V | MK-51 | 239 | 1760 | 1940 | 72 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/51/A5BA866F86EDC255973ADAEED6A89B81.jpg` | no | visto 19-10 |
| 66 | Inversor Sako 12000 W | MK-240 | — | 1910 | 2105 | 78 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/240/A52258A909048AB866491C3C540566B6.jpg` | no | visto 19-10 |
| 67 | Inversor Humsienk 12000 Plus+ (12 kW) | MK-1533 | 1335 | 1950 | 2145 | 78 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1533/A5787612F94AB0DEBC462DA9D18A0A14.jpg` | no | precios vistos: 1950 USD / 2100 USD (vale el más reciente); visto 16-10 |

### Kits inversor + batería (con o sin paneles) (29)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 68 | Inversor Sako 1000 W con batería 2000 Wh | MK-437 | 45, 235 | 790 | 870 | 32 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/437/A59600C6A46BD024891718C051886BD5.jpg` | no | visto 19-10 |
| 69 | Inversor Future Tech 3 kW + batería SunDta 5 kWh | MK-421 | 34, 1606, 1268 | 1960 | 2160 | 80 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/421/A5A8267C6B766B1E36D82C0B5B96D37F.jpg` | no | precios vistos: 1960 USD / 2020 USD (vale el más reciente); visto 19-10 |
| 70 | Combo inversor 5 kW (110/220 V) + batería 5 kWh | MK-1672 | 1459, 1608, 1519, 1370, 1279 | 2050 | 2255 | 82 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1672/A5592A6AEA6CB5A3128214B01D3B1CC4.jpg` | no | visto 19-10 |
| 71 | Kit Infinity inversor 3 kW + batería 5 kWh (110 V) | MK-426 | 36, 425, 1271, 1368 | 2110 | 2325 | 86 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/426/A5B916AFEA096E6E82B6443C4072CFF9.jpg` | no | precios vistos: 2110 USD / 2210 USD (vale el más reciente); visto 15-10 |
| 72 | Kit inversor 3 kW con 7 kWh de respaldo | MK-1696 | 1628, 1314, 471, 97, 96, 267, 1490, 1396 | 2310 | 2545 | 94 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1696/A5A21381604F1F10ED87E1BF72849B9F.jpg` | no | precios vistos: 2310 USD / 2410 USD / 2360 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 2750 (MK-1432) = respaldo; visto 19-10 |
| 73 | Combo inversor híbrido 6,2 kW + 1 batería 5,12 kWh | MK-1277 | 228, 37, 429, 1527, 1520, 1609, 1462 | 2560 | 2820 | 104 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1277/A55E34EDA653BC8220EE8DC457FF6A44.jpg` | no | **no publicar**: es el mismo que MK-502 (Sergio, 2805); este queda de respaldo; visto 19-10 |
| 74 | Kit inversor 6 kW con 10 kWh de respaldo | MK-1673 | 223, 1269, 1607, 1455, 1362, 30, 1418 | 2860 | 3150 | 116 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1673/A5BD906BCE3170B50B61A85285E4FEBB.jpg` | no | precios vistos: 2860 USD / 3360 USD / 3710 USD / 3460 USD / 3910 USD (vale el más reciente); visto 19-10 |
| 75 | Kit inversor 3 kW con 7 kWh + 5 paneles 595 W | MK-1551 | — | 3110 | 3425 | 126 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1551/A543929E04568C528F81B949B06097EF.jpg` | no | visto 16-10 |
| 76 | Todo en uno Must 6 kW con 15 kWh | MK-1457 | 95, 264, 469, 1627, 1488, 1395, 1312, 1695 | 3360 | 3700 | 136 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1457/A57F824CC8C923343414029E3BAE5171.jpg` | no | precios vistos: 3360 USD / 3620 USD / 3660 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 4235 (MK-1769) = respaldo; visto 19-10 |
| 77 | Infinity 6 kW con 15 kWh de respaldo | MK-1487 | 1315, 1397 | 3510 | 3865 | 142 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1487/A5558340CB512C3F812EF97DA66D3D96.jpg` | no | **publicar este**; Sergio lo tiene a 4160 (MK-1654) = respaldo; visto 17-10 |
| 78 | Inversor 6 kW + batería 16 kWh | MK-1274 | 427, 1508 | 3710 | 4085 | 150 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1274/A50774A6EFCBF09CADEAA272DF8E537A.jpg` | no | precios vistos: 3710 USD / 3860 USD (vale el más reciente); visto 19-10 |
| 79 | Inversor 6 kW con 15 kWh de respaldo (batería Sako) | MK-1697 | 98, 266, 1550, 470, 1489, 1313 | 3860 | 4250 | 156 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1697/A5D456D1B33DB54FDFE1EA99A1F4E2DE.jpg` | no | visto 19-10 |
| 80 | Combo inversor híbrido 6,2 kW + 2 baterías 5,12 kWh (10,24 kWh) | MK-1278 | 229, 38, 1465, 1369, 430, 1528, 1604 | 4010 | 4415 | 162 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1278/A55E089F54FC0A7893265F6198C37F1A.jpg` | no | **no publicar**: es el mismo que MK-385 (Sergio, 4400); este queda de respaldo; visto 19-10 |
| 81 | Kit todo en uno 6 kW + 15 kWh + 5 paneles Longi 620 W bifaciales | MK-1679 | 1602, 1524 | 4210 | 4635 | 170 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1679/A5092C5A647C542AB3E26776A77F89AA.jpg` | no | precios vistos: 4210 USD / 4430 USD (vale el más reciente); visto 19-10 |
| 82 | Kit 6 kW + 15 kWh + 6 paneles Longi 620 W bifaciales | MK-1731 | 1601, 1523, 1680 | 4360 | 4800 | 176 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1731/A5583DA61D0E6A7C12CFF100541ED9E5.jpg` | no | precios vistos: 4360 USD / 4430 USD / 4760 USD (vale el más reciente); visto 19-10 |
| 83 | Kit 6 kW + 15 kWh + 5 paneles 595 W | MK-1365 | 224, 35, 422, 1272 | 4380 | 4820 | 176 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1365/A5F754119502BB1221C5B9665F30EE2B.jpg` | no | precios vistos: 4380 USD / 4510 USD (vale el más reciente); visto 14-10 |
| 84 | Inversor Must 6 kW + batería Sako 15 kWh | MK-1676 | 233, 42, 1522, 1464, 434 | 4710 | 5185 | 190 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1676/A594B7A6F99F52FDE70A5C8E86994ED1.jpg` | no | **no publicar**: es el mismo que MK-401 (Sergio, 5170); este queda de respaldo; visto 19-10 |
| 85 | Kit fotovoltaico 6,2 kVA + 4 paneles 625 W + batería 5,12 kWh | MK-1677 | 230, 39, 1611, 431, 1460, 1280, 1529 | 4710 | 5185 | 190 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1677/A53EB4159161CA10151C2E6A42122FFB.jpg` | no | **no publicar**: es el mismo que MK-1764 (Sergio, 5170); este queda de respaldo; visto 19-10 |
| 86 | Inversor Must 12 kW + batería 15 kWh | MK-1526 | 1610 | 4910 | 5405 | 198 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1526/A52238C117C8000C54A1C96007BB3DC7.jpg` | no | visto 19-10 |
| 87 | Kit 8 kW con 16 kWh | MK-1674 | 226, 1364, 1456, 33 | 5110 | 5625 | 206 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1674/A55F48DA5F3AC8AE2A62B110D640114C.jpg` | no | precios vistos: 5110 USD / 5160 USD / 5360 USD (vale el más reciente); visto 19-10 |
| 88 | Inversor 12 kW + batería 16 kWh | MK-1698 | 94, 265, 468, 1311 | 5110 | 5625 | 206 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1698/A544145667DAABE2A282015A9D254E9D.jpg` | no | precios vistos: 5110 USD / 5210 USD / 5410 USD / 5450 USD (vale el más reciente); visto 19-10 |
| 89 | Inversor EcoWorthy 10 kW + batería EcoWorthy 16 kWh | MK-1275 | 428 | 5360 | 5900 | 216 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1275/A5F3E10A545862001851029EAA41B7E1.jpg` | no | visto 13-10 |
| 90 | Kit Must 6 kW + 15 kWh + 6 paneles 595 W bifaciales | MK-1458 | 31, 227, 1366, 1273, 423 | 5510 | 6065 | 222 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1458/A556C38368DCBA7304F94DD76E3E42AD.jpg` | no | visto 15-10 |
| 91 | Combo Must 6 kW + batería Sako 15 kWh + 6 paneles bifaciales | MK-1675 | 232, 41, 1600, 1521, 433, 1282, 1372, 1463 | 5710 | 6285 | 230 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1675/A5BD0A5CF9C08DEBC4AD384407B837DA.jpg` | no | **no publicar**: es el mismo que MK-300 (Sergio, 6270); este queda de respaldo; visto 19-10 |
| 92 | Kit Must 12 kW con 15 kWh (sin paneles) | MK-1454 | — | 5860 | 6450 | 236 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1454/A5F737F9665157652201783AB8CBB900.jpg` | no | visto 15-10 |
| 93 | Kit fotovoltaico 6,2 kVA + 6 paneles 625 W + 2 baterías (10,24 kWh) | MK-1678 | 231, 40, 432, 1371, 1461, 1605, 1281, 1530 | 6610 | 7275 | 266 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1678/A5DACEB57213C4FBF91A552349630A3F.jpg` | no | **no publicar**: es el mismo que MK-1765 (Sergio, 7260); este queda de respaldo; visto 19-10 |
| 94 | Kit Must 12 kW + 15 kWh + 12 paneles 595 W | MK-1453 | 32, 225, 1270, 424, 1363 | 7710 | 8485 | 310 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1453/A5F737F9665157652201783AB8CBB900.jpg` | no | precios vistos: 7710 USD / 7960 USD / 8260 USD (vale el más reciente); visto 15-10 |
| 95 | Inversor Must 12 kW + 2 baterías 15 kWh (30 kWh) | MK-1525 | 1603 | 7710 | 8485 | 310 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1525/A538827683660486E659A2A3349779E2.jpg` | no | visto 19-10 |
| 96 | Kit 12 kW con 30 kWh de respaldo | MK-1452 | 1367, 1276 | 9010 | 9915 | 362 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1452/A546E97F8153C7FD450E0F8E3F0D6163.jpg` | no | visto 15-10 |

### Paneles solares (6)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 97 | Panel solar 450 W bifacial | MK-439 | 52, 1287, 1469, 1378 | 150 | 170 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/439/A5F8C9B15311607DE481BA468392B7F3.jpg` | no | precios vistos: 150 USD / 160 USD (vale el más reciente); visto 19-10 |
| 98 | Panel solar 595 W | MK-443 | 56 | 160 | 180 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/443/A545FBA4803783C8464D7617A9E88C26.jpg` | no | visto 15-10 |
| 99 | Panel solar Horay 630 W | MK-1685 | 1535 | 170 | 190 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1685/A50A2D5DB041A26ABD54EB4B5DB93533.jpg` | no | visto 19-10 |
| 100 | Panel solar Skymax 630 W | MK-1290 | 55, 442, 1377 | 185 | 205 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1290/A545AD03D00C5C29E60C68539B601647.jpg` | no | parecido: web 2513 Skymax 620 W (de la tienda, publicado); visto 16-10 |
| 101 | Panel solar Longi 620 W | MK-1288 | 53, 440, 1379 | 190 | 210 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1288/A5228EF00166A15616D5C93A99A057C6.jpg` | no | precios vistos: 190 USD / 205 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 230 (MK-1767) = respaldo; visto 19-10 |
| 102 | Panel solar 550 W bifacial | MK-1289 | 54, 441 | 205 | 225 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1289/A5C72291A96C66F18012AFBDAB12A4E2.jpg` | no | visto 13-10 |

### Cables y accesorios solares (2)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 103 | Cable solar 10 m royal cord calibre 10 (MC4 / XT60i) | MK-1704 | 99, 1629, 472, 1491, 1398, 268, 1316 | 65 | 85 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1704/A558DB47BBE9D16FE61EF68344B68242.jpg` | no | precios vistos: 65 USD / 70 USD (vale el más reciente); **no publicar**: es el mismo que MK-489 (Sergio, 72); este queda de respaldo; parecido: web 1628 (privado, de la tienda); visto 19-10 |
| 104 | Cable solar MC4 a XT60 de 6 m | MK-269 | 1630, 100 | 90 | 110 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/269/A590167C62A67B1C49BEDBB53F7AAE2C.jpg` | no | **no publicar**: es el mismo que MK-149 (Sergio, 105); este queda de respaldo; visto 19-10 |

### Plantas eléctricas (gasolina / gas) (11)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 105 | Planta Sankey 3000 W | MK-1552 | 107 | 630 | 695 | 26 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1552/A5B546BBF54461E3A49604187EB601BB.jpg` | no | precios vistos: 630 USD / 660 USD (vale el más reciente); visto 19-10 |
| 106 | Planta SIGMA Inverter 4000 W | MK-101 | 1399 | 880 | 970 | 36 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/101/limpia-1.jpg` | no | precios vistos: 880 USD / 920 USD (vale el más reciente); **no publicar**: es el mismo que MK-168 (Sergio, 960); este queda de respaldo; visto 19-10 |
| 107 | Planta Firman 8375 W | MK-108 | — | 1090 | 1200 | 44 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/108/A5ECDDEDEC3D6BC773DD90740A7195B4.jpg` | no | visto 13-10 |
| 108 | Planta SIGMA Inverter 6500 W | MK-110 | 1401 | 1160 | 1280 | 48 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/110/A5516324F9F2AA5C8854E7CDFE92BDDF.jpg` | no | precios vistos: 1160 USD / 1240 USD (vale el más reciente); **no publicar**: es el mismo que MK-169 (Sergio, 1265); este queda de respaldo; visto 19-10 |
| 109 | Planta Dual Fuel 12500 W | MK-273 | 1336, 1493, 1321, 105, 1404 | 1670 | 1840 | 68 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/273/A50731FFD2CB7EEB2DB2FDE8C2C6C880.jpg` | no | precios vistos: 1670 USD / 2310 USD / 1970 USD (vale el más reciente); visto 19-10 |
| 110 | Planta Dual Fuel 13000 W | MK-1338 | 1494, 1319, 103, 271 | 1720 | 1895 | 70 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1338/A5BC04352601A7B94C41AB34B2AEF200.jpg` | no | precios vistos: 1720 USD / 2320 USD (vale el más reciente); visto 19-10 |
| 111 | Planta Tri Fuel 12500 W | MK-104 | 1405, 1320, 1337 | 1770 | 1950 | 72 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/104/A52E9ACD56DD44D59AB41FEA53C1BF2A.jpg` | no | precios vistos: 1770 USD / 2610 USD / 1950 USD (vale el más reciente); visto 19-10 |
| 112 | Planta WEN 14500 W modelo 2026 | MK-1705 | 1400, 270, 1317, 109, 1492 | 1950 | 2145 | 78 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1705/A509F6320670832E38A3219D98B338F9.jpg` | no | visto 19-10 |
| 113 | Planta Pulsar 10000 W (gasolina) / 9000 W (gas) | MK-1706 | 1403, 111, 474 | 2270 | 2500 | 92 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1706/A5E5A89528D9EA7F6D143590BE62EF56.jpg` | no | visto 19-10 |
| 114 | Planta Dual Fuel 9500 W 110/220 V | MK-473 | 1402, 1322, 1631, 106, 272 | 2800 | 3080 | 112 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/473/A578B6662C2A317EF4792A85E3DFEF73.jpg` | no | visto 19-10 |
| 115 | Planta Tri Fuel 13500 W | MK-1318 | 102 | 2860 | 3150 | 116 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1318/A52D91D8542521D7EA4359497BA4EB12.jpg` | no | visto 13-10 |

### Neveras, refrigeradores y congeladores (25)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 116 | Nevera Royal 3,5 pies Inverter con llave | MK-1538 | 64 | 240 | 260 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1538/limpia-1.jpg` | no | precios vistos: 240 USD / 250 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 265 (MK-135) = respaldo; visto 19-10 |
| 117 | Nevera Milexus 3,5 pies con llave | MK-248 | 65 | 255 | 275 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/248/A58D71C728A58A24C125A0172DBC898E.jpg` | no | visto 14-10 |
| 118 | Nevera Milexus 4,2 pies con llave | MK-245 | 67 | 255 | 275 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/245/A5D5D579E74D475B785D9B2E9C5EF3E3.jpg` | no | **no publicar**: es el mismo que MK-136 (Sergio, 270); este queda de respaldo; visto 13-10 |
| 119 | Nevera Royal 5,5 pies con cerradura | MK-247 | 63 | 275 | 295 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/247/A5F1F71084CF6554C9193AD58A04D494.jpg` | no | **no publicar**: es el mismo que MK-205 (Sergio, 290); este queda de respaldo; visto 19-10 |
| 120 | Nevera Milexus 6 pies con llave | MK-1382 | 62, 246, 449 | 295 | 315 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1382/A564DD430DD7DFD85F341F9715BE745A.jpg` | no | **publicar este**; Sergio lo tiene a 320 (MK-525) = respaldo; visto 19-10 |
| 121 | Frío Milexus 6,5 pies | MK-127 | 250 | 310 | 345 | 14 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/127/A565D1D9609CD3B34109BB2E35169610.jpg` | no | visto 19-10 |
| 122 | Nevera Royal 7,8 pies con llave | MK-1537 | 1474 | 315 | 350 | 14 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1537/A5152F83C1B51A1CF5D91CB2CF36CAAB.jpg` | no | visto 19-10 |
| 123 | Refrigerador Royal 7,6 pies una puerta | MK-249 | 73 | 345 | 380 | 14 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/249/A5460D2355DFB7DB0209A283328461E9.jpg` | no | visto 19-10 |
| 124 | Refrigerador Milexus 7 pies | MK-1688 | — | 355 | 395 | 16 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1688/A5053DCC1092EFB42F5E906D7FF112F0.jpg` | no | visto 19-10 |
| 125 | Refrigerador Royal 8 pies (congelador abajo) | MK-75 | 1384 | 380 | 420 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/75/A555D4DE56C8D9BE5F4DC67DEA3104E7.jpg` | no | visto 19-10 |
| 126 | Refrigerador Royal 8,5 pies | MK-68 | — | 385 | 425 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/68/A535A94C16C2BF89467A7776EA4FF112.jpg` | no | visto 19-10 |
| 127 | Congelador vertical Premier 145 L | MK-1619 | 1296, 1540 | 395 | 435 | 16 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1619/A5F183FD1FAD16D4795A6274B789B6EF.jpg` | no | **no publicar**: es el mismo que MK-584 (Sergio, 425); este queda de respaldo; visto 19-10 |
| 128 | Refrigerador Lemax 7,5 pies | MK-524 | — | 410 | 455 | 18 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/524/A5E7F14BC682BF76191D2BB7C33AD0EE.jpg` | no | visto 19-10 |
| 129 | Congelador vertical Premier 177 L | MK-1620 | 1297, 1539 | 425 | 470 | 18 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1620/A55382A9FBBA24C2392D935BC58CB0E9.jpg` | no | **no publicar**: es el mismo que MK-585 (Sergio, 460); este queda de respaldo; visto 19-10 |
| 130 | Nevera Royal 10 pies | MK-1741 | — | 430 | 475 | 18 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1741/A54C18E2B86F45D7F7FEB08D6266EFE7.jpg` | no | visto 20-10 |
| 131 | Refrigerador Lemax 10 pies | MK-1421 | — | 430 | 475 | 18 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1421/A5F22062A3F5C0D803363022BE591F3D.jpg` | no | visto 19-10 |
| 132 | Refrigerador Milexus 9,1 pies | MK-74 | — | 455 | 505 | 20 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/74/A591E3FB5A6EC1BCCAFB411953FF8334.jpg` | no | visto 19-10 |
| 133 | Nevera Milexus 11,2 pies ML-CF-319 | MK-1383 | 1295, 450 | 480 | 530 | 20 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1383/A553756B98F2C5311DEB564BFBA44688.jpg` | no | visto 15-10 |
| 134 | Nevera exhibidora vertical AUCMA 7,2 pies | MK-1414 | 1496, 1348 | 485 | 535 | 20 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1414/A545DC84ADF82A3F3E98943235280463.jpg` | no | visto 17-10 |
| 135 | Refrigerador Royal 11 pies | MK-1689 | — | 530 | 585 | 22 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1689/A54EA3624E69A5ACF2B6C92A399AA148.jpg` | no | visto 19-10 |
| 136 | Exhibidora Milexus 13 pies 1 puerta | MK-1334 | 1499, 126 | 610 | 675 | 26 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1334/A5516C39C6FE09239F8CD40DD79EF9BF.jpg` | no | visto 19-10 |
| 137 | Refrigerador LG 14 pies | MK-1690 | 70 | 770 | 850 | 32 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1690/A5998585D58CF350316C49D3DC180852.jpg` | no | precios vistos: 770 USD / 800 USD (vale el más reciente); **publicar este**; Sergio lo tiene a 915 (MK-195) = respaldo; visto 19-10 |
| 138 | Refrigerador Hisense 15,6 pies | MK-72 | — | 810 | 895 | 34 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/72/A591C01D3C0A39EE46FA7DA9665D0B39.jpg` | no | visto 14-10 |
| 139 | Exhibidora vertical Milexus 20 pies doble puerta | MK-1703 | 1636, 1497, 1415, 1555 | 1210 | 1335 | 50 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1703/A5D48DECF8F2783654DB6486BDC53B8D.jpg` | no | visto 19-10 |
| 140 | Freezer exhibidor Focustar 21 pies SD-569BY | MK-1556 | 1416, 1498 | 1680 | 1850 | 68 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1556/A59C17F39D968D6CBA95F6C25E0EA111.jpg` | no | visto 19-10 |

### Lavadoras (7)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 141 | Lavadora semiautomática Milexus 7 kg | MK-1482 | 1411 | 180 | 200 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1482/A58241D475BEF4A21F5CC805F0710E40.jpg` | no | **no publicar**: es el mismo que MK-1251 (Sergio, 200); este queda de respaldo; visto 19-10 |
| 142 | Lavadora semiautomática Estelectric 8 kg | MK-1485 | 1412, 1347 | 180 | 200 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1485/A57616D1E57F17FB0651F0963A56F76F.jpg` | no | visto 19-10 |
| 143 | Lavadora automática Milexus 7,5 kg | MK-1481 | 1409 | 205 | 225 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1481/A574EF7402F43A33D630BB399192C9A8.jpg` | no | **no publicar**: es el mismo que MK-202 (Sergio, 220); este queda de respaldo; visto 19-10 |
| 144 | Lavadora automática Chiq 10 kg | MK-1486 | — | 280 | 300 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1486/A519B08AE2D12BF46FA16D2A82C730E8.jpg` | no | visto 17-10 |
| 145 | Lavadora automática LG (agua fría y caliente) | MK-1413 | 1548 | 305 | 340 | 14 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1413/A5390CC890FD7368E9AD392721C803B5.jpg` | no | **no publicar**: es el mismo que MK-371 (Sergio, 320); este queda de respaldo (comprobar que es el mismo modelo); visto 19-10 |
| 146 | Lavadora secadora al vapor Milexus 10 kg | MK-1694 | 1549, 1408, 1484 | 660 | 730 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1694/A5AF6C9ADE231F64FCB67C028D3088DA.jpg` | no | **no publicar**: es el mismo que MK-1246 (Sergio, 715); este queda de respaldo; visto 19-10 |
| 147 | Lavadora secadora Hisense 15 kg | MK-1483 | 1410 | 680 | 750 | 28 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1483/A55FB08B9C20081304C4C68264F5A73A.jpg` | no | **no publicar**: es el mismo que MK-196 (Sergio, 740); este queda de respaldo; visto 19-10 |

### Splits (aire acondicionado) (4)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 148 | Split Well 1 tonelada WA122W 220 V | MK-1393 | 1309, 465, 1479 | 275 | 295 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1393/A5BC097D7FEF78827FBAA6DFB50729F5.jpg` | no | visto 19-10 |
| 149 | Split Milexus 1 tonelada 220 V | MK-1478 | 1394, 1547 | 280 | 300 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1478/A57E962D89744850A1FDC42AC1640931.jpg` | no | **no publicar**: es el mismo que MK-131 (Sergio, 300); este queda de respaldo; visto 19-10 |
| 150 | Split Milexus 1 tonelada 110 V (12000 BTU) | MK-466 | 91 | 350 | 385 | 14 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/466/A5A4E0E86167E039385DAD9C4D9AEC93.jpg` | no | visto 19-10 |
| 151 | Split Milexus Inverter 1 tonelada 220 V | MK-1693 | 1546, 93, 1310, 1480, 467 | 375 | 415 | 16 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1693/A53DAD7D72544CF5FA0A1755EC6A5C70.jpg` | no | visto 19-10 |

### Televisores (3)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 152 | TV Premier 32" Smart con barra de sonido | MK-124 | 483, 1500, 1333 | 170 | 190 | 8 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/124/A5209DAF51F5F09072A2E0CAEDC389DB.jpg` | no | **no publicar**: es el mismo que MK-1770 (Sergio, 185); este queda de respaldo; visto 19-10 |
| 153 | Smart TV Samsung 40" | MK-123 | — | 250 | 270 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/123/A556EFB39FC2858163DF2924F5ED233C.jpg` | no | **no publicar**: es el mismo que MK-201 (Sergio, 265); este queda de respaldo; visto 19-10 |
| 154 | Smart TV Milexus 43" Full HD | MK-1707 | 482, 1332, 275, 122 | 265 | 285 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1707/A5D8D199E8D8D370AF4336C52E7FDF3F.jpg` | no | visto 19-10 |

### Calentadores de agua (7)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 155 | Calentador Milexus 30 L ML-CA888 | MK-1702 | 481, 1406, 1326, 118, 1633 | 140 | 160 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1702/A5E51AEE5E5B3F9DAD7FC73552B9F62B.jpg` | no | precios vistos: 140 USD / 135 USD (vale el más reciente); visto 19-10 |
| 156 | Calentador instantáneo Milexus 10 L | MK-1700 | 1554, 479, 1324, 1635, 116 | 155 | 175 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1700/A53F916640E88C416421A27EB45F754C.jpg` | no | visto 19-10 |
| 157 | Calentador Milexus 50 L ML-CA888 | MK-1701 | 480, 1325, 117, 1632 | 165 | 185 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1701/A5A34E5D8ED08010E6D308BE7F8F46F4.jpg` | no | visto 19-10 |
| 158 | Calentador eléctrico 13 kW (1300 W) | MK-1495 | 1328, 1407 | 200 | 220 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1495/A5B3C3D5FBD2CF0E71F675939C07B7C2.jpg` | no | **publicar este**; Sergio lo tiene a 240 (MK-1436) = respaldo; visto 15-10 |
| 159 | Calentador instantáneo Milexus 20 L | MK-1699 | 1553, 478, 1323, 1634, 115 | 225 | 245 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1699/A53F916640E88C416421A27EB45F754C.jpg` | no | visto 19-10 |
| 160 | Calentador Royal 100 L 220 V | MK-114 | 477 | 300 | 320 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/114/A5765D421C3DABA5C3FB73F23B507BD5.jpg` | no | visto 19-10 |
| 161 | Calentador Primo 60 L | MK-113 | — | 400 | 440 | 16 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/113/A56831E887DCF9E55A857197362D11DF.jpg` | no | visto 19-10 |

### Ventiladores (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 162 | Ventilador recargable de pedestal Milexus | MK-120 | 1330, 1501 | 85 | 105 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/120/A5EF7EDBB48430CECB6F0E91918D4D49.jpg` | no | visto 19-10 |

### Otros (lámparas, hielo, gomas, inflables, muebles) (2)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 163 | Lámpara solar exterior Vivamax 300 W | MK-1708 | 121, 1331, 1637, 1502, 1557, 1417 | 155 | 175 | 8 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1708/A5980CF6A66D3971622DCEA50EB291C6.jpg` | no | visto 19-10 |
| 164 | Máquina de hielo Coolake K450 (550 lb en 24 h) | MK-1709 | 274, 119, 1329 | 2050 | 2255 | 82 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/1709/A5EC8C2FE47EBCF04507D84CCDCB5F67.jpg` | no | precios vistos: 2050 USD / 2550 USD / 3050 USD (vale el más reciente); visto 19-10 |

### Antiguos (no anunciados desde antes del 13-oct; preguntar si siguen)

#### Combos estación + panel solar (5)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 165 | Combo EcoFlow Delta 3 + panel 595 W | MK-444 | 57 | 800 | 880 | 32 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/444/A542BEA1B98388F63CAA0712256F40D1.jpg` | no | visto 11-10 |
| 166 | Combo EcoFlow Delta 3 Plus + panel 595 W | MK-243 | — | 840 | 925 | 34 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/243/A53A51D5676035F023C14AD551DFEA09.jpg` | no | visto 08-10 |
| 167 | Combo EcoFlow Delta 3 Classic + panel 500 W + cable 10 m | MK-242 | 60 | 850 | 935 | 34 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/242/A59A42045C4E4F6D519BD8A1D153468E.jpg` | no | visto 08-10 |
| 168 | Combo EcoFlow Delta 3 Classic + panel 450 W + cable 10 m | MK-241 | — | 880 | 970 | 36 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/241/A5EAB2478143532B14D67E02DC297DF0.jpg` | no | parecido: web 1619 (privado, de la tienda); visto 08-10 |
| 169 | Combo EcoFlow Delta 3 Max + panel 595 W | MK-446 | 244 | 1230 | 1355 | 50 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/446/A5D365F68A9E082CDCBEF27324FD3B9B.jpg` | no | visto 11-10 |

#### Baterías (2)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 170 | Batería inteligente LiFePO4 5,12 kWh 51,2 V 100 Ah | MK-221 | 15 | 1360 | 1500 | 56 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/221/A525F98DCFB55B40569A179B085D42A9.jpg` | no | **no publicar**: es el mismo que MK-292 (Sergio, 1485); este queda de respaldo; visto 08-10 |
| 171 | Batería Sako 16 kWh | MK-22 | — | 3410 | 3755 | 138 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/22/A53B41AA4AA38FDF83B0DAD438BBB1B4.jpg` | no | visto 07-10 |

#### Kits inversor + batería (con o sin paneles) (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 172 | Kit Must 3000 W + batería Must 5000 Wh | MK-29 | — | 2510 CUP | — | — | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/29/A5005105A1E54D27D58C9E10A247EF17.jpg` | no | anunciado en CUP: preguntar precio en USD; visto 07-10 |

#### Plantas eléctricas (gasolina / gas) (3)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 173 | Planta Globestar 3300 W | MK-112 | — | 500 | 550 | 20 | sí (3) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/112/A5F59086DDDF4FFC524AE1B16978D0BD.jpg` | no | visto 11-10 |
| 174 | Planta Globestar 3300 W con instalación para gas | MK-475 | — | 680 | 750 | 28 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/475/A530FE28D76F30D6C1154095F16600F9.jpg` | no | visto 11-10 |
| 175 | Planta Firman 8375 W con instalación para gas | MK-476 | — | 1250 | 1375 | 50 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/476/A53B08827BFFD25AD78B59F86A476032.jpg` | no | visto 11-10 |

#### Neveras, refrigeradores y congeladores (4)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 176 | Nevera Konka 5 pies | MK-61 | — | 250 | 270 | 8 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/61/A509707F99E7F229DBF8C00AC91458CD.jpg` | no | visto 07-10 |
| 177 | Nevera Sankey 5,5 pies | MK-66 | — | 270 | 290 | 8 | sí (4) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/66/A531ED1D70B0EC67BA984BBCF5AF0943.jpg` | no | visto 11-10 |
| 178 | Refrigerador Hisense 7,3 pies | MK-71 | — | 370 | 410 | 16 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/71/A54D44FCEFAEB64FFC9D5CD95EB10536.jpg` | no | **no publicar**: es el mismo que MK-1216 (Sergio, 410); este queda de respaldo; visto 08-10 |
| 179 | Refrigerador LG Toc Toc 24 pies Inverter | MK-69 | — | 2360 | 2600 | 96 | sí (1) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/69/A59DADB81DE4A97CD5967B17F8C6C267.jpg` | no | visto 07-10 |

#### Splits (aire acondicionado) (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 180 | Split Milexus Inverter 1,5 toneladas 220 V | MK-92 | — | 590 | 650 | 24 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/92/A52530E4A2F95245DF6B79076F07B760.jpg` | no | visto 08-10 |

#### Televisores (1)

| N.º | Producto | SKU (id) | Otros ids | Proveedor USD | Casa Viva USD | Comisión gestora USD | Foto | ¿En web? | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 181 | Smart TV Samsung 55" | MK-125 | — | 530 | 585 | 22 | sí (2) `mercado/8771c6ed-9dbf-497d-b3df-be6697ba2693/125/A550E6F607A232771A02AB30F1039D8A.jpg` | no | visto 07-10 |

---
Datos completos (texto original del anuncio, historial de precios y todas las fotos de cada producto): `productos.json` en esta carpeta.
