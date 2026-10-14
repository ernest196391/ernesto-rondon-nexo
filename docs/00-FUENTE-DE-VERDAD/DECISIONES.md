# DECISIONES

Formato: número · fecha · decisión · por qué · qué sustituye.
Las decisiones nuevas van **al final**. Para cambiar una, se añade otra que la sustituya; no se borran.

## Organización

**D01 · 2026-10-05 · Una sola fuente de verdad: `docs/00-FUENTE-DE-VERDAD/` en el repo `ernesto-rondon-nexo`.**
Por qué: había al menos cuatro documentos que se proclamaban "fuente de verdad" (AGENTS.md de Product Studio One, protocolo de NEXO Business, README del portafolio, NEXO Product OS) y más de 60 documentos. Los agentes se contradecían.
Sustituye: la lista de lectura obligatoria del `AGENTS.md` anterior (sigue valiendo solo para su módulo).

**D02 · 2026-10-05 · No se borran ni se mueven documentos viejos.**
Por qué: hay agentes trabajando con esas rutas; moverlos rompería su trabajo. Se marcan como "de módulo" o "histórico" en `LEEME.md`.

**D03 · 2026-10-05 · Nada nuevo (repo, base de datos, proyecto Vercel, marca) sin registrarlo en `ESTADO.md`.**
Por qué: hoy hay 15 proyectos en Vercel, 4 en Supabase y 7 proyectos sin documentar.

## Producto y estrategia

**D04 · 2026-10-05 · El producto de entrada (wedge) es NEXO Business, empezando por Casa Viva.**
Por qué: la auditoría del repo muestra que la caja offline, el panel, gestoras y comisiones ya funcionan en Casa Viva. Es el activo más avanzado y probado.
Sustituye: la recomendación del Blueprint v1 (2026-10-05, mañana) de empezar solo por "catálogo vivo" y dejar la caja para después. Esa recomendación se hizo sin ver el repo; era incorrecta.

**D05 · 2026-10-05 · Pilotos: Casa Viva (nativo), Colo Shop (conector con AxisSoft).** *(Mercado 23 y 28 salió: ver D18.)*
Sustituye: "Estilo y Hogar" como siguiente piloto nativo en `docs/nexo-business/STATUS.md`.

**D06 · 2026-10-05 · Tres marcas visibles: NEXO, NEXO Business, NEXO Impulsa. Más el servicio Implementación NEXO.**
Studio, IA, Sync, Entregas, Crecimiento y Conocimiento son funciones o piezas internas (ver `GLOSARIO.md`).

**D07 · 2026-10-05 · Product Studio no es un repositorio ni un producto independiente.** Es la función "Digitaliza tus productos" de NEXO Business.
Sustituye: decisión del 2026-09-11 "Product Studio One es independiente; extracción a repo propio".

**D08 · 2026-10-05 · El software se llama NEXO Business en todas partes.** En Casa Viva puede mostrarse con la marca de la tienda ("Casa Viva" + logo) pero el producto es NEXO Business.
Sustituye: el cambio de nombre a "Casa Viva Core" del 2026-10-04 como nombre de producto.

**D09 · 2026-10-05 · "NEXO Energía" deja de llevar el nombre NEXO.** Es un negocio de servicios propio (energía solar) con otro nombre, que usará NEXO por dentro.

**D10 · 2026-10-05 · Prioridad: cobrar antes de construir.** Ningún proyecto nuevo ni de la sección "Pausado" se reactiva hasta que NEXO Business cobre a los tres pilotos.

**D11 · 2026-10-05 · La IA conversa; los datos verificados deciden.** Ningún asistente da precio, stock, pedido, pago o comisión que no salga de la base de NEXO. Si no lo sabe, lo dice y escala a una persona.

