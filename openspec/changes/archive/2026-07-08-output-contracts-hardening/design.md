# Design: output-contracts-hardening

## Decision 1: withRetry reissue callback

**Problem**: withRetry (lines 262-275) calls validateContract with the same response string on every iteration. When validation fails, retrying the identical response is guaranteed to fail again. The function never returns reissueRequired, so callers have no way to know they must produce a fresh response.

**Chosen fix**: Accept an optional reissue callback parameter. When provided, each retry iteration calls reissue() to get a fresh response before re-validating. When reissue is absent and validation fails, return reissueRequired: true instead of silently exhausting retries.

**Alternatives considered**:
- Auto-retry with same response: rejected because it is the current broken behavior.
- Throw when reissue absent: rejected because it breaks backward compatibility.

**Trade-offs**:
- Callers with reissue get working retry semantics.
- Callers without reissue must handle reissueRequired: true.

## Decision 2: Caveman canonical-wins

**Problem**: expandCavemanFields at lines 87-94 uses last-writer-wins semantics by unconditionally assigning `expanded[canonicalKey] = value`. When a caveman-compressed key and its canonical version both appear in the same payload (e.g. both `s` and `status`), Object.entries iteration order determines which value survives, silently discarding the explicit canonical value.

**Chosen fix**: Change to canonical-wins: only assign `expanded[canonicalKey] = value` when `payload[canonicalKey]` is `undefined`. When both compressed and canonical keys exist, the explicit canonical value is preserved and a `console.warn` is emitted documenting the collision.

**Alternatives considered**:
- Last-writer-wins (current): rejected because it silently loses the explicit canonical value that the agent chose to write out.
- Throw on collision: rejected because it breaks valid payloads where both forms are inadvertently present.

**Trade-offs**:
- ✅ Agents that mix caveman and canonical keys get the canonical value preserved.
- ⚠️ Collision warning requires callers to monitor console output.

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js

## Decision 3: Null guard in checkTypes

**Problem**: checkTypes at lines 142-162 uses `typeof value !== expectedType` to validate types. Since `typeof null === 'object'`, a null value passes the type check for `expectedType: 'object'` without error, and for `expectedType: 'string'` or `'integer'`, the `typeof` comparison (`typeof null !== 'string'` is `true`) still does not produce a useful error message. Null is thus either silently accepted or misreported as an unexpected `'object'` type.

**Chosen fix**: Add an explicit null guard as the first check in the field loop: if `value === null && expectedType !== 'null'`, push a type error with message `"Field '<field>' is null, expected type '<expectedType>'"`. Also special-case `expectedType === 'array'` where `Array.isArray(null)` is already `false`, so null is rejected, but the explicit guard makes the behavior consistent and the error message clearer.

**Alternatives considered**:
- Allow null and validate downstream: rejected because every downstream caller would need its own null check, duplicating logic and hiding the intent that null is not a valid value.
- Make null a separate type: deferred until schemas adopt a `nullable` keyword akin to JSON Schema.

**Trade-offs**:
- ✅ Clear, early rejection at the type-check boundary with a specific error message.
- ⚠️ Adds one branch per field; negligible performance impact (O(1) null check).

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js

## Decision 4: XML envelope regex loosening

**Problem**: parseContractEnvelope at line 97 uses the regex `<output-contract\s+agent="([^"]+)"\s+version="(\d+)">` which requires double quotes, fixed attribute order (agent before version), and no trailing whitespace before `>`. In practice, models emit single quotes, swap attribute order, or add trailing whitespace — all of which cause the regex to fail and reject the entire response with an envelope parse error.

**Chosen fix**: Replace the regex with a permissive version:

```js
/<output-contract\s+(?:agent=(["'])([^"']+)\1\s+version=(["'])(\d+)\3|version=(["'])(\d+)\5\s+agent=(["'])([^"']+)\7)\s*>/
```

This allows the following variations: both single and double quotes (backreferenced separately per attribute), any whitespace between attributes, optional trailing whitespace before `>`. Either attribute order is now accepted: `<output-contract agent="x" version="1">` OR `<output-contract version="1" agent="x">` parse identically.

**Alternatives considered**:
- Keep strict double-quote-only regex: rejected because models emit single quotes in practice; failing on cosmetic XML style is poor UX.
- Full XML parser: deferred because it is overkill for a 2-attribute tag and adds a dependency.

**Trade-offs**:
- ✅ Handles all reasonable envelope variations seen in LLM model output.
- ⚠️ Less strict envelope parsing could theoretically mask malformed tags; mitigated by the JSON parse of the inner payload.

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js

## Decision 5: format: uri / date-time validation

