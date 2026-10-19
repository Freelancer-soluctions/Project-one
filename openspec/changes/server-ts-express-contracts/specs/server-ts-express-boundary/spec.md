# Spec Delta

## Purpose

Typed Express boundary for `apps/server`: complete the global `Request` augmentation (userId/userRole/user), convert `handleCatchErrorAsync` to a typed `RequestHandler` wrapper (giving all 125 handlers contextual types), and resolve the compile fallout module by module — reaching `noImplicitAny` readiness for the parent's Fase 4.

## ADDED Requirements

### Requirement: Global Request augmentation is complete and single-sourced

The `Express.Request` augmentation SHALL declare `userId?: number`, `userRole?: string`, and `user?: JwtPayload` — mirroring exactly what `verifyToken` populates from the verified JWT — in a single `declare global` block (consolidating any existing blocks in `app.ts`/`verifyToken.ts`).

#### Scenario: handlers access augmented props without casts

- **WHEN** a controller handler typed as `Request` accesses `req.userId`, `req.userRole`, or `req.user`
- **THEN** the property access type-checks without local casts
- **AND** exactly one `declare global` block exists (no duplicate namespace merging conflicts)

### Requirement: The async wrapper is a typed RequestHandler

`handleCatchErrorAsync` SHALL have signature `(fn: RequestHandler): RequestHandler` with `catch (err: unknown)` forwarding to `next(err)`, so every wrapped handler receives contextual types (`req: Request`, `res: Response`) by inference at its call-site — without editing the handler bodies.

#### Scenario: contextual typing reaches all handlers

- **WHEN** the wrapper is typed
- **THEN** `npm run type-check` on `apps/server` exits 0 (fallout resolved)
- **AND** the wrapped handlers' `req`/`res` parameters resolve to Express types (no implicit-any at the boundary layer)
- **AND** `handleCatchErrorAsync` contains no `any` in its signature or body

### Requirement: Fallout is resolved per module with gates

Compile fallout surfaced by contextual typing SHALL be fixed module by module (risk order: settings → attendance → news → users → auth → events → resto), skipping modules in flight by the parallel `server-ts-domain-interfaces` session, with the four gates passing per batch; fixes use the module's own domain types when they exist, and the global augmentation is widened to evidence rather than cast locally.

#### Scenario: batch gating prevents regression

- **WHEN** a module's fallout fixes are committed
- **THEN** type-check, lint, test:unit (175 baseline), and depcruise all exit 0 before the next module starts
- **AND** no new explicit `any` was introduced (grep `: any|as any`)

### Requirement: noImplicitAny readiness is measured and recorded

At closure the change SHALL register the TS7006 count with `--noImplicitAny` (baseline 406, 2026-10-18) and the residual (target ≤ 60: tests/socket/utils deferred to Fase 4), annotating the parent's task 6.3 that the big-bang risk is retired, and `npx openspec validate server-ts-express-contracts --strict` SHALL pass.

#### Scenario: Fase 4 can activate without explosion

- **WHEN** the parent change evaluates activating `noImplicitAny` (task 6.3)
- **THEN** the recorded residual count in this change is ≤ 60 and itemized by directory
- **AND** the strict validation of this change passes
