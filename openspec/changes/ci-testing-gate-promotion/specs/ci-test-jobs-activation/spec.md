# Spec Delta — ci-test-jobs-activation (fase 2: promoción a blocking)

## Purpose

`ci-testing-pipeline-reactivation` (archivado 2026-10-03) reactivó los jobs de testing de STAGE 2 en FASE 1 advisory:
ejecutaban, publicaban artefactos y anotaban el PR, pero 5 de ellos — `test-unit-client`, `test-unit-server`,
`client-coverage`, `server-coverage`, `property-tests` — llevaban `continue-on-error: true` y su fallo se absorbía a
nivel de job; `test-integration` y `test-smoke` no lo llevan y ya fallan `postbuild-tests-complete`. Ningún contexto
de tests es required en el ruleset 21227644 (API 2026-10-28), así que un test rojo no bloquea el merge. Su propio
diseño exigía una ventana de calibración previa a la promoción (design D9 de este change reordena la ejecución sin
cambiar el estado final), y el requirement de FASE 2 se retiró de aquel delta para no sincronizar un `SHALL`
incumplido.

Este delta lo reintroduce, para que la promoción a blocking tenga un contrato normativo explícito y no dependa de la
memoria. El cambio de estado documental (`docs/learning/quality-gates.md`) es parte del requirement, no un extra.

## ADDED Requirements

### Requirement: FASE 2 blocking promotion

`continue-on-error` SHALL be removed from the 5 jobs that carry it — `test-unit-client`, `test-unit-server`,
`client-coverage`, `server-coverage`, `property-tests`, the 5 `needs` of `prebuild-tests-complete`
(`ci.yml:2552-2562`) — in a single promotion change, so a test or coverage failure in any of them reports FAILURE and
makes its chain's aggregator fail. The testing surface reaches `ci-complete` through two chains: the 5 promoted jobs
through `prebuild-tests-complete`, and `test-integration`/`test-smoke` (which carry no `continue-on-error` and SHALL
NOT be modified) through `postbuild-tests-complete` (`ci.yml:2609-2613`). `docs/learning/quality-gates.md` SHALL be
updated in lockstep with the new blocking state. The promotion SHALL NOT be presented as merge-blocking: ruleset
21227644 requires exactly two contexts, none of them a test check (API 2026-10-28), so binding a testing context to
the ruleset is a separate future governance change, recorded in `tasks.md` 3.4 (body-lint FASE 3 precedent,
`docs/CONTEXT-CICD.md` §3.2/§5.1; Rule 8: renaming breaks bindings).

#### Scenario: Red test after promotion

- **WHEN** a promoted test job fails after FASE 2 promotion
- **THEN** `prebuild-tests-complete` reports failure and `ci-complete` fails — visible red on the PR
- **AND** `docs/learning/quality-gates.md` lists the promoted jobs as blocking (no stale `if: false` rows)

#### Scenario: Red is visible; merge blocking waits for a future governance change

- **WHEN** a promoted job fails and its aggregator reports failure
- **THEN** the merge is not blocked by GitHub, because ruleset 21227644 requires exactly two contexts, none of them
  a test check (API 2026-10-28)
- **AND** binding a testing context (`CI Complete` or a testing aggregator) to ruleset 21227644 is recorded as a
  separate future governance change (`tasks.md` 3.4), following `docs/CONTEXT-CICD.md` §3.2/§5.1 and the body-lint
  FASE 3 precedent (GET → modify → PUT, never PATCH), with Rule 8: renaming the job breaks the binding

#### Scenario: Promotion is atomic, never partial

- **WHEN** the promotion PR is opened
- **THEN** `continue-on-error: true` is removed from all 5 jobs in that single change — `test-unit-client`,
  `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests`
- **AND** `test-integration` and `test-smoke` are left unmodified (they already fail `postbuild-tests-complete`)
- **AND** no intermediate commit leaves some jobs blocking while others remain advisory, because the aggregator's
  `needs` chain is transitive and a half-promoted state has no useful property

#### Scenario: Promotion does not rename required checks

- **WHEN** the promotion PR is reviewed
- **THEN** `prebuild-tests-complete.needs` still contains exactly the same 5 job ids
- **AND** no job `name:` is changed, so no required status check in ruleset 21227644 needs rebinding (Rule 8,
  `docs/CONTEXT-CICD.md` §3.2)

