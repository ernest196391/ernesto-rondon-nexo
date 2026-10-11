# Relevo 2026-10-08 · Reparto Casa Viva, gestoras, voz y comunidad

Lee primero `docs/00-FUENTE-DE-VERDAD/LEEME.md`, luego `ESTADO.md` (sección H) y `DECISIONES.md` (D29–D32).
Ernesto no es técnico: español sencillo, paso a paso, y pedirle confirmación antes de lo irreversible.

## 1. Qué es cada pieza
| Pieza | Dónde | Cómo se toca |
|---|---|---|
| **Casa Viva Core** (plugin WordPress `casa-viva-dropship-core`) en `casaviva.company` | Repo `ernest196391/Casa-Viva` (clon en `C:\Users\Ernesto\Casa-Viva`) | SSH Hostinger: `ssh -i ~/.ssh/casa-viva-github-actions -p 65002 u824654880@88.223.85.72`, ruta `domains/casaviva.company/public_html`, `wp` disponible. Antes de subir: comparar con el servidor, copia en `~/bak-AAAAMMDD*`, `php -l`. Para `wp eval` con comillas complejas: escribir un `.php` local, `scp` a `/tmp` y `wp eval-file`. **Versión actual 3.13.22** |
| **VivaBot** (WhatsApp, número personal de Ernesto 5354056173, modo "un solo número") | Repo `ernest196391/vivabot` (clon `C:\Users\Ernesto\vivabot`, CRLF → usar Edit) | VPS `ssh -i ~/.ssh/vivabot_vps root@179.236.242.212`, `/root/vivabot`, `pm2 restart vivabot`. GitHub a veces da 500: copiar por `scp` y luego `git fetch && git reset --hard origin/main` en el VPS cuando el push entre. **Commit actual `c9403b0`** |
| **Base de datos** | Supabase `nexo-production` (`viwwlriwlwodrfukbgbj`) | Tablas del bot `crm_*` |

## 2. Lo construido (todo en producción)
- **Puente bot ↔ Core** (`class-cvd-bot-bridge.php`, cabecera `X-VivaBot-Key` = `CURRU_KEY`): ofertas, `claim` (gana el primero), vale (con vuelto, franja del cliente, fotos, gestora), hora, entregado, estado en palabras claras, WhatsApp verificado del cliente, enlace y pedidos/comisión de gestora, altas (status/bienvenida con acceso sin contraseña, nunca para administración). **Toda llamada GET del bot lleva `_=timestamp`** porque la CDN de Hostinger guardaba respuestas viejas.
- **Reparto** (`src/dispatch.js`, tabla `crm_dispatch`): publica en el grupo **"PRUEBA Mensajería CV"** (variable `DISPATCH_GROUP`), "Yo" → asigna en Core → vale + fotos por privado → hora (solo acepta horas) → cliente confirma (o propone otra y el mensajero confirma; si la propuso el cliente, solo se confirma) → recogida en tienda → **"entregado"** (sin cifras: declara lo de los productos; la mensajería es del mensajero) → caja en `/ventas/` prellenada y aviso si no cuadra. Avisos por tiempo (15 min sin "Yo", 15 sin hora, 30 sin confirmar). La gestora recibe los mismos avisos. El cliente recibe nombre y teléfono del mensajero.
- **`/ventas/`**: botón único "Listo para salir", devolución (D30), un pedido cerrado no se cancela desde WooCommerce.
- **Compra en la web**: resumen antes de finalizar, "¿con cuánto paga?" con vuelto calculado, página de gracias clara ("Pedido finalizado", último paso WhatsApp, volver a la tienda, "me equivoqué, corregir").
- **Gestoras** (`src/gestoras.js`): "mi enlace", "mis pedidos", "¿cómo va el 2677?", "mi comisión"; sugerencias → `crm_feedback` (D31); altas con APRUEBA/RECHAZA/SOLICITUDES y modo ALTAS MANUAL/CONOCIDAS/TODAS (D32). Comisión general **10 %** (decidido por Lennys; se congela en cada venta).
- **Órdenes de Ernesto en su chat "Tú"**: `MANDA Nombre: texto`, `AUDIO Nombre: texto` (también número o `grupo Nombre`), `VOZ 1-5`, `AUDIOS SÍ/NO`, `COMUNIDAD [horas]`, más las de altas. Buzón `crm_outbox` (texto y voz).
- **Voz** (`src/voice.js`, ElevenLabs Starter, clave en `.env` del VPS): VOZ 1 Orlandy, 2 KronoX, 3 Liuver Durán, 4 David, **5 = voz clonada de Ernesto (predeterminada desde 2026-10-08)**.
- **Comunidad** (`src/community.js`): solo lee los grupos de la comunidad Casa Viva ("General" `120363304301144410@g.us`, "CASA VIVA", "Pedidos De Casa Viva", "Mensajerías CASA Viva"); resumen diario 20:00 y orden COMUNIDAD; preguntas → `crm_knowledge` pendiente; ideas → `crm_feedback`.
- **Tono del bot** (`src/brain.js`): cálido, sin repetir frases, y sin vender en charlas sociales (2026-10-08, tras una mala respuesta a Ramiro).

## 3. Pruebas hechas
- #2675 (Lennys clienta, Zaymi mensajera): ronda completa, cancelada después.
- Lennys como **gestora** (#2677 y #2678 por su enlace, #2676 duplicado anulado) y como **mensajera** con la cuenta "Mensajero piloto" (user 9, `_cvd_whatsapp` = 5356885368 de Lennys). **#2678 está "entregado · dinero pendiente"**, declarado corregido a 15 USD. Falta: "Dinero recibido" en `/ventas/` y luego probar **Devolución** con ese pedido.
- Opiniones (L1–L15): `docs/nexo-business/OPINIONES-PRUEBA-2026-10-07.md`.

## 4. Pendiente (en orden)
1. Cerrar #2678 (dinero recibido) y probar la devolución.
2. Decidir qué avisos salen también en voz (propuesta: "quién lleva tu pedido y a qué hora" y la bienvenida de gestoras) → `AUDIOS SÍ`.
3. Mensaje al grupo "General" para que las gestoras se registren (borrador en `crm_outbox` enviado a Lennys el 2026-10-07); poner `ALTAS CONOCIDAS` ese día.
4. Fichas de producto: medidas (pregunta n.º 1 de la comunidad), colores/variantes (solo 25 de 199 productos; hay duplicados por diseño), stock por variante. Sugerencia pendiente de aprobación.
5. Una cuenta no puede ser gestora y mensajera a la vez (un solo `_cvd_account_status`): separar estados.
6. Plan de paso a producción: `docs/nexo-business/PLAN-DEJAR-BIZNECUBANO.md` (cambiar `DISPATCH_GROUP` al grupo real "Mensajerías CASA Viva" en la fase 3).
7. Seguridad (al final, acordado con Ernesto): cambiar claves expuestas (Supabase service_role, Anthropic, WooCommerce, Groq, CURRU_KEY), contraseña del Mensajero piloto, borrar claves viejas de ElevenLabs. Supabase `cuyana` aparece INACTIVO.
8. El chat de Lennys tiene `#nobot` (bot no le contesta lo general; reparto y gestora sí funcionan).
