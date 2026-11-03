# Tasks: single-main-agent

## 1. Create Main Agent (opencode.jsonc)

- [x] 1.1 Add new `main` agent block to `opencode.jsonc` (mode primary, model opencode-go/beam-free, steps 60, prompt file docs/opencode/prompts/main.md)
- [x] 1.2 Configure `main` permissions: read/write/edit/bash/task/skill/webfetch/websearch/lsp/context7\_\*/question as per design Decision 1
- [x] 1.3 Set `main.task` allowlist: deny `*`, allow spec-manager, planner, reviewer, researcher, git-manager, project-manager (no developer, no orchestrator)
- [x] 1.4 Set `default_agent: "main"` (replace "orchestrator")
- [x] 1.5 Verify opencode.jsonc parses as valid JSONC

## 2. Short Core Prompt

- [x] 2.1 Create `docs/opencode/prompts/main.md` with three sections: Identity, Always-applicable rules, When to load each skill
- [x] 2.2 Identity section: one paragraph (senior full-stack dev + SDD coordinator; runs ops directly; delegates only when specialized subagent is better)
- [x] 2.3 Always-applicable rules: Conventional Commits, signed commits (-S -s), TDD, guardrails Layer 4, no direct Trello/Slack HTTP, no --no-verify, branch/PR flow
- [x] 2.4 Skill index table (skill id -> trigger) for openspec-\*, test-driven-development, nodejs-backend-patterns, postgresql-table-design, prisma-postgres, vercel-react-best-practices, shadcn, tailwind-design-system, storybook, vitest, react-testing-library, playwright-best-practices, owasp-security-check, git-workflow, implementation-protocol
- [x] 2.5 Keep core prompt short and stable (move implementation protocol to skill)

## 3. Model Per Phase Strategy

- [x] 3.1 Default model on `main`: opencode-go/beam-free for coordination/exploration/review (phases 0-2, 5-6)
- [x] 3.2 Implementation-heavy phases (3-4) use opencode/mimo-v2.6-flash-free
- [x] 3.3 Verify OpenCode support for `model:` in command frontmatter (opsx-apply.md, opsx-continue.md); if unsupported, document fallback
- [x] 3.4 Add skill-driven hint in implementation-protocol skill: confirm coding model before starting task implementation; ask user to switch if not
- [x] 3.5 Document manual `/models` selection as fallback

**Batch 3 notes:**

