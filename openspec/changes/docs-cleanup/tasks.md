# Tasks

## 1. Setup

- [x] 1.1 Trabajar en la rama actual (`ci-improvement-v11`) — **instrucción explícita del usuario: NO crear `docs/docs-cleanup`**
- [x] 1.2 Confirmar lista final de archivos a eliminar/fusionar contra el reporte de auditoría y verificar que ninguno esté referenciado por `AGENTS.md` ni `openspec/config.yaml`

## 2. Lote A — Archivos con cero referencias internas

- [x] 2.1 Eliminar `docs/openspec-changes-classification.md` y `docs/nivel-experiencia-analisis.md` con `git rm`, verificando con `rg` que no queden referencias (se quitaron los punteros en `snapshot-testing.md` y en el change `learning-cicd-profesional`)
- [x] 2.2 Fusionar `docs/adr-template.md` en `openspec/adr/TEMPLATE.md` (destino elegido frente a `create-adr.md`, que es un comando opsx) preservando el template MADR; `git mv` conserva el historial
- [x] 2.3 Fusionar `docs/requirements-engineering-flow.md` como sección "Framework operativo para Project One" en `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md`; eliminar la fuente
- [x] 2.4 Fusionar `docs/estandar-usequerydata-useloadingstate.md` en `docs/quality/code-style.md` (§React Conventions → RTK Query standard); eliminar la fuente
- [ ] 2.5 Commit del Lote A con mensaje `docs(docs): remove zero-ref obsolete docs and merge orphan standards` — **no realizado: no se hicieron commits en esta sesión (árbol con cambios previos no relacionados y commits firmados/DCO)**

## 3. Lote B — Eliminaciones y fusiones con referencias internas

- [x] 3.1 Eliminar `docs/opencode/engram.md` y `docs/omniroute-opencode-integration.md` con `git rm`; sin referencias residuales (ambos bajo `docs/opencode/`, ya ignorado por markdownlint)
- [x] 3.2 Eliminar `docs/security/security-design.md` con `git rm`; `security/SECURITY.md` y `security-enterprise-guide.md` se mantienen intactos (solo se repuntaron sus menciones a `SECURITY.md`)
- [x] 3.3 Eliminar `docs/openspec-implementation-audit.md` y quitar sus dos menciones en `docs/product/analisis-producto-terminado-erp.md`
- [x] 3.4 Eliminar `docs/learning/typescript-migration-server.md` y repuntar los punteros en `CONTEXT-CICD.md`, `learning/typescript-strict-check.md` y `docs/backend/server-typescript-migration-research.md`
- [x] 3.5 Eliminar `docs/ci-prebuild-substage-structure-phase2-baseline.md` y `...-verification.md`; repuntar `knip-configuration.md` y `docs/opencode/eval/tasks/10-ci-prebuild-job.md` a la spec
- [x] 3.6 Eliminar `docs/learning/quality-gap-analysis-verification.md` y `docs/learning/panorama-resumen.md`; quitar referencias en `property-based-testing.md`, `snapshot-testing.md`, `unit-tests-enterprise.md` y en la spec `property-based-testing`
- [x] 3.7 Eliminar los 8 stubs de módulos (`docs/modules/{client,server}-{auth,notes,stock,users}.md`); marcar Task 28 del change activo `2026-04-19-document-system-modules` como completada
- [x] 3.8 Fusionar `docs/aws-dev-local-floci.md` → `docs/ci-cd/aws-learning-with-floci.md` (host-vs-container, Secrets Manager code path, testcontainers follow-up), repuntar guides 04/12, READMEs, `aws-cd-learning-path`, `aws-deploy-architecture`, changes activos `cd-aws-deploy-pipeline`/`ci-testcontainers` y la spec `ci-floci-dev-emulation`
- [x] 3.9 Fusionar `docs/research/prebuild-security-stage-analysis.md` → `docs/learning/quality-gates.md` §10; repuntar `license-policy.md` y las referencias internas
- [x] 3.10 Fusionar `docs/trello-card-standards.md` → `docs/ci-cd/trello-workflow-guide.md` §7; actualizar `.markdownlintignore`
- [x] 3.11 Fusionar `docs/learning/quality-changes-decision.md` → `docs/learning/quality-gap-analysis.md` §15; sin referencias residuales
- [x] 3.12 Fusionar `docs/jsdoc-review-checklist.md` → `docs/quality/code-review-checklist.md` (sección JSDoc + quick checklist) y `docs/jsdoc-migration-notes.md` → `docs/backend/server-typescript-migration-research.md` §9; actualizar `docs/ci-cd/ci-cd-pipeline-empresarial.md`
- [x] 3.13 Fusionar `docs/opencode/output-contracts-article.md` en `docs/opencode/output-contracts.md` (rationale, decisiones, trade-offs, alternativas, métricas, trabajo futuro); eliminar la fuente
- [ ] 3.14 Commit del Lote B con mensaje `docs(docs): remove and merge referenced obsolete docs, repoint links` — **no realizado**

