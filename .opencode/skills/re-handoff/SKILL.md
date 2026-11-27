---
name: re-handoff
description: >
  Handoff from requirements engineering to OpenSpec change creation. Verifies
  that all mandatory RE artifacts exist (DoR, Feature Brief, RN-xxx, BDD, NFR,
  ADR if applicable), reads them, evaluates conditional triggers, guides the
  mapping RE→OpenSpec (proposal, delta specs, design, tasks), and invokes
  /opsx:propose with the RE context. Use when RE stages 1-5 are complete and
  the user is ready to create the OpenSpec change, or when the user says
  "handoff", "crear change", "opsx propose from re", "pasar a openspec".
---

# RE Handoff: Requirements → OpenSpec Change

## When to Use

- All RE stages (1-5) are complete and exit criteria are met.
- User wants to create the OpenSpec change from RE artifacts.
- User says "handoff", "crear change", "opsx propose from re", "pasar a openspec", "listo para openspec".

## Input Required

1. **Módulo** — ¿A qué módulo pertenece la feature?
2. **Feature (nombre/slug)** — ¿Cómo se llama la feature?
3. **Change name** — Nombre kebab-case para el change OpenSpec (ej: `add-po-rejection-notification`). Si no se proporciona, derivar del feature slug.

## Artifacts to Generate

### OpenSpec (generados por /opsx:propose)

| Artefacto           | Template OpenSpec | Output                                               |
| ------------------- | ----------------- | ---------------------------------------------------- |
| proposal.md         | `openspec` schema | `openspec/changes/<change-name>/proposal.md`         |
| specs/<cap>/spec.md | `openspec` schema | `openspec/changes/<change-name>/specs/<cap>/spec.md` |
| design.md           | `openspec` schema | `openspec/changes/<change-name>/design.md`           |
| tasks.md            | `openspec` schema | `openspec/changes/<change-name>/tasks.md`            |

### RE (ya existentes, se leen como input)

| Artefacto       | Ubicación                                                                       |
| --------------- | ------------------------------------------------------------------------------- |
| Feature Brief   | `docs/requirements/<modulo>/<feature>/feature-brief.md`                         |
| Business Rules  | `docs/requirements/<modulo>/<feature>/business-rules.md`                        |
| User Story BDD  | `docs/requirements/<modulo>/<feature>/user-story-bdd.md`                        |
| DoR             | `docs/requirements/<modulo>/<feature>/definition-of-ready.md`                   |
| NFR             | `docs/requirements/<modulo>/<feature>/nfr.md`                                   |
| RTM             | `docs/requirements/<modulo>/<feature>/traceability-matrix.md`                   |
| ADR (cond.)     | `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md`                     |
| + condicionales | `docs/requirements/<modulo>/<feature>/` (threat-model, compliance-matrix, etc.) |

## Output

| Archivo             | Ubicación                                            |
| ------------------- | ---------------------------------------------------- |
| proposal.md         | `openspec/changes/<change-name>/proposal.md`         |
| specs/<cap>/spec.md | `openspec/changes/<change-name>/specs/<cap>/spec.md` |
| design.md           | `openspec/changes/<change-name>/design.md`           |
| tasks.md            | `openspec/changes/<change-name>/tasks.md`            |

## Process

### Step 1: Verificar artefactos obligatorios (DoR gate)

Leer `docs/requirements/<modulo>/<feature>/` y verificar que existan:

| #   | Artefacto               | Archivo                  | Obligatorio            | Gate                                                                                                                                                           |
| --- | ----------------------- | ------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Feature Brief           | `feature-brief.md`       | Sí                     | Bloquea si falta                                                                                                                                               |
| 2   | Business Rules (RN-xxx) | `business-rules.md`      | Sí                     | Bloquea si falta                                                                                                                                               |
| 3   | User Story BDD          | `user-story-bdd.md`      | Sí                     | Bloquea si falta                                                                                                                                               |
| 4   | Definition of Ready     | `definition-of-ready.md` | Sí                     | Bloquea si falta                                                                                                                                               |
| 5   | NFR                     | `nfr.md`                 | Sí (al menos críticos) | Bloquea si falta                                                                                                                                               |
| 6   | Traceability Matrix     | `traceability-matrix.md` | Sí (seed)              | Bloquea si falta                                                                                                                                               |
| 7   | ADR                     | `adr-NNNN-<titulo>.md`   | Condicional            | Solo si hubo decisión arquitectural. Si no hay ADR, el usuario debe confirmar explícitamente que no hubo decisión arquitectural (no se requiere campo en DoR). |
| 8   | Sign-off                | (en Feature Brief o DoR) | Sí                     | Bloquea si falta (nombre + fecha)                                                                                                                              |

