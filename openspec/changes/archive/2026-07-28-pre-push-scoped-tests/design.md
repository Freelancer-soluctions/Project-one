## Context

The project is a monorepo with two main workspaces (`apps/server` and `apps/client`) plus an E2E suite. The current `.husky/pre-push` hook runs the full test suite (`npm run test:unit` + `npm run test:integration`), which takes several minutes and frequently exceeds GitHub's SSH timeout of ~30 seconds.

Industry best practice (Vitest docs, Husky docs, Nx Affected) recommends running **only scoped tests** in pre-push hooks, deferring full suites and integration/E2E tests to CI.

**Current state:**
- `.husky/pre-push` runs `npm run test:unit` + `npm run test:integration` (FULL suites)
- `package.json` root already has `test:changed` script delegating to workspaces
- `apps/server/package.json` has `"test:changed": "vitest run --changed"`
- `apps/client/package.json` has `"test:changed": "vitest run --changed"`
- `docs/testing-architecture.md` (620 lines) documents test organization but lacks execution tier documentation
- No changes needed to package.json scripts — the fix is purely in hook wiring

## Goals / Non-Goals

**Goals:**
- Rewrite `.husky/pre-push` to use `vitest --changed origin/main` for both server and client workspaces
- Add section "7.5. Estrategia de Ejecución por Capas" to `docs/testing-architecture.md`
- Update section 11 "Decisiones Arquitectónicas" in the same doc with new ADR rows
- Ensure pre-push completes within 30 seconds (GitHub SSH timeout)

**Non-Goals:**
- NOT modifying any npm scripts (all existing scripts remain intact)
- NOT modifying Vitest configuration files
- NOT adding new dependencies
- NOT modifying CI pipeline configuration
- NOT changing the pre-commit hook (security scans remain as-is)

## Decisions

### Decision 1: Use `vitest --changed origin/main` instead of `npm run test:changed`

**Chosen:** Direct `npx vitest run --changed origin/main` per workspace (not the npm script wrapper)

**Rationale:**
- `npm run test:changed` delegates to workspaces but we need explicit `--config` flags to target each workspace's Vitest config
- Direct invocation gives us control over the config path and diff base
- `--changed origin/main` uses `git diff origin/main...HEAD` to find affected files — this is the most accurate approach for monorepos without Nx/Turborepo

**Alternatives considered:**
- `HEAD~1`: Only covers last commit, misses earlier commits on the branch → rejected
- `git merge-base HEAD origin/main`: More precise but `--changed` uses this internally → not needed
- Full suite with timeout wrapper: Brittle, doesn't solve the problem → rejected

### Decision 2: Diff base = `origin/main` (not `HEAD~1`)

**Rationale:**
- `HEAD~1` only covers the last commit — if a branch has 5 commits, only the last one's changes would trigger tests
- `origin/main` covers ALL commits on the feature branch since fork point
- This is the industry standard: Nx Affected, Turborepo `--filter`, and Vitest `--changed` all recommend `origin/main`
- Internally, Vitest uses `git diff origin/main...HEAD` which is equivalent to `git merge-base HEAD origin/main`

### Decision 3: E2E and DB Integration tests excluded from pre-push

**Rationale:**
- E2E (Playwright) requires browser binaries, a running server, and is inherently slow + flaky
- DB integration tests (Prisma + Supertest) require PostgreSQL — unavailable in pre-push context
- Both belong in CI where infrastructure, caching, and retry logic are available
- Pre-push is for fast feedback on scoped unit tests only (~10-15s typical)

### Decision 4: Three-tier strategy documented in testing-architecture.md

**Rationale:**
- The doc currently covers testing strategy (what) and organization (where) but NOT execution tier (when/where tests run)
- Developers need a clear mental model: pre-commit = lint, pre-push = scoped tests, CI = full suite
- The 30s GitHub SSH timeout is a hard constraint that should be explicitly documented to prevent future regressions

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **origin/main not available locally** (fresh clone without fetch) | Hook should fail with clear error message instructing developer to run `git fetch origin main` |
| **--changed misses some affected tests** (false negatives) | CI still runs the full suite — this is a feedback-speed optimization, not a quality gate replacement |
| **Monorepo cross-workspace dependencies** (server change affects client tests) | `--changed` tracks file-level dependencies via Vite module graph — cross-workspace changes are detected accurately |
| **Hook takes >30s on large changes** | Unlikely for typical changes (<10-15s); if it happens, push still fails but tests complete locally — developer can use `--no-verify` with explicit acknowledgment |
| **VM/docker environments without git history** | `--changed` requires git history; CI already uses full suite, so this only affects local development |

## Migration Plan

1. Update `.husky/pre-push` with new content
2. Add section 7.5 to `docs/testing-architecture.md`
3. Update section 11 table in `docs/testing-architecture.md`
4. Verify vitest configs support `--changed origin/main`
5. Test the hook manually with synthetic changes to confirm scoped tests run and complete under 30s

**Rollback:** Restore previous `.husky/pre-push` from git history via `git checkout HEAD -- .husky/pre-push`

## Open Questions

- Should we add a `git fetch origin main` step at the beginning of the hook to ensure `origin/main` is fresh? (Currently evaluating — adds network call but prevents stale diff base errors)
- Should the hook use `--reporter=verbose` for better debugging on failure? (Default jest-like reporter should suffice)
