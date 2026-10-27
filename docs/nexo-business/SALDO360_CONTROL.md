# SALDO 360 — CONTROL DE AVANCE (archivo vivo)
**Última actualización:** 2026-10-27 (Claude Code, traspaso desde ChatGPT)  
**Blueprint:** `docs/nexo-business/SALDO360_MASTER_BLUEPRINT.md`  
**Repo:** `ernest196391/ernesto-rondon-nexo`  
**Rama:** `casa-viva/saldo360-piloto-20261026`  
**PR:** https://github.com/ernest196391/ernesto-rondon-nexo/pull/134 (borrador)  
**Regla:** actualizar este documento en el MISMO commit o PR que cada bloque. «Hecho» requiere evidencia; «visual» no implica «funcional».

## Semáforo
🟢 Listo y comprobado · 🟡 Parcial / en curso · ⚪ Pendiente · 🔴 Bloqueado

| Paso | Tema | Estado | Evidencia y pendiente |
|---|---|---|---|
| 0 | Inventario / punto de partida | 🟢 | Auditoría real 27-oct: `SALDO360_AUDITORIA_CONTINUIDAD_2026-10-27.md` (código, Vercel, DNS, VPS, VivaBot, Supabase). |
| 1 | Producto, legal y reglas | ⚪ | Falta revisión de actividad comercial/ETECSA/privacidad. Unidad de precio fijada: CUP por cada 100 CUP. |
| 2 | UX app-first / identidad / rutas | 🟢 | Portada BUSCO/TENGO SALDO, buscador con precio final, tiendas, perfil, 404 en español, iconos PWA. Probado en móvil 375 px (27-oct). Falta aprobación visual de Ernesto. |
| 3 | BD + RLS | 🟢 | Supabase `saldo360` (`zgjycphcugbiyoluqsry`, us-east-1, plan gratis) creado 27-oct con las 2 migraciones. Permisos verificados en la base real (prueba que se deshace sola) + 26 pruebas PGlite. Falta copia de seguridad diaria (el plan gratis no la hace). |
| 4 | Registro y roles | 🟢 | Cuentas con **número Cubacel + clave** (decisión 27-oct): sin correo, SMS ni WhatsApp automáticos. Olvido de clave → clave temporal desde Revisar tiendas, enviada a mano. Probado de punta a punta (`1f78e89`). **Falta que Ernesto apague «Confirm email» en Supabase** para que el registro público funcione. |
| 5 | Tienda y avatar | 🟢 | `/saldo360/mi-tienda`: crear con WhatsApp cubano + autorización, foto (512 px WebP, reemplaza la anterior), editar, pausar/reactivar, contactos de 7 días. Probado de punta a punta (27-oct). |
| 6 | Publicación ofertas | 🟢 | Mis ofertas: publicar, cambiar precio, pausar, «Sigue en pie», quitar; vigencia calculada en la base (RPC `publish_offer`/`update_offer`/`confirm_offer`). Probado de punta a punta. |
| 7 | Búsqueda y WhatsApp | 🟢 | Monto + forma de pago (se conservan al volver), precio final, vigencia, reputación real, WhatsApp y registro de contacto (no venta). Falta prueba con oferta real. |
| 8 | Solicitudes / seguimiento | 🟡 | RPC `start_request` / `request_action` con doble confirmación y disputas, probadas. Falta pantalla. |
| 9 | Reputación / moderación | 🟡 | `/saldo360/admin` (solo rol admin): verificar por WhatsApp, aprobar, suspender tiendas. Reputación y disputas en la base; faltan sus pantallas. |
| 10 | Bot WhatsApp | 🟡 | Intérprete VivaBot corregido (PR #23, `e682517`, 8/8). Sin desplegar, sin cron, sin leer chats. |
| 11 | QA, piloto, lanzamiento | 🔴 | Dominio con HTTPS OK pero **pide login de Vercel** (acción de Ernesto abajo). Hosting Hobby no comercial. |

## Punto de restauración y estado verificado
- **27-oct:** commits `c7087f3` (base + RLS) y `ba14509` (portada y buscador), despliegue `dpl_8TviVkYMHiNTsX1Pv8A1FxGZBWiY` **READY** (`saldo360-piloto-jrw79rw39-…vercel.app`). Volver atrás: redeploy de `dpl_9gihpzzYGXGhrJNy8k3Sfrany8TT` (commit `6df76bd`).
- **Vercel proyecto:** `saldo360-piloto` (prj_ZpjL97o0Gvx5NeTXjcUk7QnsW2Yq)
- **Último despliegue confirmado READY que se verificó por herramienta:** dpl_8ZTPdvzVvYcdscHaohi2pgn1RoUU, commit `49e40fb1`; URL `https://saldo360-piloto-gjwkonlij-ernest196391s-projects.vercel.app/saldo360`.
- Rama actual recibió nuevos commits de UX/blueprint después. **No asumir que están publicados** hasta comprobar el despliegue correspondiente.
- **Sin backend real ni transferencias de dinero**; solo demos/ofertas consentidas manuales.
- No se tocó la producción de Casa Viva para esta auditoría.

## Próxima acción EXACTA
1. **Ernesto — apagar «Confirm email» (1 clic, bloquea registros):** Supabase → proyecto `saldo360` → *Authentication → Sign In / Providers → Email* → apagar **Confirm email** → *Save*. Comprobado el 27-oct: con el interruptor encendido, cada registro intenta mandar un correo y Supabase lo frena (429). Con él apagado no se envía nada.
2. **Ernesto — abrir el dominio al público (2 min):** Vercel → `saldo360-piloto` → *Settings → Environments → Production → Branch Tracking*: `casa-viva/saldo360-piloto-20261026`; luego *Domains → saldo360.casaviva.company → Edit* → Production. Hoy el dominio pide login de Vercel.
3. **Primer administrador:** Ernesto se registra con su número en `/saldo360/entrar?modo=registro` y Claude le pone el rol `admin` por SQL.
4. **Piloto:** 3 proveedores se registran con su número; Ernesto verifica cada WhatsApp a mano y aprueba en «Revisar tiendas».
5. **Copia de seguridad diaria** (plan gratis sin copias): contraseña de la base → `/root/saldo360/.env` en el VPS → `pg_dump` diario a `/root/backups/saldo360-*.sql.gz`.
6. **Más adelante (no urgente):** correo SMTP (puede costar en Hostinger; alternativa gratis Brevo) o códigos por WhatsApp con un número propio de Saldo 360; luego «Mis operaciones» y reseñas (Fase F) y VivaBot → `admin_publish_offer` (Fase G).

## Obligaciones para el próximo agente
1. Leer `SALDO360_MASTER_BLUEPRINT.md` completo y este CONTROL.
2. No modificar `main` ni producción Casa Viva.
3. Tomar solo el paso activo; documentar archivos, pruebas, SHA, URL exacta, resultado, problemas y siguiente acción.
4. Nunca marcar cuentas ni transacciones verificadas si son datos ficticios.
5. Preguntar por autorización para costos, producción y pasos irreversibles.

## Registro de sesiones
### 2026-10-26 — Blueprint 1.0
- Auditoría del PR #134 y Vercel; identidad y copy, estructura de marketplace a nivel frontend.
- Hallazgo: rutas reales y demo conviven; cuentas/BD/reputación/bot aún no existen.
- Documento maestro escrito y control creado. Próxima acción: Paso 0 smoke/UX + Paso 1 contrato de operación.

## Sesión 26-oct-2026 — subdominio, portada y VivaBot (actualización)
- **Dominio Hostinger:** usuario ya creó `saldo360.casaviva.company`. Su screenshot de Hostinger señala directorio `/home/u824654880/domains/casaviva.company/public_html` (compartido con la web raíz): **NO subir app, borrar ni sobrescribir nada en esa carpeta**.
- **Dominio Vercel:** agregado/validado en el proyecto `saldo360-piloto` ligado a la rama `casa-viva/saldo360-piloto-20261026`. Aún **DNS MAL CONFIGURADO**: nameservers Hostinger `horizon.dns-parking.com` y `orbit.dns-parking.com`; resuelve IP de Hostinger. Solo se debe cambiar el registro DNS del host `saldo360`: CNAME recomendado `a20442328f1324fb.vercel-dns-017.com.` (volver a consultar valor exacto en Vercel antes de editar). No tocar A de `@`, MX ni DNS de `www`.
- **UI:** página `/saldo360` ahora es portada con 2 acciones «Busco saldo» y «Tengo saldo»; antigua simulación a `/saldo360/demo`; listado real `/saldo360/ofertas` no publica datos ficticios; `/saldo360/publicar` prepara texto copiable, **no lo envía ni publica**. Manifest/metadata PWA básicos en `/saldo360`. `proxy.ts` redirige / solo en dominio dedicado de Saldo 360, sin cambiar inicio de NEXO.
- **WhatsApp bot:** `ernest196391/vivabot`, rama `feat/saldo360-supplier-feed-20261026`, PR borrador #23: parser y cola de mensajes exportados voluntariamente para revisión; **no es lector automático ni está desplegado en VPS**. Mensajes requieren consentimiento explícito para usar y publicar teléfono. Un ejemplo de extracción pasó comprobación manual. No publicar ni escribir a proveedores sin autorización.
- **Supabase:** proyectos existentes vistos; no hay uno dedicado a Saldo 360. No usar `nexo-production` ni crear otro sin aclarar organización/coste. Registro real y panel de vendedores siguen pendientes.
- **Infraestructura:** el hosting de Hostinger y la clave SSH del PC no son accesibles desde este chat; las herramientas conectadas permiten GitHub/Vercel, no edición DNS Hostinger ni terminal de su Windows.
- **Próxima acción para lanzamiento:** 1) comprobar nuevo deploy READY y pruebas móvil; 2) arreglar CNAME *solo saldo360* en hPanel → Dominios → DNS; 3) verificar HTTPS y apertura de ambas rutas; 4) añadir autorización real de 3 proveedores; 5) preparar Supabase aislado (organización/coste), Auth y publicación de ofertas; 6) conectar VivaBot aislado con fuente autorizada y horario Havana, aprobación humana inicial. **No asegurar que el barrido 07:00 del 27-oct esté programado**.

