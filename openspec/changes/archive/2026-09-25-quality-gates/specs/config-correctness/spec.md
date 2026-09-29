# Spec Delta

## ADDED Requirements

### Requirement: Quality gate taxonomy (blocking vs advisory)

**Context:** codifies the analysis already documented in `docs/learning/quality-gates.md`, which until now had no normative status.

Every quality job of substage 2B in `.github/workflows/ci.yml` SHALL be classified as either `blocking` or `advisory`, and the classification SHALL be recorded in the canonical table of `docs/learning/quality-gates.md` (one row per job, with its type and evidence from `ci.yml`). A `blocking` job SHALL NOT set `continue-on-error: true` and its `failure` result SHALL stop `prebuild-quality-complete`. An `advisory` job SHALL set `continue-on-error: true` at job level (so its result can never block the aggregator, per `actions/toolkit#581`) or SHALL be absent from the `needs` of the blocking aggregator, and SHALL publish its report (artifact or step summary). No quality job MAY be left in an indeterminate state (`if: false` presented as an active gate, or `continue-on-error` without being classified as advisory).

#### Scenario: Every substage 2B job is classified

- **WHEN** the canonical table in `docs/learning/quality-gates.md` is read
- **THEN** each quality job of substage 2B (`lint`, `format-check`, `typecheck`, `complexity`, `dead-code`, `import-bounds`, `docs-validation`, `sonarqube`) SHALL appear with type `blocking` or `advisory`
- **AND** `docs/CONTEXT-CICD.md` and `docs/pre-merge-gates-governance.md` SHALL reference the canonical table instead of duplicating it

#### Scenario: Blocking jobs cannot be advisory

- **WHEN** a job classified as `blocking` is read in `.github/workflows/ci.yml`
- **THEN** it SHALL NOT declare `continue-on-error: true`

#### Scenario: Advisory jobs cannot block the aggregator

- **WHEN** a job classified as `advisory` is evaluated against `prebuild-quality-complete`
- **THEN** either it SHALL set `continue-on-error: true` or it SHALL be absent from the aggregator's `needs`
- **AND** it SHALL publish its report even when it fails

### Requirement: Cosmetic quality gates fixed (if:false and || echo)

**Context:** `client-typecheck` (L450) and `server-typecheck` (L538) run `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op..."` under `if: false`, so they report green while checking nothing; `client-complexity`/`server-complexity` and `client-sonarqube`/`server-sonarqube` are also disabled with `if: false`.

`client-typecheck` and `server-typecheck` SHALL run the real type check (`npm run type-check` when the script exists, otherwise `npx tsc --noEmit`) as their final step, SHALL NOT declare `if: false`, and SHALL NOT use `|| echo` (or any other `|| <command that exits 0>`) or `2>/dev/null` in a way that masks the checker's exit code: a type error SHALL fail the job. `client-complexity` and `server-complexity` SHALL run ESLint with thresholds resolved from `eslint.config.js` (no `--rule` CLI override) and SHALL NOT declare `if: false`. `client-sonarqube` and `server-sonarqube` SHALL either run in advisory mode (`SonarSource/sonar-quality-gate-check` with `continue-on-error: true`) when `SONAR_TOKEN` is configured, or keep `if: false` with a comment documenting the missing credentials — they SHALL NOT be left as undocumented dead gates.

#### Scenario: Type check fails the job

- **WHEN** `client-typecheck` or `server-typecheck` runs against code containing a TypeScript error
- **THEN** the job SHALL exit non-zero and block the PR
- **AND** `grep -n "|| echo" .github/workflows/ci.yml` SHALL return no match inside those jobs

#### Scenario: Type check jobs are enabled

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** `client-typecheck` and `server-typecheck` SHALL NOT declare `if: false`

#### Scenario: Complexity jobs use the config as single source of truth

- **WHEN** `client-complexity` or `server-complexity` runs
- **THEN** it SHALL NOT declare `if: false`
- **AND** it SHALL NOT pass a `--rule` CLI override for `complexity`

#### Scenario: Sonar runs only with credentials

- **WHEN** `SONAR_TOKEN` is available to the workflow
- **THEN** `client-sonarqube`/`server-sonarqube` SHALL run the SonarQube analysis plus the quality gate check with `continue-on-error: true`
- **WHEN** `SONAR_TOKEN` is not available
- **THEN** those jobs SHALL keep `if: false` with an explicit comment stating the missing credentials

