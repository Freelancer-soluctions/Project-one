# Tasks

> These tasks implement the delta in `specs/pr-body-lint-governance/spec.md` (3 REMOVED · 2 MODIFIED
> · 4 ADDED), not the PRD in the raw. Three requirement names are quoted verbatim below because the
> code and the tests must use them: `Empty body fails on emptiness, not on length`,
> `Section rules: Summary, issue reference and tested section`, and Core sections are located by a
> single `##` heading scan. The fourth governance requirement,
> `The verdict is a job failure, not a comment`, is MODIFIED in place — its name and its three
> scenarios survive — rather than deleted and re-added under a new name.

## 0. Preparation and baseline

- [x] 0.1 Record the baseline as it actually exists — two measured artifacts, **no saved PR body**. The
      behavioural baseline that matters is the **235 logic lines** measured before the rewrite
      (`design.md` § Context: 235 logic lines, target ≤80; § The metric re-measures it with the same
      command), plus the run evidence already recorded in 1.1/1.3 (9 runs of `pr-metadata.yml` on head
      sha `99941cba5abeb08b7fff929795ae68e7d9ac40c7`, 2026-10-23 23:02:31–23:10:26 UTC).
      **Evidencia**: the body snapshot was **not captured** — `.tmp/pr-body-lint/baseline-body.md` does
      not exist, and that directory holds only the A1-A4 fixture bodies (`body-pass.md`, `body-fail.md`)
      plus a stale `report.json`. It is also **not needed**: the change is differential against the live
      policy, which is in `main`, and the pre/post behaviour is pinned by the delta's scenarios and the
      42 tests in `scripts/ci/pr-body-lint.test.mjs` (42/42 green). No PR number, snapshot path or run
      id is invented here.

## 1. Trigger `edited` — already true in production, record the evidence

- [x] 1.1 No code change. `.github/workflows/pr-metadata.yml:38` already declares
      `types: [opened, edited, synchronize, reopened]` and `:39` declares `merge_group: {}`. This is
      evidence, not work: re-adding either would be an empty diff.
      **Evidencia**: `pr-metadata.yml:38-39`.
- [x] 1.2 W2 withdrawn — `cancel-in-progress` stays `false` (`pr-metadata.yml:49`; rationale at
      `:41-46`). Flipping it to `true` is a regression, not an improvement: a cancelled run is not
      success for a required check, so cancelling the final run can leave `Governance: PR Body Lint` with
      no verdict for the body being merged. Do NOT change this line.
      **Evidencia**: `pr-metadata.yml:41-49` — the comment there is the decision record.
- [x] 1.3 A6's first half is proven only to the weaker claim: **a non-push trigger re-runs the check on
      the same sha**. The runs API does not expose which non-push activity fired it, and `edited` and
      `reopened` are indistinguishable there, so "`edited` fires" is not provable from these runs — 1.1
      (the declared `types:`) is what establishes that `edited` is wired.
      **Evidencia**: 9 runs of `pr-metadata.yml` on head sha `99941cba5abeb08b7fff929795ae68e7d9ac40c7`
      on 2026-10-23 between 23:02:31 and 23:10:26 UTC, all `event=pull_request`, 5 failure / 4 cancelled
      (run ids 40037329862, 40037334031, 40037355284, 40037364116, 40037368880, 40037373046,
      40037374882, 40037382641, 40038128143). Same sha plus repeated runs proves a non-push trigger; the
      4 cancelled runs are the pending-cancellation that `cancel-in-progress: false` permits. The second
      half of A6 ("and passes") is NOT proven by these runs — it is covered by 6.1.

## 2. Simplify the PR Template

- [x] 2.1 Remove exactly these three boxes from `## Pre-merge Checklist` in
      `.github/PULL_REQUEST_TEMPLATE.md`: `:37` `Signed-off-by present in all commits`, `:38`
      `Tests pass locally (npm run test)`, `:41` `PR title follows Conventional Commits`. Nothing else
      moves: `## Type / Scope` (`:9-13`, 5 boxes) and the 5 test boxes (`:25-29`) are untouched, and
      `## Screenshots` stays.
      **Evidencia**: `## Pre-merge Checklist` has exactly 2 boxes, and the diff contains no hunk inside
      `## Type / Scope` or `## How Has This Been Tested?`.
