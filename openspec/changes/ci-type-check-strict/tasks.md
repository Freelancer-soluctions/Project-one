# Tasks: ci-type-check-strict

## Fase 1: Persistencia de tsBuildInfo en CI

- [ ] Añadir `--tsBuildInfoFile apps/client/.cache/tsc/app.tsbuildinfo` al step `TypeCheck` de `client-typecheck` en `ci.yml` (job corre con `working-directory: apps/client`)
- [ ] Añadir `--tsBuildInfoFile apps/server/.cache/tsc/app.tsbuildinfo` al step `TypeCheck` de `server-typecheck` en `ci.yml` (job corre con `working-directory: apps/server`)
- [ ] Añadir `actions/cache` para `apps/client/.cache/tsc` y `apps/server/.cache/tsc` (clave: lockfile + fuentes)
- [ ] Verificar cache hit en CI (sin prometer speedup; objetivo = cache reutilizable)

## Fase 2: Validación

- [ ] Verificar que `tsc --noEmit` devuelve exit 2 ante error de tipos (ya verificado empíricamente)
- [ ] Verificar que no haya `@ts-ignore` sin justificación (grep sobre `apps/` y `e2e/` → 0 hoy)
- [ ] Actualizar `quality-policy.md` con la fecha de activación del cache (crear plantilla mínima si hardening no aterrizó)
- [ ] `openspec sync ci-type-check-strict` para propagar capability a main specs
- [ ] `openspec validate --specs --strict` sin errores
- [ ] Archivar el change tras completar tasks
