# Spec Delta

## Purpose

Full-history SAST semanal en modo advisory/audit: corre Semgrep full, CodeQL, Gitleaks full-history y Trivy/SBOM sobre todo el historial (sin diff), sube SARIF a GitHub Code Scanning, publica artifacts con retención diferenciada y notifica fallas vía issues, sin bloquear nunca merges ni releases.

## ADDED Requirements

### Requirement: L3 full-history scan without diff baseline

Los scans L3 semanales SHALL analizar el historial completo del repositorio en modo audit. Semgrep full scan NO SHALL usar `--baseline-commit` (parámetro dif-scoped de L2, spec `sast-governance-gate`); Gitleaks SHALL usar `git --log-opts="--all"` (full history); CodeQL y Trivy SHALL correr sobre el estado completo de `main`.

#### Scenario: Semgrep full scan sin baseline

- **WHEN** el schedule semanal dispara el job Semgrep full
- **THEN** el scan SHALL recorrer todo el árbol de código sin `--baseline-commit`
- **AND** findings históricos SHALL reportarse igual que findings nuevos (audit sin filtro de regresiones)

#### Scenario: Gitleaks full history

- **WHEN** corre `gitleaks-full-scan` en `scheduled-security.yml`
- **THEN** el scan SHALL usar `git --log-opts="--all"` con `fetch-depth: 0` en checkout
- **AND** el run NO SHALL fallar por hallazgos (modo audit, spec `ci-secret-scanning`)

### Requirement: SARIF output and Code Scanning upload

Cada herramienta SHALL generar un reporte SARIF (`--sarif-output` en Semgrep, `--report-format=sarif` en Gitleaks, salida SARIF nativa en CodeQL/Trivy); para `semgrep`/`trivy`/`gitleaks`: subir con `github/codeql-action/upload-sarif@v4` con `category` única por herramienta; para `codeql`: pasar `category: codeql` como input de `github/codeql-action/analyze@v4` (subida automática, sin paso `upload-sarif` separado) → sin duplicados ni colisión de categoría; todo bajo `security-events: write`.

#### Scenario: Semgrep SARIF subido

- **WHEN** el Semgrep full scan termina (con o sin findings)
- **THEN** el paso SHALL generar `semgrep.sarif` vía `--sarif-output` y subirlo con `upload-sarif@v4` con `category: semgrep`
- **AND** los alerts SHALL aparecer en Security → Code scanning alerts

#### Scenario: Categorías sin colisión

- **WHEN** varias herramientas suben SARIF en el mismo run
- **THEN** cada upload SHALL usar una `category` distinta
- **AND** no SHALL haber uploads duplicados de la misma categoría en un run

### Requirement: Advisory continuation on scan findings

Los scan steps SHALL usar `continue-on-error: true` → hallazgos con exit != 0 NUNCA fallan el job ni el workflow (taxonomy advisory). La señal de falla se preserva vía `steps.<id>.outcome`.

#### Scenario: Findings no bloquean

- **WHEN** Semgrep/CodeQL/Trivy/Gitleaks encuentran hallazgos (exit != 0)
- **THEN** el job SHALL acabar en `success`
- **AND** el workflow SHALL completarse en verde (audit mode)

#### Scenario: Outcome preservado

- **WHEN** un scan step falla bajo `continue-on-error: true`
- **THEN** `steps.<id>.outcome` SHALL ser `failure` aunque el job sea `success`
- **AND** el outcome SHALL exponerse como job output para el job de notificación

### Requirement: notify-failure job on step outcomes

El workflow SHALL incluir job `notify-failure` con `if: always()` que lee `steps.*.outcome` de los scan steps (exportados vía outputs del job upstream, porque `needs.*.result` es siempre `success` con continue-on-error) y crea un issue de GitHub exactamente cuando algún scan step falló; runs limpios NO crean issue.

#### Scenario: Scan step falla → issue

- **WHEN** algún `steps.scan-*` de los jobs de scan tiene `outcome == 'failure'`
- **THEN** `notify-failure` (con `if: always()`) SHALL ejecutarse y crear un issue con link al run
- **AND** el issue SHALL referenciar el `runId`

#### Scenario: Run limpio → sin issue

- **WHEN** todos los scan steps terminan con `outcome == 'success'`
- **THEN** `notify-failure` SHALL correr (`always()`) pero el paso de creación de issue SHALL saltarse
- **AND** no SHALL crearse ningún issue

### Requirement: Artifact retention policy

Los artifacts SHALL subirse con `if: always()` y retención diferenciada: reportes JSON 30 días, archivos SARIF 90 días, SBOM (CycloneDX JSON) 365 días.

#### Scenario: JSON report artifact

- **WHEN** un scan genera su reporte JSON (ej. `gitleaks-report.json`)
- **THEN** SHALL subirse como artifact con `retention-days: 30`
- **AND** SHALL subirse aunque el scan tenga findings

#### Scenario: SARIF artifact

- **WHEN** un scan genera su archivo SARIF
- **THEN** SHALL subirse como artifact con `retention-days: 90`

#### Scenario: SBOM artifact

- **WHEN** el job `sbom` genera `sbom-project-one.json`
- **THEN** SHALL subirse con `retention-days: 365` y `if-no-files-found: error`

### Requirement: Weekly advisory schedule triggers

Los workflows SAST full SHALL dispararse con `schedule` cron semanal (lunes 03:00 UTC), `workflow_dispatch` y `merge_group`; ambos workflows (`security.yml`, `scheduled-security.yml`) SHALL estar habilitados (sin `disabled_manually`).

#### Scenario: Cron semanal dispara

- **WHEN** el cron `0 3 * * 1` (lunes 03:00 UTC) dispara
- **THEN** el workflow SHALL iniciar un run completo de scan sobre `main`

#### Scenario: Manual dispatch

- **WHEN** un maintainer ejecuta `workflow_dispatch`
- **THEN** el workflow SHALL correr los mismos jobs que el run programado sin inputs requeridos

#### Scenario: Workflows habilitados

- **WHEN** se consulta el estado de `security.yml` y `scheduled-security.yml`
- **THEN** ambos SHALL estar en estado habilitado (sin `disabled_manually`)

### Requirement: Advisory taxonomy and non-blocking governance

La taxonomy L3 SHALL ser advisory: los hallazgos generan alerts SARIF + artifacts + issue de notificación, pero NUNCA son required status check en el ruleset. El wiring `scheduled-scanning` en ruleset SHALL ser opcional/informativo (no required) → releases no se bloquean por deuda histórica.

#### Scenario: Findings históricos no bloquean merge

- **WHEN** el scan semanal reporta hallazgos High/Critical históricos
- **THEN** ningún required check del ruleset SHALL fallar por ellos
- **AND** el merge/release SHALL proseguir según los gates existentes (L1/L2)

#### Scenario: Ausencia en required_status_checks

- **WHEN** se consulta el ruleset de `main` (GET ruleset 21227644)
- **THEN** `required_status_checks` NO SHALL contener la entrada `scheduled-scanning`
- **AND** cualquier wiring del check SHALL ser solo informativo, nunca required
