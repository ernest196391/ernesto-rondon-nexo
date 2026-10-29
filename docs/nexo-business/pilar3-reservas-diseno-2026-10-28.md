# Pilar 3 — «Lo que se promete llega a la tienda» (diseño, 28-oct-2026)

**Caso real:** el bot le dijo a Kay que el #5551 (recogida) se guardaba hasta mañana. La tienda no lo sabía, Nana lo canceló a las 14:44 por «cliente no pasó» y Kay perdió la comisión (error #118).
**Idea:** una promesa de guardar un pedido no vive en un mensaje de WhatsApp: vive **dentro del pedido**, y la tienda la ve donde mira.

## 1. La reserva (en el pedido, Core 3.14.72)
- Campos del pedido: `_cvd_reserva_hasta` (fecha), `_cvd_reserva_por` (quién la pidió: «Kay»), `_cvd_reserva_nota`, y quién la registró y cuándo.
- Vale hasta las 23:59 (hora de Cuba) de ese día. Máximo 7 días. Solo en **recogidas** abiertas.
- Quién la puede poner o quitar:
  - **El bot** (cuando la gestora lo pide por WhatsApp): `POST /bot/orders/{id}/reserva`.
  - **La dependienta / Lennys**: botón «Reservar» en `/ventas/` (`POST /sales/{id}/reserva`).
  - **El panel de Lennys**: `POST /panel/orders/{id}/reserva` (la ruta queda lista; el botón del panel viene después).
  - La gestora, por ahora, por WhatsApp (el bot). Un botón en su área queda para después.
- Cada cambio deja una nota en el pedido: «Reserva hasta el jue 29/10 pedida por Kay (registrada por VivaBot)».

## 2. Que la dependienta lo vea
- En `/ventas/` (la lista de Nana y Zaymi): franja **roja** arriba de la tarjeta: «⛔ Kay pidió guardarlo hasta mañana jue 29/10 · No lo canceles». Si venció: franja ámbar «Reserva vencida».
- En la **Caja** (pedidos web): la misma franja roja. Core ya la manda; falta pintarla en la app de la Caja (versión nueva de la Caja, pieza aparte).

## 3. Cancelar con reserva vigente
| Quién cancela | Qué pasa |
|---|---|
| Dependienta (manual) | **Bloqueado**: «Kay pidió guardarlo hasta mañana. Habla con Lennys». |
| Lennys / administración | Pide confirmación: «Tiene reserva de Kay hasta mañana. ¿Cancelar igual?» |
| Bot (cancelar solo las recogidas viejas) | **Bloqueado** mientras dure la reserva (Core rechaza con 409; el bot además ni lo intenta). |
- El reloj de «12 h aviso / 24 h cancelar» **espera** hasta que la reserva venza.
- **Al vencer**: se avisa **una sola vez** a la gestora y a la tienda («la reserva del #5551 venció hoy; ¿viene el cliente?»). Core lo detecta cada hora y el bot lo manda (no entre 22:00 y 7:30).

## 4. Qué hace el bot
- Solo dice «se guarda hasta mañana» si el `POST` de reserva devolvió `ok` y la fecha coincide.
- Si falla o no contesta: «lo confirmo con la tienda» y lo pasa a la tienda.
- Esto lo hace la sesión del bot (bot-maraton); Core le deja el contrato listo.

## Orden y riesgos
1. Core 3.14.72 (esta pieza): campos, rutas, bloqueo, franja roja en `/ventas/`, aviso de vencimiento. Aditivo: sin reserva, todo funciona igual que hoy.
2. Bot (reservar + no cancelar + aviso de vencimiento).
3. Caja: pintar la franja roja (versión nueva de la Caja).
- **Despliegue:** copia de seguridad del plugin antes, probar con un pedido de prueba (no el de un cliente), revertir = volver a subir la copia.
- **Qué debe decidir Ernesto:** (a) ¿la dependienta queda **bloqueada** (propuesto) o solo con aviso? (b) ¿máximo 7 días de reserva? (c) ¿pintamos la franja en la Caja ahora o la dejamos para la próxima versión?
