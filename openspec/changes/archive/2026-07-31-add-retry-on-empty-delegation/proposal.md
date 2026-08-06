## Why

Subagent Silent Exit leaves users with total silence: the Task tool returns an empty `<task_result>` (or one without an `<output-contract>` envelope) even though the subagent completed its internal tool calls. Root cause confirmed by @researcher: AI SDK v6 maps finish reason `'other'` to terminal success, so TaskTool serializes `findLast(text)?.text ?? ''` into an empty result with no diagnosis. All upstream PRs (#29048, #39473, #30304, #19519, #26167) are unmerged; no released OpenCode version fixes this, so an upgrade does not solve it. The Layer-2 hook (`.opencode/plugins/output-contracts.ts`) is observe-only by design and cannot retry; `withRetry` in `contractValidator.js:288-339` is dead code. We need a Layer-3 (orchestrator-level) retry protocol, implemented entirely in our own prompts, guardrails, and plugin — no OpenCode core changes required.

## What Changes

1. **Layer-3 Retry Protocol** in `docs/opencode/prompts/orchestrator.md` — orchestrator parses `<task_result>` output after every `task` tool call; on empty output or missing envelope it re-delegates with a resume suffix (`task_id` correlation + "Your previous attempt produced NO output. Retry N/3"), max 3 retries with best-effort backoff, and emits a `subagent.silent_exit` telemetry event to `.opencode/logs/subagent-silent-exit-audit.jsonl` via bash `echo >>` with `mkdir -p`.
2. **Prompt Guard Unification (D1 Hybrid)** — all 8 prompts in `docs/opencode/prompts/` (developer, spec-manager, git-manager, project-manager, planner, reviewer, researcher, orchestrator) get a top-of-file `## CRITICAL RULES` h2 sandwich with the anti-empty guard, replicating the `developer.md:3-11` pattern (note line + 3 bullets: envelope XML obligatorio, "Empty responses are NOT acceptable.", "Do NOT end without emitting the structured deliverable."). developer/planner/reviewer/researcher already conform (block at lines 5-11). New sandwich blocks go in `spec-manager.md` (after L3 `# SPEC-MANAGER SYSTEM PROMPT`, before `## YOUR IDENTITY`), `git-manager.md`, `project-manager.md`, and `orchestrator.md` (after L3 `# ORCHESTRATOR SYSTEM PROMPT`). Legacy `# CRITICAL RULES` h1 numbered blocks are renamed to `## Behavioral Rules` (3 renames: orchestrator.md L354/26 items, git-manager.md L71/9 items, project-manager.md L146/8 items) — NO numbered guard items added; the 43 behavioral rules stay intact.
3. **Programmatic Guardrail** — add rule `orchestrator-delegation-suffix-required` to `.opencode/guardrails-rules.ts` (12 rules exist; pattern is addable). Blocks `task` tool calls whose prompt lacks the "DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)" suffix, with `GUARDRAIL_BLOCKED` + retry hint.
4. **Schema Reuse (no file change)** — `orchestrator.schema.json` already supports `retryCount` (integer, lines 57/95) and `result` enum includes `'retry'` (line 30). Reuse existing fields.
5. **Silent-Exit Telemetry Activation** — modify `.opencode/plugins/output-contracts.ts` so the `extractTaskResult === null` path (empty output) appends a `silent_exit_candidate` entry to `.opencode/logs/contract-audit.jsonl` instead of only `console.warn`, making the problem measurable.
6. **Documentation** — document the `subagent.silent_exit` telemetry event in `docs/opencode/output-contracts.md` (new "Subagent Silent Exit Audit" section).

## Capabilities

### New Capabilities
- `orchestrator-retry-protocol`: Layer-3 (orchestrator-level) detection and recovery from empty delegation output — parse `<task_result>`, detect silent exit, re-delegate with task_id correlation resume up to 3 retries with best-effort backoff, emit `subagent.silent_exit` telemetry (bash `echo >>` + `mkdir -p`).
- `empty-response-guard`: All 8 agent prompts in `docs/opencode/prompts/` SHALL include an explicit anti-empty-output guard ("Empty responses are NOT acceptable") in a top-of-file `## CRITICAL RULES` section; legacy `# CRITICAL RULES` h1 blocks SHALL be renamed to `## Behavioral Rules`.

### Modified Capabilities
- `neurosymbolic-guardrails`: New rule `orchestrator-delegation-suffix-required` — blocks `task` tool invocations whose delegation prompt omits the DELEGATION SUFFIX block, returning `GUARDRAIL_BLOCKED` with a retry hint.
- `output-contract-validation`: The Layer-2 plugin now logs `silent_exit_candidate` JSONL entries to `contract-audit.jsonl` when `extractTaskResult` returns null (empty `<task_result>`), making silent exits measurable.

## Impact

- `docs/opencode/prompts/orchestrator.md` — Layer-3 retry protocol (detection, resume re-delegation, best-effort backoff, telemetry) + new top-of-file `## CRITICAL RULES` sandwich + L354 `# CRITICAL RULES` renamed to `## Behavioral Rules`
- `docs/opencode/prompts/spec-manager.md` — new top-of-file `## CRITICAL RULES` block with anti-empty guard (between L3 and `## YOUR IDENTITY`)
- `docs/opencode/prompts/git-manager.md` — new top-of-file `## CRITICAL RULES` block; L71 `# CRITICAL RULES` renamed to `## Behavioral Rules`
- `docs/opencode/prompts/project-manager.md` — new top-of-file `## CRITICAL RULES` block; L146 `# CRITICAL RULES` renamed to `## Behavioral Rules`
- `.opencode/guardrails-rules.ts` — new rule `orchestrator-delegation-suffix-required` (+ its test file)
- `.opencode/plugins/output-contracts.ts` — `silent_exit_candidate` audit logging on null extraction
- `docs/opencode/output-contracts.md` — "Subagent Silent Exit Audit" section
- `.opencode/logs/subagent-silent-exit-audit.jsonl` — new telemetry log (runtime artifact)
- NO OpenCode core changes; NO upgrade required (all upstream PRs unmerged)

## Deferred Risks

- **Runtime args-shape assumption for `args.prompt` (non-blocking, high-priority review)**: The guardrail rule `orchestrator-delegation-suffix-required` (`validateOrchestratorDelegationSuffixRequired` in `.opencode/guardrails-rules.ts`) assumes the task tool exposes the delegation prompt as `args.prompt` at `tool.execute.before`. This was verified against the current task-tool args shape during implementation, but no runtime args-shape dump was captured to confirm the exact field name at runtime. If the real field differs, the rule fails open per its spec scenario (`{ allowed: true }` + `console.warn` "[guardrails] orchestrator-delegation-suffix-required: prompt unextractable, failing open") — safe behavior, but the guardrail silently becomes a no-op. Deferred action: dump the task tool args shape at runtime in a live session and confirm `output.args.prompt` (or update the rule's extraction path accordingly). NOT a blocker for this change.
