# Spec Delta — ci-test-impact-analysis

## Purpose

Escopea la ejecución de tests en CI al diff del pull request (Test Impact Analysis con `vitest run --changed origin/main`), manteniendo una red de seguridad de suite completa nocturna y disparando la suite total cuando cambian rutas compartidas.

## ADDED Requirements

### Requirement: Diff-scoped unit test execution in CI

When a workspace test job runs for a PR, it SHALL execute only the tests affected by the diff between the PR head and `origin/main` via the workspace CI script `test:changed:ci` (`test:changed` plus coverage, explicit `--outputFile=reports/junit.xml` for JUnit, and the `.unit.test.js` scope on the server), with the full git history already provided by the checkout of `ci.yml` (`fetch-depth: 0` is declared today — nothing to add) so `origin/main` is available.

#### Scenario: PR touches a single client module

- **WHEN** a PR changes one module under `apps/client/src/**`
- **THEN** `test-unit-client` runs `npm run test:changed:ci --workspace=apps/client`, executing only client test files whose sources changed
- **AND** the job stays in `prebuild-unit-tests-complete.needs`, so its result (including "no affected tests") still counts for the merge gate

#### Scenario: origin/main unavailable

- **WHEN** the checkout cannot resolve `origin/main` (shallow or detached fetch)
- **THEN** the job fails loudly (or falls back to the full suite) instead of silently reporting zero affected tests

### Requirement: Full suite on shared path changes

When `repo-discovery.outputs.shared == 'true'` (root `package.json`, lockfile, `.github/workflows/**`, dependency-cruiser configs), the workspace test jobs SHALL run the complete suite rather than the diff-scoped one.

#### Scenario: Lockfile-only PR

- **WHEN** a PR changes only `package-lock.json`
- **THEN** both unit jobs run their full suites (a dependency bump can affect tests unrelated to the diff)

### Requirement: Scheduled full-suite safety net

A scheduled (nightly) workflow SHALL run the complete unit suites of both workspaces regardless of any diff, and its failures SHALL be reported and triaged — starting advisory and promoted to blocking by the same FASE 1 → FASE 2 pattern.

#### Scenario: Nightly run detects what TIA missed

- **WHEN** the nightly scheduled run executes the full suites
- **THEN** a failure caused by state outside the PR diff (ordering, cache, dependency drift) is surfaced even though every PR run was green
- **AND** the result is visible in the scheduled workflow run, not only in PR checks

### Requirement: TIA does not weaken local or CI gates

Diff-scoped CI execution SHALL complement, not replace, the local pre-push tier (`.husky/pre-push`, spec `pre-push-scoped-testing`) and SHALL NOT remove any job from `prebuild-unit-tests-complete.needs`.

#### Scenario: Developer bypasses hooks

- **WHEN** a contributor pushes with `--no-verify` or from a machine without the hooks
- **THEN** the CI test jobs still execute (scoped to the diff, or fully on shared changes) and gate the merge — the defense-in-depth fallback exists

#### Scenario: Three-tier strategy documented

- **WHEN** a developer reads `docs/testing-architecture.md` §7.5 after this change
- **THEN** the CI tier documents diff-scoped execution, the nightly full-suite safety net and the local pre-push tier as one coherent strategy
