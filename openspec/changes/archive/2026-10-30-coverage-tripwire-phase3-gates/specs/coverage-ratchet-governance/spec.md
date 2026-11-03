# Spec Delta

## Purpose

Makes the "floor only rises" ratchet invariant a mechanically verified property backed by a versioned baseline with auditable exceptions, and keeps the canonical documentation synchronized with the real configuration.

## ADDED Requirements

### Requirement: Ratchet invariant is mechanically verified

The project SHALL verify that no coverage threshold has decreased relative to a versioned baseline. A decrease in any threshold without a recorded, auditable exception SHALL fail validation.

#### Scenario: Lowered threshold fails

- **WHEN** a threshold is lower than the baseline value
- **AND** no auditable exception is recorded
- **THEN** validation fails

#### Scenario: Raised threshold passes

- **WHEN** a threshold is equal to or higher than the baseline value
- **THEN** validation passes

### Requirement: Exceptions are auditable

An exception to the ratchet invariant SHALL record a reason and an owner. An exception missing these fields SHALL be rejected.

#### Scenario: Exception with reason and owner accepted

- **WHEN** an exception declares reason and owner
- **THEN** the threshold change is accepted

#### Scenario: Exception missing fields rejected

- **WHEN** an exception lacks reason or owner
- **THEN** validation fails

### Requirement: Canonical documentation figures are verified

The canonical coverage documentation SHALL not cite threshold values that differ from the workspace configuration. A documentation verification step SHALL fail when cited figures do not match the config.

#### Scenario: Mismatched figure fails verification

- **WHEN** a documented threshold differs from the config value
- **THEN** the verification step fails

#### Scenario: Matching figures pass

- **WHEN** all documented thresholds match the config
- **THEN** the verification step passes

### Requirement: Exclusion budget is tracked

The project SHALL track the set of coverage exclusions and fail when the exclusion set grows beyond a versioned baseline without an auditable exception.

#### Scenario: Grown exclusion set fails

- **WHEN** the exclusion set exceeds the baseline without an exception
- **THEN** validation fails

#### Scenario: Stable exclusion set passes

- **WHEN** the exclusion set is unchanged
- **THEN** validation passes

### Deferred capability: Scheduled ratchet (Change B)

Scheduled floor-raising proposals are pending separate Change B work. They are not implemented or required by this change; thresholds remain manually reviewed and are never modified inside a blocking job.

#### Planned scenario: Scheduled run proposes raise (pending Change B)

- **WHEN** a future Change B scheduled process measures coverage above a floor
- **THEN** a pull request is proposed with the before and after values

#### Planned scenario: No change proposes nothing (pending Change B)

- **WHEN** a future Change B run finds no floor to raise
- **THEN** no pull request is opened
