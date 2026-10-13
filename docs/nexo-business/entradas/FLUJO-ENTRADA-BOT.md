# Entrada de mercancía nueva por el bot (WhatsApp)

**Fecha:** 13-oct-2026 · **Autor:** Claude (diseño y prototipo) · **Para:** Ernesto y Lennys
**Estado:** PROPUESTA. No se publicó nada, no se cambiaron datos, no se mandaron mensajes y no se tocaron los repos VivaBot ni Core. Lo único nuevo es este documento y la carpeta `prototipo/`.
**Pedido:** Lennys, nota de voz del 13-oct a las 00:07. Ernesto dio permiso para programar los cambios de los productos nuevos.

> «lo que queremos es probar que lo haga él solo, la fórmula, sin que otra persona lo haga, y también la foto, cómo la crea la comercial, cómo la pone en página, todo eso»

---

## Resumen en 10 líneas

1. **La cuenta «costo + plus = costo total» está confirmada.** Lo dijo Maryta en sus 3 mensajes y en la nota de voz del Excel.
2. **La fórmula del precio NO está confirmada.**
   - Hay una que da justo lo que puso Maryta en los 3 productos (38/3, 25/3 y 30/3): **precio = costo total + comisión + ganancia de la tienda**. La ganancia es 5 USD, o el 20 % del costo total si sale más. Se redondea hacia arriba al dólar.
   - Con los 153 productos de la nube que tienen costo, solo acierta el precio exacto en el 13 %.
   - Lennys pone el precio mirando el mercado, así que **hay que preguntárselo**.
3. **La comisión de 3 USD la decidió Maryta** para los tres productos. Se propone una tabla por tramos de precio, que también hay que confirmar.
4. **El flujo:** Maryta o una dependienta manda al bot las fotos, el costo, el plus, las unidades y las medidas.
   - El bot calcula el precio y la comisión, hace la foto blanca 1200×1200 y la ficha.
   - Le manda a Lennys un resumen con la foto. Ella contesta **`PUBLICA E12`** (o cambia el precio).
   - Al aprobar, el bot da la entrada en la caja y publica en la web.
5. **No hace falta inventar otro camino.**
   - Para la entrada se usa la misma pieza de «Llegó mercancía» del panel (`receive_goods_as` → `goods_receipts`).
   - Para crear el producto y llevarlo a la web, el mismo camino de «Nuevo producto» (`product_save` → `nexo-panel-web` → Core).
   - La entrada pendiente se guarda en la tabla `product_intakes`, que ya existe y está vacía.
6. **Fotos:** el modelo gratis que ya tiene el bot quita bien el fondo cuando el producto está solo delante de una pared. Con las fotos de la tienda del proveedor (mucho fondo) y con las fotos de la caja (llevan texto) **no sirve**. La regla para quien da la entrada: «el producto solo, delante de una pared lisa».
7. **Coste de IA:** unos **0,005 USD por producto** (medio centavo). Quitar el fondo no cuesta nada: corre en el servidor.
8. **Qué falta construir:**
   - En el bot: la entrada y las órdenes.
   - En la nube: la entrada pendiente y una función que publica.
   - En Core: que el producto se guarde con su descripción, sus fotos y sus medidas.
   - Total: **unos 4 días** de trabajo, más una prueba guiada.
   - Hay una **fase 0 de medio día** que ya prueba «la fórmula y la foto sin que nadie lo haga», sin publicar nada.
9. **Lo que más hay que preguntarle a Lennys:**
   - La regla del precio y la de la comisión.
   - Quién aprueba.
   - Cuando un producto es de **dos dueñas** (el estante: 1 de Dayra y 1 de Maryta), de quién es la unidad que se vende. Hoy la nube solo guarda una dueña por producto.
10. **Prototipo listo:** `prototipo/entrada-rules.js` (14 pruebas que pasan con los 3 mensajes reales de Maryta) y `prototipo/foto-web.mjs` (foto blanca, probada con 6 fotos de Maryta).

---

## 1. La fórmula

### 1.1 Lo que puso Maryta (WhatsApp, 12-oct, 19:45–19:47)

| Producto | Costo | Plus | Costo total | Precio | Comisión | Le queda a la tienda |
|---|---|---|---|---|---|---|
| Estante de metal y madera, 5 niveles | 22 | 7 | 29 | 38 | 3 | **6** |
| Organizador de baño de metal, 3 niveles | 12 | 5 | 17 | 25 | 3 | **5** |
| Organizador multifuncional con ruedas | 15 | 7 | 22 | 30 | 3 | **5** |