**D42 · 2026-10-11 · El cliente de NEXO es la GESTORA (la revendedora). Casa Viva es el negocio de Lennys y el banco de pruebas.**
Casa Viva se construye y se le deja a Lennys; ahí se prueban todas las herramientas. A las gestoras se les dan GRATIS todas las herramientas que les resuelvan problemas y las hagan sentir cómodas: publicar desde su panel, publicar fácil en Revolico y Facebook, buscar y comparar precios y proveedores, lead manager para su propia web, compartir fichas, etc. Las herramientas premium de NEXO cuestan más y el precio se fija por el valor que aportan y el cliente ideal (sin cifras fijadas aún). Los «1.000 negocios» se consiguen usando NEXO; las gestoras que vendan o ayuden ganan comisión (por definir). El «Cazador de clientes» es una herramienta INTERNA de Ernesto/NEXO (exchange para cazar clientes, gestores y productos), no de las gestoras; quizá se comercialice después.
Sustituye: en `docs/nexo-business/herramientas-gestoras.md` (11-oct) los planes Caja/Con gestoras/Pro cobrados al comercio y la idea de quitar el «Cazador de clientes»: quedan como borrador hasta replantearlos con la gestora como cliente.

**D43 · 2026-10-11 · Regla provisional para ventas NEXO de margen fijo (dropshipping de producto caro): primero el transporte real, y lo que queda del margen 40 % para la gestora o gestor y 60 % para NEXO (Ernesto).**
Primer caso: split Parker de Harley (margen +25 USD sobre el proveedor; cliente paga en CUP). Si la gestora o el gestor sube el precio por su cuenta, ese extra es suyo y se descuenta de su 40 %. El cambio a CUP se calcula con la tasa del día. Vale hasta que el motor de precios (`docs/nexo-business/motor-de-precios.md`) tenga la regla definitiva.

**D44 · 2026-10-11 · Fichas de producto: siempre borrador «[REVISAR]» y aprobación humana (interruptor encendido).** Ernesto (aprobar antes de publicar; Ernesto y Lennys revisan; Nataly de vacaciones; se pueden usar fotos de internet del mismo producto con su fuente) + Claude (cómo). La skill `/ficha` nunca publica: crea un producto en borrador; si el producto ya está en la web, es un borrador aparte «[REVISAR] …» con `_cvd_ficha_target` y el vivo no se toca hasta «Aprobar» (que guarda copia del texto viejo). Cada dato va marcado confirmado / sugerido / falta; el precio no lo decide la ficha. Paso 1: se revisa en wp-admin → Casa Viva → Fichas por revisar (Core 3.13.56); la lista en el panel es el paso 2. El interruptor `cvd_fichas_requiere_aprobacion` solo lo apaga Ernesto cuando el bot demuestre que lo hace bien.

**D45 · 2026-10-12 · Marketplace «bajo pedido»: precio automático, sin permiso de fotos y confirmación con el proveedor antes de mandar mensajero.** Ernesto.

**Precio** (la bolsa del bot y lo importado de Digital Store; `vivabot/src/market-price.js`):
- Desde 60 USD: regla D43. Margen = **+17 USD como mínimo**; si cuesta más de 300 USD, **+10 %** cuando sale más. Se redondea hacia arriba a 5.
- Por debajo de 60 USD: **+40 %**, con un mínimo de 5 USD y un máximo de 17 USD. Se redondea al dólar. Ejemplos: 10 → 15, 30 → 42, 50 → 67, 270 → 290, 600 → 660.
- De la ganancia, el **40 % es para la gestora** y el 60 % para NEXO.
- El transporte no se suma: lo paga el cliente con la mensajería.
- Un precio fijado a mano (`PRECIO n`) manda sobre la regla.

**Fotos y contactos:**
- No hace falta pedir permiso al proveedor para usar sus fotos; `FOTOS OK` es opcional.
- El bot puede escribir de parte de Ernesto a cualquier proveedor, también a LJH, con «tenemos un cliente interesado», solo cuando hay un pedido o una consulta real.

**Pedidos:**
- Un pedido con un producto bajo pedido **no sale solo al grupo de mensajeros** (Core 3.13.63).
- El bot avisa a Ernesto con el costo, la ganancia y el proveedor.
- El bot le pregunta al proveedor si lo tiene y le pasa la respuesta a Ernesto. Si no lo tiene, propone hasta 3 parecidos de la bolsa (VivaBot `60b3080`).
- La web promete confirmar la disponibilidad en 1 hora antes de cobrar.

