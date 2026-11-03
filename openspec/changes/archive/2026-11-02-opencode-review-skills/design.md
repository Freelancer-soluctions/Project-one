# Design

## Context

See proposal.md — Why. This change is a pure prompt/tooling refactor: no behavioral specs, `skip_specs: true`. The reviewer currently inlines a 7-section review checklist in `docs/opencode/prompts/reviewer.md` (correctness, security, performance, code quality, testing, React-specific, Express-specific); the planner inlines a 5-step spec-review checklist in `docs/opencode/prompts/planner.md`. The Layer-2 observe-only plugin `.opencode/plugins/output-contracts.ts` is disabled (commented out in `opencode.jsonc` line 6) since `silent-exit-detection-refinement`.

Constraints:

- Skill files live under `.opencode/skills/<name>/SKILL.md` and are auto-discovered via `opencode.jsonc` `skills.paths` (`.opencode/skills`).
- Skill format: YAML frontmatter (`name`, `description`, `license`, `metadata`) + markdown body, matching existing skills (`git-workflow`, `sdd-workflow`).
- The plugin is observe-only: it never rewrites `output.output`; it validates the `<output-contract>` envelope and annotates `output.metadata.contractValidation` on failure, writing JSONL audit entries.
- Reviewer/researcher are the only agents whose contract validation is worth the audit noise; other agents (developer, planner, spec-manager, etc.) already self-validate via Layer 1 and their outputs are less structured.

## Goals / Non-Goals

**Goals:**

- Extract the review checklists into five reusable skill files so they load on demand instead of bloating every reviewer/planner turn.
- Make the three conditional checklists (security, React, Express) loadable only when applicable, driven by the files/scope under review.
- Reactivate the output-contracts plugin, re-scoped to reviewer and researcher only.
- Enforce a compact reviewer output: verdict + critical/high findings (file+line); medium/low findings only on explicit request.

**Non-Goals:**

- No change to the contract schemas (`docs/opencode/prompts/contracts/*.schema.json`) or to the envelope field shapes.
- No change to the plugin's observe-only semantics (no `output.output` rewriting, no retry from the hook).
- No new OpenSpec specs (pure refactor; `skip_specs: true`).
- No removal of the reviewer's OpenSpec-mode design-compliance flow; only the inlined generic checklist moves.

## Decisions

### D1 — Skill extraction granularity

Two base skills plus three conditional skills, matching the proposal:

- `review-spec/SKILL.md`: spec-review checklist extracted from planner SDD mode (proposal/spec/design/tasks review, feasibility, atomicity, ordering, missing steps).
- `review-code/SKILL.md`: code-review checklist extracted from reviewer.md sections 1–5 (correctness, security baseline, performance, code quality, testing).
- `review-security/SKILL.md`: deep security checklist (SQL injection, XSS, auth/authz, sensitive data, input validation, CORS, rate limiting).
- `review-react/SKILL.md`: React checklist (functional components, hooks, prop drilling, accessibility, error boundaries).
- `review-express/SKILL.md`: Express checklist (async/await error handling, HTTP status codes, validation middleware, request/response typing, transactions).

Rationale: keeps the base review-code skill small and reusable; conditional skills deepen only the relevant dimension. Alternative (one giant review-code skill with conditional sections) rejected — it re-bloats the prompt and defeats on-demand loading.

### D2 — Conditional loading trigger

Conditional skills are loaded by the reviewer based on the scope of the review, not always:

- `review-security`: load when the change touches auth, input handling, DB queries/Prisma, secrets/env, CORS, rate limiting, or new/changed dependencies.
- `review-react`: load when any reviewed file is under `apps/client/` (`.tsx`/`.jsx`/`.ts` client code) or contains JSX/React imports.
- `review-express`: load when any reviewed file is under `apps/server/` (routes, middleware, controllers, services, DAOs).

Detection is performed by the reviewer via glob/grep over the changed file set (or `git diff --name-only` against the base), then `skill` invocation per applicable checklist. The reviewer prompt must state these triggers explicitly so loading is deterministic rather than vibes-based.

### D3 — Prompt replacement strategy

Replace the inlined checklist blocks in `reviewer.md` and `planner.md` with short "Load on demand" instructions:

- `reviewer.md`: keep OpenSpec-mode design-compliance flow and severity/output-format sections; replace `## STANDARD REVIEW CHECKLIST` with a section that says: always load `review-code`; additionally load `review-security`/`review-react`/`review-express` when their triggers (D2) match. Keep the severity guidelines and JSON output guidance.
- `planner.md`: replace `Your Review Checklist` (5 items) with "Load `review-spec` skill when performing a specification review"; keep the rest (MCP policy, output format, OpenSpec distinction).

Rationale: preserves all non-checklist behavior; only the checklist payload moves.

### D4 — Plugin reactivation and re-scoping

Uncomment `"./.opencode/plugins/output-contracts.ts"` in `opencode.jsonc` plugin list (line 6). Re-scope inside `handleToolExecuteAfter`: add an early guard after `agentName` extraction:

```
const SCOPED_AGENTS = new Set(['reviewer', 'researcher']);
if (!SCOPED_AGENTS.has(agentName)) return;
```

This guard precedes `extractTaskResult`, so non-scoped agents produce no silent-exit-candidate entries and no audit noise. Reviewer and researcher keep full validation (empty `<task_result>` → silent_exit_candidate, envelope validation, metadata annotation).

