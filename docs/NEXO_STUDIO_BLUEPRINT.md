# NEXO Studio — Blueprint maestro

## 0. Propósito

NEXO evoluciona de una web con herramientas aisladas a una plataforma operativa de proyectos impulsada por IA. El usuario no debe tener que abrir VS Code, instalar Claude Code, editar JSON o entender scripts. La complejidad técnica vive detrás de una experiencia sencilla, premium y confiable.

NEXO Studio debe permitir llevar un proyecto desde la entrada de contexto hasta un resultado ejecutable: diagnóstico, informe, propuesta, prototipo, contenido, automatización o sistema desplegable.

## 1. Tesis de producto

Los siete kits originales demuestran un patrón útil: instrucciones especializadas + datos de entrada + herramientas/scripts + validación + salida. NEXO conservará ese patrón, pero lo convertirá en una plataforma independiente del proveedor de IA.

Arquitectura conceptual:

```text
Usuario
  ↓
Proyecto NEXO
  ↓
Especialista / Kit
  ↓
Orquestador
  ├─ IA
  ├─ Web / investigación
  ├─ scripts
  ├─ archivos
  ├─ APIs
  └─ despliegue
  ↓
Revisión humana
  ↓
Resultado + historial + siguiente acción
```

Claude no será requisito. OpenAI tampoco será un acoplamiento rígido. Los proveedores y herramientas se eligen por capacidad, coste, seguridad y fiabilidad.

## 2. Negocio que estamos construyendo

NEXO será simultáneamente:

1. una herramienta interna para construir, analizar y mejorar nuestros propios negocios;
2. una plataforma para prestar servicios a terceros;
3. una fábrica de especialistas reutilizables;
4. una base para productos verticales posteriores.

La propuesta comercial inicial nace de los siete kits:

- análisis y rediseño web;
- agentes conversacionales / WhatsApp;
- auditoría de YouTube y contenido;
- edición de vídeo;
- auditoría de marca personal;
- auditoría e-commerce;
- creación de nuevos especialistas/kits.

Cuando se incorpore el kit 03, se añade auditoría integral de negocio como puerta de entrada comercial principal.

## 3. Principios no negociables

### 3.1 Producto antes que demo

No crear efectos espectaculares sin utilidad. Cada resultado debe resolver un problema real, mejorar conversión, ahorrar tiempo, aumentar claridad o habilitar una nueva capacidad.

### 3.2 Premium significa simple

La interfaz debe reducir texto, decisiones técnicas y ruido. Un usuario no técnico debe entender qué hacer en segundos.

### 3.3 Confirmar antes de persistir o ejecutar acciones sensibles

Cuando NEXO extraiga o infiera datos, mostrará "NEXO entendió esto" con opciones de confirmar, editar o descartar antes de acciones irreversibles, publicación, mensajería o gasto externo relevante.

### 3.4 Proveedor agnóstico

La lógica del producto no dependerá de nombres de modelos concretos. Se creará una capa de proveedores con capacidades y políticas de fallback.

### 3.5 Evidencia antes de recomendación

Las auditorías deben separar hechos observados, inferencias y recomendaciones. Los informes deben indicar limitaciones y datos faltantes.

### 3.6 Ejecutar antes de declarar terminado

Todo kit nuevo debe probarse con un caso de práctica. Esta regla se toma directamente del enfoque del Kit Creador de Kits y se mantiene como gate obligatorio.

### 3.7 Seguridad por diseño

Nunca copiar secretos de los ZIP al repositorio. No versionar API keys, sesiones de WhatsApp, datos personales ni `.env` reales. Dependencias y scripts de terceros se auditan antes de producción.

### 3.8 No romper NEXO existente

La evolución será incremental. Las rutas y capacidades actuales siguen funcionando mientras Studio se añade detrás de límites claros.

## 4. Experiencia principal

### 4.1 Inicio

La portada debe evolucionar hacia una entrada clara a NEXO Studio:

- Nuevo proyecto
- Continuar proyecto
- Herramientas
- Preguntar a NEXO

