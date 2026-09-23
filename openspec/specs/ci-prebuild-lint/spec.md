# ci-prebuild-lint Specification

## Purpose

Reactivates 3 lint substages from STAGE 2 (PRE-BUILD — VALIDATE) in `ci.yml` as standalone quality gates that run on pull requests, with path-scoped execution to minimize unnecessary CI runs. Covers client ESLint, server ESLint, and GitHub Actions workflow linting (actionlint).

## Requirements

### Requirement: client-lint job runs on PRs modifying client files

The `client-lint` job in `ci.yml` SHALL execute `npm run lint --workspace=apps/client` on pull requests that modify files in the client workspace.

#### Scenario: PR modifies client files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `client == 'true'`
- **THEN** the `client-lint` job runs `npm run lint --workspace=apps/client`
- **AND** the job uses the composite action `.github/actions/setup-monorepo/action.yml` for environment setup
- **AND** lint errors or warnings (exit code non-zero) fail the job

#### Scenario: PR does not modify client files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `client == 'false'`
- **THEN** the `client-lint` job is skipped

### Requirement: server-lint job runs on PRs modifying server files

The `server-lint` job in `ci.yml` SHALL execute `npm run lint --workspace=apps/server` on pull requests that modify files in the server workspace.

#### Scenario: PR modifies server files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `server == 'true'`
- **THEN** the `server-lint` job runs `npm run lint --workspace=apps/server`
- **AND** the job uses the composite action `.github/actions/setup-monorepo/action.yml` for environment setup
- **AND** lint errors or warnings (exit code non-zero) fail the job

#### Scenario: PR does not modify server files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `server == 'false'`
- **THEN** the `server-lint` job is skipped

### Requirement: actionlint job runs on PRs modifying shared/workflow files

The `actionlint` job in `ci.yml` SHALL execute `rhysd/actionlint@v1` on pull requests that modify shared files or GitHub Actions workflows.

#### Scenario: PR modifies shared/workflow files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `shared == 'true'`
- **THEN** the `actionlint` job runs `rhysd/actionlint@v1`
- **AND** the job scans all `.github/workflows/*.yml` files
- **AND** findings in pre-existing workflow files are addressed in the same change or disabled with justification

#### Scenario: PR does not modify shared/workflow files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `shared == 'false'`
- **THEN** the `actionlint` job is skipped

### Requirement: lint jobs are standalone and not gated by CI_MINIMAL

The 3 lint jobs SHALL execute independently of the `CI_MINIMAL` variable, following the pattern of `sast` and `dependency-review` jobs.

#### Scenario: CI_MINIMAL is true

- **WHEN** `vars.CI_MINIMAL` is `true` AND a qualifying PR is opened
- **THEN** the `client-lint`, `server-lint`, and `actionlint` jobs still run (if path-scoped conditions are met)
- **AND** the jobs are NOT skipped due to `CI_MINIMAL`

#### Scenario: CI_MINIMAL is false

- **WHEN** `vars.CI_MINIMAL` is `false` AND a qualifying PR is opened
- **THEN** the `client-lint`, `server-lint`, and `actionlint` jobs run (if path-scoped conditions are met)
- **AND** behavior is identical to the `CI_MINIMAL=true` case

### Requirement: lint jobs use path-scoped conditions

Each lint job SHALL use `needs.repo-discovery.outputs.<workspace>` to determine execution, ensuring jobs only run when relevant files change.

#### Scenario: Path-scoped condition evaluation

- **WHEN** a pull request is opened or synchronized
- **THEN** the `repo-discovery` job evaluates `dorny/paths-filter` to detect changed files
- **AND** `client-lint` runs only if `needs.repo-discovery.outputs.client == 'true'`
- **AND** `server-lint` runs only if `needs.repo-discovery.outputs.server == 'true'`
- **AND** `actionlint` runs only if `needs.repo-discovery.outputs.shared == 'true'`

### Requirement: lint jobs do not affect ci-complete aggregation

The 3 lint jobs SHALL remain unchanged in `ci-complete.needs` and SHALL NOT change the behavior of the `ci-complete` aggregator job.

#### Scenario: ci-complete behavior unchanged

- **WHEN** `ci-complete` evaluates its `needs` array
- **THEN** the `needs` array includes the same jobs as before this change
- **AND** `ci-complete` continues to skip when `CI_MINIMAL == 'true'`
