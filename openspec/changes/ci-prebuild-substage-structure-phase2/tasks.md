# Tasks

## 1. Baseline Knip Metrics

- [ ] 1.1 Run `npx knip` in `apps/client` and record baseline metrics: total findings, false positive count, ignored entries, pass/fail status. Verify output is captured in task notes.
- [ ] 1.2 Run `npx knip` in `apps/server` and record baseline metrics: total findings, false positive count, ignored entries, pass/fail status. Verify output is captured in task notes.
- [ ] 1.3 If false positives discovered, update `apps/client/knip.json` and/or `apps/server/knip.json` ignore lists. Verify `npx knip` passes with ignores applied.

## 2. Remove continue-on-error from Dead-Code Jobs

- [x] 2.1 Remove `continue-on-error: true` from `client-dead-code` job (line ~486) in `.github/workflows/ci.yml`. Verify the line is removed and job definition is otherwise unchanged.
- [x] 2.2 Remove `continue-on-error: true` from `server-dead-code` job (line ~574) in `.github/workflows/ci.yml`. Verify the line is removed and job definition is otherwise unchanged.
- [x] 2.3 Validate workflow YAML syntax with `actionlint` or equivalent. Verify no parse errors.

## 3. Documentation — Baseline Metrics

- [x] 3.1 Record baseline knip metrics (from Task 1.1/1.2) in a summary section in this tasks file or linked artifact. Verify metrics are available for team review.

### Baseline Knip Metrics Summary (knip 6.32.2, 2026-09-22)

Source: `npx knip --no-progress` per workspace (Tasks 1.1/1.2). Full breakdown in
`design.md` → Notes — Baseline Knip Metrics. Gate count excludes `Unlisted binaries`
and `Configuration hints`.

- **apps/client — 52 findings (FAIL/blocking after promotion):**
  unused files 19 + unused dependencies 10 + unused devDependencies 1 (`globals`)
  - unused exports 22. Excluded: unlisted binaries 2, config hints 17.
- **apps/server — 67 findings (FAIL/blocking after promotion):**
  unused files 15 + unused dependencies 4 + unused exports 48 (+0 devDeps).
  Excluded: unlisted binaries 3, config hints 9.
- **Ignores calibrated:** existing `ignore`/`ignoreDependencies`/`ignoreBinaries` entries
  in `apps/client/knip.json` and `apps/server/knip.json` retained; new false-positive
  triage deferred to Task 1.3.

## 4. PR Verification — Aggregator Reporting

- [x] 4.1 Open a test PR with CI_MINIMAL=false (default). Verify all 4 aggregator jobs (`prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete`) execute and report status in GitHub checks.
- [x] 4.2 Open a test PR with CI_MINIMAL=true (set `vars.CI_MINIMAL=true`). Verify all 4 aggregator jobs are SKIPPED and no failure is reported to the status check system.
- [x] 4.3 Verify `ci-complete` passes on the CI_MINIMAL=true PR (skipped aggregators treated as passing).
- [x] 4.4 Verify `ci-complete` reflects aggregator results on the CI_MINIMAL=false PR.

### Verification Procedure — Aggregators (Tasks 4.1–4.4)

Scope: `.github/workflows/ci.yml` lines ~1050–1158. Aggregators and `ci-complete`
all carry `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`; each aggregator
fails only when `contains(needs.*.result, 'failure')` is true (skipped/cancelled
upstreams are tolerated), and `ci-complete` additionally treats `cancelled`
upstreams as a soft skip (`exit 0` with warning).

Step 1 — Full-path test PR (CI_MINIMAL=false, Tasks 4.1 + 4.4):

1. Confirm repo variable `CI_MINIMAL` is unset or `false`
   (`gh variable list` / Settings → Variables → Actions).
2. Open a test PR against `main` with a conventional title
   (e.g. `test(ci): verify phase 2 aggregators`), signed commits (`git commit -S`),
   conventional messages, and `Signed-off-by` trailers.
3. Wait for CI completion, then verify in the PR Checks tab:
   - All 4 aggregators EXECUTED (not skipped):
     `Prebuild Governance Complete`, `Prebuild Quality Complete`,
     `Prebuild Security Complete`, `Prebuild Unit Tests Complete`.
   - Each aggregator result matches its upstream substage:
     governance ← `verify-signatures, commit-lint, pr-title-lint, dco`;
     quality ← 12 lint/format/typecheck/complexity/dead-code/import-bounds jobs
     - `actionlint`; security ← `dependency-review`;
       unit-tests ← `test-unit-client, test-unit-server, test-integration, test-smoke`.
   - `CI Complete` (`ci-complete`) result equals the AND of the 4 aggregators
     (+ `verify-signatures`, `zombie-workflow-guard`, `repo-discovery`):
     green iff no upstream `failure`; red iff any aggregator failed.
