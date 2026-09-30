# config-correctness Delta

## MODIFIED Requirements

### Requirement: Server complexity threshold alignment

**Context:** corrects a prior drift where `eslint.config.js` set max 20 while the `server-complexity` job overrode it to 15 via `--rule` (local/CI divergence). Supersedes the flat max 20 with per-layer thresholds.

The system SHALL enforce cyclomatic-complexity thresholds per layer in `eslint.config.js` as the single source of truth: `["error", { max: 15 }]` for core code (ALL production code under `apps/*/src/**` — modules, routes, middleware, socket, components, hooks, services, stories, etc.), `["error", { max: 10 }]` for utility code (`apps/**/src/utils/**`), and the rule disabled for test files. The two legacy workspace blocks `complexity: ["error", { max: 20 }]` (files `apps/client/**` and `apps/server/**`) SHALL be REMOVED — a remaining max-20 block would override the per-layer thresholds (last-match-wins) or leave a stale 20 band. Layer blocks SHALL be ordered core → utils → tests in the array (the last block defining the rule wins the merge; `.unit.test.js` files exist inside `src/utils/`). The `server-complexity` and `client-complexity` jobs in `.github/workflows/ci.yml` SHALL NOT override these thresholds with a `--rule` CLI option.

#### Scenario: CI job matches config threshold

- **WHEN** a `*-complexity` job runs ESLint over workspace source files
- **THEN** the effective `complexity` rule SHALL be taken from `eslint.config.js` per layer
- **AND** no `--rule '{"complexity": ...}'` CLI override SHALL be applied

#### Scenario: Local lint matches CI threshold

- **WHEN** a developer runs `npm run lint --workspace=...` locally
- **THEN** the enforced complexity maximum SHALL be identical to the value CI enforces for each layer

#### Scenario: Core code capped at 15

- **WHEN** any production source file under `apps/server/src/**` or `apps/client/src/**` (e.g. a route, middleware, hook or component) contains a function with cyclomatic complexity greater than 15
- **THEN** ESLint SHALL report a `complexity` error

#### Scenario: Legacy max-20 blocks removed

- **WHEN** `eslint.config.js` is read
- **THEN** no `complexity` rule with `{ max: 20 }` SHALL remain for `apps/client/**` or `apps/server/**`
- **AND** `grep -n "max: 20" eslint.config.js` SHALL return no matches

#### Scenario: Layer block ordering resolves overlaps

- **WHEN** `npx eslint --print-config apps/server/src/utils/prisma/sanitizePrismaMessage.unit.test.js` is evaluated
- **THEN** the `complexity` rule SHALL be `off` (test block, defined last, wins over core and utils)

#### Scenario: Utility code capped at 10

- **WHEN** a utility file contains a function with cyclomatic complexity greater than 10
- **THEN** ESLint SHALL report a `complexity` error

#### Scenario: Test files exempt from complexity

- **WHEN** a test file is linted
- **THEN** the `complexity` rule SHALL be disabled for that file

#### Scenario: Client threshold stays aligned

- **WHEN** the `client-complexity` job runs
- **THEN** the effective complexity thresholds SHALL match the per-layer blocks of `eslint.config.js` for `apps/client` files (15 for production `src` code, 10 for `src/utils`, off for tests)

## ADDED Requirements

### Requirement: Per-layer complexity thresholds documented in Spanish

Each per-layer `complexity` block in `eslint.config.js` SHALL carry ES (`//`) comments stating the applied threshold and the rationale for the layer. Comments SHALL be present for core (15), utils (10), and tests (off) blocks.

#### Scenario: Config comments explain each threshold

- **WHEN** `eslint.config.js` is read
- **THEN** each complexity block SHALL have a Spanish comment naming its layer and threshold rationale

### Requirement: Max lines per function without ignorePattern

The `max-lines-per-function` rule SHALL be configured in the core block of `eslint.config.js` as `["error", { max: 80, skipBlankLines: true, skipComments: true }]` WITHOUT the rule option `ignorePattern`. The rule SHALL be enforced for `apps/server/src/**` and SHALL be exempt for `apps/client/src/**` during Phase 1 via a dedicated `files`/`ignores` block whose Spanish comment documents the technical debt and the Phase 2 follow-up change that removes the exemption (104 client functions exceed 80 lines; median 167). The test-files block SHALL explicitly disable the rule (`'max-lines-per-function': 'off'`). Exemptions for specific files (e.g., generated files, long test scaffolds) SHALL be expressed via `files`/`ignores` configuration blocks or via documented `eslint-disable` comments in source.

#### Scenario: Rule option not used for exemptions

- **WHEN** `eslint.config.js` declares `max-lines-per-function`
- **THEN** no `ignorePattern` option SHALL be present on that rule

#### Scenario: Pinned rule options on server core

- **WHEN** `npx eslint --print-config <server core file>` is evaluated
- **THEN** the `max-lines-per-function` rule SHALL be `["error", { max: 80, skipBlankLines: true, skipComments: true }]`

#### Scenario: Client files exempt during Phase 1

- **WHEN** `npx eslint --print-config <client src file>` is evaluated
- **THEN** the `max-lines-per-function` rule SHALL be `off`
- **AND** the exemption SHALL live in a documented `files` block (grep-eable in `eslint.config.js`), not inside rule options
- **AND** the `complexity` rule SHALL stay `["error", { max: 15 }]` for that same file

#### Scenario: Test files exempt from max-lines-per-function

- **WHEN** `npx eslint --print-config <test file>` is evaluated
- **THEN** the `max-lines-per-function` rule SHALL be `off`

#### Scenario: Exemptions via config blocks

- **WHEN** a set of files must be exempt from `max-lines-per-function`
- **THEN** the exemption SHALL be implemented with a `files`/`ignores` block or a documented `eslint-disable` comment

### Requirement: E2E workspace lint coverage

The `e2e` workspace SHALL define a `lint` script in `e2e/package.json`, SHALL be covered by a matching `files` block in `eslint.config.js`, and SHALL be gated by an `e2e-lint` job in `.github/workflows/ci.yml` running with `--max-warnings 0`.

#### Scenario: E2E lint script exists

- **WHEN** `npm run lint --workspace=e2e` runs locally
- **THEN** ESLint SHALL lint the e2e sources (`tests/**` including page objects, and `playwright.config.js`) and exit non-zero on violations

#### Scenario: CI gates e2e lint

- **WHEN** a pull request runs the quality stage
- **THEN** the `e2e-lint` job SHALL execute the e2e lint script and block the merge on failure

#### Scenario: E2E files matched by config

- **WHEN** an `e2e/**/*.js` file is linted
- **THEN** it SHALL be matched by a dedicated config block (no "ignored due to missing configuration" warning)

### Requirement: Complexity configuration documentation in Spanish

`docs/learning/eslint-complexity-configuration.md` SHALL exist in Spanish and explain the per-layer implementation (thresholds, `max-lines-per-function` strategy, e2e lint wiring). Stale lines in `docs/learning/eslint-configuration.md` SHALL be updated to reflect the current config (block/line counts, CI job table, thresholds).

#### Scenario: New doc exists and explains implementation

- **WHEN** `docs/learning/eslint-complexity-configuration.md` is read
- **THEN** it SHALL document the per-layer thresholds, the no-`ignorePattern` strategy, and the e2e lint integration in Spanish

#### Scenario: Stale doc lines corrected

- **WHEN** `docs/learning/eslint-configuration.md` is read
- **THEN** references to config line counts, block counts, thresholds, and CI jobs SHALL match the current `eslint.config.js` and `ci.yml`
