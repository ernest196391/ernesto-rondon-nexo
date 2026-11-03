# Arquitectura: Triciclub (lo que hace La Nave, para triciclos, con viajes + paquetes + carga)

**Fecha:** 3-nov-2026 · **Decisiones de Ernesto:** el motor va **dentro del Core de Casa Viva** (D129, excepción a D16); **el precio lo pone cada chofer** y el cliente elige de una lista (D130).
**Construido (rama `feat/triciclub` del Core, 3.14.115, sin subir):** `includes/class-cvd-triciclub{,-db,-precio,-api}.php`, `assets/triciclub/` (app del cliente y pantalla del chofer).
**Lee antes:** `recon.md` (pantallas S/C/A y flujos), `features.csv` (must/should/could), `schema.sql`.

## Stack

| capa | elección | por qué |
| --- | --- | --- |
| motor (API y datos) | Módulo nuevo en `casa-viva-dropship-core` (WordPress, PHP 8.2), archivos `includes/class-cvd-triciclub*.php` | Decisión D129: reusa Pa'llá, sus enlaces sin contraseña, push, mapa y el puente con VivaBot. Archivos aparte para poder sacarlo a NEXO más adelante |
| base de datos | MySQL/MariaDB del mismo WordPress (Hostinger), 6 tablas `wp_cvd_tc_*` con dbDelta | La que ya tiene el Core. Nada de WooCommerce: un viaje **no** es un pedido de la tienda |
| app del cliente | PWA en `casaviva.company/triciclub/` (página PHP + JS sin framework, como `/palla/`), marca Triciclub | El mismo patrón que Pa'llá: manifest, service worker, cola sin conexión. Sin CORS. `triciclub.casavivadecuba.com/app` redirige allí |
| app del chofer | Pa'llá: una sección «Triciclub» dentro de `/palla/` (viajes junto a las carreras) | Lo eligió Ernesto: un solo app para el mensajero/chofer |
| mapa | MapLibre + PMTiles (ya en `assets/palla/mapa.js`), datos de OpenStreetMap | Gratis, sin Google |
| kilómetros y minutos | OSRM con el mapa de Cuba en el VPS (ya usado por `assets/palla/ruta.js`); si no responde en 8 s: línea recta × 1,3 | Precio fijo con km reales por calles |
| direcciones | `CVD_Geo_Direccion` («23 y L», «Calle X entre Y y Z» → punto) + tocar en el mapa | Ya funciona con las calles de La Habana en nuestro servidor |
| entrar (cliente) | Teléfono + código de 6 cifras que manda **VivaBot por WhatsApp**; luego token HMAC en el móvil (como Pa'llá, 90 días) | En Cuba el SMS a veces no llega (queja de La Nave); WhatsApp lo tienen todos. Sin contraseñas |
| entrar (chofer) | El token de Pa'llá de siempre | Ya existe |
| pagos | Efectivo o transferencia **directo al chofer**; la app solo anota «cobrado» | Como La Nave. No hay pasarela; no se toca dinero |
| avisos | Web push a choferes (`CVD_Palla_Push`); el cliente ve todo en la app. WhatsApp solo para el código de entrada | Regla D126: solo mensajes necesarios |
| tareas | WP-Cron + el cron del servidor que ya llama a `wp-cron.php` | Lo que ya usa el Core |
| hosting | Hostinger (Core) + VPS (OSRM, VivaBot) | Lo que ya hay. Cero costes nuevos |

Un solo motor, una base de datos, cero servicios nuevos.

## Esquema

Tablas: **6** (`clientes`, `choferes`, `viajes`, `ubicaciones`, `valoraciones`, `eventos`) + la opción `cvd_tc_tarifas`.
Ver `schema.sql`.

**Acceso: comprobación en cada endpoint (MySQL no tiene RLS).**
- Cliente: cabecera `X-TC-Token` = HMAC(`wp_salt('auth').'|cvd-tc'`, `cliente_id|caducidad|época`). Solo ve **sus** viajes.
  Del chofer ve nombre, inicial del apellido, nota, número y descripción del triciclo, LOT al día (sí/no), teléfono
  **solo mientras el viaje está activo** y su última ubicación **solo** en su viaje.
- Chofer: token de Pa'llá + fila en `choferes` con `estado='aprobado'` + `CVD_Registration::is_approved_messenger()`.
  Antes de coger un viaje solo ve servicio, barrio de origen y destino, km y precio (sin teléfono ni nombre del cliente).
  Al cogerlo ve nombre, teléfono y punto exacto.
- Administrador: `current_user_can('manage_woocommerce')` (Ernesto). Nadie más aprueba choferes ni cambia tarifas.
- El enlace «Compartir viaje» es un token aparte, de solo lectura, que caduca al terminar el viaje.

## Cómo sale el precio (D130: lo pone cada chofer)

1. Cada chofer tiene en su perfil: CUP por km (300 por defecto) hasta el km 5, y CUP por km después (150 por defecto).
2. Hay 5 franjas horarias iguales para todos (opción `cvd_tc_franjas`, hora de Cuba). El chofer pone un **% extra** en
   cada una (0–100 %). Por defecto, del estudio `../estudio-horarios-2026-11-03.md`: madrugada 00–06 +50 %,
   pico de la mañana 06–09 +20 %, día 09–15 0 %, pico de la tarde 15–19 +25 %, noche 19–24 +30 %
   (las horas tienen evidencia; los % son una recomendación sin dato público).
3. El cliente pone recoger y llevar → `GET cerca` → ve los triciclos libres a menos de 4 km, **cada uno con su precio**
   para la franja de ahora, su nota, sus viajes y si tiene la LOT al día. Elige uno.
4. Cuenta: km ≤ tramo → km × precio_km; km > tramo → tramo × precio_km + (km − tramo) × precio_km_despues; mínimo el
   precio de 1 km; + % de la franja; redondeo hacia arriba a 10 CUP. Km por calles con OSRM; si no contesta, recta × 1,3.
5. Cada precio va **firmado** (chofer + puntos + precio, 10 min). El chofer elegido tiene **90 s** para aceptar; si no,
   el cliente elige otro. El precio aceptado es el que se cobra: no cambia al llegar.

## API

Prefijo `casa-viva/v1/triciclub/`, respuestas `no-store`, todo en JSON.

### Cliente (flujos 1, 3, 4, 5, 6)

| método ruta | hace | quién | entrada | salida | flujo |
| --- | --- | --- | --- | --- | --- |
| POST `cliente/codigo` | genera código de 6 cifras y lo encola para VivaBot | cualquiera | telefono | ok | entrar |
| POST `cliente/entrar` | comprueba el código, crea o actualiza el cliente | cualquiera | telefono, codigo, nombre, consentimiento | token, cliente | entrar |
| GET `cotizar` | precio fijo firmado | cliente | servicio, origen{texto,lat,lng}, destino{…} | precio, km, minutos, firma, vence | 1 |
| POST `viajes` | crea el viaje (idempotente por `cid`) | cliente | cid, firma, forma_pago, nota, recibe_* | viaje | 1, 5 |
| GET `viajes/{uuid}` | estado + chofer + última ubicación + código | cliente dueño | — | viaje | 3, 4 |
| GET `viajes` | mis viajes (últimos 30) | cliente | — | lista | S07 |
| POST `viajes/{uuid}/cancelar` | cancela si aún no lo recogieron | cliente dueño | motivo, cid | viaje | 6 |
| POST `viajes/{uuid}/valorar` | estrellas y etiquetas | cliente dueño | estrellas, etiquetas, texto | ok | 4 |
| GET `ver/{token}` | vista de solo lectura para un familiar | quien tenga el enlace | — | estado, mapa | compartir |

### Chofer (dentro de Pa'llá: C01–C05)

| método ruta | hace | quién | entrada | salida | flujo |
| --- | --- | --- | --- | --- | --- |
| GET `palla/hoy` (ya existe) | añade `triciclub: {ofertas, en_curso, hoy}` | chofer aprobado | — | lo de siempre + triciclub | 2 |
| POST `chofer/alta` | pide ser chofer (datos + fotos privadas) | mensajero de Pa'llá | vehículo, número, LOT, vence, licencia, fotos | chofer pendiente | 7 |
| POST `chofer/disponible` | encender/apagar y posición | chofer aprobado | on, lat, lng | ok | C05 |
| POST `viajes/{id}/cojo` | se lo queda el primero (`UPDATE … WHERE chofer_id IS NULL AND estado='buscando'`) | chofer aprobado | cid | viaje o `taken` | 2 |
| POST `viajes/{id}/estado` | llegue, recogi (con el código), termine, problema, suelto | su chofer | accion, codigo, motivo, cid | viaje | 3, 4, 6 |
| POST `viajes/{id}/ubicacion` | punto de GPS (cada 15 s mientras está activo) | su chofer | lat, lng, precision | ok | 3 |
| POST `viajes/{id}/cobrado` | anota el cobro | su chofer | forma | viaje | 4 |
| POST `viajes/{id}/valorar` | valora al cliente | su chofer | estrellas, etiquetas | ok | 4 |

### Administración (A01–A03)

| método ruta | hace | quién |
| --- | --- | --- |
| GET `admin/choferes?estado=pendiente` | lista con fotos (enlaces firmados de 10 min) | Ernesto |
| POST `admin/choferes/{id}` | aprobar, suspender, motivo | Ernesto |
| GET / PUT `admin/tarifas` | ver y cambiar (sube la versión, guarda historial) | Ernesto |
| GET `admin/viajes?dia=` | viajes del día, sin chofer, cancelados, dinero | Ernesto |

**Puente con VivaBot:** `GET /bot/triciclub/codigos` (clave del bot) devuelve los códigos pendientes de mandar y
`POST /bot/triciclub/codigos/{id}/enviado` los marca. VivaBot manda **un** mensaje por código, 1 a 1, nunca masivo.
**Webhooks:** ninguno (no hay pasarela de pago).

**Tareas:**
- cada minuto: viajes `buscando` sin chofer → a los 2 min re-ofrecer con un radio mayor (push); a los 10 min → `sin_chofer`
  y la app del cliente ofrece llamar a Triciclub.
- cada minuto: choferes `disponible` sin posición desde hace 10 min → `disponible = 0`.
- cada noche: borrar `ubicaciones` de más de 30 días; recalcular notas medias.
- cada día 8:00: LOT que vence en 15 días → aviso dentro de Pa'llá al chofer; LOT vencida → `suspendido`.
  **La Instrucción 1/2026 acaba el 31-dic-2026:** el 1-dic avisar a Ernesto para ver si la prorrogan.

## Las partes que muerden

- **Hora:** todo en UTC en la base; la app muestra hora de Cuba con la zona `America/Havana` de PHP/JS (nunca un «-5» fijo: Cuba puede cambiar la hora en verano). El recargo de noche se mira en hora de Cuba.
- **Duplicados:** cada acción del móvil lleva `cid`; viajes con `UNIQUE (cliente_id, cid)`; acciones del chofer con los últimos 50 `cid` (como Pa'llá). Reenviar sin señal nunca crea dos viajes ni cobra dos veces.
- **Dos choferes a la vez:** «Lo cojo» es un único `UPDATE … WHERE chofer_id IS NULL` y se mira `rows_affected`; el segundo recibe «Ya lo cogió otro».
- **Mala conexión:** el cliente guarda el pedido con su cotización firmada; si la firma caduca mientras está sin señal, al volver pide una nueva y **pregunta** si el precio cambió. El chofer manda la cola de Pa'llá.
- **Carga del servidor:** Hostinger compartido, sin websockets: el cliente consulta cada 10 s (cada 30 s si la app está en segundo plano, se para al terminar); el chofer manda GPS cada 15 s. Con 20 viajes a la vez ≈ 3 peticiones por segundo: vigilar.
- **Límites:** `cliente/codigo` 3 por hora por teléfono y 10 por hora por IP; 5 intentos por código; `viajes` 5 abiertos por cliente.
- **WhatsApp:** tras la restricción del 23-oct, los códigos van de uno en uno y con límite. Si WhatsApp falla, el plan B es que Triciclub llame (no SMS hasta que Ernesto decida).
- **Privacidad:** fotos de LOT y licencia fuera de la carpeta pública (`uploads/cvd-tc-privado/` con `.htaccess` deny) y se ven solo con enlace firmado; ubicaciones se borran a los 30 días; el teléfono del cliente solo lo ve su chofer durante el viaje.
- **Casa Viva y Triciclub juntos (D129):** tablas, opciones, rutas y archivos con prefijo `tc`. Un fallo de Triciclub no debe tocar las carreras de Casa Viva: la sección de Pa'llá se carga aparte y, si falla, Pa'llá sigue igual.
- **Ley:** sin LOT al día no se aprueba al chofer. La marca Triciclub se registra en la OCPI (Decreto-Ley 103/2025): decide Ernesto.

## Orden de construcción

1. **Rebanada vertical (fea pero completa):** S06 entrar → S01/S02 pedir (solo «Viaje», tarifa de prueba) → C01 «Lo cojo» →
   C02 llegué/recogí/terminé → S03 ver el estado → S05 cobrado. Tablas `clientes`, `choferes` (alta a mano por Ernesto),
   `viajes`, `eventos`. Rutas: `cliente/codigo`, `cliente/entrar`, `cotizar`, `viajes`, `viajes/{uuid}`, `palla/hoy`+triciclub,
   `cojo`, `estado`, `cobrado`. **Nace apagado** (`cvd_tc = no | prueba | si`), como Pa'llá.
2. **Imprescindibles:** Paquete y Carga, mapa y `ubicaciones` (S03), código de seguridad, cancelar/soltar, cola sin conexión
   (S04), alta de chofer C04 + A01, tarifas A02, S00 carga animada, push a choferes.
3. **Convenientes:** valoraciones, S07 mis viajes, compartir viaje, A03 viajes del día, avisos de LOT.
4. **Después:** «Ofrecer otro precio», SMS (si Ernesto lo aprueba), lo que encuentre `/replica-entrepreneur` en las reseñas.

**Prueba antes de abrir:** 2 o 3 choferes de triciclo reales en modo `prueba` y 5 viajes de verdad (como Pa'llá con Daiquel).
