# Design

## Context

See `proposal.md` — Why. Only the constraints that shape the implementation are repeated here.

**`ci.yml` (verified 2026-10-20):** `on: pull_request: branches: [main]` with **no `types:`** (defaults to
`opened`/`synchronize`/`reopened`) plus `merge_group: {}`. Concurrency is a single group per PR
(`pr-<number>`) or per queue entry, with `cancel-in-progress: true`.

**Blast radius if `edited` were added to `ci.yml`:** 52 top-level jobs; **~40 of them already carry
`if: ... github.event_name == 'pull_request'`**, which is _true_ for `edited`. Those jobs would **execute**
(SAST with Docker, typecheck, unit/integration tests, lint, knip, dependency-cruiser), not skip. The
remaining heavy jobs carry `if: false` or an aggregator `always()` that would have to be rewritten to
`always() && action != 'edited'`. The cancellation problem is a _symptom_ of the coupling, not the root
cause: **a workflow has exactly one `on:` and one `concurrency` group**.

**Aggregator (verified today):** `prebuild-governance-complete.needs` = `[verify-signatures, commit-lint,
pr-title-lint, dco, sast]` — five entries, `sast` graduated to FASE 2 blocking on 2026-10-20. Removing the
title job leaves **four**. `sast` stays: it is a separate governance layer, unaffected by this change.

**`ci-complete`** needs only the substage aggregators plus `verify-signatures`, `zombie-workflow-guard`,
`repo-discovery`, and treats `cancelled` as **success** (exit 0) while the substage aggregators treat it as
failure — latent debt, recorded, not fixed here.

**Ruleset 21227644** binds four required contexts by `(name, integration_id=15368)`. The integration id
identifies the GitHub Actions app, **not** a workflow file, so a context emitted from a different workflow
resolves identically. That is what makes the split possible without touching the ruleset for the title.

**Guard rails:** `zombie-workflow-guard` fails the build if `pr-validation.yml`, `lint.yml`,
`formatter.yml` or `quality.yml` reappear. `vitest.scripts.config.js` already collects
`scripts/ci/*.test.mjs`, so new tests need no config change. `.nvmrc` pins Node 22.23.1.

## Goals / Non-Goals

**Goals:**

- Metadata revalidation runs on title/body edits on the **same head SHA**, so a corrected title or
  description turns the check green without a push.
- Zero coupling between metadata runs and the code pipeline: no shared concurrency group, no shared `on:`,
  no new `if:` guards on the ~40 pipeline jobs.
- One emitter per required context at every commit, so the ruleset never sees a duplicate context or an
  `Expected — Waiting` window.
- Body policy is enforced with a **hard** gate from day one (required check), with machine-readable
  evidence retained for triage.
- The ruleset gains exactly one context (`Governance: PR Body Lint`); title binding is unaffected.

**Non-Goals:**

- Moving `verify-signatures`, `commit-lint` or `dco`. Their verdict is a function of the commit graph
  (SHA), not of editable metadata.
- Re-calibrating the body policy. The user decided to skip the advisory window; mitigations are listed in
  D8.
- Fixing the pre-existing `ci-complete` `cancelled → exit 0` semantics (separate change).
- Extending the body policy to commit-message or diff checks (that is `sast`/`commit-lint` territory).
- Commenting on the PR. Fork and bot tokens are read-only; annotations, job summary and artifacts only.

## Decisions

### D1 — Separate workflow instead of `edited` in `ci.yml`

**Decision:** metadata checks move to `.github/workflows/pr-metadata.yml` with its own triggers and
concurrency.

**Rationale:** the requirement is "cheap revalidation must not cancel or re-run the expensive pipeline".
That is expressible only at workflow level, because `on:` and `concurrency` are workflow-scoped. A split
also keeps the `edited` event from leaking into 40 job conditions.

