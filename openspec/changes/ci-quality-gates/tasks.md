# Implementation Tasks: CI Quality Gates

> **Dependency**: Este cambio debe completarse ANTES que `ci-test-integration` (coverage baselines alimentan thresholds).
> **Predecesor de**: ci-test-integration

## 0. Pre-flight Discovery

- [ ] 0.1 Run `npm run lint --workspaces --if-present` WITHOUT `--max-warnings 0` — capture current warning/error count per workspace
- [ ] 0.2 Document current lint baseline in session notes (reference for how many issues to fix)
- [ ] 0.3 Investigate `eslintConfig` legacy field in `apps/server/package.json` — verify it's ignored by ESLint 9 flat config
- [ ] 0.4 Check `eslint.config.js` root `ignores` to ensure server test files (`apps/server/tests/**/*.js`) are NOT excluded

## 1. ESLint Blocking Gate in CI

- [ ] 1.1 Add `--max-warnings 0` to client lint script in `apps/client/package.json`: change `"lint": "eslint \"**/*.{js,jsx}\""` to `"lint": "eslint \"**/*.{js,jsx}\" --max-warnings 0"`
- [ ] 1.2 Add `--max-warnings 0` to server lint script in `apps/server/package.json`: change `"lint": "eslint \"**/*.js\""` to `"lint": "eslint \"**/*.js\" --max-warnings 0"`
- [ ] 1.3 Run `npm run lint --workspaces --if-present` to verify lint passes with `--max-warnings 0` (fix existing errors/warnings found in pre-flight)
- [ ] 1.4 Verify `quality.yml` correctly fails when lint returns non-zero exit code (confirm: GitHub Actions treats any step with non-zero exit as failure — no YAML change needed)
- [ ] 1.5 Resolve server legacy `eslintConfig`: either (a) add `standard` rules to root `eslint.config.js` under `files: ['apps/server/**/*.js']`, or (b) remove the dead field from `apps/server/package.json` and add note about flat config

## 2. Pre-commit lint-staged Reactivation

- [ ] 2.1 Edit `.husky/pre-commit` to add lint-staged execution before parallel SAST/secrets/regression checks:
  ```
  #!/usr/bin/env sh
  set -e

  echo "Running pre-commit checks..."

  # 1. lint-staged first (fast, may modify files via autofix)
  echo "Running lint-staged..."
  npm exec lint-staged || { echo "lint-staged failed"; exit 1; }

  # 2. SAST + Secrets + Regression in parallel (existing logic)
  ...
  ```
- [ ] 2.2 Verify lint-staged config in root `package.json` correctly targets staged files:
  - `*.{js,ts,cjs,mjs,d.cts,d.mts,json,jsonc}` → format + lint
  - `**/*.test.js` → test:regression (server-express workspace)
- [ ] 2.3 Verify `npm exec lint-staged` works on current platform (Windows compat)

## 3. Coverage Baseline Measurement & Documentation

- [ ] 3.1 Run `npm run test:coverage --workspace=apps/client` and capture metrics
- [ ] 3.2 Run `npm run test:coverage --workspace=apps/server` and capture metrics
- [ ] 3.3 Add section "Coverage Baselines (Jul 2026)" to `docs/cicd-plan-implementacion.md` as §14.5 (after §14 Próximos pasos concretos, before §15 Referencias), with:
  - Client coverage: statements, branches, functions, lines
  - Server coverage: statements, branches, functions, lines
  - Date of measurement
  - Note: thresholds will be configured in `ci-test-integration` change (which depends on this data)

## 4. Verification

- [ ] 4.1 Run `npm run lint --workspaces --if-present` to confirm lint fails correctly with `--max-warnings 0`
- [ ] 4.2 Run `npm exec lint-staged -- --dry-run` to verify lint-staged config parses correctly (uses `npm exec`, not `npx` — Windows compat)
- [ ] 4.3 Verify `.husky/pre-commit` syntax: `bash .husky/pre-commit` (dry run without actual git)
- [ ] 4.4 Verify documentation changes in `docs/cicd-plan-implementacion.md` §14.5 are complete
- [ ] 4.5 Add dependency annotation in both changes: ci-quality-gates → ci-test-integration (baselines before thresholds)
- [ ] 4.6 Commit all changes with message: `feat(ci): enforce ESLint blocking gate, reactivate lint-staged, record coverage baselines`
