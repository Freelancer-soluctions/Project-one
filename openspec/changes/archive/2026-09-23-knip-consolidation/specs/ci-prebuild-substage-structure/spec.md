# Spec Delta

## MODIFIED Requirements

### Requirement: Per-workspace knip.json with correct schema

knip SHALL use a single configuration file, the root `/knip.jsonc`, with `$schema: "https://unpkg.com/knip@6/schema-jsonc.json"` (the JSONC variant of the official schema) matching the installed version (6.32.2). Per-workspace behavior SHALL be expressed through its `workspaces` sections (`"."`, `"apps/client"`, `"apps/server"`, `"e2e"`), never through nested per-workspace config files.

#### Scenario: knip runs in CI and locally

- **WHEN** knip runs via `client-dead-code` or `server-dead-code` in CI, or via `npx knip --workspace apps/client` locally
- **THEN** it uses the root `knip.jsonc` in every case — `--workspace` filters the analyzed workspaces but does NOT switch configuration files
- **AND** the `$schema` field references `knip@6` (not `knip@5`)

#### Scenario: No nested config files

- **WHEN** the repository is inspected after this change
- **THEN** `apps/client/knip.json` and `apps/server/knip.json` do not exist
- **AND** all knip invocations from any working directory resolve `/knip.jsonc`

### Requirement: Baseline calibration of ignores

The system SHALL calibrate ignores in the `workspaces` sections of the root `knip.jsonc` when the knip baseline reports false positives, and document them in the change.

#### Scenario: False positives on first run

- **WHEN** `npx knip` runs for the first time against the codebase and reports false positives
- **THEN** the false positives are added to the `ignore` (or more surgically, `ignoreIssues`) array of the corresponding workspace section in the root `knip.jsonc`
- **AND** the calibration is documented in the change artifacts

### Requirement: Phase 1 non-blocking knip activation

The system SHALL activate `client-dead-code` and `server-dead-code` jobs with `continue-on-error: true` so they report but do not block the merge. Each dead-code job SHALL run knip from the repository root against the root `knip.jsonc` (`npx knip --workspace=apps/client …`, `npx knip --workspace=apps/server …`).

#### Scenario: PR touches client workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=true`
- **THEN** the `client-dead-code` job runs `npx knip --workspace=apps/client --no-progress` with `continue-on-error: true`, with the repository root as working directory
- **AND** the job does NOT block the merge regardless of knip findings

#### Scenario: PR touches server workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `server=true`
- **THEN** the `server-dead-code` job runs `npx knip --workspace=apps/server --no-progress` with `continue-on-error: true`, with the repository root as working directory
- **AND** the job does NOT block the merge regardless of knip findings

#### Scenario: PR does not touch the workspace

- **WHEN** a PR targets `main` and `repo-discovery` outputs `client=false` (or `server=false`)
- **THEN** the corresponding dead-code job is skipped via `if: needs.repo-discovery.outputs.client == 'true'` (or server equivalent)
