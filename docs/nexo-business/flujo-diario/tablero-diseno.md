# Tablero único del móvil — diseño (Etapa 1: Ernesto y Lennys)

30-oct-2026 · Sesión «tablero único» (D126, frente 2) · **Solo diseño: no hay nada programado ni desplegado.**
Boceto con datos de ejemplo: `tablero-boceto.html` (ábrelo en el móvil).

## 1. Qué es, en una frase
Una página ligera en el móvil que abre con un enlace personal y enseña **un semáforo del día** (verde / amarillo / rojo) y, debajo, solo lo que esa persona tiene que mirar. No manda mensajes ni cambia nada: lee y enlaza a la página donde se actúa (Ventas, panel, bandeja de decisiones).

## 2. Dónde vive (recomendación: página nueva dentro de Core)
- **`casaviva.company/tablero/`**, una clase nueva `CVD_Tablero` en el plugin `casa-viva-dropship-core` (hoy 3.14.92) y sus archivos `assets/tablero.{js,css}`.
- Por qué en Core: ya tiene los pedidos, la entrega, el dinero, las reservas y los cierres; ya tiene el patrón de enlace firmado de Pa'llá; y cada tienda NEXO con web tendrá su propio Core.
- **No sustituye** a lo que existe, lo enlaza:
  - `/control/` (centro privado de Ernesto, Codex, 11 vistas): sigue siendo el sitio para leer conversaciones y casos a fondo. El tablero solo da el resumen y un botón «Ver en el centro».
  - `/control/decisiones/` (bandeja del semáforo de decisiones, D105): el tablero cuenta las pendientes y lleva ahí para decidir.
  - `/ventas/` y «Cerrar mi turno» (D122) y el panel de Lennys: el tablero cuenta y avisa; para cobrar, cerrar, pagar o publicar se abre esa página.
- Por qué no ampliar `/control/`: vive fuera del plugin (`public_html/control/`), entra solo con la sesión de WordPress del usuario 1, pesa ~60 KB de JS y no está pensado para roles ni para otras tiendas.

## 3. De dónde sale cada dato (comprobado hoy, solo lectura)
Dos mitades. **Core** calcula lo suyo al momento (caché de 60 s). **El VPS** manda cada 3 min un resumen pequeño con lo que vive en Supabase (WordPress no tiene claves de Supabase y así sigue).

| Tarjeta | Fuente real | Hoy en producción |
|---|---|---|
| Pedidos por estado | `wp_wc_orders` (HPOS activo) + meta `_cvd_operation_status` (new, preparing, ready, with_courier…) y `_cvd_delivery_status` (unassigned, offered, assigned, accepted, picked_up, delivered, cash_returned, closed…) | 20 abiertos: 5 nuevos, 7 listos, 8 con mensajero |
| Quién lo lleva | meta `_cvd_messenger_user_id` + nombre del usuario (rol `cvd_messenger`, 38) | 4 aceptados, 3 recogidos, 1 sin mensajero |
| Atrasos | regla que **pasa a Core** (umbrales en configuración) sobre `_cvd_delivery_accepted_at`, `_cvd_delivery_date`, `_cvd_reserva_hasta` y `wp_cvd_order_events`; Core la publica en un endpoint y **el bot la lee** (acordado con «menos mensajes», así hay una sola verdad) | Hoy vive en el bot: `src/carreras-atascadas.js` (carrera de ayer sin recoger a las 11:00) y `src/dinero-calle.js` (24 h → mensajero, 48 h → Lennys). Se copian esos mismos umbrales |
| Dinero en la calle | `CVD_Messenger_Cash::pending()` (marca `_cvd_cash_store_received_*`) | 5 pedidos con dinero sin llegar a la tienda |
| Cierre del día | `wp_cvd_cierres` (D122: firmado por persona, `expected/counted/diff_usd/_mn`) | 0 cierres firmados todavía (se empieza con Zaymi) |
| Salidas por aprobar | `wp_cvd_payouts` estado `requested` / `approved` | 2 pedidas, 3 aprobadas sin pagar |
| Catálogo | postmeta `_cvd_auto_revision` (D125: pendiente / ok / corregir) | 938 fichas esperando el ✓/✗ de Lennys |
| Entregas de mañana | meta `_cvd_delivery_date` (formato `AAAA-MM-DD`) | sí hay pedidos con fecha 31-oct |
| Decisiones | `control-private/bandeja.json` (lo escribe el VPS cada minuto, `bandeja-decisiones.mjs`); Core lo lee del disco | el mismo archivo que usa `/control/decisiones/` |
| Errores del bot | Supabase `crm_errores` (`tipo`, `gravedad`, `estado`, `contacto`, `pedido`, `que_paso`) → resumen del VPS | 7 días: 59 (41 «para decidir»: 12 alta, 24 media, 5 baja; 18 corregidos). Tipos: invento 19, entendió mal 14, promesa 9 |
| Salud | `/root/vigilante/estado.json` (lo que enseña `cv salud`) → resumen del VPS | 🟢 web 200 en 0,4 s, bot online, buzón 0 atascados |
| Mensajes del bot por persona | Supabase `crm_messages` (`direction='out'`, `author='bot'`, `contact_id`) + `crm_contacts` (nombre) → resumen del VPS. Aparte, `crm_outbox` (`to_phone`, `to_group`, `created_by`, `status`) para envíos del buzón, grupos y fallos | `crm_messages`: 314 del bot en 24 h. `crm_outbox`: 135 en 24 h, 881 en 7 días (claude 307, novedades 189, avisos-mensajeros 79) |
| Rol de cada persona | El rol del **WordPress** (`cvd_messenger`, `cvd_clerk`, administración en `cvd_negocio`), no el del CRM | 8 mensajeros tienen rol «gestora» en `crm_contacts` (Ely, Fernando, Chadecita, Max, Adrian, Ela, Daiquel, Thaly): se cuentan como mensajeros |
| Tareas para mañana | no hay tabla de tareas: se junta de `crm_supervisor` estado `pendiente` (8 hoy), entregas y reservas de mañana, pagos aprobados sin pagar y decisiones que caducan | cuando el Pilar 1 cree su tabla de promesas, entra aquí |

