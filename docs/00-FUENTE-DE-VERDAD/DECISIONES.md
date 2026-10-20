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
