# Design

## Context

The PR Body Lint costs ~510 physical lines (235 by the metric below) to enforce three sections, an
issue reference and a checkbox. This change replaces the evaluative core with the reduced policy in
`specs/pr-body-lint-governance/spec.md` — 3 requirements removed, 2 modified, 4 added — and
simplifies the PR template.

Measured today with the metric below: **235 logic lines**. Target: **≤80**.

## Goals / Non-Goals

**Goals:**

- ≤80 logic lines by the metric, so the target is checkable instead of rhetorical
- Keep the controls with real value: whole-body emptiness, a `Related Issue` that carries text, a
  tested section with text or a checked box, `Closes #` without a number rejected
- Keep only template boxes that no machine verifies (2 boxes)
- `edited` re-runs the check — already true in production, so the goal is evidence, not code

**Non-Goals:**

- Judging the semantic quality of prose (that is human review)
- Renaming `Governance: PR Body Lint`, which ruleset 21227644 references by exact string
- Touching DCO, `Governance: PR Title Lint` or CI
- Changing bot handling, the base-ref checkout or the `merge_group` no-op
- Deciding D2 (report/artifact) or D3 (issue-less PRs) — **decided by the maintainer on 2026-10-23**, see §
  Open Decisions. Neither decision adds a network call: the summary is the only surface and R2b stays text-only.

## The metric

"≤80 lines of logic" is only useful if it is reproducible, so it is defined as: **non-blank,
non-comment lines above the first of the two export markers that can follow the policy code —
`export const buildReport ` or `export const evaluate ` — in `scripts/ci/pr-body-lint.mjs`**. That
is the parsing helpers plus `evaluateBody`, exclusive of the report writer, the summary renderer and
the `evaluate` wrapper.

`wc -l` is explicitly not the metric: it counts comments, JSDoc blocks and blank lines, so it cannot
tell "less logic" from "less commentary".

**Two anchors, not one, because a single anchor is not D2-invariant.** If D2 drops the report, the
`buildReport` marker disappears, `s.indexOf(...)` returns `-1`, and `s.slice(0, -1)` silently yields
the **whole file** — 343 lines today, unreachable by any amount of policy reduction. The ≤80 gate
would then fail for a reason that has nothing to do with the policy, which is exactly the failure the
metric exists to prevent. Cutting at whichever marker exists (the first of the two) measures the same
region — policy code, no reporting — under either D2 outcome.

Measured today with this definition: **235 logic lines** (the command below prints
`anchors: [ 13923, 16555 ]`). Target: **≤80**.

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('scripts/ci/pr-body-lint.mjs','utf8');const c=['export const buildReport ','export const evaluate '].map(m=>s.indexOf(m)).filter(i=>i>=0);const seam=s.slice(0,Math.min(...c));const n=seam.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').filter(l=>{const t=l.trim();return t&&!t.startsWith('//')}).length;console.log('logic lines:',n)"
```

## Requirements Mapping

### Policy (RP-1 to RP-5)

| RP   | Requirement                                                                                        | Implementation                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| RP-1 | "Empty" means nothing survives stripping comments, unchecked boxes and `Closes #` without a number | One strip pass; the result feeds the `EMPTY_BODY` diagnostic, never a length                       |
| RP-2 | Sections located by a single regex over `##` headings                                              | One `/^## /gm` scan, canonicalized keys, first occurrence wins, no fence mask, no duplicate metric |
| RP-3 | Each failure names rule and section                                                                | `R2b: Related Issue`, `R3: Closes # without number`, `EMPTY_BODY: body` as its own diagnostic      |
| RP-4 | Tool errors reported as `TOOLING ERROR`                                                            | `evaluate` distinguishes infrastructure failure from policy violation                              |
| RP-5 | The Step Summary is the surface                                                                    | Report and artifact conditional on D2                                                              |

### Template (RT-1 to RT-3)

| RT   | Requirement                                            | Implementation                                                                                           |
| ---- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| RT-1 | 2 conserved boxes; the three sections do not change    | Keep `Documentation updated` and `No breaking changes`; `## Type / Scope` and the 5 test boxes untouched |
| RT-2 | `docs/learning/dco.md` and `prepare-commit-msg` remain | Not modified by this change                                                                              |
| RT-3 | The comment says who verifies what                     | Names DCO, `Governance: PR Title Lint` and CI separately — never the body lint                           |

### Workflow (W1 to W5)

