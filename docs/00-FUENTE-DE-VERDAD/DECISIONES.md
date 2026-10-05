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
