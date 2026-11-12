# Proposal

## Why

Dead code (knip) es blocking en CI (contrario a la recomendación advisory del PRD, D5 abierto), en modo default (no `--production`), sin `--cache`, y knip está desactualizado (6.32.2 vs 6.45.1). La config tiene muchos `ignore`/`ignoreDependencies`/`ignoreIssues` (PRD advierte puntos ciegos). Este change calibra knip: upgrade, modo `--production` para PR + default para scheduled, `--cache`, ratchet, y promoción documentada a blocking estricto.

## What Changes

- Upgrade knip 6.32.2 → 6.45.1.
- Modo `--production` en PR (solo código de producción + dependencies) y modo default en job scheduled.
- Añadir `--cache` (ubicación `node_modules/.cache/knip`) — efectivo sin steps nuevos porque `setup-monorepo` ya cachea `node_modules/.cache`.
- Mantener advisory con `--no-exit-code` hasta calibrar config; luego promoción a blocking estricto documentada en `quality-policy.md`.
- Revisar `ignore`/`ignoreDependencies`/`ignoreIssues` para reducir puntos ciegos (usar `ignoreExportsUsedInFile`, entradas explícitas).
- **Reconciliación con `ci-prebuild-substage-structure-phase2`**: phase2 propone remover `continue-on-error` (ya satisfecho en código — los jobs no tienen `continue-on-error`). Este change establece el estado advisory (`--no-exit-code`) durante la calibración, supersediendo la intención de phase2. Phase2 se considera superseded. Ver `docs/learning/quality-changes-decision.md` §5b.

## Capabilities

### New Capabilities

- `ci-dead-code-advisory-calibration`: calibración de knip (upgrade, --production/--cache/--no-exit-code, ratchet, promoción documentada).

### Modified Capabilities

- `knip-config-single-source`: upgrade de versión en `$schema` y config.

## Impact

**Affected code:**

- `package.json` (knip 6.32.2 → 6.45.1)
- `knip.jsonc` (revisión de ignore, $schema)
- `.github/workflows/ci.yml` (jobs `*-dead-code`, flags)

**Affected docs:**

- `docs/learning/quality-policy.md`

**Sistemas:**

- GitHub Actions, knip
