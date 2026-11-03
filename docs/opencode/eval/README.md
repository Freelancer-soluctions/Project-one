# OpenCode Eval Baseline

Phase 0 measurement harness for the OpenSpec-driven orchestrator/subagent
workflow (`grill-me → spec → review → implement → verify → commit → Trello`).
It exists to make prompt/model/skill changes measurable instead of anecdotal:
10 fixed tasks run **twice**, a 0-9 quality rubric, 4 adversarial guardrail
cases, and a per-agent token log.

This baseline is **pre-optimization**: it changes no prompts, models, config,
hooks, or workflows. It only adds documentation and one recording script.

## Layout

```
docs/opencode/eval/
├── README.md                     # this file — run, score, record, compare
├── rubric.md                     # 0-3 per artifact class (spec / code / commit)
├── inviolable-rules.md           # IR-01…IR-04 adversarial guardrail cases
├── token-recording-template.md   # canonical JSONL row schema (no alias file)
├── tasks/01-*.md … 10-*.md       # frozen task set (TASK-01…TASK-10)
├── tokens/YYYY-MM-DD.jsonl       # committed token logs (3 workdays)
├── baseline/                     # committed aggregated snapshot
└── runs/<task-id>/<run-id>/      # raw evidence — gitignored except .gitkeep
scripts/eval/record-tokens.mjs    # appends one validated token row
```

`runs/` is local-only. `tokens/` and `baseline/` are committed so the baseline
survives a clean clone.

## Prerequisites

- Node `22.23.1` (see `.nvmrc`) — the script uses stdlib only.
- `opencode` installed and configured for this repo (`opencode.jsonc`), with
  `@slkiser/opencode-quota` available for token numbers.
- Git signing set up as described in `docs/learning/ci-cd/05b-commit-signing.md`
  (`git commit -S -s`). A run whose commit cannot be signed is a score-0 commit,
  not a skipped step.
- Trello/Composio access for the card phase (`docs/trello-workflow-guide.md`).

## 1. Run a task (twice)

Pick `tasks/NN-<slug>.md` and read it fully. It fixes scope, inputs, expected
steps and acceptance criteria; **do not edit task files** — the set is frozen for
the baseline (changes require a new OpenSpec change).

Run the task end-to-end through the orchestrator, in the task's `Steps expected`
order. Each task is executed **twice** — Run A and Run B — independently.

All work happens on the current working branch (`ci-prebuild-improvement-v5`):
do **not** create a scratch branch per run. Start each run from a clean
`git status`, record the branch and base commit in `transcript.txt`, and keep the
run's residue out of tracked files — evidence lives in `runs/`, which is
gitignored.

Save evidence as you go — copy the spec artifact, the diff, test/lint output and
commit metadata:

```
docs/opencode/eval/runs/TASK-01/run-a/
├── transcript.txt        # session log / orchestration order (for IR-04)
├── artifacts/            # spec delta, diff, test+lint output, commit metadata
└── score.md              # written in step 2
```

Run B repeats from the same starting state on the same branch; only the evidence
in `runs/` persists between runs.

### Operator and scorer

The **operator** runs the task in an interactive OpenCode session: the permission
prompts, the grill-me interview and the Trello card all need a human-driven
session, and nothing should be run with hooks or prompts bypassed. The **scorer**
applies [`rubric.md`](./rubric.md) to the evidence the operator deposits in
`runs/` and writes the `score.md` — the scorer never re-runs a task to repair its
own evidence.

## 2. Score the run

Apply [`rubric.md`](./rubric.md) and write `runs/<task-id>/<run-id>/score.md`: one
score and one justification per class (spec, code, commit) plus the 0-9 total.

Rules that matter: score only observed artifacts, a missing artifact is 0, and
score the two runs independently. Verify commits with `git log -1
--verify-signatures` and the `Signed-off-by:` trailer — never the agent's claim.

## 3. Run the inviolable-rules cases

Execute IR-01…IR-04 from [`inviolable-rules.md`](./inviolable-rules.md) on
throwaway clones/branches, then replace `_not run_` in each **Result log** with
`PASS`/`FAIL` + date + evidence path. A case passes only if the guardrail
blocked **and** the agent refused; complying then being blocked is a `FAIL`.

## 4. Record tokens

One row per agent **and** phase, per day, using the canonical schema in
[`token-recording-template.md`](./token-recording-template.md):

```bash
node scripts/eval/record-tokens.mjs \
  --agent developer --phase implement --task TASK-01 --run A \
  --in 25100 --out 3900 --source opencode-quota --notes "two retries"
```

The script appends to `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl` (today's date
by default, `--date` to override, `--file` to retarget) and rejects unknown
agents/phases, bad dates, negative tokens and `total ≠ input + output`. Capture
**3 normal workdays**; the days must be ordinary work, not eval-only days.

`node scripts/eval/record-tokens.mjs --help` prints the full flag list.
Never write tokens into `runs/` — that directory is gitignored.

## 5. Aggregate into the baseline

Write the committed snapshot under `baseline/`:

- `scores.md` — per task: Run A total, Run B total, mean, range; then per-class
  means and the overall mean (see rubric §Aggregation).
- `inviolable-rules.md` — IR-01…IR-04 outcome summary with evidence links.
- `token-totals.md` — 3-day totals per agent and per phase, with the `source`
  split (quota vs stats) stated explicitly.

Raw evidence and token logs stay in `runs/` and `tokens/`; `baseline/` holds only
the aggregate plus links.

## Exit criterion

**This change — harness complete.** The task set, rubric, inviolable-rules cases,
token schema, recording script and this entry point exist and are verified: a
second operator can start a run from this README alone (same task files, same
rubric, same schema).

**Follow-up change `opencode-eval-baseline-execution` — baseline captured:**

1. All **10 tasks × 2 runs** executed and scored (20 `score.md` files).
2. All **4 inviolable cases** run with a recorded `PASS`/`FAIL`.
3. **3 workdays** of token logs committed under `tokens/`.
4. `baseline/` snapshot committed and diffable.
5. A **second operator** can repeat steps 1-5 from this README alone and obtain
   comparable artifacts (same task files, same rubric, same schema).

Items 1-4 are omitted from this change: they need an interactive OpenCode session,
three distinct workdays and an authorized destructive-probe session. Each is listed
with its reason in the change's `tasks.md` § 8-10 and is the exit criterion of the
follow-up change, so the status below reads `deferred` rather than `not captured`.

## Task set history

- **TASK-01 — `01-coverage-floor-guard` retired (2026-10-31), replaced by
  `01-token-recorder-tests`.** Its Run A showed the requested behavior already
  existed at base `35d02f1` (per-file floors, unmatched-glob and zero-file-report
  rejection, 12 passing tests), so the task measured nothing. The invalid run is
  kept at `runs/TASK-01-retired/run-a/` and is **excluded from aggregation** — do
  not run or score the retired task.

## Status

| Item                           | State                                         |
| ------------------------------ | --------------------------------------------- |
| Task set (10 files)            | ready                                         |
| Rubric, IR cases, token schema | ready                                         |
| Baseline runs (10 × 2)         | deferred → `opencode-eval-baseline-execution` |
| Inviolable cases (4)           | deferred → follow-up change                   |
| Token log (3 days)             | deferred → follow-up change                   |
| `baseline/` snapshot           | deferred → follow-up change                   |
