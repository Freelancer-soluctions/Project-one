# Spec Delta

## ADDED Requirements

### Requirement: TypeScript project configuration (tsconfig.json)

The monorepo SHALL own TypeScript checking through a root `tsconfig.json` used as the shared base configuration, and `apps/server/` SHALL have its own `tsconfig.json` that extends it and includes `src/**/*`. The initial state SHALL keep `strict: false` in favor of per-flag adoption (see the gradual adoption requirement); `noEmit` SHALL be enabled so type checking never emits build artifacts. `tsconfig.json` SHALL be the single source of truth for strictness flags — no strictness flag may be passed only via CLI arguments in CI or scripts while missing from the config files.

#### Scenario: Root config exists and is extended by the server workspace

- **WHEN** `tsconfig.json` (root) and `apps/server/tsconfig.json` are read
- **THEN** the root config SHALL exist and `apps/server/tsconfig.json` SHALL `extends` it
- **AND** `apps/server/tsconfig.json` SHALL include `src/**/*`

#### Scenario: Initial state keeps strict off

- **WHEN** the change is first applied
- **THEN** `strict` SHALL be `false` (or absent) in the effective server configuration, with strictness granted flag by flag instead of `strict: true`

#### Scenario: Checking emits nothing

- **WHEN** `tsc --noEmit -p apps/server` runs
- **THEN** the command SHALL perform type checking without writing output files

#### Scenario: Config is the single source of truth

- **WHEN** local scripts and CI jobs type check the server workspace
- **THEN** the strictness flags applied SHALL come from `tsconfig.json` files, not from ad-hoc CLI flags

### Requirement: Gradual adoption of strict flags in apps/server

Strictness SHALL be adopted gradually in `apps/server/`, one flag (or one homogeneous sub-group of flags) per step, in order of increasing cost: cheap opt-ins first (`noImplicitReturns`, `noFallthroughCasesInSwitch`), then the `strict` family (`noImplicitAny`, then `strictNullChecks` with `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`), then `useUnknownInCatchVariables`, and `noUncheckedIndexedAccess` LAST. Each step SHALL be measurable with a `tsc --noEmit` error baseline before and after. `strict: true` SHALL NOT be flipped in a single step while error-producing flags remain unadopted.

#### Scenario: Cheap flags lead the adoption

- **WHEN** adoption begins
- **THEN** `noImplicitReturns` and `noFallthroughCasesInSwitch` SHALL be enabled before any high-cost flag

#### Scenario: noImplicitAny precedes strictNullChecks

- **WHEN** the `strict` family is enabled incrementally
- **THEN** `noImplicitAny` SHALL be adopted before `strictNullChecks`

#### Scenario: useUnknownInCatchVariables is part of the family

- **WHEN** the server error-handling middleware is checked
- **THEN** with `useUnknownInCatchVariables` enabled, `catch (err)` SHALL type `err` as `unknown`, requiring explicit narrowing (e.g. `err instanceof Error`)

#### Scenario: noUncheckedIndexedAccess comes last

- **WHEN** flags are prioritized
- **THEN** `noUncheckedIndexedAccess` SHALL be the final strictness flag adopted, after all `strict`-family flags

#### Scenario: No single big-bang strict flip

- **WHEN** `tsconfig.json` files are edited
- **THEN** `strict: true` SHALL NOT be set while one or more required flags from the order above are still unadopted

### Requirement: type-check scripts and pre-commit coverage

The root `package.json` SHALL define a `type-check` script running `tsc --noEmit` against the server workspace (and `apps/server/package.json` SHALL expose an equivalent workspace script). `lint-staged` SHALL cover `*.ts` staged files so TypeScript files are checked/formatted at pre-commit time, while full-project validation remains the responsibility of the `type-check` script and CI.

#### Scenario: Local type check command works

- **WHEN** `npm run type-check` runs at the repo root (or `npm run type-check --workspace=apps/server`)
- **THEN** `tsc --noEmit` SHALL execute against `apps/server` and exit non-zero on type errors

#### Scenario: lint-staged covers TypeScript files

- **WHEN** a `*.ts` file is staged and a commit is created
- **THEN** `lint-staged` SHALL apply its TypeScript pipeline (formatting, and lint/type steps as configured) to that file

#### Scenario: Full project check stays out of pre-commit hot path

- **WHEN** lint-staged runs on commit
- **THEN** the configuration SHALL NOT require a full non-incremental project type check on every commit (that check belongs to `type-check` and CI)

### Requirement: CI typecheck jobs enforce real failures

In `.github/workflows/ci.yml`, the `server-typecheck` and `client-typecheck` jobs SHALL run without `if: false` and their step SHALL fail the job on type errors — the `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op until TS migration"` pattern SHALL be removed, because `|| echo` always exits 0 and hides failures. Both jobs SHALL remain wired through `needs` into `prebuild-quality-complete` so the aggregate quality gate blocks merge on type errors.

#### Scenario: server-typecheck is enabled

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** the `server-typecheck` job SHALL NOT carry `if: false`

#### Scenario: server-typecheck fails on real errors

- **WHEN** `npm run type-check` (server) reports one or more type errors during CI
- **THEN** the `server-typecheck` job SHALL fail and block the PR

#### Scenario: No silent no-op fallback

- **WHEN** the typecheck steps of `server-typecheck` and `client-typecheck` are inspected
- **THEN** no `|| echo` (or equivalent always-succeeding) fallback SHALL remain in the typecheck command

#### Scenario: client-typecheck is enabled

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** the `client-typecheck` job SHALL NOT carry `if: false` and SHALL run its type check step

#### Scenario: Aggregate gate includes type checks

- **WHEN** `prebuild-quality-complete` evaluates
- **THEN** its `needs` SHALL include `server-typecheck` and `client-typecheck`

### Requirement: Strict-check documentation and official references

`docs/learning/typescript-strict-check.md` SHALL be updated to reflect the implemented state (existing `tsconfig.json` files, adopted flag order, `type-check` scripts, `lint-staged` coverage, CI jobs without `if: false`/`|| echo`) and SHALL cite official TypeScript documentation (`typescriptlang.org`) as normative references for flag semantics: at minimum `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/` and `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html`.

#### Scenario: Doc matches implemented state

- **WHEN** `docs/learning/typescript-strict-check.md` is read after the change
- **THEN** its description of tsconfig files, scripts, lint-staged and CI jobs SHALL match the repository state

#### Scenario: Official references present

- **WHEN** the doc's references section is read
- **THEN** it SHALL link `typescriptlang.org` documentation for `strict`, the tsconfig flag list and the `tsconfig.json` handbook page
