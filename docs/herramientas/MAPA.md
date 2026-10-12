# MAPA de todas las herramientas de Ernesto

**Fecha:** 2026-10-11 (noche) · **Autor:** Claude (solo lectura: no se cambió código, datos ni se mandó nada) · **Para:** Ernesto
**Fuentes revisadas:** repo `ernesto-rondon-nexo` (apps, packages, supabase, app/, lib/, kits, docs), repo `vivabot`, repo `Casa-Viva` (plugin Core 3.13.55), skills de `C:\Users\Ernesto\.claude\skills`, carpetas `nexo-studio`, `chatwoot`, Escritorio y Documentos, y la nube `nexo-production` (lista de funciones y migraciones, y conteos de solo lectura).

## Cómo leer este mapa

**La idea de Ernesto (22:05):**
- **Casa Viva es el negocio de Lennys.** Lo construimos y se lo entregamos. Es nuestro banco de pruebas para todas las herramientas.
- **El cliente de NEXO es la gestora.** NEXO le hace herramientas para su web y para dentro de NEXO. Las básicas son gratis; las premium cuestan más, con precio según el valor y el cliente ideal.
- A los "1.000 negocios" se llega a través de NEXO. Las gestoras que vendan o ayuden ganan una comisión (todavía sin definir).
- **Prioridad ahora:** darles gratis a las gestoras todo lo que buscan:
  - publicar desde el panel;
  - publicar fácil en Revolico y en Facebook;
  - buscar y comparar precios y proveedores;
  - un gestor de clientes;
  - compartir fichas de producto.
- **El Cazador de clientes es interno** (de Ernesto y NEXO), no es para las gestoras.

**Columna "Para quién":**
- **Gestora gratis**: la gestora lo usa sin pagar.
- **Gestora premium**: más adelante se cobra, porque cuesta créditos o da mucho valor.
- **NEXO interno**: solo Ernesto y el equipo NEXO.
- **Casa Viva (Lennys)**: hecho para la tienda de Lennys.
- **Comercio NEXO**: cualquier comercio que use NEXO Business (Casa Viva es el primero).

**Estados:**
- **idea**: no hay código.
- **a medias**: hay código, pero no se usa en real o le falta una parte.
- **funciona**: probado, pero con poco uso real.
- **en producción**: se usa de verdad cada día.

**¿NEXO?** responde a esta pregunta: ¿se puede reutilizar para otros comercios o gestoras sin reescribirla?

---

## 1. Vender (tienda y catálogo)

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Web de Casa Viva (Casa Viva Core 3.13.55)** | Tienda online con pedido, pago cubano, seguimiento y ofertas | `casaviva.company`; plugin `Casa-Viva/wordpress/casa-viva-dropship-core`. El tema `casa-viva-storefront` **solo está en el servidor** | clientes, gestoras, Lennys | Casa Viva (Lennys) | en producción | a medias: la lógica está en PHP, solo para Casa Viva | Meter el tema en el repo. Lo nuevo se escribe en NEXO; Core solo lo enseña |
| **Tienda NEXO** | Catálogo, carrito y pedido por WhatsApp. Muestra el catálogo de Casa Viva | `tienda.nexocuba.com` (Render); repo `app/`, `lib/commerce/` | compradores | comercio NEXO | funciona | sí | Decidir si es la tienda de cada comercio y gestora NEXO (D16 pide Vercel) |
| **Curru (asistente de la web)** | Contesta con productos, precios y tasas reales | Core `class-cvd-contextual-assistant.php` y `class-cvd-curru-ai.php` (`/curru/ask`, gpt-4.1-mini) | clientes, gestoras, bot | Casa Viva → comercio NEXO | en producción | sí, el motor | Que lea la ficha de conocimiento (ver `entrada-a-ficha.md`) |
| **Buscador de la tienda** | Encuentra productos aunque falten tildes o plurales | Core `class-cvd-product-search.php` | clientes, Curru | Casa Viva | en producción | sí | — |
| **Meta description automática (SEO)** | Pone la descripción para Google a partir de la descripción corta | Core `class-cvd-site-privacy.php` | Google | Casa Viva | en producción | sí | Necesita buenas descripciones: hoy muchas están vacías o son pobres |
| **Editor de textos de la Tienda NEXO** | Reglas para los textos públicos (palabras prohibidas, beneficios, FAQ, SEO) | `lib/commerce/product-editorial.ts`, `product-content.ts` | Tienda NEXO | comercio NEXO | funciona | sí | Reutilizarlo como "revisor" de fichas |
| **Demos de tienda** | Plantillas de ejemplo para enseñar a clientes | Vercel `tienda-barrio`, `vitayaq`, `mercado23y28` | Ernesto | NEXO interno | funciona | sí (plantilla) | — |