#### Scenario: Disabled jobs are not counted as passing gates

- **WHEN** a quality job is evaluated for merge-blocking purposes
- **THEN** a job with `if: false` SHALL be reported as `skipped` in the canonical table and SHALL NOT be described as an active gate in `docs/CONTEXT-CICD.md`

### Requirement: Quality aggregator treats failure and cancellation as blocking

**Context:** `prebuild-quality-complete` (L1092) uses `always()` but only evaluates `contains(needs.*.result, 'failure')`, so a cancelled upstream job passes the gate; `ci-complete` already distinguishes both states.

`prebuild-quality-complete` and the other `prebuild-*-complete` aggregators SHALL keep an `if` expression containing `always()` (so the aggregator evaluates even when an upstream job failed) and their check step SHALL exit non-zero when any `needs` result is `failure` **or** `cancelled`. The aggregator's `needs` SHALL list exactly the blocking jobs of its substage (including the enabled `typecheck` and `complexity` jobs) and SHALL NOT list advisory jobs such as `docs-validation`. The `if: always()` guard SHALL NOT be removed in favor of implicit skipping, and the aggregator SHALL NOT use `|| echo` in its evaluation step.

#### Scenario: Aggregator runs after an upstream failure

- **WHEN** a job in `prebuild-quality-complete.needs` fails
- **THEN** the aggregator SHALL still run (`always()`) and SHALL exit non-zero

#### Scenario: Cancelled upstream job blocks the gate

- **WHEN** a job in `prebuild-quality-complete.needs` has result `cancelled`
- **THEN** the aggregator SHALL exit non-zero instead of reporting success

#### Scenario: Aggregator needs matches its substage

- **WHEN** `prebuild-quality-complete.needs` is read
- **THEN** it SHALL contain every blocking job of substage 2B
- **AND** it SHALL NOT contain advisory jobs (`docs-validation`, `dead-code` jobs remain advisory per the taxonomy)

### Requirement: Docs validation exists as an advisory gate

**Context:** `docs/learning/docs-changelog-validation.md` documents that no docs validation job exists and that `package.json` declares neither `markdownlint-cli` nor `vale`.

The repository SHALL provide docs validation configuration: `.markdownlint.json` (root) plus `.markdownlintignore`, and `.vale.ini` (root) with `StylesPath` under `.github/styles`, covering `docs/**/*.md` and `docs/changelog.md`. A `docs-validation` job SHALL exist in `.github/workflows/ci.yml`, classified as `advisory`: it SHALL run markdownlint and vale over the documentation, SHALL declare `continue-on-error: true`, SHALL declare `if: always()` so the report is produced even after upstream failures, SHALL publish its output (uploaded artifact and/or `$GITHUB_STEP_SUMMARY`), and SHALL NOT be part of the `needs` of `prebuild-quality-complete` while it is in phase 1.

#### Scenario: Docs validation configuration exists

- **WHEN** the repository root is listed
- **THEN** `.markdownlint.json`, `.markdownlintignore` and `.vale.ini` SHALL exist
- **AND** `.vale.ini` SHALL declare a `StylesPath` inside `.github/styles`

#### Scenario: Docs validation job is advisory

- **WHEN** the `docs-validation` job runs and markdownlint or vale report violations
- **THEN** the job SHALL publish its report and SHALL NOT fail the PR (phase 1)
- **AND** `prebuild-quality-complete` SHALL still succeed if only `docs-validation` reports violations

#### Scenario: Docs validation always reports

- **WHEN** an upstream quality job fails
- **THEN** `docs-validation` SHALL still run and upload its report

#### Scenario: Docs validation is not a blocking need

- **WHEN** `prebuild-quality-complete.needs` is read
- **THEN** `docs-validation` SHALL NOT be listed as a blocking dependency

#### Scenario: Aggregator evaluation step does not mask failures

- **WHEN** the evaluation step of `prebuild-quality-complete` is read
- **THEN** it SHALL NOT contain `|| echo` or any other construct that exits 0 after a check failure
- **AND** it SHALL exit non-zero when `contains(needs.*.result, 'failure')` or `contains(needs.*.result, 'cancelled')` is true

#### Scenario: Docs validation runs markdownlint and vale

- **WHEN** the `docs-validation` job is read
- **THEN** it SHALL invoke `npm run docs:lint` and `npm run docs:vale` (or their direct equivalents)
- **AND** it SHALL scope both tools to `docs/**/*.md` and `docs/changelog.md`
