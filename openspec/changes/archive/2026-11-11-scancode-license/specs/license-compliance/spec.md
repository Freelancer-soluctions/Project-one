# license-compliance Specification (delta)

## MODIFIED Requirements

### Requirement: Escaneo de licencias PR-diff sobre archivos cambiados (dual job)

El workflow `ci.yml` SHALL ejecutar un job `scancode-license-pr-diff` que escanee con ScanCode los archivos cambiados en el PR y evalúe sus licencias contra la deny-list unificada. El job es blocking desde día uno: sin `continue-on-error`, evaluate step sale con exit 1 en violaciones, cableado a `prebuild-security-complete.needs`.

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
- **THEN** cada licencia se evalúa contra la clave `deny-licenses` del bloque `with:` del job `dependency-review` en `.github/workflows/ci.yml` (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `CC-BY-NC-4.0`), la misma configuración que evalúa `dependency-review`
- **AND** `docs/learning/license-policy.md` documenta esa configuración como fuente única para ambas capas

#### Scenario: LicenseRef-scancode-unknown\* clasificado como warning

- **WHEN** ScanCode no puede determinar la licencia y emite un identificador `LicenseRef-scancode-unknown*`
- **THEN** el gate lo clasifica como **warning** en FASE 1: se reporta en el log o resumen pero no cuenta como hallazgo bloqueante
- **AND** se crea un ticket con plazo de 30 días para resolver la licencia desconocida
- **AND** si la licencia permanece sin resolver después de 30 días, el hallazgo se escala a bloqueante

#### Scenario: Evidencia PR retenida 14 días

- **WHEN** el job termina (con o sin hallazgos)
- **THEN** el reporte `pr-license-report.json` se sube vía `actions/upload-artifact` con `retention-days: 14`
- **AND** el upload corre con `if: always()` e `if-no-files-found: warn`

#### Scenario: FASE 1 advisory (continue-on-error)

- **WHEN** el escaneo detecta una licencia de la deny-list en archivos del diff mientras rige la FASE 1
- **THEN** el job no bloquea el merge (`continue-on-error: true`) y deja el artifact con el hallazgo visible en log o comentario
- **AND** ninguna entrada de `required_status_checks` depende de este job en FASE 1
- **NOTE:** Superseded — el control es blocking desde día uno (2026-11-10).

#### Scenario: FASE 2 blocking gradual

- **WHEN** el job acumula 2-4 semanas de runs sin falsos positivos y con hallazgos triados
- **THEN** la remoción de `continue-on-error` convierte el check en blocking de forma gradual (un check por PR a la vez)
- **AND** `docs/learning/quality-gates.md` y `docs/learning/license-policy.md` reflejan el cambio de fase (`advisory (PR, fase 1)` → `blocking (PR)`)
- **NOTE:** Superseded — el control es blocking desde día uno (2026-11-10).

#### Scenario: Blocking from day one

- **WHEN** el escaneo detecta una licencia de la deny-list en archivos del diff
- **THEN** el job bloquea el merge (sin `continue-on-error`, evaluate step exit 1) y deja el artifact con el hallazgo visible en log o comentario
- **AND** `scancode-license-pr-diff` está en `prebuild-security-complete.needs` desde día uno

#### Scenario: Unknown license escalation

- **WHEN** un `LicenseRef-scancode-unknown*` permanece sin resolver después de 30 días
- **THEN** el hallazgo se escala a bloqueante (excepción vencida en `security/exceptions.yml`)

#### Scenario: Fila de taxonomía en quality-gates.md

- **WHEN** se revisa la tabla §2 de `docs/learning/quality-gates.md`
- **THEN** existe una fila para `scancode-license-pr-diff` con ubicación `ci.yml` y taxonomía acorde a la fase vigente
- **AND** menciona el umbral de deny-list y el artifact de 14 días
