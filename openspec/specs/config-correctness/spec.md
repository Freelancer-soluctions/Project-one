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

### Requirement: Import boundaries config-correctness para monorepo

1. `dependency-cruiser` MUST validar import boundaries entre workspaces `apps/client`, `apps/server`, `e2e` con reglas `forbidden` por capa (`error` para prohibiciones reales, `warn` para deuda controlada `circular`/`orphan`/`controller-to-controller`).
2. La configuración MUST ser única fuente de verdad en raíz (`.dependency-cruiser.cjs`) con `extends`, `$schema`, `exclude` global, `doNotFollow`, `enhancedResolveOptions`, `tsPreCompilationDeps` y resolución del alias `@` del client vía `webpackConfig` (config dedicado `apps/client/webpack.depcruise.config.cjs` — el mecanismo `--ts-config apps/client/jsconfig.json` NO es viable desde root: TypeScript resuelve los globs del jsconfig contra el CWD y con CWD=raíz matchea 0 archivos).
3. Los paths de reglas (`^apps/client`/`^apps/server`/`^e2e`) MUST matchear al ejecutar desde root (`npm run depcruise:*`), arreglando la dead-rule actual.
4. El pipeline de enforcement MUST tener 4 capas (pre-commit `lint-staged` `--output-type err-long` + baseline; CI gate `--output-type err`; report `err-html`; docs `docs/learning/import-boundaries.md` ES).
5. Los scripts `package.json` MUST incluir `depcruise`, `depcruise:client`, `depcruise:server`, `depcruise:ci` (`--output-type err --ignore-known`), `depcruise:report` (`err-html`) y `depcruise:baseline`.
6. `docs/learning/import-boundaries.md` MUST documentar implementación profesional (reglas por capa, severidades, CI, shifting-left, comparación con `knip.jsonc`, referencias `dependency-cruiser` docs).
7. `eslint-plugin-import` MUST permanecer desinstalado (ownership = dependency-cruiser).
8. `server-typescript-migration` MUST coordinarse (regex `\.js$` → `\.(js|ts)$`, `tsconfig.json` server; `import-boundaries` amplía regex raíz; server pasa `extends` raíz).

#### Scenario: Import boundaries entre workspaces

- Dado `apps/client` con reglas `from.path: '^apps/client'` y `to.path: '^(apps/server|...)'` severity `error`, y `npm run depcruise:ci` desde root con `--output-type err`
- Cuando `apps/client` importa `apps/server/src` directamente
- Entonces `dependency-cruiser` viola (`name: no-client-to-server`, `severity: error`, `comment` legible)
- Y CI exit ≠ 0 → PR bloqueado
- Y `lint-staged` pre-commit con `--output-type err-long` muestra regla antes de push

#### Scenario: Baseline gradual (fase 1 → fase 2)

- Dado `.dependency-cruiser-known-violations.json` (generado por `npm run depcruise:baseline`) con las 58 violaciones conocidas (50 client: 24 ciclos `no-circular` + 26 `no-cross-module-client`/`no-orphans`; 8 server: orphans de código muerto knip-ignorado)
- Cuando `npm run depcruise:ci` ejecuta con `--ignore-known`
- Entonces conocidas no bloquean (fase 1 `warn` + gates verdes con exit 0)
- Y nuevas violaciones cross-workspace (`error`) sí bloquean (verificado: un import client→server temporal produce `error no-client-to-server` y exit 1 incluso con `--ignore-known`)
- Y tras limpiar deuda, `--ignore-known` se quita del script `depcruise:ci` → fase 2

#### Scenario: Documentación profesional

- Dado `docs/learning/import-boundaries.md` existente (ES) con referencias `dependency-cruiser` docs v18
- Cuando desarrollador necesita replicar/configurar boundaries
- Entonces encuentra: §1 estado actual, §2 por qué DC, §3 reglas por capa, §4 shifting-left/CI, §5 pipeline/proyecto, referencias oficiales
- Y puede replicar `npm run depcruise:report` para inspeccionar grafo

### Requirement: Quality gate taxonomy (blocking vs advisory)

**Context:** codifies the analysis already documented in `docs/learning/quality-gates.md`, which until now had no normative status.

