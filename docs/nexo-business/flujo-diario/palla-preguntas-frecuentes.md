# Pa'llá · preguntas frecuentes de los mensajeros (para VivaBot)

Preparado el 30-oct-2026 para la apertura del 31-oct. **Solo lectura:** nada cargado en la base, nada enviado.

**Comprobado contra:**
- **Core** = `C:\Users\Ernesto\Casa-Viva`, `origin/main` 7fcba0c (Core **3.14.101**, el que está en vivo: la página `/palla/` dice `"version":"3.14.101"`, `"mode":"prueba"`). Rutas dentro de `wordpress/casa-viva-dropship-core/`.
- **Android** = `C:\Users\Ernesto\Casa-Viva` `origin/main:android/palla/` (app 1.3, versionCode 4). No existe `ernesto-rondon-nexo/android/palla`.
- **Bot** = `C:\Users\Ernesto\vivabot-menos` 30258eb (`src/dispatch-rules.js`, `src/dispatch.js`, `src/modo-tranquilo-rules.js`).
- **Guía pública** = https://casaviva.company/palla/guia (leída hoy en vivo; texto en `assets/palla/guia.html`).
- **Chats reales** (crm_messages de 15 mensajeros, 20 al 30-oct): Pedri …5601, Marlon …2689, Leonardo …3239, Ibelice …8068. `cv errores 7d`: ningún error del bot sobre Pa'llá. **Daiquel …3773 NO se leyó:** su contacto es privado (bot_mode ignorar) y solo se lee si Ernesto lo pide.

---

## 1. Preguntas frecuentes (20)

**1. ¿Cómo consigo mi enlace de Pa'llá?**
Escríbeme *Pa'llá* aquí por privado y te mando tu enlace personal al momento. Es solo tuyo: no lo pases a nadie.
Fuente: bot `dispatch-rules.js:859-871` (isPallaAsk, pallaLinkText) y `dispatch.js:1308-1331` (sendPallaLink); Core `includes/class-cvd-palla.php:116-139`.

**2. ¿Hay que instalar algo?**
No hace falta. El enlace se abre en Chrome y ya funciona. Si tienes la app de Android de Pa'llá, el mismo enlace se abre dentro de la app, y con ella te suena aunque la tengas cerrada.
Fuente: bot `dispatch-rules.js:870`; Core `class-cvd-palla.php:177-194` (el enlace abre la app); `assets/palla/app.js:489-491`.

**3. ¿Y si no tengo Android (tengo iPhone)?**
Pa'llá funciona en el navegador del teléfono con tu enlace. Lo que no tendrás es el aviso con la app cerrada: déjala abierta y toca «🔊 Activar sonido».
Fuente: Core `app.js:291` (fuera de Android, «Ir» abre el mapa web), `app.js:401-405` (con la app abierta suena; cerrada, solo la app de Android). *No probado en iPhone: ver apartado 3.*

**4. ¿Tiene contraseña?**
No. Entras con tu enlace personal y el teléfono lo recuerda. El enlace dura 30 días; cuando caduque, escríbeme *Pa'llá* y te mando otro.
Fuente: Core `class-cvd-palla.php:15-17` y `:27` (30 días); `app.js:1076-1091` (lo guarda en el teléfono); guía `guia.html:174`.

**5. No me carga Pa'llá, ¿qué hago?**
La primera vez necesitas señal para bajar tus carreras. Toca «Probar otra vez» o el botón de actualizar (la flecha que gira). Si sigue sin cargar, escríbeme aquí lo que hiciste con el número del pedido.
Fuente: Core `app.js:910` («La primera vez hace falta señal»), `app.js:347-349` y `:945`; guía `guia.html:173`.

**6. Se me fue la señal en medio de la carrera, ¿qué pasa?**
Sigue trabajando: lo que toques (Recogí, Llegué, Entregado, Problema, No puedo) queda guardado y se manda solo cuando vuelve la señal. Sin señal no te llegan carreras nuevas, y «La cojo» y «Pasar» necesitan señal.
Fuente: Core `app.js:5-6`, `:254-263` (cola), `:205-209` («La cojo» no va a la cola), `:227` (pasar necesita señal), `:869`.

**7. ¿Cómo cojo una carrera?**
En «Libres» tocas «La cojo». Es como el «Yo» del grupo: el primero que toca, gana. Si te sale «ya la cogió otro», fue más rápido otro compañero.
Fuente: Core `app.js:577-587`, `includes/class-cvd-palla-api.php:803-822` (won / yours / taken); guía `guia.html:103-104`.

