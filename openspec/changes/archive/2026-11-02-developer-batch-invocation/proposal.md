# Proposal

## Why

The developer agent currently reads `tasks.md` for every single task and implements one task at a time, waiting for confirmation between each. This per-task invocation model is wasteful and does not scale. Phase 1 of the subagent factorization plan changes the `developer.md` prompt to a batch invocation protocol: read `tasks.md` once per change, implement tasks in batches of 3-5, mark each task complete, and wait for the next batch instruction. This aligns with the future single-agent flow and reduces invocations from one-per-task to one-per-batch.

> **Amended 2026-11-02 — supersession note:** the target file `docs/opencode/prompts/developer.md` was subsequently **deleted by the sibling change `single-main-agent`** (developer agent retired). The batch-protocol content this change implemented was **extracted into `.opencode/skills/implementation-protocol/SKILL.md`**, where it survives verbatim (Batch Invocation Protocol, Batch Sizing Rules, Marking Tasks Complete, "Batch N Complete", "Do NOT auto-continue"). The change is therefore **satisfied-by-extraction**: implemented as designed, then relocated by the sibling change. Tasks 2.3 and 3.1 (REMEMBER line, full-file read) are historical-only — see tasks.md.

## What Changes

- Modify `docs/opencode/prompts/developer.md` OpenSpec mode section to use the batch invocation protocol — **later extracted to `.opencode/skills/implementation-protocol/SKILL.md` by `single-main-agent`**
- Read `tasks.md` once per change (not per task)
- Implement tasks in batches (groups of 3-5)
- Mark `[x]` after each task
- Wait for next batch instruction before continuing
- Align prompt wording with the future single-agent flow

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

- Affected code: `docs/opencode/prompts/developer.md` (prompt only) — **since deleted by `single-main-agent`; content relocated to `.opencode/skills/implementation-protocol/SKILL.md`**
- No API, dependency, or runtime changes
- No spec-level behavior changes (`skip_specs: true`)
