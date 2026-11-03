# Proposal

## Why

The current `opencode.jsonc` configuration leaves performance and safety headroom unused: `tool_output` allows up to 400 lines / 64 KB per tool output (excessive for agent context windows) and the built-in `build`, `plan`, and `general` agents remain active (their `disable` lines are commented out) despite being unused. These are low-risk, high-impact hygiene changes that reduce token waste without changing any behavior.

> **Amended 2026-11-02:** the original third concern — the `developer` agent's `webfetch`/`websearch` being enabled — is **superseded by the sibling change `single-main-agent`**, which retired the `developer` agent entirely (block deleted from `opencode.jsonc`, prompt file deleted). The security intent is satisfied vacuously: no `developer` agent means no web access, and the global `permission` block already denies both. Decision 3 and tasks 1.3/2.3 record this as N/A.

## What Changes

- **`tool_output` limits** in `opencode.jsonc`: reduce `max_lines` from 400 to 150 and `max_bytes` from 65536 to 16384 (16 KB). This cuts noisy tool output that bloats agent context.
- **Disable unused built-in agents**: uncomment the `disable: true` lines for `build`, `plan`, and `general` in the `agent` section of `opencode.jsonc`. These agents are not used in the orchestrator/subagent workflow and their presence adds confusion.
- ~~**Remove web access from developer agent**: set `webfetch` and `websearch` to `"deny"` in the `developer` agent's permission block.~~ **N/A — superseded by `single-main-agent`** (developer agent retired; block no longer exists). Research delegation to `researcher` remains the standing convention.

## Capabilities

### New Capabilities

None — this is a pure configuration change with no new capabilities.

### Modified Capabilities

None — no spec-level behavior changes. `skip_specs: true` is set in `.openspec.yaml`.

## Impact

- **Affected file**: `opencode.jsonc` only (3 targeted edits).
- **No affected code, APIs, dependencies, or systems**: configuration-only change.
- **Exit criterion**: `opencode debug config` exits 0; `build`/`general`/`plan` no longer appear in the agent list; `tool_output` reports 150/16384; no workflow/script references the disabled agents. _(Original third clause "developer agent no longer has web access" is N/A — developer retired by `single-main-agent`. Original "eval smoke passes" clause dropped: no eval smoke script exists in the repo.)_
- **Reversibility**: trivial — revert the commit restores previous config.
