# Spec Delta — ci-prebuild-substage-structure

## Purpose

El requirement `prebuild-tests-complete` afirmaba que **los cinco** miembros del agregador llevan
`continue-on-error: true` y que el escalón tier-1 era «estructuralmente presente pero vacuo en efecto»
hasta que `ci-testing-gate-promotion` retirara el flag. Este change lo retira (tasks 3.1), así que esa
redacción queda invertida en los hechos: el delta la reemplaza por el estado blocking. El `needs` sigue
siendo el mismo array de 5 ids, los `name:` no cambian y la composición de los demás agregadores queda
intacta.

## MODIFIED Requirements

### Requirement: prebuild-tests-complete

The `prebuild-tests-complete` aggregator SHALL depend on exactly 5 jobs: `[test-unit-client, test-unit-server,
client-coverage, server-coverage, property-tests]`. `test-unit-client`, `test-unit-server` and `property-tests` are
the tier-1 unit-test jobs of the prebuild testing tier; `client-coverage` and `server-coverage` are the
coverage-tripwire jobs and SHALL remain defined outside the Substage 2D block (their physical location does not
move).

`test-integration` and `test-smoke` SHALL NOT be part of this `needs` array: both are physically defined in STAGE 4
POST-BUILD, so listing them here gave a prebuild verdict two post-build members. They belong to
`postbuild-tests-complete` exclusively.

All five members SHALL be **blocking**: none of them SHALL declare `continue-on-error`. A `failure` of any member
SHALL make this aggregator report failure, and the failure SHALL reach `ci-complete`, its only consumer.
`property-tests` is a full member of the verdict for the same reason as the other four: it is a tier-1 test of the
prebuild testing tier and its red is a real signal. Job-level `continue-on-error` SHALL NOT be re-added to any member
except as a recorded, per-job rollback of the promotion (`ci-testing-gate-promotion` design D9), and SHALL never be
added to the aggregator itself. The scenario `property-tests is recorded but not made blocking` keeps its heading
because OpenSpec keys scenarios by title; its content is the present contract, which is the contrary of that
record-only posture.

The jobs `test-e2e` and `coverage` do NOT exist as job names in ci.yml, and `e2e` stays excluded (`if: false`,
explicitly out of scope).

#### Scenario: Unit-tests aggregator needs resolution

- **WHEN** `prebuild-tests-complete` runs
- **THEN** its `needs` array contains exactly those 5 jobs — no more, no less
- **AND** `test-integration` and `test-smoke` are absent from it

#### Scenario: property-tests is recorded but not made blocking

- **WHEN** `property-tests` finalizes with `failure`
- **THEN** `prebuild-tests-complete` finalizes with failure — the record-only posture of FASE 1 no longer applies to
  this member
- **AND** the job is listed in the aggregator's `needs` regardless, so the tier-1 inventory stays complete

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

- **WHEN** `server-coverage` finalizes with `failure` (coverage below the workspace thresholds or a missing/stale
  summary)
- **THEN** `prebuild-tests-complete` finalizes with failure and `ci-complete` fails
- **AND** the coverage bridge also fails the job through its own `Propagate shard failure` step when its upstream
  `test-unit-server` failed, so a red suite cannot be masked by a green-looking merge
