# Proposal

## Why

El repo ya tiene TIA funcional (diff-scoped en CI + guard D7 + safety net nocturno + cuarentena +
pre-push, spec `ci-test-impact-analysis`), pero `docs/learning/test-impact-analysis.md` §5 documenta
8 gaps de **precisión, medición y madurez** frente a la práctica enterprise: `coverage.changed`
(Vitest 4) existe y no se usa, no hay métrica de precisión (¿qué % del suite corre por PR? ¿cuántos
falsos positivos por imports dinámicos?), no hay coverage-map persistente, no se inyectan los tests
fallidos de `main`, el TIA solo cubre unit, no hay fail-first, la cache de build+test no comparte
hash, y los jobs siguen en FASE 1 advisory. Sin medición no se puede promover nada con criterio, y
sin la contraparte local el tier de desarrollador queda fuera del contrato.

## What Changes

**Track CI (pipeline):**

- **P1 — Métrica shadow mode**: loguear en el step summary _qué habría seleccionado_ TIA
  (`vitest list --changed --filesOnly`) frente a lo ejecutado (`numTotalTests` / total del suite) →
  % de suite seleccionado por PR y señal de falsos positivos; medición nunca altera la selección.
- **P1 — `coverage.changed` activado**: `test:changed:ci` en ambos workspaces limita el reporte de
  cobertura a los ficheros del diff (`--coverage.changed=origin/main`), validado con
  `scripts/ci/check-coverage.mjs` en modo advisory bajo D18 (los thresholds siguen solo en full).
- **P2 — Inyección de previously-failing tests** (componente 2 de Microsoft TIA): la selección añade
  siempre los tests que fallaron en los últimos N runs full-suite de `main`; no-op si no hay
  historial; conteo visible en la métrica. La unión se calcula en dos fases (`vitest list
--changed --filesOnly` ∪ inyectados, ejecución por lista explícita vía `scripts/ci/tia-select.mjs`)
  porque Vitest 4 intersecta los posicionales con `--changed`.
- **P2 — Coverage-map/dependencias persistente** (estilo testmon/Agoda): los runs full-suite publican
  el mapa test→ficheros y los PRs lo consumen; ausente/corrupto → fallback al grafo de imports
  estático + D7 (nunca selección vacía en silencio).
- **P3 — Extensión del contrato TIA** (`Resolve TIA scope` + D7) a los jobs de integration y — cuando
  `ci-e2e` lo active — e2e; **fail-first/smart ordering** (`BaseSequencer` sobre historial); y
  **evaluación de remote cache build+test** contra `docs/adr/turborepo-evaluation.md` (inputs de hash
  consistentes entre build y test, un solo dueño de invalidación).
- **P3 — Consideración FASE 1 → 2**: la métrica shadow mode es el insumo de la ventana de
  calibración de `docs/learning/quality-gates.md`; quitar `continue-on-error` sigue siendo
  responsabilidad de `ci-testing-gate-promotion` (no se duplica aquí).

**Track local / estándar (developer workflow):**

- **Auditoría de selección on-demand**: scripts `test:tia:audit` (raíz + ambos workspaces) que imprimen
  _qué_ seleccionaría Vitest para el diff (`vitest list --changed --filesOnly`) sin ejecutar nada.
- **Scoped run local con paridad de CI**: script `test:tia` por workspace con el mismo diff base,
  mismo filtro unit y `--coverage.changed=origin/main`, más la inyección de tests fallidos cuando
  existe historial local.
- **Coverage-map/estado de selección persistente en local** (`node_modules/.cache`, ya cacheado en CI
  por `setup-monorepo`): reutilizable entre corridas, fuera de git, reconstruible desde cero si falta.
- **Docs y checklist para devs**: workflow estándar de todos los días documentado (cuándo basta el
  tier scoped, cuándo correr full local, cómo leer la auditoría, paridad local↔CI), extendiendo
  `docs/testing-architecture.md` §7.5 y las recetas de `docs/learning/test-impact-analysis.md`.

## Capabilities

### New Capabilities

- `local-tia-workflow`: TIA en el nivel de desarrollador — auditoría de selección on-demand, scoped
  run local con paridad de CI (diff base, filtro unit, cobertura limitada al diff, inyección de
  fallidos), estado de selección persistente en local, y el workflow estándar documentado con su
  checklist.

### Modified Capabilities

- `ci-test-impact-analysis`: se endurece el requirement de diff-scoped (selección = diff-afectados ∪
  previamente fallidos, `--coverage.changed` en `test:changed:ci`) y se añaden requirements de
  métrica shadow mode, coverage-map persistente, inyección de previamente fallidos, extensión a
  integration/e2e, fail-first, y evidencia de calibración previa a la promoción de gates.

## Impact

- `.github/workflows/ci.yml` — steps de shadow metric en `test-unit-client`/`test-unit-server`,
  flag `--coverage.changed`, consumo/publicación del coverage-map; más adelante `test-integration`
  (y `e2e` cuando se active) hereda `Resolve TIA scope` + D7.
- `package.json` (raíz y `apps/client`, `apps/server`) — scripts `test:tia:audit` y `test:tia`.
- `scripts/ci/` — script de métrica shadow (step summary), inyector de previamente fallidos,
  build/consumidor del coverage-map, y selector de dos fases `tia-select.mjs` (lector único de la
  selección CI↔local); reutiliza el patrón de `flaky-metric.mjs` y `quarantine-exclude.mjs`.
- `scripts/ci/check-coverage.mjs` — modo advisory para el reporte diff-limited (D18 intacto).
- `docs/testing-architecture.md` §7.5, `docs/learning/test-impact-analysis.md`,
  `docs/learning/quality-gates.md` (evidencia de calibración), `docs/adr/turborepo-evaluation.md`
  (decisión de remote cache).
- **Sin cambios** (referenciados como relacionados, no modificados): `pre-push-scoped-testing`
  (el hook NO se toca: mantener "solo tests afectados" evita contradecirlo — la inyección vive en
  CI y en el script on-demand local), `ci-caching`, `ci-flaky-quarantine`, `ci-test-jobs-activation`
  (dueño de FASE 1→2, en el change en vuelo `ci-testing-gate-promotion`).
- Coordinación: depende de `ci-testing-gate-promotion` para la promoción a blocking; provee su
  insumo (métrica TIA) sin duplicar su mecanismo.
