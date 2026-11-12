# eslint-blocking-gate Specification (Delta)

## ADDED Requirements

### Requirement: Unused disable directives as errors

The ESLint configuration SHALL set `linterOptions.reportUnusedDisableDirectives: 'error'` so stale `eslint-disable` directives fail the lint.

#### Scenario: Stale directive

- **WHEN** an `eslint-disable` no longer suppresses any violation
- **THEN** ESLint reports an error
- **AND** the lint fails with `--max-warnings 0`

### Requirement: ban-ts-comment

The ESLint configuration SHALL apply `@typescript-eslint/ban-ts-comment`, allowing `@ts-expect-error` only with a description; `@ts-ignore` SHALL be prohibited.

#### Scenario: @ts-ignore without description

- **WHEN** code contains `// @ts-ignore`
- **THEN** ESLint reports an error
  EOF
