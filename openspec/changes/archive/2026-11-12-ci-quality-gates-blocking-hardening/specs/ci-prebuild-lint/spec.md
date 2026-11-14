# ci-prebuild-lint Specification (Delta)

## ADDED Requirements

### Requirement: ESLint cache and reporting

The `lint` scripts of all workspaces SHALL include `--cache --cache-location .cache/eslint/ --cache-strategy content` so CI reuses the ESLint cache across runs (content strategy avoids invalidation on `git clone` date changes).

#### Scenario: Cache hit in CI

- **WHEN** `.cache/eslint` is restored from cache
- **THEN** ESLint skips unchanged files
- **AND** the job runs faster than a cold run

### Requirement: Unused disable directives as errors

`eslint.config.js` SHALL set `linterOptions.reportUnusedDisableDirectives: 'error'` so stale `eslint-disable` directives fail the lint.

#### Scenario: Stale disable directive

- **WHEN** an `eslint-disable` no longer suppresses any violation
- **THEN** ESLint reports an error
- **AND** the lint fails with `--max-warnings 0`

### Requirement: ban-ts-comment for @ts-ignore

`eslint.config.js` SHALL apply `@typescript-eslint/ban-ts-comment` allowing `@ts-expect-error` only with a description; `@ts-ignore` SHALL be prohibited.

#### Scenario: @ts-ignore added

- **WHEN** code contains `// @ts-ignore` without justification
- **THEN** ESLint reports an error

### Requirement: SARIF upload for PR annotations

The `*-lint` jobs SHALL upload SARIF results with `security-events: write` so findings appear as PR annotations.

#### Scenario: Lint findings annotated

- **WHEN** ESLint finds violations
- **THEN** they appear as annotations in the PR via SARIF
  EOF
