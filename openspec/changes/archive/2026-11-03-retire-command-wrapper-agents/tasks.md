# Tasks

> **Sibling-change note (2026-11-03):** tasks 3.1-3.6 targeted `docs/opencode/prompts/orchestrator.md` and 9.1 targeted `developer.md` — both files were subsequently **deleted by `single-main-agent`** (orchestrator + developer retired), and `planner.md` by `merge-planner-into-reviewer`. Those tasks are **satisfied-by-sibling-deletion** (their content edits were applied at the time; the files no longer exist). Tasks 2.3/2.4/13.3 name the roster as it was then (orchestrator/planner/developer); the current end-state roster is `main`/`reviewer`/`researcher`/`project-manager` — strictly correct.

## 1. Prerequisite — bash allowlist (git-permissions-hardening)

- [x] 1.1 Verify `opencode.jsonc` orchestrator has a restricted `permission.bash` object (allow `openspec *`, `git status`, `git diff --stat`, `git add *`, `git commit *`, `gh *`; deny rest of git; default `ask`); if absent, apply it before proceeding and verify `opencode debug config` exits 0. (Applied by `git-permissions-hardening`, commit `e77bd25e`; `opencode debug config` exits 0.)

## 2. Agent Configuration (opencode.jsonc)

- [x] 2.1 Delete the `spec-manager` stanza from `agent.*` in `opencode.jsonc` and verify no `spec-manager` key remains under `agent`.
- [x] 2.2 Delete the `git-manager` stanza from `agent.*` in `opencode.jsonc` and verify no `git-manager` key remains under `agent`.
- [x] 2.3 Remove `"spec-manager": "allow"` and `"git-manager": "allow"` from orchestrator `task` allowlist in `opencode.jsonc` and verify remaining allowlist is planner/developer/reviewer/researcher/project-manager.
- [x] 2.4 Validate JSONC parses: `opencode debug config` exits 0; verify agent list contains only orchestrator/planner/developer/reviewer/researcher/project-manager. _(Re-verified 2026-11-03 after sibling retirements: list is now `main`/`reviewer`/`researcher`/`project-manager` — no spec-manager/git-manager, also no orchestrator/planner/developer.)_

## 3. Orchestrator Prompt (docs/opencode/prompts/orchestrator.md)

- [x] 3.1 Remove `@spec-manager` and `@git-manager` entries from the AVAILABLE AGENTS list and verify both names absent from that section.
- [x] 3.2 Rewrite OPENSPEC COMMAND MAPPING to state the principal runs `/opsx-*` directly (no delegation) and verify no `@spec-manager:` delegation lines remain.
- [x] 3.3 Update NORMAL MODE routing table to route ops/git/gh directly and verify no retired-agent rows remain.
- [x] 3.4 Update behavioral rules that mandate delegation to `@spec-manager`/`@git-manager` (5, 9, 10, 13, 15, 16, 22, 24, 25) to direct execution and verify grep shows no "delegate ... to @spec-manager/@git-manager" in those rules.
- [x] 3.5 Update delegation examples and placeholder comment to drop retired agent names and verify.
- [x] 3.6 Keep delegation-suffix template and chunking rules intact (still apply to other subagents) and verify they remain.

## 4. AGENTS.md

- [x] 4.1 Rename subsection "OpenSpec Workflow (Spec-Manager)" to "OpenSpec Workflow" and reword lead-in to "run directly by the principal" and verify line no longer names @spec-manager.
- [x] 4.2 Verify skill rows/URLs unchanged.

## 5. CONTEXT.md

- [x] 5.1 Update "Gist Creation Workflow ... via @git-manager" to direct bash/gh execution and verify @git-manager removed.

## 6. commit-all.md

- [x] 6.1 Add note that this command is executed directly by the principal (no @git-manager delegation) and that signing/DCO rules still apply; verify safety invariants unchanged.

## 7. Guardrails

- [x] 7.1 Update `no_composio_git_ops` message in `.opencode/guardrails-rules.ts` from "via git-manager" to "via native git commands (principal)" and verify.
- [x] 7.2 Update `docs/opencode/neurosymbolic-guardrails.md` references to retired agents and verify.

## 8. Skills

- [x] 8.1 Update `.opencode/skills/git-workflow/SKILL.md` safety rule "Route all git operations through @git-manager" to direct execution and verify.
- [x] 8.2 Update `.opencode/skills/sdd-workflow/SKILL.md` delegation lines to state principal runs `/opsx-*` directly and verify no "@spec-manager" delegation remains.

## 9. Other Prompts

- [x] 9.1 Update `docs/opencode/prompts/developer.md` "OpenSpec artifact creation is handled by @spec-manager" to direct and verify.
- [x] 9.2 Update `docs/opencode/prompts/project-manager.md` "delegate OpenSpec workflows to @spec-manager" and "delegate git workflows to @git-manager" to direct and verify.

## 10. Remove Retired Files and Schemas

- [x] 10.1 Delete `docs/opencode/prompts/spec-manager.md` and verify file absent.
- [x] 10.2 Delete `docs/opencode/prompts/git-manager.md` and verify file absent.
- [x] 10.3 Delete `docs/opencode/prompts/contracts/spec-manager.schema.json` and verify file absent.
- [x] 10.4 Delete `docs/opencode/prompts/contracts/git-manager.schema.json` and verify file absent.

## 11. Update Tests

- [x] 11.1 Update `docs/opencode/prompts/contracts/prompt-hygiene.test.js`: expected count 8 → 6 and remove the two retired entries from sorted list; verify test passes.
- [x] 11.2 Update `docs/opencode/prompts/contracts/contractValidator.test.js`: remove `spec-manager`/`git-manager` from agent-name assertion list and adjust schema-specific test blocks; verify test passes.
- [x] 11.3 Update `docs/opencode/opencode-guide.md` agent table/config snippet to drop retired agents and verify.

## 12. Other Docs

- [x] 12.1 Update `docs/opencode/agent-architecture-analysis.md` references (keep historical notes where appropriate) and verify.
- [x] 12.2 Update `docs/opencode/prompts/contracts/orchestrator.schema.json` enum if it lists retired agents and verify. (Also `base.schema.json`, which enumerated the same eight agents.)
- [x] 12.3 Sweep remaining docs under `docs/` and `.opencode/` for active delegation references and update or annotate as historical.

## 13. Verification

- [x] 13.1 Run guardrails tests (`cd .opencode && npx vitest run guardrails-rules.test.js`) and verify all inviolable rules green. (20/20 passed.)
- [x] 13.2 Run prompt hygiene + contract validator tests (`cd docs/opencode/prompts/contracts && npx vitest run`) and verify pass (prompt count 6). (52/52 passed.)
- [x] 13.3 Run `opencode debug agents` and verify only orchestrator/planner/developer/reviewer/researcher/project-manager remain. _(Re-verified 2026-11-03: `main`/`reviewer`/`researcher`/`project-manager` + system agents; neither spec-manager nor git-manager present.)_
- Omitted 13.4 — Run eval suite and verify no regressions vs. baseline. Reason: the eval set drives live OpenCode sessions and delegations; it cannot run headlessly in this environment. The offline layers of the eval (guardrails, prompt-hygiene, contract-validator) passed in 13.1/13.2.
- [x] 13.5 Final grep sweep for `spec-manager`/`git-manager` active delegation (excluding archive/PRDS/pending.txt/learning/deferred prompts) and verify only allowed historical locations remain.
