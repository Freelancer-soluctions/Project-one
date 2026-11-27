# Framework operativo para Project One

> **Propósito:** definir el flujo de ingeniería de requisitos para Project One, especificando en qué etapa entra OpenSpec y cuándo se crean los tickets en Trello. Este documento es la referencia operativa del día a día; el "qué y por qué" de cada etapa, con nivel de detalle enterprise, vive en `docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md`.

## Flujo propuesto: manual → ADR → OpenSpec change

| #         | Etapa               | Quién / Cómo                                       | Skill de automatización                | Artefactos                                                                                                                                       | OpenSpec involucrado         |
| --------- | ------------------- | -------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1         | Discovery           | Manual (solo, modo stakeholder)                    | `re-discovery`                         | Feature Brief (problema, impacto, medida de éxito, baseline)                                                                                     | No                           |
| 2         | Elicitación         | Manual (solo, modo analista)                       | `re-elicitation`                       | Notas por rol, hallazgos, reglas de negocio RN-xxx, conflictos resueltos, NFR derivados                                                          | No                           |
| 3         | Especificación      | Manual (solo, modo analista)                       | `re-specification`                     | Reglas de negocio formales, historia de usuario BDD (GIVEN/WHEN/THEN), DoD, DoR, NFR, threat model, RTM seed                                     | No                           |
| 4         | Refinement          | Manual (solo, modo equipo)                         | `re-refinement`                        | Priorización, estimación, spikes, dependencias, baseline de requisitos                                                                           | No                           |
| 5         | Diseño técnico      | Manual (solo, modo tech lead)                      | `re-design`                            | **ADR** (decisión arquitectural), RFC si aplica, C4, diseño API, plan de migración expand/contract, rollback, perf/FinOps, threat model revisado | No (todavía)                 |
| → Handoff | Handoff             | Manual → OpenSpec (ADR + paquete de spec validada) | `re-handoff` + `/opsx-propose-from-re` | ADR en `docs/requirements/<modulo>/<feature>/` + paquete de spec validada                                                                        | Se crea el change            |
| 6a        | Creación del change | OpenSpec                                           | `/opsx:propose`                        | `/opsx:propose <change>` → `proposal.md` + delta specs + `design.md` (referencia el ADR) + `tasks.md`                                            | **Sí — aquí entra OpenSpec** |
| 6b        | Build               | OpenSpec                                           | `/opsx:apply`                          | `/opsx:apply` → código, tests, CI verde, code review                                                                                             | Sí                           |
| 7         | Entrega             | OpenSpec + manual                                  | `/opsx:verify`, `/opsx:archive`        | `/opsx:verify` → `/opsx:archive`, RTM actualizada, deploy, monitoreo, DORA                                                                       | Sí (cierre)                  |

> **Skills de automatización:** Las etapas 1-5 tienen skills dedicadas (`re-discovery`, `re-elicitation`, `re-specification`, `re-refinement`, `re-design`) que guían el flujo conversacional, evalúan condicionales, generan los artefactos y verifican los exit criteria. El entry point `requirements-engineering` rutea a la etapa correcta. Ver `AGENTS.md` (sección Requirements Engineering Skills) y `.opencode/skills/`.

## Por qué funciona este orden

1. **El ADR existe antes del change** → `design.md` puede referenciarlo sin dependencia circular.
2. **La especificación (RN-xxx, BDD, NFR) ya está hecha a mano** → al crear el change con `/opsx:propose`, el proposal y los delta specs se llenan con contenido ya validado, no se inventa sobre la marcha.
3. **OpenSpec entra solo cuando hay certeza** → no se crean changes prematuros con scope ambiguo.
4. **El handoff es limpio:** el ADR (en `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md`) + el paquete de spec validada (Feature Brief + RN-xxx + BDD + NFR + DoR) son el input de `/opsx:propose` (vía `@re-handoff` o `/opsx-propose-from-re`).

## Qué queda manual vs. OpenSpec

