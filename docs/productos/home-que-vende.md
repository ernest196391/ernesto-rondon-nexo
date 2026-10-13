# Portada que vende (casaviva.company)

**En vivo desde el 13-oct-2026, ~17:45 (Core 3.13.83, commit Casa-Viva `c58c32f`).** Pedido de Ernesto, 13-oct ~17:10.

| | |
|---|---|
| **Quién** | Clientes de la web, casi todos en el teléfono y con datos caros. También la gente que entra por el enlace de un gestor o una gestora (tienda espejo, `?ref=`). |
| **Problema** | Debajo de las fichas de departamentos, la portada se llenaba de bloques sin productos: la caja «¿Vives fuera de Cuba? Regala a tu familia» con 3 pasos, tres tarjetas grandes («Entrega a domicilio», «Formas de pago», «Atención por WhatsApp») y un pie con el logo marrón sobre petróleo, casi invisible. Ocupaban varias pantallas del teléfono y ninguno llevaba a comprar. |
| **Evidencia** | Dos capturas de Ernesto, 13-oct: «Esto está de más, está aquí, no lleva a ninguna compra; buscar cómo sustituir como en Amazon o Temu, Shein y poner productos y decisiones de compra». Así estaba: `home-que-vende/antes-1-arriba.jpg`, `antes-2-regala-y-tarjetas.jpg` y `antes-3-pie.jpg`. |

## Qué se hizo

La portada son ahora **filas de productos que se deslizan de lado**, como en Temu, con datos reales de la tienda:

1. Arriba, igual que antes: la cabecera, las fichas de departamentos («Todo · Baño · Cocina…») y el buscador.
2. **Lo más vendido, esta semana.** Sale de los pedidos reales de los últimos 7 días. No cuenta pruebas, cancelados ni pendientes de pago. Si una semana tiene menos de 4 productos vendidos, usa el mes.
3. **Una franja fina de confianza**, en una sola línea: «🚚 Entrega en 24 h · 💵 Efectivo, Zelle o transferencia · 💬 WhatsApp». Cada una lleva a su página.
4. **Recién llegados.** Lo último que se publicó, también lo «Bajo pedido».
5. **«¿Vives fuera de Cuba? Regala a tu familia en La Habana»**, ahora en una línea que lleva a Formas de pago.
6. **A buen precio.** Primero lo rebajado de verdad; después lo de 15 USD o menos que más se vende.
7. **Una fila por departamento**, en el orden de las fichas de arriba, cada una con «Ver todo».

**Cada tarjeta** lleva:
- foto cuadrada;
- nombre en 2 líneas;
- precio en USD en ámbar y, debajo, en CUP con la tasa del día (por ejemplo, «US$30.00 / 23.550 CUP»);
- «Últimas unidades» si quedan 1 o 2;
- «Bajo pedido · llega en 24 h» si es de un proveedor;
- un botón: «Añadir» al carrito, o «Elegir» si tiene colores o modelos.

Al añadir se abre el panel del carrito con «Pagar ahora». Los productos agotados no salen.

**Se quitó de la portada:** la caja de 3 pasos, las 3 tarjetas grandes y el bloque de ofertas de arriba (las ofertas tienen ahora su fila). También salieron los círculos de categorías, porque repetían las fichas de departamentos. **No se borró ninguna página:** Mensajería, Formas de pago y Atención al cliente siguen igual. La caja de 3 pasos sigue en la ficha de cada producto.

**El pie** ahora lleva el logo oficial en crema sobre petróleo, con textos legibles. Este cambio se ve en toda la web.

**Tienda de un gestor o una gestora (`?ref=`):**
- cada tarjeta muestra el precio de esa persona: el organizador con ruedas sale a 35 en la tienda de Thaly y a 30 en la de Casa Viva;
- arriba sale «Tienda atendida por …»;
- todos los enlaces conservan su código;
- la página no se guarda en caché, igual que `/tienda/?ref=`, así que una gestora nunca ve los precios de otra.

**Ahorro de datos:**
- fotos pequeñas (300 px, casi todas webp, unos 11 KB cada una);
- solo se cargan las fotos que están cerca de la pantalla: al abrir la portada bajan unas 14 fotos, no las ~137.

**Si la tasa del día tiene más de 36 horas, no se muestra el CUP** (mejor callar que dar una cifra vieja). Cuando llega una tasa nueva, la portada guardada en caché se rehace sola.

Capturas a 390 px, como en el teléfono:
- `home-que-vende/despues-1-arriba.jpg`
- `despues-2-recien-regala-buen-precio.jpg`
- `despues-3-departamentos.jpg`
- `despues-4-pie-logo-crema.jpg`
- `despues-5-tienda-de-thaly-35.jpg`
- `despues-6-anadir-abre-el-carrito.jpg`

## Cómo se mide

La portada lleva un contador anónimo por día, sin datos personales. Cuenta:
- las visitas (una por sesión y día; aparte, las que entran por la tienda de un gestor o gestora);
- los toques en un producto, por fila;
- los «Añadir», por fila;
- los «Ver todo», por fila.

Para leerlo, en el servidor:

```
wp option get cvd_home_stats --format=json
```

- **De la portada al producto:** toques ÷ visitas. Compararlo cada semana, y por fila: ¿qué fila hace comprar más?
- **Tasa de añadir al carrito:** «Añadir» ÷ visitas.
- **Ventas:** pedidos web por día (`cv pedidos-hoy 7`), antes y después del 13-oct.
- **Ojo:** el 13-oct incluye 3 visitas y 1 «Añadir» de prueba de Claude.

## Para volver atrás

- **En 10 segundos, sin desplegar:**
  - `wp option update cvd_home_rails no` y `wp litespeed-purge all`: vuelve la portada del tema.
  - `wp option delete cvd_home_rails`: vuelve la nueva.
- **Todo Core como estaba:** restaurar `~/bak-20261013-cvd-3.13.82-antes-3.13.83`.

## Pendiente o para mirar

- «Últimas unidades» sale en muchas tarjetas (~1 de cada 3), porque muchos productos tienen 1 o 2 unidades. Es real, pero si a Ernesto le parece mucho, se puede bajar a «solo queda 1».
- Algunos productos están en departamentos que no les tocan: el soporte de TV y la puerta de corredera salen en Cocina. Eso es de las categorías del producto, no de la portada.
- Se puede añadir «Te puede interesar» (vistos hace poco) cuando haya datos del contador.