| W   | Requirement                                                                    | Status                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | `edited` in the trigger                                                        | **Already true** (`pr-metadata.yml:38`); evidence recorded in `tasks.md` 1.1/1.3, no code change                                                                                                    |
| W2  | `cancel-in-progress: true`                                                     | **Withdrawn.** Keep `false` (`pr-metadata.yml:49`, rationale `:41-46`): a cancelled run is not success for a required check, so flipping it can strand the check with no verdict for the final body |
| W3  | Issue validation via `closingIssuesReferences`                                 | **Not adopted (D3):** R2b stays text-only, so nothing queries the API and the offline pre-flight keeps working                                                                                      |
| W4  | Base-ref checkout, body from payload, bot skip, merge_group no-op, frozen name | Unchanged                                                                                                                                                                                           |
| W5  | Actions pinned by SHA                                                          | `checkout@v5.1.0` and `github-script@v9.0.0` pinned by 40-char SHA (tag in a trailing comment); no artifact step exists, so nothing else to pin                                                     |

## Return-shape contract

`evaluateBody({ body })` returns at least:

| Key        | Shape                                 | Consumer                                                              |
| ---------- | ------------------------------------- | --------------------------------------------------------------------- |
| `verdict`  | `'pass'` or `'fail'`                  | `push-pr.md` maps it to the exit code; `evaluate` sets the conclusion |
| `failures` | array of `{ rule, section, message }` | `push-pr.md` prints `FAIL rule section - message`; the job fails      |
| `warnings` | array of `{ rule, message }`          | `push-pr.md` prints `WARN`; always empty after this change            |

This is a **contract, not an implementation detail.** Two consumers read it independently —
`.opencode/command/push-pr.md` step 7 (`:52-64`) and the `evaluate` wrapper the workflow uses — and
neither is versioned against the other. A rename breaks the offline pre-flight _silently_: the
`node -e` snippet would print `undefined` and exit 0 on a failing body, which is a false green
exactly where the author relies on the check. Keys and field names stay as listed; extra keys are
allowed, removals and renames are not.

`warnings` stays in the shape even though no rule emits one any more, because dropping the key would
break the consumer for no gain.

## Pure/impure boundary

`evaluateBody` is **network-free and side-effect-free**: text in, the shape above out. That is not an
aesthetic preference — it is what makes `push-pr.md`'s pre-flight work, since the command runs it
offline against a local file before `gh pr create` and fails closed when it cannot.

Anything that needs the network belongs on the impure side: `evaluate({ core, context })`, which has
`context` and can call the API, or the workflow step itself. The issue lookup of W3 — if D3 adopts
it — goes there. Never into `evaluateBody`, and never into a helper it calls.

Consequence: the pure seam is testable with no mocks and no GitHub fixture, and the pre-flight keeps
running on a plane.

## Policy Implementation Design

1. **Strip once**: HTML comments, unchecked task lines, heading lines, `Closes #` without digits,
   checked-box markers, whitespace. The strip answers "is anything left?"; it does not measure.
2. **Locate sections** on the **raw** body, before stripping, because stripping deletes the headings
   that define them.
3. **Evaluate**: `EMPTY_BODY` (nothing survives stripping the whole body), R2a (`Summary` present
   and non-empty), R2b (`Related Issue` present and non-empty), R2c (tested section non-empty **or**
   a checked box in the raw section text), R3 (comment-stripped body carries no `Closes #` without
   digits).
4. **Report**: every failure names rule and section.
5. **Publish**: Step Summary; report and artifact per D2.

No length appears anywhere in that list, and that is the point: the old rules measured a proxy
(`aaaaaaaaaaaaaaaaaaaa` passed) while an honest one-word `Summary` failed.

`EMPTY_BODY` is a **named diagnostic, not a distinct verdict.** R2a, R2b and R2c already require
their sections to carry stripped content, so a body that passes them is necessarily non-empty and
`EMPTY_BODY` can never fire alone. It exists to name the real cause — an empty or untouched-template
body would otherwise surface as three separate "missing section" failures, which tells the author
nothing about the one thing they have to do. It inherits R1's diagnostic value, not R1's reach.

### Accepted regression: the scan is fence-blind

`computeFenceMask` goes. A line starting with `##` splits the document even inside a code fence, so a
fenced `## ...` line inside a section truncates that section. This is deliberate and normative in the
delta (`Core sections are located by a single ## heading scan`): masking cost the largest block of
code in the file for a case real pull requests do not produce. It is not a bug to "fix" during review
without a new delta.

## Template Design

- Three `##` sections preserved: `Summary`, `Related Issue`, `How Has This Been Tested?` — the
  lockstep test reads them from the template file
- `## Pre-merge Checklist` keeps 2 boxes: `Documentation updated`, `No breaking changes`
- Removed: `Signed-off-by present` (DCO), `Tests pass locally` (CI), `PR title follows Conventional
Commits` (`Governance: PR Title Lint`)
- `## Type / Scope` (5 boxes) and the test list (5 boxes) untouched
- The RT-3 comment names the three checks individually, so nobody looks for them in the body

