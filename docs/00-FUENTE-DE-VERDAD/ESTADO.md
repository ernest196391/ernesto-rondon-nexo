# ESTADO — dónde va cada proyecto

**Última actualización:** 2026-10-13 17:10 (fotos de BizneCubano: 57 fotos más en 33 galerías y 4 colores con foto propia; ver sección L5). Antes: 2026-10-13 15:10 (Core 3.13.81: el pedido se guarda al precio de la gestora al finalizar; #3598 de Thaly corregido a 140; ver sección L5). Antes: 2026-10-13 14:35 (Core 3.13.80: el último enlace de gestora manda y no se pierde al buscar; fotos por color con Gemini; bienvenida corregida y apagada; ver sección L5). Antes: 2026-10-13 14:30 (Bajo pedido en 24 horas EN VIVO en VivaBot: proveedor, reloj, gestora, entrega y cuentas; ver sección L4). Antes: 2026-10-13 (Core 3.13.78: en Pedidos la tienda ve la gestora y el mensajero de cada pedido, con su WhatsApp; antes 3.13.77, pestaña «Aprende»; ver sección L3). Antes: 2026-10-11 (fin de BizneCubano, panel único; ver sección I al final).
Regla: el agente que termine un bloque de trabajo actualiza **su fila** y la fecha de arriba.

Estados: **FOCO** (se trabaja ahora) · **ACTIVO** (funciona, solo mantenimiento) · **ESPERA** (bloqueado por algo externo) · **PAUSADO** (no se toca hasta que se cumpla su condición) · **POR CLASIFICAR** (Ernesto debe decir qué es).

---

## Casa Viva — comprobación urgente del 10-oct-2026 (fase 1)
- **Evidencia real:** Lennys instaló la caja Windows 1.0.3 y pudo añadir 14 "Toallas pequeña" aunque nube y conteo físico son 3. El producto no tenía stock verificado en la pantalla; el código permitía añadir unidades sin límite si faltaba la fila en el mapa de existencias.
- **Solución propuesta, NO publicada:** PR #131 (`fix/casa-viva-stock-guard-20261010`); bloquea stock desconocido en tarjeta/lector/carrito y en transacción Rust (incluidos ventas offline y líneas repetidas), incorpora devoluciones offline en stock calculado, y hace visible si falla la descarga de catálogo/stock/tasas. CI Rust y TypeScript POS **aprobadas**; CI general **falló por vulnerabilidad crítica Next.js 16.3.4** (issue #132), no por POS.
- **Carrito:** ya tiene opción `Vaciar` en la hoja; Lennys confirmó su funcionamiento. Se aclaró el acceso como "Revisar · Cobrar"; no hay que vender para abrir el carrito.
- **Datos:** 3 ventas de prueba previas siguen sin devolver; la sincronización horaria posterior registró conteos que revirtieron movimientos, así que se prohíben devoluciones automáticas hasta conciliar el efecto. Lennys confirmó 3 toallas físicamente.
- **Instalador 1.0.4 GENERADO — entrega a Lennys pendiente:** PR #131 integrado en rama de desarrollo por autorización de Ernesto (merge `89785dd`), GitHub Actions Windows run `38085383914` éxito, release `caja-v1.0.4`, instalador `CasaVivaCore-Windows.exe` (4 212 569 bytes, SHA-256 `4d7cfddfc4cd1cba0fff846ab8abcff0f14dd76d3d5a312c90fc9bf02279e787`). Se intentó enviar a Lennys por outbox tras verificar, pero la herramienta rechazó la operación; **no consta mensaje enviado**. Descarga verificada: https://github.com/ernest196391/ernesto-rondon-nexo/releases/download/caja-v1.0.4/CasaVivaCore-Windows.exe
- **Siguiente paso exacto:** confirmar envío del instalador a Lennys por un canal autorizado, sin desinstalar la app actual, probar carrito y límite de existencias; probar en PC de Lennys tope de 3 y stock sin verificar, comprobar `Vaciar` y estado de sincronización. Antes de pasar a ventas reales, conciliar las 3 ventas de prueba con asientos reversibles y confirmar los cálculos de comisión. No modificar producción sin autorización.
- **Comisiones BLOQUEANTE:** `nexo_business.cost_settings` en `casa-viva` tiene `commission_mode='fixed'`, `commission_value=0`, diferente de la regla D36 (10 % general y excepciones por producto). Para la venta simulada de 8 toallas, `line_entries()` calcula **0 USD de gestora** (y 0,40 USD de dependienta); `commission_entries` está vacía pese a 26 ventas sincronizadas (1 gestora, 4 con dependienta). Issue #133; auditar trigger e integración; corregir regla solo tras aprobación explícita. Web WooCommerce calcula comisiones por su propio Core: no asumir que arregla la caja.
- **Separación de seguridad:** inspección de funciones `SECURITY DEFINER` en `nexo-production` sin cambios de permisos todavía; revisar autorización interna antes de modificar SQL.

---

## Dónde estás ahora (resumen de 30 segundos)

1. **Tu activo más avanzado es NEXO Business funcionando en Casa Viva** (caja sin internet en Windows y Android, panel para la dueña, gestoras, comisiones, socias, costos, puente con la web). Falta probarlo en la tienda y que Lennys lo use de verdad.
2. **Mudanza a `nexocuba.com` casi terminada** (ver sección G): panel, Cuyana y Cuadre ya funcionan en su dirección nueva. Faltan 2 pasos con tu login: la tienda en Render y el enlace de acceso del panel en Supabase.
3. **Todo lo demás queda en pausa** hasta que NEXO Business cobre a los dos pilotos (Casa Viva y Colo Shop), salvo terminar Curuguay y Zaldívar, que tienen clientes esperando.
4. **Mapa de todas las herramientas (2026-10-11 noche, Claude, solo lectura):** `docs/herramientas/MAPA.md` (cada herramienta con estado y "para quién": gestora / NEXO interno / Casa Viva / comercio NEXO) y plan de la herramienta de fichas `docs/herramientas/entrada-a-ficha.md`. Corrección: las migraciones de Digitaliza **sí están aplicadas** en `nexo-production` desde el 2026-10-07 (tablas vacías; página publicada sin enlace en el panel).

---

## A. Plataforma NEXO (lo que se vende)

| Pieza | Estado | Dónde vive | Qué hay hecho | Siguiente acción exacta |
|---|---|---|---|---|
| **NEXO Business** (caja, inventario, panel, equipo, sincronización) | **FOCO** | Repo `ernesto-rondon-nexo`: `apps/business-pos`, `apps/business-dashboard`, `packages/business-*`, `supabase/`. Nube: Supabase `nexo-production`. Panel: `nexo-negocio.vercel.app` | Caja offline Windows + Android probada; ventas, caja, fiado, devoluciones, consignación, mensajeros; panel de dueña con resumen, costos, gestoras, socias, compra de personal; importación del Excel de Casa Viva (43 filas listas, 135 por revisar); puente WooCommerce en modo seguro (no ha publicado nada aún) | Ir a la tienda: probar escáner real, lector USB y un turno de 8 h sin internet. Luego que Lennys revise las 135 filas en "Necesita tu atención". Detalle: `docs/nexo-business/HANDOFF_2026-10-04.md` §10 |
| **Tienda NEXO + oficina de gestoras web** | ACTIVO | Mismo repo: `app/`, `lib/`. Render, en `tienda.nexocuba.com` | Catálogo, carrito, checkout por WhatsApp, oficina de gestoras, asistente, admin | Ernesto: añadir `tienda.nexocuba.com` en Render y fijar `NEXO_PUBLIC_URL` (sección G). Build de `main` arreglado el 2026-10-05 (antes fallaba y Render no podía publicar) |
| **Digitaliza tus productos** (recepción → ficha → Core; ficha de conocimiento) | EN CURSO · bloques 1 y 1b hechos en local | `apps/business-dashboard/digitaliza*`, migraciones `20261005010000/020000` | Recepción con fotos, variantes, inventario sin duplicar; ficha con evidencia, experiencias y piezas a revisar. Piloto Olla Reina EON | Ernesto aprueba aplicar las 2 migraciones en `nexo-production`; luego bloque 2 (plantillas + Higgsfield). Ver `docs/nexo-business/DIGITALIZA.md` |
| **Asistente WhatsApp (VivaBot)** | ACTIVO (en construcción) | Repo `ernest196391/vivabot`, VPS Hostinger, número 5354056173 | Bot vinculado; responde y escala; resumen de dueña de solo lectura desde NEXO (`nexo_owner_summary`); conectado a Curru (`CURRU_KEY`, 2026-10-06); 34/34 preguntas frecuentes activas; al por mayor → WhatsApp de Lennys con resumen | Prueba real desde otro teléfono; `git pull` de `1571947` en el VPS; cambiar claves expuestas en capturas. Luego: catálogo y stock **solo** de NEXO Business. Número de negocio aparte del personal |
| **Kits de Implementación** (auditoría, contenido, web studio…) | PAUSADO | `kits/*/SPEC.md` | Especificaciones | Se usan como herramientas internas al implementar NEXO en cada comercio |

## B. Pilotos de NEXO Business (comercios)

| Comercio | Estado | Modo | Qué hay | Siguiente acción |
|---|---|---|---|---|
| **Casa Viva** | **FOCO** | NEXO nativo (caja + panel + web WooCommerce `casaviva.company`) | Todo lo de NEXO Business arriba | Pruebas en tienda + uso diario de Lennys. Web `casaviva.company` 3.13.9 (portada con ofertas, 44 fotos 2K); desplegar 3.13.10–3.13.11 y entregar con `Casa-Viva/docs/CASA_VIVA_ENTREGA_DUENA.md`. Decidir cuándo sustituye a BizneCubano |
| **Colo Shop** | ESPERA (pago) | Conector: siguen con AxisSoft, NEXO conecta la tienda online | Contrato del piloto escrito (`docs/nexo-business/COLO_SHOP_PILOT.md`). Su web está en Vercel `frutos-secos` | **No invertir más horas hasta que pague.** Cuando pague: comprar su dominio y hacer la importación asistida desde Axis |
| ~~Mercado 23 y 28~~ | FUERA | — | No aceptó ser piloto (2026-10-05). La demo `mercado23y28.vercel.app` queda como ejemplo | Nada |

## C. Negocios de servicios propios (usarán NEXO, con su propia marca)

| Negocio | Qué es | Estado | Dónde vive | Siguiente acción |
|---|---|---|---|---|
| **Cuyana** | Remesas Guyana → Cuba | ACTIVO | Repo `cuyana-app`, Vercel `cuyana-app`, Supabase `cuyana`, `cuyana.casavivadecuba.com` | Mudar dominio. Revisar el impacto de las nuevas reglas de EE. UU. (ver `PAGOS-Y-LEGAL.md`) |
| **Curuguay** | Remesas Uruguay → Cuba (cliente) | EN CONSTRUCCIÓN | Vercel `curuguay` | Terminar y entregar al cliente sobre NEXO Business |
| **Zaldívar** | Remesas (cliente) | EN CONSTRUCCIÓN | Vercel `zaldivar-web` | Terminar y entregar al cliente sobre NEXO Business |
| **Cuadre** | Contabilidad para operadores de remesas | PAUSADO | Repo `cuadre`, Vercel `cuadre`, Supabase `gestor-remesas` (**inactivo**) | Pausado hasta que haya un operador que pague. La lógica de caja y comisiones de NEXO Business puede servir de base |
| **Luz Propia** (antes "NEXO Energía") | Diagnóstico, venta e instalación solar | PAUSADO | Vercel `nexo-energia` (`nexo-energia-seven.vercel.app`) | Nombre aceptado 2026-10-05. Vive en `luzpropia.nexocuba.com` (sin comprar dominio) |
| **JRG Electronics** | Instalación solar y eléctrica (cliente; **negocio aparte de Luz Propia**) | ACTIVO | Vercel `jrg-electronics` | Mantener. Su catálogo de equipos y el de energía deben salir de un mismo catálogo |
| **Abuela Nena** (influencer IA de Ernesto Padre) | Redes de bienestar para el negocio de afiliado de Ernesto Padre (Vital Health Global). Cada día 1 video y 5 historias, que Ernesto aprueba antes de publicar | **EN PAUSA (2026-10-13, Ernesto: hasta que dé dinero o sea casi gratis)**. Tarea programada desactivada. Día 1 enviado a Ernesto Padre (#885–#891) + datos del casillero Panavana (#892) | `docs/clientes/abuela-nena/` (FICHA, banco-fotos, voz, videos, **fabrica/**). Skill `/nena-hoy`. Tarea programada "Abuela Nena · contenido del día" (todos los días 6:11, botón "Ejecutar ahora"). Higgsfield: hoja `6675bdc5…`, voz 1 `fad0032c…` | Hecho (12-oct): ficha, cara, voz, banco de 22 fotos, **día 1** (video + 5 historias) entregado; **fábrica** `fabrica.py N` (subtítulos palabra a palabra con Whisper local, una foto por frase, música y silbato, check de HyperFrames, MP4 ligeros) + `verificar_voz.py` + `calendario.json` días 2–8 (una costumbre por día) + `estado.json`. Coste por día ~4–5 créditos (foto 2 + voz 2,3). **Prueba de punta a punta OK con el día 2** (foto N18 + voz 98 % Whisper + fábrica + `enviar.py` → WhatsApp "Tú" #708–#714 aceptados; 4,2 créditos exactos; saldo 1.035,4). Falta que Ernesto confirme que le llegaron como video. Decisión de Ernesto: sin "personaje IA" ni "Escríbele a Ernesto" en pantalla (CTA en la descripción); aviso de IA en la bio + etiqueta de Meta. **Siguiente:** que Ernesto pulse "Ejecutar ahora" una vez para aprobar permisos; que Ernesto Padre cree sus cuentas IG/FB (no las crea Claude) → luego publicación automática con la app de Meta. Publicar al padre: `/nena-hoy publica N`. |

## D. Ideas en pausa

| Idea | Estado | Condición para reactivar |
|---|---|---|
| Triciclub (transporte y entregas) | PAUSADO | Cuando NEXO tenga la capacidad de entregas en uso con al menos un comercio |
| Plantilla de remesas clonable para otros corredores | PAUSADO | Cuando Cuyana sea rentable y estable |
| Studio One (crear marcas y tiendas en automático) | Fusionado | Es lo mismo que Implementación NEXO + kits. No se construye aparte |
| Agencia (Rocket Social Media, Brand Lovers) | Fusionado | Pasa a ser "Implementación NEXO" |
| Frigate (`blakeblackshear/frigate`, cámaras con IA) | PENDIENTE (2026-10-11) | Cuando un comercio cliente pida vigilancia con cámaras IP |
| Pipecat (`pipecat-ai/pipecat`, bots de voz) | PENDIENTE (2026-10-11) | Cuando haya un cliente que quiera VivaBot con voz/llamadas |
| TastyIgniter (`tastyigniter/TastyIgniter`, pedidos de restaurante) | PENDIENTE (2026-10-11) | Cuando un restaurante cliente lo necesite y BizneCubano/NEXO Business no lo cubra |
| Chatwoot (`chatwoot/chatwoot`, bandeja única de mensajes) | EN PRUEBA (2026-10-11) | **Instalado local** y funcionando en `http://localhost:3000` (Docker Desktop + WSL; archivos en `C:\Users\Ernesto\chatwoot`, contraseñas en su `.env`). Encender: `docker compose up -d` en esa carpeta. Cuenta "Casa Viva", bandeja "Web Casa Viva" (widget) probada de punta a punta en la página local `http://localhost:8090` (contenedor `casaviva-prueba`). **No está en `casaviva.company`**: requiere Chatwoot en la nube primero. En producción irá en servidor en la nube |
| Prospecto **Yonar "Rey de Alisados"** (IG 88 mil, FB 499 mil, salón Capadocia, Vedado) | PROPUESTA (2026-10-11) | Auditoría + propuesta en 4 fases (bandeja+bot, citas, web/tienda, automatización) en el doc "Auditoría y propuesta — Yonar Rey de Alisados" (claude.ai/artifact/4gk8mZtAtvnqm5hah5qEj2). Precios puestos en el doc (2026-10-11): Agenda Llena Rey 350 + 79/mes · Salón Rey Total 750 + 129/mes · Bandeja Rey 150 + 39/mes; bonos hasta 31-oct; garantía 20 citas. Análisis interno: `docs/ofertas/yonar-rey-de-alisados.md`. **DECISIÓN (Ernesto, 2026-10-11 tarde): se usa la MARCA ACTUAL de Yonar (letrero "REY DE ALISADOS en cuba": corona negra, serif con remates, script "en cuba", negro + luz dorada cálida) con todo su branding; el bono pasa a ser vectorizarla + manual. Los 3 logos "Hebra Recta" quedan archivados como alternativa.** Herramientas instaladas: Python 3.12 + yt-dlp (FFmpeg ya estaba). Edición de muestra ✅ `videos/mp4/edicion-muestra-whatsapp.mp4` (37,2 s, 9,5 MB; intro letrero + tarjetas sincronizadas con transcripción Whisper local + cierre con su marca; proyecto `videos/edicion-muestra`). Video de muestra descargado: `videos/original/fb-video.mp4` (30,7 s, vertical; habla de alisado oxiplastia y productos QBella, con teléfono +1 786 y "envíos en todo el país"). **Nueva oferta (Ernesto, 2026-10-11):** bonos gratis = logo + manual de identidad (marca Rey de Alisados), auditoría IG/FB, calendario y tienda online; 7 días de prueba sin pagar; "yo me encargo de todo"; luego 350 + 79/mes. Antes de que pague solo DEMOS. Bloques: 1 logo+manual ✅ rehecho con skill `/crear-marca` (filosofía "Hebra Recta", 3 logos SVG en `marca/logos/`, recomendado A "Corona de hebras"; skills nuevas instaladas: `canvas-design`, `frontend-design` de anthropics/skills) (`docs/clientes/yonar-rey-de-alisados/marca/`, local `http://localhost:8091/marca/`, contenedor `yonar-demos`) · 2 calendario demo ✅ (`calendario/`, probado: reserva → turno bloqueado → aparece en agenda de Yonar; precios/horarios de ejemplo) · 3 tienda demo ✅ (`tienda/`, probado: carrito, total, pedido simulado por WhatsApp; no envía nada) · 4 videos motion ✅ MP4 listos en `videos/mp4/` con la voz clonada de Ernesto (generada y auditada con Whisper por la sesión de VivaBot), sin música todavía (`videos/intro-marca` 8 s, `videos/asi-llega-clienta` 20 s, `videos/perfil-antes-despues` 10 s; 1080×1920; `hyperframes check` pasa) · **5 presentación MÓVIL ✅ (la buena): claude.ai/artifact/M1NbStqpHVhZ6G3mjMUqxd** — 10 pantallas verticales con su marca real, sus capturas, los 4 videos (con música original + voz de Ernesto) y la edición de su video de oxiplastia; privada hasta compartir. Calendario, tienda (productos QBella reales) y videos ya pasados a su marca; respaldo en `_respaldo-hebra-recta/`. Presentación 16:9 vieja BORRADA (Ernesto, 2026-10-11). **Nuevo orden y precio (Ernesto):** así quedaría (video oxiplastia) → problema 1/solución (video clienta) → problema 2/solución (perfil) → problema 3/solución (tienda) → pila de valor tachada (3 400 USD + 1 050 USD/mes) → **precio único 1 600 USD de instalación + 550 USD/mes** (tienda, calendario, bot, redes, videos, mantenimiento) → garantía: 7 días, si no funciona no paga y se queda con todo. Falta definir qué incluye exactamente "gestión de redes" cada mes. Prueba con Chatwoot Cloud 14 días gratis; no gastar hasta que confirme |

## E. Proyectos en Vercel por clasificar

| Proyecto | Qué es |
|---|---|
| `frutos-secos` | Web de **Colo Shop** |
| `los-guajiros` | Web construida por Ernesto (cliente) |
| `todo-hogar` | **Todo Hogar**: tienda tipo Casa Viva. PAUSADO, se construye después |
| `larampa` | **La Rampa**: menú (relacionado con el Hotel Habana Libre). PAUSADO, se le da forma después |
| `vitayaq` | **Demo/plantilla** de tienda de suplementos "VitayaQ" (27 productos, precios provisionales). Ernesto no la reconoce: queda como demo de la plantilla de tiendas |
| `nexo-plan-veci` | **Web de Implementación NEXO (negocio de automatización)** en **`automatizacion.nexocuba.com`** (repo `Nexo-web-`). FUNCIONA. Siguiente: recrearla con Higgsfield. Ya corregido: direcciones y plan Growth sin "cobro desde el exterior" |
| `tienda-barrio` | **Demo/plantilla** "Bodega La Esquina" (9 productos de ejemplo, WhatsApp falso, `noindex`). Plantilla de tienda de barrio para enseñar a clientes |

## F. Infraestructura (inventario verificado 2026-10-05)

| Recurso | Cantidad | Detalle |
|---|---|---|
| Repos en GitHub | 20 | Principal `ernesto-rondon-nexo`. Otros: `vivabot`, `cuyana-app`, `cuadre`, `Casa-Viva`, `Nexo-web-` (web de automatización), `frutos-secos`/`Frutos-secos-` (Colo Shop, hay dos), `Curuguay`, `zaldivar-web`, `Larampa`, `Los-Guajiros`, `jrg-electronics`/`Jrg-el-ctronics-` (hay dos), `23-y-28-`, `Triciclub`, `Papo-`, `pictures-`, `gestor-plantillas-`, `gestor-brand-system` |
| Proyectos Supabase | 4 | `nexo-production` (activo, **el central**), `cuyana` (activo), `gestor-remesas` (inactivo), `ernest196391's Project` (inactivo, sin uso conocido) |
| Proyectos Vercel | 15 | Ver secciones C y E |
| Render | 2 servicios | Tienda NEXO web + worker de contenido |
| Hostinger | Hosting compartido + VPS | WordPress de Casa Viva; VPS del bot |
| Dominios | `nexocuba.com` (**comprado**, DNS en Hostinger), `casaviva.company` (Casa Viva), `casavivadecuba.com` (**se va**, no soltar hasta terminar sección G) |

## G. Mudanza a nexocuba.com (2026-10-05)

| Servicio | Dirección nueva | Estado | Falta |
|---|---|---|---|
| Panel NEXO Business | `negocio.nexocuba.com` | **FUNCIONA** (Vercel `nexo-negocio`, DNS CNAME) | Supabase → Authentication → URL Configuration: añadir `https://negocio.nexocuba.com` a "Redirect URLs" (si no, el enlace de acceso por correo vuelve a la dirección vieja). Necesita el login de Ernesto |
| Cuyana | `cuyana.nexocuba.com` | **FUNCIONA** | Avisar a Adonys y cambiar el enlace en redes y WhatsApp |
| Cuadre | `cuadre.nexocuba.com` | **FUNCIONA** | Nada |
| Tienda NEXO + gestoras | `tienda.nexocuba.com` | **FUNCIONA**, conectada a `casaviva.company`; muestra el catálogo publicado de Casa Viva (D24) | Nada. Si un día hay que volver a solo productos NEXO: variable `NEXO_CATALOG_SCOPE=nexo` en Render |
| Correo de la tienda (Resend) | — | Hoy usa `correo.nexotienda.casavivadecuba.com` | Crear dominio de envío `correo.nexocuba.com` en Resend y copiar sus registros a Hostinger |
| Fotos del catálogo | `casaviva.company/wp-content/...` | **HECHO** en código | Nada |

### Subdominios de emprendimientos y clientes (D23)

| Subdominio | Proyecto Vercel | Vercel | DNS en Hostinger |
|---|---|---|---|
| `luzpropia.nexocuba.com` | `nexo-energia` | Añadido | Hecho (comodín `*`) |
| `curuguay.nexocuba.com` | `curuguay` | Añadido | Hecho (comodín `*`) |
| `zaldivar.nexocuba.com` | `zaldivar-web` | Añadido | Hecho (comodín `*`) |
| `coloshop.nexocuba.com` | `frutos-secos` | Añadido | Hecho (comodín `*`) |
| `losguajiros.nexocuba.com` | `los-guajiros` | Añadido | Hecho (comodín `*`) |
| `jrg.nexocuba.com` | `jrg-electronics` | Añadido | Hecho (comodín `*`) |
| `automatizacion.nexocuba.com` | `nexo-plan-veci` | Añadido | Hecho — **verificado funcionando** |

Hecho 2026-10-05: registro **CNAME `*` → `cname.vercel-dns.com`** en Hostinger. Cualquier subdominio nuevo solo necesita darse de alta en el proyecto de Vercel; los que tienen registro propio (tienda, negocio, cuyana, cuadre) no cambian.

Regla: **no soltar `casavivadecuba.com`** hasta que esta tabla esté toda en verde. Las direcciones viejas siguen funcionando mientras tanto.

## H. Prueba controlada de punta a punta en Casa Viva (empezada 2026-10-07)

**2026-10-08:** Lennys propuso (audios, sugerencia n.º 15) que lo extra que compra en tienda el cliente de una gestora sea de la gestora → aprobado por Ernesto (D33). Enviados a Lennys audio con voz de Ernesto + mensaje listo para gestoras. Puente para hoy (BizneCubano), pedido por Lennys: **en producción** VivaBot `7e47a77` + tabla `crm_extras`: `EXTRA gestora: producto precio` (Ernesto y números con permiso; por defecto Lennys) → 10 % a la gestora + aviso; `COMISIONES EXTRA`, `PAGADO EXTRA nombre`, `ANULA EXTRA n`, `PERMISO EXTRA 53…`. Falta: prueba de Ernesto y dar permiso a las dependientas. **Después:** programar botón "Añadir al pedido de la gestora" en `/ventas/` + aviso del bot. #2678 cerrado por Ernesto (completado, dinero verificado, comisión aprobada); falta probar la devolución. D34: gestoras pasan ya al sistema nuevo. Core **3.13.23** (Casa-Viva `f22d7af`, `932dea8`): registro sin correo ni contraseña obligatorios (correo interno `g53…@gestoras.casaviva.company`, se entra por enlace de WhatsApp), un WhatsApp = una cuenta, panel de gestora simplificado. Probado el enlace de acceso: funciona. Devolución probada en #2678; arreglado que no anulaba la comisión (Casa-Viva `c63c226`). Bot `cd9f185`: orden "mi acceso". Respuestas FAQ de gestoras 20,24,25,27,28,29,31 apuntaban a nexo-negocio.vercel.app (viejo): nuevas en `crm_knowledge.draft_answer`, **esperan aprobación de Ernesto**; la 26 (cómo se paga la comisión) necesita su respuesta. FAQ 20,24,25,27,28,29,31 **activadas** (aprobó Ernesto). **2026-10-08 12:33 Cuba: convocatoria de migración enviada al grupo "General"**; `ALTAS CONOCIDAS` activado. Preguntado a Lennys cómo se paga la comisión (FAQ 26 pendiente). **Catálogo (2026-10-08 13:10):** la copia BizneCubano → web estaba rota (dominio viejo, sin colores, sin "N disponibles"); arreglada (Casa-Viva `scripts/catalog`, commits hasta `5c3c91e`) y aplicada: 15 creados, 53 cantidades, 44 con colores, 16 ocultados (reversible con modo `restore`). Ahora se aplica **sola cada hora** (:25) con seguro si la lectura sale incompleta. **Caja Casa Viva Core v1.0.0 (lanzamiento):** APK firmado (clave del 4-oct en `%APPDATA%\com.nexo.business\signing`) + instalador Windows; alta de equipos con **código de 6 letras** (orden `ALTA CAJA Nombre` en el chat "Tú"; tabla `nexo_business.device_enrollments`, función `nexo-device-enroll`, rama `claude/pos-lanzamiento`). Probado en el Redmi: alta OK, 200 productos reales con fotos y cantidades. **Tarde 2026-10-08:** 13 gestoras registradas tras la convocatoria (10 aprobadas, 3 pendientes de `APRUEBA n`). Incidencias corregidas: gestora sin contraseña no podía volver a entrar → "Entrar con WhatsApp" + *mi acceso* (Core `13963b0`); bot trataba a gestoras nuevas como amigos → rol gestora automático (VivaBot `763057d`); el bot ya envía archivos. Caja 1.0 enviada a Zaymi, Lennys (+PC) y Nana con su código. Aviso + guía rápida enviados a las 10 gestoras aprobadas. **Guías paso a paso** publicadas en casaviva.company/ayuda (página 2815) + 11 imágenes (`Claude Code/tutoriales`, VPS `/root/archivos/guias`); enviadas a General, Zaymi, Nana y Lennys (mensajeros en espera). Altas de gestoras en modo TODAS. Zaymi y Nana (Daniela, jid 52368704020652@lid) son las dependientas. D36 comisiones por producto cargadas (209). App: gestoras y equipo cargados en `nexo_business.people`; descargas directas en casaviva.company/descargas/. Zaymi conectada a la caja; Lennys y Nana pendientes de instalar. **Simulación de caja: 2026-10-09.** Preguntas de administración enviadas a Lennys (transferencia sillas, fecha para dejar BizneCubano, reparto). Voz clonada de Ernesto grabada en silencio: VOZ 1 por defecto hasta rehacerla. **Supervisor 24/7 encendido (D35)** en el VPS; primera vuelta OK 12:26 Cuba. Al empezar una sesión local: leer `crm_supervisor` (kind `hecho`) y pasar al repo Casa-Viva los cambios que haya hecho en la web.

Recorrido que se quiere probar: gestora escribe → pedido → grupo de mensajeros → mensajero responde → bot manda el vale → todo guardado → Curru responde → panel de la dueña se actualiza.

**Fase 1 (revisión, 2026-10-07), resultado:**

| Paso | Estado |
|---|---|
| Bot reconoce a la gestora y conversa (con Curru) | Hecho en código |
| Pedido guardado en NEXO (`nexo_business.orders`) | Existe la tabla; **0 pedidos** en producción. El bot **no** crea pedidos (pendiente en `vivabot/docs/PENDIENTES.md`) |
| Gestoras y mensajeros dados de alta | **0** en producción (solo 6 socias) |
| Publicar en grupo de mensajeros + respuesta del mensajero | **No existe** |
| Vale de mensajería | **No existe** (solo planeado: nuevo → asignado → entregado) |
| Panel de la dueña ve pedidos | Sí, por la oficina de gestoras / panel |

**Corrección (2026-10-07, misma tarde):** el flujo real de Casa Viva **no** pasa por `nexo_business.orders` sino por **Casa Viva Core** (plugin WordPress `casa-viva-dropship-core` en `casaviva.company`, repo `ernest196391/Casa-Viva`). Core ya tiene: pedido WooCommerce, vale/seguimiento (`/seguimiento/`), bolsa de ofertas a mensajeros (el primero que acepta gana, atómico), `/area-mensajeros/`, entrega con cobro USD/CUP, retorno de caja y cierre, e incidencias. El bot ya recibe el mensaje "PEDIDO CASA VIVA #…" (prueba de ayer: pedido #2672, Aaron). Las tablas `crm_*` del bot **sí** tienen datos (el 0 anterior fue un error de consulta).

Hueco real: **puente bot ↔ Core** (el bot no publica en el grupo de mensajeros, no asigna en Core al primero que responde, no manda el vale, no pregunta hora ni marca "entregado"). Core ya tiene la clave `X-Vivabot-Key` para el asistente; se reutiliza.

Plan: (1) Core: endpoint del bot para publicar oferta / aceptar por teléfono del mensajero / estado / entregado. (2) VivaBot: leer el pedido, publicarlo en el grupo, asignar al primero que diga "yo", mandarle el vale, preguntar hora, pedir confirmación al cliente, "entregado". (3) Prueba en vivo con producto real. Pendiente para después: llamadas automáticas y app propia de mensajeros (tipo La Nave / Mandao), que recibiría las ofertas en lugar del grupo.

**Prueba manual parada (2026-10-07)** para rehacer el flujo según D29. Hallazgos: panel `/ventas/` roto por reembolsos (**arreglado**); mensajería mostrada dos veces en la tarjeta; ofertas escondidas bajo una entrega vieja en la app del mensajero; pedidos de prueba abiertos (#904, #921, #924, #2616, #2672, #2673, #2674); la cuenta cliente de Ernesto está vinculada a la gestora de prueba "Auditor Casa Viva"; contraseña del mensajero piloto pasó por WhatsApp (cambiarla).

| Bloque | Estado |
|---|---|
| 0. Buzón de salida del bot (`crm_outbox`, VivaBot `35f55f6`) | **HECHO** y probado (mensaje a Zaymi enviado) |
| 1. Puerta del bot en Core (`class-cvd-bot-bridge.php`, Casa-Viva `5056bde`, en producción): `/bot/dispatch`, `/announced`, `/claim`, `/eta`, `/delivered`, `/bot/orders/{id}` con `X-Vivabot-Key` | **HECHO**, probado desde el VPS |
| 2. VivaBot: publicar en "PRUEBA Mensajería CV", "Yo" → claim → vale privado, pedir hora, avisar al cliente, "entregado" (`src/dispatch.js`, tabla `crm_dispatch`, VivaBot `28234ce`) | **HECHO y ronda completa** (2026-10-07): #2674 publicado → "Yo" de Zaymi → vale → recogida confirmada por tienda → hora y "entregado" (simulados vía API) → **cerrado por Lennys** (usuario propio `Lengonga`, admin): caja verificada, ganancia mensajera 2.070 CUP y comisión aprobadas, WooCommerce completado |
| 2b. Voz: notas de voz al cliente y al mensajero (voz IA) + transcripción de respuestas; después llamadas reales grabadas y transcritas (Twilio ~0,6–1 USD/min a Cuba) solo si no responde; llamadas WhatsApp oficiales cuando haya número propio en la API de Meta | Idea aprobada, por construir |
| 3. Simplificar: botón único "Listo para salir" y oferta arriba en la app; arreglar mensajería doble; limpiar pedidos de prueba | **HECHO** (Core 3.13.13, Casa-Viva `b679219`). Limpieza 2026-10-07: 32 pedidos de prueba cancelados, 0 abiertos; cuenta de Ernesto ya sin gestora "Auditor"; ganancia (2.070 CUP) y comisión del #2674 anuladas a mano. **Hallazgo**: cancelar en WooCommerce un pedido ya *cerrado* no deshace comisión ni ganancia (Core rechaza la anulación por diseño pero WooCommerce cambia el estado igual) → decidir regla. Falta: Ernesto cambia la contraseña del Mensajero piloto |
| 4. Repetir la prueba completa | **HECHA 2026-10-07 (#2675)**: Lennys clienta (venta directa) → 1 toque "Listo para salir" → bot publica → "Yo" de Zaymi → vale → hora 4pm → Lennys "SÍ" → recogida → "entregado 88 usd 1600 cup" por WhatsApp → dinero recibido → cerrado; ganancia 1.440 CUP en el libro; intento de cancelar el pedido cerrado **bloqueado** (D30 probado) |

**Después de la prueba (2026-10-07, Core 3.13.16, VivaBot `6fe1f4d`):** hechos vuelto en el vale + moneda obligatoria, fotos con el vale, franja del cliente, número de WhatsApp verificado, caja prellenada con aviso si no cuadra, avisos por tiempo, teléfono del mensajero al cliente, avisos a la gestora, "mi enlace" para gestoras. Opiniones: `docs/nexo-business/OPINIONES-PRUEBA-2026-10-07.md`. **Siguiente:** Lennys revisa el mensaje para el grupo "General" de gestoras (jid `120363304301144410@g.us`) → enviarlo → gestoras se registran en `/registro-gestora/` → aprobar → bot avisa. En Core solo hay 3 gestoras aprobadas (las reales están en BizneCubano).

**Hallazgos de la prueba final (por hacer):** (a) el bot tomó una pregunta del mensajero como hora → **arreglado** (VivaBot: solo acepta horas); (b) el teléfono del cliente se teclea mal en la web (53885368 vs 56885368) → usar el número de WhatsApp desde el que llega el vale; (c) "la hora la da el cliente" (Zaymi): pedir la hora al comprar y que el mensajero solo confirme; (d) el diálogo "Dinero recibido" de `/ventas/` no rellena el CUP y sobrescribe lo que declaró el mensajero (quedó 88 USD + 0 CUP en vez de 1.600 CUP) → prellenar con lo declarado y avisar si no cuadra; (e) flujo de devoluciones (D30); (f) notas de voz con voz de hombre cubano (ElevenLabs; luego clonar la voz de Ernesto); (g) cambiar contraseña del Mensajero piloto; (h) #2675 es de prueba y está cerrado: anularlo a mano (anular ganancia en el libro y luego cancelar).

**Relevo 2026-10-08:** estado completo, accesos y pendientes en `docs/nexo-business/HANDOFF_2026-10-08_MENSAJERIA.md`. Core 3.13.22 · VivaBot `c9403b0`.

## Decisiones pendientes de Ernesto (en orden)

1. Recrear `automatizacion.nexocuba.com` con Higgsfield (siguiente tarea de diseño).

**2026-10-10 04:00 UTC:** Caja (apps/business-pos): el carrito ya no deja añadir más unidades que las existencias conocidas por el equipo (aviso "Solo quedan N"). Falta compilar el nuevo instalador Windows/APK (no hay build en CI; se hace en la laptop de Ernesto) y enviarlo a Lennys, Zaymi y Nana. Web 3.13.27 (mejora #23) publicada. Fotos de BizneCubano ya en la caja (importación 03:50).

**2026-10-10 04:45 UTC — Prueba guiada caja PC (Lennys):** sincronizar ✅, existencias ✅, venta ✅, devolución ✅. Fallo encontrado y arreglado en caja 1.0.3 (reloj de la PC adelantado → "Agotado" con 1 en stock). Instalador Windows ahora se compila en GitHub (workflow `caja-windows.yml`, Releases `caja-vX.Y.Z`). **Decisión de Ernesto: todas las ventas en la caja son PRUEBAS hasta que él diga "ya estamos online"** (incluidas las 3 del equipo `ernesto-pc-1010-acaf` antes de la prueba: 8 toallas pequeñas con gestora, zapatera, 5 productos). Antes de salir en vivo: devolver/limpiar esas ventas de prueba y sus comisiones.

## L. Lunes 12-oct mañana (Claude Code; Ernesto fuera, avisos por WhatsApp al chat "Tú") — LEER PRIMERO
- **Programado de anoche:** salió todo (7:30, 7:35, 8:00, 9:00 General + tutorial 5 + Yanaika). El aviso de las 10:05 a Lennys se quitó del crontab: sus 4 dudas de costos fueron en el mensaje de las 9:38 (copia del crontab en `/root/supervisor/crontab.bak-20261012`). Quedan 4 líneas "12 10" ya ejecutadas: borrarlas hoy.
- **Split (Anderson, gestor Harley):** la tienda de 23 y 42 estaba cerrada. Ernesto lo lleva a mano (dinero de Dayra + su hermano; Daiquel de mensajero). Alternativas buscadas (grupos de proveedores, `crm_market_items`): Well 1 t 220V 275 USD y Milexus 110V 350 / Inverter 375 (LJH +5353847951, `ignorar`, ya habla Ernesto con él) · Milexus 1 t 220V 280 USD (Sergio Hernández +5358474247, contacto creado con el bot en pausa). Parker por menos de 376: no hay. Falta saber si la casa del cliente es de 110 o 220.
- **Lennys:** su lista de agotados de la 1:30 a. m. ya estaba casi toda en "Privado" (ella la ve por ser admin). Dudas enviadas: cortinero expandible plateado (391) y tapa sol Royale (290, 466). Pregunta pendiente: ¿cancelar el #2943 (repetido del #2944)?
- **VivaBot `94bad42` (en el VPS):** aviso previo al mensajero elegido (por la gestora o por la nota del cliente) al crear el pedido. Antes no sabía nada hasta «Listo para salir» (queja de Lennys por el #2944 y Daiquel). De 7:30 a 22:00; de noche queda pendiente hasta las 7:30. Teléfono desde `/bot/partners`. Pruebas en `test/delivery-day.test.js`.
- **Conocimiento:** #64 y #14 decían 9:00 → ahora 10:00 a. m. a 5:00 p. m.
- **Telegram (VivaBot `afe10e6`):** listo en el código; falta que Ernesto cree el bot con @BotFather, pulse Iniciar y escriba en el chat "Tú": `TELEGRAM <clave>`. La clave queda solo en `/root/supervisor/telegram.json` (600). Copia a Telegram `notifyOwner` y lo que el buzón le manda a él; lo que conteste en Telegram entra como el chat "Tú".
- **Lennys manda en Casa Viva** (Ernesto, 12-oct): sus pedidos de cambios valen como aprobación (memoria `lennys-decides-casa-viva`).
- **Core 3.13.58–3.13.60 (en vivo):** opción `cvd_dispatch_on_create = yes` → la carrera sale un minuto después de la compra (directa al mensajero elegido o al grupo), sin esperar «Listo para salir»; de 22:00 a 7:30 espera a las 7:30; «Listo» ya no republica. Corre en nombre del admin (`cvd_system_actor_user_id` o el admin más antiguo). Probado: #2945 (Nadielys) e #2946 (Yudi, 10:38 pedido → 10:39 aceptado por Elaine). Para apagarlo: `wp option update cvd_dispatch_on_create no`.
- **Fallo grave encontrado:** al comprar para un cliente, WooCommerce guardaba el teléfono del CLIENTE en la cuenta de la gestora (8 cuentas: 14 Lennys, 18 Dany, 21 Adis, 57 Zuanet, 47 Maryta, 64 Zaymi, 30 Elizabeth, 29 Nadielys). El bot usaba ese teléfono: los avisos «tu pedido está listo / lo cogió…» llegaron a clientes (#2943/#2944 → Alberto, #2945 → Mirta) y Alberto salió como gestora. Arreglado en Core 3.13.59 (el checkout del equipo no toca su cuenta; `user_by_phone` usa `_cvd_whatsapp`) y en VivaBot `6224977` (teléfono desde `/bot/partners`). **El bot aún no se ha reiniciado** (chats sin calma desde las 10:30): hasta entonces el riesgo sigue. Corregir los `billing_phone` de esas 8 cuentas lo bloqueó el modo auto: queda para Ernesto.
- **VivaBot también:** `f351b08` respuestas a preguntas abiertas aunque el chat esté en pausa (si citan la pregunta) · `fb8998b` el aviso previo al mensajero espera 10 min y solo sale si la web no lo asignó.
- **Pedidos:** #2943 cancelado (repetido del #2944, lo lleva Daiquel; comisión del #2944 = Joycy, sin registrar, nota en el pedido). Frank/Lázaro (…8195) debe registrarse en /registro-mensajero/.
- **Errores míos:** duplicado a Max en el General (el supervisor ya había contestado); pregunta de Yudi enviada a un número equivocado (5352834147) con el nombre de su clienta. Memoria `look-up-phone-before-sending`.

### L2. Lunes 12-oct, 10:45–12:25
- **Reinicios:** el bot se reinició a las 10:46, así que el arreglo de teléfonos ya está en marcha. Ahora carga 44 números de gestoras/influencers (antes 9). El reparto al crear el pedido se probó con el #2946: aceptado en 1 minuto. Core **3.13.61**: pestañas Pendientes/Cerrados en ventas.
- **Telegram conectado** (@curru360bot, `/root/supervisor/telegram.json`). Desde VivaBot `e1f977f`, audios, fotos y archivos para Ernesto se copian como archivo (`tgFile`). Las fotos de más de 10 MB van como documento (`0058dab`).
- **Voz nueva de Ernesto:**
  - **Clave:** ElevenLabs plan Starter. Guardada a ciegas con `/root/supervisor/clave-voz.sh`, que pide la clave sin mostrarla; queda en `/root/supervisor/elevenlabs.json` (permisos 600).
  - **Voz:** `voz_id` = `kuc46PoM4O1qlIVI9eg6`.
  - **Modelo elegido de oído:** `eleven_multilingual_v2` sin style, stability 0.5, velocidad 1.16 (`b7c77be`). v3 sonaba más lento.
  - **Respuestas en audio:** `voz_respuestas` = sí.
  - **Pruebas:** en `/root/archivos/pruebas-voz/`. Whisper las transcribió sin un error.
- **Estilo del bot (Ernesto):**
  - **Prompt:** corto, preciso y directo; calidez solo cuando hace falta; humor cubano con respeto; pregunta solo si falta un dato (`183614c`).
  - **`withoutGenericClose`** (`preguntas-rules.js`, `fccc963`): quita «¿algo más?», «si necesitas otro dato, dime», «me avisas si…» y la presentación al final.
  - **`isTrivial`:** «Okok», «Okis» y «Dale oki» ya no se contestan.
- **Contacto corregido:** 5353474881 era «Ibelice» con línea personal; ahora «Fernando Santana (mensajero)», línea casaviva.
- **Tienda (lo que pidió Nana):**
  - **Existencias puestas en web:** batana HOEGOA 676 → 1; brazalete deportivo 553 → 1 y publicado (estaba privado por agotado); cesto de pedal negro 7 L 2411 → 1 (el pedido de recogida que ella recuerda no está en los últimos 80 de la web).
  - **Paraguas 2828 / 2858:** no son repetidos (liso y estampado).
  - **Protector King:** 38 USD en web y 39 en tienda; pregunta abierta a Lennys (`ptmsydito`).
- **Pedidos y mensajeros:**
  - **Recordatorios de liquidar:** Ely #2916 y Fernando #2896.
  - **#2947 (Neisy):** el bot respondió con otro pedido; corregido a mano.
  - **Lázaro:** aprobado como mensajero.
  - **Nana:** se registró como gestora y se aprobó sola (modo TODAS). Su rol en el CRM pasó a gestora. **Falta que Ernesto decida** si queda así.
- **Bolsa / marketplace** (informe en `docs/nexo-business/marketplace-2026-10-12.md`):
  - **Lo que hay:** 525 artículos (Sergio 252, LJH 272) y 0 con FOTOS OK.
  - **Arreglo:** `publishItem` no comprobaba FOTOS OK; arreglado en `4c0dbec`.
  - **Top 10 propuesto:** todos de Sergio.
  - **Revolico:** devuelve 403 (Cloudflare); no se insistió.
  - **Fadiar:** el WhatsApp de Ernesto no está en ningún grupo suyo.
  - **DIGITAL STORE:** 0 mensajes desde el 6-oct.
- **Serie de Cúrru:**
  - **Escenarios:** 9 hechos a partir de las 13 fotos de Nana, en `videos/curru-tienda/escenarios/`; en el VPS, `/root/archivos/curru-tienda/`.
  - **Tomas:** 5 de Cúrru con Proskopellin, en `videos/curru-tienda/tomas/`.
  - **Créditos:** Higgsfield `gpt_image_2_5`, 1 crédito por imagen; quedan 5.
- **`cv enviar`:** ahora se niega a mandar a un número que no está en contactos (`--nuevo` para forzarlo) y muestra «Para: nombre». Motivo: un mensaje para Dayisel salió a 5358892739, que es un número equivocado (solo con su nombre e instrucciones). Copia de seguridad en `/root/supervisor/cv.mjs.bak-20261012`.

### L3. Lunes 12-oct, 12:25–15:00
- **Core en vivo:**
  - **3.13.62:** selector «¿Tienes algún mensajero preferido?» en el checkout de gestoras y equipo. El vale va directo a ese mensajero; si no se elige, va al grupo. **Funcionó en uso real:** el #2967 lo eligió Rafael Codina → Ely.
  - **3.13.63:** los pedidos del marketplace no se reparten solos.
  - **3.13.64:** cada pedido guarda la tasa CUP del día de la venta, y la comisión en CUP sale con esa tasa.
  - **`25a39cf`:** avatar del asistente = Cúrru sonriendo con su cara oficial (`assets/curru-avatar.webp`). Antes salía la ilustración del 2-oct.
- **VivaBot en vivo:**
  - **`ede7d43`:** precio de la bolsa en `src/market-price.js` (D45; lo barato, menos de 60 USD, lleva +40 % entre 5 y 17 USD).
  - **`60b3080` / `a88bcba`:** flujo bajo pedido. Llega una alerta a Ernesto, el bot pregunta al proveedor y pasa la respuesta.
  - **`21c48b8`:** menos relleno en las respuestas.
- **VivaBot `fea7917` (en vivo desde 15:09, con el SÍ de Ernesto):**
  - **Qué hace:** lo que la tienda no tiene se busca en la bolsa, se ofrece «bajo pedido» y se le pregunta solo al proveedor (caso Harley / módem ML8). También funciona en el grupo General.
  - **Pruebas:** `npm run check` verde (dispatch: 51 pruebas).
  - **Avisos a Ernesto:** en cada consulta, y otra vez si el proveedor no contesta en 1 h 30 min.
  - **Mensajes del proveedor:** con una consulta abierta, lo que escriba ese proveedor le llega a Ernesto durante 24 h y el bot no le contesta.
  - **Apagarlo:** `BOLSA_CONSULTAS=0`.
  - **Falta:** probarlo con una gestora real.
- **VivaBot `cc4549c` (15:38):** «Cualquier otra cosa que necesites, aquí estoy» se quita como relleno.
- **VivaBot `f8d48e4` (16:00):** ahora cuentan como entregado frases como «Ya se lo entregué al cliente» o «Listo, entregado» (`isDelivered`).
  - **Motivo:** Ely escribió así el #2967; no se registró y la IA le dijo que sí. Se le pidió que escriba *entregado*.
  - **Rellenos quitados:** «Mientras tanto, si necesitas…» y «Aquí estaré si…».
- **Core 3.13.65 (15:40):** en Pedidos de la tienda, la fila Mensajería dice quién lo lleva y si lo eligió la gestora. Lo pidió Nana. Copia de seguridad: `~/bak-20261012-cvd-3.13.64-antes-3.13.65`.
- **⚠️ Incidente, envío #7 (16:17–16:34):**
  - **Qué pasó:** el mensaje que era para Lennys («Hola Lenny, necesito que me confirmes si la fórmula definitiva…») les llegó a 13 desconocidos que venden saldo. Raudel, Randy y Luis contestaron «número equivocado»; Ernesto ya les pidió disculpas.
  - **Causa 1:** una nota de voz de Ernesto de las 14:01 («pregúntale a Lennys…, pregúntales a Daira, Marita y Nana…») se leyó como un envío a vendedores. Cogió la última búsqueda (saldo).
  - **Causa 2:** un «sí» suelto en el chat «Tú» lo lanzó, probablemente contestando la pregunta de Claude de las 16:13.
  - **Arreglo, VivaBot `7a980b7` (16:42):** un «sí» suelto solo vale para borradores de menos de 20 min (si no, hay que escribir «SI N»), y no se arma un envío si el texto nombra a gente del equipo. Memoria `no-yes-no-questions-in-tu-chat`.
  - **Pendiente:** la nota de voz de Ernesto sigue sin hacerse (preguntar en privado a Daira, Maryta y Nana los «plus» por producto, y a Lennys la fórmula definitiva, para la herramienta de entrada de productos).
- **⚠️ OpenAI sin saldo desde las 16:37** (`credit_balance_exhausted`, comprobado):
  - **Efecto:** el bot no contesta con IA. Los avisos, los vales y el «entregado» siguen funcionando.
  - **Qué hace falta:** que Ernesto recargue en platform.openai.com → Billing. Anthropic tampoco tiene saldo.
- **VivaBot `88898b4` (16:39):** la foto que manda la tienda responde sola la pregunta abierta que pedía foto y sale en el General. Lo pidió Nana.
- **Noche del 12-oct (18:30–19:30):**
  - **Resúmenes del día:** 5 tarjetas con la marca (Ernesto, Lennys, dependientas, gestoras, mensajeros) y la del equipo, con premios (gestor del día Rafael; mensajeros Daiquel y Ely), datos curiosos, dudas frecuentes y errores. Enviadas y guardadas en `crm_settings` `resumen:2026-10-12`. Generador: `videos/curru-tienda/redes/resumen-dia.mjs`.
  - **VivaBot `0fecf50`:** aviso a Ernesto si OpenAI se queda sin saldo y cuando vuelve. Ernesto recargó OpenAI y la IA funciona otra vez desde las 19:09.
  - **VivaBot `3a9cbbe` (19:20):**
    - **Recogidas al grupo «Recogida en tienda»:** funcionan, pero quedan APAGADAS (`crm_settings recogidas_grupo` = `no`). Se le preguntó a Dany si las prueba; con su sí → `prueba:52544351`.
    - **Hora del mensajero:** si el mensajero da una hora nueva después de la primera, se guarda y se le avisa a la gestora.
  - **#2944:** la comisión (4 USD) pasó de Lennys a Joyce (usuario 78), con el SÍ de Ernesto y a pedido de Lennys. Copia de los datos anteriores: `~/bak-20261012-pedido-2944-meta.json` (Hostinger).
  - **Pendiente para mañana, en frío:** Pedri dice que hizo el #2945 (a nombre de Isabel), el #2946 (a nombre de Elaine) y el #2947, y pide poder «pasar una carrera» a otro mensajero.
  - **Preguntas de los «plus» de la entrada de productos:** hechas a Maryta y Dayra. Nana no lo necesita (le da a Lennys el precio con el plus puesto).
  - **Auditoría de redes programada** (tarea local, lunes 9:00). Registro de publicaciones: `docs/nexo-business/redes/publicaciones.json`.
  - **Recogidas al grupo en PRUEBA con Dany** (`recogidas_grupo` = `prueba:52544351`, 19:30). Mañana hace un pedido de recogida y no lo pega a mano. Si sale bien: `si` y se anuncia en el General.
  - **Resumen automático (VivaBot `32b4e6c`/`512a28e`, `scripts/resumen-diario.mjs`):**
    - **Crontab del VPS** (la hora del servidor ya es la de La Habana): 20:00 `tareas/resumen-noche.sh` (tarjeta del equipo a General y Mensajerías, más la de Ernesto); 10:00 `tareas/resumen-manana.sh` (la de ayer para Lennys y las dependientas).
    - **Primeros envíos:** el 13-oct a las 20:00 y el 14-oct a las 10:00 (los del 12-oct ya salieron a mano).
    - **Registro:** `/root/archivos/resumenes/cron.log`. Prueba en seco: `node scripts/resumen-diario.mjs --prueba`.
    - **Marca:** fuentes y logo en `/root/archivos/marca/`. Dibuja con sharp porque en el VPS no está resvg.
    - **Ojo:** hay otro sistema de resumen sin subir (`scripts/cierre*`, 11-oct). Hay que quedarse con uno.
  - **Reel v2** (`videos/curru-tienda/reel-apagon/casa-viva-reel-apagon-v2.mp4`, 16,8 s; versión de menos de 10 MB `-v2-fb.mp4`): subtítulos en la zona segura (y≈1220), 7 planos con zoom y sin la escena promocional («En Casa Viva… Escríbenos»). Lo puede volver a hacer `v2.mjs`. Sigue sin publicar: va a Instagram por Meta Business Suite (propuesta: martes 19:00).
  - **Zona horaria de la web corregida (21:14):** WordPress estaba en UTC, así que desde las 20:00 de Cuba la web creía que ya era el día siguiente. Dany lo vio: al hacer el vale de «mañana», le salía mié 14 en vez de mar 13.
    - **Cambio:** ahora `timezone_string` = `America/Havana`. Valores anteriores en `~/bak-20261012-zona-horaria.txt` (Hostinger): vacío y +00:00.
    - **Qué cambia:** las 31 piezas que usan `wp_timezone`/`current_time` pasan a la hora de Cuba. `class-cvd-delivery.php` y `messenger-cash` ya usaban la hora de La Habana. Las fechas de los pedidos se guardan en UTC, así que no se mueve ningún dato.
    - **Vigilar el 13-oct:** la tasa del día, los cortes de «hoy» en informes y el reparto de las 22:00–7:30.
  - **Contabilidad del 12-oct mandada a Lennys (20:59):**
    - **Ventas:** 349 USD en la web; la caja solo tuvo una venta de prueba con su devolución.
    - **Cobrado:** 111 USD en tienda (91 USD + 15.600 CUP).
    - **Por cobrar:** 238 USD.
    - **Comisiones:** 15 USD aprobadas y 25 pendientes.
    - **Falta:** la ganancia por dueña, porque la nube solo tiene costo de 2 de 13 productos. Hay que usar el Excel «STOCK CIERRE 12 DE OCTUBRE» de Maryta, que solo está en el WhatsApp de Ernesto (el bot no guarda documentos).
  - **Para el 13-oct (lista de la noche):**
    - **VivaBot en vivo desde las 23:04 del 12-oct (`b8c8d61`, incluye `ba00ea3` y `36cc8e0`):**
      - **Recorte:** el prompt pasa de unos 14.800 a unos 8.400 tokens de mediana; ahorra 1–1,25 USD/día.
      - **Prueba:** 27 pares reales; ninguna respuesta peor y 6 mejores (ya no inventa ferretería ni culpables).
      - **Medición:** `docs/nexo-business/bot-prompt-medicion.md`. Laboratorio de pruebas: `/root/prompt-lab/` (se puede borrar).
      - **Comprobar en los logs del 13-oct:** `[ia] gpt-4.1 smart entrada≈7.500–9.000`.
      - **Horario del conocimiento:** ahora 10:00–17:00.
      - **El vale nuevo** (`36cc8e0`) se activa cuando suba Core 3.13.67; mientras tanto se comporta como antes.
    - **Formas de pago y vale: Core SIN SUBIR (`efc86be` = 3.13.67); el bot ya está listo.**
      - **Qué hace:** «¿Cómo paga el cliente?» (7 formas), la cifra con las tasas del día (`cvd_daily_rates`) y el vale con qué cobrar exactamente. Con Zelle o PayPal: «NO cobres los productos».
      - **Subirlo el 13-oct temprano,** junto con el recorte del bot. Antes, `php -l` en el servidor (aquí no hay PHP). Primero el bot, luego Core, y probarlo con Dany.
      - **Por confirmar:** la Clásica se paga a la tarjeta de la tienda ·2690 (según la lista de Maryta) y los euros se apuntan en la observación de caja.
      - Lo pidió Lennys; el bot ya lo sabe (conocimiento #167, y #172 para la transferencia en CUP a la tarjeta del mensajero).
    - **Precio de armado por producto:** Lennys mandará la lista. El vale debe avisar al mensajero (herramientas y cuánto cobrar). Las respuestas #115 y #116 ya no dicen «3.000 CUP fijo»; ahora dicen que depende del mueble.
    - **Recogidas sin recoger:**
      - **#2936:** CANCELADO (21:49, SÍ de Ernesto); el tendedero rosa vuelve al stock (2).
      - **#2926:** CANCELADO (23:07, lo pidió Daymee y Ernesto dio el SÍ); árbol de navidad, el stock vuelve a 20 y la comisión queda anulada. **El 13-oct temprano avisar a Daymee y a Nana** (no se les escribió de noche).
      - **Regla propuesta:** aviso a las 24 h y cancelación sola a las 48 h. Es idea de Nana; falta el SÍ.
    - **Teléfono opcional en las recogidas:** idea de Dany. Ojo, el teléfono sirve para saber de qué gestora es el cliente.
    - **Arreglos del bot:**
      - Inventó productos de ferretería (martillos, tornillos…) y prometió fotos que no existen (PastorJDC; se le corrigió a mano). Hay que buscar también por categoría y no rellenar.
      - Contestó a un mensaje que solo tenía emojis.
      - Le dijo a Dany que las fotos de la recogida no salían (sí sale la del primer producto).
    - **Maryta:** 3 productos con su «plus» (`docs/nexo-business/entradas/2026-10-12-maryta.md`). Falta confirmar el alto del organizador (¿72 o 78 cm?) y las unidades (9 o 10).
    - **Mensaje para Patry** que Lennys mandó por error al chat del bot: esperar a que diga si se reenvía.
  - **Fotos de productos de la bolsa:** NO se suben a la web hasta que las fotos estén bien (Ernesto). **Piloto hecho (12 productos de Digital Store, en local, nada publicado):** 9 listos (6 con fotos del proveedor, 3 con fotos oficiales de internet: Samsung, Logitech, PS4) y 3 bloqueados (cafetera, lámpara y power bank: genéricos o sin foto oficial). Solo sirvió 1 de cada 3 fotos del proveedor; la Farberware trae fotos de una Ninja. Finales 1200×1200 fondo blanco, sin logo. Hoja `docs/nexo-business/fotos-productos/piloto/hoja-piloto.jpg`, informe `piloto/informe.md`, propuesta para los ~680 en `fotos-productos/PROCESO.md` (IA gpt-4.1-mini ≈2–5 USD todo el catálogo + ≈2 h de aprobar hojas de 20). **Siguiente:** que Ernesto apruebe reglas (blanco, sin logo, nota ≥7) y el proceso; luego construir el script en el VPS.
- **Core 3.13.66 (17:32):** los apellidos de quien recibe son opcionales en el checkout. Lo pidió Dany. Copia de seguridad: `~/bak-20261012-cvd-3.13.65-antes-3.13.66`.
- **Mensajero nuevo Albertico (5356695330):** se le mandó la bienvenida y el video. Falta que Ernesto lo meta en el grupo de Mensajerías y que él se registre.
- **Aviso del mensajero preferido** enviado al General (#631, 15:10). Texto en `docs/nexo-business/tutoriales/tutorial-mensajero-preferido-mensaje-general.txt`.
- **Tienda:**
  - **Colores ocultos:** 8 productos arreglados a mano (meta `_product_attributes` directa; `$p->save()` no guardaba).
  - **Pendiente de raíz:** «Diseños y colores» debe añadir la opción al padre.
  - **Set de alfombras de baño (177):** color azul (variación 2965, 3 u, 15 USD). Se vendieron 2 en el #2966.
- **Gestoras: peticiones de Cely Vega (…9935, 12-oct, 23:34–23:42):**
  - **Recuadro de comisiones** en el panel (pendientes, listas, pagadas…), como el de BizneCubano.
  - **Tienda por departamentos:** ahora los productos «salen regados»; mezcla las alfombras de baño con las de cocina.
  - **Resumen en texto por departamento** para mandar a sus clientes.
  - **Core 3.13.68 HECHO, SIN SUBIR** (Casa-Viva `4169be2`, rama `reparto-relevo`, encima de la 3.13.67 `efc86be`, que también espera; en el servidor sigue la 3.13.66). Recuadro «Tus comisiones» en Inicio y arriba de Ventas: Pendientes / Listas para cobrar (con «Pedir mi pago») / Solicitadas / Pagadas. Son los estados del Core (`pending`, `approved` sin pago pedido, `approved` con `_cvd_payout_id`, `paid`). En USD, y en CUP con la tasa guardada en cada pedido; sin pruebas ni cancelados. «Por cobrar» sale de Inicio (ahora es «Listas para cobrar»). Probado en solo lectura con datos reales y vista del móvil. Hoy no hay ninguna solicitud de pago en la web (`cvd_payouts` vacía), así que Solicitadas y Pagadas salen en 0 para todas. **Cely no tiene ventas en la web: su saldo de BizneCubano no sale ahí.**
  - **Propuesta de departamentos y «lista en texto»:** `docs/nexo-business/propuestas/departamentos-web.md`. Son 10 departamentos más Navidad, 16 productos mal puestos, ejemplo real de Baño y lo que cuesta cada paso. **Espera la decisión de Lennys.** Nada se cambió en la web.
  - **Ernesto:** Lennys paga el saldo atrasado de las comisiones de BizneCubano. Hay que avisar a Cely y al General **el 13-oct después de las 10:00** (antes, Ernesto aprueba el texto). Borradores en `docs/nexo-business/avisos/2026-10-13-ideas-cely.md`.
  - **Ernesto (13-oct, 00:2x):**
    - Ninguna comisión de ventas de la web se ha pagado por fuera; lo que se paga ahora es lo atrasado de BizneCubano. Así que el recuadro (3.13.68) muestra bien «Listas para cobrar».
    - Le parece bien quitar «Por cobrar» de Inicio.
  - El bot tomó por pedido la lista de ejemplo de Baño y le mandó 12 fotos (fallo `parseProductList`). Ernesto lo paró: el bot queda en pausa con ella hasta el 13-oct a las 11:40.
- **Lennys (13-oct, 00:06–00:08, notas de voz):**
  1. **La web, por categorías como en BizneCubano.** Los 247 «Bajo pedido» salen mezclados con todo.
     - Arreglo rápido que preparé: poner `menu_order=10` a los 250 «Bajo pedido». La Tienda ordena por `menu_order` y después por nombre, así los de la tienda salen primero. Se deshace volviendo a 0. **HECHO (00:15, con el sí de Ernesto):** 250 filas cambiadas, caché purgada. La Tienda empieza ahora por los productos de la tienda («Aceite capilar…», «Albornoz…»), y la portada y la Tienda dan 200. **Ojo:** los «Bajo pedido» que se publiquen a partir de ahora entran con `menu_order` 0 y se mezclan otra vez. Hay que cambiar `CVD_Market_Bridge` para que les ponga 10 (junto con lo de los departamentos).
     - Lo de fondo, por departamentos, está en `propuestas/departamentos-web.md`. Lennys quiere los nombres de BizneCubano.
  2. **Probar la entrada de mercancía nueva solo con el bot.** Que haga solo la fórmula de precio y comisión (costo + plus), la foto de calidad y la publicación, sin que nadie lo haga a mano. Pendiente para el 13-oct.
  3. **BizneCubano en mantenimiento** para que todos los vales salgan por la web nueva. El bot ya lo sabe (`crm_knowledge` #173; la #60 ya decía que no se usa desde el 11-oct).
- **Noche del 13-oct (00:30–00:45), con permisos de Ernesto:**
  - **Core 3.13.68 EN VIVO (00:35):** formas de pago en el checkout + vale con la cifra exacta (3.13.67) y recuadro «Tus comisiones» (3.13.68).
    - Sin cambios ajenos en el servidor (md5), `php -l` ok, y la portada y la Tienda dan 200.
    - Copia: `~/bak-20261013-cvd-3.13.66-antes-3.13.68`. Empujado a `origin/main` (`4169be2`).
    - **Probarlo con Dany hoy** (se le pide a las 9:00).
  - **Agotados ocultos:** `woocommerce_hide_out_of_stock_items = yes`. Eran 13; vuelven a salir solos cuando se repongan. Lennys estaba preocupada por los «no disponibles».
  - **«Privado» que veía Lennys:** solo los ve el administrador. Para un visitante, un producto privado da 404 (probado con el #2811) y el mapa de la web solo tiene los 457 publicados.
  - **Armado (Ernesto):** 10 USD los productos grandes y 5 USD los pequeños. Lo arma el mensajero como servicio adicional al cliente. Ya está en el conocimiento #115 y #116.
  - **Aprobado por Ernesto:**
    - regla de recogidas (aviso a las 24 h y cancelación sola a las 48 h);
    - teléfono opcional en las recogidas;
    - si hay una forma buena de sacar las fotos de Kevin, publicarlas sin preguntar (las reviso yo).
  - **Avisos de las 9:00, programados en el VPS** con `systemd-run`: unidad `avisos-20261013.timer`, carpeta `/root/supervisor/tareas/avisos-20261013/` (registro en `salida.log`).
    - **A los grupos:** General (ideas de Cely), General (armado), Mensajerías (armado).
    - **En privado:** Cely, Lennys (tienda, «Privado», agotados, BizneCubano, formas de pago, mercancía nueva), Daymee (#2926 cancelado), Nana (#2926), Pedri (cómo repartirse las carreras y quiénes son Isabel y Elaine) y Dany (pedirle que pruebe las formas de pago y el recuadro).
    - Se borró la tarea local de las 10:00.
  - **Agentes trabajando (13-oct, madrugada):**
    1. **Bot:** guardar documentos (el Excel de Maryta), las fotos de Maryta que no se guardaron, no tomar listas por pedido, no contestar a emojis, no inventar ni prometer «apartar», y la regla de recogidas con el interruptor `recogidas_auto`. Se sube con `cv reiniciar`.
    2. **Web 3.13.69:** que los «Bajo pedido» conserven su departamento y entren con `menu_order` 10, repartir los 250 por departamentos (nombres de BizneCubano), la Tienda con los departamentos siempre a la vista, el teléfono opcional en las recogidas y los 16 productos mal puestos si D37 lo permite.
    3. **Entrada de mercancía por el bot:** diseño y prototipo, sin tocar nada en vivo, en `docs/nexo-business/entradas/FLUJO-ENTRADA-BOT.md`.
    4. **Fotos de internet de los 412 de Kevin:** piloto y, si sale bien, todos (tope de 15 USD). Las hojas las reviso yo antes de publicar.
- ~~Avisos de las 10:00 (General y Cely) con tarea local~~ → pasaron al VPS a las 9:00 (ver arriba).
- **Mañana del 13-oct:**
  - **Avisos de las 9:00:** salieron los 9, del #722 al #730, entre las 9:00 y las 9:03.
  - **Agentes de la madrugada:** se cortaron sin terminar al cerrarse la sesión. Se reanudaron a las 9:20.
  - **Playa Baracoa, 4 500 CUP** (Ernesto, por Niurka …3588): en vivo con `save_rate` (Playa → Playa Baracoa; el quote da 4500 oficial). En el bot, `localities.json` (`485bbe3`). En el CSV del Core, `725c197` (sin subir; no hace falta). Se le avisó a Niurka (#732).
  - **Recogidas al grupo: la prueba de Dany no salía.** El bot salta los pedidos con «PRUEBA» en el nombre.
    - Arreglo `0d0c5d4`: en modo `prueba:` sí salen, con «🧪 PEDIDO DE PRUEBA · NO PREPARAR».
    - En vivo a las 9:18. El #3535 salió al grupo a las 9:19 y se le avisó a Dany (#731).
    - **Falta:** que Dany diga que está bien → poner `recogidas_grupo` a `si`, cancelar el #3535 (Ernesto ya dijo que sí) y anunciarlo.
  - **Lennys:**
    - Preguntó quién ha pedido comisiones en la web nueva: nadie (`cvd_payouts` vacía).
    - Preguntó qué es «53 productos del Excel por confirmar · 128 no están en la web»: es la revisión de costos del Excel en el panel.
    - Se quejó de que el bot dejara para «mañana a las 10» los colores de edredón a Nadielys: el agente del bot lo arregla.
    - Se le contestó todo (#733).
    - **Sin aclarar:** «¿Está activado el botón?».
  - **Pedri:** Isabel es su esposa y Elaine su comadre; las dos son gestoras. **Ernesto decide** cómo se reparten las carreras y si se hace «pasar carrera».
  - **Pedri, carreras (Ernesto: «lo mejor para él»):** si Isabel o Elaine cogen una carrera, el bot se la pasa sola a Pedri (`crm_settings mensajero_por`). Además habrá un «pasar carrera» a mano para todos, y el #2945 y el #2946 pasan a su nombre. Un agente lo está construyendo; a Pedri se le avisó (#735).
  - **Armado (Ernesto, 09:45):**
    - Cuando el cliente lo pide, va en el checkout: «No / Sí pequeño 5 USD / Sí grande 10 USD», en `_cvd_assembly` y `_cvd_assembly_usd`. No se suma al total; lo cobra el mensajero.
    - El anuncio de la carrera lo dice **antes de cogerla**. Si el mensajero no quiere armar, no la coge; si nadie lo arma, lo arma la clienta.
    - En construcción: Core 3.13.69 (agente web) y `dispatch.js` (agente de carreras).
    - Pedri, preocupado por dejar la moto en la calle, ya está avisado (#736). **Falta:** cuando esté en vivo, avisar al General y a Mensajerías (texto para que lo apruebe Ernesto).
  - **Fotos de internet de Kevin:** del piloto pasaron 6 de 20, y se gastaron 0,69 USD. Informe en `fotos-productos/INFORME-FOTOS-INTERNET.md`.
    - **Publicados los 6 a las 9:46** con el permiso de Ernesto: 542 PECRON, 807 iPad 9, 786 Samsung A27, 695 Lenovo V15, 553 Air Mouse y 892 JBL PartyBox. Se publicaron con `publicar-hoja.mjs --revision …/revision-web.json` y se les puso `menu_order` 10.
    - Los 152 con marca (unos 5,30 USD, se salvarían unos 65–70): **Ernesto lo está pensando.** Los genéricos (1 de 10): Google Cloud Vision (Ernesto está creando la cuenta) o fotos de Kevin.
  - **Entrada de mercancía por el bot:** diseño en `entradas/FLUJO-ENTRADA-BOT.md` y prototipo en `entradas/prototipo/` (14/14 pruebas).
    - Fórmula que encaja con los 3 de Maryta, sin confirmar: costo + plus + comisión + máx(5 USD; 20 % del costo total), redondeado hacia arriba.
    - Hay 7 preguntas para Lennys.
  - **Core EN VIVO (13-oct, mañana; agente web, empujado a `origin/main`):**
    - **3.13.69** (`f687935`): teléfono opcional en la recogida en tienda (si se pone, 8 cifras).
    - **3.13.70** (`bf1b01a`): armado por el mensajero en el checkout, solo a domicilio. No se suma al total. Se ve en el vale de WhatsApp, en Pedidos de la tienda, en «Tus ventas», en el área del mensajero y en `/bot/dispatch` (`assembly.notice`). **Falta:** que el bot lo imprima en la carrera del grupo (agente de carreras).
    - **3.13.71** (`004d884`): los pedidos de prueba nunca salen al reparto.
    - Copias: `~/bak-20261013-cvd-3.13.6x-antes-3.13.7x`.
  - **Incidente #3548 (09:52):** el agente web creó un pedido de prueba sin querer (`calculate_totals()` lo guardó). Nana pulsó «Listo» y salió al grupo de Mensajerías con «0 CUP». La ampliación avisó a otros 19 por la web y por correo. Nadie la cogió.
    - Félix contestó «Yo» y se le avisó (#737). Lennys preguntó y se le contestó (#738). Aviso en Mensajerías con el sí de Ernesto (#739).
    - Lo arregla la 3.13.71.
  - **Pregunta abierta vieja** (edredones de Nadielys, en cola desde las 17:50): salió a las 10:00 a Nana y Zaymi aunque Lennys ya lo había contestado. Se cerró y se les avisó (#740, #741).
  - **Core 3.13.72–3.13.74 EN VIVO** (agente web; copias en `~/bak-20261013-cvd-…`):
    - **3.13.72/73** (`1552bdd`, `9033592`): fichas de departamentos siempre a la vista (Tienda, departamentos, portada). En «Todo», los productos van agrupados por departamento: primero los de la tienda, luego un separador «Bajo pedido». Lo comprobé en el móvil: la Tienda enseña las fichas y los títulos por departamento.
    - **Mercado:** los bajo pedido entran con `menu_order` 10 y su departamento. **256 bajo pedido repartidos** (Tecnología 147, Accesorios 29, Apagones 22…) y **18 productos de la tienda arreglados**. Para deshacerlo: `wp eval-file ~/bak-20261013-restaurar-categorias.php`.
    - **3.13.74** (`d1e5abb`): «¿Cómo paga el cliente?» también en la recogida (opcional), con el importe a la tasa del día.
  - **VivaBot `51bfbdd`:** el aviso del grupo de recogidas dice «💳 Paga en la tienda: *11.775 CUP* (15 USD × 785) · Efectivo CUP».
  - **Departamentos para Lennys** (en su panel):
    - las 9 mochilas, que irían a Accesorios;
    - las cortinas roller y las puertas de corredera;
    - el soporte de TV;
    - el brazalete;
    - los cojines;
    - los cables fotovoltaicos;
    - el búcaro, la maceta y los girasoles;
    - los ventiladores F6 en dos departamentos;
    - el orden de las fichas;
    - los juguetes y patines en Accesorios;
    - las tarjetas de cumpleaños (#3514).
  - **Recogidas al grupo:** la prueba 2 de Dany (#3549, 3 productos, una foto por producto) salió perfecta y se canceló. **Falta el sí de Ernesto** para poner `recogidas_grupo` a `si` y avisar al General.
  - **Bauta y Mariel** (Nadielys …2217 vive en Bauta y vende allí): no están en las tarifas. **Ernesto decide:** precio por confirmar, tarifa fija o seguir con la nota.
  - **Maryta empieza hoy el conteo al 100 % de la tienda, sin corriente.** Se le propuso anotar producto, color y cantidad, mandar foto solo de lo que no sepa identificar y mandar el Excel o la lista al terminar (#747).
  - ~~Departamentos (3.13.72): el agente sigue.~~ Hecho (ver arriba).
  - **10:35–10:47:**
    - **Armado:** salieron los avisos a General (#751) y Mensajerías (#752), con «ese dinero es para ti» (Ernesto) y cómo pasar una carrera.
    - **Bauta y Mariel, 10 USD = 7 850 CUP** (Ernesto), en vivo con `save_rate`, más Bauta/Playa Baracoa a 4 500. Está en el CSV del Core (`7f68b7d`) y en el bot (`615c509`); en el bot, pendiente de `cv reiniciar`. Se le avisó a Nadielys (#754).
    - **Lennys:** se le mandó la lista de decisiones de departamentos (#753) y lo de los colchones King (#750). De los EDSM A no hay medidas en la web: se le pidieron.
    - **Conteo de Maryta:** su idea (foto por producto al bot) habría costado 6–9 USD de IA y sería lenta. Se le mandó un **Excel ya hecho**, `docs/nexo-business/conteo/conteo-tienda-2026-10-13.xlsx` (373 productos y colores de la tienda por departamento, con «en la web» y una columna amarilla «CUENTA REAL») (#755, #756). Ella aceptó. Cuando lo devuelva: comparar con la web y mandarle las diferencias.
    - **Core 3.13.75** (`c4b3e4f`): «Ver la tienda» siempre visible en el área de la gestora (Rafael Codina no podía volver a la tienda). Se le avisó (#762).
    - **Fotos por color:** 34 productos con 106 colores en existencia sin foto propia. Propuesta: la tienda hace las fotos y Claude las sube. **Ernesto decide.**
    - **Los 3 productos nuevos de Maryta** (Ernesto: «súbelos a mano»):
      - **Estante 5 niveles EN LA WEB** (#3552, nx-18, 38 USD): 2 unidades (entrada 3 de Dayra y entrada 4 de Maryta, a 29), comisión de 3 USD. Se le avisó a Dayra, a Maryta y al General (#765–#767).
      - **Organizador con ruedas EN LA WEB (11:45)** (#3556; variaciones 3558 rosa, 3560 negro y 3562 blanco; caja `cv-3558/60/62`, grupo `cv-3556`), 30 USD, comisión de 3 USD en cada color.
        - Entrada 5 de Maryta: 5 blancos y 4 negros. Entrada 6 de Dayra: 5 rosas y 5 negros. Todo a 22 USD.
        - En la web quedaron rosa 5, negro 9 y blanco 5.
        - Fotos: el rosa es la foto real de Maryta con el fondo limpio (`gpt-image-1.5`, fidelidad alta). El negro y el blanco salen de esa foto, de referencia.
        - Se hizo por el camino del panel: Core `create_variable` (`~/entrada-maryta/crear-variable.php`), `nexo_business_variant_link`, `receive_goods_as`, `product_commissions` + `run_commission_push`.
        - Se le avisó a Maryta, a Dayra y al General (#770–#772). Maryta dijo 10 suyos y salen 9: se le preguntó.
      - **Organizador de baño:** está en la caja (nx-19, 25 USD) con 0 unidades. **No está en la web: falta la foto.** Se le pidió a Maryta.
    - **Organizador de baño (#3564):** se publicó con una foto hecha con IA a partir de un anuncio que mandó Maryta. **Lennys: «no se parece al real»** → retirado (privado) a las 12:03. Nana dice que falta el «estante de lavadora»: puede que sea este mismo producto. Hace falta la foto real.
    - **Decisión de Ernesto y Lennys (12:06–12:13):**
      - Claude sube y Lennys revisa DESPUÉS («esto está mal, corrígelo»): se arregla y se busca que no se repita, **sin parar el trabajo**.
      - Lo nuevo que pida Lennys queda pendiente «para Ernesto» y él lo ve antes de construirlo. Al agente del bot se le pidió que guarde esas notas.
      - En cada aviso de producto nuevo va la comisión.
    - **Cortina blackout (#158):** estaba privada por la sincronización vieja de BizneCubano (`_cvd_sync_hidden_from`) y tiene 4 unidades → **vuelve a la venta** (Lennys).
      - **Hay 82 productos más escondidos igual y con stock en la web** (p. ej. «Juego de Edredón 5 piezas Full», BLUETTI AC70, mesita de café, sartén).
      - Plan: cruzarlos con el conteo de Maryta y devolver a la venta los que existan.
    - **Peticiones de Lennys para Ernesto:**
      - varias fotos por producto (reales y promocionales);
      - «elegir 1 de 2» explicado en la web.

      Al agente web se le pidió hacer solo el **QR de «Mi tienda»**, que Niurka dice que no se lee; las otras dos esperan a que Ernesto las vea.
    - **Bot:** a Nana le mandó 12 fotos de productos cuando solo estaba contestando. Al agente del bot se le pidió arreglarlo.
    - **Idea de Ernesto, «Estudio de historias» y herramientas gratis en el centro de control:** ficha en `docs/productos/estudio-de-historias.md`, boceto enseñado. Espera el visto bueno.
    - **Permisos:** Ernesto cambió el modo a «Preguntar siempre» (el modo auto bloqueaba la web).
    - **Gestoras nuevas hoy:** Tania Cedeño (CV85TANIACED) y Melany Torres López (CV86MELTLOPE). El bot repetía la misma pregunta a Melany; se le mandó el enlace de registro a mano.
    - **Elegir entre 2 productos** (Nadielys): Lennys pidió una recomendación y se le mandó la propuesta (#773):
      - un vale «ELEGIR 1 de 2»;
      - lo que no se queda vuelve el mismo día y lo recibe la dependienta;
      - mensajería más la mitad por el regreso;
      - comisión solo por lo comprado;
      - 2 o 3 opciones como mucho.

      **DECIDIDO (11:51; Ernesto y Lennys de acuerdo):**
      - el cliente paga el producto que se queda más la **mensajería normal**, sin nada extra por el regreso;
      - **la dependienta, al recibir el pago, marca con cuál se quedó**.

      Ya está en el conocimiento #38, #47 y #42 (caso 1). Se le avisó a Nadielys (#775) y se cerró la pregunta `ptmur1lil`.

      **Falta en la web:** que el vale tenga la casilla «ELEGIR 1 de 2» y que la dependienta pueda marcar cuál se quedó. Hoy se pone en la nota.
    - **Google AI Studio** (la clave está en el `.env` del VPS como `GEMINI_API_KEY`): gratis da texto y visión (`gemini-3.1-flash-lite`). La búsqueda en Google y hacer imágenes no son gratis (429). La herramienta de fotos con OpenAI está en `scripts/fotos-bolsa/foto-ia.mjs`, con tope de 1 USD al día.
    - Tabla de los 250 «Bajo pedido» en `propuestas/bajo-pedido-departamentos-2026-10-13.csv` (Tecnología 142…).
    - Hay 18 productos «sin riesgo» que se pueden arreglar ya; el resto va **para Lennys** (mochilas, cortinas roller, puertas de corredera, soporte de TV, cojines…).
  - **Core 3.13.77 EN VIVO (13-oct, ~13:40; agente web): pestaña «Aprende»** (tutoriales). Ernesto aprobó el boceto: «Me gusta el boceto, construye… en el área de la gestora». Ficha: `docs/productos/zona-de-tutoriales.md`.
    - **Gestora** (`casaviva.company/area-gestoras/#aprende`): «Aprende» sale **justo debajo de Inicio**, con lo que lleva (por ejemplo «0/6»), mientras le falte algo. Cuando lo ve todo, baja al final de Herramientas. En «Para hoy» sale «Aprende: te faltan N de 6».
    - **Mensajero** (`/area-mensajeros/#aprende`): una 5.ª pestaña abajo, «Aprende». Es la 2.ª mientras le falte algo.
    - **La pantalla, igual que el boceto:**
      - Arriba: «MI ÁREA DE GESTORA · Hola, nombre», APRENDE, la frase y «N de M vistos» con barra.
      - Gestora, 6 pasos: 1 Tu primera venta · 2 Cómo compra tu cliente · 3 Fotos para publicar · 4 Tus dudas del primer día · 5 Cómo funcionan los pedidos (nota de voz de Ernesto) · 6 Guías rápidas (4 imágenes).
      - Mensajero, 2 pasos: Cómo funciona una carrera · Guía rápida del mensajero (2 imágenes).
      - Cada paso tiene ▶ (se ve ahí mismo) y «Marcar como visto» / «✓ Ya lo vi». El primero sin ver lleva «Te toca».
      - Debajo: «Dudas rápidas» (en el mensajero, «Lo que escribes») con las respuestas del boceto y «Escríbele al asistente por WhatsApp».
    - **Datos móviles:** nada se descarga hasta tocar ▶ (vídeos con `preload="none"`). Al terminar un vídeo o la nota de voz, se marca solo como visto.
    - **Medios:** la nota de voz (ogg, y una copia mp3 porque el iPhone no abre ogg) y las 6 guías ya están en la biblioteca de medios: adjuntos 3581–3588, guardados en la opción `cvd_aprende_media`. Los 5 vídeos son los de /tutoriales/ (2937–2941).
    - **Dónde se guarda lo visto:** en cada cuenta de la web, en la meta `_cvd_aprende`.
    - **Puerta nueva para el bot (agente de VivaBot; VivaBot NO se tocó):**
      - **Leer:** `GET https://casaviva.company/wp-json/casa-viva/v1/bot/aprende?phone=53XXXXXXXX` con la cabecera `X-VivaBot-Key` (la misma `CURRU_KEY` de siempre). Busca la cuenta de gestora o mensajero por los últimos 8 dígitos de su WhatsApp. Responde `{found, userId, programs, seen: {id: {at: ms, by: "web"|"whatsapp"}}, sent: {id: ms}, progress: {gestora: {done, total, next, cards}}}`. Si no la encuentra: `{found: false}`.
      - **Avisar de lo mandado:** `POST` a la misma dirección con JSON `{"phone": "53…", "sent": {"tutorial-primera-venta": 1760371200000}}` (el mismo formato `sent` de la bienvenida) o `{"phone": "53…", "ids": ["guia-gestoras-1-2"], "at": ms}`. Devuelve lo mismo, más `ignored` (los id que no conoce). Como mucho 50 id por llamada.
      - **Id válidos:** `bienvenida-voz`, `tutorial-primera-venta`, `tutorial-como-comprar`, `tutorial-fotos-para-publicar`, `tutorial-dudas-gestoras`, `audio-como-funciona-pedidos`, `guia-gestoras-1-2`, `guia-gestoras-3-4`, `tutorial-mensajero`, `guia-mensajeros`.
      - **Regla (D48):** lo que el bot manda por WhatsApp **cuenta como visto**, y en la web sale «enviado por WhatsApp». Si la persona lo desmarca en la web después, un envío más viejo no lo vuelve a marcar; uno nuevo, sí. Antes de mandar el siguiente paso, el bot debe mirar `seen` (no solo `sent`) para no repetir lo que ya vio en la web. «Guías rápidas» de la web marca las dos guías del bot (`1-2` y `3-4`).
    - **Probado por mí:**
      - Home, /tienda/ y /tutoriales/ dan 200. Las áreas sin sesión siguen llevando a la entrada. `wp eval` sin errores.
      - El área de una gestora real (Melany, solo lectura) sale con «Aprende» 2.ª en el menú, «0/6», 6 pasos y 5 dudas. La de un mensajero real (Hector, solo lectura) sale con sus 2 pasos.
      - Marcar y desmarcar por la ruta de la web, como la gestora de prueba (46): bien. Sin sesión da 401 y con otra área, 403.
      - La puerta del bot, desde el VPS con la clave real: lee, marca lo enviado y sin clave da 401.
      - Las cuentas de prueba quedaron como estaban.
      - En una vista previa de móvil con los estilos reales: ▶ abre el vídeo, la nota de voz y las guías, y pausa lo anterior. La barra y «Te toca» cambian.
    - **Falta:**
      - Que una gestora (Dany) lo pruebe en su móvil: tocar ▶ y «Marcar como visto». El guardado con la sesión real del navegador no lo pude probar yo; probé la misma ruta por dentro.
      - Que el agente del bot use la puerta.
      - Avisar al General cuando Ernesto diga.
    - **Copia y código:** copia en Hostinger en `~/bak-20261013-cvd-3.13.76-antes-3.13.77`. Commit Core `370053f` en `Casa-Viva` main.
    - **Deshacer (Hostinger):**
      1. `cp -a ~/bak-20261013-cvd-3.13.76-antes-3.13.77/. ~/domains/casaviva.company/public_html/wp-content/plugins/casa-viva-dropship-core/`
      2. `cd ~/domains/casaviva.company/public_html && wp litespeed-purge all`
      3. Los 4 archivos nuevos (`class-cvd-aprende.php`, `aprende.css`, `aprende.js`, `figtree-latin-400.woff2`) se quedan sin uso y no molestan, igual que lo guardado en `_cvd_aprende` y los medios.
  - **Core 3.13.78 EN VIVO (13-oct, ~14:00; agente web): la tienda ve la gestora y el mensajero de cada pedido.** Lo pidió Nana (dos veces el 12-oct y otra el 13-oct: «no me sale quién es el gestor que hizo la venta… en tienda debemos hacer esas anotaciones») y Ernesto dijo «pon un agente a resolverlo».
    - **Por qué no salía:** la web escondía a propósito la gestora a las dependientas (filtro de privacidad). Ahora la ven; lo que sigue escondido es la comisión.
    - **Dónde sale:**
      - **Pedidos** (`casaviva.company/ventas/`, la pantalla de Nana y Zaymi): en cada pedido, justo debajo de «Cliente», dos líneas nuevas: «Gestor/a: nombre · WhatsApp» (o «Venta directa (sin gestora)») y «Mensajero: nombre · WhatsApp» (o «Sin mensajero todavía», «Sin mensajero todavía · la gestora pidió a X», «Recogida en tienda»). El número abre su WhatsApp. En el buscador se puede escribir el nombre de la gestora.
      - **Mensajería** (`/mensajeria/`) y el centro del pedido: las mismas dos líneas.
      - **Avisos de pedido** (las alertas del teléfono de la tienda): antes abrían `/centro-pedido/`, una página que **nunca se creó** (daba error 404). Ahora abren el pedido en `/ventas/?cvd_order=N`. Solo los avisos nuevos; no lo probé con una alerta real en el teléfono.
      - **La caja (app)** no tiene pestaña de pedidos web, así que no hizo falta APK/EXE nuevo. **El panel de Lennys** ya enseñaba la gestora; el mensajero no sale ahí (no se tocó).
    - **Probado por mí:** como Nana (por dentro del servidor), #3567 da «Oliuska García Terry · +53 5818 3737» y «Pedri · +53 5386 5601»; #3551 da «Daymee Aguilera Varona · +53 5367 9634» y «Recogida en tienda»; sin comisión. Con el `sales.js` y los estilos reales (vista de móvil) la tarjeta del #3567 se ve bien. Las 12 últimas órdenes salen bien. Home, /tienda/, /ventas/ y /mensajeria/ dan 200. No se cambió ningún pedido, precio ni comisión.
    - **Avisada Nana** (14:06, #836 texto y #837 foto del #3567, sin preguntas de sí/no). Falta que ella lo confirme en su teléfono.
    - **Copia y código:** copia en Hostinger `~/bak-20261013-cvd-3.13.77-antes-3.13.78`. Commit Core `0d7eb81` en `Casa-Viva` main. Archivos: `class-cvd-sales.php`, `class-cvd-staff-privacy.php`, `class-cvd-order-center.php`, `class-cvd-delivery.php`, `class-cvd-web-push.php`, `sales.js`, `order-center.js` y la versión.
    - **Deshacer:** `cp -a ~/bak-20261013-cvd-3.13.77-antes-3.13.78/. ~/domains/casaviva.company/public_html/wp-content/plugins/casa-viva-dropship-core/` y `wp litespeed-purge all`.
  - **VivaBot EN VIVO (agentes, 09:41–10:09, último código `6203294`):**
    - **`a15bddc`:**
      - Los documentos (xlsx/pdf) que llegan por privado se guardan en `entrantes/AAAA-MM-DD/<tel>-<id>.<ext>` y Ernesto recibe «📎 …». **Comprobarlo con el Excel de Maryta.**
      - Las fotos entrantes se guardan ahora con el teléfono real (antes con el lid de WhatsApp) y con el día de Cuba.
      - Las listas largas o con un título de departamento preguntan antes de mandar fotos, y «para» las corta de verdad.
      - Ya no se contesta a mensajes que solo traen emojis o un sticker.
    - **`c28f9e2`:** recogidas con una foto por producto (hasta 4), con la del color comprado si la tiene. A Dany se le pidió repetir la prueba con 2–3 artículos (#744).
    - **`a1d45c1`:** regla de recogidas sin recoger: a las 24 h aviso a la gestora; a las 48 h se cancela (stock y comisión). Interruptor `recogidas_auto = prueba`, que solo le dice a Ernesto lo que haría; el primer aviso de prueba sale el 14-oct a las 10:00 (#2969). Para pasarlo a `si`, hay que comprobar que la clave REST de WooCommerce del bot sea de lectura y escritura (al agente le bloquearon la consulta).
    - **`f1cfc56`, `a24d63a`, `6203294`:**
      - Reglas para no inventar cosas del equipo, la tienda o el sistema, ni prometer plazos.
      - Los colores y tallas que quedan se leen del stock de la web.
      - La búsqueda encuentra plurales («edredones») y ya no la llenan los «Bajo pedido».
    - **`7873a47`, `a3e3825`** (agente de carreras): Isabel y Elaine → Pedri, automático con `crm_settings mensajero_por`. Además, «pásasela a X» para cualquier mensajero y el aviso 🔧 de armado en la carrera del grupo y en el vale.
    - El #2945, el #2946 y el #2947 ya estaban entregados y cobrados en el Core: se cerraron en `crm_dispatch` y se le avisó a Pedri (#743).
  - **Stock que no cuadra:** según la web, del edredón camero quedan blanco 2 y gris 1 (rosado y azul agotados). Lennys dijo «full: azul, rosa y blanco». Ahora el bot contesta con lo que dice la web, así que **el stock de la web tiene que estar al día** (el cierre de Maryta).
  - **Pendiente:** la cola de preguntas de las 10:00 tiene que comprobar si alguien del equipo ya contestó en el grupo.
  - **Armado: mensajes para los grupos General y Mensajerías redactados, esperando el sí de Ernesto** y saber si el dinero del armado es para el mensajero.
  - **Niurka:** dice que hay competencia nueva en Baracoa (una tienda virtual) y preguntó por la «vigencia de los pagos» si comparte el enlace en la Isla de la Juventud. Ernesto: «yo me encargo».
- **Fotos de los 412 bloqueados de Kevin:** Ernesto pidió buscarlas en internet. Un agente hace un estudio y un piloto de 20, con tope de 3 USD y sin publicar. Informe en `fotos-productos/INFORME-FOTOS-INTERNET.md`.
- **Digital Store (Kevin):** catálogo de 682 artículos importado a la bolsa (`/root/archivos/digital-store-catalogo-2026-10-12.json`).
  - **Fotos y fichas a escala (12-oct, 21:50–23:30, 2,40 USD de OpenAI):** 269 listos (fotos 1200×1200 blancas en Storage + título y descripción nuevos), 412 bloqueados por falta de foto. **Nada publicado.** Informe: `docs/nexo-business/fotos-productos/INFORME-ESCALA.md`.
  - **Revisión de Claude de las 13 hojas (23:50):** quité 13 por foto mala (texto o logo encima, collage, laptop vista por debajo, base en vez de consola, «Celular» que son gafas VR): 605, 610, 616, 686, 792, 810, 890, 904, 961, 991, 998, 1002, 1049. En Supabase quedan `photos_ok=false` con `photos_quality.bloqueado`. **Quedan 247 para aprobar.** 7 dudosos marcados para Ernesto (562, 530, 681, 685, 956, 637 y 968, la pistola de juguete realista). Lista: `fotos-productos/hojas/revision.json`.
  - **PUBLICADOS los 247 (12-oct, 23:34–00:05, Ernesto: «ok todas», la pistola también):** 0 fallos. Están en «Bajo pedido» (https://casaviva.company/categoria-producto/bajo-pedido/, 250 productos en total). Comprobé 5 páginas al azar: 200, con foto y precio. Lista de enlaces: `docs/nexo-business/fotos-productos/publicados-2026-10-12.md`.
  - **Pendiente:** los 9 posibles repetidos y los 412 bloqueados por foto (pedir fotos a Kevin); en los Samsung A17, saber si son 4G o 5G.
  - **Cómo se publicó:** cuando Ernesto diga «ok hoja N» en el chat de Claude → en el VPS `cd /root/vivabot && node scripts/fotos-bolsa/publicar-hoja.mjs --hoja N [--quitar a,b] --ok`. Hace lo mismo que APRUEBA en el «Tú», sin mensajes ni temporizadores. Sin `--ok` solo mira; se niega con lo que no esté en las hojas revisadas. Prueba en seco: 247 listos, 0 problemas. **Publica visible** en «Bajo pedido». Registro: `/root/archivos/fotos-bolsa/publicados.jsonl`.
- **Redes:**
  - **Reel:** «Se fue la corriente» (`videos/curru-tienda/reel-apagon/casa-viva-reel-apagon.mp4`, unos 118 créditos).
  - **Historias:** 5, rehechas con el manual de marca y sin tapar caras.
  - **Logos:** oficiales (`redes/logo-*.svg`), con el perfil y la portada hechos a partir de ellos.
  - **Skill:** `reel-casa-viva`. Guía en `redes/GUIA-REDES.md`.
- **Página de Facebook «Casa Viva»** (ya existía: `facebook.com/profile.php?id=61582869072998`, 8 seguidores; Ernesto dijo usar esa):
  - **Marca:** foto de perfil = isotipo crema sobre petróleo; portada = logo horizontal oficial + foto de la tienda.
  - **Presentación nueva** (aporta valor, sin vender): «Soluciones para tu casa en La Habana…».
  - **Enlace:** casaviva.company. Antes era casavivadecuba.com, que no responde.
  - **Dirección corregida:** Calle 45 esq. a Conill A, #864.
  - **Publicado el 12-oct ~15:25:** el reel «Se fue la corriente» (texto con 3 trucos para el calor del apagón, sin vender) y las 5 historias. Todo con **etiqueta de IA** (Cúrru es generada).
  - **Falta (Ernesto):**
    - el botón y el número de WhatsApp (Facebook manda un código a ese WhatsApp);
    - el horario (pide primero «dirección comercial»);
    - revisar el teléfono +1 913-388-5376 y el correo somos@casavivadecuba.com que siguen en la página;
    - crear el Instagram y conectarlo.
  - **Para subir videos:** el subidor del navegador acepta como mucho 10 MB, por eso se usó una copia comprimida: `reel-apagon/casa-viva-reel-apagon-fb.mp4`.
- **Disco C:** se movió a D: Videos, Música y Descargas (lista en `D:\ERNESTO\movido-de-C-2026-10-12.txt`).

### L4. Martes 13-oct tarde — Bajo pedido en 24 horas (D47) EN VIVO
**Qué es:** cuando entra un pedido de la web con un producto «bajo pedido», el bot hace solo todo el camino: pregunta al proveedor, lleva el reloj, le contesta a la gestora en menos de 1 hora, le pasa al proveedor los datos para entregar y apunta lo que el proveedor nos debe. Diseño: `docs/productos/bajo-pedido-24h.md`. Decisión: D47.

- **En vivo desde las 14:24** (VivaBot `483b9fb` + `e136de1`, reiniciado con `cv reiniciar`). Interruptor `crm_settings bajo_pedido_auto` = **`si`**.
- **SQL aplicado** en nexo-production (`vivabot/supabase/024_bajo_pedido_24h.sql`; incluye el 022 de la ficha, que nunca se había pegado). No hace falta que Ernesto pegue nada.
- **Fichas rellenas** (FICHA … para verlas): Digital Store (Kevin) 5354410879, Sergio Hernández 5358474247 y LJH 5353847951 (= «Electro»): **lo llevan al cliente y cobran ellos**, horario 9:00–17:00. **TRD 42 y 23** (Calle 42 y 23, Playa, 9:00–17:00): sin WhatsApp, **se recoge** y paga Ernesto. Los productos de la TRD tienen que entrar en la bolsa con el vendedor «TRD 42 y 23» (o «TRD 23 y 42», «Tienda 23 y 42»…): así el bot sabe que es esa tienda.

**Cómo funciona un pedido (lo hace el bot solo):**
1. **Al proveedor, al momento**, si está en su horario: «¿Lo tienes disponible?». Si no tiene WhatsApp (TRD), te lo pregunta **a ti** y contestas *HAY #N* o *NO HAY #N*.
2. **A la gestora:** «ya le pregunté al proveedor… te confirmo en menos de 1 hora». Fuera del horario del proveedor: «**te lo confirmamos mañana a las 9**». A gestoras y clientes solo de 9:00 a 20:00.
3. **Reloj:** a los 20 min recordatorio al proveedor · a los 40 min pregunta a **otro proveedor que tenga el mismo artículo** (el más rápido y fiable primero) · a los 55 min a la gestora «seguimos confirmando» y a ti un aviso. Si no contesta en el día, al día siguiente a las 9 se le vuelve a preguntar.
4. **Sí:** a la gestora «✅ confirmado: lo lleva <proveedor>, te avisamos cuando lo entregue» **con su comisión**. Al proveedor que lo lleva: nombre, teléfono y dirección del cliente, qué cobrar en USD y en CUP (tasa del día) y la mensajería (es suya); que conteste *entregado #N*. Si es de la TRD: va a **tu ruta**.
5. **No:** si otro proveedor tiene lo mismo, se le pregunta antes; si no, a la gestora le llegan los parecidos y **el pedido espera lo que ella diga. Nunca se cancela solo.**
6. **«entregado #N»** del proveedor: aviso a la gestora («tu comisión queda pendiente del cierre de caja»), la cuenta pasa a «nos debe» y te llega cuánto.
- Avisos **solo a la gestora**; al cliente solo si compró directo en la web. **Nunca a grupos.** Pedidos de prueba de la web: no se escribe a nadie.
- Pedidos con productos de la tienda, de varios proveedores, de recogida en tienda o de un proveedor sin ficha: el bot confirma, pero **la entrega la coordinas tú** (te lo dice).
- Mientras un proveedor lleva un pedido nuestro, lo que escriba te llega a ti y la IA no le contesta (con proveedores solo disponibilidad y entrega).
- El bot **aprende** cuánto tarda cada proveedor y cuántas veces dice que sí (se ve en su FICHA).

**Órdenes en tu chat «Tú»** (*BAJO PEDIDO* las enseña todas):
- *BAJO PEDIDO* → resumen (llega solo cada día a las **8:30**: «Hoy recoges en: TRD 42 y 23 · abre 9:00 · lleva X USD · pedidos #…», pedidos abiertos con su reloj y lo que debe cada proveedor). *BAJO PEDIDO #N* → un pedido.
- *HAY #N* / *NO HAY #N* → contestas tú por el proveedor. *ENTREGÓ #N* → lo entregó el proveedor. *RECOGÍ #N* → ya lo recogiste en la tienda (luego, como siempre: «Listo» y sale al grupo de mensajeros).
- *PAGÓ Sergio 85 USD* · *PAGÓ Sergio 3570* (sin moneda: si no cabe en lo que debe, son CUP a la tasa del día; el bot te dice cómo lo entendió) · *DESHAZ PAGO n*.
- *CUENTAS PROVEEDORES* → quién nos debe. *CUENTA Sergio* → borrador del resumen para él (**no se manda solo**); *CUENTA Sergio MANDA* → se lo manda.
- *FICHA 5358474247 horario: 9-17; lleva: sí; cobra: proveedor; acuerdo: …; dirección: …* · *FICHA TRD 42 y 23 horario: 9-16* · *FICHA NUEVA Tienda 4ta y 3ra; horario: 9-17; lleva: no; cobra: casa viva; dirección: …* → cada tienda nueva es solo una ficha.

**Pruebas hechas (yo):** 22 pruebas nuevas en `npm run check` (local y en el VPS), con pedidos simulados de principio a fin: Sergio lo lleva (reloj 20/40/55, LJH como segundo proveedor, sí, entrega, cuenta, pago en CUP, deshacer); TRD de noche en modo prueba (a las 9 te pregunta, HAY, ruta, RECOGÍ); pedido a las 18:00 («mañana a las 9») y agotado con parecidos; cliente directo; pedido con productos de la tienda; pedido de prueba y pedido cancelado. Además, **simulación con los datos reales** en el VPS sin escribir a nadie (fichas, bolsa, tasa 785, WhatsApp de la gestora): `node scripts/bajo-pedido-simula.mjs --item 584 --reloj --responde si --entrega`. **Falta verlo con un pedido real** (hoy no hay ninguno abierto con productos bajo pedido).

**Para deshacer:**
- Pararlo: escribe *BAJO PEDIDO NO* (solo te avisa de cada pedido y tú escribes al proveedor) o *BAJO PEDIDO PRUEBA* (todo te llega a ti como vista previa). Sin reiniciar nada.
- Apagar todo lo bajo pedido del bot: `BAJO_PEDIDO=0` en el `.env` del VPS + `cv reiniciar`.
- Volver al código de antes (casi nunca hará falta: basta con *BAJO PEDIDO NO*): revertir en VivaBot los commits `483b9fb` y `e136de1`, empujar a `main` y `cv reiniciar`. Las tablas nuevas (`crm_supplier_ledger`, `crm_supplier_payments`, `crm_supplier_responses`) no molestan si no se usan.

**Preguntas para Ernesto:**
1. **Comisión de la gestora en pedidos que cobra el proveedor:** con la regla de hoy se aprueba con «entregado + dinero confirmado». Aquí el dinero llega cuando el proveedor nos paga nuestra parte, así que la comisión espera a ese pago (y a que alguien cierre el pedido en Ventas). **No lo cambié.** ¿Así, o se aprueba al entregar?
2. **Cerrar el pedido en la web:** el bot no lo marca como entregado en Core; queda abierto hasta que se cierre en Ventas cuando el proveedor pague. ¿Lo cierra Lennys, tú, o quieres que lo haga el bot con *PAGÓ*?
3. **Horarios reales** de Kevin, Sergio, LJH y la TRD (puse 9:00–17:00 a todos). ¿Abren sábado y domingo? (el bot todavía no distingue días).
4. **Sergio:** ¿se pactó ya que se quede todo y nos pague solo nuestra parte? (está así en su ficha como «se puede pactar»).

### L5. Martes 13-oct tarde (Claude Code, sesión principal): enlaces de gestora, fotos por color y bienvenida corregida

**Inventario para el 14-oct (agente, commit `a1964f4`):** hoja `docs/nexo-business/entradas/conteos/conteo-escondidos-2026-10-14.xlsx` con los 153 escondidos (137 con existencias arriba; copia en el VPS en `/root/archivos/conteos/`), origen propuesto en `origen-propuesto-2026-10-14.csv` (201 de tienda, 261 de proveedor con categoría «Bajo pedido» y SKU `MK-`, 9 dudosos: colchones EDSM y Dawang) y `LEEME-2026-10-14.md` con 3 preguntas para Maryta. No se ha mandado nada a nadie. El cambio de existencias de 583 y 412 a las 21:59 fue la cancelación del #3668.

**Noche 13-oct, 22:00–22:45:** pedido de prueba de Lennys #3668 cancelado (marcado como prueba; volvieron las existencias). **Core 3.13.95** (commit Casa-Viva `4e65fdc`): los productos «Privado» no salen en la web ni para administradores; probado como administrador: 471 publicados y 0 privados. Organizador de 2 niveles (2485) sin existencias porque está roto según el conteo de Maryta. Plan para empezar limpio, con los errores del día, el inventario y lo pendiente: `docs/nexo-business/plan-2026-10-14-empezar-limpio.md`.

**Noche 13-oct (18:40–20:30), lo último:**
- **Redes:**
  - El reel del apagón v2 salió en Instagram a las 19:01 **sin** la línea de IA.
  - El reel de las sábanas v2 salió a las **20:17** en Facebook e Instagram (enlaces en `redes/publicaciones.json`). Lo de las 20:00 no se pudo, porque la pestaña de Meta estaba detrás de otra.
  - **Salió sin pie de foto:** Business Suite lo borra al volver al paso 1 con la pestaña en segundo plano. Ernesto lo pone desde el teléfono.
  - **Al General**, ya como costumbre (GUIA-REDES 4b): #893 a las 19:06 y #899 a las 20:24.
- **Resumen de las 20:00:**
  - **Notas del día** en `/root/archivos/resumenes/notas-AAAA-MM-DD.json`. Las usa `resumen-noche.sh` si existen (copia `.bak-20261013`).
  - **Orden de las secciones:** las nuevas van antes de «Mañana» (VivaBot `d0c1ba6`).
  - **Envíos:** #895–#897.
- **Auditoría (agente):** Core 3.13.88–3.13.94, ver D52 y `docs/productos/auditoria-cliente-2026-10-13.md`.
  - **Probado por mí:** v3.13.94; `/tienda/` lleva a wa.me/5354056173 y con `?ref=CV36THALYHG0` a Thaly (5358412987); `/seguimiento/` responde 200.
- **Estudio de historias:** boceto para el móvil en https://claude.ai/artifact/39iqtUztgVVoVJRCdVA1DC. Espera el sí de Ernesto.
- **Lecciones de Business Suite con la pestaña en segundo plano:**
  - Escribir con el teclado no llega al cuadro de texto.
  - Pegar con un evento `paste` sí funciona.
  - Al volver a un paso anterior se pierde el pie.
  - «Recargar» no recarga si hay un borrador: primero hay que hacer «Cancelar» y «Descartar cambios».
  - La miniatura no carga.

**Enlace de la gestora (Core 3.13.79 y 3.13.80, en vivo, commits `f207f7c` y `558f9a0`).**
- **El problema:** Thaly abría su enlace y el organizador con ruedas salía a 30 en vez de su precio de 35.
- **Causa 1:** la web guardaba en el navegador, durante 400 días, la primera gestora por la que se entró, y esa ganaba a cualquier enlace posterior. Pasaba en el teléfono de Thaly y en el de Ernesto.
- **Arreglo 1 (D50):** ahora **manda el último enlace**, para el precio y para la venta. El cliente que ya compró sigue siendo de su gestora, porque eso lo decide su teléfono o su correo (`resolve_and_attach`).
- **Causa 2:** al buscar, o al tocar «Inicio», «Comprar» o «Carrito» en la barra de abajo, se perdía el `?ref=`.
- **Arreglo 2:** `gestora-store.js` lo añade al hacer clic y al buscar.
- **Probado** en un navegador limpio: buscar «organizador ruedas» → ficha a 35 → carrito a 35. Thaly lo confirmó a las 14:30 («Ya»).
- **Para volver atrás:** copias en `~/bak-20261013-cvd-3.13.78-antes-3.13.79` y `~/bak-20261013-cvd-3.13.79-antes-3.13.80`.

**Core 3.13.81 (en vivo 15:05, commit Casa-Viva `938f0ea`): el pedido se guarda al precio que se ve al pagar.**
- **El problema (pedido #3598 de Thaly, 14:35):** la pantalla de pago decía 140 USD (4 × 35), pero el pedido se guardó a 120 (4 × 30).
- **Causa 3:** al pulsar «Todo bien, finalizar», el formulario manda `_wp_http_referer`, una ruta sin dominio, y WordPress la usa antes que la cabecera Referer. La web la descartaba, así que no veía a la gestora y cobraba el precio de Casa Viva. Reproducido en el servidor con `wp eval-file`.
- **Arreglo 3:** `referral_from_referer()` acepta rutas de esta web y, si no traen código, mira la cabecera Referer.
- **Arreglo 4:** `relock_cart()`. Al entrar por el enlace de una gestora, lo que ya estaba en el carrito pasa a su precio (Thaly tenía los organizadores en el carrito desde antes, a 30). Usa la misma clave que al añadirlo desde su tienda, así que no salen líneas repetidas.
- **Probado** en un navegador limpio: añadido sin enlace a 30 → carrito por su enlace a 35 → otra unidad desde su tienda, misma línea ×2 a 35 → pago 70. Sin pedido. Simulación del envío al finalizar: 35 con su enlace; otra web y tienda general, 30.
- **#3598 corregido con el sí de Ernesto:** 140 USD, comisión de Thaly 32 USD (12 de base + 20 de subida), vale rehecho y nota en el pedido. Avisados Pedri (cobra 140 USD + 1.500 CUP), Nana, Zaymi (Ernesto no quería avisar a Zaymi, pero el mensaje ya había salido) y Thaly.
- **Para volver atrás:** `~/bak-20261013-cvd-3.13.80-antes-3.13.81`.
- **Dayra #3599 (15:04):** no estaba perdido. Salió al grupo de Mensajerías a las 14:50 y lo cogió Fernando Santana (…4881; en el grupo sale como «Ibelice»). Dayra no lo veía porque no está en ese grupo, y el bot no le avisa porque su contacto está en `ignorar`. Se le explicó y a Fernando se le recordó «antes de las 4».

**Fotos por color, gratis con Gemini, desde el Chrome de Ernesto.**
- AI Studio (Nano Banana) **no es gratis**: pide plan de pago. La app gemini.google.com **sí** edita fotos con la cuenta gratis.
- **Hecho:** las sábanas Majestic (2491) ya tienen foto propia en sus 9 colores (adjuntos 3589–3597). Al elegir el color en la web, cambia la foto. Los archivos están en `docs/nexo-business/fotos-productos/colores/`.
- **Pendiente:** quedan 33 productos con 105 colores sin foto propia.
  - Los lisos se hacen igual: fundas y mantas Majestic, alfombras y edredones.
  - Los estampados necesitan foto real: el set de baño de 28 USD (2573) ya se le pidió a Nana y Zaymi con `cv preguntar`, para Thaly. También la manta estampada, el paraguas estampado y la cortina con diseño.
- **De noche:** el camino gratis necesita la PC encendida. En el VPS haría falta OpenAI, a unos 0,01–0,04 USD por foto. Ernesto decide.

**Bienvenida de nuevos (VivaBot).**
- Se encendió a las 13:14 y Ernesto la mandó parar a las 13:22, porque era el mismo audio a 8 personas en 2 minutos, algunas ya activas. Está en `onboarding = no`.
- **Corregido** (commit `c0a8306`):
  - solo altas nuevas;
  - nada a quien ya trabaja o recibió un mensaje del equipo en las últimas 48 h;
  - una nota de voz con el nombre de cada persona, comprobada con Whisper;
  - como mucho 1 cada 5 minutos;
  - las órdenes («mi acceso»…) van siempre primero.
- Ernesto la vuelve a encender después de ver *BIENVENIDA PRUEBA gestora 2*.

**Bot (VivaBot, commits `74f0a92` y `ecd5402`).**
- La tienda (dependientas) recibe la ficha real de cualquier pedido. Antes la IA se inventó dos veces la gestora en el chat de Nana.
- A quien no tiene etiqueta de género le dice «gestor/a».

**Otros:**
- Se publicaron 5 productos de Kevin que pasaron la doble revisión automática.
- El video «Tus dudas del primer día» ya está en `/root/archivos/tutoriales/`.
- La guía 3 dice «hasta un 30 %», cuando la regla es «sin tope»: está fuera de la bienvenida hasta rehacer la imagen. No se encontró la fuente de las guías.

**Tutoriales pendientes de hoy:** «Aprende» y «Tu precio». Ver `docs/nexo-business/tutoriales/pendientes-2026-10-13.md`.

**La web ya no dice solo «gestora» (Core 3.13.82, en vivo, commit Casa-Viva `a93f043`).**
- **Por qué:** Fernando preguntó «¿no hay gestores o solo son mujeres?». Ernesto: «Gest@r o algo así».
- **Ahora dice:** «gestor/a» para una persona y «gestores» para varias. Donde se lee mejor, «quien vendió» (por ejemplo, en Pedidos de la tienda: «quien vendió pidió a Pedri»).
- **Dónde:** títulos de páginas («Registro de gestores», «Gestores», «Gestores · Acceso»), registro, «Mi cuenta» (pestaña «Gestores»), el área («MI ÁREA DE GESTOR/A», «Invitar gestores»), «Aprende», Pedidos y Ventas de la tienda, correos, notas de los pedidos y administración. También `/tutoriales/` («Para gestores») y `/ayuda/` («🧑‍💼 Gestores»).
- **No cambió nada de dentro:** las direcciones siguen igual (`/registro-gestora/`, `/area-gestoras/`), y el bot y el panel funcionan como antes.
- **El tema** (`casa-viva-storefront`, solo existe en el servidor) también se tocó: 3 textos de «Mi cuenta».
- **Comprobado:** las páginas dan 200 y en el texto visible ya no sale «gestora» (solo queda dentro de la dirección `registro-gestora`).
- **Para volver atrás:**
  - Core: `~/bak-20261013-cvd-3.13.81-antes-3.13.82`.
  - Tema: `~/bak-20261013-tema-functions-antes-gestores.php`.
  - Páginas: `~/bak-20261013-pagina-2942.html` y `~/bak-20261013-pagina-2815.html`.
- **Falta (no se tocó):** el panel de Lennys (`/panel/`) todavía dice «gestoras». Y `/ayuda/` sigue diciendo «hasta un 30 %», cuando la regla es «sin tope»; no se cambió porque es una regla de comisión.

**Fotos de BizneCubano (en vivo 17:05, Claude, con el sí de Ernesto: «sigue con lo de BizneCubano»).**
- **Qué se hizo:** las fotos de galería que había en BizneCubano y nunca se copiaron a la web ya están en la galería de su producto. **57 fotos en 33 productos** (adjuntos 3611–3667).
- **Colores:** 4 variaciones tienen ahora su propia foto. Manta 180×200 lisa (#2497): gris, salmón y carmelita. Manta 240×260 lisa (#2499): rojo.
- **Cómo se eligieron:**
  - De 242 fotos, 129 ya estaban en la web (a veces recortadas): no se repitieron.
  - Las demás las revisó Gemini 3.1 flash-lite (gratis): que sea el producto, nota 7 o más, sin texto, precio, teléfono, logo, captura ni collage.
  - 19 fotos tenían solo un texto o un círculo en una esquina: se recortó esa parte (sin IA de imagen) y se revisaron otra vez. Pasaron 14.
  - Se dejaron a 1200×1200 sobre blanco, sin inventar nada.
  - Un color solo se puso cuando no había duda. Las mantas estampadas (#2471) tienen varios «rosado», y en #2497 hay 2 azules: eso lo decide Lennys.
- **No se publicaron 56 fotos:** texto o medidas encima, collage, foto de la caja o del manual, nota baja, 3 con precio, una repetida y una pequeña. El motivo de cada una sale en la hoja de dudosas.
- **Para que Lennys lo revise (después de publicar, como pidió Ernesto):**
  - `docs/nexo-business/fotos-productos/biznecubano/publicadas-2026-10-13.jpg`.
  - `docs/nexo-business/fotos-productos/biznecubano/dudosas-2026-10-13.jpg`.
- **Comprobado:** en las 33 páginas públicas salen las 57 fotos y las 4 fotos de variación.
- **No se tocó:** precios, existencias, textos, ni las fotos principales. Tampoco la sobrecama 118 ni las sábanas 2491.
- **Para volver atrás:** `docs/nexo-business/fotos-productos/biznecubano/cambios-2026-10-13.json` guarda la galería y la foto de cada variación de antes. Los adjuntos llevan la marca `_cvd_bc_src`. Borrarlos solo con el sí de Ernesto.

**La portada vende, como Temu (Core 3.13.83, en vivo ~17:45, commit Casa-Viva `c58c32f`; D51).**
- **Por qué:** Ernesto, 17:10, con 2 capturas: «Esto está de más… no lleva a ninguna compra… como en Amazon o Temu, Shein».
- **Se quitó de la portada:** la caja «¿Vives fuera de Cuba?» de 3 pasos, las 3 tarjetas grandes (entrega, pago, WhatsApp) y los círculos de categorías. Las páginas a las que llevaban siguen igual.
- **Ahora sale, en este orden:**
  - fichas de departamentos y buscador;
  - «Lo más vendido» de esta semana, por pedidos reales;
  - una franja fina de una línea: entrega en 24 h, efectivo/Zelle/transferencia y WhatsApp;
  - «Recién llegados»;
  - «Regala a tu familia», en una línea;
  - «A buen precio»: rebajas y lo de 15 USD o menos;
  - una fila por departamento con «Ver todo».
- **Cada tarjeta:** foto, precio en USD y en CUP con la tasa del día, «Últimas unidades» si quedan 1 o 2, «Bajo pedido · llega en 24 h» y botón «Añadir» o «Elegir». Los agotados no salen.
- **El pie** ya tiene el logo en crema y se lee bien, en toda la web.
- **Tienda de gestor o gestora:** con `?ref=` sale su precio. Probado: el organizador con ruedas sale a 35 en la tienda de Thaly y a 30 en la de Casa Viva. Esa página no se guarda en caché, igual que `/tienda/?ref=`.
- **Probado en un navegador:** «Añadir» abre el carrito con el precio correcto. El artículo de prueba se quitó del carrito.
- **Se mide con un contador sin datos personales:** `wp option get cvd_home_stats --format=json` (visitas, toques, «Añadir» y «Ver todo» por fila).
- **Capturas** antes y después, a 390 px: `docs/productos/home-que-vende/`. Ficha: `docs/productos/home-que-vende.md`.
- **Para volver atrás:**
  - al momento: `wp option update cvd_home_rails no` + `wp litespeed-purge all` (probado);
  - todo Core: `~/bak-20261013-cvd-3.13.82-antes-3.13.83`.
- **Para Ernesto:**
  - «Últimas unidades» sale en 1 de cada 3 tarjetas: ¿se deja así o solo cuando queda 1?
  - El soporte de TV y la puerta de corredera están en Cocina: lo decide quien revise las categorías.

**Reel del día 13-oct «¿Tus sábanas huelen a guardado?»** (subagente de Claude Code, ~18:05 Cuba). LISTO, SIN PUBLICAR: lo programa la sesión principal para las 20:00 en Business Suite.
- **La idea:** un truco de abuela que se manda a la familia. Cúrru guarda el juego de sábanas dentro de su propia funda con un jaboncito de olor. Proskopellin la abraza: «¡Huele a casa de abuela!». No vende nada. Ernesto pidió a las 17:20 que salieran Cúrru y Proskopellin y aprobó gastar créditos de Higgsfield.
- **Archivos** (en `videos/curru-tienda/reel-funda/`):
  - `casa-viva-reel-funda.mp4`: 12,0 s, 1080×1920, 30 fps, −14 LUFS, 10,6 MB;
  - `casa-viva-reel-funda-fb.mp4`: 6,6 MB, para subir desde el navegador;
  - `portada.jpg`: la portada;
  - `pie.txt`: el texto para publicar;
  - scripts: `montaje.mjs` + `config.json` y `limpiar-broche.mjs`.
- **Créditos:** 55 (imagen de arranque 1 + Seedance 2.0 de 12 s 54). Quedan unos 978. Trabajos: arranque `22f75749-b5f5-4151-8583-e749cc8e3aef`, escena `1aeb6cfb-17c4-4fa1-8045-dedb07a9ae2c`. Salió bien a la primera.
- **Revisado:**
  - Whisper sobre el archivo final dice el guion exacto;
  - fotogramas cada 1,5 s: caras iguales y manos bien.
- **Arreglado:** Seedance le puso a Cúrru un broche con letras en la blusa. Se borró fotograma a fotograma con `limpiar-broche.mjs`; en el último plano se recorta con el zoom.
- **Reglas nuevas de Ernesto:**
  - texto gancho desde el fotograma 0;
  - portada propia en cada reel, con lo importante dentro del 3:4.
  - Están en `videos/curru-tienda/redes/GUIA-REDES.md`, junto con las mejores prácticas 2026 con fuentes y el plan «Cómo moverlo sin hacer spam», y en las Lecciones de la skill `reel-casa-viva`.
  - Herramienta para la portada: `redes/portada.mjs`.
- **Portada del reel de ayer:** `videos/curru-tienda/reel-apagon/portada-v2.jpg`, con «¿Cuántas horas sin corriente llevas hoy?».
- **v2 del reel, 18:33.** A Ernesto le gustó la v1 y pidió más movimiento, música y efectos sin gastar. Costó 0 créditos.
  - **Archivos:** `casa-viva-reel-funda-v2.mp4` (12,0 s, 12,7 MB) y `-v2-fb.mp4` (6,5 MB).
  - **Movimiento:** 2 acercamientos rápidos a la cara en los primeros 2,5 s, hechos con HyperFrames (proyecto `reel-funda/hf/`). Destello crema suave en los 4 cortes.
  - **Música:** son cubano propio, sintetizado con `musica.mjs`. Va unos 19 dB por debajo de la voz y baja más cuando hablan.
  - **Efectos:** pop, click y whoosh de la biblioteca de Pixabay, de uso comercial libre.
  - **Revisado:** Whisper exacto, −14 LUFS y fotogramas.
  - El servicio de música de pago tiene 0 créditos y Higgsfield no hace música suelta: por eso la música es propia.
- **Regla de Ernesto, 18:35:** ningún aviso de IA en el texto ni en pantalla. Está en GUIA-REDES y en la skill.

**Cúrru ya no tapa la web y auditoría de cliente en el teléfono (Core 3.13.84–86, en vivo 17:59–18:12, commit Casa-Viva `b0849ee`).**
- **Por qué:** Ernesto, 17:22: «Cúrru está metida en el medio en muchas pantallas, corregir eso y auditar lo que no funcione para el cliente».
- **Cúrru:** ahora es un solo botón pequeño «Ayuda» (cara + palabra), abajo a la derecha. En el móvil ya no está el círculo verde de WhatsApp: WhatsApp va dentro de Ayuda, con la gestora si se entró por su enlace.
  - En la ficha no sale hasta pasar los botones de compra.
  - Se aparta al bajar, al escribir y cuando taparía un botón o un precio.
- **Ficha:** nombre más pequeño; foto, precio y «Añadir al carrito» en la primera pantalla. Barra de compra opaca (se acabó el texto fantasma).
- **Comprar ahora:** sin color elegido lleva a elegirlo; antes recargaba con error.
- **Tienda y búsqueda:**
  - los precios se ven sin bajar;
  - los nombres ya no salen en MAYÚSCULAS;
  - la ventana de ofertas ya no se abre sola en el teléfono (robaba el toque).
- **Solo presentación:** no cambió precios, existencias, comisiones ni pedidos.
- **Informe** con 23 problemas, capturas de antes y después, y 11 propuestas: `docs/productos/auditoria-cliente-2026-10-13.md`. Las más importantes:
  - errores 500 cuando entran varios a la vez;
  - el WhatsApp de la ficha, del pie y del inicio no va a la gestora en su tienda;
  - páginas de ~1,5 MB.
- **Para volver atrás:** `~/bak-20261013-cvd-3.13.83-antes-3.13.84`.
- **No hecho:** «Últimas unidades» solo con 1 unidad en la portada (`LOW_STOCK` de 2 a 1 en `class-cvd-home-rails.php`, línea 33). El permiso se denegó al tocar ese archivo y falta el sí de Ernesto en el chat.

**Auditoría de cliente, segunda tanda (Core 3.13.88 → 3.13.94, en vivo 18:50–20:05; agente de Claude Code; D52).**
- **Por qué:** Ernesto, 18:40: «usamos el wp de la gestora en toda su tienda, arregla todo lo de la auditoría en segundo plano también… lo del plan de Hostinger lo vemos pendiente».
- **3.13.88 (`3fc0d0e`), D52:** en la tienda de una gestora, todo WhatsApp va a ella:
  - pie, botón verde, «Pedir por WhatsApp» de la ficha, Ayuda;
  - Atención al cliente, Formas de pago, Condiciones de mensajería, `/contacto/`;
  - «Corrige tu pedido».
  - En la ficha, el texto nombra el producto con su precio. Sin gestora, Casa Viva.
  - **Tocado fuera del repo** (solo en el servidor): `footer.php` del tema y `casa-viva-marca.php`.
- **3.13.89 (`83a6cc7`):**
  - ver el pedido sin cuenta: `/seguimiento/` con número + teléfono, «Ver mi pedido» al terminar la compra, «Pedidos» de la barra de abajo;
  - «Armado por el mensajero» solo si el carrito trae algo que se arma (20 productos hoy; el equipo lo ve siempre);
  - «Regala a tu familia» en una línea debajo de la descripción (cambio en `casa-viva-marca.php`);
  - `/ayuda/` dice «puedes subir tu precio lo que quieras» en vez de «hasta un 30 %» (página 2815).
- **3.13.90 (`75af109`), fallo de privacidad encontrado al probar:** LiteSpeed guardaba la API del carrito y daba el carrito de una persona a otra (el panel lateral del carrito la usa). Ya no se guarda.
- **3.13.91 (`aaefcb2`) y 3.13.92 (`208a9f5`):** la caché guardaba páginas pintadas con carrito. Todos veían el contador en 1 y bajaban ~627 KB del carrito de WooCommerce en cada visita. Arreglado, y además:
  - el contador del carrito ya no pregunta al servidor en cada página;
  - sin lupa en el teléfono;
  - galería en diferido;
  - fotos de tarjeta de media pantalla.
  - Interruptor: `cvd_data_saver`.
- **3.13.93 (`73df935`) y 3.13.94 (`bb77220`):** Mi cuenta enseña «¿Compraste sin cuenta? Ver mi pedido» y la tarjeta ya no tiene el hueco de arriba.
- **Comprobado:**
  - curl y un Chrome sin pantalla a 390 px;
  - WhatsApp con y sin el enlace de Thaly (`CV36THALYHG0` → 5358412987);
  - con el enlace guardado y con otro visitante (la caché no mezcla);
  - el armado en el pago real con la sombrilla (no sale) y la zapatera (sí);
  - la búsqueda del pedido con 3 pedidos de prueba;
  - la API del carrito sin caché.
  - Los carritos de prueba se vaciaron.
- **No comprobado:** la página de pedido recibido con un pedido real (no se hizo ninguno) y las vistas con sesión iniciada (gestora en su tienda, cliente con cuenta).
- **Para volver atrás:**
  - Core: `~/bak-20261013-cvd-3.13.87-antes-3.13.88` … `~/bak-20261013-cvd-3.13.93-antes-3.13.94`, una copia por versión;
  - tema: `~/bak-20261013-tema-footer-antes-3.13.88.php`;
  - marca: `~/bak-20261013-marca-antes-3.13.88.php` y `…-3.13.89.php`;
  - `/ayuda/`: `~/bak-20261013-pagina-2815-antes-3.13.89.html`.
- **Informe completo, lista de fotos con letreros y lo que queda para Ernesto:** `docs/productos/auditoria-cliente-2026-10-13.md`.
- **Queda para Ernesto o Lennys:**
  - plan de Hostinger (errores 500);
  - «¿Cómo paga el cliente?» (Lennys);
  - «Recién llegados» de la portada;
  - nombres de producto en el panel;
  - mover productos de departamento;
  - letra «Inter» de Google (48 KB);
  - «Origen» de pedidos de WooCommerce.

**Abierto:**
- La capa de moto de Nadielys (#3566) está asignada a Alejandro, que no contesta desde las 12:08. Ernesto decide a qué mensajero pasarla.

## K. Noche del 11-oct (03:45–05:00 Cuba, Claude Code mientras Ernesto dormía)
**Hecho y comprobado:**
- **VivaBot** (VPS en `72c51a5`, rama `ccr-f459b3eb-utyhix` = main): sin BizneCubano en textos y reglas. Arreglados: "me gustaría que me lo lleven…" de un cliente ya no se toma como "idea"; APRUEBA n ya no aprueba gestoras por error; campañas solo a clientes de 9 a 20 h (nunca familia ni pausados); las claves de cifrado ya no salen en los logs; mensajería sin caché vieja; reparto más seguro ("Yo" exacto, "Yo #N" por privado, "entregado #N", CUP/transferencia, ofertas cerradas no se toman, el WhatsApp del pedido no lo cambia otro número). **Probado sin mandar WhatsApp** (6 preguntas reales): ofrece faroles y lámparas solares para apagones, da la mensajería a Miramar en CUP, materiales de toallas, no MLC, árbol de Navidad, comisión de silla = 5 USD fijos.
- **El bot aprendió de los chats:** 110 respuestas activas (antes 45): medidas, materiales, pagos (Zelle 1,04, PayPal +4 %, por adelantado), reglas de mensajería (no suben, billetes, devolución con mitad o completa + mitad). Corregidas las contradicciones de pago (MLC no), comisión sin tope, la respuesta "dile que está loca" apagada. Reglas de atención añadidas (no "dame un momento", stock por color, no inventar, no bromas). Copias: tablas `bak20261011_crm_*`.
- **Supervisor del VPS:** cada 3 min de día (10 de noche), con la tarea del arranque. Cerrados 15 avisos viejos de BizneCubano y la pregunta 5.
- **Web Core 3.13.42** (copia `~/bak-20261011-cvd-3.13.41`, commit Casa-Viva `5711f44`): registro de gestoras sin caché y con WhatsApp válido; precio de gestora también desde la lista; sin tope del 30 %; Mis clientes arreglado; mensajeros pueden entrar con su enlace; gestora pendiente ya no entra en bucle. Páginas en 200.
- **Panel** publicado (casaviva.company/panel y Vercel): respuestas viejas no pisan listas, aviso de domicilio sin mensajero, "Lo recogió y pagó", tasa nueva al momento. **Puente**: un pedido cancelado que nunca descontó ya no suma unidades en la caja.
- **Descargas:** casaviva.company/descargas/ ya da la caja **1.0.7** (APK y Windows; copia de la 1.0.0 en `~/bak-20261011-descargas-1.0.0`).
- **Catálogo:** árbol y colcha navideña también en "Navidad"; descripción nueva de la cama plegable.
- **Guías WhatsApp:** `docs/nexo-business/tutoriales/` (gestoras, dependientas, administracion, mensajeros, mensajes-arranque) y en el VPS `/root/archivos/tutoriales/`.

**Esperan el SÍ de Ernesto** (en su chat "Tú": *PREGUNTAS*, luego *SÍ n*): 213 Lennys 8:00 · 214 Zaymi y Nana 8:15 · 215 grupo General 8:30 · 216 apagones 9:30 · 217 lluvia y motos 12:30 · 218 Navidad 16:30 · 219 pasar el reparto al grupo real "Mensajerías CASA Viva" · 220 ¿el mensajero se queda el 100 % de la mensajería? (hoy la web le anota el 90 % como "por pagarle").

**Importante para las cajas:** en los teléfonos que ya tenían la caja hay que **Borrar datos** de la app antes de abrir la 1.0.7 (si no, no sale la casilla del código y las ventas de prueba guardadas subirían como reales). Los códigos vencen hoy a las 23:40.

**Pendiente / decisiones:** (1) mensajeros: hoy solo Pedri y el piloto están "Disponibles"; sin uno disponible el pedido a domicilio se queda "Por ofertar"; (2) el panel no tiene "Asignar mensajero" (solo /mensajeria/ en WordPress); (3) acciones de pedidos solo sobre los 50 más recientes; (4) clientes añadidos a mano no dan comisión (manda el enlace/cookie de 400 días, gana la primera gestora); (5) modo de altas TODAS aprueba cualquier registro al momento; (6) los correos de pagos van a direcciones internas que no existen; (7) caja: el efectivo de mensajeros puede contarse dos veces, el reembolso siempre en USD, contar en el teléfono no arregla existencias (lo hace Lennys en el panel); (8) cuenta de prueba de gestora `user 45` (otra sesión la está probando): marcarla de prueba y desactivarla al terminar; (9) rotar claves vistas en capturas; logs viejos del bot aún tienen claves de sesión (`pm2 flush vivabot` si Ernesto quiere).

## J. Relevo 2026-10-11 tarde (Claude Code)
**Dónde quedó todo (resumen del chat largo del 11-oct; el detalle está en la sección I, más abajo):**
- **Panel de Lennys** `casaviva.company/panel/` (también `negocio.nexocuba.com`, Vercel a mano con redeploy del último deployment + `withLatestCommit`). 6 pestañas: Resumen (este mes web+tienda, meses anteriores), Pedidos (solo web; acciones y "Cambiar pedido"), Productos (lista única con precio/quedan, oferta, "Cambiar varios", nuevo producto que también se crea en la web, Llegó mercancía con Curru), Clientes (web + caja + bot, por gestora), Equipo (Gestoras, Mensajeros, Dependientas con permisos, Socios), Ajustes (tasas, mensajería por zona, costos, cajas con código de alta).
- **Web** `casaviva.company` = Casa Viva Core **3.13.41** (repo `ernest196391/Casa-Viva`, clon `C:\Users\Ernesto\Casa-Viva`; subir por SSH con copia `~/bak-*` y `php -l`). El tema `casa-viva-storefront` NO está en el repo (editado en el servidor; copias `~/bak-2026101*`).
- **Caja**: Windows 1.0.7 en GitHub Releases. **APK 1.0.7 COMPILADA el 11-oct** (firmada con la clave Casa Viva Core, SHA-256 cert b869006e…; versionCode 1000007; arm64, armv7, x86; copia en el Escritorio: CasaViva-Caja-1.0.7.apk). Después falta mandarla e instalarla en los teléfonos de Lennys, Zaymi y Nana junto con sus códigos de alta (UFEYKN, QNHMG7, 455JFM, GGK4W3; vencen ~12-oct 03:40 UTC; si vencen, crear otros en Ajustes → Cajas).
- **Puente** `nexo-stock-bridge` cada 2 min: existencias caja↔web, mensajeros y gestoras de la web → caja, clientes de caja y bot → web.
- **Datos en cero**: sin ventas, pedidos, clientes ni comisiones (todo lo anterior era prueba). Cajas de prueba desactivadas.

**Siguiente (en orden):**
1. **Revisar de punta a punta la parte de gestoras** (pedido de Ernesto): `/registro-gestora/` (registro e invitación `?invita=`), `/area-gestoras/` (Mis clientes, catálogo y precios propios, comisiones, pagos, invitar con QR, mensajería), el panel → Equipo → Gestoras (aprobar, pagos) y que la gestora aparezca en la caja. Probar con una cuenta de prueba que luego se borre; cada botón debe funcionar y cada texto aportar algo.
   - **2026-10-11 noche (Claude, auditoría de código, SIN publicar):** arreglos locales en Core (registro sin caché por el nonce, precio de gestora fijado también al añadir al carrito por AJAX, sin tope del 30 % salvo tope personal, solo gestoras aprobadas añaden clientes, buscador de "Mis precios", estilos de "Mis clientes", "Editar perfil" que no hacía nada, textos). Guía para gestoras: `docs/nexo-business/tutoriales/gestoras.md` (el punto 6 "sin tope" vale solo cuando se publique). PENDIENTE: publicar con `php -l` en el servidor + purgar LiteSpeed, y probar con cuenta de prueba (carrito desde la lista con `?ref=`, enlace de *mi acceso* al primer toque, aprobación → bienvenida del bot).
   - **2026-10-11 mañana (Claude, prueba real con Ernesto):** registro VERIFICADO EN OPERACIÓN (user 45 `pruebagestoraborrar`): el bot la aprobó al instante (`vivabot:todas`) y en ~1 min estaba en la caja (people `4aaae0c3…`). Ernesto borró en wp-admin los users 3 `auditor` y 9 `cv_mensajero_piloto` (tenían el número 5354056173, que es el del bot/Casa Viva: con él nunca podrá entrar "con WhatsApp") y creó user 46 `gestoraprueba` (CV46GESTORAP). **Dos cuentas de prueba (45 y 46) por quitar** (marcar `_cvd_test_account=1` + inactivas en people, o borrar). Revisar huérfanos en people de los users 3 y 9. Fallos vistos en el área: en "Mis clientes" se ve la nota interna "Creado desde el Excel…" de un cliente importado; menú de 10 pestañas se sale en el móvil; "Invitar" cae en la sección "Tus precios"; aviso "0 precios guardados." sin hacer nada; cabecera repetida (logo + "Casa Viva · Gestoras" + "Hola…").
   - **Rediseño pedido por Ernesto (área de gestoras como app):** menú lateral plegable (móvil: cajón + 4 accesos abajo), Inicio con ganado / listo para cobrar / clientes + "Lo que más se vende" (datos ya existen en `_cvd_commission_snapshot` por línea), Herramientas (Buscar precios = NEXO Busca en Render, otra sesión de login; Cazadora y Fotos de producto = PRONTO, no existen aún), Ventas, Cobrar, Invitar. Prototipo para aprobar: https://claude.ai/artifact/4SgrzDCJ5RJug5RTyiFXi7 (datos de ejemplo). Implementación: plantilla propia para `area-gestoras` (`template_include`, sin cabecera de la tienda) en Core.
   - **INSTALADO 2026-10-11 (Claude, con permiso de Ernesto): Core 3.13.43** (copia `~/bak-20261011-cvd-3.13.42-antes-app`; commits Casa-Viva `54848e0` + `423e362` en `main` LOCAL, **sin push** a GitHub). Clase `CVD_Gestora_App` + `templates/gestora-app.php` + `assets/gestora-app.{css,js}`. **Solo la ven cuentas con `_cvd_test_account=1`** (users 45 y 46 ya marcados, por eso tampoco salen en panel/caja). Para abrirla a todas: `wp option update cvd_gestora_app all` (volver: `wp option delete cvd_gestora_app`). Reutiliza las secciones del portal clásico (clientes, precios, ventas, mensajería, pagos, invitar, perfil). Inicio: ganado este mes / por cobrar / clientes, "Lo que más se vende" (30 días de toda la tienda; si hay <3 ventas, más vendidos históricos `total_sales`; caché 30 min) con lo que gana ella por unidad y botón Compartir; "Para hoy". Herramientas: Curru (abre el asistente) y Fotos y textos listos = listas; Buscar precios (NEXO Busca, falta unir el login), Cazadora y Fotos de producto = "Pronto". Arreglos que valen también para el área antigua: QR de invitar = enlace de tienda; notas de clientes que no escribió la gestora ocultas; Enter en buscador de precios ya no envía; textos de cobrar/clientes/precios/invitar/mensajería acortados. VERIFICADO: render como user 46 sin avisos PHP (0,3 s), vistas y menú probados en móvil y PC con los CSS/JS publicados; gestora real (user 14) sigue con el área antigua. NO verificado aún: Ernesto entrando con su sesión real.
   - **ABIERTA PARA TODAS (2026-10-11, decisión de Ernesto):** `cvd_gestora_app = all`. Comprobado: las 28 gestoras aprobadas generan el área nueva sin errores. Volver al área antigua: `wp option delete cvd_gestora_app` (vuelve a "solo prueba").
   - **2026-10-11 ~10:30 Cuba (Claude, pedido de Ernesto):** (1) aviso del área nueva al grupo General de gestoras (outbox 221, "enviado" 10:17; el bot no guarda sus propios mensajes en `crm_wa_messages`, Ernesto debe confirmar que lo ve). (2) **Buscar precios** dentro del área (Core **3.13.44**, `CVD_Gestora_Busca`, ruta REST `casa-viva/v1/gestora/busca`, misma clave que Curru, modelo `gpt-4.1-mini` cambiable con la opción `cvd_busca_model`, 15 búsquedas/día por gestora, foto reducida a 1280 px). VERIFICADO con una búsqueda real (ventilador F6): 6 s, 5 ofertas con enlace (Revolico ×2, Domicilio Havana, Nercado, Caribe Express). (3) Cuentas de prueba 45 y 46: `_cvd_account_status=suspended` en la web e `inactive` en people (siguen inactivas tras el puente); cliente 67 sin gestora. (4) **Caja 1.0.7 + códigos** mandados por el bot a Lennys (con los 4 códigos y el panel), Zaymi (455JFM) y Nana (GGK4W3): outbox 222-224; preguntas 213 y 214 del supervisor marcadas "hecha". Códigos comprobados (sha256) y **válidos hasta 12-oct 23:30 Cuba**. Descargas 1.0.7 en 200. PENDIENTE: ver en `devices` que aparece cada equipo nuevo.
   - **2026-10-11 ~11:00 Cuba — decisiones de Ernesto (D40 en DECISIONES):** (a) **el mensajero se queda el 100 % de la mensajería**: `cvd_shipping_platform_percent` 10 → 0 en la web (no había pedidos abiertos con el 90 %); el vale del bot ya muestra "Tu ganancia" = mensajería completa. (b) **Las carreras salen en el grupo real "Mensajerías CASA Viva"**: pregunta 219 aprobada al supervisor (cambia `DISPATCH_GROUP` con copia del .env, reinicia el bot, manda la sección 7 + guía de mensajeros y vigila que cada "Yo" reciba su vale por privado). Mensajes del arranque: 215 (arranque) enviado 10:33 sin guía; 216 apagones desde 11:05; 217 lluvia 12:30; **218 Navidad aplazado** (recomendado finales de octubre). Al revisar: 0 pedidos abiertos, 0 carreras pendientes, 1 mensajero disponible (Pedri). Guía `gestoras.md` actualizada (repo y VPS).
   - **2026-10-11 ~11:00–11:30 Cuba (Claude, revisión de chats):** (1) **Core 3.13.45**: contraseña propia en "Mi perfil" para gestoras y mensajeros (`CVD_Program_Login`), entrar con el número de WhatsApp + contraseña, sesión de 1 año en el teléfono; "mi acceso" solo si se olvida. VERIFICADO en servidor. Conocimiento del bot 28/29 actualizado y nuevo 114 ("¿hay que pedir el enlace cada semana?"); copia `bak20261011c_crm_knowledge`. (2) **VivaBot `87600b4`** (VPS actualizado y reiniciado 11:06): no decir que escribió a terceros; con capturas reenviadas, contestar a quien escribe (había dicho a Lennys "acabo de escribirle a Joyce" sin poder). (3) **Caja 1.0.8** (APK, versionCode 1000008, misma clave b869006e…): `MainActivity.kt` reserva el hueco de las barras del sistema (en el teléfono de Nana los botones de Android tapaban Vender/Caja/Inventario/Más). `gen/` NO está en Git: el arreglo está apuntado en `docs/nexo-business/COMPILAR-APK.md`. **Publicada** en casaviva.company/descargas/CasaVivaCore.apk (copia de la 1.0.7 en `~/bak-20261011-CasaVivaCore-1.0.7.apk`; md5 público = compilado) y copia en el Escritorio. Windows no cambia. (4) Mensajes enviados (outbox 235-240): Joy (usa la web vieja casavivadecuba.com, que no responde → casaviva.company + registro de gestora + pedir municipio para la mensajería), Dany (contraseña), Ibelice (registro de mensajera: dijo "Yo" sin estar registrada), Nana (causa + 1.0.8), Melany (corregido lo que dijo el bot; preguntado de qué pedido es su entrega de la tarde: en la web no hay pedidos abiertos). (5) **Opción b de Ernesto: una cuenta puede ser gestora y mensajera** (caso Ela) → en preparación en local (rama `doble-rol`, 3.13.46), sin publicar. (6) Vigilancia de chats cada minuto desde esta sesión. (7) PENDIENTE: CSV de contactos de Ernesto (cuando lo tenga) para clasificar quién es quién en el bot.
   - **2026-10-11 ~11:30–12:00 Cuba (Claude):** **Core 3.13.46** cuenta doble gestora+mensajero (`CVD_Registration::is_dual/programs/status_for`, estado de mensajero en `_cvd_messenger_status`; copia `~/bak-20261011-cvd-3.13.45-antes-doble`); probado con cuenta de prueba borrada; **Ela ya es doble y aprobada en las dos**; Adrian avisado. **Core 3.13.47** existencias exactas para gestoras en la tienda (`CVD_Gestora_Stock`: "Quedan N" y por color; clientes no ven cifras) — idea de Dany. **Primer pedido real web #2896** (Dayami, cama plegable, La Lisa, 60 USD + 2.300 CUP 100 % mensajero, comisión 5 USD): nombre corregido a Duniel; Lennys guiada a "Listo para salir" para que salga la carrera. Prueba de Katia **#2897 (pickup, deja el aceite corporal en 0) PENDIENTE DE CANCELAR** (Claude sin permiso; Ernesto/Lennys). Bot `d19d31e`: no decir que corrigió pedidos; enlace de entrada ≠ enlace de ventas. Conocimiento nuevo 115/116: muebles grandes vienen desarmados, armado 3.000 CUP. Lección: no reiniciar el bot con gente escribiendo (se perdió un audio de Patry). Avisos de mejoras a Dany y a los grupos General y Mensajerías (outbox 252-254).
   - **2026-10-11 ~12:00–12:35 Cuba (Claude) — reparto directo:** **Core 3.13.48** (Casa-Viva `eb326ac` + `7d3ebfa`, subido; copia `~/bak-20261011-cvd-3.13.47-antes-reparto`): la gestora elige mensajero (área → Ventas → "Mensajero que lo lleva", o "mensajero: Nombre" en la nota; `_cvd_preferred_messenger_user_id`, clase `CVD_Direct_Dispatch`); al pulsar la tienda "Listo para salir" (`CVD_Delivery::dispatch_ready`) se asigna directo (no sale al grupo) o, sin elegido, se publica como siempre; "Entregué el dinero" del mensajero (`_cvd_cash_handover_declared_at`, NO cambia `_cvd_cash_status`); avisos tras acciones del bot; seguimiento del cliente con pasos que se actualizan solos; en pedidos de gestora las notas del reparto quedan internas (sin correo al cliente). **VivaBot `0ce423d`** (VPS reiniciado 12:32 con el chat tranquilo, sin mensajes perdidos): `GET /bot/dispatch/direct` → vale por privado al elegido + aviso a Ernesto; enlace del área en el vale. **Panel** (NEXO `6ab7c98`, publicado en casaviva.company/panel; copia `~/bak-20261011-panel-index-antes-reparto.html`; Vercel sin actualizar): quién lo lleva, hora, pasos, dinero declarado, seguimiento. Etiqueta "Empezar a preparar" en pedidos nuevos. **Primer reparto real: #2896 (Dayami) aceptado por Fernando Santana desde el grupo.** #2898 (Patricia) esperando. Mod `/casaviva` escrito en `C:\Users\Ernesto\.claude\dev-mods\…\casaviva` (copia en `scripts/casaviva-revision/`), NO cargado (Ernesto no activó la recarga; carga al abrir sesión). Audio del recorrido (`docs/nexo-business/tutoriales/audio-como-funciona-pedidos.ogg`) y vídeo tutorial en preparación: mandar a los grupos cuando Ernesto apruebe. PENDIENTE decidir: cuentas `cvd_clerk` para Zaymi y Nana (la dependienta pulsa "Listo"); "códigos de caja sin usar" del mod sale vacío (consulta a `nexo_business` por API no expuesta).
   - **2026-10-11 ~12:40–14:00 Cuba (Claude) — lanzamiento, tarde:** (1) **#2896** Dayami: bot le habló como clienta (ella usó su propio teléfono) → corregido a mano y en código (VivaBot `bd2652b`). Fernando dice que ya la recogió (13:56); falta que Nana marque *Entregado al mensajero*. (2) Isabella y Max: cuenta doble gestora+mensajero (conocimiento 120). (3) **🔴 12:55 Anthropic sin saldo** → bot en pausa (bot_paused_until) y respuestas a mano; **13:41 bot con OpenAI** (VivaBot `77d3e24`: `AI_PROVIDER=openai`, `OPENAI_MODEL=gpt-4.1-mini`, clave puesta por Ernesto con el script de su Escritorio → `/root/supervisor/set-openai-key.sh`). Para volver a Anthropic: quitar `AI_PROVIDER` del .env y reiniciar. (4) **Vídeo tutorial + audio enviados** a General y Mensajerías (outbox 282–285; VivaBot `bc3c9da` manda .mp4 como vídeo y .ogg como nota de voz). (5) **#2901** Sabrina (Cubanacán), clienta de **María Caridad (user 47)**: creado por Claude con `CVD_Voucher_Intake::create_order` (cesto 12 L naranja + cortina 180×180 diseño nubes = 15 USD, mensajería 1.900 CUP), marcado Listo y publicado en el grupo 13:46; Maryta con fotos, datos y número de la clienta; Nana avisada. La variación de la cortina se llama "rojo" en la web aunque hay diseño blanco con nubes: revisar nombres. (6) **SUBIDO 13:55–14:00:** SQL `020_reparto_relevo` (Supabase), **Core 3.13.50** (relevo, dependientas con cuenta, tarjetas de la tienda; copia `~/bak-20261011-cvd-3.13.48-antes-3.13.50`), **VivaBot `d16f5de`** (relevo, gestora siempre texto de gestora, «mi acceso» dependientas; reinicio 13:57 tranquilo), función `nexo-panel-web` y **panel** (pestaña Tarjetas, Zelle/USDT, cobros por tarjeta; copia `~/bak-20261011-panel-index-antes-tarjetas.html`). Tarjetas sembradas (solo nombre + 4 últimos): MLC ·1884, MN BPA ·2677, MN Metro ·9359, TCP Bandec ·5538, Clásica ·2690, Marita Metro ·4223. **Dependientas creadas:** Nana (user 63) y Zaymi (user 64), enlace de acceso enviado. PENDIENTE probar en real: relevo (borrar «Yo»), recordatorios, cierre con tarjeta. Las ventas de caja (POS) aún no guardan tarjeta (falta columna en `sale_payments`). (7) Regla: **Lennys es admin**: nada de tareas de tienda a ella (van a dependienta/mensajero/gestora).
   - **2026-10-11 ~14:20–15:35 Cuba (Claude) — más arreglos y subidas (Ernesto: "sube todo sin esperar aprobación"):** relevo probado en real (#2898 escritorio: Pedri lo soltó → Daiquel en triciclo; #2899 silla movida a Daiquel; hora puesta a mano "mañana 9am–3pm"). VivaBot `9776c27` (fotos privadas guardadas 7 días en `/root/archivos/entrantes/`), `47bf85d` (avisos del reparto quedan en el historial del chat), `ec3fc81`+`7281270` (tasa del día a la web; parser arreglado para el formato de Maryta), `4ed5eec` (no inventar medidas). `RATES_SENDERS` = Maryta, Lennys, Ernesto. **Core 3.13.51** (`0b2d4c4`, copia `~/bak-20261011-cvd-3.13.50-antes-3.13.51`): calculadora de tasas para gestoras (Herramientas + "Tasa de hoy" en Inicio + precio CUP junto al USD solo para gestoras aprobadas; opción `cvd_daily_rates`) y **día de entrega** (checkout, vales, /ventas/, portal, recibo, carrera "📅 ENTREGA"). Panel `a779dcb` publicado (Ajustes → Tasas web, 📅 en pedidos; copia `~/bak-20261011-panel-index-antes-tasas.html`), función `nexo-panel-web` desplegada. **Dirección de recogida** (`cvd_pickup_address`): dirección completa, hora normal, almuerzo 1–1:30, referencia Restaurante Alta Casa, enlace a la página nueva **casaviva.company/como-llegar/** (page 2919, fotos 2917/2918, mapa 23.1143555,-82.3978757). Lennys creó 5 cortinas como productos (2906–2914); arreglados título "rayas" y categoría; #2901 enlazado a 2910 y descontado. #2901 final: cesto + cortina rayas = 15 USD, lo lleva Isabel. #2903 (Maryta→Elvis, recogida, 46.800 CUP mixto), #2904 (Lucía, alfombra, recogida CUP), #2905 cerrado por Nana, #2916 (Caridad→Miladys, mochila M-8, mensajera elegida Ely/Elizabet 56). Supervisor del VPS: reglas nuevas en `/root/supervisor/CLAUDE.md` (Lennys solo admin; productos pesados; no repetir lo que manda Claude). EN CURSO: agente "Diseños y colores + Dejar de vender" (panel). PENDIENTE: aviso automático a la gestora cuando un pedido de **recogida** se cierra (hoy solo llega en domicilio cuando el mensajero escribe "entregado"); cierre del día 18:45/19:00 (`docs/nexo-business/cierre-del-dia.md`).
   - **2026-10-11 ~15:35–17:40 Cuba (Claude) — cierre del día 1:** **Core 3.13.52–3.13.54** (`493ee63`, `a9ef4aa`, `9bf87fa`): zona aproximada ("Mitamar"), direcciones solo de Cuba con mapas seguros, y **bloqueo de pedidos de prueba** (`_cvd_test_order`; "PRUEBA" en nombre o nota lo marca solo) después de que #2921 y #2923 salieran al reparto (cancelados y avisados). Panel `6f73b64` + `4acab30` (diseños y colores, «Dejar de vender», campo de comisión, «Cambiar foto», «Quitar diseño») y migración `20261011180000_nexo_business_product_designs_retire`. VivaBot: roles mensajero/dependienta/equipo (migración 021), `1820e84` (sin "+0 CUP", aviso de entregado a la gestora), perfiles de voz B (equipo) y A (clientes nuevos) en `src/voice.js`. Notas de texto distintas y escalonadas a las gestoras sin contraseña (`/root/supervisor/onboard.mjs`). Conocimiento nuevo: el enlace de tienda (?ref=) no caduca; el de acceso dura 7 días. **Cierre enviado 17:36** (outbox 445–450): gestoras → General, mensajeros → Mensajerías, Nana y Zaymi, Lennys y Ernesto por privado (textos en `docs/nexo-business/cierres/2026-10-11-borrador.md`). Día 1: 11 pedidos web · 633 USD · caja 66 USD · ~43 USD comisiones pendientes. PENDIENTE: generador de **infografías del cierre** (aprobado por Ernesto; tarea aparte), #2916 falta «entregado» de Ely, #2898/#2899 Daiquel mañana 9–3, simplificar pasos de dependienta (propuesta de Nana), POS sin tarjeta en `sale_payments`.
   - **Parte pública (2026-10-11, Claude):** tema `casa-viva-storefront` (SOLO en el servidor; copia `~/bak-20261011-tema-antes-cabecera`): cabecera y pie "Gestoras" → **"Vende con nosotros"** (gestora con sesión: "Mi área"), "Acceder" → **"Entrar"**; `/registro-gestora/` y `/registro-mensajero/` sin el título de página duplicado (index.php). Core: sin la etiqueta "Casa Viva" en el registro (Casa-Viva `702020d`). VERIFICADO en la web pública. Casa-Viva `main` ya está en GitHub con la 3.13.43.
   - **Herramientas de operación (2026-10-11 ~18:00 Cuba, Claude):** comando **`cv`** en el VPS (`/root/supervisor/cv.mjs`, en el PATH; `cv ayuda`): chat, nuevos [--sin], enviar / enviar-archivo (grupos solo con `--ok` = SÍ de Ernesto), pedido, pedidos-hoy, tranquilo, reiniciar (check + espera tranquilo), aprender (`--prueba` no guarda), silenciar, contacto, outbox, estado. Probado en real (lecturas + un envío a Ernesto, outbox 452). Skill **`casa-viva-ops`** (`~/.claude/skills/casa-viva-ops/`, con copia de `cv.mjs`) con datos fijos, despliegues y reglas. Al probar se colaron 2 respuestas basura en `crm_knowledge` (#127 y #128, respuesta "x"): ya **desactivadas** (`active=false`), falta borrarlas si Ernesto quiere.
2. Mandar la APK y los códigos a Lennys/Zaymi/Nana; comprobar que aparece cada equipo en `devices`.
3. Preguntar a Lennys la política de devoluciones y garantía (mensaje preparado en la sección I) → publicar páginas.
4. Mensajeros reales: alta y aprobación (Equipo → Mensajeros); cambiar contraseña de "Mensajero piloto".
5. Primer uso real: primer pedido web (resta en la caja, cliente guardado), primera entrada de mercancía desde la caja, primer pago a gestora.

   - **PENDIENTE (Ernesto, desde el móvil): canal de WhatsApp «Casa Viva · Gestoras».** Crearlo en su WhatsApp (Novedades → + → Crear canal; el bot usa su número, así que será el dueño) y pasar el enlace. Luego: `canal:<código>` en el outbox → JID en `WA_CHANNELS` (.env) → `/canal`. Comandos nuevos en Claude Code (skills de usuario): /vigila /envia /pedido /aprende /silencia /hoy /cierre /sube /canal + skill `casa-viva-ops` y `cv` en el VPS.

   - **2026-10-11 ~18:00 Cuba (Claude) — Core 3.13.55** (Casa-Viva `2158cd1`, en `main`; copia `~/bak-20261011-cvd-3.13.54-antes-3.13.55`; sin deriva, `php -l` OK, páginas en 200, sin avisos PHP). (1) **«Entregado al mensajero» automático** (lo pidió Nana): si el mensajero escribe «entregado X usd» por WhatsApp y la dependienta no marcó la recogida, se marca sola con la nota «automático: confirmó el mensajero» y el pedido queda entregado (antes el bot le pedía que la dependienta lo marcara). En su área hay botón **«Ya lo recogí»**. Nunca en pedidos de prueba. Ruta nueva `POST /bot/dispatch/{id}/picked-up` lista, **el bot todavía no la usa** (falta en VivaBot: «lo tengo / recogido #N»). (2) **«Dinero por entregar a la tienda»** (lo pidió Lennys): wp-admin → Casa Viva → Dinero por entregar, y para el panel `GET /panel/messenger-cash` + `POST /panel/messenger-cash/{id}/received {by}` (**el panel aún no lo muestra**). Solo sale lo registrado al entregar (transferencias no). Comprobado en real: Fernando #2896 60 USD y Isabel #2901 11.700 CUP; Ely #2916 no sale porque aún no escribió «entregado». «Recibido» anota quién y cuándo, **no cierra el pedido**: el cierre sigue en Ventas → «Registrar dinero recibido». (3) Aviso a la gestora cuando cierran una **recogida**: ya existía (3.13.53 + VivaBot `1820e84`); aún no hubo ninguna recogida de gestora cerrada para verlo en real. Ojo: la web está en hora UTC (`gmt_offset` 0); esta lista enseña hora de Cuba.

   - **2026-10-11 ~20:50 Cuba (Claude) — ahorro de créditos del supervisor del VPS (permiso de Ernesto):** el 11-oct el supervisor se despertó **201 veces** (de 00:00 a 17:45), todas con Sonnet: **173 sin hacer nada**, 5 solo cerraron escalaciones y **23 actuaron** de verdad. Coste aproximado a precio de la API: **~40 USD**, de los que **~33 USD (83 %) se gastaron en vueltas vacías**, sobre todo por la vuelta fija cada 3 min y porque una pregunta aprobada con "No antes de las 12:30" lo despertaba cada 3 min durante 2 horas. **Instalado** (copias `*.bak-20261011-ahorro` de `check.mjs`, `run.sh` y `CLAUDE.md` en `/root/supervisor/`): `check.mjs` (sin IA) solo despierta con trabajo real: respuestas de Ernesto (respeta "No antes de las HH:MM" y no repite la misma en 15 min), escalaciones nuevas, equipo sin respuesta en 3 min (clientes 10 min; no cuenta "ok/gracias/stickers" ni chats con el bot pausado), respuestas evasivas del bot ("lo consulto", "no sé", "en un momento te atendemos"), envíos con error, mensajes de los grupos con pinta de problema/pedido, vales sin "Yo" 20 min, resúmenes de 9:00 y 20:00, y un **barrido de seguridad cada 60 min de día** (de noche, nada salvo Ernesto/escalaciones/buzón; lo de la noche se mira a las 7:00). Deja el motivo en `despertar.json` (copia `despertar.ultimo.json`) y la vigía en `vigia.json`. `run.sh`: mete el motivo en la orden, **Sonnet solo para Ernesto/escalaciones/resúmenes, Haiku para lo demás**, `--max-turns 30`, `timeout 20m`. `CLAUDE.md`: sección nueva "Vueltas con motivo". **Repetición del día 11 con las reglas nuevas: 42 despertares (17 Sonnet + 25 Haiku) en vez de 201** → ahorro estimado **~85 %** (~6 USD/día en vez de ~40). Vigilado en real 20:51–21:12: 20:51 barrido (Haiku, 0,008 USD, correcto); 21:00 evasiva del bot con Zaymi sobre cancelar #2904 (Haiku, 0,012 USD: creó la pregunta 383 a Ernesto y avisó a Zaymi); 21:06 Ernesto dijo SÍ → Sonnet canceló #2904 y avisó (0,17 USD); las otras 5 vueltas no despertaron (antes, cada vuelta Sonnet costaba ~0,20 USD). Volver atrás: `cd /root/supervisor && for f in check.mjs run.sh CLAUDE.md; do cp $f.bak-20261011-ahorro $f; done`. Prueba sin gastar: `node check.mjs --dry`.

   - **2026-10-11 ~21:15 Cuba (Claude) — bot con lo aprendido el día 1 (VivaBot `5f7c93d`, `1600b0c`, `8cd4118`, reiniciado 21:14 en tranquilo):** estado real de pedidos sin IA (gestora solo los suyos, mensajero sus carreras, tienda cualquiera), avisos de cada paso a la gestora (Listo, lo cogió el mensajero), respuestas fijas (mi enlace, tasa, cómo llegar), conocimiento justo por mensaje (de ~21.000 a 300–2.800 letras), teléfono real en chats @lid (por eso no se registró el «Entregado 13usd» de Ely, #2916), no volver a presentarse, 13 reglas nuevas del equipo. 21 filas de conocimiento nuevas (136–163; desactivadas 64, 80, 117, 118, 129, 135). Informe completo: `docs/nexo-business/aprendizajes/2026-10-11-dia1.md` (12 decisiones para Ernesto). Supervisor con ahorro (~85 %): solo despierta con trabajo real, Haiku para lo rutinario (`/root/supervisor/*.bak-20261011-ahorro` para volver atrás). Tutorial 2 listo (`docs/nexo-business/tutoriales/tutorial-primera-venta.mp4`, #2925 cancelado), falta el sí de Ernesto para enviarlo.

   - **2026-10-11 ~22:05 Cuba (Claude) — tutorial 4 «Tus dudas del primer día, resueltas» (gestoras) LISTO, SIN ENVIAR:** `docs/nexo-business/tutoriales/tutorial-dudas-gestoras.mp4` (72 s, 7,3 MB, H.264+AAC, −15 LUFS), guion `tutorial-dudas-gestoras-guion.txt`, mensaje para el General `tutorial-dudas-gestoras-mensaje.txt`. Proyecto `videos/tutorial-dudas-gestoras` (copia del 3; marca CV exacta, subtítulos quemados, voz B auditada con Whisper: coincide). 5 dudas: mi acceso, mi enlace, #número/mis pedidos + avisos, mensajero en la nota + CUP/tasa de hoy, recogida 10–5. Sin pedidos ni cuentas creadas. **Falta el SÍ de Ernesto** para subirlo a `/root/archivos/tutoriales/` y mandarlo al General. Visto de paso (VivaBot `e12bc07`): aún dicen «de 9:00 a. m. a 5:00 p. m.» el vale del mensajero (`src/dispatch.js:547`) y el aviso «listo para recoger» a la gestora (`PICKUP_PLACE`, `src/order-status-rules.js:186`).
   - **2026-10-11 ~22:08 Cuba (Claude) — bot que no pierde el hilo: preguntas abiertas + preguntas del General (VivaBot `9b4e201`, reiniciado 22:08 en tranquilo).** Caso que lo motivó: Max preguntó en el General si las cortinas son antimoho (19:11) y nadie le contestó; Zaymi dijo "Esas son de tela" y el bot le contestó a ELLA como si hubiera preguntado. Ahora: (1) **preguntas abiertas** en `crm_settings.preguntas_abiertas` (`src/preguntas.js`): cuando la tienda contesta, el bot le da las gracias, lleva la respuesta a quien preguntó (en el General citando su mensaje), guarda el dato en `crm_knowledge` (actualiza la fila que ya existía) y cierra. `cv preguntar … --para general:<nombre|msgid>` / `cv preguntas` para el supervisor y Claude (supervisor `CLAUDE.md` actualizado, copia `.bak-20261011-preguntas`). (2) **General**: pregunta de producto de una gestora → espera ~45 s; si lo sabe seguro (ficha, conocimiento, Curru) contesta una vez citando; si no, "Lo confirmo con la tienda y te digo 👍" y pregunta a la tienda por privado con la foto. Nunca a Ernesto/Lennys/equipo, ni stickers/emojis, tope 10/hora. Lo que dice el bot en el grupo ahora queda en `crm_wa_messages` ("VivaBot (bot)"). (3) **De 17:00 a 10:00 no se escribe al equipo**: queda en cola y se pregunta a las 10:00. A quién: `crm_settings.experto_productos` (por defecto Nana y Zaymi; Nataly NO hasta que Ernesto confirme su número). (4) En privado lo que mandamos se marca "TÚ (nosotros)" y un mensaje corto tras una pregunta nuestra se lee como respuesta. (5) **Modelo**: `OPENAI_MODEL_SMART=gpt-4.1` (añadido al .env, copia `/root/bak-20261011-env-antes-smart`) para gestoras, equipo, grupo y preguntas abiertas; clientes con gpt-4.1-mini; cada llamada deja `[ia] modelo tokens` en el log. Coste estimado con el volumen del 11-oct (~320 llamadas de equipo/gestoras + ~30 de clientes): **~5–9 USD/día** con gpt-4.1 (con mini sería ~1–2). (6) Horario de recogida 10:00–17:00 (almuerzo 1:00–1:30) en el vale y en "listo para recoger". Simulación sin enviar nada con los mensajes reales: Max → "son de tela; lo otro lo confirmo con la tienda mañana a las 10"; Zaymi "Esas son de tela" → gracias + respuesta llevada a Max citando su mensaje. **Pregunta sembrada `ptmrvb99c`** (antimoho de las cortinas 180×180, a Nana y Zaymi, recordatorio 12-oct 10:00): cuando contesten, el bot se lo lleva a Max. Tests `test/preguntas.test.js` en `npm run check`. Vigilado 22:08–22:35: sin mensajes nuevos (noche) y sin errores; **falta verlo en real** con la primera pregunta del General y con la respuesta de Nana/Zaymi mañana.
   - **2026-10-11 ~21:25 Cuba (Claude):** #2916 marcado entregado (Ely, 13 USD). Recogida **desde las 10:00** (opción `cvd_pickup_address`, página 2919, asistente de la web Core `a553166` con copia `~/bak-20261011-cvd-horario10`, conocimiento 13/40/48/63/149, bot). Bot: a las gestoras (no a clientes) les da los datos para pagar del mensaje FORMAS DE PAGO (VivaBot `e12bc07`). Bot encendido para Maryta (bot_mode auto). **Tutoriales 2 y 3 enviados al General** (outbox 464–466; MP4 en `/root/archivos/tutoriales/`). Skill nueva `video-tutorial-casa-viva` (marca CV exacta + subtítulos obligatorios para los próximos).
   - **2026-10-11 ~22:40 Cuba (Claude) — herramienta «entrada → ficha», paso 1 (Ernesto: «créalo»).** (1) **Skill `/ficha`** en `C:\Users\Ernesto\.claude\skills\ficha\` (`SKILL.md` + `crear-borrador.php`): fotos (entrantes del bot o locales) → lectura con visión → `crm_knowledge` → búsqueda web con fuentes → ficha JSON + md en `docs/fichas/` con cada dato **confirmado / sugerido / falta**; precio = «pendiente del motor de precios» (solo costo si hay factura). (2) **Lugar de revisión = wp-admin → Casa Viva → Fichas por revisar** (Core **3.13.56**, `CVD_Fichas`, Casa-Viva `24c0165` en `main`; copia `~/bak-20261011-cvd-3.13.55-antes-3.13.56`; sin deriva, `php -l` OK, home/tienda/producto 200). Producto que ya está en la web → borrador aparte «[REVISAR] …» (oculto, sin SKU; el vivo no se toca). Aprobar = copia texto + SEO + fotos nuevas al vivo y guarda el texto viejo en `_cvd_ficha_backup_<fecha>`; producto nuevo solo se publica con precio; Descartar = papelera. Interruptor `cvd_fichas_requiere_aprobacion` **encendido**. SEO sin plugin: `_cvd_seo_title` (title) y `_cvd_meta_description`. Probado con productos privados de prueba (14/14 OK, en la papelera). **No** se hizo la lista en el panel (paso 2). (3) **3 borradores por revisar:** #2932 Soporte TV 40″–80″ (→ #2595; 9 confirmados con la foto de la caja de Nana, corrige ±15°/50 kg de la descripción vieja), #2933 Cortina conchas (→ #2906; 3/2/5, foto recortada gratis con su fuente), #2935 Set utensilios silicona (→ #747; 2/4/5). Ningún producto en vivo cambió. Aviso a Ernesto por WhatsApp (#473). Evidencia privada en el VPS `/root/archivos/fichas/`. **Siguiente:** Ernesto o Lennys revisan y aprueban; medir cortinas (sale la ficha de las otras 4); paso 2 = lista «Fichas por revisar» en el panel (`/panel/fichas` en el puente).
   - **2026-10-11 ~22:45 Cuba (Claude) — marketplace piezas 1, 2 y 6 (prototipos; NADA desplegado ni publicado).** Todo en `docs/nexo-business/MARKETPLACE-PIEZAS-1-2-6.md`.
     - **Demanda:**
       - Revolico deja leer búsquedas en robots.txt. Sus condiciones **prohíben** reutilizar textos y fotos de otros, publicar o renovar de forma automática y los «servicios de publicación».
       - Al script en Node, Cloudflare le pone un reto anti-robots: **paró y no se salta**.
       - Script `vivabot/scripts/demanda-revolico.mjs`: 1 consulta cada 3–5 s, tope 50 páginas, modo `--html` con páginas guardadas a mano, sin guardar teléfonos. Informe de muestra (solo 100 anuncios): `docs/nexo-business/demanda/2026-10-11-revolico.md`.
       - Recomendado: pedir permiso a Revolico + demanda propia (web, bot, grupos). Jina Reader para fichas de fabricantes. Nada de saltar bloqueos.
     - **Ficha de proveedor** sobre `crm_suppliers`:
       - Órdenes `FICHA` y `FICHAS`: su «sí» con fecha, zona, precios, mayorista, recogida, quién lo atiende y origen del número.
       - «Busca quién vende» ya no guarda solo los números de chats privados.
       - Código **subido a `vivabot` main (`2d1a43b`), NO desplegado.** **PENDIENTE Ernesto:** pegar `vivabot/supabase/022_ficha_proveedor.sql` en nexo-production y después `cv reiniciar`. Sin el SQL no se rompe nada.
     - **Publicar asistido:**
       - Función `vivabot/src/publicar.js`: textos para Revolico (sin enlaces ni teléfono en el texto, ≤1.000 caracteres), Facebook y estado + 3 imágenes.
       - Ejemplo con el ventilador F6 y las sábanas Majestic: `docs/nexo-business/publicar/EJEMPLO.md`.
       - Prueba propuesta: 2 semanas con Dany + 2 gestoras, 1 anuncio al día.
       - `scripts/publicar-ejemplo.mjs` usa satori/resvg, que todavía están en el `package.json` sin confirmar de la sesión del cierre.
       - `test/publicar.test.js` y `test/suppliers.test.js` aún no están en `npm run check`.

   - **2026-10-11 ~22:50 Cuba (Claude):** split Parker (producto 1013, privado): costo real en la tienda proveedora **351 USD**, precio web **365 → 380 USD**, comisión **fija 10 USD** (Ernesto). Venta de Harley a Anderson (291.593,75 CUP, entrega 12-oct por Ernesto; recordatorio 7:30 por cron del VPS). Lennys explicó su regla de precios (margen <20 %, comisión ~10 %, la tienda debe ganar ~lo mismo que la gestora; si gana <2–3 USD baja la comisión) → `motor-de-precios.md`; se le preguntó por 22 productos con costo raro (lista mañana). En marcha: paso 1 del motor de precios + simulador (sin tocar precios).

   - **2026-10-11 ~23:10 Cuba (Claude):** motor de precios paso 1 (commit `e91099c`, `packages/business-domain/src/pricing/`, 26 pruebas; regla de Lennys: comisión 10 % → hasta 12 %, baja si la tienda gana <2,5 USD, mínimo 1) + simulador sin escritura (`docs/nexo-business/simulacion-precios/2026-10-11/`: 149 productos, 14 costos cruzados del Excel, 58 con ganancia <2,5 USD, 45 comisiones web≠nube). Costos corregidos con Lennys en la nube (17 filas: toalla pequeña, alfombras, batas lisas 13,20, cesto encimera, Cisne Blanco 5…); pendientes para el 12-oct 10:05 (cron): rasuradora, cortinas 4,10/corazones, batas nuevas a 38 aparte, Luminoliss costo ¿8?. Yanaika: 28 fotos con su enlace enviadas a mano; bot con hasta 12 fotos + ?ref= (`3efa646`); en marcha búsqueda por producto en listas y «Fotos para publicar» en el área de la gestora.

   - **2026-10-11 ~23:35 Cuba (Claude) — listas de fotos de gestoras + «Fotos para publicar» (pedido de Ernesto, con permiso para subir):**
     - **VivaBot `1d445ea`** (VPS al día, `cv reiniciar` 23:33 en tranquilo, `cv estado` sin errores). Una lista («faja, mochila, cepillo alisador…») se parte y **cada producto se busca por separado** (`src/lists-rules.js`, `searchList` en `woo.js`): ITEM → producto / AGOTADO / PARECIDO / NO ENCONTRADO. Gestora que pide fotos: le salen solas, una por producto y los demás modelos («mochilas» = todas) hasta 12, pie «*nombre* · precio USD / Pídelo aquí: enlace ?ref=». Si la IA niega algo encontrado, pregunta «¿quieres la foto?» o promete fotos/datos que no salen → texto seguro hecho con la búsqueda + «en tu área → Fotos para publicar». Conocimiento: lo citado cuenta como historial, filas «(Lo pregunta un MENSAJERO…)» no van a gestoras, hace falta coincidencia directa (antes los mensajes largos llenaban siempre las 15 plazas: «17/111»). Pruebas `test/lists.test.js` con las 3 listas reales de Yanaika y el catálogo del 11-oct (en `npm run check`). Comprobado con el catálogo vivo en el VPS: las 3 listas salen completas (cepillo 2417, cortinero 291, juego de ollas 141, Luminoliss 410, cortinas 2908/2912…, mochilas M-2/M-4/M-5/M-10/M-14…). **Falta verlo en una conversación real** (no se escribió a Yanaika).
     - **Core 3.13.57** (Casa-Viva `a7ae865` en `main`; copia `~/bak-20261011-cvd-3.13.56-antes-3.13.57`; sin deriva, `php -l` OK, home/tienda 200). Clase `CVD_Gestora_Fotos`: área de gestora → menú **Fotos para publicar** (`casaviva.company/area-gestoras/#fotos`; también en Herramientas y en «Para hoy»; sustituye la vista vacía «Fotos y textos listos»). 194 productos en existencia por categoría + buscador; cada uno con fotos, precio de ella (+ CUP del día), «Quedan N» y el texto listo (nombre, frase de la descripción, precio, enlace ?ref=). «Descargar foto» (WebP → JPG guardado en `uploads/cvd-fotos/jpg`), «Copiar texto», «Descargar todas (ZIP)» por categoría (1 foto por producto, se arma una vez y se reutiliza; Baño 45 fotos = 3 MB en 2 s). Solo gestoras aprobadas (sin sesión: 400/403). VERIFICADO con render en el servidor como user 65 (0,3 s, 194 productos, el ?ref= de ella en todos) y la página probada en el móvil (categorías, buscador, cambiar foto, copiar). **Falta** que una gestora real lo abra con su sesión.
     - Conocimiento nuevo **#164** (gestora, material_publicidad): dónde están todas las fotos.

   - **2026-10-12 ~00:00 Cuba (Claude) — Cazador NEXO v0 (etapa 3 del buscador de negocios; diseño aprobado por Ernesto):** script `scripts/cazador/osm-negocios.mjs` (1 sola consulta a Overpass para Plaza de la Revolución, caché 7 días en la carpeta temporal, 3 intentos con 60 s de espera; `--desde <json>` si Overpass falla) + plantilla `scripts/cazador/plantilla-cazador.html` (sistema de diseño NEXO del repo: tokens, Archivo, logo e iconos). Resultado: 721 negocios de los 3 nichos → 149 candidatos (con teléfono, sin web ni redes, sin estatales ni clínicas) → **50 fichas** (22 comida, 14 belleza, 14 móviles; 47 con celular, 3 solo fijo). Salidas: `docs/productos/cazador/2026-10-12-plaza-vedado.csv` y `docs/productos/cazador/cazador-v0.html`. **Artifact PRIVADO** (lleva teléfonos reales; no compartir): https://claude.ai/artifact/64rj4EUFgC7oma1w8n5ghS. El avance (comprobaciones y pasos) se guarda solo en el navegador del teléfono; «Copiar seguimiento» para guardarlo. Nada se manda solo. **Siguiente (Ernesto):** 10 al día, cada uno revisado antes (abierto, no estatal, teléfono del negocio). Supabase y bot solo si sale ≥1 demo en 2 semanas.

   - **2026-10-12 ~00:15 Cuba (Claude) — tutorial 5 «Fotos para publicar» (gestoras) LISTO, SIN ENVIAR:** `docs/nexo-business/tutoriales/tutorial-fotos-para-publicar.mp4` (45 s, 5,5 MB, H.264+AAC, −15,2 LUFS, pico −1,1 dBFS), guion `tutorial-fotos-para-publicar-guion.txt`, borradores `…-mensaje-general.txt` (sección nueva + video + el bot busca cada producto de una lista) y `…-mensaje-yanaika.txt` (lo de «una carpeta con todos los productos»). Proyecto `videos/tutorial-fotos-para-publicar` (copia del 4; marca CV exacta, subtítulos quemados, voz B toma 2, Whisper: coincide palabra por palabra). Pantallas reales del área de una gestora aprobada renderizada en el servidor con `wp eval-file` (sin contraseña ni cuentas; copias del servidor borradas; nombre → «Tu nombre», `?ref=` difuminado, sin clientes). Etiquetas sacadas de Core 3.13.57. **Falta el SÍ de Ernesto** para subirlo a `/root/archivos/tutoriales/`, mandarlo al General con su mensaje y escribir a Yanaika.

   - **PARA EL LUNES 12-oct (cron del VPS, una vez; borrar las líneas "12 10" de crontab después):** 7:30 recordatorio del split a Ernesto · 7:35 propuesta de inversión del split (351 USD, gana 5 USD) a Maryta, Lennys y Dayra (…6597) + bot en pausa 3 h con Maryta y Lennys; plan en `/root/supervisor/tareas/split-plan.md` (Daiquel 3.000 CUP: recoger dinero, comprar en la tienda de 23 y 42 Playa, entregar a Anderson, cobrar y dar el dinero a Ernesto; Harley 10 USD de comisión al entregar) · 8:00 lista del día a Ernesto · 10:00 recordatorio del antimoho a Nana/Zaymi (preguntas abiertas) · 10:05 dudas de costos a Lennys. 9:00 (aprobado por Ernesto): buenos días + tutorial 5 en el General y aviso a Yanaika (`/root/supervisor/tareas/manana-9am.sh`). Página pública con los 5 tutoriales: casaviva.company/tutoriales/ (page 2942, vídeos 2937–2941). Cazador NEXO v0 (50 fichas): https://claude.ai/artifact/64rj4EUFgC7oma1w8n5ghS (privado).

## I. Relevo 2026-10-11 (Claude Code) — detalle del día
- **Casa Viva deja BizneCubano hoy (D38).** Manda la caja (nube NEXO). Puente de existencias caja ↔ web cada 2 min. Detalle técnico y pruebas: `docs/NEXO-CASA-VIVA-CIERRE.md` (checkpoint único). Errores aprendidos: `docs/00-FUENTE-DE-VERDAD/LECCIONES.md`.
- **Panel único de Lennys:** `casaviva.company/panel/` (también `negocio.nexocuba.com`; Vercel se publica a mano con redeploy). Tiene: entrada por WhatsApp/correo, resumen web del mes, pedidos web con acciones, gestoras (aprobar, pagos, invitación y QR), comisiones (solo en el panel, D37), inventario y precios.
- **Core (web):** versión 3.13.31; puerta `CVD_Panel_Bridge` (clave `CASAVIVA_PANEL_KEY`).
- **Mapa para Ernesto:** `docs/nexo-business/mapa-casa-viva.html`. **Propuesta red de gestoras para Lennys:** `docs/nexo-business/propuesta-red-de-gestoras.html` (esperando sus 5 respuestas).
- **Paso 0 hecho en la nube (2026-10-11, Claude):** nube de casa-viva ya en cero (0 ventas, 0 devoluciones, 0 comisiones). Equipos viejos apagados (`active=false`, reversible): `ernesto-pc-1010-acaf` (PC Lennys), `telefono-de-lennys-1008-cc65`, `telefono-de-zaymi-1008-566c` → sus ventas de prueba locales ya no pueden subir. 4 códigos de alta nuevos (48 h, entregados a Ernesto en el chat): PC de la tienda (Lennys), Teléfono de Lennys, Teléfono de Zaymi, Teléfono de Nana. PENDIENTE: que cada una borre los datos de la app y ponga su código (VERIFICAR: aparece su equipo nuevo en `devices`).
- **Paso 1 hecho (2026-10-11 ~04:10 UTC, Claude): crear/editar productos desde el panel.** Función `nexo_business_product_save` + fotos en bucket `nexo-product-photos` (migración `20261011060000`). Panel: botón "Nuevo" en Productos e Inventario; tocar un producto abre su ficha (foto, nombre, precio USD, quedan, categoría; SKU `nx-N` automático). Si el producto está en la web, el precio se copia allí. VERIFICADO en la caja de la PC de Ernesto: producto nuevo aparece con precio y tope de 4 unidades; cambio de precio 7,50→8,00 llega; al desactivarlo desaparece. Producto de prueba `nx-1` queda inactivo con 0. Publicado en `casaviva.company/panel/` (copia `~/bak-20261011-panel-index-antes-productos.html`). NO probado: la pantalla con sesión de dueña ni subir una foto real (falta entrar con enlace) → probar con Ernesto/Lennys. NO publicado en Vercel (`negocio.nexocuba.com`): falta commit+push, sin permiso aún. Los productos nuevos NO se crean en la web (solo caja).
- **Paso 2 hecho (2026-10-11, Claude): mensajería por zona en el panel** → Ajustes → Mensajería. Core **3.13.32** (copia `~/bak-20261011-cvd-3.13.31`, tarifas `~/bak-20261011-cvd_shipping_rates.json`): `GET/POST panel/shipping-rates` + `CVD_Shipping_Rates::save_rate` (registro de cambios en `cvd_shipping_rates_log`). `nexo-panel-web`: `shipping_rates`, `shipping_rate_save`. VERIFICADO en el servidor: crear, editar, cotizar y rechazar precio malo; tarifas restauradas idénticas (360 filas). Sin clave → 401. Ojo: si alguien sube `VERSION` en `class-cvd-shipping-rates.php`, el CSV pisa lo cambiado en el panel.
- **Paso 3 hecho: inicio del mes web + tienda** (Resumen, arriba): concretado = web completados + caja neta de devoluciones; por atender y perdido = web; productos a la venta / agotados / categorías; botón "Tienes N pedidos de la web por atender".
- **NO probado de los pasos 1-3: las pantallas con sesión de dueña** (no puedo entrar sin enlace). Probar con Ernesto conectado en el paso 4. Publicado en `casaviva.company/panel/` y en Vercel (`negocio.nexocuba.com`, `dpl_FNQv86cwtXDdHb4evB4sUQJ5tYs5`, VERIFICADO). Commits: NEXO `fa2a352` (main), Casa-Viva `16dc2ce` (main).
- **2026-10-11 ~05:00 UTC (Claude, decisiones de Ernesto):** (1) Producto nuevo del panel se crea también en la web (Core 3.13.33 `panel/products/save`, stock 0 + puente; `nexo_business_product_link_web`). VERIFICADO de punta a punta: producto NEXO → web → puente puso 3 en la web; prueba borrada. (2) Web en cero: 85 pedidos de prueba borrados con sus eventos, cuenta de mensajeros y pago (copias en tablas `bak20261011_*` de la base de la web; `wp db export` no funciona en Hostinger). (3) **Clientes** (Core 3.13.34, tabla `wp_cvd_clients`, una fila por teléfono): se llena sola con cada pedido web, con su gestora; la gestora ve "Mis clientes" en su área (añadir, buscar, WhatsApp con su enlace); un cliente no pasa de una gestora a otra; "no quiere mensajes". Panel → pestaña Clientes (filtrar por gestora, añadir/corregir, WhatsApp, Excel). VERIFICADO en servidor (crear, regla de dueña, lista, área de dos gestoras); NO verificado: el llenado automático con un pedido real (primer pedido). Pendiente: clientes desde la caja (necesita caja 1.0.5) y unir con los contactos del bot (`crm_contacts`). (4) Reembolso automático en devoluciones: caja **1.0.5** compilada en GitHub (Release caja-v1.0.5, solo Windows; PROBADO EN CI, no instalado ni probado en uso). Los teléfonos siguen con 1.0.4 hasta compilar la APK en la laptop. (5) negocio.nexocuba.com se queda para otros comercios (decisión de Ernesto). Ernesto prueba el panel con su acceso; mensajeros y contraseña mañana; BizneCubano lo cierra Lennys.
- **2026-10-11 ~05:10 UTC — mensajeros y clientes unidos (Claude):** Core 3.13.35 `panel/messengers` (+ aprobar con la lógica de gestoras) y `panel/clients/bulk`. Migración `20261011080000`: `people.kind` admite `messenger`, `people.woo_user_id`, funciones para el puente. `nexo-stock-bridge` ahora también: (C) copia mensajeros de la web a la caja (aprobado = activo; el piloto no), (D) envía a la lista de clientes de la web los clientes anotados en la caja y los contactos del bot con rol cliente. Panel → Equipo → Mensajeros (por aprobar/activos, carreras, por pagarle, aprobar/quitar, enlace `/registro-mensajero/`). Caja **1.0.6** (Release `caja-v1.0.6`, Windows): al cobrar "Entrega" (se lo lleva el cliente / mensajero aprobado) y "Cliente (opcional)" nombre + teléfono; "Efectivo de mensajeros" sugiere los nombres. VERIFICADO EN OPERACIÓN en la PC de Ernesto (1.0.6 instalada): Pedri aparece en la caja; venta de 2 alfombras con Pedri y cliente → nube con cliente y mensajero → web con cliente (caja, 1 compra, 20 USD); devolución con reembolso automático 10→20 USD. 61 contactos del bot ya en la lista de clientes. Venta y devolución de prueba borradas de la nube después (copia en `nexo_backup`). Los teléfonos necesitan la APK nueva para tener esto.
- **2026-10-11 ~06:00 UTC — auditoría y limpieza del panel (Claude, skills ECC click-path-audit + make-interfaces-feel-better, con la sesión de Ernesto):** 22 fallos y textos revisados. Quitados los controles que podían deshacer D38 ("Importar ahora"/importación automática de BizneCubano y "Quién manda en el precio"). Productos e Inventario unidos en una pantalla (foto + nombre, debajo precio y quedan editables; filtros Todos/Agotados/Pocas unidades/Sin costo/Ocultos/No coincide con la web solo si hay). "Llegó mercancía": botones Hacer foto / Galería; el botón de Curru solo aparece si está activada (hoy NO: falta el secreto `OPENAI_API_KEY` en Supabase; `nexo-curru` responde `{check:true}`). Resumen: "Este mes" arriba (Vendido / Por entregar / Cancelado), sin bloques vacíos, "Hay que reponer" solo agotados o bajo el aviso puesto. Pedidos: solo los de la web (los "del panel" nunca se usaron). Equipo: Gestoras / Mensajeros / Dependientas / Socios; cuentas de prueba ocultas (`test`: dueña/admin, piloto, sin WhatsApp, o meta `_cvd_test_account`, puesto al Auditor). **Gestoras de la caja = las de la web** (puente C2, `nexo_business_sync_gestoras`, migración `20261011090000`): 13 enlazadas por teléfono + 12 nuevas = 25. Ajustes → Cajas: código de 6 letras desde el panel (`nexo_business_owner_enrollment`) en vez de la clave larga; desactivadas plegadas. Textos sin jerga (POS, SKU, sincronizar, Excel). Core 3.13.36. Menú: 6 pestañas.
- **2026-10-11 ~07:30 UTC — bloque pedido por Ernesto (Claude):** cajas de prueba desactivadas (`android-pilot-01`, `redmi-de-ernesto-v1…`, `windows-pilot-01`); lista de clientes, atribuciones y notificaciones de la web en cero (copias `bak20261011b_*`). **Curru del panel y de la caja = la de la tienda** (Core 3.13.37 `CVD_Curru_AI::read_image`, ruta `panel/curru/invoice`; la clave de IA no sale de WordPress). **Llegó mercancía en la caja 1.0.7** (Inventario → botón; foto o galería, Curru, firma la dependienta de "Atiende"; función `nexo-device-receive`, `nexo_business_device_receive_goods`, lógica común `nexo_business.receive_goods_as`). **Historial por meses** (Resumen → "Meses anteriores": web + tienda, promedio). **Precio de oferta y "Cambiar varios"** (Productos; `nexo_business_bulk_prices`, columna `regular_minor`; Core 3.13.38 `panel/products/prices` pone precio normal y de oferta en la web). **Editar pedido web abierto** (Core 3.13.39 `panel/sales/{id}/edit|detail`: cantidades, quitar, añadir, teléfono, dirección; stock de la caja ajustado si el puente ya contó la línea; comisión recalculada). **Permisos por dependienta** (Equipo → Dependientas → ficha: devoluciones, recibir, conteos, resumen; la caja los aplica según "Atiende"). VERIFICADO: Curru lee una factura de prueba (panel y caja 1.0.7 en la PC); oferta 10→8 en caja y web y quitada; edición de pedido de prueba (2→3 + añadir, total 40) y borrado; permiso de Zaymi bloquea y se restauró; recibir desde caja simulado en transacción revertida (3→5, firma "Zaymi (caja)"). NO probado en uso real: guardar una entrada desde la caja, editar un pedido real con stock ya descontado. Caja 1.0.7 solo Windows; APK pendiente.
- **Web lista para mañana (2026-10-11, Claude, revisión completa):** hecho: pago por transferencia desactivado (no tenía cuenta; copia `~/bak-20261011-bacs.json`), post "Hello world" a borrador, "Blog" quitado del menú y pie (tema `casa-viva-storefront` editado en el servidor, NO está en el repo; copia `~/bak-20261011-theme-storefront`), nombre del sitio "Casa Viva", Core 3.13.40 (usuarios y páginas internas fuera de Google, aviso de mensajería en CUP). Pendiente de decisión de Ernesto/Lennys: políticas de garantía/devoluciones y privacidad (no hay ninguna publicada), productos duplicados (11 "Set de 2 alfombras para cocina 3d", tabla de planchar ×2, alfombra peluche ×2), página de ayuda pública con instrucciones internas, "más vendidos" = "nuevos" en la portada, WhatsApp en el pie, 10 productos sin descripción, 27 en "Otros".
- **Web, segunda pasada (2026-10-11, Claude):** productos con el mismo nombre eran diseños distintos (fotos distintas) → NO se unieron; se renombraron con su diseño en la web y en la caja (11 "Set de 2 alfombras para cocina 3D — diseño …", tabla de planchar floral / rayas, alfombra peluche lisa crema / diseño arcos; copia `~/bak-20261011-renombres.json`). Página de ayuda pública: quitadas las secciones internas (caja y administración) y lo de BizneCubano (copia `~/bak-20261011-ayuda.html`). Portada: quitado "Productos más vendidos" (era igual a "Nuevos"). Pie: "WhatsApp: 5405 6173". 10 descripciones nuevas (ventilador F6 ×3, albornoz ×3, cesto de pedal 7 y 15 L, cojín, set de utensilios; sin datos técnicos inventados; copia `~/bak-20261011-descripciones.json`). Core 3.13.41: meta description en productos, tienda y categorías.
- **Recategorizado (2026-10-11):** "Otros" vacío. 30 productos movidos en la web y en la caja: Accesorios (paraguas, mochilas, riñonera), Navidad (nueva: bolas, casas en miniatura), Apagones y energía (power banks, panel y luces solares), Tecnología, Movilidad (auto/moto), Organización, Cuidado personal; escritorio/silla/cama/cestos sin "Otros"; cesto de pedal solo Baño y Cocina. Copia `~/bak-20261011-categorias.json`.
- **PENDIENTE — preguntar a Lennys (política de devoluciones y garantía, para publicarla en la web):** (1) ¿cuántos días tiene el cliente para devolver o cambiar?; (2) ¿qué cubre la garantía y por cuánto tiempo (electrodomésticos, ventiladores, resto)?; (3) ¿qué no se acepta (usado, sin caja, higiene personal, rebajas)?; (4) ¿se devuelve el dinero, se cambia o se da saldo?; (5) ¿quién paga la mensajería de ida y vuelta en una devolución? (hoy el mensajero cobra la mitad por el regreso); (6) ¿cómo lo pide el cliente (WhatsApp, tienda) y qué tiene que enseñar? Con sus respuestas: publicar "Garantía y devoluciones" y "Privacidad" en español, enlazarlas en el pie y asignarlas en WooCommerce.
- **Para entregar (bloqueante):** (a) re-alta de cajas de Lennys/Zaymi/Nana; (b) prueba del panel con sesión de dueña (productos con foto, mensajería, inicio, gestoras, acciones de pedido); (c) Lennys confirma que entra con WhatsApp; (d) decidir flujo de producto nuevo en la web; (e) mensajeros reales dados de alta con su WhatsApp; (f) cambiar contraseña de "Mensajero piloto" y rotar claves vistas en capturas; (g) atender pedidos web en espera #2820, #2827, #2881 (y cerrar la prueba #2677); (h) Lennys liquida comisiones pendientes en BizneCubano. Verificar en uso real: primer pedido web resta en la caja, primera acción de pedido, primer pago a gestora, caja 1.0.4 instalada en la PC de Lennys.
- **Siguiente (en orden):** (0) por la mañana: vaciar datos de caja de Lennys/Zaymi/Nana y volver a dar de alta; comprobar el primer pedido web real en Inventario; (1) crear/editar productos desde el panel (y que lleguen a la caja); (2) precios de mensajería por zona en el panel; (3) inicio del mes con web + caja juntas; (4) pasada de diseño y textos del panel (skills ECC: click-path-audit, browser-qa, make-interfaces-feel-better, accessibility) con Ernesto conectado.
- **Auditoría de mensajeros (2026-10-11 noche, Claude; SOLO local, sin desplegar ni commit):** VivaBot `src/dispatch.js` (solo "Yo" exacto cuenta; "Yo #N" por privado funciona; "entregado #N" con varias carreras; CUP/transferencia al declarar; ofertas cerradas ya no se toman; no republica si falla Core; aviso de pendiente sin aprobar) y Core `class-cvd-bot-bridge.php` (mensajero aprobado queda Disponible; se vuelve a publicar si se reoferta; el WhatsApp verificado del pedido no lo cambia otro número) + placeholder de `/seguimiento/`. Guía: `docs/nexo-business/tutoriales/mensajeros.md`. **Bloqueantes:** si ningún mensajero aprobado está "Disponible", "Listo para salir" no abre la oferta y el bot no publica nada; los mensajeros no pueden entrar a `/area-mensajeros/` (el enlace de acceso solo vale para gestoras); el libro de ganancias acredita el 90 % de la mensajería como "por pagarle" aunque el mensajero ya se quedó con toda (decidir). El reparto sigue apuntando por defecto al grupo de prueba "PRUEBA Mensajería CV" (`DISPATCH_GROUP` en el VPS decide).
- **Reparto directo (2026-10-11, Claude; SOLO local, commits sin subir ni desplegar):** Core **3.13.48** rama `reparto-directo` (Casa-Viva `eb326ac`), VivaBot rama `reparto-directo` (`0ce423d`), panel en esta rama. (1) La gestora elige "Mensajero que lo lleva" en Ventas (o "mensajero: Nombre" en la nota del cliente) → al pulsar "Listo para salir" se asigna directo, no sale al grupo; el bot le manda el vale por privado y avisa a la tienda. Si ya no está aprobado, sale al grupo como siempre. (2) Mensajero: botón "Entregué el dinero en la tienda" (solo aviso; la tienda sigue cerrando con "Dinero recibido"). (3) "Yo" y "entregado" del bot ya mandan los mismos avisos que la web. (4) Vale con enlace "Marca cada paso aquí". (5) Panel: "Lo lleva · Hora", pasos del pedido, aviso de dinero entregado y "Seguimiento del cliente". (6) /seguimiento/ con Preparando y Listo para salir, nombre del mensajero y hora. **Falta:** desplegar Core + bot + panel y probar en la tienda.

### Fábrica NEXO — plantillas (2026-10-11)
- Plantilla reutilizable del caso Yonar en `docs/plantillas/propuesta-cliente/` (demos calendario/tienda, 4 videos HyperFrames, página de propuesta, scripts rebrand/transcribir/musica/serve, `cliente.ejemplo.json`, LEEME con 3 paradas de aprobación).
- Skill nueva `/propuesta-cliente` (~/.claude/skills/propuesta-cliente).
- Plan completo: https://claude.ai/artifact/JVSzPBgLq4imQ36QhpbdW3
- Hecho: skill /editar-video-cliente + scripts/video_cliente.py (preparar/final, probado preparar), scripts/voz.py (ElevenLabs + chequeo Whisper), gallery-dl 1.32.16 instalado.
- Voz local OK: .env con clave ElevenLabs (puesto por Ernesto), voz.py probado (Whisper 100%).
- Hecho: skill /kit-demo + scripts/kit_demo.py (probado con cliente ficticio: 0 restos de Yonar).
- Vercel: NO publicar demos de Yonar hasta que Yonar diga que sí (decisión de Ernesto, 2026-10-11).

### Motor de precios (2026-10-11 noche, Claude, solo diseño)
- Diseño en `docs/nexo-business/motor-de-precios.md`: capas (general → categoría → proveedor → producto), suelo de margen, redondeo, CUP con tasa del día, tope de gestora, ofertas, «recibo del precio», perfiles («Tienda Casa Viva», «NEXO bajo pedido» = D43, «Bolsa»), 3 opciones PROPUESTAS y caso Parker/Harley. Nada cambiado en código ni datos.
- Hallazgos para revisar: 19 productos con precio < costo apuntado (¿costo por paquete o en CUP?); dos tasas CUP (web 780 / nube 775); orden de comisión distinto nube vs web; producto 1013 (Parker) sin comisión propia → por la web cobraría 10 % (36,50 USD) sobre un margen de 25; margen objetivo 30 % de Ajustes no coincide con los precios reales.
- **Siguiente:** Ernesto responde las 5 preguntas del Parker y manda a Lennys las 11 preguntas (§6); con eso, paso 1 (función pura + simulador, 1–2 días).

### Herramientas para gestoras (2026-10-12)
- Análisis SOLO LECTURA (chats, soporte, área de gestoras, docs NEXO) y plan: `docs/nexo-business/herramientas-gestoras.md` (qué piden, 10 cosas gratis, mapa gratis/pago con planes borrador Caja 10 · Con gestoras 15 · Pro 20 USD/mes, modelo de dinero, gestoras como afiliadas, pruebas en Casa Viva, hoja de ruta y medidas). **Siguiente:** Ernesto aprueba los planes y la semana 1 (FAQ 26 de pago de comisiones con Lennys, botón "cómo comprar", tarjeta "qué le digo al cliente").

### Buscador de negocios por ciudad y nicho (2026-10-11, etapa 1 de idea-a-producto)
- Ficha: `docs/productos/buscador-negocios.md` · prompts de las 4 etapas: `docs/productos/buscador-negocios-prompts.md`. Solo investigación: no se construyó nada ni se mandó ningún mensaje.
- Para **NEXO interno** (Ernesto) primero; para gestoras, ahora no (sus clientes son personas; "Buscar precios" ya cubre lo de competidores).
- Fuente: **OpenStreetMap/Overpass** (gratis). Plaza de la Revolución: 1.316 negocios, 27 % con teléfono; 167 con teléfono y sin web ni redes en 3 nichos. **Google Places no** (Cuba está en los "Territorios prohibidos" de Google Maps Platform, más OFAC/D14). Revolico y Cubísima no permiten copiar datos.
- **Siguiente:** Ernesto aprueba la etapa 2 (boceto de tarjetas) y la versión 0: un script que saque 50 fichas de Plaza, una lista en CSV y 10 contactos al día a mano. Supabase y el bot, solo si sale al menos 1 demo en 2 semanas.