- [x] 2.2 Keep `Documentation updated (if applicable)` (`:39`) and
      `No breaking changes (or documented in Summary)` (`:40`), in that order.
      **Evidencia**: both boxes present and unchecked.
- [x] 2.3 Add the RT-3 comment naming each check that already covers a removed box. DCO, PR title
      lint and CI are three different checks and the comment must say so:
      `<!-- Sign-off is verified by the DCO check, the PR title by Governance: PR Title Lint, and the tests by CI. Do not restate them in this body. -->`
      The earlier draft attributed all three to `Governance: PR Body Lint`, which is false: the body lint
      reads text, it does not verify signatures, titles or test runs.
      **Evidencia**: the template contains that comment and it names DCO / `Governance: PR Title Lint` /
      CI — not the body lint.
- [x] 2.4 Confirm the three required sections are still `##` headings (`Summary`, `Related Issue`,
      `How Has This Been Tested?`); the lockstep describe (`template lockstep`, `design.md` D11) reads
      them from the template file.
      **Evidencia**: lockstep describe still green against the simplified template.

## 3. Reduce the Policy Script

- [x] 3.1 Rewrite the policy per RP-1 to RP-5 and target the metric defined here — **not** `wc -l`,
      which counts comments and doc blocks and cannot answer "how much logic is left".
      **Métrica**: non-blank, non-comment lines above the **first** of the two export markers that can
      follow the policy code — `export const buildReport ` or `export const evaluate ` — in
      `scripts/ci/pr-body-lint.mjs`. That is the parsing helpers plus `evaluateBody`, exclusive of the
      report writer, the summary renderer and the `evaluate` wrapper. A single anchor on `buildReport`
      is **not** D2-invariant: when D2 drops the report the marker is absent, `indexOf` returns `-1`
      and `slice(0, -1)` yields the whole file (343 lines), so the gate would fail for a reason that
      has nothing to do with the policy. The two-anchor form cuts at whichever marker exists, so the
      number never moves for a D2 reason (baseline today: 235).
      **Evidencia**: this prints `logic lines: <n>` with n ≤ 80:
      `node -e "const fs=require('fs');const s=fs.readFileSync('scripts/ci/pr-body-lint.mjs','utf8');const c=['export const buildReport ','export const evaluate '].map(m=>s.indexOf(m)).filter(i=>i>=0);const seam=s.slice(0,Math.min(...c));const n=seam.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').filter(l=>{const t=l.trim();return t&&!t.startsWith('//')}).length;console.log('logic lines:',n)"`
- [x] 3.2 Implement RP-2 as the delta states it (Core sections are located by a single `##` heading
      scan): one regex pass over `##` headings, canonicalized comparison, first occurrence wins, no
      duplicate metric. Fence-blind is the accepted regression — do NOT reintroduce `computeFenceMask`.
      **Evidencia**: the scan is a single regex; `computeFenceMask` is gone; a test asserts that a `## `
      line inside a fence splits the document.
- [x] 3.3 Implement RP-3: every failure names rule and section, and the whole-body failure is its own
      named diagnostic, **`EMPTY_BODY`** (requirement `Empty body fails on emptiness, not on length`) —
      never a character floor. The same identifier is used in the delta, in the report `policy` block
      and in the tests; there is no `'R1'` id left anywhere.
      **Evidencia**: messages shaped like `R2b: Related Issue` / `R3: Closes # without number` /
      `EMPTY_BODY: body`; grep finds no 20- or 40-character threshold in the seam and no `'R1'` rule id.
- [x] 3.4 Implement RP-4: tool errors reported as `TOOLING ERROR`, distinct from a policy violation.
      **Evidencia**: the `evaluate` wrapper distinguishes them; the existing missing-payload and
      write-failure tests stay green.
