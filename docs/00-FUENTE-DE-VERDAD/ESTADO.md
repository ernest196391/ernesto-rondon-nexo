# ESTADO — dónde va cada proyecto

**Última actualización:** 2026-10-05 (auditoría inicial, Claude).
Regla: el agente que termine un bloque de trabajo actualiza **su fila** y la fecha de arriba.

Estados: **FOCO** (se trabaja ahora) · **ACTIVO** (funciona, solo mantenimiento) · **ESPERA** (bloqueado por algo externo) · **PAUSADO** (no se toca hasta que se cumpla su condición) · **POR CLASIFICAR** (Ernesto debe decir qué es).

---

## Dónde estás ahora (resumen de 30 segundos)

1. **Tu activo más avanzado es NEXO Business funcionando en Casa Viva** (caja sin internet en Windows y Android, panel para la dueña, gestoras, comisiones, socias, costos, puente con la web). Falta probarlo en la tienda y que Lennys lo use de verdad.
2. **El riesgo más urgente es el dominio `casavivadecuba.com`**: va a desaparecer y de él cuelgan la tienda NEXO, Cuyana y Cuadre. Hay que mudarlos antes de soltarlo.
3. **Todo lo demás queda en pausa** hasta que NEXO Business cobre a tres comercios (Casa Viva, Mercado 23 y 28, Colo Shop). Construir más cosas ahora solo aumenta el desorden.

---

## A. Plataforma NEXO (lo que se vende)

| Pieza | Estado | Dónde vive | Qué hay hecho | Siguiente acción exacta |
|---|---|---|---|---|
| **NEXO Business** (caja, inventario, panel, equipo, sincronización) | **FOCO** | Repo `ernesto-rondon-nexo`: `apps/business-pos`, `apps/business-dashboard`, `packages/business-*`, `supabase/`. Nube: Supabase `nexo-production`. Panel: `nexo-negocio.vercel.app` | Caja offline Windows + Android probada; ventas, caja, fiado, devoluciones, consignación, mensajeros; panel de dueña con resumen, costos, gestoras, socias, compra de personal; importación del Excel de Casa Viva (43 filas listas, 135 por revisar); puente WooCommerce en modo seguro (no ha publicado nada aún) | Ir a la tienda: probar escáner real, lector USB y un turno de 8 h sin internet. Luego que Lennys revise las 135 filas en "Necesita tu atención". Detalle: `docs/nexo-business/HANDOFF_2026-10-04.md` §10 |
| **Tienda NEXO + oficina de gestoras web** | ACTIVO (con riesgo) | Mismo repo: `app/`, `lib/`. Render, dominio `nexotienda.casavivadecuba.com` | Catálogo, carrito, checkout por WhatsApp, oficina de gestoras, asistente, admin | Mudar a dominio NEXO antes de que caiga `casavivadecuba.com`. Decidir si sigue en Render o pasa a Vercel (ver Decisiones pendientes) |
| **Product Studio** (fotos → fichas de producto) | PAUSADO | `app/studio`, `wordpress/nexo-product-studio`, `docs/PRODUCT_STUDIO_ONE_BLUEPRINT.md` | Captura, fichas, publicación a Woo parcial | Se reanuda como función "Digitaliza tus productos" dentro de NEXO Business cuando entre el piloto Mercado 23 y 28 |
| **Asistente WhatsApp (VivaBot)** | ACTIVO (en construcción) | Repo `ernest196391/vivabot`, VPS Hostinger, número 5354056173 | Bot vinculado; responde y escala; resumen de dueña de solo lectura desde NEXO (`nexo_owner_summary`) | Que lea catálogo y stock **solo** de NEXO Business (una sola verdad). Conseguir número de negocio aparte del personal |
| **Kits de Implementación** (auditoría, contenido, web studio…) | PAUSADO | `kits/*/SPEC.md` | Especificaciones | Se usan como herramientas internas al implementar NEXO en cada comercio |

## B. Pilotos de NEXO Business (comercios)

| Comercio | Estado | Modo | Qué hay | Siguiente acción |
|---|---|---|---|---|
| **Casa Viva** | **FOCO** | NEXO nativo (caja + panel + web WooCommerce `casaviva.company`) | Todo lo de NEXO Business arriba | Pruebas en tienda + uso diario de Lennys. Web propia: decidir cuándo `casaviva.company` sustituye a BizneCubano |
| **Colo Shop** | ESPERA (pago) | Conector: siguen con AxisSoft, NEXO conecta la tienda online | Contrato del piloto escrito (`docs/nexo-business/COLO_SHOP_PILOT.md`) | **No invertir más horas hasta que pague.** Cuando pague: comprar su dominio y hacer la importación asistida desde Axis |
| **Mercado 23 y 28** | ESPERA (decisión) | NEXO nativo (tercer piloto) | Demo con catálogo, carrito y asistente "Veci" en `mercado23y28.vercel.app` | Confirmar con el dueño que entra como piloto y qué paga. Sustituye a "Estilo y Hogar" como siguiente piloto nativo (ver Decisiones) |

