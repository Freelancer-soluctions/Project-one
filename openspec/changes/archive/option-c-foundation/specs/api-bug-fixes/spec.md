## ADDED Requirements

### Requirement: stockAPI uses builder.query for GET endpoint
The system SHALL change `getStockByProductId` from `builder.mutation` to `builder.query` to correctly represent a GET endpoint with proper caching semantics.

#### Scenario: Endpoint type changed to query
- **WHEN** `stockAPI` is defined with `getStockByProductId` as a `builder.query` with `query: () => ({ method: 'GET', url: '/stock/product/{id}' })`
- **THEN** the endpoint SHALL use `builder.query` instead of `builder.mutation`

#### Scenario: useLazy query hook is exported
- **WHEN** `stockAPI` hooks are destructured from `stockAPI`
- **THEN** `useLazyGetStockByProductIdQuery` SHALL be available in the exported hooks

#### Scenario: Caching behavior is active
- **WHEN** `getStockByProductId` is called with the same product ID twice
- **THEN** the second call SHALL return cached data without making a network request

### Requirement: inventoryMovementAPI uses body instead of data
The system SHALL change `data` to `body` in `createInventoryMovement` and `updateInventoryMovementById` mutation definitions to ensure the request payload is serialized and sent correctly.

#### Scenario: Create mutation uses body property
- **WHEN** `createInventoryMovement` is called with a payload
- **THEN** the payload SHALL be sent as the `body` property in the query object (not `data`)

#### Scenario: Update mutation uses body property
- **WHEN** `updateInventoryMovementById` is called with a payload
- **THEN** the payload SHALL be sent as the `body` property in the query object (not `data`)

#### Scenario: Payload is serialized correctly
- **WHEN** a mutation with `body: payload` is dispatched
- **THEN** the server SHALL receive the full payload in the request body
