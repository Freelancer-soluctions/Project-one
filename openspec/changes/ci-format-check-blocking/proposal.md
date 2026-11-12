# Proposal

## Why

El job de formato (Prettier `--check`) está implementado para client (blocking) pero `server-format-check` está desactivado (`if: false` en `ci.yml:2416`, verificado). El comentario FASE 1 del propio job asume "server aún no pasa `format:check` limpio", pero la re-validación empírica muestra que los archivos trackeados del servidor ya pasan `prettier --check` (el fallo reportado proviene de artefactos generados gitignored, no de código). El PRD exige formato bloqueante en todos los workspaces (CI solo `--check`, no auto-fix, para no romper firmas/DCO). Este change activa el gate server (y crea el job e2e equivalente) y corrige la higiene de ignore, blocking desde el día 1.

## What Changes

- **Re-validar deuda real** antes de normalizar: ejecutar `format:check` por workspace y confirmar que los archivos trackeados pasan (los artefactos gitignored se excluyen vía `.prettierignore`).
- **Higiene de ignore**: extender `.prettierignore` (raíz y por workspace) con `**/reports/` y `**/.vitest-reports/` para evitar falsos positivos en CI y local.
- **Activar `server-format-check`**: reemplazar `if: false` por la condición path-scoped + PR-only (`needs.repo-discovery.outputs.server == 'true' && github.event_name == 'pull_request'`), alineado con los jobs hermanos (`server-lint`, `server-typecheck`), y actualizar el comentario FASE.
- **Crear `e2e-format-check`**: job espejo de `e2e-lint` que ejecuta `npm run format:check --workspace=e2e`, añadido a `prebuild-quality-complete.needs`.
- **Verificar** que `format:check` pasa en client/server/e2e (con artefactos excluidos) y que el aggregator sigue verde.

## Capabilities

### New Capabilities

- `ci-format-check-blocking`: gate de formato Prettier bloqueante en todos los workspaces (client/server/e2e) con `--check` en CI, auto-fix en pre-commit y higiene de ignore para artefactos generados.

### Modified Capabilities

- (ninguna a nivel de requirements de producto)

## Impact

**Affected code:**

- `.github/workflows/ci.yml` (`server-format-check` job: condición de activación + comentario FASE; nuevo job `e2e-format-check`; entrada en `prebuild-quality-complete.needs`)
- `.prettierignore` (raíz y por workspace: añadir `**/reports/`, `**/.vitest-reports/`)

**Affected docs:**

- `docs/learning/quality-gap-analysis.md` §3.2 (anotar que la deuda no se reproduce en archivos trackeados)
- Comentario FASE de `server-format-check` en `ci.yml`

**Sistemas:**

- GitHub Actions, Husky, Prettier, lint-staged

**Nota:** CODEOWNERS no se toca en este change (pertenece a `ci-import-boundaries-enforcement`/hardening P1.3). endOfLine ya es `lf` (`.prettierrc.yaml` + `.gitattributes`), alineado con el PRD.
EOF
