## ADDED Requirements

### Requirement: Pre-push hook runs scoped tests
The pre-push hook SHALL run only tests affected by the diff between HEAD and `origin/main`, instead of the full test suite.

#### Scenario: Successful push with scoped tests
- **WHEN** a developer pushes commits to a remote branch
- **THEN** the pre-push hook SHALL run `npx vitest run --changed origin/main --config apps/server/vitest.config.js`
- **AND** the pre-push hook SHALL run `npx vitest run --changed origin/main --config apps/client/vitest.config.js`
- **AND** the pre-push hook SHALL NOT run `npm run test:unit` or `npm run test:integration` (full suites)
- **AND** the pre-push hook SHOULD complete within 30 seconds (GitHub SSH timeout limit)

#### Scenario: E2E tests excluded from pre-push
- **WHEN** the pre-push hook executes
- **THEN** it SHALL NOT run Playwright E2E tests
- **AND** it SHALL NOT run any test requiring browser binaries

#### Scenario: DB integration tests excluded from pre-push
- **WHEN** the pre-push hook executes
- **THEN** it SHALL NOT run Prisma-based integration tests that require a PostgreSQL database
- **AND** it SHALL NOT run any test requiring database connectivity

### Requirement: Fallback when origin/main is unavailable
When `origin/main` is not available locally (e.g., fresh clone without fetch), the hook SHALL handle the situation gracefully.

#### Scenario: origin/main not found locally
- **WHEN** `origin/main` is not available in the local git history
- **THEN** the hook SHALL fail with a clear error message instructing the developer to run `git fetch origin main`
- **AND** the hook SHALL NOT attempt to run the full test suite as a fallback

### Requirement: Three-tier strategy documented
The `docs/testing-architecture.md` file SHALL document the three-tier execution strategy so developers understand which tests run at each stage.

#### Scenario: Three-tier strategy is documented
- **WHEN** a developer reads `docs/testing-architecture.md`
- **THEN** they SHALL find a section titled "7.5. Estrategia de Ejecución por Capas (Pre-commit / Pre-push / CI)"
- **AND** the section SHALL document:
  - Pre-commit: ESLint + Prettier + type-check on staged files (< 10s)
  - Pre-push: Scoped unit tests with `vitest --changed origin/main` (< 30s)
  - CI: Full unit + integration + E2E + coverage + security scans

#### Scenario: SSH timeout documented
- **WHEN** a developer reads the three-tier strategy section
- **THEN** they SHALL find a documented explanation that GitHub's SSH timeout (~30s) is the hard constraint limiting pre-push hook duration

#### Scenario: Diff base rationale documented
- **WHEN** a developer reads the three-tier strategy section
- **THEN** they SHALL find documented rationale explaining why `origin/main` is used as diff base instead of `HEAD~1`

### Requirement: Architectural decisions updated
Section 11 "Decisiones Arquitectónicas" in `docs/testing-architecture.md` SHALL be updated with new ADR rows documenting the execution tier strategy.

#### Scenario: New ADR rows present
- **WHEN** a developer reads section 11 of `docs/testing-architecture.md`
- **THEN** they SHALL find new rows documenting:
  - Three-tier hook strategy adopted (pre-commit / pre-push / CI)
  - `origin/main` as diff base for scoped testing
  - E2E + DB-integration deferred to CI