**Sustituye:** el +5/+10 USD y +5 % de la bolsa (9-oct) y el «FOTOS OK obligatorio».

## Negocio

**D12 · 2026-10-05 · El modelo comercial de todo el ecosistema se construye con los tres libros de Alex Hormozi:** *$100M Offers* (oferta), *$100M Leads* (captación), *$100M Money Models* (modelo de dinero), más su método de cierre de ventas (CLOSER). Ver `NEGOCIO.md`.

**D13 · 2026-10-05 · NEXO registra y concilia pagos; no los procesa.** Métodos aceptados: Zelle, USD efectivo, cripto, PayPal, tarjeta clásica, MLC, Transfermóvil, EnZona. Ver `PAGOS-Y-LEGAL.md`.

**D14 · 2026-10-05 · Erondon2.0 LLC no se usa para cobrar a negocios en Cuba hasta que lo revise un abogado de sanciones.** Por qué: el 30-09-2026 la OFAC endureció las reglas sobre Cuba. Ver `PAGOS-Y-LEGAL.md`.

## Técnica

**D15 · 2026-10-05 · Base central: Supabase `nexo-production`.** Proyectos de Supabase separados (Cuyana, Cuadre) se mantienen hasta que haya un motivo para unirlos; no se crean más.

**D16 · 2026-10-05 · Stack fijo:** Next.js + Supabase en Vercel para web y paneles; Tauri + Rust + SQLite solo para la caja offline; WooCommerce solo como canal externo que se conecta, nunca como motor de NEXO. Render se mantiene mientras la tienda web siga allí; no se crean servicios nuevos en Render.

**D17 · 2026-10-05 · Dominio de NEXO: `nexocuba.com`.** Todo lo que cuelga de `casavivadecuba.com` se muda antes de soltar ese dominio.

**D18 · 2026-10-05 · Mercado 23 y 28 no es piloto (no aceptó).** Pilotos: Casa Viva y Colo Shop. Curuguay y Zaldívar son clientes de remesas que se terminan y entregan sobre NEXO Business.

**D19 · 2026-10-05 · Subdominios de `nexocuba.com`:** `negocio.` (panel NEXO Business), `tienda.` (tienda NEXO e Impulsa), `cuyana.`, `cuadre.`. La raíz `nexocuba.com` queda para la web de NEXO. Los negocios con marca propia tendrán su propio dominio a largo plazo; el subdominio es provisional.

**D20 · 2026-10-05 · La dirección pública de la tienda vive en un solo sitio:** `lib/site.ts`, controlada por la variable `NEXO_PUBLIC_URL`.

**D21 · 2026-10-05 · El chequeo de tipos de la web no incluye `apps/`, `packages/`, `supabase/functions/` ni `kits/`** (cada uno tiene su propia configuración). Por qué: hacían fallar el build de `main` y Render no podía publicar.

**D22 · 2026-10-05 · El servicio de energía se llama Luz Propia.** Por qué: en Cuba "tener luz" es lo que la gente busca en los apagones; "propia" dice que no dependes de la red. Corto, en español, sin la palabra NEXO.

**D23 · 2026-10-05 · No se compran más dominios.** Cada emprendimiento y cliente vive en un subdominio de `nexocuba.com` (`luzpropia.`, `curuguay.`, `zaldivar.`, `coloshop.`, `losguajiros.`, `jrg.`…). Sustituye: comprar dominio de Colo Shop cuando pague, y la parte de D19 que decía "dominio propio a largo plazo" (se revisa solo si un cliente lo paga).

**D24 · 2026-10-05 · La tienda NEXO muestra todo el catálogo publicado del comercio conectado** (hoy Casa Viva en `casaviva.company`), no solo los productos con SKU `NEXO-`. Por qué: esos productos vivían en la web vieja que ya no existe; Ernesto eligió la opción A. Reversible con `NEXO_CATALOG_SCOPE=nexo`.

