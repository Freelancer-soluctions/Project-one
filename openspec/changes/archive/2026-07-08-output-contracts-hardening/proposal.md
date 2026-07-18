## Why

The Output Contracts system is the runtime contract that gates every agent-to-orchestrator response in the Project One multi-agent architecture. A comprehensive audit (Engram `obs-31e6c0f1ecec45e4`, `obs-be9c20880049b77f`, `obs-925e3855bfc43420`) found **12 hard bugs** in the hand-rolled JSON Schema validator (`contractValidator.js`), **3 prompt heading inconsistencies**, and **1 integration gap** (`validateContract` is never called at runtime). The 7 critical (P0) correctness bugs mean malformed agent responses can silently pass validation, causing unpredictable orchestrator behavior and cascading failures downstream. These must be fixed before any runtime wiring or schema migration work begins.

## What Changes

- Fix 7 critical bugs in `contractValidator.js` that cause incorrect validation results:
  1. `withRetry` semantic no-op (retries same response forever)
  2. `expandCavemanFields` silent overwrite when compressed and canonical keys coexist
  3. `typeof null === 'object'` type-check bypass accepts `null` for object fields
  4. XML envelope regex too strict (fails on single quotes, attribute order swap, trailing whitespace)
  5. No `format` validation (`format: uri`, `format: date-time` declared but ignored)
  6. No nested object validation (`error` block in failure payloads essentially unvalidated)
  7. No base field re-validation after envelope regex (`agent`, `timestamp`, `version` not required by payload schema)

- Fix heading level in 3 agent prompts: `spec-manager.md`, `project-manager.md`, `git-manager.md` use `# REMEMBER` (h1) instead of `## REMEMBER` (h2) — **Note**: audit reported 2, grep found 3; all three fixed.

- Add a CI-style coverage gate documented as a verification step for `openspec-verify` that checks:
  - (a) Every agent has a matching schema file
  - (b) Every prompt uses `## REMEMBER` (h2) at the end
  - (c) Every prompt's `## OUTPUT CONTRACT` example payload, when extracted and fed through `validateContract`, returns `{valid:true}`

### Phase 8 Extension (post-archive, 2026-07-09)

Per researcher recommendation (Grade A=Critical validation), **Opción D — Self Validation per Agent**. Every agent prompt will self-validate its envelope before emitting it, using `validateContract` from the hardened contracts module.

The orchestrator-side `Runtime Validation Hook` (Task 7.1) is documented in `docs/opencode/prompts/orchestrator.md` as a fallback. The hook is NOT executable today because OpenCode's `tool.execute.after` hook (Issue #25918, v1.14.39) is declared but NOT triggered at runtime. When Issue #25918 lands, the orchestrator hook will activate automatically without code changes — the section is ready.

For NOW, the self-validation approach puts runtime enforcement into every agent prompt:

```markdown
## SELF-VALIDATION (before OUTPUT CONTRACT envelope)

After completing your response, run `validateContract(envelopeDraft, '<your-agent-name>')` from
`docs/opencode/prompts/contracts/contractValidator.js`.
- If `{valid:true, !degraded}` → emit the envelope exactly as drafted.
- If `{valid:false}` → fix the errors listed in `result.errors` and re-validate.
  Each error has a `field` and `message` describing what's wrong.
- If `{degraded:true}` → warn that `<agent>.schema.json` is missing, then emit anyway
  (degraded mode is acceptable during onboarding).
```

Added to all 8 agent prompts (`orchestrator.md`, `developer.md`, `spec-manager.md`, `git-manager.md`, `planner.md`, `reviewer.md`, `researcher.md`, `project-manager.md`) between `## OUTPUT CONTRACT` and `## REMEMBER`.

**Behavior contract**: each agent validates ITS OWN envelope before output. This catches 10-15% free-model malformed-response rate at the emission point, before the orchestrator ever receives a bad response.

### Moved from scope to deferred
- Migration to Ajv or any JSON Schema library (P1, deferred)
- `$ref` resolver (P1)
- Schema versioning migration (P3)
- Free-model headroom knobs (P3)

**Implemented as Layer 2 hook plugin in follow-up change `output-contracts-hook-migration`**:
- Wire `validateContract` into orchestrator runtime (was P3, deferred — Issue #25918 blocked; Issue #25918 was a false alarm)

## Capabilities

### New Capabilities
- `output-contract-validation`: Core validator bug fixes and coverage gate for the output-contracts system
- `prompt-format`: Structural fixes to agent prompt heading levels and example parity

### Modified Capabilities
- *(none — this change fixes the validation infrastructure, not the specs that depend on it)*

## Impact

- **Files to modify**:
  - `docs/opencode/prompts/contracts/contractValidator.js` (290 lines) — bug fixes in 7 locations
  - `docs/opencode/prompts/contracts/contractValidator.test.js` (413 lines) — update tests to match new behavior
  - `docs/opencode/prompts/spec-manager.md` — `# REMEMBER` → `## REMEMBER` (line 340)
  - `docs/opencode/prompts/project-manager.md` — `# REMEMBER` → `## REMEMBER` (line 240)
  - `docs/opencode/prompts/git-manager.md` — `# REMEMBER` → `## REMEMBER` (line 229)

- **Phase 8 files (post-archive)**:
  - `docs/opencode/prompts/orchestrator.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/developer.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/spec-manager.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/git-manager.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/planner.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/reviewer.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/researcher.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/prompts/project-manager.md` — add `## SELF-VALIDATION` section before `## REMEMBER`
  - `docs/opencode/output-contracts.md` — add a note explaining why auto-validation is at the prompt layer (not orchestrator layer) and reference Issue #25918

- **Evidence sources**: This proposal is based on Engram observations:
  - `obs-31e6c0f1ecec45e4` (#25 — Output Contracts audit: 12 bugs + topology gaps)
  - `obs-be9c20880049b77f` (#23 — Output Contracts Audit: 12 hard bugs, alpha maturity)
  - `obs-925e3855bfc43420` (#24 — Output Contracts Audit: full report reconstructed)
  - `obs-eb7ffaad1db19a27` (#27 — Pre-implementation research, OpenCode native alternatives)
  - Researcher cost/benefit analysis (persisted to topic `architecture/output-contracts-cost-benefit`)

## Success Criteria

1. All 7 P0 validator bugs fixed with passing tests
2. All 3 prompt heading levels corrected to `## REMEMBER`
3. Coverage gate verifies: every agent has schema, every prompt has `## REMEMBER`, all example payloads pass `validateContract`
4. All existing tests pass with zero regressions
5. All backward compatibility tests pass (existing prompt examples continue to validate)
6. **Phase 8**: All 8 agent prompts contain `## SELF-VALIDATION` section before `## OUTPUT CONTRACT`; `output-contracts.md` references Issue #25918 as the pending orchestrator hook
7. **Phase 9 (follow-up)**: Hook plugin creates audit log on validation failure (implemented in `output-contracts-hook-migration`)