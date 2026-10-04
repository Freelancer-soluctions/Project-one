# ci-flaky-retry Specification

## Purpose

Retries automáticos acotados para tests intermitentes — Playwright E2E y suites Vitest — de modo que un fallo esporádico no bloquee el pipeline. Esta capability es dueña de la CONFIGURACIÓN de retry; la visibilidad del retry en la métrica semanal y la prohibición de enmascarar flakiness son requisito de `ci-flaky-quarantine` ("Bounded, CI-only and visible retries"), que este change también entrega — cero duplicación de requisitos. Estado verificado en el árbol 2026-10-01: los retries ya existen; esta capability los especifica.

## Requirements

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
- **THEN** it retries up to 2 times under the CI condition (`retry: 2` with `maxWorkers: 1`)
- **AND** local runs are unaffected

#### Scenario: Local runs are unaffected

- **WHEN** a developer runs the suites locally (outside CI)
- **THEN** no retry is applied (`retries: process.env.CI ? 2 : 0` and the CI-conditioned `retry: 2`)
- **AND** the metric/visibility contract of these retries is owned by `ci-flaky-quarantine`

### Requirement: Vitest CI runs keep module isolation

The Vitest configuration of both workspaces SHALL NOT set `isolate: false` under CI. Disabling module isolation
makes the module registry shared across test files in a worker, so the `vi.mock` factory of the first file to run
is cached and overrides the one of every file that follows. Test files that each declare only the subset of module
exports they exercise then observe whichever shape was registered first, making results depend on execution order.

#### Scenario: A test failure does not depend on execution order

- **WHEN** the server unit suite runs under CI
- **THEN** each test file resolves its own `vi.mock` factories regardless of which file ran before it
- **AND** a partial mock in one file cannot remove exports that another file asserts (`No "<export>" export is
defined on the mock`)

#### Scenario: Shared-module contamination is not reintroduced

- **WHEN** a change considers setting `isolate: false` for speed or memory reasons
- **THEN** it is rejected unless it can demonstrate that no two test files mock the same module
- **AND** the cost of keeping isolation is weighed against the value of a red test meaning something — a
  blocking gate whose redness depends on ordering cannot be promoted to blocking

#### Scenario: Measured cost of isolation

- **WHEN** the server unit suite runs with and without `isolate: false`
- **THEN** the suite reports the same pass/fail result, with isolation adding ~3.2s (~1.2s → ~4.4s)
- **AND** that delta is a rounding error against the ~2m20s job duration