**Rejected:** `types: [edited]` in `ci.yml` plus `&& github.event.action != 'edited'` merged into ~40
existing `if:` expressions and into four aggregator `always()` guards. It is technically viable but it is a
permanent obligation on every future job, enforced by convention instead of by structure.
**Rejected:** the middle variant `group: pr-<n>-${{ github.event.action }}`, which avoids cancellation but
still executes the heavy pipeline on every metadata edit.

### D2 — Only title and body need `edited`

**Decision:** `pr-metadata.yml` hosts exactly two jobs.

**Rationale:** a check needs `edited` only if the user can fix it **without moving the SHA**.

| Check                                | What turns it green             | Moves SHA | Needs `edited` |
| ------------------------------------ | ------------------------------- | :-------: | :------------: |
| `Verify Commit Signatures`           | a signed commit / rewrite       |    yes    |       no       |
| `Commit Lint (Conventional Commits)` | `commit --amend` of the message |    yes    |       no       |
| `DCO`                                | `commit --amend -s`             |    yes    |       no       |
| `PR Title Lint`                      | `gh pr edit --title`            |  **no**   |    **yes**     |
| `Governance: PR Body Lint`           | `gh pr edit --body-file`        |  **no**   |    **yes**     |

**Rejected:** moving `dco`/`commit-lint` "for symmetry". They would gain nothing and would duplicate
`merge_group` logic that belongs to the merge queue.

### D3 — Atomic migration and the single-emitter invariant

**Decision:** `PR Title Lint` must be emitted by exactly one workflow at every commit. The commit that
adds the job to `pr-metadata.yml` also deletes it from `ci.yml` and removes it from
`prebuild-governance-complete.needs`.

**Rationale:** two emitters produce two check runs with the same context on the same SHA, and GitHub resolves
the context to the **newest check run by creation order** (not by completion time). An interleaving of
`synchronize` and `edited` therefore yields flapping verdicts, and a rule written "whichever finishes last
wins" would be wrong. A missing emitter produces `Expected — Waiting for status to be reported`, which does
not hint at its cause.

The atomic commit closes the window inside this repository's history. One cross-PR window remains and is
accepted: a pull request with an in-flight `ci.yml` run created _before_ the migration merged still holds the
old workflow definition and emits `PR Title Lint`; if that same head SHA then receives an `edited` event, the
metadata workflow emits a second context. Resolution by creation order keeps the verdict correct (the
metadata run is the newer of the two), and the window closes as soon as the stale run is superseded.

**Rejected:** two PRs (add, then remove). The intermediate state is exactly the duplicate-context window.

### D4 — `cancel-in-progress: false`

**Decision:** the new workflow serialises runs; it never cancels an in-flight one. Group is guarded for
`merge_group`, whose payload has no `pull_request.number`.

**Rationale:** GitHub allows one in-progress and one pending run per group. With the flag false a new run
waits rather than killing the running one, and a _third_ event cancels the earlier **pending** run — which is
harmless, because a run that never started never reported a conclusion. A cancelled **in-progress** run does
report `cancelled`, which a required check treats as blocking, on a commit whose metadata the author has
already fixed. Jobs of roughly six seconds make serialisation free.

The group is namespaced `pr-metadata-<n>`; the prefix, not the flag, is what prevents collision with
`ci.yml`'s `pr-<n>` group.

**Rejected:** `cancel-in-progress: true` (the `ci.yml` setting). Correct for a 45-job pipeline, wrong for a
required check that must always end in a definitive verdict.

### D5 — `merge_group` parity is mandatory for both jobs

**Decision:** the new workflow declares `merge_group: {}`. Neither job carries a job-level `if:` that excludes
`merge_group`; the body job's only job-level exclusion is bot authors. Both jobs contain a reachable no-op
echo step guarded by `if: github.event_name == 'merge_group'`, and the body job's validation steps (checkout,
`github-script`) are themselves guarded by `if: github.event_name == 'pull_request'`.

