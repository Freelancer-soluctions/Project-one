# Output Contract Validation

## Purpose
Validate that every subagent response conforms to the output-contract XML envelope format and JSON schema. This capability ensures structured, verifiable communication between agents in the OpenSpec workflow.
## Requirements
### Requirement: Valid envelope and payload returns valid
The system SHALL validate a well-formed output-contract XML envelope containing valid JSON payload.

#### Scenario: Valid envelope with complete payload
- **WHEN** `validateContract` is called with a response containing `<output-contract agent="developer" version="1">` wrapping a JSON payload with all required fields and correct types
- **THEN** it returns `{valid: true, agent, version, errors: [], payload}` with the parsed payload object

#### Scenario: Missing envelope returns invalid
- **WHEN** `validateContract` is called with plain text containing no XML envelope
- **THEN** it returns `{valid: false, errors: [{message: "Invalid or missing output-contract envelope"}]}`

#### Scenario: Malformed JSON inside envelope
- **WHEN** the envelope XML is valid but the inner content is not valid JSON
- **THEN** it returns `{valid: false}` with a parse error message

#### Scenario: Agent mismatch between envelope and expected
- **WHEN** the envelope declares `agent="developer"` but `validateContract` is called with `agentName="reviewer"`
- **THEN** it returns `{valid: false}` with an agent mismatch error

#### Scenario: Unknown agent degrades gracefully
- **WHEN** `validateContract` is called with an agent name that has no schema file
- **THEN** it returns `{valid: true, degraded: true}` with a warning

### Requirement: XML envelope parsing is tolerant of attribute variation
The system SHALL parse output-contract XML envelopes even when attribute quoting or ordering varies from the canonical form.

#### Scenario: Single-quoted attributes
- **WHEN** the envelope uses single quotes: `<output-contract agent='developer' version='1'>`
- **THEN** parsing succeeds with correct `agent` and `version`

#### Scenario: Reversed attribute order
- **WHEN** the envelope has reversed order: `<output-contract version="1" agent="developer">`
- **THEN** parsing succeeds with correct `agent` and `version`

#### Scenario: Trailing whitespace before closing bracket
- **WHEN** the envelope has trailing whitespace: `<output-contract agent="developer" version="1" >`
- **THEN** parsing succeeds with correct `agent` and `version`

#### Scenario: Missing closing tag
- **WHEN** the envelope has no `</output-contract>` closing tag
- **THEN** it throws `ContractParseError` with "Missing closing output-contract tag"

### Requirement: Nested object fields are validated recursively
The system SHALL validate nested object properties within the payload, not just top-level fields.

#### Scenario: Valid nested error block
- **WHEN** `validateFailurePayload` is called with `error: {code: "ERR1", message: "Failure"}` against a schema that requires `error.code` and `error.message`
- **THEN** it returns `{valid: true}`

#### Scenario: Missing required nested field
- **WHEN** `validateFailurePayload` is called with `error: {code: "ERR1"}` (missing `message`) against a schema requiring both
- **THEN** it returns `{valid: false}` with an error for `error.message`

#### Scenario: Nested field wrong type
- **WHEN** `validateFailurePayload` is called with `error: {code: 123, message: "Failure"}` where `code` should be string
- **THEN** it returns `{valid: false}` with a type mismatch error for `error.code`

### Requirement: Base schema fields are validated on payload
The system SHALL validate base fields (`agent`, `timestamp`, `responseType`, `version`) from `base.schema.json` on every payload.

#### Scenario: All base fields present pass
- **WHEN** payload contains `agent: "developer"`, `timestamp: "2025-01-15T10:30:00Z"`, `responseType: "success"`, `version: 1`
- **THEN** base field validation passes

#### Scenario: Missing required base field
- **WHEN** payload is missing `timestamp`
- **THEN** base field validation fails with a missing field error for `timestamp`

#### Scenario: Base field wrong type
- **WHEN** `version` is `"one"` instead of integer `1`
- **THEN** base field validation fails with a type mismatch error for `version`

### Requirement: `withRetry` accepts optional reissue callback
The system SHALL support a `reissue` callback parameter in `withRetry` so that each retry attempt uses a fresh response.

#### Scenario: withRetry without reissue returns reissueRequired
- **WHEN** `withRetry` is called without a `reissue` callback and validation fails
- **THEN** it returns `{shouldRetry: false, reissueRequired: true, validationErrors: [...], retryCount}` instead of `{exhausted: true}`

