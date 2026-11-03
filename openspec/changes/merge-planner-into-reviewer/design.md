# Design

## Context

See `proposal.md` — Why and What Changes. This change is a pure agent-config/prompt refactor; `skip_specs: true`. It assumes the `review-spec`, `review-code` (and conditional `review-security`/`review-react`/`review-express`) skill files created by the `opencode-review-skills` change exist and are discoverable via `.opencode/skills`. It also assumes the `design-docs` skill already captures the planner's normal (non-OpenSpec) mode. No new skill files are created here; this change only rewires routing, removes CI-covered checks, retires the `planner` agent, and validates the reviewer on a cheaper model.

Current state relevant to the approach:

- `docs/opencode/prompts/reviewer.md` inlines coverage/lint/format checks (Testing section item 2; Code Quality items referencing ESLint/Prettier) that CI and Husky already enforce.
- `docs/opencode/prompts/planner.md` performs spec review inline (SDD mode) and design-doc creation (normal mode).
- `opencode.jsonc` defines `planner` (model `opencode/mimo-v2.6-flash-free`) and lists it in the orchestrator `task` allowlist.
- `docs/opencode/prompts/orchestrator.md` routes Phase 3 spec review and normal-mode design requests to `@planner`.

## Goals / Non-Goals

**Goals:**

- Make `reviewer` the single independent verification agent: load `review-spec` for spec reviews and `review-code` (plus conditional skills) for code reviews, based on the request.
- Drop coverage, lint, and format checks from the reviewer prompt; reviewer reads pipeline status instead of re-running them.
- Retire the `planner` agent (definition, allowlist entry, prompt file) with no regression: design-docs mode already lives in `design-docs`; spec-review mode moves into `review-spec`.
- Update orchestrator routing so spec-review and design-doc requests go to `reviewer` (loading `review-spec`/`design-docs`).
- Validate `reviewer` on a cheaper model (Haiku or cheaper) and adopt the cheapest model that passes the eval parity gate.

**Non-Goals:**

- No new skill files (reuse `review-spec`, `review-code`, `design-docs` from other changes).
- No changes to CI, Husky, or the contract schemas.
- No change to the reviewer's OpenSpec-mode design-compliance flow; only the inlined, CI-covered checklist items move out.
- No change to the `reviewer` output-contract envelope shape.

## Decisions

### D1 — Skill loading by request type

The reviewer prompt gains a short "Load on demand" section that selects the skill from the delegation phrasing:

- **Spec review** (OpenSpec active; delegation says "Review specification for <change>" or asks to validate proposal/spec/design/tasks): load `review-spec`. The reviewer reads `proposal.md`, `specs/`, `design.md`, `tasks.md` and reports feasibility, atomicity, ordering, and missing steps. It does NOT create or edit those files.
- **Code review** (delegation says "Review code quality/implementation for <change>" or a file set): load `review-code`, plus `review-security`/`review-react`/`review-express` when their triggers match (per `opencode-review-skills` D2).
- **Design-doc request** (OpenSpec NOT active; user wants design/architecture): load `design-docs` and follow its normal-mode output rules.

Detection is deterministic from the delegation message and the presence of `openspec/changes/<name>/` (spec review) vs. a file set (code review) vs. no OpenSpec context (design-doc). The reviewer states which skill it loaded in its output (`details`).

### D2 — Remove CI-covered checks (coverage, lint, format)

Remove from `reviewer.md`:

- Testing checklist item "Coverage meets 80% threshold" (and any coverage-percentage gating).
- Code Quality checklist items "Follows project conventions (ESLint, Prettier)" and "Consistent code style".

Replace with a "Pipeline status" note: coverage, lint, and format are enforced by CI and Husky (pre-commit/pre-push); the reviewer MUST NOT re-run or re-gate them. Instead it reads the pipeline status (CI check results / local test output if provided) and, if any of those gates is red, reports it as a blocking finding referencing the failing gate rather than a code-level issue. The reviewer keeps: tests exist for changed code, tests cover edge cases/error scenarios, integration/E2E tests for critical flows, and mock-data realism (these are not CI-gated judgments).

`testCoverage` in the output envelope becomes: report observed coverage from CI when available; otherwise `null`/`"N/A"` with a note that CI is the source of truth. No threshold comparison.

### D3 — Retire `planner`

- Remove the `planner` block from `agent.*` in `opencode.jsonc` (definition, model, prompt, permissions).
- Remove `planner` from the orchestrator `task` allowlist (`"planner": "allow"`).
- Delete `docs/opencode/prompts/planner.md` (and leave `planner.schema.json` in place for history; it becomes unused).
- Move its two modes:
  - SDD spec review -> `review-spec` skill (loaded by `reviewer` per D1).
  - Normal design-doc creation -> `design-docs` skill (loaded by `reviewer` per D1 for design requests, or by the primary agent if `single-main-agent` is applied first).
- Update all routing references in `orchestrator.md` and `AGENTS.md`.