**D25 · 2026-10-05 · Claude puede cambiar por su cuenta DNS y despliegues de `nexocuba.com` y de los proyectos de Ernesto** sin pedir confirmación cada vez (autorización de Ernesto). Sigue sin teclear contraseñas: lo que exige su login lo hace Ernesto.

**D26 · 2026-10-05 · JRG Electronics y Luz Propia son negocios separados.** Pueden compartir catálogo de equipos dentro de NEXO, pero cada uno con su marca y su subdominio.

**D27 · 2026-10-05 · El negocio de automatización (Implementación NEXO) vive en `automatizacion.nexocuba.com`** (proyecto Vercel `nexo-plan-veci`, repo `Nexo-web-`). Se recreará con Higgsfield. Su plan Growth ya no promete "familia paga desde el exterior" (D14).

**D28 · 2026-10-07 · "Digitaliza tus productos" se reanuda dentro de NEXO Business con Casa Viva como piloto** (pedido de Ernesto, 2026-10-05). Página del panel (`digitaliza.html`), Core como única autoridad de producto y stock, y una ficha central de conocimiento por producto como única fuente para contenido e IA. Detalle: `docs/nexo-business/DIGITALIZA.md`.
Sustituye: la condición de ESTADO "se reanuda cuando entre el piloto Mercado 23 y 28" (ese piloto salió, D18).

**D29 · 2026-10-07 · Flujo de pedidos y mensajería de Casa Viva: "un pedido, un hilo, 4 momentos".** Casa Viva Core (WooCommerce) es la única verdad del pedido; el bot de WhatsApp, el grupo de mensajeros, el panel y la futura app de mensajeros son solo canales que leen y escriben en Core. Las personas tocan 4 veces: entra (web), sale (dependienta: un botón "Listo"), se asigna (mensajero: "Yo"/Aceptar, gana el primero, lo decide Core), se cierra (mensajero: entregado + cobro; tienda: dinero recibido). El resto lo hace el sistema (oferta, publicación en el grupo, vale, hora, confirmación al cliente, avisos por tiempo). Se construye por bloques y se repite la prueba completa al final. Por ahora el bot sigue en el número personal de Ernesto (se cambia después). Ernesto autoriza a Claude a cambiar lo necesario en Core y VivaBot para lograrlo (sin contraseñas ni crear cuentas).

**D30 · 2026-10-07 · Un pedido cerrado (dinero verificado) no se cancela ni se reembolsa desde WooCommerce.** Core lo deja como estaba y anota que hay que registrar una devolución. Las devoluciones tendrán su propio flujo (producto devuelto, dinero devuelto al cliente y qué pasa con la comisión y la ganancia del mensajero), por construir. Código: `CVD_Delivery::guard_closed_cancellation` (Casa-Viva `1aae386`).

**D31 · 2026-10-07 · Las sugerencias de gestoras, mensajeros y clientes se guardan y no cambian nada solas.** VivaBot las apunta en `crm_feedback` (estado nueva → propuesta → aprobada → hecha/descartada) y avisa a Ernesto. Claude prepara la propuesta de cambio y **solo la aplica con la aprobación de Ernesto**. El bot también avisa de cada solicitud de alta de gestora o mensajero y da la bienvenida al aprobarla (VivaBot `d5a07c6`, Core 3.13.17).
Ampliación D30 (2026-10-07): el flujo de **Devolución** ya existe en `/ventas/` (solo administración, Core 3.13.18): vuelve el stock, se anula la comisión de la gestora, la ganancia del mensajero se mantiene salvo que se marque anularla (y nunca si ya está liquidada), y queda anotado el dinero devuelto, el motivo y quién lo hizo.

