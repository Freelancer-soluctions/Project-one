## MODIFIED Requirements

### Requirement: API success response uses standardized envelope
The system SHALL return a consistent JSON envelope for all successful API responses.

#### Scenario: Success response includes success, statusCode, and data
- **WHEN** a request completes successfully
- **THEN** the response body SHALL be `{ "success": true, "statusCode": 200, "data": <payload> }`

#### Scenario: Success response includes optional message
- **WHEN** a request completes successfully and a message is provided
- **THEN** the response body SHALL include an additional `"message"` field

#### Scenario: Success response does not include code field
- **WHEN** a request completes successfully
- **THEN** the response body SHALL NOT include a `code` field

#### Scenario: Success response does not include error field
- **WHEN** a request completes successfully
- **THEN** the response body SHALL NOT include an `error` field

### Requirement: API error response uses standardized envelope
The system SHALL return a consistent JSON envelope for all error responses.

#### Scenario: Error response includes success false
- **WHEN** an error occurs
- **THEN** the response body SHALL include `"success": false`

#### Scenario: Error response includes statusCode in body
- **WHEN** an error occurs
- **THEN** the response body SHALL include `"statusCode"` matching the HTTP response status

#### Scenario: Error response includes error code
- **WHEN** a Prisma error or known error occurs
- **THEN** the response body SHALL include a `"code"` field identifying the error type

#### Scenario: Error response includes human-readable message
- **WHEN** an error occurs
- **THEN** the response body SHALL include a `"message"` field with a human-readable error description

#### Scenario: Error response does not include data field
- **WHEN** an error occurs
- **THEN** the response body SHALL NOT include a `data` field

## REMOVED Requirements

### Requirement: Legacy error: true/false envelope
**Reason**: Replaced by standardized `success: true/false` envelope for consistency with REST API conventions.
**Migration**: Frontend consumers MUST update from checking `response.error` to checking `response.success`. A separate frontend change will handle this migration.

#### Scenario: Legacy error field
- **WHEN** any API response was received
- **THEN** the response body included `error: true` for errors and `error: false` for successes
