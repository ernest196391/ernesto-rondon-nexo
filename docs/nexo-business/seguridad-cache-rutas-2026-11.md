# Seguridad: ¿la caché de la web enseña datos privados? (10-nov-2026)

**Qué se revisó:** todas las rutas de la web casaviva.company (Core **3.14.165**, 235 rutas REST) y las páginas con enlace firmado, para ver si LiteSpeed (la caché del hosting) puede guardar una respuesta privada y dársela a quien **no** tiene permiso. Motivo: el 10-nov se vio que pasaba con `/wp-json/casa-viva/v1/bot/` (ya arreglado con `cache-exc`).

**No se cambió nada** (ni el Core ni LiteSpeed). Solo lectura y pruebas.

## Resumen para Ernesto (en sencillo)

- ✅ **No hay ninguna fuga activa ahora mismo.** Pedí desde fuera, sin clave, las 59 rutas privadas que devuelven datos: todas dicen «no tienes permiso» (401/403) y ninguna sale de la caché.
- ⚠️ **Hay un grupo con el mismo fallo que tenía el bot: el panel** (`/panel/...`: gestoras, clientes, pagos, ventas, contabilidad, caja…). La caché **sí guarda** esas respuestas durante 7 días. Hoy no se pueden leer porque el panel pide cada vez una dirección distinta (le pone la hora al final, `_=1731…`), y nadie puede adivinarla. Pero es una cerradura que depende de un truco: si un día algo llama al panel sin ese truco, se abre como pasó con el bot.
- 🟡 Dos cosas pequeñas más: el último aviso push (`/push/latest`) y la página de revisión de fichas de Lennys (se guarda con su enlace y puede enseñar la lista vieja).
- ✅ **Panel ARREGLADO el 14-nov con el SÍ de Ernesto (D155):** el panel ya está en la lista de exclusiones de LiteSpeed, igual que el bot, y se vació la caché. Comprobado: LiteSpeed lo marca «EXCLUIDA», sus rutas responden `no-cache`, y la tienda sigue con caché («hit»). Para deshacer: `wp litespeed-option set cache-exc "/wp-json/casa-viva/v1/bot/"`.

## Cómo decide LiteSpeed (lo que importa)

- La web tiene `cache-rest = 1` (guarda respuestas de la API) y guarda **7 días** (`cache-ttl_pub = 604800`).
- LiteSpeed 7.9.2 **no guarda** una respuesta de la API si: hay alguien con sesión de WordPress, o la petición lleva cabecera `Authorization` (código de LiteSpeed, `control.cls.php` → `finalize()`: «authenticated REST request»).
- LiteSpeed **no entiende nuestras claves propias en cabecera** (`X-VivaBot-Key`, `X-Nexo-Panel-Key`, `X-Palla-Token`, `X-Tc-Token`): para él es un visitante anónimo y guarda la respuesta.
- Poner `Cache-Control: no-store` en la respuesta **NO sirve** (LECCIONES 10-nov). Lo que sí sirve: `do_action( 'litespeed_control_set_nocache', '…' )` en la ruta, o la exclusión `cache-exc`.
- La caché guarda por **dirección completa** (con todo lo que va después de `?`). Solo se quita de la dirección `fbclid gclid utm* _ga` (`cache-drop_qs`). **Nunca** añadir `_` ahí: abriría el panel.

## Tabla

