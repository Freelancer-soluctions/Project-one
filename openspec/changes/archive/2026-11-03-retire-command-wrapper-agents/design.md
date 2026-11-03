# Design

## Context

`spec-manager` and `git-manager` are command-wrapper subagents: they only wrap `/opsx-*` and `/commit-*` invocations and receive the interrogatorio summary truncated into a single delegation line. They add an extra hop that loses context, cost nothing in intelligence, and are not justified by the subagent criteria (context isolation, parallel work, tool conflicts, independent verification). Retiring them lets the principal (the main agent) run `/opsx-*` and `/commit-*` directly, keeping the interrogatorio summary in the same context and committing right after each task batch.

This is a pure refactor/tooling/docs change (`skip_specs: true`). No runtime, API, or spec-level behavior changes. The principal already has the restricted bash allowlist from `git-permissions-hardening` (`openspec *`, `git status`, `git diff --stat`, `git add *`, `git commit *`, `gh *`; rest of git denied, default `ask`); this change only removes the two retired agents and their references.

Constraints shaping the approach:

- The orchestrator `task` allowlist in `opencode.jsonc` must drop `spec-manager` and `git-manager` entries so delegation to them is no longer possible.
- Agent prompt files and output-contract schemas for the retired agents become unused and are removed; tests that enumerate prompt files/schemas must be updated in lockstep.
- Documentation and skills that route work to `@spec-manager` / `@git-manager` must be re-pointed to direct principal execution, otherwise stale references reintroduce the retired hop.
- Guardrails rules that name the retired agents in user-facing block messages must be reworded so they no longer prescribe a non-existent agent.
- Verification relies on the existing eval (guardrails unit tests, prompt-hygiene, contract-validator) plus a grep sweep for stale references in active (non-archived) files.

## Goals / Non-Goals

**Goals:**

- Remove the `spec-manager` and `git-manager` agent definitions from `agent.*` in `opencode.jsonc`.
- Remove their entries from the orchestrator `task` permission allowlist.
- Update `AGENTS.md` auto-invoke table and section heading so OpenSpec lifecycle skills are no longer "owned by @spec-manager".
- Update `CONTEXT.md` glossary entries that route gist/git work through `@git-manager`.
- Update `.opencode/command/commit-all.md` so it is framed as a principal-run command (no `@git-manager` hop).
- Update `.opencode/guardrails-rules.ts` block message that names `git-manager`.
- Update `docs/opencode/prompts/orchestrator.md`, `.opencode/skills/sdd-workflow/SKILL.md`, and `.opencode/skills/git-workflow/SKILL.md` to direct principal execution.
- Remove `docs/opencode/prompts/spec-manager.md`, `docs/opencode/prompts/git-manager.md`, and their output-contract schemas; update tests that enumerate them.
- Keep inviolable rules green and eval passing.

**Non-Goals:**

- No changes to other agents' definitions or permissions (planner, developer, reviewer, researcher, project-manager untouched).
- No new capabilities or spec-level changes (`skip_specs: true`).
- No runtime/code changes beyond config, prompts, skills, guardrails message, and tests.
- No rework of the bash permission allowlist itself (owned by `git-permissions-hardening`); this change only consumes it. If absent at implementation time, add it as a prerequisite (see Risks).
- No edits to archived changes or historical docs (they keep their original references for audit).

## Decisions

### Decision 1 — Remove agent definitions from `opencode.jsonc`

**Location:** `opencode.jsonc`, `agent` block — the `spec-manager` (lines ~149-161) and `git-manager` (lines ~162-174) stanzas.

**Before (excerpt):**

```jsonc
"spec-manager": {
  "mode": "subagent",
  "hidden": false,
  "model": "opencode-go/beam-free",
  "description": "Executes OpenSpec CLI - explore, propose, verify, archive",
  "prompt": "{file:docs/opencode/prompts/spec-manager.md}",
  "steps": 30,
  "temperature": 0,
  "permission": {
    "bash": "allow",
    "edit": "deny"
  }
},
"git-manager": {
  "mode": "subagent",
  "hidden": false,
  "model": "opencode-go/beam-free",
  "description": "SCM and Conventional Commit specialist",
  "prompt": "{file:docs/opencode/prompts/git-manager.md}",
  "steps": 20,
  "permission": {
    "bash": "allow",
    "todowrite": "deny",
    "edit": "deny"
  }
},
```

**After:** both stanzas deleted entirely. All other agent stanzas (orchestrator, planner, developer, reviewer, researcher, project-manager) remain untouched.

**Rationale:** Deleting (rather than `disable: true`) matches the proposal's "Removed files" intent and avoids leaving dangling prompt-file references. The output-contract schemas and prompt files are removed in the same change so no orphan references remain.

### Decision 2 — Remove retired agents from orchestrator `task` allowlist

**Location:** `opencode.jsonc`, `agent.orchestrator.permission.task` object (lines ~137-146).

**Before:**

