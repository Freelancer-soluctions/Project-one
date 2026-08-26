# ci-commit-lint-governance Specification

## Purpose

Enforce Conventional Commits format on all PR commits via a non-bypassable CI validation gate, providing defense-in-depth over the local Husky hook.

## Requirements

### Requirement: PR commit messages SHALL be validated against Conventional Commits format

The system SHALL validate all commit messages in a pull request against the Conventional Commits specification using commitlint with `@commitlint/config-conventional`.

#### Scenario: Valid PR commits pass validation

- **WHEN** a pull request is opened targeting main
- **AND** all commit messages in the PR range follow Conventional Commits format
- **THEN** the commit-lint CI job succeeds

#### Scenario: Invalid PR commit message fails validation

- **WHEN** a pull request is opened targeting main
- **AND** any commit message in the PR range does NOT follow Conventional Commits format
- **THEN** the commit-lint CI job fails
- **AND** the merge button is disabled (required check — requires manual registration in branch protection ruleset)

### Requirement: Merge group events SHALL validate only the squash commit

The system SHALL handle merge_group events by running `commitlint --last` against the squash/merge commit.

#### Scenario: Valid squash commit passes merge group validation

- **WHEN** a merge_group event is triggered
- **AND** the squash commit message follows Conventional Commits format
- **THEN** the commit-lint CI job succeeds

#### Scenario: Invalid squash commit fails merge group validation

- **WHEN** a merge_group event is triggered
- **AND** the squash commit message does NOT follow Conventional Commits format
- **THEN** the commit-lint CI job fails
- **AND** the PR is removed from the merge queue (once the required check is registered in branch protection)

### Requirement: Empty PR commit range SHALL fail validation

The system SHALL fail the commit-lint job when the PR base..head commit range is empty (zero commits).

#### Scenario: Empty commit range fails validation

- **WHEN** a pull request is opened with an empty commit range (e.g., target branch same as source)
- **THEN** the commit-lint CI job fails
- **AND** the job output indicates no commits to validate

### Requirement: Local commit-msg hook SHALL invoke commitlint with npx prefix

The `.husky/commit-msg` hook SHALL run `npx --no -- commitlint --edit "$1"` to ensure commitlint is available even when not on PATH.

#### Scenario: Local commit with valid message

- **WHEN** a developer runs `git commit` locally
- **AND** the commit message follows Conventional Commits format
- **THEN** the commit succeeds

#### Scenario: Local commit with invalid message

- **WHEN** a developer runs `git commit` locally
- **AND** the commit message does NOT follow Conventional Commits format
- **THEN** the commit fails with commitlint error output
