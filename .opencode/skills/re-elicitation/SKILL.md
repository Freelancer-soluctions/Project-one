---
name: re-elicitation
description: >
  Elicitation stage of requirements engineering. Produces interview guides,
  elicits requirements by role, resolves conflicts, derives business rules
  (RN-xxx) and NFR. Use when there is a Feature Brief but no elicitation
  notes, or when the user says "elicitation", "entrevista", "requisitos",
  "analista", "elicitar".
---

# RE Stage 2: Elicitation

## When to Use

- Feature Brief exists but no elicitation notes or requirements have been gathered.
- User wants to interview stakeholders, gather requirements by role.
- User says "elicitation", "entrevista", "requisitos", "analista", "elicitar", "entrevistar".

## Input Required

Ask the user for (or infer from context):

1. **Módulo** — ¿A qué módulo pertenece? (ej: notifications, expenses)
2. **Feature (nombre/slug)** — ¿Cómo se llama la feature?
3. **Feature Brief** — leer `docs/requirements/<modulo>/<feature>/feature-brief.md` (debe existir).
4. **Roles a entrevistar** — ¿Quiénes son los stakeholders? (PO, dev, QA, UX, ops, seguridad, soporte, datos, legal, etc.)
5. **Preguntas por rol** — ¿Qué necesita saber de cada rol? (o generar a partir del Brief)
6. **Contexto del dominio** — ¿Hay términos ambiguos? ¿Hay procesos complejos?
7. **Nivel de adopción** — 1, 2 o 3 (default: 1)

## Artifacts to Generate

### Core (siempre)

- **Elicitation Interview Guide** → `docs/requirements/<modulo>/<feature>/elicitation-interview-guide.md`
  - Notas por rol, hallazgos, conflictos resueltos, requisitos derivados con fuente.

### Condicionales (según disparadores)

| Artefacto               | Disparador                               | Output                                                 |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Domain model / glosario | Términos ambiguos, dominio complejo, DDD | `docs/requirements/<modulo>/<feature>/domain-model.md` |

> **Nota:** BPMN (as-is) se genera en Discovery (`re-discovery`); BPMN (to-be) se genera en Diseño (`re-design`). La elicitación solo genera el domain model/glosario como condicional.

### Disparadores a evaluar

- ¿Hay términos que diferentes roles interpretan diferente? → Domain model/glosario
- ¿El dominio es complejo o se usa DDD? → Domain model
- ¿El proceso tiene ≥3 pasos o múltiples actores? → BPMN (se genera en Discovery/Design, no aquí)

## Process

1. **Leer Feature Brief** — cargar `docs/requirements/<modulo>/<feature>/feature-brief.md`.
2. **Identificar roles** — listar stakeholders del Brief; preguntar si faltan.
3. **Generar guía de entrevista** — llenar `docs/requirements-engineering/elicitation-interview-guide/TEMPLATE.md` con el input del usuario (preguntas por rol, síntesis, conflictos, requisitos derivados) y escribir en `docs/requirements/<modulo>/<feature>/elicitation-interview-guide.md`.
4. **Conducir entrevistas** (o simular) — recopilar notas por rol.
5. **Sintetizar hallazgos** — mismo día: requisitos derivados (RN-xxx), conflictos resueltos, NFR derivados.
6. **Evaluar disparadores** — preguntar las 2 preguntas de disparadores (domain model y BPMN).
7. **Generar condicionales** — si algún disparador se activa, generar el artefacto: Domain model/glosario (documento con términos y definiciones), BPMN (diagrama). No hay templates para estos; generar según best practices.
8. **Actualizar Epic en Trello** — delegar a `@project-manager`: añadir hallazgos, conflictos, requisitos derivados.
9. **Verificar exit criteria**.

## Output

| Archivo                       | Ubicación                                                             |
| ----------------------------- | --------------------------------------------------------------------- |
| Elicitation Interview Guide   | `docs/requirements/<modulo>/<feature>/elicitation-interview-guide.md` |
| Domain model/glosario (cond.) | `docs/requirements/<modulo>/<feature>/domain-model.md`                |

## Exit Criteria (criterio de salida de Elicitación)

- [ ] Notas de entrevista tomadas por cada rol
- [ ] Síntesis realizada el mismo día (mientras el contexto está fresco)
- [ ] Cada requisito derivado tiene fuente (rol + fecha)
- [ ] Conflictos identificados con estado y owner asignado
- [ ] Requisitos de negocio (RN-xxx) extraídos con vocabulario SBVR
- [ ] NFR derivados anotados (seguridad, a11y, i18n, performance)
- [ ] Artefactos condicionales generados si algún disparador se activó
- [ ] Epic en Trello actualizado con hallazgos
- [ ] Notas confirmadas por entrevistados (si aplica)

## References

- Template: `docs/requirements-engineering/elicitation-interview-guide/TEMPLATE.md`
- Flujo operativo: `docs/requirements-engineering-flow.md` (Etapa 2)
- Flujo completo: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` (Etapa 2)
- Índice de templates: `docs/requirements-engineering/README.md`

## Best Practices (extracted)

- **Entrevistar por rol, no por departamento:** Cada rol tiene necesidades distintas. El mismo proceso se ve diferente para un PO que para un dev de soporte.
- **Preguntas abiertas primero, cerradas después:** "¿Qué te frustra del proceso actual?" antes de "¿Necesitas filtro por fecha?"
- **Síntesis el mismo día:** El contexto se pierde rápidamente. Sintetizar mientras está fresco evita pérdida de información.
- **Conflictos explícitos:** No ignorar conflictos entre roles. Documentarlos con estado (resuelto/pendiente) y owner. Un conflicto no resuelto es un riesgo.
- **Vocabulario SBVR:** Usar términos del dominio, no jerga técnica. "OC rechazada" no "status=REJECTED".
- **NFR por observación:** Los NFR rara vez se declaran; se infieren del comportamiento esperado. "¿Cuánto tiempo puede tardar?" → performance.
- **Confirmación:** Enviar notas a entrevistados para validación. Previene malentendidos posteriores.
- **No más de 5-7 entrevistas:** Después de 7, los hallazgos se repiten. Priorizar roles con más información nueva.
- **Observación > entrevista:** Si es posible, observar al usuario en su trabajo real. Lo que dice ≠ lo que hace.
