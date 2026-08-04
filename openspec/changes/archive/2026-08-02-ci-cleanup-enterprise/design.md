## Context

El proyecto es un monorepo Node.js (Express + React + Playwright) con npm workspaces. La infraestructura CI/CD tiene 8 workflows en `.github/workflows/`.

**Estado actual de los workflows:**

| Workflow | Status | Issue |
|----------|--------|-------|
| `pr-validation.yml` | Deprecado | Marcado con "⚠️ Deprecated workflow - replaced by CI.yml (2026-02)". Contiene jobs comentados con paths `frontend/`, `backend/` antiguos. |
| `lint.yml` | Zombie | Workflow independiente no referenciado por ningún otro workflow. `ci.yml` tiene referencia comentada a `linter.yml` (similar). `quality.yml` ya cubre lint. |
| `formatter.yml` | Zombie | Ídem lint.yml. `quality.yml` ya cubre format check. |
| `ci-enterprise.yml` | Roto | Paths `frontend/**`, `backend/**` no existen. `cache-dependency-path` referencia `frontend/package-lock.json`, `backend/package-lock.json` inexistentes. No es llamado actualmente. |
| `release.yml` | Inconsistente | Usa `node-version: 20` (hardcoded) en vez de `node-version-file: .nvmrc`. `.nvmrc` tiene `22.22.0`. |
| `ci.yml` | OK | Workflow principal PR. Usa `quality.yml` como reusable. Paths correctos (`apps/client`, `apps/server`). |
| `quality.yml` | OK | Workflow reusable con lint + format + typecheck. Paths correctos. |
| `security.yml` | OK | Workflow reusable con SCA + SAST + secrets. Paths correctos. |

**Contexto del proyecto:**
- Monorepo npm workspaces con workspaces en `apps/client`, `apps/server`, `e2e`
- ESLint 9 flat config vía `eslint.config.js` root
- `.nvmrc` apunta a `22.22.0`
- CI principal: `ci.yml` → `quality.yml` + test (comentado por ahora)
- Seguridad: `security.yml` con CodeQL + Gitleaks + Trivy

## Goals / Non-Goals

**Goals:**
1. Eliminar 3 workflows zombie: `pr-validation.yml`, `lint.yml`, `formatter.yml`
2. Preservar `ci-enterprise.yml` intacto (no se modifica ni elimina)
3. Corregir `release.yml` para usar `node-version-file: .nvmrc`
4. Verificar que los workflows restantes usan consistentemente `node-version-file: .nvmrc`

**Non-Goals:**
- Modificar lógica de pipelines existentes (quality.yml, security.yml, ci.yml)
- Agregar nuevos jobs o workflows CI
- Cambiar versión de Node (solo alinear al .nvmrc existente)
- Refactorizar estructura de workflows (solo limpieza)
- Modificar `ci.yml` paths — ya están correctos

## Decisions

### D1: Estrategia de eliminación de zombies

**Decisión:** Eliminar físicamente los 3 archivos zombie con `git rm`.
**Alternativas:** Dejarlos como están (ruido), marcarlos como deprecados (ya intentado con pr-validation.yml).
**Rationale:** Git mantiene historial. Si se necesitan en futuro, `git log` los recupera. Tenerlos en disco es costo cognitivo sin beneficio.
**Tradeoff:** Si alguien depende de estos workflows externamente (workflow_call), fallarán. Verificación: `lint.yml` y `formatter.yml` solo tienen `workflow_dispatch` y `workflow_call` — no son llamados por ningún otro workflow (ci.yml tiene sus referencias comentadas). `pr-validation.yml` está deprecado desde Feb 2026.

### D2: Decisión sobre ci-enterprise.yml

**Decisión:** No modificar ni eliminar `ci-enterprise.yml`. Se preserva intacto como referencia (decisión del equipo).
**Rationale:** El workflow no está activo ni es llamado por ningún otro workflow. Mantenerlo como está evita riesgo de romper algo que dependa de él externamente. No hay beneficio en adaptar paths si no se usa.

### D3: Mecanismo para release.yml

**Decisión:** Cambiar de `node-version: 20` a `node-version-file: .nvmrc` en `release.yml`.
**Alternativas:** Dejar hardcodeado pero actualizar a `22.22.0`.
**Rationale:** Todos los demás workflows usan `node-version-file: .nvmrc`. El `release.yml` debe seguir el mismo patrón para consistencia y mantenibilidad. Cuando se actualice .nvmrc en futuro, release.yml se actualizará automáticamente.
**Tradeoff:** Ninguno significativo — es el mismo cambio que usan los otros 6 workflows.

### D4: Documentación post-cleanup

**Decisión:** Actualizar README.md (CI table), docs/cicd-estado-actual.md, y docs/cicd-plan-implementacion.md para reflejar eliminación de workflows zombie.
**Rationale:** Si se eliminan archivos pero la documentación los referencia, la documentación queda permanentemente desactualizada. README.md línea ~253 referencia `pr-validation.yml` en la tabla de CI. cicd-estado-actual.md tiene ~10 referencias a estos workflows.

### D6: Verificación de consistencia

**Decisión:** Verificar que los 5 workflows restantes (ci.yml, quality.yml, ci-enterprise.yml, release.yml, security.yml) usen `node-version-file: .nvmrc` consistentemente.
**Rationale:** Prevenir regresión donde un workflow use versión hardcodeada mientras otros usan .nvmrc.

## Risks / Trade-offs

- **[R1: Workflow externo referenciando zombie]** → Verificación: `gh run list` confirmará que no hay runs activos. Riesgo bajo.
- **[R2: Documentación stale]** → Tasks 4.1-4.3 aseguran que README.md y docs/ se actualizan junto con los archivos.
- **[R3: release.yml Node 20 → 22 incompatibilidad]** → El .nvmrc ya está en 22.22.0 y los demás workflows ya lo usan. Riesgo bajo pero mencionado en tasks.
- **[R4: Comentarios stale en ci.yml]** → Task 3.2 limpia referencias comentadas a linter.yml y formatter.yml.

## Open Questions

- ¿Los workflows eliminados están referenciados en issue templates o wikis? Task 4.6 grep lo verificará.

## Cross-Platform Considerations

- N/A — Los workflows se ejecutan en GitHub Actions (ubuntu-latest). No afecta plataformas de desarrollo.
- `git rm` funciona igual en Windows, Linux y macOS.
