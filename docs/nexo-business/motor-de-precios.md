# Motor de precios de NEXO y Casa Viva (diseño)

**Fecha:** 2026-10-11 (noche) · **Autor:** Claude (diseño + investigación; solo lectura: no se cambió código, precios, comisiones ni datos, y no se mandó nada) · **Para:** Ernesto y Lennys
**Estado:** PROPUESTA. Lo único decidido es lo que ya está en `DECISIONES.md` (D11, D36–D43). **Ningún número de las opciones está decidido.**
**Fuentes internas revisadas:**
- Core: `class-cvd-commissions.php`, `-gestora-store.php`, `-gestora-price-integrity.php`, `-daily-rates.php`, `-payment-obligations.php`, `-market-bridge.php`.
- NEXO: `lib/commerce/pricing.ts`; migraciones de costos, tasas, comisiones y ofertas en `supabase/migrations/`; función `nexo-commission-push`.
- VivaBot: `src/catalog.js` (`myPrice`).
- Datos reales (solo lectura, 11-oct):
  - nube `nexo-production`: 335 productos, 152 con costo, 261 con comisión, gastos fijos y tasas;
  - web: opciones, comisiones por producto, % propios de gestoras y producto 1013;
  - pedidos del 11-oct con `cv`.

---

## Resumen en 10 líneas

1. **Hoy no hay un motor de precios: hay 5 reglas sueltas que no se hablan:**
   - el margen por tramos de `pricing.ts`;
   - el +5/+10 USD de la bolsa del bot;
   - la ficha de costo de la nube (margen objetivo 30 %);
   - la comisión fija por producto;
   - el % propio de cada gestora.
2. **El precio que de verdad pone Lennys no sale de ninguna de ellas.** Con 30 % de margen objetivo, el juego de ollas saldría a 58 USD, y hoy está a 50.
3. **Datos reales (149 productos con costo y precio):**
   - La subida típica sobre el costo es **+50 %**. La mitad de los productos están entre +37 % y +60 %.
   - La comisión típica es el **11 % del precio**.
   - Todos los precios son **dólares enteros**.
4. **19 productos se venden por debajo del costo apuntado** y 22 dejan pérdida después de la comisión. Casi seguro son costos mal apuntados (paquete o CUP en vez de USD). Hay que preguntarlo, no corregirlo a ciegas.
5. **Hay dos tasas del CUP:**
   - la web usa 780 (11-oct, la manda Maryta);
   - la nube usa 775 (puesta el 3-oct).

   Tiene que quedar **una sola**.
6. **El orden de la comisión es distinto en la nube y en la web:**
   - en la nube, la comisión de la gestora pasa por delante de la del producto;
   - en la web, la del producto pasa por delante.

   Hoy no hace daño porque ninguna gestora tiene comisión propia en la nube. Hay que igualarlo.
7. **El aire Parker (producto 1013) no tiene comisión en la web.** Si se vende por la web, la gestora cobraría el 10 % por defecto (36,50 USD) sobre un margen de 25 USD: **NEXO perdería dinero**.
8. **Propuesta: un solo motor (una función pura + un archivo de reglas)** con:
   - capas: general → categoría → proveedor → producto;
   - suelo de margen;
   - redondeo;
   - CUP con la tasa del día;
   - tope para la gestora;
   - ofertas;
   - un **«recibo del precio»** guardado que explica de dónde sale cada número.
9. **El motor trabaja con perfiles.**
   - «Tienda Casa Viva» (margen objetivo + comisión por producto).
   - «NEXO bajo pedido, margen fijo». Es la **regla D43 vigente**: primero el transporte, y del resto 40 % gestor y 60 % NEXO.
   - «Bolsa del bot».

   Cada perfil es configurable.
10. **Pasos:**
    1. Función y pruebas: 1–2 días.
    2. Pantalla en el panel: 4–6 días.
    3. NEXO multi-negocio: 3–5 semanas.

---

## 0. Lo que ya existe hoy (inventario con datos reales)

| Regla | Dónde vive | Qué hace | Estado real |
|---|---|---|---|
| Ficha de costo | Nube: `cost_settings`, `product_costs`, `fixed_costs`, función `nexo_business_cost_sheet` | **Precio sugerido** = (costo total + comisión) ÷ (1 − margen objetivo − % variables), redondeado hacia arriba a 0,5. El costo total es la compra, más el flete, más los gastos fijos por unidad, más el 1 % de imprevistos | Ajustes de Casa Viva: margen objetivo **30 %**, otros 2 %, dependienta 0,5 %, comisión 10 %, redondeo 0,5. **Solo sugiere**: no cambia precios |
| Gastos fijos | Nube `fixed_costs` | 16 gastos en CUP: salarios, luz y renta, teléfono, depreciación… | **407.408,5 CUP/mes ≈ 526 USD** (a 775). Con 330 unidades al mes ≈ **1,6 USD por unidad** |
| Costos por producto | Nube `product_costs` | Compra (moneda y tasa) + flete | 152 productos, todos en USD, **ninguno con flete** |
| Comisión por producto | Nube `product_commissions` (D37), se copia a la web con `nexo-commission-push` | Monto fijo en USD por unidad | 261 productos. Los montos más comunes son 2 USD (75 productos), 1 (67) y 3 (40). El más alto es 20 |
| Comisión general | Web `cvd_default_commission_rate` = 10 · Nube `cost_settings` = 10 % | Si el producto no tiene la suya | El aire Parker cae aquí (ver §5) |
| Precio propio de la gestora | Web `CVD_Gestora_Store` + tabla `wp_cvd_gestora_prices` | La gestora sube un % general o pone su precio. Nunca puede bajar del precio de la tienda | 6 gestoras tienen % guardado (0, 10 y 20 %). 3 gestoras tienen 229 precios propios. **Sin tope** desde 3.13.42 (salvo tope personal) |
| Margen por tramos | `lib/commerce/pricing.ts` (Product Studio) | 25 % hasta 50 USD (mínimo +10), 20 %, 15 %, 12 %, 10 %, 8 %, 7 % según el costo. Regla por producto > categoría > comercio > general | Código completo, **sin uso** |
| Bolsa del bot | VivaBot `catalog.js` `myPrice` | +5 o +10 USD según tamaño; más de 300 USD: +5 %. El gestor se lleva **la mitad** del margen | 2 artículos aprobados |
| Tasa del día | Web `cvd_daily_rates` (+ historial) · Nube `exchange_rates` | Cuánto se cobra por cada 1 USD | **Web: 780 CUP** (11-oct, bot). **Nube: 775** (3-oct). EUR 1, Clásica 1,15, Zelle 1,04, PayPal +4 % |
| Mensajería | Web `CVD_Shipping_Rates` + `CVD_Payment_Obligations` | Tarifa por zona en CUP. **100 % para el mensajero (D40)** | Hoy: 1.500–1.800 CUP por pedido |
| Foto del precio en el pedido | Web: `_cvd_base_unit_price`, `_cvd_sale_unit_price`, `_cvd_commission_snapshot` por línea | Guarda el precio base, el de la gestora y la comisión en el momento de la compra | Funciona. **Es la base de la auditoría** |
| Aprobación de la comisión | Web `CVD_Commissions::approve_for_closeout` | La comisión pasa a «aprobada» en el cierre de caja | Funciona |

