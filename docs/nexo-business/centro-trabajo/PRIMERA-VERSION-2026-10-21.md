> Estado vigente: PUBLICADO y verificado 21oct2026 20:03 UTC. La sección final de publicación sustituye los pendientes de despliegue de la propuesta inicial.

# Centro de trabajo de Casa Viva · primera versión revisable

## Resultado de este bloque

Se conserva la aplicación privada existente en `https://casaviva.company/control/`. Se preparó una versión siguiente con datos reales leídos por los accesos existentes, sin alterar pedidos, precios, pagos, mensajes ni el supervisor. Vista local: `http://127.0.0.1:8765` (solo este ordenador, no es el servicio definitivo). Código preparado para WordPress y una actualización de lectura en el VPS; **no desplegado**. No hay un nuevo repositorio, base de datos, servicio de IA contratado ni segundo supervisor.

La versión revisable reúne siete vistas: casos, conversaciones, pedidos, decisiones, herramientas, memoria y mapa del flujo. Permite buscar y preparar una indicación con contexto. En la vista local ese texto solo se copia; no se transmite. El PHP preparado reutiliza la autenticación de Ernesto, nonce y cola existentes al publicarse. No reemplaza las transiciones ni el inventario de Core.

## Qué se comprobó y qué falta

|Parte|Comprobación|Límite|
|---|---|---|
|Casa Viva web|Core3.14.44 real; lectura de pedidos mediante WC_Order y CVD_Canonical_Order_Reader|No se compró ni se probó un cierre real|
|VivaBot|Proceso y supervisor desde la instantánea existente; AI_PROVIDER=openai en el entorno cargado|Proceso online no certifica todos los mensajes ni el saldo|
|WhatsApp y CRM|Mensajes recientes, contactos comerciales, escalaciones, preguntas y conocimiento|Muestra de300mensajes/24horas; hasta6porcontacto y45chats; no historial completo|
|Incidencias|Hasta80abiertas, cruzadas con mensajes y referencias explícitas a pedidos|Una escalación abierta no significa incidencia vigente|
|Pedidos|30recientes y hasta60referidos explícitamente por incidencias|No se adivinan números desde precios o teléfonos; un vínculo ausente se señala|
|NEXO Business|Contrato de integración y documentación de caja/sincronización|No se certificó el dispositivo físico ni una venta offline en este bloque|
|Centro actual|Aplicación y puente privado existentes; actualización reciente en el alojamiento|La nueva versión aún no sustituye esa aplicación|
|Codex|Seleccionado codex-vps; cola y bloqueo existentes|Nueva integración propia necesita verificar el acceso compatible, no copiar autenticación|
|Claude y Google|Interfaces oficiales investigadas; claves del bot solo comprobadas por presencia|No se verificó cuota/saldo ni se conectaron nuevos ejecutores|

La instantánea privada conserva fecha de cada fuente, estado y errores. Una fuente inaccesible se muestra como desconocida; nunca como cero problemas. Excluye contactos personales/ignorados y oculta teléfonos, tarjetas, invitaciones y enlaces de acceso. No incluye claves ni sesiones. El número de casos puede variar entre lecturas.

## Cómo debe funcionar el cerebro común

El núcleo es **el caso**, enlazado al pedido real: persona/papel → conversación/adjuntos → producto/propuesta → pedido → compra a proveedor → recepción → entrega → cobro/comisión → resultado. No se crea un segundo pedido ni un inventario alternativo.

Cada dato compartido debe registrar: `business_id`, entidad y referencia externa, valor, fuente y mensaje original, fecha del hecho, fecha de comprobación, estado (`propuesto`, `confirmado`, `contradictorio`, `sustituido`) y quién lo verificó. Un resumen no puede sustituir ni aumentar una autorización. Un dato que cambia invalida la propuesta dependiente; se conserva su historia.

No se mete toda la información en un único prompt. Se consulta el contexto relevante de cada caso. Las respuestas generales viven en crm_knowledge; los hechos de un pedido se consultan en Core; la disponibilidad del proveedor tiene fecha y puede caducar. Las notas de clientes/proveedores se tratan como datos, no como instrucciones para ejecutar comandos.

Aprendizaje: mensaje o audio → candidato → contraste con herramienta o persona autorizada → confirmación → conocimiento utilizable. Si no hay confirmación, sigue pendiente. No hay entrenamiento de modelos ni promoción automática de cualquier mensaje a regla del negocio.

## Coordinador y herramientas

Una tarea tiene identificador estable, caso, objetivo, alcance, autorizaciones, responsable, vencimiento de su turno, próxima acción y evidencia. Estados: en revisión → propuesta → espera de datos/aprobación → preparada → en ejecución → verificada/cerrada. La reserva de turno se hace antes del primer efecto; la idempotencia protege pedidos, vales y mensajes. Si un ejecutor cae, otro retoma desde el último efecto comprobado, no repite todo el trabajo.

