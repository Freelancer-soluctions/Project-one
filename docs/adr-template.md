# ADR Template: Architecture Decision Record

> **¿Por qué este documento?**  
> En la era de los agentes de IA, las alucinaciones arquitecturales son un riesgo real. Cuando un agente genera código sin contexto de decisiones previas, puede inventar abstracciones, elegir librerías sin justificación, o reintroducir patrones ya rechazados. Este ADR es el mecanismo que hace las decisiones arquitecturales **explícitas, duraderas y consultables por agentes**.

---

## Concepto: Architect vs. Typist

La colaboración humano-IA funciona mejor cuando se define una **frontera clara de responsabilidades**:

| Rol | Responsabilidad | ¿Qué hace la IA? |
|-----|----------------|-------------------|
| **Architect** (humano) | Define límites, trade-offs, contexto histórico, decisiones rechazadas | — |
| **Typist** (IA) | Implementa dentro de los límites definidos por el Architect | Escribe código, sigue patrones, aplica decisiones ya tomadas |

### La regla fundamental

> **El humano dibuja la frontera en texto antes de que el agente abra una sesión.**  
> El framing de las decisiones (qué vive dónde, qué patrones usar, qué fue rechazado) permanece del lado del humano. Todo lo demás es territorio del agente.

### ¿Cómo previene esto las alucinaciones?

Cuando un agente de IA consulta un ADR antes de generar código:

1. **Lee las decisiones como restricciones** — no inventa su propio diseño
2. **Conoce los trade-offs aceptados** — sabe qué consecuencias aceptar
3. **Consulta el historial de decisiones rechazadas** — no reintroduce patrones obsoletos
4. **Implementa dentro de un contexto explícito** — el código generado es coherente con la arquitectura

**Dato clave**: Los estudios de 2025 muestran que el código generado por IA tiene tasas de alucinación del 42-47% durante tareas de code review cuando el contexto arquitectural está ausente.

---

## Cuándo crear un ADR

Crear un ADR cuando se tome una decisión que:

- Cambie la estructura de directorios o módulos principales
- Introduzca o reemplace una dependencia de terceros
- Modifique un contrato de API pública
- Defina un patrón arquitectural nuevo (ej: autenticación, caching, gestión de estado)
- Elija entre alternativas con trade-offs no obvios
- Revierta una decisión anterior (el ADR anterior se marca como `superseded`)

---

## Estructura del ADR (Plantilla MADR 4.0.0)

```markdown
# ADR-{NNN}: {Título corto del problema resuelto y la solución}

## Status

| Campo | Valor |
|-------|-------|
| **Status** | `proposed` · `accepted` · `rejected` · `deprecated` · `superseded by ADR-NNN` |
| **Date** | {YYYY-MM-DD} |
| **Decision Makers** | {lista de personas} |
| **Confidence** | `high` · `medium` · `low` (opcional, Microsoft WAF recomienda este campo) |

## Context and Problem Statement

{Describe el contexto y el problema en 2-3 oraciones. Articula el problema como una pregunta.}

## Decision Drivers

- {driver 1, ej: contrainte de rendimiento o seguridad}
- {driver 2, ej: experiencia del equipo o costo operativo}
- {driver 3}

## Considered Options

- **{option 1}**: {descripción breve}
- **{option 2}**: {descripción breve}
- **{option 3}**: {descripción breve}

## Decision Outcome

**Chosen option**: `"{option 1}"`, porque {justificación}.

### Positive Consequences

- {consecuencia positiva 1}
- {consecuencia positiva 2}

### Negative Consequences

- {consecuencia negativa 1}
- {consecuencia negativa 2}

### Confirmation

{¿Cómo se validará el cumplimiento de esta decisión? Ej: code review, ArchUnit test, linter rule.}

## Pros and Cons of the Options

### {option 1}

- ✅ **Good**, porque {argumento a favor}
- ⚖️ **Neutral**, porque {argumento neutro}
- ❌ **Bad**, porque {argumento en contra}

### {option 2}

- ✅ **Good**, porque {argumento a favor}
- ❌ **Bad**, porque {argumento en contra}

### {option 3}

- ✅ **Good**, porque {argumento a favor}
- ❌ **Bad**, porque {argumento en contra}

## Notes (opcional)

{Notas adicionales, antecedentes, links relevantes.}

---

## Formato Y-Statement (alternativo, para decisiones simples)

Para decisiones menores o resúmenes ejecutivos, usar el formato Y-Statement:

```markdown
## Y-Statement