**Cómo están los márgenes hoy (149 productos activos con costo y precio, sin contar gastos fijos):**

| Categoría | Productos | Subida media sobre el costo | Precio medio |
|---|---|---|---|
| Habitación | 55 | +54 % | 35 USD |
| Baño | 42 | +30 % | 22 USD |
| Cocina | 18 | +49 % | 25 USD |
| Cuidado personal | 13 | +44 % | 22 USD |

- Margen bruto típico: 33 % del precio.
- Después de la comisión de la gestora: 22 %.
- Después de los gastos fijos (~1,6 USD por unidad) y el 2,5 % de variables: **en torno al 10–17 % limpio**.

**Pedidos reales del 11-oct:**
- 11 pedidos reales, 613 USD. El pedido típico es de **40 USD**.
- La comisión sobre el precio:
  - #2900: perchero de 33 USD, 3 USD de comisión (9 %);
  - #2898: escritorio de 230 USD, 10 USD (4,3 %);
  - #2916: mochila de 13 USD, 1 USD (7,7 %).

---

## 1. El modelo en un dibujo

```
                 PRECIO QUE PAGA EL CLIENTE (USD, o CUP a la tasa del día)
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ costo del      │ transporte │ margen de     │ tarifa │ comisión  │ recargo│
 │ proveedor      │ y gastos   │ quien pone la │ NEXO   │ de la     │ propio │
 │ (+ imprevistos)│ fijos      │ mercancía     │ (si la │ gestora   │ de la  │
 │                │            │ (Casa Viva    │ hay)   │           │ gestora│
 │                │            │ o NEXO)       │        │           │        │
 └──────────────────────────────────────────────────────────────────────────┘
 └──────────────── PRECIO BASE (lo publica la tienda) ───────────┘ └ suyo ──┘

 + MENSAJERÍA aparte, en CUP, por zona → 100 % para el mensajero (D40)
```

| Parte | Quién la recibe | Cuándo se paga | Moneda |
|---|---|---|---|
| Costo del proveedor | Proveedor | Al comprarle: antes (Casa Viva, con existencias) o al vender (bajo pedido) | La del proveedor (casi siempre USD) |
| Transporte de lo voluminoso | Quien lo hace (Ernesto, carro o camión) | Al traerlo. **Sale del margen, no de la mensajería del cliente** | USD o CUP (se pasa a USD con la tasa del día) |
| Gastos fijos | El negocio (salarios, luz, renta…) | Cada mes | CUP (se reparten por unidad) |
| Margen del negocio | Casa Viva (Lennys) o NEXO (bajo pedido) | Cuando el dinero está verificado (cierre) | USD (se cuenta en USD aunque entre en CUP) |
| Tarifa NEXO | NEXO | Solo en multi-negocio; **por decidir** (§4) | USD |
| Comisión de la gestora | La gestora | Aprobada en el cierre de caja, pagada al «Pedir mi pago» | USD (o CUP a la tasa del día del pago) |
| Recargo propio de la gestora | La gestora | Igual que la comisión | El cliente puede pagarlo en CUP: **la parte de la tienda se cuenta a la tasa del día y lo que sobra es de la gestora** |
| Mensajería | El mensajero (100 %) | Lo cobra al entregar | CUP |

**Dos formas de tratar el recargo propio (las dos existen y el motor debe soportar ambas):**
- **«Suma»** (tienda Casa Viva, hoy en la web): la gestora cobra su comisión **más** todo su recargo (`CVD_Commissions::calculate`: comisión + ganancia de precio).
- **«Se descuenta»** (NEXO bajo pedido, **D43**): el recargo de la gestora es suyo, pero **cuenta dentro de su 40 %**. NEXO solo le paga lo que falte hasta llegar al 40 %.

---

## 2. Las reglas, por capas

El motor aplica siempre el mismo orden y apunta qué regla usó en cada paso (el «recibo del precio», §3).

