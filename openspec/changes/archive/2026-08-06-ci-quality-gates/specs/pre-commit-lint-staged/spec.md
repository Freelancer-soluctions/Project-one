## Purpose

Reactivates lint-staged in the pre-commit hook so ESLint and Prettier run automatically on staged files before the existing SAST and secret scanning checks.

## ADDED Requirements

### Requirement: lint-staged runs in pre-commit

The `.husky/pre-commit` hook SHALL execute `npm exec lint-staged` at the start, before the parallel SAST/secrets checks.

#### Scenario: Pre-commit invokes lint-staged

- **WHEN** a commit is created
- **THEN** `.husky/pre-commit` runs `npm exec lint-staged` first
- **AND** ESLint + Prettier autofix is applied to staged files before the SAST/secrets checks run

#### Scenario: lint-staged failure blocks commit

- **WHEN** `npm exec lint-staged` fails
- **THEN** the pre-commit hook exits non-zero
- **AND** the commit is blocked

### Requirement: Cross-platform lint-staged execution

The hook SHALL use `npm exec lint-staged` (not `npx`) for Windows compatibility.

#### Scenario: Windows-compatible invocation

- **WHEN** the pre-commit hook runs on Windows (Git Bash / MSYS2)
- **THEN** `npm exec lint-staged` is used instead of `npx` to avoid the Windows spawn loop bug
- **AND** the hook keeps the `#!/usr/bin/env sh` shebang

## Notes

- Regression execution is intentionally NOT part of pre-commit. Per the three-tier strategy in `docs/testing-architecture.md` §7.5 (decision origin: archived `2026-07-28-pre-push-scoped-tests`), regression tests run in pre-push (scoped `vitest run --changed origin/main`) and in CI (full unit/integration). Pre-commit is scoped to lint/format only via lint-staged.
