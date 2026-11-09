# ci-clean-manifest Specification

## Purpose

Cleans the CI workflow inventory by deleting three zombie workflows (`pr-validation.yml`, `lint.yml`, `formatter.yml`), recording the retirement of `ci-enterprise.yml`, updating documentation to match, and verifying no dangling references remain.

## Requirements

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

### Requirement: ci-enterprise.yml retired from the inventory

`ci-enterprise.yml` SHALL NOT be part of the CI workflow inventory: `.github/workflows/ci-enterprise.yml` SHALL NOT exist in the repository and SHALL NOT be reintroduced as an active workflow. The 2026-08 cleanup deliberately preserved it as an inert reference (archived change `2026-08-02-ci-cleanup-enterprise`, whose delta keeps the original rationale); it was deleted afterwards, so the invariant that survives is that nothing in the repository depends on it.

#### Scenario: Retired workflow stays out of the inventory

- **WHEN** `.github/workflows/` is listed and the workflow registry is queried via the GitHub API
- **THEN** `ci-enterprise.yml` appears in neither (absent since at least the 2026-10-18 snapshot documented in `docs/CONTEXT-CICD.md` §5.9)
- **AND** no workflow, npm script or CI document loads or invokes it; the only permitted mentions are explicitly marked as historical

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
