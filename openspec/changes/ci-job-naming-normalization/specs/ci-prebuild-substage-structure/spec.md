# Spec Delta — ci-prebuild-substage-structure

## Purpose

El `name:` de cada job de `ci.yml` es la interfaz humana del pipeline: es lo que aparece en la pestaña Checks del
PR y lo que el developer escanea antes de mergear. Este delta fija la convención de que ese nombre identifique el
substage al que pertenece el job, y —más importante— fija por escrito la **excepción** de los checks atados al
ruleset, para que un intento futuro de "normalizar también esos" no rompa el merge del equipo.

## ADDED Requirements

### Requirement: Job display names identify their substage

Every job in `ci.yml` SHALL declare a `name:` that identifies the substage it belongs to, so a reader scanning the
Checks list can tell which layer a check belongs to without reading the YAML. The prefix SHALL match the substage:
`Quality:` for SUBSTAGE 2B (CODE QUALITY) and the coverage tripwires, `Security:` for SUBSTAGE 2C (SECURITY), and the
`Prebuild … Complete` pattern for the substage aggregators.

The job `id:` SHALL NOT be renamed as part of this convention — ids are the contract referenced by the aggregator's
`needs:` array and by failure reporting, while `name:` is what humans read.

#### Scenario: Security substage names carry the Security prefix

- **WHEN** the jobs of SUBSTAGE 2C are listed — `dependency-review`, `secrets`, `scancode-license-pr-diff`,
  `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`
- **THEN** every one of their `name:` values starts with `Security:`
- **AND** no job outside SUBSTAGE 2C uses the `Security:` prefix, so the prefix never misrepresents where a job runs

#### Scenario: A misclassified name is corrected

- **WHEN** a job physically located in SUBSTAGE 2C (SECURITY) declares a `name:` beginning with `Quality:`
- **THEN** the name is corrected to the prefix of its actual substage
- **AND** the change is verified against the job's physical block in `ci.yml`, not against its previous name

#### Scenario: Aggregator names follow their substage

- **WHEN** a substage aggregator job is declared
- **THEN** its `name:` follows the `Prebuild <Substage> Complete` pattern (for example `Prebuild Security Complete`)
- **AND** the final workflow aggregator is named `CI Complete`

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
