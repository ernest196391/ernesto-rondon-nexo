# Prueba de «Mi estudio de fotos» con Dany — 14-oct-2026

Gestora: Dany (…4351, user 18). Modo Gemini gratis (D63, Core 3.14.4). Guía de 5 pasos enviada 11:44.
Ernesto le pidió probarla a las 14:01; Claude la sigue y la guía como si fuera Ernesto.

## Hallazgos (en orden)
1. **14:10 — Gemini NO funciona en Cuba sin VPN.** gemini.google.com dice «Por el momento, Gemini no está disponible en tu país» (captura de Dany, `/root/archivos/entrantes/2026-10-14/5352544351-AC01CF8C….jpg`). D63 suponía que la app/web de Gemini sí se usaba gratis en Cuba: **es falso sin VPN**. Ernesto (14:14): «prueba con VPN».
   - Consecuencia: la guía debe decir «enciende la VPN antes de abrir Gemini», o hay que buscar otra vía (Plan B gratis sin VPN / Plan C con clave de Casa Viva, ver D63).
2. **13:46 — Pidió fotos de todos los colores** del Set de alfombras para baño 3 piezas (producto 177, 15 USD). El bot le prometió mandarlas y no lo hizo. En la web solo **gris** tiene foto real; **rojo (2798), rosado (2799) y azul (2965)** usan la foto genérica de IA. 14:17: se le mandó la del gris y se pidieron a Nana las otras tres (#1046).

3. **14:18 — Con VPN Gemini SÍ abre**; la foto tarda en generarse («demora un poco»). 14:19: se le explicó guardar la foto (mantener el dedo → Descargar) y «Subir mi foto de Gemini».

4. **14:19 — Dany: «Es muy práctica la idea pero con la mala conexión que hay en Cuba está difícil».** Gemini con VPN + subir la foto + esperar la generación es pesado con datos móviles cubanos. Se le preguntó dónde se traba (subir la foto o esperar la nueva).
   - **Opción a decidir (Ernesto):** que la foto la genere Casa Viva en el servidor (Plan C de D63: una clave de Casa Viva, ~3,40 USD / 100 fotos) y la gestora solo la elija y la descargue: sin VPN, sin Gmail, sin subir nada.

5. **14:24 — ¡Salió la foto!** Producto: Set para baño 3 piezas (alfombra, cesta y cortina), #2573, 28 USD. **Fiel**: misma cortina oscura con hojas rosadas/blancas, alfombra rosada de chenilla y cesta; fuera de la caja, en un baño ambientado. La instrucción en español funcionó (Gemini respetó «sin textos ni marcas»). Captura: `/root/archivos/entrantes/2026-10-14/5352544351-AC929F3F….jpg`.
   - **Dany: «Demoró más en subir la foto que en generarla».** Lo lento es SUBIR la foto base a Gemini con datos cubanos + VPN, no la generación. → Refuerza la opción de generar en el servidor (Plan C).
   - 14:26: se le pidió descargarla y subirla con «Subir mi foto de Gemini» (paso 5).

6. **14:25 — «Algo falló. Prueba otra vez.» al tocar «Subir mi foto de Gemini».** Ese texto sale en `assets/gestora-estudio.js` cuando la respuesta NO es OK y no trae JSON con `message` (los errores de Core sí lo traen). Límites del servidor bien (upload/post 1536M, máx. Core 15 MB) y la ruta `casa-viva/v1/gestora/estudio/subir` contesta JSON también con 12 MB (401 sin sesión). **Hipótesis:** con la VPN encendida, el hosting bloquea la subida (página de bloqueo, no JSON). 14:30: se le pidió apagar la VPN y repetir.
   - **Mejoras pendientes:** (a) la guía debe decir «VPN solo para Gemini; apágala antes de subir»; (b) el JS debería enseñar el código HTTP («Algo falló (403)») para poder diagnosticar sin captura.

7. **14:30 — Sin VPN tampoco sube** («Nada. No sube»). La hipótesis de la VPN NO era. Comprobado:
   - En el servidor, la misma función que guarda la foto (`ingest`) funciona con un JPG de 1024 px (probado con la cuenta de prueba 45, «Prueba Gestora BORRAR»; quedó una foto de prueba en su galería).
   - Todos los errores de Core traen texto; «Algo falló» = la respuesta no llegó de WordPress o llegó sin JSON.
   - La cuenta 45 no puede usar el estudio por HTTP (no es gestora aprobada), así que no se pudo reproducir por la web sin entrar como Dany. `cvd_estudio_usuarios` se tocó un momento y volvió a «18,33».
   - **14:32 — Registro TEMPORAL** `wp-content/mu-plugins/cvd-estudio-log.php` → `wp-content/uploads/cvd-estudio-log/subidas.log` (privado, 403 desde fuera): apunta cada subida que llega a WordPress (hora, usuario, IP, tamaño, error de PHP, respuesta). **Borrarlo al terminar la prueba.** Se le pidió a Dany repetir sin VPN.

8. **14:34 — Dany repitió: el registro siguió VACÍO.** **Dayra (user 33, …6597) igual**: hizo con Gemini una foto preciosa del organizador colgante, «no me dejó subirla, me da fallo». Dos gestoras, mismo fallo, y ninguna subida llegó al punto del registro.
   - **14:52 — Registro ampliado** (mismo archivo mu-plugin): ahora apunta todo POST a `/gestora/estudio/*`, también los rechazados por sesión/nonce (antes el filtro `rest_pre_dispatch` no los veía: la comprobación de la cookie corta antes). Probado con nonce falso → apuntado `rest_cookie_invalid_nonce` 403.
   - **14:53 — Core 3.14.12** (Casa-Viva `73fb9aa`, copia `~/bak-20261014-cvd-3.14.11-antes-3.14.12/`): el error dice «Algo falló (código N)…». 14:54: se les pidió a las dos cerrar/abrir el estudio y repetir con captura.
   - Pregunta aparte de Dany (14:44): ver todo de la A a la Z sin departamentos → ya existe con `?orderby=title`; se le mandó su enlace `tienda/?ref=CV18DANYMS19&orderby=title`.

9. **14:57 — Con 3.14.12, Dany ve «Algo falló (código 500)».** Error interno de PHP, sin JSON → se cae dentro de WordPress antes de `rest_post_dispatch` (por eso no se apuntaba). El hosting no guarda los fatales (`log_errors` vacío; `error_log` solo trae avisos de la clave de Google: 429 de cuota a las 14:41 y «API key not valid» a las 14:51 — de la «Opción avanzada», usuario 0).
   - Reproducido en el servidor como Dany (user 18) con `ingest()`: producto 2573 sin color, con «rosado» y sin producto, con un JPG de prueba y con la **foto real de Gemini de Dayra** (1024×1024): **todo OK** (fotos borradas al momento con `rest_delete`; su galería sigue en 0). Guardar la foto NO es el fallo: falla al recibir la petición HTTP real del móvil.
   - 15:00 — **Caja negra** añadida al mu-plugin (`register_shutdown_function` con `error_get_last()`, tiempo, memoria, `$_FILES`): línea «FIN …» por cada POST al estudio. Se le pidió a Dany un último intento.

10. **15:01 — CAUSA ENCONTRADA por la caja negra** (intento de Dany: `424051.jpg`, image/jpeg, 187 KB, error 0 → la foto SÍ llegaba bien): `Uncaught Error: Call to undefined function wp_tempnam()` en `class-cvd-gestora-estudio.php:548` (`save_to_gallery`). `wp_tempnam()` vive en `wp-admin/includes/file.php`, que WP-CLI carga pero una petición REST desde el área NO. Por eso mis pruebas con `wp eval` pasaban.
   - **15:02 — Core 3.14.13** (Casa-Viva `78a2238`, copia `~/bak-20261014-cvd-3.14.12-antes-3.14.13/`): `require_once ABSPATH . 'wp-admin/includes/file.php'` antes de `wp_tempnam()` en `save_to_gallery` y `jpeg_bytes`. Otros usos de `wp_tempnam` (fichas, busca, market-bridge) ya lo cargaban.
   - **Lección:** probar con `wp eval` no sustituye a una petición HTTP real; las funciones de `wp-admin/includes` no existen en REST/front.
   - 15:03: avisadas Dany (#1058) y Dayra (#1059) para repetir.

11. **15:04 — ¡SUBIDA OK con 3.14.13!** Dany, 187 KB, código 200, en su galería (1024×1024, `src gemini`). Primera foto real del estudio en modo Gemini, de punta a punta.
   - **Fricción nueva:** sale «Foto sin producto» (product 0): al cerrar y abrir el estudio se pierde el producto elegido, y sin producto no hay «Poner en mi tienda». La pantalla dice «elige primero el producto arriba y súbela otra vez». 15:05: se le guió (elegir producto → subir otra vez → Poner en mi tienda).
   - **Mejora a programar:** recordar el producto elegido (localStorage) y/o «Elegir producto» desde una foto de la galería, sin volver a subirla.

12. **16:05–16:11 — Lennys (user 14, admin + gestora aprobada) lo prueba** (Ernesto lo pidió; `cvd_estudio_usuarios` = «18,33,14»). Guía de 5 pasos + 3 trucos (VPN solo para Gemini, elegir producto antes, lo lento es subir). **Lo hizo SOLA de punta a punta**: instrucción 16:07, subida 16:11 (627 KB, 200), «Poner en mi tienda» 16:11 → Alfombra de Sala estilo Persa con su foto en su tienda. Al principio mandó el enlace del chat de Gemini en vez de la foto → la guía debe decir «descarga la FOTO, no compartas el chat».
13. **Dato (16:15) para Dany:** en la web, 31 productos con colores tienen colores sin foto propia (97 de 220; 86 con existencias). Peores: Set de 2 alfombras (8), Alfombra Bienvenido (7), Fundas Majestic (6), Alfombra con piecitos (5).

14. **18:40 — Core 3.14.16 EN VIVO** (Casa-Viva `11e99f7`, copia `~/bak-20261014-cvd-3.14.14-antes-3.14.16/`; se saltó 3.14.15 porque otra sesión la tiene preparada en `cv-errores`). Arregla lo visto hoy:
   - **Recuerda el producto, la idea, el color y el texto** en el móvil (7 días, por gestora). Al ir a Gemini el móvil suele recargar la página: al volver todo sigue elegido y «Subir mi foto de Gemini» la guarda con su producto (causa probable del «sin producto» de Dany).
   - **«Elegir producto» en las fotos sin producto de la galería** (y «Cambiar producto» en las demás), sin volver a subirla; ruta nueva `POST gestora/estudio/foto-producto`. Si se sube sin producto, el buscador se abre solo en esa foto y sugiere el último producto elegido.
   - **Textos:** paso 3 «Gemini en Cuba necesita VPN. Enciéndela solo para Gemini.»; encima de «Subir mi foto de Gemini»: «descarga la FOTO (no compartas el chat ni el enlace)» y «Gemini en Cuba necesita VPN; apágala para subir aquí».
   - Probado: la ruta nueva en el servidor con la cuenta de prueba 45 (producto bueno, producto malo, foto inexistente, color que no existe; galería dejada como estaba); la pantalla nueva pintada como la cuenta 45 y probada en el navegador integrado con el servidor simulado (elegir producto en una foto, recordar tras recargar, subir con y sin producto, ancho de móvil); en vivo: versión 3.14.16, ruta registrada (401 sin sesión), home/tienda 200, textos nuevos en la pantalla de Dany. **Falta verla usada por una gestora** (DESARROLLADO + INSTALADO, no VERIFICADO EN OPERACIÓN).
   - **El registro temporal `wp-content/mu-plugins/cvd-estudio-log.php` SIGUE PUESTO** (Dayra prueba mañana). Quitarlo cuando acabe su prueba.

## Pendiente
- **Quitar `wp-content/mu-plugins/cvd-estudio-log.php`** (y `wp-content/uploads/cvd-estudio-log/`) después de la prueba de Dayra del 15-oct.
- Ver a Dany o Dayra usar «Elegir producto» y el producto recordado (3.14.16).
- Resultado de Dany con VPN (¿abre?, ¿deja adjuntar la foto y pegar la instrucción?, ¿la foto sale fiel?, ¿se sube bien con «Subir mi foto de Gemini»?).
- Fotos de Nana → a Dany y a las variaciones 2798/2799/2965 en la web.