> **Ampliación 2026-10-28.** Además del requirement de FASE 2, este delta añade un requirement de integridad del
> enforcer de cobertura previo a la promoción (pasos 1-3): sin él, el gate blocking promovido fallaría por
> cobertura rota pre-existente, no por tests rojos (evidencia en `proposal.md`, baseline medido 2026-10-28).

### Requirement: Coverage enforcer integrity before blocking promotion

Before `continue-on-error` is removed from the 5 jobs, the coverage threshold configuration SHALL be repaired so the strict gate can pass: every declared glob threshold SHALL match at least one instrumented file, per-file threshold evaluation SHALL have exactly one enforcer whose documented semantics match the actual engine behavior, and the client per-file breaches SHALL be resolved — re-baselined with tests, or lowered with the justification recorded in the PR that lowers them. `scripts/ci/check-coverage.mjs` is the sole per-file enforcer for glob thresholds; Vitest 4.1.11 evaluates those glob thresholds in aggregate and ignores a nested `perFile` option.

#### Scenario: Strict coverage gate is green before promotion

- **WHEN** the promotion PR removes `continue-on-error` from the 5 jobs
- **THEN** `node scripts/ci/check-coverage.mjs apps/client` and `node scripts/ci/check-coverage.mjs apps/server` both exit 0 in strict mode against full-suite coverage
- **AND** no glob threshold in either workspace vitest config matches zero instrumented files (no `no files matched` warnings)

#### Scenario: Per-file semantics have a single enforcer

- **WHEN** a glob threshold declares per-file strictness
- **THEN** exactly one evaluator enforces it in the pipeline — either Vitest with a configuration its engine actually honors per-file, or `check-coverage.mjs` as the sole per-file enforcer
- **AND** the `apps/client/vitest.config.js` comment and the `scripts/ci/check-coverage.mjs` docstring describe what the engine actually does (no promise of symmetry the engine does not implement)

#### Scenario: Lowering a threshold is recorded, never silent

- **WHEN** a coverage threshold is lowered so the strict gate passes
- **THEN** the PR that lowers it records the justification, per the PRD anti-pattern rule ("Bajar el umbral para que pase. Si el umbral se mueve, queda registrado en el PR que lo mueve, con justificación")

## MODIFIED Requirements

### Requirement: FASE 1 advisory activation

The advisory posture described here is **historical**, not the current contract. The initial activation used
job-level `continue-on-error: true` for `test-unit-client`, `test-unit-server`, `client-coverage` and
`server-coverage` so that test or coverage failures were reported — job log, `dorny/test-reporter` annotations,
uploaded artifacts — without blocking `prebuild-tests-complete` or `ci-complete`; `test-integration` and
`test-smoke` were activated without the flag and have always failed `postbuild-tests-complete`. That posture is
superseded for the five promoted jobs by `Requirement: FASE 2 blocking promotion` of this same capability: none of
`test-unit-client`, `test-unit-server`, `client-coverage`, `server-coverage` or `property-tests` SHALL carry
`continue-on-error` today, and a job-level `continue-on-error` on any of them is only admissible as the explicitly
recorded, per-job rollback of the promotion (`design.md` D9), never as a leftover of FASE 1.

#### Scenario: Red test during calibration window

- **WHEN** a unit test fails in `test-unit-server` during the advisory window (2026-10-03 → 2026-10-29)
- **THEN** the job log and the JUnit report showed the failure and the test report check was annotated
- **AND** `prebuild-tests-complete` and `ci-complete` still finalized with success, the advisory state recorded at the
  time in `docs/learning/quality-gates.md`
- **AND** the same failure today fails both aggregators, because the FASE 2 promotion removed that absorption

#### Scenario: Calibration window elapses cleanly

- **WHEN** the calibration window completed with the prerequisites green (module isolation, strict coverage in both
  workspaces, `test-integration`/`test-smoke` verified in CI)
- **THEN** the five jobs were promoted to FASE 2 in a single atomic change, per `Requirement: FASE 2 blocking
promotion` of this capability
- **AND** the window itself continues after the promotion as the observation period whose flakes would trigger the
  per-job rollback