**Rationale:** a job-level `if: github.event_name == 'pull_request'` reports `skipped` (which counts as
passing for required checks), but a workflow with no `merge_group` trigger reports **nothing**, and a required
context that is never reported stalls the queue entry until it is evicted. Gating the _steps_ rather than the
_job_ keeps the no-op reachable: a step inside a job whose job-level `if` is false never runs, so the earlier
draft of this section described code that could not exist.

**Rejected:** leaving the job-level `if` to exclude `merge_group` and relying on `skipped`. It works today,
but it makes the documented no-op unreachable and therefore untestable, and it would degrade to a stall if
the check were ever evaluated with different semantics.

### D6 — Bot exemption by author, never by actor

**Decision:** the body job's job-level `if:` is
`github.event_name == 'merge_group' || github.event.pull_request.user.type != 'Bot'`, and the script also
treats a login matching `\[bot\]$` as a bot. The title job keeps its existing
`ignoreLabels: [bot, ignore-semantic-pull-request]` untouched.

**Rationale:** `github.actor` is the _triggerer_. A maintainer editing a Dependabot PR yields
`actor=maintainer`, so an actor predicate fails precisely in the scenario this workflow exists for. The
author is stable across events. Dependabot and changesets bodies contain release notes, never `## Summary`
or `Closes #`, so without the author-based skip every bot PR would sit permanently red.

This is the one place where the design relies on `skipped` counting as passing, and D5 rejected that
mechanism for `merge_group`. The difference is deliberate: the bot exemption is a documented policy exception
whose behaviour is verified **after** the context becomes required (task 4.4, on a real bot PR); the
`merge_group` path has no such verification opportunity because the queue is not enabled in this repository.

For the title, `openspec/specs/ci-pr-metadata-governance/spec.md` states that bots are **not** exempt from
title lint, and Dependabot titles in this repo already pass (`fix: bump <pkg> from x to y` — `dependabot.yml`
sets a prefix without `include: scope`). Changing that is a governance decision with its own delta spec.

**Rejected:** `github.actor == 'dependabot[bot]'` (unstable identity, wrong layer).

### D7 — Ruleset goes from four to five required checks, in a fixed order

**Decision:** `Governance: PR Body Lint` is added to ruleset 21227644 **after** the workflow has reported
at least one run.

**Rationale:** GitHub only allows selecting a check that has reported at least once. Attaching the context
before the emitter exists produces a repo-wide `Expected — Waiting`. The update uses `GET` → modify → `PUT`
(`PATCH` replaces the whole `required_status_checks` array and would drop the other four).

The context name becomes a frozen contract: renaming the job without the ruleset leaves every PR blocked
forever with a message that never mentions the rename.

**Rejected:** attaching the context first "so we don't forget". It is exactly the failure mode D7 exists to
prevent; the ordering is encoded as a task gate instead.

### D8 — Calibration is skipped by explicit decision; mitigations replace it

**Decision:** the body job is blocking from its first commit. No advisory window.

**Rationale:** the user chose FASE 3 now to avoid the graduation being forgotten. The trade-off is accepted
knowingly: uncalibrated rules will block some real PRs on day one, including `gh pr create --fill` bodies
and untouched templates (which normalise to zero meaningful characters).

The policy is nevertheless calibrated against the repository's own template, which is why R2 is per-section
rather than a single scalar floor. A scalar "20 meaningful characters per core section" would fail
`Related Issue` filled as the template instructs (`Closes #123` → 11 chars) and three of the five test
checkboxes (`Integration tests` 17, `Manual testing` 14, `Unit tests (vitest)` 19) — blocking correct work,
which is the opposite of the gate's purpose. R2a keeps the 20-character floor for `Summary`; R2b accepts an
issue reference; R2c accepts a checked box.

**Mitigations:** a 14-day artifact with the full verdict for triage, a job summary table explaining each
rule, R4/R5 as warnings that never fail the job, a lockstep test that prevents accidental template drift
from becoming a repo-wide outage, and an offline calibration run over the last ~100 historical pull request
bodies before the ruleset step (task 1.8) that reports the would-fail count in the change PR.

