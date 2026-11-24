# Design

## Context

Change puramente documental sobre `docs/`. No hay cambios de código, datos ni APIs. El inventario y la lista de archivos provienen de la auditoría previa del árbol `docs/`. Ver `proposal.md` para la motivación y el alcance.

Restricciones que moldean el enfoque:

- Ningún `AGENTS.md` ni `openspec/config.yaml` referencia los archivos a eliminar → no se rompen puntos de entrada canónicos.
- Varios archivos a eliminar/fusionar tienen referencias internas de docs (listadas en `proposal.md` §Impact y en §6 del reporte de auditoría). Cada borrado/fusión exige repunte de links.
- Dos changes activos referencian artefactos afectados: `2026-04-19-document-system-modules` (stubs de módulos) y `learning-cicd-profesional` (`security-enterprise-guide.md`, fuera de alcance).
- El `node_modules` commiteado bajo `docs/opencode/prompts/contracts/` (61 MB) está cableado al plugin `output-contracts.ts` → fuera de alcance de este change (hygiene flag separado).

## Goals / Non-Goals

**Goals:**

- Eliminar los 20 archivos identificados sin dejar referencias dangling.
- Fusionar los 9 archivos en sus docs hermanos preservando contenido único.
- Reparar los links dangling pre-existentes listados en `proposal.md`.
- Dejar el árbol `docs/` con referencias internas consistentes (validable con `rg`), **excepto** docs fuera de alcance (`security/security-enterprise-guide.md`, bloqueado por `learning-cicd-profesional`).
- Mantener trazabilidad: un commit por lote lógico (o un único commit atómico si se prefiere), con mensaje Conventional Commits.

**Non-Goals:**

- No condensar los 3 documentos gigantes (`ci-cd-pipeline-empresarial`, `security-enterprise-guide`, `pre-merge-gates-governance`).
- No tocar `node_modules` vendored ni el plugin `output-contracts.ts`.
- No reubicar `turborepo-evaluation.md` ni modificar `AGENTS.md`/`openspec/config.yaml`.
- No crear specs (docs-only → `skip_specs: true`).

## Decisions

### D1 — Borrado con `git rm` (no `rm` plano)

**Decisión:** usar `git rm` para todos los archivos eliminados y fusionados (tras extraer el contenido a fusionar).
**Rationale:** preserva el historial y permite rollback trivial con `git checkout`/`git revert`. `rm` plano dejaría archivos untracked y rompería el índice.
**Alternativa considerada:** `rm` + `git add -A`. Descartada por menor trazabilidad y riesgo de olvidar `git add`.

### D2 — Fusiones manuales, no scriptadas

**Decisión:** copiar manualmente el contenido único de cada fuente al destino (con encabezado de sección), luego `git rm` la fuente.
**Rationale:** las fusiones requieren juicio (qué es único vs duplicado). Un script de concatenación duplicaría secciones y rompería anchors.
**Alternativa considerada:** script de append con marker. Descartada por calidad del resultado.

### D3 — Ejecución por lotes ordenados

**Decisión:** tres lotes:

1. **Lote A (cero refs internas):** archivos con 0 inbound refs — `openspec-changes-classification.md`, `adr-template.md`, `requirements-engineering-flow.md`, `estandar-usequerydata-useloadingstate.md`. `nivel-experiencia-analisis.md` se movió a Lote B porque tiene refs en el change activo `learning-cicd-profesional` (design.md:67) y en `.markdownlintignore:115`. Borrado/merge directo.
2. **Lote B (con refs internas):** resto de deletes y merges, cada uno acompañado de repunte de links en el mismo commit.
3. **Lote C (dangling refs pre-existentes):** reparación de paths rotos listados en `proposal.md`.

**Rationale:** minimiza el tiempo en estado inconsistente y permite validar por lote.
**Alternativa considerada:** un único commit gigante. Descartada por dificultad de review y rollback granular.

### D4 — Validación automatizada al final de cada lote

**Decisión:** tras cada lote ejecutar:

- `rg -l "<nombre-archivo-sin-ext>" docs/` para confirmar 0 referencias residuales a archivos eliminados (excluyendo el propio change y archivos archivados).
- `openspec validate docs-cleanup` para verificar el change.
- `npm run docs:lint` (o equivalente) sobre los archivos tocados.

**Rationale:** detecta links rotos antes de cerrar el change.

### D5 — Coordinación con change activo `2026-04-19-document-system-modules`

**Decisión:** actualizar las tasks de ese change para reflejar que los stubs ya fueron eliminados por este change (o marcarlos como completados). No bloquear este change por ello; documentar en `tasks.md`.

### D6 — No tocar `security-enterprise-guide.md`

**Decisión:** excluirlo explícitamente (bloqueado por `learning-cicd-profesional`). Documentado en Non-Goals.

## Risks / Trade-offs

- [Links internos rotos tras borrado] → repunte en el mismo commit del lote (D3) + validación `rg` (D4).
- [Change activo `document-system-modules` queda con tasks obsoletas] → actualizar sus tasks; documentado en `tasks.md`.
- [Pérdida de contexto histórico] → git conserva historial; decisiones relevantes ya absorbidas en docs canónicos.
- [Merge accidental de contenido duplicado] → revisión manual por archivo (D2).
- [Validación `openspec validate` falla por zero-deltas] → mitigado con `skip_specs: true` en `.openspec.yaml`.

## Migration Plan

1. Trabajar sobre la branch actual `ci-improvement-v11` (no se crea branch dedicada); los cambios de docs-cleanup se commitean en esa branch.
2. **Lote A:** delete/merge de archivos con 0 refs + commit `docs(docs): remove zero-ref obsolete docs and merge orphan standards`.
3. **Lote B:** delete/merge del resto + repunte de links + commit `docs(docs): remove and merge referenced obsolete docs, repoint links`.
4. **Lote C:** reparar dangling refs pre-existentes + commit `docs(docs): fix dangling documentation references`.
5. Validación final: `rg` por cada archivo eliminado, `openspec validate docs-cleanup`, markdownlint, revisión manual de los merges.
6. Abrir PR hacia `main`; CI (docs-changelog, markdownlint) debe pasar.

## Rollback

- Revertir el commit (o commits) del change: `git revert <sha>`. Los archivos y links vuelven al estado previo.
- Rollback granular por archivo: `git checkout <sha>^ -- <path>` para restaurar un doc eliminado.
- No hay impacto en runtime: ningún código importa estos docs.

## Open Questions

- Ninguna pendiente. La decisión de commits por lote (D3) queda fijada: un commit por lote (A/B/C) para reviewability y rollback granular.
