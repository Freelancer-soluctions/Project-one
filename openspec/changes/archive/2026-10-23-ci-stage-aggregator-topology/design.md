# Design

## Context

See `proposal.md` — Why. The facts below are the current state that constrains the approach, all verified against
`.github/workflows/ci.yml` on committed `main` (2623 lines):

- The four prebuild aggregators (`ci.yml:2460-2566`) are the only jobs that consume substage verdicts. Each declares
  `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` and evaluates only `contains(needs.*.result, 'failure')` and
  `contains(needs.*.result, 'cancelled')`, so `skipped` reads as acceptable. `always()` means their _execution_ is
  unconditional; their _verdict_ is what carries information.
- `client-build` (`ci.yml:2050-2073`) and `server-build` (`ci.yml:2075-2090`) declare the literal `if: false` and
  `need` six individual quality jobs each. Both lists are a strict subset of `prebuild-quality-complete.needs`
  (`ci.yml:2494-2509`), which is what makes the replacement safe: no transitive dependency is lost.
- Five post-build jobs (`e2e` 2265, `client-sonarqube` 2324, `client-depcheck` 2358, `server-sonarqube` 2373,
  `server-depcheck` 2402) appear in no `needs` array in the file.
- `actionlint` config (`.github/actionlint.yaml`) suppresses the message `constant expression "false" in condition`
  for `ci.yml` — a message-based regex, not a rule-code allowlist.

## Goals / Non-Goals

**Goals:**

- Give STAGE 3 and STAGE 4 the same verdict shape STAGE 2 already has, so that every stage of the DAG terminates in
  exactly one aggregator and `ci-complete` consumes stage verdicts rather than a mix of substage verdicts and loose
  jobs.
- Make the build stage's dependency on prebuild _explicit and machine-readable_, so that enabling a build job later
  cannot silently reintroduce the "green build over red governance" state.
- Keep the runtime behaviour of every pull request byte-identical: no `if: false` is activated, so this change is a
  topology change with zero observable CI effect until an activation change follows it.

**Non-Goals:**

- **Activating any `if: false` job.** `client-build`, `server-build`, `e2e`, `client-sonarqube`,
  `server-sonarqube`, `client-depcheck` and `server-depcheck` stay disabled. Their activation is a separate
  calibration decision with its own evidence requirements.
- **P2-1 — the `server-format-check` skip-propagation landmine.** Recorded, not fixed. See Decision 6 for whether
  the dereference retires it (it does not, fully).
- **P2-2 — binding or unbinding anything in ruleset 21227644.** A governance decision with blast radius on every
  open PR; separate change.
- **P2-3 — the `CI_MINIMAL` clause on `prebuild-governance-complete`** (`ci.yml:2461`). Recorded as accepted risk.
- **P3-1 — `ci-complete` treating `cancelled` as success** (`ci.yml:2589-2592`). Recorded as a divergence in the
  documentation, not changed; the two new aggregators take the opposite position (Decision 4) without retrofitting
  `ci-complete`.
- **P3-4 — vacuous-green guard.** An all-skipped substage still reads green. That is a policy change needing a
  calibration window, not a topology fix, and closing it here would fail every PR today for the same reason
  Decision 4 tolerates `skipped`.
- Any change to `opencode-review.yml`, `pr-metadata.yml`, `deploy.yml`, or the `sast` job.

## Decisions

### Decision 1 — Replace, never augment, the build `needs` lists

`client-build.needs` and `server-build.needs` are replaced wholesale by the four prebuild aggregators. Adding the
aggregators while keeping the six quality jobs would create two parallel dependency paths into the same quality
evidence: the aggregator path (which carries the verdict) and the individual-job path (which carries only execution).
The individual path is strictly weaker — it cannot see governance, security or testing — and its presence would let a
reader believe the direct edges still matter.

_Alternative rejected:_ keeping both. It reads as "more dependencies = safer", but the only thing it adds is noise and
a second place to update. _Alternative rejected:_ depending on `prebuild-quality-complete` only. That expresses
"build needs quality", not "build needs the prebuild verdict"; governance, security and unit-test failures would still
not reach the build stage.

