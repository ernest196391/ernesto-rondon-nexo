# Marketplace: demanda (pieza 1), proveedores (pieza 2) y publicar fuera (pieza 6)

**Fecha:** 11-oct-2026 (noche) · **Autor:** Claude · **Para:** Ernesto
**Viene de:** `VISION-MARKETPLACE.md` (filas 1, 2 y 6) y `docs/herramientas/MAPA.md`.
**Resultados:** informe `demanda/2026-10-11-revolico.md` · ejemplo `publicar/EJEMPLO.md` (+ 6 imágenes) · código en el repo `vivabot` (ver §4).

---

## 1. Demanda: ¿qué se busca más en Revolico?

### Cómo enseña Revolico sus anuncios (mirado con 8 consultas, con calma)
- Cada página de búsqueda (`revolico.com/search?category=electrodomesticos`) trae los datos ya ordenados en JSON dentro de la página: 100 anuncios con **título, precio, moneda (USD/CUP), vistas, fecha de la última renovación y teléfono(s)** (y si es WhatsApp).
- **No dice la fecha en que se creó el anuncio**, y las **vistas son las de toda la vida** del anuncio.
- **Solo se puede ordenar por fecha, precio o relevancia. No por vistas.**
- Por dentro la web usa una API GraphQL (`graphql-api.revolico.app`), pero no es pública ni documentada: **no la usamos**.
- Hay muchísimo: Electrodomésticos tiene **88.162 anuncios**, y 100 se renuevan en unos **14 minutos**. Una semana entera no cabe en 50 páginas.
- Por eso el ranking es «lo más mirado entre lo que se anuncia ahora». Para medir la semana de verdad hay que comparar dos corridas.

### Qué permite Revolico
- **robots.txt:** deja leer las búsquedas y los anuncios. Solo cierra cuenta, pago, favoritos y `/auth`.
- **Condiciones de uso y Normas de publicación** (help.revolico.com, leídas hoy). Prohíben:
  - usar sus textos, imágenes y anuncios en otras webs sin su **permiso por escrito**;
  - copiar, procesar o distribuir textos o fotos de otros sin su permiso;
  - publicar o renovar **en masa o de forma automática** sin su permiso por escrito;
  - poner anuncios iguales o parecidos, enlaces a otras webs, o el teléfono fuera de su campo;
  - ofrecer «servicios de publicación de anuncios»;
  - anunciar negocios que compitan con Revolico.
- **Lo que significa para nosotros:**
  - Contar (cuántos anuncios, vistas, rangos de precio) de vez en cuando y sin guardar textos ni fotos es zona gris, pero de poco riesgo. **Lo más seguro es pedirles permiso.**
  - **Descargar fotos de Revolico para el marketplace: NO.** Son fotos de otros vendedores y está prohibido.
  - Fotos de internet (lo decidiste tú): de la **web del fabricante o de la marca**, apuntando siempre de dónde salió cada foto. Nunca de anuncios de otros.
  - **Teléfonos de Revolico:** no guardarlos en masa. Si un anuncio interesa, se le escribe una vez y se guarda solo si dice «sí» (ver §2).

### Qué pasó en la prueba
1. Con un navegador normal (curl) las páginas respondieron bien: inicio, Electrodomésticos, un anuncio y las condiciones.
2. Al lanzar el script en Node.js, **Cloudflare le puso un reto anti-robots** («Just a moment…»).
3. **El script paró en la primera consulta y no intentó saltárselo**, como manda la regla de «si te bloquean, para».
4. El informe de hoy usa la única página que se leyó durante la investigación: **100 anuncios, muestra muy pequeña**.
5. Las subcategorías (por ejemplo, neveras) dieron error 500 con `category=`: usan otro filtro que todavía no conocemos.

**Lo que dice esa muestra (solo como ejemplo):**
- Lo más mirado entre lo que se renueva ahora son las neveras (33 anuncios, 9 vendedores, 300–520 USD) y los **ventiladores recargables** (12 anuncios, 8 vendedores, 49–75 USD).
- El F6 de Casa Viva está a 70 USD, dentro de ese rango.

