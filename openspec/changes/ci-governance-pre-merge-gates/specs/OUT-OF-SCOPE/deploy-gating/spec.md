## Purpose

Configures GitHub Environments for staging and production with required reviewers and post-deploy smoke verification to enforce Level 4 post-merge deploy governance.

## ADDED Requirements

### Requirement: Environments configured

The system SHALL configure GitHub Environments named `staging` and `production`.

#### Scenario: Environment exists

- **WHEN** a deployment workflow references the `production` environment
- **THEN** GitHub resolves the configured `production` environment

### Requirement: Required reviewers for production

The `production` environment SHALL require at least one designated required reviewer before a deployment proceeds.

#### Scenario: Deployment without reviewer approval

- **WHEN** a deployment to `production` is triggered without required reviewer approval
- **THEN** the deployment is held until approval is granted

### Requirement: Post-deploy smoke tests

After a deployment, the system SHALL run a smoke test that probes a health-check endpoint and fails the deployment if the endpoint is unhealthy.

#### Scenario: Healthy endpoint

- **WHEN** the post-deploy smoke test probes the health-check endpoint and receives a healthy response
- **THEN** the deployment is marked successful

#### Scenario: Unhealthy endpoint

- **WHEN** the smoke test receives an unhealthy response
- **THEN** the deployment is marked failed and alerts

### Requirement: Deploy verification workflow

The system SHALL provide a `deploy-gating` workflow that orchestrates environment deployment and invokes the smoke test as a required post-deploy step.

#### Scenario: Deploy then verify

- **WHEN** the deploy-gating workflow runs
- **THEN** it deploys to the target environment and only reports success after the smoke test passes
