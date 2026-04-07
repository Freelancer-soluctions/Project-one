# Server - Express Backend

Express.js API with Prisma ORM and SQLite.

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