| Manual (siempre)                                    | OpenSpec (desde la creación del change)                  |
| --------------------------------------------------- | -------------------------------------------------------- |
| Feature Brief, stakeholder register, baseline       | `proposal.md` (sintetiza el Brief + RN-xxx)              |
| Notas de elicitación, hallazgos, BPMN, domain model | Delta specs (traduce RN-xxx + BDD a formato OpenSpec)    |
| Reglas de negocio RN-xxx                            | `design.md` (referencia ADR, migra a formato del change) |
| Historia de usuario BDD + DoD                       | `tasks.md` (descompone en tasks atómicas)                |
| NFR, threat model, compliance matrix                | Validación (`openspec validate --strict`)                |
| Priorización, estimación, spikes                    | `/opsx:apply` (ejecuta tasks)                            |
| ADR, RFC, C4, API design, expand/contract, rollback | `/opsx:verify` + `/opsx:archive` (cierra y fusiona)      |

## La única fricción

Al crear el change, debes **traducir** los artefactos manuales (Feature Brief, RN-xxx, BDD) al formato OpenSpec (proposal, delta specs). No es duplicación si lo ves como "formalización": los artefactos manuales son el borrador; los artefactos OpenSpec son la versión versionada y verificable. El DoR (Etapa 4) debe incluir: "los artefactos manuales (Brief, RN-xxx, BDD, NFR, ADR) existen y están validados antes de crear el change".

## Resumen

1. **Manual:** Discovery → Elicitación → Especificación → Refinement → Diseño (ADR creado aquí).
2. **OpenSpec:** `/opsx:propose` (formaliza) → `/opsx:apply` (construye) → `/opsx:verify` → `/opsx:archive` (cierra).

OpenSpec no entra en Discovery ni Elicitación. Entra en la **creación del change**, después del ADR, y se encarga de la formalización, ejecución y cierre. Esto es coherente con el research: OpenSpec es una herramienta de _especificación y ejecución_ de cambios, no de investigación de producto.

## OpenSpec y Trello: cómo encajan en el flujo

### OpenSpec: el motor de la especificación

OpenSpec (`openspec/`) es donde vive la **especificación formal** del sistema. Su rol en el flujo de requisitos es el de **artefacto de especificación (Etapa 3)** y **verificación (Etapa 6-7)**:

| Artefacto OpenSpec            | Etapa del flujo                              | Qué contiene                                                                                                          |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `proposal.md`                 | 3. Especificación (formalizada en el change) | Why, What Changes, Non-goals, Capabilities, Impact, Rollback, Stakeholders/validación                                 |
| `specs/<cap>/spec.md` (delta) | 3. Especificación (formalizada en el change) | ADDED/MODIFIED/REMOVED con escenarios GIVEN/WHEN/THEN; referencias a RN-xxx                                           |
| `design.md`                   | 5. Diseño (referencia el ADR)                | Contexto, decisiones (ADR/RFC), diseño API, migración expand/contract, plan rollback, NFR/perf, threat model revisado |
| `tasks.md`                    | 4. Refinement / 6. Build                     | Checklist `- [ ]` numerado, agrupado por sección, con verificación final                                              |

**Comandos del ciclo:**

- `/opsx:explore` → Discovery + Elicitación (Etapas 1-2).
- `/opsx:new` / `/opsx:propose` → Análisis y especificación (Etapa 3) + creación del change (Handoff).
- `/opsx:continue` → Refinement (tasks) y Diseño (design) (Etapas 4-5).
- `/opsx:apply` → Build y pruebas (Etapa 6).
- `/opsx:verify` → verificación contra spec (Etapas 6-7).
- `/opsx:archive` → cierre y fusión de deltas a specs base (Etapa 7).

### Trello: el backlog y el pipeline de ejecución

Trello es donde vive el **backlog y el estado de ejecución** (Etapa 4 y 6). Su rol es complementario a OpenSpec: OpenSpec es la especificación técnica; Trello es la gestión del trabajo.

**Estándar de cards (ver `docs/ci-cd/trello-workflow-guide.md`):**

- Título: `[Area] Descripción corta`.
- Descripción con: Context, Scope, Acceptance Criteria (GIVEN/WHEN/THEN), Technical Approach, Dependencies, Size, Priority.
- Estados: Sprint Backlog → In Progress → In Review → Done.
- Labels y pipeline según criticidad.