## Sesión 27-oct-2026 — Claude Code (auditoría de continuidad + base de datos + rediseño)
**Informe completo:** `SALDO360_AUDITORIA_CONTINUIDAD_2026-10-27.md`.
- **DNS hecho:** Hostinger, solo el registro `saldo360` (ALIAS a Hostinger → CNAME `a20442328f1324fb.vercel-dns-017.com`). Vercel `misconfigured:false`, HTTPS emitido, `casaviva.company` intacta (200).
- **Bloqueo:** el dominio pide login de Vercel (protección de preview). Solución en «Próxima acción».
- **Base de datos (sin aplicar):** `saldo360/supabase/migrations/20261027000100_saldo360_base.sql` (perfiles, tiendas, ofertas, reputación, contactos, operaciones, reseñas, denuncias, auditoría, consentimientos, vista `market_offers`, RPC `log_contact`, `start_request`, `request_action`, `leave_review`, `admin_*`) y `…000200_saldo360_fotos.sql` (Storage). Pruebas: `npx vitest run saldo360/supabase/tests` → **26/26**.
- **Web:** `lib/saldo360/market.ts` (reglas y precio), `market-source.ts` (Supabase o archivo supervisado), `app/saldo360/*` rediseñado. Pruebas `npx vitest run lib/saldo360` → **5/5**. `tsc` OK, `next build --webpack` OK, Vercel READY. Probado en navegador a 375 px con 2 ofertas de prueba **locales** (no subidas): precio 1000 × 42,5/100 = 425 CUP, filtros, dirección, perfil, 404 y formulario.
- **VivaBot PR #23:** `e682517` — unidad por 100 CUP, decimales con coma, sin tildes, mensaje de la web. **8/8**. Nada desplegado en el VPS.
- **VPS:** solo lectura. Errores de Casa Viva anotados en la auditoría (Telegram Unauthorized, correo Core 400), sin tocar.
- **No hecho / no verificado:** proyecto Supabase (espera autorización), registro y paneles, ofertas reales, acceso público al dominio.
- **Cómo publicar ofertas HOY (importación supervisada):** el proveedor manda el texto de «Tengo saldo» → se revisa con él → se añade a `data/saldo360/offers.json` con `confirmedAt`/`expiresAt` (≤ 72 h) y commit → Vercel publica. Solo con consentimiento registrado (fuera del repo).