**8. ¿Qué es «Disponible» y «No disponible»?**
En Disponible (verde) te suenan las carreras libres; en No disponible no te suena ninguna. En «Ajustes» eliges tus zonas y a qué hora te desconectas solo. Lo de tus carreras ya cogidas te sigue llegando.
Fuente: Core `includes/class-cvd-palla-disponible.php:3-11`, `app.js:509-539`, `:955-956`; `includes/class-cvd-palla-push.php:232` (el aviso solo va a los disponibles).

**9. ¿Tengo que poner a qué hora lo entrego?**
No. Desde el 30-oct Pa'llá ya no pide la hora. Solo tocas Recogí y Entregado; si tocas «Llegué», el cliente se entera de que estás en la puerta.
Fuente: Core `app.js:632-637` (3 pasos: Recogí · Entregado · Dinero), `:914` (ya no hay hoja de hora), `:675-677`.

**10. ¿Cómo marco Recogí, Llegué y Entregado?**
Abre tu carrera: al recoger tocas «Recogí»; en camino sale «Entregado · cobré X» (y «📍 Llegué», que es opcional). Entregado cobra lo que dice el vale.
Fuente: Core `app.js:669-685`, `:991-1002`; `class-cvd-palla-api.php:866-869`.

**11. Me equivoqué y toqué «Entregado», ¿qué hago?**
Tienes 5 segundos: toca «Deshacer» y no se marca. Si ya pasó, toca «Problema» en esa carrera, elige «Otro problema» y escribe qué pasó: la tienda lo ve al momento.
Fuente: Core `app.js:678-683`, `:996-1004` («Entregando… · Deshacer», 5 s); `includes/class-cvd-tarjeta-carrera.php:115` («Problema» también después de entregado), `app.js:686`.

**12. El cliente pagó otra cantidad o el vale está mal.**
No toques Entregado. Toca «Problema» y elige «Solo quiso una parte» o «El vale está mal». Espera lo que diga la tienda antes de marcarlo entregado.
Fuente: Core `app.js:763` (motivos), `class-cvd-palla-api.php:872` («No lo marques entregado hasta que te digan»); ESTADO 3.14.96 («cobra lo que dice el vale»).

**13. ¿Cuánto llevo a la tienda y hasta cuándo?**
Pa'llá te lo dice: en la carrera («A la tienda», con el vuelto sumado) y en «Mi dinero». Llévalo antes de las 4:00 p. m.; si entregaste después de las 4, al otro día antes de las 4. Cuando la dependienta marca «Dinero recibido», se pone en cero.
Fuente: Core `app.js:564`, `:663-664`, `:819-820`; `includes/class-cvd-messenger-delivered-link.php:112-115`; `class-cvd-palla-api.php:469-470`; guía `guia.html:128`.

**14. ¿Cómo le paso una carrera a un compañero?**
En tu carrera toca «Pasar», elige al compañero y «Pedir que la acepte». Sigue siendo tuya hasta que él toque «La acepto»; si ya la recogiste, dale el paquete en mano.
Fuente: Core `app.js:688`, `:795-805`, `:565-569`; `class-cvd-palla-api.php:166-173`; guía `guia.html:144`.

**15. Ya no puedo hacer la carrera, ¿cómo la suelto?**
Si todavía no la recogiste, toca «No puedo» y luego «Sí, la suelto»: vuelve a quedar libre. Si ya tienes el paquete, no se puede soltar: toca «Problema» o «Pasar».
Fuente: Core `app.js:687`, `:807-811`; `class-cvd-palla-api.php:875-876` (released / too_late).

**16. ¿Cómo hago para que me suenen las carreras nuevas?**
Con la app de Android: deja que Pa'llá te mande notificaciones, pon su batería en «Sin restricciones» y ponte en Disponible. En Chrome solo suena con la app abierta: toca «🔊 Activar sonido» y después «🛵 Esperando carreras».
Fuente: Android `MainActivity.java:68-69` (pide notificaciones), `AvisosService.java:126`; Core `app.js:495-498`, `:467-474`, `:967`; ESTADO 28-oct (permisos y batería «Sin restricciones»).

