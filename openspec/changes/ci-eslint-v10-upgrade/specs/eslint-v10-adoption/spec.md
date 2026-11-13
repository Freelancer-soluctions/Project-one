# eslint-v10-adoption Specification

## Purpose

Define el proceso de adopción de ESLint 10 con job advisory paralelo, validación de config flat, regeneración/creación de baseline y promoción, sin poner `main` en rojo.

## ADDED Requirements

### Requirement: Job advisory paralelo con ESLint 10

El repositorio SHALL tener un job `eslint-v10-advisory` en CI que ejecuta lint con ESLint 10 sobre client/server/e2e con `continue-on-error: true`, corriendo en paralelo al job blocking de ESLint 9, para validar la compatibilidad antes de promover.

#### Scenario: Advisory pasa

- **WHEN** el job advisory de ESLint 10 pasa
- **THEN** se puede proceder a la promoción en un PR de herramientas

#### Scenario: Advisory falla por configuración

- **WHEN** el job advisory de ESLint 10 falla por reglas renombradas/removidas o por errores de configuración flat
- **THEN** se corrige la config flat en el mismo PR de herramientas
- **AND** no se promueve hasta que el advisory pase

#### Scenario: Advisory falla por plugin upstream sin release compatible

- **WHEN** el job advisory de ESLint 10 falla porque un plugin usa una API removida en ESLint 10 (p. ej. `context.getFilename()`) y no existe una release del plugin compatible (peer `^10`)
- **THEN** no se promueve, porque la config flat no puede corregir código upstream del plugin
- **AND** el advisory permanece con `continue-on-error: true` sin bloquear merges
- **AND** se documentan el bloqueo y el criterio de salida de la ventana advisory en `quality-policy.md`

### Requirement: Validación de config flat

El advisory SHALL detectar reglas renombradas/removidas, errores de configuración flat y plugins incompatibles con ESLint 10, reportándolos como hallazgos del job.

#### Scenario: Regla removida

- **WHEN** una regla usada en `eslint.config.js` no existe en ESLint 10
- **THEN** el advisory reporta el error de configuración
- **AND** el job falla (aunque con `continue-on-error: true` no bloquea el merge)

### Requirement: Versión fijada y baseline condicional

Tras la promoción, ESLint SHALL estar fijado a versión exacta (sin caret) en `package.json` y lockfile. Si existe un baseline de supresiones (`eslint-suppressions.json`), se regenera en el mismo PR de herramientas si los hallazgos cambian; si no existe, se crea con `eslint --suppress-all` por workspace. En ambos casos, CODEOWNERS lo aprueba (tras añadir el patrón correspondiente).

#### Scenario: Baseline existente

- **WHEN** se promueve ESLint 10 y existe `eslint-suppressions.json`
- **THEN** si los hallazgos cambian, se regenera en el mismo PR de herramientas
- **AND** CODEOWNERS lo aprueba

#### Scenario: Baseline inexistente

- **WHEN** se promueve ESLint 10 y no existe `eslint-suppressions.json`
- **THEN** se crea con `npx eslint . --suppress-all` por workspace
- **AND** CODEOWNERS lo aprueba tras añadir el patrón correspondiente