**D32 · 2026-10-07 · Altas de gestoras y mensajeros desde WhatsApp, con modo elegible por Ernesto.** En el chat "Tú": `APRUEBA n`, `RECHAZA n`, `SOLICITUDES`, y `ALTAS MANUAL` (por defecto: todo espera aprobación), `ALTAS CONOCIDAS` (se aprueban solas las que ya trabajaban con Casa Viva: vales de BizneCubano o grupo de mensajeros) o `ALTAS TODAS` (todo se aprueba solo; no recomendado fuera de la migración). La bienvenida lleva el enlace de la gestora y un enlace de acceso sin contraseña (7 días), nunca para cuentas de administración. Core 3.13.19 · VivaBot (gestoras.js).

**D33 · 2026-10-08 · Lo extra que compra en tienda el cliente de una gestora es de la gestora.** Propuesta de Lennys (sugerencia n.º 15), aprobada por Ernesto. La dependienta lo cobra en la caja en el momento (el stock baja enseguida, sin riesgo de vender dos veces) y con un toque lo añade al pedido de la gestora; la gestora cobra su 10 % completo sin hacer nada y el bot le avisa por WhatsApp. La dependienta conserva su 0,5 % de lo que vende. Se programa (botón en `/ventas/` + aviso del bot) cuando Lennys dé el visto bueno. Sustituye la regla anterior de Lennys: "el extra es compra directa, ni para gestora ni para dependienta".

**D34 · 2026-10-08 · Las gestoras pasan ya al sistema nuevo (casaviva.company), sin esperar la semana en paralelo.** Ernesto y Lennys (chat 15:47–15:54). Ernesto se encarga de registros, enlaces, errores de la página, productos y de contestar y guiar; Lennys le pasa las preguntas que le lleguen. Se aceptan 2–3 días de corrección sobre la marcha. Hay que avisar a todas y buscar formas de reducir errores. Los extras en tienda (D33) quedan como están hoy y se implementan bien en la caja nueva. Cambia la fase 2 ("paralelo 1 semana") de `PLAN-DEJAR-BIZNECUBANO.md`.

**D35 · 2026-10-08 · Supervisor autónomo 24/7 en el VPS del bot.** Claude Code (cuenta Claude Pro de Ernesto, modelo Sonnet) en `/root/supervisor`, cron cada 5 min con `check.mjs` (vuelta cada 30 min de día, 2 h de noche, al momento si hay escalaciones o respuestas de Ernesto). Hace solo: responder a quien el bot no atendió, dar accesos, arreglar errores pequeños con copia y marcha atrás. Pregunta por WhatsApp (tabla `crm_supervisor`, órdenes `SÍ n`/`NO n`/`PREGUNTAS`/`SUPERVISOR SÍ|NO`) todo lo de dinero, reglas, grupos, borrar y cambios grandes. Avisos por WhatsApp al chat "Tú" (resumen 9:00 y 20:00). Reglas en `/root/supervisor/CLAUDE.md`. Los arreglos que haga en la web quedan anotados en `crm_supervisor` para pasarlos al repositorio.

**D36 · 2026-10-08 · Comisión de gestoras por producto, igual que en BizneCubano.** General 10 %; 209 productos con monto fijo por unidad copiados del panel de BizneCubano (Programa de Gestores → sobrescribir por producto) a Core (`_cvd_commission_type=fixed`, `_cvd_commission_value`). Leído con la sesión de Ernesto, sin cambiar nada en BizneCubano. Productos nuevos entran con 10 % hasta que se les ponga el suyo (la sincronización horaria no copia comisiones: el panel es privado).

**D37 · 2026-10-11 · Un solo panel y un solo dueño por dato.** Ernesto. El panel de Lennys (`casaviva.company/panel/`) es el único panel de administración; lee los pedidos de la web (Core) por `nexo-panel-web`. **Las comisiones de gestoras se gestionan solo desde ese panel** (sustituye la carga en Core de D36): la web y la caja las leen de la nube NEXO. Regla general: cada dato se cambia en un único sitio (tabla en `docs/nexo-business/mapa-casa-viva.html`).

