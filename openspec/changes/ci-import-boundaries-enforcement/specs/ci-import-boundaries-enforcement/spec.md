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

Los scripts SHALL usar `depcruise --baseline` (no el deprecado `depcruise-baseline`) para regenerar el baseline.

#### Scenario: Regeneración

- **WHEN** se regenera el baseline
- **THEN** se usa `depcruise --baseline`
- **AND** el archivo `.dependency-cruiser-known-violations.json` se actualiza

### Requirement: Exit code fiable en CI

Los jobs y scripts de CI SHALL usar `--exit-code`/`-e` para bloqueo fiable. Las violaciones conocidas SHALL ignorarse con `--ignore-known`.

#### Scenario: Violación nueva

- **WHEN** aparece una violación no incluida en el baseline
- **THEN** depcruise sale con exit code != 0 (vía `--exit-code`)
- **AND** el job falla

#### Scenario: Violación conocida

- **WHEN** la violación está en el baseline
- **THEN** depcruise la ignora (`--ignore-known`)
- **AND** no bloquea

### Requirement: Ratchet documentado

La regeneración del baseline SHALL documentarse como ratchet (solo se poda, nunca crece) en `quality-policy.md`.

#### Scenario: Auditoría

- **WHEN** se revisa el baseline
- **THEN** su tamaño solo ha bajado desde la última revisión
