# ci-prebuild-substage-structure Specification

## Purpose

Delimits STAGE 2 (PRE-BUILD — VALIDATE) of the CI pipeline into 4 named substages via aggregator jobs, activates knip dead-code detection as the first quality gate (Phase 1 non-blocking), classifies the existing `sast` job within substage 2A Governance, and fixes the convention that every job's display `name:` identifies the block it is defined in — including the jobs bound to the ruleset and the jobs that belong to no block, which are enumerated as documented exceptions.

## Requirements

### Requirement: Aggregator skip on CI_MINIMAL

The system SHALL skip all 4 aggregator jobs when `CI_MINIMAL=true`, preventing false failure reports.

The 4 jobs are the STAGE 2 substage aggregators, whose ids are `prebuild-governance-complete`,
`prebuild-quality-complete`, `prebuild-security-complete` and `prebuild-tests-complete`. The three stage aggregators
introduced alongside this requirement (`build-complete`, `postbuild-tests-complete`,
`postbuild-analysis-complete`) deliberately do **not** carry the `CI_MINIMAL` clause, so "all 4" remains exact.

#### Scenario: PR with CI_MINIMAL=true

- **When** a PR targets `main` and `vars.CI_MINIMAL=true`
- **Then** the 4 aggregators `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-tests-complete` evaluate `if: CI_MINIMAL != 'true' && always()` as false and are marked SKIPPED
- **And** no aggregator reports a failure to the GitHub status check system

#### Scenario: The stage aggregators are not part of the CI_MINIMAL gate

- **When** `vars.CI_MINIMAL=true`
- **Then** `build-complete`, `postbuild-tests-complete` and `postbuild-analysis-complete` still evaluate their own
  `always()` condition and still report
- **And** their skipped members are tolerated by the verdict rule, so they report success rather than being skipped

### Requirement: Aggregator run on CI_MINIMAL=false

The system SHALL run each aggregator in all circumstances when `CI_MINIMAL=false`, propagating upstream job results.

#### Scenario: All upstream jobs pass

- **When** `CI_MINIMAL=false` and every job in a substage passes or is skipped
- **Then** the corresponding aggregator finalizes with success

#### Scenario: Upstream job fails

- **When** `CI_MINIMAL=false` and at least one job in a substage fails
- **Then** the corresponding aggregator finalizes with failure, propagating the error

### Requirement: prebuild-governance-complete

The `prebuild-governance-complete` aggregator SHALL depend on exactly `[verify-signatures, commit-lint, dco, sast]`.
The `sast` entry reflects its FASE 2 graduation (2026-10-20, change `sast-shift-left-hooks-parity`): a new ERROR
finding blocks the merge through this aggregator. The metadata checks `pr-title-lint` and `pr-body-lint` SHALL NOT be
included: both are defined in `.github/workflows/pr-metadata.yml`, and a GitHub Actions `needs` entry can only
reference a job in the same workflow, so listing them would make the aggregator invalid rather than more complete.
Metadata coverage therefore does not reach this aggregator at all: `Governance: PR Body Lint` is bound to the ruleset
directly and `Governance: PR Title Lint` is emitted without being bound at all.

#### Scenario: Governance aggregator needs resolution

- **When** `prebuild-governance-complete` runs
- **Then** its `needs` array contains exactly `verify-signatures`, `commit-lint`, `dco`, `sast` — no more, no less
- **And** it contains no metadata job id, because those jobs live in another workflow

#### Scenario: Metadata failure reaches the PR without the aggregator

- **When** either metadata job fails in `.github/workflows/pr-metadata.yml`
- **Then** the required status check reports failure directly to the pull request
- **And** `prebuild-governance-complete` neither reports that failure nor is able to observe it

#### Scenario: sast failure does not affect governance aggregator

- **When** the `sast` job reports an ERROR finding on a PR
- **Then** the failure is attributed to `sast` and the aggregator reports the substage as failed
- **And** the individual verdicts of `verify-signatures`, `commit-lint` and `dco` are unaffected, because each job reports its own conclusion

#### Scenario: CI_MINIMAL=true and sast runs

- **When** `CI_MINIMAL=true` and `sast` runs (it is not gated by CI_MINIMAL)
- **Then** `prebuild-governance-complete` is SKIPPED (per Aggregator skip on CI_MINIMAL)
- **And** `sast` results remain visible as its own job in the 2A Governance section

### Requirement: prebuild-quality-complete

The `prebuild-quality-complete` aggregator SHALL depend on exactly 15 jobs from Substage 2B CODE QUALITY: `[client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, e2e-lint, root-manifest-guard, openspec-validate]`. (Nota de calibración: la lista base declaraba 15 jobs sin `root-manifest-guard`, que se incorporó al agregador con el change `root-manifest-cleanup` sin actualizar la spec — estado real pre-`ci-supply-chain-hygiene`: 16 jobs con `actionlint`; post-change: 15.)

#### Scenario: Quality aggregator needs resolution

