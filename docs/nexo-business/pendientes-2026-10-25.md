# Pendientes para el domingo 25-oct-2026 (resumen de todas las sesiones, noche del 24)

En vivo al cerrar el 24-oct: Core **3.14.67.4 → 3.14.69** (Casa-Viva `main`), VivaBot `a858f88` corriendo (main más nuevo `c0faa81` en disco, entra con el próximo reinicio tranquilo). #Vale encendido para todas (20:52).

## Pa'llá (app de mensajeros) — sesión `palla-app`
- En vivo en modo prueba: entra quien pide su enlace por privado (Elaine, Michael, Adrián, Leonardo, Pedri, Daiquel y la cuenta de prueba 161). Aviso en Mensajerías #2923.
- **A medias:** (1) bot `c0faa81` («Pa'allá», «Paya») sin correr hasta el próximo reinicio tranquilo. (2) Nadie ha hecho aún una carrera real: con la primera comprobar «✅ es de X» en el grupo, vale por privado, aviso de hora a la gestora y Recogí/Entregado. (3) La pantalla «Sin conexión» enseña palabras de WhatsApp («Recogí 4986») que **no están subidas** (Core `feat/carrera-palabras` 3.14.59 + bot `feat/tarjeta-carrera` e2789a1): subirlas renumeradas o quitar ese texto.
- **Decide Ernesto:** #5411, #5427, #5428 llevan +25 h sin mensajero (subir mensajería o asignar) · ¿abrir a todos (`cvd_palla=si`) o seguir por petición (recomendado)? · ¿`tarjeta_carrera=si` o seguir en «avisos»? · guía de la vista de tienda (`/palla/tienda`) para Nana y Zaymi · video sin voz con HyperFrames.
- Ramas: nada sin subir en Core/bot. En `ernesto-rondon-nexo` sin commit: capturas, `docs/nexo-business/apps/palla/lista-errores-y-prueba.md`, entradas de ESTADO.

## Recogida → mensajería y «me lo asignó» — sesión `vivabot-asignar-al-mensa`
- En vivo y comprobado: Core 3.14.62 (recogida→mensajería con tarifa oficial + «me lo asignó a mí»), 3.14.64 (avisos de pedidos al correo de Ernesto, D112), 3.14.69 (GitHub «Validar aplicación» en verde por primera vez desde el 11-oct). VivaBot `5c0c657` y `deee904`. Nada roto ni a medias.
- **Falta comprobar en uso real:** el primer caso de una gestora que pase una recogida a mensajería o un mensajero que diga «me lo asignó» (`cv chat`, el pedido en la web y el correo a rondonernesto316).
- **Opcional (decide Ernesto):** subir WooCommerce del entorno de pruebas 8.2.2 → 11.2.1 · traducir al español los estados del «Centro de pedido» (sale «handed_over»).
- Limpieza: se pueden borrar `C:\Users\Ernesto\vivabot-recogida-mensajeria` y `C:\Users\Ernesto\Casa-Viva-recogida` (ya fusionadas). Docker Desktop sigue encendido.

## Revisión de inventos del bot — sesión `revisi-n-de-inventos-del`
- Rama VivaBot `fix/no-inventar-1024` (b3e0193 + 422e53a, sobre a858f88) en GitHub, **sin unir a main ni desplegar**. `npm run check` en verde. Informe: `revision-bot-24oct.md` (notas de esa sesión); L66 en ESTADO.
- Arregla: explicaciones inventadas del cobro (Dany), del vale y los tiempos (Ana #5445, Zulien #5428), «las recogidas no salen al grupo», discutir algo que Lennys/Ernesto autorizaron (Arle #5436), promesas «lo reviso y te aviso ahora mismo» → escalación real, «mándame los datos» → «escribe #Vale», horario siempre 10:00–4:00 todos los días, nunca precios ni tiendas sacados de internet, conocimiento de «paid» y «bajo pedido», resumen del General de las 20:00.
- **Decide Ernesto:** (1) ¿desplegar la rama? (2) ¿corregir las fichas #148 y #323 en vivo? (`node scripts/conocimiento-1024.mjs`, `--hacer`) (3) ¿modelo de gestoras gpt-4.1 → gpt-5.5 (obedece mejor, cuesta más)? (4) ¿Ela trabaja con Adrian Pedro? Hoy `mensajero_por` le da sus carreras a Pedri.
- **Dinero que mirar:** #5428 (30 USD): Core dice Leonardo 20:41, Zulien dice otro mensajero (…5320) por la mañana · #5430 (60 USD): Max dijo «entregado» 14:34 y sigue «recogido».
- Propuestas sin hacer (tarjeta task_a375e7df): no contestar mensajes que eran para Ernesto; no mandar a la tienda preguntas que no son de producto; no repreguntar tras una caída; resumen de Lennys sin decisiones ya hechas.

## Web del maratón — sesión `web-maraton`
- En vivo y en GitHub: Core 3.14.68 (`abbeb93`), VivaBot `a858f88`. #Vale encendido para todas (20:52) y anunciado (#2934).
- **Decide Ernesto:** (1) la rama `fix/no-inventar-1024` (arriba) (2) precio de las 220 toallas para Dayana y revisar MK-2045 (paquete de 6 a 26 USD) frente a la tabla de SeFué («18 a nosotros») (3) proyector de Damarys (…4548, 60 USD, Dario): Ernesto pregunta características; a Damarys no se le ha dicho nada (4) zhu: panel solar Jinko 720 W de un cliente, ella quiere 5 USD por dejarlo (Ernesto tiene la foto) (5) nota de voz de Dany sobre 1,20 USD que le sobra «por los vales» («deja revisar»).
- **Vigilar:** primeros #Vale reales (aviso al cliente, tope 20/h) · cobro mixto USD + CUP: nadie lo ha usado; contarle a Lennys y a la tienda que el aviso dirá «40 USD + 967 CUP» en efectivo.
- **Esperando respuesta:** Javier de SeFué (220 toallas, #2909) · Lennys (fotos de textura, grosor y tamaño, #2911).
- Mejoras pequeñas: panel saluda «Hola .» sin nombre · «Vuelve el día» solo desde WordPress · la Ficha que contesta dice «Fotos reales: todavía no hay» aunque hay fotos de 159 productos en `/root/archivos/fotos-reales` sin enlazar · `cv reiniciar` no reinicia de noche si hay avisos «tienda-turno» en cola.
- (#5450 en «Recogida en tienda»: ya avisado como prueba, #2930.)

## Bot del maratón (voz y bajo pedido) — sesión `bot-maraton`
- En vivo: notas de voz de General/Mensajerías transcritas; bajo pedido al momento (app de Kevin + 1 pregunta, «llega el <día>», sin recordatorio de 20 min); gpt-5.5 para respuestas raras de proveedores; copia de «Tú» al correo cada 15 min; horarios de proveedores por día (Kevin L-V 10-17, S 10-14, D cerrado).
- **Vigilar:** (1) **lunes 26-oct 8:30** se enciende solo el vale automático (`/root/supervisor/tareas/vale-auto-lunes.sh`): revisar el PRIMER vale real de Kevin («🧾 #N: hice el vale…») (2) **domingo 21:00** primer repaso de horarios: en seco ponía Maritza y Grupo Fadiar «domingo cerrado» y **LJH «viernes cerrado»** (3) primera nota de voz real del General transcrita (`cv chat general 5`) (4) medir antes/después: `node scripts/bajo-pedido-tiempos.mjs --dias 7`.
- **Decide Ernesto:** ¿LJH de verdad cierra los viernes?
- Huecos que dependen de Ernesto: TRD 42 y 23 (sin WhatsApp: HAY / NO HAY) · respuesta de la gestora a una «otra opción» del proveedor (la ve el supervisor, el bot no la enlaza).
- Incidente 19:29 Mensajerías: el resumen nocturno invitó a «escriban Yo» y el bot asignó #5428 Leonardo, #5427 Ely, #5411 Chadet; nada cancelado. Corregida la skill `cierre`.

## «Listo» de proveedor sale solo — sesión `proveedor-listo-sale-sol`
- En vivo: VivaBot `73ff83a` desde las 19:02 (D114). Nada a medias.
- **Vigilar:** el primer pedido de Kevin con vale que pase por «Listo»: que salga solo al grupo en menos de 5 min, que a Ernesto le llegue «📣 #N salió solo» y la nota del pedido. Recordatorio: si Ernesto lleva él un pedido de proveedor, avisar antes de que la tienda pulse «Listo».
- Limpieza: se puede borrar `C:\Users\Ernesto\vivabot-listo-proveedor`.

## De esta sesión (principal)
- Programación pendiente de la bandeja (`/root/supervisor/parte/por-hacer.md`): errores del General, promesas, proveedores, técnicos, errores #73 #80 #81 #82 (varios ya los cubre `fix/no-inventar-1024`), tarifa de Kevin pedido por pedido, `?ref` en el vale, número consecutivo de pedidos (Lennys).
- #Vale inteligente: que entienda **audios y texto libre** con pocas instrucciones. **Tutoriales** de los cambios para las gestoras. Preguntar **día y hora de la reunión semanal**. **Maratón con los mensajeros**. Electrodomésticos (Ernesto busca proveedores). Lista de compras ya enviada a Lennys (#2898).
- Olla #4988: falta «Dinero recibido» cuando Ely lleve los 62 USD. Paraguas de Ela: Kevin cerró por lluvia; vale `0ea7e17a` pendiente en su app.
- Commit pendiente en `ernesto-rondon-nexo`: ESTADO.md, DECISIONES.md (D109–D114), capturas y notas de varias sesiones, todo sin commit.

## Por dónde empezar mañana (recomendado)
1. **Decidir la rama `fix/no-inventar-1024`** y desplegarla con los chats tranquilos: es la que más errores evita.
2. **Dinero:** #5428 y #5430 (quién entregó y cobró), Ely #4988 (62 USD).
3. **Carreras sin mensajero:** #5411, #5427, #5428 (ya asignadas por el incidente de las 19:29: comprobar).
4. **Tutorial del #Vale** para las gestoras y vigilar los primeros vales reales.
5. #Vale con audios y texto libre.
6. Resto de la bandeja y decisiones pequeñas (LJH viernes, modelo de gestoras, Ela con Adrian Pedro, toallas, proyector, panel Jinko).

## Añadido el 25-oct noche (Ernesto)
- **Avisos de Pa'llá: FUNCIONAN** — a Ernesto le llegó «si ves esto, las notificaciones funcionan» (con Psiphon). Falta: comprobar en un teléfono **sin VPN**; plan APK nativo (como Mandao/La Nave, conexión propia sin Google) pedido a `palla-app`, antes de construir manda plan con datos/día. Arreglar «Pa'llá no está disponible» al abrir la app instalada.
- **Pantalla de carga animada en TODAS las apps** (Pa'llá, Casa Viva/web, caja, panel y las que vengan): en vez de la pantalla de carga actual, el logo hace una animación mientras carga (la «P» de Pa'llá, el logo de Casa Viva…), con el estilo de la animación de Claude cuando «trabaja». Ernesto mandará una captura de cómo se ve ahora. **Pendiente, no empezado.**