```
1. Costo total   = compra ÷ tasa + flete/transporte + gastos fijos por unidad, + imprevistos (1 %)
2. Regla que manda = producto > proveedor > categoría > general  (gana la más concreta)
3. Precio crudo  = según el método de la regla (margen objetivo, % sobre costo o margen fijo)
4. Suelo         = precio mínimo que deja el margen mínimo → si el precio crudo es menor, se sube y se avisa
5. Redondeo      = hacia arriba, a un número «bonito» (nunca por debajo del suelo)
6. Oferta        = si hay oferta activa, nunca por debajo del suelo (salvo «liquidación» aprobada)
7. Reparto       = comisión de la gestora, tarifa NEXO y margen del negocio
8. CUP           = precio USD × tasa del día (solo para mostrar y cobrar; nunca se guarda un precio en CUP)
9. Recargo de la gestora = encima del precio base, con tope si el negocio lo pone
```

**Datos fijos de los ejemplos** (reales de la nube): gastos fijos ≈ 1,6 USD por unidad, imprevistos 1 %, variables 2,5 % del precio (otros cargos 2 % + dependienta 0,5 %). Comisión según la nube.

### 2.1 Regla general (por defecto del negocio)
Es la que vale si nada más concreto aplica. Métodos posibles:
- **Margen objetivo** (el de la ficha de costo): precio = (costo total + comisión fija) ÷ (1 − margen − % variables − comisión %). Es el más seguro: el margen se mide sobre lo que paga el cliente, igual que las comisiones y los cargos.
- **% sobre el costo** («cost-plus»): precio = costo × (1 + %). Es más simple, pero un «+40 %» no es un 40 % de margen (es el 28,6 %). Es el error más común.
- **Margen fijo** (USD por unidad): es el de bajo pedido (D43).
- **El mayor de fijo y %**: lo que se recomienda para lo caro bajo pedido (§5).

**Ejemplo real, juego de ollas.** Costo 30, hoy a 50 USD, comisión fija 7.
- Costo total: (30 + 1,6) × 1,01 = 31,91.
- Con el ajuste que hay hoy en la nube (30 % de margen objetivo): (31,91 + 7) ÷ (1 − 0,30 − 0,025) = 57,64 → **58 USD**.
- Lennys lo vende a **50**. A 50 le quedan 50 − 31,91 − 7 − 1,25 = **9,84 USD limpios (19,7 %)**.

Conclusión: **el 30 % de Ajustes no es la regla real de Lennys.** Hay que preguntárselo (§6).

### 2.2 Regla por categoría
Las categorías tienen márgenes muy distintos: Habitación +54 %, Baño +30 %. Una regla por categoría evita poner el margen producto a producto.

**Ejemplo real, Juego de Sábanas Majestic King.** Costo 17, hoy a 27, comisión 3.
- Costo total: (17 + 1,6) × 1,01 = 18,78.
- Con una regla de ejemplo «Habitación: margen 16 %, comisión 11 %»: 18,78 ÷ (1 − 0,16 − 0,11 − 0,025) = 26,63 → redondeo → **27 USD**. Es justo el precio de hoy.

Eso enseña que **una regla de categoría puede reproducir los precios actuales** y aplicarse sola a los productos nuevos de esa categoría.

### 2.3 Regla por proveedor
Para lo que se vende **bajo pedido** (sin existencias): cada proveedor puede tener su margen, su transporte y sus condiciones.

**Ejemplo real, aire split Parker (proveedor «Nexus», producto 1013).** Costo ≈ 340 USD.
- Ernesto puso **+25 USD fijos** → 365.
- Con la regla de la bolsa del bot (más de 300 → +5 %) habría salido **357**.
- Con `pricing.ts` (tramo 250–500 → 12 %) habría salido **380,80**.

**Tres reglas, tres precios:** por eso hace falta una sola. El caso completo está en §5.

### 2.4 Regla por producto (excepción)
Gana siempre. Sirve para el precio de mercado, para un producto gancho o para una comisión especial.

**Ejemplo real, Cortina roller enrollable 100×160.** Costo 35, precio 55, comisión fija 7 USD (12,7 % del precio).
- Costo total: 36,96.
- Limpio: 55 − 36,96 − 7 − 1,38 = **9,67 USD (17,6 %)**.

La comisión de 7 es una excepción por producto (viene de BizneCubano, D36).

### 2.5 Suelo de margen (nunca perder dinero)
- **Suelo** = (costo total + comisión) ÷ (1 − margen mínimo − % variables).
- Además, **ganancia mínima en USD** (por ejemplo, 10 USD en lo caro bajo pedido).
- Si el precio queda por debajo del suelo, el motor **no lo publica solo**: avisa «por debajo del suelo» y pide el SÍ de la dueña. Es una comprobación fija en el código, no una «sugerencia».
- También se comprueba al **vender** (oferta, precio de la gestora, cambio a CUP), no solo al poner el precio.

**Ejemplo real, Toallas Cisne Blanco 40×70.** Costo apuntado 10 USD, precio 8, comisión 2.
- Con un margen mínimo de ejemplo del 5 %: suelo = (11,71 + 2) ÷ (1 − 0,05 − 0,025) = 14,82 → **15 USD**.
- El motor marcaría: «se vende a 8 y el suelo es 15».

Lo más probable es que **el costo esté mal apuntado** (¿10 USD es el paquete?). Pasa lo mismo con «Toallas pequeña»: costo 140, precio 10 (¿en CUP?). **19 productos** están así. Se le preguntan a Lennys; no se corrige nada solo.

### 2.6 Redondeo
- **Hoy todos los precios son dólares enteros** (149 de 149). Es lo cómodo para cobrar en efectivo y por WhatsApp.
- Los precios terminados en 9 o 99 funcionan en productos de comparación rápida. Los redondos dan más sensación de calidad. Eso decide la terminación según la categoría, y no para todo igual [Competera, Umbrex].
- **Propuesta:**
  - USD hasta 100: entero hacia arriba.
  - De 100 a 500: múltiplo de 5.
  - Más de 500: múltiplo de 10.
  - CUP: hacia arriba a 100.
  - **Siempre hacia arriba y nunca por debajo del suelo.** Si redondear dejara el precio bajo el suelo, se sube al siguiente escalón.
