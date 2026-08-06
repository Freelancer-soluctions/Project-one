## Context

See proposal.md — Why. The Subagent Silent Exit failure mode is confirmed at the tool-serialization layer (AI SDK v6 maps finish reason `'other'` → terminal success → `findLast(text)?.text ?? ''` → empty `<task_result>`). All upstream PRs are unmerged, so the fix must live in our own layer: orchestrator prompt (Layer 3), subagent prompts, guardrails registry, and the Layer-2 plugin. The Layer-2 plugin is observe-only by contract (see `output-contract-validation` spec — "Output Non-Mutation"); it annotates but must not mutate `output.output`, and it cannot re-invoke the model. `withRetry` exists in `contractValidator.js:288-339` (maxRetries=2, escalation report at lines 245-251) but is dead code — Layer 2 cannot call it meaningfully because it has no reissue path to a fresh model turn. The orchestrator, however, CAN re-delegate: it owns the `task` tool and can re-invoke it with a resume message.

Key existing assets reused:
- `orchestrator.schema.json` already declares `retryCount` (integer, lines 57/95) and `result` enum includes `'retry'` (line 30) — no schema change.
- `orchestrator.md` already has the DELEGATION SUFFIX TEMPLATE (lines 271-284) and the token-based chunking rule.
- `developer.md:5-11` is the reference CRITICAL RULES pattern with the anti-empty guard.
- `guardrails-rules.ts` has 12 rules; pattern is `{ name, description, tool, validate }` registered in `TOOL_RULES`.

## Goals / Non-Goals

**Goals:**
- Detect silent exits at the orchestrator level from the `<task_result>` payload (empty body or missing envelope).
- Recover by re-delegating to the same subagent with task_id correlation resume + "Retry N/3" note, max 3 retries, best-effort backoff.
- Make silent exits measurable: orchestrator writes `subagent.silent_exit` events to `subagent-silent-exit-audit.jsonl` (via bash `echo >>` + `mkdir -p`); Layer-2 plugin writes `silent_exit_candidate` entries to `contract-audit.jsonl`.
- Prevent silent exits structurally: all 8 agent prompts (including the orchestrator) carry the anti-empty guard as a top-of-file `## CRITICAL RULES` sandwich; a guardrail blocks suffix-less delegations.

**Non-Goals:**
- NO OpenCode core changes (no patching AI SDK, no merging upstream PRs).
- NO version upgrade (none released contains the fix).
- NO change to Layer-2's observe-only contract (still never mutates `output.output`; retry stays at Layer 3).
- NO schema file changes (`orchestrator.schema.json` reused as-is).
- NO redesign of the existing withRetry dead code in `contractValidator.js` (left in place; orchestrator re-delegation is the live retry path).
- NO sync of delta specs to main specs in this change (sync happens at the archive step).

## Decisions

### D1: Retry lives in the orchestrator prompt, not the plugin
The orchestrator prompt (`orchestrator.md`) is extended with a Layer-3 Retry Protocol section: after each `task` call, parse `<task_result>`; empty or envelope-less → re-delegate.

