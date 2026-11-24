# Tasks

## 1. Setup

- [x] 1.1 Verificar que el working tree esté limpio (solo cambios no relacionados pendientes) y crear las subcarpetas `docs/architecture`, `docs/backend`, `docs/frontend`, `docs/ci-cd`, `docs/quality`, `docs/product`

## 2. Mover archivos por área (git mv)

- [x] 2.1 `git mv` los docs de arquitectura: `architectural-approach.md`, `rbac-system.md`, `workspaces.md`, `websocket-implementation-guide.md` → `docs/architecture/`
- [x] 2.2 `git mv` los docs de backend: `server-bootstrap-env-vars.md`, `server-typescript-migration-research.md`, `jsdoc-reference-guide.md`, `api-rest-design-analysis.md`, `pbt-candidate-analysis.md` → `docs/backend/`
- [x] 2.3 `git mv` los docs de frontend: `frontend-sourcemaps-y-cache.md`, `imagen-oci-labels.md` → `docs/frontend/`
- [x] 2.4 `git mv` los docs de ci/cd: `ci-cd-pipeline-empresarial.md`, `pre-merge-gates-governance.md`, `aws-cd-learning-path.md`, `aws-deploy-architecture.md`, `aws-learning-with-floci.md`, `omniroute-install-tutorial.md`, `trello-workflow-guide.md` → `docs/ci-cd/`
- [x] 2.5 `git mv` los docs de calidad: `testing-architecture.md`, `code-review-checklist.md`, `code-style.md` → `docs/quality/`
- [x] 2.6 `git mv` los docs de producto: `analisis-producto-terminado-erp.md`, `De-stakeholder-a-producción-flujo-completo-de una-feature.md`, `changelog.md` → `docs/product/`

## 3. Repuntar links internos

- [x] 3.1 Grep por cada nombre de archivo movido y repuntar todas las ocurrencias en `docs/`, `openspec/`, `apps/`
- [x] 3.2 Actualizar referencias en `AGENTS.md` (root, client, server) a las nuevas rutas
- [x] 3.3 Actualizar referencias en `openspec/config.yaml` a las nuevas rutas
- [x] 3.4 Actualizar referencias en CI workflows (`.github/workflows/`) si las hay

## 4. Verificación final

- [x] 4.1 Ejecutar `rg` por cada path viejo y confirmar 0 referencias residuales (excluyendo archived changes)
- [x] 4.2 Ejecutar `openspec validate docs-reorganize-by-area` y confirmar que pasa
- [x] 4.3 Verificar que `CONTEXT-CICD.md` y `application-context.md` siguen en la raíz de `docs/`
- [ ] 4.4 Commit único con mensaje `docs(docs): reorganize docs into area folders`
