# Spec Delta — ci-test-jobs-activation (fase 2: promoción a blocking)

## Purpose

`ci-testing-pipeline-reactivation` (archivado 2026-10-03) reactivó los 6 jobs de testing en FASE 1 advisory: ejecutan,
publican artefactos y anotan el PR, pero con `continue-on-error: true` no bloquean el merge. Su propio diseño exigía
una ventana de calibración previa a la promoción, y el requirement de FASE 2 se retiró de aquel delta para no
sincronizar un `SHALL` incumplido.

Este delta lo reintroduce, para que la promoción a blocking tenga un contrato normativo explícito y no dependa de la
memoria. El cambio de estado documental (`docs/learning/quality-gates.md`) es parte del requirement, no un extra.

## ADDED Requirements

### Requirement: FASE 2 blocking promotion

After the calibration window, `continue-on-error` SHALL be removed from the 6 jobs so test and coverage failures block the merge through `prebuild-unit-tests-complete` → `ci-complete`, and `docs/learning/quality-gates.md` SHALL be updated in lockstep with the new blocking state.

#### Scenario: Red test after promotion

- **WHEN** a test job fails after FASE 2 promotion
- **THEN** `prebuild-unit-tests-complete` reports failure and `ci-complete` fails, blocking the merge
- **AND** `docs/learning/quality-gates.md` lists the 6 jobs as blocking (no stale `if: false` rows)

#### Scenario: Promotion is atomic, never partial

- **WHEN** the promotion PR is opened
- **THEN** `continue-on-error: true` is removed from all 6 jobs in that single change — `test-unit-client`,
  `test-unit-server`, `test-integration`, `test-smoke`, `client-coverage`, `server-coverage`
- **AND** no intermediate commit leaves some jobs blocking while others remain advisory, because the aggregator's
  `needs` chain is transitive and a half-promoted state has no useful property

#### Scenario: Promotion does not rename required checks

- **WHEN** the promotion PR is reviewed
- **THEN** `prebuild-unit-tests-complete.needs` still contains exactly the same 6 job ids
- **AND** no job `name:` is changed, so no required status check in ruleset 21227644 needs rebinding