- **Ejemplos:** 29,31 → **30** · 390,60 → **395** · 27 USD × 780 = 21.060 → **21.100 CUP**.

### 2.7 CUP con la tasa del día
- El precio **se guarda solo en USD**. El CUP se calcula al mostrar y al cobrar: precio USD × tasa del día. Es lo que ya hace `CVD_Daily_Rates::cup_for`.
- **Una sola tasa.** La de la web (`cvd_daily_rates`, la manda Maryta cada mañana o la corrige Lennys) pasa a la nube y la caja, el panel y el motor leen la misma. Hoy hay 780 en la web y 775 en la nube.
- **Tasa vieja:** con más de 36 h sin actualizar, aviso. Ya existe `STALE_HOURS`.
- **En el pedido** se guarda la tasa usada (`rate_cup_used`). Si la gestora cobró en CUP a otra tasa, se guarda también la suya (`gestora_cup_rate`) y los CUP cobrados.
- **Regla para el cambio de la gestora:** la parte de la tienda se cuenta en CUP a la tasa del día. Si la gestora cobra a una tasa más baja (más barata para el cliente), la diferencia sale de **su** parte, no de la tienda. Si cobra a una tasa más alta, la ganancia es suya. Así nadie discute por la tasa (ver §5, Harley).
- **Colchón (opción):** cuando el dólar sube rápido, algunas tiendas suman un 2–5 % a la tasa para no perder entre que se cobra y se repone [Fourthwall, Monetizely]. Para Cuba, donde el dólar informal pasó de ~440 CUP en enero a ~560 en mayo de 2026 [elTOQUE vía Directorio Cubano], es una pregunta para Lennys, no algo que se ponga solo.
- **Ejemplo real:** juego de cortina Royale, 27 USD × 780 = **21.060 CUP**, o 21.100 con el redondeo propuesto.

### 2.8 Recargo propio de la gestora (y su tope)
- **Mínimo:** el precio base de la tienda. La gestora nunca vende por debajo; ya existe (`_cvd_min_price`).
- **Tope:** hoy **no hay** (Casa Viva, 11-oct: «la gestora sube lo que quiera»), salvo un tope personal o por producto.
- **Propuesta:**
  - mantener «sin tope», pero con **aviso** si su precio supera en más de un 30 % el de la tienda;
  - avisar también si supera lo que encuentra «Buscar precios» en Revolico;
  - con un tope opcional por negocio.

  El riesgo es que un precio muy alto espante al cliente y dañe la marca.
- **Ejemplo real:** Majestic King a 27 con una gestora al +10 % → 29,70 (ella redondea a 30). La gestora gana 3 de comisión + 3 de recargo = **6 USD**. En el perfil «Tienda Casa Viva» el recargo **suma**.

### 2.9 Ofertas
- Ya existen el precio regular y el de oferta en la nube (`regular_minor`) y en el panel.
- **Regla:** la oferta nunca baja del suelo, salvo que se marque **«liquidación»** con el SÍ de la dueña, y queda apuntado quién y por qué.
- **Quién paga la rebaja (por decidir):** con comisión fija en USD, por defecto la gestora **cobra lo mismo** y la rebaja sale del margen de la tienda. Con comisión en %, baja con el precio.
- **Ejemplo real, Majestic King:**
  - en oferta a 25: limpio 25 − 18,78 − 3 − 0,63 = **2,60 USD (10,4 %)** → permitido;
  - en oferta a 22: −0,33 → **bloqueado** (es pérdida).

---

## 3. Modelo de datos (dónde vive y cómo se audita)

**Dónde vive:** las reglas y el cálculo viven en la **nube NEXO** (Supabase `nexo-production`, esquema `nexo_business`), porque la nube ya manda en precios (D38) y en comisiones (D37). **Core (la web) no calcula precios**: los recibe (puente de existencias y precios, `nexo-commission-push`) y guarda la foto de cada pedido, como ya hace. La caja lee de la nube.

