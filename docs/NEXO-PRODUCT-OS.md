# NEXO PRODUCT OS

**Constitución de producto, diseño, ingeniería y aprendizaje continuo**  
Versión: 1.0 · 2 septiembre 2026  
Estado: normativa para todo trabajo nuevo y toda corrección de NEXO.

## 0. Propósito

NEXO existe para ayudar a personas a resolver una tarea comercial con el menor esfuerzo posible: encontrar lo que necesitan, venderlo, comprarlo, entregarlo y controlar la operación.

La marca no es el protagonista. El protagonista es la persona y su objetivo.

Este documento convierte los aprendizajes del desarrollo en reglas permanentes. Una corrección no termina al arreglar una pantalla: debe identificar la clase de problema, corregirla, buscar dónde más aparece y, cuando sea razonable, crear una protección para evitar su regreso.

### Regla maestra

**OBSERVACIÓN → DIAGNÓSTICO → CORRECCIÓN → GENERALIZACIÓN → PROTECCIÓN → QA → PRODUCCIÓN**

Una petición informal del usuario es suficiente. El equipo/agente técnico debe traducirla a requisitos de producto, UX, arquitectura, código, datos, QA y regresión sin exigir que el usuario redacte especificaciones técnicas.

---

# 1. Las cuatro capas

## CAPA 1 — Product Principles

Principios que gobiernan cualquier decisión.

### P01. Usuario antes que marca
El copy funcional habla de lo que la persona quiere conseguir. Evitar frases promocionales como «NEXO te ayuda…», «con NEXO…» o «selección NEXO» cuando no aportan información. La marca vive en identidad, confianza, contexto y legal; no invade cada acción.

### P02. Mobile first real
Diseñar primero para 360–430 px y uso con una mano. Desktop es una expansión de una experiencia móvil ya resuelta, no al revés.

### P03. Una pantalla, una intención dominante
Cada vista debe responder en segundos: dónde estoy, qué puedo hacer y cuál es la acción principal.

### P04. Divulgación progresiva
Mostrar primero lo necesario para actuar. Configuración, reglas avanzadas, históricos y detalles viven un nivel más abajo.

### P05. Menos interfaz, más resultado
No exponer arquitectura interna, IDs, referral codes, motores de reglas o términos técnicos si el usuario no necesita conocerlos.

### P06. No repetir
Una acción, dato o explicación no debe aparecer varias veces en la misma pantalla sin una razón operacional clara.

### P07. Funcional y terminado
`DONE != funciona`. Una función está terminada cuando funciona, está diseñada, responde bien en móvil, cubre estados, errores y vacíos, usa copy correcto y supera QA.

### P08. Confianza por evidencia
No inventar precio, stock, especificaciones, disponibilidad, garantía ni capacidades. Separar dato observado, aportado por usuario/proveedor, externo verificado, inferido y desconocido.

### P09. Fuente de verdad explícita
WooCommerce: precio público, stock, SKU, imágenes públicas y pedidos. Knowledge Base: evidencia, conocimiento, FAQ, objeciones, argumentos, confianza y material operativo. El modelo de IA razona sobre esas fuentes; no las sustituye.

### P10. Persistencia comercial
La atribución de gestora, precio aplicado, margen/comisión, regla de entrega y demás condiciones relevantes se guardan como snapshot de la venta. Un cambio posterior no reescribe la historia del pedido.

### P11. Seguridad e aislamiento por defecto
Una gestora no puede acceder ni modificar información privada de otra. Acciones administrativas requieren rol adecuado. Nunca exponer secretos en cliente, logs públicos o UI.

### P12. Acciones visibles deben funcionar
Una acción visible que no funciona es P0. Si una función todavía no existe, no simularla como disponible.

### P13. Diseñar para recuperación
Loading, error, vacío, offline/red lenta, permisos denegados y reintento forman parte del producto.

### P14. El sistema debe aprender
Cada error repetible genera una regla, componente, test, validación o checklist cuando sea razonable.

---

## CAPA 2 — NEXO Design System

No crear controles aislados si existe o debe existir un patrón reutilizable.

### Jerarquía
- **Primary Action:** una por contexto; visualmente dominante.
- **Secondary Action:** útil pero no compite con la primaria.
- **Tertiary/Text Action:** navegación o acción de bajo riesgo.
- **Destructive:** explícita, separada y con protección cuando corresponda.

### Componentes base obligatorios
1. Header contextual.
2. Navegación móvil estable.
3. Botón primario/secundario/terciario/destructivo.
4. ShareAction reutilizable.
5. SearchInput y SearchResult.
6. ProductCard y ProductSelector.
7. StatusBadge.
8. EmptyState.
9. Loading/Skeleton.
10. ErrorState + Retry.
11. Toast/feedback.
12. Modal/Sheet móvil cuando corresponda.
13. Price/Margin editor.
14. Order status/timeline.
15. Confirmación para acciones de riesgo.

