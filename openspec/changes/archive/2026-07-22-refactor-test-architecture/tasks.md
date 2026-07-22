## 1. Shared Vitest Configuration

- [x] 1.1 Create `vitest.shared.js` at project root exporting a base config object with `test.globals: true` and `test.coverage.provider: 'v8'` and `test.coverage.reporter: ['text', 'html']`
- [x] 1.2 Update `apps/server/vitest.config.js` to import `../../vitest.shared.js` from the root shared config and use `mergeConfig` from `vitest/config`, preserving server-specific settings (environment: 'node', setupFiles, coverage.reportsDirectory)
- [x] 1.3 Update `apps/client/vitest.config.js` to import the root shared config and use `mergeConfig` from `vitest/config`, preserving client-specific settings (React plugin, path alias, environment: 'jsdom', setupFiles, css, deps.optimizer, include)

## 2. Server Test File Renaming

- [x] 2.1 Use `git mv` to rename all files in `apps/server/tests/unit/` from `*.test.js` to `*.unit.test.js`
- [x] 2.2 Rename `apps/server/tests/integration/notes-mentions.test.js` to `notes-mentions.integration.test.js` using `git mv`. Note: 3 of 4 files already use `*.integration.test.js` (`events-validation.integration.test.js`, `events-soft-delete.integration.test.js`, `events-combined-filters.integration.test.js`) — no changes needed for those.
- [x] 2.3 Update any test file imports or references that depend on the old filenames
- [x] 2.4 Run server tests to verify renamed files are picked up correctly
- [x] 2.5 Handle orphan test files outside `tests/unit/` and `tests/integration/`:
    - `tests/bin/server.test.js` -> moved to `tests/orphans/bin/server.test.js` (describe.todo)
    - `tests/components/role/role.test.js` -> moved to `tests/orphans/role.test.js` (describe.skip DB)
    - `tests/users-path-param-validation.test.js` -> moved to `tests/orphans/users-path-param-validation.test.js` (describe.skip DB)
    - All orphans consolidated in `tests/orphans/` for discoverability but separation from active tests

## 3. Root Package.json Scripts

- [x] 3.1 Update root `package.json` test scripts: change `test` to `npm run test:unit && npm run test:integration && npm run test:e2e` (preserve existing behavior with workspaces)
- [x] 3.2 Change `test:unit` to use `--workspaces --if-present` pattern: `npm run test:unit --workspaces --if-present`
- [x] 3.3 Change `test:integration` to use `--workspaces --if-present` pattern: `npm run test:integration --workspaces --if-present`
- [x] 3.4 Add `test:watch` script: `npm run test:watch --workspaces --if-present`
- [x] 3.5 Add `test:changed` script: `npm run test:changed --workspaces --if-present`
- [x] 3.6 Add `test:ci` script: `npm run test --workspaces --if-present -- --reporter=junit`
- [x] 3.7 Add `test:server` script: `npm run test --workspace=server-express`
- [x] 3.8 Add `test:client` script: `npm run test --workspace=client-react`

## 4. Server Package.json Scripts

- [x] 4.1 Add `test:watch` script: `vitest --watch`
- [x] 4.2 Add `test:changed` script: `vitest --changed`
- [x] 4.3 Keep existing `test:coverage` and ensure it uses `vitest run --coverage`
- [x] 4.4 Update `test:unit` script: use `".unit.test.js"` filename filter (compatible with colocated layout in `src/` and legacy `tests/unit/`)
- [x] 4.5 Update `test:integration` script: use `".integration.test.js"` filename filter (compatible with integration tests in `tests/integration/<module>/`)

## 5. Client Package.json Scripts

- [x] 5.1 Add `test:watch` script: `vitest --watch`
- [x] 5.2 Add `test:changed` script: `vitest --changed`
- [x] 5.3 Keep existing `test:coverage` and ensure it uses `vitest run --coverage`
- [x] 5.4 Add `test:unit` script: `vitest run src --include='src/**/*.unit.test.{js,jsx}'`
- [x] 5.5 Add `test:integration` script: `vitest run --include='src/**/*.integration.test.{js,jsx}'`

## 6. Documentation Update

- [x] 6.1 Update `docs/testing-architecture.md` section 5 (Workspaces) to reflect new root scripts using `--workspaces --if-present` pattern and list all available scripts
- [x] 6.2 Update `docs/testing-architecture.md` section 7 (Backend test directory structure) with `*.unit.test.js` / `*.integration.test.js` naming
- [x] 6.3 Update `docs/testing-architecture.md` section 10 (Decisiones Arquitectónicas) with shared config + workspaces pattern

## 7. Hybrid Test Colocation (Adopt Consensus 2025-2026)

- [x] 7.1 Research test organization patterns: colocated vs centralized vs hybrid. Sources: NestJS docs, Kent C. Dodds, TypeScript TV, Clean Architecture, Ghost/Keystone/Strapi. DONE — research confirms hybrid is consensus.
- [x] 7.2 Update `docs/testing-architecture.md` — add new "Test Organization: Hybrid Approach" section citing industry authorities (NestJS, KCD, TypeScript TV, Clean Architecture, Ghost/Keystone/Strapi)
- [x] 7.3 Update `docs/testing-architecture.md` section 7 (Backend) to document hybrid pattern: colocated unit tests in `src/modules/<module>/` + centralized integration in `tests/integration/`
- [x] 7.4 Update `docs/testing-architecture.md` section 10 (Decisiones Arquitectónicas) — add hybrid approach decision row
- [x] 7.5 Update `apps/server/vitest.config.js` — extend `test.include` to accept both colocated (`src/**/*.unit.test.js`) and centralized (`tests/unit/**/*.unit.test.js`) patterns
- [x] 7.6 Verify both paths work: create a colocated sample test in `src/modules/_template/_template.service.unit.test.js` and run `npm run test:server`
- [x] 7.7 Document in `apps/server/AGENTS.md` the move-when-touched migration strategy: existing 161 unit tests stay centralized; new unit tests go colocated; existing tests migrate only when their source module is modified

## 8. Migration Execution — Move 161 Unit Tests to Colocated Locations

- [x] 8.1 Move all 161 unit tests from `apps/server/tests/unit/` to colocated locations in `apps/server/src/modules/<module>/` preserving module structure
- [x] 8.2 Delete empty `apps/server/tests/unit/` directory (keep only `manual-test.js` if it exists as a script)
- [x] 8.3 Update `apps/server/vitest.config.js` — remove `tests/unit/**/*.unit.test.js` from `test.include` since all unit tests are now colocated
- [x] 8.4 Run `npm run test:unit` to verify all 161+ tests pass from new locations
- [x] 8.5 Update `docs/testing-architecture.md` section 8.4 to reflect migration completed (replace migration strategy with completion status)
- [x] 8.6 Update `docs/testing-architecture.md` section 10 decision table to reflect migration completed
- [x] 8.7 Update `apps/server/AGENTS.md` — update migration strategy note to reflect migration completed; move-when-touched remains for future changes
