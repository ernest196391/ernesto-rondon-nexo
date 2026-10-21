# Plan: productos de SeFué en Casa Viva «Bajo pedido» (21-oct-2026)

**Estado:** solo preparado. Nada publicado, nada en la bolsa, nada en la web, nadie contactado.
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
