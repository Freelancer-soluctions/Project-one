# pre-commit-secret-gate Specification

## Purpose

Detect secrets on the staged content of every commit inside the `pre-commit` hook, so a secret is caught before it
enters local history and never has to be rewritten out of it, while the hook still never blocks on tooling problems.

## Requirements

### Requirement: Staged-only secret scope

The `pre-commit` hook SHALL scan only the content staged for the commit being created. Content that is not staged
SHALL NOT influence the outcome, and the scan SHALL NOT traverse the repository history.

#### Scenario: Staged secret blocks the commit

- **WHEN** a file containing a detectable secret is staged and a commit is created
- **THEN** the hook exits non-zero
- **AND** the commit is blocked until the secret is removed or the file is unstaged

#### Scenario: Unstaged secret does not block the commit

- **WHEN** a detectable secret exists only in an unstaged file (or outside the staging area)
- **THEN** the hook does not report it
- **AND** the commit is created

### Requirement: Redacted finding output

The hook SHALL report a finding without printing the secret value itself: only the rule, the file and the location
SHALL be shown.

#### Scenario: Secret value is never printed

- **WHEN** the staged scan detects a secret
- **THEN** the hook output identifies the finding without containing the secret value

### Requirement: Fail-open on tool failure

If the secret scanner is unavailable or fails for a reason unrelated to a finding, the hook SHALL warn visibly and
allow the commit.

#### Scenario: Scanner binary unavailable

- **WHEN** the scanner cannot be executed (binary missing, launch error)
- **THEN** the commit proceeds
- **AND** a visible warning states that no secret scan ran and why

#### Scenario: Finding still blocks

- **WHEN** the scanner runs successfully and reports a staged secret
- **THEN** the commit is blocked (fail-open applies to tool failure only, never to findings)

### Requirement: Latency budget under five seconds

The staged secret scan SHALL complete within 5 seconds for a typical commit, measured on the reference commit used
by the change, so the pre-commit loop stays fast.

#### Scenario: Reference commit timing

- **WHEN** the hook runs on the reference commit
- **THEN** the secret scan stage completes in under 5 seconds

#### Scenario: Markdown-only commit stays cheap

- **WHEN** a commit only stages documentation files
- **THEN** the stage completes without scanning source trees or history

### Requirement: Captured output shown only on failure

The output of each fast scan in the blocking block SHALL be captured and displayed only when that scan fails, so a
green run does not interleave the tools' output in the commit terminal.

#### Scenario: All fast scans green

- **WHEN** every blocking fast scan passes
- **THEN** no scan output is interleaved in the terminal beyond the stage status lines

#### Scenario: One scan fails

- **WHEN** a blocking fast scan fails
- **THEN** its captured output is printed so the developer can act on it

### Requirement: SAST is not part of the pre-commit gate

The `pre-commit` hook SHALL NOT run SAST. Diff-scoped SAST requires a baseline commit and therefore belongs to the
`pre-push` stage (capability `sast-diff-scanning`); the pre-commit hook SHALL only run the staged secret scan in
its blocking block, plus the advisory layers.

#### Scenario: Source commit does not launch Semgrep

- **WHEN** a commit stages JavaScript or TypeScript changes
- **THEN** no Semgrep process and no Semgrep container are started by the `pre-commit` hook

#### Scenario: Removed SAST entry point is gone

- **WHEN** the hook's blocking block is inspected
- **THEN** it contains no `sast:semgrep` invocation and no `semgrep-staged.ps1` reference
