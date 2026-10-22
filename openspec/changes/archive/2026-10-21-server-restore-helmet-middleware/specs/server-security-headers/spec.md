# Spec Delta

## Purpose

Restaurar la emisión de cabeceras de seguridad HTTP en el backend Express, que la Fase 2 de la migración TypeScript
(commit `bf3cf1f2`) eliminó del ensamblado de la aplicación sin que ningún test lo detectara: `helmetConfig` existía y
seguía exportándose, pero nadie lo montaba. La capability cubre la posición del middleware en la pipeline, el contrato
observable de cabeceras, la reconexión del reporte CSP al endpoint que ya existe, y el test de regresión que impide que
la línea vuelva a desaparecer en silencio.

## ADDED Requirements

### Requirement: Helmet is mounted as the first middleware

`apps/server/src/app.ts` SHALL import `helmetConfig` from `./utils/helmet/helmet.config.js` and mount it with
`app.use(helmetConfig)` immediately after `const app = express()`, BEFORE `express.urlencoded`, `express.json` and every
other middleware, preserving the option object of `helmet.config.ts` unchanged.

#### Scenario: helmet runs before the body parsers

- **WHEN** `app.ts` is inspected or executed
- **THEN** `app.use(helmetConfig)` SHALL appear after `express()` and before `express.urlencoded`/`express.json`
- **AND** no other middleware SHALL change position, be renamed or be removed

#### Scenario: a body-parser rejection still carries the security headers

- **WHEN** a request is rejected before reaching the router (malformed JSON body, 400)
- **THEN** the error response SHALL still carry the helmet headers, because helmet ran before the parser

### Requirement: Content-Security-Policy is emitted with the configured baseline

Every HTTP response SHALL include a `Content-Security-Policy` header containing `default-src 'self'` and
`frame-ancestors 'none'`, as declared in `helmet.config.ts`.

#### Scenario: CSP present on a routed response

- **WHEN** any request receives a response from the application
- **THEN** the `content-security-policy` header SHALL be present
- **AND** it SHALL contain `default-src 'self'` and `frame-ancestors 'none'`

### Requirement: Nosniff and frame-guard headers are emitted

Every HTTP response SHALL include `x-content-type-options: nosniff` and `x-frame-options: DENY`.

#### Scenario: MIME and clickjacking headers present

- **WHEN** any request receives a response from the application
- **THEN** `x-content-type-options` SHALL equal `nosniff`
- **AND** `x-frame-options` SHALL equal `DENY`

### Requirement: Express fingerprint is not advertised

Every HTTP response SHALL omit the `X-Powered-By` header (`hidePoweredBy: true` in `helmet.config.ts`).

#### Scenario: framework fingerprint absent

- **WHEN** any request receives a response from the application
- **THEN** the `x-powered-by` header SHALL be absent

### Requirement: CSP reporting stays wired to the existing endpoint

The restored middleware SHALL NOT require new routes: CSP reports SHALL keep pointing at the already mounted
`/api/v1/security/csp-report` endpoint (`modules/security/routes.ts`), which SHALL remain reachable.

#### Scenario: production CSP declares the existing report endpoint

- **WHEN** the configuration is evaluated with `NODE_ENV=production`
- **THEN** the emitted CSP SHALL contain `report-uri /api/v1/security/csp-report`
- **AND** `POST /api/v1/security/csp-report` SHALL be handled by the existing route (not 404)

### Requirement: A regression test locks the wiring

The project SHALL ship `apps/server/src/app.unit.test.ts`, a DB-free supertest suite over the real `app` that asserts
the observable header contract, so that removing the mount line fails the unit suite.

#### Scenario: commenting the mount line turns the suite red

- **WHEN** `app.use(helmetConfig)` is commented out and `npm run test:unit --workspace=server-express` runs
- **THEN** the header tests SHALL fail
- **AND** with the line restored they SHALL pass

#### Scenario: the suite does not need a database

- **WHEN** `src/app.unit.test.ts` runs under `npm run test:unit --workspace=server-express`
- **THEN** it SHALL NOT require PostgreSQL, AWS credentials or a network listener
- **AND** it SHALL obtain headers from an in-process request to POST /api/v1/security/csp-report (a real route, no DB needed; the 404 of a non-existent route is NOT valid for CSP assertions because Express finalhandler overrides the CSP with its own default-src 'none' on error responses)
