## Context

El 22 de julio de 2026 se identificó un **Subagent Silent Exit** durante la Fase 3 (Review) de SDD: @planner completó todas sus tool calls internas pero emitió un `<task_result></task_result>` vacío. La re-delegación con `ABSOLUTE REQUIREMENT: Your final message MUST contain ## Verdict` como ÚLTIMA instrucción resolvió el incidente.

Una investigación comisionada a @researcher confirmó la causa raíz como el **lost-in-the-middle effect** (Liu et al. 2023, "Lost in the Middle: How Language Models Use Long Contexts"): cuando el prompt es largo, las instrucciones en el medio del contexto tienen menor peso que las del inicio o final. Los subagent prompts ya contienen OUTPUT CONTRACT sections, pero estas quedan en el medio del prompt cuando el orchestrator antepone instrucciones de delegación extensas.

El investigador evaluó 4 mitigaciones propuestas y encontró una alternativa más potente (retry-on-empty con resume message) basada en implementaciones de 5+ frameworks (Google ADK, NousResearch, Pydantic-AI, LlamaIndex, Roj SDK). Se diseño una capa triple de mitigación, de la cual este change cubre las capas 2 y 3 (orchestrator-level y subagent prompt-level).

## Goals / Non-Goals

**Goals:**
- Eliminar el Subagent Silent Exit mediante prompt engineering sistemático
- Crear un Delegation Suffix Template reutilizable para el orchestrator
- Reubicar OUTPUT CONTRACT al final de todos los subagent prompts
- Implementar sandwich pattern (reglas críticas al inicio Y al final)
- Reemplazar chunking por número de archivos por umbral de tokens (~4000)
- Documentar nuevo término "Delegation Suffix Template" en CONTEXT.md

**Non-Goals:**
- NO implementar retry-on-empty en el framework layer (Task tool): requiere cambios en infraestructura de opencode
- NO modificar el schema ni la implementación del output contract XML envelope
- NO cambiar el comportamiento del CLI openspec ni del orchestrator runtime
- NO afectar código de aplicación, paquetes, o configuración de workspace

## Decisions

### D1: Layer orchestrator vs subagent prompt — minimizar puntos de cambio

**Decisión**: Implementar 1 Delegation Suffix Template en `orchestrator.md` en vez de modificar individualmente los 7 subagent prompts.

**Razonamiento**: Un solo punto de inyección (el orchestrator) controla toda delegación. Modificar 7 subagent prompts individualmente sería más costoso y propenso a errores de sincronización. Sin embargo, la posición del OUTPUT CONTRACT sigue requiriendo modificación por-subagent prompt porque es una brecha estructural del lost-in-the-middle effect que no puede resolverse desde el orchestrator.

**Alternativa considerada**: Modificar solo el orchestrator sin tocar subagent prompts. Descartado porque el lost-in-the-middle effect ocurre dentro del contexto del subagente, no del orchestrator.

### D2: Umbral de tokens (~4000) vs umbral de archivos (10+)

**Decisión**: Reemplazar el umbral de "10+ archivos" por ~4000 tokens estimados — considerando el **contexto TOTAL** que ve el subagente (system prompt del subagente + mensaje de delegación + CONTEXT.md inyectado), no solo el mensaje de delegación.

**Razonamiento**: La investigación del researcher demostró que el umbral "10+ archivos" no tiene base científica. La degradación por lost-in-the-middle depende de la longitud total en tokens, no del conteo de archivos ni de componentes aisladas. Si el system prompt del subagente ya son ~2000-3000 tokens (típico para prompts como developer.md u orchestrator.md con secciones SELF-VALIDATION, Guardrails Layer 4, OUTPUT CONTRACT), una delegación de 4000 tokens llevaría el total a 6000-7000+. Estimar solo el mensaje de delegación sería demasiado permisivo. 4000 tokens de contexto TOTAL es un valor conservador para modelos con ventana de 200K tokens, ~4 caracteres ≈ 1 token para texto mixto español/inglés.