- **When** `prebuild-quality-complete` runs
- **Then** its `needs` array contains exactly those 15 jobs — no more, no less
- **And** all 15 jobs are from Substage 2B CODE QUALITY
- **And** the blocking `actionlint` job is no longer a dependency (consolidated into `actionlint-advisory` of substage 2C, per change `ci-supply-chain-hygiene`)
- **And** `e2e-lint` follows the same activation pattern as the other quality jobs: gated on `repo-discovery` output (`e2e == 'true'`), `pull_request` only, and aggregated by the same failure-propagation logic
- **And** `openspec-validate` runs on every `pull_request` (not path-filtered), is aggregated by the same failure-propagation logic, and runs `npx openspec validate --specs --strict` against the canonical specs in `openspec/specs/**`

### Requirement: prebuild-tests-complete

The `prebuild-tests-complete` aggregator SHALL depend on exactly 5 jobs: `[test-unit-client, test-unit-server,
client-coverage, server-coverage, property-tests]`. `test-unit-client`, `test-unit-server` and `property-tests` are
the tier-1 unit-test jobs of the prebuild testing tier; `client-coverage` and `server-coverage` are the
coverage-tripwire jobs and SHALL remain defined outside the Substage 2D block (their physical location does not
move).

`test-integration` and `test-smoke` SHALL NOT be part of this `needs` array: both are physically defined in STAGE 4
POST-BUILD, so listing them here gave a prebuild verdict two post-build members. They belong to
`postbuild-tests-complete` exclusively.

`property-tests` SHALL be listed even though it declares `continue-on-error: true`. Its inclusion is **record-only**:
it closes a taxonomy gap — a tier-1 test that was absent from the tier-1 verdict — and SHALL NOT be read as making
that job blocking. The `continue-on-error` flag SHALL NOT be removed, so a property-test failure remains absorbed at
job level and cannot fail this aggregator.

Not only `property-tests`: **all five members of this aggregator carry `continue-on-error: true`** — `test-unit-client`
(`ci.yml:471`), `test-unit-server` (`ci.yml:767`), `client-coverage` (`ci.yml:1056`), `server-coverage`
(`ci.yml:1149`) and `property-tests` (`ci.yml:1220`). That is the repo's FASE 1 advisory posture, so this aggregator
currently reports **success regardless of the individual failures of any of its members**, and its verdict carries no
blocking force today. Only the governance, quality and security verdicts block anything. The tier-1 rung is therefore
structurally present but **vacuous in effect** until the `ci-testing-gate-promotion` change removes
`continue-on-error`; this requirement is what makes that state explicit instead of implied.

The jobs `test-e2e` and `coverage` do NOT exist as job names in ci.yml, and `e2e` stays excluded (`if: false`,
explicitly out of scope).

#### Scenario: Unit-tests aggregator needs resolution

- **WHEN** `prebuild-tests-complete` runs
- **THEN** its `needs` array contains exactly those 5 jobs — no more, no less
- **AND** `test-integration` and `test-smoke` are absent from it

#### Scenario: property-tests is recorded but not made blocking

- **WHEN** `property-tests` finalizes with `failure` while retaining `continue-on-error: true`
- **THEN** the job-level flag absorbs the failure and the job reports as successful or neutral to its dependents
- **AND** `prebuild-tests-complete` does not fail because of it
- **AND** the job is listed in the aggregator's `needs` regardless, so the tier-1 inventory is complete on paper

#### Scenario: Post-build jobs are not aggregated by a prebuild verdict

- **WHEN** the `needs` of the four prebuild aggregators are inspected for jobs physically defined in STAGE 3 BUILD or
  STAGE 4 POST-BUILD
- **THEN** no such job appears in any of them
- **AND** `test-integration` and `test-smoke` appear only in `postbuild-tests-complete.needs`

#### Scenario: Path-skipped jobs count as passing

- **WHEN** a PR touches only `apps/client/**`, so `test-unit-server` and `server-coverage` are skipped by their path
  conditions
- **THEN** the aggregator treats the skipped `needs` as passing and finalizes with success if the client-side chain
  (`test-unit-client`, `client-coverage`) is green

#### Scenario: Coverage tripwire failure propagates

- **WHEN** the `ci-testing-gate-promotion` change has removed `continue-on-error: true` from `server-coverage`, and
  `server-coverage` then finalizes with `failure` (coverage below the workspace thresholds or a missing/stale summary)
- **THEN** `prebuild-tests-complete` finalizes with failure and `ci-complete` blocks the merge
- **AND** this propagation does not hold before FASE 2: under the current advisory posture the coverage job is
  reported but the aggregator still finalizes with success

### Requirement: ci-complete depends on aggregators

The `ci-complete` aggregator SHALL depend on exactly 9 items: the 4 prebuild substage aggregators, the 3 stage
aggregators `build-complete`, `postbuild-tests-complete` and `postbuild-analysis-complete`, plus
`zombie-workflow-guard` and `repo-discovery`.

