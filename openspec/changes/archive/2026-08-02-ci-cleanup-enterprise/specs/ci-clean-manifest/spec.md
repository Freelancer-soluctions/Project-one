## Purpose

Cleans the CI workflow inventory by deleting three zombie workflows (`pr-validation.yml`, `lint.yml`, `formatter.yml`), preserving `ci-enterprise.yml` intact as reference, updating documentation to match, and verifying no dangling references remain.

## ADDED Requirements

### Requirement: Zombie workflow pr-validation.yml deleted
The deprecated `pr-validation.yml` workflow SHALL be deleted from the repository.

#### Scenario: Deprecated workflow removed
- **WHEN** the cleanup change is applied
- **THEN** `.github/workflows/pr-validation.yml` is deleted via `git rm`
- **AND** it is confirmed not to be referenced by any other workflow, schedule, or docs
- **AND** no active workflow runs remain for it (verified via `gh run list`)

### Requirement: Zombie workflow lint.yml deleted
The unused `lint.yml` workflow SHALL be deleted from the repository because `quality.yml` already covers lint.

#### Scenario: Unused lint workflow removed
- **WHEN** the cleanup change is applied
- **THEN** `.github/workflows/lint.yml` is deleted via `git rm`
- **AND** it is confirmed not to be referenced by any other workflow or schedule (its references in `ci.yml` are commented out)

### Requirement: Zombie workflow formatter.yml deleted
The unused `formatter.yml` workflow SHALL be deleted from the repository because `quality.yml` already covers format check.

#### Scenario: Unused formatter workflow removed
- **WHEN** the cleanup change is applied
- **THEN** `.github/workflows/formatter.yml` is deleted via `git rm`
- **AND** it is confirmed not to be referenced by any other workflow or schedule (its references in `ci.yml` are commented out)

### Requirement: ci-enterprise.yml preserved intact
The `ci-enterprise.yml` workflow SHALL NOT be modified or deleted; it is preserved as-is for reference even though its paths are outdated.

#### Scenario: Broken workflow left as-is
- **WHEN** the cleanup change is applied
- **THEN** `.github/workflows/ci-enterprise.yml` remains unchanged
- **AND** it is verified that no external repository calls it (the workflow is not active)

### Requirement: Documentation updated after cleanup
The documentation SHALL be updated to remove references to the deleted zombie workflows.

#### Scenario: README CI table updated
- **WHEN** the zombie workflows are deleted
- **THEN** the `pr-validation.yml` entry is removed from the README.md CI table

#### Scenario: CI docs updated
- **WHEN** the zombie workflows are deleted
- **THEN** references to the deleted workflows in `docs/cicd-estado-actual.md` are removed (~10 references)
- **AND** the CI workflow inventory in `docs/cicd-plan-implementacion.md` is updated to reflect the deleted files

### Requirement: No dangling references to deleted workflows
The repository SHALL contain no references to the deleted workflows after cleanup.

#### Scenario: Codebase grep for deleted workflows
- **WHEN** the cleanup change is applied
- **THEN** a grep for `pr-validation.yml`, `lint.yml`, and `formatter.yml` across yml/yaml/md files (excluding `node_modules` and `.git`) returns no references
- **AND** commented-out references to `linter.yml` and `formatter.yml` are removed from `ci.yml`
