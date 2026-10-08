# ESTADO — dónde va cada proyecto

**Última actualización:** 2026-10-08 (reparto Casa Viva + gestoras + voz clonada + comunidad; relevo en `docs/nexo-business/HANDOFF_2026-10-08_MENSAJERIA.md`).
Regla: el agente que termine un bloque de trabajo actualiza **su fila** y la fecha de arriba.

Estados: **FOCO** (se trabaja ahora) · **ACTIVO** (funciona, solo mantenimiento) · **ESPERA** (bloqueado por algo externo) · **PAUSADO** (no se toca hasta que se cumpla su condición) · **POR CLASIFICAR** (Ernesto debe decir qué es).

---

## Dónde estás ahora (resumen de 30 segundos)

1. **Tu activo más avanzado es NEXO Business funcionando en Casa Viva** (caja sin internet en Windows y Android, panel para la dueña, gestoras, comisiones, socias, costos, puente con la web). Falta probarlo en la tienda y que Lennys lo use de verdad.
2. **Mudanza a `nexocuba.com` casi terminada** (ver sección G): panel, Cuyana y Cuadre ya funcionan en su dirección nueva. Faltan 2 pasos con tu login: la tienda en Render y el enlace de acceso del panel en Supabase.
3. **Todo lo demás queda en pausa** hasta que NEXO Business cobre a los dos pilotos (Casa Viva y Colo Shop), salvo terminar Curuguay y Zaldívar, que tienen clientes esperando.

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

## D. Ideas en pausa

| Idea | Estado | Condición para reactivar |
|---|---|---|
| Triciclub (transporte y entregas) | PAUSADO | Cuando NEXO tenga la capacidad de entregas en uso con al menos un comercio |
| Plantilla de remesas clonable para otros corredores | PAUSADO | Cuando Cuyana sea rentable y estable |
| Studio One (crear marcas y tiendas en automático) | Fusionado | Es lo mismo que Implementación NEXO + kits. No se construye aparte |
| Agencia (Rocket Social Media, Brand Lovers) | Fusionado | Pasa a ser "Implementación NEXO" |

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

**2026-10-08:** Lennys propuso (audios, sugerencia n.º 15) que lo extra que compra en tienda el cliente de una gestora sea de la gestora → aprobado por Ernesto (D33). Enviados a Lennys audio con voz de Ernesto + mensaje listo para gestoras. Puente para hoy (BizneCubano), pedido por Lennys: **en producción** VivaBot `7e47a77` + tabla `crm_extras`: `EXTRA gestora: producto precio` (Ernesto y números con permiso; por defecto Lennys) → 10 % a la gestora + aviso; `COMISIONES EXTRA`, `PAGADO EXTRA nombre`, `ANULA EXTRA n`, `PERMISO EXTRA 53…`. Falta: prueba de Ernesto y dar permiso a las dependientas. **Después:** programar botón "Añadir al pedido de la gestora" en `/ventas/` + aviso del bot. #2678 cerrado por Ernesto (completado, dinero verificado, comisión aprobada); falta probar la devolución. D34: gestoras pasan ya al sistema nuevo. Core **3.13.23** (Casa-Viva `f22d7af`, `932dea8`): registro sin correo ni contraseña obligatorios (correo interno `g53…@gestoras.casaviva.company`, se entra por enlace de WhatsApp), un WhatsApp = una cuenta, panel de gestora simplificado. Probado el enlace de acceso: funciona. Devolución probada en #2678; arreglado que no anulaba la comisión (Casa-Viva `c63c226`). Bot `cd9f185`: orden "mi acceso". Respuestas FAQ de gestoras 20,24,25,27,28,29,31 apuntaban a nexo-negocio.vercel.app (viejo): nuevas en `crm_knowledge.draft_answer`, **esperan aprobación de Ernesto**; la 26 (cómo se paga la comisión) necesita su respuesta. FAQ 20,24,25,27,28,29,31 **activadas** (aprobó Ernesto). **2026-10-08 12:33 Cuba: convocatoria de migración enviada al grupo "General"**; `ALTAS CONOCIDAS` activado. Preguntado a Lennys cómo se paga la comisión (FAQ 26 pendiente). **Catálogo (2026-10-08 13:10):** la copia BizneCubano → web estaba rota (dominio viejo, sin colores, sin "N disponibles"); arreglada (Casa-Viva `scripts/catalog`, commits hasta `5c3c91e`) y aplicada: 15 creados, 53 cantidades, 44 con colores, 16 ocultados (reversible con modo `restore`). Ahora se aplica **sola cada hora** (:25) con seguro si la lectura sale incompleta. **Caja Casa Viva Core v1.0.0 (lanzamiento):** APK firmado (clave del 4-oct en `%APPDATA%\com.nexo.business\signing`) + instalador Windows; alta de equipos con **código de 6 letras** (orden `ALTA CAJA Nombre` en el chat "Tú"; tabla `nexo_business.device_enrollments`, función `nexo-device-enroll`, rama `claude/pos-lanzamiento`). Probado en el Redmi: alta OK, 200 productos reales con fotos y cantidades. **Supervisor 24/7 encendido (D35)** en el VPS; primera vuelta OK 12:26 Cuba. Al empezar una sesión local: leer `crm_supervisor` (kind `hecho`) y pasar al repo Casa-Viva los cambios que haya hecho en la web.

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
