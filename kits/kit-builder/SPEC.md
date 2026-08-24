# NEXO Kit Builder — SPEC

## Objetivo
Convertir una tarea repetitiva en un contrato portable de especialista NEXO sin depender de `.claude` ni de un proveedor concreto.

## Flujo
idea → definición → comprobar fuentes/dependencias → contrato → criterios de calidad → construir → probar → validar → versionar.

## MVP
La aplicación genera `manifest.json`, `SPEC.md`, `workflow.md` y checklist de validación. No marca automáticamente el kit como `ready`.

## Gate obligatorio
Un kit nuevo solo puede considerarse listo cuando:
- sus fuentes/dependencias fueron comprobadas;
- existe un ejemplo reproducible ejecutado;
- los criterios de calidad se evaluaron;
- permisos y riesgos están declarados;
- build/lint/typecheck permanecen verdes.
