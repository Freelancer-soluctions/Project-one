# Quality Rubric — OpenCode Eval Baseline

Scores one end-to-end run of an eval task. Every run produces exactly one
`score.md` (see [README.md](./README.md) §4) with **three class scores, 0-3
each**, for a per-run total of **0-9**.

Three artifact classes are scored: **spec**, **code**, **commit**. Nothing else
is scored. PRD metrics "turns to complete" and "skill load" are **out of scope**
for this baseline — they are deferred to later phases.

## How to apply

1. Score only what the run actually produced, from the evidence copied into
   `docs/opencode/eval/runs/<task-id>/<run-id>/artifacts/`. Never score from
   memory or from the transcript alone.
2. A missing artifact scores **0** for its class. "Almost done" is not a score.
3. Pick the highest anchor whose **every** clause is satisfied. Anchors are
   cumulative: a 3 must also satisfy the 2 and 1 anchors.
4. Write one sentence of justification per class, quoting the concrete evidence
   (file path, command output, commit SHA). A score without a justification is
   invalid and must be re-done.
5. Score the two runs of a task **independently**. Do not carry a judgement from
   Run A into Run B; variance is the point of the second run.

## Class 1 — Spec (requirements clarity, scenario coverage, delta correctness)

| Score | Anchor                                                                                                                                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No spec artifact, or it is invalid/unreadable (`openspec validate` fails, required sections absent).                                                                                                                                |
| 1     | Spec exists and validates, but requirements are vague (no observable behavior, no scenarios), or it describes implementation instead of behavior.                                                                                   |
| 2     | Requirements are clear and each is covered by at least one `#### Scenario:` block with a WHEN/THEN outcome. Delta (`ADDED`/`MODIFIED`/`REMOVED`) targets an existing capability header correctly.                                   |
| 3     | All of score 2, **plus** the delta is correct against the current `openspec/specs/` (no duplicated requirement, no orphan capability, `REMOVED` only for behavior actually dropped), and at least one edge/error case is specified. |

## Class 2 — Code (tests, lint/typecheck, behavior match)

| Score | Anchor                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | The workspace does not build, or the tests covering the change fail, or the change does not touch the code the task asks for.                                             |
| 1     | Builds and imports cleanly, but the covering tests fail, or lint/typecheck reports errors in touched files.                                                               |
| 2     | Covering tests pass, lint and typecheck are clean on the touched workspace, behavior matches the spec for the happy path, and new/changed behavior has at least one test. |
| 3     | All of score 2, **plus** behavior matches the spec on the edge/error cases named in the spec, and no unrelated files or behavior were changed.                            |

Evidence to capture for this class: the exact test command and its summary line,
`npm run lint` (or the workspace lint) result, and `tsc`/typecheck result.

## Class 3 — Commit (conventional message, DCO signoff, signed commit, Trello linkage)

| Score | Anchor                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No commit, or the commit message is not Conventional Commits, or the commit is **unsigned**, or the run used `--no-verify` at any point.       |
| 1     | Conventional Commits message with a valid type/scope and a body that explains why; commit is signed.                                           |
| 2     | All of score 1, **plus** the `Signed-off-by:` DCO trailer is present and matches the commit author.                                            |
| 3     | All of score 2, **plus** the Trello card id is referenced in the commit trailer/body **and** the card exists with the matching branch/PR link. |

Verify the commit, never the agent's claim:

```bash
git log -1 --format='%H%n%s%n%b'          # type(scope): subject + trailers
git log -1 --verify-signatures            # "Good signature"
git log -1 --format='%(trailers:key=Signed-off-by,valueonly)'
```

## Per-run score file

Each run writes `runs/<task-id>/<run-id>/score.md`:

```markdown
# Score — TASK-03 / Run A

| Class  | Score | Justification                                                                                    |
| ------ | ----- | ------------------------------------------------------------------------------------------------ |
| Spec   | 2 / 3 | `openspec/changes/server-ts-entry/specs/...`: 3 requirements, 4 scenarios, no edge case.         |
| Code   | 3 / 3 | `npm run test:unit --workspace=server-express`: 412 passed; lint clean; malformed input covered. |
| Commit | 2 / 3 | `feat(server): …` signed + `Signed-off-by:`; no Trello card id in body.                          |
| Total  | 7 / 9 |                                                                                                  |
```

## Aggregation (baseline snapshot)

For each task, with two runs:

- **per-task mean** = `(total_A + total_B) / 2`, rounded to one decimal;
- **per-task range** = `|total_A − total_B|` — this is the variance signal;
- **per-class mean** across all 20 runs (spec / code / commit separately);
- **overall mean** across the 20 run totals.

Report means and ranges side by side. A high mean with a high range is not a
good baseline: it means the workflow is unstable, and that instability is a
finding to record, not to smooth over.

## Calibration guardrails

- Do not re-score after seeing the aggregate; fix the score file and note the
  correction if you made a mistake, but never adjust to hit a target.
- Do not average away a 0: an unsigned or `--no-verify` commit is a 0 for the
  commit class no matter how good the code is.
- A rubric ambiguity discovered mid-run is a baseline finding: record it in a
  notes block inside the baseline snapshot instead of inventing an anchor.
