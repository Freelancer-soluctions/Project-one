# ci-import-boundaries-enforcement Specification

## Purpose

Gobernanza del baseline de import boundaries: CODEOWNERS, comando actualizado, exit code fiable, ratchet.

## ADDED Requirements

### Requirement: Baseline bajo CODEOWNERS

El archivo de baseline (`.dependency-cruiser-known-violations.json`) SHALL estar bajo CODEOWNERS (owner de plataforma) y solo regenerarse en un PR dedicado.

#### Scenario: Regeneración de baseline

- **WHEN** un PR modifica el baseline
- **THEN** se requiere aprobación del owner de plataforma
- **AND** el PR no mezcla otros cambios

### Requirement: Comando de baseline actualizado

Los scripts SHALL usar `depcruise --baseline` (no el deprecado `depcruise-baseline`) para regenerar el baseline, con `--baseline-mode shrink-only` para que la regeneración solo pode violaciones corregidas y nunca añada nuevas.

#### Scenario: Regeneración

- **WHEN** se regenera el baseline
- **THEN** se usa `depcruise --baseline --baseline-mode shrink-only`
- **AND** el archivo `.dependency-cruiser-known-violations.json` se actualiza sin añadir violaciones nuevas

### Requirement: Exit code fiable en CI

El CLI principal `depcruise` NO expone `--exit-code`/`-e` (ese flag solo existe en el binario `depcruise-fmt`). El bloqueo fiable SHALL provenir del exit code del reporter `err`/`err-long`, que devuelve el número de violaciones de severidad `error` (`advisedExitCode`), combinado con `--ignore-known` para excluir las violaciones del baseline. Las violaciones conocidas SHALL ignorarse con `--ignore-known`. Las violaciones de severidad `warn` no bloquean por diseño (deuda controlada).

#### Scenario: Violación nueva de severidad error

- **WHEN** aparece una violación de severidad `error` no incluida en el baseline
- **THEN** depcruise sale con exit code != 0 (= número de violaciones `error`, vía reporter `err`)
- **AND** el job falla

#### Scenario: Violación conocida

- **WHEN** la violación está en el baseline
- **THEN** depcruise la ignora (`--ignore-known`)
- **AND** no bloquea

### Requirement: Ratchet documentado

La regeneración del baseline SHALL documentarse como ratchet mecánico (`--baseline-mode shrink-only`: solo se poda, nunca crece) en `quality-policy.md`, y ejecutarse solo en un PR dedicado.

#### Scenario: Auditoría

- **WHEN** se revisa el baseline
- **THEN** su tamaño solo ha bajado desde la última revisión
