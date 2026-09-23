## MODIFIED Requirements

### Requirement: ESLint blocking gate in CI

The `lint` scripts of both workspaces SHALL fail on any lint warning or error so ESLint acts as a blocking gate for pull requests, with complexity threshold adjusted to match existing baseline.

#### Scenario: Lint warnings treated as errors

- **WHEN** `npm run lint` runs in CI
- **THEN** the client lint script runs `eslint "**/*.{js,jsx}" --max-warnings 0`
- **AND** the server lint script runs `eslint "**/*.js" --max-warnings 0`
- **AND** any warning or error returns a non-zero exit code

#### Scenario: Pre-flight discovery before enabling the gate

- **WHEN** the gate is activated
- **THEN** a pre-flight lint run WITHOUT `--max-warnings 0` captures the current warning/error count per workspace first
- **AND** existing errors/warnings are fixed so the gate passes from the first run

#### Scenario: Complexity threshold adjusted to baseline

- **WHEN** ESLint evaluates cyclomatic complexity
- **THEN** the complexity rule uses `["error", 20]` instead of `["error", 15]`
- **AND** the 8 existing functions with complexity c16-c18 pass without errors