The dependency chain SHALL be prebuild → build → {postbuild tests, postbuild analysis} → ci-complete:
`build-complete` consumes the four prebuild verdicts through the build jobs, the two post-build aggregators consume
`build-complete` plus their own tier's jobs, and `ci-complete` consumes every stage verdict. This chain is what makes
a red build, a red post-build test or a red post-build analysis job reach the root verdict; without the three stage
aggregators, those stages had no path into `ci-complete` at all.

#### Scenario: ci-complete needs resolution

- **When** `ci-complete` runs
- **Then** its `needs` array contains exactly: `[prebuild-governance-complete, prebuild-quality-complete,
prebuild-security-complete, prebuild-tests-complete, build-complete, postbuild-tests-complete,
postbuild-analysis-complete, zombie-workflow-guard, repo-discovery]`

#### Scenario: The stage chain reaches the root verdict

- **When** a member of `postbuild-tests-complete` or of `postbuild-analysis-complete` fails
- **Then** that aggregator reports failure
- **And** `ci-complete` reports failure through its entry for that aggregator
- **And** both post-build aggregators in turn report failure when `build-complete` fails

#### Scenario: The two post-build branches stay distinguishable

- **When** `postbuild-tests-complete` fails and `postbuild-analysis-complete` succeeds
- **Then** the Checks list shows one red testing verdict and one green analysis verdict
- **And** `ci-complete` fails because of the testing branch alone, without the analysis branch inheriting the failure

#### Scenario: A skipped stage aggregator does not fail the root verdict

- **When** `build-complete`, `postbuild-tests-complete` or `postbuild-analysis-complete` finalizes as `skipped`
- **Then** `ci-complete` treats the skipped entry as passing and finalizes with success if every other entry passed

### Requirement: Indirect dependency on quality/test jobs

The `ci-complete` aggregator SHALL NOT depend directly on quality or test jobs when they have `if: false` and `CI_MINIMAL=true` — only via the substage aggregators. It treats skipped aggregators/jobs as passing (does not report failure).

#### Scenario: Quality job skipped, ci-complete still passes

- **When** `CI_MINIMAL=true` and quality jobs are skipped (`if: false`)
- **Then** `prebuild-quality-complete` is skipped (per Aggregator skip on CI_MINIMAL)
- **And** `ci-complete` depends on the aggregator (which is skipped), not on the individual quality jobs
- **And** `ci-complete` treats skipped aggregators/jobs as passing (does not report failure)

### Requirement: Phase 1 non-blocking knip activation

The system SHALL activate `client-dead-code` and `server-dead-code` jobs with `continue-on-error: true` so they report but do not block the merge. Each dead-code job SHALL run knip from the repository root against the root `knip.jsonc` (`npx knip --workspace=apps/client …`, `npx knip --workspace=apps/server …`).

#### Scenario: PR touches client workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=true`
- **THEN** the `client-dead-code` job runs `npx knip --workspace=apps/client --no-progress` with `continue-on-error: true`, with the repository root as working directory
- **AND** the job does NOT block the merge regardless of knip findings

#### Scenario: PR touches server workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `server=true`
- **THEN** the `server-dead-code` job runs `npx knip --workspace=apps/server --no-progress` with `continue-on-error: true`, with the repository root as working directory
- **AND** the job does NOT block the merge regardless of knip findings

#### Scenario: PR does not touch the workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=false` (or `server=false`)
- **THEN** the corresponding dead-code job is skipped via `if: needs.repo-discovery.outputs.client == 'true'` (or server equivalent)

### Requirement: Phase 2 blocking promotion

The system SHALL remove `continue-on-error` from dead-code jobs after 1 sprint of calibration, making them blocking quality gates.

#### Scenario: Phase 2 promotion

- **When** the team confirms knip stability (false positive rate acceptable, ignores calibrated)
- **Then** `continue-on-error: true` is removed from `client-dead-code` and `server-dead-code`
- **And** knip failures block the merge (same pattern as pr-title-lint/dco per §9.3.3/§9.3.4)

### Requirement: Per-workspace knip.json with correct schema

knip SHALL use a single configuration file, the root `/knip.jsonc`, with `$schema: "https://unpkg.com/knip@6/schema-jsonc.json"` (the JSONC variant of the official schema) matching the installed version (6.32.2). Per-workspace behavior SHALL be expressed through its `workspaces` sections (`"."`, `"apps/client"`, `"apps/server"`, `"e2e"`), never through nested per-workspace config files.

#### Scenario: knip runs in CI and locally

- **WHEN** knip runs via `client-dead-code` or `server-dead-code` in CI, or via `npx knip --workspace apps/client` locally
- **THEN** it uses the root `knip.jsonc` in every case — `--workspace` filters the analyzed workspaces but does NOT switch configuration files
- **AND** the `$schema` field references `knip@6` (not `knip@5`)

#### Scenario: No nested config files

- **WHEN** the repository is inspected after this change
- **THEN** `apps/client/knip.json` and `apps/server/knip.json` do not exist
- **AND** all knip invocations from any working directory resolve `/knip.jsonc`