Every quality job of substage 2B in `.github/workflows/ci.yml` SHALL be classified as either `blocking` or `advisory`, and the classification SHALL be recorded in the canonical table of `docs/learning/quality-gates.md` (one row per job, with its type and evidence from `ci.yml`). A `blocking` job SHALL NOT set `continue-on-error: true` and its `failure` result SHALL stop `prebuild-quality-complete`. An `advisory` job SHALL set `continue-on-error: true` at job level (so its result can never block the aggregator, per `actions/toolkit#581`) or SHALL be absent from the `needs` of the blocking aggregator, and SHALL publish its report (artifact or step summary). No quality job MAY be left in an indeterminate state (`if: false` presented as an active gate, or `continue-on-error` without being classified as advisory).

#### Scenario: Every substage 2B job is classified

- **WHEN** the canonical table in `docs/learning/quality-gates.md` is read
- **THEN** each quality job of substage 2B (`lint`, `format-check`, `typecheck`, `complexity`, `dead-code`, `import-bounds`, `docs-validation`, `sonarqube`) SHALL appear with type `blocking` or `advisory`
- **AND** `docs/CONTEXT-CICD.md` and `docs/pre-merge-gates-governance.md` SHALL reference the canonical table instead of duplicating it

#### Scenario: Blocking jobs cannot be advisory

- **WHEN** a job classified as `blocking` is read in `.github/workflows/ci.yml`
- **THEN** it SHALL NOT declare `continue-on-error: true`

#### Scenario: Advisory jobs cannot block the aggregator

- **WHEN** a job classified as `advisory` is evaluated against `prebuild-quality-complete`
- **THEN** either it SHALL set `continue-on-error: true` or it SHALL be absent from the aggregator's `needs`
- **AND** it SHALL publish its report even when it fails

### Requirement: Cosmetic quality gates fixed (if:false and || echo)

**Context:** `client-typecheck` (L450) and `server-typecheck` (L538) run `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op..."` under `if: false`, so they report green while checking nothing; `client-complexity`/`server-complexity` and `client-sonarqube`/`server-sonarqube` are also disabled with `if: false`.

`client-typecheck` and `server-typecheck` SHALL run the real type check (`npm run type-check` when the script exists, otherwise `npx tsc --noEmit`) as their final step, SHALL NOT declare `if: false`, and SHALL NOT use `|| echo` (or any other `|| <command that exits 0>`) or `2>/dev/null` in a way that masks the checker's exit code: a type error SHALL fail the job. `client-complexity` and `server-complexity` SHALL run ESLint with thresholds resolved from `eslint.config.js` (no `--rule` CLI override) and SHALL NOT declare `if: false`. `client-sonarqube` and `server-sonarqube` SHALL either run in advisory mode (`SonarSource/sonar-quality-gate-check` with `continue-on-error: true`) when `SONAR_TOKEN` is configured, or keep `if: false` with a comment documenting the missing credentials — they SHALL NOT be left as undocumented dead gates.

#### Scenario: Type check fails the job

- **WHEN** `client-typecheck` or `server-typecheck` runs against code containing a TypeScript error
- **THEN** the job SHALL exit non-zero and block the PR
- **AND** `grep -n "|| echo" .github/workflows/ci.yml` SHALL return no match inside those jobs

#### Scenario: Type check jobs are enabled

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** `client-typecheck` and `server-typecheck` SHALL NOT declare `if: false`

#### Scenario: Complexity jobs use the config as single source of truth

- **WHEN** `client-complexity` or `server-complexity` runs
- **THEN** it SHALL NOT declare `if: false`
- **AND** it SHALL NOT pass a `--rule` CLI override for `complexity`

#### Scenario: Sonar runs only with credentials

- **WHEN** `SONAR_TOKEN` is available to the workflow
- **THEN** `client-sonarqube`/`server-sonarqube` SHALL run the SonarQube analysis plus the quality gate check with `continue-on-error: true`
- **WHEN** `SONAR_TOKEN` is not available
- **THEN** those jobs SHALL keep `if: false` with an explicit comment stating the missing credentials

#### Scenario: Disabled jobs are not counted as passing gates

- **WHEN** a quality job is evaluated for merge-blocking purposes
- **THEN** a job with `if: false` SHALL be reported as `skipped` in the canonical table and SHALL NOT be described as an active gate in `docs/CONTEXT-CICD.md`

