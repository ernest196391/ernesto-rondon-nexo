# Memoria compartida · estado comprobado

Publicado el 21oct2026 a las 20:32 UTC / 16:32 Cuba, en el centro privado existente. Ernesto pidió compartir memoria y conversación entre Codex, Claude y VivaBot. Al consultar presupuesto respondió **«Sin gasto adicional; preparar la conexión»**. Esta decisión limita la entrega: registro de conversaciones y notas operativo; conectores de respuesta preparados como contrato de contexto, sin activar ni probar inferencia real. No hay conexión automática a otras sesiones de ChatGPT/Claude ni aprendizaje automático del WhatsApp de clientes.

## Lo que funciona

- `Hablar con el equipo`: conversaciones internas por tema/caso, destinatario Codex/Claude/VivaBot y mensajes guardados con estado `waiting_connection`. El aviso aclara que no se ha consultado al asistente. No son tareas de la cola automática y no se enviarán sin nueva confirmación si se habilita un conector.
- `Memoria compartida`: propuestas, hechos afirmados por Ernesto con fuente obligatoria y notas retiradas. Revisar conserva el historial y comprueba la versión para evitar sobrescribir cambios simultáneos. Una confirmación de hecho no amplía autorizaciones de ejecución.
- Un caso CRM solo tiene una conversación por `scope=esc:N`. Referencias de pedido `order:N` admitidas en backend. Los textos y números sueltos no crean vínculos de pedido inferidos.
- Repetir la misma solicitud devuelve el resultado previo. Un identificador reutilizado con otro contenido se rechaza. No se duplican notas/mensajes al reintentar tras un fallo de conexión.
- El propietario mantiene acceso exclusivo mediante WordPress id 1 + manage_options. CSRF, límites, validación y SQL parametrizado. Notas/mensajes se dibujan como texto; claves reconocibles y enlaces mágicos se rechazan antes de guardar.

## Autoridad y almacenamiento

Autoridad: SQLite en `/home/u824654880/domains/casaviva.company/control-private/memory.sqlite`, fuera de public_html, permiso 0600. Código PHP versionado por hash en la misma carpeta privada; no contiene secretos. Tablas threads, messages, facts, events, requests y leases. Una transacción guarda cambio, historial y respuesta idempotente juntos. La web muestra hasta 100 conversaciones, 300 mensajes, 300 notas y 100 eventos recientes; el resto permanece en la base.

El único puente cron existente añade una copia de lectura a `/root/supervisor/control-memory/view.json` y un README explícito. La copia conserva fecha y no es una segunda autoridad de escritura. No se arrancó un supervisor adicional ni se modificaron VivaBot, su proveedor, el selector codex-vps o el ejecutor de supervisión.

El paquete de contexto de `server/shared-context.py` reúne notas generales/del caso, hasta 30 mensajes internos y evidencia operativa vinculada explícitamente. Conserva origen, estado y fecha; excluye notas retiradas y otros casos. Las propuestas permanecen propuestas. Los tres conectores producen el mismo hash del contexto. Puede consultarse por CLI con `--actor codex|claude|bot --thread general|ID`, sin llamadas de IA. No importa automáticamente todo el historial de sesiones externas.

## Prevención de conflictos y límites actuales

La biblioteca de memoria prepara una reserva exclusiva por recurso con un token de propietario. Dos conexiones no pueden reservar el mismo recurso. La expiración no se interpreta como permiso para repetir un efecto: se exige revisión explícita; liberar requiere el token correcto. Esta reserva se ha probado con fixtures y **no gobierna todavía las acciones de asistentes externos o sesiones manuales**. El supervisor existente conserva su propio flock.

La función de inferencia rechaza siempre antes de cargar credenciales, abrir procesos o conectarse a una API. Presupuesto nuevo 0 USD, inferencia false, acciones externas false. La interfaz no permite modificar estos límites. Los conectores preparados no se anuncian como asistentes conectados o respuestas reales. El bot de WhatsApp conserva su funcionamiento anterior y aún no incorpora estas notas a sus respuestas.

## Pruebas y publicación

Pruebas aisladas: idempotencia, edición con versión antigua, historial, fuente obligatoria para confirmar, bloqueo de claves/enlaces de acceso, destinatarios permitidos, presupuesto cero, un expediente por caso, reserva y relevo por token. Tres pruebas del paquete compartido: contexto idéntico, aislamiento de casos y negativa de inferencia incluso si el llamador intenta habilitarla. Pruebas HTTP/PHP del propietario, anonimato, nonce, métodos y rechazo de acciones comerciales. Navegador: las vistas anteriores siguen operativas, formulario de mensaje, confirmación con fuente, búsqueda, borrador y móvil.

Producción: página/estado 200, memoria solo con sesión del propietario, anónimo 401, nonce inválido 403, SQLite no pública. Se registraron únicamente tres notas de contexto expresadas por Ernesto (presupuesto cero, objetivo común, español sencillo y preguntas agrupadas), sin mensajes de prueba. Sesión temporal de comprobación revocada. Actualización automática del puente comprobada a las 20:33:03Z, sin errores. Una sola entrada cron, sin cambios ajenos.

Release: `/root/supervisor/control-v2-releases/20261021T203214Z`. Vuelta atrás: `/root/backups/control-v2-20261021T203214Z/rollback.py`. Restaura interfaz y cron anteriores; conserva memoria, mensajes, cola y todos los datos comerciales. Nunca restaurar una SQLite antigua sobre notas nuevas.

Commit de código en el repositorio local `relevo/centro-control`; datos privados y capturas excluidos por `.gitignore`.

## Próximo paso condicionado

Validar una forma oficial de conexión compatible con los accesos y el límite de gasto que autorice Ernesto, implementar/validar su transporte real y comprobar respuestas con un caso seguro. No convertir el login existente en un acceso nuevo por suposición. La conexión al WhatsApp operativo requiere un adaptador que seleccione hechos aprobados y relevantes para ese contacto/pedido, sin exponer conversaciones internas ni ejecutar instrucciones encontradas en chats.

Fuentes oficiales consultadas: [Codex App Server](https://learn.chatgpt.com/docs/app-server), [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview). Los protocolos oficiales orientan el próximo adaptador; no se afirma haber completado autenticación o inferencia por haberlos leído.
