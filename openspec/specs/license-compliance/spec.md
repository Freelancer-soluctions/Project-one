# license-compliance Specification

## Purpose

Gobierna el cumplimiento de licencias de `project-one` como un sistema de capas complementarias con una única fuente de verdad: la política escrita en `docs/learning/license-policy.md` y la deny-list efectiva del gate PR (clave `deny-licenses` del job `dependency-review` en `.github/workflows/ci.yml`), que DEBEN coincidir exactamente; el digest semanal (`LICENSE_DENY_LIST` en `scripts/security/generate-security-digest.mjs`) es un superconjunto deliberado y documentado de ambas.

Invariantes que esta spec protege:

- **Cobertura dual obligatoria**: el audit semanal de repo completo (job `scancode-license-audit` en `scheduled-security.yml`, artifact `scancode-report.json` 90d) y el escaneo PR-diff (job `scancode-license-pr-diff` en `ci.yml`, artifact `pr-license-report.json` 14d) conviven — ninguno sustituye al otro; `dependency-review` cubre solo manifiestos/lockfiles del diff y NO cierra el gap de archivos fuente/vendor.
- **Deny-list única sin duplicación**: cualquier capa nueva (ScanCode u otra) evalúa la misma lista leyéndola de la config del gate, nunca una copia hardcodeada.
- **`LicenseRef-scancode-unknown*` es warning permanente**: la indeterminación de licencia nunca bloquea, en ninguna fase.
- **Arranque advisory, bloqueo gradual**: las capas nuevas de escaneo entran con `continue-on-error: true` (FASE 1) y solo pasan a blocking tras evidencia de runs limpios (FASE 2), actualizando la taxonomía de `docs/learning/quality-gates.md` §2 al cambiar de fase.
- **Toda capa de licencias se registra en la taxonomía de `quality-gates.md` §2 antes de considerarse activa.**

Fuera de alcance de esta spec: código de aplicación, adopción de FOSSA (documentada como alternativa, requiere `FOSSA_API_KEY` + GitHub App) y emisión de SARIF desde herramientas de licencias (FOSSA y ScanCode no emiten SARIF; el SARIF de dependencias del Security tab proviene de Trivy).

## Requirements

### Requirement: Política de licencias documentada

El repo SHALL mantener un documento de política de licencias que explique la lista `deny-licenses` efectiva, la regla de exclusión mutua con `allow-licenses`, el mecanismo de waivers y cómo validar la política localmente.

#### Scenario: Documento de política existe y es localizable

- **WHEN** se busca la política de licencias en `docs/`
- **THEN** existe `docs/learning/license-policy.md`
- **AND** documenta la lista deny (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `CC-BY-NC-4.0`)
- **AND** explica la restricción SPDX: toda entrada de `deny-licenses` DEBE ser un identificador SPDX válido (la acción valida la config al arranque y falla antes de escanear dependencias ante tokens inválidos; las licencias privadas llegan como `Other`/`NOASSERTION` y se cubren en la capa ScanCode PR-diff)
- **AND** explica que `allow-licenses` y `deny-licenses` son mutuamente excluyentes (exactamente una puede definirse)

#### Scenario: Waivers documentados

- **WHEN** se lee la sección de waivers de la política
- **THEN** describe el uso de `allow-ghsas` (vacío por defecto) para eximir vulnerabilidades puntuales
- **AND** indica que las excepciones de licencia requieren registro explícito en el documento

#### Scenario: Enlaces cruzados desde las doc de la capa

- **WHEN** se revisan `docs/learning/license-compliance.md` y `docs/learning/dependency-review.md`
- **THEN** ambas referencian `docs/learning/license-policy.md` como fuente canónica de la política

### Requirement: Coherencia entre deny-list de config y documentación

La lista de licencias denegadas en `.github/workflows/ci.yml` SHALL coincidir exactamente con la documentada en la política, y la constante `LICENSE_DENY_LIST` de `scripts/security/generate-security-digest.mjs` SHALL ser un superconjunto documentado de ambas.

#### Scenario: Las tres fuentes coinciden

