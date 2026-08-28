## Purpose

Defines a layered rollback and fix-forward strategy so production incidents can be contained quickly and safely with documented runbooks.

## ADDED Requirements

### Requirement: Layered rollback defined

The system SHALL define a rollback precedence order: feature-flag kill-switch takes precedence over traffic shift, which takes precedence over git revert, which takes precedence over database expand/contract migration reversal.

#### Scenario: Incident triggers rollback

- **WHEN** a production incident is detected
- **THEN** responders apply the highest-precedence available rollback layer (kill-switch first)

### Requirement: Feature flag kill-switch approach documented

The system SHALL document the feature-flag kill-switch approach (assuming a feature-flag system is implemented separately, out of scope for this change).

#### Scenario: Kill-switch approach referenced

- **WHEN** a team needs to disable a faulty feature without a deployment
- **THEN** the documented approach in `docs/runbooks/rollback.md` describes how a kill-switch would work

### Requirement: Rollback runbook created

The system SHALL provide a rollback runbook at `docs/runbooks/rollback.md` describing each rollback layer and its trigger conditions.

#### Scenario: Runbook available

- **WHEN** an operator opens `docs/runbooks/rollback.md`
- **THEN** they find step-by-step rollback procedures for each layer

### Requirement: Fix-forward strategy documented

The system SHALL document a fix-forward strategy at `docs/runbooks/fix-forward.md` describing when fix-forward is preferred over rollback.

#### Scenario: Fix-forward chosen

- **WHEN** a non-critical defect is detected and rollback is disproportionate
- **THEN** the team follows `docs/runbooks/fix-forward.md` to ship a corrective change
