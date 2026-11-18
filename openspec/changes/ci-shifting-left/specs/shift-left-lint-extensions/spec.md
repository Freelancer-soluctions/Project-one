# shift-left-lint-extensions Specification

## Purpose

Extends the existing ESLint gate with security-focused rules on the server (`eslint-plugin-security`) and accessibility rules on the client (`eslint-plugin-jsx-a11y`), running through the same lint-staged pre-commit hook and the `client-lint`/`server-lint` jobs of `ci.yml` (no `quality.yml` — forbidden by zombie-workflow-guard), so SAST basics and a11y issues are caught at commit and PR time.

## ADDED Requirements

### Requirement: Server security lint rules

The server ESLint configuration SHALL include `eslint-plugin-security` with the `plugin:security/recommended` preset, so common security anti-patterns in Node.js code are flagged.

#### Scenario: Server code with security anti-pattern

- **WHEN** server code contains a security anti-pattern detected by `eslint-plugin-security` (e.g., `eval`, unsafe regex, path traversal)
- **THEN** ESLint SHALL report the violation
- **AND** the lint run SHALL fail with `--max-warnings 0`

#### Scenario: Server lint runs in CI

- **WHEN** the `server-lint` job of `ci.yml` runs (or lint-staged runs on a staged server file):
- **THEN** the security plugin rules SHALL be active
- **AND** the job SHALL fail if any security rule is violated

### Requirement: Client accessibility lint rules

The client ESLint configuration SHALL include `eslint-plugin-jsx-a11y` with the `plugin:jsx-a11y/recommended` preset, so accessibility issues in React components are flagged.

#### Scenario: Client component with a11y violation

- **WHEN** a React component contains an accessibility violation (e.g., missing `alt` on image, unlabeled input, non-interactive element with click handler)
- **THEN** ESLint SHALL report the a11y violation
- **AND** the lint run SHALL fail with `--max-warnings 0`

#### Scenario: Client lint runs in CI

- **WHEN** the `client-lint` job of `ci.yml` runs (or lint-staged runs on a staged client file):
- **THEN** the jsx-a11y plugin rules SHALL be active
- **AND** the job SHALL fail if any a11y rule is violated

### Requirement: Extended rules run via lint-staged

The extended ESLint rules SHALL run through the existing lint-staged pre-commit hook, so security and a11y violations are caught before commit.

#### Scenario: Staged file with violation

- **WHEN** a developer stages a JS/JSX file that violates a security or a11y rule
- **THEN** lint-staged SHALL run ESLint with the extended rules on the staged file
- **AND** the commit SHALL be blocked until the violation is fixed