## Workflow Design

1. **Trigger**: already correct (`pr-metadata.yml:38-39`) — verified, not modified
2. **Concurrency**: `cancel-in-progress: false` stays; W2 withdrawn
3. **Issue validation**: per D3, outside the pure seam
4. **Actions**: SHA pinning for the actions that survive
5. **Body**: from `context.payload`, never from `${{ }}`

The job name `Governance: PR Body Lint` is frozen: ruleset 21227644 matches it by string, and a rename
would leave the PR blocked waiting for a check that never reports.

## Open Decisions

**D2 — report and artifact: DECIDED (maintainer, 2026-10-23): drop them.** The Step Summary is the
only surface.

`buildReport`, `writeReport`, the `report.json` path and the `upload-artifact` step are gone, so the
landed requirement is the **drop** branch of the delta's conditional (`Evaluation is deterministic and
machine-readable`): the verdict and the failures travel in the summary alone, and no rule identifier
is published twice. The trade, accepted: no artifact for post-hoc triage, in exchange for one surface
that already names rule and section and one fewer action to pin by SHA. The metric now cuts at
`evaluate` (the `buildReport` marker no longer exists) and reads **78**, so D2 did not move the ≤80
target.

**D3 — issue-less pull requests: DECIDED (maintainer, 2026-10-23): no, R2b stays text-only.** A PR
without a linked issue does not become invalid, so Phase 3 (the `closingIssuesReferences` query) is not
adopted and `tasks.md` 4.1-4.3 stay open as not-implemented rather than blocked.

| Option                                     | Consequence                                                                                                                                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Always require an issue (API-only)         | `docs`/`chore` PRs cannot merge without one. Today `.opencode/command/push-pr.md:56` writes an honest "no linked issue" sentence that R2b's 20-character branch accepts; an API-only rule would reject exactly that sentence for tooling work |
| Allow an explicit `N/A` with justification | No false reds for tooling work, but the rule stops distinguishing "no issue needed" from "forgot the issue"                                                                                                                                   |

With D3 answered "no", the delta's R2b is implemented exactly as written: the section must carry text,
and whether a PR has a linked issue is not the policy's business. A5 — a `#123` inside a code fence
with no linked issue — therefore does not apply to this policy, and the offline pre-flight keeps
running with no network.

The option table above is kept as the record of what was weighed; D3 is now answered, so `tasks.md`
section 4 records 4.1-4.3 as not implemented rather than blocked.

## Migration Plan

1. **Phase 0 — Trigger: verification only.** `edited` and `merge_group` are already in production
   (`pr-metadata.yml:38-39`), and the edit-trigger is proven by 9 runs on one sha on 2026-10-23. No
   code change; record the evidence.
2. **Phase 1 — Template**: remove the 3 boxes, add the RT-3 comment. Exit: lockstep green, 2 boxes.
3. **Phase 2 — Reduced policy**: rewrite per RP-1..RP-5, update `push-pr.md` in the same PR, port the
   tests per `tasks.md` 3.6. Exit: A1-A4 and A7-A9 green, metric ≤80.
4. **Phase 3 — Issue by API: not adopted.** D3 answered that an issue-less PR stays valid, so there is
   no query to add and A5 has no meaning for this policy.

Each phase is an independent PR; `git revert` restores the previous behaviour without touching the
ruleset.

## Risks / Trade-offs

- **Trivial bodies pass**: `n/a` clears emptiness. Accepted — the check detects absence, review judges
  quality.
- **Fence-blind truncation**: a fenced `##` line ends a section early. Accepted and normative in the
  delta, not a defect to patch silently.
- **Rewriter regressions**: port the inventory in `tasks.md` 3.6 before deleting old code; the new R2c
  checked-box test is the one that catches a lost raw-text dependency.
- **`closingIssuesReferences` latency**: the lookup may lag a just-linked issue, and a single
  attempt would keep the _fixed_ PR red — `edited` is in scope precisely so an author can fix a red
  PR by editing, so a lagging lookup would defeat the trigger it exists for. Implemented as one
  conditional retry (`tasks.md` 4.2(b)): retry once after a short delay, and fail as `TOOLING
ERROR` only if the retry is also empty. Applies in Phase 3, i.e. only if D3 adopts the API check.
- **Close keywords only work toward the default branch**: today every PR targets `main`.
- **API failure**: a red unrelated to the author; `TOOLING ERROR` keeps it distinguishable, and editing
  the body re-runs the check.
- **Job name change**: would block merges waiting for a non-existent check; the name is frozen.
- **Re-run jobs reuses the old payload**: authors must edit the body to re-judge it; say so in the
  check message and the contribution guide.