### Requirement: Baseline calibration of ignores

The system SHALL calibrate ignores in the `workspaces` sections of the root `knip.jsonc` when the knip baseline reports false positives, and document them in the change.

#### Scenario: False positives on first run

- **WHEN** `npx knip` runs for the first time against the codebase and reports false positives
- **THEN** the false positives are added to the `ignore` (or more surgically, `ignoreIssues`) array of the corresponding workspace section in the root `knip.jsonc`
- **AND** the calibration is documented in the change artifacts

### Requirement: Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

The SUBSTAGE 2A header SHALL list only the jobs that are physically defined in the governance block of `ci.yml`. It
SHALL NOT list `pr-title-lint`, because that job is defined in `.github/workflows/pr-metadata.yml`; a header that
advertises a job the file does not contain misleads exactly the reader it is meant to orient.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, dco, sast diff`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, e2e-lint, openspec-validate, docs-validation (advisory)`
  - `# SUBSTAGE 2C: SECURITY — dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke, property-tests`

#### Scenario: Metadata job is not advertised in the 2A header

- **When** a developer reads the `# SUBSTAGE 2A: GOVERNANCE` header
- **Then** `pr-title-lint` is not listed, because no such job is defined in `ci.yml`
- **And** the reader looking for the metadata checks is pointed to `.github/workflows/pr-metadata.yml`

#### Scenario: Reading substage 2C header

- **When** a developer reads the `# SUBSTAGE 2C: SECURITY` header
- **Then** all 9 security jobs of the pre-build security block are listed in file order
- **And** the header no longer references `security.yml` (its PR-time security responsibility was absorbed by `ci.yml` since change `secret-scanning`; `security.yml` remains as push-main defense-in-depth per §23.3 mapping)

### Requirement: sast documented as standalone in substage 2A

The substage 2A header SHALL list `sast` for visual grouping, but document that sast is standalone (not gated by CI_MINIMAL).

#### Scenario: Reading substage 2A header

- **When** a developer reads the `# SUBSTAGE 2A: GOVERNANCE` header
- **Then** `sast` is listed among the governance jobs for visual classification
- **And** the header implies sast is in this substage even though it is not in `prebuild-governance-complete.needs` (asymmetric classification per design D5)

### Requirement: Security substage 2C job placement

The substage 2C security block of `ci.yml` SHALL contain exactly the 9 jobs of the pre-build security layers of `docs/ci-cd-pipeline-empresarial.md` §23.3 (`dependency-review`, `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`), and no other job SHALL be defined inside the block. The 3 advisory jobs `actionlint-advisory`, `zizmor-advisory` and `typosquat-guarddog` SHALL be defined after `containerfile-lint` at the close of the block; the relative order of the 6 pre-existing jobs SHALL be unchanged. The relocation SHALL be physical only (cut-and-paste): job `id`, `name:`, `needs`, `if`, `continue-on-error`, steps, SARIF categories, artifacts and timeouts SHALL be unchanged.

#### Scenario: Security block composition

- **When** a developer inspects the job definitions between the `# SUBSTAGE 2C: SECURITY` header and the `# STAGE 3: BUILD` banner
- **Then** the job ids found are exactly the 9 listed above, in the order stated, with no other job definitions interleaved
- **And** the 3 relocated jobs appear after `containerfile-lint` in the order `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`

#### Scenario: Advisory jobs relocated without semantic changes

- **When** the relocation diff is reviewed or `actionlint` runs against `ci.yml`
- **Then** each relocated job keeps its exact `name:` (the `Security: …` check titles), `needs: [repo-discovery]`, `if: github.event_name == 'pull_request'`, `continue-on-error: true`, steps and SARIF categories/artifacts
- **And** no required status check name of the ruleset changes (relocation does not rename jobs)

#### Scenario: Blocking actionlint stays in substage 2B

- **When** a developer inspects where the blocking `actionlint` job (workflow syntax lint) is defined
- **Then** it remains inside the substage 2B quality block (before the 2C header) and in `prebuild-quality-complete.needs`
- **And** it is NOT part of the 2C security block (documented deviation from §23.3, decision 2026-09-30: syntax lint = quality; `zizmor` = the security layer of pipeline config via `unpinned-uses`)

### Requirement: prebuild-security-complete needs contract

The `prebuild-security-complete` aggregator SHALL depend on exactly 3 jobs: `[dependency-review, secrets, scancode-license-pr-diff]`. The advisory jobs of the substage (`lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`) SHALL NOT be part of its `needs` in FASE 1; their promotion to FASE 2 blocking is governed by their origin changes (`sca-lockfile-compliance`, `iac-scanning`, `containerfile-lint`, `pipeline-config-scan`, `typosquatting-detection`), not by this capability.

#### Scenario: Security aggregator needs resolution

- **When** `prebuild-security-complete` runs
- **Then** its `needs` array contains exactly `dependency-review`, `secrets`, `scancode-license-pr-diff` — no more, no less

