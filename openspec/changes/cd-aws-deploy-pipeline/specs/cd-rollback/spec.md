## Purpose

Guarantee every deployment can be reverted in under 15 minutes at both the application layer (redeploy previous image) and the database layer (sequential Prisma migration reversal).

## ADDED Requirements

### Requirement: Application rollback via previous image
The system SHALL support reverting the application by redeploying the previous immutable image tag from the container registry.

#### Scenario: Manual rollback to previous tag
- **WHEN** a deployment is deemed faulty after release
- **THEN** operators can redeploy the previous image tag from the registry, restoring the last known-good version

#### Scenario: Rollback target always available
- **WHEN** a new image is pushed to the registry
- **THEN** the previous image tag remains available in the registry so a rollback target always exists

### Requirement: Automatic rollback on failed rollout
The platform SHALL automatically revert an application deployment when it fails its health checks during rollout, without manual intervention.

#### Scenario: Automatic revert on unhealthy rollout
- **WHEN** the deployment's health checks fail during rollout
- **THEN** the platform reverts to the previous task definition and the pipeline reports the rollback

### Requirement: Database rollback with reversible migrations
The system SHALL allow database changes to be reversed with `prisma migrate down`, applied sequentially one migration at a time, and every migration SHALL be reversible or have an explicit data plan.

#### Scenario: Sequential migration reversal
- **WHEN** a release requires a database rollback
- **THEN** the most recent migration is reverted first, one at a time in reverse order, until the schema matches the target version

#### Scenario: Irreversible migration has a data plan
- **WHEN** a migration cannot be cleanly reverted (e.g. irreversible data loss)
- **THEN** the migration includes a documented data plan and requires manual review before it is applied to production

### Requirement: Rollback time budget
The complete rollback procedure (application and database) SHALL be executable in under 15 minutes by the on-call operator.

#### Scenario: Rollback procedure documented and executable
- **WHEN** an incident requires a rollback
- **THEN** the documented rollback steps (redeploy previous tag, revert migrations if needed) can be completed within 15 minutes