Safety of the replacement was checked mechanically: every job in the two old lists is a member of
`prebuild-quality-complete.needs`, so the transitive dependency set is a superset after the change.

### Decision 2 — The predicate is composed INTO the `if:` expression

R1 asks for explicit predicates over the four aggregator results while keeping the disabled state intact. Both
requirements live in **one** expression, not two places:

```yaml
if: false && needs.prebuild-governance-complete.result == 'success' && needs.prebuild-quality-complete.result == 'success' && needs.prebuild-security-complete.result == 'success' && needs.prebuild-tests-complete.result == 'success'
```

GitHub expressions evaluate `&&` left to right and short-circuit, so the leading literal `false` decides the result for
every possible `needs` state: the disabled state is _structurally_ unbeatable, and there is no read of this file in
which the gate is missing.

Why the composition rather than an inert comment:

- **`actionlint` v1.7.12 does not flag it — verified.** Emitting `[if-cond]` requires the _entire_ condition to be a
  constant. With a `needs.*` operand present the condition is no longer constant, so the composed form yields **zero
  findings and exit 0** under this repo's `.github/actionlint.yaml`. The earlier premise that composing would change
  the suppressed diagnostic was empirically false.
- **Activation stays a single-token operation whose gate is already in place.** The edit is `false` → `true`; the
  predicate is never re-typed, so the operator cannot forget it. This is precisely the guarantee R1 exists to provide.
- **The `needs` edges alone are not enough.** They cascade today, but they are the _only_ thing carrying the gate if
  the predicate lives in a comment: an `always()`, `!cancelled()`, `success() || failure()` or `github.event_name`
  clause creeping into a build job's `if:` in a later change would silently bypass the cascade and run the build over
  a red prebuild stage. An explicit conjunct in the condition survives that edit.

_Alternative rejected (and not to be reinstated):_ `if: false` alone with the predicate only in an adjacent comment.
Weaker on every axis that matters — the gate is documentation rather than logic, and a bare flip activates the job
with no gate at all. _Alternative rejected:_ `if: ${{ false && ... }}` — semantically identical, one layer of nesting,
no benefit.

### Decision 3 — `always()` on all three new aggregators (the deadlock)

Without `always()`, `build-complete` would be skipped: its `needs` members are `skipped` (both declare `false`), and
GitHub skips a dependent job unless its condition opts out. A skipped `build-complete` would then cascade into a skipped `postbuild-tests-complete` and a skipped `postbuild-analysis-complete`, and `ci-complete` would tolerate all three of them — producing a green root verdict with no stage verdict ever emitted. The aggregators would exist in the file and never report.

`always()` is therefore not a style choice copied from the prebuild aggregators; it is what makes the new rungs
reachable at all. The consequence is that _execution_ stops implying a verdict, which is precisely why Decision 2's
explicit predicate is required one stage up.

_Alternative rejected:_ `if: ${{ !cancelled() }}` — narrower (it skips on cancellation, which is the state R6 wants to
fail on) and inconsistent with the four sibling aggregators.

### Decision 4 — `cancelled → exit 1` in the new aggregators, divergence from `ci-complete` recorded

The three new aggregators exit 1 on `cancelled`, matching the four prebuild aggregators and the criterion recorded in
`pr-metadata.yml:41-44` (a cancelled run never reported a conclusion, so it cannot be a success for a verdict).
`ci-complete` does the opposite (`ci.yml:2589-2592`: cancelled → exit 0).

The divergence is deliberately left in place. Aligning `ci-complete` would change the semantics of the root verdict
for the whole repository in a change whose subject is topology, and the current `cancelled`-as-success behaviour
interacts with concurrency cancellation on `ci.yml` (a superseded run would start failing rather than deferring).
It is recorded in `docs/CONTEXT-CICD.md` §6 as pre-existing debt (P3-1).

