## Purpose

Local DCO trailer validation in commit-msg and pre-push hooks -- fast first-pass Signed-off-by check that catches missing trailers before code reaches CI, complementing CI KineticCafe enforcement as the non-bypassable backstop.

## ADDED Requirements

### Requirement: commit-msg hook validates DCO trailer presence

The commit-msg hook SHALL validate that every non-merge commit contains a Signed-off-by: trailer before commitlint runs.

#### Scenario: Commit with valid DCO trailer

- **WHEN** a developer runs git commit with -S and -s flags
- **THEN** the hook SHALL detect Signed-off-by: trailer and proceed to commitlint

#### Scenario: Commit missing DCO trailer

- **WHEN** a developer runs git commit with -S flag only (no -s flag)
- **THEN** the hook SHALL reject the commit with a message instructing to use -s flag and exit non-zero

#### Scenario: Merge commit skipped

- **WHEN** the commit is a merge commit (detected via --no-merges or merge commit message pattern)
- **THEN** the hook SHALL skip DCO validation and proceed directly to commitlint

#### Scenario: commit amend re-runs DCO check

- **WHEN** a developer amends a commit
- **THEN** the commit-msg hook SHALL re-run DCO validation on the resulting commit message, rejecting it if Signed-off-by: is absent

### Requirement: DCO trailer format is case-sensitive exact match

The hook SHALL match Signed-off-by: as a case-sensitive literal string.

#### Scenario: Correct case matches

- **WHEN** commit message contains Signed-off-by: Name <email>
- **THEN** the check SHALL pass

#### Scenario: Incorrect case rejected

- **WHEN** commit message contains signed-off-by: or Signed Off By:
- **THEN** the check SHALL reject the commit

### Requirement: DCO presence in commit message

The hook SHALL verify that Signed-off-by: appears anywhere in the commit message. The local check is a full-message grep for presence; CI's KineticCafe parser is the authoritative enforcer of trailer position and format.

#### Scenario: Signed-off-by present in message

- **WHEN** commit message contains Signed-off-by: Name <email> (anywhere in the message)
- **THEN** the check SHALL pass

#### Scenario: Missing trailer

- **WHEN** commit message has no Signed-off-by: line anywhere
- **THEN** the check SHALL reject with guidance to amend

### Requirement: pre-push hook re-validates DCO over pushed commit range

The pre-push hook SHALL re-check DCO trailers for all non-merge commits in the push range.

#### Scenario: All commits in push have DCO

- **WHEN** every non-merge commit in the push range contains Signed-off-by:
- **THEN** the hook SHALL pass and proceed to vitest scoped tests

#### Scenario: One or more commits missing DCO

- **WHEN** any non-merge commit in the push range lacks Signed-off-by:
- **THEN** the hook SHALL reject the push listing which commits are missing the trailer and exit non-zero

#### Scenario: Push to non-main branch

- **WHEN** pushing to any branch (not just main)
- **THEN** the hook SHALL still validate DCO for all commits in the push range

### Requirement: Hook preserves existing commitlint behavior

The commit-msg hook SHALL run DCO validation BEFORE commitlint. If DCO passes commitlint SHALL run as before. The pre-push hook SHALL run DCO re-check BEFORE vitest scoped tests.

#### Scenario: DCO passes commitlint runs

- **WHEN** DCO check passes in commit-msg
- **THEN** commitlint SHALL execute as the next step

#### Scenario: DCO fails commitlint skipped

- **WHEN** DCO check fails in commit-msg
- **THEN** commitlint SHALL NOT execute and the commit SHALL be rejected

#### Scenario: DCO passes vitest runs

- **WHEN** DCO re-check passes in pre-push
- **THEN** vitest scoped tests SHALL execute as the next step

#### Scenario: DCO fails vitest skipped

- **WHEN** DCO re-check fails in pre-push
- **THEN** vitest scoped tests SHALL NOT execute and the push SHALL be rejected
