## Purpose

Reactivates lint-staged in the pre-commit hook so ESLint and Prettier run automatically on staged files before the existing SAST, secret scanning, and regression checks.

## ADDED Requirements

### Requirement: lint-staged runs in pre-commit
The `.husky/pre-commit` hook SHALL execute `npm exec lint-staged` at the start, before the parallel SAST/secrets/regression checks.

#### Scenario: Pre-commit invokes lint-staged
- **WHEN** a commit is created
- **THEN** `.husky/pre-commit` runs `npm exec lint-staged` first
- **AND** ESLint + Prettier autofix is applied to staged files before the SAST/secrets/regression checks run

#### Scenario: lint-staged failure blocks commit
- **WHEN** `npm exec lint-staged` fails
- **THEN** the pre-commit hook exits non-zero
- **AND** the commit is blocked

### Requirement: lint-staged config targets staged files
The root `package.json` lint-staged configuration SHALL apply format and lint to staged JS/TS/JSON files and run regression tests on staged test files.

#### Scenario: Staged source files processed
- **WHEN** files matching `*.{js,ts,cjs,mjs,d.cts,d.mts,json,jsonc}` are staged
- **THEN** lint-staged runs format and lint on them

#### Scenario: Staged test files run regression tests
- **WHEN** files matching `**/*.test.js` are staged
- **THEN** lint-staged runs the regression tests (`test:regression` in the server-express workspace)

### Requirement: Cross-platform lint-staged execution
The hook SHALL use `npm exec lint-staged` (not `npx`) for Windows compatibility.

#### Scenario: Windows-compatible invocation
- **WHEN** the pre-commit hook runs on Windows (Git Bash / MSYS2)
- **THEN** `npm exec lint-staged` is used instead of `npx` to avoid the Windows spawn loop bug
- **AND** the hook keeps the `#!/usr/bin/env sh` shebang
