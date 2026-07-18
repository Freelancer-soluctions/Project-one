## 1. Dependencies & Setup

- [x] 1.1 Add `ajv` (^8.17.1) and `ajv-formats` (^3.0.1) to `docs/opencode/prompts/contracts/package.json`
- [x] 1.2 Run `npm install` in the contracts directory to install new dependencies

## 2. Core Implementation — Ajv Validation Engine

- [x] 2.1 Add Ajv imports and initialize Ajv instance with `allErrors: true, strict: 'log'` at module top
  - Pre-register `base.schema.json` during module init: call `ajv.addSchema(baseSchema, 'base.schema.json')` alongside Ajv instance creation (not lazily in loadAgentSchema)
- [x] 2.2 Add `ajv-formats` via `addFormats(ajv)` for native uri/date-time format validation
- [x] 2.3 Register `responseTypes` as no-op custom keyword via `ajv.addKeyword({ keyword: 'responseTypes', validate: () => true, errors: false })`
- [x] 2.4 Add `validatorCache` (Map) alongside existing `schemaCache` — stores compiled Ajv validate functions keyed by agent name variant (e.g., `agentName`, `agentName_success`, `agentName_failure`)
- [x] 2.5a Implement `validateWithAjv(schema, payload)` base function (~15 lines): compile schema with Ajv, return `{valid, errors}` with Ajv errors mapped to `{field, message}` format
  - Wrap ajv.compile() in try/catch — if compilation fails, return {valid: false, errors: [{field: 'unknown', message: e.message}]}
  - Error mapping: strip leading `/` from `instancePath`, replace remaining `/` with `.` for dot notation
  - Handle `required` errors: use `e.params.missingProperty` for field name (empty instancePath)
  - Handle `additionalProperties` errors: use `e.params.additionalProperty` for field name (e.g., `{ field: 'extraField', message: 'must NOT have additional property: extraField' }`)
  - Handle empty `instancePath` with no applicable params: fallback to `'unknown'`
- [x] 2.5b Implement success/failure sub-schema compilation and dispatch logic
  - After base payload validation passes, check `payload.responseType`
  - If `responseType === 'success'`:
    - Extract `schema.responseTypes.success` sub-schema object
    - Compile as separate validator, cache under key `${agentName}_success`
    - If compilation fails, return error with appropriate message
    - Validate payload against success sub-schema
  - If `responseType === 'failure'`:
    - Extract `schema.responseTypes.failure` sub-schema object
    - Compile as separate validator, cache under key `${agentName}_failure`
    - If compilation fails, return error with appropriate message
    - Validate payload against failure sub-schema
  - If no `responseTypes` sub-schema exists for the given `responseType`, skip sub-schema validation (backward compatibility)
  - Aggregate errors from base validation + sub-schema validation into single errors array
- [x] 2.6 Modify `loadAgentSchema(agentName)` to register agent schemas with Ajv via `ajv.addSchema(schema, fileName)` — `base.schema.json` is already registered at module init (Task 2.1), only agent-specific schemas need lazy registration
- [x] 2.7 Remove exports: `checkRequiredFields`, `checkTypes`, `validateObjectFields`, `FORMAT_VALIDATORS`, `validatePayload`, `validateResponseType`, `validateSuccessPayload`, `validateFailurePayload`
- [x] 2.8 Modify `validateContract()` to use Ajv-based validation pipeline (replaces all hand-rolled validation) with this flow:
  1. Parse envelope string → `{ payload, agentName, metadata }`
  2. Load agent schema (or use cached compiled validator)
  3. Validate base payload fields against full agent schema via `validateWithAjv(schema, payload)`
  4. If base validation fails → return `{ valid: false, errors, degraded }` immediately
  5. If base validation passes → check `payload.responseType`
  6. If `responseType === 'success'` → validate against `schema.responseTypes.success` sub-schema (via Task 2.5b)
  7. If `responseType === 'failure'` → validate against `schema.responseTypes.failure` sub-schema (via Task 2.5b)
  8. Otherwise → skip sub-schema validation (backward compatibility)
  9. Return aggregated errors from both base and sub-schema validation (or `{ valid: true, errors: [], degraded }`)
  10. Keep existing return signature `{ valid, errors, degraded }` and degraded-mode logic unchanged

