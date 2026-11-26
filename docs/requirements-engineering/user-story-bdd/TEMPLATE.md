# User Story — Template (US-xxx)

> **Etapa:** 3. Especificación
> **Artefacto:** Historia de usuario con criterios de aceptación BDD (Gherkin) + Definition of Done (DoD)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Artefacto único de especificación que combina la historia de usuario (formato Cohn/IREB: "Como [rol], quiero [capacidad], para [beneficio]") con criterios de aceptación en Gherkin (Given/When/Then) y el Definition of Done (calidad del incremento). Los criterios de aceptación definen el comportamiento esperado (qué debe hacer); el DoD define la calidad del incremento (cómo se construye). Son complementarios, no equivalentes.
>
> **No confundir con:** Feature Brief (estratégico, abarca el feature completo), Regla de negocio (RN-xxx — ley del negocio, no valor para usuario), DoR (gate de entrada al sprint, no de salida).
>
> **Fuentes:** Agile Alliance (INVEST) [1], Bill Wake (XP123, autor de INVEST) [2], Cucumber (user story + Gherkin) [3][4], Atlassian (user stories) [5], QAPractices (BDD template) [6], Altexsoft (acceptance criteria) [7], Thoughtworks (BDD acceptance criteria) [8], Dojo Consortium (BDD) [9], ClearlyReqs [10], IREB CPRE RE@Agile Handbook [11], IREB CPRE Requirements Management Handbook [12], RE Magazine (strengthening RE process) [13], Scrum.org (DoD) [14], Scrum Alliance (DoD) [15], Atlassian (DoD) [16], Mountain Goat Software (DoD) [17], Tech.gov.sg (DoD) [18], markdowneditor.cc (BDD template) [19].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia este template y renómbralo: `US-<XXX>-<slug>.md` (ej. `US-OC-007-aprobacion-autonoma-oc.md`).
> 2. Completa la sección "Historia" y "Contexto" antes de escribir los criterios.
> 3. Escribe los criterios de aceptación en Gherkin (un comportamiento por escenario). Cobertura recomendada: 3-7 escenarios por historia (más de 10 indica épica disfrazada).
> 4. Usa `# language: es` para stakeholders hispanohablantes.
> 5. Etiqueta los escenarios (`@smoke`, `@regression`, `@manual`) para CI.
> 6. Completa el checklist de cobertura y el DoD.
> 7. Persiste en `/docs/stories/` o en el backlog (Linear/Jira). Referénciala desde el change OpenSpec (`proposal.md`).
>
> ---

## Control

| Campo                     | Valor                                             |
| ------------------------- | ------------------------------------------------- |
| **ID**                    | US-xxx                                            |
| **Feature**               | <nombre del feature>                              |
| **Épica**                 | <nombre de la épica>                              |
| **Versión**               | 0.1                                               |
| **Estado**                | Borrador / Acordado / Implementado / Verificado   |
| **Owner**                 | @po                                               |
| **Fecha**                 | YYYY-MM-DD                                        |
| **Feature file**          | `features/<modulo>/<nombre>.feature`              |
| **NFR aplicables**        | <seguridad, a11y, i18n, performance>              |
| **Sign-off stakeholders** | <nombre> — YYYY-MM-DD                             |
| **Prioridad (MoSCoW)**    | Must Have / Should Have / Could Have / Won't Have |
| **Estimación (pts)**      | <n>                                               |

---

## Historia

> Formato Cohn/IREB: "Como [rol], quiero [capacidad], para [beneficio]". La historia describe la esencia, no la solución.

Como [rol]
quiero [capacidad]
para [beneficio]

---

## Contexto (opcional)

- **Reglas de negocio:** RN-xxx, RN-yyy
- **Dependencias:** <historias o changes que deben estar listos antes>
- **Notas técnicas:** <incertidumbres, spikes, restricciones>
- **Spike relacionado:** TASK-SP-xxx (si aplica)

---

## Criterios de aceptación (Gherkin)

```gherkin
# language: es
@US-xxx
Feature: [nombre de la capacidad]
  Como [rol]
  quiero [capacidad]
  para [beneficio]

  Background:
    Given [precondición compartida]
    And [contexto]

  Rule: [RN-xxx] [regla de negocio]
    @SC-01 @US-xxx @smoke
    Scenario: [comportamiento — camino feliz]
      Given [precondición]
      When [acción]
      Then [resultado observable]
      And [efecto secundario]

    @SC-02 @US-xxx
    Scenario: [comportamiento — camino alternativo]
      Given [precondición]
      When [acción alternativa]
      Then [resultado alternativo]

    @SC-03 @US-xxx
    Scenario Outline: [comportamiento parametrizado]
      Given [precondición con "<var>"]
      When [acción con "<var>"]
      Then [resultado "<esperado>"]

      Examples:
        | var | esperado |
        | ... | ...      |

    @SC-04 @US-xxx
    Scenario: [entrada inválida]
      Given [precondición]
      When [acción con datos inválidos]
      Then [código de error / excepción esperada]
      And [ausencia de efectos secundarios no deseados]
```

> **Prácticas (Thoughtworks, QAPractices, Dojo Consortium):** un comportamiento por escenario; pasos declarativos no acoplados a UI; aserciones observables y medibles; Background para precondiciones compartidas; Scenario Outline con ≥3 variaciones; etiquetar escenarios para CI; escribir los criterios **antes** del desarrollo (Three Amigos).