**Cómo llega el resumen del VPS:** un script `tareas/tablero-resumen.mjs` (cron cada 3 min) hace `POST /casa-viva/v1/bot/tablero/resumen` con la misma llave del bot (`x-vivabot-key`, ya usada por todo `/bot/*`). Core lo guarda (opción sin autoload, con la hora). Es HTTPS, no un SSH más (ya hay 2 SSH por minuto del VPS a la web). Si el resumen tiene más de 10 min, la tarjeta sale en amarillo con «dato de hace X min»; nunca enseña un cero que no sea verdad.

## 4. Las dos vistas de la Etapa 1
**Ernesto (dueño):** semáforo · «Lo urgente» (máx. 3 líneas) · Errores del bot (abiertos por gravedad y tipo, los 3 últimos con 1 línea) · Decisiones (cuántas, cuántas caducan hoy → bandeja) · Salud (las 5 líneas de `cv salud`) · Mensajes del bot hoy por persona (nombre, rol, cuántos; en ámbar si un mensajero pasa de 3; no es un tope, D126 no pone límite: es solo una señal, y el número va en la configuración) · Mañana · y un botón «Ver como Lennys».
**Lennys (administración):** semáforo · Pedidos por estado · Atrasos (#N, qué falta, quién lo lleva, desde cuándo) · Mensajeros (carreras y dinero que tiene cada uno) · Dinero (cierre de cada dependienta: firmado o no, diferencia; dinero en la calle) → «Abrir Ventas» · Salidas por aprobar (comisiones pedidas) → panel · Catálogo (fichas por revisar, bajo pedido nuevos) → panel.
Lennys **no** ve errores del bot, conversaciones ni cuántos mensajes manda el bot (es cosa de Ernesto).
Después (Etapa 2): dependienta (lo que llega hoy, recogidas, reservas, dinero por recibir, su cierre), mensajero (mis carreras, mi dinero; ya lo tiene Pa'llá: se enlaza), gestora (mis pedidos y comisiones; ya lo tiene su oficina: se enlaza).

**Semáforo del día** (cada vista solo mira sus tarjetas; enseña las 1–3 razones):
- 🔴 Rojo si: web o bot caídos · error de gravedad alta de hoy sin decidir · cierre firmado con diferencia sin explicar · dinero en la calle más de 48 h · pedido atrasado más de 24 h.
- 🟡 Amarillo si: atrasos de menos de 24 h · dinero en la calle más de 24 h · comisión pedida hace más de 24 h · decisiones que caducan hoy · dato del VPS viejo · cierre sin firmar pasada la hora de cierre.
- 🟢 Verde: nada de lo anterior.
Todos los umbrales (24 h, 48 h, hora de cierre) van en la configuración del negocio.

## 5. Cómo se protege
- **Enlace firmado por persona**, igual que Pa'llá: `id.caduca.firma` con HMAC (`wp_salt('auth')` + «cvd-tablero»), 30 días, y una «época» por usuario: subirla anula todos sus enlaces de golpe (si pierde el móvil).
- El rol **no va en el enlace**: sale de la configuración (`personas`: usuario → rol). Si alguien cambia el enlace, no ve más.
- Al abrir, el enlace se cambia por una cookie `HttpOnly` y la dirección queda limpia (no se queda la firma en el historial ni en una captura). También entra con la sesión normal de WordPress si tiene rol en la configuración.
- Nada de datos personales de más: **ningún teléfono** en la página; clientes solo como «#5729»; los textos de `crm_errores` cortados a 90 letras y solo para Ernesto; nunca el cuerpo de un mensaje.
- `noindex`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store` en los datos; límite de 30 lecturas por minuto por enlace; se apunta quién entró y cuándo.
- Etapa 1 **solo lee**: no hay un botón que cambie un pedido, dinero o mensaje. Las acciones siguen en sus páginas, con sus permisos.

## 6. Multi-negocio (nada de Casa Viva en el código)
- Un Core = un negocio. Todo lo propio va en una opción `cvd_negocio` (y su pantalla de ajustes):
  `{ business_id, nombre, zona_horaria: "America/Havana", monedas: ["USD","CUP"], hora_cierre: "17:30", silencio: "22:00-07:30", umbrales: { atascada_hora: "11:00", atraso_h: 24, calle_h: 24, calle_rojo_h: 48, comision_h: 24, senal_mensajes_mensajero: 3 }, personas: { "1": "dueño", "<id Lennys>": "administracion" }, enlaces: { panel, decisiones, centro, ventas }, textos: {…} }`
- Roles genéricos: dueño, administración, dependienta, mensajero, gestora. Los nombres de las personas salen de WordPress, no del código.
- El script del VPS recibe el `business_id` y la dirección de destino (fila de `crm_settings` por negocio) y filtra todo `crm_*` por `business_id`. Otra tienda = otra fila, mismo script.
- Colores: los tokens de `apps/business-pos/src/nexo.css`; cada negocio solo los sobrescribe (como `themes/casaviva.css`). Logo animado mientras carga, ligero, respetando «menos movimiento».

## 7. Ligero para internet lento
- 1 página (~12 KB comprimida, CSS y JS dentro, sin librerías ni fotos) + 1 lectura de datos (~6–10 KB) con `ETag` (si nada cambió, responde 304 y casi no gasta datos).
- Se actualiza cada 2 min solo si la pantalla está a la vista; botón «Actualizar».
- PWA: se puede «Añadir a pantalla de inicio»; sin conexión enseña lo último con «visto hace X min».

## 8. Cómo se construye (tras el SÍ de Ernesto)
1. **Core 1a** — `CVD_Tablero` + enlace firmado + vistas con datos de Core + `bandeja.json`. Archivos nuevos; una sola línea en `class-cvd-plugin.php` para cargarlo (archivo compartido: se avisa antes a web-maraton). Interruptor `cvd_tablero` = si | no.
2. **VPS 1b** — `tablero-resumen.mjs` + ruta `POST /bot/tablero/resumen`. Prueba en seco (sin guardar) antes del cron. Endpoint `GET /bot/atrasos` con la regla de atraso de Core: se avisa a «menos mensajes» para que el bot lo lea en lugar de `carreras-atascadas.js` y `dinero-calle.js`.
3. **Móvil 1c** — prueba en el móvil de Ernesto con red lenta simulada; luego Lennys. «Ya funciona» solo después de verlo en los dos móviles.
- Copia y vuelta atrás: copia `~/bak-AAAAMMDD-cvd-<vieja>-antes-tablero`; volver = `cvd_tablero = no` o restaurar la copia; quitar la línea del cron. No toca tablas existentes ni crea ninguna.

## 9. Decisiones para Ernesto (mi recomendación primero)
1. **Dónde:** página nueva `/tablero/` en Core (recomendado) · o ampliar `/control/`.
2. **Datos del VPS:** el VPS los manda por HTTPS cada 3 min con la llave del bot (recomendado) · o por SSH como `/control/`.
3. **Acceso de Lennys:** enlace de 30 días que le das tú en persona o por tu chat (recomendado; el bot no le escribe) · o entra con su usuario de la web.
4. **Lennys y los errores del bot:** no los ve (recomendado) · o ve solo los que tocan dinero o pedidos.

## 10. Etapa 2 propuesta (3-nov): decisiones de un toque para Lennys — SIN CONSTRUIR, espera el SÍ de Ernesto
Viene de `docs/nexo-business/lennys-necesidades-y-cuellos-2026-11-03.md` (Vigía). Ya está EN VIVO (solo lectura): «Pagos por hacer» con un toque a «Pagar a…», el tope de salidas y la meta de ≤ 10 mensajes a Lennys en la vista de Ernesto.
- **Qué entra (orden):** 1) aprobar o rechazar una comisión pedida (hoy en el panel); 2) una salida del cajón por encima del tope; 3) precio y comisión de un producto nuevo que mandan Sairi/Zayri; 4) cancelar una recogida que pasó de 24 h.
- **Cómo se ve:** una tarjeta por decisión con la propuesta ya hecha («Aprobar 8.900 CUP a Cary»), el efecto en dinero y 3 botones: **Sí / No / Cambiar** (Cambiar abre un campo con el número).
- **Cómo se hace:** cada botón llama al MISMO camino que ya usa la web (aprobar pago = `CVD_Payouts`; cancelar = `CVD_Order_Transition_Service`), nunca un atajo. Antes de responder «hecho» se lee el resultado; si falla, dice «no se pudo: …».
- **Lo decidido no vuelve:** cada decisión tiene una clave; tomada una vez, desaparece y queda en la línea de tiempo con quién y cuándo. El bot la lee y deja de preguntarla.
- **Seguridad:** solo la vista de administración (Lennys) y el dueño; 10 s para deshacer; nada por encima de lo que hoy puede hacer Lennys en el panel; registro de cada toque.
- **Decisión para Ernesto:** ¿empiezo por el punto 1 (comisiones pedidas) y lo pruebo con un pago real de Lennys antes de seguir?
