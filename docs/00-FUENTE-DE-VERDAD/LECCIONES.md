# LECCIONES — errores que ya cometimos y cómo no repetirlos

Lectura obligatoria para cualquier agente antes de decir "ya funciona". Añade una fila cada vez que algo falle por una causa que se pudo prever.

## Reglas que salen de esas lecciones

1. **"Compilado", "enviado" o "desplegado" no es "funciona".** Solo vale lo que se comprobó en el uso real (o lo confirma la persona). Etiquetas: DESARROLLADO · PROBADO EN CI · INSTALADO · VERIFICADO EN OPERACIÓN.
2. **Antes de decir que se publicó, mirar la dirección pública** (`curl` o navegador) y buscar el texto nuevo.
3. **Antes de diagnosticar, buscar una prueba que distinga las hipótesis** (p. ej. "¿le llegaron otros mensajes enviados igual?"). No cambiar código por una sospecha.
4. **Leer el código que corre en producción, no el de `main`.** VivaBot y NEXO tienen ramas `ccr-*` desplegadas que no están en `main`.
5. **Pensar 2 o 3 pasos por delante del usuario**: después de crear algo, ¿cómo entra, cómo lo recupera, qué pasa si se equivoca, qué pasa si ya existía?
6. **Probar con datos reales solo con copia de seguridad** y dejarlo todo como estaba (o explicar qué quedó).
7. **Toda corrección de dinero (comisiones, caja, stock) se simula antes en una transacción revertida** y se prueba el caso parcial, no solo el completo.

## Registro

