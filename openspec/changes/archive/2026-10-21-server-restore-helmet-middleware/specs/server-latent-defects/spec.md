# Spec Delta

## Purpose

Ampliar la política `requireEnv` del change `server-ts-latent-defects` a las dos keys que gobiernan la emisión de
cabeceras de seguridad (`FRONTEND_URL`, `NODE_ENV`) y, con ello, eliminar el modo de fallo silencioso que dejaba
`helmet.config.ts` con un origen vacío en la política CSP. La excepción al principio "no module-scope throw" queda
registrada aquí de forma explícita, porque `helmetConfig` se construye al evaluar el módulo, no al atender una request.

## MODIFIED Requirements

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
