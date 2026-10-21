# Spec Delta

## Purpose

Module-by-module TypeScript conversion of `apps/server` (Fase 2): the 24 modules' `dao/service/routes/controller` layer (schemas already `.ts` from Fase 1), module-internal extras, colocated unit tests, the routes registry, and the workspace `tests/` directory — 137 files in scope, 128 converted in ascending risk order and 9 removed by the knip dead-code audit before conversion.

## ADDED Requirements

### Requirement: Modules convert vertically in ascending risk order

The 24 modules SHALL be converted module-by-module (dao → service → routes → controller + colocated test) following the order `settings → attendance → news → users → auth → events → resto`, and a module SHALL NOT start before the previous one's gates pass.

#### Scenario: module unit is coherent

- **WHEN** a module finishes conversion
- **THEN** all its remaining `.js` files (dao, service, routes, controller, module extras, colocated tests) are `.ts` in the same batch
- **AND** the four gates exit 0 before the next module starts

### Requirement: Dead code is removed before conversion

`clientOrder` and `providerOrder` are SUPPRESSED in `knip.jsonc` (`workspaces.apps.server.ignore`) — `npm run knip:server` does not report them, so the audit SHALL use direct evidence (grep of consumers in `src/` + verification that `src/routes/v1/index.js` registers 23 modules) BEFORE any conversion: modules without live consumers SHALL be deleted in a `chore` commit (including cleanup of their `knip.jsonc` ignore entries); modules with live consumers SHALL be converted normally with the contradiction registered in tasks. The closure counter branch is frozen by this audit result.

#### Scenario: dead module is not typed

- **WHEN** the audit confirms `clientOrder`/`providerOrder` have no live consumers (grep + routes registry)
- **THEN** the files are deleted (never converted to `.ts`) and their `knip.jsonc` ignore entries are removed in the same commit
- **AND** the deletion commit precedes any module conversion of that module
- **AND** the closure counter becomes `164/227` (with deletion) instead of `173/236` (without deletion)

### Requirement: Tests convert with their modules

Colocated unit tests in `src/modules/` (14) SHALL convert in the same batch as their module; the `tests/` directory (20 tracked files) SHALL convert within this change, with `setupGlobal`/`setupTest`/`test-server` updating the vitest `setupFiles` references in the same commit.

#### Scenario: suite keeps running through conversion

- **WHEN** `tests/setupTest.js` becomes `setupTest.ts` (and `setupGlobal.js` becomes `setupGlobal.ts`)
- **THEN** `setupFiles` AND `globalSetup` in `vitest.config.js`/`vitest.smoke.config.js` point to the new paths in the same commit (`globalSetup` executes the DB seeding — breaking it breaks every run)
- **AND** `npm run test:unit` reports the same passing test count as the pre-conversion baseline (175)

### Requirement: Routes registry converts after all modules

`src/routes/v1/index.js` SHALL convert to `.ts` only after every module's `routes.js` is `.ts`, and the mounted router behavior SHALL be unchanged.

#### Scenario: registry sees typed modules

- **WHEN** `routes/v1/index.ts` is committed
- **THEN** all imported module routers are already `.ts`
- **AND** the server mounts the same routes (verified by `test:unit` and, in CI, smoke tests)

### Requirement: Closure updates the migration counter

At closure the progress counter SHALL reflect the audit branch frozen by tasks 0.1/0.2 in `docs/CONTEXT-CICD.md` §12.2 — `173/236 (Fase 2 — módulos)` if `clientOrder`/`providerOrder` were migrated, `164/227 (Fase 2 — módulos, 9 muertos eliminados)` if deleted — parent task 3.2 SHALL be checked, and `npx openspec validate server-ts-phase2-modules --strict` SHALL pass.

#### Scenario: closure state is verifiable

- **WHEN** all tasks are checked
- **THEN** `git ls-files` shows no `.js` under `src/modules/`, `src/routes/`, or `tests/` (excluding generated `tests/coverage/`)
- **AND** knip reports no new dead code and no new explicit `any` exists in converted files
