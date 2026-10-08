# Relevo 2026-10-08 (tarde) · Casa Viva: gestoras en la web nueva, caja 1.0, supervisor 24/7

Lee primero `docs/00-FUENTE-DE-VERDAD/LEEME.md`, `ESTADO.md` y `DECISIONES.md` (D33–D36). Este relevo continúa `HANDOFF_2026-10-08_MENSAJERIA.md`.
Ernesto no es técnico: español sencillo, paso a paso. **Las preguntas de administración se le hacen a Lennys (admin), no a Ernesto.**

## 1. Piezas y accesos (sin claves en este archivo)
| Pieza | Dónde | Cómo se toca |
|---|---|---|
| Web/Core `casaviva.company` (WP, plugin `casa-viva-dropship-core` **3.13.24**) | repo `ernest196391/Casa-Viva` (clon `C:\Users\Ernesto\Casa-Viva`) | `ssh -i ~/.ssh/casa-viva-github-actions -p 65002 u824654880@88.223.85.72`, `domains/casaviva.company/public_html`, `wp`. Copia en `~/bak-AAAAMMDD*` antes de subir; `php -l`. |
| VivaBot (WhatsApp 5354056173) | repo `ernest196391/vivabot` (clon `C:\Users\Ernesto\vivabot`, CRLF) | VPS `ssh -i ~/.ssh/vivabot_vps root@179.236.242.212`, `/root/vivabot`, `pm2 restart vivabot`; tras push: `git fetch && git reset --hard origin/main` en el VPS |
| **Supervisor 24/7** (Claude Code en el VPS, cuenta Pro de Ernesto, Sonnet) | `/root/supervisor` (copia en `vivabot/supervisor/`) | `CLAUDE.md` = reglas + lecciones; `check.mjs` (cron cada 5 min; vuelta cada 30 min de día / 2 h noche; al momento si escriben Dany, Lennys, Zaymi o hay respuestas de Ernesto); `sb.mjs` (Supabase) |
| Caja **Casa Viva Core** (Tauri, `apps/business-pos`) | repo `ernesto-rondon-nexo` | v1.0.1 en `main` (compilación en curso al cerrar); descargas: `casaviva.company/descargas/CasaVivaCore.apk` y `…/CasaVivaCore-Windows.exe`; APK también en VPS `/root/archivos/` |
| BD | Supabase `nexo-production` (`viwwlriwlwodrfukbgbj`) | `crm_*` (bot), `nexo_business.*` (caja) |
| Guías | `casaviva.company/ayuda` (página WP 2815) + 11 imágenes `Claude Code/tutoriales` y VPS `/root/archivos/guias/` | |

