---
name: re-specification
description: >
  Specification stage of requirements engineering. Produces business rules
  (RN-xxx), user stories with BDD (GIVEN/WHEN/THEN), Definition of Ready (DoR),
  traceability matrix (RTM), and conditionally NFR, threat model (STRIDE),
  compliance matrix. Use when there are elicitation notes but no formal specs,
  or when the user says "specification", "especificación", "historia de usuario",
  "BDD", "DoR", "reglas de negocio", "RN".
---

# RE Stage 3: Specification

## When to Use

- Elicitation notes exist but no formal specifications (RN-xxx, BDD, DoR).
- User wants to write user stories, business rules, or acceptance criteria.
- User says "specification", "especificación", "historia de usuario", "BDD", "DoR", "reglas de negocio", "RN", "criterios de aceptación".

## Input Required

Ask the user for (or infer from context):

1. **Módulo** — ¿A qué módulo pertenece?
2. **Feature (nombre/slug)** — ¿Cómo se llama la feature?
3. **Feature Brief** — leer `docs/requirements/<modulo>/<feature>/feature-brief.md`.
4. **Elicitation notes** — leer `docs/requirements/<modulo>/<feature>/elicitation-interview-guide.md`.
5. **Domain model / glosario** (si existe) — leer `docs/requirements/<modulo>/<feature>/domain-model.md`.
6. **Nivel de adopción** — 1, 2 o 3 (default: 1).
7. **Disparadores de condicionales** — evaluar (ver tabla abajo).

## Artifacts to Generate

### Core (siempre)

| Artefacto                 | Template                          | Output                                                        |
| ------------------------- | --------------------------------- | ------------------------------------------------------------- |
| Business Rules (RN-xxx)   | `business-rules/TEMPLATE.md`      | `docs/requirements/<modulo>/<feature>/business-rules.md`      |
| User Story BDD + DoD      | `user-story-bdd/TEMPLATE.md`      | `docs/requirements/<modulo>/<feature>/user-story-bdd.md`      |
| Definition of Ready (DoR) | `definition-of-ready/TEMPLATE.md` | `docs/requirements/<modulo>/<feature>/definition-of-ready.md` |
| Traceability Matrix (RTM) | `traceability-matrix/TEMPLATE.md` | `docs/requirements/<modulo>/<feature>/traceability-matrix.md` |

### Condicionales (según disparadores)

| Artefacto             | Disparador                                                  | Template                                  | Output                                                      |
| --------------------- | ----------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| NFR                   | Nivel 2+ o cambio con impacto en seguridad/performance/a11y | `non-functional-requirements/TEMPLATE.md` | `docs/requirements/<modulo>/<feature>/nfr.md`               |
| Threat model (STRIDE) | Toca auth, datos sensibles, API expuesta                    | `threat-model/TEMPLATE.md`                | `docs/requirements/<modulo>/<feature>/threat-model.md`      |
| Compliance matrix     | Dominio regulado, auditorías (DIAN, SOX, WCAG)              | (no template — generar tabla)             | `docs/requirements/<modulo>/<feature>/compliance-matrix.md` |

### Disparadores a evaluar (preguntar al usuario)

- ¿El cambio toca autenticación, autorización o datos sensibles? → Threat model
- ¿Hay regulación aplicable (DIAN, SOX, WCAG, GDPR)? → Compliance matrix
- ¿Nivel de adopción ≥ 2? → NFR
- ¿El cambio tiene impacto en seguridad, performance o accesibilidad? → NFR (si Nivel 1, al menos los críticos)

## Process

1. **Leer Feature Brief y notas de elicitación** — cargar ambos archivos.
2. **Extraer reglas de negocio (RN-xxx)** — llenar `docs/requirements-engineering/business-rules/TEMPLATE.md` con las reglas extraídas de las notas de elicitación y el Brief (vocabulario SBVR, condición explícita, escenarios Gherkin) y escribir en `docs/requirements/<modulo>/<feature>/business-rules.md`.
3. **Escribir historia de usuario BDD** — llenar `docs/requirements-engineering/user-story-bdd/TEMPLATE.md` con la historia en formato Cohn + criterios de aceptación GIVEN/WHEN/THEN + DoD + NFR anotados y escribir en `docs/requirements/<modulo>/<feature>/user-story-bdd.md`.
4. **Verificar DoR** — llenar `docs/requirements-engineering/definition-of-ready/TEMPLATE.md` con el checklist INVEST + AC en Gherkin + estimación + sin dependencias bloqueantes + DoD conocida y escribir en `docs/requirements/<modulo>/<feature>/definition-of-ready.md`.
5. **Crear RTM seed** — llenar `docs/requirements-engineering/traceability-matrix/TEMPLATE.md` vinculando requisito → fuente → tipo → prioridad (diseño/impl/test se llenan después) y escribir en `docs/requirements/<modulo>/<feature>/traceability-matrix.md`.
6. **Evaluar disparadores** — preguntar las 4 preguntas de disparadores.
7. **Generar condicionales** — si algún disparador se activa, generar el artefacto: NFR (llenar `docs/requirements-engineering/non-functional-requirements/TEMPLATE.md`), Threat model (llenar `docs/requirements-engineering/threat-model/TEMPLATE.md`), Compliance matrix (tabla sin template). Escribir en `docs/requirements/<modulo>/<feature>/`.
8. **Crear card de historia en Trello** — delegar a `@project-manager`: título `[Area] Descripción corta`, AC en BDD, NFR, DoR, dependencias, tamaño, prioridad. Estado: Sprint Backlog.
9. **Verificar exit criteria**.