### Requirement: Quality aggregator treats failure and cancellation as blocking

**Context:** `prebuild-quality-complete` (L1092) uses `always()` but only evaluates `contains(needs.*.result, 'failure')`, so a cancelled upstream job passes the gate; `ci-complete` already distinguishes both states.

`prebuild-quality-complete` and the other `prebuild-*-complete` aggregators SHALL keep an `if` expression containing `always()` (so the aggregator evaluates even when an upstream job failed) and their check step SHALL exit non-zero when any `needs` result is `failure` **or** `cancelled`. The aggregator's `needs` SHALL list exactly the blocking jobs of its substage (including the enabled `typecheck` and `complexity` jobs) and SHALL NOT list advisory jobs such as `docs-validation`. The `if: always()` guard SHALL NOT be removed in favor of implicit skipping, and the aggregator SHALL NOT use `|| echo` in its evaluation step.

#### Scenario: Aggregator runs after an upstream failure

- **WHEN** a job in `prebuild-quality-complete.needs` fails
- **THEN** the aggregator SHALL still run (`always()`) and SHALL exit non-zero

#### Scenario: Cancelled upstream job blocks the gate

- **WHEN** a job in `prebuild-quality-complete.needs` has result `cancelled`
- **THEN** the aggregator SHALL exit non-zero instead of reporting success

#### Scenario: Aggregator needs matches its substage

- **WHEN** `prebuild-quality-complete.needs` is read
- **THEN** it SHALL contain every blocking job of substage 2B
- **AND** it SHALL NOT contain advisory jobs (`docs-validation`, `dead-code` jobs remain advisory per the taxonomy)

### Requirement: Docs validation exists as an advisory gate

**Context:** `docs/learning/docs-changelog-validation.md` documents that no docs validation job exists and that `package.json` declares neither `markdownlint-cli` nor `vale`.

The repository SHALL provide docs validation configuration: `.markdownlint.json` (root) plus `.markdownlintignore`, and `.vale.ini` (root) with `StylesPath` under `.github/styles`, covering `docs/**/*.md` and `docs/changelog.md`. A `docs-validation` job SHALL exist in `.github/workflows/ci.yml`, classified as `advisory`: it SHALL run markdownlint and vale over the documentation, SHALL declare `continue-on-error: true`, SHALL declare `if: always()` so the report is produced even after upstream failures, SHALL publish its output (uploaded artifact and/or `$GITHUB_STEP_SUMMARY`), and SHALL NOT be part of the `needs` of `prebuild-quality-complete` while it is in phase 1.

#### Scenario: Docs validation configuration exists

- **WHEN** the repository root is listed
- **THEN** `.markdownlint.json`, `.markdownlintignore` and `.vale.ini` SHALL exist
- **AND** `.vale.ini` SHALL declare a `StylesPath` inside `.github/styles`

#### Scenario: Docs validation job is advisory

- **WHEN** the `docs-validation` job runs and markdownlint or vale report violations
- **THEN** the job SHALL publish its report and SHALL NOT fail the PR (phase 1)
- **AND** `prebuild-quality-complete` SHALL still succeed if only `docs-validation` reports violations

#### Scenario: Docs validation always reports

- **WHEN** an upstream quality job fails
- **THEN** `docs-validation` SHALL still run and upload its report

#### Scenario: Docs validation is not a blocking need

- **WHEN** `prebuild-quality-complete.needs` is read
- **THEN** `docs-validation` SHALL NOT be listed as a blocking dependency

#### Scenario: Aggregator evaluation step does not mask failures

- **WHEN** the evaluation step of `prebuild-quality-complete` is read
- **THEN** it SHALL NOT contain `|| echo` or any other construct that exits 0 after a check failure
- **AND** it SHALL exit non-zero when `contains(needs.*.result, 'failure')` or `contains(needs.*.result, 'cancelled')` is true

#### Scenario: Docs validation runs markdownlint and vale

- **WHEN** the `docs-validation` job is read
- **THEN** it SHALL invoke `npm run docs:lint` and `npm run docs:vale` (or their direct equivalents)
- **AND** it SHALL scope both tools to `docs/**/*.md` and `docs/changelog.md`

