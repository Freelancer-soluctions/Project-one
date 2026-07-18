## ADDED Requirements

### Requirement: Controller functions SHALL have complete JSDoc documentation
All controller functions in `apps/server/src/modules/*/controller.js` SHALL have complete JSDoc documentation following the established standard.

#### Scenario: Controller function with Express request/response parameters
- **WHEN** documenting a controller function
- **THEN** the JSDoc SHALL include `@param {Object} req` with description
- **AND** SHALL document all `req` properties used (e.g., `req.params.id`, `req.body`, `req.userId`, `req.cookies`)
- **AND** SHALL include `@param {Object} res` with description
- **AND** SHALL include `@returns {Promise<void>}` with description of what the function returns

#### Scenario: Controller function with specific request body properties
- **WHEN** a controller function uses `req.body`
- **THEN** the JSDoc SHALL document each property of `req.body` with its type and description
- **AND** SHALL use the format `@param {type} req.body.propertyName - Description`

### Requirement: Service functions SHALL have complete JSDoc documentation
All service functions in `apps/server/src/modules/*/service.js` SHALL have complete JSDoc documentation following the established standard.

#### Scenario: Service function with data object parameter
- **WHEN** documenting a service function that receives a data object
- **THEN** the JSDoc SHALL document each property of the data object with its type and description
- **AND** SHALL use the format `@param {type} data.propertyName - Description`
- **AND** SHALL include `@returns {Promise<Object>}` with description of the returned object

#### Scenario: Service function with ID parameter
- **WHEN** documenting a service function that receives an ID parameter
- **THEN** the JSDoc SHALL document the parameter as `@param {number} id - Description`
- **AND** SHALL include `@returns {Promise<Object>}` with description

#### Scenario: Service function with pagination parameters
- **WHEN** documenting a service function that handles pagination
- **THEN** the JSDoc SHALL document all pagination-related parameters (e.g., `filters.page`, `filters.limit`)
- **AND** SHALL document the return type as `@returns {Promise<Object>}` with description including pagination metadata

### Requirement: DAO functions SHALL have complete JSDoc documentation
All DAO functions in `apps/server/src/modules/*/dao.js` SHALL have complete JSDoc documentation following the established standard.

#### Scenario: DAO function with database operation
- **WHEN** documenting a DAO function that performs a database operation
- **THEN** the JSDoc SHALL document all parameters with their types and descriptions
- **AND** SHALL include `@returns {Promise<Object>}` or `@returns {Promise<Array>}` as appropriate
- **AND** SHALL document any database-specific parameters (e.g., `take`, `skip` for pagination)

#### Scenario: DAO function with filters
- **WHEN** documenting a DAO function that accepts filter parameters
- **THEN** the JSDoc SHALL document each filter property with its type and description
- **AND** SHALL mark optional parameters with square brackets (e.g., `[filters.name]`)

### Requirement: Functions SHALL document thrown errors
All functions that throw errors SHALL document them using `@throws` tags.

#### Scenario: Function throws Error for validation
- **WHEN** a function throws a generic `Error` for validation
- **THEN** the JSDoc SHALL include `@throws {Error} Description of when this error is thrown`

#### Scenario: Function throws ClientError for HTTP errors
- **WHEN** a function throws a `ClientError` with HTTP status code
- **THEN** the JSDoc SHALL include `@throws {ClientError} Description of when this error is thrown`

### Requirement: Complex functions SHALL include usage examples
Functions with non-trivial usage patterns SHALL include `@example` tags demonstrating proper usage.

#### Scenario: Function with complex parameters
- **WHEN** a function has complex parameter structures
- **THEN** the JSDoc SHALL include an `@example` showing how to call the function with sample data

#### Scenario: Function with multiple return formats
- **WHEN** a function can return different data structures based on parameters
- **THEN** the JSDoc SHALL include `@example` tags for each common usage pattern

### Requirement: Documentation SHALL follow existing patterns
JSDoc documentation SHALL follow the patterns established in `auth/controller.js` and `products/service.js`.

#### Scenario: Following auth/controller.js pattern
- **WHEN** documenting controller functions
- **THEN** the documentation SHALL follow the pattern of documenting Express request/response objects with their specific properties

#### Scenario: Following products/service.js pattern
- **WHEN** documenting service functions
- **THEN** the documentation SHALL follow the pattern of documenting all object properties with their types and constraints

### Requirement: Routes files SHALL be excluded from JSDoc documentation
Files named `routes.js` SHALL be excluded from JSDoc documentation requirements as they already have Swagger documentation.

#### Scenario: Routes file with existing Swagger documentation
- **WHEN** a module has a `routes.js` file
- **THEN** the file SHALL NOT be modified for JSDoc documentation
- **AND** SHALL continue to use its existing Swagger/OpenAPI documentation