### El prototipo: `vivabot/scripts/demanda-revolico.mjs` (solo lectura)
- Hace **1 consulta cada 3–5 s** y lee **como mucho 50 páginas** por corrida.
- **Para solo** si recibe 403, 429 o un reto de Cloudflare.
- Agrupa por tipo de producto (unas 40 reglas: nevera, split, ventilador recargable, olla Reina…).
- Por cada tipo da:
  - número de anuncios;
  - **vendedores distintos** (cuenta los teléfonos en memoria y los olvida);
  - vistas (suma, mediana y máximo);
  - **precio típico** en USD y en CUP (del 25 % al 75 % de los precios);
  - enlace al anuncio más visto.
- **No guarda teléfonos, textos ni fotos.** La «foto» `.json` para comparar la semana siguiente solo lleva id, tipo, vistas y precio.
- Modos de uso:
  - `--html a.html,b.html`: lee páginas que una persona guardó desde su navegador. No se conecta.
  - `--antes foto.json`: calcula las **vistas nuevas de la semana**.

### Alternativas, en orden
1. **Pedir permiso por escrito a Revolico** (`ayuda@revolico.com`) para leer datos de demanda. Por dentro tienen «category-metrics» y «total-view-count»: quizá nos los den.
2. **Demanda propia, que ya tenemos y no depende de nadie:**
   - lo que se busca en la web de Casa Viva;
   - las preguntas al bot y a Curru que se quedan sin respuesta;
   - los «busco…» de los grupos (`crm_wa_messages`);
   - lo que piden las gestoras en el General.

   Falta juntarlo en un informe semanal.
3. **Revolico a mano asistido:** alguien abre 5–10 búsquedas a la semana en su móvil o PC, las guarda (Ctrl+S) y el script las lee con `--html`.
4. **«Buscar precios» de Core** (ya funciona) para el precio y los vendedores de un producto concreto.

**No usar:** servicios que «pasan Cloudflare» con proxies (modo stealth de Firecrawl, Apify, ScraperAPI). Es saltarse el bloqueo.

### Herramientas de scraping (lo de «jev» / «scrable»)
«Scrable» casi seguro es **Scrapy**, o quizá **ScrapeGraphAI**. «Jev» no está claro: puede ser **Jina** (Jina Reader) o **Apify**. Hay que preguntártelo.

| Herramienta | Qué es | Costo (aprox., comprobar) | Desde Cuba | Con Revolico | Para NEXO |
|---|---|---|---|---|---|
| **Nuestro script** (Node) | Lee el JSON que ya trae la página | Gratis | Corre en el VPS (no en Cuba) | Bien con curl; Cloudflare reta a Node → para | **Recomendado** para Revolico (con permiso o con `--html`) |
| Scrapy | Programa libre (Python) para rastrear webs | Gratis | Corre en el VPS | Igual que el nuestro, sin ventaja (los datos ya vienen en JSON) | No hace falta |
| Crawl4AI | Libre; usa un navegador de verdad y saca texto para IA | Gratis (pesa en el VPS) | VPS | Igual frente a Cloudflare | Puede servir para leer fichas de fabricantes |
| ScrapeGraphAI | Libre + API; la IA saca los datos | Gasta tokens; API ~20 USD/mes | VPS/tarjeta de fuera | Innecesario | No |
| Firecrawl | Servicio: página → texto o datos | ~500 páginas gratis; desde ~16 USD/mes | Hace falta tarjeta de fuera (sanciones) | Su «stealth» salta bloqueos → **no** | Leer fichas de fabricantes |
| Apify | Tienda de «robots» ya hechos (también Facebook) | 5 USD/mes gratis; desde ~30–40 USD/mes | Tarjeta de fuera | Los robots de Facebook rompen las reglas de Meta | No |
| Jina Reader (`r.jina.ai`) | Convierte una página en texto limpio | Gratis con límite | Funciona desde el VPS | No para Revolico | **Recomendado** para leer fichas de fabricantes |

