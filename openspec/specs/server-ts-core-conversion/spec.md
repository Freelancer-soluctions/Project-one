# server-ts-core-conversion Specification

## Purpose

TypeScript conversion of the transversal core of `apps/server` (Fase 3): middleware, socket, OpenAPI docs, shared utils, `app`, and `bin` — 55 files — ending with the runtime switch to `tsx` (parent design decision 9) that closes `src/` at zero `.js` files.

## Requirements

### Requirement: Core converts bottom-up with bin last

The core SHALL convert in dependency order — middleware → socket + docs → utils → app → bin — and `src/bin/index.js` SHALL be the last `.js` file converted; its conversion commit SHALL simultaneously introduce the runtime switch to `tsx`.

#### Scenario: runtime switches exactly once

- **WHEN** `bin/index.ts` is committed
- **THEN** PM2 (`ecosystem.config.json`), the dev script, and the Dockerfile `CMD` all execute `tsx src/bin/index.ts` (or `tsx watch` in dev) in the same commit sequence
- **AND** Phases 0–2 commits never changed the runtime entry (`node src/bin/index.js`)

### Requirement: Express request augmentation is declared once

`req.user` SHALL be declared via a single `declare global` augmentation (Express `Request`) typed from the verified JWT payload, so the accesses in `src/` consume that global type with no local `req.user` re-typing and no `as any`. The casts that remain SHALL be design-sanctioned boundary casts only — the dynamic Prisma model access (`utils/prisma/prisma-model.ts`, the single documented `any` exception) and library/test-double boundaries — and each SHALL be documented where it lives.

#### Scenario: single source of truth for req.user

- **WHEN** the augmentation is committed and Fase 2 controllers are cleaned up
- **THEN** the accesses to `req.user` in `src/` type-check against the global type without local re-typing (0 `req.user as` matches, `grep` verifiable)
- **AND** the only surviving casts are the design-sanctioned boundary casts (dynamic Prisma model access, library/test doubles), each documented at its site
- **AND** the global type matches the actual JWT payload fields (evidence-based, not aspirational)

### Requirement: Error handling is unknown-first

The error middleware and `handleCatchErrorAsync` SHALL type the caught error as `unknown` with `instanceof Error` narrowing, preparing `useUnknownInCatchVariables` (Fase 4) without enabling it.

#### Scenario: catch narrowing without any

- **WHEN** an error flows through the converted error path
- **THEN** no implicit or explicit `any` is introduced in the error signature
- **AND** the response contract (status/body) is byte-identical to the pre-conversion behavior

### Requirement: tsx is a production dependency with verified startup

`tsx` SHALL be installed in `dependencies` (not devDependencies — the Dockerfile runs `npm prune --omit=dev`), and real startup verification SHALL precede closure: `pm2 start` in cluster mode (or an explicitly documented migration to fork mode with justification) and Docker build/run when the daemon is available (CI validation otherwise, with the limitation registered).

#### Scenario: PM2 startup is proven, not assumed

- **WHEN** the runtime switch closes
- **THEN** `pm2 start` over `tsx` is executed for real in cluster mode — or a fork-mode migration decision with justification is recorded
- **AND** the health endpoint responds after the managed start

### Requirement: src closes at zero JavaScript

At closure `src/` SHALL contain zero tracked `.js` files (208 → 0); the progress counter SHALL read `235/236 (Fase 3 — src en 0 .js)`; the 8 remaining root configs/prisma/scripts belong to the parent's Fase configs, not this change.

#### Scenario: closure state is verifiable

- **WHEN** all tasks are checked
- **THEN** `git ls-files 'apps/server/src/*.js' 'apps/server/src/**/*.js'` returns empty
- **AND** the four gates pass and `npx openspec validate server-ts-phase3-core --strict` passes
