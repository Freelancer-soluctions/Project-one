# server-ts-module-contracts Specification

## Purpose

Self-contained domain contracts for the 24 server modules: each module owns a `types.ts` (Entity derived from Prisma, hand-written Create/Update inputs, Filters, service result types) and its dao/service/controller signatures consume those contracts — zero behavior change, zero cross-module type imports.

## Requirements

### Requirement: Each module owns its domain types

Every module under `src/modules/` (23 total: 22 module directories plus the `events/attendee` sub-module) SHALL have a `types.ts` containing: an `<Entity>` type derived from Prisma (`Prisma.<Model>GetPayload`), hand-written `Create<Entity>Input` and `Update<Entity>Input` interfaces, an `<Entity>Filters` query type, and a service result type that MIRRORS the module's existing response shape (zero-behavior-change precedence over template uniformity). Modules without a dao (e.g. `security`: routes only) SHALL have minimal surface types instead of the full Entity/Inputs/Filters set. A module's `types.ts` SHALL NOT import types from another module (only `@prisma/client`, `joi`, `src/utils/constants`, and primitives).

#### Scenario: module isolation is verifiable

- **WHEN** the change completes
- **THEN** `find apps/server/src/modules -name types.ts | wc -l` reports 23 (22 module directories + the `events/attendee` sub-module)
- **AND** `grep -rn "from '\.\./" apps/server/src/modules/*/types.ts apps/server/src/modules/*/*/types.ts` shows ONLY `../../utils/constants` imports (allowlist) — any `../<other-module>/` import is a violation
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

### Requirement: Latent defects are registered, not fixed

Behavior-changing bugfixes discovered by the typing (e.g. the pre-existing PATCH `/settings/:id` nested `displayOptions` payload against flat model columns) SHALL be REGISTERED in the change tasks as latent defects for a future bugfix change — this change SHALL NOT alter runtime behavior.

#### Scenario: discovered defect does not leak into the refactor

- **WHEN** a latent runtime defect surfaces while typing a module
- **THEN** it is recorded in tasks.md with reproduction evidence (byte-identical at HEAD)
- **AND** the module's refactor preserves the existing behavior exactly

### Requirement: Closure registers full contract coverage

At closure the progress note in `docs/CONTEXT-CICD.md` §12.2 SHALL read "23/23 módulos con contratos de dominio (types.ts)", no new `any` SHALL exist under `src/modules/`, and `npx openspec validate server-ts-domain-interfaces --strict` SHALL pass.

#### Scenario: closure state is verifiable

- **WHEN** all tasks are checked
- **THEN** the contract count is 23/23 (verified via `find apps/server/src/modules -name types.ts | wc -l`) and the gates are green
- **AND** the strict validation passes
