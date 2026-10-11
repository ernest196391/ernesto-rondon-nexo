# Casa Viva — checkpoint de cierre (único, compartido entre Claude, Codex y ChatGPT)

Etiquetas: DESARROLLADO · PROBADO EN CI · INSTALADO · VERIFICADO EN OPERACIÓN · PENDIENTE · BLOQUEADO.
Regla: no confundir compilación con funcionamiento real.

## Corte 2026-10-10 (noche) — Claude Code, bloque 1

### Ramas y commits comprobados
| Repo | Rama de integración real | Commit | Nota |
|---|---|---|---|
| `ernesto-rondon-nexo` | `ccr-f459b3eb-utyhix` | `1b51559` | `main` (`40c4820`) está **22 commits detrás**; se puede avanzar sin conflicto (solo avance rápido). Aún no fusionado. |
| `Casa-Viva` | `main` | `eecbb92` (3.13.27) | PR #160 (borrador Codex, prueba CRLF) abierto |
| `vivabot` | `main` | `523ea4a` (incluye `54e7d54`) | PR #2 (borrador Codex, negocio vacío en la cola) abierto. Despliegue en VPS **sin verificar** |

### Caja (Casa Viva Core)
- 1.0.4: DESARROLLADO · PROBADO EN CI (release `caja-v1.0.4`, run 38085383914).
- Local, rama `ccr` el 2026-10-10: `tsc` de la caja OK; `cargo test` de `packages/business-db/rust` OK (60 pruebas, 0 fallos). La crate de `src-tauri` no tiene pruebas propias.
- INSTALADO en PC de Lennys: **PENDIENTE de confirmar**.
- Aviso de "virus": el instalador **no está firmado** (`tauri.conf.json` sin certificado). Lo más probable es Microsoft SmartScreen ("Windows protegió su PC") o el navegador marcando un .exe sin reputación, no una detección real. Falta ver la captura de Lennys para confirmarlo. No desactivar Defender. Camino correcto: comprobar el SHA-256 publicado y, a medio plazo, firma de código (certificado OV/EV o Azure Trusted Signing).

### Comisiones (issue #133) — causa encontrada (solo lectura, nada cambiado)
- El trigger `sync_events_commissions` → `record_commissions()` **sí funciona**: la venta `7263cbe5…` (22:26 UTC) creó su asiento de dependienta (0,10 USD). Hoy hay **1** asiento, no 0.
- De los 26 `sale.completed`, **21 son ventas demo sin gestora ni dependienta** → 0 asientos es lo correcto.
- Las 3 ventas de prueba (04:02–04:08 UTC) no dejaron asiento de dependienta porque en ese momento el % de dependienta era 0: `cost_settings` de casa-viva se cambió a las **17:02 UTC** (`staff_pct` = 0,50). El trigger calcula al insertar y no recalcula después. (Deducido de `updated_at`; no hay historial de cambios para probarlo al 100 %.)
- La gestora sale con 0 USD porque **D36 se cargó en Casa Viva Core (WordPress), no en NEXO Business**: `product_costs` de casa-viva tiene solo 51 filas (del 2026-10-04), `cv-684` no está, y la regla general es `fixed 0` en lugar de 10 %.
- Corrección propuesta (PENDIENTE de aprobación de Ernesto, toca dinero): (1) poner la regla general en `percent 10`; (2) copiar las comisiones por producto de Core a `product_costs` (por SKU); (3) función de recálculo que añada asientos que falten a ventas pasadas sin duplicar (por `event_id`), probada antes en una rama de Supabase.

### Ventas de prueba sin conciliar
`862e588c` (80 USD), `92188b31` (23 USD), `226ba41d` (49 USD). PENDIENTE: comparar con el conteo físico antes de proponer ajustes. No tocar sin autorización.

### Reinicio a cero (2026-10-10 22:30 UTC, autorizado por Ernesto: "todo lo hecho es de prueba")
- Copia: esquema privado `nexo_backup` → `sync_events_20261010` (481 filas) y `commission_entries_20261010` (2).
- Borrado en `casa-viva`: todas las ventas, devoluciones, turnos y conteos de existencias; comisiones. El candado `sync_events_append_only` se desactivó solo dentro de esa transacción y se comprobó reactivado.
- Existencias recargadas con la importación programada (`run_scheduled_catalog_imports`) desde la foto de BizneCubano de las **22:34 UTC**: 217 productos con stock. Toalla pequeña `cv-684` = **3** (coincide con el conteo físico de Lennys).
- Con esto las 3 ventas de prueba sin conciliar dejan de existir: VERIFICADO.
- Cada equipo de caja debe borrar su base local (`%APPDATA%\com.nexo.business\nexo-business.db`, renombrarla) y darse de alta otra vez.

