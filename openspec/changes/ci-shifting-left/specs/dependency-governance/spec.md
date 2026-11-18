# dependency-governance Specification

## Purpose

Establishes a software composition analysis (SCA) loop with automatic remediation: Dependabot opens fix PRs for vulnerable dependencies, dependency-review gates PRs that introduce new vulnerabilities, and Trivy performs deep filesystem scanning, so vulnerable dependencies are remediated automatically instead of lingering.

## ADDED Requirements

### Requirement: Dependabot configuration for all ecosystems

The repository SHALL include a `.github/dependabot.yml` that enables Dependabot for the npm, docker, and github-actions ecosystems, so dependency updates and vulnerability fixes are proposed automatically.

#### Scenario: Dependabot config present

- **WHEN** the repository contains `.github/dependabot.yml`
- **THEN** Dependabot SHALL be enabled for the `npm` ecosystem (root `package-lock.json`)
- **AND** Dependabot SHALL be enabled for the `docker` ecosystem (Dockerfiles)
- **AND** Dependabot SHALL be enabled for the `github-actions` ecosystem (`.github/workflows/**`)

#### Scenario: Vulnerable dependency detected by Dependabot

- **WHEN** Dependabot detects a dependency with a known vulnerability or an available update
- **THEN** Dependabot SHALL open a pull request with the version bump
- **AND** the PR SHALL pass through the same CI gates as any other PR

### Requirement: Dependency review gates PRs

The dependency review SHALL run on every pull request targeting `main` and block PRs that introduce dependencies with known vulnerabilities or incompatible licenses.

#### Scenario: PR introduces vulnerable dependency

- **WHEN** a pull request against `main` adds or updates a dependency with a known vulnerability
- **THEN** the `dependency-review` job SHALL run `actions/dependency-review-action@v4`
- **AND** the job SHALL fail with the vulnerability findings
- **AND** the PR SHALL be blocked from merging

#### Scenario: PR introduces incompatible license

- **WHEN** a pull request against `main` adds or updates a dependency with a license incompatible with project policy
- **THEN** the `dependency-review` job SHALL fail the license check
- **AND** the PR SHALL be blocked from merging

#### Scenario: PR introduces safe dependencies

- **WHEN** a pull request against `main` adds or updates dependencies with no known vulnerabilities and compatible licenses
- **THEN** the `dependency-review` job SHALL pass
- **AND** the PR SHALL not be blocked by dependency review

### Requirement: Trivy deep filesystem scan

The security pipeline SHALL run Trivy filesystem scans to detect vulnerabilities in dependencies, IaC files, and container images, complementing the lockfile-based checks.

#### Scenario: Trivy scan runs in security pipeline

- **WHEN** the security workflow runs
- **THEN** Trivy SHALL scan the repository filesystem (`scan-type: fs`, `scan-ref: .`)
- **AND** Trivy SHALL report findings in SARIF format
- **AND** the scan SHALL fail the job when CRITICAL or HIGH severity vulnerabilities are found (`exit-code: '1'`)

#### Scenario: Trivy findings uploaded

- **WHEN** the Trivy scan completes
- **THEN** the SARIF output SHALL be uploaded via `github/codeql-action/upload-sarif@v4`
- **AND** the findings SHALL appear in the GitHub Security tab
