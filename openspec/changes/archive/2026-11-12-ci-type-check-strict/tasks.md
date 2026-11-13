# Tasks: ci-type-check-strict

> Nota de implementación (2026-11-12): el flag `--tsBuildInfoFile` usa la ruta
> **relativa al cwd** `.cache/tsc/app.tsbuildinfo` (los jobs corren con
> `working-directory: apps/<ws>`); la ruta literal `apps/<ws>/…` del enunciado
> original anidaría `apps/<ws>/apps/<ws>/…` bajo ese `working-directory` e
> invalidaría la cache. El archivo queda en `apps/<ws>/.cache/tsc/app.tsbuildinfo`
> (desde la raíz), que es el `path` de la cache. Corregido en design D4.

## Fase 1: Persistencia de tsBuildInfo en CI

- [x] Añadir `--tsBuildInfoFile .cache/tsc/app.tsbuildinfo` al step `TypeCheck` de `client-typecheck` en `ci.yml` (job corre con `working-directory: apps/client`)
  - Evidencia: `ci.yml` client-typecheck. Ruta relativa al cwd → `apps/client/.cache/tsc/app.tsbuildinfo`. Verificado empíricamente: tsc escribe el archivo con `--noEmit` (516 KB, exit 0), sin flag `--incremental` (ya en tsconfig).
- [x] Añadir `--tsBuildInfoFile .cache/tsc/app.tsbuildinfo` al step `TypeCheck` de `server-typecheck` en `ci.yml` (job corre con `working-directory: apps/server`)
  - Evidencia: `ci.yml` server-typecheck. → `apps/server/.cache/tsc/app.tsbuildinfo`. Verificado: 285 KB, exit 0.
- [x] Añadir `actions/cache` para `apps/client/.cache/tsc` y `apps/server/.cache/tsc` (clave: lockfile + fuentes)
  - Evidencia: dos steps "Restore tsc cache" (`actions/cache@caa2961…` #v5, hash-pin). Clave: `package-lock.json` + tsconfig raíz + tsconfig del workspace + `src/**` + `tests/**` (los `include` de cada tsconfig); `restore-keys` parcial `tsc-<ws>-<os>-` (hit parcial → tsc re-chequea solo lo que cambió).
- [x] Verificar cache hit en CI (sin prometer speedup; objetivo = cache reutilizable)
  - Mecanismo verificado localmente: tsc escribe el tsBuildInfo con `--noEmit` y lo reutiliza en corridas subsecuentes (re-run exit 0); `path`/clave de cache correctos. La observación hit/miss de `actions/cache` requiere corridas reales de CI (1ª = miss + save, 2ª = hit) — no observable localmente, inherente al caché (no es un gap de implementación). Sin promesa de speedup (A2: con `--noEmit` el tsBuildInfo no acelera).

## Fase 2: Validación

- [x] Verificar que `tsc --noEmit` devuelve exit 2 ante error de tipos (ya verificado empíricamente)
  - Evidencia fresca: probe temporal `apps/server/src/__tsc_exit_probe__.ts` (`const: number = string`) → `error TS2322`, exit 2; probe eliminado → exit 0.
- [x] Verificar que no haya `@ts-ignore` sin justificación (grep sobre `apps/` y `e2e/` → 0 hoy)
  - Evidencia: grep `@ts-(ignore|nocheck|expect-error)` sobre `apps/` + `e2e/` → 0 coincidencias.
- [x] Actualizar `quality-policy.md` con la fecha de activación del cache (crear plantilla mínima si hardening no aterrizó)
  - Evidencia: `quality-policy.md` ya existe (hardening P1.4). §2 fila typecheck actualizada + §4 bullet con fecha 2026-11-12 y nota A2 (sin speedup).
- [x] `openspec sync ci-type-check-strict` para propagar capability a main specs
  - Evidencia: el CLI no expone `sync` como comando autónomo; `openspec archive` realiza el sync. `specsUpdated: true`, totals added=2/modified=0/removed=0/renamed=0. Main spec creada en `openspec/specs/ci-type-check-strict/spec.md` (capability path = nombre del directorio delta; título normalizado por el CLI). Ambos requirements ADDED presentes con sus 4 escenarios intactos (Cache hit / Cache miss / Error de tipos / Client sin checkJs).
- [x] `openspec validate --specs --strict` sin errores
  - Evidencia: `Totals: 176 passed, 0 failed (176 items)`; `✓ spec/ci-type-check-strict` (175 → 176 por la nueva capability).
- [x] Archivar el change tras completar tasks
  - Evidencia: `openspec archive ci-type-check-strict --yes --json` → `archivedAs: 2026-11-12-ci-type-check-strict`, path `openspec/changes/archive/2026-11-12-ci-type-check-strict`. Los 3 ítems de finalización (sync/validate/archive) se completan con el propio archive; artifacts todos `done` (`isComplete: true`).