## Output

| Archivo                   | Ubicación                                                     |
| ------------------------- | ------------------------------------------------------------- |
| Business Rules            | `docs/requirements/<modulo>/<feature>/business-rules.md`      |
| User Story BDD            | `docs/requirements/<modulo>/<feature>/user-story-bdd.md`      |
| Definition of Ready       | `docs/requirements/<modulo>/<feature>/definition-of-ready.md` |
| Traceability Matrix       | `docs/requirements/<modulo>/<feature>/traceability-matrix.md` |
| NFR (cond.)               | `docs/requirements/<modulo>/<feature>/nfr.md`                 |
| Threat model (cond.)      | `docs/requirements/<modulo>/<feature>/threat-model.md`        |
| Compliance matrix (cond.) | `docs/requirements/<modulo>/<feature>/compliance-matrix.md`   |

## Exit Criteria (criterio de salida de Especificación)

- [ ] Reglas de negocio (RN-xxx) formales y verificables, con condiciones explícitas
- [ ] Historia de usuario en formato Cohn (Como/Quiero/Para)
- [ ] Criterios de aceptación en Gherkin (GIVEN/WHEN/THEN) con cobertura de casos (happy path + edge cases + errores)
- [ ] DoD conocida y anotada en la historia
- [ ] NFR anotados (seguridad, a11y, i18n, performance) — al menos los críticos
- [ ] DoR verificada (INVEST completo, AC en Gherkin, estimación, sin dependencias bloqueantes)
- [ ] RTM seed creada (requisito → fuente → tipo → prioridad)
- [ ] Artefactos condicionales generados si algún disparador se activó
- [ ] Sign-off de stakeholders con fecha
- [ ] Card de historia creada en Trello con AC en BDD, NFR, DoR, dependencias, tamaño, prioridad

## References

- Templates: `docs/requirements-engineering/business-rules/TEMPLATE.md`, `docs/requirements-engineering/user-story-bdd/TEMPLATE.md`, `docs/requirements-engineering/definition-of-ready/TEMPLATE.md`, `docs/requirements-engineering/traceability-matrix/TEMPLATE.md`, `docs/requirements-engineering/non-functional-requirements/TEMPLATE.md`, `docs/requirements-engineering/threat-model/TEMPLATE.md`
- Flujo operativo: `docs/requirements-engineering-flow.md` (Etapa 3)
- Flujo completo: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` (Etapa 3)
- Índice de templates: `docs/requirements-engineering/README.md`

## Best Practices (extracted)

- **Un change = una capacidad verificable:** Si no se puede escribir un escenario GIVEN/WHEN/THEN que demuestre valor al usuario, no es un change válido.
- **RN-xxx con vocabulario SBVR:** Usar términos del dominio, no jerga técnica. Cada regla debe tener condición explícita y ser verificable.
- **AC como especificación, no como test:** Los criterios de aceptación definen comportamiento esperado; el DoD define calidad del incremento. Son complementarios.
- **Cobertura de casos:** Cada historia debe tener al menos: happy path, 1 edge case, 1 caso de error. Si no hay edge cases, no has pensado suficiente.
- **DoR antes de Refinement:** No llevar una historia a refinement sin DoR verificada. Una historia sin DoR es un riesgo.
- **RTM desde el inicio:** Crear la RTM en especificación (seed) y actualizarla en cada etapa. Es el pegamento entre requisito y código.
- **Sign-off explícito:** Documentar quién aprobó y cuándo. Previene "yo no pedí eso" posterior.
- **NFR por defecto:** Incluso en Nivel 1, incluir NFR críticos (seguridad básica, performance). No esperar a Nivel 2 para pensar en seguridad.
- **Threat model temprano:** Si toca auth o datos sensibles, el threat model debe existir antes del diseño, no después.
- **Un artefacto por capacidad:** No mezclar múltiples capacidades en un solo artefacto. Si la historia tiene >5 escenarios, probablemente es más de una capacidad.
