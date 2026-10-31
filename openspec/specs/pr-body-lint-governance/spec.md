# pr-body-lint-governance Specification

## Purpose

Enforces that a pull request body actually carries the information the team's PR template asks for, by applying a
deterministic normalization-and-evaluation policy to the body and failing a required status check when the
traceability sections are absent or hollow — so "PR opened with the template untouched" stops being a mergeable
state.

## Requirements

### Requirement: Normalization runs before any rule is evaluated

The body check SHALL evaluate a stripped form of the body, never the raw text. Section structure
SHALL be resolved **first**, on the raw body, because the strip deletes the heading lines that
define it. The strip SHALL apply these transformations in order:

1. strip HTML comments
2. drop unchecked task-list lines
3. drop heading lines
4. drop `Closes #` occurrences that carry no digits (matched as `/Closes\s*#(?!\s*\d)/g`, so `Closes #123` survives)
5. unwrap checked checkbox markers
6. collapse whitespace

The strip answers one question — "is anything left?" — and SHALL NOT be used to measure how much
was written: no rule SHALL derive a verdict from the length of the stripped text, and no minimum
length SHALL exist anywhere in the policy.

One rule is an explicit exception to "every rule reads the stripped text", named because the
pipeline would otherwise destroy its input: R3 reads the **comment-stripped** body only, since step
4 deletes exactly the placeholder R3 exists to detect. Checked-box presence is the mirror case: R2c
reads the **raw** section text, because step 5 unwraps the markers and no marker survives the strip.

#### Scenario: Template heading text does not count as content

- **WHEN** a body consists only of the template's headings and guidance comments
- **THEN** the stripped text collapses to nothing
- **AND** the `EMPTY_BODY` diagnostic sees nothing to judge

#### Scenario: Checked checkbox adds no marker noise

- **WHEN** a body contains `- [x] Unit tests (vitest)`
- **THEN** the stripped form contains the item label without the checkbox marker
- **AND** the literal `[x]` does not survive the strip

#### Scenario: Unchecked task lines are dropped

- **WHEN** a body contains `- [ ] E2E tests (Playwright)` and nothing is checked
- **THEN** that line is absent from the stripped text

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

The body job SHALL report a failing verdict by failing the job itself, so the required status check
`Governance: PR Body Lint` reports failure and the merge is blocked. The check SHALL NOT rely on a
pull request comment, a label, or any other artifact as its enforcement mechanism.

A comment is advisory by nature — it can be ignored, deleted, or never read — and a label can be
removed by whoever wants to merge. The only mechanism the ruleset observes is the check conclusion.

No warning-severity rule survives this change: R4 and R5 are removed with the length floors, so the
`warnings` array is always empty and nothing SHALL soften a passing verdict. A body that clears the
`EMPTY_BODY` diagnostic, R2a, R2b, R2c and R3 SHALL pass with no warnings recorded. The third
scenario below keeps its name from the previous policy — so the archive reads as a modification of a
governance requirement rather than its deletion — while its body states the post-change fact.

#### Scenario: Failing policy blocks the merge

- **WHEN** the body violates `EMPTY_BODY`, R2a, R2b, R2c or R3
- **THEN** the job concludes with failure
- **AND** the required status check `Governance: PR Body Lint` reports failure
- **AND** the pull request cannot be merged

#### Scenario: Passing policy allows the merge

- **WHEN** the body satisfies `EMPTY_BODY`, R2a, R2b, R2c and R3
- **THEN** the job concludes with success
- **AND** the required check is satisfied

#### Scenario: Warnings accompany a passing verdict

- **WHEN** a body satisfies every failure rule
- **THEN** the verdict is `pass`
- **AND** the `warnings` array is present but always empty, because no warning-severity rule remains —
  nothing accompanies the verdict and nothing can soften it

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

### Requirement: Empty body fails on emptiness, not on length

The body check SHALL fail a pull request whose body is empty once HTML comments, unchecked task-list
lines and heading lines have been stripped, and SHALL express that failure as its own named
diagnostic, `EMPTY_BODY`. The condition SHALL be emptiness — "the author wrote nothing at all" — and
SHALL NOT be a minimum character count: a body carrying a single character of authored text clears it.

`EMPTY_BODY` is a diagnostic, not a verdict of its own. R2a, R2b and R2c already require their
sections to carry stripped content, so a body that passes them is necessarily non-empty and
`EMPTY_BODY` can never fire alone. Its job is to name the real cause: an empty body or an untouched
template would otherwise surface as three separate "missing section" failures, which tells the author
nothing about the one thing they have to do. It therefore does not inherit the removed R1's reach — it
replaces R1's diagnostic value, not its gate.