**Relación 1:1:** cada change OpenSpec tiene al menos una card Trello (o un epic con cards por task-group).

**Conexión con Trello:** La conexión con Trello se realiza vía **Composio MCP** (`https://connect.composio.dev/mcp`). El main agent **nunca llama Composio tools directo** — toda operación Trello se delega al subagente `@project-manager`, que es el único agente con permiso para usar tools de Composio. Los comandos `/trello-*` (`trello-create-card`, `trello-update-card`, `trello-delete-card`) son la interfaz preferida.

**Delegación en las skills RE:** Cada skill de RE incluye la operación Trello correspondiente como paso del proceso:

- `@re-discovery` → crea Epic (Backlog, sin asignar)
- `@re-elicitation` → actualiza Epic con hallazgos
- `@re-specification` → crea card de historia (Sprint Backlog)
- `@re-refinement` → actualiza card (estimación, prioridad, DoR)
- `@re-design` → actualiza card (ADR/RFC referencia, rollback)
- `@re-handoff` → actualiza card con referencia al change OpenSpec

**Operaciones Trello por etapa (detalle):**

| Etapa             | Operación                              | Quién ejecuta      | Estado Trello                  |
| ----------------- | -------------------------------------- | ------------------ | ------------------------------ |
| 1. Discovery      | Crear Epic                             | `@project-manager` | Backlog (sin asignar)          |
| 2. Elicitación    | Actualizar Epic con hallazgos          | `@project-manager` | Backlog                        |
| 3. Especificación | Crear card de historia por capacidad   | `@project-manager` | Sprint Backlog                 |
| 4. Refinement     | Estimar, priorizar, verificar DoR      | `@project-manager` | Sprint Backlog                 |
| 5. Diseño         | Actualizar card con diseño             | `@project-manager` | Sprint Backlog                 |
| → Handoff         | Referenciar change OpenSpec en card    | `@project-manager` | Sprint Backlog                 |
| 6. Build          | Mover a In Progress → In Review → Done | `@project-manager` | In Progress → In Review → Done |
| 7. Entrega        | Cerrar card, actualizar métricas       | `@project-manager` | Done                           |

**Comandos Trello disponibles:** `/trello-create-card`, `/trello-update-card`, `/trello-delete-card` (ver `docs/ci-cd/trello-workflow-guide.md`).

### Mapa integrado: etapa → artefacto → dónde vive → herramienta

| Etapa del flujo   | Artefacto principal                                                      | Dónde vive                                            | Herramienta / Skill             |
| ----------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------- |
| 1. Discovery      | Feature Brief                                                            | `docs/requirements/<modulo>/<feature>/`               | `re-discovery`                  |
| 2. Elicitación    | Notas por rol, hallazgos, RN-xxx                                         | `docs/requirements/<modulo>/<feature>/`               | `re-elicitation`                |
| 3. Especificación | Reglas de negocio RN-xxx, BDD, NFR, DoR, RTM                             | `docs/requirements/<modulo>/<feature>/`               | `re-specification`              |
| 4. Refinement     | Priorización, estimación, spikes, dependencias                           | `docs/requirements/<modulo>/<feature>/`               | `re-refinement`                 |
| 5. Diseño técnico | ADR, API design, rollback, RFC, C4, data dictionary                      | `docs/requirements/<modulo>/<feature>/`               | `re-design`                     |
| → Handoff         | ADR + paquete de spec validada                                           | Input de `/opsx:propose`                              | OpenSpec (creación del change)  |
| 6. Build          | OpenSpec change (proposal + deltas + design + tasks) → código, tests, CI | `openspec/changes/<name>/`                            | `/opsx:apply`                   |
| 7. Entrega        | Verify + archive + RTM + deploy + monitoreo                              | `openspec/` + `docs/requirements/<modulo>/<feature>/` | `/opsx:verify`, `/opsx:archive` |

**Estructura de directorios de artefactos:**

