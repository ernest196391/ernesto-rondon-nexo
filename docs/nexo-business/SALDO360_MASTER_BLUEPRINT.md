# SALDO 360 — BLUEPRINT MAESTRO 1.0
**Fecha de inicio:** 2026-10-26  
**Propietario del producto:** Ernesto  
**Estado:** desarrollo de MVP, no transaccional  
**Lectura obligatoria al retomar:** este archivo → `SALDO360_CONTROL.md` → `docs/00-FUENTE-DE-VERDAD/LEEME.md` y fuente de verdad general → código y despliegues vigentes. Si hay contradicción, manda el código verificado; registrar el cambio.

## 0. Resumen ejecutivo: qué construimos
**Saldo 360 es un marketplace vertical de ofertas de transferencia de saldo móvil para Cuba, familiar a quien usa Revolico.** Un vendedor crea una tienda con foto y ofertas; un visitante busca por monto, compara precio, reputación **verificable** y contacta al vendedor mediante WhatsApp; el comprador que crea cuenta puede seguir solicitudes y valorar solo operaciones comprobadas.

**Promesa:** «Encuentra saldo. Compara precios. Compra con confianza». No somos ETECSA ni su canal oficial. Al principio **no custodiamos fondos, no procesamos pagos y no transferimos saldo**. La ejecución de operaciones se concierta fuera de la plataforma, bajo las reglas aplicables. Ningún anuncio ficticio aparecerá como real.

**Principio de diseño:** una pantalla = una tarea; máximo 1 acción principal; texto que permite decidir o actuar. Inspiración de familiaridad en clasificados, sin copiar la marca, diseño ni código de Revolico.

### Roles
1. Visitante (sin registro): buscar, filtrar, ver precios/tiendas/reputación, abrir WhatsApp.
2. Comprador (cuenta): historial de solicitudes, favoritos, notificaciones opcionales, reseñas de operaciones verificadas.
3. Proveedor (cuenta, autorización y verificación): foto, nombre, localidad, WhatsApp autorizado, ofertas (precio, disponibilidad, métodos, vigencia), pausa/edición y reportes.
4. Moderador/administrador: aprobar o suspender vendedores, revisar anuncios, disputas y métricas, retirar contenido fraudulento.

### Qué NO hacemos en el MVP
- Cobros ni transferencias gestionadas por Saldo 360; no guardar PIN, tarjetas ni credenciales bancarias.
- «Transacciones completadas» basadas en clics a WhatsApp o declaraciones unilaterales.
- Estrellas y reseñas inventadas; números de teléfono extraídos de grupos privados.
- Scraping de WhatsApp, lectura de chats ajenos ni envíos automáticos sin consentimiento.
- Blockchain, token, criptomonedas integradas, depósitos en garantía o reparto de fondos.
- Recomendaciones «IA» que no estén sustentadas en datos y reglas verificables.
- Monetización sin base legal/comercial verificada.

## 1. Estado comprobado el 26-10-2026
**GitHub:** `ernest196391/ernesto-rondon-nexo` · rama `casa-viva/saldo360-piloto-20261026` · PR borrador **#134**.  
**Aplicación:** Next.js/React en monorepo; código en `app/saldo360/`, apoyo en `lib/saldo360/` y `data/saldo360/`.  
**Vercel:** proyecto `saldo360-piloto` (equipo ernest196391); despliegue de la interfaz al commit `49e40fb1` verificado **READY**. La rama puede tener commits nuevos y despliegues más recientes: **comprobar cada vez antes de decir «publicado»**.  
**Hecho:** SVG e icono, diseño móvil, demo separada, directorio JSON vacío de ofertas reales, pantallas de tiendas/perfil/Mi cuenta, vínculo a WhatsApp si proveedor consintió y oferta sigue vigente.  
**No hecho:** usuarios reales, Auth, BD y permisos, subida de fotos real, publicación de anuncios por proveedor, confirmaciones de transacciones, reseñas confiables, bot de WhatsApp, monetización y autorización para operación comercial.  
**Riesgo:** `/saldo360` sigue siendo demo local de datos ficticios y `/saldo360/ofertas` es directorio real. Convertir /saldo360 en entrada real y mover demo a /saldo360/demo en el paso 2. Evitar confundir ambos.

