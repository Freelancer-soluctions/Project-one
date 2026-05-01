## ADDED Requirements

### Requirement: Modular Joi Schema File Structure
The system SHALL organize Joi validation schemas into per-module schema files instead of a single monolithic file. Each module that requires validation SHALL have its schemas defined in `modules/<module>/schemas/<module>.joi.js`.

#### Scenario: Schema file exists for each module
- **WHEN** the refactoring is complete
- **THEN** each of the 18 modules (auth, users, notes, news, events, settings, products, providers, warehouse, stock, inventoryMovement, sales, clients, purchases, employees, attendance, payroll, vacation, permission, expenses, performanceEvaluation) SHALL have a `schemas/` directory containing a `<module>.joi.js` file

#### Scenario: Schema file naming convention
- **WHEN** creating schema files
- **THEN** the file SHALL be named `<module>.joi.js` (e.g., `auth.joi.js`, `users.joi.js`) to clearly identify it as a Joi schema file

### Requirement: Schema Logic Preservation
The system SHALL preserve all existing Joi schema validation logic without modification. Only the file location SHALL change.

#### Scenario: Schema definitions remain unchanged
- **WHEN** schemas are moved to new files
- **THEN** all schema definitions (validation rules, error messages, custom validations) SHALL remain identical to the original `joi.js` file

#### Scenario: Exported schema names preserved
- **WHEN** schemas are split into module files
- **THEN** all exported schema names (e.g., `loginSchema`, `createUserSchema`) SHALL remain the same to maintain compatibility with existing route imports

### Requirement: Route Import Updates
All `routes.js` files SHALL update their Joi schema imports to reference the new per-module schema file locations using relative paths.

#### Scenario: Import path update in routes
- **WHEN** a route file previously imported from `../../utils/joiSchemas/joi.js`
- **THEN** it SHALL be updated to import from `./schemas/<module>.joi.js` (relative to the route file location)

#### Scenario: Only necessary schemas imported
- **WHEN** routes import schemas from the new location
- **THEN** they SHALL only import the schemas defined in that module's schema file (not all schemas)

### Requirement: No Changes to Schema-Less Modules
Modules that do not have Joi schemas SHALL NOT be modified during this refactoring.

#### Scenario: Skip clientOrder module
- **WHEN** processing modules during refactoring
- **THEN** the `clientOrder` module SHALL NOT receive a `schemas/` directory as it has no Joi schemas

#### Scenario: Skip providerOrder module
- **WHEN** processing modules during refactoring
- **THEN** the `providerOrder` module SHALL NOT receive a `schemas/` directory as it has no Joi schemas

#### Scenario: Skip security module
- **WHEN** processing modules during refactoring
- **THEN** the `security` module SHALL NOT receive a `schemas/` directory as it has no Joi schemas

### Requirement: Verification of Successful Refactoring
The system SHALL provide verification that the refactoring is complete and correct.

#### Scenario: No broken imports
- **WHEN** the refactoring is complete
- **THEN** running lint and tests SHALL pass without import errors related to Joi schemas

#### Scenario: No references to old path
- **WHEN** searching the codebase for references to `utils/joiSchemas/joi.js`
- **THEN** there SHALL be zero references to the old schema file path
