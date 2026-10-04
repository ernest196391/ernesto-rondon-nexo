# Economía, socios y roles — diseño

Fuente: el Excel "AUTOMATIZACION OCTUBRE 2026" de Casa Viva (ficha de costo,
hojas diarias por moneda, hojas por inversor, venta a trabajadores) y las
decisiones de la dueña del 2026-10-04.

## Principios

1. **Un solo registro de hechos.** Ventas, entradas, traslados y conteos ya
   viajan como eventos (`sync_events`). La economía se **calcula** sobre ellos
   en la nube; no se vuelve a teclear nada.
2. **El POS no cambia de lógica de dinero.** Sigue vendiendo offline igual. Solo
   gana: recibir mercancía, quién vendió (para la comisión) y compra de personal.
3. **Variables, no fórmulas.** La dueña cambia números (gastos, %, tasa); las
   reglas están en una función SQL única y probada. Nadie puede romper una fórmula.
4. **Nada se repite.** El costo se edita en la ficha del producto (no en otra
   pestaña); el socio dueño de la mercancía es un campo del producto; la tasa vive
   solo en Ajustes.
5. **Todo es por negocio.** Otra tienda copia la plantilla y cambia sus valores.

## Roles y paneles

| Rol | Dónde | Ve / hace |
|---|---|---|
| Dependiente | POS | Vender, Caja, Inventario + **Recibir mercancía** y asignarla a ubicación o vendedor |
| Admin (dueña) | Panel | Todo: Hoy, Productos (con ficha de costo), Socios, Economía, Ajustes |
| Económico | Panel | Productos (costos), Socios, Economía. Sin equipos ni personas |
| Socio (inversor/proveedor) | Panel, vista propia | Solo **Mi cuenta**: vendido, su ganancia, pagado, por cobrar, stock suyo |

`members.role` pasa a: `owner`, `economist`, `viewer`, `partner` (+ `partner_id`).

## Modelo

- **Variables del negocio** (`cost_settings`): contingencia %, margen objetivo %,
  otros cargos % (el "2 %" del Excel, nombre editable), comisión por defecto del
  vendedor (fija USD o %), base de unidades (auto = promedio 90 días, o manual),
  redondeo del precio sugerido.
- **Gastos fijos** (`fixed_costs`): concepto, monto, moneda. Se convierten con la tasa vigente.
- **Costo por producto** (`product_costs`): compra (monto, moneda, tasa del día de
  compra), flete USD, comisión del vendedor (si difiere), socio dueño.
- **Socios** (`partners`): nombre, tipo (`consignment` proveedor | `investor`),
  regla `percent_of_profit` | `percent_of_sale` | `fixed_per_unit` | `supplier_price`, valor.
  Regla por producto opcional. Liquidaciones (`partner_payouts`) registradas.

Cálculo por producto (igual al Excel, sin sus errores):

```
compra_usd   = monto / tasa_compra
costo_puesto = compra_usd + flete
fijo_unidad  = gastos_fijos_usd / unidades_mes
base         = costo_puesto + fijo_unidad
costo_total  = base × (1 + contingencia)
sugerido     = redondeo((costo_total + comisión) / (1 − margen − otros))
ganancia     = precio − costo_total − comisión − precio × otros
```

Hoy la web (BizneCubano/Woo) es la autoridad del precio: la importación horaria
lo sobrescribe. La ficha **muestra** el sugerido; el precio se cambia en la web.
Pasar la autoridad del precio a NEXO es una decisión pendiente de la dueña.

## Canales de venta: tienda, gestora, dependienta

- **Venta directa en tienda:** precio normal.
- **Venta por gestora:** cada producto lleva la comisión de la gestora (USD fijo
  por producto, o el general en USD o %).
- **Producto extra** que compra la clienta de una gestora: esa comisión se reparte
  gestora / negocio / dependienta (33,34 / 33,33 / 33,33 por defecto, editable;
  debe sumar 100).
- **Dependienta:** % del precio por producto, general + ajuste por producto.

Fase 1 ya calcula esto por producto (ficha). La venta real se atribuye en la fase 3,
cuando el POS registre la gestora, la dependienta y si el producto es extra.

## Fases

1. **Hecha (2026-10-04).** Ficha de costo: variables, gastos fijos, costo en la ficha del producto,
   semáforo de margen, filtros "Sin costo" / "Margen bajo", auditoría de cambios. Migraciones
   `20261004020000`, `…021000`, `…022000`. Panel: Productos + Ajustes (Tasas · Costos · Gastos · Equipos).
2. Socios: reglas, atribución automática de cada venta, estado de cuenta, liquidar, portal del socio.
3. POS: recibir mercancía (con socio), gestora y dependienta en la venta (comisiones y reparto del extra), compra de personal.
4. Economía: punto de equilibrio, cascada de ganancia, ventas por moneda, ranking de productos, exportar Excel.
5. Importar costos y socios del Excel actual.

## Errores del Excel que el modelo elimina

Comisión rotulada 12 % con valor 10 %; tres tasas distintas (530/750/775); hoja G
resta filas un día y las suma otro; MARYTA omite la fila 8 en el total; NANA suma
celdas a mano; unidades del mes fijas en 330.
