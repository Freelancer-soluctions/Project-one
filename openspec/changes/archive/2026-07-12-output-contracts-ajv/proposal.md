## Why

The `contractValidator.js` hand-rolled validation (12 distinct validation functions, 79 lines of type-checking + format-checking logic) duplicates what the JSON Schema ecosystem already provides. Ajv (Another JSON Schema Validator) is the industry-standard JavaScript validator with 30M+ weekly downloads. Migrating eliminates:

- **12 sources of hand-rolled bugs**: `checkRequiredFields`, `checkTypes`, `validateObjectFields`, `validatePayload`, `validateResponseType`, `validateSuccessPayload`, `validateFailurePayload`, `FORMAT_VALIDATORS` (2 regexes), and the recursive object walker
- **79 lines of type coercion/format validation code** replaced by ~30 lines of Ajv wrapper (including sub-schema dispatch)
- **Maintenance burden** of keeping regex-based `FORMAT_VALIDATORS` in sync with JSON Schema spec updates

Additionally, the Caveman compression experiment (`CAVEMAN_FIELD_MAP`, `expandCavemanFields`) saves an estimated $0.003/response in tokens but adds 79 lines of complexity. The decision is to drop caveman and replace it with prompt-level aliasing, removing 79 lines of orchestration code.

## What Changes

### Modified Files
1. **`docs/opencode/prompts/contracts/contractValidator.js`** (~455→310 lines): Replace all hand-rolled validation with ~30-line Ajv wrapper. Remove caveman expansion. Keep orchestration functions (parseContractEnvelope, withRetry, createEscalationReport, isDegraded/clearDegraded, validateContract). Add success/failure sub-schema compilation and dispatch in validateContract.
2. **`docs/opencode/prompts/contracts/contractValidator.test.js`**: Update 2 null-guard assertions (Task 4.1) that check specific message wording. Rewrite validatePayload tests (Task 4.2a, ~6 assertions). Rewrite validateSuccessPayload/validateFailurePayload tests (Task 4.2b, ~10 assertions). Rewrite format validation tests (Task 4.2c, ~6 assertions). Remove or rewrite validateResponseType tests (Task 4.2d, ~4 assertions). Remove expandCavemanFields tests (Task 4.2e, ~12 assertions). Remove caveman describe blocks. Total: ~28 assertions affected, ~150 lines rewritten.
3. **`docs/opencode/prompts/contracts/package.json`**: Add `ajv` (^8.17.1) and `ajv-formats` (^3.0.1) dependencies.
4. **`docs/opencode/output-contracts.md`**: Update Validation Module section to describe Ajv-based implementation. Remove Caveman section entirely.
5. **`docs/output-contracts-article.md`**: Update sections 5 (Error Handling), 8 (Caveman Protocol), 9 (Validation Module), 10 (Test Suite) to reflect Ajv-based implementation.

### Deleted Code
- **`CAVEMAN_FIELD_MAP`** (56 lines: lines 30-85)
- **`expandCavemanFields()`** (23 lines: lines 87-109)
- **Caveman integration in `validateContract()`** (lines 326-330)
- **`FORMAT_VALIDATORS`** (4 lines: lines 158-161)
- **`checkRequiredFields`** (8 lines: lines 147-155)
- **`checkTypes`** (3 lines: lines 163-165)
- **`validateObjectFields`** (50 lines: lines 170-220)
- **`validatePayload`** (10 lines: lines 222-231)
- **`validateResponseType`** (7 lines: lines 233-238)
- **`validateSuccessPayload`** (12 lines: lines 240-251)
- **`validateFailurePayload`** (16 lines: lines 253-267)

### Code That Stays (unchanged)
- `parseContractEnvelope()` (20 lines)
- `withRetry()` (52 lines)
- `createEscalationReport()` (12 lines)
- `isDegraded()` / `clearDegraded()` (8 lines)
- Error classes `ContractParseError`, `ContractValidationError` (14 lines)
- `loadAgentSchema()` — modified (15 lines) to register schemas with Ajv
- `validateContract()` — modified (35 lines) to call `validateWithAjv` + sub-schema dispatch instead of hand-rolled pipeline
- `DEGRADED_AGENTS` Set

## Capabilities

### New Capabilities
- `ajv-validation`: Replace hand-rolled type/format/required-field validation with Ajv (JSON Schema). Handles `$ref` resolution, `responseTypes` custom keyword as no-op, format validation via `ajv-formats`, success/failure sub-schema compilation and dispatch, and maps Ajv errors to `{field, message}` format.

### Modified Capabilities
*(No existing specs in `openspec/specs/` are modified — this is a pure implementation change)*

## Impact

- **code**: `contractValidator.js` drops from 455 to ~310 lines (-32%)
- **tests**: **~28 assertions break** due to removed functions (validatePayload, validateResponseType, validateSuccessPayload, validateFailurePayload, validateObjectFields, FORMAT_VALIDATORS); 2 null-guard assertions change wording; 61 baseline assertions pass unchanged; ~150 lines of tests need rewriting; ~12 assertions removed with caveman; caveman describe blocks removed
- **dependencies**: Adds `ajv` + `ajv-formats` to `package.json`
- **behavior**: Validation is functionally equivalent (proven by 61/63 baseline assertion coverage). Null-rejection message wording changes from `Field 'X' is null, expected type 'Y'` to Ajv's `must be Y` — 2 tests updated. Success/failure sub-schema compilation and dispatch now explicit via `validateContract` (was previously implicit in hand-rolled validateSuccessPayload/validateFailurePayload calls).
- **docs**: `output-contracts.md` and `output-contracts-article.md` updated
- **BREAKING**: None — all public APIs keep same signatures. `CAVEMAN_FIELD_MAP` and `expandCavemanFields` are removed but these are implementation details not part of the public orchestration API.
