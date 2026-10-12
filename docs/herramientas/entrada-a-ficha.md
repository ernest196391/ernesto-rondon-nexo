# De la entrada de mercancía a la ficha publicada

**Fecha:** 2026-10-11 (noche) · **Autor:** Claude (solo lectura y plan: no se cambió código, datos ni se mandó nada) · **Para:** Ernesto
**Qué es:** la herramienta que convierte las fotos que hace la dependienta en "Entradas" en un producto listo para vender en la web. En NEXO se llama **"Digitaliza tus productos"** (`GLOSARIO.md`).

**Lo que pidió Ernesto:**
- La dependienta hace fotos de:
  - el producto;
  - la factura del proveedor;
  - la etiqueta;
  - el manual y las medidas, cuando se pueda.
- Con esas fotos sale solo:
  - una búsqueda en la web de las especificaciones;
  - el título y la descripción para Google (SEO);
  - un texto de venta;
  - fotos mejoradas;
  - la publicación en la tienda web.
- Después, esta herramienta se vende como parte de NEXO.

---

## 1. Lo que ya existe (y cuánto funciona)

**Respuesta corta:** casi todas las piezas existen, pero están repartidas en 4 sitios que no se hablan.
**La más cercana al flujo completo es el "Product Studio" de antes** (Render): ya hace fotos → lectura de la etiqueta → búsqueda en la web → textos SEO → precio con margen → borrador en WooCommerce. Lo que le falta:
- leer la factura;
- estar en la nube NEXO;
- tener una pantalla para la dependienta;
- mejorar fotos con Higgsfield.