```jsonc
"task": {
  "*": "deny",
  "spec-manager": "allow",
  "planner": "allow",
  "developer": "allow",
  "reviewer": "allow",
  "researcher": "allow",
  "git-manager": "allow",
  "project-manager": "allow"
}
```

**After:**

```jsonc
"task": {
  "*": "deny",
  "planner": "allow",
  "developer": "allow",
  "reviewer": "allow",
  "researcher": "allow",
  "project-manager": "allow"
}
```

**Rationale:** With the agents gone, leaving allowlist entries would reference non-existent agents (OpenCode would either ignore or error). Removing them makes delegation to retired agents structurally impossible — the inviolable "no delegation hop" property is enforced at the config layer.

### Decision 3 — Principal executes `/opsx-*` and `/commit-*` directly

**Context:** The principal now owns OpenSpec CLI execution and commit workflows. The restricted bash allowlist (from `git-permissions-hardening`) already permits `openspec *`, `git status`, `git diff --stat`, `git add *`, `git commit *`, `gh *` and denies the rest of git with a default `ask`. No new permission keys are introduced by this change.

**If `git-permissions-hardening` is not yet applied** (bash still bare `"ask"`), add the permission.bash object to the orchestrator as a prerequisite before deleting the agents, otherwise the principal would prompt on every command and the "no delegation hop" exit criterion would not hold. See Risks.

### Decision 4 — `AGENTS.md` auto-invoke table

**Location:** `AGENTS.md` § "Available Skills" → "OpenSpec Workflow (Spec-Manager)" heading (line ~84) and the skills table under it.

**Change:** Rename the subsection heading from "OpenSpec Workflow (Spec-Manager)" to "OpenSpec Workflow" and reword the lead-in from "Skills for the specification-driven development lifecycle, owned by @spec-manager:" to "Skills for the specification-driven development lifecycle, run directly by the principal:". The skill rows and URLs are unchanged (skills remain invokable; only ownership wording changes).

**Rationale:** The skills themselves are unchanged; only the ownership/routing claim is retired. Keeping the table avoids breaking skill discovery.

### Decision 5 — `CONTEXT.md` glossary

**Location:** `CONTEXT.md` § "Technical Concepts & Skills" → "Gist Creation Workflow" entry (line ~33).

**Before:**

```
- **Gist Creation Workflow**: `gh gist create <files> --desc "..."` from bash via @git-manager. Creates secret gist by default; add `--public` for public.
```

**After:**

```
- **Gist Creation Workflow**: `gh gist create <files> --desc "..."` run directly by the principal via bash. Creates secret gist by default; add `--public` for public.
```

**Rationale:** Removes the `@git-manager` routing claim; the command and behavior are unchanged.

### Decision 6 — `.opencode/command/commit-all.md`

**Change:** Add a short note at the top (after the description) stating that this command is executed directly by the principal — no `@git-manager` delegation — and that signing/DCO rules below still apply. No change to the commit flow, signing, or DCO requirements.