## Sesión 27-oct-2026 (tarde) — Supabase saldo360 creado y conectado
- **Proyecto:** `saldo360`, id `zgjycphcugbiyoluqsry`, `https://zgjycphcugbiyoluqsry.supabase.co`, us-east-1, organización «Ernesto Rondón», **plan gratis, 0 USD/mes** (autorizado por Ernesto).
- **Migraciones aplicadas:** `saldo360_base` y `saldo360_fotos` (mismo SQL que `saldo360/supabase/migrations/`). Avisos de Supabase: solo «funciones SECURITY DEFINER ejecutables», esperado (cada RPC comprueba quién llama). Ninguna tabla sin RLS.
- **Prueba en la base real** (transacción que se deshace): tienda nueva pendiente, rol vendedor automático, el dueño no se autoaprueba, el visitante ve la oferta pero no perfiles ni evidencia de consentimiento, un clic = contacto y 0 operaciones, el proveedor B no edita la oferta de A ni usa funciones de admin.
- **Web conectada:** variables `NEXT_PUBLIC_SALDO360_SUPABASE_URL` y `NEXT_PUBLIC_SALDO360_SUPABASE_ANON_KEY` (clave `sb_publishable_…`, pública por diseño) en Vercel para production/preview/development. Commit `442c9ac`, despliegue `dpl_G4LS2u8d6j4AQXth9i3NEffxRdPh` READY.
- **Prueba de punta a punta:** oferta temporal «PRUEBA — no comprar» (WhatsApp ficticio) creada con `admin_publish_offer` → apareció en `/saldo360/ofertas` del despliegue real con 1000 CUP → 425 CUP; `log_contact` como visitante → 1 contacto, 0 operaciones. **Borrada** después: la base quedó con 0 tiendas, 0 ofertas, 0 contactos.
- **Desde ahora las ofertas salen de Supabase.** `data/saldo360/offers.json` solo se usa si faltan las variables. Importación supervisada: `saldo360/supabase/plantillas/importar-oferta.sql`.
- **Pendiente:** copia diaria (ver Próxima acción 2), primer usuario admin (cuando exista el registro), acceso público al dominio (Próxima acción 1).