### Requirement: Gradual adoption of strict flags in apps/server

Strictness SHALL be adopted gradually in `apps/server/`, one flag (or one homogeneous sub-group of flags) per step, in order of increasing cost: cheap opt-ins first (`noImplicitReturns`, `noFallthroughCasesInSwitch`), then the `strict` family (`noImplicitAny`, then `strictNullChecks` with `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`), then `useUnknownInCatchVariables`, and `noUncheckedIndexedAccess` LAST. Each step SHALL be measurable with a `tsc --noEmit` error baseline before and after. `strict: true` SHALL NOT be flipped in a single step while error-producing flags remain unadopted. `tsconfig.json` SHALL be the single source of truth for strictness flags — no strictness flag may be passed only via CLI arguments in CI or scripts while missing from the config files.

#### Scenario: Cheap flags lead the adoption

- **WHEN** adoption begins
- **THEN** `noImplicitReturns` and `noFallthroughCasesInSwitch` SHALL be enabled before any high-cost flag
- **AND** the recorded history re-sequenced `noImplicitAny` first (2026-10-19, change `server-ts-express-contracts`, tasks 6.1/6.3) as a justified deviation; the spec scenario is amended to reflect that exception rather than the original intended order

#### Scenario: noImplicitAny precedes strictNullChecks

- **WHEN** the `strict` family is enabled incrementally
- **THEN** `noImplicitAny` SHALL be adopted before `strictNullChecks`

#### Scenario: useUnknownInCatchVariables is part of the family

- **WHEN** the server error-handling middleware is checked
- **THEN** with `useUnknownInCatchVariables` enabled, `catch (err)` SHALL type `err` as `unknown`, requiring explicit narrowing (e.g. `err instanceof Error`)

#### Scenario: noUncheckedIndexedAccess comes last

- **WHEN** flags are prioritized
- **THEN** `noUncheckedIndexedAccess` SHALL be the final strictness flag adopted, after all `strict`-family flags

#### Scenario: No single big-bang strict flip

- **WHEN** `tsconfig.json` files are edited
- **THEN** `strict: true` SHALL NOT be set while one or more required flags from the order above are still unadopted

#### Scenario: Config is the single source of truth

- **WHEN** local scripts and CI jobs type check the server workspace
- **THEN** the strictness flags applied SHALL come from `tsconfig.json` files, not from ad-hoc CLI flags

### Requirement: Strict-mode documentation with official references

`docs/learning/typescript-strict-check.md` SHALL reflect the implemented strictness state (existing `tsconfig.json` files, adopted flag order, `type-check` scripts, `lint-staged` coverage, CI jobs without `if: false`/`|| echo`) and SHALL cite official TypeScript documentation (`typescriptlang.org`) as normative references for flag semantics: at minimum `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/` and `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html`.

#### Scenario: Doc matches implemented state

- **WHEN** `docs/learning/typescript-strict-check.md` is read after the change
- **THEN** its description of tsconfig files, scripts, lint-staged and CI jobs SHALL match the repository state

#### Scenario: Official references present

- **WHEN** the doc's references section is read
- **THEN** it SHALL link `typescriptlang.org` documentation for `strict`, the tsconfig flag list and the `tsconfig.json` handbook page

### Requirement: Secret scanning gate taxonomy (blocking vs advisory)

Secret scanning SHALL be classified by enforcement level, following `docs/learning/secret-scanning.md` (§5.3, §6) and `docs/learning/quality-gates.md`: the PR-time scan (job `secrets`, `name: Security: Secret Detection` in `.github/workflows/ci.yml`, substage 2C) SHALL be a **blocking** gate that fails the check when a secret is found in the PR diff (gitleaks default `--exit-code 1`), and the scheduled full-history scan (job `gitleaks-full-scan` in `.github/workflows/scheduled-security.yml`) SHALL remain **advisory/audit** (`continue-on-error: true` + JSON/SARIF artifacts, findings reported as issues, never blocking merges). `continue-on-error` SHALL NOT be applied to the PR-time gitleaks step, and the licensed `gitleaks/gitleaks-action@v3` step SHALL remain optional (conditional on `GIT_LEAKS` per `docs/CONTEXT-CICD.md` §5.6) — a missing license SHALL produce a `::warning::`, never a failure. The taxonomy table in `docs/learning/quality-gates.md` SHALL include a secret-scanning row.

