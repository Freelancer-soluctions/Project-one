# Spec Delta — pr-body-lint-governance

Replaces the evaluative core of the capability — the length floors, the two warning rules, the
fence-aware section locator and the five-rule verdict — with the reduced policy of
`PRDS/Implificación-del-PR-Body-Lint-y-la-plantilla-de-PR.md`.

The governance scaffolding this change does not touch is deliberately absent from this delta, so
those requirements keep their current text in `openspec/specs/pr-body-lint-governance/spec.md`:
R3's comment-stripped evaluation, the author-based bot skip, the frozen check name and the no-label
rule, the base-ref read, the template lockstep and the no-exemption of drafts.

Two decisions were open when this delta was drafted; the maintainer resolved both on 2026-10-23 and the
text below records the resolution rather than a fork: **D2** drops `report.json` and the 14-day
artifact, so `Evaluation is deterministic and machine-readable` is implemented as summary-only, and
**D3** keeps R2b text-only, so no rule queries the API and an issue-less pull request stays valid.

## REMOVED Requirements

### Requirement: Policy rules R1 to R5 with explicit severities

### Requirement: Core sections are located by canonicalized heading

### Requirement: Evaluation is deterministic and machine-readable

## MODIFIED Requirements

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

## ADDED Requirements

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
