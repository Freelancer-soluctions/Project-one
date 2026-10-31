# Spec Delta: client-snapshot-testing (snapshot-gates)

## MODIFIED Requirements

### Requirement: Snapshot tests run in the CI prebuild testing substage

The snapshot suite SHALL run inside the existing STAGE 2 PRE-BUILD testing substage of `.github/workflows/ci.yml` — job `test-unit-client` (SUBSTAGE 2D, aggregated by `prebuild-tests-complete`) through the scripts that job already invokes: `test:changed:ci` for the diff-scoped run and `test:coverage:ci` for the full-suite run. No separate snapshot **execution** job SHALL be added: the snapshot suite is never executed by a dedicated job, and the snapshot wiring SHALL NOT justify adding or removing any execution job in any `prebuild-*-complete` aggregator's `needs`, and the prebuild → build → artifact order SHALL stay unchanged for snapshot execution. **Hygiene gate jobs that verify snapshot invariants without executing the snapshot suite (the update-flag grep gate and, while FASE-1 advisory, the size gate) are NOT snapshot execution jobs**: they MAY be added to `ci.yml`, and the update-flag grep gate MAY be added to `prebuild-tests-complete.needs` (the advisory size gate stays OUT of every aggregator's `needs`, following the `docs-validation`/`lockfile-audit` precedent). No CI step or CI-consumed script SHALL pass `-u`, `--update`, `--update=all` or `--update=new`; this invariant is additionally ENFORCED by the update-flag gate requirement below, not only documented. Because GitHub Actions exports `CI=true`, `test.update` resolves to `'none'` in those runs, so the committed `.snap` files and inline snapshots are validated and a missing, mismatched, or obsolete snapshot fails the Vitest step without writing anything.

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
- **THEN** snapshot execution happens in the existing prebuild job (order: prebuild → build → artifact unchanged), `prebuild-tests-complete.needs` contains exactly `[test-unit-client, test-unit-server, client-coverage, server-coverage, property-tests, snapshot-update-gate]`, no snapshot execution job was added to any aggregator, and no job id or display name bound to the ruleset 21227644 is renamed or created

#### Scenario: CI runs are deterministic for snapshots

- **WHEN** the suite runs on the CI runner (`CI=true`)
- **THEN** execution stays deterministic — `maxWorkers: 1` from the `CI` branch of `vitest.config.js`, `pool: 'forks'` with default isolation, fixtures frozen per test, `vi.setSystemTime` for dates, i18n fixed to `'en'` and per-test MSW handlers — so the same committed snapshots pass on every run

## ADDED Requirements

### Requirement: An enforced gate rejects update flags outside the local-only snapshot scripts

A deterministic text gate SHALL verify that no update flag (`-u`, `--update`, `--update=all`, `--update=new`, `updateSnapshots`) appears in (a) any npm script of any workspace `package.json` that CI consumes (every script except the explicitly allowlisted local-only snapshot scripts) or (b) any `run:` step of any file under `.github/workflows/`. The gate SHALL implement the anchored matching pattern `-u([ =]|$)|--update|updateSnapshots` (avoiding false positives on unrelated `-u` substrings) and SHALL carry an explicit allowlist limited to `apps/client/package.json` scripts `test:snapshot` and `test:snapshot:refresh` (`apps/client/package.json:29-30`). The gate SHALL run as the dedicated job `snapshot-update-gate` with NO `continue-on-error` (failure is red at job level and propagates through `prebuild-tests-complete`), SHALL be a pure local text scan (no network, no test execution), and SHALL be exemptable only by editing its explicit allowlist in a reviewed PR — never by a suppression flag, label, or environment variable. `apps/client/vitest.config.js` (`test.update` at `apps/client/vitest.config.js:110`) remains the single config source of snapshot write behavior and is out of the gate's scope (G1 owns it).

#### Scenario: An update flag introduced into a CI-consumed script fails the gate

- **WHEN** a PR adds `-u` or `--update` to `test:changed:ci` or any other CI-consumed npm script
- **THEN** `snapshot-update-gate` exits non-zero naming the offending script and file, the job reports red, and `prebuild-tests-complete` fails

#### Scenario: The local-only snapshot scripts remain allowlisted

- **WHEN** `apps/client/package.json` keeps `test:snapshot` (`vitest run --update=new`) and `test:snapshot:refresh` (`vitest run -u`) as documented local-only scripts
- **THEN** the gate passes, and no other script or workflow in the repo matches the update-flag pattern

