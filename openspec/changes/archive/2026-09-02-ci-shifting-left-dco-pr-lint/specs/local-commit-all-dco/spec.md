## Purpose

The @git-manager /commit-all command produces DCO-compliant commits by always adding the Signed-off-by: Name <email> trailer per KineticCafe rules, with docs updated accordingly. This is defense-in-depth: even when git config commit.signoff true is set on the machine, the prompt rule ensures the -s flag is explicit so the trailer is always present regardless of local git config.

## ADDED Requirements

### Requirement: /commit-all commits include Signed-off-by trailer

Every non-merge commit created by /commit-all SHALL include the trailer Signed-off-by: <Name> <email> in KineticCafe format (case-sensitive exact match, Signed-off-by with capital S-o-b, matching the commit author/committer identity).

#### Scenario: Commit created via /commit-all includes trailer

- **WHEN** @git-manager executes /commit-all to create a commit
- **THEN** the commit message SHALL contain Signed-off-by: <Name> <email> as a trailer, and the commit SHALL be created with the -s flag (signoff) so the trailer matches KineticCafe DCO format

#### Scenario: -s flag is always added even when auto-signoff config is absent

- **WHEN** /commit-all is invoked on a machine where git config commit.signoff true is NOT set
- **THEN** @git-manager SHALL still use git commit -s (explicit signoff flag) so the Signed-off-by trailer is present in the commit message

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
- **THEN** the commit SHALL still include Signed-off-by: <Name> <email> because the -s flag is explicitly passed by the git-manager prompt rule

#### Scenario: Git hooks are never skipped

- **WHEN** /commit-all creates a commit
- **THEN** the git commit command SHALL NOT include any flag that bypasses hook execution, ensuring all hooks (commit-msg DCO check, commitlint) still run

### Requirement: docs reflect the /commit-all DCO rule

The following documentation files SHALL be updated to document the DCO trailer format, the git commit -S -s convention, and the auto-signoff recommendation:

- docs/learning/ci-cd/01-git-y-yaml.md
- docs/learning/ci-cd/05e-pr-metadata-governance.md
- docs/CONTEXT-CICD.md

#### Scenario: Developer reads 01-git-y-yaml to learn the signed commit convention

- **WHEN** a developer reads docs/learning/ci-cd/01-git-y-yaml.md
- **THEN** they SHALL find documentation of the git commit -S -s convention, the KineticCafe Signed-off-by trailer format, and the recommendation to set git config --global commit.signoff true

#### Scenario: Developer reads 05e-pr-metadata-governance for cross-references

- **WHEN** a developer reads docs/learning/ci-cd/05e-pr-metadata-governance.md
- **THEN** they SHALL find cross-references to the local DCO hooks (commit-msg + pre-push re-check) and the /commit-all git-manager DCO rule, noting that DCO is enforced at 3 layers: local hooks (L1/L2), /commit-all prompt rule, and CI KineticCafe (L3)

#### Scenario: Developer reads CONTEXT-CICD shifting-left section

- **WHEN** a developer reads docs/CONTEXT-CICD.md section 11 (shifting-left strategy)
- **THEN** they SHALL find a note about auto-signoff config and the /commit-all prompt rule as defense-in-depth complementing CI enforcement
