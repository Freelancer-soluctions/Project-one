# Proposal

## Why

The `planner` agent duplicates two roles that already have a home elsewhere: its SDD-mode spec review is an independent verification (which the `reviewer` agent already performs) and its normal mode produces design docs (already captured by the `design-docs` skill). Keeping a separate paid agent for this inflates per-turn cost and splits verification across two agents. Meanwhile the `reviewer` prompt inlines coverage/lint/format checks that CI and Husky already enforce, wasting review tokens on findings the pipeline will reject anyway. Merging planner into reviewer leaves one independent verification agent with compact, on-demand checklists.

## What Changes

- **Reviewer loads `review-spec` or `review-code` skill** depending on the request (spec review vs code review), instead of carrying both checklists inline.
- **Review once per change**: a single spec review (`review-spec`) and a single code review (`review-code`) per change, replacing the planner's separate SDD-mode pass.
- **Remove coverage, lint, and format checks** from the reviewer prompt — these are already enforced by CI and Husky (pre-commit/pre-push), so the reviewer reads pipeline status instead of re-running them.
- **Test the reviewer with an alternative cheaper model** (Haiku or cheaper) and adopt the cheapest model that passes the eval.
- **Retire the `planner` agent**: its design-docs mode already lives in the `design-docs` skill; its spec-review mode moves into `review-spec`.
- **Remove `planner` from `opencode.jsonc`** (agent definition, model assignment, and `task` allowlist) and from the **orchestrator task allowlist**.
- **Update orchestrator routing** so spec review and design-doc requests route to the reviewer (loading `review-spec`/`design-docs`) instead of `@planner`.

## Capabilities

### New Capabilities

None — this is a pure agent-config/prompt refactor (no spec-level behavior changes).

### Modified Capabilities

None.

> **Note:** This change sets `skip_specs: true` in `.openspec.yaml` because it is a pure refactor/tooling/docs change with no spec-level behavior changes.

## Impact

- **Affected files:** `docs/opencode/prompts/reviewer.md`, `docs/opencode/prompts/planner.md`, `docs/opencode/prompts/orchestrator.md`, `opencode.jsonc`
- **Removed:** `planner` agent definition and its entry in the orchestrator `task` allowlist
- **Affected systems:** OpenCode agent configuration, skill loading (`review-spec`, `review-code`, `design-docs`), orchestrator routing
- **Exit criterion:** reviewer detects the same spec/code issues as before; planner retired with no regression in the eval; review tokens reduced by dropping CI-covered checks