```
docs/requirements/<modulo>/<feature>/
├── feature-brief.md               (Discovery)
├── elicitation-interview-guide.md  (Elicitación)
├── business-rules.md              (Especificación)
├── user-story-bdd.md              (Especificación)
├── definition-of-ready.md         (Especificación)
├── traceability-matrix.md         (Especificación)
├── nfr.md                         (Especificación, condicional Nivel 2+)
├── threat-model.md                (Especificación, condicional)
├── compliance-matrix.md           (Especificación, condicional)
├── prioritization.md              (Refinement)
├── spikes.md                      (Refinement, condicional)
├── uat-plan.md                    (Refinement, condicional)
├── adr-NNNN-<titulo>.md           (Diseño)
├── api-design.md                  (Diseño)
├── rollback-plan.md               (Diseño)
├── rfc.md                         (Diseño, condicional)
├── data-dictionary.md             (Diseño, condicional)
├── c4.md                          (Diseño, condicional)
└── bpmn-to-be.md                  (Diseño, condicional)
```

> **Un módulo puede tener varias features.** Cada feature genera su propio conjunto de artefactos en `docs/requirements/<modulo>/<feature>/`. Las templates (vacías) viven en `docs/requirements-engineering/<artefacto>/TEMPLATE.md`.

### Mapa: Skill → Artefacto → Template → Condicionales

| Skill              | Artefacto                 | Template usado                            | Condicionales                                                                                                 |
| ------------------ | ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `re-discovery`     | Feature Brief             | `discovery-feature-brief/TEMPLATE.md`     | BPMN as-is (diagrama), C4 Context (diagrama), PIA (documento) — sin template, se generan según best practices |
| `re-elicitation`   | Interview Guide           | `elicitation-interview-guide/TEMPLATE.md` | Domain model (documento), BPMN (diagrama) — sin template                                                      |
| `re-specification` | Business Rules            | `business-rules/TEMPLATE.md`              | —                                                                                                             |
|                    | User Story BDD            | `user-story-bdd/TEMPLATE.md`              | —                                                                                                             |
|                    | DoR                       | `definition-of-ready/TEMPLATE.md`         | —                                                                                                             |
|                    | RTM                       | `traceability-matrix/TEMPLATE.md`         | —                                                                                                             |
|                    | NFR (cond.)               | `non-functional-requirements/TEMPLATE.md` | Generado solo si Nivel ≥2 o impacto en seguridad/performance/a11y                                             |
|                    | Threat model (cond.)      | `threat-model/TEMPLATE.md`                | Generado solo si toca auth/datos sensibles/API expuesta                                                       |
|                    | Compliance matrix (cond.) | Sin template (tabla)                      | Generado solo si dominio regulado                                                                             |
| `re-refinement`    | Prioritization            | `prioritization/TEMPLATE.md`              | Spikes (documento), UAT plan (documento) — sin template                                                       |
| `re-design`        | ADR                       | `adr/TEMPLATE.md` (MADR 4.0)              | —                                                                                                             |
|                    | API Design                | `api-design/TEMPLATE.md`                  | —                                                                                                             |
|                    | Rollback Plan             | `rollback-plan/TEMPLATE.md`               | —                                                                                                             |
|                    | RFC (cond.)               | Sin template (documento)                  | Generado solo si decisión cross-equipo                                                                        |
|                    | Data dictionary (cond.)   | Sin template (tabla)                      | Generado solo si BD relacional                                                                                |
|                    | C4 (cond.)                | Sin template (diagrama)                   | Generado solo si múltiples equipos/módulos                                                                    |
|                    | BPMN to-be (cond.)        | Sin template (diagrama)                   | Generado solo si cambio de proceso                                                                            |
| `re-handoff`       | (verificación + mapeo)    | Sin template propio                       | Invoca `/opsx:propose` con contexto RE                                                                        |

### Reglas de oro de la integración