| # | Pieza | Dónde está (exacto) | Qué hace de verdad | ¿Funciona? |
|---|---|---|---|---|
| A | **Product Studio: el cerebro de IA** | `lib/commerce/ai.ts`, con 3 funciones: `analyzeProductImages`, `researchProduct` y `generateProductCopy` (cada una con su prompt y su esquema JSON estricto). Lo llama la ruta `app/api/studio/products/captures/[id]/process/route.ts`. Pantalla: `app/studio/products/ProductCaptureClient.tsx` | **1. Visión y lectura de etiqueta:** marca, modelo, tipo, categoría, precio visto, garantía, código de barras y QR, especificaciones y lo que incluye. Cada dato lleva su **confianza** (0 a 1), su **origen** (`photo`, `ocr`, `manufacturer`, `manual`, `retailer` o `inference`) y la foto que lo respalda. Además dice qué foto falta ("missingCritical", "requestedEvidence"). **2. Búsqueda web** (OpenAI con búsqueda web): solo si se leyeron marca y modelo; prioriza fabricante y manual; devuelve los datos confirmados con sus enlaces y las contradicciones. **3. Textos:** título, título SEO, slug, SKU, descripción corta y larga, beneficios, especificaciones, lo que incluye, garantía, FAQ, meta description, palabra clave, palabras relacionadas y texto alternativo de la foto. "Usa solo hechos respaldados" | **A medias.** El código está completo, pero corre en Render con su propia base (`lib/commerce/db`) y login (`tienda.nexocuba.com/studio`). No consta ningún uso real. `docs/TASKS.md` lo da por "blocked". Modelos por defecto: `gpt-5.4-mini` (se cambian con variables) |
| B | **Precio por margen** | `lib/commerce/pricing.ts` (`DEFAULT_PRICE_RULES`, `selectPriceRule`, `calculatePrice`) | Del costo al precio con reglas por tramos (25 % hasta 50 USD con +10 mínimo, 20 % de 50 a 100, … 7 % desde 2.500). Por producto, categoría o comercio. Puede sumar comisión de gestora y redondeo | Funciona como código. **La regla real de Casa Viva no está escrita**: hay que pedírsela a Lennys |
| C | **Foto para la tienda (sin IA)** | `lib/commerce/images.ts` (`createCommerceWebp`) | Endereza la foto, fondo blanco, hasta 1800 px, WebP | Funciona |
| D | **Borrador en WooCommerce** | `app/api/studio/products/captures/[id]/woocommerce/route.ts`, `lib/commerce/woocommerce.ts` (`createWooDraft`), `lib/commerce/wordpress.ts` | Sube las fotos y crea el producto **en borrador**. **No lo crea si falta un dato crítico** | A medias: hacen falta las claves REST de Woo en Render. Además choca con D16 ("WooCommerce es solo un canal") |
| E | **Curru lee facturas** | `supabase/functions/nexo-curru/index.ts` (prompt en la línea 20) → Core `/panel/curru/invoice` (`class-cvd-panel-bridge.php`, `CVD_Curru_AI::read_image`, gpt-4.1-mini) | Lee proveedor, fecha y líneas (nombre tal como está escrito, cantidad, costo y moneda USD/CUP/MLC). Busca cada nombre en el catálogo (`nexo_business_match_names`). "No inventes productos ni precios" | **Funciona** (verificado el 11-oct con una factura de prueba). La clave de IA no sale de WordPress |
| F | **"Llegó mercancía" en la caja y en el panel** | Caja: `apps/business-pos/src/receive.ts` + `supabase/functions/nexo-device-receive` + `nexo_business.receive_goods_as`. Panel: `apps/business-dashboard/index.html` (~línea 2971) | Foto de la factura (cámara o galería) → Curru → revisar líneas → "Confirmar entrada": sube el stock y guarda el costo y el dueño (socia). La firma la dependienta que atiende. Respeta los permisos por dependienta | **Funciona** (caja 1.0.7+). En la nube hay **0 entradas reales**. **Solo sirve para productos que ya existen**: una línea nueva se queda en rojo "Elige el producto" |
| G | **Digitaliza: recepción y ficha de conocimiento** | `apps/business-dashboard/digitaliza.html` + `digitaliza/` (`app.js`, `domain.js`, `knowledge.js`, `core.js`, `drafts.js`, piloto `pilots/olla-reina-eon.js`). Migraciones `20261005010000_nexo_business_product_intake.sql` y `20261005020000_nexo_business_product_knowledge.sql`. Documento `docs/nexo-business/DIGITALIZA.md` | Recepción en 5 pasos (tipo, fotos, datos, revisar, Core), borrador guardado en el teléfono y fotos originales en el bucket privado `product-intake`. **Ficha de conocimiento:** cada dato con estado `verified` / `declared` / `pending` / `contradicted`, su fuente y evidencia (enlace o foto), historial de versiones y "piezas a revisar" cuando cambia un dato o el precio | **A medias.** Migraciones **aplicadas en producción el 7-oct** (ESTADO dice que no). Página publicada en `casaviva.company/panel/digitaliza.html`, **sin enlace desde el panel**. Tablas `product_intakes`, `product_facts`, `product_knowledge`, `product_experiences` y `content_pieces`: **0 filas**. No usa IA. No crea el producto en la web |
| H | **Productos del panel** | Panel → Productos (`nexo_business_product_save`, bucket `nexo-product-photos`) → Core `/panel/products/save` y `/products/variable` (`class-cvd-panel-bridge.php`, líneas ~401 y ~659) | Crea el producto en la caja **y en la web** (stock 0, después el puente), con diseños y colores, categoría, foto y comisión | **En producción.** Pero `save_product` **no guarda descripción, descripción corta, galería, atributos ni SEO** |
| I | **SEO de la web** | Core `class-cvd-site-privacy.php` (`meta_description`) | Toma la descripción corta (si no hay, la larga) como meta description, recortada a 158 letras | En producción. Solo sirve si hay buena descripción corta |
| J | **Fotos con Higgsfield** | Conector Higgsfield en Claude; `Casa-Viva/scripts/catalog/apply-photos.php` + `data/catalog/upscaled-photos.json` (guarda la foto anterior para volver atrás) | Sube a 2K y limpia la foto. En Casa Viva: 44 aplicadas, 15 descartadas (deformaba las etiquetas), ≈2,7 créditos por foto | Funciona, a mano. No hay script de lote con presupuesto |
| K | **Estudio de fotos gratis** | `vivabot/src/studio.js` (`studioPhoto`), `photos.js` (`polishPhoto`) | Quita el fondo (imgly, gratis en el servidor) y pone el fondo de marca a 1200 px. La IA da una nota de calidad | A medias: recorta mal las fotos difíciles |
| L | **Bolsa del bot** | `vivabot/src/catalog.js` (`extract`, `publishItem`) → Core `/bot/market/publish` | De anuncios de proveedores en grupos: título, 1–2 líneas, precio + margen, fotos. Publica como "Bajo pedido". **Es la única ruta que hoy escribe una descripción en la web** | A medias (480 artículos capturados, 2 aprobados). Es otra fuente, no la entrada de la tienda |
| M | **Fotos por WhatsApp** | `vivabot/src/index.js` `saveIncomingImage` → `/root/archivos/entrantes/AAAA-MM-DD/` (7 días) | Guarda las fotos que llegan por privado | En producción. No crea nada. `PRODUCTOS <slug>` **no existe** en el bot (solo está en la skill `nexo-fabrica`) |
| N | **Buscar precios (Core)** | `class-cvd-gestora-busca.php` | Con una foto busca ofertas en Revolico, Facebook y tiendas de Cuba | En producción. Sirve para **comparar el precio** de la ficha con el mercado |
| O | **Textos con reglas** | `lib/commerce/product-editorial.ts` (palabras prohibidas en los textos públicos) | Revisa que no salgan frases internas ("pendiente de validación"…) | Funciona |