**Si falta algún artefacto obligatorio:** Detener. Informar al usuario qué falta y sugerir la skill correspondiente (`re-discovery`, `re-specification`, etc.) para completarlo.

### Step 2: Evaluar artefactos condicionales

Verificar si se generaron artefactos condicionales y listarlos:

| Artefacto         | Archivo                | ¿Generado? | Incluir en change                           |
| ----------------- | ---------------------- | ---------- | ------------------------------------------- |
| Threat model      | `threat-model.md`      | Sí/No      | Si existe → incluir en design.md            |
| Compliance matrix | `compliance-matrix.md` | Sí/No      | Si existe → incluir en design.md            |
| Spikes            | `spikes.md`            | Sí/No      | Si existe → incluir en tasks.md             |
| UAT plan          | `uat-plan.md`          | Sí/No      | Si existe → incluir en proposal.md (Impact) |
| BPMN as-is/to-be  | `bpmn*.md`             | Sí/No      | Si existe → incluir en design.md            |
| Domain model      | `domain-model.md`      | Sí/No      | Si existe → incluir en design.md            |
| Data dictionary   | `data-dictionary.md`   | Sí/No      | Si existe → incluir en design.md            |
| RFC               | `rfc.md`               | Sí/No      | Si existe → incluir en design.md            |
| C4                | `c4*.md`               | Sí/No      | Si existe → incluir en design.md            |

### Step 3: Leer y resumir artefactos

Leer todos los artefactos obligatorios (y condicionales si existen). Presentar un resumen al usuario:

```
## Resumen de RE para change: <change-name>

**Módulo:** <modulo>
**Feature:** <feature>
**Nivel de adopción:** <1/2/3>

### Artefactos obligatorios
- ✅ Feature Brief — problema: <resumen>, medida de éxito: <métrica>
- ✅ Business Rules — RN-xxx: <lista de IDs>
- ✅ User Story BDD — <n> escenarios (happy path + edge + error)
- ✅ DoR — verificada (INVEST ✅, AC ✅, estimación ✅, sin bloqueos ✅)
- ✅ NFR — <lista de NFR críticos>
- ✅ RTM — seed con <n> requisitos
- ✅ ADR — ADR-NNNN: <título> (status: proposed)
- ✅ Sign-off — <nombre>, <fecha>

### Artefactos condicionales
- ✅/❌ Threat model
- ✅/❌ Compliance matrix
- (etc.)

### Mapeo RE → OpenSpec
- proposal.md ← Feature Brief (Why) + RN-xxx (What Changes) + Non-goals + Impact (riesgos, rollback) + Stakeholders/validación
- specs/<cap>/spec.md ← BDD scenarios (GIVEN/WHEN/THEN → ADDED/MODIFIED/REMOVED con referencias a RN-xxx)
- design.md ← ADR (referencia) + API design + migración expand/contract + rollback + NFR/perf + threat model + condicionales
- tasks.md ← Descomposición en tasks atómicas (≤2h) con sección de verificación final
```

### Step 4: Mapeo RE → OpenSpec (guía detallada)

