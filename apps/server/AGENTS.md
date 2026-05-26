# Server — Express Backend

Express.js API with Prisma ORM and PostgreSQL.

## Commands

```bash
npm run dev                # Start with nodemon (src/bin/index.js)
npm run prisma-migration  # Run Prisma migrations
npm run prisma-seed       # Seed database
npm run prisma-push       # Push schema to DB
npm run test              # Vitest (all)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # Coverage report
```

## Database

Prisma schema: `prisma/schema.prisma`

```bash
# Generate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset
```

## Testing

See root [docs/testing-architecture.md](../../docs/testing-architecture.md)

**Structure:**

```
tests/
├── unit/
├── integration/
└── setupTest.js
```

## ESLint

Uses `standard` config (not project ESLint config).

## Available Skills

Skills relevant to server-side development. Load with `/skill <name>`.

### Backend Skills

| Skill | Description | URL |
|-------|-------------|-----|
| `nodejs-backend-patterns` | Production-ready Express/Fastify: middleware, error handling, auth, API design | [SKILL.md](../../.agents/skills/nodejs-backend-patterns/SKILL.md) |
| `postgresql-table-design` | PostgreSQL schema design: data types, indexing, constraints, performance patterns | [SKILL.md](../../.agents/skills/postgresql-table-design/SKILL.md) |
| `prisma-postgres` | Prisma Postgres setup, Management API, provisioning, and connection handling | [SKILL.md](../../.agents/skills/prisma-postgres/SKILL.md) |

### Testing Skills

| Skill | Description | URL |
|-------|-------------|-----|
| `vitest` | Vitest config, test suites, mocks (vi.fn), code coverage, parallel execution | [SKILL.md](../../.agents/skills/vitest/SKILL.md) |
| `test-driven-development` | TDD: write test first, watch it fail, write minimal code to pass | [SKILL.md](../../.agents/skills/test-driven-development/SKILL.md) |

### Security Skills

| Skill | Description | URL |
|-------|-------------|-----|
| `owasp-security-check` | OWASP Top 10 audit: SQLi, XSS, auth/authz, CORS, rate limiting, input validation | [SKILL.md](../../.agents/skills/owasp-security-check/SKILL.md) |

## Auto-invoke Skills (Server)

When performing these actions in the server, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Auditing server code for security vulnerabilities before merge | `owasp-security-check` |
| Building a new API endpoint, middleware, or auth flow | `nodejs-backend-patterns` |
| Changing Prisma schema, running migrations | `prisma-postgres` |
| Designing or reviewing PostgreSQL table schemas | `postgresql-table-design` |
| Fixing a bug or implementing a feature | `test-driven-development` |
| Writing unit/integration tests with Vitest | `vitest` |
