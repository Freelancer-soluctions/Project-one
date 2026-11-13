# ci-prebuild-substage-structure Specification (Delta)

## MODIFIED Requirements

### Requirement: Phase 2 blocking promotion

During the calibration period defined by `ci-dead-code-advisory-calibration`, the `client-dead-code` and `server-dead-code` jobs SHALL run with `--no-exit-code` (advisory) until the knip configuration is calibrated (upgrade to 6.45.1, `--production`/`--cache` flags, reduction of `ignore`/`ignoreIssues`). Once calibrated, the jobs SHALL be promoted to blocking (`--no-exit-code` removed) and the promotion documented in `docs/learning/quality-policy.md` with date and rationale. This supersedes the previous Phase 2 intent of removing `continue-on-error` (already satisfied in code) by establishing the advisory→blocking transition explicitly.

#### Scenario: Calibration period

- **WHEN** knip runs in a PR during calibration
- **THEN** it uses `--production --cache --no-exit-code`
- **AND** findings do not block the merge
- **AND** the job reports findings for triage

#### Scenario: Promotion to blocking

- **WHEN** a dead-code issue type reaches zero
- **THEN** its severity is set to `error` in `knip.jsonc` rules
- **AND** `--no-exit-code` is removed from the job
- **AND** the promotion is recorded in `quality-policy.md`

#### Scenario: Phase 2 promotion

- **WHEN** the team confirms knip stability (false positive rate acceptable, ignores calibrated)
- **THEN** `continue-on-error: true` is removed from `client-dead-code` and `server-dead-code` (already satisfied in code)
- **AND** knip failures block the merge (same pattern as pr-title-lint/dco per §9.3.3/§9.3.4)

#### Scenario: knip failure blocks PR

- **WHEN** a PR targets `main` and `client-dead-code` (or `server-dead-code`) reports knip findings (after promotion)
- **THEN** the job exits with non-zero status
- **AND** the aggregator `prebuild-quality-complete` propagates the failure
- **AND** `ci-complete` reports failure, blocking the merge
