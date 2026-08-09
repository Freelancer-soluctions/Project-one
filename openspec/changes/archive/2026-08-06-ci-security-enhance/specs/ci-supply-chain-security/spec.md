## Purpose

Adds supply-chain security controls to the CI pipeline: generates a CycloneDX SBOM of the monorepo's dependencies on every PR and push to main, publishes it as a traceable artifact, and blocks pull requests that introduce vulnerable dependencies or incompatible licenses.

## ADDED Requirements

### Requirement: SBOM generation on PR and push to main

The workflow SHALL generate a Software Bill of Materials (SBOM) of the monorepo's dependencies in CycloneDX JSON format whenever a pull request is opened or synchronized against `main`, and whenever code is pushed to `main`. The SBOM MUST cover all npm workspaces of the monorepo.

#### Scenario: PR opened against main

- **WHEN** a pull request targeting `main` is opened or synchronized
- **THEN** the `sbom` job runs `anchore/sbom-action@v0`
- **AND** the SBOM is generated in CycloneDX JSON format
- **AND** the SBOM reflects the dependencies declared in the monorepo lockfile (`package-lock.json`)

#### Scenario: Push to main

- **WHEN** code is pushed to the `main` branch
- **THEN** the `sbom` job runs and generates the CycloneDX SBOM
- **AND** the generated SBOM reflects the state of `main` after the push

### Requirement: SBOM artifact upload for traceability

The workflow SHALL upload the generated SBOM file as a GitHub Actions artifact so it can be downloaded for auditing and traceability purposes.

#### Scenario: SBOM uploaded after generation

- **WHEN** the SBOM job successfully generates the SBOM file
- **THEN** the workflow uploads the SBOM file via `actions/upload-artifact@v4`
- **AND** the artifact is named `sbom` and contains the file `sbom-project-one.json`

#### Scenario: SBOM generation fails

- **WHEN** the SBOM generation step fails
- **THEN** the job fails
- **AND** no SBOM artifact is uploaded
- **AND** the workflow reports a failed check on the PR

### Requirement: Dependency Review blocks vulnerable or incompatible PRs

The workflow SHALL run a dependency review on every pull request targeting `main` that checks both vulnerability and license compatibility of the dependency changes introduced by the PR. A PR that introduces a dependency with a known vulnerability or an incompatible license MUST be blocked (job fails, PR not mergeable).

#### Scenario: PR introduces vulnerable dependency

- **WHEN** a pull request against `main` adds or updates a dependency with a known vulnerability
- **THEN** the `dependency-review` job runs `actions/dependency-review-action@v4`
- **AND** the job fails with the vulnerability findings
- **AND** the PR is blocked from merging

#### Scenario: PR introduces incompatible license

- **WHEN** a pull request against `main` adds or updates a dependency with a license incompatible with the project policy
- **THEN** the `dependency-review` job fails the license check
- **AND** the PR is blocked from merging

#### Scenario: PR introduces safe dependencies

- **WHEN** a pull request against `main` adds or updates dependencies with no known vulnerabilities and compatible licenses
- **THEN** the `dependency-review` job passes
- **AND** the PR is not blocked by dependency review

#### Scenario: Dependency review on non-PR events

- **WHEN** the workflow runs on a push to `main` (not a pull request)
- **THEN** the `dependency-review` job is skipped
- **AND** the workflow still completes successfully

### Requirement: Security workflow triggers

The security workflow SHALL run on `pull_request` targeting `main`, on `push` to `main`, and be callable as a reusable workflow (`workflow_call`). All security jobs MUST be part of this single workflow file.

#### Scenario: Workflow triggered by PR

- **WHEN** a pull request is opened or synchronized against `main`
- **THEN** the security workflow runs all configured security jobs including `sbom` and `dependency-review`

#### Scenario: Workflow triggered by push to main

- **WHEN** code is pushed to `main`
- **THEN** the security workflow runs
- **AND** the `sbom` job generates and uploads the SBOM
- **AND** the `dependency-review` job is skipped (PR-only)

#### Scenario: Reusable workflow call

- **WHEN** another workflow calls the security workflow via `workflow_call`
- **THEN** the security workflow runs its configured jobs with the caller's context
- **AND** the `dependency-review` job is skipped, since `github.event_name` is `workflow_call` (not `pull_request`)
