# Contributing to Project One

Thank you for contributing! This guide covers development workflow, code standards, and PR guidelines.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev servers
npm run test         # Run all tests
npm run lint         # Lint all code
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Write or update tests
4. Ensure all checks pass locally
5. Submit a pull request

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description
```

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, ops

**Examples**:

- `feat(auth): add JWT refresh token rotation`
- `fix(server): handle null user in middleware`
- `docs(api): update endpoint documentation`

**DCO Sign-off**: All commits must include a `Signed-off-by` trailer. Commit with both flags: `git commit -S -s` (`-S` SSH-signs, `-s` adds the signoff). To add the trailer automatically on every commit, run `git config --global commit.signoff true` — the repo's traceability convention (see `docs/CONTEXT-CICD.md` §10.5).

## Pull Request Guidelines

### PR Title Format

Follow Conventional Commits: `type(scope): description`

- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, ops
- Scope: client, server, e2e, shared, config (optional)
- Description: lowercase, no period, imperative mood
- Validate locally before creating: `npm run pr:title-check -- "type: your title"`
- Create PRs with the wrapper `npm run pr:create -- --title "type: your title" --body "..."` — it validates the title before running `gh pr create`

### DCO Sign-off (Required)

All commits must include `Signed-off-by: Your Name <your@email.com>`

- Use `git commit -S -s` to SSH-sign and auto-add the trailer
- Or enable automatic signoff (the repo's traceability convention): `git config --global commit.signoff true` (see `docs/CONTEXT-CICD.md` §10.5)
- A local `commit-msg` hook (L1) and a `pre-push` re-check (L2) reject commits missing the trailer before CI does
- Email must match your Git author email
- Exemption: dependabot and other automated bots

### PR Template

Use the provided PR template when creating PRs. Include:

- Summary of changes
- Type/scope classification
- Link to related issue
- Testing evidence
- Screenshots (if UI changes)
- Pre-merge checklist

### Review Process

- CODEOWNERS defines required reviewers per component
- All required status checks must pass
- Signed commits required (SSH/GPG)

## Code Standards

### Frontend (apps/client/)

- React 18, Vite, Tailwind CSS
- shadcn/ui components
- Redux Toolkit + RTK Query
- ESLint + Prettier

### Backend (apps/server/)

- Express.js
- Prisma ORM
- PostgreSQL
- ESLint + Prettier

### Testing

- Vitest for unit/integration tests
- React Testing Library for component tests
- Playwright for E2E tests
- MSW for API mocking

## Environment Setup

1. Copy `.env.example` to `.env` in `apps/client/` and `apps/server/`
2. Install dependencies: `npm install`
3. Run migrations: `cd apps/server && npm run prisma-migration`
4. Start dev: `npm run dev`

## Code Review

- All PRs require at least 1 approval
- CODEOWNERS defines required reviewers per component
- All CI checks must pass
- Address review feedback promptly

## Questions?

Open a discussion or reach out to the team.