**El «plus»** es lo que la dueña de la mercancía le suma a su costo. Costo total = costo + plus, y es lo que se le paga a la dueña por cada unidad vendida. En la nube, las cuatro dueñas (Dayra, Maryta, Nana y Joyce) tienen la regla `supplier_price`, que es justo eso.

### 1.2 Fórmulas probadas

| Fórmula | ¿Da los 3 de Maryta? |
|---|---|
| Precio = costo total × 1,3 | No (23 en vez de 25; 29 en vez de 30) |
| Precio = (costo total + comisión) ÷ (1 − 16 %) | No (24 en vez de 25) |
| Precio = el doble del costo | No (44 en vez de 38) |
| **Precio = costo total + comisión + ganancia de la tienda, donde la ganancia es 5 USD, o el 20 % del costo total si sale más. Hacia arriba al dólar** | **Sí, los 3:** 29 + 3 + 5,80 = 37,80 → **38** · 17 + 3 + 5 = **25** · 22 + 3 + 5 = **30** |

### 1.3 ¿Es segura? No todavía.

Probé la fórmula que encaja con los **153 productos de la nube** que tienen costo, precio y comisión (lectura, 13-oct):

- Acierta el precio exacto en **20 (13 %)**, y con ±1 USD en **57 (37 %)**.
- Con una ganancia mínima de 3 USD en vez de 5: exacto en 39 (25 %), con ±1 USD en 90 (59 %).
- **Ganancia real de la tienda:** 72 productos dejan 5 USD o más, 67 dejan entre 2 y 5, y 14 menos de 2.
- **Por dueña** (media de lo que le queda a la tienda): Dayra 4 USD (15,6 % del precio), Maryta 5,25 (18,1 %), Nana 7,80 (12,7 %), Joyce 2,27.

**Conclusión:** la fórmula sirve para **sugerir**, no para decidir sola. Cuadra con lo que dijo Lennys el 11-oct:
- miran el precio en las redes;
- el margen queda por debajo del 20 %;
- la comisión ronda el 10 %;
- si la tienda gana menos de 2–3 USD, baja la comisión.

**Hasta que Lennys la confirme, el bot pone el precio como «SUGERIDO» y ella lo aprueba o lo cambia.** Si la confirma, en el código basta con poner `confirmada: true`. El paso de aprobación sigue igual, porque así lo pide D44.

### 1.4 Comisión (también por confirmar)

Las comisiones reales de la nube (244 productos) se agrupan por tramos de precio. La más repetida en cada tramo:

| Precio | Comisión más repetida | Propuesta |
|---|---|---|
| menos de 15 | 1 | 1 |
| 15 a 19 | 2 | 2 |
| 20 a 39 | 2 (de 20 a 29) y 3 (de 30 a 39) | **3** (lo que puso Maryta a los tres) |
| 40 a 59 | 4 | 4 |
| 60 a 99 | 5 | 5 |
| 100 o más | (varía) | 10 % |

**Guardia de Lennys:** si a la tienda le quedan menos de 2,50 USD, el bot no deja publicar. Avisa de cuánto tendría que bajar la comisión o subir el precio.

### 1.5 Dos formas de dar la entrada

- **«Con precio»** (lo que hizo Maryta): quien da la entrada trae el precio y la comisión.
  - El bot **comprueba** la cuenta: que costo + plus sea el costo total que dice, que la tienda no pierda y que no gane demasiado poco.
  - Enseña lo que daría la regla.
  - Con los 3 de Maryta, todo cuadra: 0 avisos.
- **«Solo costo»** (lo que quiere probar Lennys): solo costo y plus. El bot **calcula** el precio y la comisión.
  - En la prueba del prototipo llega solo a 38/3, 25/3 y 30/3.

---

## 2. El flujo paso a paso

### 2.1 Quién puede dar entradas

- **Dependientas, socias** (Maryta, Dayra, Nana, Joyce), **Lennys y Ernesto.** A cualquier otra persona, el bot le da las gracias y no crea nada.
- **Aprueban solo Lennys o Ernesto.** Maryta no aprueba sus propios productos, porque ella pone su plus.
- **Ojo:** en la nube, las socias no tienen teléfono. El bot necesita una lista «teléfono → socia» (empieza con Maryta …8052). Eso es un dato nuevo; se pone con el visto bueno de Ernesto.

### 2.2 Los pasos

