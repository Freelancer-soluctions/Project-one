# Feature Brief — Template

> **Etapa:** 1. Discovery
> **Artefacto:** Feature Brief (PRD ligero / one-pager / pitch)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** El primer artefacto formal de Discovery. Captura el problema, el impacto, el resultado esperado, las métricas de éxito, los stakeholders, el alcance, los no-objetivos, el baseline y los riesgos en un documento corto (1-3 páginas) que permite tomar una decisión Go/No-Go antes de invertir en especificación detallada, diseño o desarrollo. No es una especificación funcional ni un backlog de historias: es un "contrato de intención" que justifica la inversión y acota el problema.
>
> **No confundir con:** PRD completo (añade requisitos funcionales/no funcionales, historias, criterios de aceptación, diseño, rollout), User Story (atómica, vive en el backlog), Opportunity Assessment (Cagan — decide si perseguir la oportunidad; el brief asume que la oportunidad ya fue elegida).
>
> **Fuentes:** Atlassian [1], Basecamp Shape Up [2], Marty Cagan/SVPG [3][7], Whimsical [4], Kevin Yien (Stripe/Square) [5], Atlassian Confluence [6].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia este template y renómbralo: `feature-brief-<slug>.md`.
> 2. Completa las secciones en orden. No saltes secciones — si una no aplica, escríbelo explícitamente ("N/A — justificación").
> 3. Mantén el documento en 1-3 páginas (o 8-10 slides si es presentación). Si excede, estás especificando, no descubriendo.
> 4. El brief sale de Discovery cuando cumple TODOS los exit criteria (sección final).
> 5. Persiste en `/docs/features/` o Notion. Referéncialo desde el change OpenSpec (`proposal.md` → "Stakeholders / validación").

---

## Metadata

| Campo                          | Valor                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------- |
| **Título**                     | <nombre del feature>                                                              |
| **Slug**                       | `<kebab-case>`                                                                    |
| **Owner**                      | <PM / responsable>                                                                |
| **Contributors**               | <diseño, eng, data>                                                               |
| **Stakeholders / Aprobadores** | <lista con rol>                                                                   |
| **Status**                     | Draft / In review / Approved / Rejected                                           |
| **Fecha**                      | YYYY-MM-DD                                                                        |
| **Última actualización**       | YYYY-MM-DD                                                                        |
| **Decisión esperada**          | Go / No-Go / Pivot el YYYY-MM-DD                                                  |
| **Nivel de adopción**          | Nivel 1 (mínimo viable) / Nivel 2 (equipo maduro) / Nivel 3 (enterprise regulado) |

---

## 1. Problema

> **Regla:** expresar como una historia única y concreta que muestra por qué el status quo no funciona. Si aparece una palabra técnica (API, tabla, endpoint, servicio), táchala — esta sesión es solo sobre el problema y el negocio [2][5].

**Historia del problema:**

> Hoy [actor] hace [workaround] porque [causa], lo que genera [costo/dolor].

**Evidencia:**

- <cita directa de usuario/cliente>
- <dato de uso: X usuarios afectados, Y eventos/mes>
- <tickets de soporte: #, enlace>
- <volumen: X OC/mes, Y días de retraso promedio>

---

## 2. Impacto y por qué ahora

- **Costo de la inacción:** <tiempo perdido, revenue perdido, churn, costo de soporte>
- **Urgencia (1-10):** <n> — <justificación>
- **Ventana de mercado / regulatoria:** <si aplica>
- **Alineación con objetivo de negocio:** <OKR o métrica de empresa>

---

## 3. Resultado esperado

> En una frase, qué cambia para el usuario y el negocio si se resuelve bien.

<resultado esperado>

---

## 4. Métricas de éxito

| Métrica        | Tipo       | Baseline | Target | Timeframe | Fuente de medición | Guardrail (no debe degradarse) |
| -------------- | ---------- | -------- | ------ | --------- | ------------------ | ------------------------------ |
| <primaria>     | Primaria   | <n>      | <n>    | <fecha>   | <fuente>           | <métrica>                      |
| <secundaria 1> | Secundaria | <n>      | <n>    | <fecha>   | <fuente>           | <métrica>                      |
| <secundaria 2> | Secundaria | <n>      | <n>    | <fecha>   | <fuente>           | <métrica>                      |

> Sin baseline no hay verificación posterior. Si la feature es de alto riesgo o impacto incierto, definir un experimento (A/B o rollout gradual) con hipótesis y criterio de éxito/fracaso medible [3][8].

---

## 5. Stakeholders y roles