**Curru:**
- Para el cliente, Curru es el asistente de la web y del bot (`askCurru` en `vivabot/src/curru.js`, que llama a `casa-viva/v1/curru/ask`).
- Para la entrada de mercancía, "Curru" es el lector de facturas (E).
- No hay otra Curru: es el mismo motor (`CVD_Curru_AI`).

---

## 2. El flujo que queremos

```
Dependienta (caja: "Llegó mercancía"  ó  WhatsApp al bot: "FICHA" + fotos)
   │  fotos: producto · factura · etiqueta · manual/medidas (si hay)
   ▼
1. Leer factura (Curru, ya existe)            → proveedor, costo, cantidad, moneda
2. Leer etiqueta y producto (Product Studio A) → marca, modelo, EAN/código, medidas, material…
3. ¿Es un producto que ya tenemos?             → sí: solo sube stock (F) · no: sigue
4. Buscar en la web (A, solo con marca+modelo) → especificaciones con enlaces
5. Borrador de ficha                           → título SEO, descripción corta y larga,
                                                  texto de venta, atributos, medidas,
                                                  precio = costo factura + regla de margen
6. Fotos: estudio gratis primero (K);           → Higgsfield (J) solo con el SÍ de Ernesto
   antes, decir el costo
7. Revisión: Lennys o Nataly                   → corrige, marca "confirmado", aprueba
8. Publicar                                    → WooCommerce de Casa Viva (H ampliado)
                                                  ó Tienda NEXO (otros comercios)
9. La ficha queda en Core (G)                  → la leen el bot, Curru, "Compartir ficha"
```

**Quién hace qué:**
- Las fotos las hacen **las dependientas**.
- Lennys solo aprueba, y puede delegar en Nataly. No se le mandan tareas de tienda (regla de memoria "Lennys es admin").

## 3. Regla de oro: nunca inventar especificaciones

Cada dato de la ficha lleva una etiqueta visible:

| Etiqueta | Cuándo | De dónde sale | ¿Sale en la web? |
|---|---|---|---|
| **Confirmado** | Se lee en la etiqueta, el manual, la caja o la factura, o lo midió la dependienta | origen `photo`, `ocr` o `manual`; o medida tomada en la tienda | Sí |
| **Sugerido** | Lo dice el fabricante o una tienda en internet, pero no lo vimos en el producto | origen `manufacturer` o `retailer`, con enlace | **Solo si Lennys o Nataly lo aprueban**; si no, se queda en la ficha interna |
| **Falta** | Nadie lo sabe | — | No. El borrador pide la foto que falta ("haz foto de la placa de atrás") |
| *(inferencia)* | La IA lo deduce | origen `inference` | **Nunca.** Se tira o pasa a "Falta" |

