# Spec Delta — local-tia-workflow

## Purpose

Developer-local Test Impact Analysis: an auditable, CI-parity scoped-test workflow — an on-demand
selection audit, scoped local runs with diff-limited coverage and previously-failing injection, a
persisted local selection state, and the documented everyday workflow that tells developers when the
scoped tier is enough and when to run the full suite locally.

## ADDED Requirements

### Requirement: ADDED On-demand selection audit

The repository SHALL expose an npm script at the root and in BOTH workspaces (`test:tia:audit`) that
prints which test files Vitest would select for the current diff WITHOUT executing any test —
`vitest list --changed <base> --filesOnly` — together with the changed-file list of the diff, so a
developer can inspect the selection before trusting it. The audit SHALL use the same diff base as
`test:changed` (`origin/main`) and SHALL fail with an explicit message when that base cannot be
resolved, mirroring the pre-push contract.

#### Scenario: Audit lists the selection

- **WHEN** a developer runs `npm run test:tia:audit` with `origin/main` resolvable
- **THEN** the command prints the changed files of the diff and the test files Vitest would select
- **AND** no test is executed and the command exits 0

#### Scenario: Audit without a resolvable base

- **WHEN** `origin/main` cannot be resolved locally
- **THEN** the audit fails with a message instructing the developer to run `git fetch origin main`
- **AND** it never silently reports an empty selection

### Requirement: ADDED Scoped local run with CI parity

Each workspace SHALL expose an on-demand scoped run (`test:tia`, reachable from the root script of
the same name) that shares the CI selection contract: the same diff base (`origin/main`), the same
unit filter as CI (server: `.unit.test.js`), coverage limited to the diff-touched files
(`--coverage.changed=origin/main`), and the previously-failing tests injected when a local history
exists — no history means the plain diff-derived selection. The on-demand run SHALL NOT be wired
into `.husky/pre-push`, whose contract (only diff-affected tests, unit-only, no DB/e2e) stays as
specified by `pre-push-scoped-testing`.

#### Scenario: Scoped local run matches CI selection inputs

- **WHEN** a developer runs `npm run test:tia` after changing one server module
- **THEN** it executes the same unit tests CI would select for that diff, plus injected previously-failing tests if local history exists
- **AND** the coverage report it produces is limited to the changed files
- **AND** the run exits 0 regardless of that limited report's percentages (coverage thresholds are neutralized in scoped runs, D18 parity; full-suite runs keep enforcing them)

#### Scenario: No local history

- **WHEN** no previously-failing history exists locally
- **THEN** the run executes exactly the diff-derived selection and completes normally

#### Scenario: Pre-push hook untouched

- **WHEN** the developer pushes
- **THEN** `.husky/pre-push` keeps running only `test:changed` per workspace, without audit output, injection or coverage flags

### Requirement: ADDED Persisted local selection state

Selection-supporting state (Vitest cache, coverage/dependency map and the recently-failing history
used by injection and fail-first ordering) SHALL be persisted locally in the shared root cache
directory (`node_modules/.cache`, the same directory CI caches via `setup-monorepo`) so repeated
scoped runs reuse it across invocations and workspaces. This state SHALL stay out of git, and the
workflow SHALL define a recovery path for when it is missing or corrupt: rebuild with a local
full-suite run (`npm run test` / `npm run test:coverage`) instead of trusting a stale selection.

#### Scenario: State reused between runs

- **WHEN** a developer runs `test:tia:audit` or `test:tia` twice in a row on the same machine
- **THEN** the second run reuses the cached selection state (and the local history) instead of starting from nothing

#### Scenario: State never committed

- **WHEN** a scoped run writes cache or history files
- **THEN** those files live under `node_modules/.cache` and are ignored by git

#### Scenario: Missing or corrupt state

- **WHEN** the cache directory is empty (fresh clone) or contains invalid state
- **THEN** selection falls back to the static import graph and the workflow instructs a full-suite local run to rebuild it
- **AND** the audit/scoped run never reports a vacuous success from corrupt state

### Requirement: ADDED Everyday TIA workflow documented

`docs/testing-architecture.md` §7.5 SHALL document the everyday developer workflow for TIA as one
coherent strategy: what the pre-push hook runs, how to audit the selection with `test:tia:audit`,
when the scoped tier is enough, when to run the full suite locally (shared paths — root manifest,
lockfile, workflows, test configs — or after a cache reset), and how the local tier maps to the CI
tiers (diff-scoped PR, full suite on shared paths, nightly safety net). The section SHALL include a
step-by-step checklist a developer can follow before opening a PR, and SHALL point to
`docs/learning/test-impact-analysis.md` for the underlying research and recipes.

#### Scenario: Workflow section exists

- **WHEN** a developer reads `docs/testing-architecture.md` §7.5 after this change
- **THEN** they find the audit command, the scoped run, the full-suite triggers and the local↔CI tier mapping described in one place

#### Scenario: Pre-PR checklist present

- **WHEN** a developer follows the documented checklist before opening a PR
- **THEN** it covers running the audit, running the scoped run, running the full suite when a shared path changed, and reading the selection percentage from the CI step summary

#### Scenario: Recipes stay runnable

- **WHEN** a developer copies the commands from the doc
- **THEN** they match the scripts that actually exist in the root and workspace `package.json` files
