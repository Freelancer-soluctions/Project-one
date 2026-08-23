# ci-supply-chain-security Delta Specification

## MODIFIED Requirements

### Requirement: Dependency Review blocks vulnerable or incompatible PRs

The workflow SHALL run a dependency review on every pull request targeting `main` that checks both vulnerability and license compatibility of the dependency changes introduced by the PR. The `dependency-review` job SHALL be configured as a **required status check** in branch protection for `main`, so a PR that introduces a dependency with a known vulnerability or an incompatible license is guaranteed to be blocked from merging at the branch protection level — not merely reported as a failing job.

#### Scenario: PR introduces vulnerable dependency

- **WHEN** a pull request against `main` adds or updates a dependency with a known vulnerability
- **THEN** the `dependency-review` job runs `actions/dependency-review-action@v4`
- **AND** the job fails with the vulnerability findings
- **AND** the PR is blocked from merging by the required status check in branch protection

#### Scenario: PR introduces incompatible license

- **WHEN** a pull request against `main` adds or updates a dependency with a license incompatible with the project policy
- **THEN** the `dependency-review` job fails the license check
- **AND** the PR is blocked from merging by the required status check in branch protection

#### Scenario: PR introduces safe dependencies

- **WHEN** a pull request against `main` adds or updates dependencies with no known vulnerabilities and compatible licenses
- **THEN** the `dependency-review` job passes
- **AND** the required status check reports success
- **AND** the PR is not blocked by dependency review

#### Scenario: Dependency review on non-PR events

- **WHEN** the workflow runs on a push to `main` (not a pull request)
- **THEN** the `dependency-review` job is skipped
- **AND** the workflow still completes successfully

#### Scenario: Branch protection enforcement

- **WHEN** the `dependency-review` required status check is pending or failing on a PR targeting `main`
- **THEN** GitHub branch protection SHALL prevent the PR from being merged
- **AND** the PR SHALL remain blocked until the check passes
