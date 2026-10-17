# Spec Delta

## Purpose

TypeScript conversion of the 36 dependency-graph leaf files of `apps/server` (Fase 1 of the parent change `server-typescript-migration`): config, crypto, logger, domain constants and Joi schemas — converted file-by-file with the strangler-fig protocol, keeping every commit green and every consumer (still `.js`) untouched.

## ADDED Requirements

### Requirement: Leaf file selection matches the parent scope

The change SHALL convert exactly the 36 files enumerated by parent task 2.1 — `config/{db,dotenv,cors}.js`, `config/aws/{secret-manager.client,secrets}.js`, `common/crypto/{hashValue,index}.js`, `logger/{dev,uat,production,index}.js`, `utils/constants/enums.js`, `utils/joiSchemas/joi.js`, the 22 `src/modules/*/schemas/*.joi.js` and `src/modules/events/schemas/event-rsvp.js` — and SHALL NOT convert files assigned to later phases (middleware, socket, docs, app, bin, tests, workspace root configs, prisma seed, scripts).

#### Scenario: scope boundary is respected

- **WHEN** the change completes
- **THEN** exactly 36 `.ts` files exist under `apps/server/src/` corresponding to the enumerated set
- **AND** `middleware/`, `socket/`, `docs/`, `app.js`, `bin/`, colocated tests, and workspace root configs remain `.js`

### Requirement: Per-file conversion protocol preserves runtime behavior

Each file SHALL be converted via `git mv` (rename, preserving history) with public signatures typed; relative imports SHALL keep their `.js` suffix (resolved to the `.ts` twin by `moduleResolution: nodenext` with `allowJs`); no new `any` SHALL be introduced; redundant JSDoc `@param`/`@returns` annotations SHALL be removed in the same commit as their converted file.

#### Scenario: rename keeps history and imports resolve

- **WHEN** `git mv src/config/dotenv.js src/config/dotenv.ts` is committed and a consumer `.js` file still imports `'./dotenv.js'`
- **THEN** `git log --follow` shows continuous history for the file
- **AND** `npm run type-check` (root) resolves the import without modifying the consumer
- **AND** Node executes the server exactly as before (noEmit, no build step)

#### Scenario: no new any leaks in

- **WHEN** the converted files are grepped for explicit `: any`
- **THEN** no new explicit `any` exists in the 36 converted files (JS-inferred positions are reported, not created)

### Requirement: Domain typing uses erasable syntax only

Constants and enums SHALL be typed with `as const` objects plus derived union types, never TypeScript `enum` declarations; the exported runtime values SHALL remain byte-identical to the pre-conversion JavaScript.

#### Scenario: enums stay runtime-compatible

- **WHEN** `utils/constants/enums.ts` is converted
- **THEN** the module exports the same runtime object shape as before (no behavioral diff for the 389 existing consumers)
- **AND** the file contains no `enum` keyword (compatible with a future `erasableSyntaxOnly` world)

### Requirement: dotenv gains a typed read signature without runtime validation

`config/dotenv.ts` SHALL expose `(key: EnvKey) => string` where `EnvKey` is the union of keys actually read by `src/` today; no runtime validation library (zod/env-schema) SHALL be added by this change.

#### Scenario: typed access, unchanged behavior

- **WHEN** the 13 importers of dotenv (23 call sites) call it after conversion
- **THEN** their calls type-check against `EnvKey` and their runtime behavior is identical (same fallback semantics)

### Requirement: Batch-ordered conversion with mandatory gates

Conversion SHALL proceed in 3 dependency-ordered batches — (1) 31 pure leaves, (2) `cors` + `aws/secrets` + `crypto/index` + `logger/index`, (3) `config/db` last (its only out-of-change dependency, `middleware/encription-prisma-middleware.js`, is resolved via `allowJs`) — and after each batch the four gates SHALL exit 0: root `npm run type-check`, `npm run lint --workspace=server-express`, `apps/server npm run test:unit`, `npm run depcruise:server`.

#### Scenario: batch gates block advancement

- **WHEN** a batch finishes converting its files
- **THEN** all four gates run and exit 0 before any file of the next batch is converted
- **AND** the accumulated `.ts` count is recorded in tasks.md (31 → 35 → 36)

### Requirement: Progress is registered at closure

At closure the change SHALL update the progress counter in `docs/CONTEXT-CICD.md` (§12.2) to `36/236 (Fase 1 — hojas)`, annotate parent task 1.8 with the delta, and pass `npx openspec validate server-ts-phase1-leaves --strict`.

#### Scenario: closure state is verifiable

- **WHEN** all tasks are checked
- **THEN** `git ls-files` reports 36 `.ts` and 200 remaining `.js` in `apps/server` (208 src + 20 tests + 8 configs/prisma/scripts minus the 36 converted)
- **AND** the strict validation of this change passes
