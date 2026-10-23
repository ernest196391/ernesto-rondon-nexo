# Plan de despliegue · sábado 24-oct (cuando se levante la restricción de WhatsApp)

WhatsApp restringió el número de Ernesto el 23-oct ~12:35 (24 h, sin chats nuevos). Causa: ~80 invitaciones privadas iguales (invitar.sh) + bot repitiendo mensajes. El bot está PARADO (`pm2 stop vivabot`) y la sesión quedó cerrada: hay que volver a vincular.

## 0. Antes de nada
- Comprobar en el teléfono de Ernesto que ya no sale el aviso de restricción.
- NO reactivar las invitaciones privadas (crons `#PAUSA-23oct`): queda prohibido invitar por privado (regla nueva). Las invitaciones van por enlace en los grupos.
- Regla nueva: el bot solo contesta a quien le escribe; nada de mensajes iguales a muchas personas; avisos a varios: máx. 10–15/día y con texto distinto.

## 1. Vincular el bot (código de 8 letras)
`cd /root/vivabot && pm2 start vivabot` → leer `CÓDIGO DE VINCULACIÓN` en `pm2 logs` → Ernesto: WhatsApp → Dispositivos vinculados → Vincular con número de teléfono. La carpeta vieja está en `auth.bak-20261023-restriccion` (no sirve: sesión cerrada).

## 2. VivaBot: unir ramas en este orden (worktree, `npm run check` tras cada una; en `package.json` la línea `check` choca: quedarse con las pruebas de TODAS)
Ya en main y en el VPS: `ce02ea0` (clientes con gpt-5.6-luna, fotos en «Tú», contestadores), `5e2e8b2` (proveedores, caché, alarmas).
1. `feat/solo-hecho-si-es-verdad` (1e3a78f) — D106
2. `feat/parte-0900` (c5d9019) — D100 · luego quitar `#PAUSA-RESTRICCION` del cron del parte
3. `feat/bandeja-decisiones` (e556e43) — D105
4. `feat/grupos-24h` (1cdc4a8) — D101 · luego `node /root/supervisor/tareas/grupos-24h-aplicar.mjs --prueba` y sin `--prueba`
5. `feat/tarjeta-carrera` (e2789a1: tarjeta + palabras sin conexión) — D103 · ANTES de desplegar poner `crm_settings tarjeta_carrera = prueba` (si no existe cuenta como «si»), carrera real con **Daiquel**, luego `si`; encender fichas #330–332 y cambiar #326 (comando en CODEX-VPS.md)
6. `feat/ficha-contesta` (f7dd92c) — D107 · `crm_settings ficha_contesta = prueba` → `si`
Después: `cv reiniciar`, `cv estado` (alarmas de modelo y ElevenLabs), `pm2 logs`.

## 3. Core
En vivo: **3.14.58** (23-oct 16:10: arreglo del botón «Copiar» del enlace de tienda, Rafael Codina; `main` = `core-caja-1020` = `1ccf443`). Antes: 3.14.57 (Vender seguro + ?ref, tarjeta de carrera, filtro En tienda/Bajo pedido, ?ref=salir solo para equipo).
- En vivo desde 23-oct 16:25: **3.14.58.1** (`d083479`, quitado «Ver la tienda de Casa Viva» de la tienda de las gestoras; `cvd_store_exit_link=si` lo vuelve a poner). Todas las ramas deben juntar `main` antes de subir.
- Primero `feat/carrera-palabras` (e12b800, en `C:\Users\Ernesto\Casa-Viva-palabras`) como **3.14.59**: endpoint del bot para Recogí/Entregado/Problema/No puedo por WhatsApp. Juntar con `main` (3.14.58) antes, md5 del servidor.
- Después `feat/ficha-contesta` (c4d2e63): fusionar `main` y subir como **3.14.60**; luego `wp option update cvd_ficha_contesta si`.

## 4. Crons en pausa (`#PAUSA-RESTRICCION`)
- `run.sh` (supervisor Codex) y `general-sin-respuesta`: reactivar cuando el bot esté estable 1–2 h.

## 5. Anuncios (con el SÍ de Ernesto, en los grupos, no por privado)
- Mensajerías: video `tutorial-tarjeta-carrera.mp4` + pie (docs/nexo-business/mensajeros/tarjeta-carrera/video/).
- General: filtro En tienda / Bajo pedido (docs/nexo-business/tienda/filtro-disponible/anuncio.md), videos «El billete» y «La llamada» (versión -gestoras), premios ya publicados.
- Grupo 24 h: anuncios de SeFué (/root/archivos/sefue-2026-10-22/anuncios-pendientes.json) de 30 en 30.
- Antes: enseñar al bot las palabras CIEN y APAGÓN.

## 6. Pendientes de personas
- Nana: hoja de las 20 fichas → https://casaviva.company/fichas/hoja-32fac7940e/ → respuestas a Ernesto → `volcar-respuestas.mjs`.
- Ernesto: 90 USD del #4974 a la tienda; número nuevo para el bot (Cubacel en un móvil con 2 ranuras, recomendado).
- Javier (SeFué): confirmar dirección de oficina/aseo.
