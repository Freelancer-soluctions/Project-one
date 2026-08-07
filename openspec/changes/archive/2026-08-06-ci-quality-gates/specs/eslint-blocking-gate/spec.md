## Purpose

Makes ESLint a blocking quality gate in CI: any lint error or warning in a pull request fails the workflow and blocks the merge, the quality workflow fails on non-zero lint exit codes without YAML changes, and the legacy server `eslintConfig` is resolved so the root ESLint 9 flat config is authoritative.

## ADDED Requirements

### Requirement: ESLint blocking gate in CI

The `lint` scripts of both workspaces SHALL fail on any lint warning or error so ESLint acts as a blocking gate for pull requests.

#### Scenario: Lint warnings treated as errors

- **WHEN** `npm run lint` runs in CI
- **THEN** the client lint script runs `eslint "**/*.{js,jsx}" --max-warnings 0`
- **AND** the server lint script runs `eslint "**/*.js" --max-warnings 0`
- **AND** any warning or error returns a non-zero exit code

#### Scenario: Pre-flight discovery before enabling the gate

- **WHEN** the gate is activated
- **THEN** a pre-flight lint run WITHOUT `--max-warnings 0` captures the current warning/error count per workspace first
- **AND** existing errors/warnings are fixed so the gate passes from the first run

### Requirement: quality.yml fails on lint errors

The `quality.yml` workflow SHALL fail the check when the lint step returns a non-zero exit code, without requiring YAML changes.

#### Scenario: Non-zero exit fails the step

- **WHEN** `npm run lint` with `--max-warnings 0` returns a non-zero exit code
- **THEN** GitHub Actions fails the lint step
- **AND** the PR check is reported as failing, blocking the merge

### Requirement: Server legacy eslintConfig resolution

The legacy `eslintConfig` field in `apps/server/package.json` SHALL be resolved so the root ESLint 9 flat config governs the server workspace without dead configuration.

#### Scenario: Dead config investigated

- **WHEN** the server legacy `eslintConfig` field (extending `standard`) is present
- **THEN** the field is verified to be ignored by ESLint 9 flat config
- **AND** either `standard` rules are added to the root `eslint.config.js` under `files: ['apps/server/**/*.js']` (option A) or the dead field is removed with a note that the root flat config governs both workspaces (option B)

#### Scenario: Test files not excluded

- **WHEN** the root `eslint.config.js` ignores are reviewed
- **THEN** server test files (`apps/server/tests/**/*.js`) are confirmed NOT excluded from linting
