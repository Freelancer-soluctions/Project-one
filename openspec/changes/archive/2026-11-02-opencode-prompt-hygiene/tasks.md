# Tasks: opencode-prompt-hygiene

## Prompt Edits

> **Amended 2026-11-02:** tasks 1.1-1.4 targeted `developer.md` and `planner.md`, which were **deleted by sibling changes** (`single-main-agent` retired developer; `merge-planner-into-reviewer` merged planner into reviewer). The MCP-policy/`Why:` goal state is satisfied by deletion; the edits were never executable as written.

- [x] 1.1 ~~Remove MCP policy block from `docs/opencode/prompts/developer.md` (Context7 section heading + bullets + Why line)~~ **N/A — `developer.md` deleted by `single-main-agent`.**
- [x] 1.2 ~~Remove `**Why:**` paragraph from `docs/opencode/prompts/developer.md`~~ **N/A — `developer.md` deleted by `single-main-agent`.**
- [x] 1.3 ~~Remove MCP policy block from `docs/opencode/prompts/planner.md` (MCP TOOL USAGE POLICY section heading + all bullets + Why line)~~ **N/A — `planner.md` deleted by `merge-planner-into-reviewer`.**
- [x] 1.4 ~~Remove `**Why:**` paragraph from `docs/opencode/prompts/planner.md`~~ **N/A — `planner.md` deleted by `merge-planner-into-reviewer`.**
- [x] 1.5 Remove MCP policy block from `docs/opencode/prompts/researcher.md` (Context7 section heading + bullets + Why line)
- [x] 1.6 Remove `**Why:**` paragraph from `docs/opencode/prompts/researcher.md`
- [x] 1.7 Remove MCP policy block from `docs/opencode/prompts/project-manager.md` (Composio section heading + bullets + Why line)
- [x] 1.8 Remove `**Why:**` paragraph from `docs/opencode/prompts/project-manager.md`

## Create cicd-context Skill (COMPLETED — applied on disk)

- [x] 2.1 Create `.opencode/skills/cicd-context/SKILL.md` from `docs/CONTEXT-CICD.md`
- [x] 2.2 Verify skill follows skill-creator pattern (frontmatter, progressive disclosure)

## Config Changes (COMPLETED — applied on disk)

- [x] 3.1 Remove `docs/CONTEXT-CICD.md` from `instructions` array in `opencode.jsonc`
- [x] 3.2 Verify config parses as valid JSONC

## Orchestrator Rule Deduplication

> **Amended 2026-11-02:** tasks 4.1-4.5 targeted `orchestrator.md`, which was **deleted by `single-main-agent`** (orchestrator retired). The redundancy goal state is satisfied by deletion; grep of all remaining prompts confirms zero `CONTEXT.md` injection instructions and no "rule 19" references.

- [x] 4.1 ~~Verify rule 19 in orchestrator.md duplicates CONTEXT.md injection (already loaded via instructions)~~ **N/A — `orchestrator.md` deleted by `single-main-agent`.**
- [x] 4.2 ~~Remove rule 19 from orchestrator.md (redundant with instructions array)~~ **N/A — `orchestrator.md` deleted by `single-main-agent`.**
- [x] 4.3 ~~Renumber subsequent rules (20-26 → 19-25)~~ **N/A — `orchestrator.md` deleted by `single-main-agent`.**

## Residual Duplication Fix

- [x] 4.4 ~~Remove residual CONTEXT.md injection instruction from Token Efficiency Protocols section 1 in orchestrator.md (line ~337-339: "Antes de delegar cualquier tarea a un subagente, DEBES inyectar el contenido de CONTEXT.md en su prompt de sistema")~~ **N/A — `orchestrator.md` deleted by `single-main-agent`. Verified: no remaining prompt contains a `CONTEXT.md` injection instruction.**
- [x] 4.5 ~~Update stale token-estimate wording at line ~323 ("CONTEXT.md injected (~600 tokens)")~~ **N/A — `orchestrator.md` deleted by `single-main-agent`.**

## Verification

- [x] 5.1 Grep for residual `**Why:**` lines in all 4 prompts — must be zero ✅ (confirmed: zero matches)
- [x] 5.2 Grep for residual MCP policy blocks in all 4 prompts — must be zero ✅ (blocks removed per updated design D1)
- [x] 5.3 Verify cicd-context skill is loadable ✅ (skill exists and follows pattern)
- [x] 5.4 Verify opencode.jsonc parses correctly ✅ (config valid)
- Omitted 5.5 — Compare token count per turn vs baseline (must be <=). Reason: the C0 baseline was deferred by `opencode-eval-baseline`; this comparison runs once `opencode-eval-baseline-execution` captures it.
