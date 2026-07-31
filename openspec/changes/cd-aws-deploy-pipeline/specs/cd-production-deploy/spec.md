## Purpose

Promote the staging-verified server image to production only through a manual approval gate, then confirm the deployment with a sustained health check and automatic rollback protection.

## ADDED Requirements

### Requirement: Manual approval gate for production
The pipeline SHALL require explicit human approval before deploying to the `production` environment, enforced by GitHub Environment protection rules.

#### Scenario: Deployment awaits approval
- **WHEN** the production job becomes eligible after staging passes
- **THEN** the deployment waits until a designated reviewer approves it in the GitHub Environment protection gate

#### Scenario: Approval proceeds, rejection or timeout blocks
- **WHEN** the reviewer approves the deployment
- **THEN** the pipeline deploys the staging-verified image to production
- **WHEN** the reviewer rejects the deployment or the approval times out
- **THEN** the production deployment is not executed and the pipeline reports the blocked state

### Requirement: Production deploy uses staging-verified image
The pipeline SHALL deploy to production exactly the image that was built, validated, and smoke-tested in staging, so no unverified artifact reaches production.

#### Scenario: Same image SHA deployed to production
- **WHEN** the production deployment runs
- **THEN** it uses the same SHA-tagged image that passed staging, never a freshly rebuilt one

### Requirement: Sustained health check after production deploy
The pipeline SHALL observe the production health endpoint for a defined window (up to 5 minutes) after deployment and fail the job if the service does not stay healthy.

#### Scenario: Healthy production deployment
- **WHEN** the production deployment completes
- **THEN** the pipeline polls the health endpoint until it returns HTTP 200 and remains healthy across the observation window

#### Scenario: Unhealthy production deployment
- **WHEN** the health endpoint does not return 200 within the observation window
- **THEN** the pipeline reports the deployment as failed and the platform's rollback protection is triggered

### Requirement: Deployment circuit breaker
The production deployment SHALL run with the platform's deployment circuit breaker enabled with automatic rollback, so an unhealthy deployment is reverted automatically instead of leaving production degraded.

#### Scenario: Circuit breaker reverts failed deployment
- **WHEN** the deployed service fails its health checks during the deployment rollout
- **THEN** the platform automatically rolls back to the previous healthy task definition without manual intervention
