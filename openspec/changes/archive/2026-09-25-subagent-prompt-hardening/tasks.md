## 1. Crear Delegation Suffix Template en orchestrator.md

- [x] 1.1 Localizar la sección en `docs/opencode/prompts/orchestrator.md` donde ocurren las delegaciones
- [x] 1.2 Crear el bloque Delegation Suffix Template con anchor de cierre: "Your final assistant message MUST contain the structured deliverable described above. Do NOT end without emitting it."
- [x] 1.3 Incluir guard anti-vacío: "If you have nothing to report, report a brief explanation — empty responses are NOT acceptable."
- [x] 1.4 Incluir referencia al schema del output contract del subagente: "Wrap your response in `<output-contract agent=\"<agent-name>\" version=\"1\">...</output-contract>` per `docs/opencode/prompts/contracts/<agent>.schema.json`"
- [x] 1.5 Documentar CUÁNDO inyectar: "ALWAYS append the Delegation Suffix Template as the LAST instruction of every delegation message. No other instruction may follow."
- [x] 1.6 Verificar que el template usa agent-name dinámico: el template DEBE usar el placeholder `${agent-name}` (ej: `<output-contract agent="${agent-name}" version="1">`). El orchestrator DEBE resolver el placeholder con el nombre del subagente destinatario antes de inyectar el template. El mecanismo de resolución es por convención textual (el orchestrator reemplaza `${agent-name}` con el nombre real al construir el mensaje de delegación).

## 2. Reubicar OUTPUT CONTRACT en developer.md

