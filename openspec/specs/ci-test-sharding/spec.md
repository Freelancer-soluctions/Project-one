# ci-test-sharding Specification

## Purpose

Divide las suites de tests de CI en shards deterministas con merge de reportes JUnit y un coverage merge gate obligatorio previo, para reducir el wall-time de los jobs de test sin perder tests, sin debilitar el tripwire de cobertura y sin romper el contrato de `needs` del agregador de merge.

## Requirements

### Requirement: Duration-based activation precondition

Sharding SHALL be enabled for a workspace only when measured CI evidence shows its single-runner suite duration exceeds the 5–8 minute threshold, and that evidence SHALL be recorded in the change artifacts before enabling the matrix; otherwise the job keeps single-runner execution.

#### Scenario: Suite does not justify sharding

- **WHEN** the `test-unit-server` suite completes in 3.5 minutes single-runner in CI
- **THEN** no shard matrix is configured for that job and it keeps running as a single runner

#### Scenario: Current repo state leaves sharding disabled

- **WHEN** the recorded evidence shows both workspaces running their full suite well under the 5-8 minute threshold
- **THEN** no `strategy.matrix` of shards exists in `.github/workflows/ci.yml` for any test job
- **AND** the capability stays dormant until measured evidence crosses the threshold, not merely because time passed

#### Scenario: Suite duration justifies sharding

- **WHEN** measured CI durations exceed 8 minutes for 3 consecutive runs of the same workspace suite
- **THEN** the recorded evidence authorizes enabling sharding for that workspace under the remaining requirements of this capability

### Requirement: Coverage merge gate required before sharding

Before sharding is enabled for a workspace, its coverage evaluation chain — the fixed-name bridge
job and/or the coverage job (`client-coverage` / `server-coverage`) it feeds — SHALL download the
coverage output of every shard, merge it into a single summary (`vitest --merge-reports
--coverage`), and evaluate the merged totals with `scripts/ci/check-coverage.mjs` against the
absolute thresholds declared in the workspace `vitest.config.js` (`coverage.thresholds.autoUpdate`
never enabled in CI). The merge SHALL happen before the tripwire evaluates anything, and sharding
SHALL NOT be enabled for a workspace whose merged coverage evaluation is missing, because
per-shard partial coverage would make the tripwire lie. This merge capability is a prerequisite
that must exist (design `unit-tests-enterprise` §23.6) BEFORE any shard matrix lands.

#### Scenario: Sharding without a merge gate is invalid

- **WHEN** a workspace runs sharded tests while its coverage job evaluates only one shard's coverage output (or none)
- **THEN** the configuration violates this requirement and must not be enabled (checked during apply/verification)

#### Scenario: Merged totals reflect the union of shards

- **WHEN** shard 1 covers module A and shard 2 covers module B
- **THEN** the gate evaluates the merged summary where a file covered only in shard 2 still counts
- **AND** thresholds are read from the workspace `vitest.config.js`, never rewritten by CI

#### Scenario: Missing shard coverage output fails the gate

- **WHEN** any shard fails to upload its coverage output
- **THEN** the coverage gate exits 1 instead of evaluating a partial merge

#### Scenario: Merge runs before the tripwire

- **WHEN** the bridge merges shard reports with `--merge-reports --coverage`
- **THEN** the merged summary is the ONLY input `check-coverage.mjs` sees (D18 still evaluates thresholds only on full-suite runs)

### Requirement: Sharding preserves the executed suite

The union of the shards SHALL be exactly the suite the job would run single-runner — following the same selection rules as the `ci-test-impact-analysis` capability (diff-scoped on PRs, full suite on `shared` changes and in the nightly run) — split deterministically per file, and ANY failing shard SHALL fail the owning job id.

#### Scenario: Full suite distributed across shards

- **WHEN** a PR sets `repo-discovery.outputs.shared == 'true'` and the server suite runs as 3 shards
- **THEN** the union of the 3 shards is the complete server suite and every test file runs exactly once
- **AND** sharding does not change the TIA selection rules

