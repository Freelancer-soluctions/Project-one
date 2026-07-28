## 1. Update Pre-Push Hook

- [x] 1.1 Rewrite `.husky/pre-push` to run `npx vitest run --changed origin/main --config apps/server/vitest.config.js` and `npx vitest run --changed origin/main --config apps/client/vitest.config.js`, replacing the current `npm run test:unit` + `npm run test:integration` invocations
- [x] 1.2 Ensure `set -e` guard is present and add echo statements for progress feedback in the hook script
- [x] 1.3 Add `origin/main` availability check in hook: use `git rev-parse --verify origin/main` before running vitest; fail with clear error message instructing developer to run `git fetch origin main` if unavailable

## 2. Document Three-Tier Testing Strategy

- [x] 2.1 Add new section "7.5. Estrategia de Ejecución por Capas (Pre-commit / Pre-push / CI)" to `docs/testing-architecture.md` between current section 7 and section 8, documenting the three tiers with their time budgets, responsibilities, and rules
- [x] 2.2 Include the 30s SSH timeout constraint, diff base rationale (`origin/main` vs `HEAD~1`), and caching guidance in the new section
- [x] 2.3 Update section 11 "Decisiones Arquitectónicas" table in `docs/testing-architecture.md` with new rows documenting: (a) three-tier hook strategy adopted, (b) `origin/main` as diff base, (c) E2E + DB-integration deferred to CI

## 3. Verify Configuration Compatibility

- [x] 3.1 Verify `apps/server/vitest.config.js` is compatible with `--changed origin/main` flag (no path overrides that break the flag)
- [x] 3.2 Verify `apps/client/vitest.config.js` is compatible with `--changed origin/main` flag, specifically testing multi-project mode (projects: [unit, integration]) works correctly — only affected tests run, client integration tests excluded from pre-push

## 4. Test and Finalize

- [x] 4.1 Test the hook manually with synthetic changes to confirm scoped tests run and complete under 30 seconds
- [x] 4.2 Verify that `git push` succeeds with the new hook (using a test branch)
- [x] 4.3 Remove the test branch after verification
