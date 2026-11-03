# Proposal

## Why

The current agent topology splits the primary entry point (`orchestrator`, coordination-only, no write/edit/bash) from the implementation worker (`developer`, write/edit/bash, no delegation). Every implementation cycle therefore crosses a delegation boundary: the orchestrator hands tasks to `developer`, waits, then resumes — duplicating context, truncating the interrogatorio summary, and inflating token cost per task batch. With `spec-manager` and `git-manager` already retired (ops run directly) and `planner` merged into `reviewer`, the orchestrator no longer delegates anything that justifies a separate non-implementing primary agent. Collapsing orchestrator + developer into one primary "main" agent keeps coordination and implementation in the same context, removes the boundary tax, and lets the single agent apply its own edits immediately after planning.

## What Changes

- **Create a single primary `main` agent** with a short core prompt (identity, always-applicable rules, and a "when to load each skill" index) instead of the 374-line orchestrator prompt plus the developer prompt. Heavy checklists move into on-demand skills.
- **Grant the main agent both coordination and implementation permissions** (`read/write/edit/bash/glob/grep/task/question/skill/todowrite`), so it can delegate to subagents (reviewer, researcher, and conditionally project-manager) while also editing code directly.
- **Model per phase**: assign the appropriate model to each phase (planning/review vs. implementation) via agent/model config in `opencode.jsonc` (and command frontmatter if OpenCode supports it); investigate support before relying on the latter.
- **Retire the `orchestrator` and `developer` agents**: remove their definitions from `opencode.jsonc`, their entries from any `task` allowlists, and their prompt files (kept in git history for reversibility).
- **Remove the `edit: ask` workaround** in `opencode.jsonc` (orchestrator and researcher) **if bug #26758 is confirmed fixed** in the installed OpenCode version; otherwise retain the workaround and document the dependency.
- **Verify `reviewer` and `researcher` keep `read`/`glob`/`grep`** after the reconfiguration (no regression in their read-only inspection capability).
- **Decide on `project-manager`**: measure the token cost of the Composio tool definitions; if low, fold Trello/project-management handling into the main agent (allowing `composio_COMPOSIO_*`), otherwise keep `project-manager` as a subagent.
- **Update `AGENTS.md`**, **`CONTEXT.md`**, and **guardrails rules** to reflect the new single-agent topology and remove orchestrator/developer references.
- **Update orchestrator routing tables** and any docs that cite the retired agents; principal now runs ops and edits directly.

## Capabilities

### New Capabilities

None — this is a pure agent-config/prompt refactor (no spec-level behavior changes).

### Modified Capabilities

None.

> **Note:** This change sets `skip_specs: true` in `.openspec.yaml` because it is a pure refactor/tooling/docs change with no spec-level behavior changes.

## Impact

- **Affected files:** `opencode.jsonc`, `docs/opencode/prompts/orchestrator.md`, `docs/opencode/prompts/developer.md`, new `docs/opencode/prompts/main.md`, `AGENTS.md`, `CONTEXT.md`, `.opencode/guardrails-rules.ts`, docs under `docs/opencode/` that cite the retired agents.
- **Removed:** `orchestrator` and `developer` agent definitions and their `task` allowlist entries (prompt files retained in git history for reversibility).
- **Affected systems:** OpenCode agent configuration, skill loading, guardrails messaging, documentation, and the delegation model (fewer subagents; main agent edits directly).
- **Exit criterion:** single `main` agent handles both coordination and implementation; eval passes with no regressions; all inviolable rules remain green; no delegation to retired agents remains; reviewer/researcher retain read/glob/grep; Composio token decision recorded.