- **WHEN** se comparan `deny-licenses` en `ci.yml`, `LICENSE_DENY_LIST` en `generate-security-digest.mjs` y la lista de `license-policy.md`
- **THEN** la deny-list del gate `ci.yml` y la lista de `license-policy.md` contienen exactamente los mismos identificadores de licencia
- **AND** `LICENSE_DENY_LIST` del digest es un superconjunto: contiene cada identificador de la deny-list del gate
- **AND** toda omisión o extensión del digest respecto del gate está justificada por escrito en `license-policy.md` (superconjunto intencional: familia GPL/LGPL/AGPL extendida + `SSPL-1.0` y `CC-BY-NC-4.0` del gate)
- **AND** ningún archivo declara `allow-licenses` mientras `deny-licenses` esté activo

### Requirement: Resumen de hallazgos publicado en el PR

El job `dependency-review` SHALL declarar `comment-summary-in-pr` con un valor explícito (no el default `never`) para que los hallazgos de vulnerabilidad/licencia sean visibles al desarrollador aprovechando `pull-requests: write`.

#### Scenario: Valor explícito presente

- **WHEN** se lee el bloque `with:` del job `dependency-review` en `.github/workflows/ci.yml`
- **THEN** `comment-summary-in-pr` tiene valor explícito (`on-failure` recomendado)
- **AND** el job declara `pull-requests: write` en `permissions`

#### Scenario: Hallazgo bloqueante visible en el PR

- **WHEN** un PR introduce una licencia en la deny-list
- **THEN** la acción publica (o actualiza) un comentario de resumen en el PR con el hallazgo que causó el fallo
- **AND** el PR queda bloqueado

### Requirement: Scopes de fallo decididos y documentados

La política de licencias SHALL registrar la decisión sobre `fail-on-scopes`: alcance cubierto hoy, riesgo del alcance no cubierto y condición para revisarla.

#### Scenario: Decisión explícita

- **WHEN** se leen `ci.yml` job `dependency-review` y `license-policy.md`
- **THEN** `fail-on-scopes` está configurado explícitamente o su omisión está justificada con comentario en el job
- **AND** la política documenta que el alcance efectivo es `runtime` por defecto y por qué `development` está pendiente

#### Scenario: Riesgo de development declarado

- **WHEN** se lee la sección de scopes de la política
- **THEN** indica que `devDependencies` con vulnerabilidad `>= moderate` o licencia denegada no bloquean hoy mientras `development` no se agregue

### Requirement: Configuración local de escaneo de licencias (L1)

El repo SHALL proveer configuración de escaneo local con ScanCode y documentar su invocación, sin instalar hooks bloqueantes en `.husky/`.

#### Scenario: Archivo de configuración presente

- **WHEN** se inspecciona la raíz del repo
- **THEN** existe `.scancode.yml` con opciones de licencia/copyright y salida `--json-pp`
- **AND** la documentación no referencia el formato `--csv` (deprecado, issue 3043 de scancode-toolkit)

#### Scenario: Invocación documentada

- **WHEN** se lee `license-policy.md` o `license-compliance.md`
- **THEN** documenta el comando local de escaneo y sus opciones
- **AND** aclara que la capa L1 es advisory/opcional y no bloquea commits

#### Scenario: Sin hook obligatorio

- **WHEN** se revisan los hooks de `.husky/`
- **THEN** no hay hook nuevo que ejecute ScanCode de forma bloqueante

### Requirement: Auditoría semanal de licencias con evidencia retenida (L3)

El workflow `scheduled-security.yml` SHALL ejecutar un audit de licencias por archivo en modo advisory y conservar su reporte como artifact con retención de 90 días.

#### Scenario: Job de audit programado

- **WHEN** corre el cron semanal (`0 3 * * 1`, lunes 03:00 UTC) de `scheduled-security.yml`
- **THEN** existe un job `scancode-license-audit` que ejecuta ScanCode sobre el repo
- **AND** el job está en modo audit: `continue-on-error: true` (hallazgos no bloquean)

#### Scenario: Evidencia retenida

- **WHEN** el audit termina (con o sin hallazgos)
- **THEN** el reporte JSON (`--json-pp`) se sube vía `actions/upload-artifact`
- **AND** `retention-days` es `90`
- **AND** el upload corre con `if: always()`

#### Scenario: Disparo manual

- **WHEN** se dispara `scheduled-security.yml` vía `workflow_dispatch`
- **THEN** el job de audit corre igual que en el cron

#### Scenario: Sin bloqueo de merge ni release

- **WHEN** el audit encuentra una licencia fuera de política
- **THEN** el job termina en éxito (audit mode) y deja el artifact
- **AND** ningún `required_status_checks` ni `needs` de `ci-complete` depende de este job