| RE Artifact                | OpenSpec Artifact                       | Qué extraer                                                                                 |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Feature Brief**          | `proposal.md`                           | Problem (Why), scope, Non-goals, stakeholders, impact/risks, sign-off date                  |
| **RN-xxx**                 | `proposal.md` + delta specs             | What Changes (RN references) + ADDED/MODIFIED/REMOVED requirements with RN-xxx traceability |
| **BDD scenarios**          | `specs/<cap>/spec.md` (delta)           | Translate GIVEN/WHEN/THEN into OpenSpec scenario format (`#### Scenario: ...`)              |
| **NFR**                    | `design.md` + delta specs               | NFR/perf section in design; constraint scenarios in specs                                   |
| **DoR**                    | **Verification gate** (not an artifact) | DoR checklist must be fully satisfied before change creation                                |
| **ADR**                    | `design.md`                             | Reference the ADR file (don't duplicate). Link in design.md.                                |
| **Threat model** (cond.)   | `design.md`                             | Security section in design                                                                  |
| **API design** (Design)    | `design.md`                             | API endpoints, migration plan                                                               |
| **Rollback plan** (Design) | `proposal.md` (Impact) + `design.md`    | Rollback section                                                                            |
| **Sign-off**               | `proposal.md`                           | Stakeholders/validación con fecha                                                           |

### Step 5: Invocar OpenSpec

Una vez verificados y mapeados, invocar:

```bash
/opsx:propose <change-name>
```

Pasar el contexto de los artefactos RE al agente para que los use como input al crear los artefactos OpenSpec. El agente debe:

1. **proposal.md** — llenar con Feature Brief (Why) + RN-xxx (What Changes) + Non-goals + Impact (riesgos, dependencias, rollback) + Stakeholders/validación con fecha de sign-off.
2. **specs/<cap>/spec.md** (delta) — traducir escenarios BDD a ADDED/MODIFIED/REMOVED con referencias a RN-xxx.
3. **design.md** — referenciar el ADR (ya existente) + diseño de API, migración expand/contract, plan de rollback, NFR/perf, threat model revisado + condicionales.
4. **tasks.md** — descomponer la implementación en tasks atómicas (≤2h) con sección de verificación final.

### Step 6: Verificar después del propose

Después de crear el change, verificar:

- [ ] `openspec/changes/<change-name>/proposal.md` existe y contiene Why + What Changes + Non-goals + Impact + Stakeholders
- [ ] `openspec/changes/<change-name>/specs/<cap>/spec.md` existe y contiene escenarios con referencias a RN-xxx
- [ ] `openspec/changes/<change-name>/design.md` existe y referencia el ADR
- [ ] `openspec/changes/<change-name>/tasks.md` existe y tiene tasks atómicas con verificación final
- [ ] `openspec validate --strict` pasa (si aplica)

### Step 7: Actualizar Trello

Delegar a `@project-manager`:

- Actualizar la card de historia con: `OpenSpec: openspec/changes/<change-name>/`
- Mover a "Sprint Backlog" si pasa el DoR.

## Exit Criteria (criterio de salida del Handoff)

- [ ] Todos los artefactos obligatorios verificados (DoR gate)
- [ ] Artefactos condicionales evaluados y listados
- [ ] Resumen de RE presentado al usuario
- [ ] Mapeo RE→OpenSpec documentado
- [ ] Change OpenSpec creado (`/opsx:propose <change-name>`)
- [ ] Artefactos OpenSpec llenados con contenido RE (proposal, delta specs, design, tasks)
- [ ] `openspec validate --strict` pasa (si aplica)
- [ ] Card Trello actualizada con referencia al change
- [ ] Listo para `/opsx:apply`

## References

- Flujo operativo: `docs/requirements-engineering-flow.md` (sección "Artefactos necesarios para crear el change de OpenSpec")
- Flujo completo: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md`
- RE skills: `re-discovery`, `re-elicitation`, `re-specification`, `re-refinement`, `re-design`
- OpenSpec command: `/opsx:propose`
- OpenSpec skill: `openspec-propose`
- Índice de templates: `docs/requirements-engineering/README.md`

## Best Practices (extracted)

- **DoR gate estricto:** No crear el change si falta algún artefacto obligatorio. El costo de crear un change prematuro (scope ambiguo) es mayor que el costo de completar el RE.
- **Forward-only coupling:** Las skills RE nunca auto-invocan OpenSpec. OpenSpec nunca auto-lee artefactos RE. El usuario dispara el handoff explícitamente. (Patrón de Spec Kit: discovery y delivery son procesos separados.)
- **No duplicar:** Los artefactos OpenSpec (proposal, design) referencian los artefactos RE, no los duplican. El ADR se referencia, no se copia. Las RN-xxx se referencian, no se reescriben.
- **Un change = una capacidad verificable:** Si no se puede escribir un escenario GIVEN/WHEN/THEN que demuestre valor al usuario, no es un change válido. Máximo 5 días-persona por change.
- **Validación post-creación:** Después de crear el change, verificar que los artefactos OpenSpec contienen el contenido RE mapeado. Un change vacío o con placeholder es peor que no tener change.
- **Condicionales documentados:** Si se generaron artefactos condicionales (threat model, PIA, etc.), listarlos explícitamente en el resumen para que el usuario sepa qué se incluye en el change.
- **Trazabilidad:** La RTM es el pegamento. Cada requisito (RN-xxx) debe poder rastrearse desde el Feature Brief hasta el código y el test.
- **Handoff limpio:** ADR + paquete de spec validada (Brief + RN-xxx + BDD + NFR + DoR) son el input de `/opsx:propose`. No crear el change sin ellos.