#### Scenario: New secret in a PR blocks the check

- **WHEN** the `secrets` job scans the PR diff (`git --log-opts="base..head"`) and gitleaks reports a finding
- **THEN** the step SHALL exit non-zero and the `Secret Detection` check SHALL fail, blocking the PR

#### Scenario: PR gate never uses continue-on-error

- **WHEN** `.github/workflows/ci.yml` job `secrets` is inspected
- **THEN** no `continue-on-error` SHALL be set on the OSS gitleaks scan step

#### Scenario: Scheduled full-history scan stays advisory

- **WHEN** the weekly full-history scan reports a historical finding
- **THEN** the run SHALL NOT fail because of it: both scan steps SHALL keep `continue-on-error: true` and SHALL upload the JSON/SARIF artifacts anyway

#### Scenario: Taxonomy row documented

- **WHEN** the gate taxonomy table in `docs/learning/quality-gates.md` is read
- **THEN** it SHALL contain a secret-scanning row marking `Secret Detection` (PR) as blocking and `gitleaks-full-scan` as advisory

### Requirement: Gitleaks CLI commands and `.gitleaks.toml` correctness

Scripts SHALL use only non-deprecated gitleaks commands (`detect`/`protect` were deprecated in `v8.19.0` in favor of `git`/`dir`/`stdin`, per `docs/learning/secret-scanning.md` §3.2): `security:secrets` SHALL run `gitleaks git --pre-commit --staged --verbose --redact --config .gitleaks.toml` and `security:secrets:full` SHALL run `gitleaks git --verbose --config .gitleaks.toml`. `.gitleaks.toml` SHALL not silently override default rules: `[extend]` SHALL declare `disabledRules = ["generic-api-key"]` while the custom rule is renamed `custom-api-key` (same regex), each custom rule SHALL declare `keywords` (prefilter before the regex), value-bearing rules SHALL declare `entropy`/`secretGroup` to limit false positives, and test-directory allowlist paths SHALL be anchored regexes `'''(^|/)tests?/'''` instead of bare substrings like `'''tests'''` (a bare substring hides real secrets committed under fixtures). Global allowlist SHALL include `\.vscode/`; `database-url` SHALL allowlist `example|placeholder` matches with `regexTarget = "match"`; the placeholder allowlists for `apps/server/ecosystem.config.js` and the socket training files (`docs/CONTEXT-CICD.md` §13.4) SHALL be preserved. A full scan SHALL complete with exit 0 on a clean tree. **The `secret-scanning` check SHALL be implemented in `.github/workflows/ci.yml` job `secrets` substage 2C, wireado al agregador `prebuild-security-complete.needs`, para bloquear merges via ruleset `required_status_checks`.**

#### Scenario: No deprecated commands in scripts

- **WHEN** `grep -n "gitleaks detect\|gitleaks protect" package.json` is executed
- **THEN** it SHALL return no matches and both `security:secrets` scripts SHALL invoke `gitleaks git`

#### Scenario: Default rule is no longer overridden

- **WHEN** `.gitleaks.toml` is read
- **THEN** `[extend]` SHALL contain `disabledRules = ["generic-api-key"]` and no `[[rules]]` block SHALL declare `id = "generic-api-key"` (the custom rule SHALL be `custom-api-key`)

#### Scenario: Custom rules declare prefilter keywords

- **WHEN** the five custom rules (`custom-api-key`, `jwt-secret-variable`, `generic-secret-variable`, `password-assignment`, `database-url`) are inspected
- **THEN** each SHALL declare a `keywords` array, and value-bearing rules SHALL declare `entropy`/`secretGroup`

#### Scenario: Test allowlist is anchored, not a substring

- **WHEN** the test allowlist entry is evaluated against a path such as `apps/server/tests/helpers/auth.js`
- **THEN** it SHALL match `'''(^|/)tests?/'''`-style anchored regexes and SHALL NOT use the bare substring `'''tests'''` (which would match any path containing "tests")

#### Scenario: Scan is clean on the current tree

- **WHEN** `gitleaks git --config .gitleaks.toml --redact --no-banner` runs over the repository
- **THEN** the config SHALL parse without errors and the command SHALL exit 0 on a clean tree (finding-exit still applies to real findings)

