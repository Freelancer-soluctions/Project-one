# Design: single-main-agent

## Context

Today the agent layer has two overlapping principals:

- `orchestrator` (primary) — pure coordinator. It never edits code; it delegates everything to subagents and re-reads diffs/specs on each invocation, which truncates the Phase 0 interrogatorio summary and inflates per-turn cost.
- `developer` (subagent) — the implementation agent with a full implementation prompt, even for phases where a short core prompt plus on-demand skills would suffice.

On top of that split, `opencode.jsonc` carries the `edit: ask` workaround for bug #26758 at two sites (global comment + `researcher.edit: ask`), the global `edit: deny` is commented out, and `project-manager` is a separate subagent whose Composio tool cost has never been measured.

This change collapses `orchestrator` + `developer` into one primary agent (`main`), restores the intended permission baseline, and makes the disposition of `project-manager` data-driven.

## Goals / Non-Goals

**Goals:**

- One primary agent (`main`) runs the full SDD lifecycle (exploration → spec → review → implementation → verification → archive) plus `/commit-*` and `/opsx-*` directly, with no delegation boundary for implementation.
- Short core prompt (identity + always-applicable rules + skill index); implementation detail lives in skills loaded on demand.
- Retire `orchestrator` and `developer` from `opencode.jsonc` and from any `task` allowlists.
- Remove the `edit: ask` workaround when bug #26758 is confirmed fixed; otherwise document the retained exception.
- Keep `reviewer` and `researcher` functional (read/glob/grep inheritance intact).
- Record a Composio token measurement and decide `project-manager` disposition from it.
- Update `AGENTS.md`, `CONTEXT.md`, and guardrails messaging.

**Non-Goals:**

- No new spec-level behavior (change sets `skip_specs: true`).
- No model fine-tuning or provider changes; reuse existing models.
- No rewriting of subagent prompts except extracting the developer protocol into a skill.
- No removal of `reviewer`, `researcher`, `planner`, `spec-manager`, `git-manager` (they stay subagents).

## Decisions

### Decision 1: Agent identity and definition (`opencode.jsonc`)

**Chosen:** Add a new primary agent `main` and remove `orchestrator` + `developer`.

```jsonc
"main": {
  "mode": "primary",
  "model": "opencode-go/beam-free",
  "description": "Single main agent: runs SDD lifecycle, implementation, and git workflows directly",
  "prompt": "{file:docs/opencode/prompts/main.md}",
  "steps": 60,
  "permission": {
    "question": "allow",
    "write": "allow",
    "edit": "allow",
    // NOT a bare string: the 15-pattern hardening object from git-permissions-hardening
    // (commit e77bd25e, originally on agent.orchestrator) is re-homed here so the
    // deterministic deny of push/amend/rebase/--no-verify survives orchestrator's retirement.
    // See git-permissions-hardening/design.md §Exact configuration (first-match-wins order).
    "bash": {
      "git push": "deny",
      "git push *": "deny",
      "git commit --amend": "deny",
      "git commit --amend *": "deny",
      "git rebase": "deny",
      "git rebase *": "deny",
      "git * --no-verify*": "deny",
      "openspec *": "allow",
      "git status": "allow",
      "git diff --stat": "allow",
      "git add *": "allow",
      "git commit *": "allow",
      "gh *": "allow",
      "git *": "deny",
      "*": "ask"
    },
    "webfetch": "allow",
    "websearch": "allow",
    "lsp": "allow",
    "context7_*": "ask",
    "task": {
      "*": "deny",
      "spec-manager": "allow",
      "planner": "allow",
      "reviewer": "allow",
      "researcher": "allow",
      "git-manager": "allow",
      "project-manager": "allow"
    }
  }
}
```

- `default_agent` becomes `"main"`.
- `orchestrator` and `developer` blocks deleted entirely (definition, model, permissions).
- `task` allowlist no longer lists `developer` (gone) or `orchestrator` (was never delegatable). `main` is not in its own allowlist.
- `planner`, `reviewer`, `researcher`, `spec-manager`, `git-manager`, `project-manager` keep their existing definitions and models.

### Decision 2: Short core prompt (`docs/opencode/prompts/main.md`)

**Chosen:** A short prompt with three sections only:

1. **Identity** — one paragraph: senior full-stack developer + SDD coordinator; runs ops directly; delegates only when a specialized subagent is clearly better (review, research, specs, git).
2. **Always-applicable rules** — bullet list: Conventional Commits, signed commits (`-S -s`), TDD, guardrails Layer 4, no direct Trello/Slack HTTP, no `--no-verify`, branch/PR flow, output-contract envelope when applicable.
3. **When to load each skill** — index table: skill id → trigger. Examples:
   - `openspec-explore` / `openspec-new` / `openspec-propose` / `openspec-ff` / `openspec-continue` / `openspec-apply` / `openspec-sync` / `openspec-verify` / `openspec-archive` → when the corresponding `/opsx-*` is invoked or the lifecycle phase requires it.
   - `test-driven-development` → before writing implementation code.
   - `nodejs-backend-patterns` → new API endpoint/middleware/auth.
   - `postgresql-table-design` / `prisma-postgres` → schema/migration work.
   - `vercel-react-best-practices` / `shadcn` / `tailwind-design-system` / `storybook` → frontend work.
   - `vitest` / `react-testing-library` / `playwright-best-practices` → writing tests.
   - `owasp-security-check` → pre-merge security audit.
   - `git-workflow` → commits/branches/PRs.
   - `implementation-protocol` (new skill, Decision 5) → when implementing tasks from `tasks.md`.

Implementation protocol detail (OpenSpec mode vs normal mode, task execution protocol, tool usage policy) moves out of the core prompt into the new skill, so the core prompt stays short and stable.

### Decision 3: Model per phase

**Chosen:** Keep one default model on `main` (`opencode-go/beam-free`) for coordination/exploration/review phases, and switch to the coding model (`opencode/mimo-v2.6-flash-free`) for implementation-heavy phases.

Mechanism (in priority order):

1. **Manual selection** via `/models` when the user wants explicit control.
2. **Command frontmatter** `model:` on `.opencode/commands/opsx-apply.md` (and `opsx-continue.md` when it leads into implementation) if OpenCode supports per-command model override; verify support during implementation, fall back to (1) if not.
3. **Skill-driven hint**: the `implementation-protocol` skill instructs the agent to confirm the active model is the coding model before starting task implementation, and to ask the user to switch if not.

No change to subagent models (`planner`, `reviewer`, etc. keep theirs).

### Decision 4: Retire `orchestrator` and `developer`

**Chosen:** Delete both agent blocks from `opencode.jsonc`. Delete `docs/opencode/prompts/orchestrator.md` and `docs/opencode/prompts/developer.md` after extracting the developer protocol into the new skill (Decision 5). Update `default_agent`.

Routing: the principal now invokes `/opsx-*`, `/commit-all`, etc. directly; no `@orchestrator` delegation. Any lingering references in docs (`AGENTS.md`, `CONTEXT.md`, guardrails) updated in Decision 8–9.

### Decision 5: Extract developer protocol into a skill

**Chosen:** Create `.opencode/skills/implementation-protocol/SKILL.md` containing the developer's OpenSpec-mode/normal-mode protocol, task execution protocol, and tool usage policy (write/edit/bash/context7 rules). The core prompt indexes it; it is loaded on demand when implementing.

Rationale: keeps the core prompt short while preserving the protocol verbatim for the implementation phase.

### Decision 6: Remove the `edit: ask` workaround

**Chosen:** Conditional on confirming bug #26758 is fixed.

- Verify first: delegate a task to a subagent (`reviewer` or `researcher`) that needs `read`/`glob`/`grep` and confirm inheritance is intact with global `edit: deny`. If inheritance works, proceed.
- Then:
  - Restore global `permission.edit = "deny"` (uncomment) and remove the two workaround comments (`TODO: restore when PR #27654 merges...` and the `edit: ask` line rationale).
  - Remove `researcher.edit: "ask"` (rely on global `edit: deny`); researcher keeps `webfetch`/`websearch`/`question`/`context7_*` overrides.
  - Delete the `edit: ask` comment in `orchestrator` (agent removed anyway).

If the bug is **not** fixed, retain `researcher.edit: "ask"` with its explanatory comment and leave global `edit` commented, recording the exception in the change notes. `main` still gets `edit: "allow"` (primary agent, not subject to the inheritance bug).

### Decision 7: Verify `reviewer` and `researcher` keep read/glob/grep

**Chosen:** Both inherit `read`/`glob`/`grep` = `allow` from the global permission block (no per-agent override sets them to deny). After the change:

- `reviewer`: permissions only add `lsp: allow`, `edit: deny` (inherited deny anyway). read/glob/grep remain allow.
- `researcher`: permissions add webfetch/websearch/question/context7 ask; read/glob/grep remain allow (edit becomes deny after Decision 6, or ask if bug unfixed).