## 2. Hecho hoy (todo en producción)
- **Gestoras → web nueva (D34):** convocatoria en grupo General; altas en modo **TODAS** (se aprueban solas). ~16 registradas. Registro sin correo ni contraseña; **"Entrar con WhatsApp"** / orden *mi acceso*; botón Salir con aviso; un WhatsApp = una cuenta. Panel simplificado.
- **Extras en tienda (D33):** orden `EXTRA nombre: producto precio`, `COMISIONES EXTRA`, `PAGADO EXTRA`, `ANULA EXTRA`, `PERMISO EXTRA` (tabla `crm_extras`). Falta el botón en `/ventas/` para cuando se deje BizneCubano.
- **Comisiones (D36):** 209 productos con comisión fija copiada de BizneCubano (panel → Programa de Gestores, solo lectura con sesión de Ernesto) a `_cvd_commission_type/value`. General 10 %. Productos nuevos entran con 10 % hasta repetir la copia. Cobro: efectivo CUP/USD o transferencia, cuando quiera, sin mínimo, consultando caja (Lennys).
- **Catálogo:** copia BizneCubano→web arreglada (colores/variantes, "N disponibles", dominio nuevo) y **automática cada hora** (:25) con seguro si la lectura sale corta. Modo `restore` deshace ocultados.
- **Devolución** anula la comisión (antes no).
- **Bot más listo:** ficha del negocio y de gestoras completas (`crm_businesses.profile/gestora_profile`), `crm_settings.aprendizajes` (el supervisor añade reglas) y **tasa del día** (último "FORMAS DE PAGO" del grupo General) se leen en cada respuesta (`src/learning.js`). Lo que envía el buzón queda en el historial. Archivos e imágenes por buzón (`crm_outbox.kind='archivo'`, `file_path`). Gestoras/equipo siempre en línea Casa Viva; gestora sin registrar que pide acceso recibe cómo registrarse.
- **Supervisor:** vigila grupos General y Mensajerías; contesta en General; **regla de consultas de producto**: avisar "lo consulto" → dependientas Zaymi/Nana → Maryta (5354498052) → Lennys → responder y guardar en `crm_knowledge`.
- **Caja 1.0:** alta por **código de 6 letras** (`ALTA CAJA Nombre` en el chat "Tú"; `nexo_business.device_enrollments`, función `nexo-device-enroll`). Clave de firma: `%APPDATA%\com.nexo.business\signing` + Drive de Ernesto. Gestoras y equipo cargados en `nexo_business.people`. 1.0.1: buscador en consignación, aviso de que la mercancía de proveedores se vende normal (socios), letra mayor.

## 3. Personas
Lennys 5356885368 (admin; bot en `ignorar`, el supervisor la atiende) · Zaymi 5359163951 (dependienta, **conectada a la caja**) · Nana = Daniela 5358004216 / jid 52368704020652@lid (dependienta; NO la Nana 22446019244262@lid) · Maryta 5354498052 (datos de producto, publica la tasa diaria) · Dany 5352544351 (gestora, prioridad).

## 4. Pendiente (en orden)
1. **Caja 1.0.1:** terminar compilación, subir a `/descargas/` y VPS, avisar a Zaymi/Lennys/Nana (se actualiza encima sin perder datos). Lennys y Nana aún no conectadas (códigos: Lennys tel 7H63WE, PC BALBWG; Nana uno nuevo si venció).
2. **Faltan gestoras de BizneCubano en la caja** (solo salen las registradas en la web): leer `biznecubano.com/account/gestores/manage` (con sesión de Ernesto) y cargarlas en `nexo_business.people`.
3. **Simulación de caja con Zaymi y Nana: 2026-10-09** (abrir turno, vender, venta con gestora + Extra, devolución, cierre). Hoy no deben tocar "Cobrar".
4. Respuestas de **Lennys**: transferencia para sillas (contestar a Klaus en General, pregunta 5 de `crm_supervisor`), día para que la caja sustituya a BizneCubano, cuándo pasar el reparto al grupo real "Mensajerías CASA Viva".
5. Lennys: "en la parte final casi no se distingue lo que dice" (pantalla sin identificar): preguntarle cuál.
6. Para dejar BizneCubano: ventas de la caja → stock de la web; venta en caja con gestora → comisión en Core; botón "Añadir al pedido de la gestora" en `/ventas/`.
7. Voz de Ernesto: el clon de ElevenLabs se grabó en **silencio**; VOZ 1 por defecto. Rehacer con 1–2 min de nota de voz.
8. Fichas: medidas (lo más preguntado), puerta gris dice "blanco". Cuentas gestora+mensajera separadas. Seguridad al final (rotar claves expuestas).

## 5. Costes y avisos
- El bot usa la API de Anthropic (crédito de pago: Ernesto añadió 5 USD el 8-oct). ~45 respuestas/día del bot ≈ 1,5–2,5 USD/día (estimado). Claude Code (este chat y el supervisor) va en la suscripción Pro de Ernesto, no en ese crédito.
- Si el bot dice "en un momento te atendemos" sin más, revisar crédito de la API y `pm2 logs vivabot` ("[brain]").