> En el contexto de {contexto}, faced by {concern},
> we decided for {opción} and neglected {otras opciones},
> to achieve {calidad}, accepting {downside}.
```

**Ejemplo:**

> En el contexto de `apps/server` necesitamos autenticación, facing la concern de no queremos implementar OAuth completo para un MVP, we decided for `JWT con httpOnly cookies` and neglected `OAuth 2.0` y `Session tokens en BD`, to achieve simplicidad y performance, accepting que no tenemos refresh token nativo.

---

## Integración con OpenSpec

Los ADRs viven **fuera** de los change folders de OpenSpec. Son artefactos persistentes que sobreviven a los cambios.

```
docs/
├── adr/
│   ├── index.md                    ← Índice de todos los ADRs
│   ├── 0001-use-postgresql.md
│   ├── 0002-adopt-jwt-auth.md
│   └── ...
├── specs/
└── ...

openspec/
└── changes/
    └── {change-name}/
        └── proposal.md           ← Puede referenciar ADR-NNN
```

**Regla**: Cuando un change hace una decisión arquitectural, debe:
1. Escribir o referenciar un ADR en `docs/adr/`
2. El PR del change debe incluir el ADR o una referencia a uno existente

---

## Integración con CI

Para proyectos que usan agentes de IA, se recomienda añadir un gate en CI:

```bash
# .github/workflows/adr-check.sh
# Verifica que cambios en archivos con patrón .ts,.js citen un ADR si toca lógica arquitectural

if git diff --name-only | grep -E '\.(ts|js)$' | xargs grep -l 'newDep\|pattern' > /dev/null; then
  if ! grep -r 'ADR-' docs/adr/ .github/ADR* 2>/dev/null; then
    echo "ERROR: Cambios detectados sin ADR referenciado"
    exit 1
  fi
fi
```

---

## Índice de ADRs (`docs/adr/index.md`)

```markdown
# Architecture Decision Records

## Índice

| # | Título | Status | Date |
|---|--------|--------|------|
| 0001 | {título} | `accepted` | 2026-01-15 |
| 0002 | {título} | `superseded by ADR-0003` | 2026-02-20 |
| 0003 | {título} | `accepted` | 2026-03-10 |

## Formato

Los ADRs se numeran secuencialmente: `0001`, `0002`, ...  
Nombre de archivo: `NNNN-title-with-dashes.md`

## Reglas

- Un ADR **nunca se elimina**. Si una decisión cambia, se crea un nuevo ADR que marca el anterior como `superseded by ADR-NNN`.
- El campo **Status** es obligatorio: `proposed` → `accepted` → `deprecated`/`superseded`
- Todos los ADRs viven en `docs/adr/` para que los agentes puedan indexarlos.
```

---

## Referencias

- [Documenting Architecture Decisions — Michael Nygard (2011)](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [MADR Project v4.0.0](https://adr.github.io/madr/) — Plantilla más ampliamente adoptada
- [ThoughtWorks Tech Radar: Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
- [Microsoft Azure WAF: Architecture Decision Record](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record)
- [AWS Architecture Blog: Master ADRs (2025)](https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/)
- [Architecture Without Architects — arXiv (2025)](https://arxiv.org/html/2604.04990) — Cómo los agentes de IA dan forma a la arquitectura
- [GAISD: Governed ADRs in the Age of AI Architecture](https://gaisd.dev/blog/governed-adrs-in-the-age-of-ai-architecture)
- [The ADR Comeback — Rick Pollick (2026)](https://rickpollick.com/blog/adr-comeback-anchoring-agentic-engineering-teams)
- [Vercel ADR Skill](https://github.com/vercel/ai/blob/main/skills/adr-skill/SKILL.md) — ADRs como especificaciones ejecutables para agentes