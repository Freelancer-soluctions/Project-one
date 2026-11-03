# Proposal

## Why

The reviewer currently carries its entire review checklist inline in `docs/opencode/prompts/reviewer.md` (correctness, security, performance, code quality, testing, React-specific, Express-specific) and the planner carries the spec-review checklist inline in `docs/opencode/prompts/planner.md`. This bloats the prompts, duplicates guidance that only matters when a review actually runs, and makes the checklists hard to reuse or conditionally load. Separately, `review-security`, `review-react`, and `review-express` should only be loaded when applicable (security-relevant changes, React code, Express code), not always. Finally, the Layer-2 observe-only plugin `.opencode/plugins/output-contracts.ts` is disabled (commented out in `opencode.jsonc`) since `silent-exit-detection-refinement`; reactivating it — re-scoped to reviewer and researcher only — forces compact structured output (verdict, critical/high findings with file+line; medium/low only on request), cutting token waste on review/research turns.

## What Changes

- **Create new skill files** under `.opencode/skills/`:
  - `review-spec/SKILL.md` — spec review checklist extracted from planner SDD mode (proposal/spec/design/tasks review, feasibility, atomicity, ordering, missing steps).
  - `review-code/SKILL.md` — code review checklist extracted from `reviewer.md` (correctness, security, performance, code quality, testing).
  - `review-security/SKILL.md` — conditional security checklist (SQL injection, XSS, auth/authz, sensitive data, input validation, CORS, rate limiting) loaded only when security-relevant.
  - `review-react/SKILL.md` — conditional React checklist (functional components, hooks, prop drilling, accessibility, error boundaries) loaded only when React code is reviewed.
  - `review-express/SKILL.md` — conditional Express checklist (async/await error handling, HTTP status codes, validation middleware, request/response typing, transactions) loaded only when Express code is reviewed.
- **Remove the inlined checklists** from `docs/opencode/prompts/reviewer.md` (and, at the time, `docs/opencode/prompts/planner.md`), replacing them with instructions to load the corresponding skill on demand. _(`planner.md` has since been deleted by `merge-planner-into-reviewer`; its spec-review instruction now lives in `reviewer.md`, which loads `review-spec`.)_
- **Reactivate `.opencode/plugins/output-contracts.ts`** in `opencode.jsonc` (uncomment line 6) re-scoped to reviewer and researcher only, enforcing compact output: verdict, critical/high findings with file+line; medium/low findings only on request.
- **Update agent prompt references** so reviewer loads `review-code` (plus `review-security`/`review-react`/`review-express` conditionally) and the spec-review path loads `review-spec`.

## Capabilities

### New Capabilities

None — this is a pure prompt/tooling refactor (no spec-level behavior changes). The new artifacts are skill files and plugin reactivation, not behavioral specs.

### Modified Capabilities

None.

> **Note:** This change sets `skip_specs: true` in `.openspec.yaml` because it is a pure refactor/tooling/docs change with no spec-level behavior changes.

## Impact

- **Affected files:** `docs/opencode/prompts/reviewer.md`, `docs/opencode/prompts/researcher.md`, `opencode.jsonc`, `.opencode/plugins/output-contracts.test.ts` _(originally also `docs/opencode/prompts/planner.md` — since deleted by `merge-planner-into-reviewer`; its requirement is satisfied by `reviewer.md`)_
- **New files:** `.opencode/skills/review-spec/SKILL.md`, `.opencode/skills/review-code/SKILL.md`, `.opencode/skills/review-security/SKILL.md`, `.opencode/skills/review-react/SKILL.md`, `.opencode/skills/review-express/SKILL.md`
- **Reactivated:** `.opencode/plugins/output-contracts.ts` (uncommented in `opencode.jsonc` plugin list)
- **Affected systems:** OpenCode agent configuration, skill loading, output-contract plugin (Layer 2)
- **Exit criterion:** review skills exist and load on demand; prompts no longer inline the checklists; output-contracts plugin reactivated scoped to reviewer/researcher with compact output