| Tabla | Para qué | Campos principales |
|---|---|---|
| `price_policies` (nueva) | Cada versión del juego de reglas de un negocio. **Nunca se edita: se crea otra versión** | `id`, `business_id`, `version`, `profile` (`tienda`, `dropship_margen_fijo`, `bolsa`), `status` (borrador/activa/retirada), `effective_from`, `effective_to`, `created_by`, `approved_by`, `approved_at`, `note` |
| `price_rules` (nueva) | Las reglas de cada versión | `policy_id`, `scope` (general/categoría/proveedor/producto), `scope_id`, `priority`, `cost_min`, `cost_max`, `method` (margen objetivo / % sobre costo / margen fijo / el mayor de fijo y %), `target_margin_pct`, `markup_pct`, `flat_markup_usd`, `min_margin_pct`, `min_profit_usd`, `commission_mode` (fija USD / % del precio / % del margen), `commission_value`, `markup_mode` (suma / se descuenta), `nexo_fee_pct`, `transport_mode` (incluido en el costo / del margen / lo paga el cliente), `rounding` (tramos USD y CUP), `gestora_markup_cap_pct`, `gestora_markup_warn_pct` |
| `suppliers` (nueva) | Proveedores con su «sí» (VISION) | `id`, `business_id` o red, `name`, `phone` (solo con consentimiento), `consent_at`, `currency`, `credit_days`, `min_order`, `delivery` (quién transporta), `returns`, `notes` |
| `product_costs` (existe) | Costo por producto | + `supplier_id`, `transport_usd`, `source` (factura / llegó mercancía / a mano / bolsa), `valid_from` |
| `exchange_rates` (existe) | **Única** tasa del día con historial | + `source` (bot / panel), `sent_at`. La opción de la web pasa a ser una copia |
| `price_calculations` (nueva) | **«Recibo del precio»**: cada cálculo, para siempre, sin borrar | `id`, `product_id`, `policy_id` + `version`, `engine_version`, `inputs` (costo, transporte, gastos fijos, tasa), `steps` (lista: regla → qué hizo → cuánto sumó), `outputs` (`price_usd`, `floor_usd`, `commission_usd`, `nexo_fee_usd`, `business_net_usd`, `margin_pct`, `price_cup`, `rate_used`), `warnings` (bajo el suelo, sin costo, tasa vieja, costo raro), `computed_at` |
| `price_changes` (o la `cost_audit` que ya existe) | Quién cambió qué precio, cuándo y por qué | `product_id`, `old_usd`, `new_usd`, `calculation_id`, `actor`, `reason`, `applied_at` |
| `promotions` (nueva) | Ofertas con fecha | `scope`, `type` (% / USD / precio), `value`, `starts_at`, `ends_at`, `who_absorbs` (negocio / gestora / a medias), `below_floor_allowed` + `approved_by` |
| `gestora_price_overrides` (más adelante) | Lo que hoy es `wp_cvd_gestora_prices`, con historial | `gestora_id`, `product_id`, `price_usd` o `markup_pct`, `valid_from`, `created_at` |
| Foto en cada línea de pedido (existe en Core) | Lo que se cobró de verdad | Ya están `_cvd_base_unit_price`, `_cvd_sale_unit_price` y `_cvd_commission_snapshot`. **Añadir:** `price_calculation_id`, `policy_version`, `rate_cup_used`, `gestora_cup_rate`, `cup_collected`, `transport_usd` |

**Auditoría en una frase:** cada precio publicado apunta a su recibo (`price_calculations`). El recibo dice qué versión de reglas, qué regla de qué capa, qué costo y qué tasa se usaron. Cada pedido guarda una foto que no cambia aunque luego cambien las reglas. Es la idea de la «cascada de precio» de los sistemas grandes (Oracle Siebel) y de los precios con fecha de vigencia en vez de pisarlos (Zuora) [Oracle, Zuora].

**Lo que hay que igualar antes de construir:**
1. **Orden de la comisión:** en la nube va gestora → producto → general; en la web, producto → gestora → general. Propuesta: **producto > gestora > general** en las dos.
2. **Una sola tasa** del CUP (780 contra 775).
3. Royale: 4 USD en la nube y 3 en el producto padre de la web. Las variantes probablemente tienen 4 por el empuje de la nube: **hay que comprobarlo**.

---

## 4. Tres opciones para las cifras por defecto (PROPUESTAS — Ernesto y Lennys deciden)

> **Ninguna cifra de esta sección está decidida.** La única regla vigente es la **D43** (provisional) para lo caro bajo pedido con margen fijo.

### 4.1 Perfil «Tienda Casa Viva» (productos con existencias)

**Venta típica de ejemplo:** juego de cortina tapa sol Royale.
- Costo 18 USD.
- Costo total con gastos fijos e imprevistos: **19,79 USD**.
- Hoy se vende a **27 USD**, con 4 de comisión, y deja **2,54 USD limpios (9,4 %)** a la tienda.

| | **A · Conservadora** (escribir lo de hoy) | **B · Equilibrada** | **C · Agresiva** (crecer la red de gestoras) |
|---|---|---|---|
| Margen limpio de la tienda | 14 % | 15 % | 15 % |
| Comisión de la gestora | 11 % del precio (o la fija por producto que ya hay) | 12 % | 15 % |
| Tarifa NEXO | 0 (Casa Viva es banco de pruebas) | 3 % | 5 % |
| Margen mínimo (suelo) | 5 % | 8 % | 8 % |
| Tope del recargo de la gestora | sin tope, aviso a partir de +30 % | aviso a partir de +30 % | tope del 50 % |
| **Royale: precio base** | 27,29 → **28 USD** (21.840 CUP) | 29,31 → **30 USD** (23.400 CUP) | 31,66 → **32 USD** (24.960 CUP) |
| Gestora: comisión | 3,08 | 3,60 | 4,80 |
| Gestora: con su +10 % propio | 3,08 + 2,80 = **5,88** | 3,60 + 3,00 = **6,60** | 4,80 + 3,20 = **8,00** |
| NEXO | 0 | 0,90 | 1,60 |
| Tienda (limpio) | 4,43 (15,8 %) | 4,96 (16,5 %) | 5,01 (15,7 %) |
| Gestora con 20 ventas así al mes (ejemplo) | ~118 USD | ~132 USD | ~160 USD |

**Referencias de fuera:**
- **Natura y Avon** (venta por catálogo en Latinoamérica): la consultora gana del **25 al 37 %** según su nivel, y menos en las ventas por internet [El CEO, Expansión].
- **Afiliados de Shopee Brasil:** hasta un **9–14 %** según la categoría [Tecnoblog, Ecomobi].
- **Meesho (India):** la revendedora pone su propio recargo encima del precio mayorista [upGrowth].
- **Plataformas de productos físicos:** suelen quedarse con el **8–15 %** de cada venta (abiertas) o el 12–18 % (seleccionadas) [knowledgelib, Flexprice].
- **Lo que gana una gestora de Casa Viva** (11 % más su recargo) está en la zona de los afiliados. Solo se acerca a Natura si sube su propio precio.