#### Scenario: Advisory job failure does not affect security aggregator

- **When** any advisory job of substage 2C fails on a PR
- **Then** `prebuild-security-complete` does not report that failure (the job is not in its `needs` and the job-level `continue-on-error: true` absorbs it)
- **And** the finding remains visible via the job's SARIF upload and artifact

### Requirement: Job display names identify their block

Every job in `ci.yml` SHALL declare a `name:` that identifies the block it is defined in, so a reader scanning the
Checks list can tell which layer a check belongs to without reading the YAML. The prefix SHALL match the block the job
is physically defined in:

| Block                  | Prefix                |
| ---------------------- | --------------------- |
| SUBSTAGE 2A GOVERNANCE | `Governance:`         |
| SUBSTAGE 2B QUALITY    | `Quality:`            |
| SUBSTAGE 2C SECURITY   | `Security:`           |
| SUBSTAGE 2D TESTING    | `Tests:`              |
| STAGE 3 BUILD          | `Build:`              |
| STAGE 4 POST-BUILD     | `Quality:`            |
| SUBSTAGE AGGREGATORS   | `Prebuild … Complete` |

The prefix names the block where the job is **defined**, not the category of work it performs: a coverage job defined
in STAGE 4 POST-BUILD carries `Quality:`, not `Tests:`, even though it executes tests.

The job `id:` SHALL NOT be renamed as part of this convention — ids are the contract referenced by the aggregator's
`needs:` array and by failure reporting, while `name:` is what humans read.

#### Scenario: Testing substage names carry the Tests prefix

- **WHEN** the jobs of SUBSTAGE 2D are listed — `test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`
- **THEN** every one of their `name:` values starts with `Tests:`
- **AND** a test job defined after the build stage (`e2e`) also carries the `Tests:` prefix, since its block is a
  testing block regardless of when it runs

#### Scenario: Build jobs carry the Build prefix

- **WHEN** the jobs of STAGE 3 BUILD are listed — `client-build`, `server-build`
- **THEN** every one of their `name:` values starts with `Build:`

#### Scenario: Security substage names carry the Security prefix

- **WHEN** the jobs of SUBSTAGE 2C are listed — `dependency-review`, `secrets`, `scancode-license-pr-diff`,
  `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`
- **THEN** every one of their `name:` values starts with `Security:`
- **AND** no job outside SUBSTAGE 2C uses the `Security:` prefix, so the prefix never misrepresents where a job runs

#### Scenario: A misclassified name is corrected

- **WHEN** a job physically located in one block declares a `name:` beginning with another block's prefix
- **THEN** the name is corrected to the prefix of its actual block
- **AND** the change is verified against the job's physical block in `ci.yml`, not against its previous name

#### Scenario: Disabled jobs are normalized too

- **WHEN** a job is declared with `if: false`
- **THEN** its `name:` SHALL still follow the prefix convention of its block
- **AND** this SHALL NOT be deferred to the job's activation, because the name is the only guidance available to the
  person re-enabling it

#### Scenario: Aggregator names follow their substage

- **WHEN** a substage aggregator job is declared
- **THEN** its `name:` follows the `Prebuild <Substage> Complete` pattern (for example `Prebuild Security Complete`)
- **AND** the final workflow aggregator is named `CI Complete`

### Requirement: Jobs with no block are enumerated as role exceptions

The `name:` of a job that does not belong to any substage SHALL NOT be given a block prefix. The complete set of such
jobs is enumerated here so that a future normalization change evaluates them against this list instead of reporting
them as inconsistencies:

- `repo-discovery` (`Detect Changes`) — the ENTRY path-filter; it precedes every substage and decides which jobs run.
- `zombie-workflow-guard` (`Zombie Workflow Guard`) — a GUARD assertion about the repository itself, outside the DAG's
  stage structure.
- `ci-complete` (`CI Complete`) — the root aggregator; by definition it does not belong to a substage.
- `build-complete` (`Build Complete`) — a STAGE aggregator (STAGE 3 BUILD), not a substage aggregator.
- `postbuild-tests-complete` (`Postbuild Tests Complete`) — a STAGE aggregator (STAGE 4 POST-BUILD, testing branch).
- `postbuild-analysis-complete` (`Postbuild Analysis Complete`) — a STAGE aggregator (STAGE 4 POST-BUILD, analysis
  branch).

The three stage aggregators are exempt for a structural reason, not by oversight: the `Prebuild … Complete` family
prefix names a _substage of STAGE 2_, and a STAGE 3 or STAGE 4 verdict does not belong to that family. Their role is the
role of `ci-complete` — they exist to aggregate, not to be aggregated into a stage — one level below the root.

A job outside this list and outside the ruleset exemption SHALL be reported as an inconsistency to fix.

#### Scenario: An unprefixed job is judged against the exception list

