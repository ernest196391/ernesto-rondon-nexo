# AUDITORÍA 2026-10-05 — qué estaba desordenado y qué se hizo

Revisados: repo `ernesto-rondon-nexo` (commit `3965e93`), proyectos de Supabase y Vercel, memoria de proyectos de Ernesto, Blueprint v1.

## Hallazgos

| # | Hallazgo | Gravedad | Qué se hizo / qué falta |
|---|---|---|---|
| 1 | **Cuatro "fuentes de verdad" compitiendo**: `AGENTS.md` (Product Studio One, 6 docs), `CLAUDE.md` (protocolo NEXO Business, 8+ docs), `README.md` (portafolio "NEXO Skill Master"), `docs/NEXO-PRODUCT-OS.md` (constitución). 60+ documentos, ~6.300 líneas. | Alta | Creada esta carpeta como fuente única. `AGENTS.md`, `CLAUDE.md` y `README.md` apuntan aquí primero. Los demás docs se conservan como "de módulo" o "histórico". |
| 2 | **Un mismo producto con varios nombres**: NEXO Business = "Casa Viva Core" = Ultra Ventas; Product Studio = Product Studio One = NEXO Studio = PS1 = Studio One. | Alta | `GLOSARIO.md` fija los nombres. Se cambian en código cuando se toque cada parte. |
| 3 | **Decisiones contradictorias**: "Product Studio One será un repo independiente" (09-11) vs. "todo dentro de NEXO Business"; siguiente piloto "Estilo y Hogar" vs. Mercado 23 y 28. | Media | Resuelto en `DECISIONES.md` (D05, D07). |
| 4 | **El Blueprint v1 de esta mañana subestimaba lo construido**: recomendaba dejar la caja para después, pero la caja offline ya funciona en Casa Viva. | Media | Corregido (D04, `BLUEPRINT.md` v1.1). |
| 5 | **Dominio que se va con servicios vivos**: `nexotienda.`, `cuyana.` y `cuadre.casavivadecuba.com` cuelgan de un dominio que va a desaparecer. | **Crítica** | Pendiente: mudanza a `nexocuba.com` y dominios propios. Primera tarea técnica. |
| 6 | **Infraestructura dispersa**: 15 proyectos Vercel (7 sin documentar), 4 Supabase (2 inactivos, uno es la base de Cuadre), Render, Hostinger compartido + VPS. | Media | Inventariado en `ESTADO.md`. Pendiente: Ernesto clasifica los 7 proyectos. |
| 7 | **Riesgo legal nuevo**: reglas de la OFAC del 30-09-2026 afectan cobrar con la LLC de EE. UU. a negocios en Cuba. | **Crítica** | Documentado en `PAGOS-Y-LEGAL.md`; decisión prudente D14 hasta consultar abogado. |
| 8 | **Logo actual con degradado 3D** contradice el propio brief de marca. Sin SVG. Tres familias tipográficas, una prohibida (Inter). | Media | Proceso de sistema visual desde cero en `SISTEMA-VISUAL.md`. |
| 9 | **"NEXO Energía" mezcla la marca plataforma con un negocio de servicios.** | Baja | D09: se renombra. |
| 10 | **Muchos frentes abiertos a la vez** (remesas, energía, Triciclub, Cuadre, demos web) para una sola persona. | Alta | D10: cobrar antes de construir. Todo lo que no es NEXO Business o los 3 pilotos queda en pausa con condición de reactivación. |

## Qué NO se tocó

- Ningún código, base de datos, despliegue ni dato real.
- Ningún documento existente se borró ni se movió (D02).
- El protocolo autónomo de NEXO Business sigue vigente para trabajo técnico de ese módulo.

## Siguiente paso recomendado (en orden)

1. Ernesto responde las 5 decisiones pendientes de `ESTADO.md`.
2. Mudanza de dominios (crítico) — tarea técnica para Claude Code.
3. Sistema visual, paso 1 (con Ernesto).
4. Oferta NEXO Business con método Hormozi, con los resúmenes de Ernesto.
5. Pruebas en tienda de Casa Viva.
