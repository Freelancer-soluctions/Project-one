---
name: re-discovery
description: >
  Discovery stage of requirements engineering. Produces a Feature Brief
  (problema, impacto, medida de éxito, baseline, non-goals, riesgos
  categorizados, Go/No-Go). Creates Trello Epic. Use when starting a new
  feature, when there is no Feature Brief yet, or when the user says
  "discovery", "feature brief", "nueva feature", "empezar feature", "brief".
---

# RE Stage 1: Discovery

## When to Use

- No Feature Brief exists for the feature being discussed.
- User wants to define a new feature, problem, or opportunity.
- User says "discovery", "feature brief", "nueva feature", "brief", "problema".

## Input Required

Ask the user for (or infer from context):

1. **Módulo** — ¿A qué módulo pertenece? (ej: notifications, expenses, purchase-orders, vacation)
2. **Feature (nombre/slug)** — ¿Cómo se llama la feature? (ej: po-rejection-notification, expense-approval)
3. **Problema** — ¿Qué problema resuelve? ¿Para quién?
4. **Impacto actual** — ¿Cuánto cuesta el problema hoy? (métricas, frecuencia, dolor)
5. **Resultado esperado** — ¿Qué cambia si resolvemos esto?
6. **Medida de éxito** — ¿Cómo sabremos que funcionó? (métrica + target + plazo)
7. **Baseline** — ¿Cuál es el valor actual de la métrica? (sin baseline no hay verificación)
8. **Stakeholders** — ¿Quién está afectado? ¿Quién aprueba?
9. **Non-goals** — ¿Qué NO entra en este cambio? (explícito)
10. **Riesgos** — Técnicos, de negocio, de datos, de seguridad, de UX (categorizados)
11. **Nivel de adopción** — 1 (mínimo), 2 (equipo maduro), 3 (enterprise)

## Artifacts to Generate

### Core (siempre)

- **Feature Brief** → `docs/requirements/<modulo>/<feature>/feature-brief.md`

### Condicionales (según disparadores)

| Artefacto  | Disparador                                                | Template                                 |
| ---------- | --------------------------------------------------------- | ---------------------------------------- |
| BPMN as-is | Proceso de negocio complejo (≥3 pasos, múltiples actores) | (no template — generar diagrama Mermaid) |
| C4 Context | Múltiples equipos o módulos involucrados                  | (no template — generar diagrama)         |
| PIA/DPIA   | Procesa datos personales (GDPR/leyes locales)             | (no template — generar documento)        |

### Disparadores a evaluar (preguntar al usuario)

- ¿El proceso de negocio tiene ≥3 pasos o múltiples actores? → BPMN as-is
- ¿Involucra a más de un equipo o módulo? → C4 context
- ¿Maneja datos personales (usuarios, proveedores, empleados)? → PIA/DPIA

## Process

1. **Pedir input** — recopilar los 11 campos de Input Required.
2. **Evaluar disparadores** — preguntar las 3 preguntas de disparadores.
3. **Determinar nivel de adopción** — si el usuario no lo especifica, asumir Nivel 1.
4. **Crear directorio** — `docs/requirements/<modulo>/<feature>/` si no existe.
5. **Generar Feature Brief** — llenar `docs/requirements-engineering/discovery-feature-brief/TEMPLATE.md` con el input del usuario y escribir en `docs/requirements/<modulo>/<feature>/feature-brief.md`.
6. **Generar condicionales** — si algún disparador se activa, generar el artefacto correspondiente en el mismo directorio: BPMN as-is (diagrama Mermaid), C4 Context (diagrama), PIA/DPIA (documento). No hay templates para estos; generar según best practices.
7. **Crear Epic en Trello** — delegar a `@project-manager`: título `[Area] Nombre de la feature`, descripción con problema e impacto, label de prioridad. Estado: Backlog (sin asignar).
8. **Verificar exit criteria** — checklist completo antes de cerrar.

## Output

| Archivo            | Ubicación                                               |
| ------------------ | ------------------------------------------------------- |
| Feature Brief      | `docs/requirements/<modulo>/<feature>/feature-brief.md` |
| BPMN as-is (cond.) | `docs/requirements/<modulo>/<feature>/bpmn-as-is.md`    |
| C4 Context (cond.) | `docs/requirements/<modulo>/<feature>/c4-context.md`    |
| PIA/DPIA (cond.)   | `docs/requirements/<modulo>/<feature>/pia.md`           |

**Regla de clasificación:** Los artefactos se organizan por módulo y feature: `docs/requirements/<modulo>/<feature>/`. Un módulo puede tener varias features (ej: `notifications/` puede contener `po-rejection-notification/`, `expense-approved/`, `vacation-requested/`). Si la feature afecta a varios módulos, usar el módulo dominante o crear un topic descriptivo como módulo.

## Exit Criteria (criterio de salida de Discovery)

- [ ] Problema documentado con evidencia (no suposición)
- [ ] Impacto medido o estimado con baseline
- [ ] Resultado esperado y medida de éxito definidos (métrica + target + plazo)
- [ ] Stakeholders identificados con roles
- [ ] Non-goals explícitos (qué NO entra)
- [ ] Riesgos categorizados (técnico, negocio, datos, seguridad, UX)
- [ ] Artefactos condicionales generados si algún disparador se activó
- [ ] Epic creado en Trello con título, problema e impacto
- [ ] Go/No-Go firmado (o decisión de continuar documentada)
- [ ] Feature Brief persistido en `docs/requirements/<modulo>/<feature>/feature-brief.md`

## References

- Template: `docs/requirements-engineering/discovery-feature-brief/TEMPLATE.md`
- Flujo operativo: `docs/requirements-engineering-flow.md` (Etapa 1)
- Flujo completo: `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` (Etapa 1)
- Índice de templates: `docs/requirements-engineering/README.md`

## Best Practices (extracted)

- **Problem-first:** Siempre empezar por el problema, no por la solución. Si no puedes articular el problema en 2-3 oraciones, no estás listo para especificar.
- **Baseline obligatorio:** Sin baseline de métricas, no hay verificación posterior. Si no tienes datos, estima con rango y marca como "estimado".
- **Non-goals explícitos:** Lo que NO entra es tan importante como lo que entra. Previene scope creep.
- **Riesgos categorizados:** No basta con listar riesgos; categorízalos (técnico, negocio, datos, seguridad, UX) para asignar responsables.
- **Go/No-Go:** La decisión de continuar debe ser explícita y documentada, no implícita.
- **Tamaño del brief:** 1-3 páginas. Si excede, estás especificando, no descubriendo.
- **Epic temprano:** Crear el Epic en Trello en Discovery (no esperar a tener AC) para visibilidad del trabajo en progreso.