#### Scenario: withRetry with reissue retries fresh response
- **WHEN** `withRetry` is called with a `reissue: () => Promise<string>` callback that returns a new valid response on retry
- **THEN** after the first validation failure, it calls `reissue()` and validates the fresh response, eventually returning `{shouldRetry: false}` with the valid result

#### Scenario: withRetry exhausts reissue attempts
- **WHEN** `withRetry` is called with a `reissue` callback that keeps returning invalid responses and `maxRetries` is exceeded
- **THEN** it returns `{shouldRetry: false, exhausted: true, validationErrors: [...], retryCount}`

### Requirement: Null values are rejected for non-null types
The system SHALL reject `null` values for fields typed as `string`, `array`, `integer`, and `object`.

#### Scenario: null value for string field
- **WHEN** a payload has `status: null` where schema expects `type: "string"`
- **THEN** validation fails with a type mismatch error

#### Scenario: null value for object field
- **WHEN** a payload has `error: null` where schema expects `type: "object"`
- **THEN** validation fails with a type mismatch error (regression from `typeof null === 'object'`)

#### Scenario: null value for array field
- **WHEN** a payload has `nextSteps: null` where schema expects `type: "array"`
- **THEN** validation fails with a type mismatch error

#### Scenario: null value for integer field
- **WHEN** a payload has `version: null` where schema expects `type: "integer"`
- **THEN** validation fails with a type mismatch error

### Requirement: Format validation is enforced
The system SHALL validate `format` constraints declared in schemas (`format: uri`, `format: date-time`).

#### Scenario: Valid URI passes format check
- **WHEN** `cardUrl` has value `"https://trello.com/c/abc123"` against schema `{type: "string", format: "uri"}`
- **THEN** format validation passes

#### Scenario: Invalid URI fails format check
- **WHEN** `cardUrl` has value `"not a url"` against schema `{type: "string", format: "uri"}`
- **THEN** format validation fails

#### Scenario: Valid ISO 8601 timestamp passes
- **WHEN** `timestamp` has value `"2025-01-15T10:30:00Z"` against schema `{type: "string", format: "date-time"}`
- **THEN** format validation passes

#### Scenario: Invalid timestamp fails
- **WHEN** `timestamp` has value `"yesterday"` against schema `{type: "string", format: "date-time"}`
- **THEN** format validation fails

#### Scenario: Unknown format passes through gracefully
- **WHEN** a schema field declares `format: "email"` (or any format not in the supported set of `uri`, `date-time`)
- **THEN** format validation is skipped for that field and no error is raised

#### Scenario: Empty string for uri format
- **WHEN** `cardUrl` has value `""` (empty string) against schema `{type: "string", format: "uri"}`
- **THEN** format validation fails (empty string is not a valid URI)

#### Scenario: Missing value for format field
- **WHEN** a field with `format: "uri"` is missing from the payload entirely
- **THEN** the missing field error takes precedence; format validation is not reached

### Requirement: Base fields are re-validated at the JSON payload level
The system SHALL validate that `agent`, `timestamp`, `responseType`, and `version` exist in the parsed JSON payload even after the envelope regex has already extracted them.

#### Scenario: Payload missing agent in JSON
- **WHEN** the envelope regex extracts `agent="developer"` but the JSON payload omits `agent`
- **THEN** validation fails because `agent` is required at the JSON payload level

#### Scenario: Payload missing timestamp in JSON
- **WHEN** the envelope regex extracts a timestamp but the JSON payload omits `timestamp`
- **THEN** validation fails because `timestamp` is required at the JSON payload level

#### Scenario: Payload missing responseType in JSON
- **WHEN** the JSON payload omits `responseType`
- **THEN** validation fails because `responseType` is required at the JSON payload level

#### Scenario: Payload missing version in JSON
- **WHEN** the JSON payload omits `version`
- **THEN** validation fails because `version` is required at the JSON payload level

### Requirement: Degraded mode edge cases
The system SHALL gracefully handle agents without schema files by entering degraded mode.

#### Scenario: Unknown agent with missing schema returns degraded
- **WHEN** `validateContract` is called with an agent that has no `*.schema.json` file on disk
- **THEN** it returns `{valid: true, degraded: true, warning: "No schema found for agent '<name>' — validation degraded"}` and adds the agent to `DEGRADED_AGENTS`