Se reutilizan el selector codex-vps/Claude, `/tmp/supervisor.lock`, la cola existente, las autorizaciones y el buzón de VivaBot. Antes de conectar una interfaz nueva a cualquiera de estos ejecutores se debe verificar acceso admitido y pruebas de recuperación. **No se ha arrancado otro supervisor.**

Herramientas previstas, todas mediadas por permisos:

- Leer pedido, catálogo, chat, audio transcrito, evidencias y reglas.
- Consultar aplicación del proveedor antes de pedirle información ya publicada.
- Proponer precio con myPrice/gestoraShare; las cuentas no las improvisa un modelo.
- Preparar respuesta, compra o corrección con referencia a la confirmación concreta.
- Ejecutar mediante el motor actual únicamente cuando esté autorizado; verificar el resultado real.
- Buscar documentos de Google, consultar correo o crear material visual solo con sus conectores y permisos propios. Las conexiones de este chat no se transfieren automáticamente a la web.

Codex sirve para investigación técnica, código y ejecución verificable; Claude puede participar como ejecutor alternativo o revisor; Gemini y herramientas visuales se conectan según necesidad y acceso. Ninguna preferencia de modelo autoriza gasto. La suscripción de una aplicación no se toma como saldo de API. No se incrustan ni automatizan las páginas de ChatGPT/Claude para eludir sus interfaces de integración.

Fuentes oficiales consultadas21oct2026:

- [Codex: integración y límites de autenticación](https://developers.openai.com/codex/app-server/) (auth de app-server no se ofrece como acceso de un servicio alojado; evaluar Sign in with ChatGPT compatible o credencial API para la integración propia).
- [Codex como plataforma](https://developers.openai.com/blog/codex-as-a-platform): exec para trabajos acotados, SDK/app-server para aplicaciones, contexto y autorizaciones controlados por la aplicación.
- [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview): herramientas, sesiones y permisos; integración propia con autenticación admitida, sin asumir traslado de login/cuota de claude.ai.
- [Gemini y herramientas](https://ai.google.dev/gemini-api/docs/function-calling): funciones externas ejecutadas y controladas por la aplicación.

## Mejoras por paso, en orden

|Paso|Capacidad existente que se conserva|Mejora|
|---|---|---|
|1.Entrada|VivaBot, mensajes originales y transcripciones|Detectar lo recibido sin procesar; conservar foto/audio y fuente junto al caso|
|2.Identidad|CRM, gestoras y roles Core|No confundir cliente, remitente, gestora y proveedor; permisos explícitos|
|3.Producto|Woo, bolsa y aplicación de Kevin|Modelo/variante/cantidad/frescura; una confirmación reciente manda sobre una ficha desactualizada|
|4.Propuesta|myPrice/gestoraShare, reglas vigentes|Precio de venta, comisión y transporte separados; cotización versionada|
|5.Confirmación|Compra desde chat autorizada por Ernesto|Guardar qué aceptó la persona; no extender un sí a productos/importes diferentes|
|6.Vale de proveedor|Motor de compras e idempotencia actual|Buscar vale y pedido existentes; productos>200USD y mensajería≥2000CUP fuera de aprobación automática|
|7.Recepción|Tienda y dependienta de turno|Aviso a quien trabaja y comprobación física antes de prometer listo|
|8.Mensajería|Core, incidencias estructuradas y estados separados|Queja con contexto; preservar asignación y tarifa; verificar entrega antes de cerrar|
|9.Cobro/comisión|Core, tarjetas y NEXO|Conciliar importes reales; no confundir entrega con dinero devuelto o comisión pagada|
|10.Aprendizaje|crm_knowledge y fuente de verdad|Confirmación, fecha, caducidad, contradicciones y lecciones reutilizables|

## Orden de construcción

1. **Hecho en esta versión:** lectura unificada, vínculos por referencias explícitas, búsqueda, borradores con contexto, fuentes y mapa del sistema; pruebas en escritorio/móvil.
2. **Antes de publicar:** aprobar el despliegue concreto; conservar los tres archivos actuales, puente y cron; probar nonce/roles con fixtures, copia y retirada. Publicar bajo el login existente, datos privados fuera de public_html. No exponer esta captura privada como archivo público.
3. **Conexión continua:** añadir la lectura al puente actual sin un segundo supervisor. Detectar fuente atrasada y mostrarla, no esconder el error.
4. **Casos vigentes:** reconciliar escalaciones con respuesta posterior, pedido y acción comprobada. Un caso ya resuelto no vuelve a preguntarse.
5. **Conversación central y memoria:** iniciar tareas y recibir resultados en el centro mediante adaptador oficial autorizado, con consumo y límites visibles; sumar proveedores uno por uno.
6. **Decisiones y ejecución:** propuesta concreta, permiso aplicable, resultado verificable y recuperación. Ningún cambio de dinero/precios/comisiones o mensaje por defecto.
7. **Equipo:** incorporar Lennys/dependientas/mensajeros con acceso limitado por papel; no heredar el acceso completo del propietario.

## Verificación y entrega

Pruebas locales: siete vistas, búsqueda, cruce de pedidos sin deducir precios/teléfonos, estado desconocido, borradores sin envío, escritorio1440×1000, móvil390×844 sin desbordamiento, salida segura por texto, enlaces de acceso ocultos y servidor de vista previa sin POST ni acceso al resto del disco. Evidencias privadas en `.local-v2/verification.json`, `desktop.png`, `mobile.png`.

El servidor de vista previa escucha únicamente127.0.0.1. Se apaga con el ordenador; no es la supervisión del VPS, que se conserva. Código privado de preproducción en `/root/codex-work/centro-control-v2/`; pruebas PHP en `~/control-v2-test-private`, fuera de public_html. El despliegue de la nueva versión y la integración de los ejecutores siguen pendientes.

## Publicación aprobada · 21oct2026 20:03 UTC / 16:03 Cuba

Ernesto autorizó publicar y pidió ver responsabilidades, estadísticas, errores y espacio para seguir construyendo. PUBLICADO en https://casaviva.company/control/ con el mismo acceso exclusivo WordPress usuario 1 + manage_options. No se concedió acceso a gestoras, proveedores ni mensajeros.

Once secciones: casos, conversaciones, pedidos, decisiones, estadísticas, errores/mejoras, mi acceso/responsabilidades, construir/tareas, equipo, memoria y funcionamiento. El caso muestra petición original, interpretación registrada por contrastar, actor, papel del propietario, papel de la app/supervisor, antigüedad y referencias. El historial de mensajes se despliega para leerlo; no se vuelve a enviar.

Estadísticas disponibles:
- WooCommerce: pedidos creados durante siete días de Cuba hasta la captura, estados e importe por moneda. Lectura paginada hasta 500; total y cobertura explícitos. Primera lectura: 150/150, completa. Importe excluye cancelados, fallidos y reembolsados; NO representa caja, beneficio ni ventas POS que no estén en Woo. Caja consolidada y beneficio siguen sin integrar.
- Casos: muestra de hasta 80 incidencias CRM abiertas, por papel y antigüedad. No equivale a errores confirmados ni tiempo de atención. Hay casos antiguos que necesitan contrastarse con respuestas posteriores.
- Herramientas: registros locales de src/usage.js durante siete días; llamadas, fallos, tokens y estimación de costo almacenada, por proveedor y función. OpenAI, Groq y ElevenLabs presentes; ningún día sin archivo ni línea inválida en primera lectura. No factura, saldo, cuotas ni consumo externo de ChatGPT/Codex/Claude. Los registros sin precio se cuentan por separado.
- Errores: advertencias canónicas Core, hallazgos de auditoría y fallos técnicos de IA separados. No se suman ni se infiere que una respuesta exitosa fue correcta.

Nueva indicación y anotar mejora usan la cola existente. Guardar una tarea no ejecuta cambios comerciales ni amplía las autorizaciones. El supervisor sigue seleccionado codex-vps. Se conserva control-sync.py y su bloqueo; el único cron del puente invoca un envoltorio con exclusión mutua que actualiza la lectura cada 2–3 minutos. La página consulta cada minuto cuando no se está escribiendo. Se avisa si la captura supera cinco minutos. Apagar el ordenador no detiene este puente del VPS.

Release inmutable: /root/supervisor/control-v2-releases/20261021T200322Z. Copia y vuelta atrás: /root/backups/control-v2-20261021T200322Z/rollback.py. Recupera la interfaz anterior y solo la entrada de cron correspondiente, conservando cola, pedidos, mensajes y datos privados. Comprueba que no haya cambios posteriores antes de restaurar. Datos fuera de public_html; activos versionados por hash; sustitución atómica de index.php. No se reinició VivaBot, no se inició otro supervisor y no hubo llamadas de IA de pago, cambios de pedidos ni mensajes.

Verificación final: 11 vistas en navegador, búsqueda, borrador conservado tras recarga, escritorio/móvil y tablas sin desbordamiento, contenido HTML tratado como texto, acceso a ficheros y POST de vista previa bloqueados. 3 pruebas de puente, 6 de PHP/autorización y 1 de consumo correctas. HTTP real: propietario 200, estado 200, anónimo 401, nonce inválido 403, activos 200, capturas no públicas. Sesión temporal de prueba revocada. Cron: exactamente una entrada del puente y sin cambios ajenos; actualización automática comprobada a las 20:04:03Z sin errores.

Pendiente: vincular autorizaciones y responsables reales por caso, reconciliar casos ya resueltos, integrar caja/beneficio, historial de propuestas y conversación central con asistentes mediante acceso oficial compatible. Las fichas de responsabilidades explican el diseño y los límites actuales; no crean permisos ni integraciones que todavía no existan.
