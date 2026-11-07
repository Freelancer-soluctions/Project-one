# test-sharding-safety-gates Specification

## Purpose

Protege la integridad de la suite cuando se reparte en shards: en CI, un `.only` olvidado SHALL hacer fallar la corrida (Playwright y Vitest) para que no reduzca la suite en silencio, mientras que en local sigue permitido como herramienta de depuración. Además fija y documenta el comando con el que un desarrollador reproduce localmente un shard concreto con el mismo subconjunto de tests que ejecuta CI, de modo que un fallo aislado por shard sea diagnosticable fuera del pipeline.

## Requirements

### Requirement: forbidOnly in CI for Playwright and Vitest

In CI, `.only` SHALL be forbidden so a forgotten `.only` cannot reduce the suite silently.

#### Scenario: .only fails in CI

- **WHEN** a test uses `.only` and CI=true
- **THEN** the run fails

#### Scenario: .only allowed locally

- **WHEN** a developer runs locally without CI
- **THEN** `.only` is allowed for debugging

### Requirement: Local shard reproducibility documented

The project SHALL document the command to run a specific shard locally.

#### Scenario: Documented command works

- **WHEN** a developer runs the documented `--shard=2/4` command
- **THEN** the same subset of tests runs as in CI
