# frontend-budgets Specification

## Purpose

Enforces frontend performance budgets using size-limit for bundle size and Lighthouse CI for runtime performance metrics (LCP, TBT, total size), with the Lighthouse check required for merge, so performance regressions are caught in CI instead of production.

## ADDED Requirements

### Requirement: Bundle size budgets with size-limit

The client SHALL use size-limit with a `.size-limit.json` configuration that defines bundle size budgets per page or entry, failing when a bundle exceeds its budget.

#### Scenario: Bundle exceeds budget

- **WHEN** the client bundle size exceeds the configured budget in `.size-limit.json`
- **THEN** the size-limit check SHALL fail
- **AND** the failure SHALL report the actual size versus the budget

#### Scenario: Bundle within budget

- **WHEN** the client bundle size is within the configured budget
- **THEN** the size-limit check SHALL pass
- **AND** the CI job SHALL report success

### Requirement: Lighthouse CI performance budgets

The CI pipeline SHALL run Lighthouse CI against the deployed client with a `budget.json` defining LCP < 2500ms, TBT < 200ms, and total size < 200KB, failing when budgets are exceeded.

#### Scenario: Performance budget exceeded

- **WHEN** Lighthouse CI measures LCP >= 2500ms, TBT >= 200ms, or total size >= 200KB
- **THEN** the Lighthouse CI check SHALL fail
- **AND** the failure SHALL report the measured values versus the budgets

#### Scenario: Performance within budgets

- **WHEN** Lighthouse CI measures LCP < 2500ms, TBT < 200ms, and total size < 200KB
- **THEN** the Lighthouse CI check SHALL pass
- **AND** the PR check SHALL report success

### Requirement: Lighthouse CI as required status check

The Lighthouse CI check SHALL be a required status check on `main` branch protection, so PRs that regress performance cannot be merged.

#### Scenario: PR with performance regression

- **WHEN** a pull request causes a performance regression that exceeds the budgets
- **THEN** the Lighthouse CI check SHALL fail
- **AND** the PR SHALL be blocked from merging by branch protection

#### Scenario: PR with acceptable performance

- **WHEN** a pull request keeps performance within the budgets
- **THEN** the Lighthouse CI check SHALL pass
- **AND** the PR SHALL be mergeable
