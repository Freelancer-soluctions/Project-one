# ci-prebuild-substage-structure Specification (Delta)

## ADDED Requirements

### Requirement: Strict aggregator with skip-authorization

The `prebuild-quality-complete` aggregator SHALL pass `needs` via environment variable (`env: NEEDS: ${{ toJSON(needs) }}`) and evaluate the verdict with `jq`/node, never interpolating `${{ }}` inside `run:`. It SHALL fail on `failure`, `cancelled`, or unauthorized `skipped`; authorized skips (via `repo-discovery` change detection) SHALL be tolerated. It SHALL include the `merge_group` trigger.

#### Scenario: Unauthorized skip

- **WHEN** a mandatory quality job is skipped without `repo-discovery` authorization
- **THEN** the aggregator fails with exit 1

#### Scenario: Authorized skip

- **WHEN** `repo-discovery` indicates an area did not change
- **THEN** the corresponding job is skipped and tolerated
- **AND** the aggregator reports success if the rest pass

#### Scenario: Merge queue

- **WHEN** a PR enters the merge queue
- **THEN** quality workflows re-run with `merge_group`
- **AND** the aggregator re-evaluates against the updated base
  EOF