### 4.2 Perfil «NEXO bajo pedido, margen fijo» (lo caro, sin existencias)

| | **A · Conservadora** | **B · D43 (VIGENTE, provisional)** | **C · Agresiva** |
|---|---|---|---|
| Margen al poner el precio | el mayor de 25 USD y el 7 % del costo, más el transporte | el mayor de 30 USD y el 9 % del costo, **más el transporte** | el mayor de 35 USD y el 10 % del costo, más el transporte |
| Transporte | sale del margen, antes de repartir | **sale del margen, antes de repartir** | sale del margen, antes de repartir |
| Reparto de lo que queda | 30 % gestor / 70 % NEXO | **40 % gestor / 60 % NEXO** | 50 / 50 |
| Recargo propio del gestor | se descuenta de su parte | **se descuenta de su 40 %** | suma (como en la tienda) |
| Ganancia mínima de NEXO | 10 USD | 10 USD (propuesta) | 10 USD |
| CUP | tasa del día | **tasa del día** | tasa del día |

---

## 5. Caso real: el aire split Parker de Harley

**Datos:**
- Producto 1013, privado en la web, a **365 USD**. Proveedor «Nexus». Sin existencias propias.
- Ernesto puso **+25 USD fijos** → costo del proveedor ≈ **340 USD** (falta confirmarlo).
- Ernesto lo compra y lo transporta él (es grande): **el transporte es real y aún no se sabe cuánto es (T)**.
- Harley lo vendió en CUP: **291.593,75 CUP**, es decir, 376,25 USD a 775 («10 menos que 785»). La tasa de la web hoy es **780**.
- En la web el producto **no tiene comisión propia**. Si se vendiera por la web, Harley cobraría el 10 % por defecto: **36,50 USD**, más que todo el margen de 25. **Pérdida segura.** Hay que ponerle la regla (o el perfil) antes de que alguien lo venda por la web.

**Paso 1. Pasar lo que cobró Harley a la tasa del día (D43):**
- Parte de NEXO en CUP: 365 × 780 = **284.700 CUP**.
- Lo que cobró Harley de más: 291.593,75 − 284.700 = **6.893,75 CUP = 8,84 USD** a 780.

  Harley cree que son 11,25 USD (a 775). Los 2,41 USD de diferencia son el descuento de tasa que **él** le dio al cliente, y salen de su parte, no de la de NEXO.

**Paso 2. El margen que se reparte (D43):** margen = 365 − 340 − T = **25 − T**.
- Harley: 40 % del margen. Su recargo (8,84) cuenta dentro de ese 40 %.
- NEXO le paga solo lo que falte: máximo(0; 40 % del margen − 8,84).

**Reparto con D43 según el transporte** (T son **ejemplos**, no datos: falta el costo real):

| Transporte T | Margen a repartir | 40 % de Harley | NEXO le paga a Harley | Harley se queda en total | Ernesto / NEXO se queda |
|---|---|---|---|---|---|
| 0 | 25,00 | 10,00 | **1,16 USD (906,25 CUP)** | 10,00 | **15,00** |
| 5 | 20,00 | 8,00 | 0 | 8,84 (su recargo) | **20,00** |
| 15 | 10,00 | 4,00 | 0 | 8,84 | **10,00** |
| 30 | −5,00 | 0 | 0 | 8,84 | **−5,00 (pérdida)** |

**En palabras:** con D43, los 6.893,75 CUP que Harley cobró de más **ya cubren su 40 %**, salvo que el transporte cueste menos de **2,90 USD**. Si el transporte cuesta más de 25 USD, NEXO pierde dinero. Eso es lo que el suelo evita la próxima vez.

**La misma venta con las tres opciones** (con T = 0 y T = 15, ejemplos):

| | A (30/70, se descuenta) | **B = D43 (40/60, se descuenta)** | C (50/50, suma) |
|---|---|---|---|
| T = 0 → Harley / NEXO | 8,84 / 25,00 | **10,00 / 15,00** | 21,34 / 12,50 |
| T = 15 → Harley / NEXO | 8,84 / 10,00 | **8,84 / 10,00** | 13,84 / 5,00 ⚠ por debajo de los 10 mínimos |

**Cómo se habría puesto el precio con el motor.** Ejemplo con un transporte de 20 USD:
- La condición del suelo es: margen ≥ transporte + **17 USD**, porque el 60 % de 17 ≈ 10 USD para NEXO.
- A: 340 + 20 + 25 = 385 → **385**. Harley 7,50 / NEXO 17,50.
- B (D43): 340 + 20 + máx(30; 30,60) = 390,60 → **395**. Margen 35 → Harley 14 / NEXO 21.
- C: 340 + 20 + 35 = 395 → **395**. Harley 17,50 (+ su recargo) / NEXO 17,50.

### Regla rápida para Ernesto (ventas sueltas como esta, desde hoy, según D43)
1. **Antes de publicar:** margen fijo = **transporte real + al menos 17 USD** (si el producto pasa de 300 USD, mejor un 9–10 % del costo). Redondea hacia arriba a 5.
2. **Al vender:** margen = precio base − proveedor − transporte. **40 % para el gestor, 60 % para ti.**
3. **Si el gestor cobró más:** pasa lo que cobró a USD con **la tasa del día de la web**. Lo que pase del precio base es suyo y **se le resta de su 40 %**. Si ya lo cubre, no le debes nada más.
4. **Si el margen sale negativo,** no vendas a ese precio: súbelo o no lo aceptes.
5. **Pon el precio de la web en USD y deja que el CUP lo calcule la tasa del día.** Nunca escribas un precio en CUP a mano.

---

## 6. Preguntas

