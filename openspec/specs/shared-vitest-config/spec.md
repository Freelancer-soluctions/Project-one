## ADDED Requirements

### Requirement: Shared Vitest configuration exists at project root
The system SHALL provide a `vitest.shared.js` file at the project root that exports a shared Vitest configuration object.

#### Scenario: Shared config exports globals setting
- **WHEN** `vitest.shared.js` is imported
- **THEN** the exported object SHALL contain `test.globals` set to `true`

#### Scenario: Shared config exports coverage provider
- **WHEN** `vitest.shared.js` is imported
- **THEN** the exported object SHALL contain `test.coverage.provider` set to `'v8'`

#### Scenario: Workspace configs use mergeConfig
- **WHEN** `apps/server/vitest.config.js` is evaluated
- **THEN** it SHALL use `mergeConfig` from `vitest/config` to merge the shared config with server-specific settings (`environment: 'node'`, `setupFiles`)

#### Scenario: Client config uses mergeConfig
- **WHEN** `apps/client/vitest.config.js` is evaluated
- **THEN** it SHALL use `mergeConfig` from `vitest/config` to merge the shared config with client-specific settings (`environment: 'jsdom'`, React plugin, path aliases, `setupFiles`, `css: true`, `deps.optimizer`)
