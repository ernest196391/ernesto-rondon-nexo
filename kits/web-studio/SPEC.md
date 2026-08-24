# NEXO Web Studio — SPEC

## Objetivo
Convertir una URL pública en una auditoría trazable y un brief de reconstrucción. Este kit adapta la skill original `cazador-de-webs` al estándar NEXO y mantiene su secuencia esencial: reconocimiento → branding/evidencia → diagnóstico → brief → reconstrucción/acción → QA.

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

El brief de v0.2 es determinista. Todavía no equivale a una reconstrucción visual terminada ni a análisis semántico profundo con IA.

## Siguiente iteración
`v0.3`: captura/render visual + generación de prototipo navegable basado en el brief, con revisión humana antes de publicar o desplegar.

## Seguridad
- rechazar protocolos distintos de http/https;
- rechazar localhost y hosts privados/reservados;
- limitar redirects;
- limitar tamaño descargado;
- timeout de red;
- no ejecutar JavaScript remoto;
- no almacenar cookies ni credenciales;
- no seguir formularios ni realizar acciones mutantes.

## Gate
Cada iteración debe mantener build, lint y typecheck verdes. Antes de declarar el kit listo para uso comercial, debe ejecutarse contra al menos dos sitios públicos de prueba y pasar QA desktop/móvil, seguridad básica y revisión de evidencia.