- **OpenSpec es la fuente de verdad técnica; Trello es la fuente de verdad de ejecución.** No duplicar especificación en Trello ni estado en OpenSpec.
- **Toda investigación se persiste** en `docs/research/` y se cita en el change.
- **Toda decisión arquitectural** se registra en `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md` (generado por `re-design`) y se referencia en `design.md`. Los ADRs se numeran secuencialmente (ADR-0001, ADR-0002, ...). Un ADR nunca se elimina; si una decisión cambia, se crea un nuevo ADR que marca el anterior como `superseded by ADR-NNN`.
- **Skills de automatización:** Las etapas 1-5 se pueden automatizar con las skills `re-discovery`, `re-elicitation`, `re-specification`, `re-refinement`, `re-design` (entry point: `requirements-engineering`). Cada skill genera los artefactos en `docs/requirements/<modulo>/<feature>/`, evalúa condicionales, verifica exit criteria y actualiza Trello.
- **Toda card Trello** referencia su change OpenSpec; todo change referencia su Feature Brief/PRD.
- **La RTM** es el pegamento: vincula requisito (Feature Brief) → change (OpenSpec) → spec (delta) → task → código → prueba → evidencia.

### Reglas de oro adicionales (de las skills y templates)

- **Un artefacto existe solo si alguien lo lee y lo usa para decidir.** Si nadie lo consume, no lo produzcas. Aplica el nivel de adopción según el riesgo y la regulación del cambio, no según el tamaño del equipo.
- **Un change = una capacidad de usuario verificable.** Si no se puede escribir un escenario GIVEN/WHEN/THEN que demuestre valor al usuario, no es un change válido (es una tarea técnica o un ADR). Máximo 5 días-persona por change; si excede, descomponer.
- **No duplicar:** Los artefactos OpenSpec referencian los artefactos RE, no los duplican. El ADR se referencia (no se copia). Las RN-xxx se referencian (no se reescriben). El Feature Brief se sintetiza (no se copia verbatim).
- **Forward-only coupling (patrón Spec Kit):** Las skills RE nunca auto-invocan OpenSpec. OpenSpec nunca auto-lee artefactos RE. El usuario dispara el handoff explícitamente con `/opsx-propose-from-re` o `@re-handoff`. Discovery y delivery son procesos separados.
- **DoR gate estricto:** No crear el change si falta algún artefacto obligatorio (Feature Brief, RN-xxx, BDD, NFR, DoR, RTM, ADR si aplica, Sign-off). El costo de un change prematuro (scope ambiguo) es mayor que el costo de completar el RE.
- **NFR críticos por defecto:** Incluso en Nivel 1, incluir NFR críticos (seguridad básica, performance). No esperar a Nivel 2 para pensar en seguridad.
- **Threat model temprano:** Si toca auth o datos sensibles, el threat model debe existir antes del diseño, no después.
- **Architect vs. Typist:** El humano define la frontera (decisiones, trade-offs, contexto histórico, decisiones rechazadas). La IA implementa dentro de esos límites. El humano dibuja la frontera en texto antes de que el agente abra una sesión.
- **No crees la card hasta que tengas la historia con AC verificables.** Una card sin criterios de aceptación es solo un recordatorio, no un requisito.

### Niveles de adopción

| Nivel                 | Artefactos                                                                                                                                                                                                         | Cuándo usar                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **1 (Mínimo viable)** | Solo Core: Feature Brief, Interview Guide, Business Rules, User Story BDD, DoR, RTM, Prioritization, ADR (si hay decisión arquitectural), API Design, Rollback Plan. NFR críticos (seguridad básica, performance). | Startup, solo dev, cambio de bajo riesgo                   |
| **2 (Equipo maduro)** | Core + Condicional: NFR completo, Threat model, Compliance matrix, Spikes, UAT plan, Domain model, BPMN, RFC, Data dictionary, C4 (según disparadores)                                                             | Equipo con múltiples devs, cambio con auth/datos sensibles |
| **3 (Enterprise)**    | Todos + avanzados: ISO 25010 completo, ATAM, ICD, PIA/DPIA, compliance matrix completa, mutation testing, DAST/IAST, chaos, hypercare, DORA completo                                                               | Dominio regulado, auditorías, compliance                   |

### Cómo invocar las skills

