# pr-body-lint-governance Specification

## Purpose

Enforces that a pull request body actually carries the information the team's PR template asks for, by applying a
deterministic normalization-and-evaluation policy to the body and failing a required status check when the
traceability sections are absent or hollow — so "PR opened with the template untouched" stops being a mergeable
state.

## Requirements

### Requirement: Normalization runs before any rule is evaluated

The body check SHALL evaluate a normalized form of the body. Section structure is resolved **first**, on the raw
body: the document is split on its `##` headings, and each section's content is then normalized independently by
applying these transformations in order:

1. strip HTML comments
2. drop unchecked task-list lines
3. drop heading lines
4. drop `Closes #` occurrences that carry no digits (matched as `/Closes\s*#(?!\s*\d)/g`, so `Closes #123` survives)
5. unwrap checked checkbox markers
6. collapse whitespace

Splitting before normalizing is normative, not incidental: step 3 removes heading lines, so a pipeline that
normalized the whole body first would erase the structure it is supposed to measure. R2 is per section, which makes
this ordering load-bearing rather than cosmetic.

Two rules are explicit exceptions to "every rule reads the normalized text", and both are named because the pipeline
would otherwise destroy their input:

- R3 reads the **comment-stripped** body only. Step 4 deletes exactly the placeholder R3 exists to detect, so
  evaluating R3 on fully normalized text would make it a rule that can never fail.
- Checkbox presence (R2c and R4) is read as a **count carried out of normalization** — reported as
  `metrics.checkedCheckboxes` — because step 5 unwraps the markers and no marker survives for a rule to observe.

#### Scenario: Template heading text does not count as content

- **WHEN** a body consists only of the template's headings and guidance comments
- **THEN** the normalized text collapses to nothing
- **AND** the meaningful-content rule measures zero characters

#### Scenario: Checked checkbox adds no marker noise

- **WHEN** a body contains `- [x] Unit tests (vitest)`
- **THEN** the normalized form contains the item label without the checkbox marker
- **AND** the literal `[x]` sequence does not contribute to length measurement

#### Scenario: Unchecked task lines are dropped

- **WHEN** a body contains `- [ ] E2E tests (Playwright)` and nothing is checked
- **THEN** that line is absent from the normalized text

### Requirement: Policy rules R1 to R5 with explicit severities

The body check SHALL evaluate five rules and SHALL classify each as failure-severity or warning-severity:

| Rule | Condition                                                                                                                                    | Severity |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R1   | normalized meaningful content is at least 40 characters                                                                                      | fail     |
| R2a  | the `Summary` section carries at least 20 meaningful characters                                                                              | fail     |
| R2b  | the `Related Issue` section carries at least 1 meaningful character **and** either matches `#\d+` or reaches 20 characters                   | fail     |
| R2c  | the `How Has This Been Tested?` section carries at least 1 meaningful character **or** at least one checked checkbox **within that section** | fail     |
| R3   | `Closes #` never appears without a number                                                                                                    | fail     |
| R4   | at least one checkbox in the body is checked                                                                                                 | warning  |
| R5   | the body references at least one issue as `#` followed by digits                                                                             | warning  |

Warning-severity rules SHALL be reported but SHALL NOT cause the job to fail. The split is deliberate: R4 and R5
measure habits that vary legitimately between PR kinds (a docs-only PR may need no test checkbox; a refactor may
legitimately reference no issue), so treating them as failures would block correct work. R1, R2a, R2b, R2c and R3
measure completeness of the stated contract and are therefore failures.

R2 is per-section, not a single scalar threshold, because a scalar floor of 20 meaningful characters contradicts the
repository's own pull request template. The template instructs authors to write `Closes #<number>` in `Related Issue`,
which normalizes to 11 characters, and offers checkbox answers such as `Integration tests` (17) and `Manual testing`
(14) for the test section. A scalar 20-character floor would therefore fail every pull request that follows the
template exactly as written — blocking correct work rather than hollow work, which is the opposite of this capability's
purpose.

