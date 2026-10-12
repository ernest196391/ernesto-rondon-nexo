# Marketplace, 12-oct-2026: qué publicar ya, qué se busca y qué falta

**Fecha:** 12-oct-2026 (tarde) · **Autor:** Claude · **Para:** Ernesto
**Tipo de trabajo:** solo lectura. No se cambió nada en la base de datos ni en el código, y no se mandó ningún mensaje a nadie.
**Viene de:** `MARKETPLACE-PIEZAS-1-2-6.md` (pieza 1: demanda) y `demanda/2026-10-11-revolico.md`.

Cómo leerlo:
- **Comprobado** = lo miré hoy en la base de datos, en el código o en la web.
- **Suposición** = lo que creo, sin pruebas. Hay que confirmarlo.

---

## 0. En 1 minuto

1. **La bolsa tiene 525 artículos** de 3 grupos (Comprobado). Casi todos vienen de 2 vendedores: **Sergio Hernández** (252) y **"LJH"**, del grupo Electro L Q Nesecitas (272). Cada grupo es **un solo vendedor**.
2. **Ninguno tiene FOTOS OK** (0 de 525). Con tu regla, hoy no se puede publicar nada todavía. La buena noticia: **con un solo «sí» de Sergio** se desbloquean los 10 primeros, porque los 10 son suyos.
3. **Ojo: el bot no frena la publicación sin FOTOS OK** (Comprobado en el código del VPS). Si escribes `APRUEBA`, publica igual. Por eso, primero `FOTOS OK` y después `APRUEBA`.
4. **Revolico me bloqueó**: Cloudflare respondió 403 («Just a moment…») hasta al archivo `robots.txt`. **Paré en la primera consulta**, como mandan las reglas. Hoy **no hay una lista nueva de «los 20 más vistos»**. Uso la muestra del 11-oct (100 anuncios), que es pequeña.
5. **Cruce:** para lo que más se mira en Revolico (**neveras, ventiladores recargables, lavadoras, splits y cocinas u hornos**) **sí hay proveedor**, y a precio de mercado o más barato. **Faltan:** olla Reina y arrocera, microondas, cocina de inducción, protector de voltaje, máquina de coser y de pelar.
6. **El 79 % de la bolsa es energía** (baterías, inversores, estaciones, plantas, paneles), y **de eso no tenemos ningún dato de demanda** (la muestra de Revolico solo miró Electrodomésticos).

---

## 1. La bolsa de los grupos (Comprobado, base `crm_market_items`)

### 1.1 Números

| | Electrodomésticos SERGIO HERNANDEZ | Electro L Q Nesecitas | Casa bella-Mayorista |
|---|---|---|---|
| Vendedor | Sergio Hernandez | LJH | Yileivis |
| Artículos | 252 (todos «nuevo») | 272 (269 nuevos, 2 aprobados, 1 descartado) | 1 |
| Vistos del 10 al 12-oct | 167 | 123 | 0 |
| Con 2 fotos o más | 100 | 89 | — |
| Anunciados 3 veces o más | 50 | 30 | — |
| Cumplen todo: USD + 2 fotos o más + vistos del 10 al 12-oct | **83** | **53** | — |
| Mensajes del grupo en 3 días | 335 | 135 | 0 |

- **Todo es reciente:** se empezó a capturar el 7-oct, así que los 525 se vieron en los últimos 7 días. Hoy (12-oct) se vieron 85.
- **De qué son** (aproximado, por palabras del título): **≈413 de energía** (79 %). El resto: 37 neveras, 19 televisores, 11 lavadoras, 8 ventiladores, 7 splits, 5 cocinas u hornos, 5 calentadores y unos pocos más (batidora, cafetera, bicicleta, silla de oficina…).
- **«Veces visto» NO es demanda.** Cuenta cuántas veces **el proveedor volvió a anunciar** el producto. Los dos proveedores repiten su catálogo casi entero cada día (por ejemplo, Sergio a las 12:26 de hoy). Sirve para saber que **todavía lo tiene**, no que la gente lo pida.