**Documento técnico complementario:** `docs/nexo-business/SALDO360_MARKETPLACE_ROADMAP_2026-10-26.md`.  
**Identidad y copy actual:** `docs/nexo-business/SALDO360_MARCA_Y_COPY_2026-10-26.md`.  
**Registro del avance:** `docs/nexo-business/SALDO360_CONTROL.md` (editar al completar cada paso).

## 2. Arquitectura base — una sola fuente de datos
```text
Visita (web / PWA Android)
     ↓
Next.js Saldo 360 [rutas /saldo360/*] ───► WhatsApp del proveedor (enlace wa.me)
     ↓
Supabase dedicado (NO las bases de Casa Viva)
 Auth + Postgres + Storage (avatares)
     ↓
Tablas / políticas RLS / registro de auditoría
     ↓
Panel de moderación y métricas
     ↓
Robot WhatsApp autorizado (fase posterior)
```

**Decisión recomendada:** mismo repositorio por ahora, app aislada por rutas y despliegue; **base de datos/identidades independientes** de NEXO Business/Casa Viva. No abrir nuevo repositorio ni duplicar componentes sin necesidad. Si el proyecto necesita ciclos de despliegue separados, extraer a `apps/saldo360-web/` solo con pruebas y migración controlada. No cambiar DNS ahora.

**PWA**: instalable en Android con iconos, manifest, splash simple y buen rendimiento en redes lentas; nunca afirmar «app nativa» cuando todavía es web instalable.

## 3. Plan maestro: 12 pasos consecutivos

### PASO 0 — Congelar estado y fijar fuentes de verdad
**Objetivo:** saber qué tenemos antes de tocarlo.  
**Hacer:** confirmar rama, HEAD, PR, Vercel READY, rutas existentes; inventario de archivos; registrar problemas conocidos; separar demo y ofertas reales; elegir flujo de pruebas con 2 usuarios ficticios y 2 vendedores ficticios **solo en entorno aislado**.  
**Terminado cuando:** inventario/capturas/URL/commit se registren en CONTROL y exista rollback al último despliegue conocido.  
**Dependencia humana:** ninguna.  
**Estado inicial:** parte del inventario hecha; falta checklist repetible y control de regresiones.

### PASO 1 — Contrato comercial, operación y cumplimiento
**Objetivo:** definir qué podemos ofrecer sin promesas dudosas.  
**Hacer:** confirmar que el objeto inicial es **saldo principal transferible Cubacel**, no combos/datos/bonos; reglas de publicación y caducidad; qué se considera vendedor verificado; condiciones de contenido, privacidad, incidencias, consentimiento de contacto; corroborar reglas vigentes de ETECSA (transferencias, límites, tasas y condiciones comerciales) con fuente oficial; validar si la intermediación comercial y publicidad de la actividad son autorizables en jurisdicciones de operación. Definir si el proveedor vende por su cuenta (sí en el MVP).  
**Terminado cuando:** condiciones de uso + privacidad mínima + política para vendedores y matriz de riesgos están escritas/revisadas; decisión **GO / NO GO** para dinero real, no solo para software.  
**Dependencia humana:** identidad jurídica, asesoría legal/local y permiso de proveedores.  
**Regla:** podemos avanzar en software sin validación legal; **no hacer lanzamiento transaccional**.

