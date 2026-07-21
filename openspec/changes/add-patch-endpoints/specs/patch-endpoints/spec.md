## ADDED Requirements

### Requirement: Backend PATCH endpoints

Each backend module SHALL provide a PATCH endpoint at `/:id` alongside the existing PUT endpoint.
The PATCH endpoint SHALL accept partial updates — only the fields provided in the request body SHALL be modified.

#### Scenario: Partial update with single field
- **WHEN** a PATCH request is made to `/{module}/{id}` with a JSON body containing only one field (e.g., `{"name": "Updated Name"}`)
- **THEN** only the `name` field SHALL be updated on the resource; all other fields SHALL remain unchanged
- **AND** the response SHALL return the full updated resource object

#### Scenario: Partial update with multiple fields
- **WHEN** a PATCH request is made to `/{module}/{id}` with a JSON body containing a subset of updatable fields
- **THEN** only the provided fields SHALL be updated
- **AND** the response SHALL return the full updated resource object

#### Scenario: Empty body rejection
- **WHEN** a PATCH request is made with an empty body `{}`
- **THEN** the system SHALL return a 400 Bad Request error
- **AND** the error message SHALL indicate that at least one field must be provided

#### Scenario: Nonexistent field rejection
- **WHEN** a PATCH request is made with a non-existent field name in the body
- **THEN** the system SHALL return a 400 Bad Request error
- **AND** the error SHALL indicate which fields are not allowed

### Requirement: Partial update Joi schema

Each backend module SHALL define a `XxxUpdatePartial` Joi schema where all fields are `.optional()` and the schema SHALL require at least one field via `.min(1)`.

#### Scenario: Schema validation passes for partial body
- **WHEN** a valid partial update object is validated against `XxxUpdatePartial`
- **THEN** validation SHALL pass without errors

#### Scenario: Schema validation rejects empty object
- **WHEN** an empty object `{}` is validated against `XxxUpdatePartial`
- **THEN** validation SHALL fail with a `.min(1)` error

### Requirement: Conditional DAO connect patterns

DAO layer SHALL conditionally apply `connect` and `disconnect` operations only for fields present in the partial update data.

#### Scenario: Relation field present in partial update
- **WHEN** a partial update includes `productCategoryId`
- **THEN** the DAO SHALL apply `{ connect: { id: data.productCategoryId } }` for that relation

#### Scenario: Relation field absent in partial update
- **WHEN** a partial update does NOT include `productCategoryId`
- **THEN** the DAO SHALL NOT apply any connect/disconnect for that relation

### Requirement: Frontend PATCH RTK Query mutations

Each frontend module SHALL provide a new RTK Query mutation `patchXxx` using `method: 'PATCH'` alongside the existing `useUpdateXxxByIdMutation` (PUT).

#### Scenario: PATCH mutation sends correct HTTP method
- **WHEN** the `patchXxx` mutation is called with `{ id, data }`
- **THEN** it SHALL send an HTTP PATCH request to `/{module}/{id}`
- **AND** the request body SHALL contain only the changed fields

#### Scenario: PATCH mutation returns updated resource
- **WHEN** the `patchXxx` mutation succeeds
- **THEN** it SHALL return the full updated resource object
- **AND** the RTK Query cache SHALL be updated with the response

### Requirement: Shared useChangedFields hook

A shared React hook `useChangedFields` SHALL be created that diffs initial vs current form values and returns `{ changedFields, hasChanges, changedKeys }`.

#### Scenario: No changes detected
- **WHEN** current form values equal initial values
- **THEN** `hasChanges` SHALL be `false`
- **AND** `changedFields` SHALL be an empty object
- **AND** `changedKeys` SHALL be an empty array

#### Scenario: Single field changed
- **WHEN** one form field differs from its initial value
- **THEN** `hasChanges` SHALL be `true`
- **AND** `changedFields` SHALL contain only the changed field with its new value
- **AND** `changedKeys` SHALL contain the field name

#### Scenario: Multiple fields changed
- **WHEN** multiple form fields differ from their initial values
- **THEN** `changedFields` SHALL contain all changed fields
- **AND** `changedKeys` SHALL contain all changed field names