**17. Cambié de teléfono o perdí el enlace.**
Escríbeme *Pa'llá* desde tu WhatsApp de siempre y te mando un enlace nuevo. Si perdiste el teléfono o te lo robaron, dímelo aquí y se anula el enlace viejo.
Fuente: bot `dispatch.js:1308-1331`; Core `class-cvd-palla.php:92-95` (revoke anula todos sus enlaces); guía `guia.html:185`.

**18. ¿Sigue el grupo de Mensajerías?**
Sí, el grupo sigue funcionando igual. Pa'llá es otra forma, más rápida, de coger y cerrar las carreras.
Fuente: guía `guia.html:172`; Core `class-cvd-palla.php:109`; ESTADO 29-oct («grupo de WhatsApp sigue igual para todos»).

**19. ¿La mensajería sigue siendo mía? ¿Pa'llá cuesta algo?**
Sí, la mensajería es tuya, igual que siempre. Pa'llá es gratis para los mensajeros de Casa Viva.
Fuente: guía `guia.html:171` y `:182`; Core `class-cvd-palla-api.php:869` («La mensajería es tuya»).

**20. ¿Dónde veo lo que gané?**
En «Mi dinero»: «Hoy» te dice lo que ganaste y lo que llevas a la tienda; «Historial» te da esta semana, este mes y cada día.
Fuente: Core `app.js:813-857`; `class-cvd-palla-api.php:455-490`.

---

## 2. Errores típicos y qué contestar

| Lo que dice o ve el mensajero | Qué pasa de verdad | Qué contestar | Fuente |
|---|---|---|---|
| «No me deja coger» / sale «#N ya la cogió otro» | Otro tocó antes, o la carrera ya no está libre. | Esa la cogió otro compañero antes que tú. Toca actualizar y mira las que siguen libres. | `class-cvd-palla-api.php:817`; `class-cvd-bot-bridge.php:597-598` |
| «La cojo» sin señal | No se guarda en la cola (otro podría cogerla). | Para coger necesitas señal. Si no tienes, escribe «Yo» en el grupo debajo del anuncio. | `app.js:205-209`, `:875` |
| «Dice que no estoy aprobado» / «Pa'llá es para los mensajeros aprobados» | Su número no coincide con un mensajero aprobado (o escribe desde otro WhatsApp). | Pa'llá es para los mensajeros aprobados. Regístrate con este mismo WhatsApp: casaviva.company/registro-mensajero/ (si ya estás aprobado con otro número, escríbeme desde ese). | bot `dispatch-rules.js:873`; `class-cvd-bot-bridge.php:869-887` |
| «Pa'llá todavía no está abierta» | Interruptor `cvd_palla = no`. Hoy está en `prueba`, así que no debería salir. | Ahora mismo está cerrada. Sigue con el grupo de Mensajerías como siempre; te aviso cuando abra. | `dispatch-rules.js:874`; `class-cvd-palla.php:58`, `:109` |
| «Pa'llá está en prueba» | Modo prueba y no está en la lista. Al pedir el enlace al bot entra solo. | Escríbeme *Pa'llá* y te doy entrada con tu enlace. | `class-cvd-palla.php:59`, `:120-126` |
| «Tu enlace ya no vale» | Caducó (30 días) o se anuló. | Escríbeme *Pa'llá* y te mando uno nuevo. | `class-cvd-palla.php:101` |
| «Abre tu enlace personal» / en la app de Android «Pega tu enlace» | Abrió Pa'llá sin enlace. | Abre el enlace que te mandé por aquí (o pégalo en la app). Si no lo tienes, escríbeme *Pa'llá*. | `app.js:1098`, `:892` |
| «No me suena» | Varias causas: No disponible, sin permisos, batería, app web cerrada o avisos en prueba. | Mira que estés en Disponible (verde). Con la app de Android: notificaciones de Pa'llá encendidas y batería «Sin restricciones». En Chrome: deja la app abierta y toca «Activar sonido». | `app.js:439`, `:495-498`; `AvisosService.java:93`, `:126`; ESTADO 28-oct |
| En Ayuda dice «Avisos de la app: todavía no están abiertos para ti» | Los avisos (`cvd_palla_push`) siguen en prueba. | Los avisos con la app cerrada se están encendiendo para todos. Mientras, deja la app abierta. | `AvisosService.java:93`; `class-cvd-palla-push.php:13-15` |
| «El vale no dice cuánto cobrar» y no deja tocar Entregado | El pedido no tiene cifra. | No lo entregues todavía: escríbeme aquí el número del pedido y lo vemos con la tienda. | `app.js:660`, `:994` |
| «#N ya no es tuya. Si tienes el paquete, llama a la tienda» | La tienda la quitó o la pasó. | Esa carrera ya no está a tu nombre. Si tienes el paquete, avísame aquí y lo arreglamos. | `app.js:143-146` |
| «Ya tienes el paquete, no se puede soltar» | Intentó «No puedo» después de Recogí. | Toca «Problema» o «Pasar». | `class-cvd-palla-api.php:876` |
| Al pasar: «Nadie más usa Pa'llá todavía» | Solo se puede pasar a quien entra en Pa'llá. | Pásala por el grupo o escríbeme aquí a quién se la quieres pasar. | `app.js:799`; `class-cvd-palla-api.php:166` |
| «Mándame el link del grupo Pa'llá» (Ibelice, 30-oct) | Pa'llá NO es un grupo: el bot le mandó el enlace de la app y Ernesto tuvo que corregir. | Pa'llá es una app, no un grupo. Las carreras también salen en el grupo de Mensajerías. | crm_messages 30-oct 17:13 (…8068) |
| «¿Sin conexión me avisa de carreras?» (Pedri, 25-oct) | No: sin señal no llega nada nuevo. | Sin señal no te llegan carreras nuevas. Lo que ya cogiste sigue y lo que toques se manda al volver la señal. | crm_messages 25-oct 00:57 (…5601); `app.js:869` |
| «Lo cerré por WhatsApp y la app dice que ya no es mía» (Pedri, 25-oct) | Arreglado en 3.14.69.16: ahora sale «✅ #N entregado». | Si lo cerraste por WhatsApp, la app lo muestra como entregado. | `app.js:140-145` |

