# Product Studio One — reglas de agentes

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