#### Scenario: An update flag in a workflow run step fails the gate

- **WHEN** a PR adds `vitest run -u` (or equivalent) to any `run:` step under `.github/workflows/`, including nightly and scheduled workflows
- **THEN** the gate exits non-zero naming the workflow file and step, and the job reports red

#### Scenario: The gate cannot be silently bypassed

- **WHEN** a maintainer attempts to neutralize the gate without removing the offending flag
- **THEN** the only supported path is editing the gate's versioned allowlist (reviewed in the same PR); there is no skip label, input, or env escape, and the drift-probe requirement below remains an independent backstop

### Requirement: The PR template asks reviewers to acknowledge snapshot changes

`.github/PULL_REQUEST_TEMPLATE.md` SHALL contain, in the _Pre-merge Checklist_ section, a checkbox «Snapshots reviewed and explained (if applicable)», unchecked by default. It is a human gate (per PRD G3): no machine verifies it, and it is not added to `scripts/ci/pr-body-lint.mjs` rules. The template edit SHALL NOT remove, rename, or empty any section required by the PR body lint contract (`Summary`, `Related Issue`, `How Has This Been Tested?` — `scripts/ci/pr-body-lint.mjs:31-39`), and SHALL NOT introduce a `##` heading that collides with those canonical headings.

#### Scenario: A PR that changes snapshots carries the acknowledgment

- **WHEN** a PR modifies `.snap` files or inline snapshots
- **THEN** the author is prompted by the template to check «Snapshots reviewed and explained», and the PR body shows that acknowledgment next to the existing pre-merge items

#### Scenario: The required PR body check stays green on the template change

- **WHEN** the template edit lands and subsequent PRs are validated by `Governance: PR Body Lint`
- **THEN** the three required sections still resolve from the template, the new unchecked box is stripped from content evaluation exactly like the existing boxes, and no new lint rule fires

### Requirement: Snapshot size is bounded by lint with an advisory calibration phase