This replaces the removed 40-character body floor and the removed 20-character `Summary` floor. Both
measured a proxy rather than quality: `aaaaaaaaaaaaaaaaaaaa` satisfied them, while they turned a
threshold into something authors learned to pad. Emptiness is the one whole-body signal those floors
carried that is still worth keeping, and it is the only one kept. It replaces a proxy; it does not
reintroduce one.

The diagnostic SHALL also fire on the unfilled template, which strips to nothing, so "PR opened with
the template untouched" stays a non-mergeable state.

#### Scenario: Empty body fails with `EMPTY_BODY`

- **WHEN** a pull request is opened with an empty body
- **THEN** the `EMPTY_BODY` diagnostic fails
- **AND** the body job fails

#### Scenario: Untouched template fails the emptiness diagnostic

- **WHEN** a pull request is opened with the template body and nothing filled in
- **THEN** stripping reduces the body to nothing
- **AND** `EMPTY_BODY` fires and the body job fails

#### Scenario: One character of authored text clears the emptiness diagnostic

- **WHEN** the `Summary` carries `n/a` and the other sections carry content
- **THEN** `EMPTY_BODY` does not fire
- **AND** no length rule exists that could fail the body for being short

### Requirement: Section rules: Summary, issue reference and tested section

The body check SHALL evaluate three section rules, all of them failure-severity, none of them a
length floor:

| Rule | Condition                                                                                                                                       | Severity |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R2a  | `Summary` is present and its stripped content is non-empty                                                                                      | fail     |
| R2b  | `Related Issue` is present and its stripped content is non-empty                                                                                | fail     |
| R2c  | `How Has This Been Tested?` is present and either its stripped content is non-empty **or** at least one checkbox within that section is checked | fail     |

A section whose heading is present but whose content is empty SHALL be reported as present and
empty; a section whose heading is absent SHALL be reported as missing. The two SHALL NOT be
conflated.

R2b SHALL NOT require a particular shape of reference: whether a pull request with no linked issue
fails is design decision D3 and is not decided by this requirement. The
reference-or-twenty-characters disjunction it used to carry is removed because half of it was a
length rule.

