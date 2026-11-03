# Proposal

## Why

The orchestrator/subagent architecture (orchestrator, planner, developer, reviewer, project-manager, researcher) and its OpenSpec-driven workflow (grill-me → spec → review → implement → verify → commit → Trello) are currently judged by anecdote: there is no measurement of end-to-end task quality, no evidence that inviolable rules (no force-push, no `--no-verify`, grill-me before spec, task ordering) actually hold under load, and no per-agent token cost baseline. Without a reproducible baseline, any future change to prompts, models, or skills cannot be evaluated for regression or cost. This Phase 0 change establishes that baseline before any optimization is attempted.

## What Changes

- **Evaluation task set** under `docs/opencode/eval/tasks/`: 10 representative tasks (modeled on real past work), each run **twice** end-to-end (interrogatorio → spec → review → implementation → verify → commit → Trello card) to capture variance. Each task file records scope, expected artifacts, and acceptance criteria.
- **Quality rubric** at `docs/opencode/eval/rubric.md`: scores each run on three artifact classes — spec (requirements clarity, scenario coverage, delta correctness), code (tests, lint/typecheck, behavior match), and commit artifacts (conventional message, DCO signoff, signed commit, Trello linkage).
- **Inviolable-rules test cases** at `docs/opencode/eval/inviolable-rules.md`: adversarial scenarios probing the guardrails — force-push attempts, skipping grill-me, `--no-verify` commits, and task-ordering violations — with expected pass/fail outcomes and how to assert them.
- **Token recording template** at `docs/opencode/eval/token-recording-template.md` (single canonical name; no `token-recording.md` alias) plus a helper script `scripts/eval/record-tokens.mjs`: captures per-agent token usage (orchestrator, planner, developer, reviewer, project-manager, researcher) across 3 normal workdays using `opencode-quota` / `opencode stats`, with a stable schema so runs are comparable. Token logs live under `docs/opencode/eval/tokens/` (committed, NOT gitignored) so the baseline is durable.
- **Baseline execution — omitted (deferred)**: the harness specifies how to run, score, probe and record, but it does not produce the 10 × 2 runs, the 4 adversarial probes or the 3-workday token log. See § Deferred.
- **Entry point** at `docs/opencode/eval/README.md`: how to run a task, how to score, how to record tokens, and the exit criterion (baseline saved and reproducible).
- **No behavioral/config change**: only docs and recording scripts. Zero edits to `.github/workflows`, `.husky`, `opencode.jsonc`, agent prompts, or application code. `skip_specs: true` is set in `.openspec.yaml` (already present) because no spec-level behavior changes.
- **Deferred metrics**: PRD metrics "turns to complete" and "skill load" are deferred to later phases; this baseline captures quality (rubric), inviolable rules, and token cost only.
- **Gitignore**: raw evidence under `runs/` is gitignored except `.gitkeep` (via `!docs/opencode/eval/runs/.gitkeep` negation rule); scored summaries and token logs are committed.

## Deferred (omitted from this change)

Omitted 2026-10-31: these cannot be fulfilled inside this change, and producing
them with fabricated numbers would destroy the baseline's only value. Each is kept
in `tasks.md` § 8-10 with its reason and moves to the follow-up change
`opencode-eval-baseline-execution`.

| Omitted item                       | What it needs                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 10 tasks × 2 end-to-end runs (8.1) | An interactive OpenCode session: permission prompts, the grill-me interview and the Trello card are all human-driven |
| Scoring of those runs (8.2)        | The evidence from 8.1                                                                                                |
| IR-01…IR-04 probes (8.3)           | An authorized probe session; IR-01/IR-03 are destructive and run against a separate clone                            |
| 3-workday token log (9.1)          | Three distinct workdays plus per-agent/per-phase attribution                                                         |
| Snapshot + exit check (10.1, 10.2) | All of the above                                                                                                     |

Nothing else is dropped: the harness is complete without them — entry point,
rubric, inviolable-rules cases, token schema and recording script — so the
follow-up change executes with no design work left to do.

## Capabilities

### New Capabilities

None — this is a docs + recording-scripts change with no spec-level behavior changes (`skip_specs: true` in `.openspec.yaml`).

### Modified Capabilities

None — no existing capability's requirements change.

## Impact

- **New files**: `docs/opencode/eval/README.md`, `docs/opencode/eval/rubric.md`, `docs/opencode/eval/inviolable-rules.md`, `docs/opencode/eval/token-recording-template.md`, `docs/opencode/eval/tasks/01-*.md` … `10-*.md`, `scripts/eval/record-tokens.mjs`, plus committed outputs `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl` (3 days) and `docs/opencode/eval/baseline/` (aggregated snapshot). Raw per-run evidence under `docs/opencode/eval/runs/` stays gitignored.
- **No affected code, APIs, dependencies, or systems**: documentation and local recording tooling only. No CI/CD, no hooks, no config, no runtime.
- **Exit criterion (narrowed 2026-10-31)**: the harness is complete and verified — the 10 task files, `rubric.md`, `inviolable-rules.md`, `token-recording-template.md`, `scripts/eval/record-tokens.mjs` and `README.md` exist and pass their checks; `runs/` is gitignored while `tokens/` and `baseline/` stay tracked. Capturing the baseline itself (10 × 2 runs scored, probes recorded, 3-day token log, aggregated snapshot) is the exit criterion of the follow-up change `opencode-eval-baseline-execution`.
