# Proposal

## Why

`spec-manager` and `git-manager` are command-wrapper subagents: they only wrap `/opsx-*` and `/commit-*` invocations and receive the interrogatorio summary truncated into a single delegation line. They add an extra hop that loses context, cost nothing in intelligence, and are not justified by the subagent criteria (context isolation, parallel work, tool conflicts, independent verification). Retiring them lets the principal run the commands directly, keeping the interrogatorio summary in the same context and committing right after each task batch.

## What Changes

- **Remove `spec-manager` and `git-manager` agents** from `agent.*` in `opencode.jsonc` (definitions + orchestrator `task` allowlist entries).
- **Principal executes `/opsx-*` and `/commit-*` directly** via restricted bash patterns (`openspec *`, `git status`, `git diff --stat`, `git add`, `git commit`, `gh`), with the rest of git still blocked.
- **Keep the interrogatorio summary in the same context** — no delegation truncation; the principal owns the conversation end-to-end.
- **Commit right after each task batch** using the message taken from the task (no full diff re-read).
- **Update documentation and guardrails** referencing the retired agents: `AGENTS.md` auto-invoke table, `CONTEXT.md` glossary, `.opencode/command/commit-all.md`, `.opencode/guardrails-rules.ts`, plus `docs/opencode/prompts/orchestrator.md` and the `sdd-workflow`/`git-workflow` skills.
- **No spec-level behavior changes** — pure refactor/tooling/docs change.

## Capabilities

### New Capabilities

None — this is a pure refactor (no spec-level behavior changes).

### Modified Capabilities

None.

> **Note:** This change sets `skip_specs: true` in `.openspec.yaml` because it is a pure refactor/tooling/docs change with no spec-level behavior changes.

## Impact

- **Affected files:** `opencode.jsonc`, `docs/opencode/prompts/orchestrator.md`, `AGENTS.md`, `CONTEXT.md`, `.opencode/command/commit-all.md`, `.opencode/guardrails-rules.ts`, `.opencode/skills/sdd-workflow/SKILL.md`, `.opencode/skills/git-workflow/SKILL.md`.
- **Removed files:** `docs/opencode/prompts/spec-manager.md`, `docs/opencode/prompts/git-manager.md` (and their output-contract schemas, if now unused).
- **Affected systems:** OpenCode agent configuration, subagent orchestration, guardrails rule matching, documentation references.
- **Exit criterion:** eval passes without regressions and all inviolable rules remain green; principal runs `/opsx-*` and `/commit-*` directly with no delegation hop.