### Contrato de un componente
Todo componente interactivo debe considerar:
- default;
- pressed/focus;
- disabled;
- loading si hay I/O;
- success cuando proceda;
- error;
- contenido largo;
- pantalla estrecha;
- accesibilidad básica: semántica, label, foco, contraste y objetivo táctil suficiente.

### ShareAction
Compartir no es un botón HTML aislado. Debe:
- usar Web Share API cuando exista;
- preservar URL atribuida de gestora;
- ofrecer fallback de copiar enlace;
- dar feedback de éxito/error;
- permitir compartir tienda y, donde corresponda, producto;
- usar texto orientado al receptor, no publicidad interna;
- no prometer publicación automática en servicios que no tengan integración real.

### Copy System
Antes de publicar un texto preguntar:
1. ¿Ayuda a actuar?
2. ¿Dice algo nuevo?
3. ¿Puede ser más corto?
4. ¿Está hablando del usuario o innecesariamente de NEXO?
5. ¿Usa lenguaje comprensible para una persona no técnica?

Ejemplos:
- Evitar: «NEXO te ayuda a encontrar una oportunidad».
- Preferir: «Encuentra lo que busca tu cliente».
- Evitar: «Precio NEXO» cuando significa precio antes del aumento.
- Preferir: «Precio base».
- Evitar: «Mi enlace referido».
- Preferir: «Compartir mi tienda».

### Principio visual
Premium significa claridad, consistencia y confianza; no más elementos. Espacio, tipografía, jerarquía y estados completos tienen prioridad sobre decoración.

---

## CAPA 3 — Definition of Done (DoD)

Una tarea no se declara terminada únicamente porque compile o porque el happy path funcione.

### DoD funcional
- La acción principal funciona con datos reales o un mock explícitamente aislado de producción.
- Persistencia correcta.
- No rompe el flujo anterior.
- Integraciones externas manejan fallo y timeout razonablemente.

### DoD UX/UI
- Revisada en móvil primero (mínimo conceptual 360, 390 y 430 px).
- Sin overflow, controles crudos, texto cortado o CTA oculto.
- Jerarquía clara.
- Sin redundancias evitables.
- Estados loading/error/empty definidos donde aplican.
- Copy orientado a tarea.

### DoD datos/comercio
- Fuente de verdad respetada.
- Precio/stock/SKU no inventados.
- Atribución conservada.
- Snapshot de reglas comerciales cuando corresponda.
- Operaciones sensibles idempotentes o protegidas contra duplicados cuando sea necesario.

### DoD calidad
- Typecheck/build/lint/tests relevantes pasan cuando existen.
- Recorrido afectado probado E2E o manualmente de punta a punta según criticidad.
- Producción verificada después del deploy; deploy exitoso no equivale a UX verificada.
- Si se corrigió un bug repetible, evaluar test de regresión.

### DoD seguridad
- Autorización por rol comprobada.
- Sin secretos en frontend.
- Sin acceso cruzado entre gestoras.
- Validación de entradas y acciones destructivas.

### P0 automático
- CTA visible no funciona.
- Checkout bloqueado.
- Pedido pierde atribución.
- Precio/total comercial incorrecto.
- Datos de otra gestora visibles/editables.
- Acción destructiva accidental.
- Pantalla principal inutilizable en móvil.

---

## CAPA 4 — Regression & Learning Rules

Registro vivo. Nunca borrar una regla porque el bug actual se haya solucionado; actualizarla si aprendemos una solución mejor.

### NEXO-R001 — No controles crudos
No publicar controles nuevos sin estilos y estados coherentes con el Design System.

### NEXO-R002 — No publicidad dentro de tareas
El copy funcional no repite NEXO salvo que la marca sea información necesaria.

### NEXO-R003 — Una métrica, una verdad
La misma métrica no puede mostrar valores contradictorios entre oficina, tienda y administración sin una explicación explícita. Investigar diferencias como «55 productos» vs «46 seleccionados» antes de considerarlas normales.

### NEXO-R004 — No duplicar acciones
No repetir compartir, editar, margen, enlace o estadísticas en varios bloques de una misma vista si una sola ubicación clara resuelve la tarea.

### NEXO-R005 — Visible = operativo
Una función visible que falla es P0.

### NEXO-R006 — Funcional pero sin diseño = incompleto
Una función técnicamente operativa que se percibe como HTML crudo, provisional o inconsistente no supera DoD.

### NEXO-R007 — No arreglar solo la instancia
Cuando aparece un patrón de error, buscar ocurrencias equivalentes en el módulo y, si el riesgo lo justifica, en el repositorio.

### NEXO-R008 — No hardcodear correcciones comerciales aisladas sin reconciliación
Si una corrección de precio/catálogo puede ser revertida por seeds o sincronizadores, corregir también la fuente o añadir reconciliación controlada.

### NEXO-R009 — No mezclar propietario y cliente
La tienda pública del cliente debe permanecer limpia. Controles de propietaria/gestora solo aparecen en contexto autenticado y no contaminan la experiencia pública.

