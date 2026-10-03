# Spec Delta — ci-flaky-retry (absorbida de `ci-test-integration`, alineada con `ci-flaky-quarantine`)

## Purpose

Retries automáticos acotados para tests intermitentes — Playwright E2E y suites Vitest — de modo que un fallo esporádico no bloquee el pipeline. Esta capability es dueña de la CONFIGURACIÓN de retry; la visibilidad del retry en la métrica semanal y la prohibición de enmascarar flakiness son requisito de `ci-flaky-quarantine` ("Bounded, CI-only and visible retries"), que este change también entrega — cero duplicación de requisitos. Estado verificado en el árbol 2026-10-01: los retries ya existen; esta capability los especifica.

## ADDED Requirements

### Requirement: Playwright flaky test retry, bounded and CI-only

Playwright E2E tests SHALL retry flaky tests up to 2 times, only when running in CI, and the retry SHALL be visible in the test report.

#### Scenario: Playwright retry on failure

- **WHEN** a Playwright test fails in CI (`process.env.CI` set)
- **THEN** it retries up to 2 times before reporting failure (`retries: process.env.CI ? 2 : 0`)
- **AND** locally (`CI` unset) no retries are applied

### Requirement: Vitest flaky test retry, bounded and CI-only

Vitest integration tests SHALL retry flaky tests up to 2 times, only when running in CI, with the retry observable in the run report.

#### Scenario: Vitest retry on failure

- **WHEN** a Vitest test fails in CI
- **THEN** it retries up to 2 times under the CI condition (`retry: 2` with `maxWorkers: 1, isolate: false`)
- **AND** local runs are unaffected

#### Scenario: Local runs are unaffected

- **WHEN** a developer runs the suites locally (outside CI)
- **THEN** no retry is applied (`retries: process.env.CI ? 2 : 0` and the CI-conditioned `retry: 2`)
- **AND** the metric/visibility contract of these retries is owned by `ci-flaky-quarantine`
