# Spec Delta

## MODIFIED Requirements

### Requirement: TIA does not weaken local or CI gates

Diff-scoped CI execution SHALL complement, not replace, the local pre-push tier (`.husky/pre-push`, spec
`pre-push-scoped-testing`) and SHALL NOT drop any job from the pipeline without landing it in some stage verdict.

The invariant protected here is **verdict coverage**, not the immutability of a particular list: a job MAY leave
`prebuild-tests-complete.needs` provided another aggregator carries it and that aggregator reaches `ci-complete`. In
particular, `test-integration` and `test-smoke` moved from `prebuild-tests-complete.needs` to
`postbuild-tests-complete.needs` (change `ci-stage-aggregator-topology`), which preserves the invariant because
`postbuild-tests-complete` is itself a direct member of `ci-complete.needs`. Tier membership is a taxonomy decision;
being gated is not negotiable.

#### Scenario: Developer bypasses hooks

- **WHEN** a contributor pushes with `--no-verify` or from a machine without the hooks
- **THEN** the CI test jobs still execute (scoped to the diff, or fully on shared changes) and gate the merge — the defense-in-depth fallback exists

#### Scenario: A job may change tier but not lose its verdict

- **WHEN** a change proposes moving a job from `prebuild-tests-complete.needs` to another aggregator's `needs`
- **THEN** the change is permitted only if the receiving aggregator is itself in `ci-complete.needs`
- **AND** the job remains present in exactly one aggregator's `needs` — neither dropped nor double-counted

#### Scenario: Three-tier strategy documented

- **WHEN** a developer reads `docs/testing-architecture.md` §7.5 after this change
- **THEN** the CI tier documents diff-scoped execution, the nightly full-suite safety net and the local pre-push tier as one coherent strategy

### Requirement: Diff-scoped unit test execution in CI

When a workspace test job runs for a PR, it SHALL execute only the tests affected by the diff between the PR head and `origin/main` via the workspace CI script `test:changed:ci`, defined in BOTH workspaces as `vitest run --changed origin/main --coverage --reporter=junit --outputFile=reports/junit.xml` (client) and `vitest run ".unit.test.js" --changed origin/main --coverage --reporter=junit --outputFile=reports/junit.xml` (server, unit filter first) — the JUnit output path explicit, never left to a default — with the full git history already provided by the checkout of `ci.yml` (`fetch-depth: 0` is declared today — confirm, nothing to add) so `origin/main` is available, and with threshold evaluation of this diff-scoped coverage deferred to full-suite runs (decision D18).

#### Scenario: PR touches a single client module

- **WHEN** a PR changes one module under `apps/client/src/**`
- **THEN** `test-unit-client` runs `npm run test:changed:ci --workspace=apps/client`, executing only client test files whose sources changed
- **AND** the job stays in `prebuild-tests-complete.needs`, so its result (including "no affected tests") still counts for the merge gate

#### Scenario: origin/main unavailable

- **WHEN** the checkout cannot resolve `origin/main` (shallow or detached fetch)
- **THEN** the job fails loudly (or falls back to the full suite) instead of silently reporting zero affected tests
