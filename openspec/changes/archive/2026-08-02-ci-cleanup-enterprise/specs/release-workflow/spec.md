## Purpose

Aligns the `release.yml` workflow with the rest of the CI infrastructure by using `node-version-file: .nvmrc` instead of a hardcoded Node version, and verifies all remaining workflows consistently use `.nvmrc`.

## ADDED Requirements

### Requirement: release.yml uses node-version-file
The `release.yml` workflow SHALL use `node-version-file: .nvmrc` instead of the hardcoded `node-version: 20` on its `actions/setup-node@v4` step.

#### Scenario: Node version from .nvmrc
- **WHEN** the release workflow's `actions/setup-node@v4` step runs
- **THEN** it uses `node-version-file: .nvmrc` (currently `22.22.0`) instead of the hardcoded `node-version: 20`

#### Scenario: Cache dependency path added
- **WHEN** the release workflow's `actions/setup-node@v4` step runs
- **THEN** `cache-dependency-path: package-lock.json` is set for consistency with other workflows

### Requirement: Consistent .nvmrc usage across remaining workflows
All remaining workflows SHALL use `node-version-file: .nvmrc` with no hardcoded node versions.

#### Scenario: Remaining workflows verified
- **WHEN** the cleanup change is applied
- **THEN** `ci.yml`, `quality.yml`, `security.yml`, `ci-enterprise.yml`, and `release.yml` all use `node-version-file: .nvmrc`
- **AND** no remaining workflow has a hardcoded node version
