# Tasks

## 1. Prerequisite: review skills exist

- [ ] 1.1 Verify `.opencode/skills/review-spec/SKILL.md` and `.opencode/skills/review-code/SKILL.md` exist and parse as valid frontmatter, and if missing apply the `opencode-review-skills` change first; verify both are discoverable via the `skill` tool by name

## 2. Reviewer prompt: skill loading + drop CI-covered checks

- [ ] 2.1 Edit `docs/opencode/prompts/reviewer.md` to add a "Load on demand" section that loads `review-spec` for spec reviews, `review-code` (+ conditional skills) for code reviews, and `design-docs` for design requests, per D1; verify the skill names are explicit and the OpenSpec-mode flow is intact
- [ ] 2.2 Remove the coverage threshold item from the Testing checklist and the ESLint/Prettier + consistent-style items from the Code Quality checklist in `reviewer.md`, and add the "Pipeline status" note per D2; verify no coverage/lint/format gating remains in the prompt
- [ ] 2.3 Update `testCoverage` guidance in `reviewer.md` to report CI-observed coverage or `N/A` with no threshold comparison, and verify the output-format section reflects this
- [ ] 2.4 Add the compact-output rule to `reviewer.md` (verdict always; critical/high with file+line; medium/low default empty unless requested) and verify it is present and unambiguous
- [ ] 2.5 Grant `reviewer` `write: allow` in `opencode.jsonc` (keeping `edit: deny`) for design-doc mode per D4, and verify the permission block is valid JSONC

## 3. Orchestrator routing

- [ ] 3.1 Update Phase 3 (Specification Review) in `docs/opencode/prompts/orchestrator.md` to delegate to `@reviewer: Review specification for <change-name>` (loads `review-spec`) instead of `@planner`, and verify no `@planner` reference remains in Phase 3
- [ ] 3.2 Update the Normal mode table in `orchestrator.md` so "User wants design" routes to `@reviewer` (loads `design-docs`), and verify the example delegations use `@reviewer`
- [ ] 3.3 Update behavioral rule 12 in `orchestrator.md` to "delegate code reviews to @reviewer and spec reviews to @reviewer (review-spec)", and remove all other `@planner` delegation examples and the placeholder-resolution mention of planner; verify with grep that no `@planner` remains
- [ ] 3.4 Update `AGENTS.md` agent table and auto-invoke entries to remove planner references, and verify no stale planner mentions remain in `AGENTS.md`

## 4. Config: remove planner

- [ ] 4.1 Remove the `planner` block from `agent.*` in `opencode.jsonc`, and verify the config parses as valid JSONC
- [ ] 4.2 Remove `"planner": "allow"` from the orchestrator `task` allowlist in `opencode.jsonc`, and verify the allowlist no longer contains planner
- [ ] 4.3 Set `reviewer.model` to the candidate model (`opencode-go/claude-haiku-5-5`) for the eval run, and verify the field is updated

## 5. Retire planner files

- [ ] 5.1 Delete `docs/opencode/prompts/planner.md`, and verify the file is gone
- [ ] 5.2 Grep the repo for `@planner`, `planner.md`, and `planner.schema` references, update or remove all, and verify no stale references remain outside of git history/archives
- [ ] 5.3 Update `CONTEXT.md` glossary/agent architecture to remove planner references, and verify no stale mentions remain

## 6. Model validation (Haiku or cheaper)

- [ ] 6.1 Run the `opencode-eval-baseline` task set (or a 3 spec-review + 3 code-review subset) with the reviewer loading `review-spec`/`review-code` on `opencode-go/claude-haiku-5-5`, and record findings per `docs/opencode/eval/rubric.md`
- [ ] 6.2 Score critical/high recall against baseline; if < 90% or inviolable rules regress, try the next candidate (`opencode/claude-haiku-5-5`, then `opencode-go/glm-5.3-flash`, then `opencode-go/beam-free`), and verify each candidate's result is recorded
- [ ] 6.3 Set `reviewer.model` to the cheapest passing candidate (or keep `opencode/mimo-v2.6-flash-free` if none pass), and verify the final model value is documented in the commit message

## 7. Verification

- [ ] 7.1 Run `review-spec` and `review-code` on the eval task set and confirm >= 90% recall of baseline critical/high issues; verify the comparison is recorded
- [ ] 7.2 Confirm the reviewer emits no coverage/lint/format findings (deferred to CI) and that `mediumPriority`/`lowPriority` default to empty unless explicitly requested; verify via sample review output
- [ ] 7.3 Run inviolable-rules tests and verify no regression
- [ ] 7.4 Run CI (coverage, lint, format) and verify all gates are green
- [ ] 7.5 Run lint on all changed files and verify no lint errors
