# Tasks

## 1. Directory structure

- [x] 1.1 Create `docs/opencode/eval/`, `docs/opencode/eval/tasks/`, `docs/opencode/eval/runs/`, `docs/opencode/eval/tokens/`, `docs/opencode/eval/baseline/`, and `scripts/eval/` directories and verify each exists with `ls`
- [x] 1.2 Add `docs/opencode/eval/runs/.gitkeep` and a `.gitignore` entry so ONLY `docs/opencode/eval/runs/*` raw evidence is ignored (while `.gitkeep` is tracked); the `.gitignore` entry MUST include the negation rule `!docs/opencode/eval/runs/.gitkeep` so the `.gitkeep` survives; verify with `git check-ignore` that `tokens/` and `baseline/` are NOT ignored and `git status` shows only the intended new files

## 2. Eval task files

- [x] 2.1 Create one representative eval task file per template from design (sections: Task ID & Title, Scope, Inputs, Steps expected, Expected artifacts, Acceptance criteria, Run notes) under `docs/opencode/eval/tasks/01-<slug>.md` … `10-<slug>.md` and verify 10 files exist
- [x] 2.2 Ensure each task file records scope, expected artifacts, and acceptance criteria, and includes `### Run A` / `### Run B` placeholders in Run notes; verify by grep that all 10 contain the required section headings

## 3. Quality rubric

- [x] 3.1 Create `docs/opencode/eval/rubric.md` with 0-3 scoring per artifact class (spec: requirements clarity, scenario coverage, delta correctness; code: tests, lint/typecheck, behavior match; commit artifacts: conventional message, DCO signoff, signed commit, Trello linkage) and verify the file renders as valid markdown. Note: rubric excludes PRD metrics "turns to complete" and "skill load" (deferred to later phases per proposal)

## 4. Inviolable-rules test cases

- [x] 4.1 Create `docs/opencode/eval/inviolable-rules.md` with 4 adversarial test cases (force-push attempt, skipping grill-me, `--no-verify` commit, task-ordering violation) including expected pass/fail outcome and assertion method for each; verify all 4 cases and their expected outcomes are documented

## 5. Token recording

- [x] 5.1 Create `docs/opencode/eval/token-recording-template.md` (single canonical name; do NOT create a `token-recording.md` alias) with per-agent (orchestrator, planner, developer, reviewer, project-manager, researcher), per-phase, and per-day columns with JSONL storage under `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl` (committed, not gitignored); verify column schema is stable and documented and that `tokens/` is NOT covered by the `runs/` gitignore rule
- [x] 5.2 Create `scripts/eval/record-tokens.mjs` helper that appends a token row from `opencode-quota` / `opencode stats` output to the template schema; verify it runs with `node scripts/eval/record-tokens.mjs --help` (or no-arg) without error

## 6. Entry point

- [x] 6.1 Create `docs/opencode/eval/README.md` describing how to run a task, how to score, how to record tokens, and the exit criterion; verify a second operator can follow it end-to-end (dry read-through)

## 7. Verification

- [x] 7.1 Verify all created files exist (`docs/opencode/eval/README.md`, `rubric.md`, `inviolable-rules.md`, `token-recording-template.md`, `tasks/01-*.md`…`10-*.md`, `scripts/eval/record-tokens.mjs`) and are well-formed (markdown parses, script has no syntax errors via `node --check`)

## 8. Baseline execution — omitted (moved to the follow-up change)

Omitted on 2026-10-31 because none of it can be produced by a docs-and-tooling
change: it needs an interactive OpenCode session (permission prompts, the grill-me
interview and the Trello card), real calendar days, and an authorized
destructive-probe session. Fabricating the evidence would defeat the baseline's
only purpose, so each item stays here with its reason and moves to
`opencode-eval-baseline-execution`.

- Deferred 8.1 — needs an interactive OpenCode session. Execute each of the 10 eval tasks (TASK-01…TASK-10) end-to-end twice (Run A and Run B) following the canonical workflow (grill-me → spec → review → implement → verify → commit → Trello), saving raw evidence under `docs/opencode/eval/runs/<task-id>/<run-id>/`; verify 20 run directories exist with evidence
- Deferred 8.2 — needs the 8.1 evidence. Score every run with `rubric.md` (spec/code/commit 0-3 each) writing one `score.md` per run with per-class justifications; verify 20 `score.md` files exist and totals are computable
- Deferred 8.3 — needs an authorized destructive-probe session in a separate clone. Execute all 4 inviolable-rules cases (IR-01…IR-04) on throwaway branches/clones and record PASS/FAIL with evidence in `inviolable-rules.md`; verify each case has a recorded outcome

## 9. Token recording execution — omitted

- Deferred 9.1 — needs three distinct workdays plus per-agent/per-phase attribution. Capture per-agent token usage across 3 normal workdays using `opencode-quota` / `opencode stats` via `scripts/eval/record-tokens.mjs`, producing committed `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl` files for the 3 days; verify 3 daily files exist and rows pass schema validation

## 10. Baseline snapshot and final verification — omitted

- Deferred 10.1 — needs 8.1–9.1. Aggregate results into `docs/opencode/eval/baseline/`: per-task mean/range scores across the 2 runs, inviolable-rules summary, and 3-day token totals per agent; verify the snapshot is committed and diffable
- Deferred 10.2 — the exit criterion now belongs to the follow-up change. Confirm the exit criterion from the proposal: all 10 tasks × 2 runs scored, inviolable-rules results recorded, 3-day token log captured, and the README alone suffices for a second operator to reproduce comparable artifacts (dry read-through)
