# ruleset-expansion Specification

## Purpose

Expands the GitHub merge-boundary ruleset (id 21227644) with required reviews, linear history, force-push protection, required status checks, and CODEOWNERS enforcement to reach Level 3 merge-gate maturity.

## Requirements

### Requirement: Ruleset updated via full PUT replace

The system SHALL update ruleset 21227644 via a complete PUT (full replace) carrying all merge-boundary rules, preserving existing protections and adding the new ones.

#### Scenario: Admin-2 applies full PUT

- **WHEN** Admin-2 issues a PUT /repos/{owner}/{repo}/rulesets/21227644 with the full ruleset body
- **THEN** the ruleset is replaced atomically with all required rules active

### Requirement: Required reviews

The ruleset SHALL require at least one approving review, dismiss stale approvals on new commits, and require approval of the last pushed commit before merge.

#### Scenario: Merge without approval

- **WHEN** a PR has zero approving reviews
- **THEN** the ruleset blocks the merge

#### Scenario: Stale approval dismissed

- **WHEN** a new commit is pushed after an approval
- **THEN** the previous approval is dismissed and a fresh approval is required

### Requirement: Required linear history

The ruleset SHALL require linear history, permitting only squash or rebase-merge strategies.

#### Scenario: Merge commit blocked

- **WHEN** a contributor attempts a create-a-merge-commit merge
- **THEN** the ruleset rejects it

#### Scenario: Squash merge allowed

- **WHEN** a contributor squashes and merges
- **THEN** the merge is permitted

### Requirement: Block force pushes

The ruleset SHALL block force pushes to protected branches.

#### Scenario: Force push rejected

- **WHEN** a user attempts a force-push to a protected branch
- **THEN** the push is rejected by the ruleset

### Requirement: Required status checks

The ruleset SHALL require the following status checks to pass before merge (inherited from ci-pr-metadata-governance + new):

- Verify Commit Signatures (existing)
- Commit Lint (existing)
- PR Title Lint (from ci-pr-metadata-governance)
- DCO (from ci-pr-metadata-governance, enterprise provenance control)
- **SAST (Semgrep)** (NEW — from ci-sast-governance, added after ≥1 successful non-blocking run — F2 manual step)
- ⏸️ ci-complete (INACTIVE — SKIPPED por CI_MINIMAL, NO requerido)

#### Scenario: Missing required check

- **WHEN** any required status check has not passed
- **THEN** the merge is blocked

#### Scenario: SAST check added after validation (F2)

- **WHEN** the `sast` job in `ci.yml` has run at least once with `continue-on-error: true` and produced a clean result (exit 0)
- **AND** an admin applies the ruleset PATCH to add "SAST (Semgrep)" as a required status check
- **THEN** subsequent PRs MUST pass the SAST scan (exit 0) to merge

#### Scenario: SAST check name matches job name (Regla 8)

- **WHEN** the ruleset references "SAST (Semgrep)" as a required status check
- **THEN** the name MUST exactly match the `name:` field of the `sast` job in `ci.yml` (renaming silently breaks the binding)

#### Scenario: F2 is deferred (not part of this change)

- **WHEN** this change is implemented (F1)
- **THEN** the ruleset is NOT modified — "SAST (Semgrep)" is NOT yet a required check
- **AND** F2 is documented as a manual admin step to execute after ≥1 successful F1 run

### Requirement: CODEOWNERS review enforcement

The ruleset SHALL enforce that CODEOWNERS-nominated reviewers have approved changes to owned paths. A CODEOWNERS file MUST exist (from ci-pr-metadata-governance) before this rule is enabled.

#### Scenario: Owned file changed without owner approval

- **WHEN** a PR modifies a file owned by a CODEOWNERS entry and no owner has approved
- **THEN** the ruleset blocks the merge

#### Scenario: CODEOWNERS file missing

- **WHEN** the ruleset has require_code_owner_review enabled but no CODEOWNERS file exists
- **THEN** all PRs are blocked (unsatisfiable rule)

### Requirement: Bypass actors preserved as NONE

The ruleset SHALL maintain zero bypass actors (no exceptions for anyone, including admins). This is preserved from ci-pr-metadata-governance D5.

#### Scenario: Admin attempts bypass

- **WHEN** a repository admin attempts to bypass the ruleset
- **THEN** the bypass is rejected (zero bypass actors configured)
