## Why

The current `.husky/pre-push` hook runs `npm run test:unit` + `npm run test:integration`, which executes the **full test suite** on every push. This violates industry best practice and causes real problems:

- **Pre-push hook time budget**: ~30 seconds max (GitHub SSH timeout)
- **Running full suite**: Takes several minutes → timeouts, push failures, developer frustration
- **Industry consensus**: Pre-push should run ONLY scoped/affected tests, not the full suite
- **E2E + Prisma integration tests**: Require DB and browsers → belong in CI only, never pre-push

This change scopes the pre-push hook to run only tests affected by changes since `origin/main`, using `vitest --changed`. It also documents the three-tier testing strategy (pre-commit / pre-push / CI) in `docs/testing-architecture.md`.

## What Changes

- **`.husky/pre-push`**: Replace `npm run test:unit` + `npm run test:integration` (full suites) with `npx vitest run --changed origin/main` for both server and client workspaces
- **`docs/testing-architecture.md`**: Insert new section "7.5. Estrategia de Ejecución por Capas (Pre-commit / Pre-push / CI)" documenting the three-tier strategy, 30s SSH timeout constraint, diff base rationale, and caching guidance
- **Section 11 "Decisiones Arquitectónicas"**: Add new rows documenting the three-tier strategy, `origin/main` as diff base, and E2E/DB-integration deferred to CI

## Capabilities

### New Capabilities
- `pre-push-scoped-testing`: Defines the behavior of the pre-push hook — scoped test execution using `vitest --changed origin/main`, with fallback logic for when `origin/main` is not available locally. E2E and DB-dependent integration tests are explicitly excluded from pre-push.

### Modified Capabilities
- _(No existing spec capabilities are modified — this change affects the CI/hook infrastructure, not feature-level requirements)_
- The existing `shared-vitest-config` spec covers Vitest configuration which remains unchanged

## Impact

- **`.husky/pre-push`**: Rewritten to use `vitest --changed origin/main` instead of full test suite
- **`docs/testing-architecture.md`**: New section 7.5 added; section 11 updated with new architectural decisions
- **Workflow impact**: Developers will see faster push times (~10-15s instead of minutes); full suite runs only in CI
- **No breaking changes**: All existing npm scripts (`test:unit`, `test:integration`, `test:changed`, etc.) remain intact
