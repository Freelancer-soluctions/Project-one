# Spec Delta

## MODIFIED Requirements

### Requirement: E2E job contract with PostgreSQL service container

The `e2e` job definition in `ci.yml` SHALL keep a `postgres:16-alpine` service container identical in shape to the one used by the `test-integration` job, with a `pg_isready` health check and a `prisma migrate deploy` step pointing `DATABASE_URL` at the service, so that when the job is activated the Playwright webServer can connect to a real database.

The job SHALL remain disabled and SHALL reach `ci-complete` through exactly one aggregator, `postbuild-tests-complete`, which lists `e2e` in its `needs` alongside `build-complete`, `test-integration` and `test-smoke`. No **prebuild** aggregator SHALL reference it.

#### Scenario: E2E job definition carries the full contract

- **WHEN** the `e2e` job definition in `ci.yml` is read
- **THEN** it declares a `postgres:16-alpine` service with `pg_isready` health options (`interval: 10s`, `timeout: 5s`, `retries: 5`)
- **AND** a `npx prisma migrate deploy` step runs with `DATABASE_URL` pointing to the service container
- **AND** the job carries `timeout-minutes: 15`

#### Scenario: Job stays disabled while out of scope

- **WHEN** this change is applied
- **THEN** the `e2e` job remains `if: false` (activation is an explicit non-goal until the service is stable)
- **AND** no **prebuild** aggregator — `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-tests-complete` — references `e2e`
- **AND** `e2e` DOES appear in `postbuild-tests-complete.needs`, so the invariant above is not to be read as "`e2e` belongs to no aggregator": the job is gated post-build, not orphaned

#### Scenario: A skipped e2e does not void the post-build testing verdict

- **WHEN** `e2e` finalizes as `skipped` because it still declares `if: false`
- **THEN** `postbuild-tests-complete` executes anyway (`always()`) and treats the skipped member as passing
- **AND** its verdict continues to reflect `test-integration` and `test-smoke`