- **WHEN** a future change inventories job names for missing prefixes
- **THEN** the six role-exception jobs above and the ruleset-bound contexts covered by
  _Checks bound to the ruleset are exempt from renaming_ are treated as known, documented exceptions
- **AND** any other unprefixed job is reported as an inconsistency to fix

#### Scenario: A stage aggregator is not reported as a missing-prefix inconsistency

- **WHEN** a normalization pass finds `Build Complete`, `Postbuild Tests Complete` or `Postbuild Analysis Complete`
  without a `Build:` or `Quality:` block prefix
- **THEN** each is matched against this enumeration and treated as correct as-is
- **AND** no `Build:` prefix is added to `Build Complete`, because it aggregates the build stage rather than belonging
  to it

### Requirement: Checks bound to the ruleset are exempt from renaming

The job `name:` values that the branch ruleset binds as status-check contexts SHALL NOT be renamed without a
coordinated update of the ruleset itself, because the ruleset matches a required context against the job `name:` as an
exact string: renaming a bound job makes the required check never be emitted and leaves pull requests blocked
indefinitely with `Expected — Waiting for status to be reported`, a message that gives no hint that a renamed job is
the cause.

Two contexts are bound today (ruleset 21227644 audited through the API on 2026-10-23): `Governance: PR Body Lint`
(job `pr-body-lint`, `.github/workflows/pr-metadata.yml`) and `Prebuild Governance Complete` (job
`prebuild-governance-complete`, `ci.yml`).

The three governance jobs of `ci.yml` — `Governance: Verify Commit Signatures` (`verify-signatures`),
`Governance: Commit Lint (Conventional Commits)` (`commit-lint`) and `Governance: DCO` (`dco`) — are not bound
individually: they reach the ruleset through the `Prebuild Governance Complete` aggregator, which lists them in its
`needs`. Their own names therefore carry no freeze on their own, while the aggregator's name does — renaming it
detaches the requirement for the whole governance substage, not for a single check.

`Governance: PR Title Lint` (`pr-title-lint`) is emitted by `.github/workflows/pr-metadata.yml` and is bound by neither
path: a `needs` entry cannot reference a job in another workflow, and the ruleset does not bind it directly.

The exemption follows the requirement, not the workflow: `Governance: PR Body Lint` is bound from
`.github/workflows/pr-metadata.yml` rather than from `ci.yml`, and `Prebuild Governance Complete` is bound from
`ci.yml`; neither is exempt because of the file it happens to live in.

#### Scenario: Renaming a ruleset-bound check is a coordinated operation

- **WHEN** a change intends to rename one of the jobs bound to the ruleset
- **THEN** the ruleset's required status check context is updated in the same operation
- **AND** no commit lands where the YAML name and the ruleset context disagree, because that state blocks every
  pull request with no actionable error

#### Scenario: Exemption is documented rather than enforced by convention

- **WHEN** a future normalization change inventories job names for missing prefixes
- **THEN** the ruleset-bound checks are treated as a known, documented exception
- **AND** they are not reported as an inconsistency to fix

#### Scenario: A check bound to the ruleset in another workflow keeps its exemption

- **WHEN** `Governance: PR Body Lint` is defined in `.github/workflows/pr-metadata.yml` rather than in `ci.yml`
- **THEN** it is bound exactly as a `ci.yml` job would be, because the ruleset binds the context name and not the file
  location
- **AND** `Prebuild Governance Complete` carries the same binding from inside `ci.yml`

### Requirement: A spec that cites a job name as a ruleset context is updated with it

When a job `name:` appears in a specification as the literal status-check context an administrator SHALL add to the
ruleset, renaming that job SHALL update the citing specification in the same change. Otherwise the documented manual
step names a context that no job emits, and the binding silently fails to apply.

#### Scenario: Renaming a job bound by a future manual ruleset step

- **WHEN** a job is renamed and a specification states that an administrator adds the job's `name:` to the ruleset as
  a required status check
- **THEN** the specification's context string is updated to the new `name:` in the same change
- **AND** the documentation of that manual step names the current context, not the historical one

### Requirement: Build jobs depend on the prebuild verdicts

The `client-build` and `server-build` jobs SHALL depend on the four prebuild aggregators
`[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete,
prebuild-tests-complete]` and on no individual prebuild job. Their previous six-entry `needs` lists SHALL be
replaced, not augmented: a build job that listed individual quality jobs could run while governance, security or
unit testing was red, because no entry in that list carried those verdicts.

Each build job SHALL carry an explicit success predicate over the four aggregator `result` values. An explicit
predicate is required because the aggregators declare `always()`: their _execution_ does not imply a green
_verdict_, so the implicit `success()` of a `needs` entry is not sufficient to catch a red aggregator.

The build jobs SHALL remain disabled by the literal condition `false`, and that literal SHALL compose with the
predicate as a conjunction evaluated left to right: the effective condition is `false AND <predicate>`, which
evaluates to `false` for every possible `needs` state, so the disabled behaviour of the jobs is unchanged. The
activation procedure SHALL be the replacement of the `false` term with `true`, which yields the predicate alone and
therefore the intended gate, without rewriting the expression.

