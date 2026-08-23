# api-contract-linting Specification

## Purpose

Validates the OpenAPI contract of the server API using Spectral with the `spectral:oas` ruleset plus custom rules, running in CI, so API contract violations (naming, security, schema issues) are caught before consumers depend on a broken contract.

## ADDED Requirements

### Requirement: Spectral configuration with custom rules

The server SHALL include a `.spectral.yaml` configuration that extends `spectral:oas` and adds custom rules for naming, numeric IDs, HTTP basic auth, and GET requests with bodies.

#### Scenario: Spectral config present

- **WHEN** the server contains `.spectral.yaml`
- **THEN** the config SHALL extend the `spectral:oas` ruleset
- **AND** the config SHALL define custom rules for API naming conventions
- **AND** the config SHALL define a rule forbidding numeric IDs in paths
- **AND** the config SHALL define a rule forbidding HTTP basic auth
- **AND** the config SHALL define a rule forbidding GET requests with a request body

#### Scenario: OpenAPI file exists

- **WHEN** the server contains `openapi.yaml`
- **THEN** the file SHALL be a valid OpenAPI 3.x document
- **AND** the file SHALL describe the server's public API endpoints

### Requirement: CI API contract lint job

The CI pipeline SHALL include an `api-contract` job that runs `spectral lint openapi.yaml` and fails when the contract violates the configured rules.

#### Scenario: Contract violation detected

- **WHEN** `openapi.yaml` contains a violation of the `spectral:oas` ruleset or a custom rule
- **THEN** the `api-contract` job SHALL run `spectral lint openapi.yaml`
- **AND** the job SHALL fail with the list of violations and their locations

#### Scenario: Contract is valid

- **WHEN** `openapi.yaml` complies with all configured rules
- **THEN** the `api-contract` job SHALL pass
- **AND** the PR check SHALL report success

#### Scenario: OpenAPI file invalid

- **WHEN** `openapi.yaml` is not a valid OpenAPI document (parse error)
- **THEN** the `api-contract` job SHALL fail with the parse error
- **AND** the PR SHALL be blocked from merging