**Rationale:** The command body is already principal-executable (it lists `git a

### Decision 7 — Guardrails rules referencing retired agents

**Location:** `.opencode/guardrails-rules.ts`, `validateNoComposioGitOps` block message (line ~428).

**Before:**

```
"BLOCKED: Operaciones git vía Composio prohibidas. Git se maneja exclusivamente via git-manager con comandos git nativos."
```

**After:**

```
"BLOCKED: Operaciones git vía Composio prohibidas. Git se maneja exclusivamente con comandos git nativos (principal)."
```

**Rationale:** The rule still blocks Composio git ops; only the prescribed agent name is dropped. No logic change, so inviolable cases and unit tests are unaffected.

### Decision 8 — Remove retired prompt files and output-contract schemas

**Removed files:**

- `docs/opencode/prompts/spec-manager.md`
- `docs/opencode/prompts/git-manager.md`
- `docs/opencode/prompts/contracts/spec-manager.schema.json`
- `docs/opencode/prompts/contracts/git-manager.schema.json`

**Tests updated in lockstep:**

- `docs/opencode/prompts/contracts/prompt-hygiene.test.js`: expected prompt count 8 → 6 and the two entries removed from the sorted list.
- `docs/opencode/prompts/contracts/contractValidator.test.js`: remove `spec-manager`/`git-manager` from the agent-name assertion list (line ~420) and delete/adjust the two schema-specific test blocks (lines ~336-350) that reference the removed schemas.

**Rationale:** Leaving the schemas would make the validator reference non-existent agents; the generic validator keys off agent name at runtime, so removing unused schemas is safe. Tests are updated so the eval stays green.

### Decision 9 — Orchestrator prompt (`docs/opencode/prompts/orchestrator.md`)

**Approach:** Re-point routing and behavioral rules from `@spec-manager` / `@git-manager` to direct principal execution:

- Subagent list (lines ~39-41): drop the two entries.
- Routing table and delegation examples: replace `@spec-manager: /opsx-*` lines with direct `/opsx-*` execution instructions; replace `@git-manager: ...` with direct `git`/`gh` commands.
- Behavioral rules (lines ~388-413): remove rules that mandate delegation to `@spec-manager`/`@git-manager`; add rules that the principal runs `/opsx-*` and commit/gh commands directly.
- Keep the delegation-suffix template and chunking rules (they still apply to other subagents: developer, reviewer, researcher, planner, project-manager).

**Rationale:** The prompt is large; the change is mechanical re-pointing, not a rewrite. Preserve all safety invariants (signing, DCO, no `--no-verify`).

### Decision 10 — Skills (`sdd-workflow`, `git-workflow`)

- `.opencode/skills/sdd-workflow/SKILL.md`: replace "Delegate to @spec-manager: /opsx-_" with "Run /opsx-_ directly" (phases 1, 2, 5, 6); keep phase gates. @planner/@developer/@reviewer routing unchanged.
- `.opencode/skills/git-workflow/SKILL.md`: replace "Route all git operations through @git-manager." with "Run git/gh operations directly (principal), per the restricted bash allowlist." Keep safety rules.

**Rationale:** Skills are the on-demand reference; stale routing there would reintroduce the retired hop.

## Risks / Trade-offs

- [Risk] `git-permissions-hardening` not yet applied → principal's bash is bare `ask`, so direct execution prompts constantly and the exit criterion fails → Mitigation: verify `permission.bash` object exists on the orchestrator before deleting agents; if absent, apply that change first (or add the allowlist in this change's migration step 1). Do not delete agents while bash is un-restricted.
- [Risk] Stale references in non-targeted files (docs, learning articles, PRDs) → Mitigation: grep sweep scoped to active files only; archived changes and historical docs are intentionally left untouched for audit. The sweep must exclude `openspec/changes/archive/`, `PRDS/`, `pending.txt`, and `docs/learning/`.
- [Risk] Removing prompt files breaks tests that enumerate 8 prompts → Mitigation: update `prompt-hygiene.test.js` and `contractValidator.test.js` in the same commit (Decision 8).
- [Risk] Output-contract plugin references agent names generically → no code change needed; plugin keys off `subagent_type` at runtime, so retired agents simply stop appearing.
- [Risk] JSONC edit errors → Mitigation: validate with `opencode debug config` before commit; single-file-ish diff review.
- [Trade-off] Larger diff vs. atomic retirement → Benefit: single coherent change with one exit criterion; Cost: many small doc edits. Mitigated by the checklist in tasks.md.

## Migration Plan

1. Verify prerequisite: `opencode.jsonc` orchestrator has the restricted `permission.bash` object (from `git-permissions-hardening`). If not, add it first (Decision 3).
2. Edit `opencode.jsonc`:
   - Delete the `spec-manager` and `git-manager` stanzas from `agent.*` (Decision 1).
   - Remove their entries from `agent.orchestrator.permission.task` (Decision 2).
3. Validate JSONC parses: `opencode debug config` exits 0.
4. Update documentation and skills:
   - `AGENTS.md` (Decision 4).
   - `CONTEXT.md` (Decision 5).
   - `.opencode/command/commit-all.md` (Decision 6).
   - `.opencode/guardrails-rules.ts` (Decision 7).
   - `docs/opencode/prompts/orchestrator.md` (Decision 9).
   - `.opencode/skills/sdd-workflow/SKILL.md` and `.opencode/skills/git-workflow/SKILL.md` (Decision 10).
5. Remove retired files: `spec-manager.md`, `git-manager.md`, and their schemas (Decision 8).
6. Update tests: `prompt-hygiene.test.js`, `contractValidator.test.js` (Decision 8).
7. Run verification (see Verification).
8. Commit with a conventional message: `refactor(opencode): retire spec-manager and git-manager command-wrapper agents`.

## Verification

- `opencode debug config` exits 0 and the agent list no longer contains `spec-manager` or `git-manager`.
- `opencode debug agents` shows only: orchestrator, planner, developer, reviewer, researcher, project-manager.
- Guardrails unit tests pass: `cd .opencode && npx vitest run guardrails-rules.test.js`.
- Prompt hygiene tests pass: `cd docs/opencode/prompts/contracts && npx vitest run` (prompt count 6, no missing CRITICAL RULES section).
- Contract validator tests pass with the updated agent list.
- Grep sweep (active files only) finds no remaining `@spec-manager`/`@git-manager` routing claims outside archived changes, PRDs, pending.txt, and learning docs. Command:
  `grep -rn "spec-manager\|git-manager" --include="*.md" --include="*.ts" --include="*.jsonc" . | grep -v node_modules | grep -v "openspec/changes/archive" | grep -v "PRDS/" | grep -v "pending.txt" | grep -v "docs/learning/"` — expected hits limited to the removed-files' historical references and the test files updated above.
- Inviolable rules green: guardrails block messages still contain `GUARDRAIL_BLOCKED` where expected; no rule references a non-existent agent.
- Eval: full eval smoke (if applicable) passes with no regressions vs. baseline.

## Open Questions

None. All decisions needed to execute the retirement are resolved above. The bash-allowlist prerequisite (Risk 1) is the only conditional step and is handled in Migration Plan step 1.
