# Implementation Tasks: CI Cleanup Enterprise

> **Independiente**: Este cambio no depende de otros cambios OpenSpec.
> **Riesgo**: Bajo — solo afecta archivos CI, no toca código de aplicación.

## 0. Pre-flight Verification

- [x] 0.1 List all workflows in `.github/workflows/` — inventario DINÁMICO (`ls .github/workflows/*.yml`): confirmar 8 archivos actuales (ci-enterprise.yml, ci.yml, formatter.yml, lint.yml, pr-validation.yml, quality.yml, release.yml, security.yml) — si hay más (changes futuros que crean workflows), registrarlos en el inventario en vez de fallar
- [x] 0.2 Verify `lint.yml` is not referenced by any workflow or schedule (check `ci.yml` — references are commented out)
- [x] 0.3 Verify `formatter.yml` is not referenced by any workflow or schedule (check `ci.yml` — references are commented out)
- [x] 0.4 Verify `pr-validation.yml` is not referenced by any workflow or docs
- [x] 0.5 Verify no active workflow runs for zombie workflows:
  ```bash
  gh run list --workflow pr-validation.yml --limit 5
  gh run list --workflow lint.yml --limit 5
  gh run list --workflow formatter.yml --limit 5
  ```
- [x] 0.6 Check if any external repos call `ci-enterprise.yml` (not deleting, just verify)

## 1. Delete Zombie Workflows

- [x] 1.1 Delete `.github/workflows/pr-validation.yml`:
  ```bash
  git rm .github/workflows/pr-validation.yml
  ```
  Rationale: Marked deprecated since Feb 2026. Replaced by ci.yml.

- [x] 1.2 Delete `.github/workflows/lint.yml`:
  ```bash
  git rm .github/workflows/lint.yml
  ```
  Rationale: Unused isolated workflow. Lint is covered by `quality.yml`.

- [x] 1.3 Delete `.github/workflows/formatter.yml`:
  ```bash
  git rm .github/workflows/formatter.yml
  ```
  Rationale: Unused isolated workflow. Format check is covered by `quality.yml`.

## 2. ci-enterprise.yml (Left Intact)

- [x] 2.1 No changes to `ci-enterprise.yml` — left as-is per decision (not actively used, but preserved for reference)

## 3. Fix release.yml Node Version + Stale Comments

- [x] 3.1 Edit `.github/workflows/release.yml`: change `node-version: 20` to `node-version-file: .nvmrc` on the `actions/setup-node@v4` step
  - Before: `node-version: 20`
  - After: `node-version-file: .nvmrc`
- [x] 3.2 Remove commented-out lint and formatter references from `ci.yml` (lines ~41-47 referencing `linter.yml` and `formatter.yml`) — these files will no longer exist
- [x] 3.3 Add `cache-dependency-path: package-lock.json` to `release.yml` setup-node step for consistency with other workflows

## 4. Update Documentation

- [ ] 4.1 Update `README.md` CI table: remove or mark `pr-validation.yml` entry (line ~253)
- [ ] 4.2 Update `docs/cicd-estado-actual.md`: remove references to deleted zombie workflows from tables and inventory lists (~10 references)
- [ ] 4.3 Update `docs/cicd-plan-implementacion.md`: update CI workflow inventory to reflect deleted files

## 5. Verify Remaining Workflows Consistency

- [x] 5.1 Verify `ci.yml` uses `node-version-file: .nvmrc` (via quality.yml — confirm quality.yml also uses .nvmrc)
- [x] 5.2 Verify `quality.yml` uses `node-version-file: .nvmrc` — ✅ Already correct (confirmed)
- [x] 5.3 Verify `security.yml` uses `node-version-file: .nvmrc` — ✅ Already correct (confirmed)
- [x] 5.4 Verify `release.yml` now uses `node-version-file: .nvmrc` (post-fix)
- [x] 5.5 Verify that ALL remaining workflows use `node-version-file: .nvmrc` with no hardcoded node versions
- [x] 5.6 Verify no references to deleted workflows in codebase:
  ```bash
  grep -r "pr-validation.yml\|lint.yml\|formatter.yml" . --include="*.yml" --include="*.yaml" --include="*.md" --exclude-dir=node_modules --exclude-dir=.git
  ```

## 6. Final Validation

- [x] 6.1 Run `git status` to confirm only intended files are staged/deleted
- [x] 6.2 Run `git diff --stat` to review all changes at a glance
- [x] 6.3 Verificar el set esperado de workflows DINÁMICAMENTE (`ls .github/workflows/*.yml` = set inicial menos los eliminados en este change; si existen workflows de changes posteriores mergeados, el inventario debe incluirlos — no asumir lista fija de 5)
- [ ] 6.4 Commit with message: `chore(ci): remove zombie workflows, fix release.yml node-version to .nvmrc, update docs`

## Notes

- All other workflows (`ci.yml`, `quality.yml`, `security.yml`) already use `node-version-file: .nvmrc` — no changes needed.
- **Node 20 → 22**: The change from `node-version: 20` to `.nvmrc` (22.22.0) bumps Node version. Verify compatibility before merging.
- `ci-enterprise.yml` preserved as-is per team decision (not active, but kept for reference).
- After merge, monitor first workflow run to confirm no breakage.