Consequence to be explicit about: a cancellation inside the build or post-build stage now fails its aggregator while
`ci-complete` would have passed the same cancellation. That asymmetry is intended — the nearer verdict is the stricter
one — and is stated in the spec so it is not mistaken for a bug.

### Decision 5 — `skipped` tolerance is a precondition, not a courtesy

Every member of `build-complete` is `skipped` today. So is `e2e`, the only disabled member of
`postbuild-tests-complete`, and all four members of `postbuild-analysis-complete`. R6's `skipped → exit 0` is what
allows the three aggregators to report a verdict at all on the commit that introduces them: a `success` requirement
would turn every PR red immediately, which would force the change to be reverted rather than reviewed.

The cost is stated plainly: these aggregators can only ever confirm the absence of a failure, never the presence of a
success. That is the same contract the four prebuild aggregators already have, and closing it is P3-4 (Non-Goal).

### Decision 6 — The `server-format-check` landmine is re-routed, not retired

P2-1: `server-build` used to `need` `server-format-check`, which is permanently `if: false` (`ci.yml:1858-1859`). A
job that `needs` a permanently skipped job is itself skipped forever, so activating `server-build` by flipping its
literal `false` would have produced a job that never ran — a silent no-op that reads exactly like an activation.

After R1 the direct edge disappears: `server-build` no longer lists `server-format-check`. But the landmine is **not
fully retired**. `server-format-check` remains a member of `prebuild-quality-complete.needs` (`ci.yml:2502`), so its
permanent skip still flows into the build stage — this time through an aggregator that tolerates `skipped`. The
failure mode changes; it does not disappear:

| Path                                           | Before R1                                 | After R1                                                                          |
| ---------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `server-format-check` skipped → `server-build` | cascade skip: build never runs, silently  | absorbed by `prebuild-quality-complete`, which reports success                    |
| Detectability                                  | none — the build job simply never appears | none at job level; the gap is visible only as an aggregator that tolerated a skip |

So the specific damage — a permanently unreachable job — is retired, while the class it belongs to, a permanently
skipped member that no verdict can notice, is not. That residue is P3-4. Recorded rather than fixed, per Non-Goal
P2-1.

**Mirrored landmine — recorded, not fixed.** The skip-propagation class does not only travel prebuild → build. On the
analysis side, this change creates a verdict over jobs that descend from the same permanently disabled roots:
`client-sonarqube.needs: [client-build, test-unit-client]`, `server-sonarqube.needs: [server-build, test-unit-server]`
and `server-depcheck.needs: server-build`. Every one of those parents is `if: false`, so the children are skipped
forever and `postbuild-analysis-complete` **can never receive a real analysis verdict** until the build jobs are
activated — it will emit a success over an all-skipped branch. That is exactly the P3-4 shape, on the side where this
change introduces the new verdict: the aggregator is not wrong, it is vacuous. Recorded rather than fixed, because the
remedy is activating the build stage, which is an explicit Non-Goal.

### Decision 7 — Documentation corrections travel with the topology

The change carries five documentation edits in `docs/CONTEXT-CICD.md` (§3.2, §3.3, §3.3.1, §5.1, §9.3.7) plus one
header comment in `ci.yml` (D5b). A topology change that is not reflected in the context file reproduces the exact
defect that file exists to prevent: a reader treating a stale document as verified state.

Three of those edits correct claims that were never true of the committed file, not consequences of this change:

- §3.3 lists a job `actionlint` (`name: Quality: ActionLint`) as active. No such job exists in `ci.yml`; the only
  actionlint job is `actionlint-advisory` (`ci.yml:1602`, `Security: ActionLint Advisory (SARIF, FASE 1)`). §3.3's
  security-placement note and §3.3.1 repeat the claim ("el `actionlint` bloqueante pertenece a 2B quality").
- §3.2 and §5.1 document 5 required status-check contexts. Ruleset 21227644 enforces **2**
  (`Governance: PR Body Lint`, `Prebuild Governance Complete`; re-verified through the API on 2026-10-23). The
  consequence is documented as an explicit debt note: `Governance: PR Title Lint` is enforced by nothing, and the
  three governance jobs of `ci.yml` block the merge only through `Prebuild Governance Complete`.