| Ruta (todas bajo `/wp-json/casa-viva/v1`) | Cómo se autentica | ¿Fuga? | Arreglo propuesto |
|---|---|---|---|
| `/bot/*` (todas) | clave en cabecera `X-VivaBot-Key` | ✅ No (arreglado el 10-nov). Probado hoy: sin clave 401, sin copia en caché | Nada. No quitar `cache-exc = /wp-json/casa-viva/v1/bot/` |
| **Panel (GET):** `/panel/gestoras`, `/panel/payouts`, `/panel/sales`, `/panel/sales/{id}/detail`, `/panel/clients`, `/panel/pay-accounts`, `/panel/collections`, `/panel/messengers`, `/panel/messenger-cash`, `/panel/daily-rates`, `/panel/shipping-rates`, `/panel/stock/levels`, `/panel/stock/web-sales`, `/panel/curru/status`, `/panel/products/copies`, `/panel/products/{id}/copy`, `/panel/products/{id}/variations`, `/panel/products/{id}/ficha`, `/panel/programa`, `/panel/contabilidad`, `/panel/contabilidad/mes`, `/panel/caja/web-orders`, `/panel/caja/cash-collections`, `/panel/supplier-split/{id}`, `/panel/supplier-sales`, `/panel/vendedores/articulos` | clave en cabecera `X-Nexo-Panel-Key` (`CVD_Panel_Bridge::authorized`), sin sesión de WordPress | ✅ **Arreglado 14-nov (D155).** Antes: ⚠️ latente — la respuesta con clave **se guardaba** en la caché pública 7 días (por código: solo pone `Cache-Control`, no llama a `set_nocache`; es el mismo mecanismo que se probó con `/bot/` el 10-nov). **Hoy no se puede leer**: las 6 funciones de Supabase que llaman (`nexo-panel-web`, `nexo-stock-bridge`, `nexo-curru`, `nexo-device-receive`, `billete-seguro-revisa`…) añaden `_=<milisegundos>` y la dirección limpia da 401 sin copia (probado). Datos en juego: clientes, teléfonos, cuentas de cobro, comisiones, contabilidad. **No probado con la clave** (solo está en Supabase; en la web solo hay su huella) | **1)** Ya: `wp litespeed-option set cache-exc "/wp-json/casa-viva/v1/bot/` + salto de línea + `/wp-json/casa-viva/v1/panel/"` + `wp litespeed-purge all` (deshacer: dejar solo la línea del bot). **2)** En el Core (cinturón): en `CVD_Panel_Bridge::authorized()`, si la clave vale, `do_action( 'litespeed_control_set_nocache', 'Panel: datos privados' )` |
| Pa'llá: `/palla/hoy`, `/palla/historial`, `/palla/app` | token en cabecera `X-Palla-Token` | ✅ No. Al comprobar el token, el Core inicia la sesión del mensajero dentro de la petición (`wp_set_current_user`) y LiteSpeed ya no guarda; `/palla/hoy` además llama a `set_nocache`. Probado sin token en la dirección exacta que usa la app (`historial?dias=31`): 401, sin copia. **No probado con un token real** (no hay cuenta de prueba de mensajero activa en Pa'llá, y no quise entrar como un mensajero de verdad) | ✅ Hecho 14-nov en Core 3.14.170 (`history()` pasa por `out()` y `CVD_Palla_Push::out()` llama a `set_nocache`) |
| Triciclub y Pa'llá Transporte: `/triciclub/*`, `/pv/*` (yo, viajes, chofer/hoy, cuenta, semana…) | token en cabecera `X-Tc-Token` (cliente) o `X-Palla-Token` (chofer) | ✅ No. Todas las GET pasan por `out()`, que llama a `set_nocache` (arreglo de 3.14.118.1). Probado sin token: 401 | Nada |
| Gestora (app y web): `/gestora/pedidos`, `/gestora/pedido/{id}`, `/gestora/estudio/*`, `/gestora/confianza/lista`, `/gestora/busca/pedidos` | inicio de sesión de WordPress (cookie + nonce) | ✅ No. LiteSpeed no guarda peticiones de la API con sesión. Probado sin sesión: 401, sin copia. **No probado con una sesión real** (no entro con contraseñas) | Nada |
| Tienda / dependientas / admin: `/sales`, `/sales/{id}/edit`, `/sales/products`, `/sales/extras`, `/cierre`, `/cierre/historial`, `/order-center/{id}`, `/structured-incidents/{id}`, `/inventory/*`, `/voucher/products`, `/notifications`, `/vendedor/*`, `/contenido/products`, `/messenger/feed` | inicio de sesión de WordPress | ✅ No (igual que la fila anterior). Probado sin sesión: 401 | Nada |
| Seguimiento: `/delivery/{id}/tracking`, `/customer/orders/{id}/tracking` | token en la dirección / sesión | ✅ No. Llaman a `set_nocache`. Sin token: 403/401 | Nada |
| `/push/latest` (último aviso del teléfono) | cookie `cvd_push_device` (sin sesión de WordPress), **dirección fija** | 🟡 **Latente, bajo.** No llama a `set_nocache`. Si lo pidiera un teléfono con la cookie pero sin sesión, LiteSpeed guardaría el aviso (título, texto, enlace) y se lo daría a cualquiera 7 días. Hoy: 1 solo teléfono suscrito (admin, con sesión → caché privada); el de Pa'llá añade `_=` y no tiene ninguno. Probado: 204, sin copia | ✅ Hecho 14-nov en Core 3.14.170 (`set_nocache` en `CVD_Web_Push::latest_for_device()`) |
| `/triciclub/foto`, `/pv/foto` | firma en la dirección | ✅ No (la firma va en la dirección: sin firma no hay foto) | Nada |
| `/products/search`, `/shipping/quote`, `/manifest` | público | ✅ Datos públicos (la versión de gestora va con sesión) | Nada |

