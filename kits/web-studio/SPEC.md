# NEXO Web Studio — SPEC

## Objetivo
Convertir una URL pública en una auditoría trazable, un brief de reconstrucción y un prototipo revisable. Este kit adapta la skill original `cazador-de-webs` al estándar NEXO y mantiene su secuencia esencial: reconocimiento → branding/evidencia → diagnóstico → brief → reconstrucción/acción → QA.

## Regla de evidencia
No inventar datos. Distinguir entre:
- evidencia observada;
- inferencia;
- recomendación.

## MVP 0.1 — auditoría
Entrada: una URL pública http/https.

Salida mínima:
1. URL final y estado HTTP;
2. título y meta description si existen;
3. idioma declarado si existe;
4. señales básicas de estructura: h1, viewport, canonical, Open Graph, formularios, enlaces y scripts;
5. exactamente cinco hallazgos priorizados cuando haya suficiente evidencia;
6. recomendaciones accionables;
7. limitaciones explícitas.

## v0.2 — brief de reconstrucción
A partir de la evidencia del 0.1, NEXO añade:
1. posicionamiento detectado sin completar huecos con datos inventados;
2. prioridad principal de mejora;
3. tres acciones iniciales derivadas de los hallazgos;
4. estructura recomendada de página;
5. contrato del prototipo: preservar hechos e identidad, mobile-first, una acción dominante, motion con propósito, separación entre contenido extraído y recomendación, y fallback para reduced-motion.

## v0.3 — prototipo revisable
A partir del brief, NEXO genera un borrador navegable dentro de Studio con:
1. hero basado únicamente en título, descripción y host observados;
2. CTA estructural derivado de señales existentes, sin inventar una oferta nueva;
3. secciones de página derivadas de la estructura recomendada;
4. visualización mobile-first;
5. estado explícito de revisión humana: pendiente, aprobado o necesita cambios;
6. prohibición de publicación automática.

El prototipo de v0.3 es estructural y determinista. Todavía no clona fotografías, logos ni estilos visuales externos, no ejecuta JavaScript remoto y no equivale a una reconstrucción de producción.

## Siguiente iteración
`v0.4`: adquisición visual segura (captura/render aislado), extracción de branding visual permitido y comparación antes/después. Después se podrá añadir una capa de IA para copy y dirección creativa, manteniendo aprobación humana antes de publicar.

## Seguridad
- rechazar protocolos distintos de http/https;
- rechazar localhost y hosts privados/reservados;
- limitar redirects;
- limitar tamaño descargado;
- timeout de red;
- no ejecutar JavaScript remoto durante la auditoría HTML;
- no almacenar cookies ni credenciales;
- no seguir formularios ni realizar acciones mutantes;
- no publicar ni desplegar el prototipo sin aprobación humana explícita.

## Gate
Cada iteración debe mantener build, lint y typecheck verdes. Antes de declarar el kit listo para uso comercial, debe ejecutarse contra al menos dos sitios públicos de prueba y pasar QA desktop/móvil, seguridad básica y revisión de evidencia.