#### Scenario: Failing shard fails the job id

- **WHEN** a test fails inside shard 2 of 3 of `test-unit-server`
- **THEN** the `test-unit-server` job result is `failure` and `prebuild-tests-complete` observes that failure

### Requirement: Aggregator contract and check-name stability

Enabling sharding SHALL NOT change `prebuild-tests-complete.needs` (exactly the 5 job ids of
the modified `ci-prebuild-substage-structure` contract) and SHALL NOT rename any job name or
required status check; shards SHALL be expressed as a matrix under the existing job id, and the
matrix SHALL be absorbed by exactly ONE fixed-name bridge/merge job per sharded workspace
(`test-unit-client-merge`) that sits between the shard matrix and the coverage/aggregator chain.
Shard legs SHALL NOT appear as entries in ANY job's `needs` list (never N shards added to the
aggregator), the bridge SHALL run with `if: always()` so it executes even when a shard failed, it
SHALL propagate any shard failure to its own check, and it SHALL run
`vitest --merge-reports --coverage` BEFORE any coverage tripwire evaluation (D18).

#### Scenario: needs contract unchanged after sharding

- **WHEN** a developer inspects `.github/workflows/ci.yml` with sharding enabled
- **THEN** `prebuild-tests-complete.needs` still contains exactly `[test-unit-client, test-unit-server, client-coverage, server-coverage, property-tests]`
- **AND** no GitHub ruleset required status check needs renaming (job ids and `name:` titles are preserved)

#### Scenario: Matrix is absorbed by one bridge, never by the aggregator

- **WHEN** `test-unit-client` runs as a 2-leg matrix
- **THEN** the only job added to the workflow is the single fixed-name bridge `test-unit-client-merge`
- **AND** no `needs` entry anywhere references `matrix.shard` indices or per-shard job names
- **AND** `client-coverage` consumes the bridge output instead of reading a single shard's coverage

#### Scenario: Bridge runs and reports when a shard fails

- **WHEN** shard 2 of 2 fails while shard 1 succeeds
- **THEN** the bridge still executes (`if: always()`), merges whatever reports exist and fails its own check with a clear shard-failure error
- **AND** exactly one merged JUnit report is published under the workspace's existing check name (no per-shard required checks)

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

### Requirement: Prerequisite gates and decision record before any matrix

Before any shard `strategy.matrix` is introduced in `.github/workflows/ci.yml`, this change SHALL
record, in its own artifacts: (a) measured wall-time for the affected test jobs across at least 3
real CI runs, (b) verification that the Coverage Merge Gate prerequisite (§23.6) exists for the
workspace, and (c) an explicit PROCEED or N/A decision derived from the 5-8 minute activation
threshold (>8 min in 3 consecutive runs ⇒ PROCEED; <5 min ⇒ N/A; the 5-8 min band ⇒ recorded cost
analysis of `N*(s+T/w)` before PROCEED). Implementation tasks that add the matrix SHALL be gated
behind those records; with an N/A decision no matrix lands at all and the capability stays dormant
until new measured evidence crosses the threshold.

#### Scenario: Evidence below threshold closes the rollout as N/A

- **WHEN** the recorded measurements show the workspace job finishing under 5 minutes (current repo evidence, G1.2 over 4 real CI runs: server suite of 4-5 s; client suite 145-166 s; client job 259-282 s, i.e. 4m19s-4m42s dominated by ≈100 s of setup)
- **THEN** the decision record is N/A and no shard matrix exists in `.github/workflows/ci.yml`
- **AND** the change documents the evidence and stops, leaving the capability dormant

#### Scenario: No matrix before the gates are recorded

- **WHEN** the change artifacts are inspected at the moment the matrix task starts
- **THEN** the duration evidence (>= 3 runs), the Coverage Merge Gate verification and the PROCEED record already exist
- **AND** the matrix task is sequenced after them in `tasks.md` (gated groups G1 -> G2 -> G3)

