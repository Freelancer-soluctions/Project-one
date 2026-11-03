# local-commit-all-dco Delta

## MODIFIED Requirements

### Requirement: /commit-all commits include Signed-off-by trailer

Every non-merge commit created by /commit-all SHALL include the trailer Signed-off-by: <Name> <email> in KineticCafe format (case-sensitive exact match, Signed-off-by with capital S-o-b, matching the commit author/committer identity). /commit-all is executed directly by the primary agent (the principal); the retired `git-manager` agent no longer exists.

#### Scenario: Commit created via /commit-all includes trailer

- **WHEN** the primary agent executes /commit-all to create a commit
- **THEN** the commit message SHALL contain Signed-off-by: <Name> <email> as a trailer, and the commit SHALL be created with the -s flag (signoff) so the trailer matches KineticCafe DCO format

#### Scenario: -s flag is always added even when auto-signoff config is absent

- **WHEN** /commit-all is invoked on a machine where git config commit.signoff true is NOT set
- **THEN** the primary agent SHALL still use git commit -s (explicit signoff flag) so the Signed-off-by trailer is present in the commit message

#### Scenario: -S flag (SSH signing) is always included

- **WHEN** /commit-all creates a commit
- **THEN** the commit SHALL use git commit -S -s (both SSH signing and signoff flags) per the existing repo convention for signed commits

#### Scenario: Merge commits are excluded

- **WHEN** /commit-all processes a merge commit
- **THEN** the signoff requirement MAY be skipped for merge commits, consistent with the commit-msg hook behavior for merges

### Requirement: /commit-all never bypasses signoff

/commit-all SHALL NOT skip git hooks and SHALL NOT create a commit lacking the Signed-off-by trailer, even when git config commit.signoff true is absent on the machine. All existing hooks (commit-msg DCO check, commitlint) SHALL remain active for every commit.

#### Scenario: Auto-signoff config absent on a fresh machine

- **WHEN** a developer runs /commit-all on a machine without git config commit.signoff true
- **THEN** the commit SHALL still include Signed-off-by: <Name> <email> because the -s flag is explicitly passed by the /commit-all security rule (`.opencode/command/commit-all.md`)

#### Scenario: Git hooks are never skipped

- **WHEN** /commit-all creates a commit
- **THEN** the git commit command SHALL NOT include any flag that bypasses hook execution, ensuring all hooks (commit-msg DCO check, commitlint) still run
