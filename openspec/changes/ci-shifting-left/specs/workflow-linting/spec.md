# workflow-linting Specification

## Purpose

Validates GitHub Actions workflow files statically with actionlint and yamllint both at pre-commit time and in CI, catching invalid syntax, malformed `${{ }}` expressions, and unsafe shell usage before a workflow fails at runtime.

## ADDED Requirements

### Requirement: Pre-commit workflow linting

The system SHALL run actionlint and yamllint on GitHub Actions workflow files as part of the pre-commit hook via lint-staged, so invalid workflow syntax is caught before the commit is created.

#### Scenario: Workflow file staged for commit

- **WHEN** a developer stages a change to a file under `.github/workflows/**` or `.github/dependabot.yml`
- **THEN** lint-staged SHALL run `actionlint` on the staged workflow files
- **AND** lint-staged SHALL run `yamllint` on the staged YAML files
- **AND** the commit SHALL be blocked if either tool reports an error

#### Scenario: Valid workflow file staged

- **WHEN** a developer stages a syntactically valid workflow file
- **THEN** actionlint and yamllint SHALL pass
- **AND** the commit SHALL proceed normally

### Requirement: CI workflow validation job

The CI pipeline SHALL include a `validate-pipeline` job that runs actionlint and yamllint on all workflow files, gated by a paths-filter so it only executes when workflow files change.

#### Scenario: Workflow files changed in PR

- **WHEN** a pull request modifies files under `.github/workflows/**` or `.github/dependabot.yml`
- **THEN** the `validate-pipeline` job SHALL run actionlint on all `.github/workflows/*.yml` files
- **AND** the job SHALL run yamllint on all workflow YAML files
- **AND** the job SHALL fail the PR check if any workflow file is invalid

#### Scenario: No workflow files changed in PR

- **WHEN** a pull request does not modify any file under `.github/workflows/**` or `.github/dependabot.yml`
- **THEN** the `validate-pipeline` job SHALL be skipped via paths-filter
- **AND** the PR check SHALL report success without running the linters

### Requirement: Malformed expression detection

The workflow linting SHALL detect malformed GitHub Actions expressions, invalid permissions, unsafe shell usage, and unknown action references so runtime failures are prevented.

#### Scenario: Malformed expression in workflow

- **WHEN** a workflow file contains a malformed `${{ }}` expression or references an unknown action
- **THEN** actionlint SHALL report the specific line and error
- **AND** the `validate-pipeline` job SHALL fail with the actionlint output

#### Scenario: Unsafe shell usage in workflow

- **WHEN** a workflow file uses an unsafe shell construct (e.g., unquoted variable expansion in `run:` steps)
- **THEN** actionlint SHALL flag the shellcheck warning
- **AND** the job SHALL fail, requiring the developer to fix the shell usage