- [x] 3.5 Implement RP-5 — **conditional on D2 (still open)**. Publish the Step Summary either way.
      If D2 keeps the report, `report.json` and the 14-day artifact stay untouched; if D2 drops it,
      remove `buildReport`/`writeReport` and the artifact step. 5.1 depends on which way this lands.
      **Evidencia**: Step Summary published; the report/artifact state matches the D2 decision recorded
      in `design.md`.
- [x] 3.6 Port the tests with an explicit inventory. "Port only the tests of R2b, R2c and R3"
      understates the deletion: `normalize` and `splitSections` are where R2c's checked-box path and the
      section locator actually live. In `scripts/ci/pr-body-lint.test.mjs`:
  - **Rewritten** — `normalize — six-step pipeline in normative order` (`:67-101`, 7 tests) becomes a
    strip describe with 4 tests: headings dropped (`:68`), unchecked lines dropped / checked
    unwrapped without the marker (`:73`), HTML comments stripped (`:78`), `Closes #` without digits
    removed but `Closes #123` kept (`:82`). **Deleted**: `:87` (marker re-injection into the
    measurement — there is no measurement left, and `:73` already asserts the unwrap), `:93`
    (whitespace collapse, step 6) and `:97` (normalize determinism — folded into `:359`).
  - **Rewritten** — `splitSections — raw split, canonical keys` (`:103-188`, 6 tests): keep `:104`,
    `:112`, `:120`, `:128`. **Deleted**: `:135` (`##` inside a fence is content — the scan is now
    fence-blind) and `:161` (unterminated-fence forgiveness — no fence handling remains). Replace
    them with one test asserting a fenced `## ` line splits the document.
  - **Rewritten** — `evaluateBody — R1..R5 with severities` (`:190-368`, 18 tests): 11 unchanged
    (`:209`, `:218`, `:223`, `:292`, `:297`, `:305`, `:312`, `:320`, `:329`, `:334`, `:359`),
    6 rewritten, 1 deleted (11 + 6 + 1 = 18):
    - `:191` and `:201` — retargeted from `'R1'` to `EMPTY_BODY`.
    - `:231` — keeps the R2a failure, loses the measured-length assertion.
    - `:241` — **rewritten, not deleted**: it asserts that the first `## Summary` wins on duplicates,
      which is the delta's "first occurrence wins" requirement and survives. Only the
      `metrics.duplicateSections` expectation goes, because that metric is gone.
    - `:266` — **rewritten, not deleted**, same reason: R2a still measures the first occurrence and
      duplicates are still never merged; only the metric assertion goes.
    - `:342` — **rewritten, not deleted**: it is the only test of the delta's scenario "An unchecked
      test box does not satisfy R2c", so the R2c failure half stays and only the R4 warning half goes.
    - `:350` — **deleted**: the R4/R5 warning test, since no warning-severity rule survives.
  - **Unchanged** — `bot skip — by author, never by actor` (`:370-418`) and
    `template lockstep` (`:586-629`, `design.md` D11).
  - **Conditional on D2** — `report schema and evaluate() wrapper` (`:420-584`): if D2 drops the
    report, delete `:433`/`:473` and rewrite `:485`/`:509` to assert only the `setFailed` behaviour;
    `:535` and `:578` stay; `:553` moves to whichever surface still writes.
  - **New test — R2c's checked-box path must not depend on `normalize`**: a section whose only
    content is a bare `- [x]` with no label. Stripping erases it (no label survives), so R2c can
    only pass if it counts checked boxes on the **raw** section text.
    **Evidencia**: that test goes red if `evaluateBody` stops calling `countCheckedCheckboxes` on raw
    section text — confirm by mutation (comment the call, watch it fail), then revert.