- **Rationale**: The orchestrator is the only component that can re-invoke the `task` tool with a fresh model turn. Layer 2 is observe-only by spec; `withRetry` lacks a reissue path to a new turn.
- **Alternatives considered**: (a) Make Layer 2 retry — rejected: violates Output Non-Mutation spec and has no model-turn reissue. (b) Fix upstream — rejected: all 5 PRs unmerged (#29048 closed, #39473 draft, #30304 closed, #19519 closed, #26167 open).

### D2: Max 3 retries with best-effort incremental backoff
Retry budget = 3 attempts (retryCount 1..3), then escalate to the user. Backoff 2s / 5s / 10s between attempts (max 30s total) is a best-effort SHOULD, not a rigid SHALL: the orchestrator applies it when a pause is possible within the turn, and the plugin/guardrail layer supplies the real retry value.

- **Rationale**: Aligns with the Hermes-agent hardcoded 3x retry pattern (PR #9934 fixing issue #5225 / issue #58670). 3 is enough for a transient empty-generation without burning budget on a genuinely stuck delegation. Backoff is best-effort because the orchestrator cannot guarantee a wall-clock sleep inside a single model turn; hard enforcement from a prompt alone is unenforceable (per @planner Issue 4).
- **Alternatives considered**: 2 retries (matches contractValidator maxRetries) — rejected: researcher evidence favors 3x (Hermes). Unlimited retries — rejected: unbounded cost. Rigid SHALL backoff — rejected by @planner (Issue 4): unenforceable from prompt text; downgraded to SHOULD.

### D3: Resume via task_id + original delegation, not a summary
Re-delegation embeds the original delegation text plus `"Your previous attempt produced NO output. Retry N/3:"` and keeps the DELEGATION SUFFIX as the final block.

- **Rationale**: The subagent lost its context mid-generation; a summary risks information loss (recency-bias mitigation from `subagent-prompt-hardening`). Full original text + resume note + suffix guarantees identical scope with a directive to emit.
- **Alternatives considered**: Re-send only a `task_id` pointer — rejected, but the rationale is corrected per @planner (Issue 3): the opencode `task` tool DOES accept `task_id` for session resume, so "subagent has no reliable access to the prior message contents" is factually unsound. The restriction on passing `task_id` as a tool argument is kept for two sound reasons: (a) determinism — every retry replays the identical full delegation, so outcomes are comparable and the retry is self-contained; (b) framework-independence — the retry MUST NOT depend on the framework's session-resurrection behavior, which is not guaranteed across retries.

### D4: Guardrail rule validates the suffix programmatically
New rule `orchestrator-delegation-suffix-required` on the `task` tool checks the prompt for the "DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)" marker; missing → `GUARDRAIL_BLOCKED` + retry hint.

- **Rationale**: Prompt-level instructions alone are soft; a programmatic rule makes suffix omission a hard, auditable failure (12 existing rules prove the pattern).
- **Alternatives considered**: Rely solely on prompt text — rejected: no enforcement, no audit trail.

### D5: Silent-exit telemetry split across two logs
- Orchestrator (Layer 3) writes `subagent.silent_exit` → `subagent-silent-exit-audit.jsonl` (fields: timestamp ISO 8601, session_id, delegatedAgent, retryCount, failureReason).
- Plugin (Layer 2) writes `silent_exit_candidate` → `contract-audit.jsonl` (fields: timestamp, agent, sessionId, task, retryCount: 0).

**Orchestrator write mechanism (concrete, per user Phase-0 decision 4):** the orchestrator appends via bash with `mkdir -p` + `echo >>` and a single-line escaped JSON payload (the orchestrator has bash in its tool policy):

```bash
mkdir -p .opencode/logs && echo '{"eventType":"subagent.silent_exit","timestamp":"<ISO-8601>","session_id":"<session>","delegatedAgent":"<agent>","retryCount":<N>,"failureReason":"<reason>"}' >> .opencode/logs/subagent-silent-exit-audit.jsonl
```

JSON rules for the echoed line: double quotes only, no trailing comma, escape newlines/double quotes inside values (`\n`, `\"`), no markdown fences inside the payload. Placeholders are substituted at write time.

- **Rationale**: Layer 2 observes the empty extraction before the orchestrator reacts; Layer 3 records the recovery outcome. Two logs preserve each layer's ownership: `contract-audit.jsonl` is the validator's log, `subagent-silent-exit-audit.jsonl` is the recovery log. The bash `echo >>` mechanism is the concrete execution path the orchestrator can actually run (it has no Node execution path; bash is in its tool policy) and `mkdir -p` guarantees the directory exists lazily.
- **Alternatives considered**: Single log — rejected: mixes validator events and recovery events with different field sets. Plugin-side write from the orchestrator — rejected: no Node execution path in the orchestrator prompt; bash `echo >>` is the executable mechanism.

### D6: Prompt guard unification — user decision D1 (Hybrid) across all 8 prompts
User decision D1 (Hybrid) supersedes the earlier "4 prompts / mid-file / numbered item" plan (amended per @planner Issues 1-3):

1. **Top-of-file `## CRITICAL RULES` h2 sandwich with anti-empty guard** for all 8 prompts in `docs/opencode/prompts/` (developer, spec-manager, git-manager, project-manager, planner, reviewer, researcher, orchestrator). developer/planner/reviewer/researcher already conform (block at lines 5-11). The 4 prompts missing it get a NEW `## CRITICAL RULES` block right after the `# <AGENT> SYSTEM PROMPT` h1 and before `## YOUR IDENTITY`, replicating the `developer.md:3-11` pattern: the note line plus 3 bullets (`<output-contract>` envelope XML obligatorio, "Empty responses are NOT acceptable.", "Do NOT end without emitting the structured deliverable.").
2. **Legacy `# CRITICAL RULES` h1 numbered blocks renamed to `## Behavioral Rules`** (3 renames, content untouched): orchestrator.md L354 (26 items), git-manager.md L71 (9 items), project-manager.md L146 (8 items). NO numbered guard item is added to these blocks — the guard lives only in the top-of-file sandwich (avoids a third variant, per @planner Issue 1).
3. **The 43 behavioral rules stay intact** (26 + 9 + 8) — zero risk of breaking delegation chains or safety rules.

- **Rationale**: developer.md already has the pattern and is the reference; the other three are the observed silent-exit victims, and the orchestrator (whose own final responses are NOT hook-validated) needs the guard too. Unifying makes the guard a structural invariant for every agent prompt. Retrocompat verified: `grep 'critical rule \d+'` → 0 hits in `docs/**/*.md`, so no external reference depends on the h1 numbering.
- **Enforceable invariant**: every `docs/opencode/prompts/*.md` SHALL have `## CRITICAL RULES` within the first ~15 lines, SHALL have NO `# CRITICAL RULES` h1 anywhere, and every `## CRITICAL RULES` SHALL contain the bullet "Empty responses are NOT acceptable". Enforcement: a new vitest test in `docs/opencode/prompts/contracts/` (task 5.5) — the coverage gate in `openspec/specs/prompt-format/spec.md:70-83` is aspirational (not implemented today), so the vitest test is the real enforceable mechanism available.
- **Alternatives considered**: (a) Only fix spec-manager (current victim) — rejected: silent exit is agent-agnostic. (b) Add the guard as a numbered item inside the legacy `# CRITICAL RULES` blocks — rejected by @planner (Issue 1) and by user decision D1: creates a third variant and keeps mid-file placement. (c) Full unification to a single h2-only style, deleting the numbered blocks — rejected by user decision D1: the 43 legacy rules are preserved under `## Behavioral Rules`.

### D7: Supplementary signals and future hardening (amendment pass)
- The plugin's `output.metadata.contractValidation` signal COULD serve as a supplementary orchestrator trigger for envelope-less responses (programmatic signal vs. LLM text parse of `<task_result>`), reducing reliance on prompt-level parsing.
- FUTURE: a session-level retry budget (e.g., max 5 silent-exit escalations per session) SHOULD bound clustered failures.
- The orchestrator's own final responses are NOT hook-validated (the plugin fires only on the `task` tool) — this gap is mitigated NOW under D6/D1: the top-of-file `## CRITICAL RULES` sandwich gives the orchestrator the same anti-empty guard as the subagents, compensating for the missing hook validation on its output.

## Risks / Trade-offs

- [Retry loop on persistently stuck subagent] → Mitigation: hard cap of 3 retries + escalate to user with failure summary; audit log records every attempt.
- [Backoff adds latency to already-slow delegations] → Mitigation: keep backoff small and incremental (seconds, not minutes); only triggered on actual silent exits; best-effort (SHOULD) so a non-pausing orchestrator does not stall.
- [Guardrail false-positive blocks legitimate task calls] → Mitigation: rule only triggers when the suffix marker is absent; DELEGATION SUFFIX is mandatory for ALL delegations by design (orchestrator.md line 273: "ALWAYS append ... No other instruction may follow"). If a legit call is blocked, the retry hint tells the orchestrator exactly what to add.
- [Two audit logs drift out of sync] → Mitigation: shared field semantics documented in `docs/opencode/output-contracts.md` "Subagent Silent Exit Audit" section; both entries share `timestamp`/`agent`.
- [Prompt length grows] → Mitigation: guards are one line each; the retry protocol section replaces prose with a compact numbered protocol; token-based chunking rule (already present) limits total delegation size.
- [Renaming `# CRITICAL RULES` → `## Behavioral Rules` breaks references] → Mitigation: verified `grep 'critical rule \d+'` = 0 hits in `docs/**/*.md`; the rename is heading-level only, item text untouched (43 items preserved).

## Migration Plan

1. Edit prompt files (orchestrator, spec-manager, git-manager, project-manager) — 4 new top-of-file `## CRITICAL RULES` sandwiches + 3 heading renames (`# CRITICAL RULES` → `## Behavioral Rules`) — pure documentation/instruction changes, no runtime migration.
2. Add guardrail rule to `guardrails-rules.ts` + tests.
3. Modify plugin `output-contracts.ts` null-extraction path to append `silent_exit_candidate` entries; update docs.
4. Rollback: revert prompt/plugin/guardrail changes via git — no data migration, no schema change, no external service involved.

## Open Questions

None — all deferrable unknowns resolved by researcher evidence (retry count, backoff, schema reuse, log locations, guard placement) and by user Phase-0 decisions (D1 Hybrid style, top-of-file placement, best-effort backoff, bash echo telemetry).