- The `ci.yml:458` header reads `SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration,
test-smoke, property-tests`. It declares `test-integration` and `test-smoke` as prebuild members, which is the
  documentary origin of their appearance in `prebuild-tests-complete.needs`. They are STAGE 4 jobs
  (`ci.yml:2100`, `ci.yml:2207`, under the `ci.yml:2093` "POST-BUILD — INTEGRATE" banner). The header is corrected to
  list only the tier-1 set (Decision 8).

The ruleset is **not** touched: D4 is a documentation correction, and P2-2 excludes governance-binding changes.

_Alternative rejected:_ leaving the three factual errors for a docs-only change. Two of them sit in the very table
and section this change must edit for D1, and a known-false row between two new true rows would make the table
unusable as evidence.

### Decision 7b — Announced correction: `ci-complete` never listed `verify-signatures`

The delta's MODIFIED `ci-complete depends on aggregators` requirement states the list as **9 items** (the 4 prebuild
verdicts, the 3 stage aggregators, `zombie-workflow-guard` and `repo-discovery`). The live main spec asserted **7**,
and one of those 7 was `verify-signatures` — a job that `ci-complete.needs` has never contained (`ci.yml:2579-2586`).

This is an **announced correction**, not a silent trim: the 7-item sentence was aspirational documentation, and a
reviewer diffing the delta against the live spec will see a job disappear. Nobody should "restore" it. `ci-complete`
does not and cannot gate on commit signatures — signature enforcement lives in the ruleset's `required_signatures`
rule plus the `verify-signatures` job's own check run, which is a separate path entirely. Adding it to the aggregator
would also be wrong on its own terms: it would make the root verdict depend on a governance job that
`Prebuild Governance Complete` already covers at substage level.

The correction is recorded here because a removed item is indistinguishable from an accidental deletion in a spec
diff, and the delta is the only place a future reader can learn which it was.

### Decision 8 — The testing taxonomy, and why the post-build stage has two aggregators

The repository's test and analysis jobs fall into three tiers plus one non-test category. The tiers differ in the
infrastructure they need, which is what makes them separate rungs rather than one flat list:

| Tier                    | Jobs                                                                                           | Infra                                                | Aggregator                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| 1 — Unit (prebuild)     | `test-unit-client`, `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests` | none (jsdom / node)                                  | `prebuild-tests-complete`     |
| 2 — Integration / Smoke | `test-integration`, `test-smoke`                                                               | Postgres service container + `prisma migrate deploy` | `postbuild-tests-complete`    |
| 3 — E2E                 | `e2e` (`if: false`)                                                                            | compiled artifact + Playwright                       | `postbuild-tests-complete`    |
| — Analysis (not tests)  | `client-sonarqube`, `server-sonarqube`, `client-depcheck`, `server-depcheck` (all `if: false`) | —                                                    | `postbuild-analysis-complete` |

Chain: `prebuild-*` → `build-complete` → {`postbuild-tests-complete`, `postbuild-analysis-complete`} →
`ci-complete`.

**Why the split (Change A).** Testing and static analysis are different taxonomies with different remediations: a red
`e2e` means the product misbehaves, a red `depcheck` means an unused or missing dependency. With one aggregator both
collapse into a single `failure` on one check, and triage starts by opening the log. Two branches make the Checks list
self-describing and give each tier its own rollback lever: analysis can be promoted to blocking without touching the
testing verdict, and vice versa.

_Alternatives rejected:_ a single `postbuild-complete` (the original R3 draft) — one verdict for two taxonomies, which
is the defect this change is meant to remove one level up. Splitting further, one aggregator per job, would add rungs
that aggregate a single child and carry no information beyond the child's own check.

**Why `property-tests` joins tier 1 (Change B).** It is a tier-1 test — no service container, no artifact — and it was
absent from the tier-1 verdict, so the verdict's inventory did not match its own tier. Listing it is **record-only**:
the job carries `continue-on-error: true` (`ci.yml:1219`), so a failure is absorbed at job level and cannot fail the
aggregator. This closes a taxonomy gap without changing the blocking posture, and the flag is explicitly **not**
removed — removing it would promote an advisory tier-1 job to blocking as a side effect of a topology change.