The check SHALL NOT evaluate any warning-severity rule. R4 ("at least one checkbox in the body is
checked") and R5 ("the body references an issue as `#` followed by digits") are removed: R5
duplicated R2b, and R4 measured a habit the template no longer asks authors to attest once its
redundant pre-merge boxes are gone. A body that clears `EMPTY_BODY`, R2a, R2b, R2c and R3 SHALL
therefore pass with no warnings recorded.

#### Scenario: Hollow Summary fails R2a without any character floor

- **WHEN** the `Summary` heading exists and carries only a guidance comment
- **THEN** R2a fails for that section
- **AND** the body job fails

#### Scenario: Related Issue filled as the template instructs passes R2b

- **WHEN** the `Related Issue` section contains only `Closes #123`
- **THEN** R2b passes, because the section carries authored content
- **AND** the body job is not failed by R2b

#### Scenario: Bare placeholder in Related Issue still fails

- **WHEN** the `Related Issue` section's only visible content is `Closes #` with no digits
- **THEN** the strip removes that placeholder, leaving the section empty
- **AND** R2b fails
- **AND** R3 fails as well

#### Scenario: A single checked test box satisfies R2c

- **WHEN** the `How Has This Been Tested?` section contains only a checked `[x] Integration tests`
  item from the template's list
- **THEN** R2c passes, because a checked box is an authored answer
- **AND** the body job is not failed by R2c

#### Scenario: An unchecked test box does not satisfy R2c

- **WHEN** the `How Has This Been Tested?` section contains only unchecked boxes
- **THEN** R2c fails for that section

#### Scenario: A checked box in another section does not satisfy R2c

- **WHEN** a box is checked under `Type / Scope` and the `How Has This Been Tested?` section is empty
- **THEN** R2c fails, because the box belongs to a different section

#### Scenario: Complete body passes every failure rule

- **WHEN** the body is non-empty, `Summary` carries text, `Related Issue` carries text,
  `How Has This Been Tested?` carries content or a checked box, and no `Closes #` appears without a
  number
- **THEN** `EMPTY_BODY`, R2a, R2b, R2c and R3 all pass
- **AND** the body job succeeds

#### Scenario: No warning accompanies a passing body

- **WHEN** a body clears `EMPTY_BODY`, R2a, R2b, R2c and R3
- **THEN** the verdict is `pass`
- **AND** no warning-severity rule exists that could be recorded alongside it

### Requirement: Core sections are located by a single `##` heading scan

The body check SHALL require the three core sections `Summary`, `Related Issue` and
`How Has This Been Tested?`, and SHALL locate them by scanning the raw body once with a single
regular expression over `##` headings. A section's content SHALL be the text between its heading
and the next heading of any level. Headings SHALL be compared after canonicalization —
case-insensitive, surrounding whitespace removed, trailing punctuation ignored — so `## summary` and
`## Summary:` resolve to the same section.

When a canonical heading appears more than once, the first occurrence SHALL be the section and
later duplicates SHALL be ignored: their content SHALL NOT be merged into the first occurrence, and
no duplicate-section metric SHALL be produced.

The scan SHALL be fence-blind: a line that starts with `##` splits the document even when a code
fence surrounds it. That is an accepted regression of the reduced policy, recorded rather than
hidden — a fenced `## ...` line inside a section ends that section, and the lines after it are no
longer measured as part of it. The trade is deliberate: fence masking existed for a case real pull
requests do not produce, and it was the single largest block of code in the policy.

#### Scenario: Heading case and punctuation do not matter

- **WHEN** a body uses `## SUMMARY` or `## Summary:` instead of `## Summary`
- **THEN** the section is recognized as the canonical `Summary` section
- **AND** its content is measured normally

#### Scenario: Present but empty section

- **WHEN** a body contains the `Related Issue` heading followed immediately by another heading
- **THEN** the section is detected
- **AND** R2b fails for that section because it carries nothing

#### Scenario: Absent section

- **WHEN** a body contains no heading canonicalizing to `How Has This Been Tested?`
- **THEN** R2c fails for that section
- **AND** the failure identifies the section as missing rather than empty

#### Scenario: Content of one section does not leak into another

- **WHEN** the `Summary` section is long and the `Related Issue` section is empty
- **THEN** R2a, R2b and R2c evaluate each section against its own content
- **AND** the empty section still fails

#### Scenario: A fenced `##` line splits the document

- **WHEN** the `Summary` section contains a fenced code block whose lines include `## Not a heading`
- **THEN** that line is treated as a section boundary
- **AND** the lines after it are no longer measured as part of `Summary`
- **AND** a later real `## Related Issue` heading still locates its own section

#### Scenario: The first occurrence of a duplicated heading wins

- **WHEN** a body contains two headings that canonicalize to `Summary`, the first carrying short
  content and the second long content
- **THEN** the first occurrence is the section, because duplicates are never merged into it
- **AND** no duplicate-section metric is produced

### Requirement: The result is published as the job summary and fails closed on tooling errors

The policy SHALL produce a deterministic result carrying the `verdict`, the `failures` (each naming its
rule and its section) and the `warnings` array, and it SHALL publish that result to the job summary —
the only reporting surface (D2). No `report.json` SHALL be written and no artifact SHALL be uploaded,
so no pull request identity, `policy` block or `metrics` object SHALL be published, and no deleted rule
identifier (R1, R4, R5) SHALL appear anywhere in the output. The same body evaluated twice with the
same policy SHALL yield an identical result.

A check conclusion is binary and carries no explanation, which is why the verdict and the failures are
written to the summary. If the policy or the summary path throws, the job SHALL fail closed with a
message that identifies a tooling error rather than a policy violation, so an operator can distinguish
a broken gate from an invalid body: a gate that passes when it cannot run is indistinguishable from a
gate that ran and approved.

#### Scenario: Failing run still publishes the summary

- **WHEN** the body job fails
- **THEN** the summary is published with the `fail` verdict and the failures
- **AND** nothing has to be downloaded to read them

#### Scenario: Summary write failure fails closed

- **WHEN** publishing the job summary throws
- **THEN** the job fails with a message that names the tooling error, not a policy rule
- **AND** the failure is distinguishable from a body that violates `EMPTY_BODY`, R2a, R2b, R2c or R3

#### Scenario: Summary names the failing rules

- **WHEN** the summary is read
- **THEN** the failing rule identifiers travel with it
- **AND** the verdict and the failures are visible without needing anything downloaded

#### Scenario: Evaluation is free of external state

- **WHEN** the same body is evaluated twice with the same policy
- **THEN** the verdict and the failures are identical
