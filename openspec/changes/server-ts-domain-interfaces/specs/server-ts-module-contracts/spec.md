# Spec Delta

## Purpose

Self-contained domain contracts for the 24 server modules: each module owns a `types.ts` (Entity derived from Prisma, hand-written Create/Update inputs, Filters, service result types) and its dao/service/controller signatures consume those contracts — zero behavior change, zero cross-module type imports.

## ADDED Requirements

### Requirement: Each module owns its domain types

Every module under `src/modules/` (24, including the `events/attendee` sub-module) SHALL have a `types.ts` containing: an `<Entity>` type derived from Prisma (`Prisma.<Model>GetPayload`), hand-written `Create<Entity>Input` and `Update<Entity>Input` interfaces, an `<Entity>Filters` query type, and the service result type. A module's `types.ts` SHALL NOT import types from another module (only `@prisma/client`, `joi`, `src/utils/constants`, and primitives).

#### Scenario: module isolation is verifiable

- **WHEN** the change completes
- **THEN** `ls apps/server/src/modules/*/types.ts` reports one file per module (≥ 24 including attendee)
- **AND** `grep -rn "from '\.\./\.\./" apps/server/src/modules/*/types.ts` shows only allowed utility imports
- **AND** no `types.ts` imports from another module's directory

### Requirement: Signatures consume the contracts without behavior change

The module's dao, service, and controller SHALL replace inline type-literals with imports from `./types.js`; Prisma's `WhereInput` types remain idiomatic INSIDE the dao; the controller casts `req.body`/`req.query` once per handler to the module's Input/Filter types (never `any`); runtime behavior, responses, and test outcomes SHALL be byte-identical.

#### Scenario: refactor is type-only

- **WHEN** a module's layer is refactored to the domain types
- **THEN** the four gates pass (`type-check`, `lint`, `test:unit`, `depcruise:server`)
- **AND** no new explicit `any` exists in the module (grep verifiable)
- **AND** the tests report the same counts as the pre-refactor baseline (175 unit)

### Requirement: Pattern is validated before replication

The first module (`settings`) SHALL validate the `types.ts` pattern end-to-end; if the pattern requires adjustment, the design SHALL be updated before any other module converts.

#### Scenario: pattern module gates the rollout

- **WHEN** `settings` finishes its `types.ts` + layer refactors
- **THEN** all four gates pass before any other module starts
- **AND** any pattern adjustment is reflected in the design and this spec's scenario set

### Requirement: Closure registers full contract coverage

At closure the progress note in `docs/CONTEXT-CICD.md` §12.2 SHALL read "24/24 módulos con contratos de dominio (types.ts)", no new `any` SHALL exist under `src/modules/`, and `npx openspec validate server-ts-domain-interfaces --strict` SHALL pass.

#### Scenario: closure state is verifiable

- **WHEN** all tasks are checked
- **THEN** the contract count is 24/24 and the gates are green
- **AND** the strict validation passes
