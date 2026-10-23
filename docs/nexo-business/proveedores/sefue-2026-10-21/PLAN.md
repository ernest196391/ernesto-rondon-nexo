# Plan: productos de SeFué en Casa Viva «Bajo pedido» (21-oct-2026)

**Estado (23-oct tarde):** PUBLICADO — 133 productos en la web «Bajo pedido» con `my_price` (D102). Ver «Publicado 23-oct» al final. Nadie avisado: los anuncios esperan a que vuelva WhatsApp.
Archivos: `extraer.mjs` (lee su tienda, en seco) → `catalogo.json` (158 productos, forma de `electro-2026-10-20/productos.json`) + `resumen.md`.

## Qué es SeFué
- Tienda **Odoo** (`www.sefue.app` = `fue.odoo.com`), «Catálogo Virtual». 158 productos, 12 categorías, precios en **USD**.
- **No muestra existencias** (ni «quedan X» ni «agotado»). Tiene carrito y «Comprar ahora» (no se probó).
- Teléfonos en su web: +53 5066 6790 (cabecera) y wa.me/5352963072 (servicios). Marca en el pie: «SeFué».
- **robots.txt = «Disallow: /»**: no quieren robots. Se hicieron ~37 peticiones despacio; las ~150 fichas restantes, solo con su permiso.

## En qué se parece y en qué no a Kevin (Digital Store)
| | Kevin | SeFué |
|---|---|---|
| Cómo entra a la bolsa | Sus anuncios en WhatsApp → `crm_market_items` (raw_text `[Digital Store <uuid>]`) | No anuncia en grupos: hay que crear las filas a mano (como **Tienda 42 y 23**, `tienda-42-y-23/bolsa-crear.mjs`) |
| ¿Hay y a qué precio? | El bot lee **en vivo** su catálogo (Supabase público: precio, disponible, stock) — `vivabot/src/digitalstore-catalog.js` | Solo precio (JSON-LD de cada ficha). Disponibilidad: **preguntar a SeFué en cada venta** (motor bajo pedido, D47) |
| Comprar | El bot hace el vale en su app (`digitalstore-orders.js`, < 200 USD) | A mano: WhatsApp o su carrito (necesita cuenta/pago: lo hace Ernesto) |
| Entrega | Su mensajero → tienda Casa Viva (D66) o nuestro mensajero recoge | Por saber. Colchones: «mensajería gratis en La Habana» |

## Pasos cuando Ernesto diga SÍ
1. **Permiso y datos de SeFué** (lo pide Ernesto): ¿podemos revender y usar sus fotos/textos? ¿precio de revendedor? ¿existencias? ¿entrega a Casa Viva? ¿mejor nos mandan el Excel de Odoo?
2. **Elegir qué entra.** Propuesta: fuera los < 5 USD sueltos (76), fuera los humidores de 800–4.800 USD (o aparte), cables por tramo de 5 m, cajas de aromatizantes como «caja de 12».
3. **Fichas completas:** `node extraer.mjs --detalles todos --web web.json` (≈150 peticiones, solo con permiso).
4. **Ficha del proveedor** en `crm_suppliers` («SeFué», teléfono que diga Ernesto, `collects` = lo que acuerden) — escribe en la base: con el sí.
5. **Bolsa:** copiar `tienda-42-y-23/bolsa-crear.mjs` (vendedor SeFué, foto limpia a Storage `mercado`) → `MK-<id>`.
6. **Fotos:** revisar una por una (logo, marcas de agua, fotos de IA). Ver `docs/nexo-business/fotos-productos/PROCESO.md`.
7. **Web:** `electro-2026-10-20/crear-productos.php` en seco → borradores → Ernesto revisa → publicar → marcar bolsa «publicado».
8. **Anuncio** al grupo «Actualización de productos» con la comisión, con el sí de Ernesto.
9. **Mantenimiento:** a los 21 días el bot los marca «quizá agotados» (no anuncian): volver a pasar `extraer.mjs` para refrescar precio y `last_seen`.

