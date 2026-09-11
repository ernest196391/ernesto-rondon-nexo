# Tablero compartido

```yaml
- id: PS1-B00-T01
  title: Consolidar fuente de verdad e inventario verificable
  status: review
  owner: chatgpt
  claimed_at: 2026-09-11T07:45:00Z
  depends_on: []
  acceptance: [documentos obligatorios presentes, inventarios NEXO/Cuyana/Casa Viva, pruebas registradas, PR abierto]
  evidence:
    commit: 9935eed
    pull_request: opening
    deployment: not_required
    tests: [nexo 144/144, nexo typecheck/lint/build, cuyana build/lint, casa-viva typecheck/lint/build/test]
  blocker: null
  next_action: Revisión y merge del PR documental

- id: PS1-B01-T01
  title: Crear el repositorio independiente y workspace mínimo de Product Studio One
  status: ready
  owner: none
  claimed_at: null
  depends_on: [PS1-B00-T01]
  acceptance: [repo independiente creado por el propietario, estructura apps/packages/integrations/supabase/docs, lockfile, CI typecheck lint test build, documentos copiados sin divergencia]
  evidence: { commit: null, pull_request: null, deployment: null, tests: [] }
  blocker: Requiere elección/creación explícita del repositorio GitHub independiente
  next_action: Crear repo product-studio-one y portar esta documentación como primer commit

- id: PS1-B01-T02
  title: Diseñar migración Supabase multiempresa con RLS y auditoría
  status: ready
  owner: none
  claimed_at: null
  depends_on: [PS1-B01-T01]
  acceptance: [migración versionada, RLS por organización, tests de aislamiento, sin datos migrados]
  evidence: { commit: null, pull_request: null, deployment: null, tests: [] }
  blocker: null
  next_action: Implementar contratos identidad/tenant en rama de desarrollo

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