#### Scenario: Empty body fails R1

- **WHEN** a pull request is opened with an empty body
- **THEN** R1 fails
- **AND** the body job fails

#### Scenario: Untouched template fails R1

- **WHEN** a pull request is opened with the template body and nothing filled in
- **THEN** normalization reduces the body to zero meaningful characters
- **AND** R1 fails and the body job fails

#### Scenario: Hollow Summary fails R2a

- **WHEN** the `Summary` section exists but carries fewer than 20 meaningful characters
- **THEN** R2a fails for that section
- **AND** the body job fails

#### Scenario: Related Issue filled as the template instructs passes R2b

- **WHEN** the `Related Issue` section contains only `Closes #123`
- **THEN** it normalizes to 11 meaningful characters, below the `Summary` floor
- **AND** R2b passes, because the section carries an issue reference
- **AND** the body job is not failed by R2b

#### Scenario: A single checked test box satisfies R2c

- **WHEN** the `How Has This Been Tested?` section contains only a checked `[x] Integration tests` item from the
  template's list
- **THEN** R2c passes, because a checked box is an authored answer
- **AND** the body job is not failed by R2c

#### Scenario: Bare placeholder in Related Issue still fails

- **WHEN** the `Related Issue` section's only visible content is `Closes #` with no digits
- **THEN** R2b fails, because there is neither an issue reference nor 20 meaningful characters
- **AND** R3 fails as well

#### Scenario: Complete body passes every failure rule

- **WHEN** the body has more than 40 meaningful characters, `Summary` carries at least 20, `Related Issue` carries
  either an issue reference or 20 meaningful characters, `How Has This Been Tested?` carries authored content or a
  checked box, and no `Closes #` appears without a number
- **THEN** R1, R2a, R2b, R2c and R3 pass
- **AND** the body job succeeds regardless of R4 and R5

#### Scenario: Missing checked checkbox does not fail the job

- **WHEN** R1, R2a, R2b, R2c and R3 pass and no checkbox is checked
- **THEN** R4 is reported as a warning
- **AND** the body job still succeeds

#### Scenario: Missing issue reference does not fail the job

- **WHEN** R1, R2a, R2b, R2c and R3 pass and the body contains no `#` followed by digits
- **THEN** R5 is reported as a warning
- **AND** the body job still succeeds

### Requirement: Rule R3 is evaluated on comment-stripped text

The check for `Closes #` without a number SHALL be evaluated on the comment-stripped body, not on the raw body.

The PR template's "Related Issue" guidance comment itself contains the string `Closes #` as an example. Evaluating
R3 against the raw body would therefore fail every pull request, including ones whose author filled the section
correctly — a rule that fires on its own documentation is not enforcing traceability, it is enforcing the presence
of the guidance text.

#### Scenario: Template guidance comment does not trigger R3

- **WHEN** the body is the unfilled template, whose comment mentions `Closes #`
- **THEN** R3 does not fire on the comment
- **AND** R3 reports only on occurrences present in the comment-stripped text

#### Scenario: Authored placeholder triggers R3

- **WHEN** an author types `Closes #` in the visible body, outside any comment
- **THEN** R3 fails
- **AND** the body job fails

#### Scenario: Filled reference passes R3

- **WHEN** the body contains `Closes #123`
- **THEN** R3 passes

### Requirement: Core sections are located by canonicalized heading

The check SHALL require the three core sections `Summary`, `Related Issue` and `How Has This Been Tested?`, and SHALL
locate them by comparing canonicalized heading text — case-insensitive, with surrounding whitespace removed and
trailing punctuation ignored — so that a heading written `## summary` or `## Summary:` is recognized as the same
section.

The sections SHALL be matched against the document's heading structure: a section's content is the text between its
heading and the next heading of any level. A section with no content is treated as present but empty, which fails R2a
rather than being reported as missing.