Verification step (implementation task): run a reviewer task and a researcher task that exercise `read`, `glob`, `grep`; confirm no `GUARDRAIL_BLOCKED`/permission prompt blocks them. Record result in change notes.

### Decision 8: `project-manager` disposition (data-driven)

**Chosen:** Measure first, decide from measurement.

Measurement method:

1. Count Composio MCP tool definitions exposed (`composio_COMPOSIO_*`) and estimate their token cost (schema bytes → tokens, ~4 chars/token).
2. Record the number in the change (e.g., in `tasks.md` completion notes or a small `measurement.md`).

Decision gate:

- If total Composio tool-definition tokens **≤ 4000**: fold Trello workflows into `main` by granting `composio_COMPOSIO_*: "allow"` on `main` and adding a Trello skill/index entry; remove the `project-manager` agent block and update the `no_direct_trello` guardrail message.
- If **> 4000**: keep `project-manager` as a subagent (current behavior) and document the measured cost as justification.

Interim default (until measurement is run): keep `project-manager` as subagent. The implementation task records the measurement and applies the chosen branch.

### Decision 9: Guardrails updates (`.opencode/guardrails-rules.ts` + tests)

**Chosen:**

- Rename rule `orchestrator-delegation-suffix-required` → `main-delegation-suffix-required` (or generic `delegation-suffix-required`) and update the violation message reference from `orchestrator.md` to `main.md`. The marker string `DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)` stays as-is for backward compatibility with existing prompts/tests, OR is renamed consistently — decision: keep the marker string unchanged to avoid breaking in-flight delegations; only the rule name and doc reference change. Update `.opencode/guardrails-rules.test.js` describe block name accordingly.
- Update `no_direct_trello` message: if `project-manager` is folded, change "Debe delegar a @project-manager" to "Usa el flujo de project-manager (skill) — no llamar Trello directamente"; otherwise keep.
- Remove any guardrail logic that assumes an `orchestrator` agent exists (search for "orchestrator" in guardrails and tests).

### Decision 10: Documentation updates

**Chosen:**

- `AGENTS.md`: replace "Orchestrator" references with "Main agent" in the agent-architecture table; update auto-invoke/routing so the principal runs ops directly; remove `developer` from any agent lists. (Current `AGENTS.md` has no direct references, but the agent-architecture table in `CONTEXT.md` does.)
- `CONTEXT.md`: rename "Orchestrator" → "Main agent" in Agent Architecture; "Subagent Mode" invoked by the main agent; Delegation Suffix Template injected by the main agent.
- `docs/opencode/prompts/orchestrator.md` / `developer.md`: delete after extracting the protocol into the skill (keep in git history).
- Guardrails test file updated per Decision 9.

## Risks / Trade-offs

| Risk                                                                      | Mitigation                                                                    |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Losing the delegation boundary increases context size on a single agent   | Mitigated by short core prompt + on-demand skills; compaction already enabled |
| Bug #26758 may still be unfixed, blocking global `edit: deny`             | Conditional branch in Decision 6; researcher retains `edit: ask`              |
| Model switching requires user action if command frontmatter unsupported   | Fallback to manual `/models` + skill hint                                     |
| Removing `developer` prompt loses protocol detail                         | Extracted verbatim into `implementation-protocol` skill                       |
| Guardrail rename breaks tests if not updated in lockstep                  | Update tests in same change                                                   |
| `project-manager` fold increases per-turn token cost if Composio is heavy | Measurement gate (Decision 8) prevents uninformed fold                        |

## Migration Plan (high level)

1. Create `docs/opencode/prompts/main.md` (short core prompt) and `.opencode/skills/implementation-protocol/SKILL.md`.
2. Edit `opencode.jsonc`: add `main`, set `default_agent`, delete `orchestrator`/`developer`, apply permission baseline per Decision 6.
3. Measure Composio tokens; apply Decision 8 branch.
4. Update guardrails (rename rule, message) + tests.
5. Update `AGENTS.md`, `CONTEXT.md`.
6. Delete retired prompt files.
7. Verify: reviewer/researcher read/glob/grep; subagent inheritance; eval run.

## Open Questions

- Does OpenCode support `model:` in command frontmatter? Verify during implementation; fallback to manual selection.
- Is bug #26758 fixed in the installed OpenCode version? Verify with a subagent edit-inheritance test before flipping global `edit`.