### PASO 2 — Diseño app-first, marca y navegación
**Objetivo:** que alguien que usa Revolico entienda Saldo 360 sin tutorial.  
**Hacer:** navegación `Explorar | Tiendas | Mis operaciones | Mi cuenta` (en móvil, 3–4 accesos); convertir `/saldo360` a inicio real; demo en `/saldo360/demo`; SVG real, favicon, PWA; portada sin texto ornamental; botón útil por tarjeta; estados de carga, vacío, vencido y error; accesibilidad.  
**Terminado cuando:** se navega en Android de pantalla chica, se vuelve atrás sin perder filtros, ningún botón inerte, ninguna oferta ficticia en el marketplace y un usuario entiende «buscar → comparar → contactar» sin explicación.  
**Dependencia humana:** aprobación visual del diseño.  
**Copy:** ver §6.

### PASO 3 — Base de datos y permisos
**Objetivo:** pasar de JSON local a datos fiables.  
**Hacer:** utilizar proyecto Supabase **aislado**; modelo SQL versionado; migraciones; índices; RLS para lectura pública solo de ofertas aprobadas y actuales; edición solo del dueño, fotos en Storage con límites, logs de cambio y borrado lógico. Evitar poner llaves privadas en navegador o GitHub. Separar entornos de desarrollo y producción.  
**Terminado cuando:** se prueban permisos positivos/negativos: vendedor A no puede editar ofertas de B, visitante no ve datos privados, anuncios vencidos desaparecen, migración se reproduce en BD vacía, y backups probados.  
**Dependencia humana:** autorizar/seleccionar proyecto, almacenamiento y eventual coste.  
**Importante:** no crear tablas en `nexo-production` por comodidad.

### PASO 4 — Cuentas: comprador y proveedor
**Objetivo:** registro real.  
**Hacer:** registro/login/recuperación de cuenta con Supabase Auth (email primero, teléfono OTP solo si disponibilidad y costes lo permiten); perfiles separados del rol de permisos; «convertirme en proveedor» con revisión; confirmación de contacto y consentimiento; reglas antiabuso. El visitante no está obligado a crear cuenta para contactar.  
**Terminado cuando:** dos usuarios reales de prueba pueden registrarse, recuperar acceso, cerrar sesión y solo modificar su perfil; cuenta suspendida no publica.  
**Dependencia humana:** configurar proveedor de emails/OTP y mensajes legales.

### PASO 5 — Mi tienda para proveedores
**Objetivo:** que un proveedor construya su presencia sin ayuda.  
**Hacer:** tienda con URL legible, avatar/foto, nombre, localidad, WhatsApp autorizado, descripción corta, horario, estado disponible/no disponible; subir y cambiar foto; vista previa pública; despublicar tienda. Protección de datos y moderación.  
**Terminado cuando:** vendedor A crea tienda y sube foto; B no puede modificarla; visitante abre perfil en móvil; enlace de WhatsApp es válido y consentido.  
**Dependencia humana:** 1–3 vendedores reales dispuestos a probarlo.

### PASO 6 — Publicar ofertas (anuncios)
**Objetivo:** anuncios con datos claros y caducidad.  
**Hacer:** formulario `cantidad mínima/máxima, precio total o tasa por CUP, método de pago, saldo disponible declarado, fecha/hora de actualización, vigencia`; validaciones; crear/editar/pausar/eliminar con soft delete; contador de anuncios activos; estado pendiente de revisión si hay riesgo.  
**Terminado cuando:** un vendedor publica oferta en menos de 2 minutos, edita, pausa y expira automáticamente sin mostrar como disponible una oferta caducada. Pruebas de importes y tasas (sin duplicaciones, decimales definidos).  
**Dependencia humana:** reglas comerciales y oferentes reales.

### PASO 7 — Marketplace público y contacto WhatsApp
**Objetivo:** captar al comprador.  
**Hacer:** búsqueda por cantidad, método, localidad y precio; tarjetas con `recibes, pagas, proveedor, oferta actualizada`; orden por precio/recencia/reputación solo verificable; ficha de tienda; enlace wa.me con mensaje que incluye monto, oferta e ID; seguimiento anónimo de clic sin datos sensibles; prevención de spam.  
**Terminado cuando:** un comprador desde Android económico encuentra una oferta, ve precio **total**, confirma que sigue disponible y abre chat correcto en pocos toques; no hay precios de demo en páginas reales.  
**Dependencia humana:** anuncios vigentes y consentidos.

