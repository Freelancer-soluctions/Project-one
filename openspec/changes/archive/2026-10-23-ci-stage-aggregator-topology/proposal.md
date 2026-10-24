# Proposal

## Why

The prebuild substages of `.github/workflows/ci.yml` each have a verdict aggregator, but STAGE 3 BUILD
and STAGE 4 POST-BUILD do not. `client-build` and `server-build` gate on 6 individual quality jobs and on
**zero** `prebuild-*-complete` aggregators, so build is structurally free to run — or to read as green —
while governance, quality, security or unit testing is red. The five post-build jobs (`e2e`,
`client-sonarqube`, `server-sonarqube`, `client-depcheck`, `server-depcheck`) sit in no aggregator and in
no `ci-complete.needs`, so a red e2e/SonarQube/depcheck leaves `CI Complete` green.

Two further defects compound this. First, the post-build jobs cover two different taxonomies — testing and
static analysis — and a single aggregator would collapse a red `e2e` and a red `depcheck` into one
indistinguishable `failure`, so the Checks list could not tell "post-build tests failed" from "post-build
analysis failed". Second, `prebuild-tests-complete.needs` lists `test-integration` and `test-smoke`,
which are physically defined in STAGE 4 POST-BUILD: a _prebuild_ verdict containing two _post-build_ jobs,
while a genuine tier-1 test (`property-tests`) is absent from it.

The DAG is therefore missing its middle rungs, and the rung it must gain is two-branched, not one.

## What Changes

- **`client-build` / `server-build` `needs` rewritten** (R1): the 6-job lists are **replaced** by the 4 prebuild
  aggregators `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete,
prebuild-tests-complete]`, and each job carries an explicit success predicate over those 4
  `result`s. The literals `if: false` stay in place, so the jobs remain disabled; the topology is what
  changes.
- **New job `build-complete`** (R2): `name: Build Complete`, `needs: [client-build, server-build]`, `always()`.
- **New job `postbuild-tests-complete`** (R3a): `name: Postbuild Tests Complete`,
  `needs: [build-complete, test-integration, test-smoke, e2e]`, `always()`.
- **New job `postbuild-analysis-complete`** (R3b): `name: Postbuild Analysis Complete`,
  `needs: [build-complete, client-sonarqube, server-sonarqube, client-depcheck, server-depcheck]`, `always()`.
- **`prebuild-tests-complete.needs` corrected** (R4): `test-integration` and `test-smoke` are removed, and
  `property-tests` is added, leaving exactly `[test-unit-client, test-unit-server, client-coverage,
server-coverage, property-tests]`. `property-tests` is `continue-on-error: true`, so its inclusion is
  **record-only**: it closes a taxonomy gap (a tier-1 test missing from the tier-1 verdict) without making
  that job blocking, and its `continue-on-error` is not removed.
- **`ci-complete.needs` extended** (R5): `build-complete`, `postbuild-tests-complete` and
  `postbuild-analysis-complete` are added, for 9 entries total.
- **`prebuild-unit-tests-complete` renamed `prebuild-tests-complete`** (R7/D9): the job id and its display context
  (`Prebuild Tests Complete`) change together, in one atomic commit with the `ci-complete.needs` entry that consumes
  the id — a stale `needs` reference invalidates the whole workflow file. The aggregator no longer holds only unit
  tests (it carries the whole tier-1 surface, including `property-tests` and both coverage jobs), and the new name
  restores symmetry with `postbuild-tests-complete`.
- **Aggregator verdict semantics for the three new jobs** (R6): `failure → exit 1`, `cancelled → exit 1`,
  `skipped → exit 0`. The skipped tolerance is mandatory, not a convenience: every member of the stage
  aggregators is `if: false` today, so a success requirement would fail every PR immediately.
- **Documentation sync** (D1-D5b): `docs/CONTEXT-CICD.md` §3.3 job table, §3.3.1 naming convention, §9.3.7
  `ci-complete`, §3.2/§5.1 ruleset reality, removal of the phantom `actionlint` row, and the `ci.yml:458`
  SUBSTAGE 2D header comment that falsely claims `test-integration`/`test-smoke` as prebuild members.

## Capabilities

### New Capabilities

None. This change introduces no new capability: it corrects the aggregator topology owned by an existing
capability, and the documentation edits are recorded as tasks rather than as requirements, because the
affected document is a context file rather than a behavioural spec.

### Modified Capabilities

- `ci-prebuild-substage-structure`: `prebuild-tests-complete` loses `test-integration` and `test-smoke` and
  gains `property-tests`; `ci-complete` gains the three stage aggregators; and the capability gains the
  build/post-build aggregator requirements (stage-verdict dependency, `build-complete`,
  `postbuild-tests-complete`, `postbuild-analysis-complete`, verdict semantics, and naming for stage
  aggregators). The capability path is reused rather than duplicated: it already owns
  `ci-complete depends on aggregators`, so a near-duplicate `ci-stage-aggregator-topology` capability would
  split one topology across two specs.

## Impact

- `.github/workflows/ci.yml` — **4 `needs` arrays edited** (both build jobs replaced, plus `prebuild-tests-complete` and
  `ci-complete`), **1 job id + `name:` renamed** (`prebuild-unit-tests-complete` → `prebuild-tests-complete`,
  `Prebuild Unit Tests Complete` → `Prebuild Tests Complete`), **3 jobs added** (`build-complete`,
  `postbuild-tests-complete`, `postbuild-analysis-complete`), and **2 header comments corrected** (the `ci.yml:458`
  `SUBSTAGE 2D: UNIT TESTING` banner, which still lists integration and smoke, and the `ci.yml:2569` `AGGREGATOR — CI
Complete — Single required check aggregator` banner, which calls `ci-complete` a required check when the ruleset
  enforces exactly two contexts and neither is `ci-complete`). The rename additionally rewrites the comment at
  `ci.yml:1046` that names the aggregator. No trigger, `concurrency`, permission or secret is touched.
- `docs/CONTEXT-CICD.md` — five sections corrected (§3.2, §3.3, §3.3.1, §5.1, §9.3.7).
- No change to the ruleset 21227644 (no `gh api PUT`), to `pr-metadata.yml`, to `opencode-review.yml`, to
  `deploy.yml`, or to the `sast` job.
- No `if: false` job is activated: `client-build`, `server-build`, `e2e`, `client-sonarqube`,
  `server-sonarqube`, `client-depcheck` and `server-depcheck` all stay disabled, so the observable runtime
  behaviour of every PR is unchanged. What changes is the topology a future activation will inherit.