**Rejected:** advisory-then-blocking. Correct in general, rejected here by explicit user decision.

### D9 — No label bypass; the only human override is the ruleset bypass actor

**Decision:** `skip-pr-body-lint` is explicitly not implemented, and no label is honored by the policy.

**Rationale:** a label can be applied by anyone with write access and leaves no durable record beyond the
timeline event; it is the same self-service hole as `ignoreLabels`, moved to a different key. The ruleset
already has a bypass actor (`RepositoryRole id 5`, mode `pull_request`), which cannot be used by a direct
unsigned push and is visible in the merge audit.

**Rejected:** label-based escape hatch. Users who need it can fix the description; the cost is one edit.

### D9b — The policy module is read from the base ref, not from the PR

**Decision:** the body job reads `scripts/ci/pr-body-lint.mjs` from `github.event.pull_request.base.sha`,
not from the pull request's own tree. The file is added to `.github/CODEOWNERS` under `devops-team`.

**Rationale:** a required check that executes code shipped by the pull request it judges is self-modifying:
the PR can rewrite the policy and turn its own verdict green. That is D9's label hole with a smaller diff,
and the no-label requirement does not close it because no label is involved. Reading from the base ref means
a policy change is evaluated with the policy already trusted on the base branch; the consequence, named
explicitly, is that a PR which renames a template heading **and** updates the policy may be red until it
merges, and the ruleset bypass actor is the documented escape for that one class.

Keeping the module under the same CODEOWNERS team as `.github/**` restores the review requirement that the
move out of `ci.yml` would otherwise silently drop. The guarantee is scoped: a PR **cannot rewrite the
module** and change its own verdict, but it **can** edit the workflow to stop calling it — that is a
reviewable diff which CODEOWNERS now routes to `devops-team`, not an impossibility.

Because the module is read from `base.sha`, renaming its path cannot be done in one PR: the new workflow
would point at a path the base ref does not have. Path changes are therefore a two-PR sequence (add the new
module, then repoint the workflow), recorded here so the failure is predictable.

**Rejected:** checking out the PR merge ref and `require()`-ing the module from it (the self-modification
hole). **Rejected:** deriving the policy from the template at runtime (self-modifying by design, D11).

### D10 — The residual edit race is accepted

**Decision:** no attempt is made to invalidate a green check when the body is edited afterwards.

**Rationale:** the check is keyed to the head SHA, and metadata edits do not move it. `edited` narrows the
window from "until the next push" to "until the re-run finishes", but a merge can still land in the seconds
between the edit and the new verdict. GitHub offers no atomic "invalidate on metadata change" primitive.
`cancel-in-progress: false` plus six-second jobs keep the window small.

**Residual risk:** accepted and documented, not silently ignored.

### D11 — Template lockstep is load-bearing

**Decision:** the policy lives in code but its headings are derived from a canonicalizer, and a test asserts
that every required heading exists in `.github/PULL_REQUEST_TEMPLATE.md`. A template heading rename and the
policy update must land in the same PR.

**Rationale:** with the body check required, a renamed heading blocks every PR in the repository. The test
converts a production outage into a red CI job.

**Rejected:** deriving the policy dynamically from the template at runtime. It would make the gate
self-modifying: anyone editing the template would silently change what is enforced.

### D12 — Security invariant: no interpolation, only `context.payload`

**Decision:** the body and title are read from `context.payload` inside `github-script`. No `${{ }}`
expression carrying PR text may appear in `run:` **or** `script:`.

**Rationale:** in `run:`, the value becomes shell source (quoting breakouts, `$(...)`, heredoc escapes, and
`::` workflow commands that can forge or silence annotations). In `script:`, the action documents that
expressions are evaluated **as JavaScript**, so a body containing a backtick and `${process.env.GITHUB_TOKEN}`
breaks out of the template literal and exfiltrates the token. The body is never printed.