**Counter-finding**: Liu et al. 2023 muestra degradación medible incluso en ventanas de 128K. Context Length Alone Hurts (EMNLP 2025) confirma que el efecto es monotónico con la longitud total.

### D3: Documentar framework retry en vez de implementar

**Decisión**: Documentar la alternativa retry-on-empty como "Future work" sin implementarla en este change.

**Razonamiento**: El retry-on-empty con resume message requiere cambios en la infraestructura de opencode (Task tool wrapper/layer), no en prompts. Está fuera del alcance del prompt engineering. La implementación está validada por 5+ frameworks open-source pero requiere un change separado a nivel de framework.

**Evidencia**: Google ADK PR #5006, Hermes #6488, Pydantic-AI #5643, LlamaIndex #20596 — todos implementan retry-on-empty en el framework layer, no en prompts.

### D4: Reubicar OUTPUT CONTRACT al final (evidence-based)

**Decisión**: Mover la sección OUTPUT CONTRACT a la última posición sustantiva en developer.md, planner.md, reviewer.md, researcher.md.

**Razonamiento**: El lost-in-the-middle effect (Liu et al. 2023) y Attention Basin (ACL 2026) demuestran que las instrucciones al final del prompt tienen mayor peso de recencia. La posición actual (antes de REMEMBER) deja el OUTPUT CONTRACT en el medio cuando el orchestrator antepone contexto extenso de delegación. Moverlo al final minimiza el riesgo de silent exit.

**Riesgo**: Algunos prompts existentes ya tienen REMEMBER después de OUTPUT CONTRACT. En estos casos, la reubicación implica intercambiar el orden (OUTPUT CONTRACT pasa al final después de REMEMBER).

## Risks / Trade-offs

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Delegation Suffix Template añade ~50 tokens por delegación | Bajo — 50 tokens es despreciable vs ventanas de 200K | Aceptar. El beneficio de prevenir silent exit supera el costo marginal |
| Sandwich pattern duplica contenido — posible drift si no se actualizan ambas copias | Medio — reglas inconsistentes entre inicio y final del prompt | Añadir rule de CI/CD o checklist de revisión: "Verificar consistencia CRITICAL RULES" |
| REMEMBER section queda antes de OUTPUT CONTRACT (cambio de orden en prompts legacy) | Bajo — solo afecta prompts existentes con formato anterior | Documentar en spec `prompt-format` como MODIFIED requirement |
| Umbral de 4000 tokens puede ser demasiado conservador para tareas complejas | Medio — chunking excesivo podría fragmentar tareas | El umbral es estimado; el orchestrator puede ajustarlo según el tipo de tarea. Documentar como "~4000" no como valor fijo |
| Researcher.md es el más propenso a silent exit por output verbose | Alto — este subagente produce respuestas largas que pueden llevar a truncamiento | Incluir reminder específico de output en el OUTPUT CONTRACT del researcher |
| Framework-level retry-on-empty no implementado — silent exit aún posible si falla prompt engineering | Alto — la capa triple completa requiere las 3 capas | Documentar como future work prioritario. Este change cubre capas 2 y 3 |

## Future Work

### Framework-level Retry-on-Empty con Resume Message

Este change NO implementa la mitigación más potente identificada por la investigación: **retry-on-empty con resume message** (eficacia 0.9, confianza 0.9). 

Se recomienda un change futuro que:
1. Implemente un wrapper en el Task tool layer que detecte respuestas vacías
2. Re-ejecute la delegación automáticamente (2-3 retries max) con un "resume message" que indique: "Your previous response was empty. Please complete the task and emit the required output contract."
3. Si persiste vacío después de retries, surface como server_error
4. Referencia de implementación: ADK Python PR #5006 (Google), Hermes #6488 (NousResearch), Pydantic-AI #5643, LlamaIndex #20596

### Structured Output / Response Format Enforcement

Evaluar si opencode puede adoptar `response_format` (JSON mode) de los providers de LLM como capa adicional de prevención. No incluido en este change porque requiere cambios en el LLM client layer.
