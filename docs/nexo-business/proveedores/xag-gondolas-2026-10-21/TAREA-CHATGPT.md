# Tarea para ChatGPT (Codex): subir el catálogo de góndolas de XAG a casaviva.company

**Autorización de Ernesto (21-oct-2026, chat de Claude):** «necesitamos subir ese catálogo con los precios de Casa Viva». Vale para crear la ficha del proveedor, meter sus productos en la bolsa y **publicarlos en la web como «Bajo pedido»** con el precio de Casa Viva. **No** autoriza escribir a clientes, a grupos ni comprar.

## Proveedor
- **XAG · Góndolas Boyeros** — WhatsApp **+53 5514 8266** (contacto ya existe en `crm_contacts`, etiqueta `proveedor`).
- Local en **Fontanar (Boyeros)**. Catálogo en línea: https://store11723.store.link
- **Cobro:** en **USD**; da factura en CUP (a la tasa del banco) con datos de la empresa compradora.
- **Entrega:** recoger en Fontanar (lo prefiere) o mensajeros de su zona hasta la tienda, **~10.000 CUP** (por confirmar si es por viaje o por unidad).
- Las **dobles** hay que traerlas de otro almacén (tarda); las **sencillas de 180 cm** las tiene ya.
- ⚠️ Se quejó de que los mensajes del bot son «muy largos e incómodos de leer»: **si hay que preguntarle algo, una pregunta corta cada vez.** Prefiere notas de voz.

## Productos, costos y precio Casa Viva (láminas + audios de XAG, revisado por Claude)
Precio Casa Viva calculado con `myPrice()` de `vivabot/src/market-price.js`; gestora = `gestoraShare()` (40 % del margen).
| # | Producto (de la lámina) | Medidas | Costo USD | **Precio Casa Viva** | Gestora gana | Disponibilidad (audio) |
|---|---|---|---|---|---|---|
| 1 | Estante de pared sencillo, 5 repisas, 60 kg/repisa | 160 × 90 × 45 cm | 120 | **140** | 8 | **no hay ahora** |
| 2 | Góndola de exhibición (pared), 6 repisas | 180 × 90 × 45 cm | 130 | **150** | 8 | **la tiene ahora** (blanca, tira amarilla) |
| 3 | Estante de centro de pasillo **doble cara**, 5 repisas por cara, 60 kg/repisa | 160 × 90 × 90 cm | 195 | **215** | 8 | hay que traerla de otro almacén |
| — | «Doble $380» de la lámina = *doble cara doble* | — | 380 | — | — | **XAG no la tiene: NO publicar** (confirmado 14:11) |
| 4 | Góndola con display (negra, cabecera roja) | 220 × 90 × 45 cm | 220 | **240** | 8 | — |
| 5 | Góndola de malla (con cestas y ganchos) | 180 × 90 × 45 cm | 160 | **180** | 8 | — |
| 6 | Estante de almacenamiento, estructura reforzada | 2 × 1,85 × 0,6 m | 200 | **220** | 8 | — |
| 7 | Carrito (cesta con ruedas) | — | 22 | **31** | 3,60 | — |
| 8 | Cesta de compra | — | 15 | **21** | 2,40 | — |
| 9 | Mueble para caja (mostrador) | «120 × 180 × 850», 60 cm de fondo | 1.320 | **1.455** | 54 | **aclarar medidas** (el 850 no cuadra) |

Las fotos de la góndola con display traen el logo «MJ» de otra tienda en la cabecera: hay que taparlo.

## Cómo publicarlos (igual que los lotes de Sergio/LJH y de la Tienda 42 y 23)
1. Ficha nueva en `crm_suppliers` («XAG Góndolas · Fontanar», teléfono de arriba, horario/lleva/cobra según lo de arriba).
2. Cada producto en la bolsa `crm_market_items` con ese vendedor → `MK-<id>`.
3. **Precio Casa Viva = regla del bot** `C:\Users\Ernesto\vivabot\src\market-price.js` (no recalcular a mano). **Comisión fija de la gestora = 40 % del margen.** `_cvd_cost` = costo del proveedor, `_cvd_cost_source=proveedor`.
4. Web: categoría «Bajo pedido» + departamento (Ferretería/Negocio), sin control de stock, «hay existencias», el aviso corto de bajo pedido, descripción solo con datos de la lámina (medidas, material, repisas). **Nunca** nombre del proveedor, su teléfono, su costo ni la ubicación de Fontanar.
5. **Fotos:** quitar o tapar el logo de otra tienda (se ve «MJ» arriba de una góndola), precios escritos y cualquier texto del proveedor. Herramientas gratis (sharp). Una foto limpia por producto; si no se puede limpiar, sin anunciar.
6. Scripts que ya sirven: `docs/nexo-business/proveedores/tienda-42-y-23/` (`bolsa-crear.mjs`, `armar-publicar.mjs`, `crear-productos.php`) y `electro-2026-10-20/`. Prueba en seco → 2 productos → revisar en la web → el resto. Copia de seguridad JSON de lo creado. `wp litespeed-purge all`.
7. La selección diaria de las 9:00 los toma sola (bolsa «publicado»): **no** anunciar a mano.

## Contexto de venta (no lo hace ChatGPT)
- Enrique (gestor, …4795) tiene un cliente que quiere **6 góndolas dobles + 2 sencillas**. Ernesto lleva esa negociación. Kevin (MK) no tiene dobles; otro vendedor de Revolico (…1313) tiene 2 dobles de 4 niveles y repone el jueves.

## Al terminar
- Apuntar en `docs/00-FUENTE-DE-VERDAD/ESTADO.md` (lista de productos publicados, enlaces, costo → precio → gestora gana) y avisar a Ernesto con un resumen corto.