#### Scenario: Gray-band decision is costed, not guessed

- **WHEN** measured durations land in the 5-8 minute band
- **THEN** the decision record includes the billed-minutes cost (`N*(s+T/w)`) versus the wall-time saving before approving PROCEED

### Requirement: Advisory-first rollout with ownership boundaries

The first sharding instance SHALL be `test-unit-client` with N=2 in advisory mode: `fail-fast:
false`, an explicit `max-parallel`, per-shard artifact names (artifacts are immutable - colliding
names make only one shard win), and the FASE 1 `continue-on-error: true` preserved on both the
matrix legs and the bridge (its removal belongs to `ci-testing-gate-promotion`). `test-unit-server`
SHALL remain single-runner until its own duration evidence passes the same gates. Sharding SHALL
be expressed only as workflow matrix + CLI flags: it SHALL NOT modify `sequence.sequencer` or the
TIA selection logic and guard D7 (selection runs BEFORE sharding - owned by `tia-hardening`), SHALL
NOT alter TTFF / shuffle / order-dependence metrics (owned by `smart-test-ordering`), SHALL NOT
edit `apps/client/vitest.config.js` snapshot settings nor `apps/client/package.json` test scripts
(owned by `client-snapshot-testing`), SHALL NOT remove `continue-on-error` from any of the 6 test
jobs, SHALL apply `.github/flaky-quarantine.yml` exclusions inside every shard, and SHALL NOT
shard the e2e tier (owned by `ci-shifting-left`, capability `e2e-sharding`).

#### Scenario: Advisory shard failure does not block the merge gate

- **WHEN** a shard leg fails while FASE 1 advisory mode is still in effect
- **THEN** `prebuild-tests-complete` observes the job's advisory result exactly as today (no new blocking behavior introduced by sharding)
- **AND** `continue-on-error: true` still appears on the sharded test job and on the bridge

#### Scenario: Selection happens before sharding and guard D7 stays intact

- **WHEN** a PR runs `test-unit-client` as a matrix with TIA scope resolution active
- **THEN** the TIA scope resolution and the empty-selection fallback (guard D7) run identically in every shard leg, before `--shard` is applied
- **AND** no `sequence.sequencer` setting or selection script is changed by this change

#### Scenario: Quarantine exclusions apply inside each shard

- **WHEN** `.github/flaky-quarantine.yml` excludes a file
- **THEN** no shard runs that file (the exclusion argv is derived in each leg before the shard flag)

#### Scenario: Ownership audits pass

- **WHEN** the change's diff is audited against the in-flight changes
- **THEN** `sequence.sequencer`, `.github/flaky-quarantine.yml`, `apps/client/vitest.config.js`, `apps/client/package.json` and every `continue-on-error` line of the 6 jobs are identical to `main`

### Requirement: Shard balance and cost observability

Every sharded run SHALL publish advisory metrics to the job step summary: wall-time per shard and
total, the max/min balance ratio (target <= 1.15, i.e. shards within 10-15% of each other), the
straggler share of the last-finishing shard, and the billed minutes versus the single-runner
baseline. A recorded ratio above 1.15 SHALL trigger a re-balance follow-up recorded in the change
artifacts; duration-based rebalancing (custom sequencer / `vitest-dev/vitest#9184`) SHALL be
delegated rather than implemented here, and TTFF SHALL NOT be claimed as a sharding benefit
(sharding moves wall-time, not time-to-first-failure).

#### Scenario: Metrics published on each sharded run

- **WHEN** a sharded run completes
- **THEN** the step summary shows per-shard durations, max/min ratio, straggler share and billed minutes
- **AND** no metric claims a TTFF improvement

#### Scenario: Imbalance triggers a recorded follow-up

- **WHEN** the max/min ratio exceeds 1.15 in a recorded run
- **THEN** a re-balance follow-up is recorded in the change artifacts (a count-based split is not a temporal balance)