#### Scenario: Build needs resolution

- **WHEN** `client-build` or `server-build` is inspected
- **THEN** its `needs` array contains exactly the four prebuild aggregators — no individual prebuild job, and no
  aggregator omitted
- **AND** neither `client-format-check`, `client-lint`, `server-lint`, `server-format-check`, the two `typecheck`
  jobs, the two `complexity` jobs, the two `dead-code` jobs nor the two `import-bounds` jobs appear in either list

#### Scenario: A red prebuild verdict blocks build

- **WHEN** any of the four prebuild aggregators finalizes with `failure`, while the four aggregator jobs still
  executed because they declare `always()`
- **THEN** the build predicate evaluates to false and the build job does not run with a green verdict attributed to
  it
- **AND** the failure is not absorbed by the implicit `success()` semantics of `needs`

#### Scenario: The disabled state is preserved

- **WHEN** the build jobs are read on this change's commit
- **THEN** both declare the literal condition `false`, so both evaluate to `false` regardless of the `needs` results
- **AND** no build job runs, and no observable behaviour of a pull request changes

#### Scenario: Activation yields the intended gate

- **WHEN** an operator activates a build job by replacing its `false` term with `true`
- **THEN** the surviving expression is the four-aggregator success predicate
- **AND** the operator does not have to reconstruct the predicate, because it was already present in the condition

### Requirement: build-complete

A `build-complete` aggregator job SHALL exist in `ci.yml` with `name: Build Complete` and `needs:
[client-build, server-build]`. It SHALL declare `always()`, so that its two disabled members — which finalize as
`skipped` rather than `success` — do not cascade a skip onto the aggregator itself, and so that a stage verdict
exists for `ci-complete` and for the two post-build aggregators to consume.

The single-point-of-failure shape of this rung is **intentional, not a defect to fix**. Both post-build aggregators
list `build-complete` in their `needs`, so a red `build-complete` makes `postbuild-tests-complete` AND
`postbuild-analysis-complete` red from one root cause: a reader sees three red checks for one failure. The build
verdict is the actionable one — the two post-build verdicts are red _because_ their shared parent is red, and their
own members may be perfectly healthy. Collapsing the three into one would restore the single-verdict-for-two-taxonomies
defect this change removes (Decision 8); suppressing the propagation on the post-build side would let a red stage
domain silently pass. Neither is correct: keep the three checks and read the build verdict first.

#### Scenario: Build aggregator needs resolution

- **WHEN** `build-complete` is inspected
- **THEN** its `needs` array contains exactly `client-build` and `server-build` — no more, no less

#### Scenario: Disabled build jobs do not skip the aggregator

- **WHEN** `client-build` and `server-build` both finalize with `skipped` because they declare the literal condition
  `false`
- **THEN** `build-complete` still executes, because it declares `always()`
- **AND** it finalizes with success, because skipped members are tolerated by its verdict rule

### Requirement: postbuild-tests-complete

A `postbuild-tests-complete` aggregator job SHALL exist in `ci.yml` with `name: Postbuild Tests Complete` and
`needs: [build-complete, test-integration, test-smoke, e2e]`. It SHALL declare `always()`, so that its disabled
member `e2e` — which finalizes as `skipped` rather than `success` — does not cascade a skip onto the aggregator
itself, and so that a testing verdict exists for `ci-complete` to consume.

This aggregator is the TESTING branch of the post-build stage. It SHALL NOT aggregate static-analysis jobs: those
belong to `postbuild-analysis-complete`, so that a red `e2e` and a red `depcheck` produce two distinguishable
verdicts instead of collapsing into one `failure`.

#### Scenario: Post-build tests aggregator needs resolution

- **WHEN** `postbuild-tests-complete` is inspected
- **THEN** its `needs` array contains exactly `build-complete`, `test-integration`, `test-smoke`, `e2e` — no more,
  no less
- **AND** no SonarQube or depcheck job appears in it

#### Scenario: A red e2e reaches the root aggregator through the tests branch

- **WHEN** `e2e` is active and finalizes with `failure`
- **THEN** `postbuild-tests-complete` finalizes with failure
- **AND** `postbuild-analysis-complete` is unaffected and still reports its own verdict
- **AND** `ci-complete` finalizes with failure, because it lists `postbuild-tests-complete` in its `needs`

#### Scenario: Post-build tests aggregator runs with a disabled member

- **WHEN** `e2e` finalizes as `skipped` while `test-integration` and `test-smoke` pass
- **THEN** `postbuild-tests-complete` executes and finalizes with success

### Requirement: postbuild-analysis-complete

A `postbuild-analysis-complete` aggregator job SHALL exist in `ci.yml` with `name: Postbuild Analysis Complete` and
`needs: [build-complete, client-sonarqube, server-sonarqube, client-depcheck, server-depcheck]`. It SHALL declare
`always()`, so that its four disabled members — all `if: false` — do not cascade a skip onto the aggregator itself.

