## ADDED Requirements

### Requirement: Reglas críticas duplicadas al inicio y final del prompt
Los subagent prompts SHALL duplicar las reglas más críticas del output contract al inicio Y al final del prompt (sandwich pattern).

#### Scenario: CRITICAL RULES al inicio del prompt
- **WHEN** se carga un subagent prompt
- **THEN** las 2-3 reglas más críticas del output contract SHALL aparecer como una sección `## CRITICAL RULES` al inicio del prompt (antes de cualquier otra instrucción)
- **AND** esta sección SHALL contener al menos: regla de emisión obligatoria del output contract y regla de prohibición de respuesta vacía

#### Scenario: Reglas críticas también al final
- **WHEN** se revisa la sección OUTPUT CONTRACT al final del prompt
- **THEN** las mismas reglas críticas SHALL estar reiteradas en la sección OUTPUT CONTRACT
- **AND** el contenido de las reglas SHALL ser consistente entre inicio y final
