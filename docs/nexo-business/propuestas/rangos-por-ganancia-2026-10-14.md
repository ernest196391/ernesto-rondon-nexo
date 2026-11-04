# Rangos y red pagados con la ganancia · propuesta «ganan todos» (14-oct-2026)

Pedido de Ernesto: que no salga del total vendido sino de las utilidades de los productos; que no afecte a la tienda; que ganen todos y se venda más.

## Datos reales (simulación de precios del 11-oct, costos de BizneCubano, 150 productos de tienda)
- De cada 100 USD vendidos: ~83 costo, ~9 comisión, **~6 quedan a Casa Viva**. Mediana: 11 % por producto. 20 productos se venden perdiendo (varios por costos cruzados en el Excel).
- Bajo pedido (proveedor): ejemplo lámpara 45 USD, costo 32, comisión 5,20 → **7,80 quedan (17 %)**.

## La idea: el punto es ganancia, no venta
1. **1 punto = 1 USD de ganancia limpia** que deja una venta entregada y cobrada: precio Casa Viva − costo − comisión de la gestora. Un producto que pierde da 0 puntos.
2. **Cada producto muestra sus puntos** en la tienda de la gestora («⭐ 8 puntos»). Así ellas eligen vender lo que deja más, y la mezcla de ventas mejora sola.
3. **Fondo de líderes = 15 % de los puntos** de cada equipo en el mes. Casa Viva se queda siempre con el 85 % de una ganancia que, sin el equipo, no habría existido.
   - 5 de esos 15: la red (madrina 1.er nivel y 2.º nivel).
   - 10 de esos 15: el bono de rango.
4. **Si el fondo no alcanza**, todos cobran el mismo % de su bono (D55). Casa Viva nunca pone de su bolsillo.

## Tabla en puntos (bono = 10 % de los puntos del equipo; tasa 785)
| Piedra | Puntos del equipo/mes | Bono | ≈ ventas a 6 % de margen | ≈ ventas a 17 % |
|---|---|---|---|---|
| Bronce | 65 | 5.000 CUP | 1.080 USD | 380 USD |
| Plata | 130 | 10.000 | 2.170 | 760 |
| Oro | 195 | 15.000 | 3.250 | 1.150 |
| Platino | 320 | 25.000 | 5.330 | 1.880 |
| Zafiro | 510 | 40.000 | 8.500 | 3.000 |
| Rubí | 765 | 60.000 | 12.750 | 4.500 |
| Esmeralda | 1.150 | 90.000 | 19.170 | 6.760 |
| Diamante | 1.660 | 130.000 | 27.670 | 9.760 |
| Doble Diamante | 2.300 | 180.000 | 38.330 | 13.530 |
| Corona | 3.190 | 250.000 | 53.170 | 18.760 |

Los bonos son los mismos que ya elegiste; lo que cambia es que se ganan con ganancia. Con productos de buen margen se llega 3 veces antes.

## Por qué ganan todos
- **Casa Viva:** solo reparte el 15 % de la ganancia extra que trae cada equipo; los productos que pierden no dan puntos; las ventas se mueven hacia lo que deja dinero.
- **Gestoras:** ven claro qué les conviene vender, suben de piedra y cobran bono; las madrinas ganan por enseñar.
- **Clientes:** «Amigas Casa Viva» también se paga de la ganancia de la primera compra de la amiga.

## Antes de lanzar
1. Corregir los costos cruzados y los 20 productos que pierden (Ernesto lo revisa primero; luego Lennys).
2. Cargar el costo en la web: tienda (archivo de BizneCubano) y bajo pedido (`supplier_price`).
3. Aplicar la regla de precios de Lennys (simulación: la ganancia de la tienda pasa del 11 % al 17 %).
4. Prueba 2 semanas con Dany calculando puntos sin pagar.