---

## 3. Lo que NO sé o no está claro (no inventar)

1. **Cómo consiguen la app de Android.** La APK 1.3 está en el VPS (`/root/archivos/palla/palla-1.3.apk`) «sin repartir» (ESTADO 29-oct). No hay en el código ni en la guía un enlace de descarga. Hasta que Ernesto decida, el bot no debe prometer la app: solo el enlace (que sirve en Chrome).
2. **Avisos con la app cerrada para todos.** `cvd_palla_push` sigue en `prueba` (2 probadores) y solo con el tipo «carrera libre». El plan del 31-oct 8:30 es ponerlo en `si` con el SÍ de Ernesto (ESTADO, «Siguiente acción exacta»). Hasta entonces, a los demás la app les dice «todavía no están abiertos para ti».
3. **Apertura a todos.** Hoy `cvd_palla = prueba`. Mientras siga así, cualquier mensajero aprobado que escriba *Pa'llá* entra solo (alta automática). Mañana cambia a `si` solo con el SÍ de Ernesto.
4. **iPhone / Safari:** no hay ninguna prueba registrada. No sé si el sonido, el «Esperando carreras» o los avisos funcionan ahí.
5. **Teléfono de la tienda para «llama a la tienda».** La app dice «llama a la tienda», pero en el código no hay un número de llamada (solo el WhatsApp de Casa Viva 5354056173 en el botón de Ayuda). Por eso las respuestas dicen «escríbeme aquí».
6. **Horario de recogida.** La app enseña la opción `cvd_tarjeta_recogida_horas` (si no está puesta: «de 10:00 a. m. a 4:00 p. m.»), pero el conocimiento #423 dice que los mensajeros recogen hasta las 5 p. m. No sé qué valor tiene la opción en vivo. No lo he puesto en las respuestas.
7. **Quién anula un enlace perdido.** Solo se puede con `wp eval 'CVD_Palla::revoke(ID);'` (Ernesto o una sesión con acceso). La tienda no tiene botón. La guía dice «Avisas a la tienda y anula tu enlace al momento»: en la práctica lo hace Ernesto.
8. **En «No disponible» la lista «Libres» se sigue viendo.** La app no filtra las ofertas (`class-cvd-palla-api.php:286-301`): solo deja de sonar y de avisar. La tarjeta dice «No te llegan carreras», que puede confundir. No sé si Ernesto quiere que puedan coger estando desconectados.
9. **Ajustes de Xiaomi** (Inicio automático, batería): en la prueba del 29-oct dos avisos seguidos no sonaron. No hay guía cerrada de qué tocar en cada marca.
10. **«Gasta muy pocos datos»** (guía): no está medido.
11. **Daiquel (…3773):** no leí su chat (contacto privado). Si Ernesto quiere, se revisa con `cv chat 3773 40 --privado`.

