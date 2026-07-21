# Trello Card Standards

> Formato enterprise para cards de Trello en Project One.
> Basado en estándares de Google, Microsoft, Meta y Amazon.

---

## 1. Title Format

```
[Area] Action-verb + short description
```

| Área | Cuándo usarlo |
|------|---------------|
| `Backend` | API, servicios, middleware, Prisma, DAO |
| `Frontend` | Componentes React, hooks, páginas, UI |
| `DB` | Migraciones, esquemas, seeds, índices |
| `Infra` | Docker, Redis, SSE, BullMQ, despliegue |

**Ejemplos:**
- `[Backend/DB] Add soft delete for events`
- `[Frontend] Add EventCalendar widget to dashboard`
- `[Infra/Backend] Implement SSE notification bus`

---

## 2. Description Template

Estructura obligatoria del campo `desc`:

```markdown
## Context
Why now? What problem does it solve?
[1-2 párrafos]

## Scope
**Included:**
- [deliverables clave]

**Out of Scope:**
- [lo que NO cubre esta card]

## Acceptance Criteria
- [ ] GIVEN [context] WHEN [action] THEN [result]
- [ ] GIVEN [context] WHEN [action] THEN [result]
- [ ] Edge case: [description]

## Technical Approach
- Key decisions, libraries, architecture
- Reference: openspec/changes/<name>/

## Dependencies
- Blocked by: [card names]
- Blocks: [card names]

## Size
**XS** (< 1d) | **S** (1-2d) | **M** (2-3d) | **L** (3-5d) | **XL** (5-8d)

## Priority
**P1** — Must have, bloquea otras features
**P2** — Should have, importante
**P3** — Nice to have
```

---

## 3. Acceptance Criteria Rules

- Usar **GIVEN/WHEN/THEN** para criterios funcionales
- Cubrir **happy path + edge cases + error**
- Incluir **tests + migración** como criterios explícitos
- Preferir verificables sobre subjetivos

**Bien:**
```
- [ ] GIVEN soft-deleted event WHEN GET /events THEN excluded from results
- [ ] GIVEN invalid date range (start > end) WHEN submitting THEN 400 error
```

**Mal:**
```
- [ ] The feature should work correctly
- [ ] Proper error handling
```

---

## 4. Labels

Cada card lleva al menos 1 label de área.

| Color | Label | Propósito |
|-------|-------|-----------|
| 🔵 Blue | `Backend` | API, servicios, lógica servidor |
| 🟢 Green | `Frontend` | React, componentes, UI |
| 🟠 Orange | `DB` | Prisma, migraciones, esquemas |
| ⚫ Gray | `Infra` | Docker, Redis, BullMQ, SSE |
| 🔴 Red | `Blocked` | Card esperando dependencia |

---

## 5. Pipeline

| Lista | Propósito |
|-------|-----------|
| **Sprint Backlog** | Cards comprometidas para el sprint |
| **In Progress** | Desarrollo activo (máx 2 cards) |
| **In Review** | PR abierto, code review, QA |
| **Done** | Mergeado y desplegado |

---

## 6. Dependencies

En el campo `desc`, sección **Dependencies**:

```
- Blocked by: [Nombre de la Card] (link)
- Blocks: [Nombre de la Card] (link)
```

Dos tipos:
- **Blocked by** → esta card no puede empezar hasta que la otra termine
- **Blocks** → otra card espera que esta termine

Para cards bloqueadas, añadir label `Blocked` (🔴).

---

## 7. Comandos para project-manager

```bash
# Crear card
@project-manager: /trello-create-card name:"[Backend] Title" list:"Sprint Backlog" labels:"Backend" desc:"..."

# Mover entre listas
@project-manager: /trello-update-card card:"[Backend] Title" list:"In Progress"

# Archivar
@project-manager: /trello-update-card card:"[Backend] Title" closed:"true"
```
