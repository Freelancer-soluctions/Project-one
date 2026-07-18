## ADDED Requirements

### Requirement: Standard XML envelope format
All agent responses SHALL wrap their structured output in an XML envelope: `<output-contract agent="[name]" version="1">` and `</output-contract>`. The envelope tag MUST be the first and last non-whitespace content in the response. The JSON payload inside the envelope MUST be valid JSON.

#### Scenario: Agent wraps response in envelope
- **WHEN** any subagent produces a response
- **THEN** the response SHALL begin with `<output-contract agent="[agent-name]" version="1">`
- **AND** the response SHALL end with `</output-contract>`
- **AND** the content between tags SHALL be valid JSON

#### Scenario: Orchestrator parses envelope
- **WHEN** the orchestrator receives a response
- **THEN** it SHALL extract the `agent` attribute and `version` attribute
- **AND** it SHALL parse the inner content as JSON
- **AND** it SHALL validate the JSON payload against the agent's schema

#### Scenario: Malformed envelope handling
- **WHEN** a response does not contain a valid `<output-contract>` envelope
- **THEN** the orchestrator SHALL reject the response
- **AND** the orchestrator SHALL request a retry with explicit formatting instructions

### Requirement: Per-agent JSON schema files
Each agent SHALL have a corresponding JSON schema file at `docs/opencode/prompts/contracts/<agent-name>.schema.json` that defines the shape of its response payload.

#### Scenario: Schema defines required fields
- **WHEN** a schema file is loaded for validation
- **THEN** it SHALL contain a `required` array listing mandatory fields
- **AND** it SHALL contain a `properties` object defining each field's type and description
- **AND** it SHALL contain a `responseTypes` object defining the structure for "success" and "failure" responses

#### Scenario: Schema validation passes
- **WHEN** a JSON payload contains all required fields with correct types
- **THEN** the validation SHALL return success

#### Scenario: Schema validation fails on missing field
- **WHEN** a JSON payload is missing a required field
- **THEN** the validation SHALL return an error listing each missing field

#### Scenario: Schema validation fails on type mismatch
- **WHEN** a JSON payload has a field with an incorrect type
- **THEN** the validation SHALL return an error identifying the field and expected type

### Requirement: Success and failure response formats
Each agent's schema SHALL define two response type structures: one for successful operations and one for failures/errors. Both formats SHALL share a common base of identifying fields (agent name, timestamp, response type).

#### Scenario: Success response structure
- **WHEN** an agent completes its task successfully
- **THEN** the JSON payload SHALL include `responseType: "success"`
- **AND** SHALL include the `status` field
- **AND** SHALL include agent-specific result fields

#### Scenario: Failure response structure
- **WHEN** an agent encounters an error or cannot complete its task
- **THEN** the JSON payload SHALL include `responseType: "failure"`
- **AND** SHALL include an `error` object with `code` and `message` fields
- **AND** SHALL NOT include success-specific fields