## 4. Lote C — Reparación de links dangling pre-existentes

- [x] 4.1 Actualizar `openspec/specs/commit-signing-documentation/spec.md` y `openspec/specs/commit-signing-key-lifecycle/spec.md` para apuntar a `docs/learning/ci-cd/05b-commit-signing.md`
- [x] 4.2 Repuntar las referencias a `docs/cicd-estado-actual.md` a `docs/CONTEXT-CICD.md` (se mantienen las menciones históricas deliberadas dentro de `CONTEXT-CICD.md`)
- [x] 4.3 Repuntar las referencias a `docs/cicd-plan-implementacion.md` a `docs/CONTEXT-CICD.md`
- [x] 4.4 Repuntar las referencias al path viejo `docs/workflows-mantenimiento-guia.md` al path actual `docs/learning/ci-cd/workflows-mantenimiento-guia.md` y corregir los enlaces relativos de las guías
- [x] 4.5 Repuntar las referencias al path viejo `docs/adr/turborepo-evaluation.md` a `docs/modules/requirements-engineering/adr/turborepo-evaluation.md` (incluyendo `.markdownlintignore` y enlaces relativos)
- [x] 4.6 `docs/traceability/` no existía: se creó con `README.md` documentando la convención `docs/traceability/<change>.md`
- [ ] 4.7 Commit del Lote C con mensaje `docs(docs): fix dangling documentation references` — **no realizado**

## 5. Coordinación con changes activos

- [x] 5.1 Actualizar tasks del change `2026-04-19-document-system-modules` (Task 28 marcada completada por este change)
- [x] 5.2 Verificar que `learning-cicd-profesional` no requiere cambios de contenido (solo se repuntó una referencia de path en su `design.md`/`proposal.md`; `security-enterprise-guide.md` no se elimina)

## 6. Verificación final

- [x] 6.1 Ejecutar búsqueda por cada archivo eliminado/fusionado y confirmar 0 referencias residuales (excluyendo archived changes y el propio change); 0 ocurrencias del path viejo `docs/workflows-mantenimiento-guia.md`, `docs/adr/turborepo-evaluation.md` y `docs/commit-signing.md` fuera de archived changes
- [x] 6.2 Ejecutar `npx openspec validate docs-cleanup` → `Change 'docs-cleanup' is valid`
- [x] 6.3 Ejecutar markdownlint sobre los archivos tocados. Limitación conocida: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` conserva 185 hallazgos pre-existentes (MD052/MD034/MD040) de contenido ajeno a este change; los archivos nuevos/fusionados quedan limpios
- [x] 6.4 Revisión manual de los 10 fusiones (9 listadas en proposal + output-contracts-article): sin duplicación de secciones y con el contenido único preservado
- [ ] 6.5 Abrir PR hacia `main` — **no realizado: no solicitado y no se hicieron commits**