**Recomendación:**
- **Revolico:** nuestro script (gratis, ya hecho) con permiso de Revolico o en modo `--html`.
- **Fotos y datos de fabricantes** (pieza 3): **Jina Reader**, apuntando la fuente de cada foto.
- **Facebook:** nada automático.

---

## 2. Ficha de proveedor (en la bolsa que ya existe)

- **Dónde va:** en `crm_suppliers`, la misma lista que usan PROVEEDORES, «busca quién vende X» y «venden usdt». No se crea otra tabla.
  - Hoy hay **30 proveedores**.
  - Los artículos de la bolsa (`crm_market_items`: 480 nuevos, 2 aprobados, 1 descartado; todos con teléfono) se unen a su proveedor por el teléfono (`seller_jid`).
- **Campos nuevos** (SQL `vivabot/supabase/022_ficha_proveedor.sql`; **lo tienes que pegar tú** en Supabase, proyecto **nexo-production**, con el traductor de Chrome apagado):

| Campo | Qué guarda |
|---|---|
| `name`, `phone` (ya existían) | Nombre y número |
| `sells` | Qué vende, en sus palabras |
| `price_list` + `price_list_at` | Su lista de precios y la fecha |
| `zone` | Municipio o barrio |
| `wholesale` · `pickup` · `delivers` | Mayorista · se recoge · lleva él |
| `terms` | Pago, mínimo, garantía, plazo |
| `handled_by` | Quién lo atiende |
| `consent` · `consent_at` · `consent_note` | Su «sí» (o «no»), la fecha y cómo lo dijo |
| `source` · `source_ref` | De dónde salió el número: grupo, anuncio público, respuesta a un envío o anotado a mano, con el grupo o el envío |

- **Regla de los números:**
  - Se guardan **solos** únicamente los de quien **anunció en público que vende** (en un grupo).
  - Los demás, solo con su **«sí»**.
  - **Cambio:** «busca quién vende X» ya no guarda solo a los vendedores que salen de chats privados (siguen saliendo en la tabla de resultados).
- **Órdenes nuevas** (chat «Tú»):
  - `FICHA 5354xxxxxx`: ver la ficha.
  - `FICHA 5354xxxxxx SI por WhatsApp`: apunta su «sí» con la fecha.
  - `FICHA 5354xxxxxx NO`: dijo que no.
  - `FICHA 5354xxxxxx zona: Playa; vende: neveras; mayorista: sí; recoge: sí; atiende: Zaymi; precios: …`: completa los datos.
  - `FICHAS nevera`: la lista, con ✅ «sí», ❔ sin su «sí» y ⛔ «no».
- **Mensaje para pedir el «sí»** (lo mandas tú o un envío con tu SÍ):
  > Hola {nombre}, soy Ernesto, de Casa Viva. Vi que vendes {producto}. ¿Te parece bien que te guarde como proveedor y te escribamos cuando tengamos pedidos? Si me dices que sí, te anoto con tu zona y tus condiciones.
- **Estado:**
  - El código está hecho y probado (8 pruebas + `npm run check`).
  - **No está desplegado.**
  - Sin el SQL no se rompe nada: `FICHA` responde «falta pegar el SQL 022».
- **Siguiente:**
  1. Que `PROVEEDOR 12` (de la bolsa) enseñe la ficha.
  2. Que los envíos salten a quien dijo «no».

---

## 6. Publicar fuera: asistido, no robot

### La función
`vivabot/src/publicar.js` → `buildPublishPack(producto, gestora, {rateCup})`. Con un producto y una gestora devuelve:
- **Revolico:**
  - categoría sugerida;
  - **título** (60 caracteres como máximo);
  - precio;
  - **descripción de hasta 1.000 caracteres** (el límite del anuncio gratis; el precio, la entrega y la referencia nunca se cortan), **sin enlaces ni teléfonos** dentro del texto;
  - el **teléfono de la gestora, para su campo aparte**;
  - una referencia `CV-2601-CODIGO` en vez de un enlace.
- **Facebook:**
  - texto con viñetas;
  - el **enlace con su `?ref=` para el primer comentario**.