## 2. Productos (entrada, fichas, fotos)

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Llegó mercancía (caja)** | Foto o galería de la factura → Curru lee las líneas → la dependienta elige productos y costos → sube el stock y guarda el costo. **Solo productos que ya existen** | `apps/business-pos/src/receive.ts` + función `nexo-device-receive` | dependientas | comercio NEXO | funciona (caja 1.0.7+). **0 entradas reales** en la nube | sí | Primera entrada real. Para líneas sin producto: botón "Crear producto" (ver plan) |
| **Llegó mercancía (panel)** | Lo mismo desde el panel | `apps/business-dashboard/index.html` (~línea 2971) + `nexo-curru` | Lennys | comercio NEXO | funciona | sí | Igual que la caja |
| **Curru lee facturas** | Lee proveedor, fecha, líneas, cantidad y costo. No inventa; si no se lee, pone null. Busca cada nombre en el catálogo | `supabase/functions/nexo-curru/index.ts` → Core `/panel/curru/invoice` (gpt-4.1-mini; la clave queda en WordPress) | caja, panel | comercio NEXO | funciona (verificado el 11-oct con una factura de prueba) | sí | Reutilizarla en el flujo de fichas |
| **Productos del panel** | Crear un producto (también en la web), diseños y colores, dejar de vender, comisión, precio de oferta, cambiar varios | Panel → Productos. Nube `nexo_business_product_save`. Core `/panel/products/save` y `/products/variable` | Lennys | comercio NEXO | en producción | sí | **No pone descripción, galería, atributos ni SEO**: se añade con el plan de fichas |
| **Digitaliza tus productos** | Recepción en 5 pasos (fotos, datos, variantes, borrador sin internet) y **ficha de conocimiento**: cada dato con estado verificado / declarado / pendiente / contradicción y su evidencia | `apps/business-dashboard/digitaliza.html` + `digitaliza/`. Publicada en `casaviva.company/panel/digitaliza.html` | dueña, economista, dependientas | comercio NEXO | a medias. **Las 2 migraciones SÍ están aplicadas en producción desde el 7-oct** (ESTADO dice que no: está viejo). La página está publicada pero **no hay enlace en el panel**. 0 recepciones, 0 fichas, 0 piezas | sí | Usar su ficha como el lugar donde se guardan los datos confirmados y sugeridos. No crea el producto en la web |
| **Product Studio (el de antes)** | Fotos → visión y OCR (marca, modelo, código de barras, garantía, specs con confianza y origen) → **búsqueda web** con fuentes → **textos SEO** (título, slug, descripción corta y larga, beneficios, FAQ, meta, palabras clave, alt) → foto WebP con fondo blanco → **precio por regla de margen** → **borrador en WooCommerce** (solo si no falta nada crítico) | `app/studio/products`, `app/api/studio/products/captures/*`, `lib/commerce/ai.ts`, `pricing.ts`, `images.ts`, `woocommerce.ts`. Corre en Render (`tienda.nexocuba.com/studio`, con login) | Ernesto | comercio NEXO | a medias: el código está completo, pero no consta uso real. `docs/TASKS.md` lo da por "blocked" | sí, **es el cerebro que falta** | Copiar sus 3 funciones de IA al flujo nuevo (ver `entrada-a-ficha.md`) |
| **Estudio de fotos gratis** | Quita el fondo y pone fondo de marca (crema o verde, 1200 px), y la IA da una nota de calidad | `vivabot/src/studio.js`, `photos.js` (columna `photos_clean`) | Ernesto | gestora gratis (10/día, propuesta) · comercio NEXO | a medias: recorta mal las fotos difíciles | sí ("NEXO Fotos") | Llevarlo al panel y al área de gestoras |
| **Fotos pro con Higgsfield** | Mejora fotos a 2K con IA. En Casa Viva se aplicaron 44 y se descartaron 15 (deformaba etiquetas) | Conector Higgsfield en Claude + `Casa-Viva/scripts/catalog/apply-photos.php` + `data/catalog/upscaled-photos.json` (guarda la foto anterior para volver atrás) | Ernesto | gestora premium · comercio NEXO (extra) | funciona, a mano. ≈2,7 créditos por foto | sí | Script de lote con presupuesto y **SÍ de Ernesto antes de gastar** |
| **NEXO Studio (créditos creativos)** | Plataforma para comprar "Créditos NEXO" y generar imágenes y videos, con recarga en CUP | `C:\Users\Ernesto\nexo-studio`, `nexo-studio-lime.vercel.app`, Supabase propio `ogsxbdrzbuwtccuzlhcx` | nadie aún | gestora premium (posible) | a medias: solo funciona el proveedor de prueba; Higgsfield está apagado | quizá | Decidir: ¿es la "tienda de créditos" de las herramientas premium? |
| **Fotos que llegan al bot** | Guarda cada foto que llega por privado durante 7 días | `vivabot/src/index.js` `saveIncomingImage` → `/root/archivos/entrantes/` | todos | NEXO interno | en producción | sí | Usarlas como entrada de fichas por WhatsApp |
| **Importación BizneCubano** | Copiaba productos, fotos y descripciones de BizneCubano | `Casa-Viva/scripts/catalog/biznecubano-*` | — | Casa Viva | **apagada** (D38) | no | Nada |
| **Auditoría de fotos** | Mide la resolución y arma hojas de contacto | `Casa-Viva/scripts/catalog/photo-audit.mjs` | Ernesto | NEXO interno | funciona | sí | — |
| **"PRODUCTOS <slug>" por WhatsApp** | Mandar fotos al bot para empezar un comercio (paso 1 de la fábrica) | Solo escrito en la skill `nexo-fabrica` | — | NEXO interno | **idea** (no existe en el bot) | — | Construirlo junto con la ficha por WhatsApp |

