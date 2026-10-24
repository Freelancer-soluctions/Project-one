# Proposal

## Why

The PR Body Lint currently occupies ~500 lines to enforce three sections, an issue reference, and a checkbox. This PRD reduces it to ~60 lines of logic without losing the controls that actually protect code quality.

Current problems:

- Policy measures **length** (minimums of 40 and 20 characters), not quality: a Summary of `aaaaaaaaaaaaaaaaaaaa` passes
- The script normalizes in six steps, masks code blocks, and resolves duplicated sections just to cover edge cases that real PRs almost never produce
- The template asks users to manually check three boxes that DCO, PR title lint, and CI already verify
- Every extra rule is code to test and maintain, and there's only one maintainer

The PRD defines what is conserved, what is removed and how the template looks. Of its two workflow verifications, the `edited` trigger is already proven in production and the issue-linked-by-API one stays pending on D3.

## Goals and Non-Goals

**Success is measured in less code with the same real controls.**

| #   | Goal                                    | Proposed Target                                                                                  |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| O1  | Reduce policy script                    | ≤ 80 lines of logic, not counting comments or tests                                              |
| O2  | Preserve controls with value            | Referenced issue, `Closes #` without number rejected, key sections with content                  |
| O3  | Remove redundant checklist checkboxes   | 3 fewer checkboxes (DCO, title, tests)                                                           |
| O4  | Editing the body re-runs the check      | `edited` event verified in the trigger                                                           |
| O5  | Validate the issue by what GitHub links | Query `closingIssuesReferences` instead of regex — pending D3 (see `design.md` § Open Decisions) |