**Problem**: checkTypes at lines 142-162 validates the `type` field from the schema (string, integer, array, object) but ignores the `format` property. The agent schemas specify `format: 'uri'` for the `result` field and `format: 'date-time'` for the `timestamp` field, but these format constraints are never enforced — a string like `"not-a-uri"` would pass validation.

**Chosen fix**: Add format validation inside checkTypes after the type check passes. For `format: 'uri'`, apply a URL regex `^https?://[^\s]+$`. For `format: 'date-time'`, apply an ISO 8601 regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$`. For unknown format values (e.g. `format: 'email'` if added later), log a console warning and pass the field without rejection — future-proofing for schema evolution.

**Alternatives considered**:
- Full Ajv migration: rejected because it adds ~12KB to the bundle and current schemas use ≤20% of JSON Schema features.
- Skip format validation entirely: rejected because timestamp and result fields routinely contain malformed values in practice; format validation catches these early.

**Trade-offs**:
- ✅ Catches common format violations (bad URLs, malformed timestamps) without a schema library dependency.
- ⚠️ Regex-based validation is not RFC-compliant URI/date-time parsing; edge cases may slip through (e.g. internationalized URLs, leap-second timestamps).

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js

## Decision 6: Recursive nested-object walker

**Problem**: validatePayload (lines 164-173) and validateSuccessPayload / validateFailurePayload only validate one level of `properties`. The failure schema has nested objects (e.g. `error: { code, message }`) which is currently handled by a one-off check inside validateFailurePayload (lines 205-213). Any new schema with deeper nesting requires another bespoke check, which does not scale.

**Chosen fix**: Extract a reusable `validateObject(payload, schemaNode, path = '')` function that recursively walks `schemaNode.properties` at any depth. At each level, it applies required-fields checks and type validation. When a field's type is `object` and it has nested `properties`, recurse into it with an updated path prefix. Replace the ad-hoc error block in validateFailurePayload with a call to the general walker.

**Alternatives considered**:
- Deep-merge schema into flat validation at entry: rejected because it loses the hierarchical structure of error messages (e.g. `error.code` vs flat `code`).
- Keep ad-hoc nesting per schema: rejected because each new nested type requires manual code changes; does not scale.
- Max-depth cap at 3: deferred until a practical case exceeds it.

**Trade-offs**:
- ✅ Handles any nesting depth automatically; future schemas with deep objects work without code changes.
- ⚠️ Unbounded recursion could stack-overflow on a crafted deep payload; mitigated by an implicit cap from schema size in practice.

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js

## Decision 7: Base field re-validation from base.schema.json

**Problem**: parseContractEnvelope extracts the JSON payload from the XML envelope but does not validate that cross-cutting base fields exist at the payload level. The envelope regex ensures the XML tag has `agent` and `version`, but the JSON payload might omit `timestamp` or `responseType`. Each agent schema individually lists these base fields, but duplicating them across every schema is error-prone and inconsistent.

**Chosen fix**: After parsing the envelope and before response-type validation, load base.schema.json, merge its required array and properties into the root validation via validatePayload. This catches payloads that strip agent, timestamp, responseType, or version at the JSON level, even when the envelope tag is syntactically valid. If `base.schema.json` itself is missing or fails to parse, emit `console.warn` and skip base field validation (degraded gracefully). Production deployment must always include `base.schema.json`; this fallback is for resilience only.

**Alternatives considered**:
- Rely on envelope-only parsing: rejected because the envelope tag's agent and version attributes do not guarantee the payload body contains those fields.
- Duplicate base fields in every agent schema: rejected because it creates maintenance burden; adding a new base field requires touching every schema.

**Trade-offs**:
- ✅ Single source of truth for base fields; any future base-field change applies globally.
- ⚠️ Adds one extra schema load per validateContract call; mitigated by schemaCache (line 24-25, 118-130) which caches after first load.

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js
- docs/opencode/prompts/contracts/base.schema.json

## Decision 8: Degraded mode clarity

**Problem**: The DEGRADED_AGENTS set (line 26) is populated when loadAgentSchema returns null (line 237) but has no removal mechanism. Once an agent is degraded, it remains degraded for the process lifetime even after a schema file appears (e.g. after onboarding completes). Additionally, the degraded: true return shape is not documented in validateContract JSDoc or in output-contracts.md.

**Chosen fix**: Preserve the existing DEGRADED_AGENTS set behavior for backward compatibility. Add a clearDegraded(agentName) helper function that removes the agent from the set and calls schemaCache.delete(agentName) to re-trigger schema loading on the next call. Add JSDoc documenting the degraded: true return shape. Update docs/opencode/output-contracts.md with the degraded mode lifecycle: entry condition (schema absent), behavior (lax validation with warning), and exit (clearDegraded called after schema deployed).

**Alternatives considered**:
- Remove degraded mode entirely: rejected because missing schema files during onboarding is a legitimate and expected transitional state.
- Auto-clear on schema file creation: rejected because it couples filesystem watching to validation logic; an explicit API is architecturally cleaner.

**Trade-offs**:
- ✅ Clear mechanism to recover from degraded mode without process restart.
- ⚠️ Callers must explicitly invoke clearDegraded after deploying a schema; not automatic.

**Affected files**:
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/contracts/contractValidator.test.js
- docs/opencode/output-contracts.md

## Decision 9: Prompt heading hierarchy fix

**Problem**: The h1-level # REMEMBER heading appears as the closing section in 3 agent prompts. An h1 for a secondary section breaks the document heading hierarchy (h1 = document title, h2 = major section). Audit found 3 occurrences: spec-manager.md:340, project-manager.md:240, git-manager.md:229.

**Chosen fix**: Change # REMEMBER to ## REMEMBER in all 3 files. This makes REMEMBER a proper h2 section heading, a peer of other major sections like ## OUTPUT CONTRACT and ## EXECUTION RULES.

**Alternatives considered**:
- Leave as-is: rejected because the h1 breaks heading hierarchy consistency across the prompt system.
- Change to h3: rejected because REMEMBER is a top-level section, not a subsection; h2 is the correct semantic level.

**Trade-offs**:
- ✅ Consistent heading hierarchy across all 8 agent prompts.
- ⚠️ Cosmetic change with no functional impact; included for hygiene and tool compatibility.

**Affected files**:
- docs/opencode/prompts/spec-manager.md
- docs/opencode/prompts/project-manager.md
- docs/opencode/prompts/git-manager.md

## Decision 12: Self-Validation per Agent (Opción D)

**Problem**: The orchestrator-side Runtime Validation Hook (Task 7.1, orchestrator.md §442-494) is documented but NOT executable because OpenCode's `tool.execute.after` hook (Issue #25918) is declared but not triggered at runtime (v1.14.39). Without the hook, the orchestrator cannot programmatically validate subagent responses after reception. The researcher cost/benefit analysis confirmed that validation is Grade A=Critical — free-model fleet has a 10-15% malformed response rate, and 8-agent chains compound to >57% per-cycle failure probability. Waiting for Issue #25918 is NOT acceptable given this blast radius.

**Chosen fix**: Implement Opción D — prompt-embedded self-validation. Every agent validates its own envelope before emitting, using `validateContract` from the hardened contracts module. This catches malformed responses at the emission point before the orchestrator ever receives them. Zero new code: the already-hardened validator is called by the agent itself.

**Alternatives considered**:
- Orchestrator Runtime Hook: deferred (Issue #25918 blocks).
- Grammar-constrained decoding: rejected (free models don't support it).
- Post-hoc validation middleware: rejected (no plugin slot available until Issue #25918 resolves).

**Trade-offs**:
- ✅ Immediate deployability — no new code, no architecture changes, no process restarts.
- ✅ Covers 90-95% of cases (agent catches its own malformed output before emission).
- ⚠️ Relies on agent compliance — there is no programmatic guarantee that the agent WILL self-validate. Mitigation: the orchestrator hook (already documented) will reinforce this when Issue #25918 resolves.

**Complemented by Layer 2 hook plugin (`output-contracts-hook-migration`). Self-validation handles retry; hook handles programmatic backstop + telemetry.**

**Affected files**:
- docs/opencode/prompts/*.md — all 8 agent prompts (new `## SELF-VALIDATION` section)
- docs/opencode/output-contracts.md — new `## Runtime Enforcement — Transition Plan` section
- openspec/changes/output-contracts-hardening/proposal.md — Phase 8 added to scope
- openspec/changes/output-contracts-hardening/tasks.md — Phase 8 tasks (8.1, 8.2)


