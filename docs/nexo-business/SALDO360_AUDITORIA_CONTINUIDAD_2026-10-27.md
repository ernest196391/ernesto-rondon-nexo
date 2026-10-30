# Saldo 360 — Auditoría de continuidad (27-oct-2026, Claude Code)

Traspaso desde ChatGPT. Se auditó **código, despliegue, dominio, VPS, VivaBot y Supabase reales**, no solo documentos.
Leer junto a `SALDO360_MASTER_BLUEPRINT.md` y `SALDO360_CONTROL.md`.

## 1. Repositorio y código
| Qué | Resultado |
|---|---|
| Rama | `casa-viva/saldo360-piloto-20261026`, HEAD inicial `6df76bd` (coincide con el traspaso). PR #134 borrador. 37 commits sobre `main` (`d0ebfa0`). |
| Toca código ajeno | Solo 3 archivos compartidos: `proxy.ts` (redirige `/` → `/saldo360` **solo** en el host de Saldo 360), `app/CommerceSiteShell.tsx` (excluye `/saldo360` del marco comercial) y `tsconfig.json` (excluye un plugin). No afectan a Casa Viva ni a la tienda NEXO. |
| Tipos | `tsc --noEmit` OK (antes y después). |
| Build | `next build --webpack` OK en local; Vercel READY en cada commit. |
| Lint | Saldo 360 sin errores (avisos `<img>` aceptados: SVG ligeros). Había 1 error antiguo en la demo (justificado y marcado). |

**Errores reales encontrados y corregidos**
1. **Dos unidades de precio distintas**: la web guardaba «CUP por cada CUP» (`rateCupPerCup`) y el formulario/VivaBot hablaban de «precio por 100 CUP». Riesgo de publicar precios 100 veces mal. → Unidad única en todo: **CUP por cada 100 CUP de saldo** (web, base y VivaBot).
2. **Las ofertas vivían en un JSON del repo**: cada cambio de precio exigía un despliegue. → Capa de datos `lib/saldo360/market-source.ts`: lee el Supabase de Saldo 360 cuando se configure; mientras, el archivo supervisado `data/saldo360/offers.json` (vacío: **cero ofertas falsas**).
3. Portada con textos sobrantes («EL MERCADO DE SALDO EN CUBA», «Saldo, sin vueltas.», «Ver tiendas →»). → Logo, «¿Qué necesitas?», **BUSCO SALDO / TENGO SALDO** y una línea de seguridad.
4. «Mi cuenta» describía funciones inexistentes. → Dice la verdad y ofrece lo que sí funciona.
5. Icono pequeño ilegible (flechas azul sobre azul a 16 px). → Icono simplificado para pestaña + PNG 192/512/maskable para instalar en Android.
6. Página 404 en inglés y vista previa al compartir con la marca NEXO. → 404 en español y Open Graph propio.

## 2. Vercel y dominio
| Qué | Resultado |
|---|---|
| Proyecto | `saldo360-piloto` (`prj_ZpjL97o0Gvx5NeTXjcUk7QnsW2Yq`), Next.js, Node 24, plan Hobby. Las 37 compilaciones son de la rama Saldo 360. |
| DNS | **Arreglado 27-oct.** En Hostinger se borró solo `ALIAS saldo360 → saldo360.casaviva.company.cdn.hstgr.net` y se creó `CNAME saldo360 → a20442328f1324fb.vercel-dns-017.com` (TTL 300). `@`, `www`, MX, DKIM, SPF y DMARC intactos; `casaviva.company` responde 200. Vercel: `misconfigured: false`. Vuelta atrás: borrar el CNAME y recrear el ALIAS anterior. |
| HTTPS | Certificado emitido (HTTP → 308 a HTTPS). |
| **Bloqueo** | El dominio está ligado a la rama como *preview* y la protección de Vercel («Vercel Authentication», `all_except_custom_domains`) **pide login de Vercel** en `saldo360.casaviva.company`. El público aún no puede entrar. Ver solución en CONTROL («Acción de Ernesto»). |
| Plan Hobby | Solo uso no comercial. Antes de abrir el negocio: Vercel Pro (20 USD/mes) u otro alojamiento. **No se contrató nada.** |

