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
