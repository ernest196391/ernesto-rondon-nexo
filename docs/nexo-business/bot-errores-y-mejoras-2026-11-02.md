# Errores del bot y cómo mejorarlo (revisión del Vigía, 2-nov-2026)

Para: sesión bot-maraton. Fuente: `cv errores abiertos` (21: 7 abiertos, 14 por decidir) y los chats de Lennys, Kevin y Zaymi del 29-oct al 2-nov. Nada de esto está programado todavía.

## 1. Lo que Ernesto preguntó

### A. ¿Por qué el bot no abrió la app de Kevin antes de preguntarle?
- **Caso (2-nov 15:22):** una gestora (taniacedeno1712c) preguntó los colores de la riñonera MOLLE (MK-1027). El bot escribió a Kevin «¿Qué colores tienes hoy…?». Kevin contestó «la tenemos en negro».
- **El dato ya estaba guardado:** `crm_market_items` id 1027, `description`: «Color negra con diseño práctico…». Es decir, el bot sabía la respuesta.
- **Causa:** el camino «gestora pregunta por privado → se pregunta al proveedor» (plantilla «Hola Kevin 👋 Por privado, X pregunta») no consulta primero la ficha guardada ni la app (`digitalstore-catalog.js`). Solo el camino de PEDIDOS (`bajopedido24-rules.js`) mira la app antes de escribir.
- **Fallo extra:** la plantilla llevaba 2 preguntas; el servicio de proveedores la rechazó dos veces (envíos 4024 y 4025: máx. 4 líneas, 320 letras, 1 pregunta). Luego otro proceso (supervisor) la reescribió y la mandó (#4026). Error #178.
- **Mejora pedida:**
  1. Antes de escribir a un proveedor (Kevin primero), buscar la respuesta en `crm_market_items.description/raw_text` y en el snapshot de su app (`readDigitalStore`: disponible, stock, local, detalles públicos).
  2. Si está, contestar a la gestora con eso y NO escribir a Kevin.
  3. Si falta, 1 pregunta corta, solo de lo que falta (regla D90).
  4. Una sola ruta para escribir a proveedores, con el mismo límite, para que no haya dos redactores (plantilla y supervisor).

### B. ¿Por qué el bot le pregunta a Lennys cosas que ella no quiere?
| Qué le pregunta | Cuándo | Qué dijo Lennys | Mejora |
|---|---|---|---|
| «¿La apruebas? SALIDA SI/NO» por cada salida del cajón (#8, 40 USD vuelto #6067; antes #5, 3 USD) | 2-nov 15:27; 30-oct 16:40 | 2-nov 15:44: «no tienes que preguntarme: las dependientas están autorizadas a sacar fondos, solo que queden registradas en la caja» | `salidas-rules.js`: solo registrar. Avisar solo si pasa un tope que ella fije o no tiene motivo. Resumen en el cierre del día. |
| «Se lo consulto a Ernesto» para precio y comisión de productos nuevos (guirnalda, luces navideñas) | 2-nov 14:16–14:28 | 14:27: «la que tiene que aprobar soy yo» | Lennys decide Casa Viva (D121, regla vigente). El bot le propone y espera su sí; no manda a Ernesto. Avisar a Lennys solo si hay pérdida. |
| «¿Dónde la ves mal?» sobre «Conill A» | 1-nov 19:35 | Ya lo había dicho a las 16:32 («cambia la dirección») | Antes de preguntar a nadie, mirar lo que ya dijo en el chat (las últimas 24–48 h). Mismo principio del #165. |
| Preguntas de gestoras sobre productos («cuándo entran protectores», cuenta de Zelle) | 2-nov 10:34, 11:00 | — | Agrupar en UN mensaje por turno; no reenviar lo que ya se contestó a mano; la cuenta de Zelle y datos de pago se responden con datos confirmados. |
| «Una consulta sobre billetes rotos: ¿qué regla?» | 1-nov 18:44 | — | Ernesto ya tenía el tema abierto; un solo mensaje con la propuesta lista para decir «sí». |

Regla general nueva: **al administrador solo decisiones o problemas, y con una propuesta lista; nada que la dependienta pueda hacer ni nada que ya se haya dicho en el chat.**

## 2. Resumen de errores abiertos (7 abiertos + 14 por decidir)

**Promete y no hace (5):** #158, #164 («anoto la cancelación»), #172 («se lo paso a Ernesto» sin escalación), #173 («aquí tienes las fotos» sin enviar), #175 (aviso de comisión a la gestora equivocada).
→ Mejora: nunca decir «anoto/te envío» si no hay una acción real detrás (registro, escalación o envío confirmado). El código marca la acción y la IA solo la reporta.

**Inventa (5):** #109 (horario de entrega 5 pm), #133 (cuentas de cambio con tasa), #144 (cómo se cuadra una diferencia), #167 (bono y puntos oficiales), #168 en parte.
→ Mejora: dinero, horarios, fechas y bonos solo con dato confirmado; si falta, preguntar a Ernesto y no responder.

**Entiende mal (4):** #114 (vale con datos mezclados), #161 («cambiar el mensajero» ≠ «pasar a mensajería»; arreglo hecho en GitHub main e836c0d, falta ponerlo en vivo), #166 (pregunta que cita una lista), #168 (una palabra alargada es una queja).
→ Mejora: repetir en una línea lo que entendió cuando una frase tenga dos sentidos; responder sobre el mensaje citado.

**Pregunta de más o repite (6):** #165 (a Gaby, lo que Ernesto ya contestó), #171 (3 veces a Zaymi la misma pregunta de olla Reina en 3 minutos), #177 (35 preguntas juntas a Zaymi sin orden de Ernesto, ficha-contesta), #178 (Kevin), más las salidas y preguntas a Lennys de arriba.
→ Mejora: antes de preguntar, mirar si ya se contestó (chat, ficha, app); tope de mensajes por persona y por día; ficha-contesta no manda lotes a las dependientas sin orden.

**Foto equivocada (1):** #174 (foto de una moto como espejo LED).
→ Mejora: comprobar que la foto pertenece al producto (nombre + etiqueta) y revisar fotos mal etiquetadas en la biblioteca.

**Core (web):** #162 (reactivar pedido): arreglado por web-maraton en Core 3.14.109 (botón «Ya se entregó» y «Cambiar mensajero», sin avisos).

## 3. Orden sugerido para bot-maraton
1. Quitar la aprobación de salidas del cajón (la molestia más clara y repetida).
2. Consultar ficha y app antes de escribir a un proveedor; una sola ruta de redacción.
3. Lennys decide precio y comisión; no mandar esas decisiones a Ernesto.
4. «No preguntes lo que ya se dijo» para todo mensaje a dependientas y administradores (#165, #171, #177).
5. Poner en vivo el arreglo #161 (esperar a que la rama del servidor `ccr-f459b3eb-utyhix` no tenga cambios sin fusionar).
6. «Nunca anoto/envío sin acción real» (#158, #164, #172, #173).

Cómo se mide: errores nuevos por semana, mensajes del bot a Lennys por día (hoy ~50 en 3 días), preguntas repetidas (meta 0).

## 4. Revisión del 3-nov (mañana, hasta las 10:35)
Hecho en vivo el 2-nov por bot-maraton (VivaBot 9aa585b): salidas del cajón sin preguntar a Lennys, proveedor (ficha y app antes de preguntar, 1 pregunta), Lennys decide precio y comisión, #161 (cambiar mensajero). Errores cerrados: #161, #178–#181.

Sigue abierto (7 abiertos y varios por decidir): #184 (mensajes cortos de seguimiento caen en búsqueda de productos), #185 (bombillo LED → lámpara de 85 USD), #186 («completa tu perfil con correo y clave»), #187 («lo confirmo y te digo» sin poder), #188 («lo consulto con el proveedor» sin consultar), #189 («se lo paso al equipo» sin avisar), #190 (decía a Lennys que Ernesto aprueba), #191 («se lo paso al supervisor» sin nada concreto, 15 min sin responder).

Nuevo sin registrar: gestor Harley (…6951) pegó la descripción de un «Colgador de cartera»; el bot tomó cada línea como producto y mandó 7 fotos sin relación (lámpara de techo, limpiadores). Regla: un mensaje largo con viñetas o medidas es una descripción, no una lista de búsquedas.

Carga sobre Lennys: 7 mensajes del bot entre 10:00 y 10:30 (comisiones, 2 preguntas de precio ya contestadas, borrador de guirnalda, lista del día). Agrupar en uno por tarea y no repreguntar.
Carga sobre Zaymi: ~12 mensajes del bot el 2-nov pese a la orden de Ernesto; hoy 1. Aplicar la propuesta de #177.
Pendiente aparte: soltar carreras desde el chat «Tú» de Ernesto (#181) y el tope de salidas (salidas_tope_usd/cup) que Lennys debe fijar una vez.
