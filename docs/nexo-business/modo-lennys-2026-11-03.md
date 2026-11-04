# Modo Lennys: su asistente propio, siempre disponible (3-nov-2026)

Orden de Ernesto (3-nov). **Estado: construido y probado; NO desplegado** (falta el visto bueno de Ernesto y que nadie más esté editando el VPS). Código en el repo del bot, rama `modo-lennys` (`ernest196391/vivabot`). Simulación con sus mensajes reales: `modo-lennys-simulacion-2026-11-03.md`.

## 1. Qué cambia para Lennys
- Escribe como siempre (texto, audio, fotos). **Sin `#supervisor`**: todo va al supervisor del servidor. El bot común ya no le contesta ni le escribe, salvo urgencias.
- Una sola voz: el supervisor. Un acuse corto solo si va a tardar y después el resultado comprobado, 1–3 líneas.
- Contestar citando un mensaje suyo («sí», «34», «me gusta», «Cambiar») cuenta como respuesta a esa tarea.
- Si algo es ambiguo, lo más probable se hace y se le dice en una línea. Solo se le pregunta si hay dinero o riesgo.
- Lo que no puede hacer sin Ernesto se lo dice con la verdad («esto lo decide Ernesto, queda pendiente»).

## 2. Qué hace solo / qué espera a Ernesto
| Lo hace solo (y lo cuenta) | Pendiente de Ernesto | Encargo de programación |
|---|---|---|
| Fichas, fotos (reales y comerciales con Higgsfield: 1–2 créditos por imagen, 2 variantes, fondo crema, sin texto, sin cambiar la forma), existencias web y caja, publicar y ocultar | Mover dinero o pagos | Funciones, pantallas o botones nuevos |
| Precio y comisión de productos (decide Lennys; si deja pérdida o baja del mínimo, le dice los números y espera SU sí) | Borrar | (`kind='pendiente'`, `plan.tipo='desarrollo'`; el kind `desarrollo` no existe en la base, ver §7) |
| Anuncio de PRODUCTO NUEVO a «Actualización de productos» (permiso fijo de Ernesto) | Reglas para todas las gestoras | |
| Cambios de pedido antes de la recogida (`CVD_Order_Edit::edit/cancel`: quitar o bajar productos, contacto, día, nota, cancelar con motivo) | Avisos a otros grupos | |
| Correcciones pequeñas del bot o la web, con copia y vuelta atrás | | |

`supervisor_approval_policy` no se toca: sigue siendo la política de las preguntas a Ernesto (su canal actual es su chat). Las órdenes de Lennys dentro de la columna izquierda **nunca generan una pregunta a Ernesto**; eso lo decide `permiso()` (`src/modo-lennys-rules.js`) y lo dice el manual del supervisor (§5). Cambiar la política en la base afectaría a todas las preguntas y reiniciaría las propuestas ya hechas.

## 3. Piezas (todas en el repo del bot)
| Pieza | Archivo | Qué hace |
|---|---|---|
| Reglas puras | `src/modo-lennys-rules.js` | `ruta` (supervisor / comando / nada), `hilo`, `presupuesto` (6 por hora, noche 22:00–7:30), `acuse`, `permiso`, `precioRiesgo`, `anuncioProductoNuevo`, `fotoComercialOk`, `metricas`, `avisoErnesto`, `vistaPanel`, `filaDesdeTablero`, `salidaLennys` |
| Entrada | `src/index.js` (`lennysModo`) | Con `modo_lennys = si` enruta todo lo suyo. Apagado: igual que hoy (solo `#supervisor`) |
| Filtro del buzón | `src/outbox.js` | Lo no urgente que el bot común le manda: `modo_lennys_filtro` = `no` (nada) · `prueba` (sale y queda en el log «bloquearía») · `si` (se retiene y el supervisor lo junta) |
| Supervisor | `supervisor/CLAUDE.md` §5, `run-orden-lennys.sh`, `check.mjs`, `orden-lennys-rules.mjs` | Manual nuevo, modelo `claude-fable-5-1` (respaldo `claude-opus-5-5`, probados los dos en el VPS), avisos retenidos |
| Herramienta | `supervisor/modo-lennys.mjs` | `clasificar`, `precio`, `estado`, `metricas`, `vigila` (cron cada 5 min), `panel [--enviar]`, `retenidos`, `envio` (respeta el tope) |
| Pruebas | `test/modo-lennys.test.js` (29), `npm run test:modo-lennys` dentro de `npm run check` | Sin red, sin WhatsApp |
| Simulación | `scripts/modo-lennys-simula.mjs` | Lee un JSON del chat y no envía nada |

Ajustes en `crm_settings`: `modo_lennys` (si/no, por defecto no), `modo_lennys_filtro` (no/prueba/si, por defecto no), `supervisor_modelo_lennys`, `supervisor_orden_lennys` (ya está en «si»).

## 4. Resultado de la simulación (30-oct a 3-nov, mensajes reales)
- Ella escribió 186 mensajes; 178 van al supervisor; 8 no necesitan respuesta (cortesías y stickers).
- Hoy le llegan **232** (145 del bot + 87 del supervisor o a mano) = ~46 por día. Con el Modo Lennys, estimado **~44 en 5 días (5–13 por día, media 9)**. La meta es 10 o menos; el 2-nov saldría 13 (tarde de muchas tareas separadas).
- De las órdenes, ~90 % las haría sola, 2–3 por día quedan pendientes de Ernesto (dinero o grupos) y ninguna es de programación.
- Es una estimación (1 resultado por tarea, ráfagas de menos de 20 min = una tarea). La medida real saldrá de `modo-lennys.mjs metricas` cuando esté en vivo.

