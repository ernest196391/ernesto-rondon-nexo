# PENDIENTES · domingo 18-oct-2026 (lo dejó la sesión del servidor a las 02:15)

Ernesto: «empezamos mañana, una por una». Detalles de todo lo de ayer en `NOTAS-SERVIDOR.md` (17-oct y 18-oct).

## 0 · Antes de empezar (desde el PC, 5 min)
- Permisos de esta sesión: crear `/root/nexo-movil/.claude/settings.json` con las 3 reglas (`ssh -i /root/.ssh/casa-viva-web`, `scp -q -P 65002 -i /root/.ssh/casa-viva-web`, `cv`). Esta sesión no puede hacerlo sola (bloqueo de «automodificación»).
- Añadir al índice `memory/MEMORY.md` la línea de la regla de Lennys (archivo `lennys-aprueba-dia-a-dia.md` ya creado; el índice quedó bloqueado).

## 1 · Lo que quedó a medias ayer
1. Publicar la **bici de Alberto** (500 USD, costo 450 consignación, comisión 10, 1 ud, recogida o domicilio). Ficha: `borrador-ficha-bicicleta-alberto.md`. Ojo: queda bajo el mínimo (545,91) — Ernesto lo aceptó a 500. Anunciar en «Actualización de productos» desde las 7:30.
2. **Búsquedas en internet:** el código ya está en `/root/vivabot` (commits 193b006 y 78136ca, sin push; pruebas 300/0). Falta en `.env`: `WEB_SEARCH=on`, `WEB_SEARCH_DAILY_USD=1`, `WEB_SEARCH_AUTO=prueba`; `cv reiniciar`; probar «busca en internet bolso para laptop 14 pulgadas gris» y pasar respuesta + `cv gastos` a Ernesto.
3. **Resumen de Lennys a las 20:00** (quitarla del de las 10:00). Primero localizar desde dónde se programa (no está en crontab de root ni /etc/cron*).
4. **#2903** (Maryta): cerrar la incidencia abierta por Nana el 11-oct (`resolve_incident(2903,"operation")`). Mirar antes `~/bak-20261017-pedido-2903.json`: puede que otra sesión ya lo arreglara.
5. **#3916** (Daiquel): marcar entregado (25 USD). Preguntarle #2944, #3772, #3773.
6. **Ventilador de Day** (…9634): identificar el modelo con la foto y buscar proveedores.
7. **Nadielys**: buscar estante de bambú 2 pisos y mesas nido mármol blanco/dorado; decirle que puede cobrar comisión en USD en efectivo en la tienda (orden de Ernesto) — ojo, ayer recibió dos respuestas distintas.
8. Fotos reales: seguir la cola `/root/archivos/fotos-reales/cola-lennys-colores-20261017.tsv` (79). Organizador 3556 negro y blanco cuando estén armados. Guardadas para cuando entren: `pendientes-colores-20261017/`.
9. Alta en la caja/nexo (PC): 3888, mercancía de Ely, morado 2529 (variación 4180), la bici.

## 2 · Mejoras del sistema (una por una, en este orden)
1. **Bot: no decir «anotado» si la acción no salió bien** (caso Daiquel #3916). Pequeño, se nota ya.
2. **Bot: «modo fotos»** — pide el siguiente color de la cola y la foto que llega como respuesta se asigna sola. Requiere guardar el mensaje citado (quoted id) en `crm_messages` y en `cv chat`.
3. **Un dueño por chat** (`crm_chat_owner`, 10 min) para que supervisor, nube y servidor no contesten lo mismo dos veces.
4. **Una sola ventanilla para las órdenes de Ernesto** (tabla `ordenes_ernesto` desde «Tú», que todas las sesiones leen).
5. **Bot: Lennys «yo» bajo una CARRERA → se asigna a Daiquel.**
6. **Alarma diaria de cosas atascadas** a Lennys (incidencias >24 h, «entregados» sin marcar, carreras sin mensajero), con botón.
7. **Botones en el panel para Lennys:** foto real por color (el fallo que ella reportó), cerrar incidencia, reasignar carrera.
8. **Producto nuevo = web + caja a la vez.**
9. **Consignación con precio mínimo automático** en el panel.
10. **Fuera de horario → cola automática** de 7:30/10:00.
11. **Una sola regla de foto principal** para panel y web.
12. Decididas por Ernesto (construir desde el PC, después del martes 20 por créditos): 0,5 % para la dependienta que despacha + botón «Cerrar el día»; números de pedido seguidos.

## 3 · APROBADO por Ernesto (18-oct 08:40): sistema más simple para mensajeros (pedido de Lennys)
1. Cuando la tienda recibe el dinero (cobro marcado en Ventas o en la caja), el pedido queda **entregado** solo y se avisa a la gestora. El mensajero ya no tiene que escribir nada.
2. Botón «Entregado» en el vale: enlace al área del mensajero con el pedido ya abierto.
3. Menos mensajes del bot a los mensajeros: el vale y un solo recordatorio de la hora.
4. Transferencia: la marca la tienda y el pedido se cierra solo.
Detalle: docs/nexo-business/lennys/pedidos-lennys-2026-10-18.md (repo). Lo construye la sesión del PC (Core); con créditos justos hasta el martes, empezar por el punto 1.
