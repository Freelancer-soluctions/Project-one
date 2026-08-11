## Purpose

Creates a Sentry release for every deploy so errors captured in staging and production are correlated to the exact commit SHA that introduced them, satisfying the deploy-marker requirement of the CI/CD plan.

## ADDED Requirements

### Requirement: Sentry release created on staging deploy

The CD pipeline SHALL create a Sentry release for the staging environment after a staging deployment completes, using the deployed commit SHA as the release name.

#### Scenario: Staging deploy creates Sentry release

- **WHEN** the staging deployment job completes successfully and AWS infrastructure is configured (`vars.AWS_ROLE_ARN` set)
- **THEN** the pipeline creates a Sentry release named after the deployed commit SHA with environment `staging`

#### Scenario: Staging deploy without AWS infrastructure skips release

- **WHEN** the staging deployment job is skipped because AWS infrastructure is not configured
- **THEN** no Sentry release step runs and the pipeline remains green

### Requirement: Sentry release created on each production deploy

The CD pipeline SHALL create a Sentry release for the production environment after a production deployment, using the deployed commit SHA as the release name.

#### Scenario: Production deploy creates Sentry release

- **WHEN** the production deployment job completes successfully and the pipeline is configured
- **THEN** the pipeline creates a Sentry release named after the deployed commit SHA with environment `production`

#### Scenario: Production deploy without Sentry credentials

- **WHEN** the production deployment succeeds but Sentry credentials are not configured
- **THEN** the release step is skipped with a visible notice and the deployment is not marked failed

### Requirement: Release correlates errors to commits

The release name SHALL be the deployed commit SHA so that errors reported to Sentry in a given environment can be traced back to the exact commit that introduced them.

#### Scenario: Error traceable to release

- **WHEN** an error is captured in an environment with an active Sentry release
- **THEN** the error is associated with the release whose name matches the deployed commit SHA

### Requirement: Deploy marker milestone comment

The pipeline SHOULD record a deploy marker (milestone comment) on the triggering commit or PR noting the environment, commit SHA, and Sentry release, so deploy history is auditable. The comment is best-effort and non-blocking: a failure to post it SHALL NOT mark the deployment as failed.

#### Scenario: Deploy marker recorded

- **WHEN** a deployment to staging or production completes
- **THEN** a milestone comment is recorded referencing the environment, the commit SHA, and the Sentry release name

#### Scenario: Deploy marker comment fails

- **WHEN** a deployment to staging or production completes but posting the milestone comment fails
- **THEN** the pipeline logs a notice and the deployment is not marked failed
