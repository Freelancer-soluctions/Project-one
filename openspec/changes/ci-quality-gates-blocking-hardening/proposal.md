# Proposal

## Why

El análisis comparativo (`docs/learning/quality-gap-analysis.md`) y su verificación (`docs/learning/quality-gap-analysis-verification.md`) contra el PRD `PRDS/Stage-Quality-(Grupo-A)-shift-left-y-gates-enterprise.md` identificaron brechas concretas en el stage Quality: `npm ci` sin `--ignore-scripts` (riesgo de lifecycle scripts en CI), sin caché de ESLint ni tsBuildInfo en CI, `reportUnusedDisableDirectives` en `warn` (no `error`), agregador `prebuild-quality-complete` que no trata `skipped` como fail y que interpola `${{ }}` directo en `run:`, CODEOWNERS incompleto (no cubre baselines/allowlists/config), ausencia de `quality-policy.md`/`quality-exceptions.md`, y `@ts-ignore` sin prohibición. Todos los gates de este change serán **blocking desde el día 1** (sin fase advisory), con shift-left en pre-commit/pre-push y estrategias enterprise (ratchet, solo-afectado, cachés, supresiones con costo, versiones fijadas). Los gaps de knip, formato server, tipos y docs/CHANGELOG se cubren en changes dedicados (`ci-dead-code-advisory-calibration`, `ci-format-check-blocking`, `server-typescript-migration`, `docs-changelog-validation`).

## What Changes

- **Seguridad del stage (P0)**: `setup-monorepo` pasa a `npm ci --ignore-scripts` + paso explícito `npx prisma generate` en jobs que lo requieran; agregador `prebuild-quality-complete` pasa `needs` por env var (`NEEDS: ${{ toJSON(needs) }}`) y falla ante `skipped` no autorizado por `repo-discovery` (reutilizando el patrón de `prebuild-security-complete`).
- **Shift-left (P0/P1)**: hook `pre-push` añade `npm run typecheck && npm run deps:boundaries`; vale se añade en advisory a `docs-validation` (P1).
- **Lint (P1)**: flags de caché de ESLint (`--cache --cache-location .cache/eslint/ --cache-strategy content`) en scripts `lint` de workspaces + cache en CI; `linterOptions.reportUnusedDisableDirectives: 'error'` en `eslint.config.js`; regla `@typescript-eslint/ban-ts-comment` (permitir `@ts-expect-error` solo con descripción); SARIF upload para anotaciones en PR (P2).
- **Gobernanza (P1)**: CODEOWNERS ampliado a `eslint.config.*`, `.dependency-cruiser.*`, `knip.json*`, baselines, allowlists, `scripts/ci/`, `eslint-suppressions.json`; creación de `docs/learning/quality-policy.md` y `docs/learning/quality-exceptions.md` (EX-3) con registro de gates, excepciones, ratchet y runbook.
- **Manifest guard (P2)**: allowlist extraída a `manifest-allowlist.json` versionado con motivo/responsable/issue y CODEOWNERS.

## Capabilities

### New Capabilities

- `quality-governance`: registro de estado de gates (`quality-policy.md`), registro de excepciones (`quality-exceptions.md`) con motivo/responsable/caducidad, CODEOWNERS completo sobre baselines/allowlists/config, runbook de operación, política de actualización de herramientas, ratchet.
- `quality-gate-aggregator-strict`: agregador `prebuild-quality-complete` estricto que trata `skipped` como fail salvo autorizado por `repo-discovery`, con `needs` pasado por env var (sin interpolación en `run:`).

### Modified Capabilities

- `ci-prebuild-lint`: caché de ESLint, `reportUnusedDisableDirectives: 'error'`, `ban-ts-comment`, SARIF upload.
- `ci-prebuild-substage-structure`: agregador estricto con skipped handling y env var.
- `root-manifest-hygiene`: allowlist externalizada a archivo versionado.

## Impact

**Affected code:**

- `.github/workflows/ci.yml` (agregador `prebuild-quality-complete`, jobs `client-lint`/`server-lint`/`e2e-lint`, `docs-validation`, `setup-monorepo` usage)
- `.github/actions/setup-monorepo/action.yml` (`npm ci` → `npm ci --ignore-scripts`)
- `.github/CODEOWNERS` (ampliación de patrones)
- `eslint.config.js` (`linterOptions.reportUnusedDisableDirectives`, `ban-ts-comment`)
- `apps/{client,server}/package.json` (scripts `lint` con flags de cache)
- `scripts/check-root-manifest.mjs` (lectura de allowlist externa)
- `manifest-allowlist.json` (nuevo, raíz)
- `docs/learning/quality-policy.md` (nuevo)
- `docs/learning/quality-exceptions.md` (nuevo)
- `.husky/pre-push` (typecheck + depcruise)

**Affected docs:**

- `docs/learning/quality-gates.md` (runbook ampliado)
- `docs/learning/quality-gap-analysis.md` / `quality-gap-analysis-verification.md` (referencia)

**Dependencies nuevas:**

- Ninguna nueva (knip upgrade se cubre en `ci-dead-code-advisory-calibration`)

**Sistemas:**

- GitHub Actions (agregador estricto, CODEOWNERS enforcement)
- Husky (pre-push ampliado)
- ESLint, markdownlint, vale
