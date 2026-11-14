# Design

## Context

`server-format-check` desactivado (`if: false`) por un comentario FASE 1 que asume deuda de formato server. La re-validación empírica muestra que los archivos trackeados del servidor ya pasan `prettier --check`; el fallo reportado proviene de artefactos generados gitignored (`.vitest-reports/`, `reports/`) no cubiertos por `.prettierignore`. El PRD exige formato bloqueante en todos los workspaces.

## Goals / Non-Goals

**Goals:** Activar `server-format-check` y crear `e2e-format-check` como blocking, con condición path-scoped + PR-only alineada a los jobs hermanos, y corregir la higiene de ignore.

**Non-Goals:** No cambiar config de Prettier (reglas/estilo); no auto-fix en CI; no tocar CODEOWNERS (pertenece a otros changes).

## Decisions

1. **Condición de activación:** `if: needs.repo-discovery.outputs.server == 'true' && github.event_name == 'pull_request'` (patrón hermano de `server-lint`/`server-typecheck`). En merge queue queda skipped y el agregador lo tolera (skip autorizado por change detection). Se descarta `if: true` (comentario FASE 2) por divergencia de scheduling/costo con los hermanos.

2. **Higiene de ignore:** extender `.prettierignore` con `**/reports/` y `**/.vitest-reports/` (y reportes de lighthouse) para evitar falsos positivos en CI y local. Sin esto, `format:check` falla en cualquier máquina con artefactos generados.

3. **Re-validación previa:** ejecutar `format:check` por workspace antes de normalizar; si la deuda real es cero, la tarea de normalización es no-op (no generar commits vacíos).

4. **Cobertura de globs:** los scripts `format:check` cubren `js/ts/jsx/json/md` según workspace; no se extienden a `yml/yaml` (cubierto por yamllint en `.github/**`) ni a `.cjs/.mjs` (sin formato aplicado hoy). La spec acota la cobertura a los globs reales.

## Risks / Trade-offs

- Falsos positivos por artefactos generados si `.prettierignore` no se actualiza antes de activar (mitigación: task de ignore + verificación).
- Divergencia de scheduling si se usa `if: true` en vez de condición hermana (mitigación: decisión 1).
- Si la deuda real reaparece en el futuro, el job bloqueará; se normaliza con `prettier --write` en un commit dedicado.

## Migration Plan

1. Re-validar deuda real (`format:check` por workspace).
2. Extender `.prettierignore`.
3. Normalizar solo si hay diff (commit dedicado).
4. Activar `server-format-check` con condición hermana + actualizar comentario FASE.
5. Crear `e2e-format-check` (espejo de `e2e-lint`) + añadir a `prebuild-quality-complete.needs`.
6. Verificar `format:check` en client/server/e2e (con artefactos excluidos).
7. Anotar gap analysis §3.2 y comentario FASE de `ci.yml`.

## Open Questions

- Ninguna.
  EOF
