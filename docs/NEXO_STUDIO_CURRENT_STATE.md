# NEXO Studio — Current State

Fecha de checkpoint: 2026-08-24

## Producción

- Repositorio: `ernest196391/ernesto-rondon-nexo`
- Rama: `main`
- SHA de referencia al crear este checkpoint: `d10f8c16eddb160c571170963fa779b97eb7dc89`
- Runtime público: Render, servicio `ernesto-rondon-nexo`
- URL pública: `https://ernesto-rondon-nexo.onrender.com`
- Studio: `https://ernesto-rondon-nexo.onrender.com/studio`
- Worker de vídeo: `https://nexo-content-worker.onrender.com`

## Núcleo de plataforma ya implementado

- Postgres `nexo-studio` creado en Render.
- `DATABASE_URL` configurado manualmente por el usuario en el servicio principal.
- Projects persistentes server-side; el último draft legacy de `localStorage` se migra de forma conservadora.
- Historial de proyectos accesible desde Studio.
- Workspace persistente `/studio/project/[id]`.
- Runs, Artifacts y Project Memory persistentes.
- APIs propias de Studio para proyectos, runs, artefactos y memoria.
- La ejecución y la memoria permanecen desacopladas de proveedores de IA.

## Especialistas con primera ejecución utilizable

1. **Web Studio** — adquisición segura, 5 hallazgos, brief, prototipo y revisión humana. Falta completar captura/render y comparación visual de mayor fidelidad.
2. **Conversations** — simulador con IA opcional/fallback, guardrails, lead score y handoff. Aún no envía WhatsApp real; transporte oficial sigue desacoplado.
3. **Business Audit** — metodología del Kit 03 ya preservada en `kits/business-audit/`. La parte interna usa las 36 preguntas, privacidad, ocho áreas de madurez 1–5 con evidencia Pn, horas recuperables conservadoras, stack y riesgos. Siguen pendientes las 11 dimensiones públicas /100 con evidencia completa, cruces, mapas y HTML final unificado.
4. **Creator Intelligence** — primera auditoría pública trazable; métricas privadas/transcripciones profundas requieren fuente adicional.
5. **Content Studio** — worker separado con FFmpeg; convierte vídeo a 1080×1920 H.264/AAC y permite revisar/descargar. Transcripción, cortes inteligentes, encuadre y subtítulos del Kit 05 siguen pendientes.
6. **Brand Intelligence** — auditoría pública evidencia → interpretación → acción.
7. **Commerce Audit** — auditoría pública de señales e-commerce.
8. **Kit Builder** — genera manifest, SPEC, workflow y gates para un nuevo especialista.

## Infraestructura

- Servicio principal: `ernesto-rondon-nexo`.
- Worker multimedia: `nexo-content-worker`.
- PostgreSQL: `nexo-studio`.
- Variables confirmadas en el servicio principal: `DATABASE_URL`, `CONTENT_WORKER_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_MODEL`, `NEXO_ANALYZER_RATE_LIMIT_PER_HOUR`, `NEXO_STUDIO_DB_ID`.

## Gates superados desde el checkpoint anterior

1. `DATABASE_URL` dejó de ser bloqueo.
2. Persistencia server-side de Project/Run/Artifact/ProjectMemory implementada.
3. Continuidad entre dispositivos y migración del último draft local implementadas.
4. Kit 03 inspeccionado directamente y su contrato real preservado como NEXO Kit portable.
5. CI verde antes de los merges de persistencia y Business Audit.

## Deuda técnica conocida

- `package.json` incluye PostgreSQL, pero `package-lock.json` aún no fue regenerado en un entorno con acceso al registry; CI usa temporalmente `npm install` en vez de `npm ci`. Debe volver a lockfile reproducible cuando el entorno permita regenerarlo y validarlo.
- El conector SQL de Render exige SSL/TLS para conexión externa y no logró consultar la instancia; esto no equivale a un fallo de la conexión interna del servicio. La validación principal debe hacerse desde el runtime de NEXO y logs de Render.

## Siguiente secuencia

1. validar en producción el workspace persistente y las rutas de API;
2. completar paridad exterior y cruce del Business Audit usando evidencia real;
3. completar el pipeline avanzado del Content Studio desde el Kit 05;
4. completar captura visual/antes-después de Web Studio;
5. añadir ejecución trazable que conecte especialistas con Project → Run → Artifact;
6. preparar `MessagingProvider` oficial para WhatsApp; ese paso requerirá credenciales de Meta cuando se active;
7. cerrar QA móvil/escritorio, accesibilidad, errores, seguridad y dominio final.

## Regla de continuidad

Antes de continuar, leer `NEXO_STUDIO_INDEX.md`, `NEXO_STUDIO_BLUEPRINT.md`, `NEXO_STUDIO_MASTER_PROMPT.md` y este archivo. Consultar GitHub y Render porque `main` puede haber avanzado después del SHA de referencia.