## Sesión 27-oct-2026 (noche) — Fases C y D: cuentas, Mi tienda y Mis ofertas
- **Pantallas nuevas:** `/saldo360/entrar` (entrar, crear cuenta, olvidé contraseña; `?rol=vendedor` lleva a Mi tienda), `/saldo360/nueva-clave`, `/saldo360/mi-cuenta` (sesión real), `/saldo360/mi-tienda` (crear, foto, editar, pausar, ofertas), `/saldo360/admin` (revisar tiendas). «Tengo saldo» lleva a crear la tienda.
- **Código:** `lib/saldo360/supabase-browser.ts` (cliente, `@supabase/supabase-js` 2.117.3 fijo), `lib/saldo360/shop-rules.ts` (móvil cubano, dirección de tienda, errores en español), `app/saldo360/useCuenta.ts`, `app/saldo360/mi-tienda/*`, `app/saldo360/admin/page.tsx`.
- **Base:** migraciones `…000300` (RPC del vendedor con hora del servidor), `…000400` (corrige: pausar/quitar una oferta vencida hace días fallaba), `…000500` (corrige: el dueño no podía borrar/reemplazar su foto). Aplicadas en `saldo360`.
- **Pruebas:** 9 unitarias + 29 de permisos (PGlite) OK; `tsc` OK; `next build` (Turbopack) OK. **De punta a punta contra la base real** (local, móvil 375 px): contraseña mala → «Correo o contraseña incorrectos»; crear tienda (móvil inválido rechazado) → «En revisión»; oferta guardada pero NO pública; foto subida (carpeta propia 200, ajena 403); autoaprobación por API rechazada; admin aprueba → oferta pública con foto y 1000 CUP → 425 CUP; cambiar precio 42,5→40; pausar (desaparece), renovar (vuelve), quitar; pausar/reactivar tienda. Después se borró todo: 0 usuarios, 0 tiendas, 0 fotos.
- **Hallazgos:** Supabase sin SMTP propio solo envía correos al equipo y limita a ~2 registros/hora (429 comprobado). Las URLs de Auth siguen en `localhost`. Ver «Próxima acción».
- **Commits:** `5e093ca` (base), `ce818d8` (pantallas).

## Sesión 27-oct-2026 (noche, 2) — Cuentas por número + clave
- **Decisión de Ernesto:** sin correo ni verificación automática en el piloto (el correo podría costar en Hostinger y el WhatsApp automático arriesga bloqueos). Cuenta = móvil Cubacel + clave; verificación humana al aprobar la tienda.
- **Cómo funciona:** la cuenta interna es `saldo360+<53XXXXXXXX>@casaviva.company` (Supabase exige un dominio con correo; `tel.saldo360…` fue rechazado). No se envía ningún mensaje.
- **Olvido de clave:** `admin_temp_password` (migración `…000600`) crea 8 cifras; el admin las manda a mano con el botón de WhatsApp; el usuario la cambia en Mi cuenta. `admin_shop_owners` (`…000700`) da el número del dueño.
- **Probado de punta a punta (base real):** número inválido avisado; clave mala → «Número o clave incorrectos»; entrar con número; tienda con WhatsApp prellenado; admin genera clave temporal (la vieja deja de servir); vendedor entra con la temporal y la cambia (la temporal deja de servir). Limpiado: base en 0.
- **Commits:** `1f78e89`. Pruebas: 10 unitarias + 30 permisos; `next build` OK.
