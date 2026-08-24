# NEXO Studio — Prompt maestro de continuidad

Usa este prompt cuando otro chat, agente o entorno de desarrollo deba continuar NEXO Studio.

---

## PROMPT MAESTRO

Estás continuando **NEXO Studio**, evolución del repositorio existente:

- Repositorio oficial: `ernest196391/ernesto-rondon-nexo`
- Rama de producción: `main`
- Fuente de verdad estratégica: `docs/NEXO_STUDIO_INDEX.md`
- Blueprint obligatorio: `docs/NEXO_STUDIO_BLUEPRINT.md`
- Este documento: `docs/NEXO_STUDIO_MASTER_PROMPT.md`

### OBJETIVO

Convertir NEXO en una plataforma premium de proyectos y especialistas de IA. El usuario debe poder crear/abrir un proyecto, aportar URLs, archivos y contexto, elegir o aceptar un especialista recomendado, revisar lo que NEXO entendió, ejecutar el flujo y recibir resultados persistentes y accionables sin tener que operar VS Code, Claude Code, JSON o scripts manualmente.

### MATERIAL FUENTE

Disponemos como referencia de siete kits externos:

1. Cazador de webs
2. Agente WhatsApp
4. Análisis YouTube
5. Editor de vídeo
6. Marca personal
7. Análisis e-commerce
8. Creador de kits

El kit 03 — Auditoría de negocio — está pendiente de incorporación cuando esté disponible.

Los ZIP son **referencia de patrones, metodología, scripts y UX de ejecución**, no código aprobado automáticamente ni arquitectura canónica. No copies secretos, sesiones, dependencias inseguras ni acoplamiento a Claude.

### PRINCIPIOS OBLIGATORIOS

1. **No reconstruyas NEXO desde cero.** Inspecciona el repositorio actual y evoluciona incrementalmente.
2. **No dependas de Claude.** NEXO debe ser proveedor-agnóstico.
3. **No dependas innecesariamente de IA.** Usa código determinista para tareas deterministas.
4. **No rompas funcionalidades existentes.** Mantén las rutas actuales mientras Studio se introduce.
5. **Premium = simple, claro, rápido y confiable.** Reduce texto y complejidad visibles.
6. **Evidencia antes de recomendación.** Distingue hecho, inferencia y recomendación.
7. **Revisión humana antes de acciones sensibles.** Usa el patrón “NEXO entendió esto” cuando corresponda.
8. **Seguridad por diseño.** Secrets fuera de Git, uploads validados, URLs seguras, ejecución controlada.
9. **Todo especialista se prueba.** Ningún kit está terminado sin ejemplo ejecutado y criterios de aceptación.
10. **Trabaja por PRs pequeños y reversibles.** Mantén CI verde.

### ARQUITECTURA DE PRODUCTO

NEXO Studio tendrá como núcleo:

```text
Workspace
  └─ Project
      ├─ Sources
      ├─ Runs
      │   ├─ Specialist
      │   ├─ Inputs
      │   ├─ Evidence
      │   ├─ Decisions
      │   └─ Artifacts
      └─ ProjectMemory
```

Especialistas previstos:

- Web Studio
- Conversations
- Creator Intelligence
- Content Studio
- Brand Intelligence
- Commerce Audit
- Kit Builder
- Business Audit

Runtime conceptual común:

```text
prepare → acquire → analyze → review → execute → validate → result/publish
```

### ESTÁNDAR DE KITS

Los nuevos especialistas deben poder representarse de forma portable, por ejemplo:

```text
kits/<slug>/
  manifest.json
  SPEC.md
  workflow.md
  prompts/
  tools/
  validators/
  examples/
  tests/
  output/
```

No uses `.claude` como contrato interno obligatorio.

### ROADMAP CANÓNICO

- Bloque 0 — Blueprint y fuente de verdad
- Bloque 1 — Studio Foundation
- Bloque 2 — Web Studio MVP
- Bloque 3 — Commerce + Brand + Creator
- Bloque 4 — Business Audit
- Bloque 5 — Kit Builder
- Bloque 6 — Content Studio
- Bloque 7 — Conversations
- Bloque 8 — Plataforma comercial

Consulta el blueprint para gates y alcance exacto.

### MODO DE TRABAJO

Antes de actuar:

1. comprueba el estado actual de `main` y no asumas que el SHA de este prompt sigue vigente;
2. lee el índice y blueprint actuales del repositorio;
3. inspecciona la parte de código que vas a modificar;
4. comprueba PRs abiertos relacionados;
5. trabaja sobre una rama específica;
6. ejecuta build/lint/tests disponibles;
7. abre PR con alcance, riesgos, pruebas y siguiente paso.

No pidas confirmación para decisiones técnicas reversibles que ya estén cubiertas por el blueprint. Detente únicamente ante secretos requeridos, acciones externas de alto impacto, costes no autorizados, cambios destructivos o ambigüedad estratégica real.

### EXPERIENCIA OBJETIVO

El usuario final no debe pensar en “kits”. Debe pensar en objetivos:

- “Analiza esta tienda”
- “Mejora esta web”
- “Audita mi canal”
- “Analiza mi marca”
- “Edita este vídeo”
- “Crea un agente para este negocio”
- “Crea una herramienta para esta tarea repetitiva”

NEXO traduce esa intención al especialista, herramientas y flujo necesarios.

### DEFINICIÓN DE TERMINADO

No declares un bloque terminado sin:

- flujo funcional de principio a fin;
- estados de carga/error;
- móvil;
- accesibilidad básica;
- seguridad aplicable;
- prueba real o ejemplo reproducible;
- documentación actualizada;
- build/lint/test verdes según el repositorio;
- ausencia de regresiones conocidas.

### PRÓXIMA ACCIÓN SI BLOQUE 0 YA ESTÁ MERGEADO

Comienza Bloque 1 — **NEXO Studio Foundation**:

1. inspecciona `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `/herramientas` y la navegación actual;
2. define los tipos iniciales `Project`, `Run`, `Artifact`, `Specialist`;
3. crea `/studio` con un shell premium y mobile-first;
4. crea catálogo inicial de especialistas usando datos estáticos/fixtures, sin API costosa todavía;
5. añade flujo visual “Nuevo proyecto” con estado local/mock;
6. no implementes todavía crawling pesado, vídeo ni WhatsApp;
7. prueba build/lint y abre PR.

---

Fin del prompt maestro.
