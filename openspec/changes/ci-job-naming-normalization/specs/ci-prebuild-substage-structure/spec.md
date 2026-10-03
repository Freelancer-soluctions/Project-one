# Spec Delta — ci-prebuild-substage-structure

## Purpose

El `name:` de cada job de `ci.yml` es la interfaz humana del pipeline: es lo que aparece en la pestaña Checks del
PR y lo que el developer escanea antes de mergear. Este delta fija la convención de que ese nombre identifique el
**bloque** al que pertenece el job — covering todos los bloques de `ci.yml`, no solo los que ya la cumplían — y fija
por escrito las **excepciones** legítimas: los checks atados al ruleset y los jobs que no pertenecen a ningún
substage (el entry, el guard y el agregador raíz).

## ADDED Requirements

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

A job outside this list and outside the ruleset exemption SHALL be reported as an inconsistency to fix.

#### Scenario: An unprefixed job is judged against the exception list

- **WHEN** a future change inventories job names for missing prefixes
- **THEN** the three role-exception jobs above and the four ruleset-bound jobs below are treated as known, documented
  exceptions
- **AND** any other unprefixed job is reported as an inconsistency to fix

### Requirement: Checks bound to the ruleset are exempt from renaming

The four job `name:` values that the branch ruleset requires as status checks SHALL NOT be renamed without a
coordinated update of the ruleset itself: `Verify Commit Signatures` (`verify-signatures`),
`Commit Lint (Conventional Commits)` (`commit-lint`), `PR Title Lint` (`pr-title-lint`) and `DCO` (`dco`).

The ruleset matches required contexts against the job `name:` as an exact string. Renaming a job whose name the
ruleset requires makes the required check never be emitted, leaving pull requests blocked indefinitely with
`Expected — Waiting for status to be reported` — a message that gives no hint that a renamed job is the cause.

#### Scenario: Renaming a ruleset-bound check is a coordinated operation

- **WHEN** a change intends to rename one of the four jobs bound to the ruleset
- **THEN** the ruleset's required status check context is updated in the same operation
- **AND** no commit lands where the YAML name and the ruleset context disagree, because that state blocks every
  pull request with no actionable error

#### Scenario: Exemption is documented rather than enforced by convention

- **WHEN** a future normalization change inventories job names for missing prefixes
- **THEN** these four are treated as a known, documented exception
- **AND** they are not reported as an inconsistency to fix

### Requirement: A spec that cites a job name as a ruleset context is updated with it

When a job `name:` appears in a specification as the literal status-check context an administrator SHALL add to the
ruleset, renaming that job SHALL update the citing specification in the same change. Otherwise the documented manual
step names a context that no job emits, and the binding silently fails to apply.

#### Scenario: Renaming a job bound by a future manual ruleset step

- **WHEN** a job is renamed and a specification states that an administrator adds the job's `name:` to the ruleset as
  a required status check
- **THEN** the specification's context string is updated to the new `name:` in the same change
- **AND** the documentation of that manual step names the current context, not the historical one