- [x] 3.7 Update `.opencode/command/push-pr.md` in the **same PR**: it is the second consumer of the
      policy and it breaks silently when the policy changes shape. Step 7 (`:52-64`) calls the pure seam
      `evaluateBody({ body })` through `node -e` and reads `r.failures` (`.rule`, `.section`, `.message`),
      `r.warnings` (`.rule`, `.message`) and `r.verdict`. That shape is a contract (`design.md` §
      Return-shape contract): `{ verdict, failures, warnings }` is the minimum, and the rewrite MUST keep
      those three keys with those field names. Three pieces of prose also go stale and are corrected in
      the same edit: `:56` ("a missing reference is only a warning" — R5 no longer exists), `:63`
      ("`WARN` lines (no checked box, no `#N` reference) never block" — no rule emits warnings any more),
      and `:58` (it tells the author to check the `Pre-merge Checklist` `Signed-off-by present` box,
      which 2.1 removes).
      **Evidencia**: the pre-flight still exits 0 on a passing body and non-zero on a failing one, run
      from the repo root with no network (`design.md` § Pure/impure boundary); grep finds neither "missing
      reference is only a warning" nor a `Signed-off-by present` box reference.

## 4. Issue by API — not adopted (D3)

> **Decisión del mantenedor (D3, 2026-10-23): no.** Un PR sin issue vinculado **no** es inválido, así que
> R2b se queda en solo texto, W3 no se adopta y no se consulta `closingIssuesReferences`. 4.1-4.3 están
> cerradas como **decisión registrada, no como trabajo completado**: `[x]` aquí significa «decidido en
> contra», nunca «implementado». El pre-flight de `push-pr.md` sigue corriendo offline.

- [x] 4.1 **Not adopted — closed by D3, not by implementation.** D3 answered "no" on 2026-10-23: an
      issue-less PR stays valid, so R2b keeps its text-only check. W3 is not adopted, no
      `closingIssuesReferences` query exists in the workflow or in `evaluate`, and there is therefore no
      failure mode, no retry and no A5 to reproduce.
      **Evidencia**: `design.md` § Open Decisions (D3 = "no", 2026-10-23) and the W3 row of the option
      table ("Not adopted (D3)"); `git grep closingIssuesReferences -- .github/workflows/ scripts/ci/`
      returns no matches — only the PRD and these change docs name it.
      _Historical note — the constraint that made W3 worth weighing, not an instruction:_ had it been
      adopted, the query would have had to live in the **workflow step or `evaluate`**, never in
      `evaluateBody`, because network inside the pure seam would break the offline pre-flight of
      `.opencode/command/push-pr.md`. That boundary is exactly why the option was cheap to write down and
      expensive to land.

- [x] 4.2 **Not adopted — closed by D3.** Nothing queries the API, so the two failure modes below never
      exist: (a) a failed call, and (b) a call that succeeds but returns an empty
      `closingIssuesReferences` for a body whose `#N` is visible. Both were specified as `TOOLING ERROR`,
      never as a policy violation — and that distinction survives for the tooling errors the policy does
      have (missing payload, summary write failure), which 6.1 exercises as A9.
      **Evidencia**: no `github-script` call and no GraphQL query in `pr-metadata.yml`; the only
      `TOOLING ERROR` paths are the two above, both offline.
      _Historical note — why the retry mattered, not an instruction:_ `edited` is in scope precisely so
      an author can fix a red PR by editing, and a lookup that lagged would keep the _fixed_ PR red — the
      author's only remedy would be to edit again and hope. That is why the design chose one conditional
      retry after a short delay instead of a single attempt. It is recorded here so a future reader
      inherits the reasoning, not a to-do.

- [x] 4.3 **Not adopted — A5 has no meaning for this policy.** A5 was "a `#123` that appears only inside
      a code block, on a PR with no linked issue, checked against the real API". With no API call there
      is no A5 to reproduce: it is **not** a pending external verification and nothing is outstanding.
      **Evidencia**: `design.md` § Open Decisions — "A5 … therefore does not apply to this policy"; 6.1
      excludes it on that ground, not on the ground of being unverifiable.
      _Historical note — why it could never have been closed offline, not an instruction:_ A5 required a
      real PR, because a fixture cannot stand in for the real API's link graph. That unavailability was
      itself part of the cost D3 weighed.

## 5. Fix Actions by SHA