### 4.2 Crear proyecto

Campos mínimos:

- nombre del proyecto;
- tipo de proyecto/negocio;
- objetivo;
- URL opcional;
- archivos opcionales;
- contexto libre.

NEXO sugiere el especialista adecuado, pero el usuario puede elegir otro.

### 4.3 Catálogo de especialistas

Primera generación:

1. **Web Studio** — auditoría + rediseño + propuesta + prototipo.
2. **Conversations** — agente conversacional y gestión de conversaciones.
3. **Creator Intelligence** — análisis de YouTube/contenido.
4. **Content Studio** — edición de vídeo y activos de contenido.
5. **Brand Intelligence** — auditoría de marca personal.
6. **Commerce Audit** — auditoría de e-commerce.
7. **Kit Builder** — creación de nuevos especialistas.
8. **Business Audit** — pendiente del kit 03, pero previsto desde la arquitectura inicial.

### 4.4 Ejecución

Cada ejecución debe tener estados visibles y comprensibles:

- preparando;
- recopilando datos;
- analizando;
- esperando revisión;
- ejecutando;
- finalizada;
- requiere atención;
- fallida.

No usar mensajes técnicos como experiencia primaria.

### 4.5 Resultado

Una ejecución puede producir:

- diagnóstico;
- puntuación;
- prioridades;
- checklist;
- informe HTML/PDF;
- propuesta comercial;
- código/prototipo;
- archivos editados;
- contenido;
- automatización;
- despliegue;
- próxima acción recomendada.

Todo resultado debe quedar asociado al proyecto y a una ejecución concreta.

## 5. Modelo de datos conceptual

```text
Workspace
  └─ Project
      ├─ ProjectSource[]
      │   ├─ URL
      │   ├─ File
      │   ├─ Note
      │   └─ ConnectorRef
      ├─ Run[]
      │   ├─ Specialist
      │   ├─ Inputs
      │   ├─ Status
      │   ├─ Evidence
      │   ├─ Decisions
      │   ├─ Artifacts[]
      │   └─ Costs/usage
      └─ ProjectMemory
```

No se debe persistir información sensible de forma accidental. La memoria del proyecto debe ser explícita y auditable.

## 6. Estándar NEXO Kit

Un especialista no será una carpeta `.claude`. Será una definición portable.

Estructura objetivo:

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

### `manifest.json`

Debe declarar como mínimo:

- id y versión;
- nombre visible;
- descripción;
- entradas aceptadas;
- salidas;
- capacidades necesarias;
- permisos requeridos;
- herramientas/scripts;
- modelo/capacidad recomendada sin acoplamiento duro;
- coste/riesgo estimado;
- versión mínima del runtime NEXO.

### Contrato de ejecución

Todo kit debe implementar conceptualmente:

```text
prepare → acquire → analyze → review → execute → validate → publish/result
```

No todos los pasos tienen que hacer trabajo, pero el contrato es común.

## 7. Adaptación de los siete kits fuente

### 7.1 Kit 01 — Cazador de webs → NEXO Web Studio

Conservar:

- extracción de identidad y contenido;
- diagnóstico;
- demo/prototipo;
- propuesta comercial;
- enfoque de before/after.

Cambiar:

- no forzar una estética 3D universal;
- priorizar objetivo, conversión, accesibilidad, rendimiento y marca;
- usar stack moderno reusable;
- separar claramente contenido extraído de contenido inventado;
- crear publicación demo segura y temporal.

MVP:

`URL → análisis → brief detectado → propuesta de mejora → prototipo → informe`.

### 7.2 Kit 02 — Agente WhatsApp → NEXO Conversations

Conservar como referencia:

- dashboard;
- conversaciones;
- memoria;
- guardrails;
- handoff humano;
- métricas;
- watchdog/health;
- configuración por negocio.

No adoptar ciegamente:

- sesiones no oficiales como dependencia crítica de producción;
- secretos o sesiones locales;
- despliegues inseguros.

Objetivo de producción: adaptador de transporte intercambiable, priorizando APIs oficiales cuando corresponda.

