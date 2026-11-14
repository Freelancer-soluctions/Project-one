# ci-dead-code-advisory-calibration Specification

## Purpose
Calibración de knip: upgrade, modos production/default, cache, ratchet y promoción documentada a blocking estricto, para evitar bloqueos por falsos positivos de configuración.

## Requirements

### Requirement: knip en versión actual

El repositorio SHALL usar knip 6.45.1 (o superior compatible) con `$schema` actualizado en `knip.jsonc`.

#### Scenario: Versión instalada

- **WHEN** se ejecuta `npx knip --version`
- **THEN** reporta 6.45.1 o superior compatible

### Requirement: Modo production en PR, default en scheduled

El job de dead code en PR SHALL ejecutar `knip --production --cache --no-exit-code` (solo código de producción + dependencies). Un job scheduled SHALL ejecutar en modo default (más hallazgos, incluye devDependencies).

#### Scenario: PR mode

- **WHEN** el job `*-dead-code` corre en un PR
- **THEN** usa `--production --cache --no-exit-code`
- **AND** no bloquea el merge mientras esté en calibración

#### Scenario: Scheduled mode

- **WHEN** el job scheduled corre
- **THEN** corre modo default (`knip:ci:scheduled`) y modo production (`knip:ci`) por separado
- **AND** el modo default reporta el alcance default (devDependencies, tests, stories); el modo production expone los 16 hallazgos de deuda real (assets dev-time)
- **AND** publica ambos reportes para triage humano

### Requirement: Ratchet y promoción documentada

Los hallazgos de knip SHALL ratchetearse (severidad por tipo `warn`→`error`, `--max-issues N`) y la promoción a blocking estricto SHALL documentarse en `quality-policy.md` con fecha.

#### Scenario: Promoción a blocking

- **WHEN** un tipo de hallazgo llega a cero
- **THEN** se pasa a `error` en `knip.jsonc` rules
- **AND** se registra en `quality-policy.md`

### Requirement: Reducción de puntos ciegos

La config `knip.jsonc` SHALL usar `ignoreExportsUsedInFile` para exports usados solo en su archivo y entradas explícitas en lugar de `ignore` masivo donde sea posible.

#### Scenario: Configuración limpia

- **WHEN** se revisa `knip.jsonc`
- **THEN** los `ignore` masivos se reducen a casos puntuales documentados
