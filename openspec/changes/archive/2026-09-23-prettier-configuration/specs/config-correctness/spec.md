# Spec Delta

## Purpose

Prettier configuration correctness for the monorepo: `.prettierrc.yaml` (commented YAML + schemastore `$schema`) is the single source of truth for formatting, with total value parity with the deleted `.prettierrc` JSON, and every enforcement layer (docs citations, lint-staged, CI `format:check`, `eslint-config-prettier`) references the new config name.

## ADDED Requirements

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
