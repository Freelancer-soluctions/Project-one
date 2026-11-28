# sast-governance-gate Specification (delta: ci-mise-toolchain-parity)

## RENAMED Requirements

- FROM: `### Requirement: Docker image pinned to specific tag`
- TO: `### Requirement: Semgrep version pinned via Mise lockfile`

## MODIFIED Requirements

### Requirement: SAST job runs on every pull request

The system SHALL execute a Semgrep SAST scan as a job named `Governance: SAST (Semgrep)` in `.github/workflows/ci.yml` on every `pull_request` event targeting `main`. The `Governance:` prefix identifies the job's substage (SUBSTAGE 2A GOVERNANCE) in the Checks list; it is part of the name the ruleset would bind in F2.

#### Scenario: PR triggers SAST scan

- **WHEN** a pull request is opened, synchronized, or reopened targeting `main`
- **THEN** the `sast` job in `ci.yml` executes Semgrep as provided by Mise (`mise install --locked`, then `mise exec -- semgrep`), with the version pinned in `mise.toml` and `mise.lock`
- **AND** the job does not run any `docker run` for Semgrep

#### Scenario: Merge queue does not trigger SAST

- **WHEN** the workflow is triggered by `merge_group`
- **THEN** the `sast` job is skipped (`if: github.event_name == 'pull_request'` — diff-scoped scan is meaningless in merge queue context)

### Requirement: Semgrep version pinned via Mise lockfile

Semgrep SHALL be pinned to a single exact version declared as `"pipx:semgrep"` in `mise.toml` and locked with checksums in `mise.lock`, and it SHALL be the same version used by local hooks (`pre-push`) and by every CI job that runs Semgrep. Floating tags and `latest` SHALL NOT be used.

#### Scenario: Deterministic scan version

- **WHEN** any job or hook runs Semgrep on any given day
- **THEN** it uses the exact version pinned in `mise.toml` (currently `1.176.1`), installed through `mise install --locked`, not whatever `latest` resolves to

#### Scenario: Local and CI parity

- **WHEN** a developer runs the `pre-push` hook and a CI job runs the `sast` job for the same commit
- **THEN** both invoke the same Semgrep version resolved from `mise.lock`

#### Scenario: Lockfile drift is blocked

- **WHEN** `mise.lock` is missing an entry for Semgrep or its checksum does not match
- **THEN** `mise install --locked` fails and the Semgrep scan does not run
