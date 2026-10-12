# Spec Delta — ci-prebuild-substage-structure

## Purpose

El job advisory `property-tests` se define dentro del bloque SUBSTAGE 2D: su header pasa a
enumerarlo y el escenario de prefijos `Tests:` lo incluye en la enumeración de 2D. El
contrato de `needs` del agregador (6 ids), los `name:` de los jobs existentes y la
composición de los demás substages quedan intactos.

## MODIFIED Requirements

### Requirement: Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, e2e-lint, openspec-validate, docs-validation (advisory)`
  - `# SUBSTAGE 2C: SECURITY — dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke, property-tests`

#### Scenario: Reading substage 2C header

- **When** a developer reads the `# SUBSTAGE 2C: SECURITY` header
- **Then** all 9 security jobs of the pre-build security block are listed in file order
- **And** the header no longer references `security.yml` (its PR-time security responsibility was absorbed by `ci.yml` since change `secret-scanning`; `security.yml` remains as push-main defense-in-depth per §23.3 mapping)

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

- **WHEN** the jobs of SUBSTAGE 2D are listed — `test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`,
  `property-tests`
- **THEN** every one of their `name:` values starts with `Tests:`
- **AND** the advisory PBT job displays as `Tests: Property Tests` (defined physically inside the 2D block)
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