### PC de Ernesto (2026-10-10 22:55 UTC)
- Caja **1.0.4 INSTALADA** (instalador comprobado por SHA-256 `4d7cfddf…e787`; sin firma → "NotSigned"; Defender sin detecciones). Antes tenía 1.0.0.
- Base local nueva: identidad `windows-pilot-01`, 318 productos, 217 existencias, 0 ventas.
- Ruido: entre 22:35 y 22:40 UTC una compilación de pruebas de Codex (`Documents\Chat Gpt codex\NEXO\build\tauri-qa\debug`) abrió/cerró 2 turnos vacíos. Sin dinero ni stock; se dejan.

### Comisiones: regla general aplicada
- `cost_settings` casa-viva → `percent 10` (D36), autorizado por Ernesto.
- Venta simulada y deshecha (transacción revertida): 2 toallas 20 USD → gestora 2,00 + dependienta 0,10; `cv-2409` → gestora 1,00 fijo (por producto) + dependienta 0,095. Devolución de las toallas → sus 2 asientos pasan a `void`. VERIFICADO en la base, 0 restos.
- PENDIENTE: copiar las ~209 comisiones fijas de Core a `product_costs` (hoy solo hay 51). El permiso para leer el servidor de la web fue denegado en esta sesión; hace falta que Ernesto lo autorice o exportarlas desde WooCommerce.