### Para Lennys (cortas, para mandar tal cual)
1. ¿Cómo pones el precio hoy? ¿Le sumas un tanto al costo, un %, o miras cuánto lo vende la competencia?
2. ¿Cuánto quieres ganar limpio en cada cosa, más o menos? ¿Lo mismo en sábanas que en baño o cocina?
3. En el panel hay 152 productos con costo. ¿Ese costo es **por unidad**? Por ejemplo, las Toallas Cisne Blanco tienen costo 10 y precio 8: ¿el 10 es el paquete? Y «Toallas pequeña» tiene costo 140 y precio 10: ¿son CUP?
4. ¿El costo incluye lo que pagas por traer la mercancía hasta la tienda?
5. En Ajustes → Costos hay un «margen objetivo» del 30 %. ¿Lo pusiste tú? Con ese 30 %, las ollas saldrían a 58 y hoy están a 50.
6. ¿Los gastos fijos del panel (unos 407 mil CUP al mes) están completos?
7. ¿Quiénes son tus proveedores principales? ¿Les pagas en USD o en CUP? ¿Te dan días para pagar, piden un mínimo de compra, aceptan devoluciones?
8. Las comisiones de las gestoras, ¿las quieres seguir con monto fijo por producto (como en BizneCubano) o con un %? ¿Las cortinas Royale son de 3 o de 4 USD?
9. Cuando pones algo en oferta, ¿la gestora cobra la misma comisión?
10. ¿Las gestoras pueden subir el precio todo lo que quieran, o pones un tope?
11. Los CUP que entran, ¿los cambias a la tasa de Maryta o a otra?

### Para Ernesto (caso Parker)
1. ¿El precio de Nexus es exactamente 340 USD? ¿Se paga en USD o en CUP?
2. ¿Cuánto te costó de verdad el transporte (carro o camión, ida y vuelta)?
3. ¿Los 291.593,75 CUP que cobró Harley te llegan enteros? ¿A qué tasa los cambias tú?
4. ¿Qué le dijiste a Harley que iba a ganar? (para no contradecirlo)
5. ¿NEXO le cobra algo a Casa Viva por las ventas de su tienda, o es 0 mientras sea banco de pruebas?

---

## 7. Pasos para construirlo

| Paso | Qué es | Esfuerzo | Quién |
|---|---|---|---|
| **1. Función pura + archivo de reglas** | `packages/business-domain/src/pricing.ts` es una función sin base de datos: entra (producto, costo, transporte, reglas, tasa) y sale (precio, suelo, reparto, CUP, avisos, recibo). Las reglas van en `config/precios/casa-viva.json` y `nexo-dropship.json` (con versión). Pruebas con casos reales: Royale, Majestic King, juego de ollas, Toallas Cisne Blanco (bajo el suelo) y Parker (D43, con T = 0/5/15/30). La misma función la usan el panel, la skill `/ficha`, una función `nexo-price-quote` de la nube y la bolsa del bot (que deja su `myPrice`). Incluye un **simulador**: pasa los 335 productos y dice cuántos subirían, cuántos bajarían y cuántos están bajo el suelo, **sin cambiar ningún precio**. La ficha de costo (`suggestedUsd`) se iguala con la función | **1–2 días** de Claude + 30–45 min de Lennys para revisar la simulación | Claude |
| **2. Pantalla en el panel** | Ajustes → «Reglas de precio»: general, por categoría, por proveedor y por producto. «Ver qué cambia» antes de aplicar. Aplicar con un toque, con el SÍ de la dueña (usa `nexo_business_bulk_prices`). En cada producto, «¿Por qué cuesta esto?» (el recibo). Avisos: bajo el suelo, sin costo, tasa vieja, costo raro. Migración de las tablas de §3. Una sola tasa | **4–6 días** + una prueba guiada con Lennys | Claude + Lennys |
| **3. NEXO multi-negocio** | Reglas por negocio, red de proveedores, tarifa NEXO, la gestora que vende de varios negocios, reparto por pedido y libro por moneda (`cvd_owner_financial_ledger` → nube), recargo «suma / se descuenta» por perfil, Core solo lee precios ya calculados | **3–5 semanas**, cuando estén decididos D42 (comisiones de gestoras) y la tarifa NEXO | Claude + decisiones de Ernesto |

**Antes del paso 1 (10 minutos, con permiso de Ernesto):** ponerle al producto 1013 (Parker) su comisión o marcarlo «bajo pedido», para que no cobre el 10 % por defecto si alguien lo vende por la web.

---

## 8. Riesgos y cómo se cubren

| Riesgo | Qué puede pasar | Cómo lo cubre el motor |
|---|---|---|
| **El dólar sube o baja de golpe** | Se cobra en CUP a una tasa y se repone a otra más cara | Precio guardado en USD. CUP con la tasa del día (aviso si tiene más de 36 h). Tasa guardada en cada pedido. Colchón opcional del 2–5 %. La diferencia de tasa de la gestora sale de su parte |
| **Margen negativo** | Costo mal apuntado, oferta muy baja, transporte caro, comisión por defecto en lo caro (Parker) | Suelo de margen y ganancia mínima en USD, comprobados al poner el precio **y** al vender. Aviso «costo raro» (precio < costo). Lo caro sin regla no hereda el 10 % |
| **La gestora sube demasiado** | El cliente ve el precio inflado, no compra y culpa a la tienda | Aviso a partir de +30 %, tope opcional por negocio y comparación con «Buscar precios» |
| **Transparencia con las gestoras** | No entienden cuánto ganan, se sienten engañadas o discuten por la tasa | En el área de gestoras: «ganas X por unidad» (ya existe en «Lo que más se vende»), regla de la tasa escrita, comisión aprobada en el cierre y visible. Publicar la FAQ 26 (cómo y cuándo se paga) |
| **Reglas en muchos sitios** | Cada pantalla calcula distinto (hoy hay 5 reglas) | Una sola función y una sola tabla de reglas. El resto solo lee |
| **Cambiar reglas rompe pedidos viejos** | Una comisión recalculada cambia lo que ya se pagó | Versiones que nunca se pisan y foto fija en cada línea de pedido (ya existe `_cvd_commission_snapshot`) |
| **Precios inventados** (D11) | La IA o una persona pone un precio sin costo | El motor exige un costo. Sin costo, marca «Falta» y no publica solo |

