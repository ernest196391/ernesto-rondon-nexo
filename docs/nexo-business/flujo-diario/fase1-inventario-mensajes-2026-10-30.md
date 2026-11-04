# Fase 1 — Inventario de mensajes automáticos a trabajadores (30-oct-2026)

Trabajo **solo de lectura**: no se cambió código, no se escribió en la base y no se envió nada.

**Fuentes**
- Código que corre en el VPS: rama `ccr-f459b3eb-utyhix`, commit `7b251d1` (sin cambios locales en el VPS). Lo leí desde el clon `C:\Users\Ernesto\vivabot` con `git show 7b251d1:…`.
- Crontab del VPS (`crontab -l`), pm2 (`vivabot` y `pm2-logrotate`), guiones de `/root/supervisor/tareas/`.
- Web: plugin Core 3.14.92 (`casa-viva-dropship-core`), `wp cron event list`, opciones de Pa'llá.
- Supabase `nexo-production`: `crm_messages`, `crm_outbox`, `crm_contacts`, `crm_dispatch` (registro), `crm_errores`.

**Ventana de los números:** 24-oct 00:00 → 30-oct 15:36 (hora de Cuba). Es lo mismo que «las últimas 7 × 24 h»: da exactamente las mismas cifras.
Las cifras «al día» son el total ÷ 7, redondeadas.

**Cómo se cuenta un mensaje del bot:** fila de `crm_messages` con `direction = out` y `author = bot`. El buzón (`crm_outbox`) también deja ahí cada envío, así que esa tabla tiene todo: respuestas de la IA, textos fijos y avisos. El origen de cada aviso sale de `crm_outbox.created_by`, cruzando teléfono + texto.

---

## Lo más importante (resumen corto)

1. **Los 15 mensajeros del CRM recibieron 245 mensajes del bot en 7 días** (35 al día) y escribieron 186. Las cifras por persona coinciden con las de partida.
2. **Hay 8 mensajeros más que el CRM tiene como «gestora»** (Ely, Fernando, Chadecita, Max, Adrian, Ela, Thaly y Daiquel). Recibieron otros **167 mensajes de mensajería**. El volumen real a mensajeros es de unos **412 en 7 días** (59 al día).
3. De los 245, solo **unos 60 (1 de cada 4) cumplen la regla de Ernesto**: el vale, un cambio o un atraso. El resto son preguntas de hora, «¿ya entregaste?», dinero y confirmaciones, que deben pasar a botones de Pa'llá, y respuestas de la IA.
4. **Pa'llá todavía no puede recibir esos botones**. Sus avisos al teléfono (ntfy) están en **modo prueba con 2 probadores** y solo para «carrera libre». Antes de quitar las preguntas de WhatsApp hay que tener Pa'llá en uso. Si no, se pierden las horas.
5. **Core manda un correo «Nueva carrera disponible»** a unas 24 cuentas de Gmail de mensajeros. Fueron unos **390 correos en 7 días**: repite lo que ya sale en el grupo.
6. **Nana y Zaymi: 175 mensajes en 7 días.** 86 son preguntas de gestoras, una por mensaje, y **31 de ellas eran reenvíos** de la misma pregunta.
7. **Lennys: 137 mensajes en 7 días.** Hay 27 «Anotado / Se lo paso a Ernesto» de la IA. Desde el 29-oct, las comisiones ya le llegan juntas a las 10:00 y a las 16:00.
8. **Errores del bot: 136 registrados (22 al 29-oct), 55 en los últimos 7 días.** De esos 55, 41 están «para decidir». El fallo que más se repite es **inventar un dato** (producto, horario o dinero). Después vienen **«anotado» o «ya lo registro» sin registrar nada**.

---

## Entrega 1 — Inventario de mensajes automáticos a trabajadores

Columnas: **Origen** (archivo:función o línea de cron) · **A quién** · **Canal** · **Cuándo** · **7 días / al día** (real) · **¿Pide acción?**

### A. Mensajeros (WhatsApp privado, salvo que se diga otra cosa)

