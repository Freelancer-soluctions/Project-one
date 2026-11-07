# Spec: coverage-merge-gate-hardening

## ADDED Requirements

### Requirement: ci-complete fails on cancelled and unexpected skipped

The aggregator SHALL fail (not succeed) when an upstream job is cancelled, and SHALL distinguish expected skipped (docs-only) from unexpected skipped.

#### Scenario: Cancelled upstream fails the aggregator

- **WHEN** an upstream job is cancelled
- **THEN** `ci-complete` exits non-zero

### Requirement: Exact shard count verification

Before merging, the coverage job SHALL verify that exactly M partial blobs exist and list any missing indices.

#### Scenario: Missing shard fails the gate

- **WHEN** a partial blob is missing
- **THEN** the gate fails listing the missing index

### Requirement: Merged coverage artifact

The merged coverage report SHALL be uploaded as an artifact with 14-day retention.

#### Scenario: Artifact uploaded

- **WHEN** coverage merge completes
- **THEN** an artifact `coverage-merged-*` with 14-day retention exists

### Requirement: CODEOWNERS for coverage policy files

`.coverage-policy.json` and `.coverage-baseline.json` SHALL have explicit CODEOWNERS entries.

#### Scenario: CODEOWNERS entry exists

- **WHEN** the files are modified
- **THEN** the correct owners are required for review
