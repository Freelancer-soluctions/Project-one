# Tasks: tia-enterprise-gaps

## 1. Fallback ampliado (shared)

- [x] 1.1 Añadir a `shared` en `repo-discovery`: `apps/client/vite*`, `apps/client/vitest*`, `apps/server/vitest*`, `apps/**/setup*`, `apps/server/prisma/**`, `vitest.shared.js`, `vitest.sequencer.js`, `tsconfig.json` (raíz) — además de `apps/server/tsconfig.json`.
- [ ] 1.2 Verificar que un cambio en `prisma/schema.prisma` dispara `scope=full` en un PR de prueba.

> 1.2 requiere una corrida real de CI (no verificable en local). La ruta queda cubierta por el filtro `apps/server/prisma/**` → `shared=true` → `scope=full` en los tres `Resolve TIA scope`.

## 2. Override

- [x] 2.1 Añadir `workflow_dispatch` a `ci.yml` con input `full_suite` (boolean, default false) **y** ampliar el `if` de `repo-discovery` (ci.yml:80) y el concurrency group (ci.yml:13) a `workflow_dispatch`, o bien eliminar ese camino y dejar solo el override por label. → Se añadió `workflow_dispatch` + input, y el `if` del job y el concurrency group lo cubren. Una corrida manual no tiene diff de PR, así que `repo-discovery` resuelve todos los ámbitos a `true` (suite completa, nunca verde vacío).
- [x] 2.2 En los **3** steps `Resolve TIA scope` (ci.yml:497, 794, 2262), comprobar label `ci:full-suite` o input `full_suite` → `scope=full`. Nota: el check de label será siempre false en `merge_group` (no existe `github.event.pull_request`); documentar esta limitación o forzar `scope=full` en merge_group. → Ambas cosas: label vía `contains(github.event.pull_request.labels.*.name, 'ci:full-suite')`, input vía `inputs.full_suite`, y rama explícita `github.event_name == 'merge_group'` → `scope=full`.
- [ ] 2.3 Verificar en un PR de prueba con la etiqueta que la suite completa corre.

> 2.3 requiere una corrida real de CI con la etiqueta `ci:full-suite`.

## 3. Integration injection

- [x] 3.1 Añadir step `tia-history --record` tras la suite de integración y download del artefacto `tia-history-server` en el job `test-integration` (replicar patrón de jobs unit, ci.yml:900-917). → Steps `Inject previously-failing tests`, `Record TIA history` y upload `tia-history-server-integration` (nombre distinto porque los artifacts son inmutables por run y `test-unit-server` ya sube `tia-history-server`), más `actions: read` en el job.
- [x] 3.2 Cambiar `test:integration:changed` para usar `tia-select.mjs` con inyección de fallidos previos. → `node ../../scripts/ci/tia-select.mjs apps/server -- vitest run ".integration.test" --changed origin/main`.
- [ ] 3.3 Verificar que tests fallidos en la última run de integración se inyectan.

> 3.3 requiere un run previo con fallos y el service container PostgreSQL (no reproducible en local sin DB).

## 4. Merge queue

- [x] 4.1 Prerequisite externo: habilitar merge queue + required status checks en el repo (actualmente `mergeQueue=null`, `required_status_checks.contexts` vacío). Documentar como prerequisite o ejecutar. → **Ejecutado (2026-11-06)**: regla `merge_queue` añadida al ruleset 21227644 vía GET → modify → PUT (squash, `ALLGREEN`, `check_response_timeout_minutes=60`), con los 2 required checks (`Governance: PR Body Lint`, `Prebuild Governance Complete`) preservados y verificados con `gh api .../rules/branches/main`. Documentado en `docs/testing-architecture.md` §7.5.4 y `docs/CONTEXT-CICD.md` §3.3/§5.3.
- [x] 4.2 Quitar la cláusula `&& github.event_name == 'pull_request'` de `test-unit-client`, `test-unit-server`, `property-tests`, `test-integration`, `test-smoke`. Nota: `coverage-full-gate` (ci.yml:1334) tiene la condición como única; reformular a `github.event_name == 'pull_request' || github.event_name == 'merge_group'`. → Hecho en los 5 jobs + reformulación de `coverage-full-gate`.
- [ ] 4.3 Verificar en un PR mergeado que los 6 jobs de test corren en `merge_group`.
- [x] 4.4 Confirmar que los jobs de test no se saltan en `merge_group` (no romper skips legítimos path-scoped en PRs). → Verificado por construcción: `merge_group` fuerza `client/server/shared=true` en `repo-discovery`, y ningún `if` de test job depende ya del evento; en PRs los `if` siguen leyendo solo los outputs del filtro.

> 4.3 la merge queue ya está habilitada (4.1). Sigue abierto porque solo una corrida real lo demuestra: no es reproducible en local ni por `workflow_dispatch` — hace falta encolar un PR y ver los 6 jobs en el run `merge_group`.

## 5. Docs

- [x] 5.1 Actualizar `docs/testing-architecture.md` (paridad TIA) conforme al Impact del proposal. → §7.5.4 (tabla de tiers, fallback ampliado, override, merge queue), §7.5.5 (fila de integración en la paridad) y checklist pre-PR.

## 6. Cierre

- [x] 6.1 `openspec validate tia-enterprise-gaps --strict` exit 0.
- [ ] 6.2 Archivar el change (solo cuando se pida).
