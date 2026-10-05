# NEXO — instrucciones para agentes (Codex, Claude Code, ChatGPT)

**PRIMERO, SIEMPRE:** lee `docs/00-FUENTE-DE-VERDAD/LEEME.md` y sigue su orden de lectura
(`ESTADO.md`, `GLOSARIO.md`, `DECISIONES.md`). Es la única fuente de verdad de todos los proyectos de Ernesto.

Al terminar cualquier bloque de trabajo: actualiza tu fila en `docs/00-FUENTE-DE-VERDAD/ESTADO.md`
y, si decidiste algo, añádelo al final de `docs/00-FUENTE-DE-VERDAD/DECISIONES.md`.
Habla con Ernesto en español sencillo, paso a paso; trabaja desde el móvil y no es programador.

Las reglas de abajo son **reglas de módulo**: valen solo para su parte y nunca contradicen la fuente de verdad.

---

## Módulo Product Studio — reglas de agentes

Antes de cambiar código o documentación, leer completos, en este orden:

1. `docs/PRODUCT_STUDIO_ONE_BLUEPRINT.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/ROADMAP.md`
4. `docs/TASKS.md`
5. `docs/HANDOFF.md`
6. `docs/DECISIONS.md`
7. las instrucciones más cercanas al archivo que se modificará.

El código y las migraciones ejecutadas mandan sobre la documentación; la documentación manda sobre los chats. Si hay contradicción, comprobar el sistema ejecutable y registrarla. No reclamar una tarea ya activa. Antes de editar, comprobar rama, commit, cambios locales, remoto y despliegue afectado. No duplicar módulos ni copiar entre repositorios sin contrato en `DATA_CONTRACTS.md` o `INTEGRATIONS.md`.

Al cerrar: ejecutar pruebas aplicables; actualizar tarea, estado, decisiones/contratos si cambiaron; y completar `HANDOFF.md` con objetivo, resultado, archivos, pruebas, commit/PR/despliegue, bloqueos y siguiente acción exacta. Nunca documentar valores de secretos.


## NEXO Business exception/routing

For work under `apps/business-pos`, `packages/business-*`, or `docs/nexo-business`, and for tasks explicitly about NEXO Business/Casa Viva integration, the controlling instructions are:

1. `docs/nexo-business/CLAUDE_AUTONOMOUS_PROTOCOL.md`
2. the NEXO Business source-of-truth files listed there.

Those instructions take precedence over Product Studio One task-claim workflow for NEXO Business work.