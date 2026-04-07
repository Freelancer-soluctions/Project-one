# Project One

Monorepo with Node.js/Express backend and React client.

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
├── server/       # Express backend (Prisma, SQLite)
└── e2e/          # Playwright E2E tests
```

## Workspace Commands

### Client (React)

```bash
cd apps/client && npm run dev          # Dev server (port 5173)
cd apps/client && npm run storybook    # Storybook (port 6006)
cd apps/client && npx vitest run       # Run tests once
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
| Backend  | Express, Prisma, SQLite                                       |
| Testing  | Vitest, Testing Library, Playwright, MSW                      |

## Important Conventions

- **Commits**: Conventional Commits enforced by Husky
- **Testing**: See [docs/testing-architecture.md](docs/testing-architecture.md)
- **Code Style**: See [docs/code-style.md](docs/code-style.md)

## Skills

- `vercel-react-best-practices` - React optimization (load with `/skill`)
- `openspec-*` skills - Change management

## Environment Variables

Copy `.env.example` to `.env` in `apps/client/` and `apps/server/`.
