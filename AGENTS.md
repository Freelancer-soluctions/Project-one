# Project One (Project Context)

Monorepo with Node.js/Express backend and React client.

## How to Use This Guide

- Start here for cross-project norms. Project One is a monorepo with several components.
- Each component has an `AGENTS.md` file with specific guidelines (e.g., `apps/client/AGENTS.md`, `apps/server/AGENTS.md`).
- Component docs override this file when guidance conflicts.

## Quick Start

```bash
npm run build     # Build all workspaces
npm run lint      # Lint all apps
npm run format    # Format all files
npm run test      # Run all tests
```

## Project Structure

```
apps/
├── client/       # React frontend (Vite, Tailwind, shadcn/ui)
├── server/       # Express backend (Prisma, Postgresql)
└── e2e/          # Playwright E2E tests
```

## Workspace Commands

### Client (React)

```bash
cd apps/client && npm run dev          # Dev server (port 5173)
cd apps/client && npm run storybook    # Storybook (port 6006)
cd apps/client && npm run test        # Run tests once
```

### Server (Express)

```bash
cd apps/server && npm run dev               # Start with nodemon
cd apps/server && npm run prisma-migration  # Run migrations
cd apps/server && npm run test:unit         # Unit tests
cd apps/server && npm run test:integration  # Integration tests
```

### E2E

```bash
cd e2e && npm run test
```

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind, shadcn/ui, Redux Toolkit, RTK Query |
| Backend  | Express, Prisma ORM, Postgresql                               |
| Testing  | Vitest, Testing Library, Playwright, MSW                      |

## Important Conventions

- **Commits**: Conventional Commits enforced by Husky
- **Commit Signing**: Cada commit debe firmarse localmente con la SSH key ed25519 dedicada (`git commit -S`). **Nunca usar `--no-verify` ni commits sin firmar** — rompe el ruleset `Require signed commits` y la cadena de suministro. Ver docs/commit-signing.md para el setup rápido.
- **Testing**: See [docs/testing-architecture.md](docs/testing-architecture.md)
- **Code Style**: See [docs/code-style.md](docs/code-style.md)

## Available Skills

Use these skills for detailed patterns on-demand. Load with `/skill <name>`.

### Meta-Skills (Agent Behavior)

These skills modify agent communication and workflow orchestration:

| Skill      | Description                                                                                                             | URL                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `grill-me` | Interview the user relentlessly about a plan until reaching shared understanding. Walk each branch of the decision tree | [SKILL.md](.agents/skills/grill-me/SKILL.md) |
| `caveman`  | Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler, articles, and pleasantries               | [SKILL.md](.agents/skills/caveman/SKILL.md)  |

### OpenSpec Workflow (Spec-Manager)

Skills for the specification-driven development lifecycle, owned by @spec-manager:

| Skill                   | Description                                                                      | URL                                                                |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `openspec-explore`      | Explore existing context — thinking partner for ideas and problem investigation  | [SKILL.md](.opencode/skills/openspec-explore/SKILL.md)             |
| `openspec-new`          | Start a new OpenSpec change with structured step-by-step artifact creation       | [SKILL.md](.opencode/skills/openspec-new-change/SKILL.md)          |
| `openspec-propose`      | Propose a change with all artifacts (proposal, specs, design, tasks) in one step | [SKILL.md](.opencode/skills/openspec-propose/SKILL.md)             |
| `openspec-ff`           | Fast-forward through all artifact creation without stepping through each one     | [SKILL.md](.opencode/skills/openspec-ff-change/SKILL.md)           |
| `openspec-continue`     | Continue working on a change by creating the next artifact                       | [SKILL.md](.opencode/skills/openspec-continue-change/SKILL.md)     |
| `openspec-apply`        | Implement tasks from an OpenSpec change                                          | [SKILL.md](.opencode/skills/openspec-apply-change/SKILL.md)        |
| `openspec-sync`         | Sync delta specs from a change to main specs                                     | [SKILL.md](.opencode/skills/openspec-sync-specs/SKILL.md)          |
| `openspec-verify`       | Verify implementation matches change artifacts before archiving                  | [SKILL.md](.opencode/skills/openspec-verify-change/SKILL.md)       |
| `openspec-archive`      | Archive a completed change after implementation                                  | [SKILL.md](.opencode/skills/openspec-archive-change/SKILL.md)      |
| `openspec-bulk-archive` | Archive multiple completed changes at once                                       | [SKILL.md](.opencode/skills/openspec-bulk-archive-change/SKILL.md) |
| `openspec-onboard`      | Guided onboarding — walk through a complete OpenSpec workflow cycle              | [SKILL.md](.opencode/skills/openspec-onboard/SKILL.md)             |

