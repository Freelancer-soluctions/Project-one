# Tasks

## 1. Build stage depends on the prebuild verdicts (R1)

- [x] 1.1 Replace the `needs` list of `client-build` (`ci.yml:2053-2061`) with exactly
      `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete,
prebuild-tests-complete]`, removing all six individual quality job ids. Verify: the job's `needs` has 4
      entries and `grep -A8 'client-build:' .github/workflows/ci.yml` shows no `client-lint`, `client-format-check`,
      `client-typecheck`, `client-complexity`, `client-dead-code` or `client-import-bounds`.
- [x] 1.2 Replace the `needs` list of `server-build` (`ci.yml:2078-2086`) with the same 4 aggregators. Verify: the
      job's `needs` has 4 entries and no `server-*` individual job id remains in it.
- [x] 1.3 Replace `client-build`'s literal `if: false` with the composed condition, keeping the existing trailing
      comment immediately after it:
      `if: false && needs.prebuild-governance-complete.result == 'success' && needs.prebuild-quality-complete.result == 'success' && needs.prebuild-security-complete.result == 'success' && needs.prebuild-tests-complete.result == 'success' # Disabled for incremental CI — change to true to re-enable`.
      The predicate goes INTO the condition, not into an adjacent comment: activation stays the single-token edit
      `false` → `true` with the gate already present (Decision 2). Verify: `actionlint -config-file
.github/actionlint.yaml .github/workflows/ci.yml` exits 0 with no `[if-cond]` finding on this job, and the job
      still finalizes as skipped on a real PR.
- [x] 1.4 Do the same for `server-build` with the same four conjuncts and the same trailing comment. Verify:
      `grep -c 'if: false &&' .github/workflows/ci.yml` → 2, and `actionlint -config-file .github/actionlint.yaml
.github/workflows/ci.yml` → exit 0.

## 2. New stage aggregators (R2, R3a, R3b, R6)

- [x] 2.1 Add the `build-complete` job with `name: Build Complete`, `needs: [client-build, server-build]`,
      `if: ${{ always() }}`, `runs-on: ubuntu-latest`, `timeout-minutes: 5`. **Insertion point:** all three new jobs go
      in the `SUBSTAGE AGGREGATORS` region of `ci.yml`, **after `prebuild-tests-complete` and before the
      `AGGREGATOR — CI Complete` banner** that opens the root aggregator — a stage verdict belongs beside the verdicts it
      consumes. `Build Complete` carries no `Build:` block prefix: it aggregates the build stage rather than belonging to
      it (design Decision 7 / role exceptions). `timeout-minutes: 5` is deliberate — these are single-step jobs — and the
      prebuild aggregators' missing timeout is **not** a precedent to copy. Verify: the job exists, `grep` shows exactly 2
      `needs` entries, and the `name:` is unquoted (no `:` in the value).
- [x] 2.2 Add the `postbuild-tests-complete` job with `name: Postbuild Tests Complete`, `needs:
[build-complete, test-integration, test-smoke, e2e]`, `if: ${{ always() }}`, `timeout-minutes: 5`, in the same
      region immediately after 2.1. Verify: 4 `needs` entries, no SonarQube or depcheck id present.
- [x] 2.3 Add the `postbuild-analysis-complete` job with `name: Postbuild Analysis Complete`, `needs:
[build-complete, client-sonarqube, server-sonarqube, client-depcheck, server-depcheck]`, `if: ${{ always() }}`,
      `timeout-minutes: 5`, immediately after 2.2. Verify: 5 `needs` entries, no test job id present.
- [x] 2.4 Give all three new aggregators the verdict step of the four prebuild aggregators: one shell step that
      exits 1 on `contains(needs.*.result, 'failure')`, exits 1 on `contains(needs.*.result, 'cancelled')`, and
      otherwise exits 0 reporting the stage as succeeded or skipped. Verify: the three step bodies are textually
      equivalent to `prebuild-tests-complete`'s, differing only in the message strings.