## 3. Pedidos y reparto

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Pedidos web, vale y seguimiento** | Pedido, "Listo para salir", seguimiento del cliente, incidencias, cierre con dinero | Core (`class-cvd-delivery`, `order-*`, `sales`, `live-tracking`) | dependientas, Lennys, clientes | Casa Viva | en producción | a medias (PHP) | — |
| **Reparto por WhatsApp** | Publica la carrera en el grupo, acepta el "Yo", manda el vale por privado, pregunta la hora, relevo, "entregado" | `vivabot/src/dispatch.js` + Core `class-cvd-bot-bridge.php` | mensajeros, tienda | Casa Viva → comercio NEXO | en producción | sí | Que el bot use `/picked-up` ("lo tengo #N") |
| **Reparto directo** | La gestora elige el mensajero | Core `class-cvd-direct-dispatch.php` (3.13.48) | gestoras, mensajeros | gestora gratis | en producción | sí | — |
| **Estado del pedido sin IA** | "#2903", "mis pedidos" y avisos de cada paso | `vivabot/src/orderstatus.js` | gestoras, mensajeros, tienda | gestora gratis | en producción | sí | — |
| **Dinero por entregar** | Lista del efectivo que traen los mensajeros | Core `messenger-cash` (3.13.55) | Lennys | Casa Viva | funciona (el panel aún no lo muestra) | sí | Enseñarlo en el panel |
| **Interpretar vale** | Pegar un vale de WhatsApp → pedido en la web | Core `class-cvd-voucher-intake.php` (`/interpretar-vale/`) + Render `app/mensajeria/interpretar-vale` | dependientas, gestoras | Casa Viva | funciona | sí | — |
| **Mensajería por zona** | Tarifas en CUP por municipio | Core `shipping-rates` + panel → Ajustes | clientes, Lennys | comercio NEXO | en producción | sí | — |
| **Notas de voz y llamadas al cliente** | Voz IA al cliente y al mensajero | — | — | comercio NEXO | idea aprobada | — | Después |