| # | Qué pasa | Quién | Pieza que ya existe |
|---|---|---|---|
| 1 | Manda las fotos y el texto (o una nota de voz) | Dependienta o socia | El bot ya guarda las fotos en `/root/archivos/entrantes/` y las notas de voz transcritas |
| 2 | El bot lee: nombre, unidades por dueña y por color, costo, plus, precio y comisión si los hay, y las medidas tal cual | Bot (sin IA si el texto es como el de Maryta; con IA barata si es una nota de voz) | `prototipo/entrada-rules.js` |
| 3 | **¿Ya lo tenemos?** Busca parecidos en la caja y en las 128 filas del Excel que «no están en la web» | Bot | `nexo_business_match_names` (lo usa Curru), `import_review` |
| 4 | Pregunta lo que falta o no cuadra: plus vacío, «dice 10 y suman 9», la caja dice 78 cm y Maryta midió 72, defecto | Bot → quien da la entrada | Avisos del prototipo |
| 5 | Calcula o comprueba el precio y la comisión | Bot | `calcularPrecio` / `comprobarPrecioDado` |
| 6 | Foto: nota de 0 a 10 (≥ 7 para la web), quita el fondo y la deja blanca, 1200×1200 y sin logo | Bot | Revisión de `fotos-bolsa.mjs` + quitar el fondo de `studio.js` + `prototipo/foto-web.mjs` |
| 7 | Ficha: título y descripción **solo con los datos dados**. Si la IA pule el texto, el código comprueba que no meta ningún número nuevo | Bot | `numerosInventados` (igual que `revisarTexto` de la bolsa) |
| 8 | Guarda la entrada pendiente con número (E12) y le manda a Lennys la foto y el resumen | Bot | Tabla `product_intakes` (Digitaliza) |
| 9 | **Aprueba:** `PUBLICA E12`, o la cambia con `PRECIO E12 40` · `COMISION E12 4` · `FOTO E12 2` · `NO E12` | **Lennys o Ernesto** | Órdenes con número, nunca un «sí» suelto |
| 10 | Al aprobar, sin que nadie más toque nada: crea el producto en la caja (con diseños si hay colores), da la entrada por dueña (unidades + costo + dueña + foto), pone la comisión y publica en la web con la foto y la ficha | Función nueva `nexo-entrada` | `receive_goods_as`, `product_save`, `nexo-panel-web`, `set_product_commission` + `nexo-commission-push`, `nexo-stock-bridge` |
| 11 | Avisa a Lennys y a quien dio la entrada, con el enlace | Bot | — |

### 2.3 Ejemplo con mensajes reales

**Maryta → bot** (foto del estante armado delante de la pared blanca + texto):
```
Estante de metal y madera 5 niveles
Entrada 2 unidades
Para Dayra
1 unidad para mí
Costo 22 usd
Plus 7 usd
63cm de largo 110cm de alto y de ancho 23 cm
```

**Bot → Maryta:**
> Recibido, Maryta 👍 Es la entrada *E12*: estante de metal y madera, 5 niveles. Son 2 unidades (1 de Dayra y 1 tuya). Costo 22 + plus 7 = 29 USD. Le paso el precio y la foto a Lennys para que lo apruebe y te aviso cuando esté en la web.

**Bot → Lennys** (con la foto blanca; este texto lo genera el prototipo tal cual):
```
📦 *Producto nuevo E12* · de Dayra y Maryta
*Estante de metal y madera 5 niveles*
• Unidades: 2 — Dayra 1 · Maryta 1
• Costo 22 + plus 7 = *29 USD* (lo que se le paga a la dueña)
• Precio *38 USD* · comisión gestora *3 USD* · a la tienda le quedan *6 USD*
• Precio SUGERIDO por el bot (regla sin confirmar)
• Medidas: 63 cm de largo 110 cm de alto y de ancho 23 cm

Para publicar: *PUBLICA E12*
Para cambiar: *PRECIO E12 32* · *COMISION E12 4* · *NO E12*
```

**Lennys → bot:** `PUBLICA E12`

**Bot → Lennys:**
> Listo ✅ E12 ya está en la web: https://casaviva.company/producto/… · 2 unidades en la caja (1 de Dayra, 1 de Maryta) · comisión 3 USD.

**Bot → Maryta:**
> Tu estante ya está en la web ✅ Precio 38 USD, y las gestoras ganan 3 USD. Si ves algo mal, dímelo.

**Cuando algo no cuadra** (el organizador con ruedas, tal como lo escribió Maryta):
> Maryta, del organizador con ruedas me dices 10 tuyas, pero los colores suman 9 (5 blanco + 4 negro). ¿Son 9, o falta 1? Dime de qué color es la que falta.

