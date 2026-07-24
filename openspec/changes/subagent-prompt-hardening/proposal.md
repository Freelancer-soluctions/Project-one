## Why

El **Subagent Silent Exit** — un subagente completa todas sus tool calls internas pero no emite ningún mensaje de texto final — fue identificado durante la Fase 3 (Review) de SDD. @planner devolvió un `<task_result></task_result>` vacío a pesar de haber ejecutado correctamente todas las llamadas internas. La re-delegación con una instrucción explícita `ABSOLUTE REQUIREMENT: Your final message MUST contain ## Verdict` como ÚLTIMA línea del prompt resolvió el incidente.

Este problema está documentado en `CONTEXT.md` línea 34 como "Subagent Silent Exit". La causa raíz identificada es el **lost-in-the-middle effect** (Liu et al. 2023) y **Attention Basin** (ACL 2026): cuando el prompt de un subagente es largo, las instrucciones de output contract quedan en el medio del contexto y el modelo no las procesa al final de su turno.

Se requiere una solución sistemática de prompt engineering para eliminar este failure mode en agentes existentes y prevenir su recurrencia en futuros agentes.

## What Changes

1. **Creación de Delegation Suffix Template** en `orchestrator.md` — fragmento que el orchestrator inyecta como ÚLTIMO bloque al delegar a cualquier subagente. Contiene: anchor de cierre, guard anti-vacío, y referencia al schema del output contract.
2. **Reubicación de OUTPUT CONTRACT al final** en 4 subagent prompts (`developer.md`, `planner.md`, `reviewer.md`, `researcher.md`) para mitigar el lost-in-the-middle effect.
3. **Verificación de posición OUTPUT CONTRACT** en 3 subagent prompts (`git-manager.md`, `spec-manager.md`, `project-manager.md`) — mover al final si no lo está.
4. **Sandwich pattern** — duplicar las 2-3 reglas más críticas al inicio Y al final de cada subagent prompt reubicado.
5. **Nueva regla de chunking basada en tokens** en `orchestrator.md` — reemplazar umbral de "10+ archivos" por ~4000 tokens estimados.
6. **Documentación del término "Delegation Suffix Template"** en `CONTEXT.md`.
7. **Modificación de spec existente `prompt-format`**: la regla "OUTPUT CONTRACT antes de REMEMBER" cambia a "OUTPUT CONTRACT como última sección sustantiva antes del sign-off".

## Capabilities

### New Capabilities
- `delegation-suffix-template`: Define el fragmento inyectable que el orchestrator añade al final de cada delegación para prevenir silent exit
- `output-contract-positioning`: Establece que OUTPUT CONTRACT debe ser la última sección sustantiva en todo subagent prompt
- `sandwich-pattern`: Las reglas críticas de output deben aparecer tanto al inicio como al final del prompt
- `token-based-chunking`: El orchestrator debe dividir delegaciones que excedan ~4000 tokens estimados en invocaciones múltiples

### Modified Capabilities
- `prompt-format`: La especificación existente requiere OUTPUT CONTRACT antes de REMEMBER. Se modifica para requerir OUTPUT CONTRACT como la ÚLTIMA sección sustantiva antes del sign-off, posicionándolo después de REMEMBER si es necesario.

## Impact

- `docs/opencode/prompts/orchestrator.md` — adición de Delegation Suffix Template y nueva regla de chunking
- `docs/opencode/prompts/developer.md` — reubicación OUTPUT CONTRACT + sandwich pattern
- `docs/opencode/prompts/planner.md` — reubicación OUTPUT CONTRACT + sandwich pattern
- `docs/opencode/prompts/reviewer.md` — reubicación OUTPUT CONTRACT + sandwich pattern
- `docs/opencode/prompts/researcher.md` — reubicación OUTPUT CONTRACT + sandwich pattern
- `docs/opencode/prompts/git-manager.md` — posible reubicación (verificar)
- `docs/opencode/prompts/spec-manager.md` — posible reubicación (verificar)
- `docs/opencode/prompts/project-manager.md` — posible reubicación (verificar)
- `CONTEXT.md` — adición de nuevo término técnico
- `openspec/specs/prompt-format/spec.md` — modificación de requerimiento existente
- NO afecta código de aplicación, configuraciones de paquete, ni infraestructura