## 4. Caja / POS

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Caja NEXO Business** | Vender sin internet, devoluciones, fiado, efectivo de mensajeros, recibir mercancía, permisos | `apps/business-pos` (Tauri + Rust + SQLite). APK 1.0.8, Windows 1.0.7 | dependientas, Lennys | comercio NEXO | en producción | sí | Revisar que cada equipo nuevo aparezca en `devices` |
| **Panel de la dueña** | Resumen, pedidos, productos, clientes, equipo, ajustes | `apps/business-dashboard/index.html` → `casaviva.company/panel/` y `negocio.nexocuba.com` | Lennys | comercio NEXO | en producción | sí | — |
| **Nube NEXO** | 17 funciones activas: sync, catálogo, stock, tasas, comisiones, puente con la web, Curru, alta de equipos | Supabase `nexo-production`; `supabase/functions/*` | todo | comercio NEXO | en producción | sí | `colo-orders` y `nexo-migration-import` están en la nube pero no en el repo: revisarlos |
| **Puente caja ↔ web** | Existencias, gestoras, mensajeros y clientes cada 2 min | función `nexo-stock-bridge` | — | comercio NEXO | en producción | sí | — |
| **Apps móvil y escritorio aparte** | — | `apps/business-mobile`, `apps/business-desktop` (solo README) | — | — | idea | — | Nada (la caja ya cubre esto) |

## 5. Gestoras (el cliente de NEXO)

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Área de gestoras (como app)** | Inicio (ganado, por cobrar), Ventas, Cobrar, Clientes, Herramientas, Invitar | Core `class-cvd-gestora-app.php` y `-store`, `-stock`, `-portal`, `-payouts` | 28 gestoras | gestora gratis | en producción | a medias: está en PHP de Casa Viva | Pasar los datos y las reglas a NEXO (`herramientas-gestoras.md` §9) |
| **Precio propio, enlace, QR, calculadora CUP** | La gestora pone su precio y vende con su enlace | Core `gestora-store`, `daily-rates` + `vivabot/src/rates.js` | gestoras | gestora gratis | en producción | sí | Explicarlo mejor (no se entiende) |
| **Mis clientes (gestor de clientes)** | Lista de clientes por gestora: añadir, buscar, "sin comprar en 30 días", WhatsApp con su enlace | Core `class-cvd-clients.php` (tabla `wp_cvd_clients`) + panel → Clientes | gestoras, Lennys | gestora gratis | en producción | sí | **Es lo más parecido a un gestor de clientes.** Le falta: etapas (interesado → compró → repite), recordatorio y "Escríbele" con texto hecho |
| **Buscar precios (foto → Revolico, Facebook, tiendas)** | Con una foto busca en la web ofertas en Cuba y devuelve hasta 8, con precio, lugar, teléfono y enlace | Core `class-cvd-gestora-busca.php` (gpt-4.1-mini + búsqueda web, 15 por día) | gestoras | gestora gratis (premium si quiere más) | en producción (verificado el 11-oct: 5 ofertas en 6 s) | sí | **Es la herramienta de comparar precios que Ernesto recuerda** (ver "Duplicados") |
| **NEXO Busca (la primera versión)** | Lo mismo, con otro modelo y su propio login | Render `app/api/gestoras/busca/route.ts` + `lib/product-search/` | gestoras de la Tienda NEXO | gestora gratis | funciona, login aparte | sí | Quedarse con una sola |
| **Comisiones y pagos** | Comisión por producto, "Pedir mi pago", pagos | Core `commissions`, `payouts` + nube (comisiones por producto) | gestoras, Lennys | gestora gratis | en producción | sí | Publicar cómo y cuándo se paga (FAQ 26) |
| **Extras en tienda** | Lo que el cliente de una gestora compra en la tienda le da comisión | `vivabot/src/extras.js` | dependientas | gestora gratis | en producción | sí | Botón en la caja |
| **Fotos y textos listos** | Biblioteca de material para publicar | Core `class-cvd-promotional-resources.php` | gestoras | gestora gratis | a medias: **vacía** | sí | Llenarla cada día |
| **Compartir ficha** | Foto + precio de la gestora (USD y CUP) + "quedan N", a WhatsApp | Área de gestoras (solo en "Lo que más se vende") | gestoras | gestora gratis | a medias | sí | Ponerlo en todos los productos, con las medidas de la ficha |
| **Publicar en Revolico / Facebook** | — | **No existe en ningún repo.** Solo está planeado (Digitaliza bloque 3: "paquetes por canal") | — | gestora gratis | **idea** | — | Paquete listo para copiar: título, texto y fotos con el formato de Revolico o de Marketplace, más un botón "Copiar y abrir". Las cuentas son de la gestora; NEXO no publica por ella |
| **Oficina de gestoras web NEXO** | Registro, panel y tienda de la gestora en NEXO | Render `app/impulsa`, `app/g`, `app/api/gestoras/*` | nadie (Casa Viva usa Core) | gestora gratis | funciona, sin uso | sí | Es la base de NEXO Impulsa multi-comercio |
| **Guías y tutoriales para gestoras** | Textos y videos de cómo vender | `docs/nexo-business/tutoriales/` y `/root/archivos/tutoriales/` | gestoras | gestora gratis | en producción | sí (plantilla) | — |
| **Avísame cuando llegue / Tu semana / Clientes que repiten** | Ver `herramientas-gestoras.md` §2 | — | — | gestora gratis | idea | sí | Por orden de esa hoja de ruta |

