---
name: re-design
description: >
  Design stage of requirements engineering. Produces ADR (Architecture Decision
  Record), API design, rollback plan, and conditionally RFC, data dictionary,
  C4 diagrams, BPMN to-be. Creates ADR before OpenSpec change. Use when there
  are refined specs but no technical design, or when the user says "design",
  "diseño", "ADR", "arquitectura", "API design", "rollback", "RFC", "C4".
---

# RE Stage 5: Design (Técnico)

## When to Use

- Refined specifications exist (DoR verificada, priorización) but no technical design.
- User wants to create an ADR, design an API, or plan a rollback.
- User says "design", "diseño", "ADR", "arquitectura", "API design", "rollback", "RFC", "C4", "diseño técnico".

## Input Required

Ask the user for (or infer from context):

1. **Módulo** — ¿A qué módulo pertenece?
2. **Feature (nombre/slug)** — ¿Cómo se llama la feature?
3. **User Story BDD** — leer `docs/requirements/<modulo>/<feature>/user-story-bdd.md`.
4. **DoR** — leer `docs/requirements/<modulo>/<feature>/definition-of-ready.md`.
5. **RTM** — leer `docs/requirements/<modulo>/<feature>/traceability-matrix.md`.
6. **NFR** (si existe) — leer `docs/requirements/<modulo>/<feature>/nfr.md`.
7. **Threat model** (si existe) — leer `docs/requirements/<modulo>/<feature>/threat-model.md`.
8. **Decisión arquitectural** — ¿Hay una decisión técnica no obvia que tomar?
9. **API afectada** — ¿El change modifica o crea endpoints?
10. **BD afectada** — ¿Hay migración de datos?
11. **Nivel de adopción** — 1, 2 o 3 (default: 1).

## Artifacts to Generate

### Core (siempre)

| Artefacto     | Template                    | Output                                                      |
| ------------- | --------------------------- | ----------------------------------------------------------- |
| ADR           | `adr/TEMPLATE.md`           | `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md` |
| API Design    | `api-design/TEMPLATE.md`    | `docs/requirements/<modulo>/<feature>/api-design.md`        |
| Rollback Plan | `rollback-plan/TEMPLATE.md` | `docs/requirements/<modulo>/<feature>/rollback-plan.md`     |

**Nota sobre ADR:** Solo crear si hay decisión arquitectural no obvia. Si no hay decisión arquitectural, saltar al handoff (no crear ADR vacío).

### Condicionales (según disparadores)

| Artefacto       | Disparador                                      | Output                                                    |
| --------------- | ----------------------------------------------- | --------------------------------------------------------- |
| RFC             | Decisión afecta a varios equipos/módulos        | `docs/requirements/<modulo>/<feature>/rfc.md`             |
| Data dictionary | Sistema intensivo en datos, BD relacional       | `docs/requirements/<modulo>/<feature>/data-dictionary.md` |
| C4 diagramas    | Múltiples equipos o módulos                     | `docs/requirements/<modulo>/<feature>/c4.md`              |
| BPMN to-be      | Proceso de negocio complejo (cambio de proceso) | `docs/requirements/<modulo>/<feature>/bpmn-to-be.md`      |

### Disparadores a evaluar

- ¿La decisión afecta a más de un equipo o módulo? → RFC
- ¿El sistema es intensivo en datos o usa BD relacional? → Data dictionary
- ¿Hay múltiples equipos o módulos involucrados? → C4
- ¿El proceso de negocio cambia (no solo se automatiza)? → BPMN to-be

## Process

1. **Leer specs y NFR/threat model** — cargar todos los archivos existentes.
2. **Evaluar si hay decisión arquitectural** — preguntar: "¿Hay una decisión técnica no obvia (elección de librería, patrón, estructura)?" Si no, saltar ADR.
3. **Crear ADR** (si aplica) — llenar `docs/requirements-engineering/adr/TEMPLATE.md` (MADR 4.0). Numerar secuencialmente (ADR-0001, ADR-0002, ...). Status: `proposed`. Persistir en `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md`.
4. **Diseñar API** (si aplica) — llenar `docs/requirements-engineering/api-design/TEMPLATE.md` con método, ruta, params, body, respuestas, errores, versionado, deprecación y escribir en `docs/requirements/<modulo>/<feature>/api-design.md`.
5. **Plan de rollback** — llenar `docs/requirements-engineering/rollback-plan/TEMPLATE.md` con código (revert PR), BD (expand/contract), feature flag, config. Probar en staging. Escribir en `docs/requirements/<modulo>/<feature>/rollback-plan.md`.
6. **Evaluar disparadores** — preguntar las 4 preguntas.
7. **Generar condicionales** — si algún disparador se activa, generar el artefacto: RFC (documento de propuesta), Data dictionary (tabla sin template), C4 (diagrama), BPMN to-be (diagrama). Escribir en `docs/requirements/<modulo>/<feature>/`.
8. **Actualizar RTM** — añadir referencias de diseño (ADR, API design, rollback).
9. **Actualizar card en Trello** — delegar a `@project-manager`: ADR/RFC referencia, plan de migración, rollback.
10. **Verificar exit criteria**.
    10b. **Revisión por par** — el ADR (si se creó) debe ser revisado por un par (Tech Lead). Documentar el reviewer y la fecha.
    10c. **Actualizar runbook** — si el rollback plan incluye procedimientos operativos, actualizar el runbook del equipo.
