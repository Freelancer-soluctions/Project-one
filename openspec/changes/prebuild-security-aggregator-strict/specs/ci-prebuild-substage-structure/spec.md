# ci-prebuild-substage-structure Specification (delta)

## MODIFIED Requirements

### Requirement: prebuild-security-complete needs contract

The `prebuild-security-complete` aggregator SHALL depend on exactly 9 jobs: `[dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog]`. All nine jobs of substage 2C SECURITY SHALL be part of its `needs`, so that no security job can fail or be skipped silently without failing the aggregator.

The aggregator SHALL fail on any result that is not `success` (`failure`, `cancelled`, `skipped`) using `if: always()` and an explicit evaluation over `needs`. The value of `needs` SHALL be passed through `env`, never interpolated into the script.

Anti-skip guards SHALL be scoped per job and per event:

- On `pull_request` events:
  - `secrets`: fail the aggregator when skipped (already implemented by `secret-scanning-history-governance`).
  - `dependency-review`: fail the aggregator when skipped.
  - `scancode-license-pr-diff`: fail the aggregator when skipped AND the PR includes ACMR changes (authorization computed inside the aggregator step via `git diff`).
  - Conditional jobs (`lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`): the aggregator computes authorization inside its own step (checkout + path check). A skip is authorized only if the relevant change (manifest/lockfile/infra/workflow) is absent from the PR. A skip without authorization fails the aggregator.
- On `merge_group` and `workflow_dispatch` events: skips of PR-only jobs (all except `secrets`) are pre-authorized by event type, because those jobs have no PR diff to scan. The `secrets` job (which runs on `merge_group`) remains subject to the strict rule.

The authorization channel is computed inside the aggregator step, not via an additional job in `needs`, preserving the "exactly 9" contract (PRD rule 3).

Promotion to blocking of any individual job remains governed by its origin change (`sca-lockfile-compliance`, `iac-scanning`, `containerfile-lint`, `pipeline-config-scan`, `typosquatting-detection`, `scancode-license`); this requirement only makes the aggregator strict and wires all jobs into it. Note: while a job retains `continue-on-error: true`, its `needs.*.result` normalizes to `success` (quality-gates.md L26, actions/toolkit#581), so advisory failures pass the aggregator by design until the origin change removes COE.

#### Scenario: Security aggregator needs resolution

- **WHEN** `prebuild-security-complete` runs
- **THEN** its `needs` array contains exactly `dependency-review`, `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog` — no more, no less
- **AND** all 9 jobs are from Substage 2C SECURITY

#### Scenario: Advisory job failure does not affect security aggregator

- **WHEN** any advisory job of substage 2C failed on a PR before this change (FASE 1)
- **THEN** `prebuild-security-complete` did not report that failure (the job was not in its `needs` and `continue-on-error: true` absorbed it)
- **AND** the finding remained visible via the job's SARIF upload and artifact
- **NOTE:** This scenario documents the pre-Phase-0 behavior and is retained for traceability of the FASE 1 → Phase 0 transition. After this change, every security job is in `needs`. However, while a job retains `continue-on-error: true`, its failure normalizes to `success` in `needs.*.result` (quality-gates.md L26), so advisory failures still pass the aggregator by design. The scenario "Advisory job failure fails the security aggregator" becomes live only after the origin change removes COE.

#### Scenario: Advisory job failure fails the security aggregator

- **WHEN** any of the 9 security jobs finalizes with `failure` on a PR (and the job does not have `continue-on-error: true`)
- **THEN** `prebuild-security-complete` finalizes with failure
- **AND** the finding remains visible via the job's SARIF upload and artifact

#### Scenario: dependency-review skipped on PR fails the aggregator

- **WHEN** `dependency-review` is skipped during a `pull_request` event
- **THEN** `prebuild-security-complete` finalizes with failure
- **AND** the merge remains blocked once `Prebuild Security Complete` is bound to the ruleset

#### Scenario: scancode skipped on PR with ACMR changes fails the aggregator

- **WHEN** `scancode-license-pr-diff` is skipped during a `pull_request` event that includes ACMR changes
- **THEN** `prebuild-security-complete` finalizes with failure

#### Scenario: scancode skipped on PR without ACMR changes is tolerated

- **WHEN** `scancode-license-pr-diff` is skipped during a `pull_request` event that does NOT include ACMR changes
- **THEN** `prebuild-security-complete` treats the skipped entry as passing

#### Scenario: Conditional job skipped without authorization fails the aggregator

- **WHEN** a conditional security job (`lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`) is skipped on a PR and the aggregator's path check shows the relevant change IS present
- **THEN** `prebuild-security-complete` finalizes with failure

#### Scenario: Conditional job skipped with authorization is tolerated

- **WHEN** a conditional security job is skipped on a PR and the aggregator's path check shows the relevant change is ABSENT
- **THEN** `prebuild-security-complete` treats the skipped entry as passing
- **AND** the aggregator finalizes with success if every other entry passed

#### Scenario: PR-only jobs skipped on merge_group is tolerated

- **WHEN** `prebuild-security-complete` runs on a `merge_group` or `workflow_dispatch` event
- **THEN** skips of jobs gated `if: github.event_name == 'pull_request'` are pre-authorized by event type
- **AND** the aggregator finalizes with success if every running entry passed

#### Scenario: Cancelled job fails the aggregator

- **WHEN** any of the 9 security jobs finalizes with `cancelled`
- **THEN** `prebuild-security-complete` finalizes with failure (cancelled is not a success)
