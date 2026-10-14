# Venta de proveedor automática, con el reparto apuntado (propuesta, 14-oct-2026)

Base: D66 (regla del reparto) y la primera venta real, la lámpara #3693 de Nadielys (Kevin / Digital Store). Procedimiento a mano de hoy: skill `venta-proveedor`.
Pedido de Ernesto (15:23): «que salga automático y que se vayan descontando las comisiones y que todo el mundo lo tenga claro: de dónde va, de qué comisión».

## 1. El ejemplo que tiene que salir solo (lámpara #3693, tasa 790)
| Concepto | Importe | Quién lo recibe | Hoy |
|---|---|---|---|
| Precio web (cliente) | 45 USD | — | automático |
| Mensajería (cliente) | 5.500 CUP | mensajero | automático |
| Precio del proveedor | 32 USD | Kevin | a mano (vale en su app) |
| Ir a buscarlo al proveedor | 1.000 CUP | mensajero (lo pone la tienda) | a mano |
| **Margen** = 45 − 32 = 13 USD = 10.270 CUP − 1.000 de recogida | **9.270 CUP** | se reparte ↓ | — |
| Comisión de la gestora | 5,20 USD = 4.108 CUP | Nadielys | **automático (Core)** |
| Dependienta que recibe/paga | 500 CUP por artículo | Nana / Zaymi | a mano |
| Tienda Casa Viva | 2.500 CUP por artículo | Casa Viva | a mano |
| Gestor especial (consiguió el proveedor y coordinó) | el resto: 2.162 CUP | Ernesto | a mano |

## 2. Lo que hay que construir (en orden)
1. **Modo «pasa por la tienda» en el motor de bajo pedido** (`vivabot/src/bajopedido-engine.js`, `bajopedido24-rules.js`): hoy solo hay `lleva` (proveedor → cliente), `recoger` (ruta de Ernesto) y `manual`. Añadir:
   - `tienda` (variante A): el proveedor lo trae a Casa Viva con su mensajero; aviso a la dependienta: «llega X de <proveedor>, paga <precio> + <su mensajería>».
   - `recoge` (variante B): nuestro mensajero lo recoge en el local del proveedor; aviso a la dependienta: «dale a <mensajero> <precio> + <recogida>».
   - Elegir A o B: por zona del cliente (fuera de las tarifas del proveedor → B o A, nunca directo), tamaño (campo «grande» en el producto: triciclo) y la ficha (`crm_suppliers`: `pickup_address`, `hours`, tarifas por local).
2. **Una sola carrera, al mensajero correcto** (`vivabot/src/dispatch.js` + Core `/bot/dispatch`): el vale de un pedido de proveedor con variante B dice **«Recoger en: <local del proveedor>»** (hoy la recogida está fija en Casa Viva, `class-cvd-bot-bridge.php:786`) y lleva «dinero que te da la tienda: 32 USD + 1.000 CUP». Investigar y cerrar el fallo de hoy: #3693 pasó solo a «Listo para mensajería» a las 15:00 («system») y salió repetida.
3. **El reparto, apuntado en cada pedido** (Core, al marcarse *entregado* y *dinero recibido*): meta `_cvd_supplier_split` = { proveedor, costo, recogida, margen, líneas: gestora / dependienta / tienda / gestor especial }. Usa la tasa guardada del pedido. La comisión de la gestora sigue siendo la de siempre (`_cvd_commission_*`); las otras tres son líneas nuevas:
   - **Dependienta**: comisión de personal (500 CUP por artículo, ajustable en el panel), en su área y en el cierre de caja.
   - **Tienda**: ingreso de Casa Viva (2.500 CUP por artículo, ajustable).
   - **Gestor especial**: el resto, a nombre de quien trajo el proveedor (hoy Ernesto; campo en la ficha del proveedor).
   - Si el margen no alcanza (resto < 0): aviso a Ernesto antes de confirmar la venta, no después.
4. **Pago al proveedor**: apuntarlo en `crm_supplier_ledger` (ya existe) con el pedido; cierre por proveedor (Kevin liquida quincenal).
5. **Que todos lo vean claro**:
   - **Panel de Lennys**: en el pedido, un recuadro «Proveedor: pagado 32 USD · margen 9.270 CUP · Nadielys 4.108 · dependienta 500 · tienda 2.500 · gestor especial 2.162», y una lista «Ventas de proveedor» del mes para pagar.
   - **Gestora**: lo de siempre (su comisión en Ventas).
   - **Dependienta**: en /ventas/, «+500 CUP» en ese pedido.
   - **Mensajero**: el vale dice cuánto le da la tienda y cuánto cobra.

## 2b. Decidido por Ernesto (15:30, D69)
- **Fondo ≈ 3.000 CUP** para mensajero + dependienta + tienda, **editable en cada vale**: antes de confirmar, el sistema PREGUNTA las tres cifras (con una sugerencia ya rellena). La tienda siempre gana.
- **Rutas A / B / C** (al tienda / recoge nuestro mensajero / directo al cliente), la que convenga; el vehículo (moto o triciclo) cambia lo del mensajero.
- **Todo sale del margen.** El resto es del **gestor especial = Ernesto** (campo por proveedor para añadir otros más adelante).
- **Al cerrar** se suman y se enseñan todas las comisiones del producto.

**Sugerencia de reparto por defecto (editable):** mensajero = tarifa de recogida del proveedor (moto 1.000 / triciclo 2.500; ruta C: 0, lo cobra el proveedor) · dependienta 500 · tienda 1.500 (mínimo 1.000, nunca 0).

**Sugerencia de margen mínimo (Claude):** aceptar la venta solo si **precio web − precio del proveedor ≥ comisión de la gestora + fondo de la operación + 1 USD** para el gestor especial. Con moto ≈ comisión + 5 USD; con triciclo ≈ comisión + 7 USD. Ej. lámpara: 13 USD ≥ 5,20 + 3,80 + 1 = 10 USD ✓. Si no llega, el sistema avisa y Ernesto decide (subir precio web, bajar fondo o no aceptar).

## 3. Lo que decide Ernesto antes de programar
- 500 y 2.500 CUP: ¿por artículo o por pedido? ¿Fijos o en % del margen (para productos muy baratos o muy caros)?
- La recogida (1.000 CUP) sale del margen (así fue hoy): ¿siempre?
- Margen mínimo para aceptar una venta de proveedor.
- ¿El «gestor especial» puede ser otra persona (quien trae a cada proveedor)?

## 4. Fases
1. Reparto apuntado + recuadro en el panel (lo que pidió Lennys: «tener en cuenta las ganancias de cada uno al pagar»).
2. Modo `tienda`/`recoge` en el motor + avisos a la dependienta.
3. Vale con recogida en el local del proveedor + una sola carrera.