**Observation, not fixed (D5b secondary).** `test-integration` and `test-smoke` declare `needs: repo-discovery`
(`ci.yml:2103`, and the equivalent in `test-smoke`) and therefore do **not** actually consume a compiled artifact,
despite the STAGE 4 banner claiming the stage's jobs "requieren artifact compilado". They are post-build by
_position in the DAG_ (they sit under `build-complete` in `postbuild-tests-complete`), not by artifact consumption.
The inconsistency is recorded and left alone: adding a `needs: client-build` edge to those two jobs would couple a
running test to two disabled jobs, and would therefore skip both tests on every PR — a far worse outcome than a
banner that overstates the dependency.

### Decision 9 — `prebuild-unit-tests-complete` is renamed `prebuild-tests-complete`

The job id `prebuild-unit-tests-complete` becomes `prebuild-tests-complete`, and its display context
`Prebuild Unit Tests Complete` becomes `Prebuild Tests Complete`. Two reasons, both consequences of Change B:

- **The aggregator no longer holds only unit tests.** Its `needs` is `[test-unit-client, test-unit-server,
client-coverage, server-coverage, property-tests]` — the whole tier-1 testing surface, including property tests and
  the two coverage-tripwire jobs. The `unit` wording described the pre-Change-B list and became false the moment
  integration and smoke left and `property-tests` arrived.
- **It restores symmetry with `postbuild-tests-complete`.** The pair `prebuild-tests-complete` ↔
  `postbuild-tests-complete` now names the two testing tiers in the same vocabulary. With `unit` retained, the two
  halves of one taxonomy would be named after different things — a tier name on one side, a test kind on the other —
  and that asymmetry is exactly what made the prebuild/post-build split hard to see in the first place.

**Binding safety.** The rename is safe against the ruleset: 21227644 enforces exactly 2 required contexts
(`Governance: PR Body Lint`, `Prebuild Governance Complete`), and `Prebuild Unit Tests Complete` is not one of them;
classic branch protection has `contexts: []`, so there is no second binding to update. No `gh api` write is required.

**Atomicity is not optional.** The id is consumed by `ci-complete.needs` (`ci.yml:2579`). Renaming the job at
`ci.yml:2544` without updating that reference makes GitHub reject the **entire workflow file** — a `needs` entry that
names no job invalidates the file, so `ci.yml` stops running altogether rather than failing one check, and every PR
blocks on `Expected — Waiting for status to be reported`. All four `ci.yml` edits therefore ship in one commit:
`2544` (the id), `2546` (the `name:`), `2579` (the `ci-complete.needs` entry) and `1046` (the comment that names the
aggregator). The same rule applies to any other file that addresses the id.

