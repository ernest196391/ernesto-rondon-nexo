# NEXO — Fuente de verdad única

**Dueño:** Ernesto Rondón · **Creada:** 2026-10-05 · **Idioma:** español sencillo, pensado para leer en el móvil.

Esta carpeta es **el único lugar** donde vive la verdad de todos los proyectos de Ernesto.
Si un chat, un documento viejo o un agente dice otra cosa, **manda esta carpeta**
(y por encima de ella, solo el código y las migraciones que de verdad están en producción).

## Para cualquier agente (Claude Code, Codex, ChatGPT, otro)

Lee estos archivos **en este orden** antes de hacer nada:

1. `LEEME.md` — este archivo: reglas del juego.
2. `ESTADO.md` — en qué punto está cada proyecto y cuál es la siguiente acción.
3. `GLOSARIO.md` — los nombres oficiales. Usa siempre estos; nunca inventes nombres nuevos.
4. `DECISIONES.md` — lo que ya está decidido. No lo vuelvas a discutir sin motivo nuevo.
5. Según la tarea:
   - Estrategia, productos, marca → `BLUEPRINT.md`
   - Ofertas, precios, captación, ventas, cierre → `NEGOCIO.md`
   - Cobros, empresa, riesgos legales → `PAGOS-Y-LEGAL.md`
   - Colores, letras, logo, pantallas → `SISTEMA-VISUAL.md` (y el prompt de marca: `PROMPT-MARCA.md`)
   - Qué estaba desordenado y cómo se reorganizó → `AUDITORIA-2026-10-05.md`
6. Solo después, los documentos del módulo que vayas a tocar (ver "Documentos de módulo").

## Jerarquía (quién manda)

1. Código y migraciones ya aplicadas en producción.
2. Esta carpeta (`docs/00-FUENTE-DE-VERDAD/`).
3. Documentos de módulo (lista abajo). Explican el *cómo* de cada pieza, nunca contradicen el *qué* de esta carpeta.
4. Chats. **Un chat nunca es fuente de verdad.** Lo que valga de un chat se copia aquí.

## Reglas para agentes

- **Una sola fuente.** Antes de crear un repo, una base de datos, un proyecto de Vercel o un documento nuevo, comprueba si ya existe. Si hace falta uno nuevo, regístralo en `ESTADO.md` y la razón en `DECISIONES.md`.
- **Un solo idioma de nombres.** Usa `GLOSARIO.md`. Si encuentras un nombre viejo, no lo propagues.
- **Al terminar cada bloque de trabajo**, actualiza la fila del proyecto en `ESTADO.md` (fecha, estado, siguiente acción exacta). Si tomaste una decisión, añádela a `DECISIONES.md`.
- **Nunca** escribas contraseñas, tokens ni claves en ningún archivo.
- **Nada destructivo** con datos reales sin confirmación de Ernesto.
- **Explica a Ernesto** en español claro, paso a paso, sin jerga. No tiene formación técnica y trabaja desde el teléfono.
- **Si dudas si algo sirve, pregunta a Ernesto** antes de guardarlo o borrarlo.

## Documentos de módulo (siguen vigentes para su pieza)

| Módulo | Empieza por | Nota |
|---|---|---|
| NEXO Business (caja, inventario, panel, gestoras, sincronización) | `docs/nexo-business/CLAUDE_AUTONOMOUS_PROTOCOL.md` → `docs/nexo-business/STATUS.md` | El módulo más avanzado. Su protocolo sigue mandando para trabajo técnico dentro de `apps/business-*`, `packages/business-*`, `supabase/`. |
| Tienda y oficina de gestoras web (`app/`, `lib/`) | `docs/NEXO_COMMERCE_FIRST_BLUEPRINT.md`, `docs/NEXO_GESTORAS_001.md` | Corre en Render en un dominio que va a desaparecer (ver `ESTADO.md`). |
| Product Studio (fotos → fichas) | `docs/PRODUCT_STUDIO_ONE_BLUEPRINT.md`, `docs/TASKS.md` | Pasa a ser una función de NEXO Business, no un producto aparte (ver `DECISIONES.md`). |
| Reglas de diseño y calidad | `docs/NEXO-PRODUCT-OS.md` | Principios de UX; siguen valiendo. |
| Kits (auditoría, contenido, web studio…) | `kits/*/SPEC.md` | Herramientas de Implementación NEXO. |

Cualquier otro documento de `docs/` es **histórico**: sirve de referencia, no de instrucción.
