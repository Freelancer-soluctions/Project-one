# ci-caching Specification

## Purpose

Caching multi-capa del pipeline de CI — dependencias npm y cache raíz de Vitest — centralizado en la composite action `setup-monorepo`, para minimizar el tiempo de los jobs de test. Modernizada respecto del delta heredado: majors vigentes (`setup-node@v5`, `actions/cache@v5`) y la cache raíz `node_modules/.cache` que cubre Vitest (npm hoists dependencias). Estado verificado en el árbol 2026-10-01: implementado.

## Requirements

### Requirement: npm dependency caching via setup-monorepo

The composite action `.github/actions/setup-monorepo` SHALL cache npm dependencies using setup-node's built-in npm cache with `setup-node@v5`.

#### Scenario: npm cache via setup-node

- **WHEN** `setup-node@v5` runs inside the composite action
- **THEN** the npm cache is enabled with `cache: 'npm'` and `cache-dependency-path: package-lock.json`

### Requirement: Vitest root-level caching

The composite action SHALL cache the root-level shared tooling cache directory (`node_modules/.cache`) with `actions/cache@v5` so unaffected Vitest runs are faster.

#### Scenario: Vitest cache via actions/cache

- **WHEN** `actions/cache@v5` runs for the tooling cache
- **THEN** `node_modules/.cache` (root-level — npm hoists dependencies) is cached with a key derived from `hashFiles('package-lock.json')`
- **AND** a restore-keys fallback recovers a partial cache when the lockfile changes

### Requirement: CI performance target

The CI pipeline SHALL keep test-job durations minimized by the caching layers, and the achieved durations SHALL be recorded during the FASE 1 calibration window (task 3.2) as the evidence for the sharding precondition.

#### Scenario: Durations recorded with caching active

- **WHEN** the calibration window produces per-job durations
- **THEN** those durations reflect the caching layers being active (composite action used by all test jobs)
- **AND** they serve as the input for the P2 sharding decision (duration-based activation)