## 6. Bot / WhatsApp

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **VivaBot** | Contesta a clientes y gestoras, escala, conoce productos (Woo + Curru), reparto, altas | Repo `vivabot` (`src/index.js`, `brain.js`, `woo.js`, `curru.js`, `gestoras.js`…); VPS Hostinger | clientes, gestoras, equipo | Casa Viva → comercio NEXO | en producción | sí (falta multi-negocio de verdad) | Cambios sin confirmar en la copia local (`ai.js`, `brain.js`, `index.js`): subirlos o descartarlos |
| **Conocimiento + APRENDE** | 110+ respuestas verificadas; aprender desde el chat "Tú" | `crm_knowledge`, `src/knowledge*.js`, skill `/aprende` | Ernesto | comercio NEXO | en producción | sí | — |
| **Preguntas abiertas con relevo** | Si no sabe, pregunta a la dependienta con la foto y guarda la respuesta | `src/preguntas.js` (**no está en git**) | gestoras, dependientas | gestora gratis | a medias | sí | Confirmarlo en git |
| **Campañas lentas** | Envíos aprobados, despacio | `src/campaigns.js` | Ernesto | comercio NEXO | en producción | sí | — |
| **Buzón de salida** | Texto, voz, video y archivos por la cola `crm_outbox` | `src/outbox.js` | supervisor, skills | NEXO interno | en producción | sí | — |
| **Voz** | Notas de voz con la voz de Ernesto y transcripción | `src/voice.js`, `audio.js`; `scripts/voz.py` | Ernesto | NEXO interno | en producción ("suena mal" a veces) | sí | Revisar con Whisper siempre |
| **Canal de gestoras** | Productos del día y novedades por canal de WhatsApp | skill `/canal` + `WA_CHANNELS` | Ernesto | gestora gratis | a medias: **falta crear el canal** (Ernesto, desde el móvil) | sí | — |
| **Chatwoot** | Bandeja única de mensajes (web, WhatsApp…) | `C:\Users\Ernesto\chatwoot` (local, Docker) | Ernesto | comercio NEXO · gestora premium (posible) | a medias (prueba local) | sí | Decidir si va en la nube |
| **Kit de conversaciones** | Agente de WhatsApp con puntuación de leads y paso a humano | `kits/conversations/SPEC.md`, `app/studio/conversations`; origen en `Escritorio\agente Skill web\02-kit-agente-whatsapp` | — | comercio NEXO | pausado | sí | Útil para un gestor de leads (puntuación) |