This aggregator is the ANALYSIS branch of the post-build stage and SHALL NOT aggregate test jobs: static analysis is
a different taxonomy from testing, and merging the two would make a red `depcheck` indistinguishable from a red
`e2e` in the Checks list.

#### Scenario: Post-build analysis aggregator needs resolution

- **WHEN** `postbuild-analysis-complete` is inspected
- **THEN** its `needs` array contains exactly `build-complete`, `client-sonarqube`, `server-sonarqube`,
  `client-depcheck`, `server-depcheck` — no more, no less
- **AND** no test job appears in it

#### Scenario: A red depcheck reaches the root aggregator through the analysis branch

- **WHEN** `client-depcheck` or `server-depcheck` is active and finalizes with `failure`
- **THEN** `postbuild-analysis-complete` finalizes with failure
- **AND** `postbuild-tests-complete` is unaffected and still reports its own verdict
- **AND** `ci-complete` finalizes with failure, because it lists `postbuild-analysis-complete` in its `needs`

#### Scenario: All analysis members disabled

- **WHEN** `client-sonarqube`, `server-sonarqube`, `client-depcheck` and `server-depcheck` all finalize as `skipped`
- **THEN** `postbuild-analysis-complete` executes and finalizes with success

### Requirement: Stage aggregator verdict semantics

The `build-complete`, `postbuild-tests-complete` and `postbuild-analysis-complete` aggregators SHALL apply the
verdict rule of the four prebuild aggregators: a `failure` among the `needs` results SHALL produce exit code 1, a
`cancelled` SHALL produce exit code 1, and a `skipped` SHALL produce exit code 0. The `cancelled` handling SHALL
match the criterion already recorded in `.github/workflows/pr-metadata.yml` for its concurrency block: a cancelled
run is not a success for a verdict that gates a merge.

The tolerance of `skipped` is mandatory rather than permissive: every member of the three stage aggregators is
either disabled with the literal condition `false` or path-scoped to `pull_request`, so requiring a `success` would
fail every pull request the moment the aggregators are introduced.

#### Scenario: Failure propagates

- **WHEN** any member of `build-complete`, `postbuild-tests-complete` or `postbuild-analysis-complete` finalizes with
  `failure`
- **THEN** the aggregator exits with code 1 and reports failure

#### Scenario: Cancellation is not a success

- **WHEN** any member of `build-complete`, `postbuild-tests-complete` or `postbuild-analysis-complete` finalizes with
  `cancelled`
- **THEN** the aggregator exits with code 1
- **AND** the behaviour differs from `ci-complete`, which treats `cancelled` as success — a divergence recorded as
  out of scope for this change

#### Scenario: Skipped members are tolerated

- **WHEN** every member of `build-complete` finalizes as `skipped`
- **THEN** the aggregator exits with code 0 and reports the stage as succeeded or skipped
- **AND** no pull request is failed by the mere absence of a build run

### Requirement: Stage aggregator names are registered as stage siblings

The aggregator naming convention SHALL distinguish substage aggregators from stage aggregators. Substage
aggregators of STAGE 2 SHALL keep the `Prebuild <Substage> Complete` pattern. Stage aggregators SHALL be named
`<Stage> Complete`: `Build Complete` for STAGE 3 BUILD, and `Postbuild Tests Complete` and `Postbuild Analysis
Complete` for the two branches of STAGE 4 POST-BUILD. The root aggregator SHALL remain `CI Complete`.

The deviation is intentional: none of the three stage aggregators carries the `Prebuild ` prefix, because they
aggregate a whole stage rather than a substage of STAGE 2, and prefixing them would place a STAGE 3 or STAGE 4
verdict inside the STAGE 2 substage family it does not belong to. The job ids (`build-complete`,
`postbuild-tests-complete`, `postbuild-analysis-complete`) SHALL NOT be renamed by this convention.

#### Scenario: A stage aggregator is named

- **WHEN** the aggregators of `ci.yml` are listed
- **THEN** the STAGE 2 aggregators read `Prebuild Governance Complete`, `Prebuild Quality Complete`,
  `Prebuild Security Complete`, `Prebuild Tests Complete`
- **AND** the STAGE 3 aggregator reads `Build Complete`
- **AND** the two STAGE 4 aggregators read `Postbuild Tests Complete` and `Postbuild Analysis Complete`
- **AND** the root aggregator reads `CI Complete`

#### Scenario: A stage aggregator is not mistaken for a substage aggregator

- **WHEN** a reader scans the Checks list for the name of a STAGE 2 substage verdict
- **THEN** no STAGE 3 or STAGE 4 aggregator carries the `Prebuild ` prefix
- **AND** the `Prebuild ` prefix continues to identify exactly the four substage aggregators

## Notes

- **Traceability**: knip ignore calibration (Baseline calibration of ignores) relates to `ci-shifting-left` A5 (knip root avoidance). This cross-reference is tracked in `proposal.md` rather than inline in the spec.