11. **Handoff** — si todo está completo, sugerir `@re-handoff` o `/opsx-propose-from-re <modulo> <feature>` (verifica DoR gate y mapea RE→OpenSpec). Usar `/opsx:propose` directo solo si NO existen artefactos RE.

## Output

| Archivo                 | Ubicación                                                   |
| ----------------------- | ----------------------------------------------------------- |
| ADR                     | `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md` |
| API Design              | `docs/requirements/<modulo>/<feature>/api-design.md`        |
| Rollback Plan           | `docs/requirements/<modulo>/<feature>/rollback-plan.md`     |
| RFC (cond.)             | `docs/requirements/<modulo>/<feature>/rfc.md`               |
| Data dictionary (cond.) | `docs/requirements/<modulo>/<feature>/data-dictionary.md`   |
| C4 (cond.)              | `docs/requirements/<modulo>/<feature>/c4.md`                |
| BPMN to-be (cond.)      | `docs/requirements/<modulo>/<feature>/bpmn-to-be.md`        |

## Exit Criteria (criterio de salida de Diseño)

- [ ] ADR creado (si hay decisión arquitectural) con status asignado, numerado secuencialmente
- [ ] ADR referenciado desde el change OpenSpec (design.md) — se hará en el handoff
- [ ] ADR revisado por par (Tech Lead)
- [ ] API design documentado (endpoints, método, ruta, params, body, respuestas, errores, versionado)
- [ ] Plan de rollback documentado (código, BD, flag, config) y probado en staging
- [ ] Runbook actualizado
- [ ] Artefactos condicionales generados si algún disparador se activó
- [ ] RTM actualizada con referencias de diseño
- [ ] Card en Trello actualizada con diseño y rollback
- [ ] Todo listo para handoff: `@re-handoff` o `/opsx-propose-from-re <modulo> <feature>`

## References

- Templates: `docs/requirements-engineering/adr/TEMPLATE.md`, `docs/requirements-engineering/api-design/TEMPLATE.md`, `docs/requirements-engineering/rollback-plan/TEMPLATE.md`
- Flujo operativo: `docs/requirements-engineering-flow.md` (Etapa 5 + Handoff)
- Flujo completo: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` (Etapa 5)
- Índice de templates: `docs/requirements-engineering/README.md`

## Best Practices (extracted)

- **ADR antes del change:** El ADR debe existir antes de crear el change OpenSpec. `design.md` referencia el ADR, no lo duplica.
- **ADR nunca se elimina:** Si una decisión cambia, crear nuevo ADR que supersede al anterior. El anterior se marca como `superseded by ADR-NNN`.
- **MADR 4.0:** Usar la plantilla MADR para consistencia. Status, Date, Decision Makers, Confidence son obligatorios.
- **Architect vs Typist:** El humano define la frontera (decisiones, trade-offs, contexto histórico). La IA implementa dentro de esos límites.
- **Expand/Contract para BD:** Si hay migración de datos, usar patrón expand/contract (añadir columna → migrar datos → eliminar columna antigua). Nunca breaking change directo.
- **Rollback probado:** Un plan de rollback no probado es un plan de esperanza. Probar en staging antes de producción.
- **Feature flags:** Preferir feature flags sobre rollback de código. Permite desactivar sin redeploy.
- **API versionada:** Toda API pública debe tener versión. Deprecación con header `Deprecation: @<epoch>` y `Sunset: <fecha>`.
- **C4 por audiencia:** C4 Level 1 (Context) para stakeholders, Level 2 (Container) para devs, Level 3 (Component) para el equipo que implementa. No generar todos si no se necesitan.
- **RFC para decisiones cross-equipo:** Si la decisión afecta a más de un equipo, escribir RFC antes de ADR. El RFC propone; el ADR decide.
- **Handoff limpio:** ADR + paquete de spec validada (Brief + RN-xxx + BDD + NFR + DoR) son el input de `/opsx:propose`. No crear el change sin ellos.
