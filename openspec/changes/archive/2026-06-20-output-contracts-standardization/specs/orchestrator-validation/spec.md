## ADDED Requirements

### Requirement: Envelope parsing
The orchestrator SHALL parse the XML envelope from subagent responses using a regex or lightweight parser that extracts the `agent` attribute, `version` attribute, and inner JSON payload.

#### Scenario: Parse valid envelope
- **WHEN** the orchestrator receives a response with a valid `<output-contract>` envelope
- **THEN** it SHALL extract the `agent` attribute value
- **AND** it SHALL extract the `version` attribute value
- **AND** it SHALL extract the inner JSON content
- **AND** it SHALL parse the JSON content into a structured object

#### Scenario: Parse fails on missing envelope
- **WHEN** the orchestrator receives a response without a valid envelope
- **THEN** it SHALL return a parse error
- **AND** it SHALL NOT attempt to process the response content

#### Scenario: Parse fails on invalid JSON
- **WHEN** the orchestrator extracts inner content that is not valid JSON
- **THEN** it SHALL return a parse error with details about the JSON parse failure

### Requirement: Schema-based validation
The orchestrator SHALL validate parsed JSON payloads against the corresponding agent schema file at `docs/opencode/prompts/contracts/<agent>.schema.json`.

#### Scenario: Load correct schema
- **WHEN** the orchestrator has parsed the envelope and extracted the `agent` attribute
- **THEN** it SHALL load `docs/opencode/prompts/contracts/<agent>.schema.json`
- **AND** if the schema file does not exist, it SHALL pass the response through unvalidated (graceful degradation)

#### Scenario: Validate required fields
- **WHEN** the orchestrator validates a payload against a schema
- **THEN** it SHALL check that all fields in the schema's `required` array are present in the payload
- **AND** it SHALL check that each field's value matches the expected type from the schema
- **AND** it SHALL check that `responseType` is one of `"success"` or `"failure"`

#### Scenario: Validation passes
- **WHEN** all required fields are present with correct types
- **THEN** the orchestrator SHALL mark the response as valid
- **AND** proceed with normal response processing

#### Scenario: Validation fails
- **WHEN** required fields are missing or types are incorrect
- **THEN** the orchestrator SHALL mark the response as invalid
- **AND** SHALL generate a structured error report listing each violation

### Requirement: Violation handling
The orchestrator SHALL handle contract violations with a configurable retry/fail/escalate strategy.

#### Scenario: Retry on violation
- **WHEN** a response fails validation
- **THEN** the orchestrator SHALL send a retry request to the agent
- **AND** the retry request SHALL include the specific validation errors found
- **AND** the orchestrator SHALL allow up to 2 retries before escalating

#### Scenario: Max retries exceeded
- **WHEN** validation fails after the maximum number of retries (2)
- **THEN** the orchestrator SHALL escalate to the user with a summary of the failure
- **AND** the orchestrator SHALL include the raw response and validation errors in the escalation

#### Scenario: Graceful degradation without schema
- **WHEN** no schema file exists for the responding agent
- **THEN** the orchestrator SHALL pass the response through unvalidated
- **AND** SHALL log a warning that no schema was found for that agent