**D38 · 2026-10-11 · Casa Viva deja BizneCubano: la caja (nube NEXO) manda en precios y existencias.** Lennys deja de vender por BizneCubano el 2026-10-11. Última copia desde la foto de BizneCubano de las 03:15 UTC (web y caja coincidían, 0 diferencias). Apagadas las copias automáticas (`catalog-source-snapshot.yml`, `catalog-sync.yml` desactivadas; `auto_import=false`, `price_authority=nexo`). Un solo stock: puente `nexo-stock-bridge` cada 2 min, por movimientos con clave única (caja→web y web→caja). Precios y cantidades se cambian en el panel → Inventario. Para volver atrás: reactivar los dos workflows y `auto_import=true`, `stock_bridge_from=NULL`.

**D39 · 2026-10-11 · Productos nuevos y tarifas de mensajería se cambian en el panel.** Claude (dentro de D37/D38). Los productos se crean y editan en el panel → nube NEXO → cajas; un producto nuevo NO se crea solo en la web (hay que subirlo también en casaviva.company). Las tarifas de mensajería por zona siguen guardadas en Core (las usa el checkout), pero se editan desde el panel (Ajustes → Mensajería); el editor CSV de WordPress queda como respaldo.

**D40 · 2026-10-11 · El mensajero se queda el 100 % de la mensajería y las carreras salen en el grupo real.** Ernesto. Casa Viva no cobra comisión sobre la mensajería (`cvd_shipping_platform_percent` = 0 en la web); el cliente paga la mensajería en CUP al mensajero y es toda suya. Las carreras de los pedidos web se publican en el grupo "Mensajerías CASA Viva" (ya no en el de prueba); el primero que dice "Yo" la toma y el bot le manda el vale por privado. Sustituye: el 10 % para Casa Viva que tenía la web por defecto.

**D41 · 2026-10-11 · Productos: «Diseños y colores» y «Dejar de vender» en el panel; nunca se borra un producto.** Claude (pedido de Lennys, dentro de D37/D39). (1) Un producto con colores o diseños sale como **una fila** en Productos con la cantidad de cada diseño; en su ficha («Diseños y colores») se cambian cantidades (− / +) y precios, y se añaden diseños nuevos (Core crea la variante con 0 y la caja pone la cantidad; el puente la copia a la web). Los diseños que la web tenía y la caja no, se enlazan al abrir la ficha con la cantidad de la web, sin duplicar. (2) Un producto **sin** colores **no se convierte** (sus ventas, unidades, comisiones, costos y el puente de existencias van atados a ese producto): se crea un producto nuevo con diseños y el viejo se puede retirar. (3) «Dejar de vender» (producto, diseño o varios desde «Agotados») = inactivo en la caja + privado, oculto y retenido (`_cvd_hold`) en la web; queda en «Retirados» con «Volver a vender». Nada se borra; mientras esté retirado ninguna importación o sincronización lo reactiva (`retired_at` en la nube, `_cvd_retired` en Core). Quién y cuándo: `cost_audit` (NEXO) y `cvd_panel_product_log` (Core). Código: Core 3.13.52, migración `20261011180000_nexo_business_product_designs_retire`, `nexo-panel-web`, panel.

**D46 · 2026-10-12 · Ernesto Padre: influencer IA "Abuela Nena", de bienestar genérico y sin la marca Vital Health.** Ernesto. Para promocionar el negocio de afiliado de su padre (Vital Health Global) se crea un personaje IA, la Abuela Nena (68 años, Santos Suárez), que habla de hábitos y no de productos. Motivo: las reglas de la empresa (Policies & Procedures de EE. UU., feb-2025) prohíben su nombre en las cuentas (7.2), publicar fotos o videos de la empresa en redes (7.11), prometer curas (7.12) y hablar de ingresos (7.13). Cada día sale 1 video y 5 historias, y Ernesto los aprueba antes de publicarlos. Para gastar pocos créditos, la IA solo hace las fotos (con el ilimitado de la web) y la voz (0,7 créditos); el montaje se hace gratis con HyperFrames. Claude no crea las cuentas ni usa la contraseña del padre.