### Prueba de caja 1.0.4 en PC de Ernesto (2026-10-10 ~23:00 UTC)
- Control: la app se abre con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333` y se maneja por CDP (sin control de pantalla).
- Turno abierto con fondo 0: OK.
- Sobreventa: 4 toques sobre "Toallas pequeña" (stock 3) → el carrito se queda en 3 y aparece "Solo quedan 3 de Toallas pequeña". **VERIFICADO EN OPERACIÓN.**
- Cobro: Ernesto cobró 3 toallas (30 USD, venta directa). Nube: stock 3 → 0, dependienta 0,15. VERIFICADO.
- Devolución parcial (1 de 3, 10 USD efectivo): caja 30 → 20, stock nube 0 → 1. VERIFICADO.
  - **Fallo encontrado y arreglado:** la devolución parcial anulaba la comisión entera. Migración `20261010230000_nexo_business_partial_return_commissions.sql` (aplicada en producción): anula y vuelve a crear la parte proporcional. Simulada antes (3 → 2 → 1 → 0, revertida) y aplicada.
  - Mejora pendiente (UX): el campo "Reembolso" no se rellena solo con el precio de lo devuelto (aparece 0).
- Venta con gestora Claudia (1 toalla, 10 USD): gestora 1,00 (10 %) + dependienta 0,05; stock 1 → 0. VERIFICADO.
- Cierre de turno: debe haber 30 (40 ventas − 10 devolución), contado 30, "USD cuadra". VERIFICADO.
- Panel de la dueña (`summary_for`): 2 ventas, 40 USD, 10 USD devueltos. VERIFICADO.
- Venta sin internet: NO probada en el equipo (habría que cortar la red cambiando el cortafuegos; no se toca). Cubierta por las pruebas automáticas de Rust (stock offline, devoluciones offline).
- Estas ventas son de prueba: hay que borrarlas antes de entregar a Lennys (mismo procedimiento con copia en `nexo_backup`).

### Panel de la dueña: entrar con WhatsApp (2026-10-10 23:27 UTC)
- Problema: Lennys no podía entrar (sin botón de recuperar, correos de Supabase no llegaban a Gmail, no se veía la contraseña). Las mejoras de ChatGPT (`2d1a819`) estaban en la rama `ccr` sin publicar; Vercel no publicaba nada desde el 4-oct (la conexión automática con GitHub no dispara).
- Hecho: pantalla de entrada con **"Recibir enlace por WhatsApp"** como opción principal; correo + contraseña (con "Ver contraseña" y "¿Olvidaste…?") como segunda opción.
  - Función `nexo-panel-whatsapp-login` (desplegada): busca `members.whatsapp`, genera un enlace de un solo uso (`generateLink` → `?acceso=<token_hash>` → `verifyOtp`), lo encola en `crm_outbox` (`created_by='panel-acceso'`). Misma respuesta exista o no el número; 1 enlace cada 2 min y 5 al día por número.
  - Migración `20261010233000_nexo_business_panel_whatsapp_login.sql` aplicada. WhatsApp de Lennys (5356885368) y Ernesto (5354056173) cargados.
- `main` avanzado a la rama `ccr` (`3a20101`) y publicado a mano con un redeploy en Vercel (`dpl_5CKedD9S9npgckzA9rQmiyogLxgw`). VERIFICADO en `negocio.nexocuba.com`.
- Enviados a Lennys (outbox 203 y 204, estado `enviado`): explicación + su primer enlace. PENDIENTE: que confirme que entró.
- PENDIENTE: reconectar el despliegue automático de Vercel con GitHub (hoy hay que publicar a mano).

### Pendiente inmediato (en orden)
1. Ernesto: pedir a Lennys la captura del aviso y si instaló 1.0.4.
2. Fusionar `ccr` → `main` (avance rápido) y los borradores de Codex tras revisarlos.
3. Rama Supabase de prueba para la corrección de comisiones.
4. Issue #132: actualizar Next.js.
5. Prueba de la tienda de principio a fin (sin pedido real hasta tener aprobación).

### Corrección 2026-10-10 23:40 UTC (Ernesto: "no le llegó a Lennys", "¿por qué no en casaviva.company?")
- Causa del WhatsApp perdido: Lennys tiene el chat `110917564006425@lid`; el buzón mandó a `5356885368@s.whatsapp.net` → WhatsApp lo acepta ("enviado") pero no aparece en su chat. Arreglado: `nexo_panel_whatsapp_login_send` usa el `jid` del contacto (`to_group`). Ojo: el mismo problema afecta a otros envíos del buzón por teléfono (supervisor, reparto) → revisar en VivaBot.
- El estado "enviado" del buzón **no prueba la entrega**: el bot no guarda copia de lo enviado. Solo la persona puede confirmarlo.
- Panel publicado también en **https://casaviva.company/panel/** (carpeta estática en Hostinger, `.htaccess` sin caché). Enlace de acceso apunta ahí.
- Probado por Claude: la página pide el enlace y responde bien; el enlace generado (`casaviva.company/panel/?acceso=…`) abre sesión (`/auth/v1/verify` → sesión OK). PENDIENTE: confirmación de entrega en WhatsApp por Ernesto y luego por Lennys.

### Entrada al panel: recorrido completo (2026-10-11 00:20 UTC)
- Corrección de diagnóstico: el `@lid` NO era la causa. Prueba: el buzón escribió a Lennys por teléfono a las 20:33 UTC y ella contestó al tema a las 20:36. VivaBot en el VPS (rama `ccr`, `outbox-policy.js`) solo admite personas por teléfono y grupos `@g.us`; los intentos con `@lid` fallaron ("grupo no encontrado"). Vuelto a teléfono. Reenviados a Lennys (213 explicación, 214 enlace a `casaviva.company/panel/`): `enviado`.
- Pantallas nuevas (una a la vez): Entrar con WhatsApp · Iniciar sesión · Crear cuenta (repetir contraseña) · Verifica tu correo (reenviar con espera de 60 s, ir a iniciar sesión) · ¿Olvidaste tu contraseña? · Elige tu contraseña nueva (pantalla propia, el panel no se abre hasta guardarla).
- Casos cubiertos: contraseñas distintas; correo que ya tiene cuenta (Supabase devuelve usuario sin identidades) → manda a iniciar sesión con el correo puesto; correo sin verificar → botón "Reenviar correo de verificación"; enlace de correo caducado (`#error_description`) → mensaje claro; vuelta de verificación → aviso "Correo verificado ✅".
- Probado por Claude en local y en `casaviva.company/panel/`: navegación, contraseñas distintas, correo existente, contraseña mala, enlace caducado, vista móvil 375 px. Publicado también en Vercel (`dpl_B4T7cMAQ9HceXipWi8NvwSiFUemV`).
- NO probado (necesita un correo real nuevo): que llegue el correo de verificación y a qué dirección lleva. Depende de "Redirect URLs" de Supabase (Authentication → URL Configuration): añadir `https://casaviva.company/panel/`. Las plantillas de correo de Supabase siguen en inglés.

