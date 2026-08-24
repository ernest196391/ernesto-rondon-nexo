# NEXO — Diagnóstico Web Studio (dogfood Kit 01)

Este diagnóstico aplica la regla de la skill `cazador-de-webs`: exactamente cinco problemas concretos y observables, indicando qué está mal, por qué puede costar conversión y cómo debe resolverlo la nueva versión.

## 1. La portada todavía envía la acción principal a una herramienta antigua

**Qué está mal:** el hero de `app/page.tsx` usa como CTA principal `Analizar una idea` y lo dirige a `/herramientas`. Sin embargo, la evolución canónica ya es NEXO Studio y existe `/studio` como nueva entrada operativa.

**Por qué cuesta clientes/uso:** el visitante no entra al producto que queremos convertir en núcleo del negocio. La propuesta nueva queda escondida y la primera interacción conduce a una experiencia anterior.

**Cómo lo resuelve la nueva:** convertir `Entrar a NEXO Studio` / `Nuevo proyecto` en CTA principal del primer pantallazo y dejar Business Analyzer como especialista o herramienta secundaria.

## 2. El primer pantallazo explica filosofía, pero no demuestra el producto

**Qué está mal:** el hero comunica “De una idea a un negocio real” y explica investigación/validación, pero no muestra visualmente qué hace NEXO Studio, qué puede recibir ni qué entrega.

**Por qué cuesta clientes/uso:** un visitante debe leer y deducir demasiado antes de entender el producto. No ve una representación inmediata de `entrada → especialista → ejecución → resultado`.

**Cómo lo resuelve la nueva:** convertir el primer pantallazo en una demostración visual del flujo real de Studio, usando la narrativa de profundidad/movimiento del Kit 01 con UI de proyecto, especialistas y resultados como escenas, no con contenido inventado.

## 3. La portada presenta cuatro pasos genéricos, pero no expone los especialistas vendibles

**Qué está mal:** la sección `EL MÉTODO` enseña Investigar, Validar, Construir y Lanzar, mientras que los especialistas que constituyen el nuevo negocio —Web Studio, Commerce Audit, Brand Intelligence, Creator Intelligence, Content Studio, Conversations y Kit Builder— solo viven en `/studio`.

**Por qué cuesta clientes/uso:** la home no convierte capacidades concretas en ofertas comprensibles. Un cliente potencial puede entender el método y aun así no saber qué puede contratar o ejecutar hoy.

**Cómo lo resuelve la nueva:** incorporar los especialistas principales a la narrativa de la home, con entradas y resultados concretos, priorizando Web Studio como primer motor real.

## 4. La prueba social actual son proyectos nombrados, pero no resultados demostrables

**Qué está mal:** Casa Viva, Triciclub, NEXO y PREVENTE aparecen como tarjetas de “casos y laboratorios”, pero la portada no muestra qué problema se resolvió, qué artefacto se construyó o qué evidencia produjo NEXO.

**Por qué cuesta clientes/uso:** nombrar proyectos aporta contexto, pero no prueba capacidad. El visitante no ve un before/after, diagnóstico, prototipo, automatización o resultado verificable.

**Cómo lo resuelve la nueva:** usar NEXO como primer caso dogfood visible y, después, convertir ejecuciones reales en casos estructurados: entrada, problema, trabajo de NEXO, resultado y siguiente acción. No inventar métricas.

## 5. La identidad visual es coherente pero demasiado estática para una propuesta de IA premium

**Qué está mal:** la base visual ya tiene paleta consistente, jerarquía tipográfica y buen responsive, pero la home se apoya casi por completo en secciones, grids y tarjetas con una única microinteracción de `translateY(-2px)`.

**Por qué cuesta clientes/uso:** para una plataforma que promete convertir contexto en sistemas ejecutables, la experiencia no demuestra esa sensación de orquestación, profundidad y transformación. Puede percibirse como una web editorial correcta en lugar de un producto tecnológico distintivo.

**Cómo lo resuelve la nueva:** portar selectivamente el lenguaje de motion del Kit 01 —progreso nativo, profundidad, split headlines, reveals y escenas conectadas al scroll— sin secuestrar el scroll ni sacrificar accesibilidad. La interacción principal de Studio debe seguir siendo funcional y sobria; la experiencia cinematográfica se concentra en la página pública de NEXO.

## Gate de la siguiente fase

La reconstrucción no se considera lista hasta cumplir:

- CTA a Studio visible en primer pantallazo;
- cero datos inventados;
- navegación y conversión funcionales sin JavaScript de motion;
- `prefers-reduced-motion` respetado;
- sin scroll horizontal a 375 px;
- contenido y especialistas alineados con `NEXO_STUDIO_BLUEPRINT.md`;
- build, lint y typecheck verdes.