## 7. Contenido (videos, tutoriales, marca)

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Tutoriales en video** | Videos con la marca de Casa Viva, pantallas del móvil, voz y subtítulos | skill `video-tutorial-casa-viva` + HyperFrames; `videos/tutorial-*` | Ernesto | Casa Viva → comercio NEXO (extra) | en producción (tutoriales 2 y 3 enviados) | sí | Generalizar la marca |
| **Editar video de cliente** | Descargar, transcribir, tarjetas, música, versión para WhatsApp | skill `editar-video-cliente`; `docs/plantillas/propuesta-cliente/scripts/video_cliente.py` | Ernesto | NEXO interno → servicio | funciona | sí | — |
| **Crear marca** | Logos en SVG, manual y aplicaciones | skill `crear-marca` | Ernesto | NEXO interno → servicio | funciona (Yonar) | sí | — |
| **Avatares Cuba (Cúrru)** | Personajes de IA con Higgsfield (Cúrru aprobado para Casa Viva) | skill de escritorio `avatares-cuba` (AppData\Roaming\Claude\…) | Ernesto | Casa Viva / NEXO interno | funciona | sí | — |
| **Infografías del cierre** | Cierre del día por equipo con ranking | `vivabot/scripts/cierre.mjs` (**no está en git**) + skill `/cierre` | Ernesto, equipos | comercio NEXO | funciona | sí | Confirmar en git |
| **Content Studio (kit)** | Video → cortes → vertical → subtítulos | `kits/content-studio`, `worker/app.py` (Render), `app/studio/content` | — | NEXO interno | pausado | sí | — |
| **Diseño gráfico** | Pósteres y piezas | skills `canvas-design`, `frontend-design` | Ernesto | NEXO interno | funciona | — | — |

## 8. Ventas de NEXO (propuestas, demos, precios)

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Fábrica NEXO** | Los 10 pasos: de las fotos de un comercio a un cliente que paga | skill `nexo-fabrica` | Ernesto | NEXO interno | a medias: pasos 1–3 sin automatizar | sí | Ver `entrada-a-ficha.md` (pasos 1–3) |
| **Analizar negocio** | Auditoría de redes + 4 agentes Hormozi | skill `analizar-negocio` → `docs/ofertas/<slug>.md` | Ernesto | NEXO interno | funciona (Yonar) | sí | — |
| **Oferta, leads, modelo de dinero, cierre** | Método Hormozi | skills `oferta-irresistible`, `conseguir-clientes`, `modelo-de-dinero`, `cerrar-venta` | Ernesto | NEXO interno | funciona | sí | — |
| **Propuesta de cliente + demos** | Presentación móvil, calendario, tienda demo, videos | skills `propuesta-cliente` y `kit-demo`; `docs/plantillas/propuesta-cliente/` | Ernesto | NEXO interno | funciona (Yonar) | sí | — |
| **Analizador de ideas de negocio** | "NEXO Business Analyzer" | `tienda.nexocuba.com/herramientas` (`app/herramientas`) | público | NEXO interno (gancho) | funciona | sí | — |
| **Web de Implementación NEXO** | Página para pedir diagnóstico | `automatizacion.nexocuba.com` (Vercel `nexo-plan-veci`, repo `Nexo-web-`) | público | NEXO interno | en producción | sí | Rehacerla con Higgsfield (pendiente) |
| **Kits de implementación** | Auditorías de marca, negocio, comercio, web, creadores | `kits/*/SPEC.md`, `app/studio/*` (Render) | — | NEXO interno | pausado | sí | Usarlos como pasos de la fábrica |
| **Mapa de Casa Viva y propuesta de red** | Páginas para Ernesto y Lennys | `docs/nexo-business/mapa-casa-viva.html`, `propuesta-red-de-gestoras.html` | Ernesto, Lennys | Casa Viva | funciona | — | — |
| **Herramientas para gestoras (estudio)** | Qué piden las gestoras, qué es gratis y qué se cobra | `docs/nexo-business/herramientas-gestoras.md` | Ernesto | NEXO interno | hecho (documento) | — | Ajustar a la idea nueva: la gestora es la clienta |

## 9. Operación (cv, supervisor, skills)