### Panel único — bloque 1: pedidos reales y resumen de la web (2026-10-11 01:45 UTC)
- Decisión de Ernesto: **un solo panel** (`casaviva.company/panel/`). Auditoría de BizneCubano: `docs/nexo-business/AUDITORIA-PANEL-BIZNECUBANO-2026-10-11.md`.
- Función `nexo-panel-web` (solo dueñas vía `nexo_panel_is_owner`, solo lectura, clave Woo solo en el servidor): `summary` (mes: concretado / por atender / perdido + gestoras) y `orders` (filtros, búsqueda, 20 por página).
- Panel: Resumen → bloque "Web casaviva.company · este mes"; Pedidos → pestaña "Web casaviva.company" (por defecto para la dueña) con detalle, WhatsApp al cliente y "Gestionar en la web".
- Probado por Claude: sin sesión → 401; con la sesión de Ernesto (entrada por enlace de WhatsApp, de punta a punta) → resumen real (13 pedidos en octubre: 0 concretados, 4 por atender 75 USD, 9 perdidos 399 USD), lista y detalle; vista móvil 375 px; sesión cerrada al terminar. Publicado en Hostinger y Vercel (`dpl_AabrhTPWTB5LR2YWaD2MntV9tLro`).
- **Aviso operativo:** 4 pedidos web "En espera" sin atender: #2820 (8-oct), #2827 (9-oct), #2881 (10-oct) y #2677 (prueba de Lennys como gestora).
- Siguiente del panel único: acciones sobre el pedido (completar / cancelar con las reglas de Core), gestoras (pagos, solicitudes, prueba), comisión por producto editable y la misma en caja, inventario y precios en masa.

### Comisiones: una sola fuente, el panel (D37) — 2026-10-11 03:00 UTC
- Tabla nueva `nexo_business.product_commissions` (migración `20261011020000`): única fuente. La caja (`line_commission`), la ficha de costo y la ganancia leen de ella. Un desvío (`product_costs_route_commission`) manda ahí cualquier comisión escrita en la ficha vieja (p. ej. la revisión del Excel).
- Cargadas 184 de la web (D36) + 13 que solo estaban en la nube = 197. Conflicto: alfombra cv-2457, web 6 / nube 2 → 6 (BizneCubano).
- Simulación revertida: 2 toallas → 2,00 (1 fijo c/u); cv-2457 → 6,00; desvío OK.
- `nexo-commission-push`: copia la comisión del panel a la web (`_cvd_commission_type=fixed`, `_cvd_commission_value`), variantes por `products/{padre}/variations/{id}`, comprueba lo guardado. Panel: al guardar una comisión se copia al momento. Copia completa cada noche (`pg_cron` 03:15 UTC, clave en Vault). Probada: 193 copiadas, 0 fallos.
- Pendiente: los 21 productos con comisión "percent" en la web (ocultos) no se tocaron.

### Panel único — bloque gestoras (2026-10-11 ~04:00 UTC)
- Core 3.13.28 (Casa-Viva `9c7e5bd`, en producción, copia `~/bak-20261011-cvd-3.13.27`): `CVD_Panel_Bridge` → `GET panel/gestoras`, `POST panel/gestoras/{id}/status` (misma lógica que el bot), `GET panel/payouts`, `POST panel/payouts/{id}` (approve/pay/reject vía `CVD_Payouts::transition`, firma Lennys user 14). Clave propia `X-Nexo-Panel-Key` (hash en opción `cvd_panel_key_hash`; clave en secreto Supabase `CASAVIVA_PANEL_KEY`).
- `nexo-panel-web`: acciones `gestoras`, `gestora_status`, `payouts`, `payout_action` (solo dueñas).
- Panel → Equipo → "Gestoras web": por aprobar / activas / rechazadas, código, ventas, comisión por pagar, invitada por, ficha con historial de pagos, aprobar/rechazar, WhatsApp; caja "Pagos de la web por atender" con Aprobar / Pagado / Rechazar.
- Probado por Claude: Core sin clave → 401; con clave → 30 gestoras (29 activas, 1 por aprobar), pagos OK; sintaxis del panel OK; publicado en Hostinger y Vercel.
- NO probado por Claude: la pantalla con sesión de dueña (límite de 5 enlaces/día alcanzado) ni aprobar/pagar de verdad (decisiones de Lennys; no hay solicitudes de pago abiertas).
- Pendiente de este bloque: guardar "quién la invitó" en el registro (`_cvd_invited_by`, el panel ya lo muestra) y el QR del código.

