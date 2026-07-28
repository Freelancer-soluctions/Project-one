## ADDED Requirements

### Requirement: Orchestrator inyecta Delegation Suffix Template al delegar
El orchestrator SHALL inyectar el Delegation Suffix Template como la ÚLTIMA instrucción de todo mensaje de delegación a cualquier subagente.

#### Scenario: Delegación incluye suffix template al final
- **WHEN** el orchestrator prepara un mensaje de delegación para un subagente
- **THEN** el mensaje SHALL contener el Delegation Suffix Template como su última sección
- **AND** el template SHALL incluir: anchor de cierre, guard anti-vacío, y referencia al schema del output contract

#### Scenario: Múltiples bloques en la delegación
- **WHEN** la delegación contiene múltiples secciones o bloques de instrucciones
- **THEN** el Delegation Suffix Template SHALL ser el bloque final
- **AND** no SHALL haber ninguna instrucción sustantiva después del template

### Requirement: Contenido del Delegation Suffix Template
El Delegation Suffix Template SHALL contener tres componentes: anchor de cierre, guard anti-vacío, y referencia al schema.

#### Scenario: Anchor de cierre presente
- **WHEN** se inspecciona el Delegation Suffix Template
- **THEN** SHALL contener un anchor de cierre con el texto: "Your final assistant message MUST contain the structured deliverable described above. Do NOT end without emitting it."

#### Scenario: Guard anti-vacío presente
- **WHEN** se inspecciona el Delegation Suffix Template
- **THEN** SHALL contener un guard anti-vacío con el texto: "If you have nothing to report, report a brief explanation — empty responses are NOT acceptable."

#### Scenario: Referencia al schema presente
- **WHEN** se inspecciona el Delegation Suffix Template
- **THEN** SHALL contener una referencia al output contract del subagente destinatario
- **AND** la referencia SHALL incluir la ruta al archivo schema en `docs/opencode/prompts/contracts/<agent>.schema.json`