Mientras no conteste, a Lennys le llega el resumen con «⚠️ Todavía no se puede publicar» y sin la orden `PUBLICA`.

**Cuando se parece a uno que ya existe:**
> Maryta, en la web ya están «Organizador de Baño blanco» (28 USD) y «Organizador de Baño negro» (28 USD). ¿El de 3 niveles que entró es uno de esos? Contesta *1*, *2* o *NUEVO*.

- Con 1 o 2 es una **reposición**: solo suben las unidades y se guarda el costo. El precio no cambia si Lennys no lo dice.
- Con NUEVO se crea un producto nuevo.

### 2.4 Qué se aprueba y quién

| Qué | Lo hace el bot solo | Lo aprueba |
|---|---|---|
| Leer el mensaje y sumar costo + plus | Sí | — |
| Precio y comisión | Los calcula y los marca «sugeridos» | **Lennys o Ernesto** (`PUBLICA`, o `PRECIO`/`COMISION`) |
| Foto blanca | Sí, con nota de calidad | Se ve en el resumen; con `FOTO E12 2` se elige otra |
| Ficha | Sí, solo con datos dados | Se ve en el resumen |
| ¿Nuevo o reposición? | Pregunta si se parece | Contesta quien dio la entrada |
| Entrada en la caja (unidades, costo, dueña) | Al aprobar | — |
| Publicar en la web | Al aprobar | — |
| Productos con defecto | **Nunca a la web** (orden de Lennys del 12-oct) | Lennys |

**Por qué las órdenes llevan número:**
- En el chat «Tú» de Ernesto, un «sí» suelto ya es una orden del bot (lanzó el envío n.º 7 el 12-oct).
- `SÍ n` es del supervisor y se ejecuta minutos después.
- `APRUEBA n` ya se usa para dos cosas: altas de gestoras y la bolsa.

Por eso se usan verbos propios: `PUBLICA`, `PRECIO`, `COMISION`, `FOTO` y `NO`, siempre con `E` + número. Lennys no ve el chat «Tú», así que su teléfono se autoriza como ya se hace con `EXTRA` (`extras.js`).

---

## 3. Apoyarse en el panel, no inventar otro camino

Lennys vio esta mañana en su panel «Necesita tu atención · 53 productos del Excel por confirmar · 128 no están en la web»:
- Es la revisión de costos del Excel del 4-oct (`import_review`, fuente `excel-2026-10`).
- Entre las 08:10 y las 08:12, una cuenta de dueña (seguramente Lennys) resolvió 15 e ignoró 1. Por eso en la nube quedan **37 por revisar** y **128 no encontrados**.
- O sea, esa pantalla ya se está usando.

Las entradas por el bot encajan así con lo que ya hay:

| Lo que hace falta | Lo que ya hay en el panel o la nube | Cómo lo usa el bot |
|---|---|---|
| Guardar la entrada pendiente, con número | Tabla `nexo_business.product_intakes` (Digitaliza: `number`, `kind` new/restock, `photos`, `lines`, `content_status`). Tiene **0 filas** | E12 = `number`. Le faltan columnas de estado (pendiente/publicada/descartada), quién la mandó y quién la aprobó |
| Dar la entrada: unidades + costo + dueña + foto + registro de cambios | «Llegó mercancía» → `nexo_business.receive_goods_as(p_business, p_receipt, p_actor, p_who)` (`20261011120000_…device_receive_goods.sql`). Escribe `goods_receipts`, el evento `inventory.received`, `product_costs` y `cost_audit` | Igual que la caja: **una entrada por dueña**. Lennys la ve en Productos → «Ver mercancía recibida», con la foto |
| Crear el producto nuevo (y sus diseños) | «Nuevo producto» (`index.html` L715–741): `nexo_business_product_save` → `nexo-panel-web` `product_web_save` → Core `/panel/products/save` → `product_link_web`. Con colores: `product_variable_create` + `variant_link` | El mismo camino, pero llamado por una función con clave interna. Hoy exige la sesión de la dueña |
| Comisión de la gestora | `nexo_business_set_product_commission` + `nexo-commission-push` (D37) | Igual. **El bot no escribe la comisión en la web** |
| Unidades en la web | `nexo-stock-bridge` (cada 2 min) | Sin cambios. Mientras no llegan las unidades, la web no lo enseña, porque los agotados están ocultos |
| «¿Ya lo tenemos?» | `nexo_business_match_names` (Curru) | Para preguntar «¿es este?» |
| Revisión del Excel | `import_review` + «Sí, es este» / «Ignorar» | Las **128 filas que «no están en la web»** son candidatas a producto nuevo. Si una entrada se parece a una de ellas, el bot trae su costo, su comisión y su dueña, y al publicar la marca como resuelta (`nexo_business_import_resolve`) |
| Avisar a Lennys en el panel | Bloque «Necesita tu atención» (`loadAttention`, L2903) | **Fase 2:** «N productos nuevos por aprobar», con Publicar / Cambiar precio / Descartar. Por debajo usa la misma función `nexo-entrada` |

