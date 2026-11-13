# Proposal

## Why

El job de tipos (`tsc --noEmit`) corre en client/server sin `--incremental`/`--tsBuildInfoFile` explícito en CI ni caché del tsBuildInfo. `strict` ya está activo en `apps/server/tsconfig.json` (Fase 4 completada, 2026-10-20, 0 errores) y se gobierna por `openspec/specs/config-correctness` (un flag por paso). El gap real de este change es únicamente: **persistir y cachear el tsBuildInfo en CI** para reutilizarlo entre corridas (sin prometer aceleración, que con `--noEmit` es marginal — verificación A2). La regla `@typescript-eslint/ban-ts-comment` se añade en `ci-quality-gates-blocking-hardening` (P1.6), que ya toca `eslint.config.js`; no se duplica aquí.

## What Changes

- Añadir `--incremental --tsBuildInfoFile` al step `TypeCheck` de `ci.yml` (client y server) para persistir el tsBuildInfo.
- Cachear el directorio del tsBuildInfo en CI (`actions/cache`) con clave de lockfile + fuentes.
- Declarar explícitamente que el client (100% JS, `checkJs: false`) queda fuera de alcance hasta que exista una migración TS del client (no existe change para eso); activar `strict` en `tsconfig.json` raíz sin `checkJs` no cambia nada.
- Documentar en `quality-policy.md` (creado por hardening P1.4) la fecha de activación del cache.

## Capabilities

### New Capabilities

- `ci-type-check-cache`: persistencia y caché del tsBuildInfo en CI para los jobs de typecheck.

### Modified Capabilities

- (ninguna a nivel de requirements de producto; `config-correctness` sigue gobernando `strict`)

## Impact

**Affected code:**

- `.github/workflows/ci.yml` (steps `client-typecheck` y `server-typecheck`: añadir flags + cache)
- `tsconfig.json` / `apps/server/tsconfig.json` (sin cambios de `strict` — ya activo)

**Affected docs:**

- `docs/learning/quality-policy.md` (registro de cache; crear plantilla mínima si no existe)

**Dependencies:**

- `ci-quality-gates-blocking-hardening` (P0.2 agregador, P1.4 policy, P1.6 ban-ts-comment)

**Sistemas:**

- GitHub Actions, tsc, actions/cache