**Non-goals:** Judging the semantic quality of text (that's human review); changing the name of the check `Governance: PR Body Lint`, which the ruleset 21227644 references; touching DCO, PR title lint or CI; changing bot handling, checkout from the base ref or the no-op of `merge_group`.

## Current State

From ~510 lines, only a small portion applies business rules; the rest is infrastructure for edge cases and reporting.

| Component                                              | Lines (approx.) | Real Value?                                                                                     |
| ------------------------------------------------------ | --------------- | ----------------------------------------------------------------------------------------------- |
| Header, constants and helpers                          | 1-81            | Partial: documents, but repeats the spec                                                        |
| `normalize`: 6-step pipeline                           | 83-115          | Low: only exists to measure length                                                              |
| `computeFenceMask`: ignores headers inside code blocks | 117-154         | Low: nearly non-existent in a real PR                                                           |
| `splitSections`: sections, duplicates, first wins      | 156-221         | Medium: separating sections is needed; duplicates not                                           |
| `evaluateBody`: rules R1-R5                            | 237-378         | Medium: R2b, R2c and R3 are valuable; R1, R2a for length are excessive, R4 and R5 are excessive |
| `buildReport`, `writeReport`, `renderSummary`          | 380-447         | Low: `report.json` and 14-day artifact for a text check                                         |
| `evaluate`: wrapper with `core` and `context`          | 449-508         | High: separates tool error from policy violation                                                |

The workflow job is solid: it reads the policy from the base ref, takes the body from `context.payload` and not from `${{ }}`, excludes bots by author and leaves a no-op for `merge_group`.

## Reduced Policy Requirements

The policy conserves three controls and removes those measuring length or edge cases.

| Current Rule                     | Decision  | How it stays                                                                                              |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| R1: total ≥ 40 characters        | Eliminate | Replaced by an explicit whole-body emptiness rule (delta: `Empty body fails on emptiness, not on length`) |
| R2a: Summary ≥ 20 characters     | Simplify  | Section present and with text that is not just comment or placeholder                                     |
| R2b: Related Issue               | Conserve  | Must have a linked issue (see W3)                                                                         |
| R2c: How Has This Been Tested?   | Conserve  | Text or at least one checkbox marked                                                                      |
| R3: `Closes #` without number    | Conserve  | Evaluated on the body without HTML comments, because the template guide brings `Closes #`                 |
| R4: no checkbox marked (warning) | Eliminate | Template no longer has checkboxes that attest other gates                                                 |
| R5: no `#N` (warning)            | Eliminate | Duplicates R2b                                                                                            |

**Implementation requirements:**

1. **RP-1.** "Empty" means that, after removing HTML comments, unchecked checkboxes and `Closes #` without number, no text remains.
2. **RP-2.** Sections are located with a single regular expression on `##` headers: no 6-step normalization, no code block mask and no duplicate treatment.
3. **RP-3.** Each failure names the rule and the section, so the author knows what to edit.
4. **RP-4.** Tool errors (API failure, missing payload) are still reported as `TOOLING ERROR`, distinct from a policy violation.
5. **RP-5.** The result is published in the Step Summary; `report.json` and the 14-day artifact are removed unless D2 decides otherwise.

## PR Template Requirements

The template keeps checkboxes only for what no machine verifies.

| Current (Pre-merge Checklist)                  | Who Already Verifies | Action |
| ---------------------------------------------- | -------------------- | ------ |
| `Signed-off-by` present in all commits         | DCO check            | Remove |
| Tests pass locally                             | CI (`ci-complete`)   | Remove |
| The title follows Conventional Commits         | PR title lint        | Remove |
| Documentation updated (if applicable)          | Nobody               | Keep   |
| No breaking changes (or documented in Summary) | Nobody               | Keep   |

**Requirements:**

- **RT-1.** The checklist ends up with the two checkboxes that are conserved. The `Summary`, `Related Issue` and `How Has This Been Tested?` sections do not change, because the lockstep test requires them as `##` headers.
- **RT-2.** The `docs/learning/dco.md` guide and the `prepare-commit-msg` hook still exist; only the checkbox from the PR is removed.
- **RT-3.** An HTML comment in the template names which check covers each removed box — DCO for signing, `Governance: PR Title Lint` for the title, CI for the tests — so nobody looks for them in the body. Attributing all three to the body lint would be false: it reads text.

## Workflow Requirements

The workflow must re-trigger when editing the body and validate the issue by what GitHub actually links.

1. **W1. `edited` trigger.** Already in place: `pr-metadata.yml:38-39` declares `types: [opened, edited, synchronize, reopened]` and `merge_group`, and editing provably re-runs the check (9 runs on one sha, 2026-10-23). Phase 0 records that evidence instead of re-adding the lines. Without `edited`, correcting the body does not re-run the check. "Re-run jobs" reuses the original payload with the old body, so the way to fix a red PR is to edit the body, not re-execute.
2. **W2. Concurrency — withdrawn.** `cancel-in-progress` stays `false` (`pr-metadata.yml:49`; rationale at `:41-46`). A cancelled run is not success for a required check, so `true` can leave `Governance: PR Body Lint` with no verdict for the body being merged. The group already exists; there is nothing to change.
3. **W3. Issue by API.** Query `closingIssuesReferences` of the PR via GraphQL from `github-script`. This is what GitHub will use to close the issue and avoids false positives like `#123` inside a code block. Uses the `pull-requests: read` permission the job already has. If the call fails, the job fails as `TOOLING ERROR`.
4. **W4. Checkout of the policy from the base ref is conserved.** A PR cannot rewrite the judge; the body is read from `context.payload`; bot exclusion by author; no-op for `merge_group`; and the name `Governance: PR Body Lint`.
5. **W5. Actions by SHA.** `checkout` and `github-script` today go by tag (`@v5`, `@v9`) and are pinned by SHA, aligned with the supply-chain PRD; `upload-artifact` (`@v7`) is pinned only if D2 keeps the artifact.

## Acceptance Criteria and Tests

The change is accepted when these cases, including negatives, pass and the script meets O1.

| #                            | Case                                                          | Expected Result                                                                                        |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A1                           | Empty body                                                    | Fails                                                                                                  |
| A2                           | Summary with only an HTML comment only                        | Fails                                                                                                  |
| A3 `Closes #` without number | Fails by R3                                                   |
| A4                           | One-line real Summary, linked issue, described tests          | Passes                                                                                                 |
| A5                           | `#123` written only inside a code block, without linked issue | Pending external verification: needs a real PR against the real API, so it cannot be satisfied offline |
| A6                           | Red PR; edit the body and fix it                              | The check re-runs alone and passes                                                                     |
| A7                           | Dependabot PR                                                 | Check skipped (Bot author)                                                                             |
| A8                           | Merge queue entry                                             | No-op in green                                                                                         |
| A9                           | GitHub API unavailable                                        | Fails with `TOOLING ERROR`, not as a violation                                                         |

## Metrics, with Proposed Targets

- Policy script logic lines: ≤ 80 (today ~510 with comments and report)
- Manual checkboxes in PR template: 2 (today 5)
- False reds from trigger that does not re-run: 0

## Migration Plan by Phases

Four small phases, each with its exit criterion; the check name does not change, so the ruleset is not touched.

1. **Phase 0 — Trigger: verification only.** `edited` and `merge_group` are already in production (`pr-metadata.yml:38-39`) and the edit-trigger is proven by 9 runs on one sha on 2026-10-23; concurrency stays `false` (W2 withdrawn). Exit: the evidence is recorded in `tasks.md` 1.1-1.3.
2. **Phase 1 — Template.** Remove the three redundant checkboxes and add the RT-3 comment. Exit: lockstep test remains green and the checklist has 2 checkboxes.
3. **Phase 2 — Reduced script.** Rewrite the policy per RP-1 to RP-5, update `.opencode/command/push-pr.md` in the same PR, and port the tests per the inventory in `tasks.md` 3.6. Exit: A1 to A4, A7 to A9 green and ≤ 80 lines of logic.
4. **Phase 3 — Issue by API.** Only if D3 says so: replace R2b's text-only check with `closingIssuesReferences` (W3), outside the pure seam, and finish the SHA pinning (W5). Exit: A5 reproduced on a real PR.

**Reversal:** each phase is an independent PR; `git revert` returns the previous behavior without touching the ruleset.

## Risks and Mitigations

The main risk is that, without length minimums, a trivial body passes; no check measures quality, so this is accepted.

| Risk                                                                    | Impact                                         | Mitigation                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Trivial bodies ("n/a") pass without character minimums                  | Less information in the PR                     | Accepted risk: quality is judged by review; the check only detects what is empty    |
| Rewriting introduces regressions without the current test corpus        | False greens or reds                           | Port the cases corresponding to R2b, R2c and R3 before deleting old code            |
| `closingIssuesReferences` may take time to reflect a newly linked issue | False red right after editing                  | Test in Phase 3; if it occurs, a short retry before failing                         |
| Close keywords only work toward the default branch                      | PRs to release branches do not link            | Today all PRs go to `main`; review if release branches appear                       |
| GitHub API failure or rate limit                                        | Check red unrelated to author                  | `TOOLING ERROR` message distinct from a violation; the author can re-run by editing |
| Changing the job name                                                   | Merge blocked waiting for a non-existent check | The name is frozen; there is proof it matches the ruleset                           |
| Author uses Re-run jobs and does not see changes                        | Confusion                                      | Document it in the contribution guide and in the check message                      |

## Open Decisions

Five decisions to make; none block Phases 0 and 1.

| #   | Decision                        | Options                                                          | Recommendation                                                                          |
| --- | ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| D1  | Where the policy lives          | Script in `scripts/ci` or inline in the workflow                 | Script: the PR can modify the workflow; the script is read from the base ref            |
| D2  | Triaging report                 | Maintain `report.json` and 14-day artifact, or only Step Summary | Only Step Summary: the message already names rule and section                           |
| D3  | PRs without issue (docs, chore) | Always require issue, or allow `N/A` with a justification phrase | Decide based on how many PRs of that type exist; today the template says it's mandatory |
| D4  | Linked issue                    | Only API, or API with regex as backup                            | Only API, to not maintain two paths                                                     |
| D5  | Fix actions by SHA              | Now, or together with the supply chain PRD                       | Now in this flow, because the workflow is already being touched                         |
