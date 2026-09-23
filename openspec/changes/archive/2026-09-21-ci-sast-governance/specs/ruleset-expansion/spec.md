## MODIFIED Requirements

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
