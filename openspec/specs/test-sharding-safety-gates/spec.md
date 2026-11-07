# test-sharding-safety-gates Specification

## Purpose

TBD - created by archiving change test-sharding-safety-gates. Update Purpose after archive.

## Requirements

### Requirement: forbidOnly in CI for Playwright and Vitest

In CI, `.only` SHALL be forbidden so a forgotten `.only` cannot reduce the suite silently.

#### Scenario: .only fails in CI

- **WHEN** a test uses `.only` and CI=true
- **THEN** the run fails

#### Scenario: .only allowed locally

- **WHEN** a developer runs locally without CI
- **THEN** `.only` is allowed for debugging

### Requirement: Local shard reproducibility documented

The project SHALL document the command to run a specific shard locally.

#### Scenario: Documented command works

- **WHEN** a developer runs the documented `--shard=2/4` command
- **THEN** the same subset of tests runs as in CI