### 1.2 Problemas encontrados

| Problema | Cuántos | Detalle |
|---|---|---|
| **Sin FOTOS OK** | **525 de 525** | Nadie ha dado permiso todavía. |
| Sin precio | 0 | Todos tienen precio. |
| Solo en CUP | 1 | **#29** «Kit Inversor MUST 3000W + Batería MUST 5000Wh» a «2.510 CUP». Seguro que son USD mal leídos. No tiene tu precio. |
| Sin foto | 2 | **#128** «Artículo no identificado» y **#130** «Electrodoméstico (sin especificar)». Además, el título no sirve. Para descartar. |
| Solo 1 foto | 334 | Se pueden publicar, pero la ficha queda pobre. |
| Fotos ya pulidas | 12 | El resto se pule solo al aprobar (tarda un poco). |
| Visto una sola vez | 351 (67 %) | La mayoría son el mismo producto con otro título (ver la fila siguiente). |
| **Duplicados del mismo vendedor** | 525 filas ≈ **317 productos distintos** (cálculo mío, aproximado) | Si la IA escribe el título un poco distinto («150Ah» o «150 Ah», «Eco-Humsienk» o «Eco Humsienk»), el bot crea **otro artículo**. Ejemplo: la batería Eco Humsienk 5,12 kWh sale **8 veces**. |
| **El mismo producto en los dos grupos** | 37 productos (150 filas) | Los dos venden casi el mismo catálogo, con 5 o 10 USD de diferencia. **Suposición:** los dos revenden del mismo almacén o importador. |
| Mismo producto, precio muy distinto | 11 | **EcoFlow Delta 3 Max: LJH 1.090 y Sergio 1.230** (140 USD de diferencia). Delta 3 Ultra: 1.700 y 1.900. Delta 3 Plus: 700 y 820. Batería EcoWorthy 16 kWh: 3.550 y 3.950. Puede que no sea el mismo modelo o lo mismo incluido: **hay que preguntarlo antes de vender**. |
| Título demasiado general | ≈39 | «Batería para inversores», «Bateria 10 kWh» (**#24**, que ya está aprobado), «Inversor 5 kW», «OUPES estación de energía»… Sin marca ni modelo no se puede publicar bien. |
| Tu precio sin ganancia | 0 | Ningún artículo tiene tu precio igual o por debajo del del proveedor. Cómo está el margen: 411 artículos al 5 % (más de 300 USD), 69 con +10 USD y 44 con +5 USD. |
| Margen distinto para el mismo producto | 6 | La IA llama a veces «pequeño» y a veces «grande» al mismo producto. Ejemplo: TV Premier 32" a 170 o a 175, bicicleta a 205 o a 210. |
| Muy caros para empezar | 102 de más de 3.000 USD | Kits y combos de 4.000 a 8.700 USD. Llevan instalación: mejor no ponerlos en la primera tanda. |
| Aprobados pero no publicados | 2 | **#24** «Bateria 10 kWh» y **#25** «Batería extra EcoFlow Delta 2» (los dos de LJH): están «aprobado», pero **sin enlace en la web**. Eso pasa cuando la publicación falla. No encontré el motivo en los registros. |
| Descartado | 1 | **#70** Refrigerador LG 14 pies de LJH (800 USD). Sergio vende el mismo a 830 (#195). |

### 1.3 Los 30 mejores para publicar ya

Cómo los elegí:
- precio en USD;
- 2 fotos o más;
- visto del 10 al 12-oct;
- anunciado varias veces;
- título claro;
- menos de 2.000 USD;
- un solo artículo por producto.

Primero va lo que más se mira en Revolico (hogar y frío) y después la energía.
**Los 30 tienen FOTOS OK = no.** «Veces» = cuántas veces se anunció ese artículo.

| # | id | Artículo | Proveedor (USD) | Tu precio (USD) | Grupo | Veces | Fotos | Último |
|---|---|---|---|---|---|---|---|---|
| 1 | 172 | Ventilador recargable 20000 mAh | 58 | 63 | Sergio | 6 | 4 | 12-oct |
| 2 | 205 | Nevera Royal 5,5 pies | 270 | 280 | Sergio | 6 | 4 | 12-oct |
| 3 | 201 | Smart TV Samsung 40" | 255 | 265 | Sergio | 6 | 4 | 12-oct |
| 4 | 133 | Lavadora automática Samsung 9 kg | 275 | 285 | Sergio | 5 | 4 | 12-oct |
| 5 | 134 | Nevera Hisense 7,3 pies | 370 | 389 | Sergio | 3 | 3 | 10-oct |
| 6 | 202 | Lavadora automática Milexus 7,5 kg | 200 | 210 | Sergio | 5 | 4 | 12-oct |
| 7 | 131 | Split Milexus 1 tonelada | 280 | 290 | Sergio | 4 | 4 | 12-oct |
| 8 | 139 | EcoFlow Delta 3 Classic 1024 Wh | 600 | 630 | Sergio | 4 | 4 | 10-oct |
| 9 | 169 | Planta eléctrica SIGMA Inverter 6500 W | 1.230 | 1.292 | Sergio | 6 | 4 | 12-oct |
| 10 | 175 | Horno Premier 45 L con asador | 160 | 170 | Sergio | 3 | 3 | 12-oct |
| 11 | 135 | Nevera Royal 3,5 pies | 245 | 255 | Sergio | 6 | 4 | 12-oct |
| 12 | 136 | Nevera Milexus 4,2 pies (119 L) | 250 | 260 | Sergio | 6 | 4 | 12-oct |
| 13 | 132 | Lavadora semiautomática Premier 9 kg | 220 | 230 | Sergio | 4 | 4 | 10-oct |
| 14 | 369 | Cocina Premier 20" | 210 | 220 | Sergio | 4 | 3 | 12-oct |
| 15 | 187 | Ventilador recargable Elfo 15000 mAh | 90 | 95 | Sergio | 8 | 4 | 12-oct |
| 16 | 120 | Ventilador recargable de pedestal Milexus | 85 | 90 | LJH | 3 | 3 | 11-oct |
| 17 | 68 | Refrigerador Royal 8,5 pies | 385 | 404 | LJH | 3 | 3 | 11-oct |
| 18 | 195 | Refrigerador LG 14 pies | 830 | 872 | Sergio | 6 | 4 | 12-oct |
| 19 | 197 | Refrigerador Hisense Side by Side 16 pies | 840 | 882 | Sergio | 6 | 4 | 12-oct |
| 20 | 196 | Lavadora-secadora Hisense 15 kg | 670 | 704 | Sergio | 5 | 4 | 12-oct |
| 21 | 173 | Batidora de mano Midea 200 W | 35 | 40 | Sergio | 6 | 4 | 12-oct |
| 22 | 174 | Cafetera espresso Royal | 55 | 60 | Sergio | 6 | 4 | 12-oct |
| 23 | 101 | Planta eléctrica SIGMA Inverter 4000 W | 920 | 966 | LJH | 3 | 3 | 11-oct |
| 24 | 138 | Batería extra EcoFlow Delta 2 1024 Wh | 600 | 630 | Sergio | 4 | 4 | 12-oct |
| 25 | 311 | EcoFlow Delta 3 Max 2048 Wh | 1.230 | 1.292 | Sergio | 4 | 4 | 12-oct |
| 26 | 146 | OUPES Exodus 992 Wh | 490 | 515 | Sergio | 4 | 4 | 10-oct |
| 27 | 147 | OUPES Mega 1 Lite | 680 | 714 | Sergio | 4 | 4 | 10-oct |
| 28 | 159 | Batería 12,8 V 150 Ah para inversores | 400 | 420 | Sergio | 3 | 3 | 10-oct |
| 29 | 157 | Inversor bifásico Must 6 kW | 1.050 | 1.103 | Sergio | 6 | 4 | 12-oct |
| 30 | 144 | Jackery HomePower 3000 (3072 Wh) | 1.620 | 1.701 | Sergio | 4 | 4 | 10-oct |

**Notas de la tabla:**
- **#205, #201, #139, #169, #138, #159:** LJH tiene el mismo producto, con 5 o 10 USD de diferencia.
- **#311 EcoFlow Delta 3 Max:** LJH lo anuncia **140 USD más barato** (1.090, #409). Antes de vender, pregunta a los dos qué incluye cada uno.
- **#195 LG 14 pies:** descartaste el de LJH (#70). Si fue por algo del producto, descarta también este.
- **#131 Split Milexus a 280:** LJH anuncia el Milexus de 1 tonelada a 350 (110 V). **Suposición:** el de Sergio puede ser otro modelo (¿220 V?). Pregúntalo.
- **#138** es el mismo producto que **#25**, que ya aprobaste en LJH (610 USD).
- **Fuera de esta lista a propósito:** kits y combos de más de 3.000 USD, baterías con título general y cables, paneles o transfer (no los busca el cliente de Casa Viva).

---

## 2. ¿Qué se busca en Revolico? (pedido: los ~20 más vistos de los últimos 3 días)

### 2.1 Qué hice hoy (Comprobado)
- **1 sola consulta:** `https://www.revolico.com/robots.txt`, con curl, como un navegador normal.
- **Respuesta:** HTTP **403**, con la página de Cloudflare «Just a moment…» («Enable JavaScript and cookies to continue»).
- **Paré ahí.** No reintenté, no usé un navegador automático, no usé servicios que «pasan Cloudflare» y no creé ninguna cuenta. Es la regla de `MARKETPLACE-PIEZAS-1-2-6.md`: «si te bloquean, para».
- El 11-oct, curl sí entraba y solo se bloqueaba al programa en Node. **Hoy Revolico bloquea también a curl.**

### 2.2 Lo único que tenemos de Revolico: la muestra del 11-oct (100 anuncios de Electrodomésticos, renovados en 14 minutos)
Solo sirve de pista; **no son 3 días** y **no son «los 20 más vistos»**. Además, Revolico no ordena por vistas, y las vistas son las de toda la vida del anuncio.

| # | Tipo | Anuncios | Vendedores | Vistas (suma) | Precio típico (USD) |
|---|---|---|---|---|---|
| 1 | Nevera / refrigerador | 33 | 9 | 196 | 300–520 |
| 2 | Ventilador recargable | 12 | 8 | 158 | 49–75 |
| 3 | Máquina de coser | 1 | 1 | 95 | 40 |
| 4 | Máquina de pelar / cuidado personal | 3 | 3 | 71 | 8–18 |
| 5 | Campana extractora | 1 | 1 | 67 | — |
| 6 | Lavadora / secadora | 9 | 5 | 65 | 185–350 |
| 7 | Split / aire acondicionado | 9 | 5 | 52 | 310–510 |
| 8 | Cocina de inducción / hornilla | 6 | 5 | 49 | 48–115 |
| 9 | Ventilador (normal) | 3 | 3 | 43 | 12–55 |
| 10 | Batidora / licuadora | 4 | 3 | 40 | 32–35 |
| 11 | Humidificador | 1 | 1 | 37 | 19 |
| 12 | Cafetera | 1 | 1 | 21 | 28 |
| 13 | Cocina de gas / horno | 3 | 3 | 19 | 95–325 |
| 14 | Exhibidora | 2 | 2 | 16 | (no comparable) |
| 15 | Protector de voltaje / regleta | 2 | 2 | 15 | 15–25 |
| 16 | Microondas | 2 | 1 | 9 | 85–125 |
| 17 | Plancha de ropa | 1 | 1 | 9 | 30 |
| 18 | Arrocera | 1 | 1 | 4 | 30 |
| 19 | Olla eléctrica (Reina…) | 3 | 2 | 3 | 65 |
| 20 | Selladora al vacío | 1 | 1 | 1 | 70 |
| 21 | Máquina de hielo | 1 | 1 | 1 | 950 |

### 2.3 Nuestra propia demanda (Comprobado, solo cuentas por tipo, sin guardar nombres ni teléfonos)
- **Chats privados con el bot de Casa Viva (últimos 7 días; 1.994 mensajes que llegaron al bot, sobre todo de clientes, aunque también puede haber de gestoras o del equipo):**

  | Tipo | Personas | Mensajes |
  |---|---|---|
  | Camas | 11 | 16 |
  | Ropa de cama / toallas | 8 | 20 |
  | Cortinas | 8 | 33 |
  | Comedor / sillas / mesas | 6 | 8 |
  | Split | 5 | 9 |
  | Televisor | 5 | 5 |
  | Estación de energía | 2 | 4 |
  | Batería | 2 | 2 |

  El resto de tipos, 1 persona cada uno. Lo que el bot pasó a una persona (46 casos) habla también de cortinas (4), ropa de cama (3) y camas (2).
  **Ojo:** se cuenta por palabras, así que puede haber errores. Por ejemplo, «cama» también coincide con «cámara».
- **«Busco / necesito / compro» en los grupos (últimos 3 días):** 424 mensajes de 3.454, y **casi todos son USDT, divisas o saldo móvil**. Ninguno pide cosas de la casa. **Estos grupos hoy no sirven para medir la demanda de hogar.**

---

## 3. Cruce: lo que se busca y lo que ya tenemos (por tipo de producto)

| Lo que se mira (Revolico, 11-oct) | ¿Proveedor en la bolsa? | Mejor opción hoy (proveedor → tu precio) | ¿Precio bien? |
|---|---|---|---|
| **Neveras** (300–520) | **Sí**, unos 15 modelos (Royal, Milexus, Hisense, LG, Sankey) | #205 Royal 5,5 p (270 → 280) · #134 Hisense 7,3 p (370 → 389) · #68 Royal 8,5 p (385 → 404) | **Sí**, dentro del rango o por debajo |
| **Ventilador recargable** (49–75) | **Sí**, 3 modelos | #172 20000 mAh (58 → 63) · #120 pedestal Milexus (85 → 90) · #187 Elfo (90 → 95) | #172 sí; los otros dos, por encima del mercado (el F6 de Casa Viva está a 70) |
| **Lavadora** (185–350) | **Sí**, 5 modelos | #202 Milexus 7,5 kg (200 → 210) · #133 Samsung 9 kg (275 → 285) · #371 LG 9 kg (300 → 310) | **Sí** |
| **Split** (310–510) | **Sí**, 5 modelos | #131 Milexus 1 t (280 → 290) · #467 Milexus Inverter 1 t (375 → 394) | **Sí**: el de 290 está por debajo del mercado (comprobar el voltaje) |
| **Cocina de gas / horno** (95–325) | **Sí** | #175 horno 45 L (160 → 170) · #369 cocina 20" (210 → 220) | **Sí** |
| Batidora / licuadora (32–35) | Sí | #173 Midea (35 → 40) | Un poco cara |
| Cafetera (28) | Solo espresso | #174 Royal espresso (55 → 60) | Es otro tipo de producto |
| Ventilador normal (12–55) | Solo industrial | #517 industrial 30" (165 → 175) | Es otro tipo de producto |
| Exhibidora | Sí | #126 Milexus 13 p (610 → 641) | No se puede comparar (solo 2 anuncios) |
| Máquina de hielo (950) | Solo industrial | #274 Coolake K450 (2.550 → 2.678) | Es otro tipo de producto |
| **Olla eléctrica (Reina)** (65) | **No** en los grupos vigilados | — | **Falta. Fadiar sí la vende** (está en `crm_suppliers`) |
| **Cocina de inducción / hornilla** (48–115) | **No** | — | **Falta** |
| **Microondas** (85–125) | **No** | — | **Falta** |
| **Protector de voltaje / regleta** (15–25) | **No** (solo hay transfer automático, a 90) | — | **Falta** |
| Arrocera, plancha, máquina de coser, máquina de pelar, campana, humidificador, selladora | **No** | — | Faltan (poca demanda en la muestra) |

**Lo que piden los clientes de Casa Viva:**
- **Split y televisor:** sí hay proveedor. Televisores: Samsung 40" #201 (265), Premier 32" #368 (175), Insignia u Onn 32" #393 y #394 (160) y Milexus 43" #482 (275).
- **Sillas:** solo hay una silla de oficina (#176, 55 → 65).
- **Cortinas, ropa de cama y camas:** **no hay proveedor en los grupos.** **Suposición:** Casa Viva ya los vende de su almacén.

**El gran hueco:** **≈79 % de la bolsa es energía y no tenemos ningún dato de demanda de energía.** La muestra de Revolico solo leyó Electrodomésticos; la energía está en «Hogar → Plantas y estaciones de energía». **Suposición:** en Cuba se busca mucho, pero hay que medirlo antes de llenar la web de kits de 5.000 USD.

---

## 4. Siguientes pasos, paso a paso

### (a) Publicar los primeros 10
**Los 10 son de Sergio Hernández, así que basta con su «sí».**
Son: #172 ventilador recargable · #205 nevera Royal 5,5 · #134 nevera Hisense 7,3 · #133 lavadora Samsung · #202 lavadora Milexus · #131 split Milexus · #201 TV Samsung 40" · #139 EcoFlow Delta 3 Classic · #169 planta SIGMA 6500 W · #175 horno Premier.

**Tú apruebas 3 cosas:**
- el permiso de fotos y texto (FOTOS OK);
- el precio de cada uno;
- que salgan en la web como «Bajo pedido» («confirmamos disponibilidad en 1 hora»).

1. **Busca el número de Sergio con el bot** (no lo adivines): en el chat «Tú» escribe `PROVEEDOR 205`.
2. **Escríbele tú.** Por ejemplo:
   > Hola Sergio, soy Ernesto, de Casa Viva. Quiero vender algunos de tus equipos en mi web por encargo: cuando un cliente paga, te lo compro a ti. ¿Me dejas usar las fotos y la descripción de tus anuncios? Pongo mi precio y no pongo tu número.
3. **Si dice que sí**, en «Tú»: `FOTOS OK 172,205,134,133,202,131,201,139,169,175`
   *(Importante: el bot no comprueba esto solo. Haz siempre el paso 3 antes del 5.)*
4. **Revisa los precios** (en la tabla de arriba). Para cambiar uno: `PRECIO 169 1280`. Si quieres ver la foto pulida antes: `FOTOS 205`.
5. **Prueba con uno solo:** `APRUEBA 172`. El bot debe contestarte con el enlace de la web. Ábrelo y mira la foto, el precio y «Bajo pedido».
   - Si contesta «aprobado pero NO publicado», **para** y dímelo (es lo que les pasó a #24 y #25).
6. Si salió bien: `APRUEBA 205,134,133,202,131,201,139,169,175`
7. **Cuando alguien compre:** `PROVEEDOR n` y confirma con Sergio que todavía lo tiene, antes de cobrar.

**Suposición, para que lo pienses:** con +5 o +10 USD, la gestora gana 2,5 o 5 USD por venta (la mitad de tu ganancia). En una nevera hay que recogerla donde el proveedor y llevarla al cliente: puede que no alcance para el mensajero.

### (b) Vigilar el grupo de Fadiar
**Comprobado:** tu número (el del bot) **no está en ningún grupo con «Fadiar» en el nombre.** Solo hay **contactos**: «Grupo Fadiar Gestores» (es un contacto, no un grupo), «Fadiar SRL», «Atención al Cliente Grupo Fadiar» y unas 12 «Gestora N de Fadiar». Por eso `GRUPOS fadiar` ahora mismo dirá «No encuentro grupos con fadiar».

1. Pide tú a «Grupo Fadiar Gestores» o a «Atención al Cliente Grupo Fadiar» el **enlace del grupo** donde publican productos y precios.
2. **Entra al grupo con tu número** (el mismo del bot).
3. Espera a que el bot se reconecte: solo aprende los grupos nuevos al reconectarse, y hoy lo hizo varias veces. Si en 1 hora no aparece, pídeme que lo reinicie.
4. En «Tú»: `GRUPOS fadiar` → sale una lista numerada, por ejemplo «*1.* Fadiar Gestores…».
5. `VIGILA 1 electro` (con el número que te salga). Si es una comunidad, el bot vigila también sus subgrupos.
6. Al día siguiente: `CATALOGO olla` para ver si entró la olla Reina.
7. **Ojo:**
   - Si Fadiar pone el precio **dentro de la foto** y no en el texto, el bot no captura nada (es lo que pasa con ALMACEN 7, ver §5). Entonces pídeles la lista de precios en texto.
   - Fadiar tiene su propia red de gestoras: **pregúntales si te dejan revender con sus fotos** (FOTOS OK) antes de publicar nada suyo.

### (c) ¿Por qué los grupos de DIGITAL STORE están en 0?
**Comprobado:**
- Vigilas 10 grupos de DIGITAL STORE desde el 6-oct, y el bot sigue dentro: aparecen en su lista de grupos al conectarse hoy.
- Solo llegaron **8 mensajes en total**, todos en «Dudas y Preguntas», el 5 y el 6-oct. Desde el 6-oct, **0 en los 10 grupos**.
- Los grupos tienen entre 97 y 325 miembros.
- Por diseño, el bot **no lee los canales de WhatsApp** (los «Canales»), solo los grupos.
- En los registros hay una ráfaga de errores de descifrado («Bad MAC») el 9-oct a las 20:09. No se puede saber de qué chat eran.

**Posibles causas (Suposición, de más a menos probable):**
1. Son grupos donde **solo escriben los administradores**, y DIGITAL STORE publica sus productos en un **Canal** o en estados, no en esos grupos.
2. El bot recibe los mensajes pero **no los puede descifrar**, y llegan vacíos.
3. Los grupos están parados de verdad.

**Qué mirar (5 minutos, en tu teléfono):**
1. Abre «Electrodomésticos y Hogar | DIGITAL STORE». ¿Hay mensajes después del 6-oct?
2. ¿Arriba o abajo dice «Solo los administradores pueden enviar mensajes»?
3. ¿DIGITAL STORE tiene un **Canal** con sus productos?
4. **Si en el teléfono hay mensajes y el bot tiene 0**, dímelo: es un problema técnico (descifrado) y hay que arreglarlo.
   **Si tampoco hay mensajes en el teléfono**, deja de vigilarlos con `NOVIGILA` (después de `GRUPOS digital`) y busca los productos de DIGITAL STORE en su Canal o pidiéndoles la lista.

### (d) Repetir la demanda cada semana sin «scraping»
Cada lunes, unos 20 minutos:
1. **Revolico a mano (10 min; tú o una gestora con PC).** Es la alternativa n.º 3 de `MARKETPLACE-PIEZAS-1-2-6.md`.
   - Abre Revolico en un navegador normal, **sin entrar en la cuenta**, y entra con los menús en estas 6 páginas:
     - Electrodomésticos (todo);
     - Hogar → **Plantas y estaciones de energía**;
     - Neveras;
     - Ventiladores;
     - Aire acondicionado;
     - Lavadoras.
   - En cada una: **Ctrl+S → «Página web, solo HTML»**, en una carpeta `revolico-AAAA-MM-DD`.
   - Mándame los 6 archivos.
   - (Desde el móvil es difícil guardar la página: mejor con PC.)
2. **Yo corro el script sin conectarme:**
   `node scripts/demanda-revolico.mjs --html a.html,b.html,… --salida docs/nexo-business/demanda/AAAA-MM-DD-revolico.md --antes docs/nexo-business/demanda/<semana anterior>.json`
   - Con `--antes` salen las **vistas nuevas de la semana** de los anuncios que se repiten. Esa es la demanda real de la semana.
   - No se guardan teléfonos, textos ni fotos.
3. **Yo añado nuestra demanda** (los chats de clientes con el bot, por tipo, como en §2.3) y la cruzo con la bolsa, como en este informe.
4. **Una vez, si quieres:** pide permiso a Revolico. Lo mandas tú a `ayuda@revolico.com`:
   > Hola, soy Ernesto Rondón, de Casa Viva (tienda de artículos del hogar en La Habana). ¿Nos permiten consultar una vez por semana cuántas vistas tienen los anuncios de hogar y electrodomésticos, sin guardar textos, fotos ni teléfonos? Es para saber qué productos traer. Si tienen un informe o un acuerdo para esto, nos interesa. Gracias.

**«Los más vistos» de Revolico no se pueden ver en público:** Revolico solo ordena por fecha, precio o relevancia (ver `MARKETPLACE-PIEZAS-1-2-6.md`).

---

## 5. Cosas técnicas encontradas (no se tocó nada; para arreglar después con tu SÍ)

1. **FOTOS OK no se comprueba al publicar.** En `vivabot/src/catalog.js` (igual en el VPS), `publishItem` mira el precio, la ganancia y las fotos, pero **no** `photos_ok`. Arreglo: una línea («falta FOTOS OK n»).
2. **Duplicados por título:** 525 filas para ≈317 productos. Arreglo: unir por una clave más flexible (marca + números con su unidad) y sumar las «veces visto».
3. **ALMACEN 7 (1.874 miembros): 70 mensajes y 0 artículos.** Los 70 son **solo fotos, sin texto**: el precio va dentro de la imagen y el bot solo lee el texto. Casa bella: 104 mensajes, 1 artículo (casi todo son fotos). Arreglo posible: leer el precio de la foto con IA, solo en los grupos de proveedores.
4. **Mensajes de grupos sin guardar el 12-oct** (registro `mercado guardar: invalid input syntax for type json`, 93 líneas a las 08 y 09 h del servidor). Mientras falla, el lote se reintenta sin parar. **Suposición:** con cada reinicio se perdieron los mensajes pendientes. No afecta a la bolsa (va por otro camino), pero sí al registro de los grupos.
5. **#24 y #25 «aprobado» sin publicar.** Hay que reintentar uno y leer el error.
6. **#29 en CUP:** casi seguro que son USD. Hay que corregirlo a mano o descartarlo.
7. **Grupos nuevos:** el bot no se entera al entrar en un grupo nuevo (solo al reconectarse). Afecta al paso (b).
8. **El bot se reinicia mucho:** 83 reinicios en total y varios hoy. Hay que mirarlo aparte.

---

## 6. De dónde sale cada dato
- **Base de datos (solo lectura, desde el VPS con `sb.mjs`):**
  - `crm_market_items` (525 filas, sin teléfonos en este informe);
  - `crm_watch_groups` y `crm_wa_chats` (grupos vigilados y si el bot está dentro);
  - `crm_wa_messages` (conteo de mensajes por grupo y «busco» de 3 días);
  - `crm_messages` y `crm_escalations` (demanda de clientes en 7 días, solo conteos por tipo).
- **Código leído:** `vivabot/src/catalog.js`, `groups.js`, `market.js`, `index.js` y `scripts/demanda-revolico.mjs` (se usó su función `productType` para clasificar).
- **Registros del bot** en el VPS (`/root/.pm2/logs`): solo búsquedas de texto. No se leyó el `.env`.
- **Revolico:** 1 petición, bloqueada (403).
- **Agrupación de duplicados:** un cálculo mío por palabras del título. Es **aproximado**.
- **Pendiente:** `docs/00-FUENTE-DE-VERDAD/ESTADO.md` **no se actualizó**, porque esta tarea era solo de lectura. Hay que añadir una línea que apunte a este informe.