- [x] 2.1 Leer `docs/opencode/prompts/developer.md` e identificar la posición actual de `## OUTPUT CONTRACT`
- [x] 2.2 Identificar las secciones después de OUTPUT CONTRACT que deben moverse antes — específicamente `## SELF-VALIDATION` y `## Guardrails Layer 4 (Pre-Execution Prevention)` (confirmadas como existentes en los 7 subagent prompts)
- [x] 2.3 Mover las secciones `## SELF-VALIDATION` y `## Guardrails Layer 4` ANTES de `## OUTPUT CONTRACT` (preservar su contenido)
- [x] 2.4 Verificar que OUTPUT CONTRACT queda como la ÚLTIMA sección sustantiva antes del sign-off (REMINDER / ## REMEMBER sections)
- [x] 2.5 Ejecutar el validador de output-contract y prompt-format specs para confirmar compliance — si el validador no existe, usar grep manual: buscar `## OUTPUT CONTRACT` y confirmar que ninguna sección `## SELF-VALIDATION` o `## Guardrails Layer 4` aparece DESPUÉS

## 3. Reubicar OUTPUT CONTRACT en planner.md

- [x] 3.1 Leer `docs/opencode/prompts/planner.md` e identificar la posición actual de `## OUTPUT CONTRACT`
- [x] 3.2 Identificar las secciones después de OUTPUT CONTRACT que deben moverse antes — específicamente `## SELF-VALIDATION` y `## Guardrails Layer 4 (Pre-Execution Prevention)`
- [x] 3.3 Mover las secciones `## SELF-VALIDATION` y `## Guardrails Layer 4` ANTES de `## OUTPUT CONTRACT` (preservar su contenido)
- [x] 3.4 Verificar que OUTPUT CONTRACT queda como la ÚLTIMA sección sustantiva antes del sign-off
- [x] 3.5 Ejecutar el validador de output-contract y prompt-format specs — alternativa: grep manual confirma

## 4. Reubicar OUTPUT CONTRACT en reviewer.md

- [x] 4.1 Leer `docs/opencode/prompts/reviewer.md` e identificar la posición actual de `## OUTPUT CONTRACT`
- [x] 4.2 Identificar las secciones después de OUTPUT CONTRACT que deben moverse antes — específicamente `## SELF-VALIDATION` y `## Guardrails Layer 4 (Pre-Execution Prevention)`
- [x] 4.3 Mover las secciones `## SELF-VALIDATION` y `## Guardrails Layer 4` ANTES de `## OUTPUT CONTRACT` (preservar su contenido)
- [x] 4.4 Verificar que OUTPUT CONTRACT queda como la ÚLTIMA sección sustantiva antes del sign-off
- [x] 4.5 Ejecutar el validador de output-contract y prompt-format specs — alternativa: grep manual confirma

## 5. Reubicar OUTPUT CONTRACT en researcher.md

- [x] 5.1 Leer `docs/opencode/prompts/researcher.md` e identificar la posición actual de `## OUTPUT CONTRACT`
- [x] 5.2 Identificar las secciones después de OUTPUT CONTRACT que deben moverse antes — específicamente `## SELF-VALIDATION` y `## Guardrails Layer 4 (Pre-Execution Prevention)`
- [x] 5.3 Mover las secciones `## SELF-VALIDATION` y `## Guardrails Layer 4` ANTES de `## OUTPUT CONTRACT` (preservar su contenido)
- [x] 5.4 Añadir reminder específico en el OUTPUT CONTRACT: "IMPORTANT: This agent produces verbose output. Ensure your final message contains the structured output contract — do NOT end without emitting it."
- [x] 5.5 Verificar que no queden secciones sustantivas después de OUTPUT CONTRACT
- [x] 5.6 Ejecutar el validador de output-contract y prompt-format specs — alternativa: grep manual confirma

## 6. Verificar OUTPUT CONTRACT en git-manager.md, spec-manager.md, project-manager.md

- [x] 6.1 Leer `docs/opencode/prompts/git-manager.md` y verificar posición de OUTPUT CONTRACT
- [x] 6.2 Leer `docs/opencode/prompts/spec-manager.md` y verificar posición de OUTPUT CONTRACT
- [x] 6.3 Leer `docs/opencode/prompts/project-manager.md` y verificar posición de OUTPUT CONTRACT
- [x] 6.4 Si alguno tiene `## SELF-VALIDATION` o `## Guardrails Layer 4` después de `## OUTPUT CONTRACT`, reubicar ANTES
- [x] 6.5 Si todos están correctamente posicionados (OUTPUT CONTRACT al final, SELF-VALIDATION/Guardrails antes), no modificar — documentar "OK" en el task
- [x] 6.6 Ejecutar el validador para los archivos modificados — alternativa: grep manual confirma

## 7. Añadir Sandwich Pattern en los prompts reubicados

- [x] 7.1 En `developer.md`: añadir sección `## CRITICAL RULES` al inicio con las reglas críticas de output: "Your response MUST be wrapped in `<output-contract>` XML envelope", "Empty responses are NOT acceptable", "Do NOT end without emitting the structured deliverable"
- [x] 7.2 En `planner.md`: añadir sección `## CRITICAL RULES` al inicio con el mismo contenido que 7.1
- [x] 7.3 En `reviewer.md`: añadir sección `## CRITICAL RULES` al inicio con el mismo contenido que 7.1
- [x] 7.4 En `researcher.md`: añadir sección `## CRITICAL RULES` al inicio con el mismo contenido que 7.1
- [x] 7.5 Verificar consistencia: las reglas al inicio deben coincidir exactamente con las reglas en OUTPUT CONTRACT al final
- [x] 7.6 Documentar en cada prompt: "If you update the rules in OUTPUT CONTRACT, update CRITICAL RULES at the top to match"

## 8. Nueva regla de chunking basada en tokens en orchestrator.md

- [x] 8.1 Localizar la regla existente de chunking por "10+ archivos" en `orchestrator.md`
- [x] 8.2 Reemplazar con nueva regla: "ALWAYS estimate prompt token count before delegation. Aproximación: ~4 caracteres ≈ 1 token. Considerar el TOTAL del contexto que verá el subagente: system prompt del subagente + mensaje de delegación + CONTEXT.md inyectado — no solo el mensaje de delegación."
- [x] 8.3 Añadir umbral: "If estimated TOTAL tokens (system+delegation+CONTEXT.md) > 4000, split the task into multiple invocaciones (chunking) and merge results."
- [x] 8.4 Colocar la regla en la sección "DELEGATION FORMAT" o inmediatamente después
- [x] 8.5 Incluir razonamiento citado: "Lost-in-the-middle effect (Liu et al. 2023) + Context Length Alone Hurts (EMNLP 2025) — el efecto escala con el contexto TOTAL, no con cada componente aislada"
- [x] 8.6 Eliminar la regla anterior de "10+ archivos" completamente

## 9. Añadir término "Delegation Suffix Template" a CONTEXT.md

- [x] 9.1 Leer `CONTEXT.md` y localizar la sección "Technical Concepts & Skills"
- [x] 9.2 Añadir entrada: "- **Delegation Suffix Template**: Bloque de texto que el orchestrator inyecta como ÚLTIMA instrucción al delegar a un subagente. Contiene anchor de cierre, guard anti-vacío y referencia al schema del output contract. Previene Subagent Silent Exit al asegurar que las instrucciones de output estén al final del contexto (recency bias)."
- [x] 9.3 Colocar la nueva entrada después del término "Subagent Silent Exit" y antes de "gh CLI / GitHub CLI"
- [x] 9.4 Verificar que el formato coincida con las entradas existentes (guión, negrita, descripción tabulada)

## 10. Sincronizar delta spec prompt-format a main spec

- [x] 10.1 Ejecutar `openspec sync` o el workflow equivalente para sincronizar la delta spec `openspec/changes/subagent-prompt-hardening/specs/prompt-format/spec.md` a la spec principal `openspec/specs/prompt-format/spec.md`
- [x] 10.2 Verificar con `openspec status` que la delta spec se marcó como sincronizada (o el output equivalente)
- [x] 10.3 Si `openspec sync` falla o no existe, documentar el estado en el reporte final — el archive del change intentará la sincronización automáticamente
