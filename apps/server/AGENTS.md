# Server — Express Backend

Express.js API with Prisma ORM and PostgreSQL.

## Commands

```bash
npm run dev                # Start with nodemon (src/bin/index.js)
npm run prisma-migration  # Run Prisma migrations
npm run prisma-seed       # Seed database
npm run prisma-push       # Push schema to DB
npm run test              # Vitest (all: unit + integration)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Watch mode
npm run test:changed      # Only tests affected by git changes
npm run test:coverage     # Coverage report
```

## Database

Prisma schema: `prisma/schema.prisma`

```bash
# Generate Prisma client
npm exec prisma -- generate

# Reset database
npm exec prisma -- migrate reset
```

## Testing

See root [docs/testing-architecture.md](../../docs/testing-architecture.md) — **section 8 covers the hybrid test organization in depth.**

### Hybrid Test Organization (Consensus 2025-2026)

Backend adopts the **hybrid approach** — the emerging industry consensus endorsed by NestJS, Kent C. Dodds, and TypeScript TV:

- **Unit tests**: colocated alongside the source file they test
- **Integration tests**: centralized in `tests/integration/<module>/` (grouped by module, cross-cutting, DB setup)
- **E2E tests**: top-level in `e2e/` (in the monorepo root)

### Structure (CURRENT STATE — migration complete)

```plaintext
# Colocated unit tests
src/modules/<module>/
  <file>.js
  <file>.unit.test.js              # Colocated
src/modules/events/attendee/
  service.js
  dao.js
  event-rsvp-register.unit.test.js # Colocated
  event-rsvp-cancel.unit.test.js
  event-rsvp-admin.unit.test.js
  event-rsvp-audit.unit.test.js
  event-rsvp-promote.unit.test.js
src/utils/prisma/
  sanitizePrismaMessage.js
  sanitizePrismaMessage.unit.test.js
src/utils/responses&Errors/
  errorHandler.unit.test.js

# Integration tests grouped by module
tests/integration/
  events/
    events-combined-filters.integration.test.js
    events-soft-delete.integration.test.js
    events-validation.integration.test.js
  notes/
    notes-mentions.integration.test.js

# Orphans (skipped, legacy)
tests/bin/server.test.js                            # describe.todo
tests/components/role/role.test.js                  # describe.skip (DB)
tests/users-path-param-validation.test.js           # describe.skip (DB)

# E2E tests (monorepo top-level)
e2e/tests/
```

### Vitest Configuration

`vitest.config.js` discovers both colocated and centralized integration tests:

```js
include: [
  'src/**/*.unit.test.js', // Colocated unit tests
  'tests/integration/**/*.integration.test.js', // Integration grouped by module
];
```

### NPM Scripts (Server)

Test scripts use **substring path filters** (not directory paths) so they work with the hybrid colocated layout:

```json
{
  "test:unit": "vitest run \".unit.test.js\"",
  "test:integration": "vitest run \".integration.test.js\""
}
```

This filters by filename pattern instead of folder location — robust regardless of where the test file lives.

### Naming Convention

| Pattern                 | Type                                  | Location                      |
| ----------------------- | ------------------------------------- | ----------------------------- |
| `*.unit.test.js`        | Unit test (pure logic, single module) | Colocated with source         |
| `*.integration.test.js` | Integration (multi-module, DB, HTTP)  | `tests/integration/<module>/` |
| `*.test.js`             | AVOID — no context about intent       | —                             |

### Adding New Tests

- **New unit test for a module**: place at `src/modules/<module>/<file>.unit.test.js` — colocated with the source file it tests
- **New integration test**: place at `tests/integration/<module>/<name>.integration.test.js` — grouped by the primary module the test exercises
- **Avoid orphan tests** in `tests/` top-level or in unrelated subfolders

## ESLint

Uses `standard` config (not project ESLint config).

## Available Skills

Skills relevant to server-side development. Load with `/skill <name>`.

### Backend Skills

| Skill                     | Description                                                                       | URL                                                               |
| ------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `nodejs-backend-patterns` | Production-ready Express/Fastify: middleware, error handling, auth, API design    | [SKILL.md](../../.agents/skills/nodejs-backend-patterns/SKILL.md) |
| `postgresql-table-design` | PostgreSQL schema design: data types, indexing, constraints, performance patterns | [SKILL.md](../../.agents/skills/postgresql-table-design/SKILL.md) |
| `prisma-postgres`         | Prisma Postgres setup, Management API, provisioning, and connection handling      | [SKILL.md](../../.agents/skills/prisma-postgres/SKILL.md)         |

### Testing Skills

| Skill                     | Description                                                                  | URL                                                               |
| ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `vitest`                  | Vitest config, test suites, mocks (vi.fn), code coverage, parallel execution | [SKILL.md](../../.agents/skills/vitest/SKILL.md)                  |
| `test-driven-development` | TDD: write test first, watch it fail, write minimal code to pass             | [SKILL.md](../../.agents/skills/test-driven-development/SKILL.md) |

### Security Skills

| Skill                  | Description                                                                      | URL                                                            |
| ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `owasp-security-check` | OWASP Top 10 audit: SQLi, XSS, auth/authz, CORS, rate limiting, input validation | [SKILL.md](../../.agents/skills/owasp-security-check/SKILL.md) |

## Auto-invoke Skills (Server)

When performing these actions in the server, ALWAYS invoke the corresponding skill FIRST:

| Action                                                         | Skill                     |
| -------------------------------------------------------------- | ------------------------- |
| Auditing server code for security vulnerabilities before merge | `owasp-security-check`    |
| Building a new API endpoint, middleware, or auth flow          | `nodejs-backend-patterns` |
| Changing Prisma schema, running migrations                     | `prisma-postgres`         |
| Designing or reviewing PostgreSQL table schemas                | `postgresql-table-design` |
| Fixing a bug or implementing a feature                         | `test-driven-development` |
| Writing unit/integration tests with Vitest                     | `vitest`                  |
