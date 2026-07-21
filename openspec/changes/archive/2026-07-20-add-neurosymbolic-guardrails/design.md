## Context

The project currently has a 3-Layer Enforcement Architecture for output contract validation:
- **Layer 1** — Prompt Self-Validation: Agents self-validate their output-contract envelopes before emitting
- **Layer 2** — Hook Runtime Validation: `.opencode/plugins/output-contracts.ts` validates subagent task output via `tool.execute.after`
- **Layer 3** — Orchestrator Escalation: Reads `metadata.contractValidation` from Layer 2 for re-delegation decisions

These layers all operate **after** tool execution — they validate output but cannot prevent tool calls from happening. The neurosymbolic guardrails pattern adds **Layer 4 (pre-execution prevention)** by intercepting tool calls **before** they execute, using deterministic rule checks outside the model's reasoning loop.

## Goals / Non-Goals

**Goals:**
- Create a `tool.execute.before` hook that evaluates tool calls against static business rules before execution
- Define a `Rule` interface and pure `validateRules()` evaluator that is deterministic and testable
- Implement **12 rules** across bash, write, edit, and composio_COMPOSIO_* tools:
  - 8 from exhaustive system scan (git safety, database safety, credential protection, destructive command prevention)
  - 4 from agent prompt extraction (agent-operation scope via path/URL/regex pattern matching — no agent identity required)
- Log all violations to `.opencode/logs/guardrails-audit.jsonl`
- Coexist with the existing `output-contracts.ts` plugin (both load independently, no shared state)
- Create comprehensive documentation at `docs/opencode/neurosymbolic-guardrails.md` for dual audience (technical + non-technical)

