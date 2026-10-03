# ci-test-reporting Specification

## Purpose

Reporting de resultados de test directamente en el pull request vía JUnit + annotations, para que los fallos se depuren sin salir del PR. Modernizada respecto del delta heredado: aplica a TODOS los jobs de test activados por este change, con las rutas exactas que producen los scripts `*:ci` (`apps/client/reports/junit.xml`, `apps/server/reports/junit.xml`).

## Requirements

### Requirement: JUnit test reporting with PR annotations

Each activated test job SHALL report its results to the pull request via `dorny/test-reporter` with JUnit XML annotations, running with `if: success() || failure()` so red runs are also annotated.

#### Scenario: Test reporting after any test job

- **WHEN** any activated test job completes (success or failure)
- **THEN** its `dorny/test-reporter` step runs with `if: success() || failure()`
- **AND** it creates a GitHub Check Run with JUnit annotations in the PR diff, consuming the exact report path the job's `*:ci` script produced

#### Scenario: No missing-report failure mode

- **WHEN** `test-unit-client` or `test-unit-server` runs after the P0-a tasks
- **THEN** the JUnit file exists at the path the reporter step declares (no "no test report files found" error)

### Requirement: Single check per workspace

Each workspace SHALL surface exactly one test-report check name for its unit suite, so FASE gating and any future shard merge keep publishing under the same check instead of renaming required or advisory checks.

#### Scenario: Check name stability across phases

- **WHEN** the reporting steps are compared before and after P2 sharding (if activated)
- **THEN** the check name per workspace is unchanged (shard blobs are merged into one `reports/junit.xml` before publishing)
