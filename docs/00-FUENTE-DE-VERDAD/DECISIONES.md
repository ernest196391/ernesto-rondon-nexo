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

**D53 · 2026-10-14 · Programa de gestoras y clientes (decidido por Ernesto, SIN programar todavía).** Propuesta: `docs/nexo-business/propuestas/programa-gestoras-y-clientes-2026-10-14.md`.
- **Madrinas (invitar gestoras):** 1 % de las ventas de la invitada y 0,5 % de segundo nivel, 12 meses desde que entra, solo ventas entregadas y pagadas. Lo paga Casa Viva; la invitada cobra su comisión completa. Base: precio de Casa Viva, sin el aumento de la gestora ni la mensajería. Para cobrar de su red: 1 venta propia entregada en el mes; para el 0,5 %, además ser Anfitriona. (Sustituye la propuesta del 2 % de un nivel enviada a Lennys el 11-oct.)
- **Cliente de por vida:** el cliente es de su gestora mientras ella venda al menos cada 90 días; a los 6 meses sin vender (con aviso antes) vuelve a Casa Viva. Si compra en la tienda física dando su teléfono: 5 % más adelante, cuando la caja pida el teléfono.
- **Rangos** (Vecina, Anfitriona, Casa Llena, Embajadora): al principio solo reconocimiento; dinero extra (+1–2 %) a los 3 meses con datos.
- **Amigas Casa Viva (clientes):** «tú 3, ella 3», a los 30 días, empezando por clientes de Dany.
- **Fallos a arreglar ya:** el cliente queda unido a la gestora solo con pedido entregado y pagado; los clientes apuntados a mano quedan protegidos 30 días.
- **Antes de programar:** sí de Lennys (se le manda un resumen corto que Ernesto ve antes) y prueba en «modo sombra» con Dany 2 semanas.

**D54 · 2026-10-14 · Rangos con bono mensual (Ernesto; cambia la parte de rangos de D53).** Detalle: `docs/nexo-business/propuestas/rangos-2026-10-14.md`.
- **10 rangos con nombres de piedras:** Bronce, Plata, Oro, Platino, Zafiro, Rubí, Esmeralda, Diamante, Doble Diamante, Corona.
- **Punto = 1 USD vendido y entregado** (precio Casa Viva, sin aumento ni mensajería), propio + equipo (2 niveles). El título se gana acumulando y no se pierde; el **bono** se cobra solo el mes en que se mantiene el rango (ventas del equipo de ese mes + mínimo propio).
- **Tabla aprobada:** 300 USD del equipo/mes → 5.000 CUP; 600 → 10.000; 1.000 → 15.000; 1.800 → 25.000; 3.000 → 40.000; 5.000 → 60.000; 8.000 → 90.000; 12.000 → 130.000; 18.000 → 180.000; 25.000 → 250.000. Coste: 1,3–2,1 % de las ventas del equipo.
- **Bono fijo en CUP** (se revisa cada 3 meses con la tasa). **Se paga desde el lanzamiento**, después de las 2 semanas de prueba con Dany (que no paga).
- Frenos: ninguna persona del equipo aporta más del 60 % de los puntos; autocompras y pruebas no cuentan; devoluciones restan; comisión + red + rango ≤ 40 % de la ganancia del pedido.

**D55 · 2026-10-14 · Los bonos de rango y la red salen de la ganancia, no de la caja (Ernesto; ajusta D53/D54).**
- **Ganancia de cada venta** = precio Casa Viva − costo del producto − comisión de la gestora. Costo: tienda = archivo de BizneCubano (CCV/costo); bajo pedido = `supplier_price` de la bolsa.
- **Fondo de líderes = 15 % de la ganancia** generada en el mes. De ahí salen el 1 % y el 0,5 % de la red y los bonos de las piedras (tabla D54).
- **Si el fondo no alcanza**, todos cobran el mismo % de su bono (reparto proporcional). Casa Viva nunca pone más que ese 15 %.
- **0,5 % de segundo nivel:** hace falta ser **Plata** (equipo con 600 USD en el mes).

**D56 · 2026-10-14 · Programa de gestoras: se prueba y se lanza ajustando sobre la marcha (Ernesto).** Rangos pagados con la ganancia (propuesta `docs/nexo-business/propuestas/rangos-por-ganancia-2026-10-14.md`: punto = USD de ganancia limpia, fondo 15 %, 5 red + 10 bonos). Antes de programarlo: costos reales y precio mínimo (`escalar-marketplace-2026-10-14.md`).

**D57 · 2026-10-14 · Bot y grupos (Ernesto).** Stickers de Cúrru para todos, sin límite de horas (4 mensajes entre uno y otro, nunca en temas serios, tope 300/día); los de Ernesto cuando responde él. Sin la marca 🤖 ni la firma (BOT_TAG vacío). Mensajes diarios automáticos sin borrador en General y Mensajerías: 9:00 orden del día, 17:00 resumen con ranking, 19:00 videos e historias (solo General). Bienvenida de gestora versión B con «precio de mensajería».

**D58 · 2026-10-14 · Red 2 % + 1 % y forma de decidir (Ernesto).**
- **Red:** 2 % de lo que vende la invitada (1.er nivel) y 1 % del 2.º nivel, sobre el precio de Casa Viva de ventas entregadas y cobradas, 12 meses. Sustituye el 1 % + 0,5 % de D53. Para el 1 % de 2.º nivel hace falta ser Plata (D55).
- **Tope de seguridad (Claude, best practice):** red + bonos salen del fondo del 15 % de la ganancia del equipo (D55). La red se paga primero; los bonos de piedra, con lo que quede; si no alcanza, reparto proporcional. Casa Viva nunca pone más del 15 % de la ganancia que genera ese equipo.
- **Quién decide:** Ernesto decide casi todo (Lennys tiene poco tiempo). Claude siempre le propone la mejor práctica con una recomendación; en lo operativo y reversible, Claude decide y lo apunta; se corrige en la práctica.
- **Orden:** primero costos y precios; luego programar el programa (prueba con Dany sin pagar, 2 semanas).

**D59 · 2026-10-14 · Costo de cada producto y precio mínimo (Claude, técnico y reversible; D58).**
- **Dónde vive el costo:** en Core, meta `_cvd_cost_usd` (compra + flete por unidad, USD), `_cvd_cost_source` (bizne | proveedor | manual | formula) y `_cvd_cost_updated_at`, en producto y variación (la variación hereda el del padre). Nombre fijo: lo usa el programa de gestoras. Solo lo ve la administración.
- **De dónde sale:** tienda = ficha de costos de la nube (BizneCubano/Excel + correcciones de Lennys + entradas de mercancía); el panel lo copia a la web al guardar. Bajo pedido = `supplier_price`, copiado cada mañana a las 8:50. Un costo dudoso (cruzado con otra fila, ¿paquete?, precio menor que el costo) no se carga hasta que lo confirme Lennys o Ernesto.
- **Precio mínimo:** tienda = costo + 1,58 USD de gastos fijos + comisión + máx(10 % del precio, 1 USD). Bajo pedido = costo + comisión + máx(2,5 % del precio, 1 USD), sin gastos fijos (no ocupa almacén ni dependienta; el 2,5 % cubre cobros). Comisión = la fija del producto o el 10 % general. Números en opciones `cvd_cost_*` de la web.
- **Qué hace la web:** recalcula al guardar y marca `_cvd_under_floor`; NO cambia precios ni comisiones sola. Ernesto decide cada caso (subir, bajar comisión o liquidar). Aviso diario en el resumen de las 9:00: «N productos bajo el mínimo · M sin costo».

**D60 · 2026-10-14 · Programa de gestoras: cómo se programó (Claude, técnico y reversible; D58). Core 3.14.1, SIN desplegar.** Detalle: `docs/nexo-business/programa-gestoras/DISENO.md` §6.
- **Libro en WordPress** (`wp_cvd_programa_runs/people/lines`, JSON + SHA-256, solo se añade, un cierre por mes), no en Supabase: misma base y transacción que pedidos y pagos; el panel lo lee por el puente.
- **Doble tope del 15 %:** por equipo y del mes entero (cada venta una vez), porque los equipos se solapan; sin el del mes podría pagarse hasta el 45 % de la ganancia de una venta.
- **60 %:** cada miembro del equipo cuenta como mucho el 60 % del umbral de la piedra; las ventas propias, enteras. **Mínimo propio:** 1 venta entregada + los USD de la tabla D54. **Plata para el 1 %:** la piedra de ese mes. **12 meses:** solo para la red. **Mes de la venta:** cuando se confirmó el dinero.
- **Red perdida** (sin venta propia o sin Plata) no se guarda. **Devolución** de un mes cerrado resta en el siguiente; red negativa = alerta y revisión a mano.
- **Autocompra por nombre** (quien compra o recibe se llama como la gestora); la marca `self_order` de Core sola solo avisa («revisar»): salía en 19 de 24 pedidos reales de octubre.
- **Sin costo = 0 puntos** y sin insignia en la tienda; **sombra no da títulos** ni se paga; interruptor `cvd_programa_gestoras` (sombra por defecto) y `cvd_programa_ver`.
- **16-oct, al ponerlo encima de lo vivo (Core 3.14.29; Claude, técnico y reversible):** un costo provisional (fórmula o por confirmar) cuenta, con alerta; los gastos fijos por producto (D74) NO se restan salvo `cvd_programa_gastos_fijos = si` (lo decide Ernesto); el premio de la dependienta de un «extra en tienda» (regla del 15-oct) se resta de la ganancia si es > 0. Detalle: `docs/nexo-business/programa-gestoras/DISENO.md` §10.

**D61 · 2026-10-14 · «Mi estudio de fotos» y «Mi contabilidad»: cómo se programó (Claude, técnico y reversible). Core 3.14.1, EN VIVO pero apagado para las gestoras.**
- **La clave de Google es de cada gestora** y la paga ella (Ernesto, 14-oct). Se guarda cifrada (sodium; secreto sacado de AUTH_KEY+SECURE_AUTH_KEY o `CVD_ESTUDIO_SECRET`); si cambian esas claves de wp-config, las gestoras tienen que volver a conectarla (la web lo dice).
- **Encendido por persona:** opción `cvd_estudio_acceso` (prueba | all) + `cvd_estudio_usuarios` (IDs). Primero Dany y Dayra (regla «probar con Dany primero»).
- **Modelos:** foto `gemini-nano-banana-2.1` (el 2.5-flash-image se apagó el 2-oct-2026), texto `gemini-flash-lite-latest`. Google NO tiene capa gratis para crear imágenes: sin facturación activada en la cuenta de la gestora no sale ninguna foto (comprobado con la clave del VPS).
- **No inventar colores:** solo los del atributo «Color»/variaciones; un color que no existe bloquea la foto con aviso. Las reglas fijas (producto fiel, sin texto ni marcas) se añaden siempre al final, aunque la gestora edite la instrucción.
- **Su foto en su tienda** solo con su `?ref=` (filtro `woocommerce_product_get_image_id`); la tienda general no cambia. Esas fotos no salen en la Biblioteca de medios.
- **Versión:** el programa de gestoras (D60) decía «3.14.1, sin desplegar»: al subirlo tiene que ser **3.14.3** o más (3.14.2 ya la usó el agente de costos) y rebasarse sobre `main` (cambian `casa-viva-dropship-core.php`, `class-cvd-gestora-app.php` y `gestora-app.js`).

**D62 · 2026-10-14 · Precios aplicados y costos provisionales (Ernesto aprobó la propuesta; detalles técnicos Claude, reversibles). Core 3.14.2 EN VIVO.**
- **Ernesto (SÍ):** toda la propuesta `precios/propuesta-2026-10-14.md` (22 suben, comisión fija 1 USD en Toallas Cisne Blanco, Alfombra peluche, Fundas, Edulcorante y Toallas pequeña, Cortina roja = liquidación sin reponer); los 13 costos dudosos cargados como **«por confirmar»**; los 216 sin costo con **costo provisional = precio ÷ 1,5** («fórmula», regla de Lennys). La zapatera sigue sin costo.
- **Claude:** (1) un color sin costo del mismo producto sube igual que el color de la propuesta (no dos precios en el mismo producto): 11 colores más. (2) Precio propio de una gestora **por debajo** del nuevo precio → nuevo precio + su aumento de antes; si queda **igual**, no se toca y se le avisa. (3) «formula» y «por_confirmar» son provisionales: cualquier costo real los sustituye (panel «Guardar costo», carga del bot, también con `only_empty`). (4) La caja (nube NEXO, D38) recibe el mismo precio y la misma comisión (`catalog_products` + `product_commissions`, con `cost_audit`).
- **Versión:** Core 3.14.2 = esto. El programa de gestoras (D60) tiene que salir como **3.14.3** o más.

**D63 · 2026-10-14 · «Mi estudio de fotos» en modo Gemini gratis (Ernesto pidió que sea gratis para las gestoras sin que pague Casa Viva; detalles técnicos Claude, reversibles). Cambia D61. Core 3.14.4 EN VIVO, encendido solo para Dany (18) y Dayra (33).**
- **Por qué:** la API de imágenes de Google no tiene capa gratis (429 de facturación) y Cuba no está en sus regiones; en cambio la app/web de Gemini sí la usan gratis en Cuba. Investigación con fuentes: `docs/nexo-business/estudio-fotos/opciones-gratis-2026-10-14.md`.
- **Modo principal = manual asistido:** la web arma la instrucción (en **español**, para que la gestora entienda la respuesta de la app; mismas reglas fijas: producto fiel, color real o uno que existe, sin textos ni marcas), da la foto base (`GET estudio/base`, la del color si tiene foto propia) y abre Gemini; la gestora hace la foto en SU cuenta y la sube (`POST estudio/subir`, mismos límites: 40 fotos, 80 MB, 20 al día; el móvil la achica a 1600 px antes de subir). La clave de Google pasa a «Opción avanzada»; si su clave da 429 de facturación, salen solos los 3 pasos gratis.
- **Nunca** automatizar la web/app de Gemini con cookies o librerías no oficiales (prohibido por Google). Nada de quitar marcas de agua con herramientas de terceros: solo el ajuste oficial de Gemini («Media watermark»).
- **Pendiente de decidir con datos:** español vs inglés en la instrucción (comparar 5 y 5 con Dany); Plan B gratis automático (Cloudflare FLUX.2 klein, peor fidelidad) o Plan C de pago (una clave de Casa Viva, ~3,40 USD/100 fotos).
- **Versión:** Core 3.14.4 = esto (3.14.3 fue el logo). El programa de gestoras (D60) tiene que salir como **3.14.5** o más.

**D64 · 2026-10-14 · Unir filas del Excel sin pisar y aviso solo de pérdidas (Ernesto 11:35; detalles Claude, reversibles). Core 3.14.5 EN VIVO.**
- **Unir una fila del Excel con un producto NO cambia costo ni comisión** salvo que se marque la casilla; el panel enseña Excel vs producto y avisa en rojo si no encaja (nombre, medida, compra/precio, comisión fuera de regla).
- **Regla de comisión de Lennys** (para avisos y correcciones): < 10 USD → 10 % o 1 USD, como mucho 2; desde 10 USD → ~10 % (redondeado arriba). La comisión de una fila del Excel solo se carga si cumple la regla.
- **Aviso de precios (9:00):** hasta que Lennys confirme gastos fijos y ganancia mínima, solo se marca lo que pierde: precio − costo − comisión < 0,50 USD; los de costo provisional, aparte; también cuántas comisiones están fuera de la regla. Volver a D59: `cvd_cost_floor_mode = completo`.

**D65 · 2026-10-14 · La tienda de la gestora es «pegajosa» (Claude, buena práctica de tiendas de revendedoras; Ernesto pidió arreglarlo tras el video de Thaly). Core 3.14.6 EN VIVO.**
- Quien llega por el enlace de una gestora ve en toda la web sus precios, su marca y su WhatsApp, aunque navegue sin `?ref=`. El último enlace manda (D50). Sin interruptor: «mi tienda con mis precios» es lo normal.
- En la tienda de una gestora todos los contactos llevan a ella (D52); solo quedan de Casa Viva «Entrar con WhatsApp» (acceso a la cuenta) y la guía del equipo `/ayuda/`.
- Las páginas con gestora nunca se guardan en caché (LiteSpeed + caché de Hostinger): un visitante sin enlace nunca ve precios de una gestora.

