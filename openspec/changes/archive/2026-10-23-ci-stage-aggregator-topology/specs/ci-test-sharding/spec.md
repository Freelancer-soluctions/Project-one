# Spec Delta

## MODIFIED Requirements

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
