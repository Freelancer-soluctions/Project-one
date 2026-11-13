# knip-config-single-source Specification (Delta)

## MODIFIED Requirements

### Requirement: Single root configuration file

The repository SHALL contain exactly one knip configuration file, `/knip.jsonc`, with `$schema` referencing knip@6 at version 6.45.1 (or a compatible 6.x release) matching the installed knip version. No knip configuration files SHALL exist under `apps/*`, `e2e/`, or any other nested directory.

#### Scenario: Nested config files absent

- **WHEN** a developer inspects the repository for knip configuration files
- **THEN** only `/knip.jsonc` is found
- **AND** `apps/client/knip.json` and `apps/server/knip.json` do not exist (nor any other `knip.json*` variant under nested directories)

#### Scenario: Schema matches installed version

- **WHEN** the `$schema` field of `/knip.jsonc` is checked against the installed knip version
- **THEN** it references `knip@6` at version 6.45.1 or compatible, not `knip@5` or a different major

#### Scenario: Version installed

- **WHEN** `npx knip --version` runs
- **THEN** it reports 6.45.1 or a compatible 6.x release