| Fecha | Qué falló | Causa real | Regla |
|---|---|---|---|
| 2026-10-10 | Lennys no podía entrar al panel aunque "ya estaba arreglado" | El arreglo estaba en una rama y Vercel no publica solo desde el 4-oct | 2 |
| 2026-10-10 | Se dijo "enviado" y a Lennys no le llegó / no lo vio | El buzón marca "enviado" cuando WhatsApp lo acepta; nadie confirmó la entrega | 1 |
| 2026-10-10 | Se cambió el envío a `@lid` y el bot lo rechazó | Diagnóstico sin prueba; el bot en el VPS (rama `ccr`) solo admite teléfono o grupo `@g.us` | 3, 4 |
| 2026-10-10 | Devolver 1 de 3 anulaba la comisión de las 3 | La función solo contemplaba devoluciones totales | 7 |
| 2026-10-10 | Comisión de gestora siempre 0 en la caja | D36 se cargó en la web (Core) y no en NEXO; regla general en 0 | 1 |
| 2026-10-10 | Tras "Crear cuenta" no había forma clara de entrar | Se construyó el paso, no el recorrido completo | 5 |
| 2026-10-10 | Lennys pudo añadir 14 toallas con 3 en stock | La caja no comprobaba existencias al añadir al carrito | 7 |
| 2026-10-11 | El trabajo nocturno habría fallado en silencio (401) | La clave de Vault no es la misma que el secreto de la función; solo se vio al ejecutar el trabajo de verdad | 1 |
| 2026-10-11 | La regla de fotos del panel habría rechazado a la dueña | Las reglas de storage corren como `authenticated`, que no puede llamar a `nexo_business.role_of`; solo se vio probando el INSERT como ella | 1 |
| 2026-10-11 | Copiar comisiones en la ficha de costo habría puesto costo 0 a productos | La comisión vivía dentro de una tabla que exige precio de compra | 5 |
| 2026-10-11 | Un audio de una gestora (Patry) se quedó sin respuesta | Se reinició VivaBot justo cuando llegaba (11:45:12): el bot estuvo desconectado unos segundos y no lo procesó | Antes de reiniciar el bot, mirar que nadie esté escribiendo; después, comparar `crm_wa_messages` con `crm_messages` del rato del reinicio y contestar lo que falte |
| 2026-10-14 | #3693 «pasó solo» a Listo y salió repetido al grupo | Nota de Core con autor «system» ≠ «nadie»: el servicio de transiciones no pone autor. La verdad está en `_cvd_operation_history` (`user_id 63` = Nana pulsó «Listo»). Y lo coordinado a mano (Pedri) no estaba en Core | 3 · Antes de culpar al bot o a un cron, leer `_cvd_operation_history` / `_cvd_delivery_history` del pedido. Lo que se coordina a mano tiene que quedar en el sistema (o el sistema no debe publicar solo) |
| 2026-10-14 | «El bot tomó un mensaje de Ernesto como orden» (chat de Elaine) | Lo escribió Elaine («Pasar a frank»), pero los mensajes que atiende el reparto no se guardaban en `crm_messages`; `cv chat` solo enseñaba el de Ernesto | 3 · Para saber quién escribió qué, mirar `crm_wa_messages` (todo lo que entra), no solo `cv chat` |
| 2026-10-14 | Dos preguntas iguales con 2 s de diferencia | Dos mensajes seguidos leían el mismo registro antes de que el primero lo guardara | Los frenos «1 vez cada X min» se reservan en memoria ANTES del primer `await` |
| 2026-10-14 | `sed -i` en Git Bash quitó los CRLF de un archivo de Core | Git Bash de Windows reescribe los finales de línea | En VivaBot y Core: editar con Edit o con node (`fs.readFileSync`/`writeFileSync`), nunca `sed -i` |
| 2026-10-22 | Claude preguntó a Kevin por la cafetera Royal y la olla Ariete, que no eran suyas | Se dio por hecho que todo SKU MK- es de Kevin y no se miró ni su app ni el anuncio | D90: MK-<n> → `crm_market_items` (de quién es) → su app/anuncio → preguntar solo lo que falte al proveedor correcto |
| 2026-10-22 | El bot afirmó a Lennys que un pago de Nadielys «ya está reportado y subido» | Contestó de memoria sin mirar `cvd_payouts` | Ningún «ya está pagado/subido» sin leer el estado real; si no lo sabe, «lo reviso» (registro de errores #1) |
| 2026-10-22 | Mensaje de Nana reenviado a Joyce y a otra gestora sin relación | Las preguntas abiertas emparejaron un mensaje sin cita con preguntas viejas | Si la dependienta no cita ni nombra el producto, preguntar a qué se refiere antes de reenviar (registro #2) |
| 2026-10-23 | La IA dijo «ya lo marco como devuelto», «la transferencia ya está subida» y «puedo entrar a BizneCubano» aunque el prompt lo prohibía | Una regla solo en el prompt no basta: la IA la salta | Lo que el bot NO puede hacer (marcar, pagar, entrar en webs) se frena en código antes de enviar (`src/acciones-falsas-rules.js`), con una respuesta verdadera y escalación (registro #1, #3, #59) |
| 2026-10-23 | El horario de recogida («hasta las 5») estaba copiado en 6 archivos, 6 fichas de conocimiento y una opción de Core | Cada función escribió su propio texto | Un dato del negocio que puede cambiar va en UNA constante (`src/horario-rules.js`) y se busca también en `crm_knowledge` y en Core al cambiarlo |

### 26-oct · «Ya están en la tienda» sin comprobar (gomas #5480, Kay)
- Lennys escribió a Ernesto «Ya están las gomas en tienda» y se lo pasé a Kay como hecho («ya están en la tienda, tu cliente puede pasar»). No era verdad: el pedido a Ricardo no se llegó a hacer. El cliente compró en otro sitio y se canceló #5480.
- **Regla:** antes de decirle a una gestora que algo está listo o en la tienda, comprobarlo en el sistema (estado del pedido, «Listo» de la tienda, recepción del proveedor) o con la dependienta de turno. Un comentario suelto en un chat no es confirmación. Ernesto: «siempre es bueno confirmar antes».
| 2026-10-28 | «SSH bloqueado / web caída» el 27 y 28-oct, y nadie lo supo | La PC salía por Proton VPN (IP compartida que los hostings frenan); la web y el VPS estaban bien (desde 3 países 200 OK). Se creyó caída del servidor sin probar desde fuera | 3 · Antes de decir «está caído», probar desde fuera (check-host.net) y mirar `curl https://api.ipify.org`. Un vigilante en el VPS (`cv salud`) avisa por ntfy+correo; ControlMaster no sirve en el ssh de Git para Windows: agrupar en UN ssh |

### 29-oct · La carrera de ensayo salió como «Carrera libre» a 10 mensajeros (#5729)
- Creé el pedido de prueba en un paso y lo asigné en otro; la asignación falló (en `wp eval` no había usuario administrador) y, mientras, el sistema lo ofertó: 10 teléfonos sonaron e Ibelice lo quiso coger.
- **Regla:** una carrera de ensayo se crea y se asigna en la MISMA ejecución, como administrador (`wp_set_current_user`), y se comprueba en el acto que quedó «asignada»; si no, se borra enseguida. Desde 3.14.82 el ensayo (`_cvd_ensayo`) no manda avisos de Pa'llá, pero el grupo de Mensajerías también hay que vigilarlo.
| 2026-10-30 | Las fotos reales que subió el catálogo (29-oct, 189 fotos) quedaron de **portada** en 88 productos y salieron así en el panel de Lennys (banqueta con su foto del General, colgador sin foto comercial). Además, el bot añadió «Cómo se compra en Casa Viva» dentro de 938 descripciones | El estándar decía «la foto real va primero» y nadie de la tienda lo había visto; se aplicó a todo el catálogo de golpe y se avisó a Lennys después. Una frase de un documento se tomó como aprobación de un cambio visible para clientes | Antes de un cambio masivo que se VE en la web (portada de producto, texto de todas las fichas), enseñar 2–3 ejemplos a quien lleva la tienda (Lennys) y esperar su visto bueno; piloto de 5–10 productos reales, no de todo el catálogo. Las fotos nuevas van al final de la galería salvo que Lennys diga otra cosa (Core 3.14.89). Cada cambio masivo, con su copia y su script de vuelta atrás listos ANTES de tocar nada |
| 2026-11-01 | Pedido #5581: Zaymi lo reactivó (ya entregado) y quedó con la entrega «sin asignar», con el mensajero equivocado (Damián en vez de Melany) y sin poder anotar el pago. Además el bot entendió «cambiar el mensajero» como «pasar a mensajería» y le pidió dirección | «Reactivar» solo devuelve el estado a «en espera / con mensajero»; no pregunta quién entregó ni cómo se cobró, y no hay botón de cambiar mensajero. El bot interpretó una palabra suelta sin confirmar | Un pedido reactivado porque «ya se entregó» debe pedir quién lo entregó y cómo se cobró y quedar «entregado» sin avisos (pedido a web-maraton, errores #161 y #162). Si una frase puede significar dos cosas (cambiar el nombre vs cambiar a mensajería), el bot repite lo que entendió en una línea antes de pedir datos |
