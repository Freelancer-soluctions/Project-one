## Purpose

Raises the enterprise security posture of the 8 active CI/CD workflows: least-privilege permissions, bounded job runtimes, concurrency controls, removal of error suppression, CodeQL scanning of the workflows themselves, cron failure alerting, and host-level hardening on OIDC jobs.

## ADDED Requirements

### Requirement: Least-privilege workflow and job permissions

Each workflow and job SHALL declare the minimum `permissions` needed, with no unnecessary write scopes granted at the workflow level.

#### Scenario: CI workflow permissions

- **WHEN** the `ci.yml` workflow declares workflow-level permissions
- **THEN** it SHALL grant `contents: read` only
- **AND** it SHALL NOT grant `pull-requests: write` at the workflow level
- **AND** each job that runs `dorny/test-reporter` SHALL grant `checks: write` (plus `contents: read`) at the job level

#### Scenario: SBOM job permissions

- **WHEN** the `sbom` job in `security.yml` declares permissions
- **THEN** it SHALL grant `contents: read`
- **AND** it SHALL NOT grant `actions: write`

### Requirement: Bounded job runtimes

Every job in the 8 active workflows SHALL declare a `timeout-minutes` value so a hung job cannot consume runner minutes indefinitely.

#### Scenario: Jobs without timeout found in audit

- **WHEN** the audit found jobs without `timeout-minutes` (`quality.yml` quality, `release.yml` release, `scheduled-security.yml` gitleaks-full-scan, all jobs in `security-digest.yml` and `security.yml`, and the `changes` job of `ci.yml`)
- **THEN** each such job SHALL declare an explicit `timeout-minutes`
- **AND** the value SHALL be proportionate to the job's workload

### Requirement: Concurrency controls on release and security workflows

The push-triggered release and security workflows SHALL declare concurrency groups so overlapping runs are handled deliberately.

#### Scenario: Release workflow concurrency

- **WHEN** the `release.yml` workflow runs
- **THEN** it SHALL use `concurrency: group: release` with `cancel-in-progress: false`
- **AND** overlapping release runs SHALL queue instead of canceling

#### Scenario: Security workflow concurrency

- **WHEN** the `security.yml` workflow runs
- **THEN** it SHALL use `concurrency: group: security-${{ github.ref }}` with `cancel-in-progress: true`
- **AND** a newer run on the same ref SHALL cancel an in-progress run

### Requirement: No error suppression in workflow steps

Workflow steps SHALL NOT mask failures: build/check commands SHALL fail on error, and security scan jobs SHALL NOT use `continue-on-error` to hide findings (report artifacts remain uploaded via `if: always()` on the upload steps).

#### Scenario: Typecheck not suppressed

- **WHEN** the quality workflow runs the Type Check step
- **THEN** the step SHALL run `npm run typecheck` without `|| echo "Typecheck skipped"` or equivalent suppression
- **AND** a typecheck failure SHALL fail the job

#### Scenario: Scan findings not masked

- **WHEN** the scheduled Gitleaks scan (`scheduled-security.yml`) or the OSV scan (`security-digest.yml`) detects findings
- **THEN** the scan SHALL NOT set `continue-on-error: true`
- **AND** the run SHALL fail on findings (fail-closed)
- **AND** the report/SARIF upload steps SHALL still run (`if: always()`) so findings remain visible

### Requirement: Workflows scanned by CodeQL actions language

The security workflow's CodeQL analysis SHALL include the repository's own GitHub Actions workflows as a scan target.

#### Scenario: CodeQL scans workflows

- **WHEN** the `sast` job in `security.yml` initializes CodeQL
- **THEN** the `languages` input SHALL include `actions` alongside `javascript`
- **AND** the analysis SHALL cover `.github/workflows/**` for insecure workflow patterns

### Requirement: Scheduled cron failure notification

The scheduled security workflows SHALL notify maintainers when a scheduled run fails, so silent cron failures are surfaced.

#### Scenario: Scheduled run fails

- **WHEN** a scheduled run of `scheduled-security.yml` or `security-digest.yml` fails (including failures caused by scan findings)
- **THEN** a notification job SHALL run after the failing jobs (`needs` all jobs, `if: failure()`)
- **AND** the notification SHALL create a GitHub issue (or equivalent) titled with the workflow name and run date

### Requirement: Host-level hardening on OIDC jobs

Deploy jobs that assume an AWS role via OIDC SHALL run inside a hardened runner to constrain network egress and host exposure.

#### Scenario: OIDC jobs hardened

- **WHEN** `deploy.yml` jobs `ecr-push`, `deploy-staging`, or `deploy-production` execute
- **THEN** each SHALL run `step-security/harden-runner` as its first step
- **AND** the runner SHALL initially use `egress-policy: audit`, promoted to `block` after a review period of green runs
