# Tablero compartido

```yaml
- id: PS1-B00-T01
  title: Consolidar fuente de verdad e inventario verificable
  status: done
  owner: chatgpt
  claimed_at: 2026-09-11T07:45:00Z
  depends_on: []
  acceptance: [documentos obligatorios presentes, inventarios NEXO/Cuyana/Casa Viva, pruebas registradas, PR abierto]
  evidence:
    commit: 9935eed
    pull_request: https://github.com/ernest196391/ernesto-rondon-nexo/pull/125
    deployment: not_required
    tests: [nexo 144/144, nexo typecheck/lint/build, cuyana build/lint, casa-viva typecheck/lint/build/test]
  blocker: null
  next_action: null

- id: PS1-B01-T01
  title: Crear el repositorio independiente y workspace mínimo de Product Studio One
  status: in_progress
  owner: chatgpt
  claimed_at: 2026-09-11T12:20:00Z
  depends_on: [PS1-B00-T01]
  acceptance: [repo independiente creado por el propietario, estructura apps/packages/integrations/supabase/docs, lockfile, CI typecheck lint test build, documentos copiados sin divergencia]
  evidence: { commit: null, pull_request: null, deployment: null, tests: [] }
  blocker: El repositorio remoto GitHub debe ser creado por el usuario; la conexión instalada no expone esa operación
  next_action: Crear el repositorio vacío product-studio-one y conectar este scaffold local

- id: PS1-B01-T02
  title: Diseñar migración Supabase multiempresa con RLS y auditoría
  status: in_progress
  owner: chatgpt
  claimed_at: 2026-09-11T12:30:00Z
  depends_on: [PS1-B01-T01]
  acceptance: [migración versionada, RLS por organización, tests de aislamiento, sin datos migrados]
  evidence: { commit: null, pull_request: null, deployment: null, tests: [] }
  blocker: Falta un proyecto Supabase independiente de Product Studio One para ejecutar y verificar la migración
  next_action: Validar migración local, crear proyecto de desarrollo y ejecutar pruebas de aislamiento

- id: PS1-B02-T01
  title: Implementar captura y evidencia canónica
  status: blocked
  owner: none
  claimed_at: null
  depends_on: [PS1-B01-T02]
  acceptance: [pendiente del Bloque 2]
  evidence: { commit: null, pull_request: null, deployment: null, tests: [] }
  blocker: Bloque 1 incompleto
  next_action: null
```
