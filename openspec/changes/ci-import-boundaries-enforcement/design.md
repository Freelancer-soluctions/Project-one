# Design

## Context

Baseline no bajo CODEOWNERS; `depcruise-baseline` deprecado desde 18.3.0 (verificación B7); exit codes imprecisos ("número de violaciones error", puede ser >2). La versión fijada en el repo (18.2.0) no soporta `--baseline` ni `--exit-code`. Los jobs de CI no usan `--exit-code` (usan `--output-type err --ignore-known` inline). Docs stale (`import-boundaries.md`, `pre-merge-gates-governance.md`).

## Goals / Non-Goals

**Goals:** Gobernanza del baseline, comando actualizado, exit code fiable, ratchet, upgrade incluido.

**Non-Goals:** No cambiar reglas de boundaries. No tocar CODEOWNERS para eslint/knip (pertenece a `ci-quality-gates-blocking-hardening` P1.3). No añadir depcruise al pre-push (el espejo pre-commit ya existe vía lint-staged con `--exit-code` tras este change).

## Decisions

1. **Upgrade en el mismo PR:** 18.2.0 → ≥18.3.0 junto con los flags, para no dejar CI rojo (patrón de `ci-dead-code-advisory-calibration`).
2. **`--exit-code` uniforme:** aplicar a todas las invocaciones `err`/`err-long` (scripts root, jobs CI, lint-staged) para paridad pre-commit/CI.
3. **`depcruise --baseline`** en lugar de `depcruise-baseline` (deprecado).
4. **CODEOWNERS:** añadir solo la línea del baseline (`.dependency-cruiser-known-violations.json`), coordinando con hardening P1.3 para evitar duplicado (last-match-wins).
5. **Ratchet:** regeneración del baseline solo en PR dedicado, solo se poda. Verificar que `--baseline` escribe el mismo formato que `.dependency-cruiser-known-violations.json` (58 entradas) antes de migrar.
6. **Docs:** actualizar `import-boundaries.md` y `pre-merge-gates-governance.md`.

## Risks / Trade-offs

- Flags inexistentes en la versión fija (18.2.0): mitiga el upgrade en el mismo PR.
- Cambio de semántica de exit code (de "count de errores" a `--exit-code`): mitiga con pre-flight (verificar que violación nueva falla y conocida pasa).
- Regeneración de baseline con `--baseline`: validar formato contra el baseline existente antes de migrar.
- Solape de CODEOWNERS con hardening: delimitar propiedad (este change = baseline; hardening = patrón general).

## Migration Plan

1. Upgrade dependency-cruiser ≥18.3.0 (package.json + lockfile).
2. Migrar `depcruise-baseline` → `depcruise --baseline` en scripts.
3. Añadir `--exit-code` a scripts root (`depcruise`, `depcruise:ci`, `depcruise:report`) y a lint-staged (`depcruise:report`).
4. Añadir `--exit-code` a jobs `client-import-bounds` y `server-import-bounds` en `ci.yml`.
5. Añadir línea de CODEOWNERS para el baseline.
6. Verificar: violación nueva falla, conocida pasa.
7. Actualizar docs stale.
8. Documentar ratchet en `quality-policy.md`.

## Open Questions

- Ninguna.
