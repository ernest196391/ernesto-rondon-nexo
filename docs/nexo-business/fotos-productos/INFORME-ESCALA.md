# Fotos y fichas de Digital Store a escala: listo para aprobar

**Fecha:** noche del 12-oct-2026 (de 21:50 a 23:30, hora de Cuba) · **Hecho por:** Claude (el trabajo corrió en el VPS del bot).
**No se publicó nada.** No se llamó a `/bot/market/publish`, no se cambió ningún `status` (los 682 artículos siguen en «nuevo»), no se envió ningún mensaje y no se reinició el bot.

## Resultado en números

| | Productos |
|---|---|
| Filas de Digital Store en la bolsa (`crm_market_items`, «nuevo») | 682 |
| Fuera desde el principio (categoría «Juguetes Sexuales», #987: no va a la web de Casa Viva sin que lo digas) | 1 |
| **Elegibles** (en el catálogo, no agotados, disponibles) | **681** |
| **Listos con fotos del proveedor** | **254** |
| **Listos con foto oficial de internet** | **15** |
| **Total listos** (fotos en Storage + ficha nueva en la fila) | **269** |
| En las hojas para aprobar (sin los 9 repetidos, ver abajo) | **260 (13 hojas de 20)** |
| Bloqueados: genérico o sin ninguna foto que sirva → `photos_quality.bloqueado = "falta foto real"` | 283 |
| Bloqueados: tienen marca y modelo, pero no hay foto buena (ni del proveedor ni en internet) → `"falta foto buena"` | 129 |
| Fallos técnicos (descargas, IA, subida) | 0 |

Por categoría, listos / elegibles: Móviles y accesorios 76/201 · Computación 53/108 · 2.º local 46/122 · Entretenimiento 43/114 · Electrodomésticos y hogar 27/57 · Moda 18/53 · Vehículos y herramientas 6/26.

**Gasto de OpenAI** (`gpt-4.1-mini`): 1 360 consultas, 4,22 millones de tokens de entrada (45 000 en caché) y 455 000 de salida = **2,40 USD** (el tope era 8). No salió ningún error 429.
Detalle por consulta en el VPS: `/root/archivos/fotos-bolsa/uso.jsonl`.

## Las hojas para aprobar

Están en `docs/nexo-business/fotos-productos/hojas/hoja-01.jpg` … `hoja-13.jpg` (copia en el VPS: `/root/archivos/fotos-bolsa/hojas/`). La lista con los números de cada hoja está en `hojas.json`.
Cada casilla trae la foto principal grande, las demás fotos en pequeño, la posición (1–20), el número de la bolsa (#id), el precio de venta en USD (`my_price`), la nota de la foto, el título nuevo y los avisos.
**Borde ámbar = mírala con calma:** la foto principal toca el borde de la foto original (69 productos; puede estar cortada) o se amplió más de 1,8× (15).

Van ordenadas por lo que más se vende en Cuba: energía y paneles, neveras y cocina, ventiladores, móviles, laptops, consolas… y al final fundas, mochilas y juguetes.

| Hoja | Qué trae | Orden para publicarla (se copia tal cual) |
|---|---|---|
| 01 | Estaciones de energía, paneles, inversor, neveras, batidoras, ventiladores | `APRUEBA 563,572,533,528,539,578,531,556,579,561,576,562,558,543,1175,573,538,1122,1111,565` |
| 02 | Ventiladores, olla arrocera, cocina, móviles | `APRUEBA 1125,1123,1180,1189,532,793,751,794,771,865,705,894,731,1210,1200,1167,544,1133,540,749` |
| 03 | Power banks, laptops | `APRUEBA 860,890,761,1068,717,689,616,692,623,686,605,649,627,641,691,668,640,645,904,1002` |
| 04 | Consolas (Switch OLED, PS4), gabinete, hogar | `APRUEBA 940,948,957,552,534,530,569,567,1192,1107,1165,1201,1143,1126,1100,1124,1150,1155,1156,1103` |
| 05 | Lámparas, PC, tarjeta gráfica, periféricos | `APRUEBA 1104,1129,1163,604,643,681,696,685,674,626,694,608,610,612,631,598,607,629,646,660` |
| 06 | Relojes Samsung, bocinas JBL | `APRUEBA 891,737,755,765,895,877,893,896,878,710,723,797,880,810,897,898,899,744,724,787` |
| 07 | Bocinas, audífonos, impresora 3D, cargadores, fundas | `APRUEBA 839,752,800,812,845,707,811,1081,1080,672,720,779,805,856,778,742,803,704,713,725` |
| 08 | Fundas y correas | `APRUEBA 748,798,809,883,788,727,818,820,840,885,554,715,722,741,614,658,638,624,600,1031` |
| 09 | Mochilas, riñoneras, belleza | `APRUEBA 1062,1020,1055,1027,1047,1049,1057,1030,1042,1033,1023,1037,1029,1017,1028,992,910,1000,1007,634` |
| 10 | Micrófonos, patines, juguetes | `APRUEBA 915,938,1009,1013,909,954,982,1010,1012,946,965,986,912,975,1004,956,967,976,925,688` |
| 11 | Adaptadores, juguetes RC | `APRUEBA 599,606,943,1005,955,953,996,998,636,1162,1166,700,952,990,993,603,743,828,960,1092` |
| 12 | Cascos, adaptadores, accesorios | `APRUEBA 1117,1169,621,850,611,671,773,775,900,924,968,637,670,792,961,735,866,615,736,1076` |
| 13 | Bombas de agua, audífonos, varios | `APRUEBA 1096,1138,780,796,1093,657,991,1215,1137,667,665,1174,1118,1198,1211,1187,1121,1194,1183,1188` |

### Cómo publicar una hoja mañana

1. Mira la hoja. Si todo está bien, escribe en el chat **«Tú»** de WhatsApp (el del bot) la línea de esa hoja, por ejemplo:
   `APRUEBA 563,572,533,528,539,578,531,556,579,561,576,562,558,543,1175,573,538,1122,1111,565`
2. Si algo está mal («mal la 3 y la 15»): busca en `hojas.json` qué número de la bolsa es cada posición (en la hoja 01, la 3 es #533 y la 15 es #1175), **quítalos de la línea** y manda el resto. Si además quieres apartarlos: `DESCARTA 533,1175`.
3. El bot contesta con el enlace de cada producto publicado. Si alguno falla, queda en «aprobado» y dice por qué.

**Ojo, importante:**
- `APRUEBA` **publica directo y visible** en la categoría «Bajo pedido» de casaviva.company (el Core pone `set_status('publish')`), no en borrador «[REVISAR]» como decía `PROCESO.md`. Si prefieres borrador, hay que cambiar el Core antes.
- Manda **una hoja cada vez** y espera la respuesta (cada producto tarda unos segundos en subir).
- **No uses `APRUEBA` con números que no estén en las hojas:** los bloqueados no tienen fotos limpias y el bot las «puliría» con el método viejo.
- No dejo un comando de `node` para el VPS a propósito: `approveAndPublish` no se puede llamar desde fuera de `catalog.js` sin arrancar los temporizadores del bot (resumen de las 10:00, agotados), y eso podría duplicar avisos. La orden del chat es el camino que ya existe y es seguro.

## Qué quedó guardado en cada producto listo (Supabase, `crm_market_items`)

- `photos_clean`: de 1 a 4 rutas en el bucket `mercado`, con el mismo esquema que usa `catalog.js` (`8771c6ed-…/<id>/limpia-N.jpg`). `publishItem` usa estas y **no vuelve a pulirlas**.
- `photos_ok = true`.
- `title` y `description` nuevos (título con marca + modelo + dato clave; descripción de 60–110 palabras en español sencillo, con «Características:» y solo datos del proveedor).
- `photos_quality` (texto JSON): nota y motivo de cada foto usada y descartada, fuente (`proveedor` o `web` con la página oficial), avisos, y **`original_title` / `original_description`** por si hay que volver atrás.
- Los bloqueados solo tienen `photos_quality` con `bloqueado` («falta foto real» o «falta foto buena»), el detalle y sus 3 mejores fotos con el motivo. No se tocó su `photos_clean`, `photos_ok` ni `status`.

Para ver los bloqueados en Supabase (proyecto **nexo-production**):
```sql
select id, title, photos_quality::json->>'bloqueado' as falta, photos_quality::json->>'detalle' as detalle
from crm_market_items
where business_id = '8771c6ed-9dbf-497d-b3df-be6697ba2693' and seller_name = 'Digital Store (Kevin)'
  and photos_quality like '%"bloqueado"%' order by id;
```

## Las reglas que se aplicaron (el código manda sobre la IA)

- Fotos de menos de 400 px de lado corto y fotos repetidas: fuera sin preguntar a la IA (de 2 569 fotos quedaron 2 429).
- **Una consulta de visión por producto**, con todas sus fotos juntas + nombre + descripción. Una foto sirve solo si tiene **nota 7 o más**, es el mismo producto y color, fondo blanco o claro liso, y **no** tiene texto añadido, logo, marca de agua, collage, corte, borrosidad ni cosas que no vienen.
- **Segunda vuelta** (286 productos que tenían alguna foto de 7 pero no pasaban): la IA tuvo que copiar el texto que veía y nombrar los objetos de más; si no podía nombrarlos, no contaba como fallo. Salvó unos 25 productos sin bajar el listón.
- Arreglo con `sharp`: 1200×1200 JPG, blanco puro, 8 % de margen, enfoque suave si se amplió. El fondo casi blanco y los degradados del estudio se aclaran a blanco poco a poco desde los bordes; el relleno se para en el contorno del producto, así las neveras, ollas y calentadores blancos no pierden trozos (se comprobó a ojo). Se rechaza si el fondo no es blanco, si habría que ampliar más de 2×, o si el producto ocupa el 12 % o más de un lado de la foto (está cortado). En la galería no entra ninguna foto que toque el borde.
- Fotos de internet: solo de la web del fabricante o de tiendas grandes, revisadas igual y **comparadas con una foto del proveedor** para que sea el mismo modelo y color. En la galería solo entran fotos de la misma página que la principal (para no mezclar colores).
- Textos: la IA solo puede usar datos del proveedor. Un programa comprueba que **todos los números** del texto están en los datos del proveedor, que no hay precios, «envío», «gratis», «garantía», tiendas, teléfonos ni emojis, y que la web no borraría nada (la web quita de la descripción las cifras largas que parecen teléfonos). En #668 se acortó el modelo «A514-54-501Z» a «A514-54» en la descripción por eso (el título lo lleva completo).
- No se menciona la garantía del proveedor («5 días» en 165 productos): eso lo decide la política de garantía de Casa Viva. Sí se dice «Grado A (reacondicionado)» cuando el proveedor lo pone.

## Fotos oficiales de internet (15 productos)

| # | Producto | Fuente |
|---|---|---|
| 572 | EcoFlow DELTA Pro 3600Wh | us.ecoflow.com (oficial) |
| 528, 570 | AFERIY P210 2400W/2048Wh | aferiy.com (oficial) |
| 556 | BLUETTI Elite 100 Mini | bluettipower.com (oficial) |
| 558 | Panel EcoFlow 160 W | us.ecoflow.com, «NextGen 160W» (la IA lo dio por igual a la foto del proveedor; mirar en la hoja 01, posición 13) |
| 720 | EcoFlow RAPID 65W GaN | us.ecoflow.com (oficial) |
| 751 | Motorola Edge 60 Fusion | motorola.com (oficial; foto del color Pantone Slipstream) |
| 696 | ASUS Dual RX 9060 XT 16GB | asus.com (oficial) |
| 957, 632 | Montech King 95 PRO | montechpc.com (oficial) |
| 530 | Aqara Hub M100 | us.aqara.com (oficial) |
| 752, 800, 707 | JLab GO Pods ANC / GO Pop ANC / GO Pop+ (negros) | jlab.com (oficial) |
| 880 | JBL Clip 5 (negra) | coolblue.nl (tienda grande) |

La página exacta de cada foto está en `photos_quality.fotos[].pagina` y en `scripts/escala/web-fuentes-*.json`.
Se probaron unos 45 productos con marca. No sirvieron: Samsung (A16, A17, A27, A37, Tab A11+: la web de Samsung no da las fotos sin navegador y las de Coolblue traen el rótulo «5G» o salen cortadas; el A17 azul claro es de otro tono), Keurig y JBL (su web bloquea con 403), Tripp Lite (no responde), Gigabyte (403), EBL (solo pancartas).

## Lo que necesita a una persona

1. **Aprobar las 13 hojas** (≈3 min cada una).
2. **9 posibles repetidos** que dejé fuera de las hojas porque el proveedor tiene el mismo nombre y precio dos veces. Tienen sus fotos listas; si de verdad son variantes distintas (por ejemplo, otro color), se aprueban aparte:
   570 (=528 AFERIY P210), 1184 (=1156 lámpara Art Decó), 632 (=957 Montech), 661 (=660 Mini Keyboard i8), 1063 (=1062 mochila azul), 1058 (=1047 riñonera), 709 (=688 cargador USB-C 96W), 1097 (=1096 bomba QDX), 1212 (=1137 audífonos).
3. **Preguntas para Kevin (Digital Store)**, como en el piloto: ¿los Samsung A17 son 4G o 5G? (no se publicaron con foto de internet por eso y por los rótulos).
4. **Los 412 bloqueados** quedan fuera de la web. Por la regla D45, la foto real se pide cuando haya un pedido o una consulta; o se le puede pedir a Kevin la lista entera de una vez (fotos del producto sobre una hoja blanca, con luz de día).
5. Si quieres más fotos de internet: los que tienen marca y modelo están en el VPS, `/root/archivos/fotos-bolsa/web-candidatos.json` (129), ordenados por interés. Keurig, JBL y Samsung se podrían sacar mañana con Claude en Chrome (un navegador de verdad).

## Dónde está todo

- **Programas** (copia aquí en `scripts/escala/` y en el VPS en `/root/vivabot/scripts/fotos-bolsa/`):
  `fotos-bolsa.mjs` (todas las fases: `preparar · bajar · auditar [--v2|--web] · normalizar · textos · subir · bloquear · minis · web-candidatos · web-bajar · estado`; cada una guarda su avance por producto y se puede repetir), `hojas.mjs` (dibuja las hojas en Windows, porque el VPS no tiene fuentes de letra), `coolblue.mjs` (busca fotos en Coolblue).
  Se corre así: `cd /root/vivabot && node scripts/fotos-bolsa/fotos-bolsa.mjs estado`.
- **Datos de trabajo** en el VPS, `/root/archivos/fotos-bolsa/`: `items.json`, y por producto `<id>/orig/` (fotos del proveedor), `fotos.json`, `audit.json` / `audit-v2.json` / `audit-web.json` (respuesta de la IA), `norm.json` (qué foto se eligió y por qué), `final/` y `final-web/` (las 1200×1200), `texto.json`, `subido.json`.
- La clave de OpenAI se leyó del `.env` del VPS dentro de node; no se imprimió en ningún sitio.