Heading lines inside a fenced code block are content, never structure: every line a backtick or tilde fence spans —
`## ` and `### ` lines included — belongs to the surrounding section and never splits the document, as long as the
fence has a matching closer (an unterminated fence is not treated as suppressing structure, so a stray backtick cannot
swallow the headings that follow it).

When a canonical section heading appears more than once, the first occurrence is the section and later duplicates are
ignored — their content is not merged into the first occurrence — and the ignored duplicate headings are reported in
`metrics.duplicateSections`.

#### Scenario: Heading case and punctuation do not matter

- **WHEN** a body uses `## SUMMARY` or `## Summary:` instead of `## Summary`
- **THEN** the section is recognized as the canonical `Summary` section
- **AND** its content is measured normally

#### Scenario: Heading lines inside a fenced code block are content

- **WHEN** the `Summary` section contains a fenced code block whose lines include `## Not a heading`
- **THEN** those fenced heading lines are measured as part of `Summary` and do not create a section of their own
- **AND** the next real heading after the closed fence still locates its own section

#### Scenario: The first occurrence of a duplicated section heading wins

- **WHEN** a body contains two headings that canonicalize to `Summary`, the first carrying short content and the
  second long content
- **THEN** R2a measures the first occurrence, because duplicates are never merged into it
- **AND** the ignored duplicate heading is reported in `metrics.duplicateSections`

#### Scenario: Present but empty section

- **WHEN** a body contains the `Related Issue` heading followed immediately by another heading
- **THEN** the section is detected
- **AND** R2a fails for that section because it carries fewer than 20 meaningful characters

#### Scenario: Absent section

- **WHEN** a body contains no heading canonicalizing to `How Has This Been Tested?`
- **THEN** R2a, R2b or R2c fails for that section, according to which section is absent
- **AND** the report identifies the section as missing rather than empty

#### Scenario: Content of one section does not leak into another

- **WHEN** the `Summary` section is long and the `Related Issue` section is empty
- **THEN** R2a, R2b and R2c evaluate each section against its own content
- **AND** the empty section still fails

### Requirement: Bot-authored pull requests are skipped by author, never by actor

The body job SHALL be skipped when the pull request author is a bot, determined from the pull request's author
(`user.type` equal to `Bot`, or a login ending in `[bot]`), and SHALL NOT determine this from the actor that
triggered the run.

A skipped job is counted as passing for a required status check, which is the intended outcome here: Dependabot and
changesets PRs are generated with bodies that do not follow the human template, and blocking them would block the
dependency and release automation. The skip must key on the author because the author is a stable property of the
pull request, while the actor changes whenever a human edits, retries or re-runs a bot's PR — keying on the actor
would make the exemption flicker between runs for the same PR.

#### Scenario: Dependabot PR is not blocked

- **WHEN** a pull request authored by `dependabot[bot]` is opened
- **THEN** the body job is skipped
- **AND** the required check is satisfied
- **AND** the PR is not blocked by the body policy

#### Scenario: Human editing a bot PR does not shift the exemption

- **WHEN** a maintainer edits the body of a bot-authored pull request, making the actor a human
- **THEN** the body job is still skipped, because the author is still a bot
- **AND** the skip does not depend on who triggered the run

#### Scenario: Human author is never skipped

- **WHEN** a pull request is authored by a human, even one whose login contains the substring `bot`
- **THEN** the body job runs and applies the full policy

### Requirement: The verdict is a job failure, not a comment

The body job SHALL report a failing verdict by failing the job itself, so the required status check reports failure
and the merge is blocked. The check SHALL NOT rely on a pull request comment, a label, or any other artifact as its
enforcement mechanism.

A comment is advisory by nature — it can be ignored, deleted, or never read — and a label can be removed by whoever
wants to merge. The only mechanism the ruleset observes is the check conclusion.

#### Scenario: Failing policy blocks the merge

- **WHEN** the body violates R1, R2a, R2b, R2c or R3
- **THEN** the job concludes with failure
- **AND** the required status check `Governance: PR Body Lint` reports failure
- **AND** the pull request cannot be merged

