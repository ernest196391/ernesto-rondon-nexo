# NEXO Web Studio — SPEC

## Objetivo
Convertir una URL pública en una auditoría trazable. Este kit adapta la skill original `cazador-de-webs` al estándar NEXO y mantiene su secuencia esencial: reconocimiento → branding/evidencia → diagnóstico → reconstrucción/acción → QA.

## Regla de evidencia
No inventar datos. Distinguir entre:
- evidencia observada;
- inferencia;
- recomendación.

## MVP 0.1
Entrada: una URL pública http/https.

Salida mínima:
1. URL final y estado HTTP;
2. título y meta description si existen;
3. idioma declarado si existe;
4. señales básicas de estructura: h1, viewport, canonical, Open Graph, formularios, enlaces y scripts;
5. exactamente cinco hallazgos priorizados cuando haya suficiente evidencia;
6. recomendaciones accionables;
7. limitaciones explícitas.

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
El kit no se considera listo hasta ejecutarse contra al menos dos sitios de prueba y mantener build, lint y typecheck verdes.
