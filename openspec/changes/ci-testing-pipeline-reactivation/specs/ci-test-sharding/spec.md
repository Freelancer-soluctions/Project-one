# Spec Delta — ci-test-sharding

## Purpose

Divide las suites de tests de CI en shards deterministas con merge de reportes JUnit y un coverage merge gate obligatorio previo, para reducir el wall-time de los jobs de test sin perder tests, sin debilitar el tripwire de cobertura y sin romper el contrato de `needs` del agregador de merge.

## ADDED Requirements

### Requirement: Duration-based activation precondition

Sharding SHALL be enabled for a workspace only when measured CI evidence shows its single-runner suite duration exceeds the 5–8 minute threshold, and that evidence SHALL be recorded in the change artifacts before enabling the matrix; otherwise the job keeps single-runner execution.

#### Scenario: Suite does not justify sharding

- **WHEN** the `test-unit-server` suite completes in 3.5 minutes single-runner in CI
- **THEN** no shard matrix is configured for that job and it keeps running as a single runner

#### Scenario: Suite duration justifies sharding

- **WHEN** measured CI durations exceed 8 minutes for 3 consecutive runs of the same workspace suite
- **THEN** the recorded evidence authorizes enabling sharding for that workspace under the remaining requirements of this capability

### Requirement: Coverage merge gate required before sharding

Before sharding is enabled for a workspace, its coverage job (`client-coverage` / `server-coverage`) SHALL download the coverage output of every shard, merge it into a single summary, and evaluate the merged totals with `scripts/ci/check-coverage.mjs` against the absolute thresholds declared in the workspace `vitest.config.js` (`coverage.thresholds.autoUpdate` never enabled in CI). Sharding SHALL NOT be enabled for a workspace whose merged coverage evaluation is missing, because per-shard partial coverage would make the tripwire lie.

#### Scenario: Sharding without a merge gate is invalid

- **WHEN** a workspace runs sharded tests while its coverage job evaluates only one shard's coverage output (or none)
- **THEN** the configuration violates this requirement and must not be enabled (checked during apply/verification)

#### Scenario: Merged totals reflect the union of shards

- **WHEN** shard 1 covers module A and shard 2 covers module B
- **THEN** the gate evaluates the merged summary where a file covered only in shard 2 still counts
- **AND** thresholds are read from the workspace `vitest.config.js`, never rewritten by CI

#### Scenario: Missing shard coverage output fails the gate

- **WHEN** any shard fails to upload its coverage output
- **THEN** the coverage job exits 1 instead of evaluating a partial merge

### Requirement: Sharding preserves the executed suite

The union of the shards SHALL be exactly the suite the job would run single-runner — following the same selection rules as the `ci-test-impact-analysis` capability (diff-scoped on PRs, full suite on `shared` changes and in the nightly run) — split deterministically per file, and ANY failing shard SHALL fail the owning job id.

#### Scenario: Full suite distributed across shards

- **WHEN** a PR sets `repo-discovery.outputs.shared == 'true'` and the server suite runs as 3 shards
- **THEN** the union of the 3 shards is the complete server suite and every test file runs exactly once
- **AND** sharding does not change the TIA selection rules

#### Scenario: Failing shard fails the job id

- **WHEN** a test fails inside shard 2 of 3 of `test-unit-server`
- **THEN** the `test-unit-server` job result is `failure` and `prebuild-unit-tests-complete` observes that failure

### Requirement: Aggregator contract and check-name stability

Enabling sharding SHALL NOT change `prebuild-unit-tests-complete.needs` (exactly the 6 job ids of the modified `ci-prebuild-substage-structure` contract) and SHALL NOT rename any job name or required status check; shards SHALL be expressed as a matrix under the existing job ids.

#### Scenario: needs contract unchanged after sharding

- **WHEN** a developer inspects `.github/workflows/ci.yml` with sharding enabled
- **THEN** `prebuild-unit-tests-complete.needs` still contains exactly `[test-unit-client, test-unit-server, test-integration, test-smoke, client-coverage, server-coverage]`
- **AND** no GitHub ruleset required status check needs renaming (job ids and `name:` titles are preserved)

### Requirement: Merged JUnit report

After all shards of a workspace finish, their blob reports SHALL be merged with `vitest --merge-reports` into a single `reports/junit.xml` consumed by `dorny/test-reporter` under the workspace's existing check name, and report artifacts containing `.vitest/` hidden paths SHALL be uploaded with `include-hidden-files: true`; a missing blob report SHALL fail loudly instead of publishing an empty report.

#### Scenario: One check per workspace despite several shards

- **WHEN** 3 shards of `test-unit-client` complete successfully
- **THEN** exactly one "Client Unit Tests" check is published from one merged `apps/client/reports/junit.xml`
- **AND** no duplicate per-shard check with the same name is created

#### Scenario: Missing blob report fails the merge

- **WHEN** a shard uploaded no blob report
- **THEN** the merge step exits non-zero and the job fails (no silent empty JUnit file)

### Requirement: Shard cost controls

Each shard matrix SHALL declare an explicit `max-parallel`, and the workflow-level `concurrency` group with `cancel-in-progress: true` SHALL remain in effect so superseded PR runs are cancelled while shards execute.

#### Scenario: Bounded shard concurrency

- **WHEN** a matrix of 4 shards is configured with `max-parallel: 2`
- **THEN** at most 2 shard runners execute concurrently for that job

#### Scenario: Superseded run cancels its shards

- **WHEN** a new push lands on the PR while the previous run is executing shards
- **THEN** the previous run is cancelled by the workflow `concurrency` group, wasting no further shard minutes