#### Scenario: Repeated degraded agent does not duplicate warning
- **WHEN** the same unknown agent is validated twice
- **THEN** the second call still returns `{valid: true, degraded: true}` with the same warning; the agent remains in `DEGRADED_AGENTS`

### Requirement: Envelope content edge cases
The system SHALL handle edge cases in envelope content and parsing.

#### Scenario: Empty JSON object in envelope
- **WHEN** the envelope wraps an empty JSON object `{}`
- **THEN** validation returns errors for each missing required base field (agent, timestamp, responseType, version) since `base.schema.json` declares no defaults for any field

#### Scenario: Extra whitespace inside JSON
- **WHEN** the JSON payload has extra whitespace and newlines
- **THEN** JSON parsing succeeds; validation proceeds normally

#### Scenario: Null payload JSON
- **WHEN** the envelope wraps `null`
- **THEN** validation fails because the payload is not an object

#### Scenario: Array payload JSON
- **WHEN** the envelope wraps a JSON array `[]`
- **THEN** validation fails because the payload is not an object

#### Scenario: Nested object two levels deep
- **WHEN** payload has `deeply: {nested: {value: "test"}}` and the schema defines nested structure
- **THEN** the recursive object walker validates all levels

#### Scenario: Empty timestamp against date-time format
- **WHEN** a payload's `timestamp` field has value `""` (empty string) and the schema declares `{type: "string", format: "date-time"}`
- **THEN** format validation fails with `errors[].field = 'timestamp'` and `message = 'Invalid date-time format'`

### Requirement: Cross-field validation
The system SHALL detect structural issues that span multiple fields.

#### Scenario: Duplicate keys in payload
- **WHEN** the JSON payload contains duplicate keys (last-write-wins JSON behavior)
- **THEN** the last value is used; no error is raised by JSON.parse but the validator processes the parsed object

### Requirement: Runtime enforcement
The system SHALL invoke `validateContract` on every subagent response received by the orchestrator before downstream parsing.

#### Scenario: Subagent response validated by orchestrator
- **WHEN** the orchestrator receives a subagent response (any agent)
- **THEN** `validateContract(rawResponse, agentName)` is invoked before downstream parsing
- **AND THEN** if `{valid:false}`, the orchestrator does NOT propagate the broken response — it either retries via `withRetry({reissue})` or surfaces an error to the user

#### Scenario: Valid response passes through
- **WHEN** the orchestrator receives a `{valid:true}` response
- **THEN** parsing continues normally and downstream workflow state transitions as before

#### Scenario: Validator unavailable (degraded mode at runtime)
- **WHEN** `validateContract` returns `{valid:true, degraded:true, warning: 'No schema for agent X'}`
- **THEN** the orchestrator continues with a console.warn but does not BLOCK

### Requirement: Tests are runnable
The system SHALL support running contract validator tests via `npm test` in the contracts directory.

#### Scenario: Tests are runnable
- **WHEN** `npm test` is run inside `docs/opencode/prompts/contracts/`
- **THEN** vitest executes successfully and all existing + new tests pass
- **AND THEN** `npm run coverage` produces a coverage report for contractValidator.js

### Requirement: Hand-rolled validation replaced by Ajv
The system SHALL replace all hand-rolled type-checking, required-field, format-validation, and nested-object validation with Ajv (JSON Schema validator).

#### Scenario: Required fields validated via JSON Schema
- **WHEN** a payload is validated against a schema with `required` fields
- **THEN** each missing required field SHALL produce an error with `field` set to the missing field name and `message` set to Ajv's default error message

#### Scenario: Type checking via JSON Schema
- **WHEN** a payload field has a type mismatch (e.g., string field receives a number)
- **THEN** Ajv SHALL produce an error with `field` set to the field path and a type-mismatch message

#### Scenario: Nested object validation (recursive)
- **WHEN** a payload contains nested objects (e.g., `error.code`, `error.message`)
- **THEN** Ajv SHALL validate all nested properties according to the schema, using dot-notation field paths (e.g., `error.code`)

#### Scenario: Array item type validation
- **WHEN** a payload contains an array with typed items (e.g., `filesChanged: { type: 'array', items: { type: 'string' } }`)
- **THEN** Ajv SHALL validate each array item's type and report errors with indexed paths (e.g., `filesChanged[0]`)

#### Scenario: Null rejection for non-nullable fields
- **WHEN** a payload field is `null` but the schema expects a non-null type (e.g., `{ type: 'string' }`)
- **THEN** Ajv SHALL produce an error with the field path and a message matching `must be <type>`

