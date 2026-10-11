# Cierre del día de Casa Viva (práctica nueva, desde el 11-oct-2026)

Ernesto lo pidió el 11-oct: cada día, a una hora fija, un resumen para el equipo y otro para la administración. La idea es aprender de lo que pasó, reconocer a quien lo hizo bien y mejorar cada día.

## Ingeniería inversa: qué tiene que salir y de dónde sale cada dato

| Qué queremos decir | De dónde sale (ya existe) | Cómo se calcula |
|---|---|---|
| Productos más vendidos | Pedidos web (WooCommerce) + ventas de la caja (Supabase `nexo_business`) | Unidades por producto del día |
| Gestoras que más vendieron | Pedidos web con `_cvd_owner_user_id` | Total USD y nº de pedidos por gestora |
| Mensajeros con más entregas | `crm_dispatch` (asignada → entregada) + `_cvd_messenger_user_id` | Entregas hechas y tiempo medio |
| Dudas y preguntas del día | `crm_messages` (entrantes) + `crm_escalations` + `crm_knowledge` creado hoy | Agrupadas por tema, con la respuesta correcta |
| Incidencias y qué mejorar | Escalaciones, avisos del bot, notas de pedidos, ESTADO.md del día | Qué pasó → qué se arregló → qué falta |
| Cosas cómicas o bonitas | Chats del día (lo elige Claude y lo aprueba Ernesto) | 1–3 momentos, nunca para burlarse de nadie |
| Dinero (solo administración) | Cobros de pedidos (método y tarjeta), cierres de caja, comisiones pendientes, efectivo declarado por mensajeros | Totales por método y por tarjeta; lo que falta por cuadrar |
| Marketing (solo administración) | Ventas por gestora nueva o activa, productos sin existencias que se pidieron, preguntas de clientes sin venta | Oportunidades para mañana |
| Soporte (para Ernesto) | Chats de dependientas, mensajeros y gestoras con problemas de cuenta, app o caja | Quién necesita ayuda y con qué |

## Tres resúmenes, tres públicos

1. **Equipo (grupo General, 19:00)**
   - **Formato:** nota de voz corta (1–1:30 min, voz del bot, auditada con Whisper) + 1 imagen "tablero del día".
   - **Contenido:** gracias, top productos, top gestoras, top mensajeros, 2–3 dudas con su respuesta, 1 cosa a mejorar mañana y 1 momento simpático.
   - **Más adelante:** un video de 30–45 s los viernes (resumen de la semana).
2. **Lennys (privado, 19:00)**
   - **Formato:** texto ordenado por apartados: Dinero · Pedidos abiertos · Equipo · Productos y existencias · Marketing · Qué vigilar mañana.
   - **Regla:** solo lo administrativo, nunca tareas de tienda.
3. **Ernesto (su chat, 18:45, antes que los demás)**
   - **Contenido:** borrador de los dos resúmenes para aprobar, más el soporte técnico (fallos, cuentas, bot, servidores) y las decisiones pendientes.
   - **Aprobación:** con un "sí" se envían a las 19:00. Sin respuesta, no sale nada al grupo; a Lennys le llega el suyo igual.

## Paso a paso

- **Paso 1 (hoy, 11-oct):** cierre hecho a mano por Claude con los datos de hoy, para ver cómo queda. Ernesto lo aprueba y se manda.
- **Paso 2:** script `cierre-del-dia.mjs` en el VPS que junta todos los datos de la tabla (WooCommerce por `wp eval`, Supabase, `crm_*`) en un JSON del día.
- **Paso 3:** el supervisor del VPS escribe los 3 textos a las 18:40 a partir de ese JSON, genera y audita la nota de voz y crea la imagen del tablero.
- **Paso 4:** envío a las 19:00 tras el "sí" de Ernesto, con un registro en `crm_supervisor` para no repetir.
- **Paso 5 (semana 2):** video semanal (HyperFrames) con capturas reales del panel y de la app, música y efectos.

## Reglas

- Nunca datos de clientes (nombres completos, teléfonos, direcciones) en el grupo. Las gestoras y los mensajeros salen con su nombre de pila.
- Reconocer, no señalar: lo que salió mal se cuenta como "qué mejoramos", sin culpar a nadie.
- Todo audio se genera y se revisa con Whisper antes de mandarlo.
