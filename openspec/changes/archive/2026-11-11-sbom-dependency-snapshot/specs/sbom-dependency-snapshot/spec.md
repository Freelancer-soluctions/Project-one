# sbom-dependency-snapshot Specification

## Purpose

Enables dependency submission to GitHub's Dependency API via `anchore/sbom-action`'s `dependency-snapshot` option, improving Dependabot's coverage of transitive dependencies for SCA. Closes a minor gap identified in the PRD's SBOM section (§8.12 of the research doc).

## ADDED Requirements

### Requirement: Dependency snapshot enabled

The SBOM generation jobs in `.github/workflows/security.yml` and `.github/workflows/security-digest.yml` SHALL set `dependency-snapshot: true` in the `anchore/sbom-action` step, uploading the SBOM to GitHub's Dependency submission API. `scheduled-security.yml` is out of scope (uses `npm sbom`, no snapshot capability).

#### Scenario: Dependency snapshot enabled in PR-time workflow

- **WHEN** the SBOM job runs in `security.yml` on a pull request
- **THEN** the `anchore/sbom-action` step SHALL have `dependency-snapshot: true`
- **AND** the SBOM SHALL be uploaded to the GitHub Dependency submission API
- **AND** the submission uses the CycloneDX format (current format, not changed)

#### Scenario: Dependency snapshot enabled in security-digest workflow

- **WHEN** the SBOM job runs in `security-digest.yml`
- **THEN** the `anchore/sbom-action` step SHALL have `dependency-snapshot: true`
- **AND** the SBOM SHALL be uploaded to the GitHub Dependency submission API

### Requirement: Permissions verified

The SBOM jobs SHALL have `contents: write` permission for the dependency submission API. The `sbom` job in `security.yml` currently has `contents: read` (L212); it SHALL be elevated to `contents: write`.

#### Scenario: Permissions sufficient

- **WHEN** the SBOM job runs
- **THEN** the workflow SHALL have `contents: write` permission
- **AND** the dependency submission SHALL succeed without authentication errors
- **AND** in PRs from forks, the token is read-only and submission degrades gracefully (expected, not a failure)