| Sintaxis    | Tipo       | Ejemplos                                                                                                                    |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `@nombre`   | Skill      | `@re-discovery`, `@re-specification`, `@re-handoff`, `@requirements-engineering`                                            |
| `/nombre`   | Comando    | `/opsx-propose-from-re`, `/opsx:apply`, `/opsx:verify`                                                                      |
| Auto-invoke | Automático | El agente invoca la skill cuando detecta palabras clave o acciones que coinciden con la tabla de Auto-invoke en `AGENTS.md` |

**Flujo de invocación típico:**

1. `@requirements-engineering` → rutea a la etapa correcta (o `@re-discovery` directo si ya sabes)
2. Seguir el flujo: Discovery → Elicitación → Especificación → Refinement → Diseño
3. `/opsx-propose-from-re <modulo> <feature>` → handoff a OpenSpec
4. `/opsx:apply` → Build
5. `/opsx:verify` → `/opsx:archive` → Entrega

### Exit criteria por etapa

| Etapa              | Exit criteria (resumen)                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discovery**      | Problema con evidencia, métricas con baseline, alcance y non-goals, riesgos categorizados, Go/No-Go firmado, Epic en Trello                                     |
| **Elicitación**    | Notas por rol, síntesis mismo día, RN-xxx con fuente, conflictos con estado/owner, NFR derivados, Epic actualizado                                              |
| **Especificación** | RN-xxx formales, historia en Cohn, AC en Gherkin, DoD conocida, NFR anotados, DoR verificada, RTM seed, sign-off, card en Trello                                |
| **Refinement**     | Framework aplicado, historias priorizadas, estimación completada, DoR verificada, dependencias identificadas, conflictos resueltos, RTM actualizada             |
| **Diseño**         | ADR creado (si aplica) con status, API design, rollback probado en staging, condicionales generados, RTM actualizada, listo para handoff                        |
| **Handoff**        | DoR gate verificado, artefactos condicionales evaluados, resumen presentado, mapeo documentado, change creado, artefactos OpenSpec llenados, Trello actualizado |

### Ejemplo de flujo completo (solo, startup)

Feature: "Notificación por email cuando una OC es rechazada" (startup de 5 personas).

1. Día 1: escribes Feature Brief (problema: proveedores sin feedback; 3 rechazos/mes; objetivo: 100% notificados en < 1 min).
2. Día 2: lees como analista; escribes RN-NOTIF-001..003 y historia BDD (3 escenarios).
3. Día 3: escribes ADR (si hay decisión arquitectural); si no, saltas al handoff.
4. Día 3: `/opsx:propose add-po-rejection-notification` → proposal + delta spec + tasks. DoR verificada.
5. Día 3: creas card Trello `[Notifications] Notificación de rechazo de OC` con AC en BDD, tamaño S, prioridad Must Have.
6. Día 3-4: `/opsx:apply` implementa (TDD), CI verde, code review por `reviewer`.
7. Día 5: `/opsx:verify` → OK; `/opsx:archive`; actualiza RTM; cierra card Trello; deploy con flag.

## Artefactos necesarios para crear el change de OpenSpec

Para crear el change (`/opsx:propose <change-name>`), necesitas el **paquete de especificación validada** que se produce en las Etapas 1-5 (manuales). OpenSpec no descubre ni elicitá — consume lo que ya validaste.

### Artefactos obligatorios (gate: DoR)

| #   | Artefacto                           | Etapa donde se produce            | Qué debe contener                                                                                                                                                                                  |
| --- | ----------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Feature Brief**                   | 1. Discovery                      | Problema, impacto medido, resultado esperado, medida de éxito, stakeholders, baseline de métricas                                                                                                  |
| 2   | **Reglas de negocio (RN-xxx)**      | 2-3. Elicitación / Especificación | Reglas formales y verificables, con condiciones explícitas                                                                                                                                         |
| 3   | **Escenarios BDD (Gherkin)**        | 3. Especificación                 | Historia de usuario con criterios de aceptación GIVEN/WHEN/THEN (los que se traducen a delta specs)                                                                                                |
| 4   | **NFR (requisitos no funcionales)** | 3. Especificación                 | Seguridad, privacidad, a11y, i18n, performance, disponibilidad, auditabilidad — al menos los críticos                                                                                              |
| 5   | **DoR verificada**                  | 4. Refinement                     | Checklist: problema y valor claros; AC verificables; dependencias identificadas; impacto en BD/API/seguridad/a11y/i18n evaluado; estimación acordada; DoD conocida; spikes resueltos               |
| 6   | **ADR**                             | 5. Diseño técnico                 | Decisión arquitectural (contexto, opciones, decisión, consecuencias) en `docs/requirements/<modulo>/<feature>/adr-NNNN-<titulo>.md` — **debe existir antes del change** (generado por `re-design`) |
| 7   | **Sign-off de stakeholders**        | 3. Especificación                 | Validación con fecha de quién aprobó los requisitos                                                                                                                                                |