#### Scenario: Passing policy allows the merge

- **WHEN** the body satisfies R1, R2a, R2b, R2c and R3
- **THEN** the job concludes with success
- **AND** the required check is satisfied

#### Scenario: Warnings accompany a passing verdict

- **WHEN** the body satisfies the failure rules but violates R4 or R5
- **THEN** the job concludes with success and the warnings are recorded in the report and the job summary
- **AND** the merge is not blocked by the warnings

### Requirement: Evaluation is deterministic and machine-readable

The policy SHALL produce a machine-readable report with `schemaVersion: 1` containing the pull request identity
(`number`, `author`, `draft`, `headSha`, `baseSha`), the applied `policy`, measured `metrics`, `failures`,
`warnings`, and the `verdict`.

The report SHALL be attached to the workflow run as an artifact named `pr-body-lint-report` with
`retention-days: 14`, published with `if: always()` so a failing run still uploads it, with
`include-hidden-files: true`, and with `if-no-files-found: warn`. The verdict SHALL also be written to the job
summary.

A report is required because a check conclusion is binary and carries no explanation: without the recorded metrics, a
contributor facing a red check cannot tell whether the failure came from length, from a section, or from the
`Closes #` rule, and an operator reviewing an anomalous block has no evidence to inspect. `if: always()` is what
makes it evidence rather than a success-path convenience.

If the report cannot be written or the policy throws, the job SHALL fail closed with a message that identifies the
failure as a tooling error rather than a policy violation, so an operator can distinguish a broken gate from an
invalid body. A gate that passes when it cannot run is indistinguishable from a gate that ran and approved.

#### Scenario: Failing run still publishes the report

- **WHEN** the body job fails
- **THEN** the report artifact is uploaded because the upload step runs with `if: always()`
- **AND** the report's `verdict` is `fail` and `failures` names the violated rules

#### Scenario: Report write failure fails closed

- **WHEN** writing `.tmp/pr-body-lint/report.json` throws
- **THEN** the job fails with a message that names the tooling error, not a policy rule
- **AND** the failure is distinguishable from a body that violates R1, R2 or R3

#### Scenario: Report identifies the measured values

- **WHEN** the report is read
- **THEN** it contains the measured metrics that produced the verdict alongside the failing rule identifiers
- **AND** the job summary shows the verdict and the failures without needing the artifact downloaded

#### Scenario: Evaluation is free of external state

- **WHEN** the same body is evaluated twice with the same policy
- **THEN** the verdict and metrics are identical
- **AND** no rule depends on network access, time of day, or previous runs

### Requirement: Policy and template are updated in lockstep

The core section names required by the policy SHALL match the headings of `.github/PULL_REQUEST_TEMPLATE.md`. A change
that renames, adds or removes a required section heading in the template SHALL update the policy in the same commit,
and a change to the policy's section list SHALL update the template in the same commit.

Because the check is a required status check, template drift is not cosmetic: renaming `## Related Issue` in the
template without updating the policy makes the section unreachable for every PR, and every PR then fails R2a, R2b or R2c while
contributors follow the template exactly as written. A test that asserts the two lists agree SHALL exist and SHALL
run in the repository's existing script test suite.

#### Scenario: Template heading renamed without policy update

- **WHEN** a heading required by the policy is renamed in the template alone
- **THEN** the lockstep test fails
- **AND** the script test step reports failure on the pull request, so the drift cannot land unnoticed

#### Scenario: Policy section list extended without template update

- **WHEN** a new required section is added to the policy but not to the template
- **THEN** the lockstep test fails
- **AND** the script test step reports failure on the pull request, so the drift cannot land unnoticed

#### Scenario: Lockstep test runs where a pull request cannot skip it

- **WHEN** a pull request changes the template or the policy
- **THEN** `npm run test:scripts` executes the lockstep assertion between the policy's section list and the template
  headings
