# e2e-sharding Specification

## Purpose

Reduces the E2E test lead time from ~20 minutes to ~6 minutes by sharding Playwright tests across 4 parallel CI jobs with the blob reporter and merge-reports, enabling fully parallel execution with retries and cached browsers.

## ADDED Requirements

### Requirement: Sharded E2E execution

The E2E CI job SHALL use a matrix of 4 shards (`shardIndex: [1,2,3,4]`, `shardTotal: [4]`) so Playwright tests run in parallel across 4 jobs.

#### Scenario: E2E job runs with matrix

- **WHEN** the E2E CI job runs
- **THEN** the job SHALL use `strategy.matrix` with `shardIndex: [1,2,3,4]` and `shardTotal: [4]`
- **AND** each matrix job SHALL run `npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`
- **AND** each shard SHALL run a disjoint subset of the test suite

#### Scenario: All shards complete

- **WHEN** all 4 shard jobs complete successfully
- **THEN** the E2E check SHALL report success
- **AND** the combined test results SHALL be reported

### Requirement: Blob reporter and report merging

The E2E runs SHALL use the Playwright blob reporter to produce per-shard results, and a merge step SHALL combine them into a single HTML report.

#### Scenario: Shard produces blob report

- **WHEN** a shard job finishes running tests
- **THEN** the run SHALL produce a blob report via the `blob` reporter
- **AND** the blob report SHALL be uploaded as a CI artifact

#### Scenario: Reports merged after shards

- **WHEN** all shard jobs complete
- **THEN** a merge job SHALL run `npx playwright merge-reports --reporter=html` on the collected blob reports
- **AND** the merged HTML report SHALL be uploaded as an artifact

### Requirement: Fully parallel execution with retries

The Playwright configuration SHALL enable `fullyParallel: true` and `retries: 2` in CI, so tests within each shard run in parallel and flaky tests are retried.

#### Scenario: Fully parallel enabled

- **WHEN** Playwright runs in CI
- **THEN** `fullyParallel: true` SHALL be set in `playwright.config.js`
- **AND** tests within a shard SHALL run in parallel across workers

#### Scenario: Flaky test retried

- **WHEN** a test fails in CI
- **THEN** Playwright SHALL retry the test up to 2 times (`retries: 2`)
- **AND** the test SHALL pass if it succeeds on a retry

### Requirement: Browser cache for shards

The E2E jobs SHALL cache Playwright browsers keyed by the `@playwright/test` version, so shard jobs do not re-download browsers on every run.

#### Scenario: Browser cache hit

- **WHEN** a shard job runs and the browser cache key matches
- **THEN** the job SHALL restore browsers from cache
- **AND** the job SHALL skip `playwright install`

#### Scenario: Browser cache miss

- **WHEN** a shard job runs and the browser cache key does not match (e.g., Playwright version changed)
- **THEN** the job SHALL run `npx playwright install --with-deps chromium`
- **AND** the cache SHALL be updated for future runs
