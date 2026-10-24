# Proposal — PR metadata workflow (`pr-metadata-workflow`)

## Why

Two problems share one root cause: PR metadata checks live inside `ci.yml`, a workflow whose every job is scoped to
`pull_request` — so it never re-evaluates when the PR _metadata_ changes, only when the _code_ does.

1. **Staleness.** `ci.yml` triggers on `opened`, `synchronize` and `reopened` only. A contributor who pushes a bad
   title (or an empty body) and then fixes the title/body gets no re-run: the check that reported red stays red until
   a new commit lands, so the PR appears blocked for a reason that is already fixed. A check whose verdict is bound
   to a SHA is the wrong shape for a verdict that depends on mutable, non-SHA metadata.

2. **The body is entirely ungoverned.** `.github/PULL_REQUEST_TEMPLATE.md` asks for `Summary`, `Related Issue` and
   `How Has This Been Tested?`, and states `Closes #<number>` is required for traceability — but nothing enforces
   any of it. Today `gh pr create --fill`, a PR with an empty body, or a PR with the template literally untouched
   all merge if the four ruleset checks pass. The traceability chain (issue → PR → squash commit) is therefore
   aspirational, not enforced.

**Why not just add `edited` to `ci.yml`?** Two independent reasons, both structural:

- ~40 jobs in `ci.yml` gate on conditions that evaluate **true** on `edited` (`github.event_name == 'pull_request'`
  matches `edited`; path filters and `repo-discovery` outputs are unaffected by a body edit; `if: false` jobs stay
  false but every active lint/typecheck/complexity/import-bounds/security job would re-run). A body typo fix would
  re-execute the whole pre-build stage: ~40 job starts for a text edit.
- `ci.yml` sets `concurrency: cancel-in-progress: true`. The `edited` run and the in-flight code run share the
  `pr-<number>` group, so an edit would **cancel the live run** — a metadata edit would be able to kill a test
  run mid-flight. Setting `cancel-in-progress: false` for the whole pipeline is not an option: it removes the
  protection that stops stale pushes from wasting runner time.

So the metadata checks need their own workflow, with their own trigger set and their own concurrency policy, so that
"metadata changed" re-evaluates the metadata checks and _only_ those, and never cancels a code run.

## What Changes

### New workflow `.github/workflows/pr-metadata.yml`

- Hosts **both** metadata jobs, created there — not moved into a pre-existing workflow:
  - `pr-title-lint` / `name: 'Governance: PR Title Lint'` — **moved from `ci.yml`** (job body byte-identical: same
    `amannn/action-semantic-pull-request@v6`, same types incl. `ops`, `requireScope: false`, same `subjectPattern`,
    same `ignoreLabels`). The `name:` migrated byte-identical as `PR Title Lint`, which was then a required context in
    ruleset 21227644 (`integration_id=15368`); it was renamed to `Governance: PR Title Lint` in the 2026-10-23 redesign
    that removed the four per-job contexts (see _Binding model_ in `design.md`).
  - `pr-body-lint` / `name: 'Governance: PR Body Lint'` — **new**, `Governance:`-prefixed because it is defined in a
    governance block.
- **Trigger:** `pull_request: types: [opened, edited, synchronize, reopened]` + `merge_group: {}`.
- **Concurrency:** guarded group (`github.event.pull_request.number || github.ref`, because `merge_group` has no
  `pull_request` object), `cancel-in-progress: false` — a new metadata event must not cancel the previous one and
  must not be cancelled by a code run.
- **Permissions:** workflow-level `contents: read`; title job `pull-requests: read`; body job `contents: read` +
  `pull-requests: read`. No `pull_request_target`, no `pull-requests: write`, no PR comments.
- **File name is load-bearing:** `pr-metadata.yml` — `zombie-workflow-guard` fails the build if `pr-validation.yml`,
  `lint.yml`, `formatter.yml` or `quality.yml` reappears.

### New blocking body policy (`pr-body-lint`, day 1, no calibration)

Rules R1–R5, with the two weak signals kept as non-failing warnings:

| Rule | What it checks                                                                                    | Severity |
| ---- | ------------------------------------------------------------------------------------------------- | -------- |
| R1   | meaningful content ≥ 40 characters after normalization                                            | **fail** |
| R2   | each core section (`Summary`, `Related Issue`, `How Has This Been Tested?`) ≥ 20 meaningful chars | **fail** |
| R3   | `Closes #` present without a number                                                               | **fail** |
| R4   | at least one checked checkbox                                                                     | warning  |
| R5   | issue reference `#\d+`                                                                            | warning  |