## 5. Contrato con el Tablero (sesión «Tablero único por roles») — lo que falta del lado Core
El Tablero vive en Core (WordPress, sin claves de Supabase). Igual que `/bot/tablero/resumen`, el VPS habla con Core por HTTPS con `x-vivabot-key`:
1. `POST /casa-viva/v1/bot/lennys/panel` — el VPS sube cada minuto la vista de Lennys (`vistaPanel()`): `{ actualizado, metricas:{recibidas,resueltas,enCurso,pendientesErnesto,minMediana,mensajes,metas}, ordenes:[{id,hora(min),texto,estado:'hecha'|'en-curso'|'pendiente-ernesto',resultado}], decisiones:[{id,titulo,propuesta,efecto,opciones:['si','no','cambiar']}] }`. Sin teléfonos. Core la guarda como opción sin autoload.
2. `GET /casa-viva/v1/bot/lennys/cola` — devuelve `{ items:[{id, tipo:'texto', texto} | {id, tipo:'decision', orden, valor:'si'|'no'|'cambiar', dato}] }` con lo que Lennys hizo en la página (caja de texto y botones). Solo cuando entra con su sesión (rol administración); 30 envíos por minuto máximo.
3. `POST /casa-viva/v1/bot/lennys/cola/ack` — `{ items:[{id, ok, orden?, motivo?}] }`: Core marca esos items como recibidos (idempotente: el VPS no crea la misma orden dos veces por `tablero_id`).
En la vista de Lennys del Tablero: una caja «Escríbele al supervisor», «Mis órdenes de hoy» (hecha / en curso / pendiente de Ernesto, con el resultado) y, por cada decisión, **Sí / No / Cambiar** (Cambiar abre un campo con el número). No duplica «Pagos por hacer» ni la meta de mensajes que ya están en vivo; la métrica «mensajes del bot a Lennys» ya la pinta la vista de Ernesto. El lado VPS está hecho y probado en seco (`modo-lennys.mjs panel`); falta el PHP en Core (`class-cvd-tablero.php`) y la línea de cron.

## 6. Cómo se pone en vivo (cuando Ernesto diga SÍ) y cómo se deshace
Antes: nadie más editando `/root/vivabot` (la rama `ccr-f459b3eb-utyhix` del VPS recibe commits de otras sesiones): fusionar `origin/main` + `modo-lennys` en una copia aparte, `npm run check`, y copiar solo estos archivos con `git add` por ruta (nunca `git add -A`). `cv reiniciar` espera a que los chats estén tranquilos.
1. Copia de seguridad `~/bak-AAAAMMDD-modo-lennys` de `src/index.js`, `src/outbox.js` y `/root/supervisor/{CLAUDE.md,check.mjs,orden-lennys-rules.mjs,run-orden-lennys.sh}`.
2. Subir los archivos, `chmod +x /root/supervisor/run-orden-lennys.sh`, `cv reiniciar`. Con `modo_lennys` apagado nada cambia (comprobar `cv estado` y logs).
3. `modo_lennys_filtro = prueba` medio día: el log dice qué bloquearía; si es solo lo no urgente, pasar a `si`.
4. `modo_lennys = si`. Prueba con un mensaje real de Lennys a la vez (no con números inventados: el bot manda bienvenida real a cualquier cuenta nueva con teléfono).
5. Cron nuevo: `*/5 * * * * node /root/supervisor/modo-lennys.mjs vigila` (aviso a Ernesto solo si falla o pasa de 30 órdenes).
Deshacer: `modo_lennys = no` (vuelve a «solo #supervisor» en menos de 20 s), `modo_lennys_filtro = no`, quitar el cron; los archivos viejos están en la copia.

## 7. Límites y cosas honestas
- No está desplegado ni encendido. Todo se probó con reglas puras, simulación y `npm run check` (1309 pruebas, 0 fallos); `lennysModo` y el filtro del buzón no se pueden ejecutar sin WhatsApp: se comprobó la sintaxis y se enciende por etapas.
- `crm_supervisor.kind` solo admite `pregunta, hecho, aviso, error, pendiente, orden-lennys` (migración 033). Por eso los encargos de programación van como `pendiente` con `plan.tipo='desarrollo'` y los avisos retenidos como `aviso` con `plan.tipo='aviso-lennys'`. Si Ernesto quiere el kind `desarrollo` de verdad, hace falta una migración (SQL para pegar en Supabase, proyecto nexo-production).
- Los mensajes del supervisor llegan a Lennys por el buzón (`crm_outbox`); el tope de 6 por hora cuenta lo que se ve en `crm_messages` y lo pendiente en el buzón.
- El tiempo de respuesta real depende de la vuelta del supervisor (cron cada minuto + lo que tarde Claude). La meta de menos de 5 min se mide con `metricas`; las fotos comerciales tardan más.
- Una orden que llega de noche (22:00–7:30) espera a las 7:30 salvo que parezca urgente.