## Acuerdo con SeFué (21-oct, Javier Quota +53 5 4942950, comercial)
- **Opción 1** (Ernesto): SeFué nos da su precio **−3 %**; ponemos nuestro precio (regla `myPrice`). **Ventas con mensajería** (pide que no sean recogidas, para evitar choques de precio entre gestores).
- **Existencia:** se consulta con ellos en cada venta (no tienen otra vía).
- **Entrega:** en su local; transporte por nuestra cuenta, salvo **colchones y humidores** (la entrega la ponen ellos).
- **Fotos:** autorizado usar las de su web (16:56).
- **Lista de precios:** la manda «a más tardar mañana» (22-oct). Con ella: bolsa `MK-` + web «Bajo pedido» con `extraer.mjs`/`bolsa-crear.mjs`.
- **22-oct 16:06 llegó la lista** (Excel, 150 filas; notas de voz: colchones a precio de mayorista −3 % salvo el King, humidores −5 %, herrajes de humidor sin local y pedido mínimo 500 USD). Preparada en seco en `oferta-2026-10-22/tabla.md` (43 para publicar, 17 para consignación, alertas y qué falta).
- Ofrecen **consignación** para la tienda física: elegir pocos productos que roten.
- Contacto creado en `crm_contacts` («Javier Quota · SeFué (comercial)», etiquetas proveedor, sefue), bot en pausa hasta el 23-oct.

## Publicado 23-oct (D102, Ernesto: «publicar con nuestra regla» y luego «Sí, todo»)
- **Javier 23-oct 12:03:** precios en USD; colchones y humidores los entrega SeFué en La Habana; zonas lejanas (Mantilla…) las valoran ese día.
- **Ficha:** `crm_suppliers` **131** «SeFué» (jid/teléfono de Javier 5354942950, recoger, cobra Casa Viva, horario 9:00-17:00 **provisional**, términos y consentimiento de fotos). El contacto de Javier no se tocó (rol cliente; el check de crm_contacts no admite «proveedor»).
- **Bolsa:** 135 artículos (`MK-1911…2045`): 133 `publicado` con `published_url`, 2 `descartado` (acondicionador aloe y miel: su foto es la del de coco).
- **Web:** 133 productos PUBLICADOS (ids 5036–5300), precio = regla del bot, gestora 40 % del margen, costo = Excel. Sueltos de < 5 USD como paquete de 12 (< 2 USD) o 6. Lista completa y deshacer: `oferta-2026-10-22/bak-20261023-sefue-creados.json` (= servidor `~/bak-20261023-sefue-creados.json`).
- **Fuera (y por qué):** sin foto #1, #33, #50, #89 (humidor B4); dudosos #134 (champú 0,35), #129 (bici morada); #131/#132 (foto de otro sabor); #73 (repetido de #10); herrajes #81–#88 (sin locación, mínimo 500 USD).
- **Fotos:** 107 con fondo verde menta (`menta.mjs` en el VPS, sharp, sin IA de pago); 26 con la original (`menta.json` dice por qué). Deshacer en la web: `wp eval-file ~/sefue-fotos-menta/poner-menta.php ~/sefue-fotos-menta/menta-plan.json deshacer`.
- **Pendiente de Javier:** dirección exacta de oficina/aseo (se usa calle N e/ 21 y 23), horario de los 2 locales, champú miel 0,35, bici morada (marca y foto), bolígrafo R305 (3 o 4), humidor B4 (foto), quién paga y cuándo.
- **Anuncios:** NO metidos en la cola. Lista en VPS `/root/archivos/sefue-2026-10-22/anuncios-pendientes.json` (copia aquí), para el grupo 24 h (D101), con el SÍ de Ernesto cuando vuelva WhatsApp.
- **A los 21 días** el bot los da por «quizá agotados»: pedir lista nueva a Javier y volver a pasar `armar.mjs --solo-regla --con-opcionales --todo --publicar`.