### Artefactos condicionales (según criticidad/regulación)

| Artefacto                   | Cuándo se necesita                               |
| --------------------------- | ------------------------------------------------ |
| **Threat model (STRIDE)**   | Si toca auth, datos sensibles, API expuesta      |
| **PIA/DPIA**                | Si procesa datos personales (GDPR/leyes locales) |
| **Compliance matrix**       | Si hay regulación (DIAN, SOX, WCAG)              |
| **UAT plan**                | Si el cliente debe aceptar formalmente           |
| **BPMN as-is/to-be**        | Si el proceso de negocio es complejo             |
| **Domain model / glosario** | Si hay ambigüedad de términos                    |
| **Data dictionary**         | Si hay campos con dominios complejos             |
| **RFC**                     | Si la decisión afecta a varios equipos/módulos   |
| **C4 diagramas**            | Si hay múltiples equipos o módulos               |

### Qué genera OpenSpec a partir de estos (el handoff)

El handoff se automatiza con la skill `re-handoff` y el comando `/opsx-propose-from-re <modulo> <feature>`:

```bash
/opsx-propose-from-re notifications po-rejection-notification
```

Esto invoca internamente `/opsx:propose <change-name>` con el contexto de los artefactos RE. El comando:

1. Verifica que todos los artefactos obligatorios existan (DoR gate).
2. Lee y resume los artefactos RE.
3. Presenta el mapeo RE→OpenSpec al usuario.
4. Invoca `/opsx:propose <change-name>` con el contexto RE.
5. Verifica que los artefactos OpenSpec se llenaron correctamente.
6. Actualiza la card Trello con la referencia al change.

Alternativamente, si los artefactos RE no existen (Nivel 1, cambio simple), usar directamente:

```bash
/opsx:propose <change-name>
```

