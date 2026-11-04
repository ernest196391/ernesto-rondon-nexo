# TRASPASO · Casa Viva / NEXO

## ⭐ ACTUALIZADO 29-oct (manda esto, lo de abajo es historia)

**Regla de Ernesto (29-oct): en todas las sesiones, primero Lennys y su chat — sus soluciones y sus tareas pendientes — y después lo demás.**

**Dónde está la verdad de lo último:** el final de `docs/00-FUENTE-DE-VERDAD/ESTADO.md` (L67, L68 y siguientes; el vigía deja ahí la lista de pendientes de Lennys de las últimas 48 h) y `DECISIONES.md` (D109–D120).

**En vivo (lo último que se sabe):** Core 3.14.70–3.14.71.x (cliente fijo D120, Nº propio de pedido D115, recogida sin teléfono D116, página de preguntas con Lennys, Pa'llá con avisos propios ntfy en prueba). VivaBot con «no inventar», paquete D111 (`0668573`), #Vale para todas (el #Vale inteligente con texto libre y audio solo para Ernesto y Dany, `vale_chat_ia=prueba`), recogida sin teléfono (`9f27957`).

**Sesiones abiertas (cada una tiene su contexto; mándales mensajes en vez de rehacer):**
- `vigia-chats` (Sonnet, barata): revisa los chats SOLO cuando Ernesto lo pide; abrió reservas-pedido, validar-vale, cierre-caja, semaforo-errores, vigilante-conexion.
- `web-maraton`: cambios de la web (Core) del maratón, panel de Lennys para productos bajo pedido + guía, cuadre-del-d-a-separado.
- `bot-maraton`: cambios de VivaBot (mensajes más humanos, guía de trato al cliente, #supervisor solo para Lennys, resúmenes sin dinero salvo Lennys, dinero de mensajeros a 48 h, #118/#119).
- `palla-app`: Pa'llá (app de mensajeros), avisos sin Google (ntfy en el VPS), mapa de recorridos fase 1 (hecho, sin subir por la conexión).

**Avisos:**
- El ordenador de Ernesto pierde a ratos la conexión SSH con el VPS y con Hostinger: hay cosas listas sin subir; las sesiones las suben cuando vuelve.
- Varias sesiones tocan Core y el bot a la vez: antes de subir, `git fetch` + rebase y número de versión por encima del que esté en vivo.
- Pendiente de Ernesto: la foto de la tabla nueva de envíos de Kevin (22-oct 15:16) para `KEVIN_TARIFAS.zonas`; probar la app Pa'llá en su teléfono; aprobar la guía para Lennys y la prueba de D120 con Dany.

Mensaje para el chat nuevo: «Lee TRASPASO.md (la parte del 29-oct) y el final de ESTADO.md. Primero lo de Lennys.»

---

> **24-oct noche (historia):** el 24-oct se volvió a vincular el bot, se hizo el maratón de ideas con las gestoras, se vació la bandeja de decisiones y salieron Pa'llá (prueba), #Vale (para todas) y las mejoras del maratón. **La lista de lo pendiente, con todas las sesiones y por dónde empezar, está en `docs/nexo-business/pendientes-2026-10-25.md`.** Lo de abajo es el traspaso viejo del 22–23-oct (ya hecho en su mayoría).
>
> Mensaje para el chat nuevo: «Lee TRASPASO.md y `docs/nexo-business/pendientes-2026-10-25.md` y empieza por la sección "Por dónde empezar mañana"».

## Traspaso anterior · cierre del chat del 22–23-oct-2026

## 1. Qué se hacía
Operación diaria de Casa Viva (vigilar chats, corregir errores del bot y anotarlos para ChatGPT), mejoras del diagnóstico del sistema, videos con la fórmula nueva, catálogos de proveedores (Sergio, SeFué) y el inicio de **Pa'llá**, la app de mensajería. El 23-oct ~12:35 **WhatsApp restringió 24 h el número de Ernesto** (sin chats nuevos) por ~80 invitaciones privadas iguales al grupo VIP. Ernesto pidió **dejar todo en pausa** hasta que vuelva.

## 2. Hecho y comprobado
- **Bot PARADO** (`pm2 stop vivabot`); sesión cerrada por WhatsApp (copia vieja `auth.bak-20261023-restriccion`, no sirve). Crons de envío con `#PAUSA-RESTRICCION`; invitaciones con `#PAUSA-23oct` (NO reactivar).
- **Core en vivo 3.14.58.1** (`d083479`, main = core-caja-1020): Vender seguro + `?ref` en enlaces del cliente (3.14.53), tarjeta de carrera (3.14.54), filtro En tienda/Bajo pedido (3.14.55), `?ref=salir` (3.14.56/57), «Copiar» con plan B (3.14.58), sin «Ver la tienda de Casa Viva» en tiendas de gestoras (3.14.58.1).
- **Bandeja de decisiones** en vivo: `casaviva.company/control/decisiones/` (D105), cron VPS `tareas/bandeja-decisiones.mjs`.
- **VivaBot en main y VPS** (bot apagado): `ce02ea0` (clientes con gpt-5.6-luna, ve fotos en «Tú», no contesta contestadores), `5e2e8b2` (proveedores solo acuse, caché, alarmas en `cv estado`), `dbff98a` (guarda lo que Ernesto manda en «Tú»: `cv ernesto hoy`), `34d88de` (acepta solicitudes de grupos), `98970b8` (12 errores, recogida 10–4).
- **Web:** SeFué 133 productos «Bajo pedido» con my_price (D102), productos de Nana 4896/4902/4908/4913, recogida 10:00–4:00, premios de septiembre publicados en el General, D97 cliente = primera gestora.
- **Videos:** «El billete» (`redes/video-diario/2026-10-24-billete/`) y «La llamada» (`2026-10-25-llamada/`), skill `video-formula-casa-viva` (mejorable). Tutorial mensajeros `docs/nexo-business/mensajeros/tarjeta-carrera/video/` (73 s, en VPS `/root/archivos/tutoriales/`).
- **Equipos:** Cynthia (Maryta) y Daylien (Niurka) ya estaban bien; la lista «Mi equipo» se recalculó (run 16).
- **#4974:** entregado por Ernesto; Ernesto ya dio los 90 USD a la tienda → falta «Dinero recibido».
- Docs commit `c211125` (ESTADO L59–L60, DECISIONES D96–D108).

## 3. Pendiente, en orden
1. ~12:35 del 24-oct: vincular el bot (`pm2 start vivabot` → código en `pm2 logs` → Ernesto: Dispositivos vinculados → Vincular con número).
2. Seguir **`docs/nexo-business/mejora-sistema-2026-10-23/PLAN-DESPLIEGUE-24OCT.md`**: ramas VivaBot (solo-hecho-si-es-verdad, parte-0900, bandeja-decisiones, grupos-24h, tarjeta-carrera `e2789a1` con `tarjeta_carrera=prueba` y Daiquel, ficha-contesta); Core 3.14.59 carrera-palabras → 3.14.60 ficha-contesta → 3.14.61 palla.
3. Marcar «Dinero recibido» del #4974 (preguntar a Ernesto quién lo recibió).
4. Anuncios con SÍ de Ernesto (en grupos, nunca por privado): video tutorial a Mensajerías, filtro y videos al General, SeFué al grupo 24 h.
5. Publicar «El billete» y «La llamada» en Meta (Ernesto debe iniciar sesión de Meta en el navegador de la app).
6. **Pa'llá:** diseño https://claude.ai/artifact/HGgfiy4NwTDgPr1Dbg5XoU; plan en `C:\Users\Ernesto\Casa-Viva-palla\...\assets\palla\README.md`, rama `feat/palla` `dc5e4f1`; **sin código aún**. Ficha `docs/productos/app-mensajeria-cuba.md`; investigación La Nave `docs/nexo-business/apps/nave-investigacion-2026-10-23.md`.
7. Hoja de Nana (20 fichas): https://casaviva.company/fichas/hoja-32fac7940e/ → `docs/fichas/top20-2026-10-23/volcar-respuestas.mjs`.
8. 10 fotos de Sergio con Higgsfield (~20 créditos, Ernesto dijo sí tras los videos); quedan 582 créditos.
**Decide Ernesto:** número nuevo del bot (recomendado Cubacel en un Android con 2 ranuras); si recalcular «Mi equipo» al aprobar cada gestora; dirección de oficina de SeFué (Javier).

## 4. Datos fijos
VPS `ssh -i ~/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212` (`cv ayuda`, `cv errores abiertos`, `cv ernesto hoy`). Web `ssh -i ~/.ssh/casa-viva-github-actions -p 65002 -o BatchMode=yes u824654880@88.223.85.72` (wp-cli en `~/domains/casaviva.company/public_html`). Repos: VivaBot `C:\Users\Ernesto\vivabot` (CRLF; desplegar con worktree propio en el VPS), Core `C:\Users\Ernesto\Casa-Viva-caja`. Supabase nexo-production. Grupos: General 120363304301144410, Mensajerías 120363399264934901, VIP 120363411309225409, 48h→24h 120363425123846351. Gestoras: Maryta 47, Nadielys 29 (CV29MANADIEL), Rafael 28, Niurka 22; Ernesto gestor 137 (CV137ERNESTO).

## 5. Reglas de Ernesto en este chat
- El bot atiende directo a los clientes de las gestoras (comisión reservada, D98). Nunca repetir mensajes; solo contestar a quien escribe; nada de envíos masivos por privado.
- Modelo efectivo antes que barato (es su decisión); clientes gpt-5.6-luna a prueba.
- Anotar cada error y cambio (crm_errores + CODEX-VPS.md) para que ChatGPT lo sepa.
- Videos sin enlace ni teléfono; fórmula de 7 pasos; colores de foto por proveedor (Sergio verde agua, SeFué menta…).
- Preguntar antes de cada tarea; español sencillo y corto.

Mensaje para el chat nuevo: «Lee TRASPASO.md y el PLAN-DESPLIEGUE-24OCT.md y sigue con lo pendiente: primero vincular el bot.»
