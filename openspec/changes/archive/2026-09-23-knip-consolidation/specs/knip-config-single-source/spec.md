# Spec Delta

## Purpose

Defines a single-source-of-truth knip configuration for the monorepo: exactly one root `knip.json` declares entry, project, and ignore configuration for every workspace, so dead-code analysis scope is identical from any working directory and in CI.

## ADDED Requirements

### Requirement: Single root configuration file

The repository SHALL contain exactly one knip configuration file, `/knip.jsonc`, with `$schema: "https://unpkg.com/knip@6/schema-jsonc.json"` (the JSONC variant of the official schema) matching the installed knip major version (6.32.2). No knip configuration files SHALL exist under `apps/*`, `e2e/`, or any other nested directory.

#### Scenario: Nested config files absent

- **WHEN** a developer inspects the repository for knip configuration files
- **THEN** only `/knip.jsonc` is found
- **AND** `apps/client/knip.jsonc` and `apps/server/knip.jsonc` do not exist

#### Scenario: Schema matches installed version

- **WHEN** the `$schema` field of `/knip.jsonc` is checked against the installed knip version
- **THEN** it references `knip@6`, not `knip@5` or a different major

### Requirement: All workspaces declared in root config

Root `/knip.jsonc` SHALL declare a `workspaces` section for every npm workspace plus the root workspace: `"."`, `"apps/client"`, `"apps/server"`, and `"e2e"`.

#### Scenario: Root workspace analyzed

- **WHEN** `npx knip --workspace=. --no-progress` runs from the repo root
- **THEN** root-level files (`scripts/**`, `eslint.config.js`, husky hooks) are analyzed using the `"."` section's `entry`/`project` globs

#### Scenario: e2e workspace analyzed

- **WHEN** a full `npx knip` run analyzes the `e2e` workspace (declared in `package.json#workspaces`)
- **THEN** the `"e2e"` section's `project` globs define its analysis scope
- **AND** e2e files are not reported under default, unconfigured scope

### Requirement: Widened project globs attribute in-scope consumers

Each workspace's `project` globs SHALL cover all first-party source files whose imports must be attributed to dependencies: `apps/client` includes `src`, `tests`, `.storybook`, and root-level `*.config.{js,mjs}` files; `apps/server` includes `src`, `prisma`, and `tests`; `e2e` includes its test sources. A dependency used only by files inside these globs SHALL NOT be reported as unused.

#### Scenario: Client test-setup dependency attributed

- **WHEN** `msw` is imported only from `tests/setup/**` files
- **THEN** `npx knip --workspace=apps/client` does NOT report `msw` as an unused dependency, provided `tests/**` is inside the client `project` globs and `msw` is absent from `ignoreDependencies`

#### Scenario: Server prisma scripts attributed

- **WHEN** a dependency is imported only from `prisma/**/*.js`
- **THEN** it is not reported as unused by `npx knip --workspace=apps/server`

### Requirement: Reconciled ignore lists

The root config SHALL carry one reconciled ignore set per workspace: `ignore` and `ignoreIssues` are the union of the former root and nested entries with root precedence on conflicts, and no entry duplicates another for the same file. Files with intentional unused exports SHALL use `ignoreIssues` with the `exports` issue type rather than blanket `ignore`, so other issue types in those files remain reported.

#### Scenario: Client ignore union preserved

- **WHEN** the consolidated `workspaces."apps/client"` section is compared against the former root section (23 `ignore` entries) and the former nested file (2 `ignore` entries, 20 `ignoreIssues` entries)
- **THEN** no entry present in either source is silently dropped
- **AND** `fieldLimits.js` and `socketService.js` are covered by `ignoreIssues: ["exports"]` instead of blanket `ignore`

#### Scenario: Redundant ignoreDependencies removed after glob widening

- **WHEN** a dependency formerly in `ignoreDependencies` (`msw`, `globals`, `@storybook/addon-docs`, `@chromatic-com/storybook`) is used only by files now inside the `project` globs
- **THEN** it is removed from `ignoreDependencies` and no longer reported as unused

#### Scenario: Accidental installs flagged

- **WHEN** `add` and `command` remain in the client `ignoreDependencies` audit
- **THEN** they are documented as uninstall candidates in the change artifacts rather than silently kept as ignores

### Requirement: Root-CWD analysis invariant

All sanctioned knip invocations SHALL run with the repository root as working directory, where `/knip.jsonc` is loaded. Workspace selection via `--workspace` SHALL filter analysis only and SHALL NOT change which configuration file is loaded. Raw `npx knip` inside a workspace directory runs config-less (knip does not walk up to the root config); developers SHALL use the root npm scripts instead of `cd <workspace> && npx knip`.

#### Scenario: Workspace filter does not switch config

- **WHEN** `npx knip --workspace=apps/client` runs from the repo root
- **THEN** the `workspaces."apps/client"` section of `/knip.jsonc` is used
- **AND** no other configuration file is consulted

#### Scenario: npm scripts enforce the root CWD

- **WHEN** a developer runs `npm run knip:server` (or `knip:client`, `knip`, `knip:ci`) from the repo root
- **THEN** knip executes with the repository root as working directory and loads `/knip.jsonc`
- **AND** results match `npx knip --workspace=apps/server` run from the repo root

### Requirement: Root npm scripts for per-workspace runs

Root `package.json` SHALL provide npm scripts (`knip`, `knip:client`, `knip:server`, `knip:ci`) that execute knip from the repository root so every invocation uses `/knip.jsonc`.

#### Scenario: Per-workspace script uses root config

- **WHEN** a developer runs `npm run knip:client`
- **THEN** the command executes `knip --workspace=apps/client` with the repo root as working directory
- **AND** `/knip.jsonc` is the loaded configuration
