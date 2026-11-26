# Priorización de Requisitos — Template

> **Etapa:** 4. Refinement
> **Artefacto:** Priorización (MoSCoW / RICE / WSJF / Kano)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Artefacto que ordena los requisitos por importancia relativa para decidir qué entra al sprint/release y en qué orden. No existe una técnica única; la elección depende de datos disponibles, stakeholders y tipo de decisión (alcance vs ranking vs secuenciación vs percepción). La priorización es continua (BABOK: Continual Prioritization) y debe re-evaluarse al cambiar contexto.
>
> **No confundir con:** estimación (esfuerzo, no importancia), roadmap (plan de entrega, no priorización), backlog (lista de trabajo, no ordenamiento).
>
> **Fuentes:** Agile Business Consortium (MoSCoW) [1], Intercom (RICE) [2], SAFe (WSJF) [3], Kano Model [4], BABOK v3 §5.3 [5], IREB CPRE (prioritization) [6], Richard Lawrence (story splitting) [7], Atlassian (prioritization frameworks) [8], Product Map Blog (MoSCoW, RICE, Kano, WSJF) [9].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia y renombra: `prioritization-<proyecto>-<fecha>.md`.
> 2. Define el **basis acordado** (qué criterios se usan) con los stakeholders antes de priorizar.
> 3. Elige la técnica según el contexto (ver tabla de decisión en sección F).
> 4. Prioriza de forma relativa (no absoluta) — BABOK.
> 5. Distingue "valor" de "secuencia de implementación".
> 6. Persiste en `/docs/` o en el wiki del equipo. Referéncialo desde el change OpenSpec y la Trello card.
>
> ---

## A. Basis acordado (acordar con stakeholders antes de priorizar)

| Criterio                              | Descripción   | Fuente de datos |
| ------------------------------------- | ------------- | --------------- |
| Benefit (valor de negocio)            | <descripción> | <fuente>        |
| Penalty (costo de no hacerlo)         | <descripción> | <fuente>        |
| Cost (esfuerzo de implementación)     | <descripción> | <fuente>        |
| Risk (riesgo técnico/regulatorio)     | <descripción> | <fuente>        |
| Dependencies (dependencias)           | <descripción> | <fuente>        |
| Time Sensitivity (ventana de tiempo)  | <descripción> | <fuente>        |
| Stability (estabilidad del requisito) | <descripción> | <fuente>        |
| Regulatory/Policy Compliance          | <descripción> | <fuente>        |

**Decisor:** <nombre/rol> | **Fecha:** YYYY-MM-DD | **Revisión:** cada sprint / al cambiar contexto

> **Nota BABOK:** con alto riesgo técnico, priorizar el requisito más difícil para minimizar rework antes de descubrir inviabilidad. Los conflictos entre stakeholders son normales; negociar. La base se acuerda entre stakeholders (cap. 3, Business Analysis Planning).

---

## B. MoSCoW — Alcance del release/MVP

> **Uso:** definir el alcance de un timebox (sprint/release). Clasifica por necesidad, no por ranking.