### PASO 8 — Solicitudes, historial e incidencias
**Objetivo:** transparencia sin confundir «clic» con «venta».  
**Hacer:** crear solicitud solo si usuario autenticado desea seguimiento; al abrir WhatsApp, estado **Contacto iniciado** (no operación confirmada); estados `contactado → acordado → declarado entregado → confirmado por ambas partes / disputado / cancelado`; comprobantes opcionales con privacidad, moderación y auditoría. Nadie modifica precio histórico aceptado.  
**Terminado cuando:** un comprador consulta historial; proveedor ve solo solicitudes suyas; disputa bloquea puntuación hasta resolver; reintentos no duplican operaciones.  
**Dependencia humana:** establecer evidencia admisible y proceso de reclamaciones.

### PASO 9 — Reputación y administración
**Objetivo:** generar confianza sin manipulación.  
**Hacer:** mostrar número de operaciones **confirmadas por ambas partes y sujetos a controles**, valoraciones 1–5 solo ligadas a solicitudes elegibles, denuncias, revisión de cuentas duplicadas, suspensión y apelación; panel moderador; métricas de contactos y conversiones **separadas** de ventas. Mostrar «Aún sin operaciones verificadas» cuando corresponda.  
**Terminado cuando:** no se puede valorar sin operación elegible, crear dos reseñas para la misma operación, manipular cuentas ajenas ni contarse clics como ventas; moderador puede resolver abuso de forma trazable.  
**Dependencia humana:** una persona responsable de moderación y un protocolo.

### PASO 10 — Automatización de proveedores por WhatsApp
**Objetivo:** mantener ofertas frescas sin escribir a cada proveedor manualmente.  
**Hacer:** primero actualización voluntaria desde Mi tienda; después API oficial de WhatsApp Business con **opt-in** específico y plantillas aprobadas, horarios propuestos 7:00/12:00/17:00/21:00 (Cuba), respuestas estructuradas, confirmación humana o del proveedor antes de actualizar, caducidad automática y opción «DETENER». Importar datos de un Excel proporcionado solo con consentimiento y revisión; no acceder a chats privados de terceros. Ofrecer salida a operador humano.  
**Terminado cuando:** un proveedor aceptó mensajes, recibe consulta autorizada, confirma su oferta, la BD registra origen/fecha y la oferta vence automáticamente; quien se da de baja deja de recibir mensajes.  
**Dependencia humana:** cuenta/permiso de WhatsApp Business Platform, plantilla aprobada, costes y proveedores opt-in.  
**Plan B:** actualización manual desde la tienda sin bloquear el MVP.

### PASO 11 — Calidad, piloto cerrado y lanzamiento
**Objetivo:** tener un marketplace usable y seguro.  
**Hacer:** pruebas unitarias, tipos, build Next.js, flujo end-to-end móvil, sesiones, fotos, RLS, spam, accesibilidad, rendimiento Cuba, recuperación tras caída, backups, analítica mínima, textos y privacidad. Probar con 3 proveedores y 10 compradores consentidos de la comunidad Casa Viva. Revisar legalidad, hosting comercial y aprobaciones. Activar dominio cuando corresponda.  
**Terminado cuando:** sin fallas críticas en cuentas/datos, ofertas reales confirmadas, flujo comprador/proveedor funcionando, soporte y quejas atendibles, alojamiento comercial compatible, aprobación GO y checklist firmada.  
**Dependencia humana:** vendedores, revisiones jurídicas, hosting pagado si hace falta, observación real de transacciones.  
**Resultado:** MVP comercial listo **solo cuando se superan todas estas puertas**.

