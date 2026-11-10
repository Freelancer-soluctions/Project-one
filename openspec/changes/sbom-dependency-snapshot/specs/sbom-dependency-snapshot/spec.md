# sbom-dependency-snapshot Specification

## Purpose

Enables dependency submission to GitHub's Dependency API via `anchore/sbom-action`'s `dependency-snapshot` option, improving Dependabot's coverage of transitive dependencies for SCA. Closes a minor gap identified in the PRD's SBOM section (§8.12 of the research doc).

## ADDED Requirements

### Requirement: Dependency snapshot enabled

The SBOM generation jobs in `.github/workflows/security.yml` and `.github/workflows/scheduled-security.yml` SHALL set `dependency-snapshot: true` in the `anchore/sbom-action` step, uploading the SBOM to GitHub's Dependency submission API.

#### Scenario: Dependency snapshot enabled in PR-time workflow

- **WHEN** the SBOM job runs in `security.yml` on a pull request
- **THEN** the `anchore/sbom-action` step SHALL have `dependency-snapshot: true`
- **AND** the SBOM SHALL be uploaded to the GitHub Dependency submission API
- **AND** Dependabot SHALL be able to detect vulnerabilities in transitive dependencies

#### Scenario: Dependency snapshot enabled in scheduled workflow

- **WHEN** the SBOM job runs in `scheduled-security.yml` on the weekly cron
- **THEN** the `anchore/sbom-action` step SHALL have `dependency-snapshot: true`
- **AND** the SBOM SHALL be uploaded to the GitHub Dependency submission API

### Requirement: Permissions verified

The SBOM jobs SHALL have the necessary permissions for the dependency submission API (`contents: write` or default token with sufficient scope).

#### Scenario: Permissions sufficient

- **WHEN** the SBOM job runs
- **THEN** the workflow SHALL have `contents: write` permission (or equivalent)
- **AND** the dependency submission SHALL succeed without authentication errors
