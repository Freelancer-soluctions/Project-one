# Proposal

## Why

La carpeta `docs/` acumula 216 archivos (~65k líneas) con documentos one-off, planes ejecutados ya obsoletos, stubs de módulos superados, near-duplicados y referencias dangling. Esto dificulta encontrar la documentación vigente, aumenta el ruido en búsquedas y eleva el riesgo de seguir instrucciones desactualizadas. Una auditoría del árbol identificó 20 archivos elegibles para eliminación (~5,300 líneas), 9 para fusión (~1,700 líneas) y 3 candidatos a resumen a largo plazo, además de varios links rotos pre-existentes que conviene reparar en el mismo pase.

## What Changes

- **DELETE (20 archivos):**
  - One-off analyses/audits: `nivel-experiencia-analisis.md`, `openspec-implementation-audit.md`, `openspec-changes-classification.md`, `ci-prebuild-substage-structure-phase2-{baseline,verification}.md`, `learning/quality-gap-analysis-verification.md`, `learning/panorama-resumen.md`, `learning/typescript-migration-server.md` (auto-marcado "Superado").
  - Plan ejecutado/stale: `omniroute-opencode-integration.md` (OmniRoute ya vive en `opencode.jsonc`).
  - Reconstrucción post-hoc: `security/security-design.md`.
  - Vendoring no usado: `opencode/engram.md` (Engram no instalado).
  - Artículo duplicado: `opencode/output-contracts-article.md` (canónico: `output-contracts.md`).
  - Stubs legacy de módulos: `modules/{client,server}-{auth,notes,stock,users}.md` (×8), ya condenados por el change `2026-04-19-document-system-modules`.
- **MERGE (9 archivos) en sus docs hermanos:**
  - `aws-dev-local-floci.md` → `aws-learning-with-floci.md`.
  - `research/prebuild-security-stage-analysis.md` → `learning/quality-gates.md`.
  - `adr-template.md` → `.opencode/command/create-adr.md` (embed template).
  - `requirements-engineering-flow.md` → `De-stakeholder-a-producción-flujo-completo-de una-feature.md`.
  - `trello-card-standards.md` → `trello-workflow-guide.md`.
  - `estandar-usequerydata-useloadingstate.md` → `code-style.md`.
  - `learning/quality-changes-decision.md` → `learning/quality-gap-analysis.md`.
  - `jsdoc-review-checklist.md` → `code-review-checklist.md`.
  - `jsdoc-migration-notes.md` → `server-typescript-migration-research.md`.
- **SUMMARIZE (diferido, no en este change):** `ci-cd-pipeline-empresarial.md` (10.6k), `security/security-enterprise-guide.md` (4.5k), `pre-merge-gates-governance.md` (922) — bloqueados por refs de anchors y changes activos; se dejan como proyecto a largo plazo.
- **Reparación de links dangling pre-existentes:** `commit-signing-documentation` spec → `docs/learning/ci-cd/05b-commit-signing.md`; `cicd-estado-actual.md` (10 refs); `cicd-plan-implementacion.md`; old `workflows-mantenimiento-guia.md`/`adr/turborepo` paths (~15+11 refs); verificar `docs/traceability/`.
- **Limpieza de referencias internas** que apuntan a los archivos eliminados/fusionados (listadas en el reporte de auditoría).

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- Ninguna. Este change es puramente documental: no altera comportamiento, APIs ni specs.

> Este change no introduce deltas de spec; se marca `skip_specs: true` en `.openspec.yaml`.

## Impact

- **Código:** sin cambios de código. Solo `docs/` y links internos. No se tocan `apps/`, `openspec/specs/`, ni `openspec/config.yaml`.
- **Riesgo de ruptura de refs:** bajo. Ningún `AGENTS.md` ni `openspec/config.yaml` referencia los archivos a eliminar; solo links internos de docs (listados en el reporte).
- **Espacio:** ~5,300 líneas eliminadas + ~1,700 fusionadas; reducción neta de ruido.

## Non-goals

- No condensar los 3 documentos gigantes (`ci-cd-pipeline-empresarial`, `security-enterprise-guide`, `pre-merge-gates-governance`) en este change — requieren migración de anchors y se difieren.
- No tocar el `node_modules` commiteado bajo `docs/opencode/prompts/contracts/` (61 MB) — requiere repuntar el plugin `output-contracts.ts`; se trata como hygiene flag separado.
- No reubicar `docs/modules/requirements-engineering/adr/turborepo-evaluation.md`.
- No modificar `AGENTS.md` ni `openspec/config.yaml`.
- La única excepción de spec es la corrección de path en `openspec/specs/commit-signing-documentation/spec.md` y `commit-signing-key-lifecycle/spec.md` (`docs/commit-signing.md` → `docs/learning/ci-cd/05b-commit-signing.md`), que repara una referencia dangling pre-existente y no altera comportamiento.

## Riesgos

- Links internos rotos si no se actualizan todos los apuntadores (mitigación: grep por cada archivo eliminado/fusionado y repuntar).
- El change activo `2026-04-19-document-system-modules` referencia los stubs de módulos a eliminar — coordinar actualización de sus tasks.
- El change activo `learning-cicd-profesional` referencia `security-enterprise-guide.md` — no tocar ese doc en este change.
- Pérdida de contexto histórico en docs one-off (mitigación: git conserva el historial; las decisiones relevantes ya están absorbidas en docs canónicos).

## Dependencias

- Reporte de auditoría de `docs/` (análisis previo) como fuente de la lista de archivos y refs.
- Coordinación con changes activos: `2026-04-19-document-system-modules`, `learning-cicd-profesional`, `docs-changelog-validation`, `cd-aws-deploy-pipeline`, `add-patch-endpoints`, `pbt-candidate-locations`, `ci-gaps-priority-1-2`, `frontend-data-architecture`, **`ci-testcontainers`** (referencia y planea actualizar `aws-dev-local-floci.md`).
- Herramientas: `git grep`/`rg` para detectar refs, `openspec validate` para verificar el change.
