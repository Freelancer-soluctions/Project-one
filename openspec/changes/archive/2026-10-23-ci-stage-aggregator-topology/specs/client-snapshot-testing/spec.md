# Spec Delta

## MODIFIED Requirements

### Requirement: Snapshot tests run in the CI prebuild testing substage

The snapshot suite SHALL run inside the existing STAGE 2 PRE-BUILD testing substage of `.github/workflows/ci.yml` — job `test-unit-client` (SUBSTAGE 2D, aggregated by `prebuild-tests-complete`) — through the scripts that job already invokes: `test:changed:ci` for the diff-scoped run and `test:coverage:ci` for the full-suite run. No separate snapshot job SHALL be added, and the snapshot wiring SHALL NOT justify adding or removing any job in any `prebuild-*-complete` aggregator's `needs`: this change adds no snapshot job, therefore removes no job from any aggregator on the snapshot's behalf, and leaves the prebuild → build → artifact order unchanged for snapshot execution. No CI step or CI-consumed script SHALL pass `-u`, `--update`, `--update=all` or `--update=new`. Because GitHub Actions exports `CI=true`, `test.update` resolves to `'none'` in those runs, so the committed `.snap` files and inline snapshots are validated and a missing, mismatched, or obsolete snapshot fails the Vitest step without writing anything.

#### Scenario: A snapshot mismatch fails the prebuild test job

- **WHEN** a PR changes rendered markup without refreshing the corresponding snapshots
- **THEN** `test-unit-client` runs the affected `*.ui.test.jsx`, the Vitest step exits non-zero with the snapshot diff in the log and in `reports/junit.xml`, and no snapshot file is modified (the job's FASE-1 `continue-on-error` controls merge-blocking and is governed by the pipeline's calibration, not by this capability)

#### Scenario: A diff-scoped run still validates committed snapshots

- **WHEN** the TIA scope resolves to `changed` and the diff includes snapshot tests, their components, or only snapshot artifacts (`.snap` or inline edits)
- **THEN** Vitest selects the tests whose module graph intersects the changed files and validates them against the committed snapshots under `update: 'none'`; when the diff selects 0 tests, the existing guard falls back to the full suite, so committed snapshots are never skipped silently

#### Scenario: A shared-path change validates the whole snapshot suite

- **WHEN** `repo-discovery` reports `shared == 'true'` (root manifest, lockfile, workflows) or `origin/main` is not resolvable
- **THEN** the job runs the full client suite with `test:coverage:ci`, executing all snapshot tests (F1 = 37, F2 = 20, F3 = 26 files) under `update: 'none'`

#### Scenario: CI cannot approve a snapshot

- **WHEN** the workflow steps and npm scripts reachable from `test-unit-client` are inspected
- **THEN** neither `ci.yml` nor `test`, `test:unit`, `test:integration`, `test:changed`, `test:changed:ci`, `test:coverage`, `test:coverage:ci` contains an update flag, so a snapshot can only change through a locally reviewed run committed in the PR

#### Scenario: The prebuild stage order and aggregator contracts are preserved

- **WHEN** the snapshot wiring is verified against `.github/workflows/ci.yml`
- **THEN** snapshot execution happens in the existing prebuild job (order: prebuild → build → artifact unchanged), `prebuild-tests-complete.needs` still contains exactly `[test-unit-client, test-unit-server, client-coverage, server-coverage, property-tests]`, and no job id or display name bound to the ruleset is renamed

#### Scenario: CI runs are deterministic for snapshots

- **WHEN** the suite runs on the CI runner (`CI=true`)
- **THEN** execution stays deterministic — `maxWorkers: 1` from the `CI` branch of `vitest.config.js`, `pool: 'forks'` with default isolation, fixtures frozen per test, `vi.setSystemTime` for dates, i18n fixed to `'en'` and per-test MSW handlers — so the same committed snapshots pass on every run
