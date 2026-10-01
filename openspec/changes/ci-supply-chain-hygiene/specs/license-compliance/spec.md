# license-compliance Delta

## MODIFIED Requirements

### Requirement: Coherencia entre deny-list de config y documentación

La lista de licencias denegadas en `.github/license-policy.yml` SHALL coincidir exactamente con la documentada en la política, y la constante `LICENSE_DENY_LIST` de `scripts/security/generate-security-digest.mjs` SHALL ser un superconjunto documentado de ambas.

#### Scenario: Las tres fuentes coinciden

- **WHEN** se comparan la deny-list en `.github/license-policy.yml`, `LICENSE_DENY_LIST` en `generate-security-digest.mjs` y la lista de `license-policy.md`
- **THEN** la deny-list del archivo de política y la lista de `license-policy.md` contienen exactamente los mismos identificadores de licencia
- **AND** `LICENSE_DENY_LIST` del digest es un superconjunto: contiene cada identificador de la deny-list del archivo de política
- **AND** toda omisión o extensión del digest respecto del gate está justificada por escrito en `license-policy.md` (superconjunto intencional: familia GPL/LGPL/AGPL extendida + `SSPL-1.0` y `CC-BY-NC-4.0` del gate)
- **AND** ningún archivo declara `allow-licenses` mientras la deny-list esté activa

### Requirement: Escaneo de licencias PR-diff sobre archivos cambiados (dual job)

El workflow `ci.yml` SHALL ejecutar un job `scancode-license-pr-diff` que escanee con ScanCode los archivos cambiados en el PR y evalúe sus licencias contra la deny-list unificada de `.github/license-policy.yml`, en modo advisory durante la FASE 1.

#### Scenario: Job PR-diff presente y disparado por PR

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `scancode-license-pr-diff` con condición `if: github.event_name == 'pull_request'`
- **AND** su lista de archivos proviene de `git diff --name-only --diff-filter=ACMR` (Added/Copied/Modified/Renamed) contra la rama base

#### Scenario: Versión y salida pinnadas

- **WHEN** el job ejecuta ScanCode
- **THEN** usa la imagen `aboutcode/scancode-toolkit:32.5.0` (misma versión que el audit semanal)
- **AND** usa `--license --copyright --only-findings --json-pp` (nunca `--csv`, deprecado — scancode-toolkit issue #3043)

#### Scenario: Evaluación contra la deny-list unificada

- **WHEN** el reporte JSON declara licencias para un archivo del diff
- **THEN** cada licencia se evalúa contra la deny-list declarada en `.github/license-policy.yml` (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `CC-BY-NC-4.0`), la misma configuración que evalúa `dependency-review` vía su input `config-file`
- **AND** `docs/learning/license-policy.md` documenta ese archivo como fuente única para ambas capas

#### Scenario: LicenseRef-scancode-unknown\* clasificado como warning

- **WHEN** ScanCode no puede determinar la licencia y emite un identificador `LicenseRef-scancode-unknown*`
- **THEN** el gate lo clasifica como **warning**: se reporta en el log o resumen pero no cuenta como hallazgo bloqueante
- **AND** la regla aplica en FASE 1 y se mantiene en FASE 2 (nunca bloquea por indeterminación de licencia)

#### Scenario: Evidencia PR retenida 14 días

- **WHEN** el job termina (con o sin hallazgos)
- **THEN** el reporte `pr-license-report.json` se sube vía `actions/upload-artifact` con `retention-days: 14`
- **AND** el upload corre con `if: always()` e `if-no-files-found: warn`

#### Scenario: FASE 1 advisory (continue-on-error)

- **WHEN** el escaneo detecta una licencia de la deny-list en archivos del diff mientras rige la FASE 1
- **THEN** el job no bloquea el merge (`continue-on-error: true`) y deja el artifact con el hallazgo visible en log o comentario
- **AND** ninguna entrada de `required_status_checks` depende de este job en FASE 1

#### Scenario: FASE 2 blocking gradual

- **WHEN** el job acumula 2-4 semanas de runs sin falsos positivos y con hallazgos triados
- **THEN** la remoción de `continue-on-error` convierte el check en blocking de forma gradual (un check por PR a la vez)
- **AND** `docs/learning/quality-gates.md` y `docs/learning/license-policy.md` reflejan el cambio de fase (`advisory (PR, fase 1)` → `blocking (PR)`)

#### Scenario: Fila de taxonomía en quality-gates.md

- **WHEN** se revisa la tabla §2 de `docs/learning/quality-gates.md`
- **THEN** existe una fila para `scancode-license-pr-diff` con ubicación `ci.yml` y taxonomía acorde a la fase vigente
