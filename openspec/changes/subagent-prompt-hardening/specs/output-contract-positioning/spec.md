## ADDED Requirements

### Requirement: OUTPUT CONTRACT como última sección sustantiva
Todo subagent prompt SHALL tener su sección OUTPUT CONTRACT como la última sección sustantiva antes del sign-off o fin del archivo.

#### Scenario: OUTPUT CONTRACT al final del prompt
- **WHEN** se revisa un subagent prompt en `docs/opencode/prompts/<agent>.md`
- **THEN** la sección `## OUTPUT CONTRACT` MUST ser la última sección con heading level 2 antes del final del archivo
- **AND** no SHALL haber ninguna otra sección sustantiva (heading level 2) después de OUTPUT CONTRACT

#### Scenario: Solo whitespace o sign-off después de OUTPUT CONTRACT
- **WHEN** OUTPUT CONTRACT es la última sección
- **THEN** después de ella solo SHALL haber whitespace, el tag `---` de cierre, o la sección `## REMEMBER` (si existe, y solo si REMEMBER es una sección de resumen corto, no instrucciones sustantivas)
