# Templates de Ingeniería de Requisitos — Project One

> **Etapa:** Todas (Discovery → Entrega)
> **Propósito:** Índice de templates de artefactos de ingeniería de requisitos, organizados por etapa RE. Cada template incluye instrucciones de uso, secciones con contenido, exit criteria y referencias con fuentes verificadas.
>
> **Relación con otros documentos:**
>
> - Flujo de ingeniería de requisitos (operativo): [docs/requirements-engineering-flow.md](../requirements-engineering-flow.md)
> - Flujo completo de una feature (conceptual): [docs/De-stakeholder-a-producción-flujo-completo-de una-feature.md](../De-stakeholder-a-producción-flujo-completo-de%20una-feature.md)
> - Contexto de la aplicación: [docs/application-context.md](../application-context.md)
> - Skills de automatización: `.opencode/skills/re-discovery/`, `re-elicitation/`, `re-specification/`, `re-refinement/`, `re-design/`, `re-handoff/`, `requirements-engineering/` (entry point)
> - Comando de handoff: `/opsx-propose-from-re <modulo> <feature>`
>
> **Dónde viven los artefactos generados:** `docs/requirements/<modulo>/<feature>/` — un módulo puede tener varias features, cada una con su propio conjunto de artefactos.
>
> **Idioma:** español.

---

## Mapa: Etapa → Template → Exit criteria

| Etapa RE          | Artefacto                            | Template                                                                           | Nivel                 | Exit criteria (resumen)                                                                                                                 |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Discovery      | Feature Brief                        | [discovery-feature-brief/TEMPLATE.md](discovery-feature-brief/TEMPLATE.md)         | Core                  | Problema con evidencia, métricas con baseline, alcance y non-goals, riesgos categorizados, Go/No-Go firmado                             |
| 2. Elicitación    | Guía de entrevista                   | [elicitation-interview-guide/TEMPLATE.md](elicitation-interview-guide/TEMPLATE.md) | Core                  | Notas tomadas, síntesis mismo día, evidencia vinculada, requisitos derivados con fuente, conflictos con estado/owner, notas confirmadas |
| 3. Especificación | Reglas de negocio (RN-xxx)           | [business-rules/TEMPLATE.md](business-rules/TEMPLATE.md)                           | Core                  | Regla en presente/voz activa, ID asignado, vocabulario SBVR, escenarios Gherkin, trazabilidad a RF/US/código/tests                      |
| 3. Especificación | User Story BDD + DoD                 | [user-story-bdd/TEMPLATE.md](user-story-bdd/TEMPLATE.md)                           | Core                  | Historia en formato Cohn, AC en Gherkin, cobertura de casos, DoD conocida, NFR anotados, trazabilidad                                   |
| 3. Especificación | Definition of Ready (DoR)            | [definition-of-ready/TEMPLATE.md](definition-of-ready/TEMPLATE.md)                 | Core                  | INVEST completo, AC en Gherkin, estimación, sin dependencias bloqueantes, DoD conocida                                                  |
| 3. Especificación | NFR (Requisitos No Funcionales)      | [non-functional-requirements/TEMPLATE.md](non-functional-requirements/TEMPLATE.md) | Condicional (Nivel 2) | Checklist ISO 25010 completo, cada NFR con medida numérica y método de verificación, vinculados a Brief/RN/US/change                    |
| 3. Especificación | Threat model (STRIDE)                | [threat-model/TEMPLATE.md](threat-model/TEMPLATE.md)                               | Condicional (Nivel 2) | DFD con límites de confianza, 6 categorías STRIDE por elemento, cada amenaza vinculada a control y test                                 |
| 3. Especificación | RTM (Matriz de trazabilidad)         | [traceability-matrix/TEMPLATE.md](traceability-matrix/TEMPLATE.md)                 | Core                  | Cada requisito con ID, fuente, tipo, prioridad, diseño ref, implementación, test ID, método, resultado, estado                          |
| 4. Refinement     | Priorización (MoSCoW/RICE/WSJF/Kano) | [prioritization/TEMPLATE.md](prioritization/TEMPLATE.md)                           | Core                  | Basis acordado, priorización completada, conflictos resueltos, actualizada en backlog                                                   |
| 5. Diseño         | ADR (Architecture Decision Record)   | [adr/TEMPLATE.md](adr/TEMPLATE.md)                                                 | Core                  | Decisión documentada, ADR numerado con status, referenciado desde design.md, revisado por par                                           |
| 5. Diseño         | Diseño de API                        | [api-design/TEMPLATE.md](api-design/TEMPLATE.md)                                   | Core                  | Endpoints documentados con método/ruta/params/body/respuestas/errores, versionado y deprecación declarados                              |
| 5. Diseño         | Plan de rollback                     | [rollback-plan/TEMPLATE.md](rollback-plan/TEMPLATE.md)                             | Core                  | Plan documentado (código, BD, flag, config), probado en staging, runbook actualizado                                                    |

---

## Niveles de adopción

- **Nivel 1 (Mínimo viable):** Core (1, 2, 3, 4, 5, 6, 9, 10, 11, 12)
- **Nivel 2 (Equipo maduro):** Core + Condicional (7, 8)
- **Nivel 3 (Enterprise regulado):** Todos + artefactos avanzados (ISO 25010 completo, ATAM, ICD, PIA/DPIA, compliance matrix, mutation testing, DAST/IAST, chaos, hypercare, DORA completo)

Ver sección "Niveles de adopción" en `docs/De-stakeholder-a-producción-flujo-completo-de una-feature.md`.

---

## Artefactos condicionales: en qué etapa se crean

Ver tabla detallada en `docs/requirements-engineering-flow.md` (sección "Artefactos condicionales").

| Artefacto               | Etapa RE típica                              | Disparador                                           |
| ----------------------- | -------------------------------------------- | ---------------------------------------------------- |
| Threat model (STRIDE)   | Specification (semilla en Discovery)         | Auth, datos sensibles, integración externa           |
| PIA/DPIA                | Discovery (se refina en Design)              | Datos personales, GDPR Art. 35                       |
| Compliance matrix       | Specification (trazabilidad requisito↔norma) | Dominio regulado, auditorías                         |
| UAT plan                | Delivery (pre-release)                       | Aceptación contractual, go-live                      |
| BPMN as-is / to-be      | Discovery (as-is) / Design (to-be)           | Cambio de proceso, automatización                    |
| Domain model / glosario | Elicitation (refinamiento en Specification)  | Dominio complejo, DDD, lenguaje ambiguo              |
| Data dictionary         | Design (modelo lógico/físico)                | Sistema intensivo en datos, BD relacional            |
| RFC                     | Design (propuesta técnica para revisión)     | Decisión técnica significativa, impacto cross-equipo |
| C4 diagramas            | Design (contexto en Discovery)               | Comunicación de arquitectura, onboarding             |

---

## Regla de oro

> **Un artefacto existe solo si alguien lo lee y lo usa para decidir.** Si nadie lo consume, no lo produzcas. Aplica el nivel de adopción según el riesgo y la regulación del cambio, no según el tamaño del equipo.

---

_Índice creado: 2026-11-24. Mantener vivo: actualizar cuando se añadan o modifiquen templates._