**Rejected:** `env:` indirection with `"$BODY"`. Acceptable in principle, but it still puts attacker text in
the environment and in the log (where `::` is interpreted) for no benefit over `context.payload`.

### D13 — Body size limit

**Decision:** assume a maximum of 65,536 characters.

**Rationale:** the REST API rejects larger bodies with HTTP 422 (`body is too long`). The often-cited 8 MB
is the webhook payload limit and does not apply to the description.

### D14 — Extracted module with a thin `github-script` wrapper

**Decision:** pure logic in `scripts/ci/pr-body-lint.mjs` (`normalize`, `splitSections`, `evaluate`), tests
in `scripts/ci/pr-body-lint.test.mjs`, wrapper in YAML.

**Rationale:** inline YAML JavaScript is untestable and `actionlint` cannot see its bugs — a wrong regex
would fail the gate silently for everyone. Extracting follows the `scripts/sast-diff.mjs` precedent
(one shared script, two consumers) and lets the lockstep test run in the ordinary suite.

**Risk:** `require('./scripts/ci/pr-body-lint.mjs')` under the action's runtime depends on `require(esm)`
(Node 22.23.1 supports it without top-level await). The module **must not** contain top-level await
(`ERR_REQUIRE_ASYNC_MODULE`); fallback is `await import(pathToFileURL(path.resolve(process.cwd(),
'scripts/ci/pr-body-lint.mjs')))`. `process.getBuiltinModule` avoids the action's `require` proxy for
`fs`/`path`.

### D15 — Runtime and observability budget

**Decision:** one run per metadata edit, two jobs, `timeout-minutes: 5` each, at most one pending run.

**Rationale:** ~6 s per job with no `npm install`. The cost is negligible; the visibility gain (a run per
edit in the Actions history) is the point of the change.

### D16 — `ruleset-expansion` and `commit-signing-enforcement` need no delta

**Decision:** no spec delta for those capabilities.

**Rationale:** both cite the _context name_ (`PR Title Lint`), which does not change, and neither asserts
which workflow file emits it. Stating this explicitly prevents a future reader from assuming a missing sync.

## Reference implementation

```yaml
# .github/workflows/pr-metadata.yml
name: 'PR Metadata'

permissions:
  contents: read

on:
  pull_request:
    branches: [main]
    types: [opened, edited, synchronize, reopened]
  merge_group: {}

# cancel-in-progress: false — a cancelled run is not success for a required check.
# Guard: merge_group payload has no pull_request.number.
concurrency:
  group: ${{ format('pr-metadata-{0}', github.event_name == 'merge_group' && github.event.merge_group.head_ref || github.event.pull_request.number) }}
  cancel-in-progress: false

jobs:
  pr-title-lint:
    name: PR Title Lint # frozen contract — ruleset 21227644
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      pull-requests: read
    steps:
      - name: Lint PR title
        if: github.event_name == 'pull_request'
        uses: amannn/action-semantic-pull-request@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
            ops
          requireScope: false
          ignoreLabels: |
            bot
            ignore-semantic-pull-request
          subjectPattern: '^(?![A-Z]).+$'
          subjectPatternError: 'PR title must follow Conventional Commits format: type(scope): description with lowercase subject'
      - name: Skip on merge_group (covered by commitlint)
        if: github.event_name == 'merge_group'
        run: echo "✅ Merge queue — squash commit title validated by commitlint"

  pr-body-lint:
    name: 'Governance: PR Body Lint' # frozen contract — ruleset 21227644
    runs-on: ubuntu-latest
    timeout-minutes: 5
    # Job-level `if` only excludes bot AUTHORS (stable), never github.actor (triggerer),
    # and never merge_group: the no-op step below must stay reachable.
    # A skipped job reports `skipped`, which counts as passing for required checks.
    if: >-
      github.event_name == 'merge_group' ||
      github.event.pull_request.user.type != 'Bot'
    permissions:
      contents: read
      pull-requests: read
    steps:
      # Policy is read from the BASE ref: a PR must not be able to rewrite the gate that judges it (D9b).
      - name: Fetch policy module from base ref
        if: github.event_name == 'pull_request'
        uses: actions/checkout@v5
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          sparse-checkout: scripts/ci
          sparse-checkout-cone-mode: false
      - name: Validate PR body against governance policy
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v9
        with:
          script: |
            const { evaluate } = require('./scripts/ci/pr-body-lint.mjs');
            await evaluate({ core, context });
      - name: Upload PR body report (14-day triage evidence)
        # `always()` is load-bearing: without it the implicit success() skips the upload
        # on exactly the failing runs the artifact exists for.
        if: always() && github.event_name == 'pull_request'
        uses: actions/upload-artifact@v7
        with:
          name: pr-body-lint-report
          path: .tmp/pr-body-lint/report.json
          retention-days: 14
          if-no-files-found: warn
          include-hidden-files: true
      - name: Skip on merge_group
        if: github.event_name == 'merge_group'
        run: echo "✅ Merge queue — a merge-queue entry has no pull request body to validate"
```