## 3. VPS (Hostinger, `srv2034193`) — solo lectura, sin reinicios
- `root`, Node 22.23, PM2: `vivabot` **online** (180 reinicios acumulados, 2,2 GB de RAM) y `pm2-logrotate`. Zona horaria del servidor **America/Havana** (sirve para un cron a las 7:00 sin conversiones).
- Memoria: 3,9 GB totales, **~1 GB disponible**. Un proceso más siempre encendido es arriesgado → para Saldo 360, tareas **cron cortas**, no otro proceso PM2.
- Copias: `/root/backups/vivabot-auth-*.tgz` diario (sesión de WhatsApp, 7 días) + carpetas `bak-*` manuales. No hay copia de la base de datos en el VPS.
- Errores vistos en logs (de Casa Viva, **no tocados**): `Telegram getUpdates: Unauthorized` en bucle (token de Telegram caducado), `[correo] Core 400: cuerpo JSON no válido`, `[reparto] directo fetch failed`. ElevenLabs con 4.662 caracteres (se renueva 7-nov).
- Hay 17 tareas cron de Casa Viva; ninguna de Saldo 360.

## 4. VivaBot (`ernest196391/vivabot`, PR #23)
- Rama `feat/saldo360-supplier-feed-20261026`, HEAD inicial `ca5cbf2`. 4 archivos aislados (reglas, script de revisión, prueba, doc). **No está en el VPS, no lee WhatsApp, no envía, no tiene cron.**
- Pruebas originales 5/5, pero con fallos reales: `430,50` daba NaN, «TRANSFERMOVIL» sin tilde no se reconocía y la salida usaba otra unidad. → Corregido en `e682517`, **8/8 pruebas**.
- **Qué reutilizamos:** el intérprete y la cola de revisión; el servidor y su zona horaria; el patrón `cv` para comandos. **Qué NO reutilizamos:** la sesión de WhatsApp de Casa Viva (es el número personal de Ernesto) ni sus contactos/chats. Precedente: el 13-oct un mensaje para Lennys llegó por error a 13 vendedores de saldo desconocidos (ESTADO) → ningún envío automático a vendedores sin opt-in.
- Integración segura propuesta: proveedor escribe a un número/canal de Saldo 360 con opt-in → borrador → aprobación humana → `admin_publish_offer` en el Supabase de Saldo 360 → la web lo muestra. Cron 7:00 Cuba **solo** para recordar a proveedores con opt-in y caducar ofertas.

## 5. Supabase
- Organización «Ernesto Rondón», **plan Free**. Proyectos: `nexo-production` (activo, **no se usa**), `nexo-studio`, `cuyana`, `gestor-remesas` y uno sin nombre (pausados).
- Crear `saldo360`: **coste 0 USD/mes** (consultado). Límites del plan gratis: 2 proyectos activos a la vez (quedarían `nexo-production` + `saldo360`), **sin copias automáticas** (hay que programar `pg_dump`) y se pausa tras 7 días sin uso.
- **Modelo de datos y permisos hechos y probados** (sin aplicar a ningún proyecto): `saldo360/supabase/migrations/` + `saldo360/supabase/tests/` — 26 pruebas de RLS en PGlite (Postgres real en memoria).

## 6. Qué queda abierto (en orden)
1. Ernesto: quitar el login de Vercel del dominio (2 minutos, ver CONTROL).
2. Ernesto: autorizar crear el proyecto Supabase `saldo360` (gratis) → aplicar migraciones, configurar variables en Vercel y probar en vivo.
3. Registro/inicio de sesión (Fase C), tienda y ofertas del proveedor (Fase D) sobre esa base.
4. Tres proveedores reales con consentimiento → primeras ofertas por importación supervisada.
5. Hosting comercial y revisión legal antes de abrir al público.