| Rol                    | Persona  | Responsabilidad                           |
| ---------------------- | -------- | ----------------------------------------- |
| Owner (PM)             | <nombre> | Define problema, impacto, medida de éxito |
| Aprobador (Go/No-Go)   | <nombre> | Firma la decisión                         |
| Contribuidor (diseño)  | <nombre> | UX/UI                                     |
| Contribuidor (eng)     | <nombre> | Factibilidad técnica                      |
| Consultado (auditoría) | <nombre> | Trazabilidad/compliance                   |
| Informado              | <lista>  | Notificación                              |

---

## 6. Alcance

### In scope

- <lista concreta de lo que SÍ incluye>

### Out of scope / Non-goals

- <lista explícita de lo que NO incluye — crítico para evitar scope creep>

### Futuras posibilidades (no compromisos)

- <ideas para versiones posteriores, sin compromiso>

---

## 7. Baseline (estado actual)

- **Cómo se mide hoy:** <proceso manual, herramienta, métrica>
- **Datos actuales:** <volumen, tiempo, costo>
- **Workaround existente:** <cómo se resuelve hoy>
- **Baseline de las métricas:** <valor actual de cada métrica de la sección 4>

---

## 8. Riesgos y supuestos

### Riesgos (Cagan: Value / Usability / Feasibility / Viability)

| Riesgo   | Categoría                                   | Probabilidad    | Impacto         | Mitigación   | Owner   |
| -------- | ------------------------------------------- | --------------- | --------------- | ------------ | ------- |
| <riesgo> | Value / Usability / Feasibility / Viability | Alta/Media/Baja | Alto/Medio/Bajo | <mitigación> | <owner> |

### Supuestos a validar

- <supuesto> → <cómo se valida> → <fecha límite>

---

## 9. Alternativas consideradas

- **Hacer nada (status quo):** <por qué no basta>
- **<alternativa 1>:** <descripción> — <por qué no se eligió>
- **<alternativa 2>:** <descripción> — <por qué no se eligió>

---

## 10. Apetito (opcional, Shape Up)

- **Tiempo:** <2 semanas / 6 semanas>
- **Equipo:** <tamaño>
- **Restricción:** el appetite convierte el tiempo en restricción de diseño — si no cabe en el appetite, se reduce el scope, no se extiende el tiempo.

---

## 11. Rabbit holes (agujeros de conejo)

- <detalle técnico/producto que podría consumir tiempo desproporcionado> → <parche: cómo se evita o limita>

---

## 12. Preguntas abiertas

- <pregunta> — owner: <nombre> — fecha límite: YYYY-MM-DD

---

## 13. Decisión y próximos pasos

- **Decisión:** Go / No-Go / Pivot
- **Fecha de decisión:** YYYY-MM-DD
- **Siguiente artefacto:** <Elicitación → spec detallada / historias / prototipo>
- **Fecha de revisión:** YYYY-MM-DD

---

## Exit criteria (criterio de salida de Discovery)

El brief sale de Discovery cuando cumple TODOS:

- [ ] Problema expresado como historia única con evidencia (no lista de features)
- [ ] Métricas con baseline + target + timeframe + fuente + guardrail
- [ ] Alcance y no-objetivos explícitos y acordados
- [ ] Riesgos categorizados (Value/Usability/Feasibility/Viability) con mitigación
- [ ] Supuestos críticos listados con plan de validación
- [ ] Stakeholders identificados y Go/No-Go firmado (o fecha de decisión)
- [ ] Alternativas consideradas (incluyendo "no hacer nada")
- [ ] Preguntas abiertas acotadas y asignadas
- [ ] Documento ≤ 2-3 páginas (o deck de 8-10 slides) y leído por todos los stakeholders

---

## Referencias

- [1] Atlassian — "What Is a Product Brief? How to Write One & Example": https://atlassian.com/agile/product-management/product-brief
- [2] Basecamp — Shape Up, "Write the Pitch" (Problem, Appetite, Solution, Rabbit holes, No-gos): https://basecamp.com/shapeup/1.5-chapter-06
- [3] Marty Cagan / SVPG — "Assessing Product Opportunities" (10 preguntas, 4 riesgos): https://svpg.com/assessing-product-opportunities/
- [4] Whimsical — Product Brief Template (deck con Background, Problem, Impact, Solution, Key Features, No-gos, Launch Plan & exit criteria): https://www.whimsical.com/templates/product-brief-template
- [5] Kevin Yien (Stripe/Square) PRD — Customer Problem, impact, evidencia: https://deepwind.ai/templates/product-requirements-document/kevin-yien-stripe-square
- [6] Atlassian Confluence — Free PRD Template: https://atlassian.com/software/confluence/templates/product-requirements-document
- [7] Marty Cagan discovery techniques (BuildBetter): https://blog.buildbetter.ai/marty-cagan-product-discovery-techniques-ai
- [8] Agentic Agile-V (arxiv) — feature brief: goal, non-goals, acceptance criteria: https://arxiv.org/html/2605.20456v1

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