- **AND** it runs in CI, so the assertion is not dependent on a contributor remembering to run it locally

### Requirement: Required-check contract name and no label bypass

The required status check context SHALL be exactly `Governance: PR Body Lint`. The policy SHALL NOT honor any
pull-request label that exempts the body check, and no such label SHALL be introduced.

A label bypass is self-service: anyone able to apply a label can remove the gate for their own PR, so the control
would degrade to a convention. The exemption that exists is the author-based bot skip, which is narrow, derived from
data the author does not choose per-run, and visible in the run log. The only human bypass is the ruleset's bypass
actor, which is a repository-administerable, auditable setting rather than something a contributor can grant
themselves.

#### Scenario: Label does not exempt the body check

- **WHEN** a pull request fails the body policy and carries any label
- **THEN** the job still fails
- **AND** the required status check still reports failure

#### Scenario: Check name is the frozen contract

- **WHEN** an administrator adds the body check to ruleset 21227644
- **THEN** the context added is exactly `Governance: PR Body Lint`
- **AND** the check is attached only after it has reported at least once, because a required context that has never
  reported produces `Expected — Waiting for status to be reported` on every pull request

#### Scenario: Bypass remains an administrative action

- **WHEN** someone wants to merge a pull request that fails the body policy
- **THEN** the available bypass is the ruleset bypass actor under administrative control
- **AND** no repository-level label provides that effect

### Requirement: The policy implementation is read from the base ref

The body check SHALL execute the policy module from the pull request's base ref (`pull_request.base.sha`), not from
the pull request's own tree.

A required check that runs code shipped by the pull request it judges is self-modifying: the same pull request can
rewrite the policy, or replace the module, and turn its own verdict green. That is the label-bypass hole described
above with a smaller diff, and it is not covered by the no-label requirement because no label is involved. Reading
from the base ref means a policy change is evaluated with the policy that is already trusted on the base branch, which
is also what makes the lockstep rule meaningful: the template and the policy can only be proven consistent once they
are both on the base branch.

The guarantee is scoped: a pull request cannot rewrite the **module** and thereby change its own verdict, but it can
edit the workflow that calls it. That residue is a reviewable one-line diff rather than a policy edit, and is gated by
code-owner review, not by the base-ref read alone.

The policy module path SHALL be listed in `.github/CODEOWNERS` under the same team that owns `.github/**`, so a change
to the judging logic requires the same review as a change to the workflow that calls it.

#### Scenario: A pull request cannot rewrite its own policy

- **WHEN** a pull request modifies `scripts/ci/pr-body-lint.mjs` to pass everything
- **THEN** the check still evaluates the body with the module present at the base ref
- **AND** the modification to the module cannot alter that pull request's verdict

#### Scenario: Editing the workflow rather than the module

- **WHEN** a pull request edits `.github/workflows/pr-metadata.yml` to stop calling the policy module
- **THEN** the check is still governed by the workflow definition from the pull request's own tree
- **AND** the change is caught by code-owner review, which the module path shares with `.github/**`

#### Scenario: Policy and template changes land together

- **WHEN** a pull request renames a required section heading in the template and updates the policy in the same commit
- **THEN** the pull request's own body is judged with the pre-existing policy
- **AND** it passes whenever the author writes that body using the headings the pre-existing policy requires, so the
  maintenance pull request is not blocked by the change it carries

### Requirement: Draft pull requests are not exempt

The body check SHALL evaluate draft pull requests exactly like ready-for-review ones. It SHALL NOT skip drafts.

Drafts cannot be merged, so evaluating them harms nothing, and exempting them would create a status transition at
"ready for review" time that is easy to misread as a flake. The check's meaning stays constant: it describes the body
as it stands.

#### Scenario: Draft with an incomplete body reports failure

- **WHEN** a draft pull request has an empty body
- **THEN** the body job runs and reports failure
- **AND** the pull request cannot be marked ready for review and merged without fixing the body
