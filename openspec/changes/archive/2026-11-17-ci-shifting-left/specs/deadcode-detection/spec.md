# deadcode-detection Specification

## Purpose

Detects unused dependencies, exports, and files across the monorepo using knip in CI, running both the default analysis and a production-mode analysis, so dead code is removed instead of accumulating and inflating the bundle and attack surface.

## ADDED Requirements

### Requirement: Knip configuration for monorepo

The repository SHALL include a `knip.json` at the root that configures knip for the monorepo workspaces, so unused code detection covers all packages.

#### Scenario: Knip config present

- **WHEN** the repository contains `knip.json` at the root
- **THEN** knip SHALL analyze all npm workspaces of the monorepo
- **AND** the config SHALL define entry points and project file patterns for each workspace

#### Scenario: Workspace entry points configured

- **WHEN** a workspace has entry points (e.g., `src/index.js`, `src/bin/index.js`)
- **THEN** knip SHALL use those entry points to determine reachable code
- **AND** exports not reachable from any entry point SHALL be reported as unused

### Requirement: CI dead code detection job

The CI pipeline SHALL include a `knip` job that runs knip in default mode and in `--production` mode, failing when unused dependencies, exports, or files are found.

#### Scenario: Unused dependency detected

- **WHEN** a dependency in any workspace is not used by any source file
- **THEN** the `knip` job SHALL report the unused dependency
- **AND** the job SHALL exit with code 1, failing the PR check

#### Scenario: Unused export or file detected

- **WHEN** an export or file is not reachable from any entry point
- **THEN** the `knip` job SHALL report the unused export or file
- **AND** the job SHALL fail the PR check

#### Scenario: Production mode analysis

- **WHEN** the `knip` job runs with `--production` mode
- **THEN** knip SHALL analyze only production dependencies (excluding devDependencies)
- **AND** unused production dependencies SHALL be reported separately

#### Scenario: No dead code found

- **WHEN** all dependencies, exports, and files are used
- **THEN** the `knip` job SHALL pass
- **AND** the PR check SHALL report success