### Requirement: uri and date-time format validation via ajv-formats
The system SHALL use `ajv-formats` for native `uri` and `date-time` format validation instead of hand-rolled regex validators.

#### Scenario: uri format validated
- **WHEN** a string field has `format: 'uri'` in the schema
- **THEN** ajv-formats SHALL validate the field value against the URI format specification, rejecting invalid URIs

#### Scenario: date-time format validated
- **WHEN** a string field has `format: 'date-time'` in the schema
- **THEN** ajv-formats SHALL validate the field value against RFC 3339 date-time format, rejecting malformed date-times

### Requirement: responseTypes custom keyword handled as no-op
The system SHALL register `responseTypes` as a no-op custom keyword so Ajv does not reject schemas containing this conventional branching marker.

#### Scenario: Schema with responseTypes compiles without error
- **WHEN** `ajv.addKeyword({ keyword: 'responseTypes', validate: () => true, errors: false })` is called at module init
- **THEN** any schema containing `responseTypes` SHALL compile without Ajv errors

#### Scenario: responseTypes not validated by Ajv
- **WHEN** a payload is validated against a schema containing `responseTypes`
- **THEN** Ajv SHALL ignore the `responseTypes` keyword and not produce validation errors for it
- **AND** the `validateContract` orchestrator SHALL still perform success/failure dispatch based on `payload.responseType`

### Requirement: Success/failure sub-schema compilation and dispatch
The system SHALL compile `responseTypes.success` and `responseTypes.failure` as separate Ajv validators and dispatch validation based on `payload.responseType`.

#### Scenario: Success sub-schema compiled and dispatched
- **WHEN** `payload.responseType === 'success'`
- **AND** `schema.responseTypes.success` exists
- **THEN** the system SHALL compile `schema.responseTypes.success` as a separate Ajv validator, cached as `${agentName}_success`
- **AND** after base payload validation passes, validate the payload against this success sub-schema
- **AND** aggregate errors from both base and sub-schema validations

#### Scenario: Failure sub-schema compiled and dispatched
- **WHEN** `payload.responseType === 'failure'`
- **AND** `schema.responseTypes.failure` exists
- **THEN** the system SHALL compile `schema.responseTypes.failure` as a separate Ajv validator, cached as `${agentName}_failure`
- **AND** after base payload validation passes, validate the payload against this failure sub-schema
- **AND** aggregate errors from both base and sub-schema validations

#### Scenario: Missing sub-schema is skipped gracefully
- **WHEN** `payload.responseType` is set to `'success'` or `'failure'`
- **BUT** no corresponding sub-schema exists in `schema.responseTypes`
- **THEN** the system SHALL skip sub-schema validation (backward compatibility with existing agents that may not define responseTypes sub-schemas)

#### Scenario: Cache cleared on clearDegraded for all variants
- **WHEN** `clearDegraded(agentName)` is called
- **THEN** the base validator, success sub-schema validator, and failure sub-schema validator for that agent SHALL all be cleared

### Requirement: $ref resolution via ajv.addSchema
The system SHALL support external `$ref` references (e.g., `$ref: "base.schema.json"`) by pre-registering referenced schemas with Ajv.

#### Scenario: Agent schema with $ref to base schema resolves
- **WHEN** an agent schema contains `$ref: "base.schema.json"`
- **AND** `base.schema.json` has been pre-registered via `ajv.addSchema(baseSchema, 'base.schema.json')`
- **THEN** the compiled validator SHALL resolve the `$ref` and apply base schema validation rules

### Requirement: Validator caching
The system SHALL cache compiled Ajv validate functions to avoid repeated schema compilation overhead.

#### Scenario: Compiled validators are cached
- **WHEN** `validateContract` is called multiple times for the same agent
- **THEN** the compiled Ajv validate function SHALL be reused from the cache after the first compilation

#### Scenario: Cache is cleared on clearDegraded
- **WHEN** `clearDegraded(agentName)` is called
- **THEN** both `schemaCache` and `validatorCache` entries for that agent SHALL be cleared

### Requirement: Ajv errors mapped to {field, message} format
The system SHALL convert Ajv error objects to the orchestrator's `{field, message}` format.

#### Scenario: instancePath converted to dot notation
- **WHEN** Ajv produces an error with `instancePath: '/error/code'`
- **THEN** the mapped error SHALL have `field: 'error.code'`
- **AND** `message` SHALL be the Ajv error message verbatim