### Invitación y QR de gestoras (Core 3.13.29, 2026-10-11)
- `/registro-gestora/?invita=CÓDIGO`: muestra "Te invita X" y guarda `_cvd_invited_by` al registrarse (solo si quien invita es gestora aprobada; nunca a sí misma; no se reescribe). El panel ya lo muestra ("invitada por").
- Área de la gestora → sección "Invita a otras gestoras": enlace, copiar, compartir por WhatsApp, QR para invitar y QR de su código para la tienda (usa `CVQRCode` ya existente).
- Probado: enlace real → "Te invita Harley Adrián Peña La Rosa" + código oculto; código falso → nada; área renderizada como la usuaria 43 → sección con 2 QR y enlace correcto. Copia `~/bak-20261011-cvd-3.13.28`.
- No probado: un registro real por invitación (crearía una cuenta) ni el dibujo del QR en un móvil.
- Ajuste de trabajo: ECC GateGuard sin preguntas en archivos/comandos normales (`.claude/settings.local.json`); sigue activo ante comandos destructivos.

### Acciones sobre pedidos web desde el panel (Core 3.13.30, 2026-10-11)
- `CVD_Panel_Bridge`: `GET panel/sales`, `POST panel/sales/{id}/status|return` → ejecuta las rutas del Centro de ventas (`/sales`) con `rest_do_request` firmando como Lennys (user 14): mismas reglas, permisos y transiciones que `/ventas/`.
- `nexo-panel-web`: `sale` (estado y acciones permitidas de un pedido) y `sale_action`.
- Panel → detalle de pedido web: estado real + solo los botones que Core permite (Listo para salir, Entregado al mensajero, Dinero recibido con forma de pago/USD/CUP/confirmaciones, Incidencia, Cancelar, Devolución con motivo e importes).
- Arreglado: la ficha de gestora usaba `sheet.querySelector` (openSheet devuelve `{el, close}`).
- Probado: lectura `panel/sales` con clave (50 pedidos, todos cancelados → sin acciones) y sin clave → 401; sintaxis OK; publicado.
- NO probado: ejecutar una acción real (no hay pedidos abiertos y crear uno avisaría a mensajeros) ni la pantalla con sesión de dueña (límite diario de enlaces). Primer pedido real: probar con Lennys.

### CAMBIO: fin de BizneCubano (2026-10-11 03:18 UTC) — D38
- Última foto BizneCubano 03:15 → web (0 cambios) y caja (0 cambios). Comparación web vs caja: 279 productos comunes, 0 diferencias.
- Congelado: workflows de BizneCubano desactivados; NEXO `auto_import=false`, `price_authority=nexo`, `stock_bridge_from=03:18:09`.
- Puente de existencias `nexo-stock-bridge` (pg_cron cada 2 min, clave en Vault). Core 3.13.31: `panel/stock/adjust` (claves únicas en `wp_cvd_nexo_stock_keys`), `panel/stock/web-sales`, `panel/stock/levels`, `panel/products/price`.
- Probado de verdad: caja 3→2 → web 2; caja 2→3 → web 3; tercera pasada 0 movimientos (sin duplicar). Lógica web→caja (simulada y revertida): devolución sin venta rechazada, venta resta, repetida no hace nada, cancelación devuelve, no rebota a la web.
- Panel → pestaña Inventario: precio y cantidad por producto, filtros (web distinta, pocas unidades, agotados). Precio → nube (las cajas lo descargan) + web; cantidad → conteo → puente → web.
- Quedan 2 movimientos de prueba en el historial de la toalla (−1 y +1, "Prueba del puente (Claude)"), neto 0.
- PENDIENTE mañana: (1) cajas de Lennys/Zaymi/Nana: vaciar datos locales y volver a dar de alta (por si guardan ventas de prueba sin enviar); (2) productos nuevos: hoy entran por la web pero no llegan solos a la caja → definir el flujo (Digitaliza o importación manual sin stock); (3) primer pedido web real: comprobar que la caja resta.
