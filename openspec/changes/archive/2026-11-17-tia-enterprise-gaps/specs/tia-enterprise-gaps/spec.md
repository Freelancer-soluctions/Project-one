# Spec: tia-enterprise-gaps

## ADDED Requirements

### Requirement: Merge queue runs the full test suite

When a PR is queued for merge, the test jobs SHALL run (not skip) so that integration never happens without tests.

#### Scenario: Tests run on merge_group

- **WHEN** a PR enters the merge queue
- **THEN** `test-unit-client`, `test-unit-server`, `property-tests`, `coverage-full-gate`, `test-integration` and `test-smoke` execute

### Requirement: Manual override forces full suite

A maintainer SHALL be able to force the full suite on a PR via a label or workflow_dispatch input.

#### Scenario: Label forces full suite

- **WHEN** a PR has label `ci:full-suite` or `workflow_dispatch` input `full_suite=true`
- **THEN** `Resolve TIA scope` sets `scope=full`

### Requirement: Transversal files trigger full suite fallback

Changes to global config, prisma schema or migrations SHALL trigger the full suite fallback.

#### Scenario: Prisma schema change triggers full suite

- **WHEN** a PR touches `apps/server/prisma/**`
- **THEN** `shared=true` and `scope=full`

### Requirement: Integration tests inject previously-failing tests

The integration job SHALL inject tests that failed in the latest run.

#### Scenario: Previously-failing integration tests are injected

- **WHEN** `test-integration` runs with scope=changed
- **THEN** tests from `tia-history` are injected via `tia-select.mjs`
