## Purpose

Streams GitHub audit logs to an external store and documents the compliance evidence collection process to satisfy Level 5 audit governance.

## ADDED Requirements

### Requirement: Audit log streaming configuration documented

The system SHALL document the configuration of audit log streaming from GitHub to an external store (e.g., SIEM). Note: audit streaming is an org/enterprise-level feature (GHEC/GHES), not a repo workflow. This change documents the procedure, not a workflow file.

#### Scenario: Configuration procedure available

- **WHEN** an operator needs to set up audit log streaming
- **THEN** the documented procedure describes the steps to configure GitHub audit log streaming to the external store

### Requirement: Evidence collection process documented

The system SHALL document a compliance evidence collection process that maps audit events to control evidence.

#### Scenario: Evidence gathered for audit

- **WHEN** an auditor requests evidence for a control
- **THEN** the documented process yields the relevant audit log excerpts

### Requirement: Quarterly review cadence

The system SHALL establish a quarterly review cadence to validate audit coverage and evidence completeness.

#### Scenario: Quarterly review executed

- **WHEN** the quarterly review date arrives
- **THEN** the audit coverage and evidence process are reviewed and gaps remediated