### Desactualizado (para corregir aparte; yo no he cambiado nada)
**En la guía pública https://casaviva.company/palla/guia:**
- «Una carrera en **6 toques**» (`guia.html:100`): ahora son 3 (La cojo → Recogí → Entregado).
- Paso 2 «**Dices a qué hora la entregas**» + captura `paso-2.jpg` (`guia.html:108-111`): desde 3.14.86 la app no pide la hora.
- Paso 4 «Marcas cómo pagó el cliente» + captura «¿Cuánto cobraste?» (`guia.html:120-123`): ahora es un toque, «Entregado · cobré X», con 5 s para «Deshacer».
- Antes/ahora «Te preguntan la hora → **La pones una vez y avisa sola**» (`guia.html:158`).
- «No hay que instalar nada» (`guia.html:75`) y «Se abre con Chrome y, si sale Instalar…» (`guia.html:184`): ya existe la app de Android (aunque sin repartir).
- Paso 3 «Llamar y **Mapa**» (`guia.html:116`): ahora es «Llamar» e «Ir», con mapa dentro de la carrera.
- «Tocas **Pasar a otro mensajero**» (`guia.html:144`): el botón dice «Pasar».
- «Pídele tu enlace personal **a la tienda**. Estamos empezando con pocos mensajeros» (`guia.html:195`): se pide escribiendo *Pa'llá* al WhatsApp y se abre para todos.
- No menciona: Disponible/No disponible, Llegué, Deshacer, Mi dinero → Historial.

