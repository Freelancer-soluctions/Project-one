## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Hand-rolled validation functions
**Reason**: Replaced by Ajv JSON Schema validation
**Migration**: All existing `validatePayload`, `checkRequiredFields`, `checkTypes`, `validateObjectFields`, `validateResponseType`, `validateSuccessPayload`, `validateFailurePayload`, and `FORMAT_VALIDATORS` exports are removed. Use the Ajv-based `validateContract` orchestration instead — it produces functionally identical results with explicit sub-schema dispatch.

### Requirement: CAVEMAN_FIELD_MAP and expandCavemanFields
**Reason**: Caveman compression experiment concluded — $0.003/response savings not worth 79 lines of complexity
**Migration**: Remove `CAVEMAN_FIELD_MAP` and `expandCavemanFields` exports from contractValidator.js. Removal from test imports and assertion code. Replaced by prompt-level aliasing (instruct model to use full field names in prompts).
