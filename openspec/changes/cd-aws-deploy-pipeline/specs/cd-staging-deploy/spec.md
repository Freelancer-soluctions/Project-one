## Purpose

Deploy the validated server image to the staging environment automatically on every merge to main, run post-deploy smoke tests, and hold promotion to production until staging is verified.

## ADDED Requirements

### Requirement: Automatic staging deployment on merge

The system SHALL trigger a staging deployment whenever a commit is pushed to `main`, deploying the SHA-tagged image that passed the build and validation stage.

#### Scenario: Merge to main deploys to staging

- **WHEN** a commit is merged to `main` and the image validation succeeds
- **THEN** the pipeline deploys that image to the `staging` environment

#### Scenario: Failed build blocks staging

- **WHEN** the image build or validation job fails
- **THEN** no staging deployment is attempted and the pipeline fails with the build error

### Requirement: Post-deploy smoke tests in staging

The pipeline SHALL run smoke tests against the freshly deployed staging environment to verify the service is healthy and reachable.

#### Scenario: Staging health endpoint responds

- **WHEN** the staging deployment completes
- **THEN** the pipeline retries the staging health endpoint until it returns HTTP 200 and runs the project smoke test suite

#### Scenario: Staging smoke test failure fails the job

- **WHEN** the health endpoint does not return 200 within the retry budget or a smoke test fails
- **THEN** the staging job fails and the deployment is marked as failed

### Requirement: Promotion gate between staging and production

The pipeline SHALL prevent production deployment while staging smoke tests are failing or incomplete, so production only receives images verified in staging.

#### Scenario: Staging green enables production job

- **WHEN** the staging deployment and its smoke tests pass
- **THEN** the production deployment job becomes eligible to run (subject to its own manual approval gate)

#### Scenario: Staging red blocks production

- **WHEN** the staging job fails or is skipped due to a failed build
- **THEN** the production job is not executed

### Requirement: Environment isolation for secrets

The `staging` environment SHALL hold its own set of deployment secrets, distinct from production, so production credentials are never exposed to or reused by the staging pipeline.

#### Scenario: Separate secret scopes per environment

- **WHEN** the staging job resolves its configuration
- **THEN** it reads only the staging environment's secrets, never production secrets

#### Scenario: Staging secrets include the application bootstrap env vars

- **WHEN** the staging task definition is registered
- **THEN** it injects `ALGORITHM=aes-256-gcm` as a non-secret `environment` entry (public constant) and `AES_GCM_KEY` as a `secrets` entry referencing `STAGING_AES_GCM_KEY_SECRET_ARN` (AWS Secrets Manager ARN held by the staging environment)
- **AND** the staging environment exposes `STAGING_AES_GCM_KEY_SECRET_ARN` alongside the existing `STAGING_DATABASE_URL_SECRET_ARN`, `STAGING_JWT_SECRET_SECRET_ARN`, and `STAGING_AWS_REGION_SECRET_ARN`
- **AND** the container starts without aborting during the encryption middleware bootstrap (otherwise the task never reaches `httpServer.listen(3000)` and the post-deploy health check fails)
