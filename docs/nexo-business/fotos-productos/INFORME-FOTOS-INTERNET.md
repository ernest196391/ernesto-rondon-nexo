# Fotos de internet para los 412 productos de Kevin bloqueados por foto

**Fecha:** 13-oct-2026 · **Hecho por:** Claude. El trabajo corrió en el VPS del bot.
**No se publicó nada.** No se cambió ningún `status`, no se mandaron mensajes, no se reinició el bot y no se escribió nada en Supabase (solo se leyó).

## En pocas palabras

- **Recomiendo** la búsqueda de OpenAI que ya tenemos (forma **a**), pero **solo para los productos con marca**: 152 productos, unos **5,3 USD** y **1 hora** de máquina. Se salvarían unos **65**.
- **Piloto:** pasaron **6 de 20**. De los 10 con marca pasaron 5; de los 10 genéricos, solo 1.
- **Gasto real del piloto: 0,69 USD** de OpenAI (el tope era 3).
- **Genéricos:** con esta forma casi no se salvan (1 de cada 10). Para ellos hace falta la búsqueda por foto de Google (forma **c**) o fotos reales de Kevin (forma **d**).
- **Lo que quedó parado:** Ernesto dijo después «si la forma es buena, súbelas sin mi autorización». Al ir a lanzar los 152, **el control de permisos de esta sesión lo bloqueó**. No lo rodeé. Por eso los 6 buenos del piloto **solo están en archivos**, no en la bolsa. Abajo dejo los pasos para seguir.

## 1. Cómo son los 412

En `crm_market_items` de Digital Store hay 435 artículos en «nuevo»:

- **412 bloqueados por foto.**
- 13 rechazados en la revisión del 12-oct.
- 9 posibles repetidos.
- 1 artículo sensible (#987).

| Grupo | Productos | Qué son |
|---|---|---|
| **Con marca y modelo** | **129** | `falta foto buena`. 108 tienen fotos del proveedor con texto, collage o logo, como las de los anuncios de Amazon. 20 ya se probaron en internet el 12-oct (Samsung, Keurig, JBL, Gigabyte…). |
| **Con marca, sin modelo claro** | **27** | Por ejemplo: power bank QUIKCELL, vitrina JINGHAN, nevera Iceshere. |
| **Genéricos con foto del proveedor** | **248** | 181 tienen fotos con texto, collage o logo: casi seguro salen de un anuncio de Amazon, AliExpress o Temu. 23 son fotos de ambiente o caseras, 9 tienen nota baja y 35 tienen otro fallo (fondo, corte o cosas de más). Abundan juguetes (31), accesorios de móvil (26), mochilas (14), cosas del hogar y lámparas. |
| **Sin ninguna foto que sirva** | **8** | Las fotos son pequeñas o repetidas. 6 tienen marca en el nombre: 2 Mushkin, HP ProDesk, Motorola Moto G06, Revvl Tab 2 y la escalera TITANKIT. Los otros 2 son juguetes de perro. |

Contando también los de «marca, sin modelo», **202 productos tienen fotos que parecen de anuncio.**
Las fotos de Kevin están todas en su Cloudinary, así que no se puede saber de qué tienda salieron.

## 2. Formas de encontrar las fotos

### (a) Búsqueda web de OpenAI (Responses API, `web_search`), con la clave que ya hay

- **Precio oficial** ([developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing), mirado hoy): **10 USD por cada 1 000 búsquedas** (de texto o de imagen), más los tokens del modelo.
- La herramienta tiene **búsqueda de imágenes** (`search_content_types: ["image"]`). Devuelve el enlace directo de la foto y la página donde sale.
- **Ojo:** con `gpt-4.1-mini` no devuelve fotos, solo páginas. Lo probé una vez y costó 0,017 USD. Con `gpt-6-luna` (0,10 USD por millón de tokens de entrada y 0,50 de salida) sí las devuelve.
- **Coste real en el piloto:** 0,020 USD por producto en la búsqueda (1,85 búsquedas de media, 10 s).
- Con la revisión y la verificación de las fotos, todo sale a unos **0,035 USD por producto**.
- **Acierto:** 50 % con marca y 10 % en genéricos.
- **A favor:** ya funciona, no necesita navegador ni cuentas nuevas y encuentra fotos en tiendas de medio mundo. Así salieron el Samsung y el JBL que el 12-oct fallaron.

### (b) Búsqueda por foto (Google Lens o Bing Visual Search) desde un navegador de verdad

No la usé; solo describo cómo sería. Con Claude en Chrome:

1. Se sube la foto del proveedor a Google Lens.
2. Se miran las «coincidencias exactas».
3. Se abre el anuncio original (Amazon o AliExpress) y se apunta el enlace de la foto principal.
4. Ese enlace pasa por los mismos programas de bajar, revisar y verificar.

- **Tiempo:** de 2 a 4 minutos por producto. Los 238 genéricos que quedan serían unas **8 a 16 horas** de agente, por tandas.
- **Precio:** 0 USD aparte de la suscripción de Claude.
- **Riesgo:** Google puede pedir «tráfico inusual» o un CAPTCHA. Ahí hay que parar; no se salta.
- La API de Bing para buscar por foto **ya no existe**: Microsoft cerró las APIs de Bing el 11-ago-2025 ([aviso de Microsoft](https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement)).
- **Es la mejor forma de encontrar el anuncio exacto de un genérico.** Pero el piloto enseñó que esos anuncios casi siempre traen cosas de más en todas las fotos: verduras, palillos, la caja o un televisor. Calculo que salvaría un 10–20 % más de los genéricos; es una estimación, no lo he medido.

### (c) Google (cuando Ernesto cree la clave)

- **Cloud Vision, «Web Detection»** (búsqueda por foto con API). Es la opción que más ayuda a los genéricos.
  - **1 000 fotos al mes gratis**; después, 3,50 USD por cada 1 000 ([cloud.google.com/vision/pricing](https://cloud.google.com/vision/pricing)). **Los 412 caben en el mes gratis.**
  - Devuelve copias exactas de la foto del proveedor en otras webs (a veces más grandes) y las páginas donde sale. Así se llega al anuncio original sin navegador.
  - Necesita un proyecto de Google Cloud con facturación (tarjeta).
- **Gemini con búsqueda de Google** ([ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)):
  - Gemini 3 y posteriores: 5 000 búsquedas al mes gratis, luego 14 USD por cada 1 000.
  - Gemini 2.5 Flash: 1 500 al día gratis, luego 35 USD por cada 1 000. Gemini 2.5 Flash-Lite cuesta 0,10 USD por millón de tokens de entrada y 0,40 de salida.
  - Devuelve texto y enlaces, no fotos. Sirve para productos con marca, igual que (a), y casi gratis con el cupo.
  - La búsqueda de imágenes solo está en los modelos de imagen (Nano Banana 2.1 y 3.1 Flash Image).
- **Custom Search JSON API: no usar.** Está cerrada a clientes nuevos y se apaga el 1-ene-2027 ([Brave, resumen del cierre](https://brave.com/learn/google-api-shutdown/)).

### (d) Pedirle las fotos a Kevin

- **Precio:** 0 USD. **Tiempo:** el de Kevin.
- Las fotos que tiene ya son las de los anuncios: pedirle «las fotos» sin más no arregla nada. Hay que pedirle **foto real del producto sobre una hoja blanca, con luz de día**.
- Para muchos genéricos es la **única forma segura**. Muchas neveras de exhibición, cafeteras, lámparas y ventiladores tienen una sola foto suya, de ambiente, que no sale de ningún anuncio.
- Por la regla D45, el bot solo le escribe al proveedor cuando hay un pedido o una consulta. Pedirle la lista entera de una vez lo decide Ernesto.

## 3. El piloto (20 productos)

### Cómo se hizo

Todo con los programas que ya había, más 4 programas nuevos de la carpeta de trabajo (`/root/archivos/fotos-bolsa/piloto-web/`):

1. **Buscar** (`buscar.mjs`): búsqueda de imágenes con `gpt-6-luna`. Recibe nombre, descripción, marca, modelo y la foto del proveedor, y pide el mismo modelo y color, con fondo blanco y en la web del fabricante o una tienda grande.
2. **Bajar** (`fotos-bolsa.mjs web-bajar`): se bajaron 127 fotos.
3. **Revisar** (`auditar --web`, `gpt-4.1-mini`): con la foto del proveedor como referencia.
4. **Arreglar** (`normalizar`): 1200×1200 sobre fondo blanco.
5. **Verificación nueva** (`verificar.mjs`, `gpt-6-sol`): compara cada foto final con la del proveedor, las dos en alta resolución. Obliga a decir las diferencias concretas (aspas, enchufes, botones), el texto o logo añadido y las cosas de más (caja, televisor, mano). Si algo falla, la foto se aparta y se repite con las demás, como mucho 2 vueltas.

**La verificación hacía falta.** La revisión normal de la IA dio por buenos 11 productos y **5 estaban mal**:

- 1190 era otro ventilador.
- 553 era solo la caja.
- 964 salía con un televisor.
- 577 llevaba el logo añadido.
- 555 salía con la caja.

La verificación los paró todos. Yo miré a ojo las 20 comparaciones y coincido con ella. Solo en 759 creo que fue demasiado estricta.

### Resultado

| # | Producto | Resultado | Por qué / de dónde |
|---|---|---|---|
| 542 | PECRON E300LFP 288 Wh | **pasa** | pecron.com (fabricante) |
| 807 | Apple iPad 9.ª gen. 64 GB plata | **pasa** | pigu.lt (tienda grande de Lituania) |
| 786 | Samsung A27 6/128 negro | **pasa** | galaxus.fr. El 12-oct había fallado. |
| 695 | Lenovo V15 G6 ARP | **pasa** | idealo.de (comparador). Toca el borde; mirado a ojo, sale entera. |
| 892 | JBL PartyBox Encore Essential | **pasa** | de.jbl.com. El 12-oct daba 403. |
| 553 | Air Mouse G10 (genérico) | **pasa** | walmart.com. Salió en la 2.ª vuelta. |
| 577 | EcoFlow DELTA 3 Classic | no | La foto oficial que queda es la europea (enchufes Schuko) y la de eBay trae el logo añadido. |
| 759 | Infinix HOT 70 Pro 5G+ | no | La verificación ve apagado el módulo de luces de la cámara. Seguramente es el mismo móvil; la fuente es una web de reseñas. |
| 690 | Dell Inspiron 15 3535 | no | Solo se pudieron bajar 2 fotos, y las dos tienen texto. |
| 555 | O-Cedar EasyWring | no | Todas las fotos enseñan la caja. |
| 581 | Fire TV Stick 4K Plus | no | Todas enseñan la caja o son infografías. |
| 574, 1136, 767, 580 | Batidora USB, ventilador 24", power bank mini, dispensador | no | Se encontraron otros modelos. |
| 1190 | Ventilador 3 en 1 | no | Otro modelo (3 aspas en vez de 5). |
| 557, 913 | Picadora 16 en 1, batería electrónica G7 | no | Es el mismo producto, pero todas las fotos traen verduras, palillos o cables que la descripción no dice. |
| 964 | Consola retro | no | Sale un televisor y el adorno es distinto. |
| 551 | Marco digital WiFi | no | Todas las fotos tienen texto encima. |

**Hoja para aprobar:** `hojas/piloto-web-01.jpg`, con los 6 que pasan. Cada casilla dice de qué web sale la foto. Sus números están en `hojas/revision-web.json`.

### Gasto real del piloto: 0,69 USD

| Qué | Consultas | USD |
|---|---|---|
| Búsquedas `gpt-6-luna` (37 búsquedas web) | 20 | 0,396 |
| Prueba con `gpt-4.1-mini` (no devuelve fotos) | 1 | 0,017 |
| Revisión de fotos de internet `gpt-4.1-mini` (`auditar --web`, con repeticiones) | 30 | 0,119 |
| Verificación `gpt-6-sol` | 29 | 0,147 |
| Verificación de prueba `gpt-4.1-mini` (para comparar; dio lo mismo) | 11 | 0,011 |
| **Total** | | **0,69** |

Detalle por consulta: `web/uso-piloto.jsonl` y, en el VPS, las líneas 1361–1390 de `uso.jsonl`.
Los costes están calculados con los tokens que devuelve OpenAI y los precios oficiales. En `gpt-4.1-mini` sumé de más el bloque fijo de 8 000 tokens por búsqueda, para ir sobre seguro.

## 4. Cuántos se pueden salvar y cuánto cuesta

| Grupo | Productos (sin el piloto) | Acierto esperado | Salvados | USD | Tiempo de máquina |
|---|---|---|---|---|---|
| Con marca y modelo | 119 | ~50 % | ~60 | ~4,2 | ~50 min |
| Con marca, sin modelo + sin foto con marca | 33 | ~25 % | ~8 | ~1,2 | ~15 min |
| **Total con marca (lo que recomiendo)** | **152** | | **~65–70** | **~5,3** | **~1 h** (o 20 min en 4 tandas) |
| Genéricos, con la forma (a) | 238 | ~10 % | ~25 (entre 5 y 50) | ~8,3 | ~1,5 h |
| **Los 412 con la forma (a)** | | | **~95 (23 %)** | **~14,4 en total** | ~2,5 h |

- Con 10 productos por grupo, el acierto puede variar mucho. Lo más probable es que con marca se salven **entre 45 y 75**.
- Cada producto con marca salvado cuesta unos 0,08 USD. Cada genérico, unos 0,35 USD.
- **Tiempo de una persona:** hojas de 20, unos 3 minutos cada una. Para unos 70 productos son 4 hojas, unos 12 minutos.
- **Con Google Vision** para los genéricos (gratis para 412) quizá se salven 20–40 más. Los otros ~250 genéricos necesitan la foto real de Kevin.

## 5. Riesgos

- **Foto de otro modelo, otro color u otra versión.** Pasó de verdad en el piloto:
  - Enchufes europeos en vez de americanos (EcoFlow).
  - 3 aspas en vez de 5 (ventilador).
  - Solo la caja (Air Mouse).
  - Un televisor de más (consola).

  La revisión normal de la IA se equivocó en 5 de 11. Con la verificación estricta no se coló ninguna mala, a cambio de rechazar quizá una buena (759).
  **La hoja aprobada por una persona sigue siendo obligatoria.** Hay que mirar con más cuidado los móviles (rótulo «5G», versión de cada país), las estaciones de energía (tipo de enchufe) y los colores.
- **Derechos de las fotos.** Las fotos son del fabricante o de la tienda.
  - Es lo normal en una tienda que vende el producto original, y la regla D44 permite usar fotos de internet del mismo producto con su fuente.
  - El riesgo es más bajo con fotos del fabricante y más alto con fotos de vendedores (eBay) o de anuncios de genéricos, que son del vendedor.
  - Qué hacer: dar preferencia al fabricante, guardar la página de cada foto (`subir` la guarda en `photos_quality.fotos[].pagina`) y quitar la foto si alguien lo pide.
- **Bloqueos.** Dieron 403 ripley.com.pe y bgelectronics.eu, y 404 un servidor de fotos. Se apuntaron y se saltaron. No apareció ningún CAPTCHA y no se saltó nada. Solo se bajó la foto concreta que dio la búsqueda (una petición por foto).
- **Gasto.** Los programas paran solos al llegar al tope. Con `PW_TOPE` se fija el total del trabajo de hoy, contando el piloto.

## 6. Lo que quedó parado por el permiso

Al preparar la tanda de los 152 con marca, **el control de permisos automático de esta sesión bloqueó la acción** («modificar recursos compartidos»). No lo intenté de otra forma. Por eso:

- **No se escribió nada en Supabase.** Los 6 buenos del piloto están solo en archivos.
- **No se lanzó la escala.** Las listas están preparadas en `web/lotes.json`.
- En el VPS solo quedó tocado lo de los 20 del piloto, en la carpeta de trabajo:
  - En cada `/root/archivos/fotos-bolsa/<id>/`: `busqueda-web.json`, `web/`, `audit-web.json`, `final-web/` y `verificacion.json`, y `norm.json` rehecho (el de antes está en `norm-1012.json`).
  - En 786 y 892, las fotos web del 12-oct se movieron a `web-1012/`.
  - A 577 y 964 los dejé como «no listos» a propósito, para que un `subir` sin filtro no suba sus fotos rechazadas.
- **No se tocó** `/root/vivabot`, ni el Core, ni `ESTADO.md`, ni `revision.json`.

## 7. Siguiente paso

1. **Ernesto (o el coordinador) mira `hojas/piloto-web-01.jpg`** (6 productos).
2. **Si están bien, dejarlos listos en la bolsa** (en el VPS; esto no publica nada). Primero los textos y luego la subida:
   ```
   cd /root/vivabot
   FB_BUDGET=4 node scripts/fotos-bolsa/fotos-bolsa.mjs textos --ids 542,807,786,695,553,892
   node scripts/fotos-bolsa/fotos-bolsa.mjs subir --ids 542,807,786,695,553,892
   ```
   Hace falta `--ids` siempre.
3. **Publicar.** `publicar-hoja.mjs` solo lee `revision.json` y se niega con estos números. Hay que decidir una de dos cosas:
   - darle una opción `--revision revision-web.json`;
   - o publicarlos con `APRUEBA` en el «Tú», pero solo **después** del paso 2.
4. **Escala con marca (152, unos 5,3 USD)**, con permiso para escribir en el VPS:
   1. Copiar `web/lotes.json` al VPS.
   2. En `/root/archivos/fotos-bolsa/piloto-web/`, correr `PW_TOPE=15 bash ciclo.sh <números> m1` en tandas de unos 40.
   3. `node resultado.mjs --ids …` dice cuáles pasan.
   4. Con esos: hojas `web-NN.jpg` (`piloto-hoja.mjs` + `scripts/escala/hojas-web.mjs`), `textos` y `subir`.
5. **Genéricos:** cuando Ernesto cree la clave de Google, probar Cloud Vision «Web Detection» con 20 genéricos. Mientras tanto, decidir si se le pide a Kevin la foto real de los que más interesan (neveras de exhibición, ventiladores, cafeteras, lámparas).

## Dónde está todo

- **Este informe:** `docs/nexo-business/fotos-productos/INFORME-FOTOS-INTERNET.md`.
- **Hoja:** `hojas/piloto-web-01.jpg`. **Lista:** `hojas/revision-web.json`, con el mismo formato que `revision.json` más un `aviso` y las `fuentes`.
- **Datos:**
  - `web/clasificacion.json`: los 412, uno a uno.
  - `web/resultado-piloto.json`: los 20, con la página de cada foto.
  - `web/lotes.json`: listas para la escala.
  - `web/uso-piloto.jsonl`: el gasto.
  - `web/piloto-web-hojas.json`.
- **Programas:**
  - `scripts/escala/web/`: `buscar.mjs`, `fuentes.mjs`, `verificar.mjs`, `resultado.mjs`, `ciclo.sh`, `clasificar.mjs`, `comparar.mjs`, `gasto.mjs`, `fb-budget.mjs`, `comun.mjs` y `piloto-hoja.mjs`.
  - `scripts/escala/hojas-web.mjs`: hojas que dicen de qué web sale cada foto y no sugieren `APRUEBA`.
  - Copia en el VPS: `/root/archivos/fotos-bolsa/piloto-web/`.
- La clave de OpenAI se leyó del `.env` dentro de node; no se imprimió en ningún sitio.
