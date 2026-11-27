# Proposal

## Why

Tras la limpieza (`docs-cleanup`), los 26 docs de la raíz de `docs/` siguen mezclados sin agrupación por área temática, lo que dificulta la navegación y el descubrimiento. Reorganizarlos en subcarpetas por área (arquitectura, backend, frontend, ci/cd, calidad, producto) mejora la estructura sin cambiar contenido.

## What Changes

- **BREAKING (paths internos):** mover docs de la raíz de `docs/` a subcarpetas por área:
  - `docs/architecture/`: `architectural-approach.md`, `rbac-system.md`, `workspaces.md`, `websocket-implementation-guide.md`.
  - `docs/backend/`: `server-bootstrap-env-vars.md`, `server-typescript-migration-research.md`, `jsdoc-reference-guide.md`, `api-rest-design-analysis.md`, `pbt-candidate-analysis.md`.
  - `docs/frontend/`: `frontend-sourcemaps-y-cache.md`, `imagen-oci-labels.md`.
  - `docs/ci-cd/`: `ci-cd-pipeline-empresarial.md`, `pre-merge-gates-governance.md`, `aws-cd-learning-path.md`, `aws-deploy-architecture.md`, `aws-learning-with-floci.md`, `omniroute-install-tutorial.md`, `trello-workflow-guide.md`.
  - `docs/quality/`: `testing-architecture.md`, `code-review-checklist.md`, `code-style.md`.
  - `docs/product/`: `analisis-producto-terminado-erp.md`, `De-stakeholder-a-producción-flujo-completo-de una-feature.md`, `changelog.md`.
  - Mantener en raíz (backbone auto-cargados): `CONTEXT-CICD.md`, `application-context.md`.
- Repuntar todos los links internos, referencias en `AGENTS.md` (root/client/server), `openspec/config.yaml`, CI workflows y changes activos.
- Mantener `docs/learning/`, `docs/modules/`, `docs/opencode/`, `docs/security/`, `docs/runbooks/`, `docs/traceability/` sin cambios.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- Ninguna. Reorganización física de documentación; sin cambios de comportamiento ni de specs.

> `skip_specs: true` en `.openspec.yaml`.

## Impact

- **Código:** ninguno. Solo rutas de docs y referencias.
- **Riesgo:** links internos rotos si no se repuntan todos; mitigación: grep por cada path movido.
- **AGENTS.md / config:** actualización de rutas referenciadas (necesario para mantener coherencia).

## Non-goals

- No cambiar contenido de los docs (solo ubicación).
- No mover `CONTEXT-CICD.md` ni `application-context.md` (backbone auto-cargados por AGENTS/config).
- No tocar `node_modules` vendored ni `docs/learning/`, `docs/modules/`, `docs/opencode/`, `docs/security/`, `docs/runbooks/`.

## Riesgos

- Links internos rotos → repunte en el mismo change + validación `rg`.
- Referencias en changes activos y specs → grep exhaustivo.
- Auto-load de `CONTEXT-CICD.md`/`application-context.md` no se ve afectado (se mantienen en raíz).

## Dependencias

- `docs-cleanup` commiteado (06977f3c) como prerrequisito.
