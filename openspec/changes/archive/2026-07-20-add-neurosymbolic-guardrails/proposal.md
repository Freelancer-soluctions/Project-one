## Why

The dev.to article on neurosymbolic guardrails for AI agents (AWS AI Agent Guardrails) demonstrates a pattern where deterministic rule checks execute **outside** the model's reasoning loop to prevent LLM bypass of business rules. OpenCode's `tool.execute.before` hook with `throw Error` is functionally analogous to Strands' `BeforeToolCallEvent` + `event.cancel_tool`. Both intercept tool calls before execution and prevent the tool from running. Key difference: Strands returns a BLOCKED message as the tool result (graceful cancellation — LLM receives it as normal output), while OpenCode throws an exception (error propagation — LLM experiences tool failure). The practical effect (tool never executes) is the same, but the LLM user experience differs: Strands allows self-correction, while our pattern requires explicit retry handling. This adds **Layer 4 (pre-execution prevention)** to the existing 3-Layer Enforcement Architecture (prompt self-validation, hook runtime validation, orchestrator escalation), which already has 5/6 layers active.

Research identified 20+ potential rules across 37 project files (agent prompts, opencode.jsonc, Prisma schema, docker configs, security scripts, package.json). After filtering for implementability and removing rules already covered by Layer 5 permissions (opencode.jsonc deny/allow), the final scope is **12 rules** across bash, write, edit, and composio_COMPOSIO_* tools.

## What Changes

- Create **`guardrails-rules.ts`** — rules file at `.opencode/plugins/` with the `Rule` interface, `validateRules()` pure function, and a `TOOL_RULES` registry containing **12 rules** (8 from system scan + 4 from agent prompt extraction):
  - bash (8): no_git_force_push, no_git_rewrite_history, no_git_no_verify, no_prisma_db_push_force_reset, no_destructive_rm, no_delete_env, no_composio_git_ops, no_direct_trello
  - write (2): no_write_env_files, no_planner_write_specs
  - edit (1): no_edit_gitignore_security
  - composio_COMPOSIO_* (1): no_composio_git_ops
- Create **`neurosymbolic-guardrails.ts`** — plugin file at `.opencode/plugins/` with `tool.execute.before` hook, `buildContext()`, `sanitizeArgs()`, audit log wiring, and graceful error handling (re-throw BLOCKED, log-and-allow for unexpected errors)
- Register the new plugin in **`opencode.jsonc`** under the `plugin` array alongside the existing `output-contracts.ts`
- Audit log to **`.opencode/logs/guardrails-audit.jsonl`** with eventType, timestamp, tool, sessionId, callId, violations, and sanitized args (sensitive fields redacted)
- Create **`docs/opencode/neurosymbolic-guardrails.md`** — comprehensive documentation for non-technical and technical audiences, covering all 12 rules, architecture, audit format, integration with existing layers, and known limitations

## Capabilities

### New Capabilities

- `neurosymbolic-guardrails`: Deterministic pre-execution guardrails that intercept tool calls, evaluate them against static rule definitions, and either **BLOCK** (throw Error) or **ALLOW** (pass through) execution. Operates at the `tool.execute.before` hook layer — before any tool runs, before any output is produced. Coexists with the existing Layer 2 output-contracts validation (`tool.execute.after`).

### Not Implemented (identified but deferred)

- 6 rules dropped as redundant with opencode.jsonc Layer 5 permissions (spec-manager, planner, project-manager edit/write denials; orchestrator bash denial; no_project_mgr_git kept as Layer 1 prompt instruction only)
- ~18 rules from agent prompts CANNOT be guardrails — behavioral rules (delegation sequencing, conversation flow), conversational rules (ask one question at a time), and output-format rules (JSON escaping, emoji prohibition) require prompt enforcement or output-contracts.ts Layer 2

### Modified Capabilities

*(No existing capabilities have requirement changes — this is a new capability.)*

## Impact

- **New files**: `.opencode/plugins/guardrails-rules.ts` (~120 LoC), `.opencode/plugins/neurosymbolic-guardrails.ts` (~130 LoC), `docs/opencode/neurosymbolic-guardrails.md`
- **Modified files**: `opencode.jsonc` (add plugin to `plugin` array)
- **Audit artifacts**: `.opencode/logs/guardrails-audit.jsonl` (not committed — `.gitignore` excludes `.opencode/logs/`)
- **Dependencies**: None — pure TypeScript, no npm deps (uses only `@opencode-ai/plugin` types already present)
- **Risks**: 5 documented gaps with workarounds (steer pattern → prompt instruction, try/catch → wrapper, no HookRegistry → lazy-load, state → JSON file, agent identity unavailable → pattern-based rules)
- **Timeline**: MVP (Phases 1-3) ~250 LoC, 1-2 days. Production (Phases 4-6) ~150 LoC more, 2-3 days.
