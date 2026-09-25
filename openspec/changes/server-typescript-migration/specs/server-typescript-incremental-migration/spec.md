# Spec Delta

## Purpose

Incremental TypeScript migration of the `apps/server` workspace: Phase 0 infrastructure (verification-only tsconfig, type packages, `.ts` toolchain coverage, enabled typecheck CI gate) plus the per-file conversion protocol and phased rollout that guarantee the server keeps running at every commit.

## ADDED Requirements

### Requirement: Verification-only TypeScript infrastructure

The `apps/server` workspace SHALL have a `tsconfig.json` that type-checks without emitting (`noEmit: true`), coexists with JavaScript during the migration (`allowJs: true`), and resolves modules with `module: nodenext` / `moduleResolution: nodenext`. The runtime SHALL continue executing the `.js` sources directly (no build step, no `dist/` output). `strict` SHALL be `false` during Phase 0 and enabled incrementally (one flag per change) in the final phase.

#### Scenario: tsconfig does not break execution

- **WHEN** the server starts locally or in production (PM2 via `ecosystem.config.js`)
- **THEN** Node SHALL execute `src/bin/index.js` directly, exactly as before the migration infrastructure existed
- **AND** no `dist/` output, build script, or start-script change SHALL have been introduced

#### Scenario: tsconfig verifies both languages

- **WHEN** `npx tsc --noEmit` runs from `apps/server`
- **THEN** it SHALL verify the workspace without emitting files
- **AND** it SHALL accept the coexistence of `.js` and `.ts` files resolving each other's exports

#### Scenario: strict mode is deferred

- **WHEN** Phase 0 completes
- **THEN** `compilerOptions.strict` SHALL be `false`
- **AND** enabling strict flags one-by-one SHALL be deferred to the final migration phase

### Requirement: Type packages installed before first conversion

The `apps/server` `devDependencies` SHALL include the `@types/*` packages required by the baseline verification run — at minimum `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/swagger-jsdoc`, and `@types/swagger-ui-express` — so that Phase 1 conversion commits contain only code changes.

#### Scenario: Baseline verification has no missing-type errors

- **WHEN** `npx tsc --noEmit` runs with the installed type packages
- **THEN** no `Cannot find module ... or its corresponding type declarations` errors SHALL be reported for the runtime dependencies listed in the research document (§1.2)

### Requirement: Toolchain `.ts` coverage precedes code conversion

All quality-gate tooling that currently matches `apps/server` JavaScript SHALL cover `.ts` files BEFORE the first source file is converted: the backend and complexity blocks of `eslint.config.js`, the `lint` and `format` scripts of `apps/server/package.json`, the `apps/server` section of the root `knip.jsonc`, the path regexes of `apps/server/.dependency-cruiser.cjs`, the `include` globs of `apps/server/vitest.config.js`, and the eslint glob of the root `lint-staged` configuration. Prettier SHALL already cover `ts` via its existing glob.

#### Scenario: First converted file is covered by every gate

- **WHEN** the first `.ts` file appears in `apps/server/src`
- **THEN** eslint, knip, dependency-cruiser, vitest, prettier, and lint-staged SHALL all process it without further configuration changes

#### Scenario: Toolchain widening is verified on the all-JS codebase

- **WHEN** the Phase 0 toolchain changes are applied
- **THEN** eslint, knip, and dependency-cruiser runs SHALL produce no new findings (zero `.ts` files exist yet — widening must be a no-op on results)

### Requirement: Typecheck gate enabled in CI

The `server-typecheck` job in `.github/workflows/ci.yml` SHALL be enabled (its `if: false` condition and "no-op until TS migration" placeholder removed) and SHALL run `npx tsc --noEmit` from `apps/server` as a quality gate. The gate SHALL be enabled only after the local baseline run is green.

#### Scenario: CI blocks type regressions from the first conversion

- **WHEN** a pull request introduces a type error in a converted file
- **THEN** the `server-typecheck` job SHALL fail the pipeline

#### Scenario: Gate activation order

- **WHEN** Phase 0 is implemented
- **THEN** the job SHALL NOT be enabled before the local baseline verification (task order 1.3 → 1.4) has produced a green run

### Requirement: Per-file conversion protocol guarantees a green tree

Every conversion of a JavaScript file to TypeScript SHALL follow the protocol: one file per commit (or one uniform module per commit once the pattern is established); consumers' imports are not rewritten; the converted file's `@typedef` declarations are replaced in the same commit by TypeScript types (`types.ts` or inline interfaces); no new `any` is introduced (`unknown` + narrowing or a tracked `TODO(types)` instead); `@ts-nocheck` is only allowed as a justified exception with an expiration recorded in the change; and the commit is validated with typecheck, lint, module tests, and a server start smoke check before being committed.

#### Scenario: Conversion commit keeps the server running

- **WHEN** a file is converted from `.js` to `.ts` following the protocol
- **THEN** the commit SHALL leave the typecheck, lint, and module tests green
- **AND** the server SHALL still start successfully

#### Scenario: No dual source of truth for types

- **WHEN** a converted file previously declared `@typedef` types used by other files
- **THEN** those types SHALL exist as TypeScript declarations after the conversion commit
- **AND** the JSDoc `@typedef` declarations SHALL be removed in the same commit

#### Scenario: No new any escapes

- **WHEN** a type cannot be derived during a conversion
- **THEN** the file SHALL use `unknown` with narrowing or a tracked `TODO(types)` comment
- **AND** it SHALL NOT declare a new `any`

### Requirement: Phased rollout from graph leaves to core

The migration SHALL proceed in phases with the order: (1) graph leaves (`config/db`, `config/dotenv`, `config/cors`, `config/aws`, `common/crypto`, `logger`, `utils/constants/enums`, `schemas`), (2) the 24 business modules following the per-module file order schemas → dao → service → routes → controller, (3) transversal core (`middleware`, `socket`, then `app` and `bin/index` last), and (4) strict-mode hardening with one flag per change. Dead code flagged by knip (e.g., `clientOrder`, `providerOrder`) SHALL be audited for deletion before being migrated.

#### Scenario: Phase 1 starts at the leaves

- **WHEN** Phase 1 conversion begins
- **THEN** the first converted files SHALL be graph leaves such as `config/db.js`, whose conversion surfaces Prisma-generated types for all downstream modules

#### Scenario: Entry point is converted last

- **WHEN** Phases 1–3 are in progress
- **THEN** `src/bin/index.js` and `app.js` SHALL remain JavaScript until all their dependencies are converted

#### Scenario: Dead code is not migrated

- **WHEN** a file flagged as unused by knip is scheduled for conversion
- **THEN** its usage SHALL be audited first
- **AND** it SHALL be deleted instead of migrated if confirmed dead
