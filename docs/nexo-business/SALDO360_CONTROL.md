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
| 4 | Registro y roles | 🟡 | Roles y permisos en la base (comprador/proveedor/admin, nadie se sube de rol). Falta pantalla de registro/login (necesita el paso 3 en vivo). |
| 5 | Tienda y avatar | 🟡 | Tablas, Storage `shop-photos` y permisos listos y probados. Falta pantalla «Mi tienda». |
| 6 | Publicación ofertas | 🟡 | Base lista (vigencia ≤ 72 h, máx. 5 activas, pausar, reconfirmar). Hoy: formulario «Tengo saldo» con consentimiento + importación supervisada. Falta editor con cuenta. |
| 7 | Búsqueda y WhatsApp | 🟢 | Monto + forma de pago (se conservan al volver), precio final, vigencia, reputación real, WhatsApp y registro de contacto (no venta). Falta prueba con oferta real. |
| 8 | Solicitudes / seguimiento | 🟡 | RPC `start_request` / `request_action` con doble confirmación y disputas, probadas. Falta pantalla. |
| 9 | Reputación / moderación | 🟡 | Reputación solo de operaciones confirmadas por ambos; reseña única del comprador; RPC de moderación y auditoría, probadas. Falta panel. |
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
1. **Acción de Ernesto (2 min, bloquea el acceso público):** en Vercel → proyecto `saldo360-piloto` → *Settings → Environments → Production → Branch Tracking*: poner `casa-viva/saldo360-piloto-20261026` y guardar. Luego *Settings → Domains → saldo360.casaviva.company → Edit*: quitar la rama (dejarlo en **Production**). Así el dominio deja de pedir login y los enlaces de prueba siguen protegidos. (Claude lo intentó: el panel dijo «You need additional permissions» y el cambio por API quedó bloqueado por seguridad.) Alternativa más simple pero menos segura: *Deployment Protection → Vercel Authentication → Off*.
2. **Copia de seguridad diaria del Supabase `saldo360`:** el plan gratis no hace copias. Hace falta la contraseña de la base (Supabase → Project Settings → Database → *Reset database password*); se guarda solo en el VPS (`/root/saldo360/.env`, nunca en GitHub) y se programa `pg_dump` diario a `/root/backups/saldo360-*.sql.gz` (7 días).
3. Con la base viva: pantallas de registro/login y «Mi tienda» (Fases C–D).

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
