# Design

## Context

Single configuration file `opencode.jsonc` at the repository root. The change touches two active regions of that file: the top-level `tool_output` object (lines 69-72) and the commented-out built-in agent entries inside `agent` (lines 118-127). No code, tests, or other configuration files are involved. See `proposal.md` for motivation.

> **Amended 2026-11-02:** the third region originally in scope — the `developer` subagent's `permission` block (formerly lines 202-203) — was deleted by the sibling change `single-main-agent`, which retired the `developer` agent entirely. Decision 3 below is recorded as superseded/N/A.

## Goals / Non-Goals

**Goals:**

- Reduce per-tool output caps to 150 lines / 16 KB.
- Activate the already-present (but commented) `disable: true` flags for `build`, `plan`, and `general`.
- ~~Deny `webfetch`/`websearch` in the `developer` agent so research is delegated to the free `researcher` subagent.~~ **N/A — superseded by `single-main-agent` (developer retired).**
- Provide exact, reviewable before/after snippets and a verification checklist so the change is trivially auditable and reversible.

**Non-Goals:**

- No changes to any other agent's permissions.
- No changes to `researcher`, `planner`, or global `permission` blocks.
- No schema or spec modifications (`skip_specs: true`).
- No tooling, hook, or CI changes.

## Decisions

### Decision 1 — `tool_output` caps

**Location:** `opencode.jsonc` lines 69-72 (top-level `tool_output`).

**Before:**

```jsonc
"tool_output": {
  "max_lines": 400,
  "max_bytes": 65536
},
```

**After:**

```jsonc
"tool_output": {
  "max_lines": 150,
  "max_bytes": 16384
},
```

**Rationale:** 400 lines / 64 KB per tool output is far larger than an agent context window needs for a single result; large outputs crowd out reasoning tokens and inflate cost. 150 lines / 16 KB retains enough content for diagnosis while truncating runaway outputs. Values chosen to match typical terminal output that is still readable.

**Alternatives considered:**

- 100 lines / 8 KB — rejected: too aggressive; risks truncating legitimate multi-file grep/diff output.
- 200 lines / 32 KB — rejected: still excessive relative to the goal; marginal benefit over 150/16.
- Keep 400/64 and rely on agent summarization — rejected: pushes cost onto every call instead of capping at source.

### Decision 2 — Disable unused built-in agents

**Location:** `opencode.jsonc` lines 118-127 (inside `agent`, currently commented).

**Before:**

```jsonc
// OpenCode built-in agents — disabled, not used
// "build": {
//   "disable": true,
// },
// "plan": {
//   "disable": true,
// },
// "general": {
//   "disable": true,
// },
```

**After:**

```jsonc
// OpenCode built-in agents — disabled, not used
"build": {
  "disable": true,
},
"plan": {
  "disable": true,
},
"general": {
  "disable": true,
},
```

**Rationale:** The entries already exist in commented form, indicating intent. Uncommenting activates them without introducing new keys. These built-ins are unused in the orchestrator/subagent workflow and their presence adds noise to the agent list. Using the existing `disable: true` mechanism (rather than deleting the entries) keeps the config self-documenting and trivially reversible.

**Alternatives considered:**

- Delete the entries entirely — rejected: loses the documentation of intent and makes re-enabling require re-adding boilerplate.
- Keep commented — rejected: leaves the agents active, defeating the hygiene goal.
- Disable only `build` and `general`, keep `plan` — rejected: `plan` is also unused (planning goes through the `planner` subagent).

### Decision 3 — Deny web access in `developer` — **SUPERSEDED / N/A (2026-11-02)**

**Original intent:** set `webfetch`/`websearch` to `"deny"` inside `agent.developer.permission` (formerly `opencode.jsonc` lines 202-203) so research is delegated to the free `researcher` subagent.

**Status:** **Not implemented as written — no longer applicable.** The sibling change `single-main-agent` retired the `developer` agent entirely: the `developer` block was deleted from `opencode.jsonc` and `docs/opencode/prompts/developer.md` was deleted. There is no `agent.developer.permission` left to edit, so the before/after snippet and migration step below cannot be applied.

**Security intent is satisfied vacuously:**

- No `developer` agent → no web access path through it.
- The global `permission` block already sets `webfetch`/`websearch` to `deny`, so any agent without an explicit override inherits the deny.

**Consequence for tasks:** tasks 1.3 and 2.3 are recorded as N/A (they were marked complete but were never executable as specified). Re-verification via `opencode debug agents` confirms no `developer` entry exists.

**Alternatives considered (retained for the record):**

- Set to `"ask"` instead of `"deny"` — rejected: adds friction without benefit; research should never be done by the implementation agent.
- Remove the keys entirely (inherit global deny) — rejected: explicit `"deny"` is clearer and self-documenting; matches the style of other agents.
- Also deny `context7_*` — rejected: out of scope; `context7` is a documentation lookup, not web search, and is already `"ask"`.

## Risks / Trade-offs

- [Risk] A tool result that legitimately exceeds 150 lines / 16 KB gets truncated → Mitigation: agents can re-run with narrower filters (grep/limit params) or request the file via `read` with offset; truncation is a soft cap, not data loss.
- [Risk] Disabling `build`/`plan`/`general` removes fallback entry points if orchestrator delegation fails → Mitigation: orchestrator remains the primary entry; subagents cover all workflows; re-enabling is one uncomment if needed.
- ~~[Risk] `developer` can no longer fetch docs mid-implementation → Mitigation: delegate to `researcher` subagent (free) or use `context7_*` (already `"ask"`).~~ **N/A — developer agent retired by `single-main-agent`.**
- [Risk] JSONC comment editing could introduce syntax errors → Mitigation: validate with a JSONC parser / OpenCode startup after edit; diff review before commit.

## Migration Plan

1. Edit `opencode.jsonc`:
   - Lines 69-72: set `max_lines` 150, `max_bytes` 16384.
   - Lines 119-127: uncomment `build`/`plan`/`general` disable blocks.
   - ~~Lines 202-203: set `webfetch`/`websearch` to `"deny"` in `developer`.~~ **N/A — developer block deleted by `single-main-agent`.**
2. Validate JSONC parses (OpenCode loads config on startup; or run a JSONC-aware linter).
3. Restart OpenCode / reload config.
4. Verify exit criteria:
   - `build`, `plan`, `general` no longer appear in the agent list.
   - `tool_output` reports `max_lines: 150`, `max_bytes: 16384`.
   - ~~`developer` agent reports `webfetch`/`websearch` denied.~~ **N/A — no developer agent.**
   - ~~Eval smoke passes.~~ **Dropped — no eval smoke script exists in the repo; replaced by `opencode debug config` exit 0.**
5. Rollback: revert the commit (single file, trivially reversible).

## Open Questions

None. All three changes are fully specified by the proposal and require no further decisions.
