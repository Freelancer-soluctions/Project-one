# config-correctness Specification

## Purpose

ESLint configuration correctness for the monorepo: one `complexity` threshold per workspace owned solely by `eslint.config.js` (never overridden from CI), and backend globals restricted to the Node/Vitest environments so `no-undef` can catch browser-global misuse in server code.

## Requirements

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

### Requirement: Prettier config single source of truth

**Context:** corrects a prior state where the format was owned by `.prettierrc` (JSON, no comments possible, no schema hint).

The root `package.json` workspaces SHALL resolve formatting options exclusively from `.prettierrc.yaml`, which SHALL declare `$schema: 'https://json.schemastore.org/prettierrc'` for editor validation. The former `.prettierrc` JSON file SHALL NOT exist. Option values SHALL be at total parity with the deleted JSON config (`printWidth: 80`, `singleQuote: true`, `semi: true`, `trailingComma: 'es5'`, `jsxSingleQuote: false`, `arrowParens: 'always'`, `endOfLine: 'lf'`, `bracketSpacing: true`, `bracketSameLine: false`, `tabWidth: 2`, `useTabs: false`, `quoteProps: 'as-needed'`) — this change documents, never reformats.

#### Scenario: YAML config is the only Prettier config

- **WHEN** Prettier resolves configuration for any workspace file (`apps/client`, `apps/server`, root)
- **THEN** it SHALL load `.prettierrc.yaml` from the monorepo root
- **AND** no `.prettierrc` JSON file SHALL exist in the tree

#### Scenario: Editor validates the config

- **WHEN** `.prettierrc.yaml` is opened in an editor with schemastore support
- **THEN** `$schema: 'https://json.schemastore.org/prettierrc'` (line 5) SHALL provide autocompletion and validation of each key

#### Scenario: No formatting drift from the migration

- **WHEN** `npm run format:check` runs in any workspace
- **THEN** it SHALL report zero diffs — proving value parity with the deleted `.prettierrc` JSON

### Requirement: Format references and enforcement layers stay aligned

**Context:** corrects stale `.prettierrc` citations left in docs after the rename, and records the 4-layer enforcement pipeline.

Documentation SHALL cite `.prettierrc.yaml` — no literal `.prettierrc` reference outside `.prettierrc.yaml` itself may remain in `docs/`. `package.json` SHALL NOT hardcode the config name: lint-staged runs bare `prettier --write` and the root `format:check` script runs `prettier --check` over workspaces. The CI jobs `client-format-check` and `server-format-check` in `.github/workflows/ci.yml` SHALL gate PRs on formatting, and `eslint-config-prettier` SHALL remain the last element of the `eslint.config.js` array.

#### Scenario: Docs cite the current config name

- **WHEN** `grep -rn "\.prettierrc\b" docs` runs
- **THEN** every match SHALL be part of `.prettierrc` + `.yaml` (i.e. `.prettierrc.yaml`) or an explicit historical mention of the deleted JSON config in `docs/learning/prettier-configuration.md`
- **AND** `docs/code-style.md`, `docs/pre-merge-gates-governance.md` and `docs/CONTEXT-CICD.md` SHALL reference `.prettierrc.yaml`

#### Scenario: CI format gate blocks drift

- **WHEN** the `client-format-check` and `server-format-check` jobs run `npm run format:check --workspace=...`
- **THEN** `prettier --check` SHALL resolve `.prettierrc.yaml` and fail the PR on any format diff

#### Scenario: ESLint does not fight Prettier

- **WHEN** `eslint.config.js` is loaded
- **THEN** `eslint-config-prettier` SHALL be the final array element so its style-rule "off" wins over earlier blocks

### Requirement: Per-layer complexity thresholds documented in Spanish

Each per-layer `complexity` block in `eslint.config.js` SHALL carry ES (`//`) comments stating the applied threshold and the rationale for the layer. Comments SHALL be present for core (15), utils (10), and tests (off) blocks.

#### Scenario: Config comments explain each threshold

- **WHEN** `eslint.config.js` is read
- **THEN** each complexity block SHALL have a Spanish comment naming its layer and threshold rationale

### Requirement: Max lines per function without ignorePattern

The `max-lines-per-function` rule SHALL be configured in the core block of `eslint.config.js` as `["error", { max: 80, skipBlankLines: true, skipComments: true }]` WITHOUT the rule option `ignorePattern`. The rule SHALL be enforced for ALL production code under `apps/*/src/**` — both server and client; the Phase-1 exemption block for `apps/client/src/**` SHALL be REMOVED from `eslint.config.js` together with its technical-debt comment. The test-files block SHALL explicitly disable the rule (`'max-lines-per-function': 'off'`). Exemptions for specific files (e.g., generated files, long test scaffolds) SHALL be expressed via `files`/`ignores` configuration blocks or via documented `eslint-disable` comments in source.

#### Scenario: Rule option not used for exemptions

- **WHEN** `eslint.config.js` declares `max-lines-per-function`
- **THEN** no `ignorePattern` option SHALL be present on that rule

#### Scenario: Pinned rule options on server core

- **WHEN** `npx eslint --print-config <server core file>` is evaluated
- **THEN** the `max-lines-per-function` rule SHALL be `["error", { max: 80, skipBlankLines: true, skipComments: true }]`

#### Scenario: Client files exempt during Phase 1

- **WHEN** `npx eslint --print-config <client src file>` is evaluated after the Phase-2 change (`eslint-mlpf-client-phase2`) is applied
- **THEN** the Phase-1 exemption SHALL be gone: the `max-lines-per-function` rule SHALL be `["error", { max: 80, skipBlankLines: true, skipComments: true }]` — identical to server
- **AND** the `complexity` rule SHALL stay `["error", { max: 15 }]` for that same file

#### Scenario: Phase-1 exemption block removed

- **WHEN** `eslint.config.js` is read
- **THEN** no `files` block disabling `max-lines-per-function` for `apps/client/src/**` SHALL remain
- **AND** the technical-debt comment block of the Phase-1 exemption SHALL be gone

#### Scenario: No violations after refactor

- **WHEN** `npm run lint --workspace=apps/client` runs with the exemption removed
- **THEN** ESLint SHALL report zero `max-lines-per-function` errors

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