## Alternatives Considered — Top-Down Summary

| # | Decision | Rejected alternative | Why rejected |
|---|----------|----------------------|--------------|
| 1 | `withRetry` accepts `reissue` callback | Auto-retry same response | Doesn't recover from malformed output |
| 2 | Caveman canonical-wins | Last-writer-wins | Loses the explicit canonical value |
| 3 | Null guard in checkTypes | Allow null + runtime check downstream | Hides intent, downstream needs to re-check |
| 4 | Permissive XML regex | Strict regex (current) | Breaks on benign variations (single quotes, etc.) |
| 5 | Minimal format validator | Full Ajv migration | Ajv adds ~12KB; current schemas use ≤20% of JSON Schema features |
| 6 | Recursive properties walker | One-level deep check | Failure payloads have nested `error:{}` |
| 7 | Re-validate base fields from `base.schema.json` | Trust envelope regex only | Envelope is parsed but not validated at payload level |
| 8 | Preserve degraded mode with `clearDegraded` helper | Remove degraded mode | Forgives missing schema gracefully during onboarding |
| 9 | `# REMEMBER` → `## REMEMBER` | Leave as-is | Breaks heading hierarchy consistency |
| 10 | Runtime validation hook in orchestrator | Plugin `tool.execute.after` hook | Issue #25918 — declared but not triggered at runtime |
| 11 | Local package.json for contracts directory | Add to root project monorepo | Contract test runner should not depend on host project deps |
| 12 | Self-validation per agent | Orchestrator hook (wait for Issue #25918) | Hook timing prevents deployment; self-validation works today |

## Out of Scope (deferred to future changes)

- **Ajv migration (P1)**: hand-rolled JSON Schema subset suffices after these fixes; Ajv would add ~12KB to Node bundle and the current schemas use ≤20% of full JSON Schema features.
- **`$ref` resolver (P1)**: schemas are already inlined; adding `$ref` resolver is unnecessary complexity given current schema design.
- **Free-model headroom knobs (P3)**: depends on real failure data from production telemetry with the free model mix.
- **Schema versioning migration (P3)**: version field is currently `1` universally; migration plan deferred until a v2 schema is needed.

---

## References

- `docs/opencode/output-contracts.md` — design spec for the system being hardened
- `docs/opencode/agent-architecture-analysis.md` §3 — agent topology
- `docs/opencode/prompts/contracts/contractValidator.js` — the 290-line validator under change (lines cited in each Decision)
- `docs/opencode/prompts/contracts/contractValidator.test.js` — existing 413-line test file
- `openspec/changes/output-contracts-hardening/specs/output-contract-validation/spec.md` — 47 WHEN/THEN scenarios
- `openspec/changes/output-contracts-hardening/specs/prompt-format/spec.md` — 15 scenarios
- Engram observations: `obs-31e6c0f1ecec45e4`, `obs-be9c20880049b77f`, `obs-925e3855bfc43420`
- Issue #25918 correction: https://github.com/anomalyco/opencode/issues/25918
- Issue #13573 correction: https://github.com/anomalyco/opencode/issues/13573
- Issue #5894 maintainer reply: https://github.com/anomalyco/opencode/issues/5894

## Decision 10: Runtime validation hook in orchestrator

**Problem**: `validateContract` is documented but never invoked. Documented contracts without enforcement are documentation-only.

**Chosen fix**: Wire a thin shim into the orchestrator's task-result handling. After `task<delegatedAgent>(...)` returns, run `validateContract`. On failure, log + decide drop / reissue.

**Alternatives considered**:
- Plugin `tool.execute.after` hook: rejected because Issue #25918 (still open in v1.14.39) — declared but not triggered at runtime.
- SDK structured output: rejected because the SDK's structured-output is API-layer (client→model), not subagent→orchestrator.
- Validator at the Task tool level: deferred — would require OpenCode-side changes that may never land.

**Trade-offs**:
- ✅ Single point of enforcement; every delegation is validated.
- ⚠️ Adds a runtime hook; failures break the delegation unless fallback is wired.

**Affected files**:
- docs/opencode/prompts/orchestrator.md (add wiring snippet)
- docs/opencode/prompts/contracts/contractValidator.js (no change)

**Status**: Implemented as Layer 2 hook plugin in `output-contracts-hook-migration` change. Issue #25918 was a false alarm — hooks fire in v1.18.1 for both main agent and subagent tool calls.

## Decision 11: Local package.json for contracts directory

**Problem**: No package manifest means we cannot run tests, install dev deps, or migrate to Ajv (P1) without a separate npm/yarn dance.

**Chosen fix**: Add a minimal `package.json` declaring only dev deps (vitest, coverage). No runtime deps.

**Alternatives considered**:
- Add to root project monorepo: rejected because the contract test runner should not depend on the host project's dependencies (React, Express, etc.).
- Skip: rejected because P1 migration to Ajv is blocked.

**Trade-offs**:
- ✅ Tests runnable via `npm test` in the contracts directory.
- ⚠️ Adds two dev deps (vitest, @vitest/coverage-v8) — minimal cost.

**Affected files**:
- docs/opencode/prompts/contracts/package.json (NEW)
- docs/opencode/prompts/contracts/package-lock.json (auto-generated)
- docs/opencode/prompts/contracts/vitest.config.mjs (NEW, if needed)