### Requirement: Workflow enablement and `secret-scanning` required status check

Both secret-scanning workflows SHALL be operational at GitHub level: `security.yml` and `scheduled-security.yml` SHALL have `state = active` in the Actions API (no longer `disabled_manually`, per `docs/CONTEXT-CICD.md` §3.4/§5.9). After at least one successful run has revealed the exact check name, the `main` ruleset `required_status_checks` SHALL include the secret-scanning check — the job `name: Security: Secret Detection` of job `secrets` in `.github/workflows/ci.yml`, substage 2C, wireado al agregador `prebuild-security-complete.needs` — referenced as the `secret-scanning` check — so a red or missing secret scan blocks merges (the ruleset currently requires 2 governance checks: `Governance: PR Body Lint` and `Prebuild Governance Complete`). The job SHALL keep `name: Security: Secret Detection`, because renaming breaks the check binding (`CONTEXT-CICD.md` §3.5 rules 7/8). Note: as of 2026-11-08 the owner declined task 6.2, so the binding is pending; the gate still runs red but is not yet ruleset-bound. This requirement covers enablement by `gh workflow enable` / GitHub UI; enabling GitHub-native `secret_scanning` + push protection (§5.7) stays a documented follow-up.

#### Scenario: Workflows are active

- **WHEN** `gh api repos/<owner>/<repo>/actions/workflows` is queried
- **THEN** `security.yml` and `scheduled-security.yml` SHALL report `state: active`

#### Scenario: PR reports the secret-scanning check

- **WHEN** a pull request targets `main`
- **THEN** the `Secret Detection` check SHALL be reported on the PR head commit

#### Scenario: Check is required by the ruleset

- **WHEN** the `main` ruleset `required_status_checks` is read
- **THEN** it SHALL include `Secret Detection` (strict) alongside the existing governance checks, and a merge SHALL be blocked while that check is failing or pending

#### Scenario: Exact check name is preserved

- **WHEN** the `secrets` job of `ci.yml` is edited
- **THEN** its `name:` SHALL remain exactly `Security: Secret Detection` so the ruleset binding does not break

### Requirement: `notify-failure` reacts to step outcome and docs reflect state

In `.github/workflows/scheduled-security.yml`, the `notify-failure` job SHALL NOT rely on the job-level `failure()` condition, because its scan steps use `continue-on-error: true` and therefore leave the job in `success` — a dead path (per `docs/learning/secret-scanning.md` §5.3 and `quality-gates.md` §3 semantics). The job SHALL use `if: always()` combined with a step-level outcome check (`steps.<scan-id>.outcome == 'failure'` for the JSON and SARIF scan steps, which SHALL carry explicit `id:`s) so an issue is created exactly when a scan step failed, and skipped when both succeed. Documentation SHALL reflect the implemented state: `docs/learning/secret-scanning.md` (commands, config fixes, enablement, notify fix) and `docs/CONTEXT-CICD.md` §13.4 (`security:secrets` no longer deprecated), §5.6 (`GIT_LEAKS` optional) and §5.7 (native secret scanning status).

#### Scenario: Condition uses step outcome, not job failure

- **WHEN** `.github/workflows/scheduled-security.yml` is read
- **THEN** `notify-failure` SHALL have no `if: failure()` condition and SHALL evaluate `steps.<scan-id>.outcome == 'failure'` under `if: always()`, and both scan steps SHALL declare explicit `id:` values

#### Scenario: Issue created when a scan step fails

- **WHEN** either scan step finishes with `outcome == "failure"` (findings or tool error)
- **THEN** `notify-failure` SHALL run and create a GitHub issue linking the workflow run

#### Scenario: No issue on a clean run

- **WHEN** both scan steps succeed
- **THEN** `notify-failure` SHALL be skipped and no issue SHALL be created

#### Scenario: Documentation matches implemented state

- **WHEN** `docs/learning/secret-scanning.md` and `docs/CONTEXT-CICD.md` (§13.4/§5.6/§5.7) are read after the change
- **THEN** they SHALL describe the current commands (`gitleaks git`), the corrected `.gitleaks.toml`, the `active` workflow states, the required `Secret Detection` check and the `steps.*.outcome` notification logic