#### Scenario: Required-field errors use params.missingProperty
- **WHEN** Ajv produces a `required` error
- **THEN** `instancePath` may be empty for top-level required field errors
- **AND** the mapped error SHALL use `e.params.missingProperty` as the field name

#### Scenario: Additional property errors use params.additionalProperty
- **WHEN** Ajv produces an `additionalProperties` error
- **THEN** the mapped error SHALL use `e.params.additionalProperty` as the field name
- **AND** the message SHALL include the additional property name (e.g., `must NOT have additional property: extraField`)

### Requirement: Plugin Hook Registration
The system SHALL register an OpenCode plugin at `.opencode/plugins/output-contracts.ts` that hooks into `tool.execute.after` to validate subagent output contracts programmatically.

#### Scenario: Plugin loads at OpenCode startup
- **WHEN** OpenCode starts and `.opencode/plugins/output-contracts.ts` exists
- **THEN** the plugin registers a `tool.execute.after` hook
- **AND** no console error is emitted unless the plugin file is malformed

#### Scenario: Validator import failure is non-fatal
- **WHEN** the dynamic import of `contractValidator.js` fails (file moved, ajv missing, etc.)
- **THEN** the plugin logs `console.error` with FATAL prefix and the failing path
- **AND** returns a no-op validator that always reports `{ valid: true, degraded: true }`
- **AND** no session crashes as a result

### Requirement: Subagent Completion Hook Firing
The hook SHALL fire only for `tool.execute.after` events where `input.tool === "task"` and ignore all other tool invocations.

#### Scenario: Hook fires for task tool
- **WHEN** a subagent completes via the `task` tool
- **THEN** the hook is invoked with `input.tool === "task"`, `input.args.subagent_type` set to the agent name, `output.output` containing the subagent final message wrapped in `<task_result>...</task_result>`

#### Scenario: Hook ignores non-task tools
- **WHEN** tools such as bash, read, write, edit, glob, grep fire their `tool.execute.after`
- **THEN** the plugin returns immediately without running validation

#### Scenario: Task_result format change causes graceful fallback
- **WHEN** `output.output` does not match the expected `<task_result>...</task_result>` format (e.g., OpenCode format changed upstream)
- **THEN** the plugin logs a `console.warn` with the unrecognized format
- **AND** falls back to no-validation mode (no audit log entry, no metadata annotation)
- **AND** the session continues without crash

### Requirement: Valid Contract Handling
When the subagent's envelope passes validation, the plugin SHALL NOT log or annotate.

#### Scenario: Valid contract
- **WHEN** `validateContract(subagentMessage, agentName)` returns `{ valid: true, degraded: false }`
- **THEN** no entry is written to `.opencode/logs/contract-audit.jsonl`
- **AND** `output.metadata.contractValidation` is NOT set
- **AND** in-memory telemetry counter for the agent's `total` is incremented by 1
- **AND** `failed` counter is NOT incremented

#### Scenario: Degraded contract (schema file missing)
- **WHEN** `validateContract(...)` returns `{ valid: true, degraded: true }`
- **THEN** no audit log entry is written (degraded is not failure)
- **AND** `output.metadata` is NOT annotated
- **AND** in-memory telemetry `total` increments, `failed` does not

### Requirement: Invalid Contract Audit Logging
When the subagent's envelope fails validation, the plugin SHALL write a JSONL entry to `.opencode/logs/contract-audit.jsonl` and increment telemetry counters.

#### Scenario: Audit log entry written
- **WHEN** `validateContract(...)` returns `{ valid: false, errors: [...] }`
- **THEN** a JSONL line is appended to `.opencode/logs/contract-audit.jsonl` with fields:
  - `timestamp`: ISO 8601 string
  - `agent`: the subagent_type string
  - `task`: the output.title or "(unknown task)"
  - `sessionId`: the input.sessionID
  - `callId`: the input.callID
  - `validationErrors`: array of {field, message} from verdict.errors
  - `retryCount`: 0 (no retry from hook)
  - `degraded`: false
- **AND** in-memory telemetry `total++ failed++` for the agent
- **AND** `console.warn` is emitted with summary "[output-contracts] FAILED: @${agent} returned malformed output contract. N error(s). Task: '...'. See .opencode/logs/contract-audit.jsonl"

#### Scenario: Audit log write failure is non-fatal
- **WHEN** `fs.appendFileSync` throws (permission denied, disk full, etc.)
- **THEN** the error is caught and logged via `console.error`
- **AND** the session continues without crash
- **AND** telemetry counters are still incremented (audit logic runs before disk write attempt)