Normalization pipeline: strip HTML comments → drop unchecked task lines → drop heading lines → drop `Closes #`
without digits → unwrap `[x]` → collapse whitespace. The R3 regex is evaluated on the **comment-stripped** body, not
the raw body, because the template's own guidance comment mentions `Closes #` and would otherwise self-fail every
PR.

### Atomic title migration (single commit, no intermediate state)

The same commit that adds `pr-metadata.yml` removes the `pr-title-lint` job from `ci.yml` **and** drops it from
`prebuild-governance-complete.needs` (5 → 4: `verify-signatures`, `commit-lint`, `dco`, `sast`; `sast` joined on
2026-10-20 at its FASE 2 graduation and is unrelated to this move). Reason: a required check
must be emitted by exactly one workflow. Two emitters of `PR Title Lint` produce two contexts with the same name, and
GitHub binds the required context to whichever reports first — a green check from one workflow can satisfy a ruleset
while the other workflow is still red. The migration is therefore atomic or not at all.

### `merge_group` parity for both jobs (mandatory)

A required check that reports nothing on `merge_group` blocks the merge-queue entry forever. So **both** jobs are
defined on `merge_group` and no-op with an explicit `echo` step under `if: github.event_name == 'merge_group'`; the
body job's validation steps are gated on `pull_request` instead, precisely so the no-op stays reachable. No job-level
`if` evaluates false on `merge_group` (the body job's only job-level exclusion is bot authors). The title job's no-op
keeps its existing rationale (the squash commit title is validated by `commitlint --last`); the body job's no-op is
required for the same mechanical reason — the PR body does not exist in the merge-queue context.

### Body policy calibrated against the template, not a scalar floor

R2 is per section: `Summary` needs ≥20 meaningful characters, `Related Issue` accepts an issue reference
(`Closes #123` normalizes to 11 chars), and `How Has This Been Tested?` accepts a single checked box. A scalar
20-character floor would fail every PR that fills the template exactly as instructed — blocking correct work.

### Ruleset 21227644: 4 → 5 required checks

`Governance: PR Body Lint` is added as a required status check, **blocking from day 1** — calibration is explicitly
skipped by user decision. The sequence is constrained:

1. Land the workflow. Let `Governance: PR Body Lint` report at least once on a real PR.
2. Only then attach it to the ruleset via GET → modify → PUT (never PATCH — PATCH on this endpoint replaces the
   `rules` array wholesale and silently drops rules).

Attaching before the workflow has ever reported produces `Expected — Waiting for status to be reported` on every PR
in the repository.

**Revised 2026-10-23:** the ruleset now binds two contexts — `Governance: PR Body Lint`, still directly, and
`Prebuild Governance Complete`, the aggregator that carries `verify-signatures`, `commit-lint` and `dco`. The four
per-job contexts this section replaced are gone.

### `ruleset-expansion` and `commit-signing-enforcement`: no delta

When this change was written both specs cited the four context names and `integration_id=15368`, and those strings did
not change — so neither needed a delta. That premise no longer holds: those two main specs still enumerate the four old
per-job contexts, drift introduced by the 2026-10-23 governance redesign (aggregator plus `Governance:` prefixing), not
by this change. It is recorded as follow-up debt outside this change's scope rather than patched here, because a delta
written here would claim ownership of a contract another change now owns.

## Capabilities

### New Capabilities

- `pr-metadata-workflow`: the workflow's own contract — trigger set (4 PR types + `merge_group`), concurrency
  policy and `cancel-in-progress` value, permission set, the two job names, the single-emitter invariant for
  `PR Title Lint`, `merge_group` no-op parity for both jobs, and the prohibition on `pull_request_target`.
- `pr-body-lint-governance`: the body policy — R1–R5 with severities, the normalization pipeline, section
  splitting/canonicalization, the author-based bot skip, the blocking verdict (`core.setFailed`), the report schema
  and artifact, the lockstep requirement with `.github/PULL_REQUEST_TEMPLATE.md`, the required-check contract name
  `Governance: PR Body Lint`, and the explicit rejection of a label bypass.

### Modified Capabilities

- `ci-pr-metadata-governance`: job location `ci.yml` → `pr-metadata.yml`; the trigger scenario gains `edited`; the
  "bots are NOT exempt from title lint" scenario is preserved verbatim; title action config values are unchanged
  (types incl. `ops`, `requireScope: false`, `subjectPattern`, `ignoreLabels`).
- `ci-prebuild-substage-structure`: `prebuild-governance-complete` depends on exactly
  `[verify-signatures, commit-lint, dco, sast]` (four; `sast` joined at its FASE 2 graduation on 2026-10-20 and is
  unrelated to this move); `pr-title-lint` and `pr-body-lint` SHALL NOT appear in that `needs` (a cross-workflow
  `needs` is not resolvable by GitHub Actions).
- `local-pr-title-check`: the local wrapper's "mirrors `ci.yml` `pr-title-lint`" preamble becomes "mirrors
  `.github/workflows/pr-metadata.yml` job `PR Title Lint`". The stale comment at
  `scripts/hooks/pr-title-check.js` L6 is fixed in the same change (task 5.5).

## Impact

**Workflows**

- `.github/workflows/pr-metadata.yml` — new.
- `.github/workflows/ci.yml` — `pr-title-lint` job removed; `prebuild-governance-complete.needs` 5 → 4; substage 2A
  header comment updated.

**Ruleset (admin action, ordered)**

- Ruleset 21227644 gained `Governance: PR Body Lint` as a 5th required check on 2026-10-22, only after at least one
  real report; the 2026-10-23 redesign left it bound directly alongside the `Prebuild Governance Complete` aggregator.

**Scripts / tests**

- `scripts/ci/pr-body-lint.mjs` — pure `normalize`, `splitSections`, `evaluate` (no I/O, no `@actions/*` imports).
- `scripts/ci/pr-body-lint.test.mjs` — covered by the existing `npm run test:scripts`
  (`vitest.scripts.config.js` already globs `scripts/ci/*.test.mjs`).
- Thin `actions/github-script@v9` wrapper in the workflow (`require('./scripts/ci/pr-body-lint.mjs')`, with the
  `await import(pathToFileURL(...))` fallback documented for ESM resolution).

**Security invariant**

- Neither the PR body nor the PR title may be interpolated into `run:` or `script:` as an expression
  (`github.event.pull_request.body`, `github.event.pull_request.title`). Both are read from `context.payload` at
  runtime. Interpolation would splice untrusted PR text into a shell command or a script body — the classic Actions
  injection.

**Documented consequences (accepted, not hidden)**

- **Blockers from day 1.** A required check with an uncalibrated policy fails real PRs immediately:
  `gh pr create --fill` (body = commit message), an empty body, and an untouched template all fail. The untouched
  template normalizes to 0 meaningful characters, so R1 fails by construction.
- **Bot skip is a documented bypass.** The body job is skipped by **author**
  (`github.event.pull_request.user.type == 'Bot'`, plus a `[bot]` login guard inside the script), never by
  `github.actor`. Author is stable across edits; actor changes whenever a human edits a bot's PR. A job-level `if`
  false reports `skipped`, and GitHub counts `skipped` as passing for required checks — so Dependabot and changesets
  PRs (whose bodies carry no template) are not blocked. The title job keeps
  `ignoreLabels: [bot, ignore-semantic-pull-request]` unchanged: per `ci-pr-metadata-governance`, bots are NOT
  exempt from title lint.
- **Residual race.** Green → edit the body → merge before the re-run finishes. The head SHA does not change on a body
  edit, so a merge can land carrying the _previous_ body verdict. Mitigation is best-effort only
  (`cancel-in-progress: false` plus sub-minute jobs). Accepted risk, documented rather than papered over.
- **The check name becomes a frozen contract.** `Governance: PR Body Lint` is the required context. Renaming it
  without updating the ruleset in the same operation leaves every PR blocked with
  `Expected — Waiting for status to be reported`, an error that names nothing and suggests nothing.
- **Template drift becomes merge-blocking.** Renaming a heading in `.github/PULL_REQUEST_TEMPLATE.md` makes R2 fail
  for every PR. The lockstep test and the same-commit rule are therefore mandatory, not advisory.
- **No `skip-pr-body-lint` label.** Explicitly rejected: a label bypass is self-service for anyone with write
  access, which is exactly the hole this change closes. The only human bypass is the ruleset bypass actor
  (`RepositoryRole id 5`, `pull_request` mode), which is auditable.

**Developer friction**

- `gh pr create --fill` and empty bodies stop being viable. Contributors must write a body or fill the template.
  `npm run pr:create` already validates the title before creating the PR; body guidance lives in the template and
  in CONTRIBUTING.md.

**No behavior change in application code**

- Zero changes under `apps/client` or `apps/server`. The client/server test jobs are unaffected.

**Docs**

- `docs/CONTEXT-CICD.md` — required checks 4 → 5 (§3.2), workflow inventory for PR triggers 8 → 9 (§3.4/§3.5),
  aggregator `needs` 5 → 4 (§3.3), title job location (`ci.yml` → `pr-metadata.yml`, §9.3.3).
- `docs/learning/quality-gates.md` / `docs/learning/dco.md` cross-references if they name the title job's workflow.