**Why this is a RENAMED delta and not a MODIFIED one.** The requirement's _name_ changes, and this OpenSpec version
splits that from a content edit: a `## RENAMED Requirements` block (`FROM:` / `TO:`) performs the rename at archive
time, applied before MODIFIED, and the CLI rejects a MODIFIED that cites the old header ("when a rename exists,
MODIFIED must reference the NEW header"). The delta therefore carries the rename in `RENAMED` and the updated 5-job
content in `MODIFIED` under the new name. Folding both into one MODIFIED block would leave the main spec with a
stale requirement name that no longer matches the job it describes.

**Scope note.** The rename does not authorize renaming ids _by convention_: the "ids SHALL NOT be renamed" rule
covers display-name normalization, and this rename happens for a different reason (the id became factually wrong).
`Prebuild Tests Complete` still satisfies the `Prebuild <Substage> Complete` pattern.

**Archives are historical.** Changes under `openspec/changes/archive/` record what was true when they were written
and SHALL NOT be rewritten to carry the new id. The propagation targets are the live main specs and the docs listed
in `tasks.md`, not the archive.

## Risks / Trade-offs

- **`actionlint` is clean on the composed condition — verified, not assumed** → `actionlint` v1.7.12 (the version CI
  pins) emits `[if-cond]` only when the _entire_ condition is a constant. Once a `needs.*` operand is present the
  condition is not constant, so `if: false && needs.…result == 'success' && …` produces **zero findings and exit 0**
  under this repo's `.github/actionlint.yaml`, for both build jobs. The `constant expression "false" in condition`
  regex in that file consequently no longer matches either of those lines: it is unnecessary for them now, and
  harmless if left in place (it still covers any job that returns to a bare literal). Removing it is optional cleanup
  and is **not** part of this change.
- **An aggregator reports success while its stage never ran** → Accepted and documented (Decision 5). Only P3-4
  closes it, and only with a calibration window.
- **`cancelled` behaves differently at stage level and root level** → Accepted and documented (Decision 4) in both the
  spec and §6 of the context file, so a future reader does not "fix" one side in isolation.
- **Three always-running jobs on every PR** → Each is one ubuntu-latest job with a single shell step, no checkout and
  no artifact (the `prebuild-*` precedent), so the cost is a small amount of runner time plus three entries in the
  Checks list.
- **`CI_MINIMAL` interaction (P2-3)** → The new aggregators deliberately carry **no** `CI_MINIMAL` clause. The prebuild
  aggregators skip under `CI_MINIMAL=true`, which would leave `build-complete` consuming four `skipped` verdicts and
  reporting success — the vacuous-green shape of Decision 5, one stage up. `CI_MINIMAL` has been `false` since
  2026-09-17 (reverting it is itself a revert of `ci-prebuild-quality-lint` task 8), so the clause is omitted rather
  than duplicating a mode nobody runs. Recorded as accepted risk P2-3, together with the note that
  `Prebuild Governance Complete` is today the repository's **only** merge-governance enforcement path: if it stops
  reporting, governance stops being enforced anywhere.
- **A reader mistakes `Build Complete` / `Postbuild * Complete` for substage aggregators** → Mitigated by the naming
  requirement: the `Prebuild ` prefix keeps identifying exactly the four STAGE 2 aggregators, and all three stage
  aggregators are registered in §3.3.1 as stage siblings. Ids (`build-complete`, `postbuild-tests-complete`,
  `postbuild-analysis-complete`) are not renamed.
- **Three new check names could be added to the ruleset by mistake** → They are emitted but not bound. Binding them is
  P2-2, a separate governance decision; this change performs no `gh api` write.

## Migration Plan

1. One atomic commit: the three new jobs, the two `needs` replacements, the two `needs` edits, the four-line
   `prebuild-tests-complete` rename (id, `name:`, the `ci-complete.needs` entry, the comment at `ci.yml:1046`), the
   two header-comment corrections (`ci.yml:458` SUBSTAGE 2D banner, `ci.yml:2569` CI Complete banner) and the five
   `docs/CONTEXT-CICD.md` sections. No job is activated, so no behaviour changes on any PR.
2. Verification before pushing: `actionlint -config-file .github/actionlint.yaml .github/workflows/ci.yml` must stay
   clean (no new `if-cond` finding) and `openspec validate ci-stage-aggregator-topology --strict` must pass.
3. Rollback is `git revert` of that single commit: the file returns to the pre-change topology with no state to
   unwind, because nothing outside the repository was modified (no ruleset write, no secret, no variable).
4. Propagation to the live main specs is **not** discovered by `openspec archive`. The archiver applies only the deltas
   physically present under `changes/ci-stage-aggregator-topology/specs/`, so the sync happens **because those six
   capability deltas exist** — `ci-prebuild-substage-structure`, `ci-e2e`, `ci-test-impact-analysis`,
   `ci-test-jobs-activation`, `ci-test-sharding` and `client-snapshot-testing`. A seventh capability that cited the old
   id and had no delta would silently keep it: the delta set is the mechanism, not any reference-scanning. Task 6.5's
   `grep` is the proof that none was missed.