**Non-Goals:**
- Replace or modify the existing `output-contracts.ts` plugin
- Implement stateful rules (e.g., rate limiting, payment tracking) in MVP — deferred to Phase 5
- Implement a dynamic HookRegistry (OpenCode doesn't expose one) — rules are lazily loaded
- Support YAML/DSL rule definitions — rules are inline TypeScript for strong typing

## Decisions

### Decision 1: `tool.execute.before` (not `after`)
- **Choice**: Use `tool.execute.before` hook to intercept and cancel tool calls before execution
- **Rationale**: The whole point of neurosymbolic guardrails is preventing execution, not detecting it afterward. `tool.execute.before` with `throw Error` is functionally analogous to Strands' `BeforeToolCallEvent` + `event.cancel_tool`. Both intercept before execution; key difference is Strands returns BLOCKED as tool result (graceful) while OpenCode throws exception (error propagation)
- **Alternative considered**: `tool.execute.after` — rejected because execution already happened; can only detect violations, not prevent them

### Decision 2: TypeScript inline rules (no YAML/DSL)
- **Choice**: Define rules as TypeScript interfaces and functions in `.opencode/guardrails-rules.ts`
- **Rationale**: Aligns with project conventions (all configuration is TypeScript), no extra dependencies, strong typing for rule definitions, testable with Vitest
- **Alternative considered**: YAML rule files — rejected because it adds a parsing dependency and loses type safety

### Decision 9: Pattern-based rules (not agent-scope)
- **Choice**: The 4 rules from agent prompt extraction use pattern matching (regex on command args, path matching on filePath, URL matching on curl args) rather than agent-identity checks
- **Rationale**: `tool.execute.before` only provides `{tool, sessionID, callID}` in input. Agent identity is only available for the `task` tool (via `output.args.subagent_type`). For `bash`, `write`, `edit`, and `composio_*` tools, there is NO agent identity in the hook input. Pattern-based rules work without it.
- **Trade-off**: Cannot differentiate a rule violation based on WHICH agent triggered it. Rule applies globally to all agents that call the tool. In practice, this is sufficient because: (a) git commands are dangerous regardless of who calls them; (b) Layer 5 permissions (opencode.jsonc) already handle agent-specific restrictions separately. `no_project_mgr_git` was REMOVED — cannot implement as guardrail, kept as Layer 1 prompt instruction only.
- **Alternative considered**: Agent-scope rules with identity tracking via session events — rejected as too complex for MVP. Can be revisited in Phase 2 if pattern-based rules prove insufficient.

### Decision 4: Error handling — re-throw BLOCKED, log-and-allow unexpected
- **Choice**: `try/catch` in hook handler. `GuardrailBlockedError` (extends Error) is re-thrown to cancel execution. Unexpected errors (TypeError, ReferenceError) are logged to audit and **do not** cancel execution
- **Rationale**: A bug in the guardrails code should not block the developer's work. The hook is a safety net, not a single point of failure. Strands uses the same fail-open principle
- **Alternative considered**: Let all errors propagate — rejected because a crash in guardrails would block all tool execution

### Decision 5: Audit log to separate JSONL file
- **Choice**: Violations logged to `.opencode/logs/guardrails-audit.jsonl` (separate from `contract-audit.jsonl`)
- **Rationale**: Different concern (tool execution vs output validation), different schema, keeps logs independently parseable
- **Alternative considered**: Single audit log — rejected because mixing tool-execution violations with output-validation failures creates confusion

### Decision 6: buildContext() per-tool switch with fail-safe
- **Choice**: `buildContext()` function maps tool name → context object with relevant fields (tool, args, sessionId, callId). Unrecognized tools return minimal context. Parse errors return null (execution proceeds)
- **Rationale**: Not all tools need the same context shape. Per-tool switch keeps it explicit. Fail-safe on parse errors prevents guardrails from breaking due to unexpected input shapes

### Decision 7: No shared state with output-contracts.ts
- **Choice**: Both plugins load independently, have separate audit files, separate rule registries, no cross-plugin coupling
- **Rationale**: Each plugin is independently maintainable and testable. Cross-plugin coupling would create ordering dependencies and increase cognitive load
- **Alternative considered**: Extend output-contracts.ts — rejected because it conflates two concerns (output validation vs input guardrails)
- **Plugin ordering note**: Hooks execute sequentially in registration order (per hooks.md §4.3). This design is safe only because the guardrails plugin is the **sole consumer** of `tool.execute.before`. If a future plugin also registered `tool.execute.before`, they would execute in registration order — this is safe but worth noting. output-contracts.ts uses `tool.execute.after`, so there is no ordering conflict between the two plugins.

### Decision 8: JSONL audit log eventType field
- **Choice**: Include `eventType: "guardrail_blocked"` field in every JSONL entry
- **Rationale**: Makes log aggregation trivial (easy to grep/filter for blocked events) and future-proofs integration with centralized logging systems (Grafana Loki, ELK). Not required for MVP but adds negligible complexity
- **Note**: `contract-audit.jsonl` does not use eventType — schemas are intentionally different per Decision 5

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Steer pattern gap** — OpenCode's `tool.execute.before` cannot intercept internal steer-loop tool calls (model self-correction). Strands' article handles this via `BeforeToolCallEvent` at the model level | Workaround: Add a prompt instruction to agents asking them to avoid guarded tools in self-correction. Fidelity: 3/10 on this dimension |
| **try/catch wrapper gap** — A parent `try/catch` around the agent's tool call would swallow the `GuardrailBlockedError` before OpenCode processes it | Workaround: Document this risk. The hook runs at OpenCode's framework level, not inside agent code, so this is unlikely in practice |
| **No HookRegistry** — OpenCode doesn't expose a dynamic registry where plugins can introspect registered hooks | Workaround: Lazy-load rules on first hook invocation. Rules are statically defined in `guardrails-rules.ts` |
| **Stateful rules deferred** — Rules like "payment validation" need to track state across calls | Workaround: Phase 5 introduces JSON file persistence for state tracking. MVP uses only stateless rules |
| **Agent identity not available** — 4 Phase 2 rules were originally designed to check agent identity, but `tool.execute.before` only provides `{tool, sessionID, callID}` for non-task tools. Only `task` tool carries `subagent_type` | Workaround: Redesign those 4 rules as pattern-based (regex on command args, path matching, URL matching). `no_project_mgr_git` was removed as fatal flaw — cannot implement, kept as Layer 1 prompt instruction only. Rule applies globally to all agents — sufficient because git/database/destructive operations are dangerous regardless of who calls them, and Layer 5 handles agent-specific permissions separately |
| **Blocked tool confusion** — Agent doesn't know why its tool call was blocked (the Error message is the only signal) | Mitigation: Error messages are descriptive. Agent prompt can reference these codes. Prompt instruction workaround added in Phase 6 |

| **Plugin auto-discovery crash** — OpenCode auto-discovers ALL `.ts` files in `.opencode/plugins/` and attempts to import them as plugins. `guardrails-rules.ts` exports types, interfaces, and a rules registry — but no `export const plugin`. This causes a `"Plugin export is not a function"` TypeError on startup, preventing OpenCode from loading entirely | **Mitigation**: Move `guardrails-rules.ts` outside `.opencode/plugins/` to `.opencode/guardrails-rules.ts`. This file is a pure TypeScript module (not a plugin) and should not be in the auto-discovered plugins directory. The import path in `neurosymbolic-guardrails.ts` must be updated to `"../guardrails-rules.ts"` accordingly. All future `.ts` files without a `Plugin`-typed `export const plugin` MUST be placed outside `.opencode/plugins/` |
| **V1 plugin loader legacy path crash** — `neurosymbolic-guardrails.ts` uses `export const plugin: Plugin = async () => { ... }` + `export default plugin`. OpenCode's `readV1Plugin()` expects `mod.default` to be `{ server: fn }`. When it's a function, it returns undefined and falls back to a legacy path that iterates ALL named exports via `Object.values(mod)`, calling `getServerPlugin()` on each. Functions without a `.server` property fail the check, throwing `TypeError: Plugin export is not a function`. Confirmed by opencode-cost-guard fix (a356299) and Clawd PR #417 | **Mitigation**: Change to canonical V1 PluginModule format: `const plugin: Plugin = async () => { ... }; export default { id: "local.neurosymbolic-guardrails", server: plugin }`. This ensures `mod.default` is a plain object with `.server`, so the legacy fallback path is never hit |
| **Module-level import.meta.url in bundled context** — `output-contracts.ts` lines 40-54 execute `new URL(..., import.meta.url)` at MODULE LEVEL during import. In bun's bundled runtime (`B:/~BUN/root/chunk-*.js`), `import.meta.url` resolves to the chunk URL, not the original `.ts` file. Relative URL resolution from this path produces broken filesystem paths on Windows (drive `B:` is bun's virtual filesystem). This runs during module import, before any try/catch can intercept it | **Mitigation**: Move all `new URL(..., import.meta.url)` calls inside the plugin factory function (lazy evaluation). Wrap in try/catch with null fallback. Pattern already used by `neurosymbolic-guardrails.ts`'s `resolveLogFilePath()` — apply same pattern to `output-contracts.ts` |
| **Config array override kills plugins** — `.opencode/opencode.json` has `"plugin": []` which OVERRIDES (array replacement, not concatenation) the full plugin array from `opencode.jsonc`. OpenCode loads configs in order with later sources overriding earlier ones (confirmed by GitHub issue #18953). The empty array drops `@warp-dot-dev/opencode-warp` and could cause config-based plugin loading to fail silently | **Mitigation**: Delete `.opencode/opencode.json`. The auto-discovery of `.opencode/plugins/*.ts` handles local plugin loading. If an empty override is needed for documentation, add `"plugin": []` with a comment in `opencode.jsonc` explaining why explicit entries are disabled |
| **Throw-vs-cancel semantic gap** — Implementation uses `throw new GuardrailBlockedError()` (exception-based blocking). Article uses `event.cancel_tool = "BLOCKED: reason"` (graceful string assignment). Strands' pattern returns the BLOCKED message as the tool result, allowing the LLM to receive it as normal output and self-correct. OpenCode's throw pattern propagates as a tool failure, which the LLM experiences differently (error state vs output state). The companion article "Runtime Guardrails — Steer, Don't Block" (Part 3.2) argues for steering/blocking over exceptions — our throw approach is philosophically opposite | **Mitigation**: This is an OpenCode platform limitation — `tool.execute.before` only supports `throw Error` for cancellation, not return-value cancellation. Workaround: Add prompt instruction (Task 6.4) telling agents to self-correct on BLOCKED errors. Fidelity: 6/10 on this dimension. Cannot match Strands' graceful cancellation without OpenCode framework changes |

1. **Phase 1-3 (MVP)**: Create `guardrails-rules.ts` (12 rules, ~120 LoC), `neurosymbolic-guardrails.ts` (~130 LoC), register in `opencode.jsonc`. ~1-2 days.
2. **Phase 4**: Audit log verification — verify `guardrails-audit.jsonl` creation, format, `.gitignore` confirmation, `sanitizeArgs()` redaction of sensitive fields.
3. **Phase 5**: Stateful rules (JSON persistence for rules needing cross-call state). Deferred unless needed.
4. **Phase 6**: Production hardening — Vitest unit tests + integration tests, steer pattern workaround (prompt instruction in all 9 agent prompts), final documentation review.

## Open Questions

- Does `tool.execute.before` fire for all tool types in OpenCode v1.18.1+? (Expected: yes, per the output-contracts research precedent)
- Can the steer loop be intercepted? (Known gap — workaround via prompt instruction)
- What is the exact Error shape that OpenCode expects for cancellation in `tool.execute.before`? (Assumption: `throw new Error("message")`)
