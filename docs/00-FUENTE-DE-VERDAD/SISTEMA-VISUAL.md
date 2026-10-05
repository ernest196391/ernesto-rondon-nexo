# SISTEMA VISUAL NEXO

**Estado:** se empieza desde cero, con Ernesto, en sesiones cortas. Nada de este archivo es definitivo hasta que diga "APROBADO" en la tabla de abajo.

## Lo que pide la marca (del Prompt Maestro)

Clara, ágil, confiable, cercana, tecnológica, premium, humana, precisa. Ni fría ni infantil.
Tipografía Helvetica o equivalente, **no Inter**.
Prohibido: robots, cerebros, gradientes morados, neón, dashboards falsos, cifras o testimonios inventados, fotos de banco genéricas.
Debe extenderse a NEXO, NEXO Business, NEXO Impulsa sin parecer marcas distintas.

## Lo que existe hoy (auditoría 2026-10-05)

| Pieza | Dónde | Problema |
|---|---|---|
| Logo actual | `public/brand/nexo-logo.png` | "N" en 3D con degradado azul-cian brillante: choca con la regla "sin gradientes ni neón". Solo existe en PNG, no hay SVG. |
| Colores de la caja | `apps/business-pos/src/nexo.css` (`--nx-primary #1D3B5C`, `--nx-accent #F2B544`…) | Paleta sobria y usable; nació para la caja de Casa Viva, no se decidió como marca NEXO. |
| Letras | Inter en partes de la web, Arial/Helvetica en otras, Figtree y Atkinson en la caja | Tres familias distintas; Inter está prohibida por el brief. |
| Logo de la agencia anterior | Manual en SVG de la etapa "agencia" | Pertenece a la marca vieja; se revisa para no perder ideas buenas. |

Conclusión: **no hay sistema visual NEXO todavía**. Hay piezas sueltas.

## Proceso (una sesión por paso, todo desde el móvil)

| Paso | Qué decidimos | Entregable | Estado |
|---|---|---|---|
| 1 | Personalidad: 3 direcciones visuales distintas, con ejemplos de pantallas reales (caja, panel, web) | Lámina de 3 direcciones | PENDIENTE |
| 2 | Símbolo y logotipo: la idea de "unión" dibujada sin degradados | 3–5 bocetos SVG → 1 elegido | PENDIENTE |
| 3 | Letras: familia principal (Helvetica o equivalente libre para web y apps sin internet) | Prueba en caja y web | PENDIENTE |
| 4 | Color: 1 color de marca + 1 de acento + neutros + estados (bien, aviso, error), probados en claro y oscuro | Tokens | PENDIENTE |
| 5 | Descriptores: NEXO Business / NEXO Impulsa | Lockups | PENDIENTE |
| 6 | Componentes base: botón, tarjeta de producto, fila de lista, chip, aviso | Tokens + CSS compartido | PENDIENTE |
| 7 | Aplicación: caja, panel, web `nexocuba.com` | Pantallas | PENDIENTE |

Regla técnica cuando esté aprobado: los colores y letras viven como **tokens** en un solo archivo CSS compartido; la marca de cada comercio (por ejemplo Casa Viva) solo sobrescribe tokens, como ya hace `themes/casaviva.css`.

## Decisiones visuales aprobadas

| Fecha | Decisión |
|---|---|
| — | (ninguna todavía) |