| Req ID  | Requisito   | Categoría (Must/Should/Could/Won't) | Justificación                                       | Owner |
| ------- | ----------- | ----------------------------------- | --------------------------------------------------- | ----- |
| REQ-001 | <requisito> | Must Have                           | <por qué es core del MVP>                           | @dev  |
| REQ-002 | <requisito> | Should Have                         | <importante pero viable sin él>                     | @dev  |
| REQ-003 | <requisito> | Could Have                          | <deseable, impacto bajo si se omite>                | @dev  |
| REQ-004 | <requisito> | Won't Have (this time)              | <fuera de este delivery, no rechazado para siempre> | @dev  |

**Reglas:**

- Disciplina en "Must Have": si todo es Must, la técnica deja de funcionar.
- Won't Have ≠ rechazado para siempre; solo "no en este delivery".
- MoSCoW es ordenamiento por cubetas, no ranking.

---

## C. RICE — Scoring comparativo

> **Uso:** comparar muchos candidatos con datos disponibles. Fórmula: `(Reach × Impact × Confidence) / Effort`.

| Req ID  | Requisito   | Reach (usuarios/periodo) | Impact (0.25-3) | Confidence (%) | Effort (person-months) | RICE Score  | Prioridad |
| ------- | ----------- | ------------------------ | --------------- | -------------- | ---------------------- | ----------- | --------- |
| REQ-001 | <requisito> | <n>                      | <n>             | <n>%           | <n>                    | <calculado> | 1         |
| REQ-002 | <requisito> | <n>                      | <n>             | <n>%           | <n>                    | <calculado> | 2         |

**Reglas:**

- Presentar como comparación estructurada, no como verdad objetiva.
- Intercom: < 50% confianza → tratar como moonshot (no comparar directamente).
- Impact: 0.25 = mínimo, 0.5 = bajo, 1 = medio, 2 = alto, 3 = masivo.

---

## D. WSJF — Secuenciación por economía de colas

> **Uso:** secuenciar por coste de delay. Fórmula: `WSJF = Cost of Delay / Job Size`, donde CoD = User/Business Value + Time Criticality + Risk Reduction/Opportunity Enablement.

| Req ID  | Requisito   | User/Business Value (1,2,3,5,8,13,20) | Time Criticality (1,2,3,5,8,13,20) | Risk Reduction/Opportunity (1,2,3,5,8,13,20) | CoD    | Job Size (1,2,3,5,8,13,20) | WSJF       | Orden |
| ------- | ----------- | ------------------------------------- | ---------------------------------- | -------------------------------------------- | ------ | -------------------------- | ---------- | ----- |
| REQ-001 | <requisito> | <n>                                   | <n>                                | <n>                                          | <suma> | <n>                        | <CoD/Size> | 1     |
| REQ-002 | <requisito> | <n>                                   | <n>                                | <n>                                          | <suma> | <n>                        | <CoD/Size> | 2     |

**Reglas:**

- Escala Fibonacci modificada (1,2,3,5,8,13,20) por comparación relativa contra un item de referencia.
- CoD = suma de los 3 componentes.
- WSJF = CoD / Job Size. Mayor WSJF = mayor prioridad.

---

## E. Kano — Percepción del cliente

> **Uso:** entender cómo los requisitos afectan la satisfacción del cliente. Requiere investigación con usuarios (preguntas funcionales/disfuncionales).

| Req ID  | Requisito   | Categoría Kano              | Evidencia   | Acción                                        |
| ------- | ----------- | --------------------------- | ----------- | --------------------------------------------- |
| REQ-001 | <requisito> | Must-be (básico)            | <evidencia> | Implementar (ausencia → insatisfacción)       |
| REQ-002 | <requisito> | One-dimensional (desempeño) | <evidencia> | Implementar (satisfacción escala linealmente) |
| REQ-003 | <requisito> | Attractive (delighter)      | <evidencia> | Considerar para diferenciación                |
| REQ-004 | <requisito> | Indifferent                 | <evidencia> | Omitir (no cambia satisfacción)               |
| REQ-005 | <requisito> | Reverse                     | <evidencia> | Evitar (insatisface a un segmento)            |

**Categorías:**

- **Must-be (básico):** ausencia → insatisfacción fuerte; presencia apenas se nota.
- **Performance (one-dimensional):** satisfacción escala linealmente con el nivel de cumplimiento.
- **Excitement (delighter):** ausencia no molesta; presencia → deleite desproporcionado.
- **Indifferent:** presencia/ausencia casi no cambia satisfacción.
- **Reverse:** presencia insatisface a un segmento.

---

## F. Tabla de decisión: qué técnica usar

| Situación                                        | Técnica recomendada                           | Por qué                                     |
| ------------------------------------------------ | --------------------------------------------- | ------------------------------------------- |
| Definir alcance de sprint/release (timebox fijo) | MoSCoW                                        | Clasifica por necesidad, fácil de comunicar |
| Comparar muchos candidatos con datos             | RICE                                          | Score cuantitativo comparativo              |
| Secuenciar por coste de delay                    | WSJF                                          | Optimiza flujo de valor                     |
| Entender satisfacción del usuario                | Kano                                          | Requiere investigación con usuarios         |
| Muchos stakeholders, priorización compleja       | AHP (comparación pareada 1-9)                 | Riguroso pero costoso                       |
| Priorización rápida con grupo                    | Método de los 100 dólares (cumulative voting) | Simple, participativo                       |

---

## G. Tabla de decisión por contexto

| Contexto                              | Técnica                           | Justificación                            |
| ------------------------------------- | --------------------------------- | ---------------------------------------- |
| Startup / solo dev, bajo riesgo       | MoSCoW + RICE simplificado        | Rápido, sin datos complejos              |
| Equipo maduro, producto en producción | MoSCoW + RICE + WSJF              | Datos disponibles, secuenciación por CoD |
| Enterprise regulado                   | MoSCoW + RICE + WSJF + Kano + AHP | Múltiples stakeholders, compliance       |

---

## G. Conflictos de priorización

| #   | Conflicto     | Partes involucradas | Análisis   | Técnica de resolución                                                                              | Decisión   | Fecha      | Responsable | Estado               |
| --- | ------------- | ------------------- | ---------- | -------------------------------------------------------------------------------------------------- | ---------- | ---------- | ----------- | -------------------- |
| 1   | <descripción> | <partes>            | <análisis> | Acuerdo / Compromiso / Votación / Imposición / Variantes / Consider-all-facts / Matriz de decisión | <decisión> | YYYY-MM-DD | <nombre>    | Resuelto / Pendiente |

### Conflictos no resueltos → follow-up

- <conflicto pendiente> — owner: <nombre> — fecha límite: YYYY-MM-DD

---

## Exit criteria (criterio de salida de Refinement)

- [ ] Basis acordado (criterios de priorización) documentado y aprobado por stakeholders
- [ ] Priorización completada (MoSCoW para alcance + RICE/WSJF para ranking/secuenciación)
- [ ] Cada requisito tiene categoría (Must/Should/Could/Won't) o score
- [ ] Conflictos de priorización resueltos y documentados
- [ ] Priorización revisada con el equipo y stakeholders
- [ ] Priorización actualizada en el backlog (Trello/Jira)

---

## Referencias

- [1] Agile Business Consortium — MoSCoW Prioritisation: https://www.agilebusiness.org/dsdm-project-framework/prioritisation-moscow
- [2] Intercom — RICE: Simple prioritization for product managers: https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
- [3] SAFe — Weighted Shortest Job First (WSJF): https://scaledagileframework.com/wsjf/
- [4] Kano Model — Wikipedia: https://en.wikipedia.org/wiki/Kano_model
- [5] BABOK Guide v3 — Prioritization (§5.3): https://www.business-analysis-excellence.com/wp-content/uploads/2019/08/BABOK_Guide_v3-1.pdf
- [6] IREB CPRE — Requirements Management Handbook (prioritization ad-hoc vs sistemática): https://cockpit-v1.ireb.org/media/pages/downloads/cpre-requirements-management-handbook/72c364dea0-1733311674/ireb-cpre-handbook-for-requirements-management-en-v2.1.pdf
- [7] Richard Lawrence — The Humanizing Work Guide to Splitting User Stories: https://richardlawrence.info/splitting-user-stories
- [8] Atlassian — Prioritization frameworks: https://www.atlassian.com/agile/project-management/prioritization-methods
- [9] Product Map Blog — MoSCoW, RICE, Kano, WSJF compared: https://www.productmap.io/blog/product-prioritization-frameworks
- [10] Saaty, T.L. — Analytic Hierarchy Process (AHP): https://en.wikipedia.org/wiki/Analytic_hierarchy_process
- [11] Leffingwell & Widrig — _Managing Software Requirements_ (cumulative voting / 100-dollar method)

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
