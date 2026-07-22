## Context

This monorepo uses npm workspaces with two applications (`apps/server` — Express, `apps/client` — React) and an `e2e/` workspace for Playwright tests. Currently, each workspace defines its own Vitest configuration independently, duplicating common settings like `globals: true` and `coverage.provider: 'v8'`. Test file naming is inconsistent: client uses `*.ui.test.jsx`, `*.unit.test.jsx`, and `*.integration.test.jsx` patterns, while server uses generic `*.test.js` inside `tests/unit/` and `tests/integration/` directories without the `.unit.` or `.integration.` infix in the filename. Root `package.json` scripts use `--workspace=<name>` flags rather than the more concise `--workspaces --if-present` pattern.

## Goals / Non-Goals

**Goals:**
- Introduce a shared `vitest.shared.js` configuration at the project root that holds common Vitest options (`globals: true`, `coverage` with `v8` provider)
- Refactor `apps/server/vitest.config.js` and `apps/client/vitest.config.js` to use `mergeConfig` from `vitest/config` to extend the shared config
- Rename server unit test files (`tests/unit/*.test.js` → `*.unit.test.js`) and the one remaining non-compliant integration file (`tests/integration/notes-mentions.test.js` → `notes-mentions.integration.test.js`). 3 of 4 integration files already use the correct `*.integration.test.js` naming.
- Standardize root `package.json` scripts to use `--workspaces --if-present` and add missing scripts: `test:watch`, `test:changed`, `test:ci`, `test:server`, `test:client`
- Standardize workspace `package.json` scripts to include: `test:watch`, `test:changed`, `test:coverage`, `test:unit`, `test:integration`
- Update `docs/testing-architecture.md` to reflect all the above changes

**Non-Goals:**
- Changing the test runner itself (stays Vitest)
- Changing the E2E test setup (Playwright in `e2e/` workspace)
- Changing the mocking strategy (MSW, vi.mock, etc.)
- Adding new test infrastructure (no new tools or frameworks)
- Changing the client test naming (already follows convention)

## Decisions

### 1. Shared config location and approach
- **Decision**: Create `vitest.shared.js` at the project root exporting a base Vitest config object
- **Rationale**: A single JS file at root is the simplest approach — no new dependencies, no build tooling required. The shared config exports a plain object (not `defineConfig`) so each workspace can import it and merge with `mergeConfig` from `vitest/config`, adding workspace-specific settings (environment, plugins, setup files)
- **Alternatives considered**:
  - *Vitest workspace config*: More complex setup, overkill for two workspaces
  - *Separate npm package*: Unnecessary overhead for shared config

### 2. Test naming convention for server
- **Decision**: Rename `tests/unit/*.test.js` → `*.unit.test.js` and rename the lone non-compliant file `tests/integration/notes-mentions.test.js` → `notes-mentions.integration.test.js`. The remaining 3 integration files already follow the naming convention.
- **Rationale**: Matches the existing client convention (`*.unit.test.jsx`, `*.integration.test.jsx`) and makes test intent immediately clear from the filename alone. Vitest `include` patterns can target specific test types easily
- **Alternatives considered**:
  - *Keep existing naming*: Inconsistent with client, ambiguous intent

### 3. Root script pattern
- **Decision**: Use `--workspaces --if-present` for all root test scripts
- **Rationale**: Built-in npm workspaces feature. `--if-present` prevents errors when a workspace lacks a particular script. More concise than listing individual workspaces
- **Alternatives considered**:
  - *Explicit workspace list*: Harder to maintain as new workspaces are added
  - *turbo/nx*: Overkill for current monorepo scale

## Risks / Trade-offs

- **Risk**: 3 orphan test files exist outside `tests/unit/` and `tests/integration/` directories (`tests/bin/server.test.js`, `tests/components/role/role.test.js`, `tests/users-path-param-validation.test.js`)
  → **Mitigation**: All 3 orphans moved to `tests/orphans/` folder (consolidated exception location). `server.test.js` is `describe.todo` (intentional skip). `role.test.js` and `users-path-param-validation.test.js` are `describe.skip` (DB-dependent). This keeps them discoverable but out of the main test structure.

- **Risk**: Renaming server test files may break git blame history
  → **Mitigation**: Use `git mv` to preserve history; document the rename in the commit message
- **Risk**: `mergeConfig` has different behavior for different config shapes (arrays vs objects)
  → **Mitigation**: Test that coverage and globals settings pass through correctly in both workspace configs after migration
- **Risk**: Scripts like `test:changed` in root may be unused initially
  → **Mitigation**: Add them to docs so the team knows they exist; they will become useful as the project grows
