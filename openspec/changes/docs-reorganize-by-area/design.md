# Design

## Context

Reorganización física de `docs/` post-`docs-cleanup`. Sin cambios de contenido, solo ubicación y repunte de links. Ver `proposal.md` para motivación y alcance.

## Goals / Non-Goals

**Goals:**

- Mover los docs de la raíz de `docs/` a subcarpetas por área (arquitectura, backend, frontend, ci-cd, calidad, producto).
- Repuntar todos los links internos y referencias en AGENTS.md, openspec/config.yaml, CI workflows y changes activos.
- Mantener `CONTEXT-CICD.md` y `application-context.md` en la raíz (auto-cargados).

**Non-Goals:**

- No cambiar contenido de los docs.
- No mover `docs/learning/`, `docs/modules/`, `docs/opencode/`, `docs/security/`, `docs/runbooks/`, `docs/traceability/`.
- No tocar código.

## Decisions

### D1 — `git mv` para preservar historial

**Decisión:** usar `git mv` para todos los movimientos.
**Rationale:** preserva blame/history y detecta renames en git.
**Alternativa:** `mv` + `git add -A`. Descartada por peor detección de rename.

### D2 — Repunte exhaustivo por grep

**Decisión:** tras mover, grep por cada nombre de archivo viejo y repuntar todas las ocurrencias.
**Rationale:** evita links rotos.

### D3 — Actualizar AGENTS.md y openspec/config.yaml

**Decisión:** actualizar las rutas referenciadas en AGENTS.md (root/client/server) y config.yaml.
**Rationale:** mantener coherencia con la nueva estructura.

### D4 — Commit único atómico

**Decisión:** un solo commit para todo el movimiento + repunte.
**Rationale:** la reorganización es un cambio indivisible; un commit por área complica la revisión.

## Risks / Trade-offs

- [Links rotos] → grep exhaustivo + validación.
- [Referencias en changes activos/specs] → grep + actualización.
- [AGENTS.md auto-load roto] → verificar que las rutas actualizadas existan.

## Migration Plan

1. Crear subcarpetas por área.
2. `git mv` cada doc a su carpeta.
3. Repuntar links internos (grep por cada nombre).
4. Actualizar AGENTS.md y openspec/config.yaml.
5. Validar con `rg` y `openspec validate`.

## Rollback

`git revert <sha>` restaura todo.

## Open Questions

- Ninguna.
