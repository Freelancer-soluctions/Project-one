## Why

Project One tiene 8 workflows en `.github/workflows/` pero varios están obsoletos, rotos o inconsistentes. Esto genera:

1. **Zombie workflows que confunden**: `pr-validation.yml` está marcado como deprecado pero nunca se eliminó. `lint.yml` y `formatter.yml` existen como workflows aislados pero no son usados por ningún otro workflow — `quality.yml` ya cubre lint y format check.

2. **Workflow enterprise con paths rotos**: `ci-enterprise.yml` referencia rutas `frontend/` y `backend/` que no existen en el monorepo. Las rutas reales son `apps/client` y `apps/server`. Además referencia `frontend/package-lock.json` y `backend/package-lock.json` que no existen (solo hay `package-lock.json` raíz). Actualmente no es llamado por ningún otro workflow.

3. **Node version hardcodeada**: `release.yml` usa `node-version: 20` en lugar de `node-version-file: .nvmrc`. El `.nvmrc` actual apunta a `22.22.0`. La versión hardcodeada está desactualizada y puede causar builds inconsistentes.

4. **Mantenibilidad**: Tener workflows muertos aumenta el costo cognitivo al modificar CI/CD. Cada workflow adicional es ruido que puede ocultar problemas reales o llevar a duplicación de configuración.

## What Changes

### 1. Delete zombie workflows
- Eliminar `.github/workflows/pr-validation.yml` — workflow deprecado, reemplazado por `ci.yml`
- Eliminar `.github/workflows/lint.yml` — workflow aislado no referenciado; lint cubierto por `quality.yml`
- Eliminar `.github/workflows/formatter.yml` — workflow aislado no referenciado; format check cubierto por `quality.yml`

### 2. ci-enterprise.yml (Left Intact)
- No se modifica ni elimina. El equipo decidió preservarlo como está (no está activo, pero se conserva como referencia).
- `ci-enterprise.yml` tiene paths `frontend/`, `backend/` inexistentes y `cache-dependency-path` incorrecto, pero no es llamado por ningún workflow actual.

### 3. Fix release.yml node version
- Cambiar `node-version: 20` a `node-version-file: .nvmrc` para consistencia con el resto de workflows

### 4. Update documentation
- Actualizar `README.md` — remover entrada de `pr-validation.yml` de la tabla CI
- Actualizar `docs/cicd-estado-actual.md` — remover referencias a workflows zombies (~10 referencias)
- Actualizar `docs/cicd-plan-implementacion.md` — actualizar inventario CI

### 5. Verify remaining workflows
- Confirmar que `ci.yml`, `quality.yml`, `security.yml`, `release.yml` usan `node-version-file: .nvmrc` consistentemente
- Confirmar que no hay referencias a los workflows eliminados en el código

## Dependencies

- **Sin dependencias externas**: Este cambio es independiente de otros cambios OpenSpec
- **Predecesor de**: Ninguno — es cleanup autónomo
- **Riesgo bajo**: Solo afecta archivos de CI; no toca código de aplicación

## Capabilities

### New Capabilities
- `ci-clean-manifest`: Inventario de workflows CI limpio, sin zombies ni configuraciones muertas

### Modified Capabilities
- `release-workflow`: `release.yml` usa `node-version-file: .nvmrc` en lugar de `node-version: 20`
- `ci-stale-comments`: `ci.yml` sin referencias comentadas a workflows que ya no existen

### Removed Capabilities
- `zombie-pr-validation`: workflow `pr-validation.yml` eliminado
- `zombie-lint`: workflow `lint.yml` eliminado
- `zombie-formatter`: workflow `formatter.yml` eliminado

## Impact

- **`.github/workflows/pr-validation.yml`**: DELETE
- **`.github/workflows/lint.yml`**: DELETE
- **`.github/workflows/formatter.yml`**: DELETE
- **`.github/workflows/ci-enterprise.yml`**: NO CHANGE (preserved as-is)
- **`.github/workflows/release.yml`**: MODIFY `node-version: 20` → `node-version-file: .nvmrc`