### Después del MVP
Planes premium para vendedores (perfil destacado etiquetado como publicidad, estadísticas, catálogo avanzado), mejores buscadores y alertas. Blockchain **únicamente** si aparece un problema concreto de integridad/auditoría que no resuelvan logs firmados y controles de acceso; nunca subir datos personales a una cadena pública. No prometer transacciones garantizadas.

## 4. Modelo de datos v1 (contrato, no SQL aplicado)
| Tabla | Campos / reglas clave |
|---|---|
| `profiles` | id = auth.uid, display_name, avatar, role_server_side, created_at |
| `seller_profiles` | owner_id, slug único, shop_name, bio, localidad, whatsapp_e164 consentido, verified_state, horario |
| `offers` | id, seller_id, min/max CUP, rate, payment_methods, availability, expires_at, confirmed_at, status |
| `contact_events` | id, offer_id, buyer_id opcional, timestamp, source; **no significa venta** |
| `requests` | id, buyer_id, offer_id, seller_id, monto, precio_snapshot, estado, timestamps |
| `confirmations` | request_id, actor_id, confirmation, evidence_ref, reviewed_at |
| `reviews` | id, request_id único por comprador, buyer_id, seller_id, rating, text, moderation |
| `reports` | motivo, objetivo, estado, resolved_by, timestamps |
| `audit_events` | actor, acción, recurso, antes/después seguro y timestamp |
| `message_opt_ins` | seller_id, categoría, consentimiento, fecha, revocación, canal |

**Reglas de base de datos:** referencias y únicos correctos, restricciones para precios positivos, timestamps UTC guardados (mostrar hora Cuba), RLS en todas las tablas expuestas, control por propiedad, roles administrativos solo backend seguro, mecanismos antifraude, no guardar documentos en almacenamiento público, política de retención/borrado y respaldo.

## 5. Flujos que deben funcionar sin explicación
### Comprador anónimo
Entra → introduce monto → filtra → compara **precio total** → abre tienda → WhatsApp del proveedor. **No pide cuenta para esto**.

### Comprador registrado
Entra → historial/favoritos → solicita seguimiento → acuerda por WhatsApp → confirma o reporta incidencia → valora solo si operación elegible.

### Proveedor
Se registra → solicita verificación → crea tienda/foto → publica oferta → actualiza disponibilidad → recibe contacto → confirma operación / responde incidencia → construye reputación.

### Administrador
Ve pendientes → verifica proveedor y consentimiento → aprueba/oculta anuncios → revisa disputas → consulta métricas reales sin confundir leads con ventas.

## 6. Copy definitivo por pantalla (texto de producción)
**Explorar:** `Encuentra saldo. Sin vueltas.` / `Compara precios. Elige proveedor.` / `¿Cuánto necesitas?` / `¿Cómo pagarás?` / `Ofertas vigentes` / `Recibes` / `Pagas` / `Hablar por WhatsApp`.  
**Sin resultados:** `No hay ofertas vigentes para tu búsqueda.` / `Prueba otro monto o vuelve más tarde.`.  
**Tiendas:** `Tiendas de saldo` / `Conoce a quién le compras.` / `Ver tienda`.  
**Perfil:** `Ofertas` / `Operaciones confirmadas` / `Opiniones verificadas` / `Consultar por WhatsApp`; sin historial: `Sin operaciones verificadas todavía.`.  
**Registro:** `Crea tu cuenta` / `Continuar` / `¿Ya tienes cuenta? Entrar`; aviso solo si aplica: `Confirma tu correo para continuar.`.  
**Mi cuenta:** `Mi cuenta` / `Mis solicitudes` / `Mis favoritos` / `Mis datos` / `Cerrar sesión`.  
**Mi tienda:** `Mi tienda` / `Subir foto` / `Editar perfil` / `Mis ofertas` / `Publicar oferta` / `Pausar` / `Actualizar disponibilidad`.  
**Publicar:** `¿Cuánto saldo ofreces?` / `¿Cuánto pagará el cliente?` / `¿Cómo aceptas pagos?` / `¿Hasta cuándo está disponible?` / `Publicar`; error: `Revisa el importe y el precio.`.  
**Solicitud:** `Contactar proveedor` / `Consulta enviada por WhatsApp` (solo cuando de verdad ocurrió) / `Confirmar operación` / `Reportar problema`.  
**Reputación:** `Operaciones confirmadas` / `Reseñas verificadas` / `Aún no hay valoraciones verificadas.`.  
**Moderación:** `Por revisar` / `Aprobar` / `Ocultar` / `Solicitar información` / `Resolver incidencia`.  
**Nota persistente y corta:** `Confirma precio y disponibilidad antes de pagar. Saldo 360 no procesa pagos.`  
**Demo:** aviso inequívoco: `Demostración con datos ficticios. No realiza recargas.`

