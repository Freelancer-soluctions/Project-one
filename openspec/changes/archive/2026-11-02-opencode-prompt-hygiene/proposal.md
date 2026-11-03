# Proposal

## Why

Agent prompts carry redundant MCP policy blocks and "Why:" justification paragraphs that inflate token cost per turn without changing agent behavior. Additionally, `docs/CONTEXT-CICD.md` (~large) is always loaded via the `instructions` array in `opencode.jsonc`, even when CI/CD context is irrelevant to the task. Finally, orchestrator rule 19 ("ALWAYS inject CONTEXT.md into subagent prompts") duplicates the CONTEXT.md injection already performed by the `instructions` array, wasting tokens on redundant instructions.

## What Changes

- **Remove MCP policy blocks and "Why:" paragraphs** from the prompts that contain them (`researcher.md`, `project-manager.md` verified on disk; `developer.md` and `planner.md` were later **deleted by sibling changes** — `single-main-agent` and `merge-planner-into-reviewer` — so those edits are N/A and the goal state is satisfied by deletion). Keep the actionable guidance, drop the rationale paragraphs.
- **Remove `docs/CONTEXT-CICD.md`** from the `instructions` array in `opencode.jsonc`.
- **Create a new skill `cicd-context`** (`.opencode/skills/cicd-context/SKILL.md`) that loads CI/CD context on-demand, mirroring the existing skill pattern.
- ~~**Verify and eliminate duplication of rule 19** in `orchestrator.md`~~ **N/A — `orchestrator.md` deleted by `single-main-agent`. Verified: no remaining prompt contains a `CONTEXT.md` injection instruction.**

## Capabilities

### New Capabilities

None — this is a pure prompt-hygiene refactor (no spec-level behavior changes).

### Modified Capabilities

None.

> **Note:** This change sets `skip_specs: true` in `.openspec.yaml` because it is a pure refactor/tooling/docs change with no spec-level behavior changes.

## Impact

- **Affected files:** `docs/opencode/prompts/researcher.md`, `project-manager.md`, `opencode.jsonc` _(originally also `developer.md`, `planner.md`, `orchestrator.md` — since deleted by sibling changes `single-main-agent` / `merge-planner-into-reviewer`, so their edits are N/A)_. `skills-lock.json` **not affected** (it tracks marketplace skills, not local `.opencode/skills` entries) — corrected 2026-11-02.
- **New files:** `.opencode/skills/cicd-context/SKILL.md`
- **Affected systems:** OpenCode agent configuration, skill loading
- **Exit criterion:** `opencode debug config` exits 0; zero residual `**Why:**`/MCP-policy blocks across all prompts; CI/CD context still available on-demand via the new skill. _(Token-per-turn ≤ baseline comparison deferred to `opencode-eval-baseline-execution`, which must first capture the C0 baseline — original "5.5".)_