### NEXO-R010 — Compartir conserva atribución
Toda URL compartida desde una tienda de gestora debe conservar la atribución hasta checkout y pedido.

### NEXO-R011 — Research no es generación libre
La búsqueda de producto debe diferenciar evidencia, fecha, fuente, confianza e incertidumbre. Nunca presentar inferencias como especificaciones confirmadas.

### NEXO-R012 — Producción debe verificarse
Después de cambios críticos: commit → deploy → estado LIVE → prueba funcional/visual. No cerrar únicamente porque Render indique LIVE.

---

# 2. Traductor de instrucciones informales

El usuario no necesita escribir prompts técnicos. Ejemplos de traducción automática:

**«Está de palo»** → revisar diseño incompleto, componentes crudos, estados, responsive, jerarquía, feedback y consistencia; aplicar R001/R006.

**«Está muy cargado»** → auditar densidad, repetición, prioridad de tareas y progressive disclosure; aplicar P03/P04/P06.

**«Habla demasiado de NEXO»** → auditoría global de copy en el alcance afectado; aplicar P01/R002.

**«No funciona»** → reproducir, identificar capa, revisar errores/estado/red/API/datos, corregir raíz y crear protección; aplicar R005/R007.

**«Este precio está mal»** → verificar fuente de verdad, Woo, seeds/sync, reglas de margen y snapshots; no parchear solo la UI.

**«Quiero que sea premium»** → no añadir decoración por defecto; mejorar claridad, velocidad, consistencia, confianza, estados y detalle visual.

---

# 3. Recorridos canónicos que gobiernan el MVP

## Gestora
Entrar/registrarse → entender Inicio → encontrar producto → seleccionar/publicar → definir ganancia → ver tienda → compartir → cliente compra → pedido queda atribuido → consultar estado → consultar ganancia.

## Cliente
Abrir tienda atribuida → encontrar producto → entender ficha/precio → carrito → entrega/recogida → checkout → confirmación → seguimiento/contacto cuando corresponda.

## Administrador
Entrar → ver situación → gestoras → catálogo → inventario → pedidos → origen/atribución → estado → comisión → incidencias → ajustes auditables.

## Product Intelligence
Captura/foto → identificación → investigación → fuentes/evidencia → contradicciones → Knowledge Record → assets comerciales → precio según regla → SEO/copy → WooCommerce → verificación pública.

---

# 4. Arquitectura de verdad

**WooCommerce manda:** precio público, stock, SKU, imágenes públicas, pedidos.

**NEXO Knowledge Base manda:** identidad investigada, evidencia, fuentes, fechas, FAQ, objeciones, argumentos, confianza, gaps y conocimiento operativo.

**NEXO Commercial Layer manda:** perfil/rol de gestora, selección, reglas de margen, atribución, ledger/comisiones y snapshots comerciales.

**IA:** interfaz de razonamiento y asistencia. Nunca fuente primaria de verdad.

---

# 5. Protocolo para cada corrección futura

1. Reproducir/entender el síntoma.
2. Traducirlo a problema de producto y técnico.
3. Identificar causa raíz y sistemas afectados.
4. Revisar si el mismo patrón existe en otros lugares.
5. Corregir la causa, no solo la captura.
6. Aplicar Design System y Product Principles.
7. Añadir/actualizar regla de regresión si aprendimos algo nuevo.
8. Añadir protección automatizada cuando el coste/beneficio lo justifique.
9. Ejecutar QA según DoD.
10. Desplegar.
11. Verificar producción.
12. Registrar cualquier aprendizaje adicional.

---

# 6. Política de velocidad

Velocidad no significa saltarse diseño o QA. Significa dejar de resolver dos veces el mismo problema.

- Reutilizar componentes.
- Generalizar correcciones repetibles.
- Automatizar validaciones estables.
- No pedir al usuario detalles técnicos que puedan inferirse o auditarse.
- Hacer preguntas solo cuando cambien materialmente el resultado o exista una decisión de negocio no inferible.
- Corregir en bloques pequeños verificables para evitar regresiones grandes.

---

# 7. Gobernanza

Este documento es vivo, pero sus principios no deben modificarse silenciosamente para justificar una implementación rápida.

Cuando una decisión nueva contradiga esta constitución:
- señalar la contradicción;
- decidir conscientemente si es una excepción o un cambio de principio;
- documentarla.

Toda nueva regla debe tener identificador `NEXO-R###`.

Toda funcionalidad crítica nueva debe indicar qué recorrido canónico mejora y qué DoD debe superar.

---

# 8. Norte del producto

Una gestora nueva debe poder abrir NEXO Impulsa y comenzar a trabajar sin capacitación técnica.

Un cliente debe sentir que está resolviendo una compra, no aprendiendo cómo funciona NEXO.

Un administrador debe poder saber qué está ocurriendo y actuar sin entrar a cinco sistemas distintos.

Y cada error que encontremos debe hacer que NEXO sea más difícil de romper por segunda vez.