**Regla de copy:** mostrar información de seguridad esencial cerca del punto de decisión, pero nunca 3 párrafos de presentación comercial. Evitar pruebas sociales falsas, plazos inventados y promesas garantizadas.

## 7. Pruebas obligatorias por bloque
- Unitarias: precios y redondeo, límites, expiración, tasas y estados.
- Backend: reglas SQL/RLS con usuario anónimo/comprador/vendedor A/vendedor B/moderador, incluyendo pruebas negativas.
- Integración: auth, avatar, oferta, búsqueda, WhatsApp, solicitud, confirmación, disputas.
- UX: Android pequeño y Chrome de escritorio, red lenta, teclado, foco accesible, scroll, navegación atrás.
- Seguridad: protección contra enlaces maliciosos, XSS, subida de archivos, spam, rate limiting, filtración de datos y suplantación.
- Release: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`; registrar cuáles pasan. No confundir «build READY» con «MVP validado».
- Monitorización: errores de login, anuncios falsos, contactos rotos, tasa de ofertas vencidas y reclamaciones.

## 8. Lanzamiento y monetización
**Canal 1:** gestoras y comunidad Casa Viva **como fuente de usuarios voluntarios**, sin compartir automáticamente sus datos.  
**Piloto cerrado:** 3 proveedores interesados, 10 compradores, ofertas reales con autorización y contactos voluntarios.  
**Medir:** vendedores activos, ofertas vigentes, compradores que contactan, contactos por oferta, porcentaje de contactos que terminan confirmados (solo si se verifican), reclamos, tiempo de respuesta, recurrencia a 7 días.  
**Modelo inicial:** publicaciones básicas gratuitas. Monetización posterior por servicios **claramente diferenciados** (herramientas del proveedor, analítica, visibilidad publicitaria etiquetada). Precio = **sin aprobar**; definir tras evidencia y costes.  
**Infraestructura comercial:** la cuenta Vercel Hobby existente es no comercial; antes de uso con fin de lucro, usar plan comercial compatible o hosting apto. No comprar nada ni modificar DNS sin aprobación.

## 9. Puntos de control de seguridad y legal
1. Confirmar con fuentes oficiales ETECSA reglas vigentes del servicio, costos y límites de transferencias. Esto no equivale a permiso de reventa/intermediación.
2. Revisar regulación cubana del negocio, tributos, publicidad y protección del consumidor; operar solo tras validación apropiada.
3. WhatsApp Business: opt-in claro por categorías, plantillas aprobadas para mensajes iniciados, ventana de 24 h para respuestas libres, baja inmediata y opción de humano.
4. Protección de cuentas y datos: RLS, retención, privacidad, eliminación, backups, HTTPS; no capturar PIN ni credenciales.
5. Condiciones para mostrar reputación: operación comprobada, prevención de autocalificación y de duplicados; gestionar disputas.

**Fuentes de implementación y actualización (consultar antes de ejecutar):**
- Supabase Auth Next.js: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Seguridad por fila: https://supabase.com/docs/guides/database/postgres/row-level-security
- Políticas WhatsApp Business (revisión sep-2026): https://whatsappbusiness.com/es-la/policy/
- Términos Vercel Hobby: https://vercel.com/docs/plans/hobby
- Verificación operativa ETECSA: https://www.etecsa.cu/ (confirmar condiciones de transferencia y actividad comercial).

## 10. Normas para cualquier agente de código
1. Leer primero fuente de verdad de NEXO; después este Blueprint y CONTROL; luego el código. No inventar funcionalidades ni afirmar que funcionan si no hay prueba.
2. Mostrar avance concreto: archivo cambiado, commit, pruebas, despliegue exacto, bloqueo y próximo paso.
3. Trabajar únicamente en `casa-viva/saldo360-piloto-20261026` o subrama desde ella; nunca alterar Casa Viva en producción, ni mezclar datos de `nexo-production`.
4. Una función por bloque pequeño, sin refactorizar sistemas ajenos. Antes de modificar: leer código, git/PR, ruta actual y CI.
5. Preferir acciones reversibles; pedir aprobación para costos, bases de producción, cambios irreversibles y promesas comerciales.
6. No subir secretos, tokens, PIN ni datos personales a GitHub o logs; verificar permisos.
7. Ejecutar pruebas adecuadas, anotar resultados y actualizar `SALDO360_CONTROL.md`, ESTADO de NEXO y decisiones si se hacen cambios importantes.
8. No usar IA como sustituto de verificación humana, de la disponibilidad real ni de permisos de terceros.
9. Ante tareas que dependen de insumos humanos (Excel, autorización, hosting) avanzar en mocks aislados sin dar por operativos servicios reales.
10. Evitar simultáneamente editar archivos en la misma rama desde dos agentes sin sincronizar.

## 11. Plantilla de continuidad para ChatGPT, Codex o Claude Code
> Estamos desarrollando **Saldo 360**, un marketplace de ofertas de saldo Cubacel tipo clasificados. Repo: `ernest196391/ernesto-rondon-nexo`, rama `casa-viva/saldo360-piloto-20261026`, PR #134. Lee `docs/00-FUENTE-DE-VERDAD/LEEME.md` y su orden de lectura; luego `docs/nexo-business/SALDO360_MASTER_BLUEPRINT.md` y `docs/nexo-business/SALDO360_CONTROL.md`. Confirma código, git, CI y despliegue. Ejecuta el **primer PASO no aprobado** del CONTROL; no saltes pasos. Haz implementación concreta, pruebas y commit. Actualiza CONTROL con evidencia y siguiente acción. Nunca toques producción de Casa Viva ni bases reales sin aprobación. Explica al dueño en español simple qué hiciste y cómo verificarlo.

## 12. Definición de «MVP COMPLETO»
Solo se marcará **MVP COMPLETO** cuando todo lo siguiente sea verdadero:
- Marketplace público real, sin ofertas ficticias mezcladas.
- Registro seguro de compradores y proveedores, recuperación de acceso y control de roles.
- Vendedor publica foto, crea tienda, oferta, pausa y edita sin intervención manual.
- Visitante encuentra oferta, compara precio total y contacta correctamente.
- Solicitudes e historial no muestran clics como ventas; comprobación de operaciones y disputas.
- Reputación solo de operaciones elegibles.
- Moderación con suspensión/reporte y auditoría.
- Políticas de seguridad, privacidad, retención y backups probadas.
- Pruebas técnicas y flujo móvil satisfactorios.
- Normas de ETECSA y actividad comercial revisadas; hosting permitido; primeros proveedores consentidos.
- WhatsApp automático **puede seguir siendo fase opcional**, siempre que publicación/actualización manual funcione y se avise claramente al usuario; no fingir automatización.
- Existe aprobación explícita del propietario para apertura al público.

**El software puede avanzar rápidamente en sesiones consecutivas, pero una apertura comercial responsable depende de pruebas, consentimiento, infraestructura y legalidad.** No prometer un lanzamiento transaccional en un día si esas puertas siguen cerradas.
