# Spec Delta

## Purpose

Module-by-module TypeScript conversion of `apps/server` (Fase 2): the 24 modules' `dao/service/routes/controller` layer (schemas already `.ts` from Fase 1), module-internal extras, colocated unit tests, the routes registry, and the workspace `tests/` directory — 137 files converted in ascending risk order with knip dead-code removal first.

## ADDED Requirements

### Requirement: Modules convert vertically in ascending risk order

The 24 modules SHALL be converted module-by-module (dao → service → routes → controller + colocated test) following the order `settings → attendance → news → users → auth → events → resto`, and a module SHALL NOT start before the previous one's gates pass.

#### Scenario: module unit is coherent

- **WHEN** a module finishes conversion
- **THEN** all its remaining `.js` files (dao, service, routes, controller, module extras, colocated tests) are `.ts` in the same batch
- **AND** the four gates exit 0 before the next module starts

### Requirement: Dead code is removed before conversion

`clientOrder` and `providerOrder` (knip findings) SHALL be audited with `npm run knip:server` BEFORE any conversion: modules without live consumers SHALL be deleted in a `chore` commit; modules with live consumers SHALL be converted normally with the contradiction registered in tasks.

#### Scenario: dead module is not typed

- **WHEN** the audit confirms `clientOrder`/`providerOrder` have no live consumers
- **THEN** the files are deleted (never converted to `.ts`)
- **AND** the deletion commit precedes any module conversion of that module

### Requirement: Tests convert with their modules

Colocated unit tests in `src/modules/` (14) SHALL convert in the same batch as their module; the `tests/` directory (20 tracked files) SHALL convert within this change, with `setupGlobal`/`setupTest`/`test-server` updating the vitest `setupFiles` references in the same commit.

#### Scenario: suite keeps running through conversion

- **WHEN** `tests/setupTest.js` becomes `setupTest.ts`
- **THEN** `setupFiles` in `vitest.config.js`/`vitest.smoke.config.js` points to the new path in the same commit
- **AND** `npm run test:unit` reports the same passing test count as the pre-conversion baseline (175)

### Requirement: Routes registry converts after all modules

`src/routes/v1/index.js` SHALL convert to `.ts` only after every module's `routes.js` is `.ts`, and the mounted router behavior SHALL be unchanged.

#### Scenario: registry sees typed modules

- **WHEN** `routes/v1/index.ts` is committed
- **THEN** all imported module routers are already `.ts`
- **AND** the server mounts the same routes (verified by `test:unit` and, in CI, smoke tests)

### Requirement: Closure updates the migration counter

At closure the progress counter SHALL read `173/236 (Fase 2 — módulos)` in `docs/CONTEXT-CICD.md` §12.2, parent tasks 3.1 (creation) and 3.2 (tests) SHALL be checked, and `npx openspec validate server-ts-phase2-modules --strict` SHALL pass.

#### Scenario: closure state is verifiable

- **WHEN** all tasks are checked
- **THEN** `git ls-files` shows no `.js` under `src/modules/`, `src/routes/`, or `tests/` (excluding generated `tests/coverage/`)
- **AND** knip reports no new dead code and no new explicit `any` exists in converted files