| Herramienta | Qué hace | Dónde vive | Quién la usa | Para quién | Estado | ¿NEXO? | Siguiente paso |
|---|---|---|---|---|---|---|---|
| **Supervisor del VPS** | Claude revisa escalaciones, reparto y buzón; solo despierta con trabajo real (Haiku para lo rutinario) | `/root/supervisor/` (`check.mjs`, `run.sh`, `CLAUDE.md`) | Ernesto | NEXO interno | en producción (ahorra ~85 %) | sí | — |
| **Comando `cv`** | Chat, enviar, pedido, pedidos de hoy, aprender, silenciar, reiniciar | `/root/supervisor/cv.mjs` (copia en la skill `casa-viva-ops`) | Claude, Ernesto | NEXO interno | en producción | sí | — |
| **Skills de operación** | `casa-viva-ops`, `/envia`, `/pedido`, `/hoy`, `/cierre`, `/sube`, `/silencia`, `/vigila`, `/aprende`, `/canal`, `/sigue` | `C:\Users\Ernesto\.claude\skills\` | Ernesto (Claude) | NEXO interno | en producción | sí | — |
| **Fuente de verdad** | LEEME, ESTADO, DECISIONES, LECCIONES, GLOSARIO | `docs/00-FUENTE-DE-VERDAD/` | todos los agentes | NEXO interno | en producción | — | ESTADO.md: corregir la fila de Digitaliza |
| **Revisión `/casaviva`** | Módulo de revisión para Claude Code | `scripts/casaviva-revision/` | — | NEXO interno | a medias (no cargado) | — | — |

## 10. NEXO interno: Cazador de clientes y bolsa (no es para gestoras)

Todo vive en **VivaBot**. Hoy se usa desde el chat "Tú" de Ernesto.

| Pieza | Qué hace | Dónde vive | Estado | Siguiente paso |
|---|---|---|---|---|
| **Grupos vigilados y personas** | GRUPOS, VIGILA, ESCANEA, LISTA, PERSONAS, ROL: clasifica a quienes escriben en los grupos (vendedor, chofer, cliente…) y arma listas | `vivabot/src/groups.js` + `supabase/008_grupos_personas_listas.sql` | en producción (fase 1 probada el 6-oct) | — |
| **Cazas** | "CAZA neveras", "mañana vamos a buscar…": avisa cuando aparece en tus grupos (dura 3 días, resumen cada 20 min) | `vivabot/src/groups.js` (CAZA, CAZAS, CAZA OFF) | en producción | — |
| **Mercado: quién vende X** | Guarda mensajes de grupos y chats; "busca quién vende X"; contacta en tandas con vista previa y SÍ (tope 30/80 al día); OFERTAS y PROVEEDORES | `vivabot/src/market.js` | en producción, poco usado | Probar búsquedas reales |
| **Bolsa de productos de proveedores** | La IA saca anuncios de los grupos de proveedores (título, 1–2 líneas, precio + margen, fotos). APRUEBA lo publica en Casa Viva como "Bajo pedido" | `vivabot/src/catalog.js` + Core `class-cvd-market-bridge.php`; tabla `crm_market_items` | a medias: **480 artículos nuevos, 2 aprobados, 1 descartado** | Es la "bolsa" de productos. Se puede comercializar después |
| **Comunidad** | Resumen nocturno de los grupos; las preguntas pasan a conocimiento y las ideas a sugerencias | `vivabot/src/community.js` | en producción | — |
| **Agente de demanda** | Lista diaria de productos con demanda real (grupos, preguntas sin respuesta y después Revolico) | `vivabot/docs/PENDIENTES.md` §"Agente de demanda" | idea | Fase 2: lector de Revolico |
| **"Cazadora" en el área de gestoras** | Botón "Pronto" en Herramientas | Core `class-cvd-gestora-app.php` | idea (no existe) | **Quitarla del menú de gestoras**: es interna |

---

## Duplicados o piezas que se pisan

1. **Cuatro caminos para crear o describir un producto:**
   - Product Studio (Render): IA completa con borrador en WooCommerce.
   - Digitaliza (panel): recepción y ficha de conocimiento, sin IA.
   - "Nuevo producto" del panel: crea el producto en la caja y en la web, sin descripción.
   - La bolsa del bot (`catalog.js`): crea productos "Bajo pedido" con 1–2 líneas.

   Hay que dejar **uno**: el panel como pantalla, la ficha de Digitaliza como lugar donde se guardan los datos, y la IA de Product Studio como cerebro (ver `entrada-a-ficha.md`).
2. **Tres lectores de fotos con IA:**
   - `nexo-curru` (factura).
   - `CVD_Curru_AI::read_image` en Core.
   - `analyzeProductImages` en `lib/commerce/ai.ts` (etiqueta y producto).

   Los dos primeros ya están unidos (la nube llama a Core). El tercero va aparte.
3. **Dos "Buscar precios":** `CVD_Gestora_Busca` en Core (gpt-4.1-mini, 15 por día, en uso) y NEXO Busca en Render (otro modelo y otro login). Tienen el mismo orden de búsqueda: Revolico, Facebook, tiendas, Cubísima y web. A esto se suma la búsqueda en grupos del bot ("quién vende X"). Hay que quedarse con la de Core para Casa Viva y llevarla a NEXO cuando haya gestoras de varias tiendas.
4. **Tres estudios de fotos:**
   - `studio.js` del bot (gratis).
   - `createCommerceWebp` de Product Studio (solo fondo blanco).
   - Higgsfield, a mano y además apagado dentro de NEXO Studio.
5. **Tres reglas de precio:**
   - Margen por tramos de costo en `lib/commerce/pricing.ts` (25 % hasta 50 USD…).
   - +5/+10 USD en la bolsa del bot (`myPrice`).
   - Comisión por producto en el panel.

   La regla de margen real de Casa Viva no está escrita en ningún sitio. **Preguntarla a Lennys.**
6. **Dos oficinas de gestoras:** la de Core (WordPress, en uso) y la de Tienda NEXO (Render, sin uso). Lo nuevo para gestoras no debería ir a las dos.
7. **Tres listas de clientes:** `wp_cvd_clients` (web), personas y clientes de la caja (nube) y `crm_contacts` (bot). El puente las copia, pero no son una sola.
8. **Cuatro piezas de conversaciones:** VivaBot, el kit `conversations`, el kit del Escritorio (`whatsapp-ai-agent-kit`) y Chatwoot.
9. **El panel se publica dos veces:** `casaviva.company/panel/` y Vercel (`negocio.nexocuba.com`), y Vercel va a mano. Es fácil que queden distintos.
10. **Funciones de la nube que no están en el repo:** `colo-orders` y `nexo-migration-import`.

## Lo que falta conectar

- **Llegó mercancía → producto nuevo.** Si la factura trae algo que no está en el catálogo, la caja solo deja "elegir"; no hay "crear producto con ficha".
- **Digitaliza no tiene enlace en el panel.** Además, sus productos nuevos no se crean en la web.
- **La ficha de conocimiento no la lee nadie:** ni el bot, ni Curru, ni "Compartir ficha", ni la descripción de la web. Por eso el bot dice "no sé las medidas".
- **La IA de Product Studio (visión, búsqueda web y SEO)** vive en Render, con su propia base, y no habla con la nube NEXO.
- **Las fotos que llegan al bot** se guardan 7 días y se borran: no pasan a ningún producto.
- **No existe publicar en Revolico ni en Facebook.** Ni siquiera como "copiar y pegar".
- **Higgsfield no tiene script de lote con presupuesto** (la fábrica lo pide).
- **El "Buscar precios" de las gestoras** no guarda lo que encuentra, así que no sirve para comparar proveedores con el tiempo.
- **Las gestoras no tienen un gestor de clientes con seguimiento** (etapas y recordatorios). Solo tienen la lista.
- **`PRODUCTOS <slug>` (paso 1 de la fábrica)** no existe en el bot.
- **ESTADO.md tiene la fila de Digitaliza vieja:** dice "migraciones sin aplicar", pero se aplicaron el 7-oct.

## Otros proyectos (no son herramientas; tienen su propia marca)

Cuyana, Curuguay, Zaldívar, Cuadre, Luz Propia, JRG Electronics, Colo Shop, Los Guajiros, Todo Hogar, La Rampa y la propuesta de Yonar (Rey de Alisados): ver `docs/00-FUENTE-DE-VERDAD/ESTADO.md` secciones B, C, D y E.