Rationale over keeping a thin planner: a separate paid agent for review duplicates the reviewer and splits verification; the skills already capture both modes.

### D4 — Design-doc creation needs write access

The `design-docs` skill creates files under `docs/` / root `.md`. The current reviewer has `edit: deny` and no `write`. To support design-doc requests routing to the reviewer, grant `reviewer` `write: allow` (documentation paths only, enforced by the skill's output rules) while keeping `edit: deny` for source code. If the `single-main-agent` change lands first, design-doc requests instead go to the primary agent loading `design-docs` and the reviewer stays read-only; the routing table in `orchestrator.md` should be updated accordingly in that case.

### D5 — Orchestrator routing changes

- Phase 3 (Specification Review): delegate to `@reviewer: Review specification for <change-name>` (loads `review-spec`), not `@planner`.
- Normal mode table: "User wants design" -> `@reviewer` (loads `design-docs`).
- Behavioral rule 12: "delegate code reviews to @reviewer and spec reviews to @reviewer (review-spec)".
- Remove all `@planner` delegation examples and the placeholder resolution mention of `planner`.
- AGENTS.md agent table/auto-invoke: remove planner references.

### D6 — Model validation (Haiku or cheaper)

Test the reviewer on cheaper models and adopt the cheapest that passes the parity gate:

Candidate sequence (cheapest first): `opencode-go/claude-haiku-5-5` -> `opencode/claude-haiku-5-5` -> `opencode-go/glm-5.3-flash` -> `opencode-go/beam-free` (current baseline for comparison is `opencode/mimo-v2.6-flash-free`).

Procedure:

1. Set `reviewer.model` to the candidate in `opencode.jsonc`.
2. Run the `opencode-eval-baseline` task set (or a representative subset of 3 spec-review + 3 code-review tasks) with the reviewer loading `review-spec`/`review-code`.
3. Score findings against the baseline rubric (`docs/opencode/eval/rubric.md`): critical/high issue recall must be >= the baseline reviewer's recall; no increase in false positives beyond the rubric's tolerance; inviolable rules still pass.
4. If a candidate fails, try the next; if all fail, keep `opencode/mimo-v2.6-flash-free`.
5. Record the chosen model and the eval evidence in the change notes / commit message.

The model swap is isolated to the `reviewer` block; no other agent changes.

### D7 — Verification: parity of detected issues

Exit criterion (from proposal): reviewer detects the same spec/code issues as before. Concretely:

- For each eval task, run `review-spec` on the change's spec artifacts and `review-code` on the implementation; collect the critical/high findings.
- Compare to the baseline (planner SDD review + reviewer code review findings captured in `opencode-eval-baseline`).
- Pass: >= 90% recall of baseline critical/high issues; no regression in inviolable-rules tests; CI (coverage/lint/format) remains green externally.
- Additionally, confirm the reviewer no longer emits coverage/lint/format findings (they are deferred to CI) and that `mediumPriority`/`lowPriority` default to empty unless explicitly requested (compact output).

## Risks / Trade-offs

- [Risk] `opencode-review-skills` not yet applied -> `review-spec`/`review-code` skills missing. -> Mitigation: apply that change first (or create the skills in this change's tasks as a prerequisite); verify skill discoverability before editing prompts.
- [Risk] Overlapping edits to `reviewer.md`/`planner.md` with `opencode-review-skills` cause merge conflicts. -> Mitigation: sequence changes (review-skills first, then merge-planner); rebase between.
- [Risk] Removing CI-covered checks could mask a red pipeline if CI is skipped. -> Mitigation: reviewer reads pipeline status and blocks on a red gate; CI/Husky remain required merge gates.
- [Risk] Model downgrade may reduce review quality. -> Mitigation: eval parity gate with fallback to the current model; adopt only a passing candidate.
- [Risk] Design-doc creation by a read-oriented reviewer is awkward. -> Mitigation: grant scoped `write` (D4) or route to the primary agent if `single-main-agent` lands first.
- [Risk] Deleting `planner.md` breaks any stale references. -> Mitigation: grep the repo for `@planner`/`planner.md` after edits; update or remove all.

## Migration Plan

1. **Prerequisite check** (task 1): confirm `review-spec` and `review-code` skills exist and parse; if not, apply `opencode-review-skills` first.
2. **Reviewer prompt** (task 2): add skill-loading (D1), remove CI-covered checks (D2), add compact-output rule, grant write permission (D4).
3. **Orchestrator routing** (task 3): Phase 3 and normal-mode table to `@reviewer`; update behavioral rule; remove planner examples.
4. **Config** (task 4): remove `planner` block and allowlist entry; set reviewer model candidate; verify JSONC parses.
5. **Retire planner files** (task 5): delete `planner.md`; grep for stale references; update `AGENTS.md`/`CONTEXT.md`.
6. **Model validation** (task 6): run eval parity on candidate models; set final model.
7. **Verification** (task 7): parity check, inviolable rules, CI green, no stale `@planner` references.

## Open Questions

None.
