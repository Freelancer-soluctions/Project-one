## Why

The current test architecture lacks a standardized naming convention for test files across the monorepo, resulting in inconsistent patterns (`*.test.js`, `*.spec.js`, `*.ui.test.jsx`) that make it difficult to distinguish unit from integration tests at a glance. There is no shared Vitest configuration, causing duplication of common settings (`globals: true`, `coverage` with `v8` provider) across workspace configs. The root `package.json` test scripts use workspace-specific flags instead of the more maintainable `--workspaces --if-present` pattern, and several useful scripts (`test:watch`, `test:changed`, `test:ci`) are missing. Standardizing these conventions improves developer experience, CI pipeline efficiency, and long-term maintainability.

## What Changes

1. **Server test file naming** — Rename all server test files to follow `*.unit.test.js` / `*.integration.test.js` pattern (e.g., `tests/unit/auth.test.js` → `tests/unit/auth.unit.test.js`)
2. **Shared Vitest config** — Create `vitest.shared.js` at project root with shared options: `globals: true`, coverage with `v8` provider
3. **Server config update** — Update `apps/server/vitest.config.js` to use `mergeConfig` to extend the shared config
4. **Client config update** — Update `apps/client/vitest.config.js` to use `mergeConfig` to extend the shared config
5. **Root scripts** — Update root `package.json` test scripts: use `--workspaces --if-present`, add `test:watch`, `test:changed`, `test:ci`, `test:server`, `test:client`
6. **Server scripts** — Update `apps/server/package.json` scripts: add `test:watch`, `test:changed`, `test:coverage`, `test:unit`, `test:integration`
7. **Client scripts** — Update `apps/client/package.json` scripts: add `test:watch`, `test:changed`, `test:coverage`, `test:unit`, `test:integration`
8. **Testing docs** — Update `docs/testing-architecture.md` to reflect all the above changes

## Capabilities

### New Capabilities
- `shared-vitest-config`: Shared configuration baseline for all workspaces using Vitest, ensuring consistent globals, coverage provider, and reporting settings
- `standardized-test-naming`: Convention and enforcement of `*.unit.test.*` / `*.integration.test.*` naming for test files across the monorepo

### Modified Capabilities
<!-- No existing spec-level capabilities are being modified — these are infrastructure and convention changes only -->

## Impact

- **Root `package.json`** — Scripts section restructured, new npm scripts added
- **`apps/server/package.json`** — New scripts added for watch, changed, coverage, unit, integration modes
- **`apps/client/package.json`** — New scripts added for watch, changed, coverage, unit, integration modes
- **`apps/server/vitest.config.js`** — Refactored to extend shared config via `mergeConfig`
- **`apps/client/vitest.config.js`** — Refactored to extend shared config via `mergeConfig`
- **`vitest.shared.js`** — New file at project root
- **`docs/testing-architecture.md`** — Updated sections 5 (workspaces) and 7 (conventions/naming)
- **Server test files** — Renamed to include `.unit.` or `.integration.` suffix
- **No breaking changes** to public APIs or dependencies