**Fuera de la guía (también dicen «pon la hora»):**
- Conocimiento del bot **#338** («pones a qué hora la entregas») y **#339** («Ábrelo con Chrome y, si sale «Instalar»…»).
- Core `class-cvd-palla-api.php:233`: al aceptar un pase dice «Pon a qué hora la entregas».
- Bot `dispatch-rules.js:852-853`: «Pon la hora en la app» (vale del pase) y a la gestora «Te aviso la hora en cuanto la diga» (ya no llega).
- Core `app.js:1098` y `class-cvd-palla.php:101`: «Pídele a la tienda tu enlace» / «Pide uno nuevo a la tienda» (lo correcto es escribir *Pa'llá* al bot).

---

## 4. Líneas para cargar en el bot (con --prueba: no guardan nada)

```
cv aprender "¿Cómo consigo mi enlace de Pa'llá?" "Escríbeme *Pa'llá* aquí por privado y te mando tu enlace personal al momento. Es solo tuyo: no lo pases a nadie." mensajero palla --prueba
cv aprender "¿Hay que instalar algo para usar Pa'llá?" "No hace falta. El enlace se abre en Chrome y ya funciona. Si tienes la app de Android de Pa'llá, el mismo enlace se abre dentro de la app, y con ella te suena aunque la tengas cerrada." mensajero palla --prueba
cv aprender "¿Pa'llá funciona si no tengo Android o tengo iPhone?" "Pa'llá funciona en el navegador del teléfono con tu enlace. Lo que no tendrás es el aviso con la app cerrada: déjala abierta y toca «Activar sonido»." mensajero palla --prueba
cv aprender "¿Pa'llá tiene contraseña?" "No. Entras con tu enlace personal y el teléfono lo recuerda. El enlace dura 30 días; cuando caduque, escríbeme *Pa'llá* y te mando otro." mensajero palla --prueba
cv aprender "No me carga Pa'llá, ¿qué hago?" "La primera vez necesitas señal para bajar tus carreras. Toca «Probar otra vez» o el botón de actualizar (la flecha que gira). Si sigue sin cargar, escríbeme aquí lo que hiciste con el número del pedido." mensajero palla --prueba
cv aprender "Se me fue la señal en medio de la carrera en Pa'llá, ¿qué pasa?" "Sigue trabajando: lo que toques (Recogí, Llegué, Entregado, Problema, No puedo) queda guardado y se manda solo cuando vuelve la señal. Sin señal no te llegan carreras nuevas, y «La cojo» y «Pasar» necesitan señal." mensajero palla --prueba
cv aprender "¿Cómo cojo una carrera en Pa'llá?" "En «Libres» tocas «La cojo». Es como el «Yo» del grupo: el primero que toca, gana. Si te sale «ya la cogió otro», fue más rápido otro compañero." mensajero palla --prueba
cv aprender "¿Qué es Disponible y No disponible en Pa'llá?" "En Disponible (verde) te suenan las carreras libres; en No disponible no te suena ninguna. En «Ajustes» eliges tus zonas y a qué hora te desconectas solo. Lo de tus carreras ya cogidas te sigue llegando." mensajero palla --prueba
cv aprender "¿Tengo que poner en Pa'llá a qué hora lo entrego?" "No. Desde el 30 de octubre Pa'llá ya no pide la hora. Solo tocas Recogí y Entregado; si tocas «Llegué», el cliente se entera de que estás en la puerta." mensajero palla --prueba
cv aprender "¿Cómo marco Recogí, Llegué y Entregado en Pa'llá?" "Abre tu carrera: al recoger tocas «Recogí»; en camino sale «Entregado · cobré X» (y «Llegué», que es opcional). Entregado cobra lo que dice el vale." mensajero palla --prueba
cv aprender "Me equivoqué y toqué Entregado en Pa'llá, ¿qué hago?" "Tienes 5 segundos: toca «Deshacer» y no se marca. Si ya pasó, toca «Problema» en esa carrera, elige «Otro problema» y escribe qué pasó: la tienda lo ve al momento." mensajero palla --prueba
cv aprender "El cliente pagó otra cantidad o el vale está mal, ¿qué hago en Pa'llá?" "No toques Entregado. Toca «Problema» y elige «Solo quiso una parte» o «El vale está mal». Espera lo que diga la tienda antes de marcarlo entregado." mensajero palla --prueba
cv aprender "¿Cuánto llevo a la tienda y hasta cuándo, según Pa'llá?" "Pa'llá te lo dice en la carrera («A la tienda», con el vuelto sumado) y en «Mi dinero». Llévalo antes de las 4:00 p. m.; si entregaste después de las 4, al otro día antes de las 4. Cuando la dependienta marca «Dinero recibido», se pone en cero." mensajero palla --prueba
cv aprender "¿Cómo le paso una carrera a un compañero en Pa'llá?" "En tu carrera toca «Pasar», elige al compañero y «Pedir que la acepte». Sigue siendo tuya hasta que él toque «La acepto»; si ya la recogiste, dale el paquete en mano." mensajero palla --prueba
cv aprender "Ya no puedo hacer la carrera, ¿cómo la suelto en Pa'llá?" "Si todavía no la recogiste, toca «No puedo» y luego «Sí, la suelto»: vuelve a quedar libre. Si ya tienes el paquete, no se puede soltar: toca «Problema» o «Pasar»." mensajero palla --prueba
cv aprender "¿Cómo hago para que me suenen las carreras nuevas de Pa'llá?" "Con la app de Android: deja que Pa'llá te mande notificaciones, pon su batería en «Sin restricciones» y ponte en Disponible. En Chrome solo suena con la app abierta: toca «Activar sonido» y después «Esperando carreras»." mensajero palla --prueba
cv aprender "Cambié de teléfono o perdí mi enlace de Pa'llá, ¿qué hago?" "Escríbeme *Pa'llá* desde tu WhatsApp de siempre y te mando un enlace nuevo. Si perdiste el teléfono o te lo robaron, dímelo aquí y se anula el enlace viejo." mensajero palla --prueba
cv aprender "¿Con Pa'llá sigue el grupo de Mensajerías?" "Sí, el grupo sigue funcionando igual. Pa'llá es otra forma, más rápida, de coger y cerrar las carreras." mensajero palla --prueba
cv aprender "¿Con Pa'llá la mensajería sigue siendo mía? ¿Cuesta algo?" "Sí, la mensajería es tuya, igual que siempre. Pa'llá es gratis para los mensajeros de Casa Viva." mensajero palla --prueba
cv aprender "¿Dónde veo en Pa'llá lo que gané?" "En «Mi dinero»: «Hoy» te dice lo que ganaste y lo que llevas a la tienda; «Historial» te da esta semana, este mes y cada día." mensajero palla --prueba
```

Notas para cargarlas: `cv aprender` busca duplicados por las 3 palabras más largas de la pregunta; si choca con #338/#339, conviene **corregir esas dos** (dicen «pones la hora» y «ábrelo con Chrome») en vez de añadir con `--ok`. Las respuestas no llevan comillas dobles, `$` ni `!`, para pegarlas tal cual en la terminal.
