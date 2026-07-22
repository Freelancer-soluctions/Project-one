## ADDED Requirements

### Requirement: Server unit test files follow `*.unit.test.js` naming
All server test files located in `apps/server/tests/unit/` SHALL use the `.unit.test.js` suffix.

#### Scenario: Unit test files renamed
- **WHEN** a server unit test file exists in `tests/unit/`
- **THEN** its filename SHALL match the pattern `*.unit.test.js`

#### Scenario: Integration test files renamed
- **WHEN** a server integration test file exists in `tests/integration/`
- **THEN** its filename SHALL match the pattern `*.integration.test.js`

### Requirement: Root test scripts use `--workspaces --if-present`
All root-level test scripts in `package.json` SHALL use the `--workspaces --if-present` flags to delegate to workspace scripts.

#### Scenario: Root test script delegates to workspaces
- **WHEN** `npm run test` is executed at project root
- **THEN** it SHALL run tests across all workspaces using `--workspaces --if-present`

#### Scenario: Root test:server runs server tests
- **WHEN** `npm run test:server` is executed at project root
- **THEN** it SHALL run tests only for the server workspace

#### Scenario: Root test:client runs client tests
- **WHEN** `npm run test:client` is executed at project root
- **THEN** it SHALL run tests only for the client workspace

#### Scenario: Root test:ci runs CI-optimized test suite
- **WHEN** `npm run test:ci` is executed at project root
- **THEN** it SHALL execute the full test suite in CI-optimized mode (no watch, with coverage)

### Requirement: Workspace package.json includes all standard test scripts
Both `apps/server/package.json` and `apps/client/package.json` SHALL define the following scripts: `test:watch`, `test:changed`, `test:coverage`, `test:unit`, `test:integration`.

#### Scenario: Server has all test scripts
- **WHEN** examining `apps/server/package.json` scripts
- **THEN** `test:watch`, `test:changed`, `test:coverage`, `test:unit`, and `test:integration` SHALL be defined

#### Scenario: Client has all test scripts
- **WHEN** examining `apps/client/package.json` scripts
- **THEN** `test:watch`, `test:changed`, `test:coverage`, `test:unit`, and `test:integration` SHALL be defined

### Requirement: Testing architecture docs reflect all changes
The `docs/testing-architecture.md` document SHALL be updated to reflect the shared config, standardized naming, and new script patterns.

#### Scenario: Docs updated with shared config reference
- **WHEN** reading `docs/testing-architecture.md`
- **THEN** it SHALL reference the shared `vitest.shared.js` configuration approach

#### Scenario: Docs updated with new script table
- **WHEN** reading `docs/testing-architecture.md` section 5 (Workspaces)
- **THEN** it SHALL list all available test scripts with descriptions

#### Scenario: Docs updated with naming convention
- **WHEN** reading `docs/testing-architecture.md` section 7 (Conventions)
- **THEN** server test naming SHALL be documented as `*.unit.test.js` / `*.integration.test.js`