- **Estado de WhatsApp:**
  - 3 líneas con el enlace `?ref=`;
  - «¡queda 1!» si queda poco.
- **3 imágenes** (`scripts/publicar-ejemplo.mjs`):
  - 1080×1080 para Revolico: solo la foto, sin teléfono ni enlace;
  - 1080×1350 para Facebook: foto, nombre, precio y «Escríbeme por WhatsApp»;
  - 1080×1920 para el estado: foto, nombre, precio y «Pídelo con mi código X».
- **No usa IA y no inventa:** solo usa la ficha de la web. Si falta el precio, la foto, el teléfono o la descripción, lo dice en «faltan».
- Ejemplo con 2 productos reales (Ventilador recargable F6 y Juego de sábanas Majestic King): `publicar/EJEMPLO.md`. Usa una gestora y un código de ejemplo y no pone precio en CUP, porque no había tasa del día; con `--tasa` sí lo pone.

### Reglas y riesgos
- **Revolico:**
  - Un anuncio por producto y por cuenta.
  - Renovar a mano **una vez cada 24 h** como mucho (la web pide captcha).
  - Nada de robots para publicar o renovar. Revolico vende la «autorrenovación» oficial: si hace falta, esa.
  - Cada gestora publica **desde su cuenta**. NEXO no puede ser un «servicio de publicación de anuncios».
  - No poner la web de Casa Viva en el texto.
- **Facebook:**
  - Cada grupo tiene sus reglas y muchos borran los posts con enlaces: el enlace va en el comentario.
  - Publicar el mismo texto en muchos grupos seguidos hace que Facebook frene la cuenta («publicas demasiado rápido») o la restrinja.
  - Meta prohíbe automatizar sin permiso.
  - **Marketplace puede no salir en Cuba:** hay que confirmarlo con una gestora.
- **WhatsApp:** los estados no tienen límite, pero son de la gestora. Para su número, nada de envíos masivos.

### Prueba «poco a poco» (propuesta, 2 semanas)
- **Quién:**
  - **Dany** (prueba a fondo);
  - **1 gestora que ya venda bien**;
  - **1 gestora nueva**.

  Productos: los de más demanda y con stock (por ejemplo, el ventilador F6).
- **Semana 1, por gestora y por día:**
  - **Revolico:** 1 anuncio nuevo (como mucho 5 activos) y 1 renovación a mano.
  - **Facebook:** 2–3 grupos, cambiando un poco el texto.
  - **Estados:** 1–2.
- **Semana 2:** si no hubo ningún aviso, se pasa a 5 gestoras, 2 productos al día y hasta 5 grupos.
- **Qué medir** (hoja sencilla: fecha · gestora · producto · canal):
  - vistas del anuncio a las 48 h (Revolico las enseña);
  - mensajes que llegan («¿por dónde me viste?»);
  - **pedidos con su `?ref=`**;
  - minutos que tarda en publicar;
  - **avisos o bloqueos.** Con **1 aviso** se para ese canal una semana.
- **Siguiente paso técnico:**
  - Botón «Copiar para Revolico / Facebook / Estado» en el área de gestoras de Core, con la misma lógica.
  - O el comando del bot `PUBLICAR 2601`, que manda los textos y las 3 fotos al privado de la gestora.

---

## 4. Archivos

**Repo `vivabot`:**
- `scripts/demanda-revolico.mjs`
- `src/publicar.js`
- `scripts/publicar-ejemplo.mjs`
- `src/suppliers-rules.js`
- `src/suppliers.js`
- `supabase/022_ficha_proveedor.sql`
- `test/publicar.test.js` y `test/suppliers.test.js`
- Cambios pequeños en `src/market.js` (FICHA, origen del número, sin guardar los de chats privados) y en `src/owner.js` (ayuda).

**Repo `ernesto-rondon-nexo`:**
- este documento;
- `demanda/2026-10-11-revolico.md` (+ `.json` sin datos personales);
- `publicar/EJEMPLO.md` + 2 carpetas con imágenes y `textos.json`.
