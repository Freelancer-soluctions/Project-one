# Proposal

## Why

Import boundaries (dependency-cruiser) ya es blocking con baseline `--ignore-known`, pero el baseline (`.dependency-cruiser-known-violations.json`) no está bajo CODEOWNERS (PRD EX-1), el comando `depcruise-baseline` está deprecado desde 18.3.0 (verificación B7: usar `--baseline`), y los exit codes documentados (1/2) son imprecisos (usar `--exit-code` para bloqueo fiable). Además, la versión fijada en el repo es 18.2.0, que no soporta `--baseline` ni `--exit-code`. Este change cierra la gobernanza del baseline y corrige el comando, upgrade incluido.

## What Changes

- **Upgrade de dependency-cruiser** 18.2.0 → ≥18.3.0 (package.json + lockfile), en el mismo PR que los flags, para no dejar CI rojo.
- **Migrar** `depcruise-baseline` → `depcruise --baseline` en los scripts de package.json.
- **Añadir `--exit-code`/`-e`** a todas las invocaciones `err`/`err-long` (scripts root + jobs de CI + lint-staged) para bloqueo fiable y semántica uniforme entre pre-commit y CI.
- **Actualizar jobs de CI** (`client-import-bounds`, `server-import-bounds`) para usar `--exit-code`.
- **Gobernanza del baseline**: añadir `.dependency-cruiser-known-violations.json` a CODEOWNERS (owner de plataforma), regeneración solo en PR dedicado.
- **Ratchet documentado**: regeneración del baseline solo se poda, nunca crece (en `quality-policy.md`).
- **Actualizar docs stale**: `docs/learning/import-boundaries.md`, `docs/pre-merge-gates-governance.md`.

## Capabilities

### New Capabilities

- `ci-import-boundaries-enforcement`: gobernanza del baseline (CODEOWNERS, comando actualizado, exit code fiable, ratchet, upgrade).

### Modified Capabilities

- (ninguna a nivel de requirements de producto; la gobernanza de CODEOWNERS se comparte con `ci-quality-gates-blocking-hardening` P1.3, que ya lista `.dependency-cruiser.*` y baselines)

## Impact

**Affected code:**

- `package.json` (dependency-cruiser 18.2.0 → ≥18.3.0; scripts `depcruise:baseline`, `depcruise:ci`, `depcruise` y `depcruise:report` con `--exit-code`)
- `package-lock.json`
- `.github/workflows/ci.yml` (jobs `client-import-bounds`, `server-import-bounds`: añadir `--exit-code`)
- `.github/CODEOWNERS` (línea para `.dependency-cruiser-known-violations.json` — coordinar con hardening P1.3 para evitar duplicado; este change es el dueño del comportamiento del baseline)
- `docs/learning/import-boundaries.md`, `docs/pre-merge-gates-governance.md`

**Affected docs:**

- `docs/learning/quality-policy.md` (ratchet documentado)
- `docs/learning/import-boundaries.md` (exit code y comando actualizados)

**Dependencies:**

- dependency-cruiser 18.2.0 → ≥18.3.0

**Sistemas:**

- dependency-cruiser, GitHub Actions, Husky (lint-staged)

**Nota:** CODEOWNERS para `eslint.config.*` y `knip.json*` se cubre en `ci-quality-gates-blocking-hardening` (P1.3). Este change añade solo la línea del baseline. Shift-left pre-push con depcruise se declara como Non-Goal (el espejo pre-commit ya existe vía lint-staged con `--exit-code` tras este change).