**Script contract** (`scripts/ci/pr-body-lint.mjs`):

| Export                           | Responsibility                                                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `normalize(text)`                | strip HTML comments → drop unchecked task lines → drop heading lines → drop `Closes #` without digits (regex `/Closes\s*#(?!\s*\d)/g`) → unwrap `[x]` → collapse whitespace                                                               |
| `splitSections(body)`            | map canonicalized `##` heading → **raw** section body (ATX only; no setext). Split happens on the raw body, before normalization: headings are structure, and step 3 would erase them                                                     |
| `evaluateBody({ body, author })` | **pure** seam: applies R1-R5 to a body string and returns `{metrics, failures, warnings, verdict}`; no `core`, no filesystem, no clock. This is what the tests and the offline corpus run (task 1.8) call                                 |
| `evaluate({ core, context })`    | thin wrapper: reads `context.payload.pull_request`, calls `evaluateBody`, writes the report, publishes the summary, `core.setFailed` on an error-level failure; any thrown error is reported as a tooling failure, not a policy violation |

**Normalization scope (normative):** the body is split on raw headings first, then each section's content is
normalized. Two exceptions are named because the pipeline would otherwise destroy their input: R3 reads the
**comment-stripped** body (step 4 removes exactly the placeholder R3 detects), and checkbox presence is a
**count carried out of normalization** (`metrics.checkedCheckboxes`) because step 5 unwraps the markers.

`report.json` schema v1: `schemaVersion`, `generatedAt`, `pr{number,author,draft,headSha,baseSha}`,
`policy`, `metrics{bodyChars,meaningfulChars,checkedCheckboxes,sectionsFound}`, `failures`, `warnings`,
`verdict`.

## Risks / Trade-offs

| Risk                                                                                                                          | Mitigation                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Premise:** a re-run triggered by `edited` re-reports the same context on the _same_ head SHA (never exercised in this repo) | Canary task 2.6 measures exactly this: same SHA, new run, artifact. It resolves re-run semantics only; _required_ satisfaction is proven later by 6.5, whose rollback is 4.5. If 2.6 fails, abort the change |
| Required check with uncalibrated policy blocks legitimate PRs (`--fill`, empty body, untouched template)                      | Accepted by decision (D8); per-section R2 calibrated against the template; offline corpus run (task 1.8); triage via artifact + summary; R4/R5 as warnings                                                   |
| Template heading rename blocks every PR                                                                                       | Lockstep test + same-PR rule (D11)                                                                                                                                                                           |
| Bot exemption is a bypass                                                                                                     | Author-based only (not actor), documented as an explicit exception; verified against the required context in task 4.4                                                                                        |
| A PR rewrites the gate that judges it                                                                                         | Policy module read from `base.sha` (D9b) + CODEOWNERS entry                                                                                                                                                  |
| Canary red for the wrong reason (`MODULE_NOT_FOUND`) because the module is not on `main` yet                                  | Migration step 1b publishes the module alone before the canary; task 2.6 requires a **named rule violation** in the report, not just a red check                                                             |
| Renaming the module path breaks in one PR (base ref lacks the new path)                                                       | Two-PR sequence documented in D9b                                                                                                                                                                            |
| Edit race (green → edit → merge)                                                                                              | Accepted (D10); `cancel-in-progress: false` + short jobs                                                                                                                                                     |
| Duplicate context during migration                                                                                            | Single-emitter invariant, one atomic commit (D3)                                                                                                                                                             |
| Ruleset `PUT` clobbers the other four contexts                                                                                | `GET` → modify → `PUT`, verify five contexts and six rules afterwards (D7)                                                                                                                                   |
| `require(esm)` unsupported by the action runtime                                                                              | `await import(pathToFileURL(...))` fallback; no top-level await in the module (D14)                                                                                                                          |
| Workflow YAML error blocks its own migration PR                                                                               | `actionlint` runs on any `.github/workflows/**` change; ruleset bypass actor is the last resort                                                                                                              |
| File named `pr-validation.yml`                                                                                                | `zombie-workflow-guard` fails; the file is `pr-metadata.yml`                                                                                                                                                 |

