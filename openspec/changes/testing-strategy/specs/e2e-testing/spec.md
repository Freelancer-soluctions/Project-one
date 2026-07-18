## ADDED Requirements

### Requirement: E2E test suite for critical ERP flows

The system SHALL have end-to-end tests using Playwright that verify critical user flows in the ERP application.

#### Scenario: Login flow

- **WHEN** user navigates to login page and enters valid credentials
- **THEN** user is redirected to dashboard and session is persisted

#### Scenario: Logout flow

- **WHEN** authenticated user clicks logout button
- **THEN** user is redirected to login page and session is cleared

#### Scenario: Dashboard access

- **WHEN** authenticated user accesses dashboard URL
- **THEN** dashboard page renders with user information

### Requirement: E2E tests for CRUD operations

The system SHALL have E2E tests that verify Create, Read, Update, Delete operations for critical modules.

#### Scenario: Create new user (admin)

- **WHEN** admin user navigates to users section and creates new user
- **THEN** new user appears in user list

#### Scenario: View sales records

- **WHEN** user navigates to sales module
- **THEN** sales list loads and displays records

### Requirement: E2E test configuration

The system SHALL have Playwright configured to start both client and server automatically during test execution.

#### Scenario: Test environment setup

- **WHEN** E2E tests are executed
- **THEN** client (port 3000) and server (port 4000) start automatically
