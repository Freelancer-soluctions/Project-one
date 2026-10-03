# Spec Delta

## Purpose

Este change absorbe el orden gradual de adopción de flags `strict` del change `typescript-strict-check` (eliminado) como dueño único. Los aspectos de infraestructura (tsconfigs, scripts `type-check`, jobs CI sin `if: false`/`|| echo`) ya están normativamente cubiertos por el requirement "Cosmetic quality gates fixed (if:false and || echo)" de la main spec `config-correctness`; este delta añade únicamente lo que ninguna requirement cubre: el ORDEN de adopción y su prohibición de big-bang.

## ADDED Requirements

### Requirement: Gradual adoption of strict flags in apps/server

Strictness SHALL be adopted gradually in `apps/server/`, one flag (or one homogeneous sub-group of flags) per step, in order of increasing cost: cheap opt-ins first (`noImplicitReturns`, `noFallthroughCasesInSwitch`), then the `strict` family (`noImplicitAny`, then `strictNullChecks` with `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`), then `useUnknownInCatchVariables`, and `noUncheckedIndexedAccess` LAST. Each step SHALL be measurable with a `tsc --noEmit` error baseline before and after. `strict: true` SHALL NOT be flipped in a single step while error-producing flags remain unadopted. `tsconfig.json` SHALL be the single source of truth for strictness flags — no strictness flag may be passed only via CLI arguments in CI or scripts while missing from the config files.

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

#### Scenario: Config is the single source of truth

- **WHEN** local scripts and CI jobs type check the server workspace
- **THEN** the strictness flags applied SHALL come from `tsconfig.json` files, not from ad-hoc CLI flags

### Requirement: Strict-mode documentation with official references

`docs/learning/typescript-strict-check.md` SHALL reflect the implemented strictness state (existing `tsconfig.json` files, adopted flag order, `type-check` scripts, `lint-staged` coverage, CI jobs without `if: false`/`|| echo`) and SHALL cite official TypeScript documentation (`typescriptlang.org`) as normative references for flag semantics: at minimum `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/` and `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html`.

#### Scenario: Doc matches implemented state

- **WHEN** `docs/learning/typescript-strict-check.md` is read after the change
- **THEN** its description of tsconfig files, scripts, lint-staged and CI jobs SHALL match the repository state

#### Scenario: Official references present

- **WHEN** the doc's references section is read
- **THEN** it SHALL link `typescriptlang.org` documentation for `strict`, the tsconfig flag list and the `tsconfig.json` handbook page
