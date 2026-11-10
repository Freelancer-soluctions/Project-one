# sha-pinning-remaining-actions Specification

## Purpose

Pins all remaining tag-pinned third-party GitHub Actions to full-length commit SHAs with version comments, and ensures Dependabot's github-actions ecosystem keeps them updated. Closes the supply chain gap identified in the PRD (G8) and corroborated by OWASP 2026 and GitHub docs.

## ADDED Requirements

### Requirement: All third-party actions pinned to SHA

Every third-party action referenced in `.github/workflows/ci.yml`, `.github/workflows/security.yml`, and `.github/workflows/scheduled-security.yml` SHALL be pinned to a full-length commit SHA with a version comment. No action SHALL use a mutable tag (`@v*`, `@main`, `@latest`) as its sole reference.

#### Scenario: No mutable tags remain

- **WHEN** the workflows are inspected
- **THEN** every `uses:` statement for a third-party action SHALL reference a full 40-character commit SHA
- **AND** each SHA SHALL have a trailing version comment (e.g., `# v4.1.7`)
- **AND** no `uses:` statement SHALL use only a tag (`@v5`, `@v12`, `@v0.24.0`, `@v3.1.0`, `@v3`)

#### Scenario: First-party actions also pinned

- **WHEN** first-party actions (`actions/checkout`, `actions/upload-artifact`, etc.) are referenced
- **THEN** they SHALL also be pinned to a full-length commit SHA with version comment
- **AND** the pinning SHALL be consistent across all workflow files

### Requirement: Dependabot github-actions ecosystem

The `.github/dependabot.yml` file SHALL include a `github-actions` ecosystem entry with a weekly schedule, so that SHA-pinned actions are automatically updated via pull requests.

#### Scenario: Dependabot configured for actions

- **WHEN** `.github/dependabot.yml` is inspected
- **THEN** it SHALL contain an entry with `package-ecosystem: github-actions`
- **AND** the entry SHALL have `schedule.interval: weekly`
- **AND** the entry SHALL have `directory: /`

#### Scenario: Dependabot opens SHA update PRs

- **WHEN** a new version of a pinned action is released
- **THEN** Dependabot SHALL open a PR updating the SHA and version comment
- **AND** the PR SHALL be grouped with other minor/patch updates if configured

### Requirement: SHA pinning enforcement documented

The repository SHALL document how to enable SHA pinning enforcement at the repo level via GitHub's allowed-actions policy, so the owner can activate it manually.

#### Scenario: Documentation exists

- **WHEN** a maintainer reads the documentation
- **THEN** it SHALL explain how to enable "Require actions to be pinned to a full-length commit SHA" in Settings → Actions → General
- **AND** it SHALL note that this is a manual step requiring owner action