**Lo que el panel NO tiene y hace falta:**
1. **«Llegó mercancía» solo acepta productos que ya existen** y guarda en el acto: no hay borrador ni aprobación. La aprobación vive en `product_intakes` y la entrada se hace **después** de `PUBLICA`.
2. **No hay campo para el plus.**
   - En `product_costs.purchase_amount` va el **costo total** (29). Así lo hace ya el Excel de Maryta, y es lo que cobra la dueña con `supplier_price`.
   - Costo y plus por separado van en las líneas de la entrada (`goods_receipts.lines`: `baseCost`, `plus`). Es JSON, así que no hace falta cambiar la tabla.
3. **Una sola dueña por producto** (`product_costs.partner_id`).
   - Si se hacen dos entradas (Dayra y luego Maryta), la dueña del producto queda como la última.
   - El estante (1 + 1) y el organizador con ruedas (10 + 10; en negro, 5 de Dayra y 4 de Maryta) no se pueden representar bien.
   - Hace falta la regla de Lennys (pregunta 5) y, después, «lotes por dueña».
4. **D39 está desactualizada.** Dice que un producto nuevo del panel no se crea solo en la web, pero el código sí lo crea (L730). Lo publica enseguida y sin descripción, galería ni medidas (Core `save_product`). Hay que ampliarlo; es el paso 2 de `docs/herramientas/entrada-a-ficha.md`.

**Encaje con el plan de fichas** (`docs/herramientas/entrada-a-ficha.md`): este flujo junta su paso 7 («entrada por WhatsApp») y su paso 5 («de la factura al producto nuevo»).

Su tabla de piezas dice que el estudio de fotos pone un fondo de marca (crema, franja verde y sello). Para la web manda la regla nueva de `fotos-productos/PROCESO.md`: **blanco y sin logo**, porque Google y Meta rechazan las fotos con logo.

---

## 4. Las fotos

### 4.1 Prueba con las fotos de Maryta

Programa: `prototipo/foto-web.mjs`. Usa el modelo gratis que ya usa el bot (`@imgly/background-removal-node`, el de `studio.js`), sobre fondo blanco y sin sello.

Resultado: `prototipo/salida/hoja-prueba.jpg`.

| Foto | Resultado | ¿Sirve? |
|---|---|---|
| Estante armado delante de la pared blanca (20:34) | Fondo quitado limpio y producto entero | **Sí** (un brillo en una balda; nota probable 8) |
| Estante en la tienda del proveedor (19:59, dos fotos) | Se queda con la bomba de agua, la caja y lo que hay dentro de las baldas | **No** |
| Fotos de la caja del organizador con ruedas (3) | Deja el dibujo de la caja con las medidas escritas (6 cm, 28 cm, 78 cm) | **No como foto** (lleva texto). **Sí como dato**: la caja dice 78 cm de alto |

Tiempo: 7–13 segundos por foto en el PC de Ernesto. En el VPS (1 procesador) hay que medirlo: hay que pasarlo en cola, de una en una, para no frenar al bot.

### 4.2 Regla para quien da la entrada

> «Una foto del producto armado y solo, delante de una pared lisa o una sábana blanca, con luz de día. Sin cajas ni cosas alrededor. Si tiene colores, una foto de cada color.»

- Si la nota de la foto sale por debajo de 7, el bot se lo pide otra vez a **quien dio la entrada**, nunca a Lennys.
- Si el producto tiene marca y modelo, se puede usar la foto oficial de internet con su fuente (D44 y `PROCESO.md`). Si es genérico, hace falta foto real.

### 4.3 ¿Hace falta otra herramienta para quitar el fondo?

Para fotos como la buena del estante, **no**: el modelo gratis basta.

Para fotos con mucho fondo, ningún modelo arregla las cosas que hay **dentro** del producto (lo que había en las baldas). Lo barato y seguro es **pedir otra foto**.