| # | Mensaje | Origen | Cuándo | 7 días (15 del CRM + 8 «gestora») · al día | ¿Pide acción? |
|---|---|---|---|---|---|
| M1 | **Vale** «📋 VALE · Pedido #N…» | `src/dispatch.js` (texto en la línea 959; asignación directa `processDirect`, «Yo» en el grupo, relevo) | Al coger o asignar una carrera | 41 + 39 = **80 · 11/día** | Sí (ir a recoger) |
| M2 | Relevo «🔁 X soltó la carrera y te toca a ti» (sale justo antes del vale) | `src/dispatch.js:815` | Cuando la suelta otro y él estaba en reserva | 6 + 0 · ~1/día | No (avisa del vale) |
| M3 | **«¿a qué hora vas al #N?»** (3 textos: «🔔 …» del vigilante, «¿A qué hora puedes ir…?» y el corto, desde el 28-oct) | `src/dispatch.js` `watchdog()` (aviso «sin hora»; para otro día, a las 8:00) y `dispatch.js:1481` (si escribe otra cosa sin dar la hora). Texto en `src/dispatch-rules.js` `timeAskText` | 15–30 min después del vale; 8:00 si la entrega es otro día | 27 + 26 = **53 · 8/día** (el registro de `crm_dispatch` da 67 a todos) | Sí (dar la hora) |
| M4 | **«sigo sin la hora del #N 🙏»** | `src/dispatch.js:616` (`watchdog`, `timeReminderText`) | 30 min después de la pregunta, una vez (desde el 28-oct) | 2 + 6 = **8 · ~3/día desde el 28-oct** | Sí |
| M5 | **9:30 y 14:30 «Tienes un vale sin entregar · pasa por la tienda / ¿ya lo entregaste? escribe entregado #N»**. Desde el 29-oct: «¿ya entregaste el #N?» o «te espera en la tienda» | `src/avisos-mensajeros.js` `avisosOnce()` (franjas y textos en `src/avisos-mensajeros-rules.js`), buzón `created_by avisos-mensajeros` | 9:30 y 14:30, a cada uno con vales abiertos | **79 · 11/día** (45 a los 15 + 33 a mensajeros con rol gestora + 1) | Sí (recoger o escribir «entregado») |
| M6 | **«💵 Antes de las 4:00 p. m. lleva a la tienda el dinero de #N»** (solo o dentro del M5) | `src/avisos-mensajeros.js` (franja de las 14:30 con `mergeMoney`; los importes salen de `src/dinero-aviso-rules.js`) | 14:30, salvo domingo | Va dentro de 9 avisos de los 15 + 9 de los otros 8 = **18 · ~3/día** | Sí (llevar el dinero) |
| M7 | **«Anotado: #N <hora>. Es un pedido de <gestora>: se lo aviso…»** | `src/dispatch.js` `applyEta()` | Al dar la hora | 18 + 23 = **41 · 6/día** | No |
| M8 | **«✅ #N entregado. Lleva a la tienda X…»** | `src/dispatch.js` `deliveredDM()` (importe con `src/dispatch-rules.js`) | Al escribir «entregado #N» o pulsarlo | 20 + 23 = **43 · 6/día** | No (dice cuánto llevar) |
| M9 | «✅ El #N ya consta como entregado» | `src/dispatch.js:1560` | Si repite «entregado» | 7 + 3 = **10** | No |
| M10 | «Listo, soltaste la carrera #N…» | `src/dispatch.js:880` | Al escribir «suelto» | 5 + 3 = **8** | No |
| M11 | «Ya lo tenía anotado: #N…» | `src/dispatch.js:1254` | Si repite la hora | 1 | No |
| M12 | Respuestas fijas a una orden: «No tienes activo el #N», «no lo tienes asignado tú», «El #N ya es tuyo», «ya no se puede asignar», «Para marcarlo… respóndeme entregado #N» | `src/dispatch.js:742/1174/1430/1577/1608`, `src/orderstatus.js:104`, `src/delivery-change-rules.js:189/198` | Al escribir una orden | 8 | A veces |
| M13 | Ficha de estado «📦 *Pedido #N* · 🕐 Aceptada / Entregado al mensajero…» | `src/orderstatus.js:108` | Si pregunta «#N» | 5 | No |
| M14 | «ℹ️ La carrera #N ya no es tuya / X le pasó la carrera a…» | `src/dispatch.js:881` y `:1090` | Si se la quitan o se la pasan | 3 | No (es un cambio) |
| M15 | «El pedido #N se canceló… devuélvelo» / «Cambió el pedido #N» | `src/avisos-pedido.js` (Core `/bot/order-avisos`, textos en `src/avisos-pedido-rules.js`), `created_by avisos` | Al cancelar o cambiar en Core | 3 + 1 | Sí (cancelación) / revisar (cambio) |
| M16 | «ℹ️ El cliente del #N aún no confirma la hora. Llámalo» | `src/dispatch.js` `watchdog()` | Solo pedidos que no son de gestora | 0 | Sí |
| M17 | «📱 Aquí tienes tu enlace de Pa'llá» | `src/dispatch-rules.js:870` | Cuando lo pide o al darle acceso | 7 + 7 | Sí (abrir la app) |
| M18 | «Dinero en la calle»: 24 h sin llevar el dinero, con el importe exacto (a las 48 h va a Lennys) | `src/dinero-calle.js` (cada 5 min de 7:30 a 22:00), `created_by dinero-calle` | 24 h después de la entrega | 0 + 1 (empezó el 28-oct) | Sí |
| M19 | «Carrera atascada: ¿la recoges hoy?» | `src/carreras-atascadas.js` | 11:00, carreras de un día anterior sin recoger | 0 + 1 (empezó el 30-oct) | Sí |
| M20 | «Gracias, ya le aviso a la dependienta» (cuando dice que dejó el dinero) | `src/dinero-aviso.js` (texto en `src/dinero-aviso-rules.js:156`) | Al escribir «ya lo dejé» | 1 + 1 | No |
| M21 | **Respuestas de la IA** (ver los subtipos en la Entrega 2) | `src/brain.js` (respuesta general) | Cuando escribe algo que no es una orden | 31 (de los 15) | Mixto |
| M22 | Mensajes del supervisor Claude o de sesiones (`cv enviar`, `created_by claude`) | `/root/supervisor` y sesiones de Claude | A mano o por reglas del supervisor | 15 (de los 15) | Mixto |
| M23 | **Correo «Nueva carrera disponible · Casa Viva»** | Core `includes/class-cvd-delivery.php:525` `notify_offer()` (`wp_mail` a cada mensajero invitado) | Cada vez que sale una carrera | **~391 correos a Gmail** en pedidos desde el 23-oct (608 invitaciones; 391 a cuentas Gmail) · **~52/día**. No pude comprobar si llegan | Sí (coger la carrera) |
| M24 | Correo «Nueva entrega Casa Viva · Pedido #N» | Core `class-cvd-delivery.php:449` (asignación directa) | Al asignar directo | ≤33 (asignaciones directas desde el 23-oct) | Sí |
| M25 | Aviso al teléfono de **Pa'llá** (ntfy y web push): «🛵 Carrera libre», y apagados «Te asignaron», «se canceló», «ya no es tuya», «cambió» | Core `includes/class-cvd-palla-push.php` | Al guardar el pedido | **~0 a mensajeros reales**: `cvd_palla_push = prueba`, probadores 59 (Daiquel) y 161 (cuenta de prueba); tipos solo «offer» | Sí |
| M26 | Grupo **Mensajerías**: 9:00 «carreras de hoy + dinero antes de las 4» y 17:00 tarjeta del día | `src/grupo-diario.js` (`created_by grupo-diario`) | 9:00 y 17:00 | 6 · ~1/día | No |
| M27 | Grupo **Mensajerías**: «🛵 CARRERA #N… El primero que responda Yo» + «🔔 Sigue libre» | `src/dispatch.js` `startDispatchLoop()` y `remindOpen()` (cada 60 s, como mucho 10 veces, de 8:00 a 21:00) | Al marcar «Listo para salir» | 40 publicadas + 1 «sigue libre» · 6/día (registro de `crm_dispatch`) | Sí (decir «Yo») |