### 7.3 Kit 04 — YouTube → NEXO Creator Intelligence

Conservar:

- títulos;
- miniaturas;
- transcripciones;
- outliers;
- frecuencia;
- shorts/largos;
- patrones accionables.

Evolucionar a análisis multicanal en fases posteriores.

### 7.4 Kit 05 — Editor de vídeo → NEXO Content Studio

Conservar:

- FFmpeg;
- transcripción;
- detección de pausas/cortes;
- subtítulos;
- encuadre vertical;
- overlays/animaciones;
- normalización de sonido.

Cambiar la operación local por trabajos de servidor/worker cuando se lleve a producto web.

### 7.5 Kit 06 — Marca personal → NEXO Brand Intelligence

Conservar metodología y estructura de auditoría. Añadir distinción explícita entre evidencia pública, datos declarados por cliente e inferencias.

### 7.6 Kit 07 — E-commerce → NEXO Commerce Audit

Conservar análisis de tienda, producto, carrito, confianza y experiencia. Añadir móvil, accesibilidad, performance, SEO técnico, analítica, checkout y operaciones cuando los datos estén disponibles.

### 7.7 Kit 08 — Creador de kits → NEXO Kit Builder

Este kit inspira el estándar interno.

Conservar especialmente:

- entrevista de definición;
- contrato;
- comprobar fuentes antes de construir;
- criterios de puntuación;
- ejemplo de práctica;
- revisión;
- empaquetado.

Cambiar la salida de `.claude` al estándar NEXO Kit portable.

## 8. Arquitectura técnica objetivo

### Capa 1 — UI

Next.js App Router sobre el repositorio actual.

Nuevas áreas previstas:

```text
/studio
/studio/projects
/studio/projects/[projectId]
/studio/tools
/studio/runs/[runId]
/studio/settings
```

### Capa 2 — Application services

Responsabilidades:

- proyectos;
- fuentes;
- runs;
- artefactos;
- approvals;
- catálogo de kits;
- auditoría de eventos.

### Capa 3 — Orchestrator

El orquestador decide qué capacidades necesita un run y administra pasos, reintentos, límites y revisión humana.

### Capa 4 — Providers

Interfaces previstas:

```text
LLMProvider
SearchProvider
BrowserProvider
FileProvider
StorageProvider
MessagingProvider
DeployProvider
MediaWorker
```

La implementación puede cambiar sin modificar el contrato del kit.

### Capa 5 — Workers

Para tareas largas o pesadas:

- vídeo;
- crawling extenso;
- generación de sitio;
- despliegues;
- procesamiento masivo.

No bloquear requests web largos cuando el producto crezca.

## 9. IA y coste

NEXO debe seleccionar el nivel de IA por tarea, no utilizar el modelo más caro para todo.

Política inicial:

- tareas deterministas → código normal;
- clasificación/extracción sencilla → modelo económico;
- análisis complejo → modelo de razonamiento;
- generación visual → herramienta visual adecuada;
- vídeo/cortes → scripts y FFmpeg;
- fallback → segundo proveedor o ejecución parcial cuando sea seguro.

Cada run debe poder registrar consumo y coste estimado cuando aplique.

## 10. Seguridad y privacidad

Antes de producción:

- secrets solo en variables de entorno/secret manager;
- validación de uploads;
- límites de tamaño y tipo;
- URLs protegidas contra SSRF;
- sandbox/allowlist para ejecución de comandos;
- no ejecutar scripts arbitrarios de kits importados;
- CSP y seguridad web;
- sanitización de HTML generado;
- logging sin PII innecesaria;
- auditoría de dependencias;
- aprobación humana para mensajes, publicaciones y despliegues sensibles;
- política de retención de archivos.

Los siete ZIP fuente nunca se consideran código de producción aprobado por defecto.

## 11. Diseño premium

NEXO debe sentirse como una herramienta de trabajo, no como una landing llena de texto.

Principios visuales:

- jerarquía fuerte;
- mucho espacio útil;
- acciones primarias claras;
- estados y progreso visual;
- tarjetas solo cuando aporten estructura;
- mobile-first real;
- contraste y accesibilidad;
- microinteracciones sobrias;
- tono humano y directo;
- resultados escaneables antes de profundizar.

No copiar el diseño del kit ni de Claude. Construir identidad NEXO propia.

## 12. Roadmap por bloques

### Bloque 0 — Blueprint y fuente de verdad

Entregables:

- índice maestro;
- blueprint;
- prompt maestro.

Gate: documentos en repositorio y PR revisable.

### Bloque 1 — NEXO Studio Foundation

Entregables:

- `/studio`;
- shell premium;
- catálogo de especialistas;
- proyecto local/mock inicial;
- modelo TypeScript de Project/Run/Artifact;
- estados de ejecución;
- navegación sin romper rutas existentes.

Gate: build/lint verdes + experiencia móvil funcional.

### Bloque 2 — Web Studio MVP

Entregables:

- entrada URL;
- adquisición segura;
- diagnóstico;
- brief detectado;
- resultado estructurado;
- prototipo inicial;
- persistencia básica.

Gate: ejecutar contra al menos dos webs de prueba con resultados trazables.

### Bloque 3 — Commerce + Brand + Creator

Crear un runtime común de auditorías y migrar 07, 06 y 04.

Gate: cada especialista tiene ejemplo, esquema de salida y evaluación mínima.

### Bloque 4 — Business Audit

Incorporar kit 03 cuando esté disponible y convertirlo en puerta de entrada comercial.

### Bloque 5 — Kit Builder

Crear especialistas desde NEXO usando el estándar NEXO Kit y tests automáticos.

### Bloque 6 — Content Studio

Workers de vídeo, uploads, progreso y descarga/publicación de artefactos.

### Bloque 7 — Conversations

Integración conversacional persistente, dashboard, proveedores de mensajería y human handoff.

### Bloque 8 — Plataforma comercial

- workspaces/clientes;
- permisos;
- facturación/uso;
- plantillas de propuesta;
- exportaciones;
- onboarding;
- observabilidad.

## 13. Orden de prioridad

1. Fundaciones.
2. Web Studio.
3. Auditorías comunes.
4. Business Audit.
5. Kit Builder.
6. Content Studio.
7. Conversations.

Motivo: maximizar aprendizaje y valor temprano antes de infraestructura costosa/persistente.

## 14. Criterios de aceptación globales

Una capacidad no está terminada porque "se ve". Debe cumplir:

- flujo de principio a fin;
- error states;
- móvil;
- accesibilidad básica;
- seguridad razonable;
- evidencia/trazabilidad;
- output útil;
- prueba con ejemplo;
- documentación;
- build/lint/test según corresponda;
- no regresión de rutas existentes.

## 15. Decisiones ya tomadas

- Construimos sobre `ernest196391/ernesto-rondon-nexo`, no un repositorio paralelo por defecto.
- Los siete kits son referencia y materia prima, no producto final.
- No se requiere suscripción de Claude.
- La experiencia principal será web y orientada a proyectos.
- NEXO será proveedor-agnóstico.
- El código determinista debe resolver lo que no requiere IA.
- Los módulos pesados se incorporan después del núcleo.
- El producto debe servir primero como laboratorio real de nuestros propios proyectos antes de venderlo ampliamente.

## 16. Estado inicial observado del repositorio

La aplicación actual ya tiene rutas para portada, herramientas, negocios, mensajería y contenido institucional. Existe un `Business Analyzer` como herramienta inicial y endpoints server-side previos. NEXO Studio se agregará de forma incremental y podrá absorber/reorganizar capacidades existentes después de demostrar el nuevo shell y modelo de proyectos.

## 17. Siguiente acción autorizada

Una vez aprobado este blueprint mediante PR, comenzar Bloque 1 sin reconstruir el repositorio: inspeccionar layout, estilos y herramientas existentes; introducir `/studio` y los tipos/core mínimos; mantener CI verde y presentar cambios por PR pequeño y reversible.
