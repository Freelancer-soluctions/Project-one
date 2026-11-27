# Definition of Ready (DoR) — Template

> **Etapa:** 3/4. Especificación / Refinement
> **Artefacto:** Definition of Ready (DoR)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Criterios que debe cumplir una historia (PBI) antes de entrar al Sprint Backlog. Es el gate de entrada al sprint, complementario al DoD (gate de salida). Es un **acuerdo**, no un stage gate rígido: no exige 100% de definición, sino "suficientemente preparado para planificar".
>
> **No confundir con:** DoD (Definition of Done — calidad del incremento, gate de salida), Acceptance Criteria (criterios de aceptación de la historia, no del equipo), Sprint Planning (ceremonia donde se verifica el DoR).
>
> **Fuentes:** Scrum.org (Walking Through DoR) [1], Atlassian (DoR) [2], PMI Disciplined Agile (DoR) [3], van Riesen et al. (ceur-ws.org) [4], Scrum.org (What is DoD) [5], Scrum Alliance (DoD) [6], Atlassian (DoD) [7], Mountain Goat Software (DoD) [8], Tech.gov.sg (DoD) [9], Agile Alliance (INVEST) [10], Bill Wake (XP123) [11].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia este template y renómbralo: `DoR-<equipo>.md` (ej. `DoR-equipo-backend.md`).
> 2. Adapta el checklist al nivel de adopción (Nivel 1: solo INVEST + AC en Gherkin + estimación; Nivel 2/3: checklist completo).
> 3. Acuerda el DoR con el equipo en una retrospectiva o sprint planning.
> 4. Revisa y adapta en cada retrospectiva — retira criterios que no aportan.
> 5. Persiste en `/docs/` o en el wiki del equipo. Referéncialo desde el change OpenSpec (`proposal.md` → "Stakeholders / validación").
>
> ---

## Control

| Campo                 | Valor                                                      |
| --------------------- | ---------------------------------------------------------- |
| **Nombre del DoR**    | DoR [equipo]                                               |
| **Nivel**             | Equipo / Programa                                          |
| **Acuerdo entre**     | PO, SM, Equipo de desarrollo                               |
| **Fecha**             | YYYY-MM-DD                                                 |
| **Revisión**          | Trimestral / en retro                                      |
| **Nivel de adopción** | Nivel 1 (mínimo) / Nivel 2 (maduro) / Nivel 3 (enterprise) |

---

## Propósito

Establecer cuándo un Product Backlog Item (historia) está **suficientemente preparado** para entrar al Sprint Backlog, reduciendo riesgo en Sprint Planning. No es un stage gate rígido: no exige 100% de definición.

---

## Checklist INVEST (preparación del PBI)

- [ ] **I — Independiente:** sin dependencias no controladas; puede implementarse y desplegarse solo.
- [ ] **N — Negociable:** describe la esencia, no la solución; deja espacio a la conversación.
- [ ] **V — Valioso:** valor de negocio/usuario claro y priorizado.
- [ ] **E — Estimable:** el equipo puede estimar con la información disponible.
- [ ] **S — Pequeño:** implementable en ≤ 3 días-persona (o dividido).
- [ ] **T — Testable:** criterios de aceptación definidos y verificables.

---

## Criterios adicionales

- [ ] Historia en formato "Como [rol], quiero [capacidad], para [beneficio]"
- [ ] Criterios de aceptación en Gherkin (Given/When/Then) acordados
- [ ] Valor de negocio explícito y prioridad asignada
- [ ] Estimación relativa (story points) realizada por el equipo
- [ ] Sin dependencias externas bloqueantes (o plan de mitigación)
- [ ] Diseño/UX y mockups disponibles (si aplica)
- [ ] Datos de prueba identificados (o fixtures/mocks)
- [ ] Consideraciones no funcionales (performance, seguridad, accesibilidad) anotadas
- [ ] DoD del equipo conocida y aplicable a la historia
- [ ] Preguntas abiertas resueltas o registradas como spike

---

## Reglas de uso

- El DoR es un **acuerdo**, no un stage gate rígido.
- No exige 100% de definición: "suficientemente preparado para planificar".
- **Ownership compartido:** PO articula valor, SM facilita, equipo valida preparación.
- Excepciones se discuten en Sprint Planning y se registran.
- Revisar y adaptar en retrospectivas; retirar criterios que no aportan.
- **Para equipo pequeño / solo dev:** el DoR puede reducirse a INVEST + AC en Gherkin + estimación.

---

## Proceso cuando no se cumple

1. Volver a backlog refinement.
2. Crear spike/timebox para resolver incógnitas.
3. Dividir la historia si es demasiado grande.
4. Documentar la excepción acordada.

---

## DoR reducido (Nivel 1 — startup/solo dev)

Para un cambio de bajo riesgo, lo mínimo es:

- [ ] Problema y valor claros (Feature Brief o PRD referenciado)
- [ ] Criterios de aceptación verificables (GIVEN/WHEN/THEN)
- [ ] Dependencias identificadas y disponibles
- [ ] Estimación acordada (≤ 5 días-persona; si no, descomponer)
- [ ] DoD conocida por el equipo
- [ ] Spike/RFC/ADR resueltos para incertidumbres técnicas

---

## Exit criteria (criterio de salida de Refinement)

- [ ] DoR verificada (checklist completo o reducido según nivel)
- [ ] Historia estimada (story points)
- [ ] Prioridad asignada (MoSCoW/RICE/WSJF)
- [ ] Dependencias identificadas y disponibles
- [ ] Spikes resueltos o registrados
- [ ] Baseline de requisitos congelada (si aplica)
- [ ] Equipo entiende la historia y sabe por dónde empezar

---

## Referencias

- [1] Scrum.org — Walking Through Definition of Ready: https://www.scrum.org/resources/blog/walking-through-definition-ready
- [2] Atlassian — Definition of Ready: https://www.atlassian.com/agile/project-management/definition-of-ready
- [3] PMI — Disciplined Agile: Definition of Ready: https://www.pmi.org/disciplined-agile/team-lead/practice-definition-of-ready
- [4] van Riesen et al. — Definition of Ready (ceur-ws.org): https://ceur-ws.org/Vol-3672/AgileRE-paper1.pdf
- [5] Scrum.org — What is Definition of Done: https://www.scrum.org/resources/what-definition-done
- [6] Scrum Alliance — Definition of Done: https://resources.scrumalliance.org/Article/definition-dod
- [7] Atlassian — Definition of Done: https://www.atlassian.com/agile/project-management/definition-of-done
- [8] Mountain Goat Software — Definition of Done: https://www.mountaingoatsoftware.com/agile/scrum/artifacts/definition-of-done
- [9] Tech.gov.sg — Definition of Done: https://docs.developer.tech.gov.sg/docs/software-delivery-playbook/practices/definition-of-done
- [10] Agile Alliance — INVEST: https://agilealliance.org/glossary/invest
- [11] Bill Wake (XP123) — INVEST in Good Stories and Smart Tasks: https://xp123.com/invest-in-good-stories-and-smart-tasks

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
