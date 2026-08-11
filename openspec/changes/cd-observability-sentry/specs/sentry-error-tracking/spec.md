## Purpose

Captures application errors in the server and client with Sentry, correlating them to the environment and release so production issues are traceable to the deploy that introduced them.

## ADDED Requirements

### Requirement: Sentry initialization in the server

The server SHALL initialize Sentry at bootstrap when a `SENTRY_DSN` environment variable is present, and SHALL operate as a no-op (no network calls, no crash) when it is absent.

#### Scenario: Server starts with SENTRY_DSN configured

- **WHEN** the server boots with `SENTRY_DSN` set
- **THEN** Sentry is initialized with that DSN, the environment derived from `NODE_ENV`, and the release derived from the deployed commit SHA

#### Scenario: Server starts without SENTRY_DSN

- **WHEN** the server boots without `SENTRY_DSN`
- **THEN** the server starts normally without initializing Sentry and without any Sentry network activity

### Requirement: Server captures unhandled errors

The server SHALL report unhandled promise rejections, uncaught exceptions, and Express request errors to Sentry when initialized.

#### Scenario: Unhandled rejection is reported

- **WHEN** an unhandled promise rejection occurs and Sentry is initialized
- **THEN** the rejection is captured and reported to Sentry with its stack trace

#### Scenario: Express error handler reports request errors

- **WHEN** an Express request fails with an error and Sentry is initialized
- **THEN** the error is reported to Sentry with request context (method, path, status)

#### Scenario: Request errors include transaction context

- **WHEN** an Express request fails with an error, Sentry is initialized, and the request handler middleware is registered before the routes
- **THEN** the error is reported to Sentry with request context (method, path, status) and transaction/span context

### Requirement: Sentry initialization in the client

The client SHALL initialize Sentry before rendering the application when a `VITE_SENTRY_DSN` build-time variable is present, and SHALL render normally when it is absent.

#### Scenario: Client boots with VITE_SENTRY_DSN configured

- **WHEN** the client bundle is built with `VITE_SENTRY_DSN` set
- **THEN** Sentry is initialized before the React app renders and client-side errors are reported

#### Scenario: Client boots without VITE_SENTRY_DSN

- **WHEN** the client bundle is built without `VITE_SENTRY_DSN`
- **THEN** the application renders normally with no Sentry initialization or network activity

### Requirement: Configurable sampling rate

The server SHALL allow the Sentry trace sample rate to be configured via environment variable, defaulting to a conservative value when unset.

#### Scenario: traceSampleRate configured via env

- **WHEN** the server boots with a `SENTRY_TRACES_SAMPLE_RATE` value set
- **THEN** Sentry uses that value as the trace sample rate

#### Scenario: traceSampleRate default

- **WHEN** the server boots without `SENTRY_TRACES_SAMPLE_RATE`
- **THEN** Sentry uses a conservative default sample rate (0.1 or lower)

### Requirement: Sentry does not break the application

Sentry initialization SHALL never prevent the server from booting or the client from rendering, and SHALL not alter existing API contracts or user-facing behavior.

#### Scenario: Sentry init failure does not crash the server

- **WHEN** Sentry initialization throws or the DSN is invalid
- **THEN** the server logs the failure and continues booting normally

#### Scenario: Existing tests remain green

- **WHEN** the unit and integration test suites run with Sentry dependencies installed
- **THEN** all existing tests pass without Sentry network calls (Sentry disabled or mocked in test environment)
