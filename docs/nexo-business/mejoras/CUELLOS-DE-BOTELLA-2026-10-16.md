# Cuellos de botella: lo que nos enseñaron los errores (16-oct-2026)

Lo escribí a partir de los chats del 14 al 16 de octubre, de las notas del supervisor (`crm_supervisor` 520-548) y de los arreglos L15-L28 de `ESTADO.md`.

## 1 · Errores que se repiten y cómo quitarlos de raíz
| # | Error que se repite | Ejemplo | Cómo eliminarlo | Estado |
|---|---|---|---|---|
| 1 | El bot inventa cuando no sabe | «mi panel = panel solar», «abono hecho», «2 %» | Respuestas aprobadas y «te lo confirmo». **Falta:** que cada respuesta de Nana, Zaymi o Lennys a «¿tenemos esto?» se convierta sola en respuesta aprobada | En parte (L28) |
| 2 | Chats en pausa a mano y nadie contesta | Dany esperó 2 h, Lennys tenía la pausa hasta las 8:41 | Si un chat en pausa lleva 15 min sin respuesta humana, el bot avisa o vuelve a contestar | **Falta** |
| 3 | Un producto creado en la web no llega a la caja | 10 de Ely y el protector (L25) | Al publicar en la web, se crea solo en la caja | **Falta** (hoy a mano) |
| 4 | Datos de producto ambiguos | «24 con 3» sin decir de qué; marca y foto cambiadas | Plantilla fija para subir mercancía (foto · nombre · costo · precio · comisión · cantidad · dueña), o el formulario «Llegó mercancía» del panel | **Falta** |
| 5 | La mercancía se cuenta dos veces (web contra entrada) | Almacén 7 de Dayra | Un solo camino: «Llegó mercancía», que ya crea productos nuevos | En parte |
| 6 | Las mismas preguntas de las gestoras | Comisión, «mi acceso», precio de la mensajería (Klaus) | Bienvenida con un menú de 6 palabras clave y la tarifa de mensajería por zona en el bot | **Falta** la tarifa |
| 7 | Entregas sin marcar | Ely, Leonardo, #3863 | Botón en el área del mensajero, frases claras y recordatorio (L28) | Hecho |
| 8 | Pedidos cancelados que siguen «vivos» | Melany #3865 | Cierre automático (L28) | Hecho |
| 9 | Fichas sin medidas | Maryta, set de baño | No publicar si faltan las medidas o el material (aviso en el panel) | **Falta** |
| 10 | Sesiones de Claude que se pisan | Panel sobrescrito, versiones de Core repetidas | Un solo script de despliegue que compara lo que está en vivo con main antes de subir | **Falta** |
| 11 | Ernesto no ve los resúmenes | El chat «Tú» está lleno de mensajes | Resumen en un canal aparte (Telegram ya está configurado) o en una página del panel | **Falta** decidir |

## 2 · Pasos que se pueden quitar ya
1. **Ernesto como paso obligatorio para publicar productos** → ya lo ordena Lennys (16-oct).
2. **Aprobar a mano a las gestoras invitadas por otra gestora activa** → aprobación automática, con alerta si repite teléfono o tarjeta (ya existe la alerta `cuenta_compartida`).
3. **Pasar a mano el enlace de la comunidad** → va en la bienvenida (falta pegar el enlace).
4. **Contestar a mano el precio de la mensajería** → el bot lo saca de la tabla de zonas.
5. **Pagar comisiones por chat** → «Pedir mi pago» (hecho). Decidir si basta con el número de transacción, sin captura, como prefiere Lennys.
6. **Dar de alta en la caja lo que ya está en la web** → automático (punto 3 de la tabla).
7. **Preguntas de sí o no en el chat «Tú»** → botones o comandos con número (`SÍ 12`), como ya hace el supervisor.

## 3 · Herramientas que faltan
- **Encuesta anónima y su análisis:** en construcción (ver `docs/nexo-business/encuesta/`).
- **Tablero de calidad del bot**, cada semana:
  - qué parte contestó el bot sin ayuda;
  - escalaciones;
  - cuánto tarda en contestar;
  - errores marcados;
  - preguntas sin respuesta aprobada.
- **Formulario rápido de mercancía** para Lennys en el móvil: una foto y 5 campos.
- **Sincronización automática de productos de la web a la caja.**
- **Calculadora de mensajería** en el área de la gestora y en el bot.
- **Web de pruebas (staging)** de Hostinger para probar Core antes de subirlo a la web de verdad.

## 4 · Conectores
| Conector | Para qué | Estado |
|---|---|---|
| Supabase (MCP) | Consultar y arreglar la caja sin rodeos | Configurado, pero **hoy se desconectó**: hay que reconectarlo |
| Google Drive/Sheets | Resultados de la encuesta y reportes que Lennys pueda abrir | Drive conectado |
| Telegram | Avisos y resúmenes para Ernesto, fuera del chat «Tú» | Ya hay `telegram.json` en el VPS |
| WhatsApp Business oficial (Meta) | Sustituir la conexión actual (Baileys: errores de cifrado y riesgo de bloqueo) | Estudiar: en Cuba la verificación de Meta es difícil |
| Revolico / Transfermóvil | — | Sin API (Cloudflare bloquea Revolico; Transfermóvil no tiene API) |

## 5 · Multinivel: cómo probarlo
1. **Prueba con personas:** Dany y sus 4 invitadas hasta el 30-oct. En la encuesta hay 2 preguntas de comprensión con respuesta correcta, para medir si se entiende.
2. **Prueba técnica (B6 de `LANZAMIENTO.md`):** un cierre de prueba con «Pedir mi pago» (red y bono) en una cuenta de prueba, de día y avisando a Lennys antes, porque el aviso de pago le llega por WhatsApp.
3. **Números:** cada noche, alertas y comparación a mano de 2-3 vales (ya lo hace el cálculo).
