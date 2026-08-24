# NEXO Studio — Current State

Fecha de checkpoint: 2026-08-24

## Producción

- Repositorio: `ernest196391/ernesto-rondon-nexo`
- Rama: `main`
- SHA de este checkpoint: `b09ba129b9f6c6975edd1eb81781a5dfe1698f01`
- Runtime público: Render, servicio `ernesto-rondon-nexo`
- URL pública: `https://ernesto-rondon-nexo.onrender.com`
- Studio: `https://ernesto-rondon-nexo.onrender.com/studio`
- Worker de vídeo: `https://nexo-content-worker.onrender.com`

## Especialistas con primera ejecución utilizable

1. Web Studio — auditoría segura, 5 hallazgos, brief, prototipo y revisión humana.
2. Conversations — simulador con IA opcional/fallback, guardrails, lead score y handoff. Aún no envía WhatsApp real.
3. Business Audit — formulario de 36 preguntas, privacidad, evidencia interna y madurez tecnológica /5. La paridad completa del Kit 03 (11 dimensiones públicas /100, cruces, mapas e informe unificado) sigue en evolución.
4. Creator Intelligence — primera auditoría pública trazable; métricas privadas/transcripciones profundas requieren fuente adicional.
5. Content Studio — worker separado con FFmpeg; convierte vídeo a 1080×1920 H.264/AAC y permite revisar/descargar. Transcripción, cortes inteligentes y subtítulos del Kit 05 siguen pendientes.
6. Brand Intelligence — auditoría pública evidencia → interpretación → acción.
7. Commerce Audit — auditoría pública de señales e-commerce.
8. Kit Builder — genera manifest, SPEC, workflow y gates para un nuevo especialista.

## Infraestructura añadida

- `nexo-content-worker`: servicio Python/FFmpeg separado en Render.
- `nexo-studio`: Postgres gratuito creado en Render para persistencia futura.
- `CONTENT_WORKER_URL` configurado en el servicio principal.

## Bloqueo operativo actual

La base Postgres existe, pero el conector disponible no expone el secreto `Internal Database URL`, por lo que NEXO todavía no puede recibir `DATABASE_URL` automáticamente. Hace falta vincular manualmente la URL interna de `nexo-studio` al servicio `ernesto-rondon-nexo` como variable `DATABASE_URL`.

Una vez exista `DATABASE_URL`, el siguiente bloque es:

1. persistencia server-side de Workspace/Project/Run/Artifact/ProjectMemory;
2. migrar el proyecto mock/localStorage a persistencia real;
3. historial y continuidad de proyectos;
4. continuar paridad completa de Business Audit y Content Studio;
5. conectar `MessagingProvider` oficial para WhatsApp cuando existan las credenciales de Meta.

## Regla de continuidad

Antes de continuar, leer `NEXO_STUDIO_INDEX.md`, `NEXO_STUDIO_BLUEPRINT.md`, `NEXO_STUDIO_MASTER_PROMPT.md` y este archivo. Consultar GitHub/Render porque `main` puede haber avanzado después de este SHA.
