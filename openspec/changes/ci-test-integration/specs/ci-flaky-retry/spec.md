## Purpose

Adds automatic retries for flaky tests — Playwright E2E and Vitest integration tests — so intermittent failures do not block the pipeline.

## ADDED Requirements

### Requirement: Playwright flaky test retry
Playwright E2E tests SHALL retry flaky tests before reporting failure.

#### Scenario: Playwright retry on failure
- **WHEN** a Playwright test fails in CI
- **THEN** it retries up to 2 times before reporting failure

### Requirement: Vitest flaky test retry
Vitest integration tests SHALL retry flaky tests before reporting failure.

#### Scenario: Vitest retry on failure
- **WHEN** a Vitest integration test fails in CI
- **THEN** it retries up to 2 times before reporting failure
