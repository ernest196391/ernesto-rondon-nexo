# SALDO 360 — CONTROL DE AVANCE (archivo vivo)
**Última actualización:** 2026-10-26  
**Blueprint:** `docs/nexo-business/SALDO360_MASTER_BLUEPRINT.md`  
**Repo:** `ernest196391/ernesto-rondon-nexo`  
**Rama:** `casa-viva/saldo360-piloto-20261026`  
**PR:** https://github.com/ernest196391/ernesto-rondon-nexo/pull/134 (borrador)  
**Regla:** actualizar este documento en el MISMO commit o PR que cada bloque. «Hecho» requiere evidencia; «visual» no implica «funcional».

## Semáforo
🟢 Listo y comprobado · 🟡 Parcial / en curso · ⚪ Pendiente · 🔴 Bloqueado

| Paso | Tema | Estado | Evidencia y pendiente |
|---|---|---|---|
| 0 | Inventario / punto de partida | 🟡 | PR #134, código y Vercel inventariados; confirmar smoke tests del despliegue nuevo y prueba móvil. |
| 1 | Producto, legal y reglas | ⚪ | Falta revisión de actividad comercial/ETECSA/privacidad y consentimiento. |
| 2 | UX app-first / identidad / rutas | 🟡 | SVG + pantallas de tiendas/perfil/cuenta; falta inicio canónico en /saldo360, PWA y probar accesibilidad. |
| 3 | BD + RLS | ⚪ | Sin proyecto BD dedicado ni migraciones. |
| 4 | Registro y roles | ⚪ | /mi-cuenta es maqueta, todavía NO registra usuarios. |
| 5 | Tienda y avatar | 🟡 | Ficha pública de prueba; NO hay fotos cargadas por proveedores. |
| 6 | Publicación ofertas | ⚪ | JSON de proveedores vacío, sin editor ni BD. |
| 7 | Búsqueda y WhatsApp | 🟡 | Filtros básicos y enlace wa.me para proveedores consentidos; falta prueba con oferta real. |
| 8 | Solicitudes / seguimiento | ⚪ | Solo pruebas locales ficticias en demo. |
| 9 | Reputación / moderación | ⚪ | No existen transacciones verificadas. |
| 10 | Bot WhatsApp | ⚪ | No iniciado; canal oficial y consentimiento pendientes. |
| 11 | QA, piloto, lanzamiento | ⚪ | No comercial, sin cuentas reales, hosting Hobby. |

## Punto de restauración y estado verificado
- **Vercel proyecto:** `saldo360-piloto` (prj_ZpjL97o0Gvx5NeTXjcUk7QnsW2Yq)
- **Último despliegue confirmado READY que se verificó por herramienta:** dpl_8ZTPdvzVvYcdscHaohi2pgn1RoUU, commit `49e40fb1`; URL `https://saldo360-piloto-gjwkonlij-ernest196391s-projects.vercel.app/saldo360`.
- Rama actual recibió nuevos commits de UX/blueprint después. **No asumir que están publicados** hasta comprobar el despliegue correspondiente.
- **Sin backend real ni transferencias de dinero**; solo demos/ofertas consentidas manuales.
- No se tocó la producción de Casa Viva para esta auditoría.

## Próxima acción EXACTA
**Completar Paso 0:** confirmar último HEAD y deployment, abrir `/saldo360/ofertas`, `/saldo360/proveedores`, `/saldo360/mi-cuenta` en móvil, comprobar que no hay botones falsos, y anotar capturas/errores. Luego **Paso 1**, documento de alcance/legales y puerta de cumplimiento; mientras se valida lo comercial, es válido implementar en pruebas aisladas el diseño del Paso 2.

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