- 3.1: `opencode.jsonc` `agent.main.model = "opencode-go/beam-free"` (set in batch 1, re-verified via jsonc-parser, 0 errors); comment added above the line recording the phase split. `default_agent: "main"`.
- 3.2: `.opencode/commands/opsx-apply.md` frontmatter now carries `model: opencode/mimo-v2.6-flash-free` — the phase 3-4 entry point runs on the coding model.
- 3.3: **Supported.** OpenCode V2 docs (`/v2/docs/commands`, fetched 2026-11-02) list `model` as an optional Markdown frontmatter field, format `provider/model` or `provider/model#variant`. Key semantics: _"A command model overrides every other model"_ — i.e. frontmatter beats even the manually selected session model (higher precedence than the design's priority-1 manual `/models`). No fallback needed. `opsx-continue.md` deliberately left **without** `model:`: it only creates planning artifacts (proposal/specs/design/tasks) and never implements, so it stays on the default coordination model and a user-selected model is not clobbered; it routes to `/opsx-apply` for implementation instead.
- 3.4: `.opencode/skills/implementation-protocol/SKILL.md` created as a stub carrying the coding-model check (active model → confirm `opencode/mimo-v2.6-flash-free` before coding; otherwise ask the user to switch via `/models`). Protocol sections marked TBD for verbatim extraction in tasks 5.2-5.4 (5.1/5.5 already satisfied by this file).
- 3.5: Manual fallback documented in two places: `docs/opencode/prompts/main.md` always-applicable rule "Model per phase" (and in the skill's coding-model check).

## 4. Retire Orchestrator + Developer

- [x] 4.1 Remove `orchestrator` block from opencode.jsonc (definition, model, permissions)
- [x] 4.2 Remove `developer` block from opencode.jsonc (definition, model, permissions)
- [x] 4.3 Remove `developer` from any task allowlists (already not listed in main's allowlist; dead entries `spec-manager`/`planner`/`git-manager` also removed from `main.task`)
- [x] 4.4 Delete `docs/opencode/prompts/orchestrator.md` (keep in git history)
- [x] 4.5 Delete `docs/opencode/prompts/developer.md` after extracting protocol into skill
- [x] 4.6 Update any lingering references in docs (AGENTS.md, CONTEXT.md, guardrails)
- [x] 4.7 **Migrate the 15-pattern `permission.bash` hardening object** (added by `git-permissions-hardening`, commit `e77bd25e`) from `agent.orchestrator.permission.bash` to `agent.main.permission.bash` — discovered as a CRITICAL security regression during review of `git-permissions-hardening` (retiring orchestrator had silently dropped the deterministic deny of push/amend/rebase/--no-verify). Verify: all 15 keys present under `agent.main.permission.bash` in design order (grep + key count), `opencode debug config` exit 0.

## 5. Extract Developer Protocol into Skill

- [x] 5.1 Create `.opencode/skills/implementation-protocol/SKILL.md`
- [x] 5.2 Move OpenSpec mode vs normal mode protocol verbatim
- [x] 5.3 Move task execution protocol (read tasks.md, implement in order, mark complete)
- [x] 5.4 Move tool usage policy (write/edit/bash/context7 rules)
- [x] 5.5 Add model-switch hint (coding model check) per Decision 3

## 6. Remove edit: ask Workaround (conditional on bug #26758 fixed)

- [ ] 6.1 Verify bug #26758 status: delegate a task to reviewer/researcher needing read/glob/grep with global edit: deny; confirm inheritance intact
- [ ] 6.2 If fixed: restore global `permission.edit = "deny"` (uncomment), remove workaround comments
- [ ] 6.3 If fixed: remove `researcher.edit: "ask"` (rely on global deny); keep webfetch/websearch/question/context7\_\* overrides
- [ ] 6.4 If fixed: remove edit: ask comment in orchestrator (agent removed anyway)
- [ ] 6.5 If NOT fixed: retain `researcher.edit: "ask"` with explanatory comment; leave global edit commented; record exception in change notes
- [ ] 6.6 `main` gets `edit: "allow"` regardless (primary agent, not subject to inheritance bug)

## 7. Verify reviewer and researcher keep read/glob/grep

- [ ] 7.1 Confirm `reviewer` permissions only add lsp: allow, edit: deny; read/glob/grep inherit allow from global
- [ ] 7.2 Confirm `researcher` permissions add webfetch/websearch/question/context7 ask; read/glob/grep inherit allow
- [ ] 7.3 Run a reviewer task exercising read, glob, grep; confirm no GUARDRAIL_BLOCKED/permission prompt
- [ ] 7.4 Run a researcher task exercising read, glob, grep; confirm no GUARDRAIL_BLOCKED/permission prompt
- [ ] 7.5 Record verification result in change notes

## 8. Project-Manager Disposition (data-driven)

- [ ] 8.1 Count Composio MCP tool definitions exposed (composio*COMPOSIO*\*) and estimate token cost (~4 chars/token)
- [ ] 8.2 Record measurement (tasks.md completion notes or measurement.md)
- [ ] 8.3 If total <= 4000 tokens: fold Trello workflows into main (grant composio*COMPOSIO*\*: allow on main; add Trello skill/index entry; remove project-manager agent block; update no_direct_trello guardrail message)
- [ ] 8.4 If total > 4000 tokens: keep project-manager as subagent; document measured cost as justification
- [ ] 8.5 Interim default (until measurement): keep project-manager as subagent
- [ ] 8.6 Apply chosen branch and update config

## 9. Guardrails Updates

- [ ] 9.1 Rename rule `orchestrator-delegation-suffix-required` -> `main-delegation-suffix-required` (or generic `delegation-suffix-required`) in guardrails-rules.ts
- [ ] 9.2 Update violation message reference from orchestrator.md to main.md
- [ ] 9.3 Keep marker string `DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)` unchanged for backward compat
- [ ] 9.4 Update `.opencode/guardrails-rules.test.js` describe block name accordingly
- [ ] 9.5 Update `no_direct_trello` message per project-manager disposition (Decision 8)
- [ ] 9.6 Search guardrails and tests for "orchestrator" references and remove/adjust
- [ ] 9.7 Verify guardrails still function (no broken references)

## 10. Documentation Updates

- [ ] 10.1 Update AGENTS.md: replace Orchestrator references with Main agent in agent-architecture table; update auto-invoke/routing so principal runs ops directly; remove developer from agent lists
- [ ] 10.2 Update CONTEXT.md: rename Orchestrator -> Main agent in Agent Architecture; Subagent Mode invoked by main agent; Delegation Suffix Template injected by main agent
- [ ] 10.3 Update skills (sdd-workflow, git-workflow) ownership/routing language if needed
- [ ] 10.4 Update `.opencode/command/commit-all.md` references if needed

## 11. Verification

- [ ] 11.1 Verify JSONC validity of opencode.jsonc
- [ ] 11.2 Run guardrails tests (node --test or vitest) - all pass
- [ ] 11.3 Run full eval: all tasks pass, no regressions
- [ ] 11.4 Compare consumption per change vs baseline (must be lower)
- [ ] 11.5 Verify inviolable rules still pass
- [ ] 11.6 Confirm no regression in workflow execution (single main agent runs full SDD + implementation lifecycle without orchestrator/delegator boundary)