### Requirement: Metadata Annotation for Layer 3
The plugin SHALL set `output.metadata.contractValidation` when validation fails, enabling Layer 3 (orchestrator.md) to programmatically detect and escalate.

#### Scenario: Metadata set on failure
- **WHEN** `validateContract(...)` returns `{ valid: false }`
- **THEN** `output.metadata.contractValidation` is set to:
  ```json
  {
    "valid": false,
    "agent": "<agent_name>",
    "version": <envelope_version>,
    "errors": [{"field": "...", "message": "..."}],
    "degraded": false
  }
  ```
- **IF** `output.metadata` was previously null/undefined, it is initialized to `{}`
- **IF** metadata propagation to parent agent context fails (tested separately), the plugin falls back to JSONL-only mode — the audit log entry is still written regardless

#### Scenario: Metadata propagation fallback mode
- **WHEN** `output.metadata.contractValidation` does not reach the parent agent's context (e.g., an OpenCode version regression introduces MCP-shape behavior for the `task` tool, removing metadata propagation)
- **THEN** the plugin continues to write JSONL audit log entries (these are guaranteed by direct `fs.appendFileSync` calls, independent of metadata propagation)
- **AND** `console.warn` is still emitted on validation failures
- **AND** the Layer 3 (orchestrator escalation) route is documented as degraded but not broken (orchestrator can still parse the audit log if configured to do so)
- **AND** Task 3.2 documents the specific failure mode observed (e.g., "metadata not propagated; falling back to JSONL-only mode")

### Requirement: Output Non-Mutation
The plugin SHALL NOT mutate `output.output` regardless of validation result. Layer 2 is observe-only.

#### Scenario: Valid contract — output unchanged
- **WHEN** validation passes
- **THEN** `output.output` string is identical to its pre-hook value

#### Scenario: Invalid contract — output unchanged
- **WHEN** validation fails
- **THEN** `output.output` string is identical to its pre-hook value
- **AND** the audit log entry and metadata annotation are the only side effects

#### Scenario: Rationale documented in plugin source
- **WHEN** a developer reads `.opencode/plugins/output-contracts.ts` source
- **THEN** they find a comment block explaining: (1) validator reports what's wrong but not the correct value, (2) `<task_result>` wrapper must be preserved for parent-agent parsing, (3) Layer 1 self-validation handles correction via retry, (4) Layer 3 orchestrator can re-delegate on metadata.contractValidation signal

### Requirement: Telemetry Counters
The plugin SHALL maintain in-memory telemetry counters per agent name, providing observability of contract validation failure rates.

#### Scenario: Telemetry counters increment per task tool invocation
- **WHEN** the `task` tool completes for a given `subagent_type`
- **THEN** `telemetry[subagent_type].total` increments by 1
- **IF** validation fails, `telemetry[subagent_type].failed` also increments by 1

#### Scenario: Telemetry counters are in-memory (no persistence)
- **WHEN** OpenCode restarts or plugin is reloaded
- **THEN** all telemetry counters reset to empty state (`{}`)
- **AND** the JSONL audit log remains the persistent record (not reset)

#### Scenario: Concurrent delegations are thread-safe
- **WHEN** multiple `task` tool calls complete in quick succession across different agents (e.g., developer, researcher, git-manager)
- **THEN** telemetry counters for each agent are independent
- **AND** `fs.appendFileSync` calls serialize safely on Node.js (single-threaded event loop, atomic for small writes)

## REMOVED Requirements

### Requirement: Hand-rolled validation functions
**Reason**: Replaced by Ajv JSON Schema validation
**Migration**: All existing `validatePayload`, `checkRequiredFields`, `checkTypes`, `validateObjectFields`, `validateResponseType`, `validateSuccessPayload`, `validateFailurePayload`, and `FORMAT_VALIDATORS` exports are removed. Use the Ajv-based `validateContract` orchestration instead — it produces functionally identical results with explicit sub-schema dispatch.

### Requirement: CAVEMAN_FIELD_MAP and expandCavemanFields
**Reason**: Caveman compression experiment concluded — $0.003/response savings not worth 79 lines of complexity
**Migration**: Remove `CAVEMAN_FIELD_MAP` and `expandCavemanFields` exports from contractValidator.js. Removal from test imports and assertion code. Replaced by prompt-level aliasing (instruct model to use full field names in prompts).