Rationale: scoping at the single chokepoint is cheaper and less error-prone than filtering per-agent in the validator. Alternative (pass an allow-list to `validateContract`) rejected — the plugin also owns silent-exit detection and audit logging, which must be scoped too.

### D5 — Compact output format

Enforce at the prompt level in `reviewer.md` (and reflected in `researcher.md` where applicable):

- Always emit `verdict` (`APPROVED`/`NEEDS CHANGES`).
- `criticalIssues` and `highPriority` MUST include `file` + `line` for every entry.
- `mediumPriority` and `lowPriority` are emitted ONLY when the orchestrator/user explicitly requests them (default empty arrays). Medium/low findings may be summarized in `details` as counts ("3 medium, 2 low suppressed — request to expand") but not enumerated.
- `positiveHighlights`, `testCoverage`, `securityAssessment`, `nextSteps` remain as today.

The plugin does not enforce this (observe-only); Layer 1 self-validation in the prompt carries it. The compact format is documented as a convention so future reviewers follow it.

### D6 — Agent prompt references

Skills are loaded by the agent at runtime via the `skill` tool, not declared in config. The reviewer/planner prompts instruct skill loading. No config change beyond plugin uncomment. (Skills paths already include `.opencode/skills`.)

## Risks / Trade-offs

- [Risk] Existing tests in `output-contracts.test.ts` assert silent-exit logging for developer/spec-manager/planner. After re-scoping those assertions fail. → Mitigation: update those tests to use reviewer/researcher (or assert skip) in the implementation tasks; document the scoping change in the test file header.
- [Risk] Conditional skill triggers rely on reviewer judgment of file paths; misclassification could skip a relevant checklist. → Mitigation: triggers listed explicitly in reviewer.md with concrete path globs; default to loading review-security when uncertain for auth/input/DB changes.
- [Risk] Removing inlined checklists could regress agents that don't load skills (e.g., direct prompt use without skill tool). → Mitigation: keep a one-line pointer in the prompt to the skill name; skill paths are configured globally.
- [Risk] Plugin reactivation may surface latent contract failures now scoped to reviewer/researcher; audit log volume increases. → Mitigation: observe-only (no merge block); Layer 3 orchestrator decides re-delegation.

## Migration Plan

1.  **Create the five skill files** under `.opencode/skills/` (tasks 1-5). Each skill follows the canonical frontmatter format (`name`, `description`, `license`, `metadata`) and is auto-discovered via `opencode.jsonc` `skills.paths`. Verify each file parses as valid frontmatter and its body contains the full checklist extracted from the source prompt (reviewer.md sections 1-7 / planner SDD review steps). No checklist content is duplicated between base and conditional skills.

2.  **Remove inlined checklists from prompts** (task 6). In `reviewer.md`, replace `## STANDARD REVIEW CHECKLIST (All Modes)` (sections 1-7) with a "Load on demand" section that always loads `review-code` and conditionally loads `review-security`/`review-react`/`review-express` per their D2 triggers. In `planner.md`, replace `Your Review Checklist` with an instruction to load `review-spec` skill when performing a specification review. Add the compact-output rule (D5) to `reviewer.md`. Verify OpenSpec-mode flow, severity guidelines, and JSON output guidance remain intact.

3.  **Reactivate the output-contracts plugin** (task 7). Uncomment `"./.opencode/plugins/output-contracts.ts"` in `opencode.jsonc` (line 6). Add the early guard in `handleToolExecuteAfter` after `agentName` extraction:

        const SCOPED_AGENTS = new Set(['reviewer', 'researcher']);
        if (!SCOPED_AGENTS.has(agentName)) return;

    The guard precedes `extractTaskResult`, so non-scoped agents produce no silent-exit-candidate entries and no audit noise. V1 (`server()`) and V2 (`setup()`) paths share `handleToolExecuteAfter`, so a single edit covers both.

4.  **Update tests** (task 8). Adjust `output-contracts.test.ts` cases that use non-scoped agents (developer, spec-manager, planner) to either use reviewer/researcher or assert skip behavior. Document the scoping change in the test file header. Run the plugin test suite and lint; verify all pass.

5.  **Manual verification** (task 8.4). Delegate a review task and confirm the reviewer loads `review-code` plus applicable conditional skills, emits compact output (verdict + critical/high with file+line; medium/low empty unless requested), and that the plugin logs only reviewer/researcher activity.

## Testing / Verification

- **Skill discovery:** each new `SKILL.md` is discoverable by name via the `skill` tool (paths configured in `opencode.jsonc`).
- **Prompt integrity:** `reviewer.md` and `planner.md` retain OpenSpec-mode flow, severity guidelines, and JSON output guidance; only the inlined checklist payload is removed.
- **Plugin scoping:** non-scoped agents (developer, spec-manager, planner, etc.) produce no `silent_exit_candidate` entries and no contract-validation audit lines; reviewer and researcher retain full validation.
- **Compact output:** reviewer responses include `verdict` always; `criticalIssues`/`highPriority` entries include `file`+`line`; `mediumPriority`/`lowPriority` default to empty arrays unless explicitly requested.
- **Regression:** `output-contracts.test.ts` passes after updates; lint clean on all changed files.

## Open Questions

None — all decisions (D1-D6) are settled; implementation can proceed task-by-task per `tasks.md`.