### Requirement: Taxonomía de calidad documentada en quality-gates.md

`docs/learning/quality-gates.md` §2 SHALL reflejar la taxonomía de todas las capas de licencias: `dependency-review` como `blocking (PR)` y el audit de archivo como `advisory`.

#### Scenario: Fila del audit presente

- **WHEN** se revisa la tabla §2 de `quality-gates.md`
- **THEN** existe una fila para el job de audit de licencias clasificada como `advisory (scheduled)`
- **AND** referencia `scheduled-security.yml` como ubicación

#### Scenario: Fila de dependency-review coherente

- **WHEN** se revisa la misma tabla
- **THEN** la fila `dependency-review` existe con taxonomía `blocking (PR)`
- **AND** menciona `deny-licenses` y `comment-summary-in-pr`

### Requirement: Separación de capas documentada

La documentación SHALL explicar que Trivy, `dependency-review` y el audit de licencias son capas complementarias con fuentes de datos distintas, sin duplicación.

#### Scenario: Alcance de cada capa explicado

- **WHEN** se lee `docs/learning/license-compliance.md`
- **THEN** describe: `dependency-review` = diff del PR sobre manifiesto (vuln + licencia declarada, blocking); Trivy = CVE de filesystem/OS (SARIF `category: trivy`, no analiza licencias); ScanCode = licencia/copyright por archivo (sin CVE, advisory)
- **AND** concluye por qué ninguna capa se elimina

#### Scenario: Origen del SARIF aclarado

- **WHEN** se revisa la documentación sobre permisos/Security tab
- **THEN** indica que el SARIF existente proviene de Trivy y no de FOSSA ni de `dependency-review-action` (ninguno de los dos emite SARIF)

### Requirement: Enlaces y umbrales correctos en la doc de gobernanza pre-merge

`docs/pre-merge-gates-governance.md` SHALL enlazar repositorios válidos y afirmar umbrales correctos para `dependency-review-action`.

#### Scenario: Enlace L661 corregido

- **WHEN** se busca `https://github.com/actions/dependency-review` sin sufijo en el documento
- **THEN** no hay coincidencias
- **AND** el enlace apunta a `https://github.com/actions/dependency-review-action`

#### Scenario: Umbral por defecto correcto

- **WHEN** se lee §4.12 y la tabla de desviaciones
- **THEN** el default declarado de `fail-on-severity` es `low` (no `high`)
- **AND** se mantiene que el repo usa `moderate`

### Requirement: Permisos y oportunidades de integración documentados

La documentación SHALL explicar por qué `security-events: write` no lo ejerce `dependency-review-action` y qué transformación se requeriría para publicar hallazgos de licencia en el Security tab.

#### Scenario: security-events explicado

- **WHEN** se lee la política/documentación del gate
- **THEN** explica que `actions/dependency-review-action` no genera SARIF, por lo que `security-events: write` queda sin ejercicio en ese job
- **AND** señala que una integración futura requeriría transformar salida SPDX/JSON a SARIF con un transformador propio

### Requirement: Escaneo de licencias PR-diff sobre archivos cambiados (dual job)

El workflow `ci.yml` SHALL ejecutar un job `scancode-license-pr-diff` que escanee con ScanCode los archivos cambiados en el PR y evalúe sus licencias contra la deny-list unificada, en modo advisory durante la FASE 1.

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

### Requirement: Cobertura dual de escaneo de licencias (semanal + PR-diff)

El repo SHALL mantener a la vez el audit semanal de repo completo y el escaneo PR-diff; ninguno de los dos sustituye al otro.

#### Scenario: Ambos jobs coexisten

- **WHEN** se revisan `.github/workflows/scheduled-security.yml` y `.github/workflows/ci.yml`
- **THEN** existen `scancode-license-audit` (repo completo, cron semanal, artifact 90d) y `scancode-license-pr-diff` (diff del PR, artifact 14d)
- **AND** ninguno de los dos fue removido con la excusa de que el otro lo cubre

#### Scenario: Gap de cobertura justificado en la documentación

- **WHEN** se lee la documentación de la capa de licencias
- **THEN** explica que `dependency-review` cubre solo manifiestos/lockfiles del diff, que el PR-diff cierra el gap de archivos fuente/vendor añadidos en el PR, y que el audit semanal cubre el repo completo (incluido lo que no llega vía PR)
- **AND** concluye que las capas son complementarias: el PR-diff no reemplaza al semanal ni viceversa
