# Proposal

## Why

Import boundaries (dependency-cruiser) ya es blocking con baseline `--ignore-known`, pero el comando `depcruise-baseline` está deprecado desde 18.3.0 (verificación B7: usar `--baseline`), y la documentación de exit codes es imprecisa. El CLI principal `depcruise` NO expone `--exit-code`/`-e` (ese flag solo existe en el binario `depcruise-fmt`): el bloqueo fiable ya lo da el reporter `err`/`err-long`, cuyo exit code es el número de violaciones de severidad `error` (`advisedExitCode`), combinado con `--ignore-known`. La versión fijada en el repo es 18.2.0, que no soporta `--baseline` ni `--baseline-mode`. Este change cierra la gobernanza del baseline (CODEOWNERS ya cubierto por hardening P1.3), migra el comando al ratchet mecánico `--baseline-mode shrink-only`, corrige la documentación al mecanismo real de exit code, e incluye el upgrade.

## What Changes

- **Upgrade de dependency-cruiser** 18.2.0 → 18.7.2 (package.json + lockfile), en el mismo PR que la migración del comando, para no dejar CI rojo.
- **Migrar** `depcruise-baseline` → `depcruise --baseline --baseline-mode shrink-only` en el script `depcruise:baseline` de package.json (ratchet mecánico: solo poda violaciones corregidas, nunca añade nuevas).
- **Exit code fiable (mecanismo real, sin flag inexistente)**: los scripts root (`depcruise:ci`, `depcruise:report`), los jobs de CI (`client-import-bounds`, `server-import-bounds`) y lint-staged ya bloquean vía reporter `err`/`err-long` + `--ignore-known`. NO se añade `--exit-code`/`-e` (no existe en el CLI principal). Se corrige la documentación que lo afirmaba.
- **Gobernanza del baseline**: `.dependency-cruiser-known-violations.json` ya está bajo CODEOWNERS (owner de plataforma, hardening P1.3, `.github/CODEOWNERS:59`); regeneración solo en PR dedicado. Sin duplicado.
- **Ratchet documentado**: regeneración del baseline solo se poda, nunca crece (`--baseline-mode shrink-only`), en `quality-policy.md`.
- **Actualizar docs stale**: `docs/learning/import-boundaries.md`, `docs/pre-merge-gates-governance.md`.

## Capabilities

### New Capabilities

- `ci-import-boundaries-enforcement`: gobernanza del baseline (CODEOWNERS, comando actualizado, exit code fiable, ratchet, upgrade).

### Modified Capabilities

- (ninguna a nivel de requirements de producto; la gobernanza de CODEOWNERS se comparte con `ci-quality-gates-blocking-hardening` P1.3, que ya lista `.dependency-cruiser.*` y baselines)

## Impact

**Affected code:**

- `package.json` (dependency-cruiser 18.2.0 → 18.7.2; script `depcruise:baseline` migrado a `--baseline --baseline-mode shrink-only`. Los scripts `depcruise:ci`, `depcruise:report` y lint-staged ya usan `err`/`err-long` + `--ignore-known` y NO requieren cambios: el bloqueo fiable es el mecanismo real del reporter)
- `package-lock.json`
- `.github/workflows/ci.yml` (jobs `client-import-bounds`, `server-import-bounds`: ya bloquean vía `err --ignore-known`; sin cambios de flags)
- `.github/CODEOWNERS` (línea para `.dependency-cruiser-known-violations.json` YA presente en `:59` por hardening P1.3; sin duplicado)
- `docs/learning/import-boundaries.md`, `docs/pre-merge-gates-governance.md`

**Affected docs:**

- `docs/learning/quality-policy.md` (ratchet documentado)
- `docs/learning/import-boundaries.md` (exit code y comando actualizados)

**Dependencies:**

- dependency-cruiser 18.2.0 → 18.7.2

**Sistemas:**

- dependency-cruiser, GitHub Actions, Husky (lint-staged)

**Nota:** CODEOWNERS para `eslint.config.*`, `knip.json*` y el baseline `.dependency-cruiser-known-violations.json` se cubre en `ci-quality-gates-blocking-hardening` (P1.3, ya implementado). Este change es el dueño del comportamiento del baseline (comando + ratchet) pero no duplica la línea de CODEOWNERS. Shift-left pre-push con depcruise se declara como Non-Goal (el espejo pre-commit ya existe vía lint-staged con `err-long --ignore-known`, que bloquea con el mecanismo real del reporter).