| Artefacto OpenSpec            | Se llena con...                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proposal.md`                 | Feature Brief (Why) + RN-xxx (What Changes) + Non-goals + Impact (riesgo, dependencias, rollback) + Stakeholders/validación con fecha de sign-off |
| `specs/<cap>/spec.md` (delta) | Escenarios BDD traducidos a ADDED/MODIFIED/REMOVED con referencias a RN-xxx                                                                       |
| `design.md`                   | Referencia el ADR (ya existente) + diseño de API, migración expand/contract, plan de rollback, NFR/perf, threat model revisado                    |
| `tasks.md`                    | Descompone la implementación en tasks atómicas (≤ 2h) con sección de verificación final                                                           |

### Regla de oro

> **Un change = una capacidad de usuario verificable.** Si no se puede escribir un escenario GIVEN/WHEN/THEN que demuestre valor al usuario, no es un change válido (es una tarea técnica o un ADR). Máximo 5 días-persona por change; si excede, descomponer.

### Resumen mínimo (Nivel 1 — startup/solo dev)

Para un cambio de bajo riesgo, lo mínimo es:

1. Feature Brief (1 página, con Non-goals)
2. Reglas de negocio (RN-xxx)
3. Historia BDD con 3-5 escenarios
4. NFR críticos (seguridad básica, performance)
5. DoR verificada (mental o checklist corto)
6. ADR (solo si hay decisión arquitectural no obvia)

Con eso ya puedes hacer `/opsx:propose <change-name>` y OpenSpec formaliza el resto.

## Cuándo crear el ticket en Trello

El ticket (card) en Trello se crea en **dos momentos distintos**, según el nivel de detalle:

### 1. Epic / Feature (Etapa 1 — Discovery)

Cuando se escribe el **Feature Brief**, se crea un **Epic** en Trello (o una card de alto nivel) que representa la feature completa. En este punto solo tiene: título, problema, impacto y medida de éxito. No tiene criterios de aceptación todavía.

- **Quién:** PO / stakeholder (o el dev en modo stakeholder).
- **Estado:** Backlog / Sprint Backlog (sin asignar).
- **Contenido mínimo:** título `[Area] Nombre de la feature`, descripción con el problema y el impacto, label de prioridad.

### 2. Card de historia (Etapa 3 — Especificación, al terminar)

Cuando la historia de usuario está escrita con criterios de aceptación BDD (GIVEN/WHEN/THEN), NFR y DoR, se crea la **card de historia** en Trello. En este punto ya tiene todo lo necesario para que alguien (o tú mismo) la pueda implementar.

- **Quién:** desarrollador / analista (o el dev en modo analista).
- **Estado:** Sprint Backlog (lista para refinement).
- **Contenido completo (según `docs/ci-cd/trello-workflow-guide.md`):**
  - Título: `[Area] Descripción corta`
  - Context, Scope, Acceptance Criteria (GIVEN/WHEN/THEN), Technical Approach, Dependencies, Size, Priority
  - Labels según criticidad

### 3. Refinement (Etapa 4)

La card ya existe. En refinement se:

- Estima (story points, Fibonacci).
- Verifica la DoR (checklist completo).
- Prioriza (MoSCoW/RICE/WSJF).
- Identifica dependencias y spikes.
- Se mueve a "Sprint Backlog" si pasa el DoR.

### 4. Build (Etapa 6)

La card se mueve a **"In Progress"** cuando se ejecuta `/opsx:apply`. Al mergear el PR, se mueve a **"In Review"** y luego a **"Done"**.

### Mapa integrado: etapa → ticket Trello

| Etapa             | Acción en Trello                              | Qué se crea/actualiza                                 |
| ----------------- | --------------------------------------------- | ----------------------------------------------------- |
| 1. Discovery      | Crear **Epic** (feature de alto nivel)        | Título, problema, impacto, medida de éxito            |
| 2. Elicitación    | Actualizar Epic con hallazgos                 | Notas de entrevista, conflictos, requisitos derivados |
| 3. Especificación | Crear **card de historia** por cada capacidad | AC en BDD, NFR, DoR, dependencias, tamaño             |
| 4. Refinement     | Estimar, priorizar, verificar DoR             | Story points, prioridad, DoR checklist, spikes        |
| 5. Diseño técnico | Actualizar card con diseño                    | ADR/RFC referencia, plan de migración, rollback       |
| → Handoff         | Referenciar change OpenSpec en la card        | `OpenSpec: openspec/changes/<name>/`                  |
| 6. Build          | Mover a "In Progress" → "In Review" → "Done"  | PR link, CI verde, code review                        |
| 7. Entrega        | Cerrar card, actualizar métricas              | Deploy, DORA, retrospectiva                           |

### Regla de oro para el solo dev

> **No crees la card hasta que tengas la historia con AC verificables.** Una card sin criterios de aceptación es solo un recordatorio, no un requisito. Si no puedes escribir GIVEN/WHEN/THEN, el requisito no está listo para entrar al backlog.

### Resumen

- **Epic:** Etapa 1 (Discovery) — representa la feature completa.
- **Card de historia:** Etapa 3 (Especificación) — cuando hay AC en BDD, NFR y DoR.
- **Refinement de la card:** Etapa 4 — estimación, priorización, DoR.
- **Ejecución:** Etapa 6 (Build) — mover a In Progress/In Review/Done.
- **Cierre:** Etapa 7 (Entrega) — actualizar métricas y cerrar.

### Referencias del framework operativo

- Contexto de la aplicación: `docs/application-context.md`
- Workflow y estándar de cards Trello: `docs/ci-cd/trello-workflow-guide.md`
- Plantilla ADR: `docs/requirements-engineering/adr/TEMPLATE.md`
- OpenSpec config: `openspec/config.yaml`