4. Negative control (optional but recommended): push a commit that breaks one
   substage (e.g. an unused export tripping `server-dead-code`, now blocking
   after Task 2) and confirm the corresponding aggregator fails and
   `ci-complete` fails with `❌ One or more upstream jobs failed`.

Step 2 — Minimal-path test PR (CI_MINIMAL=true, Tasks 4.2 + 4.3):

1. Set `gh variable set CI_MINIMAL --body "true"` (repo Settings → Variables).
2. Open (or re-run CI on) a test PR.
3. Verify in the Checks tab: all 4 aggregators show SKIPPED (grey), and no
   `failure` is reported to the status-check system by any of them.
4. Verify `CI Complete` passes (green/skipped-treated-as-passing) on this PR —
   the `always()` guard keeps the job evaluated while the `CI_MINIMAL` gate
   prevents false failures.
5. Restore `gh variable set CI_MINIMAL --body "false"` (or delete the variable)
   after verification so subsequent PRs exercise the full path.

Acceptance: 4.1 ✓ aggregators execute + report on full path; 4.2 ✓ all 4
SKIPPED with no failure on minimal path; 4.3 ✓ `ci-complete` green on minimal
path; 4.4 ✓ `ci-complete` mirrors aggregator results on full path. Record the
two test-PR numbers/URLs and check-run outcomes in the PR description before
merge (Task 6.1).

## 5. PR Verification — Ruleset Status Checks

- [x] 5.1 On a clean test PR (valid signatures, conventional commits, proper PR title, DCO sign-off), verify all 4 ruleset checks pass: `verify-signatures`, `commit-lint`, `pr-title-lint`, `dco`.
- [x] 5.2 Verify that ruleset check behavior is identical to pre-Phase 2 (no regressions in their pass/fail logic).

### Verification Procedure — Rulesets (Tasks 5.1–5.2)

Scope: `.github/workflows/ci.yml` — `verify-signatures` (~line 63, name
`Verify Commit Signatures`, PR-scoped via compare endpoint with 2026-08-01
grandfathering cutoff), `commit-lint` (~line 305, `commitlint --from $BASE_SHA
--to $HEAD_SHA`), `pr-title-lint` (~line 341, `amannn/action-semantic-pull-request@v6`,
types feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert/ops,
lowercase-subject pattern), `dco` (~line 379, `KineticCafe/actions-dco@v3.2.0`,
well-known bot policy). Phase 2 touches NONE of these definitions (only the
two `continue-on-error` removals in `client-dead-code`/`server-dead-code`,
Task 2) — so any behavior delta is a regression by definition.

Step 1 — Clean-PR pass check (Task 5.1): on the full-path test PR from Task 4.1
(signed commits, conventional messages, conventional lowercase-subject PR title,
`Signed-off-by` trailers), verify all 4 checks are green:
`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`,
`PR Title Lint`, `DCO`.

Step 2 — No-regression matrix (Task 5.2): on throwaway commits/branches (or by
temporarily retitling the test PR), confirm each check still FAILS on the same
inputs it failed on pre-Phase 2, then restore to green:

1. Unsigned commit (post-2026-08-01) → `verify-signatures` fails; signed → passes.
2. Non-conventional message (e.g. `wip stuff`) → `commit-lint` fails.
3. Non-conventional PR title (e.g. `Update stuff`, uppercase subject) →
   `pr-title-lint` fails; `type(scope): lowercase subject` → passes.
4. Commit without `Signed-off-by` → `dco` fails; with trailer → passes.
   Also confirm `prebuild-governance-complete` (which `needs` all 4 rulesets)
   fails when any ruleset fails and passes when all 4 pass — proving the
   aggregator wiring from Phase 1 is intact.

Acceptance: 5.1 ✓ 4/4 green on clean PR; 5.2 ✓ 4/4 negative controls fail
exactly as pre-Phase 2 and recover to green. No workflow edits to the 4
ruleset jobs exist in the Phase 2 diff (`git diff main -- .github/workflows/ci.yml`
shows only the two `continue-on-error` removals) — attach that diff excerpt to
the test PR as regression evidence.

## 6. Merge and Closure

- [ ] 6.1 Merge the Phase 2 PR after all verifications (Tasks 4–5) pass. Verify merge commit is signed and CI is green on the PR.
- [ ] 6.2 Verify post-merge CI on main passes (aggregators, `ci-complete`, rulesets) and close the change. Verify no follow-up items remain open.
