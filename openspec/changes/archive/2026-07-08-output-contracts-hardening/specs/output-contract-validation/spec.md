# Output Contract Validation

## Purpose
Validate that every subagent response conforms to the output-contract XML envelope format and JSON schema. This capability ensures structured, verifiable communication between agents in the OpenSpec workflow.

## Requirements

### Requirement: Valid envelope and payload returns valid
The system SHALL validate a well-formed output-contract XML envelope containing valid JSON payload.

#### Scenario: Valid envelope with complete payload
- **WHEN** `validateContract` is called with a response containing `<output-contract agent="developer" version="1">` wrapping a JSON payload with all required fields and correct types
- **THEN** it returns `{valid: true, agent, version, errors: [], payload}` with the parsed payload object

#### Scenario: Valid envelope with caveman fields (auto-expansion)
- **WHEN** `validateContract` is called with an envelope containing compressed caveman fields (e.g., `s`, `d`, `da`)
- **THEN** caveman fields are auto-expanded to canonical names before validation and the result is `{valid: true}`

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

### Requirement: `expandCavemanFields` handles compressed + canonical key coexistence
The system SHALL prefer canonical keys when both compressed and canonical versions exist in the same payload.

#### Scenario: Both compressed and canonical present
- **WHEN** payload contains both `s: "failed"` and `status: "completed"`
- **THEN** `expandCavemanFields` preserves the canonical `status: "completed"` and emits a warning

#### Scenario: Only compressed keys
- **WHEN** payload contains only compressed keys (e.g., `s: "completed"`, `d: "done"`)
- **THEN** `expandCavemanFields` expands all to canonical names

#### Scenario: expandCaveman disabled
- **WHEN** `validateContract` is called with `{expandCaveman: false}`
- **THEN** compressed keys are NOT expanded and validation uses raw field names

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

### Requirement: Caveman + canonical edge cases
The system SHALL handle all edge cases when compressed caveman keys coexist with canonical keys.

#### Scenario: expandCaveman:false with collision ignored
- **WHEN** payload has both `s: "failed"` and `status: "completed"` AND `expandCaveman: false` is set
- **THEN** the validator does NOT expand anything and uses raw field names only; no collision resolution occurs

#### Scenario: Collision with different types
- **WHEN** payload has `s: "ok"` (string) and `status: true` (boolean) — type mismatch
- **THEN** the canonical `status: true` wins; collision warning is emitted; `s` is discarded

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
