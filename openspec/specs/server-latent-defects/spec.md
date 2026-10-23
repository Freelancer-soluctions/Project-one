# server-latent-defects Specification

## Purpose

Fix the three latent runtime defects discovered by the TypeScript migration (registered, not fixed, by the zero-behavior-change rule of the migration changes): the never-assigned `req.userRole` in BOTH role-check factories, the PATCH settings nested `displayOptions` payload, and the dotenv policy for missing critical configuration.

## Requirements

### Requirement: Both role-check factories assign req.userRole on every success path

`checkRoleAuth` (1 success path) AND `checkRoleAuthOrPermisssion` (3 success paths: ADMIN short-circuit, empty-permissions bypass, permission granted) SHALL assign `req.userRole = <verified role code>` before calling `next()`. The global type (`userRole?: string`) already exists — no augmentation needed.

#### Scenario: events showDeleted guard operates on verified role

- **WHEN** a request passes through `checkRoleAuthOrPermisssion` and reaches the events `showDeleted` guard
- **THEN** `req.userRole` SHALL contain the verified role code (not undefined)
- **AND** a non-ADMIN request with `showDeleted=true` SHALL be rejected with 403
- **AND** an ADMIN request SHALL be allowed with deleted events included

### Requirement: PATCH settings flattens displayOptions in the service, preserving language

The PATCH `/settings/:id` display flow SHALL translate the nested `displayOptions` body object into flat model columns INSIDE the service (mirroring the create/upsert path, which already flattens), preserving `language` when both fields arrive in the same PATCH. The create path SHALL NOT be modified. Excess-property failures are only catchable by the dao-mock test (variables skip excess-property checks).

#### Scenario: display PATCH reaches prisma valid with language preserved

- **WHEN** the display PATCH flow executes with `language` and `displayOptions` in the body
- **THEN** the payload passed to `prisma.settings.update` contains only flat model columns plus `language`
- **AND** no nested `displayOptions` object reaches the Prisma call

### Requirement: dotenv distinguishes critical keys via requireEnv

`config/dotenv.ts` SHALL export `requireEnv(key: CriticalEnvKey): string` that throws `❌ Missing required env var: <key>`
when the value is missing, and the critical call-sites (`SECRETKEY`, `REFRESHSECRETKEY`, `AES_GCM_KEY`, `ALGORITHM`,
`FRONTEND_URL`, `NODE_ENV`) SHALL use it. `CriticalEnvKey` SHALL include `FRONTEND_URL` and `NODE_ENV`, and
`utils/helmet/helmet.config.ts` SHALL read both through `requireEnv`. Optional keys keep the current
`dotenv(key): string` with their own defaults. The throw is scoped to the access-site; the ONLY documented exception is
`helmet.config.ts`, whose access site is module scope: because `helmetConfig` is built when the module is evaluated, the
throw happens at import time of `app.ts` (process startup, first import of the test suite), not per request. Every
executable environment — including the committed `.env.test` and the documented `.env.example` — SHALL therefore declare
`FRONTEND_URL`.

#### Scenario: missing critical key fails loudly at the access site

- **WHEN** a critical call-site executes without its env key set
- **THEN** the error message SHALL name the missing key
- **AND** the committed `.env.test` (which contains all critical keys) keeps the test suite unaffected

#### Scenario: helmet config fails at import time when the CSP origin is missing

- **WHEN** `utils/helmet/helmet.config.ts` is evaluated without `FRONTEND_URL`
- **THEN** the module SHALL throw `❌ Missing required env var: FRONTEND_URL` before any request is served
- **AND** the error SHALL surface at import of `app.ts`, not as a `200` with an empty CSP source

#### Scenario: the committed test environment declares the CSP origin

- **WHEN** `npm run test:unit --workspace=server-express` boots the suite
- **THEN** `.env.test` SHALL define `FRONTEND_URL` (alongside `NODE_ENV=test`)
- **AND** no test file SHALL need to stub it just to import `app.ts`

#### Scenario: the emitted CSP contains no empty source tokens

- **WHEN** the CSP directives are built with `FRONTEND_URL` resolved through `requireEnv`
- **THEN** no directive SHALL contain an empty source token (the pre-fix behaviour produced
  `script-src 'self'  'unsafe-inline'` with a double space, verified with helmet 8.1.0)

#### Scenario: NODE_ENV is resolved through the same policy

- **WHEN** `utils/helmet/helmet.config.ts` decides between the dev and production policies (HSTS, `unsafe-inline`,
  `report-uri`)
- **THEN** `NODE_ENV` SHALL be read with `requireEnv`, so an unset value fails loudly instead of silently selecting the
  development branch

### Requirement: Each fix ships with a regression test and gates

Each of the three fixes SHALL include unit regression tests capturing the broken behavior (role assigned across all paths, prisma receives flat payload + language, requireEnv names the missing key) before it is considered complete, with the four gates passing.

#### Scenario: regression tests lock the fixes

- **WHEN** each fix is implemented
- **THEN** a unit test exists that fails on the pre-fix behavior and passes post-fix
- **AND** type-check, lint, test:unit (175+), and depcruise all pass