The rule `vitest/no-large-snapshots` (available in `@vitest/eslint-plugin`, root `package.json:93`, but not part of `vitest.configs.recommended`) SHALL be enabled in `eslint.config.js` with `maxSize: 50` and `inlineMaxSize: 50`, initially scoped to snapshot artifacts `**/__snapshots__/*.snap` so that `client-lint` (`apps/client/package.json:19`, `--max-warnings 0`) is unaffected. Enforcement SHALL run in a dedicated advisory job `client-snapshot-size` (FASE 1: `continue-on-error: true`, path-scoped to client PRs, OUT of every aggregator's `needs`), matching the repo's advisory → blocking calibration pattern. The calibration debt SHALL be burned down: the 19 inline blocks above 50 lines (max 262, measured 2026-10-28) remediated to subtree snapshots, and oversized `.snap` entries (74 of 258 above 50 lines, max 138) segmented toward the table subtree. `snapshotFormat.maxOutputLength` (`apps/client/vitest.config.js:109`, currently 100000) SHALL be reduced only after a full-suite run at the reduced budget shows zero truncation/collapse markers. Promotion of the size gate to blocking (remove `continue-on-error`, extend the rule to `*.ui.test.jsx` inline snapshots inside the main client lint block) SHALL be a single atomic PR, executed only after ≥2 weeks of a clean advisory baseline; the external dependency `ci-testing-gate-promotion` (prerequisite 0bis.6 and the FASE 2 promotion of the five tier-1 testing jobs) is satisfied as of 2026-10-29, so the promotion depends solely on this change's own calibration window. This change SHALL NOT touch the `continue-on-error` rollback flags of that change's jobs.

#### Scenario: An oversized snapshot entry is reported without blocking

- **WHEN** a PR adds or keeps a `.snap` entry above 50 serialized lines while FASE 1 is active
- **THEN** `client-snapshot-size` reports the violation with file and entry name, the job shows a non-blocking failure annotation, and the merge verdict of `prebuild-tests-complete` and `ci-complete` is unaffected

#### Scenario: The main client lint is not collateral damage

- **WHEN** `client-lint` runs with `--max-warnings 0` over `apps/client/**/*.{js,jsx}` after this change
- **THEN** its result is unchanged by the size rule, because the rule is scoped to `.snap` files that its glob does not match and the inline scope is only enabled at promotion time on a clean baseline

#### Scenario: Promotion happens only on a clean baseline

- **WHEN** the calibration window (≥2 weeks) closes with zero advisory findings (the external dependency `ci-testing-gate-promotion` has been satisfied since 2026-10-29)
- **THEN** one atomic PR removes `continue-on-error` from `client-snapshot-size` (or folds the check into `client-lint`) and extends the rule to inline snapshots; if any finding remains, promotion is deferred and the advisory phase extends with a recorded reason

#### Scenario: Reducing the output budget does not truncate reviewed snapshots

- **WHEN** `snapshotFormat.maxOutputLength` is lowered from 100000 and the full client suite is rerun
- **THEN** no committed snapshot contains a truncation/collapse marker at the new budget; otherwise the budget stays and the oversized entries are segmented first

### Requirement: Snapshot files without an owning test fail the orphan gate

A deterministic script SHALL fail with exit 1 when any `.snap` file under `apps/client/src/**/__snapshots__/` has no owning test file — the sibling `__snapshots__/<name>.snap` requires `<name>` in the snapshots directory's parent directory to exist and to reference snapshot matchers — and SHALL additionally flag a snapshot whose owner test no longer calls `toMatchSnapshot`/`toMatchInlineSnapshot`. The script SHALL run in the advisory job `client-snapshot-size` (same job, additional step; FASE 1: job-level `continue-on-error: true`, path-scoped to client PRs), and the baseline SHALL be verified clean before merging (2026-10-28: 20 `.snap` files, 0 orphans verified). Renaming or deleting a test in a PR therefore surfaces its orphaned snapshot in the same PR instead of waiting for Vitest's obsolete-snapshot failure in CI.

#### Scenario: Deleting a test leaves an orphan that the gate flags

- **WHEN** a PR deletes or renames a `*.ui.test.jsx` file without removing/regenerating its `__snapshots__/*.snap`
- **THEN** the orphan gate exits non-zero naming the `.snap` file and its missing owner, and the advisory job reports the finding

#### Scenario: The current baseline passes

- **WHEN** the orphan gate runs against the repository as of this change (20 sibling-owned `.snap` files, every owner calling `toMatchSnapshot`)
- **THEN** it exits 0 with zero findings

#### Scenario: Promotion follows the same calibration pattern

- **WHEN** the orphan gate has been clean for the agreed advisory window
- **THEN** it MAY be promoted to blocking in the same class of atomic PR as the size gate, without touching any other job's `continue-on-error`

### Requirement: A nightly drift probe detects non-deterministic snapshots

The active workflow `.github/workflows/nightly-full-suite.yml` (cron `40 2 * * *`, `nightly-full-suite.yml:27`) SHALL include a `nightly-snapshot-drift` job that, in its disposable checkout, runs the client snapshot suite with update deliberately enabled (the allowlisted local-only refresh command `test:snapshot:refresh` invoked explicitly) and then FAILS if `git diff --exit-code` reports changes to tracked files or `git status --porcelain` reports untracked snapshot artifacts. A clean run means every committed snapshot is exactly reproducible from the committed code — any diff is drift (non-determinism, environment leakage, or an uncommitted snapshot). The job SHALL have report-only, advisory semantics: it runs on schedule and `workflow_dispatch` only, is NOT a PR gate, is NOT in any `ci.yml` aggregator's `needs`, and its failure notifies via the workflow run status without blocking any merge. It replaces the one-shot verification of the archived change `2026-10-09-client-snapshot-testing` (task 5.5) with a recurring probe.

#### Scenario: A non-deterministic snapshot is caught by the probe

- **WHEN** a merged change introduces a snapshot whose serialization depends on time, locale, or ordering, so that a fresh full-suite update rewrites it
- **THEN** the nightly job's update run modifies the tracked `.snap`/inline snapshot or creates an untracked one, `git diff --exit-code` (or the untracked check) fails, and the `nightly-snapshot-drift` run is red with the offending files in the log

#### Scenario: A deterministic suite leaves the checkout clean

- **WHEN** the full client snapshot suite runs with update enabled against committed code that reproduces every snapshot byte-for-byte
- **THEN** `git diff --exit-code` exits 0, `git status --porcelain` shows no snapshot artifacts, and the job is green

#### Scenario: The probe never reaches the merge path

- **WHEN** the nightly drift job fails
- **THEN** no PR check, no aggregator verdict (`prebuild-*`, `ci-complete`), and no ruleset-required status check is affected; the failure is visible only in the nightly workflow's run history
