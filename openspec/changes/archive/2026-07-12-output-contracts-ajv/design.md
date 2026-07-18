## Context

contractValidator.js (455 lines) currently implements validation through 12 hand-rolled functions: checkRequiredFields, checkTypes, validateObjectFields, validatePayload, validateResponseType, validateSuccessPayload, validateFailurePayload, FORMAT_VALIDATORS (uri/date-time regexes), plus caveman support via CAVEMAN_FIELD_MAP and expandCavemanFields.

Research confirmed that Ajv (v8) with ajv-formats (v3) can replace all hand-rolled validation with ~30 lines of wrapper code while keeping all existing behavior intact:

- External `$ref: "base.schema.json"` resolves correctly via ajv.addSchema(baseSchema, "base.schema.json")
- responseTypes custom keyword: ignored as no-op via ajv.addKeyword({ keyword: "responseTypes", validate: () => true, errors: false })
- Error mapping converts Ajv instancePath (JSON Pointer /status to status) to orchestrator {field, message} format
- allErrors: true + ajv-formats handles uri/date-time natively
- Success/failure sub-schemas compiled as separate validators, dispatched based on payload.responseType
- Only 2 test assertions break (null-guard message wording); ~28 assertions need test infrastructure updates

The caveman compression experiment is also being dropped: ~$0.003/response savings not worth 79 lines of complexity. Replaced by prompt-level aliasing (instruct model to use full names).

## Goals / Non-Goals

**Goals:**
- Replace all hand-rolled validation with Ajv JSON Schema validation
- Implement explicit success/failure sub-schema compilation and dispatch
- Remove CAVEMAN_FIELD_MAP and expandCavemanFields entirely
- Keep all existing exported API signatures unchanged
- Keep orchestration functions (parseContractEnvelope, withRetry, createEscalationReport, isDegraded/clearDegraded) unchanged
- Maintain functional equivalence: 61 of 63 existing test assertions pass unchanged
- Reduce contractValidator.js from 455 to ~310 lines (-32%)

**Non-Goals:**
- Not changing the JSON Schema files themselves (schemas stay the same)
- Not changing the envelope parsing regex
- Not changing the retry or escalation logic
- Not touching any other file outside the contracts directory and documentation
## Decisions

### Decision 1: Ajv v8 + ajv-formats v3 over hand-rolled validation
- **Chosen**: ajv ^8.17.1 + ajv-formats ^3.0.1
- **Rationale**: Industry-standard JSON Schema validator (30M+ weekly downloads). Handles required fields, type checking, nested objects, arrays, format validation (uri, date-time), and $ref resolution natively. Eliminates 12 hand-rolled validation functions.
- **Alternatives considered**:
  - **Hand-rolled (current)**: 79 lines of fragile type-checking logic. Regex-based FORMAT_VALIDATORS for uri/date-time need maintenance.
  - **@cfworker/json-schema**: Lighter but less mature, no built-in format support.
  - **jsonschema**: Older library, less maintained, no allErrors mode by default.

### Decision 2: register schemas via ajv.addSchema() for $ref resolution
- **Chosen**: Call ajv.addSchema(schema, "base.schema.json") at module init, then register agent schemas lazily on load
- **Rationale**: Agent schemas use $ref: "base.schema.json" for shared base fields. Ajv requires referenced schemas pre-registered with URI key matching $ref target.
- **Impact**: loadAgentSchema() modified to register schemas with Ajv after loading from disk. Base schema registered once at module start.

### Decision 3: responseTypes as no-op custom keyword
- **Chosen**: ajv.addKeyword({ keyword: "responseTypes", validate: () => true, errors: false })
- **Rationale**: responseTypes is a conventional branching marker (success/failure payloads), not a JSON Schema keyword. Handled logically in validateContract().
- **Impact**: Single addKeyword call at module init.

### Decision 4: Ajv error mapping format
- **Chosen**: { field: e.instancePath.replace(/^\//, "").replace(/\//g, "."), message: e.message }
- **Rationale**: Ajv instancePath is JSON Pointer (e.g., /error/code). Orchestrator uses dot notation (e.g., error.code).
- **Edge cases**:
  - Top-level errors have empty instancePath -- handled by params.missingProperty fallback
  - additionalProperties errors -- handled by params.additionalProperty fallback
  - Unknown field errors -- "unknown" fallback

### Decision 5: Drop caveman compression
- **Chosen**: Remove CAVEMAN_FIELD_MAP (56 lines), expandCavemanFields() (23 lines), caveman integration in validateContract()
- **Rationale**: Saves ~$0.003/response but adds 79 lines of complexity. Replaced with prompt-level aliasing.
- **Impact**: Remove caveman-related tests (~12 assertions, 78 lines), caveman sections from documentation.

### Decision 6: Keep schemaCache and add validatorCache
- **Chosen**: schemaCache (raw JSON schemas) + validatorCache (compiled Ajv validate functions)
- **Rationale**: Raw schemas for degraded-mode warnings. Compiled validators for performance.
- **Impact**: Both caches cleared on clearDegraded(). Cache keys: agentName (base), agentName_success, agentName_failure.

### Decision 7: Success/failure sub-schema compilation and dispatch
- **Chosen**: Compile schema.responseTypes.success and .failure as separate Ajv validators, dispatched by payload.responseType after base passes
- **Rationale**: Orchestrator must validate payload against respective sub-schema after base validation. Separate validators keep each focused and allow independent caching.
- **Implementation pattern**:
  1. Base payload passes full schema validation (responseTypes as no-op)
  2. If base valid, check payload.responseType
  3. If success, compile/cache schema.responseTypes.success as ${agentName}_success, validate
  4. If failure, compile/cache schema.responseTypes.failure as ${agentName}_failure, validate
  5. If no matching sub-schema, skip (backward compatibility)
  6. Aggregate errors from both stages
- **Impact**: validateContract() gains dispatch step. validatorCache stores up to 3 validators per agent.

## Risks / Trade-offs

- [**Dependency addition**] ajv + ajv-formats adds ~200KB to node_modules. No runtime performance impact.
- [**Message wording change**] 2 assertions check null-rejection messages. Ajv messages differ (must be string vs hand-rolled).
- [**Custom keyword future**] If JSON Schema adds responseTypes keyword, no-op could mask errors. Extremely unlikely.
- [**$ref resolution edge case**] Missing schema file causes Ajv to throw during compilation. Handled by error catching in validateContract.
- [**Sub-schema complexity**] ~10 additional lines in validateContract. Straightforward branching.

## Migration Plan

1. Add ajv and ajv-formats to package.json
2. Implement base validateWithAjv(schema, payload) -- compile schema with Ajv, return {valid, errors}
3. Implement success/failure sub-schema compilation and dispatch logic
4. Modify loadAgentSchema() to register schemas with Ajv
5. Add responseTypes custom keyword as no-op
6. Add ajv-formats for native uri/date-time format validation
7. Modify validateContract() to use Ajv-based validation pipeline with sub-schema dispatch
8. Remove CAVEMAN_FIELD_MAP, expandCavemanFields(), caveman integration
9. Update tests: 2 null-guard assertions, rewrite ~28 assertions across 5 categories, remove caveman tests
10. Update output-contracts.md documentation
11. Update output-contracts-article.md documentation
12. Run full test suite to verify 61/63 assertions pass unchanged