---

## 9. Fuentes de internet (resumen)
- Meesho, recargo de la revendedora sobre el precio mayorista: [upGrowth](https://upgrowth.in/meesho-built-social-commerce-india-gtm-strategy-teardown/), [Zerodha Daily Brief](https://thedailybrief.zerodha.com/p/inside-meeshos-ipo).
- Natura y Avon, comisión de las consultoras (25–37 % por nivel; un solo artículo, sin dato oficial): [El CEO](https://elceo.com/negocios/avon-apuesta-a-subir-ganancias-de-vendedoras-para-despertar-al-gigante-dormido/), [Expansión](https://expansion.mx/empresas/2024/05/21/natura-avon-unen-fuerza-pero-no-catalogos).
- Afiliados de Shopee Brasil (hasta 14 %): [Tecnoblog](https://tecnoblog.net/477797/exclusivo-shopee-lanca-programa-de-afiliados-no-brasil-com-comissoes-de-ate-14/), [Ecomobi](https://ecomobi.com/shopee-brazil-affiliate-with-ecomobi-passio).
- Lo que se quedan las plataformas, por tipo: [knowledgelib 2026](https://knowledgelib.io/business/industry-benchmarks/marketplace-industry-benchmarks-2026/2026), [Flexprice](https://flexprice.io/questions/typical-digital-marketplace-take-rates), [Cube Asia, Shopee](https://cube.asia/shopee-take-rate-tracker/).
- Márgenes de dropshipping, margen frente a subida sobre el costo (la «trampa» del cost-plus): [Cleverence](https://www.cleverence.com/articles/for-business/add-margin-to-cost-4829/), [Wall Street Prep](https://www.wallstreetprep.com/knowledge/cost-plus-pricing/), [Closo](https://closo.co/blogs/inventory-liquidation/wholesale-distributors-that-dropship).
- Redondeo y precios terminados en 9: [Competera](https://competera.ai/resources/articles/rounding-rules-pricing-tips-and-tricks-to-make-customers-purchase-your-goods), [Umbrex](https://umbrex.com/resources/frameworks/pricing-frameworks/charm-pricing/).
- Suelo de margen como comprobación fija: [DealHub](https://dealhub.io/glossary/margin-guardrails/), [techinterview, motor de precios](https://www.techinterview.org/post/3233472114/lld-dynamic-pricing/).
- Precios con varias monedas y colchón de tasa: [Fourthwall](https://help.fourthwall.com/manage-my-shop/shop-settings/multi-currency-settings.md), [Monetizely](https://www.getmonetizely.com/articles/how-to-implement-multi-currency-saas-pricing-while-managing-exchange-rate-risk). Argentina, tiendas que ponen el precio en dólares: [ESM Magazine](https://esmmagazine.com/a-brands/ice-cream-prices-double-in-a-month-as-argentina-battles-inflation-247661).
- Dólar informal en Cuba en 2026 (elTOQUE, republicado): [Directorio Cubano](https://www.directoriocubano.info/?p=130147).
- Auditoría, precios con fecha de vigencia y cascada de precio: [Zuora](https://docs.zuora.com/en/zuora-billing/set-up-zuora-billing/build-product-and-prices/dynamic-pricing/out-of-the-box-effective-dating-support), [Oracle Siebel](https://docs.oracle.com/cd/E58886_01/books/PriceAdm/PriceAdm_Overview4.html), [OSID](https://osid.org/specifications/osid/ordering/rules/package.html), [techinterview, motor de precios](https://www.techinterview.org/post/3233470062/lld-price-engine/).

**Ojo:** muchas de estas cifras salen de blogs de empresas que venden software. Sirven como orientación, no como regla.

## Respuestas de Lennys (11-oct, 22:37–22:45, notas de voz)
- La **ficha de costo** del Excel de Maryta («AUTOMATIZACION OCTUBRE 2026», hoja F COSTO) tiene la fórmula; la tenemos analizada en `ECONOMY_AND_ROLES.md`.
- En la página debe ir el **costo de compra**; la ganancia la saca ella después.
- Comisión de la gestora: **en general un poco por encima del 10 %, o hasta el 10 %**.
- Precio: miran el precio aproximado en las redes y ajustan. El margen suele quedar **por debajo del 20 %**, sobre todo en los productos en **consignación**, porque buscan **rotación** (vender rápido y traer más) antes que ganancia.
- Consecuencia para el motor: el margen objetivo del 30 % de Ajustes no es el real. Perfil «Tienda Casa Viva»: margen por defecto ~15–20 %, comisión ~10 %, aviso de margen negativo después de la comisión, y opción «precio de mercado» (precio fijado a mano con el margen calculado y visible).
- **Regla de comisión de Lennys (22:46):** la comisión del gestor es el **10 % del precio de venta o un poco más** (50 USD → 5–6 USD), buscando que **la tienda gane al final más o menos lo mismo que el gestor (~5 USD)**. **Si la tienda gana menos de 2–3 USD, el gestor recibe menos comisión.** En el motor: comisión = 10 % (redondeo a USD), con un guardia de «ganancia mínima de la tienda» (configurable, por defecto 2,5 USD) que la reduce si hace falta.