Cómo encaja con lo que ya hay:
- Confirmado = `verified` de Digitaliza (exige evidencia: la foto).
- Sugerido = `declared` (con el enlace como fuente).
- Falta = `pending`.
- Si la web contradice la etiqueta, se marca `contradicted` y **manda la etiqueta**.

**Otras reglas:**
- El precio **siempre** sale como sugerido. Nadie publica un precio sin el SÍ de quien revisa.
- La IA nunca escribe "pendiente de validación" ni frases internas en el texto público (`product-editorial.ts`).

## 4. Plan en pasos pequeños

Esfuerzo: **S** = horas, **M** = 1 a 3 días, **L** = una semana o más.

| Paso | Qué | Esfuerzo | Qué se reutiliza | Prueba de que sirve |
|---|---|---|---|---|
| **1 · Esta semana, con Casa Viva** | **Skill `/ficha` en Claude Code** (sin desplegar nada). La dependienta manda por WhatsApp las fotos (producto, etiqueta, factura). Se guardan solas en `/root/archivos/entrantes/`. Ernesto dice `/ficha` + el producto. Claude lee la etiqueta y la factura, busca en la web, arma la ficha con Confirmado / Sugerido / Falta y precio sugerido, y la enseña. Después: (a) Ernesto la revisa; (b) con su SÍ, se manda la vista a Lennys o Nataly por el buzón; (c) con su aprobación, se publica en la web con wp-cli, guardando una copia antes (como las 10 descripciones del 11-oct). La ficha también se guarda en `docs/fichas/<producto>.md` | **S** (medio día) | Prompts y esquemas de `lib/commerce/ai.ts` (copiados a la skill), skill `casa-viva-ops` (SSH, wp-cli, copias), fotos entrantes (M), Buscar precios (N) para comparar | 5 productos reales (empezar por los **10 sin descripción** y los **30 más vendidos**, que además piden "Compartir ficha"). Lennys aprueba al menos 4 de 5 sin rehacer |
| **2** | **Core guarda la ficha completa.** Ampliar `/panel/products/save`: descripción, descripción corta, galería, atributos (medidas, material) y alt de las fotos | **S** | `class-cvd-panel-bridge.php::save_product` | Un producto creado desde el panel sale en la web con descripción y meta description |
| **3** | **Función `nexo-ficha` en la nube + botón "Hacer ficha con IA"** en Productos del panel (y en la ficha de cada producto, para mejorar los que ya existen). Pantalla de revisión con las 3 etiquetas, "Aprobar y publicar" | **M** (2–3 días) | Las 3 funciones de `lib/commerce/ai.ts`, `pricing.ts`, el patrón de `nexo-curru` (clave vía Core u `OPENAI_API_KEY`), la cámara y galería del panel, el paso 2 | Lennys o Nataly hacen 10 fichas solas desde el móvil |
| **4** | **La ficha vive en Core NEXO:** cada dato aprobado se guarda en `product_facts` (Digitaliza, ya aplicado) con estado y evidencia. El bot, Curru y "Compartir ficha" de las gestoras leen de ahí | **M** | RPC de Digitaliza (`nexo_business_fact_save`, `nexo_business_knowledge`), `knowledge-pick.js` del bot | Las preguntas de medidas sin respuesta en el grupo General bajan a la mitad |
| **5** | **De la factura al producto nuevo:** en "Llegó mercancía" (caja y panel), una línea sin producto ofrece "Crear producto": costo y proveedor salen de la factura, y se piden la foto del producto y la de la etiqueta → borrador del paso 3 | **M** | `receive.ts`, `nexo-device-receive`, el paso 3 | La primera entrada real con un producto nuevo, sin Ernesto |
| **6** | **Fotos:** estudio gratis por defecto (fondo de marca). Botón "Fotos pro (Higgsfield)" que **primero dice el costo** (≈2,7 créditos por foto) y espera el SÍ de Ernesto; guarda la foto anterior para volver atrás | **M** | `studio.js`, `apply-photos.php`, conector Higgsfield | 20 productos con ≥80 % de fotos aprobadas sin rehacer |
| **7** | **Entrada por WhatsApp:** la dependienta escribe "FICHA" y manda las fotos al bot → el borrador aparece en el panel para revisar (es el `PRODUCTOS <slug>` de la fábrica) | **M** | `saveIncomingImage`, `preguntas.js` (ya pregunta a las dependientas con foto), `nexo-ficha` | Una dependienta crea 3 borradores en un día sin abrir el panel |
| **8** | **Paquetes por canal para las gestoras (gratis):** con la ficha aprobada, "Copiar para Revolico" y "Copiar para Facebook" (título, texto y fotos listos). Publica la gestora con su cuenta; NEXO no publica por ella | **S–M** | Ficha (paso 4), "Compartir ficha" del área | 5 gestoras lo usan en una semana |
| **9** | **Multi-comercio:** el mismo flujo para otro comercio y publicación en Tienda NEXO en vez de WooCommerce | **L** | Tienda NEXO (`app/`, `lib/commerce/`), `business_id` | Un segundo comercio con 20 fichas publicadas |