**D47 · 2026-10-13 · Bajo pedido: respuesta en menos de 1 hora y entrega en 24 horas; el proveedor lo lleva o lo recoge Ernesto.** Ernesto.
- **Plazos.** A la gestora se le responde en menos de 1 hora si el producto está o está agotado, y se le entrega en 24 horas. De noche, la respuesta es «te lo confirmamos mañana a las 9».
- **A quién se avisa.** Los avisos van a la gestora; al cliente de una gestora no se le escribe nunca. Al cliente solo se le escribe si compró directo en la web.
- **Proveedores que lo llevan** (Kevin de Digital Store, Sergio, y Electro = LJH): lo llevan al cliente con sus propios mensajeros. El cliente les paga a ellos, y el proveedor después nos trae nuestra parte o se la vamos a buscar. Con Sergio se puede pactar que se quede todo el dinero y nos pague solo nuestra parte.
- **Tienda que recoge Ernesto:** la TRD de 42 y 23 (Playa), de 9:00 a 17:00. Ernesto va con el dinero.
- **Cómo debe funcionar.** Todo transparente y cada vez más automático: una ficha por proveedor (horario, si lo lleva, cómo cobra) y una cuenta clara de lo que cada proveedor cobró y nos debe. Cada tienda o e-commerce nuevo es solo una ficha más.
- Diseño en `docs/productos/bajo-pedido-24h.md`.
- **Construido y en vivo (13-oct, 14:24; VivaBot `483b9fb`, SQL 024).** Cómo se resolvió lo que D47 no decía (Claude): si el proveedor dice que no y otro tiene exactamente lo mismo, se le pregunta a ese antes de decirle «agotado» a la gestora; un pedido con productos de la tienda, de varios proveedores, de recogida en tienda o de un proveedor sin ficha se confirma igual, pero la entrega la coordina Ernesto; si el cliente ya pagó por Zelle/PayPal, el proveedor no cobra los productos y le debemos su costo. **Sin cambiar:** la regla de la comisión (entregado + dinero confirmado: aquí, cuando el proveedor nos paga) y el cierre del pedido en Ventas (a mano). Pregunta abierta para Ernesto (ESTADO L4).

**D48 · 2026-10-13 · «Aprende»: lo que el bot ya mandó por WhatsApp cuenta como visto.** Claude, dentro del boceto que aprobó Ernesto (13-oct); Ernesto puede cambiarlo.
- En la pestaña «Aprende» (Core 3.13.77), lo que VivaBot mandó por WhatsApp sale con «✓» y la nota «enviado por WhatsApp». Así el bot no repite lo que ya se vio en la web, y la web no pide lo que ya llegó por WhatsApp.
- Si la persona lo desmarca en la web, manda ella: un envío más viejo del bot no lo vuelve a marcar.
- Al terminar un vídeo o la nota de voz en la web, se marca solo. «Guías rápidas» marca a la vez las dos guías del bot (1-2 y 3-4).

**D49 · 2026-10-13 · La tienda ve quién vendió y quién lleva cada pedido web; no ve la comisión.** Claude, a pedido de Nana y con la orden de Ernesto («pon un agente a resolver el problema que tiene Nana de los gestores»). Ernesto puede cambiarlo.
- Las dependientas (Nana, Zaymi) ven en Pedidos el nombre y el WhatsApp de la gestora y del mensajero de cada pedido (Core 3.13.78). Antes la web les escondía la gestora.
- La comisión de la gestora y el enlace de administración siguen escondidos para ellas.
- Los avisos de pedido de la tienda abren el pedido en `/ventas/` (la página `/centro-pedido/` nunca se creó en la web).