### Páginas con enlace firmado

| Página | Cómo se autentica | ¿Fuga? | Arreglo propuesto |
|---|---|---|---|
| Revisión de fichas de Lennys `/?cvd_revision_fichas=1&t=…` | token en la dirección (el mismo para todos, vale 7 días) | 🟡 **No es fuga, pero sí se guarda.** Probado: con token 200 «miss» → 200 **«hit»** (la segunda vez sale de la caché); sin token o con token falso: 403, sin copia. Quien tenga el mismo enlace ve lo mismo (esperado). Efecto: después de aprobar fichas, al volver a abrir el mismo enlace puede salir la lista vieja (el Core solo purga el producto, no esta página) | ✅ Hecho 14-nov en Core 3.14.170 (`DONOTCACHEPAGE` + `set_nocache` en `review_page()`; probado: dos veces con token → `no-cache`) |
| Pa'llá `/palla/` (token después de `#`, no llega al servidor), Tablero `/tablero/` (datos por POST), pago de comisión, «entregado» del mensajero, tarjeta de carrera, preguntas de fichas, NEXO Busca, encuesta, seguimiento, tienda de vendedor, registro | token en la dirección o sesión | ✅ No. Todas llaman a `set_nocache`; probado `/tablero/` y `/palla/`: `X-LiteSpeed-Cache-Control: no-cache` | Nada |
| Enlaces cortos de comprobante `/cv/m|p/…/<firma>` | firma en la dirección | ✅ No (son redirecciones a un mapa o a un producto) | Nada |

## Cómo se probó

1. Copia del Core del servidor (3.14.165; la copia local `Casa-Viva` está en 3.13.97, vieja) y lista de las 235 `register_rest_route`; para cada GET fuera de `/bot/` se miró su permiso y si llega a `litespeed_control_set_nocache`.
2. Configuración de LiteSpeed con wp-cli: `cache-rest=1`, `cache-ttl_pub=604800`, `cache-exc=/wp-json/casa-viva/v1/bot/`, `cache-drop_qs=fbclid gclid utm* _ga`, `cache-priv=1`.
3. Código de LiteSpeed 7.9.2 (`src/control.cls.php`, `finalize()`): no guarda la API con sesión o con `Authorization`.
4. Desde fuera, sin clave: 59 rutas GET privadas → todas 401/403, ninguna «hit».
5. Página de revisión de fichas: enlace pedido con la clave del bot (solo lectura), abierto dos veces con token y una sin token y otra con token falso.

## Lo que NO se pudo probar

- El panel **con su clave**: la clave solo vive en los secretos de Supabase. La conclusión sale del código y del mismo fallo comprobado con `/bot/` el 10-nov.
- Una petición **con sesión de WordPress** real o **con token real de Pa'llá**: no hay cuenta de prueba de mensajero activa y no se entra con contraseñas. La conclusión sale del código de LiteSpeed y de que, sin permiso, no hay copia guardada en las direcciones que usan las apps.