Si algún día hace falta un modelo más fuerte:
- **BiRefNet** (abierto, licencia MIT; con `rembg` en Python) en el mismo VPS, gratis.
- Uno de pago por foto (remove.bg, Photoroom): mirar el precio antes y pedir el SÍ de Ernesto.
- La IA que «genera» el fondo (Higgsfield, gpt-image) **no se usa para la foto principal**, porque puede cambiar el producto.

**Ojo con la licencia:** el modelo de imgly es AGPL. Para Casa Viva no pasa nada. Si NEXO lo vende como herramienta a otros negocios, hay que comprar la licencia de IMG.LY o cambiar a BiRefNet (MIT).

---

## 5. La ficha (sin inventar nada)

- **Título:** el nombre que da quien hace la entrada. Si la IA lo pule, solo con palabras que estén en los datos, como «con ruedas, 3 cestas» en el organizador.
- **Descripción:** las medidas **tal como las escribió** quien las tomó, más los colores. Nada más.
- **Las medidas de Maryta valen más que las de la caja** (decisión de Lennys del 12-oct, 22:31). Si las dos chocan (72 cm frente a 78 cm), el bot lo enseña en el resumen.
- **Prueba fija:** todo número del texto final tiene que estar en los datos dados (`numerosInventados`). Si la IA escribe «aguanta 15 kg» o «alto 78 cm» sin que nadie lo haya dicho, no se publica. Es la misma idea que `revisarTexto` de la bolsa.
- La descripción de Google que mandó Maryta (19:06) **no se copia**. Sirve como pista y se apunta su fuente.

---

## 6. Qué hay que construir

### 6.1 Por fases

**Fase 0 · «Que lo haga él solo», sin publicar nada (medio día):**
- El bot lee la entrada, calcula, hace la foto blanca y le manda el resumen a Lennys.
- `PUBLICA` contesta «en la prueba todavía no publico».
- Prueba ya lo que pidió Lennys (la fórmula y la foto sin que nadie lo haga) sin riesgo.

**Fase 1 · Publicar al aprobar (unos 3 días y medio):** todo lo de abajo.

**Fase 2 · Aprobar también desde el panel (1 día):** el aviso en «Necesita tu atención».

### 6.2 En el bot (VivaBot) · unos 1,5 días

| Archivo | Qué |
|---|---|
| `src/entrada-rules.js` (nuevo) | Copia de `prototipo/entrada-rules.js` |
| `src/entrada.js` (nuevo) | Junta textos y fotos de la misma persona (respuestas a un mensaje, o hasta 30 minutos sin escribir). Lista de quién puede dar entradas. Para notas de voz o texto libre, la IA (gpt-4.1-mini con esquema JSON) saca los datos y el código vuelve a comprobarlo todo. Asigna cada foto a su producto (si duda, pregunta). Manda el resumen con la foto a Lennys. Lleva las órdenes `PUBLICA/PRECIO/COMISION/FOTO/NO E<n>` y llama a `nexo-entrada` |
| `src/studio.js` | Función nueva de foto blanca, al lado de `studioPhoto`, que no se toca. Más la nota de calidad de `fotos-bolsa.mjs` (`auditar`, nota ≥ 7) |
| `src/index.js` | Engancharlo antes de la respuesta de la IA para quien tiene permiso (como `rates.js` y `extras.js`), y las órdenes en la cadena del dueño. Mirar qué pasa con las órdenes cuando el bot está en pausa con Lennys (hoy lo estuvo hasta las 12:28) |

### 6.3 En la nube (NEXO) · unos 1,5–2 días

| Archivo | Qué |
|---|---|
| `supabase/migrations/…_nexo_business_entradas_bot.sql` (nuevo) | Columnas de estado, origen, quién la mandó, quién la aprobó y enlace web en `product_intakes`, o una tabla `entradas` si se prefiere separar. Funciones «como esta persona», solo para la clave interna: `product_save_as`, a partir de `nexo_business_product_save`, que hoy pide la sesión de la dueña; `entrada_guardar_as` y `entrada_publicar_as`. Esta última crea el producto y sus diseños, hace `receive_goods_as` por dueña, pone la comisión y resuelve la fila del Excel si la hay |
| `supabase/functions/nexo-entrada/index.ts` (nuevo) | Acciones `preparar`, `parecidos` (con `match_names` + `import_review`), `publicar` y `descartar`. Publicar = funciones de arriba + Core `/panel/products/save` o `/variable` (con la clave del panel, que el bot no tiene ni necesita) + `product_link_web` / `variant_link` + `nexo-commission-push`. No hace dos veces lo mismo si se repite la orden: va por el número de la entrada |
| Foto | La original va a `product-intake` (privado). La de 1200 blanca, a `nexo-product-photos` (público, el del panel) |