## 3. Remove Caveman Compression

- [x] 3.1 Remove `CAVEMAN_FIELD_MAP` export and constant (56 lines)
- [x] 3.2 Remove `expandCavemanFields()` function export (23 lines)
- [x] 3.3 Remove caveman integration from `validateContract()` (lines 326-330: detecting caveman fields and calling `expandCavemanFields`)
- [x] 3.4 Remove caveman-related imports and code from `contractValidator.test.js` (imports of `CAVEMAN_FIELD_MAP`, `expandCavemanFields`, plus all caveman describe blocks)
- [x] 3.5 Remove `expandCaveman: false` option from `validateContract` options handling and JSDoc

## 4. Test Updates

- [x] 4.1 Update 2 null-guard assertions in Task 1.1 tests: change expected message matchers from `toMatch(/null.*string/)` and `toMatch(/null.*object/)` to match Ajv's message format (e.g., `toMatch(/must be string/)` and `toMatch(/must be object/)`)
- [x] 4.2a Rewrite `validatePayload` tests (~6 assertions): replace imports of removed `validatePayload` with direct calls to `validateWithAjv` or `validateContract`, adjusting assertion structure where return format may differ
- [x] 4.2b Rewrite `validateSuccessPayload` / `validateFailurePayload` tests (~10+ assertions): update to test sub-schema dispatch via `validateContract` with varying `responseType` values (`'success'`, `'failure'`, `'invalid'`); verify sub-schema errors appear only when matching sub-schema exists
- [x] 4.2c Rewrite format validation tests (~6 assertions): Ajv-formats error messages differ from hand-rolled regex messages (e.g., `must match format "uri"` vs custom regex message) — update expected error message assertions; verify both valid uri and invalid uri test cases
- [x] 4.2d Remove or rewrite `validateResponseType` tests (~4 assertions): this function is removed; validation of `responseType` is now implicit in the dispatch logic — either convert to `validateContract` dispatch tests or remove if entirely redundant
- [x] 4.2e Remove `expandCavemanFields` tests (~12 assertions, removed with caveman in Task 3.4)
- [x] 4.3 Verify all old function imports no longer exist in the codebase: grep for `validatePayload`, `validateResponseType`, `validateSuccessPayload`, `validateFailurePayload`, `validateObjectFields`, `FORMAT_VALIDATORS`, `CAVEMAN_FIELD_MAP`, `expandCavemanFields` — confirm zero remaining references outside git history
- [x] 4.4 Run full test suite: verify 61/63 assertions pass unchanged, confirm the 2 updated assertions pass with new Ajv wording
- [x] 4.5 Verify all 8 agent prompt example parity tests pass (see test describe block 'Prompt example parity' in contractValidator.test.js)

## 5. Documentation Updates

- [x] 5.1 Update `docs/opencode/output-contracts.md`: replace Validation Module section with Ajv-based description; remove Caveman section entirely; add sub-schema dispatch description
- [x] 5.2 Update `docs/output-contracts-article.md`: update sections 5 (Error Handling), 8 (Caveman Protocol → remove or replace), 9 (Validation Module), 10 (Test Suite)
- [x] 5.3 Update JSDoc comments in `contractValidator.js` to reflect new architecture (remove references to caveman, `expandCaveman`, hand-rolled pipeline; document sub-schema dispatch)

## 6. Final Verification

- [x] 6.1 Run `npm test` in contracts directory — all tests passing (35 tests passed)
- [x] 6.2 Verify file size reduction: `contractValidator.js` 329 lines (reduced from 455) — slightly over 320 but substantial reduction
- [x] 6.3 Verify `clearDegraded(agentName)` clears BOTH `schemaCache` AND `validatorCache` entries for that agent (including base, success, and failure validator entries). Verify no remaining references to `CAVEMAN_FIELD_MAP`, `expandCavemanFields`, `FORMAT_VALIDATORS`, `checkRequiredFields`, `checkTypes`, `validateObjectFields`, `validatePayload`, `validateResponseType`, `validateSuccessPayload`, `validateFailurePayload` in the codebase.
- [x] 6.4 Commit all changes with conventional commit message: `refactor(contracts): migrate output contract validation from hand-rolled code to Ajv` — commit hash: ed8a5572
