# smoke-testing Specification

## Purpose

Define los smoke tests de la aplicación: verificación rápida de arranque y rutas críticas del cliente y servidor para detectar roturas evidentes antes de suites completas.

## Requirements

### Requirement: Smoke tests for post-deploy verification

The system SHALL have smoke tests that quickly verify core functionality after deployment.

#### Scenario: Server health check

- **WHEN** smoke test executes
- **THEN** server responds with 200 OK on health endpoint

#### Scenario: Database connectivity

- **WHEN** smoke test executes
- **THEN** database connection is successful

#### Scenario: Authentication endpoint

- **WHEN** smoke test executes
- **THEN** login endpoint responds correctly

#### Scenario: Critical API endpoints

- **WHEN** smoke test executes
- **THEN** at least 3 critical API endpoints respond successfully

### Requirement: Smoke test execution

The system SHALL provide npm scripts to run smoke tests independently.

#### Scenario: Run smoke tests via npm

- **WHEN** developer runs "npm run test:smoke"
- **THEN** all smoke tests execute and report pass/fail

#### Scenario: Smoke tests fail

- **WHEN** any smoke test fails
- **THEN** exit code is non-zero to indicate failure in CI/CD

### Requirement: Remote smoke target requires an absolute http(s) BASE_URL

`createRequest()` in `apps/server/tests/smoke/helpers/request.js` SHALL select the in-process Express app unless `process.env.BASE_URL` is an absolute `http`/`https` URL.

Vite resolves its `base` option and injects the result into `process.env.BASE_URL` (`const BASE_URL = resolvedBase` in `node_modules/vite/dist/node/chunks/config.js`), defaulting to `"/"` when `base` is not configured. A truthiness check (`if (baseUrl)`) is therefore always true, and `request("/")` is a relative URL that superagent cannot resolve, failing with `ECONNREFUSED`. The guard SHALL match an absolute http(s) URL pattern so that `"//"`, `""` and any other non-absolute value fall through to the in-process branch.

#### Scenario: Vite's default base does not select the remote branch

- **WHEN** the smoke suite runs without a remote target configured
- **THEN** `process.env.BASE_URL` is `"/"` (injected by Vite)
- **AND** `createRequest()` returns the in-process Express app, and the endpoints respond

#### Scenario: A genuine remote target is still honoured

- **WHEN** `BASE_URL` is set to an absolute URL such as `http://localhost:3000`
- **THEN** `createRequest()` returns a request bound to that URL and the suite exercises the deployed service

#### Scenario: The failure is diagnosable from the job log

- **WHEN** `test-smoke` or `test-integration` fails in CI
- **THEN** the job step declares `--reporter=default` in addition to `--reporter=junit`
- **AND** the step log contains the failing test names and messages, not only an `exit code 1`