### 6.4 En Core (Casa Viva) · medio día

| Archivo | Qué |
|---|---|
| `class-cvd-panel-bridge.php` `save_product` (~L401) y `create_variable` (~L659) | Que acepten, si vienen, descripción, descripción corta, galería (hasta 4 fotos) y medidas. Es el paso 2 de `entrada-a-ficha.md`. Hoy solo guardan nombre, precio, categoría y una foto |
| Nada más | El producto de la tienda **no** pasa por `/bot/market/publish`. Esa ruta es para «Bajo pedido»: le pone `MK-`, sin control de unidades, en esa categoría y fuera del reparto automático |

### 6.5 En el panel (fase 2) · 1 día

`apps/business-dashboard/index.html` `loadAttention` (L2903): bloque «Productos nuevos por aprobar» con la foto, las cuentas y los botones Publicar / Cambiar precio / Descartar. Llama a la misma `nexo-entrada` `publicar`.

**Total:** fase 0 medio día; fase 1 unos 3,5–4 días; fase 2, 1 día más. Después, una prueba guiada con Lennys y Maryta.

---

## 7. Plan de prueba con Lennys y Maryta (los 3 productos)

**Antes:** Ernesto aprueba el texto para Maryta y la lista «teléfono → socia». Nada se publica en la fase 0.

**Paso 1 · Prueba a ciegas (fase 0).** Se le pide a Maryta que vuelva a mandar los 3 productos **sin precio ni comisión**: solo costo, plus, unidades por dueña y color, medidas y una foto de cada uno, solo delante de una pared lisa. Texto propuesto:

> Maryta, para probar la entrada automática: ¿me vuelves a mandar el estante, el organizador de baño y el organizador con ruedas, cada uno con su foto (el producto solo, delante de una pared lisa), las unidades de cada una, el costo y el plus? **No pongas precio ni comisión**: los tiene que sacar el bot solo. Gracias 🙏

Qué se mira:

| Comprobación | Esperado |
|---|---|
| Precio y comisión sin que nadie los escriba | 38/3, 25/3 y 30/3 (ya pasa en el prototipo) |
| Avisos | «10 y suman 9» en el organizador con ruedas. Si manda la foto de la caja, «la caja dice 78 cm» |
| Foto | Blanca, 1200×1200, sin logo y con nota ≥ 7. Al menos 2 de 3 a la primera |
| Ficha | Ni un dato que no hayan dado |
| Resumen a Lennys | Lo entiende sin ayuda |

**Paso 2 · Publicar uno (fase 1, con el OK de Ernesto).** Primero el **estante** (E1, sin colores). Lennys contesta `PUBLICA E1` y se comprueba:
- en la caja: producto nuevo, 2 unidades, costo 29, dueña, comisión 3 y la entrada en «Ver mercancía recibida»;
- en la web: la página da 200 con foto, precio 38 y descripción, y las unidades llegan en 2 minutos;
- una gestora ve 3 USD de comisión en su panel (se le pide a Dany, como siempre).

**Marcha atrás:** «Dejar de vender» en el panel (D41: no se borra nada).

**Paso 3 · Los otros dos.** Primero Maryta aclara 9 o 10. El organizador con ruedas sale con diseños (rosa, negro y blanco). El de baño: Maryta dice si es el mismo de 28 USD que ya está o uno nuevo.

**Paso 4 · Una entrada de una dependienta.** Un producto de Casa Viva (plus 0) sin Ernesto delante.

**Prueba superada si:** los 3 productos quedan en la caja y en la web con los números de Maryta, sin que nadie escriba precio ni comisión, y con una sola orden de Lennys por producto.

---

## 8. Coste por producto (IA)

| Paso | Herramienta | Coste |
|---|---|---|
| Leer el texto como el de Maryta | Código, sin IA | 0 |
| Leer una nota de voz o un texto libre | La nota ya la transcribe el bot; la IA saca los datos (gpt-4.1-mini, ~1.500 palabras-token de entrada y 300 de salida) | ≈ 0,001 USD |
| Nota de calidad de 1–4 fotos | gpt-4.1-mini con las fotos a 768 px (como la bolsa) | ≈ 0,002 USD |
| Quitar el fondo y dejar la foto blanca | imgly + sharp en el VPS | 0 |
| Pulir el título y la descripción | gpt-4.1-mini | ≈ 0,001 USD |
| **Total** | | **≈ 0,005 USD por producto** (con repeticiones, menos de 0,01) |

