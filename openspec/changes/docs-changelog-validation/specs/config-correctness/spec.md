## Purpose

Extends `config-correctness` beyond JS/Prettier tooling to documentation correctness: a single-source markdownlint configuration for Markdown structure, a single-source Vale configuration for prose quality, a `docs-validation` CI job gated by the quality aggregator, and a Spanish reference document describing the validation setup.

## ADDED Requirements

### Requirement: Markdown structure validation for docs and changelog

The system SHALL validate Markdown structure with `markdownlint-cli` using `.markdownlint.json` at the repository root as the single source of truth: `default: true`, `MD013` with `line_length: 120` / `heading_line_length: 120` / `code_block_line_length: 120` / `tables: false`, `MD033` restricted to `allowed_elements` (`br`, `img`, `div`, `span`, `sub`, `sup`), and `MD049`, `MD014`, `MD024`, `MD036`, `MD044`, `MD052` disabled. Generated artifacts SHALL be excluded via `.markdownlintignore` (`node_modules/`, `dist/`, `build/`, `coverage/`, `storybook-static/`, `package-lock.json`, `*.log`, `archive/`). `docs/changelog.md` (the Keep-a-Changelog file; there is no root `CHANGELOG.md`) SHALL be covered by config `overrides` relaxing table line length while keeping table-consistency rules (MD055/MD056/MD058/MD059/MD060) and final-newline (MD047) enforced. Root scripts SHALL expose the same config: `docs:lint` (auto-fix) and `docs:check` (gate, no `--fix`).

#### Scenario: Single config used everywhere

- **WHEN** `npm run docs:check` runs locally or the `docs-validation` job runs in CI
- **THEN** both SHALL resolve rules from the root `.markdownlint.json`
- **AND** no second markdownlint config file SHALL exist in the tree

#### Scenario: Ignored generated files are skipped

- **WHEN** markdownlint scans the repository
- **THEN** files under `node_modules/`, `dist/`, `build/`, `coverage/` and `storybook-static/` SHALL be skipped via `.markdownlintignore`
- **AND** files under `docs/` SHALL still be linted

#### Scenario: Changelog tables tolerated but structure enforced

- **WHEN** `docs/changelog.md` contains a version table line longer than 120 characters
- **THEN** `MD013` SHALL NOT report it (override with `tables: false`)
- **AND** an inconsistent table row (missing pipe/column) SHALL still fail `MD056`, and a missing trailing newline SHALL still fail `MD047`

#### Scenario: Gate mode does not rewrite files

- **WHEN** `npm run docs:check` (CI) runs
- **THEN** it SHALL run markdownlint WITHOUT `--fix` and exit non-zero on violations

#### Scenario: Auto-fix mode available locally

- **WHEN** a developer runs `npm run docs:lint`
- **THEN** fixable rules (MD004, MD007, MD009, MD012, MD030, MD031, MD032, MD047…) SHALL be corrected in place

### Requirement: Prose validation with Vale

The system SHALL validate prose with Vale using `.vale.ini` at the repository root as the single source of truth: `StylesPath = .github/styles`, `MinAlertLevel = warning`, default section `[*]` based on `Vale`, Markdown sections (`[*.{md,mdx}]`, `[docs/learning/*.md]`) based on `Vale, MiEstiloES`, and a relaxed `[docs/changelog.md]` section based on `Vale` only. `.github/styles/` SHALL contain the custom `MiEstiloES` style plus a vocabulary (`accept.txt` / `reject.txt`) covering project technical terms so `Vale.Spelling` does not flag them. Root scripts SHALL expose `docs:vale` (report, `--minAlertLevel=warning`) and `docs:sync` (style sync); Vale SHALL be installed from GitHub Releases (the npm `vale` package is orphaned), never from npm.

#### Scenario: Spanish prose checked with project vocabulary

- **WHEN** `npm run docs:vale` runs over `docs/learning/*.md`
- **THEN** the `MiEstiloES` style and the root vocabulary SHALL be applied
- **AND** terms listed in `.github/styles/config/vocabularies/Base/accept.txt` (e.g. `lint-staged`, `markdownlint`, `workspaces`) SHALL NOT be reported as spelling errors

#### Scenario: Changelog prose rules relaxed

- **WHEN** Vale evaluates `docs/changelog.md`
- **THEN** only the `Vale` base styles SHALL apply (section `[docs/changelog.md]`)
- **AND** the `MiEstiloES` prose rules SHALL NOT block the file

#### Scenario: Vale is not an npm dependency

- **WHEN** `package.json` dependencies and devDependencies are read
- **THEN** no `vale` npm package SHALL be declared
- **AND** `docs:vale` SHALL rely on the `vale` binary (GitHub Release) with `VALE_CONFIG_PATH` / `--config` pointing at the root `.vale.ini`

### Requirement: CI docs-validation job gates the quality substage

`.github/workflows/ci.yml` SHALL define a `docs-validation` job inside SUBSTAGE 2B (code quality), depending on `repo-discovery`, running on `pull_request` with `actions/checkout@v5` (fetch-depth 0) and `./.github/actions/setup-monorepo`, executing `npm run docs:check` and `npm run docs:vale`. The job SHALL be listed in the `needs` of the `prebuild-quality-complete` aggregator, so `ci-complete` blocks on documentation failures. No standalone `docs-validation.yml` workflow SHALL be created (prohibited by `zombie-workflow-guard`).

#### Scenario: Job lives in ci.yml substage 2B

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** a `docs-validation` job SHALL exist within the SUBSTAGE 2B section
- **AND** no `.github/workflows/docs-validation.yml` file SHALL exist

#### Scenario: Aggregator blocks on docs failures

- **WHEN** `docs:check` or `docs:vale` fails in the `docs-validation` job
- **THEN** `prebuild-quality-complete` SHALL report failure (it lists `docs-validation` in `needs`)
- **AND** `ci-complete` SHALL fail as a result, blocking the merge

#### Scenario: Job skips non-PR events

- **WHEN** the workflow triggers on a non-`pull_request` event
- **THEN** `docs-validation` SHALL be skipped, consistent with other substage 2B jobs

#### Scenario: No duplicate workflows

- **WHEN** the `zombie-workflow-guard` job evaluates the workflow set
- **THEN** it SHALL find documentation validation only inside `ci.yml`

### Requirement: Spanish reference documentation for docs/changelog validation

`docs/learning/docs-changelog-validation.md` SHALL exist in Spanish as the canonical reference for this validation setup, describing the real `.markdownlint.json`, `.markdownlintignore` and `.vale.ini` configuration, the `docs:*` scripts, the lint-staged entry, and the `docs-validation` CI job. It SHALL cite `docs/changelog.md` (not a non-existent root `CHANGELOG.md`) for every script/glob/job reference. `docs/CONTEXT-CICD.md` §13.4 (quality tools/jobs table) SHALL list the `docs-validation` job with its state.

#### Scenario: Doc matches the implementation

- **WHEN** `docs/learning/docs-changelog-validation.md` is read
- **THEN** every config file, script name and CI job it describes SHALL exist with the described behavior
- **AND** all changelog paths SHALL resolve to `docs/changelog.md`

#### Scenario: CI docs table updated

- **WHEN** `docs/CONTEXT-CICD.md` §13.4 is read
- **THEN** the quality job table SHALL include `docs-validation` (markdownlint + vale) with its gate state

#### Scenario: Doc validates clean

- **WHEN** `npm run docs:check` and `npm run docs:vale` run after the change
- **THEN** `docs/learning/docs-changelog-validation.md` and `docs/CONTEXT-CICD.md` SHALL pass both validations
