## Purpose

Adds test reporting to the CI pipeline so test results are annotated directly on the pull request, making failures easy to debug without leaving the PR.

## ADDED Requirements

### Requirement: JUnit test reporting with PR annotations
The pipeline SHALL report test results to the pull request via `dorny/test-reporter@v3` with JUnit XML annotations.

#### Scenario: Test reporting after any test job
- **WHEN** any test job completes (success or failure)
- **THEN** `dorny/test-reporter@v3` runs with `if: success() || failure()`
- **AND** it creates a GitHub Check Run with JUnit annotations in the PR diff