Referencia: las 682 fichas y fotos de la bolsa del 12-oct costaron 2,40 USD (0,0035 por producto). Precios de OpenAI usados: 0,40 USD por millón de tokens de entrada y 1,60 por millón de salida; comprobarlos antes de lanzar.

---

## 9. Preguntas para Lennys (cortas, para mandar tal cual)

1. **Precio:** con los 3 de Maryta encaja esta cuenta: costo con plus + comisión + lo que gana la tienda (5 USD, o el 20 % del costo si es más caro). ¿La dejamos así, o me dices tu cuenta?
2. **Comisión:** ¿te sirve por tramos? Menos de 15 USD → 1 · de 15 a 19 → 2 · de 20 a 39 → 3 · de 40 a 59 → 4 · de 60 a 99 → 5 · 100 o más → 10 %.
3. **Quién aprueba los productos nuevos:** ¿solo tú, tú y Ernesto, o también alguien más? ¿Por WhatsApp o en el panel?
4. **Quién puede dar entradas por WhatsApp:** ¿las dependientas, Maryta, Dayra, Nana y Joyce?
5. **Dos dueñas en un mismo producto** (el estante: 1 de Dayra y 1 de Maryta): cuando se vende uno, ¿de quién es? ¿Primero el de la que lo trajo antes, o se alternan?
6. **El plus:** en un mismo producto, ¿es igual para todas las dueñas?
7. **Los de En Sueño** (consignación, sin plus): ¿quién les da entrada? En la caja no está «En Sueño» como socia.

**A Maryta:** ¿del organizador con ruedas tuyos son 9 o 10? Y si es 10, ¿de qué color es el que falta?

---

## 10. Riesgos y qué no hacer

- **No publicar sin la orden de Lennys o Ernesto** (D44). El interruptor de «publicar solo» lo apaga solo Ernesto, cuando el bot demuestre que lo hace bien.
- **No escribir la comisión directo en la web** (D37). Va a la nube y de ahí se copia.
- **No usar la ruta de «Bajo pedido»** para productos de la tienda.
- **No dar por buena la fórmula** hasta que la confirme Lennys.
- **No mandarle a Lennys tareas de tienda:** pedir otra foto o aclarar unidades va a quien dio la entrada.
- **No reiniciar el bot mientras alguien escribe** (LECCIONES, 11-oct). Después de subirlo, comparar los mensajes del rato del reinicio.
- **Probar con datos reales solo con copia** y con «Dejar de vender» como marcha atrás.

**Mejora pendiente: el Excel de Maryta del 12-oct** («ACTUALIZADO 10 PM»). Trae costo, plus, costo total, precio y comisión de cada producto, pero el bot todavía no guarda documentos (otro agente lo está arreglando). Cuando se tenga, se carga en la revisión del Excel como fuente nueva. Así se confirma la fórmula con todos los productos de las socias, no solo con 3.

---

## 11. Archivos del prototipo

| Archivo | Qué es |
|---|---|
| `prototipo/entrada-rules.js` | Reglas puras: `REGLA_PROPUESTA` (sin confirmar), `calcularPrecio`, `comprobarPrecioDado`, `comisionPorRegla`, `parsearEntrada`, `fichaDesdeDatos`, `numerosInventados`, `prepararEntrada`, `resumenParaAprobar` y `leerOrden`. Sin red, sin base de datos y sin IA. Se copia tal cual al bot |
| `prototipo/entrada-rules.test.js` | 14 pruebas con los 3 mensajes reales de Maryta: la fórmula, la prueba a ciegas, «9 y no 10», la cuenta mal hecha, la ganancia baja, el defecto, el plus vacío, los números inventados y las órdenes |
| `prototipo/foto-web.mjs` | Foto blanca 1200×1200 con 8 % de margen y sin logo, con avisos (pequeña, cortada, ampliada de más, no se separa del fondo). Usa el modelo y el sharp de la copia local de VivaBot, solo leyendo |
| `prototipo/salida/` | Las 6 fotos de Maryta pasadas por el programa y `hoja-prueba.jpg` |

**Cómo probarlo:** en `docs/nexo-business/entradas/prototipo/`, `node --test` (14 de 14 pasan) y `node foto-web.mjs <foto.jpg>`.
