---
name: requirements-engineering
description: >
  Entry point for requirements engineering in Project One. Routes to the
  appropriate stage skill (Discovery, Elicitation, Specification, Refinement,
  Design) based on the user's current need. References the RE flow doc and
  templates index. Use when starting a new feature, when unsure which RE stage
  to work on, or when the user says "requirements engineering", "ingeniería de
  requisitos", "RE", "nueva feature", or "empezar feature".
---

# Requirements Engineering — Entry Point

This skill is the **router** for the requirements engineering (RE) lifecycle in Project One. It does not produce artifacts directly; it guides you to the correct stage skill and ensures the flow is followed.

## When to Use

- Starting a new feature or change from scratch.
- Unsure which RE stage to work on next.
- Need a map of the full RE flow and available artifacts.
- User asks about requirements engineering process, stages, or artifacts.

## RE Flow (Project One)

```
1. Discovery → 2. Elicitation → 3. Specification → 4. Refinement → 5. Design → Handoff → 6. Build → 7. Delivery
```

| #         | Etapa          | Skill              | Artefactos Core                                   |
| --------- | -------------- | ------------------ | ------------------------------------------------- |
| 1         | Discovery      | `re-discovery`     | Feature Brief                                     |
| 2         | Elicitación    | `re-elicitation`   | Interview Guide                                   |
| 3         | Especificación | `re-specification` | Business Rules, User Story BDD, DoR, RTM          |
| 4         | Refinement     | `re-refinement`    | Prioritization                                    |
| 5         | Diseño técnico | `re-design`        | ADR, API Design, Rollback Plan                    |
| → Handoff | Handoff        | `re-handoff`       | DoR gate, mapeo RE→OpenSpec, invoca /opsx:propose |

OpenSpec enters **only at Handoff** (after ADR), not before. Trello Epic is created at Discovery; card at Specification.

## How to Route

Ask the user: **"¿En qué etapa estás?"** or infer from context:

- **No hay Feature Brief** → `re-discovery`
- **Hay Brief pero no hay notas de elicitación** → `re-elicitation`
- **Hay notas pero no hay historia BDD / DoR** → `re-specification`
- **Hay historia pero no está priorizada/estimada** → `re-refinement`
- **Hay DoR pero no hay ADR / diseño API** → `re-design`
- **Todo listo para handoff** → `re-handoff` o `/opsx-propose-from-re <modulo> <feature>` (verifica DoR gate y mapea RE→OpenSpec). Usar `/opsx:propose` directo solo si NO existen artefactos RE (Nivel 1, cambio simple).

## Niveles de adopción

| Nivel             | Artefactos         | Cuándo usar                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Mínimo viable) | Solo Core          | Startup, solo dev, cambio de bajo riesgo                                                                                                                                                                                                                                            |
| 2 (Equipo maduro) | Core + Condicional | Equipo con múltiples devs, cambio con auth/datos sensibles                                                                                                                                                                                                                          |
| 3 (Enterprise)    | Todos + avanzados  | Dominio regulado, auditorías, compliance. Artefactos avanzados: ISO 25010 completo, ATAM, ICD, PIA/DPIA, compliance matrix completa, mutation testing, DAST/IAST, chaos, hypercare, DORA completo (ver `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md`) |

## Dónde viven los artefactos

Los artefactos generados se clasifican por **módulo y feature**. Un módulo puede tener varias features:

```
docs/requirements/<modulo>/<feature>/
├── feature-brief.md
├── elicitation-interview-guide.md
├── business-rules.md
├── user-story-bdd.md
├── definition-of-ready.md
├── nfr.md                    (condicional, Nivel 2+)
├── threat-model.md           (condicional)
├── compliance-matrix.md      (condicional)
├── traceability-matrix.md
├── prioritization.md
├── adr-NNNN-<titulo>.md
├── api-design.md
└── rollback-plan.md
```

Ejemplo: `docs/requirements/notifications/po-rejection-notification/feature-brief.md`

Las templates (vacías) viven en `docs/requirements-engineering/<artefacto>/TEMPLATE.md`.

## Artefactos condicionales — disparadores

| Artefacto               | Disparador                                |
| ----------------------- | ----------------------------------------- |
| Threat model (STRIDE)   | Auth, datos sensibles, API expuesta       |
| PIA/DPIA                | Datos personales (GDPR/leyes locales)     |
| Compliance matrix       | Dominio regulado, auditorías              |
| UAT plan                | Aceptación contractual, go-live           |
| BPMN as-is/to-be        | Proceso de negocio complejo               |
| Domain model / glosario | Dominio complejo, DDD, términos ambiguos  |
| Data dictionary         | Sistema intensivo en datos, BD relacional |
| RFC                     | Decisión cross-equipo/módulo              |
| C4 diagramas            | Múltiples equipos o módulos               |

## Referencias

- Flujo operativo: `docs/requirements-engineering-flow.md`
- Flujo completo (conceptual): `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md`
- Índice de templates: `docs/requirements-engineering/README.md`
- Contexto de la app: `docs/application-context.md`
- OpenSpec config: `openspec/config.yaml`

## Regla de oro

> **Un artefacto existe solo si alguien lo lee y lo usa para decidir.** Si nadie lo consume, no lo produzcas. Aplica el nivel de adopción según el riesgo y la regulación del cambio.
