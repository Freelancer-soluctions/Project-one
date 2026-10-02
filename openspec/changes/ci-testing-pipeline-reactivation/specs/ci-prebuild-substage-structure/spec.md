# Spec Delta — ci-prebuild-substage-structure

## MODIFIED Requirements

### Requirement: prebuild-unit-tests-complete

The `prebuild-unit-tests-complete` aggregator SHALL depend on exactly 6 jobs: `[test-unit-client, test-unit-server, test-integration, test-smoke, client-coverage, server-coverage]`. The first 4 are the test jobs of Substage 2D UNIT TESTING; `client-coverage` and `server-coverage` are the coverage-tripwire jobs and SHALL remain defined outside the Substage 2D block (their physical location does not move). The jobs `test-e2e` and `coverage` do NOT exist as job names in ci.yml, and `e2e` stays excluded (`if: false`, explicitly out of scope).

#### Scenario: Unit-tests aggregator needs resolution

- **WHEN** `prebuild-unit-tests-complete` runs
- **THEN** its `needs` array contains exactly those 6 jobs — no more, no less
- **AND** the first 4 jobs are from Substage 2D UNIT TESTING while `client-coverage`/`server-coverage` remain outside the substage block

#### Scenario: Path-skipped jobs count as passing

- **WHEN** a PR touches only `apps/client/**`, so `test-unit-server`, `test-integration`, `test-smoke` and `server-coverage` are skipped by their path conditions
- **THEN** the aggregator treats the skipped `needs` as passing and finalizes with success if the client-side chain (`test-unit-client`, `client-coverage`) is green

#### Scenario: Coverage tripwire failure propagates

- **WHEN** `server-coverage` finalizes with `failure` (coverage below the workspace thresholds or a missing/stale summary)
- **THEN** `prebuild-unit-tests-complete` finalizes with failure and `ci-complete` blocks the merge