## C. Negocios de servicios propios (usarán NEXO, con su propia marca)

| Negocio | Qué es | Estado | Dónde vive | Siguiente acción |
|---|---|---|---|---|
| **Cuyana** | Remesas Guyana → Cuba | ACTIVO | Repo `cuyana-app`, Vercel `cuyana-app`, Supabase `cuyana`, `cuyana.casavivadecuba.com` | Mudar dominio. Revisar el impacto de las nuevas reglas de EE. UU. (ver `PAGOS-Y-LEGAL.md`) |
| **Curuguay** | Remesas Uruguay → Cuba | POR CONFIRMAR | Vercel `curuguay` | Ernesto: ¿está operando? ¿quién lo opera? |
| **Zaldívar** | Remesas (corredor por confirmar) | POR CONFIRMAR | Vercel `zaldivar-web` | Ernesto: ¿qué corredor y en qué estado está? |
| **Cuadre** | Contabilidad para operadores de remesas | PAUSADO | Repo `cuadre`, Vercel `cuadre`, Supabase `gestor-remesas` (**inactivo**) | Pausado hasta que haya un operador que pague. La lógica de caja y comisiones de NEXO Business puede servir de base |
| **Servicio de energía solar** (antes "NEXO Energía") | Diagnóstico, venta e instalación | PAUSADO (renombrar) | Vercel `nexo-energia` (`nexo-energia-seven.vercel.app`) | Darle un nombre propio sin "NEXO". Unificar con JRG si es el mismo servicio (ver Decisiones pendientes) |
| **JRG Electronics** | Instalación solar y eléctrica (cliente) | ACTIVO | Vercel `jrg-electronics` | Mantener. Su catálogo de equipos y el de energía deben salir de un mismo catálogo |

## D. Ideas en pausa

| Idea | Estado | Condición para reactivar |
|---|---|---|
| Triciclub (transporte y entregas) | PAUSADO | Cuando NEXO tenga la capacidad de entregas en uso con al menos un comercio |
| Plantilla de remesas clonable para otros corredores | PAUSADO | Cuando Cuyana sea rentable y estable |
| Studio One (crear marcas y tiendas en automático) | Fusionado | Es lo mismo que Implementación NEXO + kits. No se construye aparte |
| Agencia (Rocket Social Media, Brand Lovers) | Fusionado | Pasa a ser "Implementación NEXO" |

## E. Proyectos en Vercel por clasificar

Existen y no están documentados en ningún lado: `frutos-secos`, `todo-hogar`, `larampa`, `vitayaq`, `los-guajiros`, `tienda-barrio`, `nexo-plan-veci`.
**Ernesto:** dime para cada uno si es cliente, demo, idea o basura. Los que sean demos sin cliente se archivan.

## F. Infraestructura (inventario verificado 2026-10-05)

| Recurso | Cantidad | Detalle |
|---|---|---|
| Repos en GitHub conocidos | 5+ | `ernesto-rondon-nexo` (principal), `vivabot`, `cuyana-app`, `cuadre`, `Casa-Viva` |
| Proyectos Supabase | 4 | `nexo-production` (activo, **el central**), `cuyana` (activo), `gestor-remesas` (inactivo), `ernest196391's Project` (inactivo, sin uso conocido) |
| Proyectos Vercel | 15 | Ver secciones C y E |
| Render | 2 servicios | Tienda NEXO web + worker de contenido |
| Hostinger | Hosting compartido + VPS | WordPress de Casa Viva; VPS del bot |
| Dominios | `casaviva.company` (nuevo), `casavivadecuba.com` (**se va**), `nexocuba.com` (elegido; confirmar si ya está comprado) |

## Decisiones pendientes de Ernesto (en orden)

1. ¿Ya compraste `nexocuba.com`? Es el destino de la mudanza.
2. Los 7 proyectos de Vercel de la sección E: ¿qué es cada uno?
3. Curuguay y Zaldívar: ¿operando o en pausa? ¿Quién los opera?
4. Nombre para el servicio de energía, y si JRG y ese servicio son lo mismo.
5. Mercado 23 y 28: ¿ya aceptó ser piloto?