---

## Checklist de cobertura

| Caso                       | Cubierto | Escenario |
| -------------------------- | -------- | --------- |
| Camino feliz               | [ ]      | SC-01     |
| Camino alternativo         | [ ]      | SC-02     |
| Entrada inválida           | [ ]      | SC-04     |
| Entrada vacía              | [ ]      |           |
| Valores límite             | [ ]      |           |
| Cambio de estado posterior | [ ]      |           |

> Cobertura recomendada: 3-7 escenarios por historia. Más de 10 indica épica disfrazada (QAPractices).

---

## Definition of Done (calidad del incremento)

- [ ] Código escrito, revisado (PR) y mergeado a main
- [ ] Lint/format y estándares de código cumplidos
- [ ] Tests unitarios/integración añadidos y pasando
- [ ] Escenarios Gherkin (AC) automatizados y pasando en CI
- [ ] Cobertura mínima acordada alcanzada
- [ ] Documentación actualizada (README/API/ADR)
- [ ] Pipeline CI verde (lint, test, build, security scan)
- [ ] Desplegado en staging y smoke test OK
- [ ] Aceptado por PO (demo/revisión)
- [ ] Sin regresiones en suite existente

> **Nota (Scrum Alliance, Mountain Goat Software):** el DoD describe la **calidad del incremento**, no la funcionalidad. Es ortogonal a los criterios de aceptación. Mantener a 8-12 items; si no se cumplen, recortar.

---

## Trazabilidad

| Escenario | Historia | Regla  | Test automatizado             | Último resultado      |
| --------- | -------- | ------ | ----------------------------- | --------------------- |
| SC-01     | US-xxx   | RN-xxx | `features/.../xxx.feature:10` | Pass / Fail / Not run |

---

## Exit criteria (criterio de salida de Especificación)

- [ ] Historia en formato "Como [rol], quiero [capacidad], para [beneficio]"
- [ ] Criterios de aceptación en Gherkin (Given/When/Then) acordados
- [ ] Cobertura de casos (camino feliz, alternativo, entrada inválida, límites, cambio de estado)
- [ ] DoD conocida por el equipo
- [ ] NFR anotados (seguridad, a11y, i18n, performance)
- [ ] Sign-off de stakeholders registrado (nombre + fecha)
- [ ] Dependencias identificadas
- [ ] Trazabilidad a reglas de negocio (RN-xxx) y tests
- [ ] Validada con stakeholders (sign-off con fecha)

---

## Referencias

- [1] Agile Alliance — INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable): https://agilealliance.org/glossary/invest
- [2] Bill Wake (XP123) — INVEST in Good Stories and Smart Tasks: https://xp123.com/invest-in-good-stories-and-smart-tasks
- [3] Cucumber — User Story: https://cucumber.io/docs/terms/user-story
- [4] Cucumber — Gherkin Reference (localización `# language: es`): https://cucumber.io/docs/gherkin/reference/
- [5] Atlassian — User Stories: https://www.atlassian.com/agile/project-management/user-stories
- [6] QAPractices — User Story Acceptance Criteria Template (BDD): https://qapractices.com/templates/user-story-acceptance-criteria-template-bdd/
- [7] Altexsoft — Acceptance Criteria: Purposes, Formats, Best Practices: https://www.altexsoft.com/blog/acceptance-criteria-purposes-formats-and-best-practices/
- [8] Thoughtworks — Applying BDD to Acceptance Criteria for User Stories: https://www.thoughtworks.com/insights/blog/applying-bdd-acceptance-criteria-user-stories
- [9] Dojo Consortium — Behavior-Driven Development: https://dojoconsortium.org/docs/work-decomposition/behavior-driven-development
- [10] ClearlyReqs — Acceptance Criteria Examples: https://www.clearlyreqs.com/blog/acceptance-criteria-examples
- [11] IREB CPRE RE@Agile Handbook: https://cockpit-v1.ireb.org/media/pages/downloads/cpre-re-agile-handbook/1d93310a6a-1759298583/handbook_cpre_al_re@agile_en_2.2.pdf
- [12] IREB CPRE Requirements Management Handbook: https://cockpit-v1.ireb.org/media/pages/downloads/cpre-requirements-management-handbook/72c364dea0-1733311674/ireb-cpre-handbook-for-requirements-management-en-v2.1.pdf
- [13] RE Magazine — Strengthening the Requirements Engineering Process: https://re-magazine.ireb.org/articles/strengthening-the-requirements-engineering-process
- [14] Scrum.org — What is Definition of Done: https://www.scrum.org/resources/what-definition-done
- [15] Scrum Alliance — Definition of Done: https://resources.scrumalliance.org/Article/definition-dod
- [16] Atlassian — Definition of Done: https://www.atlassian.com/agile/project-management/definition-of-done
- [17] Mountain Goat Software — Definition of Done: https://www.mountaingoatsoftware.com/agile/scrum/artifacts/definition-of-done
- [18] Tech.gov.sg — Definition of Done: https://docs.developer.tech.gov.sg/docs/software-delivery-playbook/practices/definition-of-done
- [19] markdowneditor.cc — Acceptance Criteria BDD Template: https://markdowneditor.cc/en/templates/requirements/acceptance-criteria-bdd

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