**D66 · 2026-10-14 · Venta de producto de proveedor que pasa por la tienda (Ernesto, 12:15; primera vez: lámpara MK-1155 de Digital Store/Kevin, pedido #3693 de Nadielys).**
- **Ruta:** Ernesto hace el vale en la app del proveedor (Digital Store: `digitalstoreapp.github.io/Digital-Store-Fase1`, cuenta de Ernesto) al **precio del proveedor** (lámpara 32 USD, comisión 0), tipo **mensajería hasta Casa Viva** (Conill A esq. 45 #864, Nuevo Vedado). Tarifa del 2.º local de Kevin a Vedado/Nuevo Vedado: **1.000 CUP** en moto.
- **En la tienda:** la dependienta recibe el producto y paga al mensajero del proveedor **precio del proveedor + su mensajería** (32 USD + 1.000 CUP). Después sale con **nuestro** mensajero como un pedido normal: cobra al cliente el precio de la web (45 USD) + nuestra mensajería (Bauta 5.500 CUP, suya) y trae el dinero a la tienda.
- **Reparto de la ganancia** (45 − 32 = 13 USD, menos los 1.000 CUP del proveedor): comisión de la gestora (Nadielys 5,20 USD); **500 CUP para la dependienta por cada artículo vendido así**; **2.500 CUP para la tienda Casa Viva**; **el resto, para Ernesto**, apuntado como **«comisión de gestor especial»**.
- Por qué no lo lleva el mensajero del proveedor directo al cliente: sus tarifas a zonas lejanas (Bauta) son más caras que las nuestras.
- **Pendiente (Ernesto quiere automatizarlo):** que el bot haga el vale en la app del proveedor, lea sus tarifas por local y avise a la dependienta y al mensajero sin que Ernesto entre a la app. Hoy el motor de bajo pedido (D47) da por hecho que el proveedor lo lleva al cliente («lleva»): falta el modo «pasa por la tienda».

**D67 · 2026-10-14 · La dirección de la tienda, solo en la web principal; en la tienda de la gestora, nada de Casa Viva que le salte (Ernesto 12:50; motivo de Thaly). Core 3.14.9 EN VIVO.**
- Con el enlace de una gestora, su cliente no ve la dirección de Casa Viva, ni horario, ni mapa, ni el WhatsApp de Casa Viva, ni «Vende con nosotros». La web sin enlace sigue con todo.
- La recogida sigue existiendo: «Recogida: <gestora> te dice dónde y cuándo recogerlo». No se inventa otra dirección.
- La gestora mirando su propia tienda (con su sesión) sigue viéndolo todo. Lo dudoso (pestañas del equipo en Mi cuenta, páginas sueltas, textos del bot) queda para Ernesto (ESTADO 14-oct).
- **Ampliado (Ernesto dijo SÍ, 14-oct ~13:00; Core 3.14.10/3.14.11 + VivaBot `e98481d`):** con enlace de gestora, Mi cuenta sin pestañas del equipo y el menú sin «Entrar»; «Cómo llegar a la tienda» → «Cómo recoger tu pedido». La marca Casa Viva se queda. En el bot, los pedidos de gestora dicen «Listo para recoger: tu gestora te dice dónde» y «A pagar al recogerlo» (los mensajes internos siguen con la dirección). Si el cliente de una gestora escribe directo a Casa Viva, el bot le atiende amable, sin dirección ni precios, y le pasa con su gestora (nombre + WhatsApp).


**D68 · 2026-10-14 · Regla de precio de Casa Viva: costo × 1,5 con mínimo, redondeado al dólar entero (Lennys 13:41, «la 2, la del medio»; Ernesto SÍ para programarla y publicarla). Panel EN VIVO.**
- **Precio sugerido** = costo (compra + transporte) × 1,5, **nunca por debajo del mínimo** = costo + gastos fijos por unidad + comisión + máx(10 % del precio, 1 USD) (D59), **redondeado hacia arriba al dólar entero** (59,50 → 60; 21,75 → 22).
- **Comisión** (si el producto no tiene una propia): regla de Lennys, < 10 USD → 10 % o 1 USD, máx. 2; desde 10 USD → 10 % redondeado al entero (21→2, 45→5, 48→5).
- **Aviso en la ficha:** rojo «Pierde dinero» (queda < 0 tras costo, comisión y gastos fijos) · ámbar «Bajo el mínimo» (no pierde, pero no llega al mínimo) · verde «✓ Bien». «Bajo el mínimo» no es «pierde».
- **Nada cambia solo:** el panel sugiere; Lennys pone el precio en «Precio USD» y guarda.
- **Ejemplos comprobados:** Topper gel 32 → 48 · Almohada 14 → 21 · Almohada 14,50 → 22 · Edulcorante 5 (com. 1) → 9 · Kit skincare 10 → 15.
- **La fórmula del 10-oct (margen 30 %)** sigue en el código: `settings.pricing_rule = "formula"` la vuelve a usar. El aviso diario de la web (D64) no cambia.
- **Elegida tras la prueba:** su Excel cumple × 1,5 de media (mediana 1,52 en 72 productos con costo real; solo 17 exactos, 24 por debajo, 31 por encima). En lo barato el × 1,5 no paga los gastos fijos (edulcorante a 7,50 perdería): por eso «con mínimo».

**D69 · 2026-10-14 · Venta de proveedor: reparto con un fondo variable por vale, todo sale del margen (Ernesto 15:30; afina D66).**
- **Fondo ≈ 3.000 CUP por venta de proveedor** para las partes de la operación: **mensajero** (ir a buscarlo / llevarlo, según proveedor y vehículo: moto o triciclo), **dependienta** y **tienda Casa Viva**. **La tienda siempre gana.** Las cifras **se pueden cambiar en cada vale**: antes de confirmar, el sistema pregunta (a Ernesto o a quien coordine) cuánto para el mensajero (y por qué: proveedor, vehículo), cuánto para la dependienta y cuánto para la tienda.
- **Tres rutas, la que convenga en cada caso:** (A) el proveedor lo trae a la tienda; (B) nuestro mensajero lo recoge en el proveedor (o en otra tienda); (C) del proveedor directo al cliente.
- **Todo sale del margen** (precio web − precio del proveedor): comisión de la gestora, fondo de la operación y el resto para el **gestor especial**, que por ahora es **siempre Ernesto**; más adelante se podrán añadir otros gestores especiales (quien traiga y maneje un proveedor).
- **Al cerrar el producto** (entregado y dinero recibido) se suman y se ven todas las comisiones: quién ganó cuánto y de dónde sale, para todos (panel, gestora, dependienta, mensajero).
- **Margen mínimo:** sugerencia de Claude pendiente del sí de Ernesto (ver propuesta `docs/nexo-business/propuestas/venta-proveedor-automatica-2026-10-14.md`).
- **Fase 1 programada y EN VIVO (Ernesto aprobó ~15:35; detalles técnicos de Claude, reversibles). Core 3.14.14 + panel + `nexo-panel-web` v18:**
  - Se guarda en el pedido `_cvd_supplier_split` (JSON: lo que se escribió, quién y cuándo, y la foto de las cuentas) y, al completarse el pedido (`woocommerce_order_status_completed`, el mismo cierre en que se aprueba la comisión de la gestora), `_cvd_supplier_split_closed_at` + nota «Reparto de este producto: …». Si nadie lo guardó, se sella la sugerencia y la nota lo dice. Cerrado = ya no se cambia.
  - **Líneas de proveedor** = productos «bajo pedido» (`CVD_Costs::is_bajo_pedido`: SKU `MK-` o `_cvd_market_item_id`). Precio web = total de esas líneas; **precio del proveedor** = costo del producto (`_cvd_cost_usd`) × cantidad, **editable en cada pedido** (la app del proveedor no siempre dice el precio real: #3693, 32 en la app y 28 en el almacén).
  - **Sugerencias** (opciones `cvd_supplier_split_*`, sin tocar código): mensajero moto 1.000 / triciclo 2.500 / ruta C o sin vehículo 0 (por pedido); dependienta 500 **por artículo**; tienda 1.500 **por pedido**, mínimo 1.000 (la tienda siempre gana: Core rechaza menos).
  - **Gestora:** su comisión de esas líneas (foto de comisión por línea: base + lo que subió de precio), sin cambiarla, × la tasa guardada en el pedido el día de la venta (si el pedido no tiene tasa, la de hoy y se avisa). **Gestor especial = Ernesto**, el resto.
  - **Margen mínimo (aviso, no bloqueo):** margen ≥ comisión de la gestora + fondo + 1 USD; si no, aviso rojo «No llega al mínimo…» (o «No llega: faltan X CUP» si el resto es negativo). Ernesto decide.
  - Rutas del panel (clave del panel, como `CVD_Panel_Bridge`): `GET/POST /panel/supplier-split/<id>`, `GET /panel/supplier-sales?month=AAAA-MM`. Nada de esto mueve dinero, pagos ni estados del pedido.

**D70 · 2026-10-14 · Las fotos que manda el equipo se guardan para siempre unidas a su producto (Ernesto ~15:42). VivaBot `c380724` EN VIVO.**
- **Qué se guarda:** toda foto de alguien del equipo (`crm_settings.fotos_equipo` = Maryta, Lennys, Nana, Zaymi, Nathalie + `TIENDA_EQUIPO` + `experto_productos` + rol admin/dependienta; nunca mensajeros), por privado, contestando una pregunta abierta o en el General → `/root/archivos/fotos-reales/<id woo>-<nombre>/` o `sin-producto/`; lo que la IA dice que no es foto de un producto (capturas, vales, anuncios, fotos copiadas de la web, el local) → `otras/`. **Nada se borra solo** (`entrantes/` sigue a 7 días). Cada foto lleva al lado un `.json`: quién, cuándo, pie, pregunta, producto y cómo se supo.
- **Producto sin inventar:** pie de la foto → pregunta abierta o texto de la misma persona en ±3 min (solo si la IA ve en la foto algo que encaja) → código de modelo (CP502) → IA con la foto real + fotos de la web de hasta 10 fichas, solo si dice «seguro». Si no: «sin producto» (con «¿sugerido?») y se asigna con `cv fotos asignar`.
- **El bot las usa:** si una gestora pide fotos (reales) de un producto, por privado o en el General, la IA ve «FOTOS REALES GUARDADAS [f1…]» y reenvía hasta 5, cada una con «📸 Foto real de … · la hizo Maryta hoy 15:27». Si no hay, todo sigue como antes (fotos de la web o pregunta a la tienda).
- **Base:** la tabla `crm_fotos_reales` es solo una copia (para el panel y la fase 2); el disco manda. SQL en `vivabot/supabase/025_fotos_reales.sql` **pendiente de pegar** por Ernesto; después `cv fotos sincronizar`.
- **Fase 2 (apuntada, NO hecha):** «poner en la web con un toque» desde el panel (campo `web` / `web_status`, hoy vacío). No se sube nada a la web todavía.

**D71 · 2026-10-14 · Balance diario de gastos de herramientas, medido por función, y correo a Ernesto a las 21:00 (Ernesto 17:50). VivaBot `07c1b5e` EN VIVO.**
- **Se mide todo lo que el bot gasta en IA, llamada por llamada y por función** (chats con gestoras/clientes, preguntas del General, fotos del equipo, notas de voz, voz…), con el coste estimado según los **precios oficiales** guardados en un solo sitio (`vivabot/src/ai-prices.js`, consultados el 14-oct). El disco del VPS (`/root/archivos/gastos/`) manda; `crm_ai_usage` es copia (SQL 026 pendiente de pegar). Lo que no se sabe sale como «sin dato»: nunca se inventa un precio.
- **Ernesto recibe cada día a las 21:00 un correo** (tarea programada en el PC, Gmail) con total, por herramienta, lo que más consume, saldos, tendencia, alertas y 3–5 formas de abaratar calculadas con los datos. `cv gastos` da lo mismo en el momento.
- **Sin saldo = aviso en «Tú» una vez cada 2 h** con la hora en que empezó y dónde recargar (antes cada 3 h).
- **Las sugerencias son propuestas, no cambios:** cambiar de modelo, recortar el prompt o poner topes lo decide Ernesto (cambiar el modelo de los chats se prueba antes un día con Dany).
- Higgsfield se lee solo desde la sesión de Claude (MCP), no desde el VPS. El Claude del supervisor se muestra como «uso equivalente»: va por la suscripción y no se paga aparte.

**D72 · 2026-10-15 · El bot usa solo el modelo económico de la IA.** Ernesto: «pásalo al módulo barato… no le podemos poner recargas automáticas porque no tiene dinero la tarjeta». `OPENAI_MODEL_SMART` = `gpt-4.1-mini` (antes `gpt-4.1`, que era el 93 % del gasto: 7,08 de 7,61 USD en 7 días). Objetivo ≈ 0,50 USD/día (≈ 15 USD/mes). Sin recarga automática de OpenAI. Copia del ajuste: VPS `/root/vivabot/.env.bak-20261015-modelo-barato`. Si las respuestas a gestoras/equipo empeoran, se vuelve atrás solo para esas funciones. Lennys avisada (#1194).


**D73 · 2026-10-15 · Pedidos de proveedor externo: doble comprobación antes de decir «confirmado».** Ernesto: «tiene que entrar a la página con mi usuario… corroborar que el pedido esté. Y luego corroborar con Kevin… entonces le puede escribir al gestor». Orden fijo para todo SKU `MK-` (Kevin/Digital Store y otros): 1) Claude lo mira en la app del proveedor (sesión de Ernesto abierta en el navegador integrado), 2) el proveedor dice que sí, 3) recién entonces «confirmado» a la gestora (nunca al cliente). El bot ve esos productos como «DE PROVEEDOR (existencias y tallas sin confirmar)», no dice disponible, tallas ni pagos y escala «PROVEEDOR:» (VivaBot `110a4e2`); la misma regla está en `/root/supervisor/CLAUDE.md`. Motivo: patines #3845, el bot dio tallas inventadas y la web decía «disponible» de modelos que Kevin tiene agotados (Nattork).

**D73 · 2026-10-15 · Pagos de comisiones sin chat.** Ernesto (23:15): la gestora pide su comisión **cuando quiera** desde su área (retiro parcial; lo que debe a la tienda se descuenta solo); al pedirla **le llega un aviso por WhatsApp a Lennys** (y en efectivo, también a la dependienta para que sepa a quién y cuánto pagar); **las transferencias las paga Lennys**; la cuenta en CUP usa **la tasa del día de cada venta**. Quien paga abre una página «Pagar a…» con tarjeta y teléfono para copiar, el detalle por pedido (producto, comisión, tasa, CUP) y «Ya pagué» con la captura; la gestora recibe la confirmación sola y en efectivo marca «Recibido». El grupo «Casa Viva Despachos» se queda (para lo que no sea pagos); cuando esté programado, se explica allí con un tutorial corto. Base: lo que pidió Lennys en su nota de voz del 15-oct 12:45. En construcción como Core 3.14.23 (rama `pagos-comisiones-1015`, sin desplegar).

**D74 · 2026-10-16 · Gastos fijos de cada producto según su costo, y los costos que pone Lennys a mano no se pisan (pedido de Lennys, Ernesto: «corrige lo que necesita»).** Gastos fijos de un producto = gastos fijos del mes ÷ (unidades al mes × costo medio de los productos con costo) × su costo (≈ 8 % hoy): lo barato carga poco y lo caro más; el mes sigue cubierto. Se vuelve a «iguales por unidad» en Ajustes → Costos (`cost_settings.fixed_alloc`). El mínimo del panel es la misma cuenta que Core (D59). Un costo guardado a mano en el panel (`product_costs.manual_at`) solo lo cambia otro «Guardar costo»; entradas, Excel y scripts no. Sustituye el «1,58 USD/u.» de D59 en el panel; en la web, cuando se suba Core 3.14.24 (rama `core-minimo-y-galeria-1016`).

**D75 · 2026-10-16 · Programa de gestoras (multinivel): números y forma de pago (Ernesto 14:20; aceptó todas las recomendaciones de `docs/nexo-business/programa-gestoras/PLAN-DESPLIEGUE.md`). Core 3.14.29 EN VIVO en modo sombra, solo Dany.**
1. **Los puntos NO restan los gastos fijos** (`cvd_programa_gastos_fijos = no`): punto = precio Casa Viva − costo − comisión (D55).
2. **Si el fondo del 15 % no alcanza, los bonos se pagan a medias**, todas el mismo % (prorrateo, como D55/D58). La tabla de piedras se queda como está.
3. **La red (2 % y 1 %) y el bono se cobran por «Pedir mi pago»** como un renglón más (la red en USD con la tasa del cierre; el bono fijo en CUP), con el mismo aviso a Lennys y el mismo enlace «Pagar a…». Solo los cierres de mes en «sí»; en sombra no sale nada.
4. **Ventas de proveedor (bajo pedido):** el fondo de la operación del reparto (mensajero + dependienta + tienda, ~3.000 CUP, D69) se resta de los puntos de esas líneas.
5. **Se sube hoy, encendido solo para Dany (user 18)** en modo sombra (`cvd_programa_ver = 18`): calcula y enseña «En prueba», no paga. Le escribe Ernesto. Las 2 cuentas de prueba (45 y 46) están **suspendidas**: no lo ven hasta que alguien las vuelva a aprobar.
- Además (Claude, técnico y reversible): un costo provisional cuenta con alerta; el premio de la dependienta del «extra en tienda» se resta si un día es > 0.

**D76 · 2026-10-16 · «Queda limpio» y lo que se paga a fin de mes (Lennys, pedido en su chat; Claude lo aplicó)**
- «Queda limpio por unidad» = precio − costo − gastos fijos − comisión − % dependienta (0,5 %) − % Nati (1,5 %). El **mínimo no cambia** (regla de Core y de la web).
- El 2 % «Otros cargos» de Ajustes era el valor de fábrica: pasa a **1,5 % «Nati»** (con el 0,5 % de la dependienta suman el 2 % que dijo Lennys).
- «A pagar este mes» (solo lectura): la dependienta de un pedido web es la que recibió el dinero (si no, la que lo entregó o preparó). La caja no guarda quién vendió: va aparte como «sin saber quién».
- Stock: cuando la caja y la web no coinciden, manda el último «Quedan» que puso Lennys; si no puso ninguno y la caja restó dos veces un pedido web anterior al alta, manda la web (es la cuenta correcta).

**D77 · 2026-10-16 15:40 · Programa de gestoras: red 1 % + 0,5 % y los arreglos de la auditoría (Ernesto; cambia la red de D58). Core 3.14.30 EN VIVO, en sombra, solo Dany.** Detalle: `docs/nexo-business/programa-gestoras/AUDITORIA-2026-10-16.md` §0.
- **Red:** 1 % de lo que vende la invitada (1.er nivel) y 0,5 % del 2.º nivel (desde Plata), 12 meses, sobre el precio Casa Viva. Motivo: con un 20 % de ganancia, el 2 % + 1 % del precio era el 15 % entero del fondo y los bonos de piedra se cobraban al 1–45 % en cuanto hubiera equipos. Con 1 % + 0,5 % se cobran al 47–87 % (D56 ya decía «5 red + 10 bonos»).
- **Fondo sobre la ganancia neta:** las líneas que se venden perdiendo restan del fondo (los puntos de la gestora no bajan de 0 por línea).
- **Arrastre:** si las devoluciones de meses ya pagados dejan un mes en negativo, ese 15 % se descuenta del fondo de los meses siguientes hasta cubrirse. Así la tienda nunca paga dos veces por lo devuelto.
- **Además (Claude, técnico y reversible):** reembolsos parciales restan; cierre del mes con bloqueo y sin quedar a medias; la madrina que compra a través de su invitada no cobra red de ese pedido (alerta `autocompra_red`); alerta `ganancia_alta` (línea de 10 USD o más que gana > 55 % del precio = revisar costo); red y bonos redondeados hacia abajo.
- **Pendiente:** alerta de cuentas que comparten teléfono, tarjeta o dirección con su madrina; subir el mínimo propio de Plata/Oro/Platino (hoy 50 USD) lo decide Ernesto.

**D78 · 2026-10-16 · Comisión siempre hacia arriba, Dayra sigue como inversora y cómo financiar el programa (Ernesto).**
- **Comisión de Lennys (D64):** desde 10 USD, el 10 % se redondea **siempre hacia arriba**, en el panel y en la web (antes el panel redondeaba al más cercano). Panel `4a66af3`, en vivo en casaviva.company/panel y en Vercel.
- **Dayra** se queda como dueña tipo **«inversora»**, como ya estaba. No se cambia a consignación.
- **Cómo pagar el programa de gestoras** sin bajar el «queda limpio»: se le proponen a Lennys 3 opciones en la página https://claude.ai/artifact/WQBGVtsZz7qc7FucmRX4pj:
  1. +1 USD a todo (≈ +105 USD por quincena);
  2. **recomendada:** +1, +2 o +3 USD según el precio (≈ 3 %, ≈ +160 USD por quincena; tope del programa ≈ 97);
  3. sin subir precios, el fondo solo de la ganancia por encima de octubre (hay que programarlo).
  Lennys decide, y aprueba los precios producto por producto.

**D79 · 2026-10-16 noche · Programa de gestoras: alerta de cuentas que comparten datos con su madrina, «revisar» en resumen y el cierre espera (encargo de Ernesto tras la auditoría; Claude, técnico y reversible). Core 3.14.32 EN VIVO, en sombra, solo Dany.**
- **`cuenta_compartida`** (grave): una invitada (o la de 2.º nivel) comparte con su madrina el teléfono (8 últimas cifras), la tarjeta o cuenta de cobro (perfil, pagos nuevos y viejos) o la dirección de entrega de sus pedidos (calle con número + municipio). **Solo avisa; no bloquea nada. Lennys decide.** Es el freno de cuentas falsas que pedía D53.
- **«revisar»** (su teléfono en el pedido de otra clienta) es lo normal: van en una línea de resumen; sueltas solo si se repite con la misma clienta 3 veces o más.
- **El cierre automático del mes espera** mientras haya `ganancia_alta` o `cuenta_compartida` sin marcar «Revisada» (panel o wp-admin). «Cerrar ahora» no espera.
- No cambia ningún número del programa (red 1 % + 0,5 %, piedras, fondo 15 %). Detalle: `ESTADO.md` L24.

**D80 · 2026-10-18 · Ventas de mostrador (clientes sin gestora): 2 % para la dependienta que atiende.** Ernesto.
- Lennys (18-oct): las dependientas hacen vales de clientes que llegan sin gestora (unos 4 al día) y no se sabía para quién era la comisión.
- **Decisión:** la venta queda a nombre de la **tienda** («venta de mostrador»). La dependienta que lo atiende gana el **2 %**; es suyo, no va al bote del 0,5 %. La tienda se queda el resto.
- **Protección de las gestoras:** antes de hacer la venta, la dependienta pregunta «¿te mandó alguien?». Si el cliente dice una gestora, la venta es de esa gestora.
- **Por construir:** un botón «Venta de mostrador» en Ventas, con «atendió: Nana / Zaymi», sin salir de su perfil ni usar una cuenta de gestora. Hasta entonces, anotarlo en la nota del vale.

**D81 · 2026-10-20 · Fichas de producto: a la tienda solo se le pregunta cuando hace falta, y a una sola dependienta.** Ernesto («no quiero enviar mensajes por gusto»).
- **Cuándo:** solo cuando un producto con faltas **se vende** (la dependienta lo está preparando o ya está listo) o cuando **una gestora o un cliente pregunta por él**. Nada de preguntas sobre productos que nadie ha pedido.
- **A quién:** a **una** dependienta, la de turno: la que preparó el pedido; si no, la que escribió hoy al bot; si no, la última que contestó una ficha. Nunca a Lennys (es admin).
- **El resto:** se completa solo por internet, y solo si sale el mismo modelo (marca y modelo), sin escribir a nadie.
- Sigue valiendo: una pregunta por producto (una segunda, la última, a los 3 días), como mucho 8 al día, de 10:00 a 16:30 y con el interruptor `fichas_auto`.

**D82 · 2026-10-20 · Billete Seguro: página web ligera en `casaviva.company/billete/` y la IA en la nube NEXO.** La app es HTML, CSS y JS sin compilar (`apps/billete-seguro/`), para que pese poco, funcione sin internet (service worker) y se abra desde WhatsApp en cualquier celular. Va en el dominio de Casa Viva porque el equipo ya lo abre sin problemas, y además la CLI de Vercel no tenía sesión. Cuando se venda a otros negocios pasa a `nexocuba.com` en Vercel (D16, D17). La IA es la función `billete-seguro-revisa` (mismo motor que Curru). Cada negocio tiene un código propio en `billete_seguro_equipos`, que va en su enlace (`?equipo=`), y cada revisión queda en `billete_seguro_revisiones`, sin fotos. Por eso se puede activar, cortar y medir por cliente. El resultado nunca dice «100 % bueno».

**D83 · 2026-10-20 · Lista de números sospechosos de estafa, una para toda la red NEXO.** Tabla `crm_sospechosos` (sin `business_id`). Entra solo como «sospechoso» lo que avisan los grupos, el equipo, Billete Seguro y la búsqueda diaria; Ernesto confirma o descarta desde «Tú» (*SOSPECHOSO* / *NO SOSPECHOSO*). La lista es interna: el bot no acusa a nadie, solo deja de prometer entregas, escala y avisa a Ernesto. Un descartado no vuelve a avisar. Facebook solo por el buscador público, sin cuenta ni saltarse protecciones; lo demás lo añade Ernesto a mano. Ficha: `docs/productos/sospechosos.md`.

**D84 · 2026-10-20 · Programa de gestoras: el título de la piedra es solo una medalla.** Ernesto.
- El **título** (la mejor piedra que tuvo una gestora) se queda en su perfil para siempre como **reconocimiento**, pero **no da dinero**.
- El **bono** en CUP se gana **solo el mes** en que llega a la piedra con las ventas de ese mes (y con al menos 1 venta propia entregada). Sin ventas, no hay bono: no existe ningún residual.
- Así lo explica el bot (conocimiento #280). El código ya funcionaba así (`CVD_Programa_Calc`: `bonus_cup` sale de la piedra del mes; `title` = `best_stone`).

**D85 · 2026-10-20 · Proveedores solo-WhatsApp (Sergio y LJH): se publica todo lo vigente «bajo pedido» sin confirmación previa.** Ernesto, ~18:00. Cambia lo propuesto en `PASOS.md` del 20-oct.
- Se publica todo lo anunciado desde el 13-oct; los antiguos, no (de momento). Si los dos proveedores tienen el mismo producto, van **los dos** (un producto por proveedor, cada uno con su precio).
- No se pregunta al proveedor antes: la disponibilidad se confirma en cada venta con el flujo de bajo pedido (D47).
- Precio = `my_price` del bot; comisión = 40 % del margen (como MK-1192).
- Lo de Sergio se le pregunta a **Ricardo** (+53 5 0817885): ficha 21 con su teléfono.
- Un anuncio por producto (foto + pie, sin proveedor ni su precio), como mucho 1 cada 3 min y solo de 9:00 a 19:00, contra el bloqueo de WhatsApp.
- Las fotos nunca muestran teléfono, nombre ni marca de agua del proveedor o de otro negocio; si una no se puede limpiar, el producto se publica sin anunciar («foto pendiente»).

## D86 · 20-oct noche · Tasa del día: manda siempre la regla (Ernesto)
- Tasa base de la tienda = **elToque + 10 CUP** = efectivo; transferencia CUP = efectivo × 1,20. La pone **el bot solo** a las 8:50 (elToque vía Directorio Cubano, sin clave) y se cambia a mano con «tasa 820» (Ernesto o Lennys).
- **Gana siempre la regla:** Maryta ya no manda la tasa; si alguien publica «FORMAS DE PAGO», su CUP no se usa (VivaBot `87c8ba1`). Maryta tiene que consultar con Ernesto/Lennys.
- El % de las dependientas (0,5 %, 2 %) y el de **Nati** van sobre el **precio de la tienda** (Casa Viva), sin la subida de las gestoras (Ernesto y Lennys confirmado).
- Avisos a mensajeros 9:30 y 15:00 también los domingos (la tienda abre).

**D87 · 2026-10-21 · El equipo de la tienda no cobra comisión de gestora por sus compras ni las de la tienda.** Ernesto (pedido #4953, «hay que mejorar eso»); detalles técnicos decididos por Claude (reversibles).
- Equipo = dependientas y administración. Cliente «Tienda»/«Casa Viva», su teléfono, su nombre o cuenta de la tienda → comisión 0 con nota.
- Venta del equipo a un cliente de verdad con su enlace: cobra, pero queda marcada y sale como alerta «equipo» para que Lennys la revise.
- Excepción por persona solo si Ernesto lo decide. El % de mostrador (D80) va aparte y no cambia. Lo ya aprobado o pagado no se toca sin su SÍ. Detalle: `ESTADO.md` L54.

**D88 · 2026-10-22 ~10:25 · Programa de gestoras: semana de prueba para todas y arranque el 1-nov; dependientas solo como gestoras (Ernesto).**
- **Prueba abierta a todas** del 22 al 31-oct (`cvd_programa_ver = todas`, modo sigue `sombra`): cada gestora ve sus puntos, piedra y red «En prueba»; octubre NO se paga. Anunciado en el General estilo Hormozi con la demo real de Nadielys (Oro, 15.000 CUP) y Dany (Bronce, 5.000 CUP + red) (#2480, #2481).
- **1-nov:** si la semana va bien, empieza a contar de verdad (`cvd_programa_gestoras = si`); noviembre se cobra del 1 al 5 de diciembre. Antes: B4–B6 de `LANZAMIENTO.md` y el sí de Lennys al programa.
- **Dependientas y equipo de la tienda:** entran **solo por lo que venden como gestora** (cliente real con su enlace, alerta «equipo»); compras de la tienda o suyas y ventas de caja no dan puntos. Core **3.14.47** lo aplica también a los pedidos de antes de 3.14.45 (Zaymi bajó de 92 a 33 puntos y sin Bronce).
- **Red puesta a mano:** si una gestora trae a otra que se registró sin su enlace, se apunta `_cvd_invited_by` con nota (Yanaika: Jhosstin y Arlety, 22-oct). Desde ahora se les pide usar siempre el enlace.
- **Piedras (Ernesto 22-oct ~10:40, opción 1 de 3):** se queda como está: los puntos de la piedra son los propios + los del equipo, y las ventas propias cuentan enteras. Una gestora puede llegar a Oro sola (Nadielys); la red (1 % + 0,5 %) es un extra aparte. Descartadas: exigir 1 invitada activa desde Plata, o limitar lo propio a la mitad.

**D89 · 2026-10-22 ~10:55 · Registro diario de errores del bot, uno solo para Claude y Codex (Ernesto).**
- **Dónde:** tabla Supabase `crm_errores` (migración `vivabot/supabase/029_errores.sql`, aplicada). En el VPS: `cv error "…"` para apuntar y `cv errores [hoy|abiertos]` / `cv errores cerrar <id> "…" --leccion "…"` para ver y cerrar. Ningún otro archivo o lista de errores.
- **Estados:** `abierto` hasta que la causa (bot, código o regla) esté corregida; `--arreglo` = lo hecho con ese caso; `decidir` = pregunta para Ernesto; `descartado`.
- **Revisión 21:00:** tarea programada de Claude `revision-errores-bot-21h` (corrige la causa o pasa a «decidir» y apunta la lección; lo importante a `LECCIONES.md`). Codex tiene las mismas instrucciones en `/root/supervisor/CODEX-VPS.md` y `CODEX-OPERACION.md`.
- **Resumen 21:40** a Ernesto por privado, 5–6 líneas (cron VPS `tareas/errores-dia.mjs`): corregidos, abiertos, lo grave y lo que decide él. Sin preguntas de sí/no (en «Tú» un «sí» suelto es un comando).
- **D89 (ajuste 11:00, Ernesto: «que no dependa de mi ordenador»):** la revisión de las 21:00 corre en el VPS con Claude Code de la suscripción (`/root/supervisor/tareas/revision-errores.sh` + `revision-errores-prompt.md`, cron 21:00, bloqueo `/tmp/supervisor.lock`). Solo puede usar `cv errores/error/chat/nuevos/contacto/pedido/aprender/preguntas/outbox/estado` y leer; `cv enviar`, reiniciar, editar código o la web están prohibidos (probado: «cv enviar» denegado). La tarea del ordenador `revision-errores-bot-21h` queda pausada. **Regla nueva: ninguna tarea programada en el ordenador de Ernesto; todo en el VPS.**

**D90 · 2026-10-22 ~11:20 · Antes de preguntar a un proveedor: de quién es → su app o anuncio → solo lo que falte (Ernesto, regla para todos).**
1. SKU `MK-<n>` = `crm_market_items.id = n`: mirar vendedor y grupo. No todo MK- es de Kevin: Sergio (electrodomésticos) → **Ricardo 5350817885**; TRD 42 y 23 → sin WhatsApp (lo ve Ernesto).
2. Kevin: revisar SIEMPRE su app primero (catálogo público, `src/digitalstore-catalog.js`): existencia, stock, precio y lo que diga la descripción (voltaje, tallas, colores). Otros: el texto del anuncio.
3. Solo lo que falte se le pregunta al proveedor correcto (1 pregunta, ≤ 320 letras). A la gestora «confirmado» solo después.
- Escrito en: memoria `supplier-orders-double-check`, `/root/supervisor/CLAUDE.md`, `CODEX-VPS.md`, `CODEX-OPERACION.md` y `/root/nexo-movil/CLAUDE.md`. Origen: error #14 (Claude preguntó a Kevin por la cafetera Royal de Sergio y la olla Ariete de la 42 y 23).

**D91 · 2026-10-22 ~11:50 · Preguntas del General: se contestan bien, con internet y sin inventar (Ernesto).**
- **Internet para gestoras:** `WEB_SEARCH_AUTO=on` en VivaBot (antes «prueba»: solo avisaba a Ernesto). Cuando falta un dato de producto, el bot busca el modelo y contesta «aproximado del modelo de fábrica (sacado de internet)» con la fuente; si no es seguro, no dice nada. Tope 1 USD/día (`WEB_SEARCH_DAILY_USD`). Copia `.env.bak-20261022-websearch-auto`.
- **Sin respuesta en 10 min (9:00–19:00):** `/root/supervisor/tareas/general-sin-respuesta.mjs` (cron cada 5 min). Claude Code del VPS (suscripción, entorno limpio sin la clave de la API) mira si ya se contestó (General y su chat privado), ve la foto y busca en la web (`cv producto`) o internet. **Claude no envía:** el programa manda la respuesta solo por privado a quien preguntó (nunca al grupo, nunca a Lennys/Ernesto), o pregunta a la de turno (`cv preguntar turno`), y apunta el fallo en `crm_errores` (por «bot»).
- **`cv producto <texto|id>`** (nuevo, solo lectura): ficha real de la web, también agotados; dice si es MK- y de qué proveedor.
- Revisión de las preguntas del General del 19 al 22-oct: agente en marcha; sus errores van a `crm_errores`.

**D92 · 2026-10-22 ~12:15 · Cuenta de gestor de Ernesto (Ernesto).**
- Cuenta aparte de la de administrador: usuario **137** `ernesto.gestor`, «Ernesto Rondón», rondonernesto316@gmail.com, sin teléfono (su número es el del bot); contraseña la pone él con el enlace del correo. Enlace de invitación `registro-gestora/?invita=CV137ERNESTO`. Meta `_cvd_owner_account=yes`: no pagar comisiones de esta cuenta sin su sí.
- **Proveedores que busca él (SKU MK-):** su comisión es «el resto» del reparto (D69, `CVD_Supplier_Split`, «gestor especial»); la cobra la tienda y se la debe. Octubre: cerrado 15.171 CUP (#3693, #3845, #4201, #4244), abierto 9.231 CUP (#4253, #4963). Esas ventas (de cualquier gestora) suman **puntos a su rango** sin quitárselos a ella; sin bono.
- **Su equipo** (solo las que entren con su enlace): red 1 % + 0,5 % sobre artículos de Casa Viva, pagada como a cualquier madrina; sobre líneas MK- no hay red para él.
- Programación (Core 3.14.48, opción `cvd_owner_gestor_user=137`): en marcha en la rama `core-dueno-gestor-1022`; se revisa antes de desplegar.
- Ventas de proveedor hechas fuera de la web: pendiente que Ernesto diga dónde están anotadas.

**D93 · 2026-10-22 ~12:30 · Reparto de proveedor: la tienda pasa a 3.000 CUP (Ernesto).**
- Opción `cvd_supplier_split_store = 3000` (antes 1.500 sugerido). Se aplica a los abiertos y a los nuevos; los cerrados (#3693, #3845 con 2.500; #4201, #4244 con 1.500) no se tocan.
- Revisión de octubre: la comisión de las gestoras es el 40 % del margen (sobre el costo de la ficha) en los 6; patines #3845 bien (120,75 USD por Clásica = 105 × 1,15; margen 21 USD).
- Abiertos guardados con transporte de Kevin 1.200 CUP (ruta A), dependienta 500, tienda 3.000: #4253 → Ernesto 5.569 CUP; #4963 → 262 CUP («no llega al mínimo»: el bolso de 35 USD con costo 25 deja poco margen; subir precio queda para Ernesto).
- Venta fuera de la web apuntada en `cvd_owner_offweb_sales`: split Parker de Harley (11-oct): 380 − 351 − 10 = 19 USD para Ernesto.

**D94 · 2026-10-22 ~13:00 · Anuncios diarios para Revolico y prueba de regalo con código de gestora (Ernesto).**
- **Revolico:** tiene verificación anti-robots de Cloudflare: no se publica con programas (Claude no la salta). A las **8:55** (buscar gestoras, enlace `registro-gestora/?invita=CV137ERNESTO`) y **20:55** (productos, `tienda/?ref=CV137ERNESTO`) el VPS (`/root/supervisor/tareas/anuncio-revolico.mjs`, cron) manda a Ernesto por WhatsApp el anuncio listo (título, precio, texto estilo Hormozi escrito por Claude del VPS solo con datos reales, escasez solo con «quedan ≤ 3») + fotos en JPG; productos con foto y en existencia, sin MK-, distintos cada vez (no se repiten en 14 días). Copia en `/root/archivos/anuncios/AAAA-MM-DD-<turno>/`.
- **Descuentos (investigación 22-oct):** no bajar precios; probar 2 semanas con Dany y 2 gestoras: código de cada gestora = regalo (~3 USD de valor, ~0,50 de costo) en la primera compra ≥ 25 USD, 1 uso por cliente, 7 días, sin productos MK-; cliente fijo a su gestora por teléfono; canal de WhatsApp de Casa Viva sin precios («pídeselo a tu gestora»). Pendiente: elegir el regalo y las 2 gestoras.
- **D94 (ajuste 13:15, Ernesto: «como lo haría Alex Hormozi», sin collage):** cada anuncio es UNA oferta. Mañana: gestoras con ecuación de valor, prueba real sin nombres (gestoras aprobadas y ventas de la mejor del mes, leídas en vivo), urgencia real (1-nov) y una sola llamada: «Escribe *GESTORA*» → el bot manda el kit (conocimiento #302). Noche: el producto más vendido de los últimos 30 días con existencia, problema → producto → garantía real de la tienda (conocimiento #16) → «Escribe <PRODUCTO>». Incluye título, precio, texto, descripción SEO y palabras clave. Primeros enviados el 22-oct a las 13:15 (#2551–#2557). Medir cada semana cuántos «GESTORA»/palabras llegan y quedarse con el gancho que más trae.
- **Auditoría de redes (22-oct):** con 8–12 seguidores los reels no movieron ventas; las ventas llegan por las gestoras. Video diario: 12–18 s, problema en el primer fotograma, producto real, CTA con regalo existente, y mandarlo al General para los estados de las gestoras.
- **D94 (ajuste 13:20):** la palabra del anuncio es **VENDER** (no «GESTORA») y los textos van en lenguaje para hombres y mujeres («gestores y gestoras», «quien venda», «te damos la bienvenida»); conocimiento #302 actualizado; anuncio reenviado 13:22. **Sin sorteo del topper** (Ernesto: «quítalo del sorteo»). Video diario: borrador del 22-oct (HyperFrames, sin créditos) en `docs/nexo-business/redes/video-diario/2026-10-22/`; luego se compara con la herramienta de Prosko y Cúrru (skill `reel-casa-viva`).

**D95 · 2026-10-22 ~14:35 · En ventas de proveedor, el recargo de la Tarjeta Clásica es ganancia (Ernesto).** Ernesto cambió a USD los 120,75 USD de los patines #3845 (105 × 1,15) y se los dio a Lennys: los 15,75 USD del recargo son margen y van al gestor especial. #3845 corregido en su reparto sellado (copia `~/bak-20261022-split-3845.json`): Ernesto 5.817 → 18.338 CUP. Totales de Ernesto en octubre: cerrado 27.692 CUP + 19 USD, abierto 5.831 CUP; puntos propios 53,76 (cálculo 14). Pendiente: que el reparto lo cuente solo en las ventas nuevas con Clásica.

**D96 · 2026-10-22 ~15:15 · Los videos no llevan enlace ni teléfono; cada video del día va también al General para las gestoras (Ernesto).** Ernesto: «lo importante es NO poner el link de la página en los videos, para que las gestoras puedan poner sus propios links y darle promoción sin miedo». Regla: los videos (video del día, reels, historias) **no llevan la web (casaviva.company…), ni un teléfono, ni «escríbenos al…», ni QR, ni en pantalla ni en la voz**; el cierre es logo + llamada genérica («Comenta APAGÓN», «Escribe por WhatsApp», «Te lo llevamos a casa»). El enlace va **solo en el texto de la publicación**. Así cada gestor o gestora reutiliza el video con su propio enlace y la venta es suya. **Cada video del día se manda también al General** (`cv enviar-archivo general <mp4> "<pie>" --ok`) con un pie corto para gestores y gestoras («ponle tu enlace»), después de que salga en Meta y nunca de 22:00 a 7:30. Los dos videos del 22-oct tenían dato de contacto en el cierre (`casaviva.company/tienda` y `+53 5405 6173`): se rehicieron sin él como `…-gestoras.mp4` en sus carpetas de `docs/nexo-business/redes/video-diario/` y se mandaron al General (#2615 y #2616, 15:17–15:18). Apuntado en la skill `reel-casa-viva`.

**D97 · 2026-10-22 ~15:50 · El cliente que trae una gestora es suyo PARA SIEMPRE; piloto de puntos de clientes y grupo «Casa Viva · Clientes VIP» (Ernesto).**
- **Regla (Ernesto: «las comisiones y los números que vengan por ella siempre reservarán su comisión, eso dejarlo como regla donde quiera»):** todo cliente que llega por una gestora queda ligado a esa gestora para siempre. Cualquier compra suya —por el grupo de Casa Viva, la web, el bot, la caja de la tienda o un pedido hecho a mano— reserva la comisión de esa gestora; nunca pasa a otra ni queda como «venta directa». Es lo que da confianza a las gestoras para meter a sus clientes en el grupo.
- **Reglas de desempate (Ernesto, 22-oct, «lo más justo para que las gestoras no tengan miedo de perder clientes»):**
  1. El cliente es de la **PRIMERA** gestora que lo trajo, para siempre: su primer pedido con el enlace de ella o la gestora que lo apuntó en «Mis clientes». Si hay las dos cosas, manda la más antigua.
  2. Solo cambia de gestora si **el CLIENTE lo pide expresamente y Lennys lo aprueba**. Se hace con la reasignación del admin del pedido (`CVD_Attribution_Overrides`), que guarda quién, cuándo y el motivo. Ninguna gestora puede quedarse un cliente ajeno.
  3. Si el cliente compra solo, sin gestora (llega directo a la web o a la tienda), y nunca tuvo gestora, **no hay comisión para nadie**.
  4. **Nada retroactivo:** no se cambian comisiones de pedidos ya cerrados ni pagados. Los casos viejos solo se listan para que decida Ernesto: `docs/nexo-business/fidelidad/conflictos-gestora.md`. Hay 1: Ana …4709, #3833, cobró Zaymi 2,30 USD; le tocaba a Katia.
  - Un pedido cancelado, fallido o devuelto no ata al cliente (sigue D53). Uno en curso sí, aunque aún no se haya entregado.
- **Hecho en Core 3.14.52 (22-oct, en producción):** una sola función, `CVD_Attribution::customer_owner`, para la web, el bot (`/bot/client-owner`), los vales y los pedidos hechos a mano. El teléfono se busca con y sin 53. Fallos 1, 2 y 4 de abajo arreglados. **Falta el 3 (caja)**: plan en `docs/nexo-business/fidelidad/README.md` § Caja. Escrita también al final de `/root/supervisor/CLAUDE.md`, `CODEX-VPS.md` y `/root/nexo-movil/CLAUDE.md` (copias `.bak-20261022-d97`).
- **Qué dice hoy el código (revisado 22-oct, Core 3.14.51 = servidor):** cumple en parte. Bien: un cliente con un pedido ENTREGADO de su gestora queda suyo en la web aunque entre por otro enlace o sin enlace (`CVD_Attribution::find_existing_owner`); por privado el bot le pasa con su gestora y no le da precios (D67); un pedido que mete la tienda por un vale respeta al dueño. **No cumplía en 4 caminos** (análisis del 22-oct; 1, 2 y 4 arreglados en 3.14.52 con el SÍ de Ernesto; el 3 sigue pendiente):
  1. **Alta a mano en «Mis clientes»: protegida solo 30 días** (`CVD_Clients::PROTECT_DAYS`). Después, si compra sin el enlace, es venta directa. → Quitar el plazo (protección sin fin).
  2. **Segundo pedido antes de entregarse el primero:** solo «ata» un pedido entregado (D53), así que mientras el primero va en camino otro enlace se queda la venta. **Caso real:** Ana …4709 compró con Katia (#3694, 14-oct) y al día siguiente con el enlace de Zaymi (#3833, 2,30 USD de comisión pagados a Zaymi); el bot dice que Ana es de Katia. → En `resolve_and_attach`, antes del enlace/cookie, usar la dueña de «Clientes de Casa Viva» (`cvd_clients.owner_user_id`, la misma que usa el bot) o un pedido suyo en curso no cancelado. Los cancelados siguen sin atar (D53). No se toca #3833 sin su SÍ.
  3. **Caja de la tienda:** la dependienta elige la gestora a mano y el teléfono del cliente es opcional; la caja no busca la gestora del cliente (0 clientes de la caja en «Clientes de Casa Viva»). Si no la elige, no hay comisión. → Al escribir el teléfono, la caja pone sola a su gestora (lista cliente→gestora bajada con las tasas, sirve sin internet) y aviso a Ernesto si una venta con teléfono de cliente de gestora sale sin gestora.
  4. **Pedidos creados a mano en el admin de WordPress:** no pasan por la atribución (salen sin gestora). → Al guardar un pedido nuevo sin atribución, aplicar `CVD_Attribution::attach_operator_order`.
  - Además: la reasignación del admin (`CVD_Attribution_Overrides`) sigue existiendo: con D97, solo con el SÍ de Ernesto. «Clientes de Casa Viva» no recoge todos los pedidos (el cliente …0830 del #4963 de Maryta no está): revisar al programar el punto 2.
- **Piloto de puntos (clientes de Dany 18, Nadielys 29, Maryta 47):** 1 punto por cada USD de productos de Casa Viva (sin MK-), solo pedidos web hechos desde el 22-oct y entregados (sin pruebas ni cancelados; devoluciones restan; no suma la propia gestora ni el equipo); 100 puntos = 2 USD; caducan a los 6 meses. **Canje a mano** (la gestora pide «canjear N puntos», Ernesto pone el descuento y lo apunta con `cv puntos canjear`); nada automático en precios ni checkout. Tabla `crm_puntos` + `crm_settings puntos_piloto` (SQL `vivabot/supabase/030_puntos.sql`, aplicado con `aplicar-mig.mjs`), cálculo diario 20:30 en el VPS, consulta `cv puntos`. Pendiente que decida Ernesto: quién paga el descuento (propuesta: Casa Viva, sin tocar la comisión de la gestora).
- **Grupo «Casa Viva · Clientes VIP»** (`120363411309225409@g.us`), creado 22-oct 15:44 desde el bot (= Ernesto, creador y admin) con Dany, Nadielys y Maryta; solo admins escriben; descripción con las reglas de puntos; enlace https://chat.whatsapp.com/GqMe3TeoKTa7y1CHUyCA77 que cada gestora pasa a sus clientes. En el grupo no hay precios ni pedidos: «escríbele a tu gestora» (como D94). Textos para gestoras y bienvenida: `docs/nexo-business/fidelidad/` (sin enviar).

**D98 · 2026-10-23 ~12:20 · Atendemos NOSOTROS directo a los clientes de las gestoras; la comisión sigue reservada (D97). Sustituye el desvío fijo «escríbele a tu gestora» (D67 del bot, 14-oct) y D72 (modelo barato) (Ernesto).**
- Ernesto: «Nosotros vamos a atender a esos clientes y si compran ya le van a pasar la comisión, pero nosotros somos los que los atendemos. La respuesta tiene que ser inteligente.» Vale para TODOS los clientes de cualquier gestora que escriban al WhatsApp de Casa Viva.
- El bot les contesta con la IA de clientes (dudas, productos, fotos, disponibilidad, puntos del piloto, grupo VIP, Instagram, recogida o envío) y les toma el pedido como a cualquier cliente, **a nombre de su gestora**. Nunca «escríbele a tu gestora» ni su teléfono. Precios y enlaces: **los de la tienda de su gestora** (si no hay precio propio, el de la web con su código `?ref=`). «Tu compra queda con X» como mucho una vez. A la gestora, un aviso corto en privado cuando su cliente quiere comprar o pide que le escriba (máx. 1 por cliente cada 6 h).
- **Modelo: elección de Ernesto, «efectividad primero».** Clientes con el modelo más efectivo aunque cueste más: `gpt-5.5` (5 / 0,50 / 30 USD por millón, ~0,03–0,05 USD por mensaje). Gestoras y equipo siguen con `gpt-4.1` (`OPENAI_MODEL_SMART`, cambio que pidió Ernesto porque el bot se equivocaba mucho): **D72 (solo el modelo barato) queda sustituida**. gpt-5.6-luna para gestoras/equipo solo como propuesta, si una prueba demuestra que responde igual o mejor.
- Sin bucles: nunca el mismo texto dos veces seguidas al mismo contacto; despedidas con un cierre breve o nada; si alguien sospecha una estafa, se le dice con calma quiénes somos (Conill A esq. 45 #864, Nuevo Vedado; Instagram @casavivadecuba; Facebook «Casa Viva»; nunca pedimos dinero sin pedido).
- Código: VivaBot `5638178` (`src/cliente-gestora-rules.js`, `src/cliente-atencion-rules.js`, `src/gestora-precios.js`). Error #71 cerrado.
- **23-oct tarde: Ernesto pide probar modelo barato para clientes → `gpt-5.6-luna`** («es muy caro todavía, 0,25 o 0,50 por conversación»). Precio oficial comprobado (0,20 / 0,02 / 1,20 USD por millón). Simulador con los 7 casos reales (Daria ×2, Yudit ×2, Maye, Elyunidj, Roal), sin enviar: mismo comportamiento que gpt-5.5, sin inventos, precio y enlace `?ref=` de la gestora, tono correcto. Coste medido por mensaje: **gpt-5.5 ≈ 0,031 USD → luna ≈ 0,001 USD** (unas 28 veces menos). Respaldo: si luna falla o contesta vacío, se repite una vez con gpt-5.5 (VivaBot `ce02ea0`). Contestadores automáticos («Hola, enseguida estamos con usted.») ya no se contestan (error #77). **Pendiente:** poner `OPENAI_MODEL_CLIENT=gpt-5.6-luna` en el `.env` y desplegar, parado el 23-oct por la restricción de la cuenta de WhatsApp de Ernesto.

**D99 (23-oct, Ernesto: «que el bot acepte solo las solicitudes de los grupos») — Solicitudes para entrar a los grupos:** el bot (= número de Ernesto, admin) acepta solo a quien toca: **General y comunidad** → gestora/gestor APROBADO en Core o equipo; **Mensajerías** → mensajero APROBADO en Core o equipo; **Clientes VIP** → cliente conocido (pedidos en la web o ficha `cliente` en crm_contacts), gestora aprobada o equipo. Al resto no se le acepta ni rechaza: Ernesto recibe UN aviso por persona y grupo en «Tú», sin pregunta de sí/no, y decide desde el grupo o con *ACEPTAR <tel> GENERAL|MENSAJERIAS|VIP|COMUNIDAD*. Sin número (código @lid sin mapeo) = no cumple. Si Core no contesta, se espera a la vuelta siguiente (no se avisa). Sin mensaje de bienvenida extra (el grupo ya la da). (D98 ya la usa VivaBot para «atendemos directo a los clientes de las gestoras».)

**D100 · 2026-10-23 · Un solo «Parte de las 9:00» para las decisiones de Ernesto (diagnóstico P1).** Ernesto (encargo del 23-oct).
- Cada día a las 9:00 (Cuba) le llega a Ernesto UN mensaje en «Tú» con como mucho 5 decisiones de las 4 bandejas (`crm_supervisor`, `crm_errores` «decidir», `crm_knowledge` «pendiente», `crm_escalations`), las de más dinero/confianza primero, cada una con «Recomiendo X». Nada de preguntas sueltas en otros sitios.
- Ernesto contesta con número y letra (*2A*, *1A 3B*, *3 no*); nunca «sí/no» sueltos. La elección se guarda en la tabla de origen y en `/root/supervisor/parte/respuestas.jsonl`.
- Lo reversible sin respuesta en 24 h → se aplica lo recomendado y se avisa en el parte siguiente. Dinero, precios, tarifas, mensajes a grupos y borrar → nunca solo.
- Detalle y archivos: `/root/supervisor/CODEX-VPS.md` y `CLAUDE.md`, sección «Parte de las 9:00 (23-oct)». Cron preparado y **sin activar** mientras la cuenta de WhatsApp siga restringida.

**D101 · 2026-10-23 · Grupo «24 h» para lo de proveedores; «Actualización de productos» solo para lo propio (Ernesto).**
- El grupo «Actualización productos 48h⏲️» (`120363425123846351@g.us`) pasa a llamarse **«Actualización productos 24h⏲️»** (mismo estilo de nombre).
- Desde ahora a ese grupo llegan: (1) los **vales de los pedidos bajo pedido** (SKU MK-), con una línea corta cuando se confirma, cuando el proveedor no lo tiene y cuando se entrega; (2) los **anuncios de productos de proveedor** que van llegando, **de 30 en 30** (hasta 30 al día, 1 por minuto).
- El vale del grupo **no lleva datos personales del cliente**: solo número de pedido, quién lo vendió, primer nombre del cliente, municipio (o «recogida en tienda»), productos con cantidad y precio, y total. Nunca teléfono, dirección, referencia, nota, proveedor, costo ni comisión.
- **«Actualización de productos»** (`120363283827702479@g.us`) queda **solo para productos propios de Casa Viva** (nada de MK- ni «Bajo pedido»), en los anuncios del supervisor y en el mensaje diario del bot.
- Fotos de grupo con la marca, mismo estilo que la del grupo VIP (petróleo, aro ámbar, isotipo CV crema + palabra corta): comunidad «CASA VIVA», 24 h, Recogida en tienda (y Actualización si se quiere cambiar la del 18-oct).
- Interruptores: `crm_settings bajo_pedido_grupo` (si | prueba | no) para los vales y `novedades_24h` (si | no) + `novedades_24h_max_dia` (30) para los anuncios. Se encienden con `/root/supervisor/tareas/grupos-24h-aplicar.mjs` cuando vuelva el WhatsApp (el 23-oct la cuenta estaba restringida y el bot parado).

**D102 · 2026-10-23 · SeFué publicado con `my_price` (decisión de Ernesto, «Sí, todo»).**
- Todo el catálogo de SeFué con foto y sin dudas va a la web «Bajo pedido», «para nosotros y para el catálogo», con **nuestra regla de precios** (`my_price`) aunque salga más caro que la web de SeFué. Gestora 40 % del margen; costo = precio del Excel de Javier (USD, ya con su descuento).
- Lo de menos de 5 USD se vende en **paquete de 6 o 12** (costo = unidad × N, y a ese costo la regla). Humidores e inyectores también, con la regla.
- Fuera: sin foto, datos dudosos (champú 0,35, bici morada), herrajes de humidor (sin locación, mínimo 500 USD).
- Colores por proveedor: **SeFué = fondo verde menta** (con herramientas gratis; si el recorte queda feo, foto original).
- Ventas solo con mensajería; existencia se pregunta a Javier en cada venta; transporte nuestro salvo colchones y humidores (los entrega SeFué en La Habana).

**D103 · 2026-10-23 · «Tarjeta de carrera»: el mensajero marca cada paso en un enlace del pedido, no por chat (mejora 6 del diagnóstico, aprobada por Ernesto).**
- Al coger una carrera, el vale lleva **un enlace firmado por pedido** (48 h, sin contraseña) con todo leído del pedido actual de la web y 4 botones: **Recogí · Entregado · Problema · Ya no puedo**. En el grupo solo se dice «Yo»; escribir «entregado» o «suelto» por WhatsApp sigue valiendo.
- **Un solo camino:** cada botón usa la misma función de Core que el WhatsApp (sin estados nuevos). «Problema» abre una incidencia y **bloquea** «Entregado» y «Ya no puedo» hasta que la tienda la resuelva (#4).
- **Dinero:** la tarjeta dice cuánto cobrar y **cuánto traer a la tienda con el vuelto de la tienda sumado** (#56); la mensajería y el armado son del mensajero.
- **Avisos:** Core los deja escritos; el bot los manda a la **dependienta de turno** y a la **gestora** del pedido (nunca al cliente de una gestora); el «entregado» a la gestora sigue por el aviso de pedido terminado. «Ya no puedo» vuelve a ofrecer la carrera en el grupo.
- Pedidos de PRUEBA: la tarjeta se ve, pero ningún botón cambia nada. Interruptor `crm_settings tarjeta_carrera` = si | prueba | no.
- **Sin conexión, lo mismo por WhatsApp (Ernesto, 23-oct):** palabra + número de pedido = el botón. *Recogí 4986* (recogi, ya recogí #4986) · *Entregado 4986* (sin cantidad = lo que dice el vale; *Entregado 4986 40 usd*, *30 usd 2000 cup*, *transferencia*) · *Problema 4986 no estaba* (solo quiso una parte / lo devuelve / el vale está mal / texto libre) · *No puedo 4986* (ya no puedo, suelto). Cada palabra va a `POST /bot/dispatch/{id}/carrera`, que entra por el **mismo `submit()` de la tarjeta** (mismos avisos a la dependienta de turno y a la gestora). El bot contesta con el **recibo de Core** («✅ #4986 entregado. Lleva 40 USD a la tienda (30 USD de productos + 10 USD del vuelto…) antes de las 4:00 p. m.»); si el número no es suyo o el paso no lo permite, se lo dice. Sin número y una sola carrera activa → esa; con varias → pregunta cuál. Con `tarjeta_carrera = no` o un Core sin la ruta, todo como antes. Core 3.14.59 (`feat/carrera-palabras`) + VivaBot `feat/tarjeta-carrera`.

**D104 · 2026-10-23 · Filtro «En tienda / Bajo pedido» en la web (una gestora lo pidió; Ernesto: «hazlo de la mejor manera posible, piensa tú y decide»).**
- Arriba del listado, en la Tienda, cada categoría, la búsqueda y la tienda espejo de cada gestora (`?ref=`): **Todo · 🏪 En tienda (listo para hoy) · 📦 Bajo pedido (24–48 h)**. Va en la URL (`?disponible=tienda` / `?disponible=pedido`), así la gestora puede mandar su tienda ya filtrada («Mi tienda» → «Comparte solo una parte»).
- Regla única: **bajo pedido** = categoría «Bajo pedido», SKU `MK-` o artículo del mercado (la de `CVD_Costs::is_bajo_pedido`); **en tienda** = el resto, sin agotados.
- Cada tarjeta lleva su etiqueta: «🏪 En tienda» (verde sobre crema) o «📦 Bajo pedido · 24–48 h» (ámbar). La API del bot y de la caja no cambia. Core 3.14.55.

**D105 · 2026-10-23 · «Bandeja de decisiones» de Ernesto en `casaviva.company/control/decisiones/` (mejora 9 del diagnóstico, P1 y §5.4; aprobada por Ernesto el 23-oct).**
- Una sola lista con lo que espera a Ernesto: la cola del parte de las 9:00 + `crm_supervisor` (preguntas) + `crm_errores` «decidir» + `crm_knowledge` «pendiente» + `crm_escalations` pendientes de Ernesto. **Misma lógica y misma prioridad que el parte (D100)**: `parte-candidatas.js`, usado por los dos. Orden por peso (dinero/confianza); filtro y contador Todo · Dinero · Bot · Productos · Equipo.
- Cada fila: qué pasa, «Recomiendo…» y 3 botones: ✅ Recomendado · ❌ No · ✏️ Otra cosa (texto + atajos a las otras opciones). 4 s para «Deshacer». La elección se guarda en la tabla de origen con firma «Parte bandeja AAAA-MM-DD · ernesto-bandeja · letra: …» y en `/root/supervisor/parte/respuestas.jsonl` + `estado.json` (no se vuelve a preguntar ni en el parte ni en la bandeja). «Otra cosa» = la propuesta queda rechazada/decidida en su tabla y el texto de Ernesto va a `por-hacer.md`; en conocimiento no se toca la respuesta del bot.
- Más de 7 días sin tocar → «caducada» (solo marca, no se borra). Reversible + 24 h **desde que Ernesto la vio** (en la bandeja o en el parte) → se aplica lo recomendado y sale como «aplicada sola». Dinero, precios, tarifas, tasa, comisiones, mensajes a grupos o a personas, y lo que no se puede deshacer → **nunca solo**. Apagar: `crm_settings bandeja_auto24 = no`.
- Seguridad: la web (WordPress) **no tiene claves de Supabase**. Solo el usuario 1 (mismo candado que `/control/`) + nonce; cada toque es una línea en `control-private/bandeja-requests.jsonl` y el VPS (cron cada minuto, `tareas/bandeja-decisiones.mjs`) la aplica y publica `control-private/bandeja.json`. No manda WhatsApp ni toca el bot.
- Código: VivaBot rama `feat/bandeja-decisiones` (`e556e43`, sin desplegar en el bot: el VPS usa la copia de `tareas/parte-lib/`). No toca el plugin Core (no gasta versión) ni los archivos de `/control/`.

**D106 · 2026-10-23 · «Solo hecho si es verdad»: la IA no afirma un estado del sistema sin un recibo (mejora nº 5 del diagnóstico, P3; aprobada por Ernesto).**
- La IA no puede decir que algo está pagado, aprobado/pendiente, marcado, devuelto, entregado, listo, preparado, anotado, enviado («te mando fotos»), pasado a un mensajero, ni que llega hoy/a las N, si no viene de un **recibo**: algo que el código leyó (PEDIDOS, SUS PEDIDOS de Core, la cuenta en Core `/bot/partners`) o que va a hacer de verdad con esa respuesta (fotos que salen, escalación, pregunta a la tienda o al proveedor, relevo).
- **Guardia de salida** (después de la IA, antes de enviar): sin recibo → si hay herramienta, se lee (cuenta en Core, preguntas ya en marcha) y se vuelve a mirar; si no, la frase se cambia **una sola vez** por la verdad («eso no lo puedo marcar yo desde aquí; se lo paso a Ernesto») sin volver a llamar a la IA, y se avisa a Ernesto. «Se lo paso a Ernesto» sin aviso → se crea el aviso. Promesa de futuro sin mecanismo («cuando lo tenga te escribo») → tarea `[promesa-bot]` en `crm_supervisor` (kind aviso, status pendiente).
- Cada respuesta cambiada queda en `crm_errores` con `detectado_por = bot-guardia` (tipo invento/promesa, ya corregido) para medir. Sustituye al parche frase a frase de `acciones-falsas-rules.js` (sus reglas siguen dentro).
- Medida en seco con 200 respuestas reales de la IA (19–23 oct): 19 marcadas, 16 cambiadas (las 16 eran falsas de verdad), **1 falso positivo** (una tarea de más, sin tocar el texto). Código: VivaBot rama `feat/solo-hecho-si-es-verdad`; se despliega con lo demás.

**D107 · 2026-10-23 · «Ficha que contesta»: las preguntas de producto se hacen en la ficha, atadas al producto, y la respuesta de la tienda vuelve a la ficha (mejora nº 7 del diagnóstico, P2 e ideas 3 y 4; aprobada por Ernesto).**
- Gestora con sesión, en la página del producto: bloque «Datos de la tienda» (medidas, material, voltaje/carga/cable, qué trae, colores que quedan, garantía si la hay, fotos reales y 🏪 hay N / agotado / 📦 bajo pedido 24–48 h). Si falta algo: «Preguntar a la tienda» con 6 botones + texto libre. La pregunta queda atada al id del producto (y a la variante); si otra ya preguntó lo mismo, se suma (la tienda contesta una vez y se avisa a todas). Productos de proveedor (MK-): sin botón (se pregunta en el General → proveedor).
- La dependienta de turno contesta en una página con enlace firmado de 3 días, sin contraseña (como «Entregado» y la tarjeta de carrera). Medidas, material, voltaje y qué trae → descripción pública con `CVD_Ficha_Estado::save_lines` (`_cvd_ficha_datos` + `_cvd_ficha_historial`, lo mismo que el top 20). Colores de hoy y otras preguntas → solo `_cvd_ficha_campos` e historial (no a la descripción: cambian). Fotos → `_cvd_ficha_fotos`. «No se puede saber» cierra y avisa.
- Avisos por Core → VivaBot (`/bot/ficha-contesta/pendientes` + `/hecho`): privado por el buzón a cada gestora; si preguntó en el General, en el General citando su mensaje; a la tienda «hay N preguntas» + enlace, por la cola de la de turno (10:00–17:00, una cada 45 min como mucho); más de 24 h sin respuesta → una vez a Ernesto. Cada respuesta se copia a `crm_knowledge` (activa, fila por producto).
- El bot del General lee primero la ficha de Core y contesta con ella; si falta y el producto es seguro, la pregunta entra en ESTA cola (no en `preguntas_abiertas`). Sin producto seguro: como antes.
- Interruptores: Core `cvd_ficha_contesta` = no (por defecto) | datos | si · bot `crm_settings ficha_contesta` = no (por defecto) | prueba | si. Código: Core 3.14.57 (Casa-Viva `feat/ficha-contesta` `c4d2e63`) y VivaBot `feat/ficha-contesta` (`f7dd92c`). Sin desplegar el 23-oct.

**D108 · 2026-10-23 · Salir de la tienda de una gestora: `?ref=salir` para todos; el enlace visible solo para el equipo (decisión de Ernesto).**
- `?ref=salir` (o `?ref=casaviva`) borra la marca de la tienda de una gestora en ese navegador (cookies y sesión), devuelve el carrito a los precios de Casa Viva y enseña la tienda normal. Vale para cualquiera que lo abra (Core 3.14.56).
- El enlace «Ver la tienda de Casa Viva» junto a «Tienda atendida por X» solo lo ven con sesión iniciada gestoras, administración, operador y dependientas. Los clientes (sin sesión o con otra cuenta) NO lo ven: se respeta D67 (el cliente no sale de la tienda de su gestora). Core 3.14.57.
- No cambia de quién es un cliente ni a quién va la venta (D97).

**D109 · 2026-10-24 · Recogidas sin recoger: aviso a las 12 h y cancelación sola a las 24 h (Ernesto).** Antes 24/48 h (13-oct). Mínimo 12 h entre aviso y cancelación, solo de 10 a 17 h. La llave Woo del bot pasa a lectura y escritura. Un «cambio» por producto roto no se cancela: se cierra como recogido sin cobro y sin comisión (caso #4956).

**D110 · 2026-10-24 · Maratón de ideas con las gestoras (Ernesto).** Prometido en el General: vale con solo **teléfono y zona** obligatorios (nombre opcional; recogida: solo teléfono); «Bajo pedido · llega en 24 h» bien visible; «quedan X» y «vuelve el día…»; orden alfabético; tabla de mensajería por zona; el cliente puede ir a la tienda y decir el nombre de su gestora; maratón con mensajeros. **Bajo pedido se confirma al momento**: el bot mira la app del proveedor y le pregunta en cuanto entra el pedido, y avisa a la gestora. Notas: `docs/nexo-business/maraton-ideas-2026-10-24.md`.

**D111 · 2026-10-24 · Bandeja de decisiones vaciada (31 → 0) (Ernesto).** Recomendadas en todo, salvo: envíos de Kevin **pedido por pedido** (si lo lleva Kevin, su tabla nueva; si lo recoge nuestro mensajero, nuestra tarifa; el bot elige lo más barato para el cliente con tiempo parecido); Arroyo Naranjo una sola zona «Reparto Eléctrico» 3.300 CUP; número consecutivo de pedidos (Lennys #581) **sí**, con copia y prueba; lo del dinero de Lennys (esc-114) y las tarjetas de estiba de Nana (#399) los habla Ernesto.

**D112 · 2026-10-24 · Avisos de pedidos del bot → al correo de Ernesto, no a «Tú» (Ernesto).** «Esos avisos no me llegan; déjalo en mi correo… que no sea un gasto más». Los avisos de cambio de entrega (recogida → mensajería, hecho o no), mensajero asignado («me lo asignó a mí», «que lo lleve X») y sus recordatorios salen por **correo** a rondonernesto316@gmail.com con el correo de la propia web (Core 3.14.64 `POST /bot/aviso-correo`, wp_mail de Hostinger, **sin coste**; destino en la opción `cvd_bot_aviso_correo`, tope 40/h). Si el correo falla, van a «Tú» para no perderlos. Bot: `mailOwner()` en `src/index.js`.

**D113 · 2026-10-24 ~17:30 · Proveedores sin depender de Ernesto: vale automático, IA para sus respuestas y avisos por correo (Ernesto).** «El verdadero problema es que a veces yo no estoy conectado… hay que matar esa limitación de que todo dependa de mí».
- **Al proveedor, un solo mensaje:** sin recordatorio a los 20 min (por la restricción de WhatsApp del 23-oct). A los 40 min se pregunta a otro proveedor con lo mismo y a los 55 min «seguimos confirmando» a la gestora.
- **Vale automático** en la app de Kevin tras su «sí» a un pedido de la web: **hasta 200 USD** de productos y mensajería < 2.000 CUP (lo que pase de ahí, al supervisor o a Ernesto). **Mensajería = la regla de la ficha** (Kevin: vale de mensajería a Casa Viva con su tarifa; muebles y cosas grandes → revisión). Una sola referencia por pedido y nunca otro vale si ya hay uno (también hecho a mano). Interruptor `VALE AUTO SI|PRUEBA|NO` (crm_settings `bajo_pedido_vale_auto`); arranca en **PRUEBA** y Ernesto lo pone en SI cuando vea el primero bien.
- **Respuestas raras de proveedores** las lee el **mejor modelo de OpenAI (gpt-5.5)**, que solo clasifica (sí / no / ofrece otra cosa / pregunta / espera); las reglas deciden. Si retira su «sí», la gestora lo sabe al momento con parecidos (y el supervisor anula el vale si lo había). Si ofrece otra cosa, se le pregunta a la gestora. **Al cliente, nunca.**
- **Avisos:** todo lo que llega a «Tú» también sale por **correo** (el de la web, D112) en una tanda cada 15 min; lo urgente, al minuto. Telegram queda roto (su clave ya no vale) y no se arregla por ahora.

**D114 · 2026-10-24 noche · «Listo» de proveedor sin depender de Ernesto (Ernesto: «al momento»).** Un pedido de proveedor (SKU MK-) con **vale hecho** (compra registrada en la web, entrega en Casa Viva) que la tienda marca **«Listo» después del vale** sale **solo** al grupo de Mensajerías, como cualquier pedido (a Ernesto, un aviso corto). Si no hay vale, el vale no cuadra, el «Listo» se pulsó **antes** del vale (como Nana por error en el #4963), es de prueba, lo lleva el proveedor o la web no lo publica: aviso a Ernesto **y al supervisor** (`crm_supervisor`, `[listo-proveedor]`), y sigue valiendo *PUBLICA #N*. Si desmarcan y vuelven a marcar «Listo», se mira otra vez. Lo hace el bot (VivaBot), la web no cambia.

**D114 · 2026-10-24 ~19:00 · Horarios de proveedores por día, que se corrigen solos; vale automático desde el lunes 26 a las 8:30 (Ernesto).** «Kevin los domingos no abre… otras veces vamos a tener otras aplicaciones, otros sistemas, otros horarios… que se vaya gradeando solo».
- Cada ficha guarda su horario por días: «L-V 10-17, S 10-14, D cerrado, cerrado AAAA-MM-DD». Kevin, según su propio mensaje del 24-oct: **L-V 10–17, S 10–14, domingo cerrado** (su app no publica horario).
- Si el proveedor dice que está cerrado («hoy no abro», «agéndalo para el lunes», «de viaje hasta el miércoles»), la IA lo entiende, **el bot corrige la ficha**, avisa a la gestora UNA vez con el día real y le vuelve a preguntar al proveedor cuando abre (con un texto distinto, una sola pregunta). El vale solo se hace con el proveedor abierto.
- **Repaso semanal** (domingo 21:00, `scripts/proveedores-horario.mjs --hacer`): con 5 semanas de mensajes, cierra un día en que nunca escribió y abre uno en que escribió 3 semanas o más; cada cambio queda en `crm_supervisor`.
- Vale automático: apagado ahora; **se enciende solo el lunes 26-oct a las 8:30** (`/root/supervisor/tareas/vale-auto-lunes.sh`, una vez) y avisa a Ernesto.

**D115 · 2026-10-26 · Número propio de pedido (Lennys #581, aprobado en la bandeja D111).** El #número de WordPress **no cambia** (lo usan el bot, los vales, «Entregado 5480» y `crm_dispatch`). Cada pedido real lleva además un **Nº propio que nunca salta**: «Nº 292 · 8.º de hoy» (del año/mes/día). Las pruebas no cuentan; los cancelados conservan su Nº. Se ve en la lista de pedidos de WP, la ficha, el panel y `cv pedido`; la caja, después; el recibo del cliente, no. Core 3.14.69.11; deshacer con `~/deshacer-nro-pedido-20261026.txt`.

**D116 · 2026-10-26 · Recogida en tienda: teléfono del cliente opcional (Dany, SÍ de Ernesto).** Con mensajería siguen obligatorios teléfono + zona (D110).

**D117 · 2026-10-27 15:30 · Gretel (58175427) y el #5582 pasan de Neisy a Dany (Ernesto).**
- Caso: Dany hizo el pedido #5582 (topper 60 USD) desde su área; Core lo puso a Neisy por D97 porque Neisy tenía a Gretel en «Mis clientes» desde el 22-oct, sin ninguna compra. Ernesto: «esta cliente se la pongas a ella, que le llegue la comisión».
- Hecho: dueña del pedido = Dany (7 USD pendiente), reasignación para el futuro (`CVD_Attribution_Overrides`, evento 39880eb2…), `wp_cvd_clients` 362 → user 18. Copias en el servidor: `~/bak-20261027-pedido5582-metas-antes-dany.json` y `~/bak-20261027-cvd_clients-362-antes-dany.json`.
- **Abierto (propuesta, decide Ernesto tras ver la reacción de Dany y Neisy):** 201 de 294 clientes de «Mis clientes» están apuntados sin compra; el mismo choque se repetirá. Propuesta: (1) aviso en la web al hacer el pedido: «Esta clienta ya es de X; si sigues, la venta es de X»; (2) apuntar sin comprar reserva al cliente 15 días; con un pedido entregado, para siempre (D97 sigue igual para quien vendió primero).

**D118 · 2026-10-27 · Oferta a Curuguay: 2.500 USD de entrada + garantía con condiciones (Ernesto).** «Le estoy pidiendo que me dé 2.500 USD ahora». Sustituye el «pago por resultado» del primer borrador. Dos pagos de 1.500 como opción; mensualidad [297] USD desde el día 91 (por decidir); día 90 sin el doble → trabajo sin mensualidad; día 180 → se devuelven los 2.500. El bot va en un número y un servidor propios. Detalle y gastos: `docs/nexo-business/propuestas/curuguay-2026-10-27.md`. El cobro sigue sujeto a D14.


**D119 · 2026-10-27 · Radar de mercado: con el número de Ernesto, página + correo, tope 15 USD/mes, solo para Ernesto.** Lee grupos de mayoristas, canales (Todo en Uno, Mexi Plus, noticias) y noticias de internet; apunta precios (monedas, saldo, combustible, energía, hogar, alimentos) y lo que piden gestoras y clientes. Reglas por usar el número del bot: solo leer (nunca escribir, reaccionar ni reenviar), canales 3 veces al día, como mucho 2 grupos nuevos al día y siempre los entra Ernesto; si WhatsApp restringe, el radar se apaga y se pasa a un número aparte. Gasto con la etiqueta «radar» en `cv gastos`. Plan: `docs/nexo-business/radar-mercado/PLAN.md`.

**D120 · 2026-10-27 · La venta es de quien arma el vale o trae al cliente; el «cliente fijo» solo cuando no hay gestora (Ernesto: «sí, recomendación aprobada»; cambia la parte de «cliente fijo» de D53/D97).** Motivo: el #5582 (clienta Gretel) salió a nombre de Neisy porque Gretel era «su» cliente, aunque la vendió Dany por su enlace; Ernesto tuvo que reasignarlo a mano y cuatro gestoras pidieron quitar la regla. Regla: (1) quien arma el vale (#Vale, vale de NEXO, gestora con sesión en la web, «Vender») o trae al cliente con su enlace/código/carrito cobra la comisión de ESA venta; (2) el cliente fijo (`linked_customer`) solo decide en pedidos sin gestora (el cliente compra solo en la web); (3) si el teléfono ya es o compró con otra gestora, se le avisa a la que vende «Este cliente ya compró con otra gestora», sin decir con cuál; (4) los pedidos viejos no se reescriben y las reasignaciones manuales siguen (pero no le quitan la venta a quien trae al cliente en ese pedido). Core 3.14.70.

**D121 · 2026-10-28 · Lennys publica ella sola los productos bajo pedido desde su panel (Ernesto, con las 4 recomendaciones).** Panel → Productos → «Proveedores · bajo pedido»: busca en la bolsa del mercado (`crm_market_items`), ve foto, proveedor, precio del proveedor, precio Casa Viva sugerido (regla del bot), comisión y mínimo. (1) Publica **directo** (su botón es la aprobación, como el `APRUEBA` de Ernesto); (2) puede **bajar el precio solo hasta el mínimo** (costo + comisión + 2,5 %) y subirlo siempre; el precio queda «fijado a mano» y el bot lo respeta; (3) la **comisión es fija: 40 % de la ganancia** (D43/D45/D85), no la cambia; (4) **no** se anuncia sola a las gestoras: entra en la cola de anuncios de proveedor y a Ernesto le llega un correo. La web sigue siendo la única que publica (misma lógica que `/bot/market/publish`), y también «Retirar (agotado)». Diseño: notas `panel-bajo-pedido-diseno.md`.

### D122 · El cierre del dinero se firma en Ventas, por persona (29-oct-2026, Ernesto)
Nana y Zaymi cuentan sus billetes en «Cerrar mi turno» (web, `/ventas/`), no en la caja NEXO (que nadie usa desde el 21-oct). Cada una cierra lo suyo (lo que ella apuntó en «Registrar dinero recibido»); el cierre queda firmado y guardado (`wp_cvd_cierres`), no se recalcula y se corrige con otro cierre con motivo. Lennys no firma (no recibe dinero). El papel sigue unos días en paralelo y pasa a opcional si 10 días seguidos coincide. Se empieza con Zaymi. Diseño: `docs/nexo-business/pilar-2-dinero-un-solo-cierre-2026-10-28.md`.

### D123 · Informe del radar de las 21:00: cómo se hace (29-oct-2026, Ernesto eligió «Informe de las 21:00»)
Script con cron en el VPS (`scripts/radar-informe.mjs`), no dentro del bot. Fuera de la IA los grupos internos y personales (Gestores DS, General, Mensajerías, familia…; lista ampliable en `crm_settings.radar_grupos_fuera`). La IA solo lee lo que trae precio o un «busco», sin repetidos. Modelo **gpt-4.1** (tier smart, ~2,8 USD/mes, dentro del tope de 15 de D119; etiqueta «radar» en `cv gastos`). Oportunidades solo con precio de compra y de venta del MISMO artículo; monedas solo para cotizar (D14, nada de IBAN). Sale por el correo de la web; si falla, se reenvía a las 21:30 y 22:30 sin repagar la IA. Parar: `crm_settings radar_informe = no`.

### D124 · Calidad del catálogo web: cómo se prioriza y qué se toca (29-oct-2026, Ernesto, Paso 0 de la auditoría)
Orden de trabajo = **mezcla** (ventas 60 días + preguntas de gestoras + sin foto real + descripción pobre; puntaje en `docs/nexo-business/auditoria-catalogo-2026-10-29/RESUMEN.md`). Tope **100 productos al día** (piloto de 20 primero, revisado en vivo). **Slugs: solo los malos** (raros, con número o duplicados) y siempre con redirección 301. Plugin SEO: se decide con la auditoría → recomendación de Claude: **en el Core, sin plugin** (el Core ya tiene `_cvd_seo_title` y `_cvd_meta_description`). Nada de precios, stock, comisiones, pedidos ni usuarios; nada inventado (Confirmado / Sugerido / Falta). En bajo pedido, título y descripción los pisa cada nueva publicación del proveedor: primero se mejora lo que persiste (título SEO, meta, alt).

### D125 · Catálogo al estándar: el bot escribe, publica y Lennys revisa después (29-oct-2026, Ernesto)
Ernesto aprobó el estándar (`docs/nexo-business/auditoria-catalogo-2026-10-29/ESTANDARES.md`) para **todos** los productos, «todos ya, en 2-3 días», y que lo nuevo salga igual: **se publica y el bot lo mejora** (no se frena ninguna venta) y **se guarda directo en la web; Lennys corrige después** con ✓/✗. IA = Claude Code del VPS con la suscripción (modelo sonnet; sin coste por uso; `CATALOGO_MODELO` para cambiarlo). Nada se inventa: el bot rechaza la ficha si trae un número que no esté en las fuentes, precio, emojis o frases prohibidas; tras 2 rechazos el producto se aparta para una persona. Ernesto dejó en manos de Claude las 3 decisiones del estándar: duplicados ocultos del catálogo (siguen por enlace; queda el que vendió o el más barato), categorías casi vacías juntadas, y el «no pisar» de bajo pedido hecho en el propio Core (no hizo falta pasarlo a web-maraton).

### D126 · Flujo diario: solo mensajes necesarios, para todos y ya (30-oct-2026, Ernesto, Paso 0)
Contexto: queja de los mensajeros por «demasiados mensajes y recordatorios»; prompt «arquitecto del flujo diario» (`docs/nexo-business/flujo-diario/`).
1. **Sin tope numérico estricto:** salen solo los mensajes puntuales y necesarios (cambio de un pedido, un vale, un atraso real, un informe concreto). Se quitan los automáticos de «tienes pendiente…», «debes entregar…», «¿a qué hora vas?», «dinero antes de las 4» y las confirmaciones: pasan a botones y marcas en Pa'llá / web. Tono tranquilo y amable, sin imposiciones.
2. **Sin piloto:** se construye y se deja listo para **todos** (mensajeros, dependientas y gestoras). Sustituye el «piloto de 3 días con 2–3 voluntarios» del prompt. Se avisa antes con un mensaje corto por grupo (Mensajerías / General), uno solo.
3. **Mensajero sin Pa'llá:** recibe el vale y los atrasos por WhatsApp, y en el vale una línea para que instale la app.
4. **Dos frentes a la vez, en 2 sesiones:** «menos mensajes» (esta sesión, tras el inventario de la Fase 1) y «tablero único por roles» (sesión aparte, empezando por Ernesto y Lennys).
Siguen valiendo D-reglas de siempre: nada de 22:00–7:30, nada masivo ni repetido, nada de dinero/precios/pedidos, copia y vuelta atrás antes de cada cambio, multi-negocio (nada de Casa Viva escrito en el código nuevo).

### D127 · Tablero único del móvil: dónde, datos, acceso y qué ve Lennys (30-oct-2026, Ernesto: «sí a las 4»)
1. **Página nueva `/tablero/` dentro de Core** (`CVD_Tablero`), no ampliar `/control/`. Solo lee; enlaza a `/ventas/`, panel, `/control/` y `/control/decisiones/`.
2. **Datos del VPS por HTTPS cada 3 min** con la llave del bot (`POST /bot/tablero/resumen`), no por SSH.
3. **Acceso de Lennys: enlace personal de 30 días que le da Ernesto** (el bot no le escribe). Rol desde `cvd_negocio['personas']`, nunca desde el enlace; se corta subiendo la época (`CVD_Tablero::revoke(ID)`).
4. **Lennys no ve los errores del bot** ni los mensajes del bot; solo Ernesto.
Además (acordado con «menos mensajes»): no hay tope de mensajes (D126); un mensajero con más de 3 mensajes del bot en el día sale en ámbar como señal. La regla de «atraso» vive en Core (`GET /bot/atrasos`) y el bot la leerá. Diseño: `docs/nexo-business/flujo-diario/tablero-diseno.md`.

### D128 · Clonar estilos de video: skill general, primero Casa Viva, voz gratis (3-nov-2026, Ernesto)
Tras el video de «ingeniería inversa», Ernesto eligió: **skill general `clonar-estilo`** (3 referencias del mismo estilo → contrato de estilo → plantilla de HyperFrames reutilizable), **primero para Casa Viva** y **voz gratis** (sin voz, voz grabada o Kokoro local). Fish Audio, Higgsfield, ElevenLabs y HeyGen siguen necesitando su SÍ con el costo dicho antes. Las referencias son material de estudio: no se copian textos, fotos, marca ni música con letra.

### D129 · Triciclub: app de triciclos dentro del Core de Casa Viva (3-nov-2026, Ernesto)
Ernesto aprobó el diseño del cliente (https://claude.ai/artifact/26MHKm6pBFA6hThU85MSb6) y eligió: **el motor de Triciclub va dentro del Core de Casa Viva** (WordPress), no en Supabase. Es una **excepción a D16**, aceptada por rapidez: reusa Pa'llá (enlaces sin contraseña, push, mapa, OSRM, direcciones de La Habana, puente con VivaBot). Reglas para que no se mezcle: tablas, opciones, rutas y archivos con prefijo `tc` (`wp_cvd_tc_*`, `cvd_tc_*`, `casa-viva/v1/triciclub/`, `class-cvd-triciclub*.php`); un viaje **no** es un pedido de WooCommerce; la sección Triciclub de Pa'llá se carga aparte y si falla Pa'llá sigue igual; nace apagado (`cvd_tc = no|prueba|si`). Chofer = Pa'llá ampliada; cliente = app web instalable en `/triciclub/`; servicios Viaje, Paquete y Carga; precio fijo firmado; cobro directo al chofer (efectivo o transferencia). Plan completo: `docs/nexo-business/apps/triciclub/replica/architecture.md`. Pendiente de Ernesto: los números de las tarifas, SMS sí/no, «Ofrecer otro precio» sí/no, registro de la marca en la OCPI.

### D130 · Triciclub: el precio lo pone cada chofer, por franja horaria; el cliente elige de una lista (3-nov-2026, Ernesto)
Ernesto: «nosotros no ponemos los precios, los pone el conductor en su perfil y el cliente ve el precio según el horario y decide». Eligió: **el cliente ve la lista de triciclos libres cerca, cada uno con su precio, y elige** (no subasta en vivo), y **el chofer pone un % extra por franja horaria** sobre su precio base. Por defecto (para que funcione desde el día 1): **300 CUP/km los primeros 5 km y 150 CUP/km después**, mínimo el precio de 1 km. Franjas por defecto del estudio `docs/nexo-business/apps/triciclub/estudio-horarios-2026-11-03.md`: madrugada 00–06 +50 %, pico mañana 06–09 +20 %, día 09–15 0 %, pico tarde 15–19 +25 %, noche 19–24 +30 % (horas con evidencia; % recomendados sin dato público; tope +100 %). El precio que el cliente elige va firmado y no cambia al llegar. El chofer tiene 90 s para aceptar. Reemplaza las «tarifas de Triciclub» de D129.

### D131 · Modo Lennys: su asistente propio en el servidor, con permisos fijos (3-nov-2026, Ernesto)
Ernesto aprobó: (1) todo lo que Lennys escribe va a la vía `orden-lennys` del supervisor, con o sin `#supervisor`; el bot común no le responde ni le escribe salvo urgencias, y corre 24 h en el servidor con el mejor modelo disponible (`claude-fable-5-1`, respaldo `claude-opus-5-5`; aviso a Ernesto si pasa de 30 órdenes al día o algo falla). (2) **Permiso fijo** para anunciar PRODUCTO NUEVO en el grupo «Actualización de productos» (`120363283827702479@g.us`) y para cambiar o cancelar pedidos antes de la recogida (`CVD_Order_Edit`). (3) Foto comercial con Higgsfield: gasto pequeño (~1–2 créditos por imagen, 2 variantes, fondo crema, sin texto, sin alterar la forma). (4) Precio y comisión de productos los decide Lennys (D121). (5) Sin Ernesto NO: mover dinero o pagos, borrar, reglas para todas las gestoras, avisos a otros grupos; lo grande de programación queda como encargo. (6) Lennys tiene control total desde su chat y desde una caja de texto con botones Sí / No / Cambiar en su vista del Tablero. (7) Una sola voz con ella, máx. 6 mensajes por hora entre supervisor y ella, nada de 22:00 a 7:30; meta ≤ 10 mensajes del bot a Lennys por día y respuesta en menos de 5 min. `supervisor_approval_policy` no se cambia: las órdenes de Lennys dentro de esos permisos no generan pregunta a Ernesto (lo decide `permiso()` en `src/modo-lennys-rules.js`). Documento: `docs/nexo-business/modo-lennys-2026-11-03.md`.

### D132 · NexoFirma: producto nuevo en repo propio, base local y datos ficticios (3-nov-2026, Ernesto)
Ernesto pidió construir **NexoFirma** («Contrata. Firma. Verifica.»), plataforma B2B de contratos entre empresas cubanas; piloto PREVENTE S.R.L. ↔ DATAZÚCAR. Eligió las 3 recomendaciones: (1) **repo nuevo aparte** `C:\Users\Ernesto\nexofirma` (no dentro de este repo: documentos legales separados de Casa Viva y del bot); (2) **base local sin cuentas** (PGlite = PostgreSQL real; sirve después para Supabase u otro PostgreSQL sin reescribir); (3) **datos FICTICIOS** hasta tener los documentos reales del piloto. Regla jurídica fija: nunca presentar una imagen de firma como «firma digital certificada»; la firma certificada solo vendrá de un proveedor PKI autorizado (Xetid, Softel u otro) por la interfaz `SignatureProvider`, sin integración falsa. Nombre **provisional**: la regla de marca del GLOSARIO pide «NEXO + palabra» («NEXO Firma»); Ernesto decide el nombre final. Pendiente de Ernesto: confirmar quién paga (paso 1 de `idea-a-producto`) y si el NIT jurídico cubano tiene 11 dígitos (supuesto actual). Decisiones técnicas: `nexofirma/docs/DECISIONS.md`.

### D133 · Panda26: menú digital en 3D como gancho para restaurantes (3-nov-2026, Ernesto)
Idea sacada del reel de Menuly (menú por QR con platos en realidad aumentada). Para el primer prospecto, Panda26, Ernesto eligió: **video gancho con IA** (Seedance 2.5, ~75 créditos de Higgsfield, con su SÍ al costo), **primera versión = menú + pedido por WhatsApp + 3D en 3 productos** (hot dog 100 % res, pan con croquetas y frappé de guayaba; 3D con IA a partir de sus fotos) y **los precios del menú escrito**, no los de la pizarra. Marca propia, sin copiar a Menuly. Detalle en `docs/clientes/panda26/README.md`.

### D134 · Panda26 premium: holograma + giro 360° fotorreal en vez de 3D de malla (3-nov-2026, Ernesto)
Ernesto quiso que la app pareciera de 10.000 USD. Eligió las 4 recomendaciones: **modo holograma** (producto flotando, etiqueta de cristal, anterior/pausa/siguiente, como el video gancho), **giro 360° fotorreal** hecho con IA (foto de estudio + Kling Pro, unos 9 créditos por producto) en vez del 3D de malla, **4 combos + frappé** con tratamiento premium, y **premium pero ligera** (~0,5 MB al entrar, giros bajo demanda, guardada en el móvil). Se quitó «ponlo en tu mesa» (realidad aumentada).

### D135 · Cómo se hace el cierre contable de Casa Viva (3-nov-2026, Ernesto; pedido de Lennys)
- **Bajo pedido (SKU MK-) va aparte** de la cuenta de la tienda: se enseña su ingreso, lo pagado al proveedor, el margen y su reparto (gestora, mensajero, dependienta, tienda, Ernesto). Solo la parte «tienda» del reparto entra en la cuenta de Casa Viva.
- **0,5 % dependientas y 1,5 % Ernesto** se sacan solo de las ventas de la tienda (sin bajo pedido), sobre el precio de la tienda sin la subida de las gestoras. **El 1,5 % es de Ernesto** (Ernesto 4-nov): en Ajustes → Costos se llamaba «Nati» y ahora «Ernesto» (`cost_settings.other_label`).
- **Comisiones de gestoras:** cuentan todas las del mes (pagadas y por pagar); aparte se enseña lo pagado y lo pendiente.
- **Gastos fijos:** la lista de la hoja F COSTO del Excel de Maryta; electricidad y renta 300 USD y teléfono 50 USD en dólares, el resto en CUP a la tasa media del mes.
- **IA y herramientas:** lo pagado en el mes según los recibos (tabla del 2-nov: 282,38 USD del 4-oct al 1-nov; ≈270 USD/mes desde ahora). El saldo de PayPal para IA (125 USD) es saldo, no gasto.
- **4-nov (Ernesto):** IA y herramientas salen de la **ganancia de la tienda** (no del 1,5 %). **ELIO:** la mitad de su ganancia es de Casa Viva. **Ernesto cobra el 1,5 % + lo que gana como gestor especial de bajo pedido**; Lennys se queda con ese dinero y lo resta de lo que Ernesto le debe. Octubre: Casa Viva 2.748,46 USD (base Arbelio, antes del 40 % a inversores e impuestos); Ernesto 315,71 USD a su favor antes de descontar lo que cogió. Detalle: `docs/nexo-business/contabilidad/octubre-2026/conciliacion-arbelio-4nov.md`.
- **Entrega:** página interactiva (cada número con su fuente y CSV) + PDF corto estilo Hormozi (entró / salió / quedó). Esta sesión lleva la contabilidad diaria y mensual.
- **4-nov (Claude, técnico y reversible):** el día contable es el día de Cuba en que el pedido se **completa** (entregado y cobrado). Cada venta guarda su costo al venderse (Core 3.14.125); los pedidos de antes llevan el costo del 4-nov marcado «relleno». Los % (0,5 y 1,5) se cambian con las opciones `cvd_conta_dependientas_pct` y `cvd_conta_ernesto_pct` de la web.

### D135 · Panda26: gratis y se queda puesto; mantenerlo cuesta «un expreso al día»; mensajeros de Casa Viva (4-nov-2026, Ernesto)
Para cerrar con Panda26 (y como modelo para otros restaurantes): todo lo construido se les da **gratis y se queda puesto**; si quieren que NEXO lo mantenga (precios, productos nuevos con giro 360°, revisión), el precio es simbólico, **«un expreso al día»**, y «nos ponemos de acuerdo». Para sus domicilios se ofrecen **los mensajeros de Casa Viva** (la mensajería va completa para el mensajero; ellos no pagan cuota); **el pedido de mensajero se lo escriben a Ernesto**. Presentación en PDF vertical para WhatsApp y tarjeta de regalo de 2 caras para sus clientes.

### D136 · NexoFirma: la IA real es Google Gemini gratis para todas las empresas, con aviso (4-nov-2026, Ernesto)
Se investigó: no hay IA gratis buena y privada a la vez. Gemini gratis (`gemini-3.8-flash`) lee PDF y escaneos con página, pero **Google puede usar y revisar lo que se le envía**. Ernesto eligió «gratis para todos, avisando» (en vez de gratis solo para pruebas o Claude de pago). Protecciones: la IA viene apagada; solo el Administrador de cada empresa la activa aceptando un aviso literal; queda en la auditoría; sin consentimiento vigente no sale ningún documento; si se pasa a plan de pago (`GEMINI_DATA_POLICY=no_training`) cada empresa vuelve a aceptar. **Riesgo aceptado por Ernesto:** escrituras, CI y cuentas de clientes pueden quedar en manos de Google. Clave: la pega Ernesto en `nexofirma/apps/web/.env.local` (no se sube a git). Detalle técnico: `nexofirma/docs/DECISIONS.md` ND25.

### D136 · /menu-360: plantilla + datos + script; publicar en casaviva.company/<negocio>/ por ahora (4-nov-2026, Ernesto)
Lo hecho para Panda26 se convierte en una fábrica reutilizable: **un `negocio.json` por negocio + un script que genera todo** (menú 360°, página para el dueño, cartel, tarjeta, vista previa), en vez de rehacer código cada vez. Los menús se publican en **casaviva.company/<negocio>/** (ya probado en Cuba) hasta tener 3 negocios pagando; entonces se pasa a un dominio de NEXO. La skill se llama **/menu-360** y es el kit de restaurantes del paso 4 de `nexo-fabrica`.

### D137 · Triciclub: choferes con verificación automática (carné + selfie con carné)
- **Qué:** cualquiera puede ser chofer (no hace falta ser mensajero de Casa Viva). Se apunta por WhatsApp (el bot le manda el enlace), rellena su triciclo (6 tipos: Bici, Eléctrico, Eléctrico XL, Motor, Moto, Carga) y manda carné, selfie sosteniendo el carné y foto del triciclo. Un verificador automático del VPS lo aprueba, le pide corregir o lo deja «Para ti» en el panel `/triciclub/admin`. Sin avisos por WhatsApp ni correo: Ernesto lo ve todo en el panel.
- **Por qué:** Ernesto quiere crecer sin tener que aprobar a mano («aprobar automáticamente») y sin fraudes («la selfie puede ser de cualquiera»); como Uber/Bolt/QvaPay: aprobar rápido con comprobaciones automáticas y revisar solo los casos dudosos.
- **Costo:** caras gratis (OpenCV en el VPS); IA ~1–2 centavos USD por chofer; nada si no hay altas.

### D136 · Bajo pedido: tienda 2.500 CUP, dependienta con nombre y pago de octubre (4-nov-2026, Ernesto)
- **La tienda se queda 2.500 CUP** de la ganancia de cada pedido de bajo pedido (antes 3.000; opción `cvd_supplier_split_store`). Los repartos ya cerrados no cambian.
- **La dependienta cobra 500 CUP por artículo** y su nombre queda siempre en el reparto: la que marca «Listo» en la tienda (si no, la que recibe el dinero). Core 3.14.136.
- **Octubre:** se reparten 6.000 CUP de bajo pedido, 3.000 para Nana y 3.000 para Zaymi. Les paga Lennys y les dice que es de bajo pedido (el bot no escribe a Zaymi).
- Un pedido devuelto (p. ej. #4988, olla de presión) no suma al gestor especial. Gestor especial de Ernesto en octubre: 76,44 USD (incluye el split vendido fuera de la web, 19 USD).

### D138 · Una sola app de transporte: Pa'llá (taxi + triciclo + mensajero), precio mixto como inDrive, primero investigar y diseñar
- **Qué (Ernesto, 4-nov):** juntar Triciclub y Pa'llá en UNA app con el nombre **Pa'llá**: servicios Taxi, Triciclo (Triciclub queda como el servicio de triciclos) y Mensajero. Precio **mixto como inDrive**: la app sugiere un precio justo, el cliente puede ofrecer más o menos, los choferes aceptan o contraofrecen y el cliente elige por precio, tiempo y estrellas. Meta: mejor experiencia y más rápida que La Nave.
- **Cómo:** primero investigación y diseño (La Nave, inDrive, Uber, Bolt, Yango; leyes de taxi en Cuba; precios reales; medir velocidad) y Ernesto aprueba las pantallas; nada de código hasta su SÍ. Casa Viva y sus mensajeros siguen igual durante el cambio.

### D137 · Cómo funciona la contabilidad desde el 4-nov-2026 (Ernesto)
- **Una sola fuente:** la web (cada venta guarda su costo) + la caja + los «Datos del mes» del panel. Maryta ya no lleva el Excel; Arbelio no recibe el cierre (se lo pasa Lennys si quiere).
- **Cada noche 21:30:** resumen del día y del mes a **Ernesto y a Lennys** (`contabilidad-dia.mjs`).
- **Día 1 a las 9:00:** **borrador** del cierre del mes (PDF) a los dos. Días 1–2: Lennys (o Ernesto) corrige en el panel → Resumen → «Cierre del día y del mes» → Mes → **«Datos del mes»** (impuestos, fluctuación del cambio, reparaciones, otros gastos, parte de ELIO, % de inversores y, si cambian, gastos fijos e IA). Cada cambio queda con quién, cuándo, antes y después.
- **Día 3 a las 9:00:** **cierre final** (PDF) a los dos, con la lista de cambios.
- **Control de Lennys:** «Datos del mes», botones «pagado» de dependienta, mensajero y proveedor (Pedidos → «Ventas de proveedor del mes» → «Falta pagar»), % en Ajustes → Costos, descarga en Excel (CSV) en la hoja Cierre.
- **Claude:** vigila que salga cada envío, revisa productos sin costo y repartos sin guardar, y corrige lo que Ernesto o Lennys digan.
- Parar: `crm_settings contabilidad_dia=no` / `contabilidad_mes=no`.

### D138 · Reseñas de clientes: solo reales, con permiso y «Nombre I.» (4-nov-2026, Ernesto)
Las reseñas que use Casa Viva (tarjetas para redes, web) son siempre comentarios reales de clientes; nunca se inventan ni se reescriben. Se guardan como reseñas del producto en WooCommerce solo con permiso explícito del cliente para publicar su comentario y su nombre, que se muestra como nombre e inicial del apellido («María G.»). Las estrellas solo si el cliente puntuó. Vías: Zayri pega la reseña desde el WhatsApp en el panel (origen `whatsapp`), las que los clientes dejan en la web y, en preparación, el bot tras la entrega (origen `bot`: una vez por pedido, a una hora que no moleste, modelo inteligente que no invente, solo clientes directos y nunca los de una gestora, y nada se envía sin el SÍ de Ernesto).

### D139 · Pa'llá: diseño v2, logo A «En ruta» y vehículos 3D hiperrealistas (4-nov-2026, Ernesto)
- **Qué:** decisiones de la Fase 1 (servicios a la vez, precio justo con −20/+50 %, contraoferta +10/20/30 %, triciclo 60 + 50 CUP/km, comisión 0 % y luego 8 %, cobro semanal, web primero; consulta legal y marca OCPI después del piloto). Estilo claro y minimalista, letra Geist con respaldo Helvetica/Roboto, un solo amarillo por pantalla, barra de progreso del viaje animada (idea de Yandex Go). **Logo A «En ruta»** (la P de siempre con un trazo de recorrido). Vehículos: **estilo 1 hiperrealista** (Higgsfield), de lado y desde arriba.
- **Por qué:** Ernesto quiere la app n.º 1 de Cuba, premium, minimalista y que cargue rápido con datos de ETECSA (< 1 Mbit/s en La Habana).
- **Dónde:** https://claude.ai/artifact/71zrYhD9qbojBi2zd4HJkj · copia `docs/nexo-business/apps/palla/diseno-v2/`. Falta el SÍ de Ernesto a las pantallas antes de programar.

### D140 · El bot pide la reseña: cómo y cuándo (4-nov-2026, Ernesto aprobó el texto)
- **Qué:** VivaBot escribe UNA vez al cliente directo de Casa Viva, al día siguiente de «entregado/recogido» (hasta 4 días después), de 10:00 a 19:00 de Cuba, como mucho 1 vez por cliente cada 30 días y 10 al día. Mismo mensaje: estrellas 1–5 (opcional), comentario corto y permiso para publicarlo como «Nombre I.». Texto aprobado por Ernesto el 4-nov (`src/resenas-rules.js` → `textoPedido`).
- **Leer la respuesta:** gpt-5.5 propone y el código comprueba: el comentario tiene que estar escrito tal cual por el cliente, las estrellas solo si puso un número o ⭐, el permiso tiene que ser un sí claro. Si dio comentario sin permiso, se le pregunta el permiso UNA vez. Queja o 1–2 estrellas: no se publica y se avisa a Ernesto. Lo que no es respuesta a la reseña lo contesta el bot de siempre.
- **Nunca:** pedidos de gestora ni clientes de una gestora (D97), equipo, pruebas, «ignorar», en pausa o con BAJA. Core marca el pedido ANTES de enviar: nunca dos mensajes.
- **Interruptor:** `crm_settings resenas_auto` = no | si | solo:<teléfonos>. `resenas_tienda` = si para incluir lo vendido con la cuenta de Nana/Zaymi/Lennys (apagado; en 30 días no habría añadido ningún cliente real).
- **Por qué:** la web tenía 0 reseñas y los anuncios necesitan prueba social real. Realidad medida: casi todo se vende por gestoras (365 de 367 pedidos en 30 días), así que el bot pedirá pocas reseñas; el grueso tendrá que venir de las gestoras (Zayri en el panel).

### D140 · Pa'llá: tabla de precios v2, rentable para el chofer (4-nov-2026, Ernesto)
- **Qué:** precio justo sugerido = mínimo (con km incluidos) + CUP por km. Taxi Básico 3.000 (2 km) + 200 · Clásico 3.500 (2 km) + 400 · XL 4.500 (2 km) + 400 · Triciclo Eléctrico 1.500 (2 km) + 300 · Eléctrico XL 2.200 (2 km) + 400 · Bici 800 (2 km) + 250 · Carga 2.000 (3 km) + 300 · Moto 800 (3 km) + 230 · Mensajero moto 1.000 (3 km) + 250. Noche (22–6) +20 %. Espera: 5 min gratis, luego 50 CUP/min. El cliente puede ofrecer hasta −20 % pero **nunca debajo del mínimo**; el chofer contraoferta +10/20/30 %. Tope de deuda del chofer 2.000 CUP; Carga hasta 300 kg.
- **Por qué:** la v1 (60 + 50/km) usaba precios de ruta compartida. El mercado real (47 viajes del grupo «Agencia Rodando», oct–nov) es ≈ 4.500 CUP por 7 km en carro y ≈ 3.550 en triciclo; La Nave ≈ 2.650–3.180 por 5 km; Casa Viva 1.500–1.800 en la zona central; VoyPaTi moto 600 + 170/km. Ernesto: «que sea rentable para el chofer». La v2 queda ≈ 10–25 % por debajo del mercado y deja ganancia al chofer después del 8 % (el almendrón con gasolina de la calle es el más justo).
- **Ojo:** con estos precios un chofer activo debe 2.000 CUP de comisión en 2–3 días; revisar el tope cuando empiece el 8 %. Página: https://claude.ai/artifact/Upw2dnHGes2r7Z47F5Py5W

### D141 · Pa'llá transporte: dónde vive y cómo (5-nov-2026, plan técnico de Claude con los SÍ ya dados en D138–D140)
- **Rutas:** cliente en `casaviva.company/palla/ir/`, chofer en `/palla/chofer/`, panel `/palla/admin`. `/palla/` sigue siendo la app de los mensajeros de Casa Viva (y de la app Android 1.4) sin cambios; cuando los mensajeros pasen a la app de chofer, `/palla/` podrá ser la del cliente.
- **Motor:** dentro del Core (D129) con las tablas de Triciclub ampliadas (v4), interruptor propio `cvd_pv`. Ofertas en vivo por el ntfy del VPS (la web no tiene conexión abierta) con consulta corta de respaldo. El precio lo calcula siempre el servidor y va firmado.
- **Por qué:** no tocar a los mensajeros que ya trabajan con Pa'llá, reusar lo hecho (direcciones, OSRM, alta con verificación, avisos, bot) y no cargar la web de Hostinger.

### D142 · Agencia NEXO: primero agencia IA + webs; avatar IA como cara; una sola Vitrina NEXO; la Vitrina no cobra anuncios hasta tener base legal (5-nov-2026, Ernesto + investigación)
- **Ernesto eligió:** el primer negocio que debe dar dinero es la agencia (fotos de producto, reels y webs/menú 360 para mipymes, bajo «Implementación NEXO»); la cara de la marca es un **avatar IA**; hay **un solo canal**, la vitrina NEXO (nombre provisional), que muestra sus negocios y los casos de clientes. No tiene figura legal en Cuba todavía.
- **Por la investigación:** Google/YouTube Ads y AdSense no funcionan para Cuba; Meta prohíbe actividad comercial desde países bajo embargo; los privados en Cuba no pueden tener medios propios (Ley 162/2023, Decreto 102/2024). Por eso: NEXO trabaja como **creativo** (el negocio publica en sus redes), la Vitrina publica **gratis** y **no vende anuncios** hasta que un abogado cubano confirme la figura y el registro en el ICS. La LLC **nunca** compra ni cobra anuncios para negocios de Cuba (sigue D14).
- **Canal de YouTube sin cara como negocio: descartado en Cuba** (no paga). Plan completo: `docs/ofertas/agencia-nexo-plan-2026-11-05.md`.

### D143 · NEXO es una red cubana propia (catálogos → entregas → red social → anuncios en CUP); corrige el enfoque de D142 (5-nov-2026, Ernesto)
- **Visión:** una app **NEXO** (nombre sin más; no «NEXO Market», sigue el GLOSARIO) con los catálogos de los negocios, chat y bots, entregas de Pa'llá y, al final, anuncios pagados en CUP / EnZona / Transfermóvil. Mismas funciones que Facebook, Instagram, WhatsApp Business y Meta Ads, con diseño y marca propios (no se copia la apariencia de Meta).
- **Orden:** 1) Pa'llá + cartas digitales gratis a 20 negocios de la zona donde ya trabajan los mensajeros; 2) % pequeño de las ventas que NEXO genere + cobro a mensajeros/choferes cuando les dé mucho valor + ventas extra (redes con IA, videos, bot, caja); 3) funciones de red social; 4) anuncios; 5) quitar trabas. Cada fase tiene meta para pasar (ver el plan).
- **Trato del día 1:** «gratis para siempre; solo ganamos un % pequeño de lo que NEXO te venda». El % lo decide Ernesto.
- **Legal:** cobrar (fase 2) necesita figura legal en Cuba; vender anuncios (fase 4) necesita confirmar con abogado/ICS que no cuenta como «medio» privado; USDT queda fuera hasta confirmar la licencia del Banco Central. La LLC sigue sin cobrar a Cuba (D14). D142 sigue valiendo para avatar IA y vitrina única, pero la agencia pasa a ser la puerta de entrada, no el negocio principal.
- Plan: `docs/ofertas/agencia-nexo-plan-2026-11-05.md` (v2).
