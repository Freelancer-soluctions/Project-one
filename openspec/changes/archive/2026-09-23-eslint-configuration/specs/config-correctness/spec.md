# Spec Delta

## Purpose

ESLint configuration correctness for the monorepo: one `complexity` threshold per workspace owned solely by `eslint.config.js` (never overridden from CI), and backend globals restricted to the Node/Vitest environments so `no-undef` can catch browser-global misuse in server code.

## ADDED Requirements

### Requirement: Server complexity threshold alignment

**Context:** corrects a prior drift where `eslint.config.js` set max 20 while the `server-complexity` job overrode it to 15 via `--rule` (local/CI divergence).

The system SHALL enforce a cyclomatic-complexity maximum of 20 for `apps/server/**/*.js`, with `eslint.config.js` as the single source of truth. The `server-complexity` job in `.github/workflows/ci.yml` SHALL NOT override the threshold with a `--rule` CLI option that differs from the configuration file.

#### Scenario: CI job matches config threshold

- **WHEN** the `server-complexity` job runs ESLint over `apps/server` source files
- **THEN** the effective `complexity` rule SHALL be `["error", 20]` taken from `eslint.config.js`
- **AND** no `--rule '{"complexity": ...}'` CLI override with a different value SHALL be applied

#### Scenario: Local lint matches CI threshold

- **WHEN** a developer runs `npm run lint --workspace=apps/server` locally
- **THEN** the enforced complexity maximum SHALL be 20 — identical to the value CI enforces

#### Scenario: Client threshold stays aligned

- **WHEN** the `client-complexity` job runs
- **THEN** the effective complexity maximum SHALL be 20, equal to the `apps/client` block of `eslint.config.js`

### Requirement: Backend globals restricted to Node environment

**Context:** corrects a prior state where `...globals.browser` was spread into the `languageOptions.globals` of `files: ['apps/server/**/*.js']`, weakening `no-undef`.

The `files: ['apps/server/**/*.js']` block of `eslint.config.js` SHALL declare `languageOptions.globals` containing `globals.node` and the Vitest test globals only. It SHALL NOT include `globals.browser`. Frontend and Storybook blocks SHALL continue to include `globals.browser`.

#### Scenario: Browser globals are undefined in backend code

- **WHEN** a server file references a browser-only global such as `window` or `document`
- **THEN** the `no-undef` rule SHALL report it as undefined

#### Scenario: Node and test globals remain available in backend

- **WHEN** a server file references `process`, or a server test file references `describe`/`it`/`expect`
- **THEN** no `no-undef` error SHALL be reported for those globals

#### Scenario: Frontend and Storybook keep browser globals

- **WHEN** a file under `apps/client` (including `.stories.*`) references `window` or `document`
- **THEN** no `no-undef` error SHALL be reported for those globals
