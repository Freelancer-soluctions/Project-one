## ADDED Requirements

### Requirement: Umbral de chunking basado en tokens estimados
El orchestrator SHALL estimar el tamaño TOTAL del contexto que verá el subagente (system prompt del subagente + mensaje de delegación + CONTEXT.md inyectado) en tokens y dividir en invocaciones múltiples si excede el umbral.

#### Scenario: Contexto total menor o igual a 4000 tokens
- **WHEN** el orchestrator estima que la suma de (system prompt del subagente + mensaje de delegación + CONTEXT.md inyectado) es <= 4000 tokens
- **THEN** SHALL delegar en una sola invocación sin chunking

#### Scenario: Contexto total excede 4000 tokens
- **WHEN** el orchestrator estima que la suma de (system prompt del subagente + mensaje de delegación + CONTEXT.md inyectado) excede 4000 tokens
- **THEN** SHALL dividir la tarea en múltiples invocaciones (chunking)
- **AND** SHALL mergear los resultados de las invocaciones parciales
- **AND** SHALL usar el modelo de estimación: ~4 caracteres ≈ 1 token para texto en español/inglés
- **AND** SHALL estimar primero el system prompt del subagente (tamaño fijo por cada agente) y CONTEXT.md (tamaño fijo ~600 tokens) y luego sumar el mensaje de delegación

#### Scenario: Chunking con dependencias entre fragmentos
- **WHEN** una delegación chunked tiene fragmentos con dependencias entre sí
- **THEN** el orchestrator SHALL pasar el output del fragmento anterior como contexto al siguiente fragmento
- **AND** SHALL recolectar y mergear todos los resultados parciales

### Requirement: Reemplazo de umbral por número de archivos
El umbral de chunking basado en "10+ archivos" SHALL ser reemplazado por el umbral de ~4000 tokens.

#### Scenario: Regla anterior eliminada
- **WHEN** se revisa `orchestrator.md`
- **THEN** cualquier regla que use "10+ archivos" como umbral de chunking SHALL ser eliminada o reemplazada por la regla de tokens estimados
- **AND** la nueva regla SHALL citar como razón: Lost-in-the-middle effect (Liu et al. 2023) + Context Length Alone Hurts (EMNLP 2025)
