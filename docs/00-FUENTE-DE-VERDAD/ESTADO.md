# ESTADO — dónde va cada proyecto

**Última actualización:** 2026-10-05 tarde (mudanza a nexocuba.com, Claude).
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
| **Tienda NEXO + oficina de gestoras web** | ACTIVO (mudándose) | Mismo repo: `app/`, `lib/`. Render, hoy en `nexotienda.casavivadecuba.com`; destino `tienda.nexocuba.com` | Catálogo, carrito, checkout por WhatsApp, oficina de gestoras, asistente, admin | Ernesto: añadir `tienda.nexocuba.com` en Render y fijar `NEXO_PUBLIC_URL` (sección G). Build de `main` arreglado el 2026-10-05 (antes fallaba y Render no podía publicar) |
| **Product Studio** (fotos → fichas de producto) | PAUSADO | `app/studio`, `wordpress/nexo-product-studio`, `docs/PRODUCT_STUDIO_ONE_BLUEPRINT.md` | Captura, fichas, publicación a Woo parcial | Se reanuda como función "Digitaliza tus productos" dentro de NEXO Business cuando entre el piloto Mercado 23 y 28 |
| **Asistente WhatsApp (VivaBot)** | ACTIVO (en construcción) | Repo `ernest196391/vivabot`, VPS Hostinger, número 5354056173 | Bot vinculado; responde y escala; resumen de dueña de solo lectura desde NEXO (`nexo_owner_summary`) | Que lea catálogo y stock **solo** de NEXO Business (una sola verdad). Conseguir número de negocio aparte del personal |
| **Kits de Implementación** (auditoría, contenido, web studio…) | PAUSADO | `kits/*/SPEC.md` | Especificaciones | Se usan como herramientas internas al implementar NEXO en cada comercio |

## B. Pilotos de NEXO Business (comercios)

| Comercio | Estado | Modo | Qué hay | Siguiente acción |
|---|---|---|---|---|
| **Casa Viva** | **FOCO** | NEXO nativo (caja + panel + web WooCommerce `casaviva.company`) | Todo lo de NEXO Business arriba | Pruebas en tienda + uso diario de Lennys. Web propia: decidir cuándo `casaviva.company` sustituye a BizneCubano |
| **Colo Shop** | ESPERA (pago) | Conector: siguen con AxisSoft, NEXO conecta la tienda online | Contrato del piloto escrito (`docs/nexo-business/COLO_SHOP_PILOT.md`). Su web está en Vercel `frutos-secos` | **No invertir más horas hasta que pague.** Cuando pague: comprar su dominio y hacer la importación asistida desde Axis |
| ~~Mercado 23 y 28~~ | FUERA | — | No aceptó ser piloto (2026-10-05). La demo `mercado23y28.vercel.app` queda como ejemplo | Nada |

## C. Negocios de servicios propios (usarán NEXO, con su propia marca)

| Negocio | Qué es | Estado | Dónde vive | Siguiente acción |
|---|---|---|---|---|
| **Cuyana** | Remesas Guyana → Cuba | ACTIVO | Repo `cuyana-app`, Vercel `cuyana-app`, Supabase `cuyana`, `cuyana.casavivadecuba.com` | Mudar dominio. Revisar el impacto de las nuevas reglas de EE. UU. (ver `PAGOS-Y-LEGAL.md`) |
| **Curuguay** | Remesas Uruguay → Cuba (cliente) | EN CONSTRUCCIÓN | Vercel `curuguay` | Terminar y entregar al cliente sobre NEXO Business |
| **Zaldívar** | Remesas (cliente) | EN CONSTRUCCIÓN | Vercel `zaldivar-web` | Terminar y entregar al cliente sobre NEXO Business |
| **Cuadre** | Contabilidad para operadores de remesas | PAUSADO | Repo `cuadre`, Vercel `cuadre`, Supabase `gestor-remesas` (**inactivo**) | Pausado hasta que haya un operador que pague. La lógica de caja y comisiones de NEXO Business puede servir de base |
| **Luz Propia** (antes "NEXO Energía") | Diagnóstico, venta e instalación solar | PAUSADO | Vercel `nexo-energia` (`nexo-energia-seven.vercel.app`) | Nombre propuesto 2026-10-05, pendiente de tu sí. Dominio libre: `luzpropiacuba.com` (11,25 USD/año) |
| **JRG Electronics** | Instalación solar y eléctrica (cliente) | ACTIVO | Vercel `jrg-electronics` | Mantener. Su catálogo de equipos y el de energía deben salir de un mismo catálogo |

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
| `todo-hogar`, `larampa`, `vitayaq`, `tienda-barrio`, `nexo-plan-veci` | **Por clasificar**: Ernesto dice si es cliente, demo o archivo |

## F. Infraestructura (inventario verificado 2026-10-05)

| Recurso | Cantidad | Detalle |
|---|---|---|
| Repos en GitHub conocidos | 5+ | `ernesto-rondon-nexo` (principal), `vivabot`, `cuyana-app`, `cuadre`, `Casa-Viva` |
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
| Tienda NEXO + gestoras | `tienda.nexocuba.com` | DNS listo (CNAME → `ernesto-rondon-nexo.onrender.com`) | Ernesto en Render: servicio `ernesto-rondon-nexo` → Settings → Custom Domains → añadir `tienda.nexocuba.com`; y en Environment poner `NEXO_PUBLIC_URL=https://tienda.nexocuba.com`. El código ya lee esa variable (`lib/site.ts`) |
| Correo de la tienda (Resend) | — | Hoy usa `correo.nexotienda.casavivadecuba.com` | Crear dominio de envío `correo.nexocuba.com` en Resend y copiar sus registros a Hostinger |
| Fotos del catálogo | `casaviva.company/wp-content/...` | **HECHO** en código | Nada |

Regla: **no soltar `casavivadecuba.com`** hasta que esta tabla esté toda en verde. Las direcciones viejas siguen funcionando mientras tanto.

## Decisiones pendientes de Ernesto (en orden)

1. Hacer los dos pasos con tu login de la sección G (Render y Supabase). Te guío paso a paso.
2. ¿Aceptas el nombre **Luz Propia** para el servicio de energía? ¿Compro `luzpropiacuba.com` (11,25 USD)?
3. `todo-hogar`, `larampa`, `vitayaq`, `tienda-barrio`, `nexo-plan-veci`: ¿qué es cada uno?
4. ¿JRG y Luz Propia son el mismo negocio o separados?