**Qué NO hacer:**
- No volver a encender el Product Studio de Render como producto aparte (D07, D16). Solo se copian sus funciones.
- No publicar nada sin revisión humana.
- No usar Higgsfield sin el SÍ de Ernesto.

**Lo que hay que preguntar antes del paso 1:**
1. La **regla de margen** de Casa Viva: ¿cuánto sube sobre el costo por tipo de producto? Hoy no está escrita.
2. ¿Quién es **Nataly** en el sistema: dependienta, economista o admin? Hace falta para darle permiso de aprobar.
3. ¿Publicamos con la ficha **aprobada directamente**, o primero como "privado" para mirarla en la web?

## 5. Cómo se convierte en un módulo de NEXO que se vende

Encaja con los **pasos 1–3 de la skill `nexo-fabrica`**:

| Paso de la fábrica | Hoy | Con esta herramienta |
|---|---|---|
| 1 · Captura | Fotos a una carpeta o `PRODUCTOS <slug>` (no existe) | Fotos por la caja ("Llegó mercancía") o por WhatsApp ("FICHA") → borrador solo (pasos 5 y 7) |
| 2 · Fotos pro | Higgsfield a mano | Estudio gratis + Higgsfield por lotes con costo aprobado (paso 6) |
| 3 · Fichas | "Vía Digitaliza", pero sin IA | Ficha con IA, Confirmado / Sugerido y aprobación, guardada en Core (pasos 3 y 4) |

**Cómo se cobra** (borrador para que decida Ernesto; los precios salen de `docs/nexo-business/herramientas-gestoras.md`):
- **Para el comercio:**
  - "Alta asistida": 20 productos digitalizados incluidos en el diagnóstico gratis. Es el gancho de la fábrica: "tú mandas fotos, nosotros hacemos todo".
  - Después, fichas incluidas en el plan mensual.
  - Fotos pro por lote como extra (por ejemplo, 50 fotos por 10 USD).
- **Para la gestora (la clienta de NEXO):**
  - Gratis: "Compartir ficha" y "Copiar para Revolico/Facebook" de cualquier producto con ficha aprobada (paso 8).
  - Premium, más adelante: "Hacer ficha de un producto que encontré" (con foto y Buscar precios) para vender productos de proveedores sin tenerlos en mano. Cuesta créditos de IA y vale mucho para ella.
- **Lo que se repite en cada venta:** los prompts, la regla Confirmado / Sugerido, la pantalla de revisión y la ficha en Core. Lo que cambia por comercio: marca, regla de margen, categorías y destino (WooCommerce o Tienda NEXO).

**Señal de que se puede vender:** en Casa Viva, 30 fichas hechas por Lennys o Nataly sin ayuda de Ernesto, 0 datos inventados encontrados en la revisión, y las preguntas de medidas bajan.