## Migration Plan

1. **Script + tests** — `scripts/ci/pr-body-lint.mjs`, `.test.mjs` (including the template lockstep test).
   No workflow change yet. Rollback: revert the commit; nothing executes.
   1b. **Publish the module to `main` alone** — a standalone PR that adds `scripts/ci/pr-body-lint.mjs` and its
   tests. Nothing references the module yet, so nothing executes against it. This step exists because the
   workflow reads the module from the PR's **base ref**: a canary whose base does not contain the module fails
   with a tooling error (`MODULE_NOT_FOUND`), which would look like a policy failure and trip task 2.6's hard
   stop for the wrong reason. Rollback: revert; still nothing executes.
2. **Canary** — `pr-metadata.yml` with the body job only, blocking. Precondition: `main` already contains the
   module (step 1b). The canary PR is opened **against `main`** from a throwaway branch cut off the change
   branch (a PR whose base is the change branch would not trigger the workflow at all, since the trigger is
   `branches: [main]`). Verify: open with an empty body → red **for a policy reason, not a tooling reason**;
   edit to a compliant body → green on the **same head SHA** with no push; artifact downloadable on the
   failing run. **Hard stop** if any of those fails.
3. **Atomic title migration** — same commit: add `PR Title Lint` to `pr-metadata.yml`, delete the job from
   `ci.yml`, drop it from `prebuild-governance-complete.needs` (five entries → four), update the SUBSTAGE 2A
   header comment. Rollback: revert restores the job in `ci.yml` and the five-entry aggregator; no ruleset
   change is involved, so nothing is left half-bound.
4. **Ruleset FASE 3** — with at least one reported run of `Governance: PR Body Lint`: `GET` ruleset →
   add the context → `PUT` → verify five required contexts, six rules and the bypass actor are intact.
   Before the `PUT`, enumerate open PRs and confirm each head SHA already has a body-lint run (nudge a no-op
   body edit if not) — the workflow has no `workflow_dispatch`, so a head SHA that has never been evaluated
   would sit in `Expected` until some event fires. After the `PUT`, confirm a **bot-authored** PR merges with
   the context reported `skipped`.
   Rollback: repeat `GET`/`PUT` without the new context (the workflow keeps reporting; it simply stops
   being required).
5. **Docs** — update `05e`, `CONTEXT-CICD.md` §1/§3.2/§3.3/§3.3.1/§3.4/§3.5/§9.3.3/§9.3.4/§13.5/§6, the §4
   mermaid diagram, the walkthrough and governance guides, `quality-gates.md` §2, and the stale comment in
   `scripts/hooks/pr-title-check.js`.

## Open Questions

None blocking. The only unknown (same-SHA re-run semantics) is resolved empirically by the canary gate in
step 2 before any required context changes hands.