**D50 · 2026-10-13 · El último enlace de gestora manda (precio y venta); el cliente que ya compró sigue con su gestora.** Ernesto (14:21: «sí, haz lo que tengas que hacer»).
- **Antes:** la web guardaba en el navegador, durante 400 días, la *primera* gestora por la que se entró, y esa ganaba a cualquier enlace posterior. Por eso Thaly veía su producto a 30 en vez de su precio de 35, y la venta se le habría apuntado a otra gestora.
- **Ahora** (Core 3.13.79–3.13.80): el enlace que se abre manda en el precio y reescribe la marca guardada. Además, el `?ref=` ya no se pierde al buscar ni al tocar la barra de abajo.
- **Lo que no cambia:** un cliente que ya compró sigue siendo de su gestora; lo decide su teléfono o su correo (propiedad permanente).
- **Si alguna vez se quiere volver al primer enlace:** restaurar `includes/class-cvd-attribution.php` desde `~/bak-20261013-cvd-3.13.78-antes-3.13.79`.

**D51 · 2026-10-13 · La portada de Casa Viva es para comprar: filas de productos; la confianza va en una franja fina.** Ernesto («buscar cómo sustituir como en Amazon o Temu, Shein y poner productos y decisiones de compra»). Los detalles los decidió Claude; Ernesto puede cambiarlos.
- En la portada solo va lo que lleva a un producto: departamentos, buscador y filas (lo más vendido de la semana, recién llegados, a buen precio y una por departamento). Nada de tarjetas grandes ni cajas de pasos. La entrega, el pago y WhatsApp van en una línea con enlaces.
- «Lo más vendido» sale de pedidos reales: en espera, en preparación y completados. No cuenta pruebas, cancelados ni pendientes de pago.
- En la portada, todo el mundo ve el precio en CUP con la tasa del día, debajo del USD. Si la tasa tiene más de 36 h, el CUP no sale. El precio de cobro sigue siendo el USD.
- Con el enlace de un gestor o una gestora se ve su precio, y esa página no se guarda en caché (como `/tienda/?ref=`).
- Interruptor: `cvd_home_rails = no` vuelve a la portada anterior. Ficha: `docs/productos/home-que-vende.md`.

**D52 · 2026-10-13 · En la tienda de una gestora, todo WhatsApp va a ella.** Ernesto (18:40: «usamos el wp de la gestora en toda su tienda»). Los detalles los decidió Claude; Ernesto puede cambiarlos.
- **Quién entra en la tienda de una gestora:** quien abre su enlace (`?ref=`), o lo abrió antes en ese teléfono. Es la misma gestora que se queda la venta (D50).
- **Todos los WhatsApp van a ella:**
  - el pie;
  - el botón verde;
  - «Pedir por WhatsApp» y «Avísame» de la ficha;
  - Ayuda (Cúrru);
  - Atención al cliente, Formas de pago, Condiciones de mensajería y `/contacto/`;
  - «Corrige tu pedido» del pedido recibido.
- En la ficha, el texto ya escrito nombra el producto con el precio de ella.
- **Sin gestora:** Casa Viva (5405 6173). Un cliente con cuenta, sin enlace, va a su gestora de siempre.
- **Nunca** sale el número de otra gestora.
- **El equipo** (gestoras, mensajeros, tienda) habla con Casa Viva. La gestora que abre su propia tienda ve su número, como sus clientes.
- **No cambia:** «mi acceso» (entrar con WhatsApp) sigue yendo al bot de Casa Viva. El vale del pedido sigue yendo a la gestora del pedido, como antes.
- Código: Core 3.13.88 (`CVD_Gestora_Store::contact()`). El pie del tema y el plugin de marca (solo en el servidor) llaman a esa función.
- **Para volver atrás:** `~/bak-20261013-cvd-3.13.87-antes-3.13.88`, `~/bak-20261013-tema-footer-antes-3.13.88.php` y `~/bak-20261013-marca-antes-3.13.88.php`.

**D47 · 2026-10-13 · Abuela Nena en pausa.** Ernesto. Se pausa el contenido diario de la Abuela Nena (tarea programada desactivada) hasta que el negocio de Ernesto Padre dé dinero o exista un modo casi gratis. Gasto total de Nena hasta la pausa: unos 71 créditos de Higgsfield (≈4 al día en marcha); lo caro de la cuenta son los videos Seedance de Cúrru (27–67,5 cada uno). Para reactivar: activar la tarea "Abuela Nena · contenido del día" o `/nena-hoy`.
