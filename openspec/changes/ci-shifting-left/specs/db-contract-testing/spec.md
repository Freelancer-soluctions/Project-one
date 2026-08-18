# db-contract-testing Specification

## Purpose

Detects drift between the Prisma schema and the applied migrations in CI using `prisma migrate diff --exit-code`, and validates schema syntax and formatting at pre-commit time, so database contract violations surface before deploy instead of in production.

## ADDED Requirements

### Requirement: CI database contract drift detection

The CI pipeline SHALL include a `db-contract` job that compares the Prisma schema against the applied migrations and fails when drift is detected.

#### Scenario: Schema and migrations in sync

- **WHEN** the `db-contract` job runs `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --exit-code`
- **THEN** the command SHALL exit with code 0 when the schema matches the migrations
- **AND** the job SHALL pass

#### Scenario: Schema and migrations drifted

- **WHEN** the Prisma schema differs from the applied migrations
- **THEN** the `prisma migrate diff` command SHALL exit with code 2
- **AND** the `db-contract` job SHALL fail
- **AND** the job output SHALL include the diff between schema and migrations for remediation

#### Scenario: Schema invalid

- **WHEN** the Prisma schema file contains invalid syntax
- **THEN** the `db-contract` job SHALL fail with the Prisma validation error
- **AND** the PR SHALL be blocked from merging

### Requirement: Pre-commit Prisma validation

The pre-commit hook SHALL run `prisma validate` and `prisma format --check` on the Prisma schema via lint-staged, so schema syntax and formatting errors are caught before commit.

#### Scenario: Schema file staged for commit

- **WHEN** a developer stages a change to `apps/server/prisma/schema.prisma`
- **THEN** lint-staged SHALL run `prisma validate` on the schema
- **AND** lint-staged SHALL run `prisma format --check` on the schema
- **AND** the commit SHALL be blocked if validation or format check fails

#### Scenario: Schema formatted correctly

- **WHEN** a developer stages a valid and correctly formatted schema
- **THEN** `prisma validate` and `prisma format --check` SHALL pass
- **AND** the commit SHALL proceed normally

### Requirement: Database contract script

The server workspace SHALL expose a `db:contract` npm script that runs the migration diff check, so developers and CI can invoke the contract check consistently.

#### Scenario: Script invoked locally

- **WHEN** a developer runs `npm run db:contract --workspace=server-express`
- **THEN** the script SHALL execute `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --exit-code`
- **AND** the script SHALL exit with code 0 when in sync and code 2 when drifted

#### Scenario: Script invoked in CI

- **WHEN** the `db-contract` CI job invokes the `db:contract` script
- **THEN** the job SHALL use the same command as the local script
- **AND** the job SHALL fail when the script exits non-zero