- [x] 2.5 Confirm the `name:` values are left unquoted because none contains `:` — and add a one-line comment noting
      that any future `name:` containing `:` must be single-quoted (actionlint: "Nested mappings are not allowed in
      compact mappings"). Verify: `actionlint` clean and the comment present.

## 3. Aggregator membership corrections (R4, R5)

- [x] 3.1 Remove `test-integration` and `test-smoke` from `prebuild-tests-complete.needs`
      (`ci.yml:2548-2554`) and add `property-tests`, leaving exactly `[test-unit-client, test-unit-server,
client-coverage, server-coverage, property-tests]`. Verify: 5 entries; `test-integration`/`test-smoke` absent.
- [x] 3.2 Confirm `property-tests` keeps `continue-on-error: true` (`ci.yml:1219`) and that no edit to that job is
      part of this change. Verify: `git diff` shows `property-tests` only as a `needs` line added elsewhere, never as a
      modified job; its `continue-on-error` is unchanged.
- [x] 3.3 Add a comment on the `property-tests` entry stating that its inclusion is record-only because of
      `continue-on-error: true`, so a future reader does not assume the aggregator now blocks on it. Verify: comment
      present next to the entry.
- [x] 3.4 Extend `ci-complete.needs` (`ci.yml:2575-2581`) with `build-complete`, `postbuild-tests-complete` and
      `postbuild-analysis-complete`, keeping the four prebuild aggregators, `zombie-workflow-guard` and
      `repo-discovery`. Verify: exactly 9 entries, no duplicates, no individual build/post-build job id added.
- [x] 3.5 Confirm the DAG has no cycle and every new `needs` target exists: `build-complete` ← the two build jobs;
      both post-build aggregators ← `build-complete`; `ci-complete` ← the three aggregators. Verify:
      `actionlint` reports no undefined `needs` property, and a manual topological read of the 3 new jobs matches the
      chain prebuild → build → {tests, analysis} → ci-complete.

## 4. Documentation sync (D1-D5b)

- [x] 4.1 D1 — `docs/CONTEXT-CICD.md` §3.3: add rows for `build-complete` (`Build Complete`),
      `postbuild-tests-complete` (`Postbuild Tests Complete`) and `postbuild-analysis-complete`
      (`Postbuild Analysis Complete`); correct the `client-build`/`server-build` rows to the 4-aggregator `needs`; state
      that the five post-build jobs now have a verdict path. Verify: the table lists 3 new aggregators and no row still
      describes build as depending on individual quality jobs.
- [x] 4.2 D2 — §3.3.1: register the three new aggregators as **stage** siblings of the `Prebuild … Complete` family,
      note the deviation that they do not carry the `Prebuild ` prefix and why (stage aggregator, not substage
      aggregator), and confirm the ids are not renamed. Verify: the §3.3.1 table has a stage-aggregator row covering all
      three.
- [x] 4.3 D3 — §9.3.7: replace the `ci-complete.needs` description with the verbatim 9-entry array and describe the
      chain prebuild → build → {tests, analysis} → ci-complete. Verify: the 9 ids appear verbatim and the chain sentence
      is present.
- [x] 4.4 D4 — §3.2 and §5.1: correct the required-context count from 5 to **2** (`Governance: PR Body Lint`,
      `Prebuild Governance Complete`; API re-verified 2026-10-23) and add the explicit **DEBT NOTE**:
      `Governance: PR Title Lint` is enforced by nothing, and `Verify Commit Signatures`,
      `Commit Lint (Conventional Commits)` and `DCO` are no longer individually required — their blocking force flows
      solely through `Prebuild Governance Complete`. Verify: no section still claims 5 required contexts, and the debt
      note names all four affected contexts. **No ruleset edit** (no `gh api PUT`).
- [x] 4.5 D5 — §3.3: remove the row for the non-existent job `actionlint` (`name: Quality: ActionLint`) and fix every
      other claim that a blocking `actionlint` job exists. The phantom appears in **8** places in
      `docs/CONTEXT-CICD.md` and **all 8 are in scope — none deferred**: L166 (the standalone-jobs paragraph naming
      `client-lint`, `server-lint` y `actionlint`), L242 (the §3.3 table row `actionlint | Quality: ActionLint`), L266
      (the security-placement note "el `actionlint` bloqueante pertenece a 2B quality"), L275 (the path-scoping bullet),
      L596, L903, L1086, and **L1617** — the worst, a tooling-table entry claiming `ci.yml` runs
      `run: bash <(curl …download-actionlint.bash) 1.7.12`, a step that does not exist anywhere in the workflow.
      L257 (`Security: ActionLint Advisory (SARIF, FASE 1)`) is **not** one of the eight: that is the real
      `actionlint-advisory` job and it stays. Verify: `grep -n "Quality: ActionLint" docs/CONTEXT-CICD.md` returns
      nothing, `grep -n "actionlint\` bloqueante" docs/CONTEXT-CICD.md`returns nothing, and every remaining`actionlint`mention refers to`actionlint-advisory`, to `.github/actionlint.yaml` or to the local pin — never to a CI job.
- [x] 4.6 D5b — correct the two `ci.yml` header comments this change invalidates. (a) `ci.yml:458`
      `SUBSTAGE 2D: UNIT TESTING — …` must list only the tier-1 jobs (`test-unit-client, test-unit-server,
client-coverage, server-coverage, property-tests`), removing `test-integration` and `test-smoke` from the prebuild
      declaration. (b) `ci.yml:2569` `AGGREGATOR — CI Complete — Single required check aggregator` calls `ci-complete` a
      required check, which it is not and never was: ruleset 21227644 enforces exactly 2 contexts and neither is
      `ci-complete` — reword to a root-aggregator description that does not claim required status. Verify: neither header
      still makes its old claim (`grep -n "SUBSTAGE 2D" .github/workflows/ci.yml` shows the corrected line and no
      `test-integration`/`test-smoke` in it; `grep -n "Single required check aggregator" .github/workflows/ci.yml`
      returns nothing).
- [x] 4.7 Record the three accepted risks in `docs/CONTEXT-CICD.md` §6 (deudas): P2-1 re-routed landmine
      `server-format-check`, P2-3 `CI_MINIMAL` clause absent on the new aggregators plus the note that
      `Prebuild Governance Complete` is the repo's only merge-governance enforcement path, and P3-1 `ci-complete`
      treating `cancelled` as success. Verify: the three entries exist in §6 and none is presented as fixed.

## 5. Rename `prebuild-unit-tests-complete` → `prebuild-tests-complete` (D9)

- [x] 5.1 Perform the rename as ONE atomic edit across exactly four lines of `.github/workflows/ci.yml`: `2544` (the
      job id), `2546` (`name: Prebuild Tests Complete`), `2579` (the `ci-complete.needs` entry) and `1046` (the comment
      that names the aggregator). The `ci-complete.needs` entry MUST change in the same commit: a `needs` entry naming a
      job that does not exist invalidates the **entire workflow file**, so `ci.yml` would stop running and every PR would
      block on `Expected — Waiting for status to be reported`. Verify: `grep -rn "prebuild-unit-tests-complete"
.github/` returns zero hits, and `actionlint -config-file .github/actionlint.yaml .github/workflows/ci.yml` passes
      (a stale `needs` reference surfaces there as an undefined-property error).
- [x] 5.2 Confirm the rename is binding-safe before committing: ruleset 21227644 enforces 2 required contexts
      (`Governance: PR Body Lint`, `Prebuild Governance Complete`) and `Prebuild Unit Tests Complete` is not among them;
      classic branch protection has `contexts: []`. Verify: `gh api repos/{owner}/{repo}/rulesets/21227644` shows
      neither the old nor the new context, so no ruleset edit is needed. **No `gh api` write.**
- [x] 5.3 Sync the live main specs — the **6 capability deltas** under `specs/` land via archive, and that delta set is
      the mechanism: `openspec archive` applies only what is physically present there, it does not scan the repo for
      references. `ci-prebuild-substage-structure` carries the `RENAMED` block (`FROM`/`TO`) plus the MODIFIED content
      under the NEW header; `ci-e2e`, `ci-test-impact-analysis`, `ci-test-jobs-activation`, `ci-test-sharding` and
      `client-snapshot-testing` each carry their own MODIFIED blocks (the requirements that cite the old id at
      `ci-prebuild-substage-structure` L16/L80/L82/L86/L98, `ci-e2e` L24, `ci-test-impact-analysis` L17 + L45,
      `ci-test-jobs-activation` L28/L34/L38/L44/L79/L113, `ci-test-sharding` L75/L79/L92/L183 and
      `client-snapshot-testing` L49/L74). Verify with the grep in 6.5: after archiving,
      `grep -rn "prebuild-unit-tests-complete" openspec/specs/` returns zero hits.
- [x] 5.4 Propagate the rename through the documentation. In scope (the delta's own documentation task, group 4
      territory): `docs/CONTEXT-CICD.md` L89 and L152. Bounded follow-up set, same change, best-effort:
      `docs/learning/quality-gates.md` (L36/L79/L85), `docs/learning/unit-tests-enterprise.md` (L23/L226/L367),
      `docs/learning/coverage-merge-gate.md` L304, `docs/learning/coverage-tripwire-floor-ratchet.md` L213,
      `docs/learning/panorama-resumen.md` L28/L30, `docs/learning/test-sharding.md` L191,
      `docs/learning/property-based-testing.md` L450, `docs/learning/ci-cd/05e-pr-metadata-governance.md` L587/L606,
      `docs/learning/ci-cd/24-dag-infraestructura.md` L482, and
      `docs/ci-prebuild-substage-structure-phase2-verification.md` L15/L34. Verify: `grep -rn
"prebuild-unit-tests-complete" docs/` returns zero hits, or the remaining hits are listed in the change's evidence
      with the reason each was left alone.

## 6. Verification

- [x] 6.1 Run `actionlint -config-file .github/actionlint.yaml .github/workflows/ci.yml` and confirm zero new
      findings — in particular no `[if-cond]` diagnostic on the two build jobs, which would mean the `if:` literal was
      altered, and no undefined-`needs` error, which would mean the rename left a stale reference. Verify: command exits
      0 and prints no `if-cond` line for `client-build`/`server-build`.
- [x] 6.2 Confirm no `if: false` job was activated. The naive counter is misleading: `grep -c "if: false"
.github/workflows/ci.yml` returns **16** lines, but only **8** are job-level conditions — the other 8 are comments
      and comment fragments that quote the flag. Use the anchored form: `grep -cE "^    if: false"
.github/workflows/ci.yml` → **8 before, 8 after** (the two composed build conditions still begin with `if: false`,
      so the count is a stable assertion). Then assert the seven disabled jobs by id (`client-build`, `server-build`,
      `e2e`, `client-sonarqube`, `server-sonarqube`, `client-depcheck`, `server-depcheck`) and confirm exactly two of them
      carry the composed predicate: `grep -c 'if: false &&' .github/workflows/ci.yml` → 2. Verify: all three counts hold
      and the diff of those seven jobs shows only `if:`/`needs` changes.
- [x] 6.3 Confirm no job `id:` was renamed other than the one Decision 9 authorizes, and no existing `name:` changed
      for any job outside the three new ones plus the renamed aggregator. Verify: `grep -n "^    name: "
.github/workflows/ci.yml` diff shows exactly 4 additions/modifications and 0 unexpected changes.
- [x] 6.4 Confirm the excluded files are untouched: `git diff --stat` lists only `.github/workflows/ci.yml`,
      `docs/CONTEXT-CICD.md` and the documentation files of task 5.4. Verify: no entry for `pr-metadata.yml`,
      `opencode-review.yml`, `deploy.yml`, the `sast` job block, the ruleset, or anything under
      `openspec/changes/archive/`.
- [x] 6.5 Run `grep -rn "prebuild-unit-tests-complete" .github/ docs/ openspec/specs/` and confirm zero hits once the
      change is applied and archived. Archived changes under `openspec/changes/archive/` are **HISTORICAL** and SHALL
      NOT be rewritten — they record what was true when written, so a hit there is expected and is not a defect. Verify:
      the command above (which excludes `openspec/changes/`) returns nothing.
- [x] 6.6 Run `openspec validate ci-stage-aggregator-topology --strict` and confirm it reports the change as valid.
      Verify: exit 0.
- [x] 6.7 Run `openspec status --change ci-stage-aggregator-topology` and confirm no artifact is `blocked`.
      Verify: proposal, specs, design and tasks all read done.