Los recordatorios del cambio de entrega (`src/index.js:1688`, cada 5 min) van a Ernesto, no al mensajero.

### B. Dependientas (Nana y Zaymi, solo a la de turno)

Todo lo que es «de tienda» pasa por `src/tienda-turno.js`. Fuera de 10:00–17:00 queda en cola y a las 10:00 sale en un solo mensaje («Tienes N avisos…»).

| # | Mensaje | Origen | Cuándo | 7 días · al día | ¿Pide acción? |
|---|---|---|---|---|---|
| D1 | Resumen «Buenos días · Para hoy: N recogidas y N paquetes» (imagen) | cron `0 10 * * *` `/root/supervisor/tareas/resumen-manana.sh` → `scripts/resumen-diario.mjs --enviar=dependientas` | 10:00 | 7 · 1/día | Sí (lista del día) |
| D2 | **Pregunta de una gestora relevada** «Hola Nana 👋 Por privado / En el General, X pregunta…» | `src/preguntas.js` (preguntas abiertas) + `src/tienda-turno.js` | Al momento (10:00–17:00) o a las 10:00 | **86 · 12/día**. Con 2 del supervisor que usan el mismo formato son 88 envíos de 57 preguntas distintas: **31 reenvíos** (hasta 4 veces la misma) | Sí (contestar) |
| D3 | «Hay N preguntas de gestoras sobre productos» + enlace | `src/ficha-contesta.js` (Core `/bot/ficha-contesta/pendientes`) | Cuando hay preguntas nuevas | 11 · ~2/día | Sí |
| D4 | «Para completar la ficha de la web (se vendió en el pedido #N)…» | `src/fichas.js` (cada 12 min, con tope) | Producto vendido con la ficha incompleta | 12 · ~2/día | Sí |
| D5 | Paquete «Tienes N avisos de la tienda (van juntos…)» | `src/tienda-turno.js` (cola) | 10:00 o al abrir turno | 5 | Mixto |
| D6 | **16:15 «Dinero que sigue sin llegar a la tienda»** | `src/dinero-aviso.js` | 16:15, salvo domingo | 4 · ~1/día | Sí |
| D7 | «X dice que ya dejó en la tienda el dinero de #N: cuéntalo y pulsa Dinero recibido» | `src/dinero-aviso.js` (`created_by dinero-aviso:depositado`) | Cuando el mensajero lo dice | 2 | Sí |
| D8 | «💵 Pago a una gestora: X viene a cobrar. Dale N» | `src/avisos-pago.js` (Core `/bot/payout-avisos`) | Cuando la gestora pide cobrar en efectivo | 9 (+ los que van en D5) · ~1/día | Sí |
| D9 | Estado de pedidos propios o consultados («📦 listo», «✅ ya lo recogió») | `src/orderstatus.js` | En cada paso | 7 | No |
| D10 | «🗂️ El pedido #N de recogida se canceló solo» | Recogidas del bot (`recogidas_auto`) | 24 h listo sin recoger | 2 | No |
| D11 | «🧾 Comparé la hoja con la web…» | `src/cierre-hoja.js` | Al mandar la foto de la hoja | 1 | Sí, si hay diferencia |
| D12 | Compra bajo pedido («Llegará del proveedor…») | `src/bajopedido-engine.js` | Venta de proveedor | 1 | Sí |
| D13 | Lista del catálogo del día (fotos y datos que faltan) | cron `30 10 * * *` `tareas/catalogo-turno.mjs` | 10:30 | El 30-oct le llegó a Zaymi (`created_by claude`). El comentario del código dice que desde el 30-oct va a Lennys | Sí |
| D14 | Avisos de la tarjeta de carrera (recogí, llegó…) | `src/carrera-avisos.js` → cola de turno | Botón de la tarjeta | 2 (en cola) | Mixto |
| — | Respuestas de la IA / supervisor Claude (guías paso a paso incluidas) | `src/brain.js` / supervisor | — | 5 / 23 | — |

**Total dependientas:** 175 en 7 días (Nana 131, Zaymi 44). Ellas escribieron 65.

### C. Lennys (admin)

| # | Mensaje | Origen | Cuándo | 7 días · al día | ¿Pide acción? |
|---|---|---|---|---|---|
| L1 | Resumen administrativo + Cuadre del día (2 imágenes) | cron `0 20 * * *` `tareas/resumen-noche.sh` → `scripts/resumen-diario.mjs --enviar=ernesto,lennys` | 20:00 | 14 · 2/día | En parte (dinero y decisiones) |
| L2 | «💱 Tasa de hoy» / «⚠️ Tasa de hoy SIN elToque» | cron `50 8 * * *` `scripts/tasa-diaria.mjs` (reintentos `20,50 9-11`) | 8:50 (o hasta las 11:50) | 8 · 1/día | Solo cuando dice «SIN elToque» |
| L3 | «💸 X pide su comisión» | `src/avisos-pago.js` (Core) | Al momento hasta el 28-oct; desde el 29-oct **en lote a las 10:00 y a las 16:00** | 18 sueltos + 2 lotes · 3/día | Sí (pagar) |
| L4 | «💵 Salida del cajón #N… ¿SALIDA SI/NO?» | `src/salidas.js` (cada 2 min de 7:30 a 22:00) | Cuando la caja registra una salida | 4 | Sí |
| L5 | «🧾 Comparé la hoja…» | `src/cierre-hoja.js` | Foto de la hoja | 1 | Sí, si hay diferencia |
| L6 | Estado de SU pedido (Lennys también vende) | `src/orderstatus.js` | En cada paso | 2 | No |
| L7 | «48 h con el dinero en la calle» | `src/dinero-calle.js` | 48 h | 0 (empezó el 28-oct) | Sí |
| L8 | Respuestas a «#supervisor» | cron `* * * * *` `run-orden-lennys.sh` (Claude en el VPS) | Cuando ella escribe #supervisor | dentro de «supervisor» | Mixto |
| L9 | IA: «Se lo paso a Ernesto 🙏» | `src/brain.js` | — | 8 | No |
| L10 | IA: «Anotado / lo anoto / lo reviso mañana» | `src/brain.js` | — | 19 | No (y casi nunca queda registrado) |
| — | Otras respuestas de la IA / supervisor Claude (guías incluidas) | — | — | 22 / 39 | — |

**Total Lennys:** 137 en 7 días (~20 al día). Ella escribió 279.

### D. Gestoras (63 contactos con rol gestora, sin Nana ni Zaymi)

**Total:** 1.377 del bot en 7 días (~197 al día). Ellas escribieron 1.420.

| # | Mensaje | Origen | 7 días | ¿Pide acción? |
|---|---|---|---|---|
| G1 | Estado de SU pedido: «🛵 el mensajero va a las X», «📦 listo para recoger», «✅ entregado / ya lo recogió» | `src/orderstatus.js` (pasos) y `src/dispatch.js` («hora (pedido de gestora)», 40 en el registro) | 260 · 37/día | Sí, en parte (avisar a su cliente) |
| G2 | Pago de comisión («Tu pago está listo», «Te pagaron») | `src/avisos-pago.js` (Core) | 28 | No |
| G3 | «La tienda contestó…» / «lo de «…»: la tienda dice…» | `src/preguntas.js`, `src/ficha-contesta.js` | 69 | No |
| G4 | Stickers | `src/stickers.js` | 30 | No |
| G5 | Fotos reales y archivos | `src/fotos-reales.js` | 18 | No |
| G6 | Mensajería a las 8 gestoras que también reparten (vales, hora, 9:30/14:30…) | igual que en la sección A | 187 | Igual que en la sección A |
| G7 | Supervisor Claude y sesiones | — | 115 | Mixto |
| G8 | Respuestas de la IA a sus preguntas | `src/brain.js` | 670 | Es conversación, no un aviso |

### E. Grupos (para tener el cuadro completo)

| Grupo | Origen | 7 días |
|---|---|---|
| Actualización de productos | cron `* * * * *` `tareas/novedades.mjs` (máx. `novedades_max_dia = 30`, uno por minuto de 9:02 a 19:00) + `grupo-diario` | 189 + 24 = **213 · ~30/día** |
| General | `src/grupo-diario.js` 9:00 / 17:00 / 19:00 + Claude | 12 + 14 |
| Mensajerías | sección A (M26 y M27) | 6 + 4 (+ 40 carreras publicadas directamente) |

### F. Apagado o que no va a trabajadores (comprobado)

- `#PAUSA-RESTRICCION`: `run.sh` (supervisor general), `general-sin-respuesta.mjs` y `parte-0900.mjs` están **apagados**.
- Las invitaciones VIP del 23 al 25-oct están **comentadas**.
- **Solo a Ernesto:** `seleccion-diaria` (8:40), `anuncio-revolico` (8:55 y 20:55), `errores-dia` (21:40), `radar-informe` (21:00, correo), `catalogo-informe` (lunes 9:00, correo), avisos `notifyOwner` del reparto (⏰ sin hora, 💬 el mensajero escribió…), `pausa-vigia`, `sospechosos`.
- **Sin mensajes:** `bandeja-decisiones`, `control-v2-run.py`, `escalaciones-cierre`, `puntos-calcular`, `catalogo-fichas`, `supplier-feed`.
- **WP-cron de Core:** solo `cvd_programa_diario` (calcula, no avisa) y `cvd_cleanup_delivery_locations`. Los avisos de Core a trabajadores no van por cron: el bot los recoge cada minuto (`/bot/order-avisos`, `/bot/payout-avisos`, `/bot/carrera-avisos`, `/bot/ficha-contesta`) o salen al guardar el pedido (correos y Pa'llá).
- `avisos_busca = prueba` (NEXO Busca → solo a Ernesto). `onboarding = no`.
- `saldo360` (31 envíos de `claude-saldo360`) va a vendedores externos, no a trabajadores.

---

## Entrega 2 — Volumen real de los últimos 7 días

### 2.1 Comprobación de los números de partida

| Número de partida | Real | ¿Coincide? |
|---|---|---|
| 245 mensajes a 15 mensajeros | **245** | ✅ Sí. Ojo: solo 12 de los 15 recibieron algo (Albertico, lopez y Rancel, 0) |
| Pedri 53 · Félix 53 · Ale 37 · Marlon 35 · la Matrix 27 | 53 · 53 · 37 · 35 · 27 | ✅ Sí |
| Los mensajeros escribieron 186 | **186** | ✅ Sí |
| 41 vales | **41** (+ 6 relevos «te toca a ti» que salen antes del vale) | ✅ Sí |
| 2 «sigo sin la hora» | **2** | ✅ Sí |
| 18 «¿a qué hora vas?» | **27**: 17 «🔔 …¿a qué hora vas?» + 9 «¿A qué hora puedes ir…?» + 1 corto nuevo | ❌ No. El 18 parece contar solo el texto «a qué hora vas» y deja fuera el «¿A qué hora puedes ir…?» |
| 16 «vales sin entregar» | **45 avisos de las 9:30 y 14:30**: 28 vales sin entregar, 3 vales + dinero, 5 solo dinero, 6 «¿ya entregaste?», 3 «te espera en la tienda» (1 con dinero) | ❌ No |
| 6 «dinero antes de las 4» | **5** avisos solo de dinero; el dinero sale en **9** de los 45 | ❌ No (cerca) |
| 47 confirmaciones | **65** respuestas fijas (detalle abajo). Contando solo Anotado + ✅ entregado + ya consta + soltaste + ya lo tenía, salen 51 | ❌ No |
| 114 «otros» (respuestas de IA) | **Solo 31 son de la IA.** Además hay 15 del supervisor Claude, 7 enlaces de Pa'llá, 6 cambios o cancelaciones y 6 relevos | ❌ No. Además, 18+2+16+6+47+41+114 suma 244, no 245 |

**Lo que falta en los números de partida:** los 8 mensajeros con rol «gestora» en el CRM. Por `crm_dispatch` son Ely (22 carreras desde el 20-oct, la que más reparte), Fernando, Daiquel, Chadecita, Max, Adrian, Thaly y Ela. Recibieron **167 mensajes de mensajería más**. Conviene cambiarles el rol o ponerles la etiqueta `mensajero`. El error #88 viene de lo mismo.

### 2.2 Por mensajero (los 15 del CRM)

| Mensajero | Total bot | Vale | Hora | 9:30/14:30 | Confirmaciones | Cambios | Pa'llá | IA | Supervisor | Escribió |
|---|---|---|---|---|---|---|---|---|---|---|
| Pedri | 53 | 13 | 7 | 11 | 13 | 3 | 1 | 4 | 1 | 55 |
| Félix Alexander | 53 | 7 | 7 | 9 | 16 | 0 | 0 | 12 | 2 | 46 |
| Ale | 37 | 9 | 6 | 6 | 10 | 3 | 1 | 1 | 1 | 21 |
| Marlon | 35 | 10 | 5 | 6 | 10 | 0 | 2 | 0 | 2 | 16 |
| la Matrix | 27 | 2 | 1 | 5 | 9 | 0 | 0 | 7 | 3 | 29 |
| Leonardo | 13 | 3 | 0 | 1 | 5 | 0 | 1 | 2 | 1 | 8 |
| D.C.M (Damián) | 10 | 1 | 1 | 5 | 1 | 0 | 0 | 1 | 1 | 2 |
| Melany | 7 | 0 | 0 | 1 | 0 | 0 | 0 | 4 | 2 | 4 |
| Frank Ernesto | 5 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 2 | 2 |
| 👑 (…5067) | 3 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| Hector | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| Ibelice | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| Albertico, lopez, Rancel | 0 | | | | | | | | | 0 |
| **Total** | **245** | **47** | **29** | **45** | **65** | **6** | **7** | **31** | **15** | **186** |

(«Vale» = 41 vales + 6 relevos. «Hora» = 27 preguntas + 2 «sigo sin la hora».)

**Los 8 mensajeros con rol gestora, solo mensajes de mensajería:** Ely 59 · Fernando 31 · Chadecita 27 · Max 21 · Adrian 11 · Ela 8 · Daiquel 6 · Thaly 4 = **167**.
Por tipo: 39 vales, 23 «Anotado», 23 «✅ entregado», 26 preguntas de hora, 6 «sigo sin la hora», 33 avisos de las 9:30 y 14:30, 7 enlaces de Pa'llá, 3 «ya consta», 3 «soltaste», y uno de cada: dinero en la calle, carrera atascada, «ya le aviso a la dependienta» y pedido cancelado.

### 2.3 Por tipo (los 15 del CRM), con un ejemplo corto

Los nombres de clientes se quitaron de los ejemplos.

| Código | Tipo | 7 días | Ejemplo |
|---|---|---|---|
| V1 | Vale | 41 | «📋 *VALE · Pedido #5431* 📅 Entrega: hoy …» |
| V2 | Relevo antes del vale | 6 | «🔁 X soltó la carrera #5427 y te toca a ti (estabas en reserva)» |
| H1a | «🔔 X, ¿a qué hora vas al #N? Respóndeme solo la hora» | 17 | (vigilante, hasta el 28-oct) |
| H1b | «¿A qué hora puedes ir al #N? Dime solo la hora… y se lo aviso a quien lo vendió» | 9 | (hasta el 28-oct) |
| H1c | «Félix, ¿a qué hora vas al #5666? (ej. hoy 5pm)» | 1 | (desde el 28-oct) |
| H2 | «Ale, sigo sin la hora del #5724 🙏» | 2 | |
| A1 | «Tienes un vale sin entregar: #N · pasa por la tienda / ¿ya lo entregaste? escribe entregado #N» | 28 | 9:30 y 14:30 |
| A1+$ | Lo mismo + «💵 Antes de las 4:00 p. m. lleva…» | 3 | 14:30 |
| A2 | «Recordatorio de Casa Viva: 💵 Antes de las 4:00 p. m. lleva a la tienda el dinero de #N (X USD)» | 5 | 14:30 |
| A3 | «Damián, ¿ya entregaste el #5581? Si sí, escribe entregado 5581» | 6 | desde el 29-oct |
| A4 | «El #N te espera en la tienda: pasa a recogerlo» (1 con dinero) | 3 | desde el 29-oct |
| K1 | «Anotado: #N hoy 11am. Es un pedido de <gestora>: se lo aviso…» | 18 | |
| K2 | «Ya lo tenía anotado: #N…» | 1 | |
| K3 | «✅ #N entregado. Lleva a la tienda 25 USD de los productos…» | 20 | |
| K4 | «✅ El #N ya consta como entregado 👍» | 7 | |
| K5 | «Listo, soltaste la carrera #N…» | 5 | |
| K6 | «No tienes activo el #N. Tus carreras activas: …» y similares | 8 | |
| K7 | «📦 *Pedido #N* · 🕐 Aceptada…» | 5 | |
| K8 | «Gracias, Félix 🙏 Ya le aviso a la dependienta (#5747, …)» | 1 | |
| C1/C2 | «El pedido #N se canceló: ya no hay que llevarlo» / «Cambió el pedido #N» | 2 / 1 | |
| C3 | «ℹ️ X le pasó la carrera #N a Y. Ya no tienes que hacer nada» | 3 | |
| P1 | «📱 Aquí tienes tu enlace de Pa'llá…» | 7 | |
| S | Supervisor Claude (VPS o sesiones) | 15 | «Melany, ya lo revisé 🙏 La #5436 la lleva Ernesto…» |
| I1–I5 | IA (abajo) | 31 | |

### 2.4 Las respuestas de la IA a los 15 mensajeros (31), por subtipo

**Regla de clasificación** (sobre el texto, en este orden; la primera que encaja gana):

1. Si el texto está en `crm_outbox` → tipo por `created_by` (`avisos-mensajeros`, `avisos`, `claude`, `dinero-calle`, `carreras-atascadas`).
2. Si es un texto fijo del código → V / H / K / C / P, por su comienzo exacto («📋 *VALE», «🔁 … te toca a ti», «sigo sin la hora», «¿a qué hora vas al» o «¿A qué hora puedes ir al #», «Anotado: #», «Ya lo tenía anotado», «✅ #N entregado», «ya consta como entregado», «Listo, soltaste», «No tienes activo» / «no lo tienes asignado tú» / «ya es tuyo» / «ya no se puede asignar» / «Para marcarlo», «ℹ️ … ya no es tuya», «📦 *Pedido #», «tu enlace de Pa'llá», «Ya le aviso a la dependienta»).
3. Si no, es IA:
   - **I1**: «soy el asistente de Ernesto», «aclararme», «darme los detalles», «confirmar a qué número».
   - **I2**: menciona a Ernesto o «lo reviso», «te aviso», «le aviso», «se lo paso», «déjame verificarlo», «el equipo».
   - **I3**: habla de entregado, recogido, dinero, USD o CUP.
   - **I4**: habla de carrera, libre, asignada o «la tomas».
   - **I5**: menos de 70 letras.
   - **I6**: el resto.

| Subtipo | 7 días | Ejemplo corto | ¿Sobra? |
|---|---|---|---|
| I1 Saludo o pide aclaración | 6 | «Hola, soy el asistente de Ernesto 👋 ¿Puedes aclararme un poco más…?» | Sobran ~4: dos son útiles, cuando no se entiende el pedido |
| I2 «Se lo paso a Ernesto / lo reviso» (promesa) | 15 | «Hola Matrix, perfecto, ya lo tengo. Se lo paso a Ernesto y él te confirma por aquí» | **Sobran 15**: promesas sin registro (ver errores) |
| I3 Confirma entrega, recogida o dinero sin regla fija | 5 | «Gracias por avisar, Félix. Actualizo que los dos vales ya fueron entregados» | **Sobran 5**: la IA no puede marcar entregas; debe ser botón o texto fijo |
| I4 Carrera libre o asignación por IA | 2 | «Ya te doy la carrera de la #5657…» (falso: no se la dio) | **Sobran 2**: la IA no asigna |
| I5 Acuse corto | 3 | «De nada, Félix. Aquí para lo que necesites. ¡Cuídate!» | **Sobran 3** |
| I6 Otra explicación | 0 | — | — |

**Sobran unas 29 de 31** respuestas de IA a mensajeros. Solo 2 dan algo útil: pedir aclaración cuando de verdad no se entiende.

**Lo que se queda con la regla de Ernesto:**
- 41 vales, con el relevo dentro del mismo mensaje.
- 6 cambios o cancelaciones.
- Los atrasos reales (dinero en la calle y carreras atascadas): 0–2 por semana.
- 7 enlaces de Pa'llá, que solo salen al pedirlos.
- ~2 aclaraciones.

Son **~56 de 245 (23 %)**. Los 15 del supervisor son manuales: se cuentan aparte.

### 2.5 Dependientas, gestoras y Lennys (resumen)

| Quién | Bot en 7 días | Ellas escribieron | Lo más grande |
|---|---|---|---|
| Dependientas (Nana 131 · Zaymi 44) | **175** | 65 | Preguntas de gestoras relevadas, 86 (31 reenvíos) · supervisor 23 · fichas 12 · «Hay N preguntas» 11 · pagos 9 · resumen 10:00 7 · paquetes de avisos 5 · 16:15 dinero 4 |
| Gestoras (63 contactos) | **1.377** | 1.420 | IA 670 · estado de su pedido 260 · mensajería a las 8 que reparten 187 · supervisor 115 · «La tienda contestó» 69 · stickers 30 · pagos 28 |
| Lennys | **137** | 279 | Supervisor 39 · IA 49 (19 «Anotado…», 8 «Se lo paso a Ernesto», 22 otras) · comisiones 18 + 2 lotes · resumen 20:00 14 · tasa 8 · salidas 4 |

---

## Entrega 3 — Errores del bot (`crm_errores`)

**Total registrado:** 136 errores, del 22 al 29-oct. El 22-oct se cargaron 69 de golpe, con lo atrasado. Los ids van del 1 al 137; falta el #78.
- 30-oct: todavía no hay registros (la revisión es a las 20:30–21:00).
- Los detectó Claude (123) y Codex (13).

| | Total | Últimos 7 días (desde el 24-oct) |
|---|---|---|
| Errores | 136 | 55 |
| Corregido | 91 | 14 |
| Para decidir | 43 (13 de gravedad alta) | 41 |
| Descartado | 2 | 0 |

**Por tipo (total · 7 días):**
- invento: 30 · 18
- entendió mal: 29 · 13
- no ayudó: 22 · 4
- técnico: 18 · 4
- regla: 16 · 5
- promesa: 14 · 8
- destino equivocado: 5 · 3
- interpretación: 1 · 0
- datos: 1 · 0

**Tipo × estado (7 días):**
- invento: 14 por decidir, 4 corregidos
- entendió mal: 10 / 3
- promesa: 4 / 4
- regla: 4 / 1
- no ayudó: 4 / 0
- técnico: 3 / 1
- destino equivocado: 2 / 1

### Top 10 de lo que más se repite

Los errores se agruparon a mano por su «lección». Entre paréntesis, los ids.

1. **Inventa datos de producto** (disponible, «no hay», color, medidas, material, enlace que no existe) — **16** (#18, 25, 26, 28, 32, 38, 86, 91, 95, 99, 103, 107, 110, 111, 117, 124). La mayoría de los nuevos siguen «para decidir».
2. **Preguntas del General que el filtro no ve o lee mal** (sin «?», seguimiento, logística, un comentario tomado como pregunta) — **13** (#16, 19, 20, 21, 23, 24, 34, 35, 36, 37, 41, 101, 123).
3. **«Anotado», «ya lo registro» o «ya lo corregimos» sin registrar nada** — **11** (#3, 43, 65, 82, 98, 105, 118, 120, 121, 122, 127).
   - En 7 días a Lennys hubo además 19 «Anotado…» y 8 «Se lo paso a Ernesto» de la IA.
   - A los mensajeros: 15 promesas «se lo paso a Ernesto».
   - Ninguno deja fila comprobada. `src/pendientes.js` ya obliga a comprobar el «anotado», pero solo cuando se usa `recordPendiente`.
4. **Mensajería y reparto**: «entregado» no encontrado, orden de pasar carrera sin respuesta, hora en dos mensajes, devolución sin respuesta, carrera cerrada que vuelve a circular, «no es tuyo» de un pedido ya entregado — **11** (#4, 54, 55, 58, 88, 89, 90, 96, 126, 128, 134).
5. **Dinero, comisiones o pagos inventados o mal calculados** (incluye el euro 1:1, 111 × 865 mal sumado, importe distinto del de Core) — **10** (#1, 56, 64, 80, 87, 94, 97, 104, 133, 136).
6. **No usa el producto del mensaje anterior** («¿de qué producto?», ofrece productos a un mensaje que no es de producto) — **11** (#13, 22, 29, 39, 60, 63, 81, 100, 108, 115, 135).
7. **Mensaje a la persona equivocada o como si fuera otra** — **8**:
   - contesta a Lennys como si fuera Ernesto (#106);
   - aviso de tienda a Nana con el turno a mano ya vencido (#129);
   - al proveedor como a un cliente (#52, 61, 75);
   - hora del pedido equivocado (#90);
   - «Hola Ernesto» a una gestora (#49);
   - respuesta de la tienda tomada mal (#2).
8. **Horarios inventados** (tienda de lunes a sábado, reparto hasta las 5, domingo, recogida 10–4 frente a 10–5) — **5** (#83, 93, 102, 109, 137).
9. **Supone de quién es un pedido o una cuenta sin leer Core** — **5** (#73, 76, 84, 113, 128).
10. **Bucles con contestadores automáticos o textos fijos** — **4** (#69, 71, 77, 119).

Otros que se repiten:
- Datos del vale mezclados con otro pedido (teléfono o nombre): #10, 51, 114.
- Tasa del día: #9, 67, 127.
- Promete fotos o enlaces y no los manda: #15, 30.

---

## Entrega 4 — Recomendación por cada mensaje

**Regla de Ernesto:**
- Al mensajero solo le llega el vale, y un aviso si algo está atrasado o cambió.
- La hora, «¿ya entregaste?», el dinero antes de las 4 y las confirmaciones pasan a botones de Pa'llá.

> ⚠️ **Antes de quitar nada:** los avisos de Pa'llá al teléfono están en prueba (`cvd_palla_push = prueba`: solo 2 probadores y solo «carrera libre»; `cvd_palla = prueba`). Si se quitan las preguntas de hora por WhatsApp antes de que los mensajeros usen Pa'llá, nadie dará la hora.
> Orden recomendado:
> 1. Pa'llá para todos, con los avisos «asignada», «cancelada» y «cambió».
> 2. El vale con un botón o enlace «Poner hora · Entregado» en Pa'llá.
> 3. Quitar las preguntas.
> Mientras tanto, un «entregado» o una hora escritos por WhatsApp siguen valiendo. La respuesta puede ser una **reacción ✅** en lugar de un mensaje.

### Mensajeros

| # | Mensaje | Recomendación | Motivo |
|---|---|---|---|
| M1 | Vale | **Se queda** | Es la orden de trabajo; que lleve el botón de Pa'llá («Poner hora», «Recogí», «Entregado») |
| M2 | Relevo «te toca a ti» | **Se junta** (una línea arriba del vale, un solo mensaje) | Hoy son 2 mensajes para lo mismo |
| M3 | «¿a qué hora vas?» | **Se vuelve botón** (Pa'llá «Poner hora») | Regla de Ernesto; son 53 en 7 días |
| M4 | «sigo sin la hora» | **Se quita** | Si no hay hora, el atraso lo avisan la tienda y Ernesto, y al mensajero M19 si de verdad se atrasa |
| M5 | 9:30 / 14:30 «vales sin entregar / ¿ya entregaste? / te espera en la tienda» | **Se vuelve botón** (Pa'llá «Mis carreras» con «Entregado») | Repite lo que el mensajero ya sabe; 79 en 7 días. Lo atrasado de verdad lo cubre M19 |
| M6 | «Dinero antes de las 4» | **Se vuelve botón** (Pa'llá «Debo a la tienda: X») | Regla de Ernesto; por WhatsApp solo el atraso (M18) |
| M7 | «Anotado: #N hora…» | **Se vuelve botón** (la pantalla de Pa'llá lo confirma); por WhatsApp, reacción ✅ | Confirmación sin acción; 41 en 7 días |
| M8 | «✅ #N entregado. Lleva X» | **Se vuelve botón** (Pa'llá enseña el importe al pulsar «Entregado»); por WhatsApp, reacción ✅ | Confirmación; el importe se ve en la app |
| M9 | «ya consta como entregado» | **Se quita** | Duplicado del M8 |
| M10 | «soltaste la carrera» | **Se vuelve botón** (Pa'llá «Soltar») | Confirmación |
| M11 | «Ya lo tenía anotado» | **Se quita** | Duplicado |
| M12 | Respuestas fijas a una orden (no es tuyo, ya es tuyo…) | **Se queda** mientras haya órdenes por WhatsApp | Responde a lo que él escribió; corregir el error #134 |
| M13 | Ficha «📦 Pedido #N» | **Se vuelve botón** (Pa'llá «Mis carreras») | Consulta |
| M14 | «La carrera ya no es tuya» | **Se queda** | Es un cambio |
| M15 | Pedido cancelado / cambió | **Se queda** | Es un cambio (devolver el paquete) |
| M16 | «El cliente aún no confirma» | **Se queda** | Raro (0 en 7 días); avisa de un problema |
| M17 | Enlace de Pa'llá | **Se queda** | Solo al pedirlo; es la puerta a los botones |
| M18 | Dinero en la calle 24 h | **Se queda** | Es el aviso de atraso de dinero |
| M19 | Carrera atascada 11:00 | **Se queda** | Es el aviso de atraso de recogida; sustituye al M5 |
| M20 | «Ya le aviso a la dependienta» | **Se vuelve botón** (Pa'llá «Ya lo dejé en la tienda»); por WhatsApp, reacción ✅ | Confirmación |
| M21 | IA: I2 promesas, I3 confirma entregas, I4 asigna, I5 acuses | **Se quita** | 29 de 31 sobran; causan los errores #3 y #4 del top. Si hace falta escalar: fila real (`recordPendiente`) y solo entonces «lo vio Ernesto» |
| M21 | IA: I1 pedir aclaración | **Se queda** | Cuando de verdad no se entiende |
| M22 | Supervisor Claude | **Se queda, con tope** | Es manual; que use las mismas reglas (sin confirmaciones) |
| M23 | Correo «Nueva carrera disponible» | **Se quita** | ~52 al día que repiten el grupo y Pa'llá; no se sabe si llegan |
| M24 | Correo «Nueva entrega» (asignación directa) | **Se quita** | El vale de WhatsApp ya lo dice |
| M25 | Avisos de Pa'llá al teléfono | **Se queda y se enciende para todos** («carrera libre», «te asignaron», «se canceló», «cambió») | Es el canal de los botones; hoy llega a 2 personas |
| M26 | Mensajerías 9:00 / 17:00 | **Se junta** (solo 9:00: carreras de hoy; sin «dinero antes de las 4», que pasa a Pa'llá) | Menos ruido en el grupo |
| M27 | Grupo: «🛵 CARRERA #N» + «🔔 Sigue libre» | **Se queda** | Es la oferta; el «sigue libre» ya casi no sale (1 en 7 días) |

### Dependientas

| # | Mensaje | Recomendación | Motivo |
|---|---|---|---|
| D1 | Resumen 10:00 «Para hoy» | **Se queda** | Su lista del día; puede absorber D10 y D9 |
| D2 | Pregunta de gestora, una por mensaje | **Se junta** (en el D3: lote con enlace a las 10:00 y a las 14:00) y **sin reenvíos** | 86 en 7 días, 31 repetidas |
| D3 | «Hay N preguntas» + enlace | **Se queda** | Ya es el formato junto |
| D4 | Ficha del producto vendido | **Se junta** (en el D3 o en la lista del catálogo) | Es otra pregunta de producto |
| D5 | Paquete «Tienes N avisos» | **Se queda** | Ya junta |
| D6 | 16:15 dinero sin llegar | **Se queda** | Atraso de dinero, pide acción |
| D7 | «X dice que ya dejó el dinero» | **Se queda** (hasta que la caja lo enseñe sola) | Pide contar y pulsar |
| D8 | «Pago a una gestora: dale X» | **Se queda** | Pide dar dinero |
| D9 | Estado de pedidos | **Se quita** (lo ven en la caja) | Informativo |
| D10 | Recogida cancelada sola | **Se junta** (en el resumen de las 10:00) | Informativo |
| D11 | Hoja de cierre comparada | **Se queda solo si hay diferencia** | Si cuadra, no hace falta mensaje |
| D12 | Compra bajo pedido | **Se queda** | Pide recibir o pagar |
| D13 | Lista del catálogo 10:30 | **Revisar** a quién va: el 30-oct salió a Zaymi y el código dice que va a Lennys | Una sola persona |
| D14 | Avisos de la tarjeta de carrera | **Se junta** (en el D5) | Ya va en la cola |

### Lennys

| # | Mensaje | Recomendación | Motivo |
|---|---|---|---|
| L1 | Resumen administrativo + Cuadre (2 imágenes) | **Se junta** (1 mensaje: dinero del día, quién debe, ≤2 decisiones) | Lo pide la auditoría del 28-oct |
| L2 | Tasa 8:50 | **Se quita**, salvo «SIN elToque», que **se queda** | Solo pide acción cuando falla |
| L3 | Comisiones | **Se junta** (ya en lote a las 10:00 y a las 16:00 desde el 29-oct) | Funciona; mantenerlo |
| L4 | Salida del cajón | **Se vuelve botón** (panel, con el aviso dentro del lote de las 10:00 y las 16:00) | Una decisión por mensaje, y el error de «una por mensaje» del 30-oct |
| L5 | Hoja de cierre | **Se queda solo con diferencia** y se junta en el L1 | |
| L6 | Estado de su pedido | **Se quita** | Informativo |
| L7 | 48 h dinero en la calle | **Se queda** | Atraso, pide acción |
| L8 | Respuestas a #supervisor | **Se queda** | Ella lo pide |
| L9/L10 | IA «Anotado» / «Se lo paso a Ernesto» | **Se quita** (o solo con fila registrada y número P<n>) | Error #3 del top |

### Gestoras (lo que toca a este flujo)

| # | Mensaje | Recomendación | Motivo |
|---|---|---|---|
| G1 | Estado de su pedido (🛵 hora, 📦 listo, ✅ entregado) | **Se queda**: la hora del mensajero, listo para recoger, entregado y problemas. **Se quita**: los pasos internos (aceptada, asignada) | Ella se lo pasa a su cliente; 260 en 7 días |
| G2 | Pago de comisión | **Se queda** | Su dinero |
| G3 | «La tienda contestó» | **Se queda** | Responde a su pregunta |
| G4 | Stickers | **Se quita** | No aporta |
| G6 | Mensajería a las 8 que también reparten | Igual que la sección de mensajeros | Y cambiarles el rol a mensajero |

---

## Lo que no pude leer o no está comprobado

- **Correos de Core a mensajeros:** conté invitaciones y asignaciones en los pedidos. No puedo saber si los correos se mandaron de verdad (Hostinger) ni si se leen.
- **ntfy de Pa'llá:** no leí el registro del servidor ntfy del VPS. Por las opciones de Core (prueba, 2 probadores, solo «offer») el envío a mensajeros reales es ~0.
- **Mensajes de grupo:** el bot no guarda sus mensajes de grupo en `crm_wa_messages`. Las cifras de grupos salen de `crm_outbox` y del registro de `crm_dispatch` (las carreras del grupo de Mensajerías se mandan directo, sin buzón).
- **«Supervisor Claude»** (`created_by claude`) mezcla el supervisor del VPS y las sesiones de Claude o Codex. No los separé.
- **Lista del catálogo de las 10:30:** el comentario del código dice «va a Lennys», pero el 30-oct a las 10:30 le llegó a Zaymi. No miré el código completo de `catalogo-turno.mjs`.
- No hubo fallos de SSH ni de acceso.