- [x] 5.1 Pin `actions/checkout@v5` (`pr-metadata.yml:122`) and `actions/github-script@v9` (`:131`)
      by SHA. `actions/upload-artifact@v7` (`:140-148`) is **conditional on D2**, consistent with 3.5: if
      the artifact is removed there is no action left to pin, and this task must not create a pin for a
      step that no longer exists.
      **Evidencia**: `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` (v5.1.0) y
      `actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3` (v9.0.0); ningún `uses:` de
      `upload-artifact` queda en el archivo (3.5 lo borró con D2), y `actionlint` sale 0.
- [x] 5.2 Align with the supply-chain PRD if applicable.
      **Evidencia**: SHA pinning consistent with project practice (the tag kept beside the SHA in a
      comment).

## 6. Final Validation

- [x] 6.1 Run A1-A4 and A7-A9. A5 is excluded because it **does not apply**: D3 answered "no", so nothing
      queries the API and there is no A5 to reproduce (4.3) — not an outstanding verification.
      **Evidencia**: cada caso verde con el id de regla en la salida — A1/A2 `EMPTY_BODY`, A3 `R3`, A4 sin
      fallos y exit 0 en el pre-flight de `push-pr.md`, A7 `skipped`, A8 no-op. **A9** se cumple por la ruta
      `TOOLING ERROR` (payload ausente y fallo al publicar el summary), que es la única herramienta que queda:
      la política ya no llama a la API. `npm run test:scripts` → 181 tests en 9 archivos, verde.
- [x] 6.2 Re-run the metric from 3.1 — same command, same definition, not `wc -l`.
      **Evidencia**: `logic lines: 78` (baseline 235; el seam corta en `export const evaluate ` porque
      `buildReport` ya no existe).
- [x] 6.3 Verify the template: `## Pre-merge Checklist` has 2 boxes, `## Type / Scope` still has its
      5, the test list still has its 5.
      **Evidencia**: counts 2 / 5 / 5, y el comentario RT-3 está presente con los tres checks nombrados por
      separado (DCO, `Governance: PR Title Lint`, CI).
- [x] 6.4 Re-verify the trigger includes `edited` (true before this change — see 1.1).
      **Evidencia**: `pr-metadata.yml:38`.
- [x] 6.5 Re-verify the issue validation matches the D3 decision: an API query if D3 adopts it,
      text-only if not.
      **Evidencia**: la política es text-only (R2b exige contenido, no un issue) y `design.md` § Open
      Decisions registra D3 = "no" con fecha 2026-10-23.

## 7. Documentation lockstep

- [x] 7.1 Update the three docs that describe this gate, in the same commit (`06f9cd89`). They are the
      canonical record of the policy, so leaving them on R1-R5 would have documented a gate that no
      longer exists. **Evidencia**: `git show --stat 06f9cd89` lists the three files; `grep` finds no
      `R1 ≥40` and no `report_path` claim left in them as the current shape, and
      `quality-gates.md:21` still carries the `5º contexto` phrase in the `Notas` cell.
  - `docs/CONTEXT-CICD.md` §9.3.4 — the `pr-body-lint` paragraph now lists `EMPTY_BODY` · R2a · R2b ·
    R2c · R3 as the only rules, states that there are no warning rules and no length floors, and
    records the single `##` heading scan with its fence-blind regression; the evidence line moves
    from the `report.json` artifact to the job Step Summary (D2).
  - `docs/learning/ci-cd/05e-pr-metadata-governance.md` — a SUPERSEDED banner for the reduced policy
    (R1, R4, R5 and the 20-character floors gone), the outputs shape `{ verdict, failures, warnings }`
    replacing `report_path`, and the `report.json` schema v1 demoted to historical record.
  - `docs/learning/quality-gates.md` — only the `Significado` cell of the `pr-body-lint` row changes,
    to describe the reduced policy. The file was **not** restructured: no row was added, removed or
    reordered, and the `5º contexto` note in that same row's `Notas` cell is pre-existing and
    untouched (the table's column widths were re-flowed by prettier, nothing else).
