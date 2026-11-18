# license-policy-config Specification

## Purpose

Define `.github/license-policy.yml` como la única fuente de verdad ejecutable de la deny-list de licencias del pipeline PR, consumida por los jobs `dependency-review` (input `config-file` de `dependency-review-action`) y `scancode-license-pr-diff` (lectura directa validada). Elimina la duplicación de configuración inline y el scraping del propio workflow (grep sobre `ci.yml`), que era frágil ante cambios de indentación o formato.

## ADDED Requirements

### Requirement: Archivo de política de licencias versionado y único

El repo SHALL mantener `.github/license-policy.yml` como única fuente ejecutable de la deny-list de licencias, versionado en git, y SHALL NOT contener ninguna otra fuente ejecutable de esa lista (clave inline en `ci.yml` ni copias hardcodeadas en otros jobs o scripts de evaluación).

#### Scenario: Archivo presente con la deny-list vigente

- **WHEN** se inspecciona `.github/license-policy.yml`
- **THEN** declara la deny-list con exactamente los identificadores `GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `CC-BY-NC-4.0`
- **AND** todos los identificadores son SPDX válidos
- **AND** el archivo no declara `allow-licenses` simultáneamente (mutuamente excluyentes)

#### Scenario: Sin duplicación de fuente ejecutable

- **WHEN** se busca dónde está definida la deny-list ejecutable del pipeline
- **THEN** `.github/license-policy.yml` es la única fuente
- **AND** `.github/workflows/ci.yml` no contiene la clave inline `deny-licenses`
- **AND** ningún job de evaluación hardcodea la lista ni la extrae scrapeando el YAML del workflow

### Requirement: Consumo unificado y validado de la deny-list

El job `dependency-review` SHALL consumir la política vía el input `config-file` de `dependency-review-action`, y el job `scancode-license-pr-diff` SHALL leer el mismo archivo directamente y validar el parseo antes de evaluar el reporte de ScanCode.

#### Scenario: dependency-review via config-file

- **WHEN** se lee el bloque `with:` del job `dependency-review` en `.github/workflows/ci.yml`
- **THEN** el job declara `config-file: .github/license-policy.yml`
- **AND** el job no declara `deny-licenses` inline
- **AND** las demás opciones vigentes (`fail-on-severity: moderate`, `comment-summary-in-pr: on-failure`) se conservan

#### Scenario: scancode-license-pr-diff lee el archivo con validación

- **WHEN** el job `scancode-license-pr-diff` evalúa el reporte JSON de ScanCode
- **THEN** obtiene la deny-list leyendo `.github/license-policy.yml`
- **AND** valida que el parseo produjo una lista no vacía antes de evaluar (fallo explícito con `::error::` si no)
- **AND** no ejecuta grep/sed sobre `ci.yml` para extraer configuración

#### Scenario: Config inválida falla temprano

- **WHEN** el archivo de política es sintácticamente inválido o contiene un identificador no-SPDX
- **THEN** los consumidores fallan en tiempo de configuración (la acción valida al arranque antes de escanear; el step bash del consumidor ScanCode valida el parseo antes de evaluar)
- **AND** el fallo es visible en el log del job con el motivo
