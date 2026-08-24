# NEXO Studio — Índice maestro

> Estado: fuente de verdad de la evolución de NEXO hacia una plataforma de trabajo con IA basada en kits reutilizables.

## Documentos obligatorios

1. `docs/NEXO_STUDIO_BLUEPRINT.md` — visión de producto, arquitectura, módulos, experiencia, seguridad, roadmap y criterios de aceptación.
2. `docs/NEXO_STUDIO_MASTER_PROMPT.md` — prompt maestro para cualquier chat, agente o entorno que continúe el trabajo.
3. `docs/NEXO_STUDIO_CURRENT_STATE.md` — checkpoint operativo actual, producción, especialistas, infraestructura y siguiente bloqueo/gate.

## Regla de fuente de verdad

Antes de modificar NEXO Studio, leer este índice y los documentos anteriores. El repositorio y su rama `main` son la fuente de verdad del estado implementado. Los ZIP originales de los kits son material de referencia y aceleración, no la arquitectura final ni una dependencia obligatoria de Claude.

## Kits fuente disponibles

- 01 — Cazador de webs
- 02 — Agente WhatsApp
- 03 — Auditoría de negocio
- 04 — Análisis YouTube
- 05 — Editor de vídeo
- 06 — Marca personal
- 07 — Análisis e-commerce
- 08 — Creador de kits

Los ocho kits fuente ya están incorporados como referencia metodológica.

## Objetivo en una frase

Convertir NEXO en una plataforma premium de proyectos y especialistas de IA donde una persona pueda crear un proyecto, aportar URL/archivos/contexto, elegir una capacidad, ejecutar un flujo guiado, revisar lo entendido, obtener resultados accionables y conservar el historial sin tener que operar VS Code, Claude Code ni carpetas manualmente.

## Estado de bloques

- Bloque 0 — Blueprint: completado.
- Bloque 1 — Studio Foundation: primera versión completada.
- Bloque 2 — Web Studio: MVP funcional, paridad avanzada en evolución.
- Bloque 3 — Commerce + Brand + Creator: primera versión funcional.
- Bloque 4 — Business Audit: MVP funcional; falta paridad completa del Kit 03.
- Bloque 5 — Kit Builder: MVP funcional.
- Bloque 6 — Content Studio: worker/FFmpeg funcional; faltan capas avanzadas del Kit 05.
- Bloque 7 — Conversations: simulador/guardrails funcional; falta MessagingProvider real.
- Bloque 8 — Plataforma comercial: pendiente de persistencia server-side, permisos/uso y onboarding.

## Próximo gate

Persistencia real de Workspace → Project → Run → Artifact → ProjectMemory usando la base de datos creada en Render. Consulta `NEXO_STUDIO_CURRENT_STATE.md` para el bloqueo operativo vigente antes de actuar.
