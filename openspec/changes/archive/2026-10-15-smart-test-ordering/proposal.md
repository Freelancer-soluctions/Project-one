# Proposal

## Why

El change en vuelo `tia-hardening` ya posee la cadena crítica del fail-first (producción de
`tia-history.json` tasks 4.1/4.2 → `vitest.sequencer.js` task 5.1 → verificación con fallo
sembrado task 5.2), pero `docs/learning/smart-test-ordering.md` (§4–§5) documenta lo que queda
**más allá** de esa cadena y hoy nadie lo cubre: en CI la caché de orden no se restaura
(`setup-monorepo` excluye `node_modules/.cache/vitest` → el BaseSequencer corre sin historial),
no se mide TTFF (la métrica madre del fail-first: "¿en qué % de la corrida aparece el primer
rojo?"), el ranking puede priorizar ruido flaky (paper Chrome: 99,58% de los fallos de su
pipeline eran flaky), no hay auditoría de order-dependence con seed, la ventana N no está tunada
y las docs siguen diciendo "Smart Test Ordering — NO".

## What Changes

**Track CI (pipeline):**

- **Historial visible para el sequencer en CI** (gap 4 — P2): garantizar que el artefacto
  `tia-history-<workspace>` que `tia-hardening` publica se restaura en la ruta exacta que lee el
  sequencer (`node_modules/.cache/tia/tia-history.json`) antes del step de tests, best-effort —
  sin artefacto el orden degrada a determinista y el job nunca falla por ello. La alternativa
  "incluir `node_modules/.cache/vitest` en la caché de `setup-monorepo`" se mide y se descarta
  por escrito (el historial propio sustituye ese hueco).
- **Métrica TTFF / first-fail** (gap 5 — P3): step summary advisory con time-to-first-failure
  (wall-clock y % de suite ejecutada hasta el primer rojo), % de fallos detectados en el primer
  X% de la corrida (APFD práctico) e historial hit-rate (calidad del predictor), junto a la
  métrica TIA existente (`injected=M`); publica también en corridas sin fallo ("sin primer
  fallo") y nunca bloquea.
- **Degradación flaky-aware del ranking** (gap 6 — P3): el ranking fail-first no asciende ficheros
  flaky (evidencia de `flaky-retries.json`/`flaky-evidence-*`) ni en cuarentena
  (`.github/flaky-quarantine.yml`); degrada, no ascende — la exclusión de cuarentena del tier PR
  sigue ocurriendo por argv tras la selección (`quarantine-exclude.mjs` intacto) y sin datos de
  flaky el ranking queda como está.
- **Auditoría de order-dependence con shuffle sembrado** (gap 7 — P3): comando local
  reproducible con seed fijo registrado (`--sequence.shuffle --sequence.seed=4242`) + workflow
  semanal advisory **nuevo** (no es check requerido, sin `continue-on-error`) — jamás el
  comportamiento por defecto del nocturno ni del tier PR blocking.

**Track local / estándar (developer workflow):**

- **Paridad de orden local sin tocar el hook**: el fail-first hereda localmente vía
  `vitest.shared.js` (mismo contrato que CI) — se verifica la paridad y se deja escrito que
  `.husky/pre-push` **no se modifica** (perteneciente a `pre-push-scoped-testing`).
- **Ventana N tunada con métrica**: documentar N (hoy 3, de `tia-hardening`) y ajustarlo solo
  con evidencia del hit-rate de la métrica TTFF — frescura vs memoria de fallos raros.
- **Docs desactualizadas** (gap 8 — P3, en PRs separados para no chocar con `tia-hardening`):
  celda "Smart Test Ordering — NO" (`docs/ci-cd-pipeline-empresarial.md` ~3412 y regla 21
  §23.3), gap 6 de `docs/learning/test-impact-analysis.md` §5 y
  `docs/learning/unit-tests-enterprise.md` §2.5 → estado implementado apuntando al research doc.

## Capabilities

### New Capabilities

- `smart-test-ordering`: orden fail-first más allá del sequencer base — disponibilidad del
  historial en CI (restore best-effort a la ruta del sequencer), degradación del ranking ante
  flaky/cuarentena, métrica TTFF/first-fail advisory, auditoría de order-dependence con shuffle
  sembrado y paridad de orden en el tier local sin tocar el hook pre-push.

### Modified Capabilities

- _(ninguno)_: `ci-test-impact-analysis` **no se modifica aquí** — su requirement "Fail-first
  ordering of scoped runs" es delta de `tia-hardening` (evita conflicto de merge en el mismo
  fichero de spec). `ci-caching` tampoco cambia a nivel de spec: la decisión es no incluir
  `node_modules/.cache/vitest` en la caché (documentada en design). `shared-vitest-config`,
  `ci-flaky-quarantine` y `pre-push-scoped-testing` quedan como fuentes/contratos que este
  change consulta sin alterar.

## Impact

- **Archivos nuevos**: `scripts/ci/ttff-metric.mjs` (métrica TTFF/hit-rate),
  `.github/workflows/order-dependence-audit.yml` (auditoría semanal advisory).
- **Archivos existentes (edición coordinada)**: `vitest.sequencer.js` (extensión flaky-aware —
  prerequisito `tia-hardening` 5.1), `.github/workflows/ci.yml` (steps advisory TTFF + confirmación
  del restore del historial — prerequisito `tia-hardening` 4.4), docs (ver What Changes).
- **Prerrequisitos de `tia-hardening` (referenciados, NO duplicados)**: tasks 4.1/4.2
  (producción del historial), 4.4 (patrón de descarga de artefactos con run-id), 5.1
  (`vitest.sequencer.js` + `sequence.sequencer` + `TIA_SEQUENCER=stable`), 5.2 (verificación con
  fallo sembrado). Este change se **secuencia después** de esas tasks.
- **Sin cambios** (referenciados como relacionados): `.husky/pre-push` (`pre-push-scoped-testing`),
  `continue-on-error` y jobs de test de `ci.yml` (`ci-testing-gate-promotion`),
  `apps/client/vitest.config.js` y `apps/client/package.json` (`client-snapshot-testing`),
  `scripts/ci/quarantine-exclude.mjs` y `.github/flaky-quarantine.yml`
  (`ci-flaky-quarantine`), `setup-monorepo` (`ci-caching`), nocturno
  (`tia-hardening` — sigue corriendo suite completa con `TIA_SEQUENCER=stable`).
- **Riesgos de conflicto a secuenciar**: `ci.yml` y `docs/learning/test-impact-analysis.md` §5 los
  editan también `tia-hardening` (tasks 1.1/4.5 y 11.2) — los PRs de este change van **después**
  de los suyos, y la celda de docs en un PR aparte (recomendación §5.8 del research doc).
