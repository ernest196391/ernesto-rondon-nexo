# Conflictos viejos de gestora (D97) · revisado 22-oct-2026

**Qué es:** pedidos desde el 11-oct de un mismo cliente que cobró una gestora distinta de la que le toca por la regla D97
(«el cliente es de la PRIMERA gestora que lo trajo, para siempre»). **No se ha tocado nada:** la regla no es retroactiva y
estos casos los decide Ernesto.

**Cómo se buscó:** todos los pedidos web, agrupados por teléfono normalizado (8 cifras, con o sin 53). Para cada pedido vivo
(no cancelado, fallido ni devuelto) desde el 11-oct se miró quién era la primera gestora del cliente en ese momento: su
primer pedido vivo con gestora o el apuntado a mano en «Mis clientes», lo que fuera antes. También cuentan las ventas
directas de clientes que ya tenían gestora. Lectura en el servidor con `wp eval`, sin guardar nada.
Fuera de la búsqueda quedan las ventas de la caja de la tienda, que viven en Supabase (ver «Caja» en `README.md`).

## Resultado: 1 conflicto

| Cliente | Pedido | Fecha | Total | Cobró | Comisión | Le tocaría | Por qué |
|---|---|---|---|---|---|---|---|
| Ana …4709 | #3833 | 15-oct 16:57 | 23 USD | Zaymi (#64), con su enlace | 2,30 USD, **pagada** | Katia (#19) | Su primer pedido fue #3694 con Katia (14-oct), aún sin entregar cuando hizo el segundo |

**Decide Ernesto** (opciones, ninguna hecha):
1. Dejarlo como está. La regla vale de aquí en adelante y desde el 22-oct ya no puede pasar.
2. Pagar a Katia 2,30 USD aparte, sin quitárselo a Zaymi. Casa Viva asume el doble pago una vez.
3. Descontárselo a Zaymi en su próximo pago y dárselo a Katia. No se recomienda: ya estaba cobrado y fue culpa del sistema.

## Para saber (no son conflictos de dinero)
- **20 clientes** de «Clientes de Casa Viva» tienen dueña solo por un pedido que luego se canceló (pedidos = 0). Por la
  regla no quedan atados, así que su próxima compra no da comisión a esa gestora. El bot, en cambio, les sigue pasando
  con esa gestora cuando escriben por privado: es solo atención al cliente, no dinero.
  Caso aparte, …9422: su primer pedido, de Lennys (#2943), se canceló, y 3 minutos después compró con Joyce (#2944,
  entregado). Por la regla es de Joyce, y el bot ahora también dice Joyce.
- Ya no hay pedidos «a medias»: los 7 clientes con su primer pedido en espera (Lisbet, Yailén, Harley, Ana Gloria ×2,
  Nadielys ×2) ya quedan atados a su gestora desde la 3.14.52.

- **22-oct 16:23 · Decidido por Ernesto:** pagar a Katia 2,30 USD aparte (#3833) sin descontar a Zaymi. Avisado a Lennys (#2648, lo paga en tienda o en su próximo pago) y a Katia.
