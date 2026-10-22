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
