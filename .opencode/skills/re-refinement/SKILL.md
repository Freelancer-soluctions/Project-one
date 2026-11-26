---
name: re-refinement
description: >
  Refinement stage of requirements engineering. Prioritizes backlog items
  (MoSCoW/RICE/WSJF/Kano), estimates, resolves conflicts, identifies
  dependencies and spikes. Use when there are specifications but no
  prioritization/estimation, or when the user says "refinement", "refinamiento",
  "priorizar", "estimar", "MoSCoW", "RICE", "WSJF", "Kano", "spike".
---

# RE Stage 4: Refinement

## When to Use

- Specifications exist (RN-xxx, BDD, DoR) but no prioritization or estimation.
- User wants to prioritize backlog, estimate stories, identify dependencies.
- User says "refinement", "refinamiento", "priorizar", "estimar", "MoSCoW", "RICE", "WSJF", "Kano", "spike", "dependencias".

## Input Required

Ask the user for (or infer from context):

1. **Módulo** — ¿A qué módulo pertenece?
2. **Feature (nombre/slug)** — ¿Cómo se llama la feature?
3. **User Story BDD** — leer `docs/requirements/<modulo>/<feature>/user-story-bdd.md`.
4. **DoR** — leer `docs/requirements/<modulo>/<feature>/definition-of-ready.md`.
5. **RTM** — leer `docs/requirements/<modulo>/<feature>/traceability-matrix.md`.
6. **Equipo disponible** — ¿Quién implementa? ¿Cuánta capacidad?
7. **Criterio de priorización** — ¿MoSCoW, RICE, WSJF, Kano o combinado?
8. **Conflictos conocidos** — ¿Hay desacuerdos sobre prioridad?
9. **Nivel de adopción** — 1, 2 o 3 (default: 1).

## Artifacts to Generate

### Core (siempre)

| Artefacto      | Template                     | Output                                                   |
| -------------- | ---------------------------- | -------------------------------------------------------- |
| Prioritization | `prioritization/TEMPLATE.md` | `docs/requirements/<modulo>/<feature>/prioritization.md` |

### Condicionales (según disparadores)

| Artefacto | Disparador                                             | Output                                             |
| --------- | ------------------------------------------------------ | -------------------------------------------------- |
| Spikes    | Dependencias técnicas no resueltas, incertidumbre alta | `docs/requirements/<modulo>/<feature>/spikes.md`   |
| UAT plan  | Aceptación contractual, go-live formal                 | `docs/requirements/<modulo>/<feature>/uat-plan.md` |

### Disparadores a evaluar

- ¿Hay dependencias técnicas no resueltas (API externa, librería nueva, patrón desconocido)? → Spikes
- ¿El cliente debe aceptar formalmente el resultado? → UAT plan
- ¿Hay incertidumbre técnica alta (>30% del esfuerzo)? → Spikes

## Process

1. **Leer specs** — cargar User Story BDD, DoR, RTM.
2. **Verificar DoR** — si la DoR no está completa, detener y volver a `re-specification`.
3. **Seleccionar framework de priorización** — preguntar al usuario: MoSCoW (simple), RICE (con datos), WSJF (lean), Kano (experiencia), o combinado.
4. **Priorizar** — llenar `docs/requirements-engineering/prioritization/TEMPLATE.md` aplicando el framework seleccionado a las historias y escribir en `docs/requirements/<modulo>/<feature>/prioritization.md`.
5. **Estimar** — story points (Fibonacci) por historia.
6. **Identificar dependencias** — entre historias, con otros módulos, con APIs externas.
7. **Resolver conflictos** — si hay desacuerdos, documentar con técnica de resolución (acuerdo, compromiso, votación, etc.).
8. **Evaluar disparadores** — preguntar las 3 preguntas.
9. **Generar condicionales** — si algún disparador se activa, generar el artefacto: Spikes (documento con hipótesis, tiempo máximo, resultado esperado), UAT plan (plan de aceptación sin template). Escribir en `docs/requirements/<modulo>/<feature>/`.
10. **Actualizar RTM** — añadir prioridad y estimación a la RTM existente.
11. **Actualizar card en Trello** — delegar a `@project-manager`: estimación, prioridad, DoR verificada, dependencias, spikes.
12. **Verificar exit criteria**.

## Output

| Archivo          | Ubicación                                                |
| ---------------- | -------------------------------------------------------- |
| Prioritization   | `docs/requirements/<modulo>/<feature>/prioritization.md` |
| Spikes (cond.)   | `docs/requirements/<modulo>/<feature>/spikes.md`         |
| UAT plan (cond.) | `docs/requirements/<modulo>/<feature>/uat-plan.md`       |

## Exit Criteria (criterio de salida de Refinement)

- [ ] Framework de priorización seleccionado y aplicado
- [ ] Historias priorizadas (MoSCoW/RICE/WSJF/Kano)
- [ ] Estimación completada (story points, Fibonacci)
- [ ] DoR verificada para cada historia (checklist completo)
- [ ] Dependencias identificadas (entre historias, módulos, APIs externas)
- [ ] Conflictos de priorización resueltos (o documentados con owner y fecha límite)
- [ ] Spikes identificados y documentados (si aplica)
- [ ] RTM actualizada con prioridad y estimación
- [ ] Card en Trello actualizada (estimación, prioridad, DoR, dependencias)
- [ ] Backlog actualizado con priorización

## References

- Template: `docs/requirements-engineering/prioritization/TEMPLATE.md`
- Flujo operativo: `docs/requirements-engineering-flow.md` (Etapa 4)
- Flujo completo: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` (Etapa 4)
- Índice de templates: `docs/requirements-engineering/README.md`

## Best Practices (extracted)

- **DoR antes de Refinement:** Si la DoR no está completa, no refinar. Volver a especificación.
- **Framework según contexto:** MoSCoW para simplicidad, RICE cuando hay datos, WSJF para lean, Kano para experiencia de usuario. No usar todos a la vez sin razón.
- **Estimación relativa, no absoluta:** Story points son relativos al equipo, no a horas. Calibrar con una historia de referencia.
- **Conflictos documentados:** Un conflicto de priorización no resuelto es un riesgo. Documentar con técnica de resolución y owner.
- **Spikes time-boxed:** Un spike debe tener tiempo máximo (ej: 2 días). Si no se resuelve, escalar o descomponer.
- **Dependencias explícitas:** "Depende de X" no es suficiente. Especificar: ¿qué necesita de X? ¿cuándo estará listo? ¿qué pasa si se retrasa?
- **RTM viva:** La RTM no es un documento estático. Actualizarla en cada etapa (spec → refinement → build → delivery).
- **Backlog priorizado ≠ backlog ordenado:** Priorización es por valor; ordenación es por dependencias y capacidad. Son cosas distintas.
- **No sobre-estimar:** Estimar en exceso genera buffers; estimar en defecto genera crunch. Calibrar con retrospectivas.
- **UAT plan temprano:** Si el cliente debe aceptar, el plan de UAT debe existir antes del build, no después.