### Backend Skills (apps/server/)

| Skill                     | Description                                                                       | URL                                                         |
| ------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `nodejs-backend-patterns` | Production-ready Express/Fastify: middleware, error handling, auth, API design    | [SKILL.md](.agents/skills/nodejs-backend-patterns/SKILL.md) |
| `postgresql-table-design` | PostgreSQL schema design: data types, indexing, constraints, performance patterns | [SKILL.md](.agents/skills/postgresql-table-design/SKILL.md) |
| `prisma-postgres`         | Prisma Postgres setup, Management API, provisioning, and connection handling      | [SKILL.md](.agents/skills/prisma-postgres/SKILL.md)         |

### Frontend Skills (apps/client/)

| Skill                         | Description                                                                            | URL                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `vercel-react-best-practices` | React/Next.js performance optimization: waterfall elimination, bundle size, re-renders | [SKILL.md](.agents/skills/vercel-react-best-practices/SKILL.md) |
| `shadcn`                      | shadcn/ui: CLI components, theming, composition patterns, Tailwind integration         | [SKILL.md](.agents/skills/shadcn/SKILL.md)                      |
| `tailwind-design-system`      | Tailwind CSS v4: design tokens, component libraries, responsive patterns               | [SKILL.md](.agents/skills/tailwind-design-system/SKILL.md)      |
| `storybook`                   | Storybook stories, CSF 3.0, Args, Decorators, Parameters                               | [SKILL.md](.agents/skills/storybook/SKILL.md)                   |
| `modern-javascript-patterns`  | ES6+ patterns: async/await, destructuring, functional programming, modules             | [SKILL.md](.agents/skills/modern-javascript-patterns/SKILL.md)  |

### Testing Skills

| Skill                       | Description                                                                  | URL                                                           |
| --------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `vitest`                    | Vitest config, test suites, mocks (vi.fn), code coverage, parallel execution | [SKILL.md](.agents/skills/vitest/SKILL.md)                    |
| `react-testing-library`     | React Testing Library: user-centric queries, user-event, async utilities     | [SKILL.md](.agents/skills/react-testing-library/SKILL.md)     |
| `playwright-best-practices` | Playwright E2E: POM, API mocking, auth, accessibility, visual regression     | [SKILL.md](.agents/skills/playwright-best-practices/SKILL.md) |
| `test-driven-development`   | TDD: write test first, watch it fail, write minimal code to pass             | [SKILL.md](.agents/skills/test-driven-development/SKILL.md)   |

### Security Skills

| Skill                  | Description                                                                      | URL                                                      |
| ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `owasp-security-check` | OWASP Top 10 audit: SQLi, XSS, auth/authz, CORS, rate limiting, input validation | [SKILL.md](.agents/skills/owasp-security-check/SKILL.md) |

## Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                   | Skill                         |
| -------------------------------------------------------- | ----------------------------- |
| Auditing code for security vulnerabilities before merge  | `owasp-security-check`        |
| Building a new API endpoint, middleware, or auth flow    | `nodejs-backend-patterns`     |
| Changing Prisma schema, running migrations               | `prisma-postgres`             |
| Committing changes                                       | `commit-all`                  |
| Creating a new OpenSpec change (step by step)            | `openspec-new`                |
| Creating a new OpenSpec change (all artifacts at once)   | `openspec-propose`            |
| Creating or updating shadcn/ui components                | `shadcn`                      |
| Designing or reviewing PostgreSQL table schemas          | `postgresql-table-design`     |
| Escribir o modificar historias Storybook                 | `storybook`                   |
| Exploring a topic before starting a change               | `openspec-explore`            |
| Fast-forwarding through all artifacts                    | `openspec-ff`                 |
| Fixing a bug or implementing a feature                   | `test-driven-development`     |
| Implementing tasks from an OpenSpec change               | `openspec-apply`              |
| Interviewing the user about a plan or design (Phase 0)   | `grill-me`                    |
| Optimizing React component rendering performance         | `vercel-react-best-practices` |
| Refactoring legacy code to modern JavaScript patterns    | `modern-javascript-patterns`  |
| Starting caveman mode for ultra-compressed communication | `caveman`                     |
| Styling components with Tailwind CSS classes             | `tailwind-design-system`      |
| Syncing delta specs to main specs                        | `openspec-sync`               |
| Verifying implementation matches change artifacts        | `openspec-verify`             |
| Writing E2E tests with Playwright                        | `playwright-best-practices`   |
| Writing React component tests with Testing Library       | `react-testing-library`       |
| Writing unit/integration tests with Vitest               | `vitest`                      |

## Environment Variables

Copy `.env.example` to `.env` in `apps/client/` and `apps/server/`.
