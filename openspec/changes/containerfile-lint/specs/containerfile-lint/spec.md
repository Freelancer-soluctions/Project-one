# containerfile-lint

## Purpose

Definir la gobernanza de la capa de **calidad de Containerfile (Hadolint)** en `project-one`: job PR advisory, job semanal de auditoría, política versionada `.hadolint.yaml`, capa local pre-commit advisory y validación local pre-merge, complementaria a Trivy (CVE/secretos), Checkov (IaC policy) y SAST sin duplicar ninguna capa existente.

## ADDED Requirements

### Requirement: Job PR-time `containerfile-lint` advisory (FASE 1)

El workflow `ci.yml` SHALL ejecutar en cada `pull_request` un job `containerfile-lint` que linta `apps/server/Dockerfile` con `hadolint/hadolint-action@v3.1.0` en modo advisory (`continue-on-error: true` a nivel job), con `needs: repo-discovery`, sin dependencia de `build`, `timeout-minutes: 5`, salida SARIF nativa (`format: sarif`, sin transformación), política `.hadolint.yaml` vía input `config` y artifact de evidencia con retención de 14 días; en FASE 1 dicho job NO SHALL formar parte del `needs` del agregador `prebuild-security-complete`.

#### Scenario: Ejecución advisory en PR

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `containerfile-lint` con `needs: repo-discovery`, en paralelo a `dependency-review`, `lockfile-audit` y `checkov-iac` (sin dependencia de `build`)
- **AND** usa `hadolint/hadolint-action@v3.1.0` con `dockerfile: apps/server/Dockerfile`, `config: .hadolint.yaml` y `format: sarif`
- **AND** declara `permissions` de job con `security-events: write` para subir el SARIF
- **AND** publica el artifact `hadolint-report-pr` con `retention-days: 14` bajo `if: always()` e `if-no-files-found: warn`
- **AND** sube el SARIF con `category: hadolint` (única; no colisiona con `trivy`, `codeql`, `semgrep` ni `checkov-iac`)
- **AND** el job termina en éxito aunque haya hallazgos (advisory vía `continue-on-error: true`)

#### Scenario: No bloqueo en FASE 1

- **WHEN** se inspecciona el bloque `needs` de `prebuild-security-complete` (`ci.yml` L1465)
- **THEN** `containerfile-lint` no aparece en ese `needs`
- **AND** los jobs `dependency-review`, `secrets` y `scancode-license-pr-diff` permanecen intactos
- **AND** ningún `required_status_checks` depende de `containerfile-lint` en FASE 1

### Requirement: Job semanal `containerfile-lint-weekly` advisory

El workflow `scheduled-security.yml` SHALL ejecutar un job `containerfile-lint-weekly` advisory (`continue-on-error: true`) en el cron existente `0 3 * * 1` (y `workflow_dispatch`), con salida SARIF `category: hadolint-weekly`, artifact de evidencia de 90 días y sin ruta blocking.

#### Scenario: Auditoría semanal 90d

- **WHEN** corre `scheduled-security.yml` por `schedule` o `workflow_dispatch`
- **THEN** existe el job `containerfile-lint-weekly` con `continue-on-error: true` (taxonomía `advisory (scheduled)`)
- **AND** sube el SARIF vía `github/codeql-action/upload-sarif` con `category: hadolint-weekly` (sin colisionar con `category: checkov-iac` ni `category: trivy`)
- **AND** publica el artifact `hadolint-report-weekly` con `retention-days: 90`, `if: always()` e `if-no-files-found: warn`

#### Scenario: Sin dependencia de agregadores

- **WHEN** se revisa el job `containerfile-lint-weekly`
- **THEN** ningún agregador de `ci.yml` ni `required_status_checks` depende de él
- **AND** los jobs `gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly` y `notify-failure` permanecen intactos

### Requirement: Política como código `.hadolint.yaml`

El repo SHALL mantener `.hadolint.yaml` en la raíz, versionado y auditable, como única fuente de configuración de Hadolint (`failure-threshold`, `format`, `ignored:` selectivos con comentario por regla, `override`, `trustedRegistries: [docker.io, ghcr.io]`), referenciada explícitamente por los jobs de CI en lugar de flags `--ignore` dispersos en los workflows (el flag `--ignore` de CLI **anula** la lista del config).

#### Scenario: Archivo commiteado y consumido por los jobs

- **WHEN** se consulta la configuración de Hadolint
- **THEN** existe `.hadolint.yaml` en la raíz del repo con `format: sarif` y `trustedRegistries` que activan `DL3026` sobre `FROM`
- **AND** los jobs `containerfile-lint` y `containerfile-lint-weekly` lo referencian explícita (input `config` / montaje en contenedor); además la CLI lo auto-lee del working directory
- **AND** las ignoras son selectivas y justificadas por regla (p. ej. `DL3003`, `DL3006` solo si procede) — **NO** en bloque sobre reglas de calidad como `DL3018`/`DL3016`/`DL3059`/`DL3026`/`DL3025`/`DL3002`

#### Scenario: Cambios de política vía PR

- **WHEN** se modifica una regla en `.hadolint.yaml`
- **THEN** el cambio viaja en un PR normal (auditable y con review), sin editar los workflows para cambiar la política
- **AND** ningún job pasa `ignore:` inline que silencie la política versionada

### Requirement: Capa local pre-commit advisory

El repo SHALL proveer una capa local de Containerfile lint en `.husky/pre-commit` que ejecute `hadolint -c .hadolint.yaml --failure-threshold warning apps/server/Dockerfile` como paso **no bloqueante**, fuera de la cadena `set -e` del hook y protegido con `||`.

#### Scenario: Paso advisory presente sin romper commits

- **WHEN** un desarrollador ejecuta `git commit`
- **THEN** el hook intenta el lint local del Containerfile y solo informa de los hallazgos o de la ausencia del binario (`|| echo "⚠️ hadolint no disponible o findings — advisory, no bloquea (política: .hadolint.yaml)"`)
- **AND** un hallazgo de deuda histórica o un `hadolint` fuera de PATH NO interrumpen el commit (sin `exit 1` nuevo introducido por esta capa)
- **AND** la capa advisory permanece fuera de la cadena bloqueante (lint-staged + SAST + secrets) y NUNCA escala a blocking

#### Scenario: Umbral de warning en local

- **WHEN** se ejecuta el lint local con `--failure-threshold warning`
- **THEN** los hallazgos de severidad `info`/`style` (p. ej. `DL3059` capas consecutivas) NO marcan fallo
- **AND** la política completa (incluido el umbral por defecto del config) sigue viniendo de `.hadolint.yaml`

### Requirement: Validación local antes de merge (D6)

La documentación SHALL exigir ejecutar Hadolint localmente antes de merge sobre `apps/server/Dockerfile`, con salida SARIF para revisión; ante la ausencia del binario en PATH, la alternativa documentada SHALL ser la imagen Docker versionada `hadolint/hadolint:v2.15.1`.

#### Scenario: Comando local documentado

- **WHEN** se lee la sección de validación local de la doc de la capa
- **THEN** documenta `hadolint --version` (esperado `v2.15.1`) y `hadolint --format sarif --output hadolint.sarif apps/server/Dockerfile`
- **AND** documenta la alternativa sin instalar: `docker pull hadolint/hadolint:v2.15.1` + `docker run --rm -i -v "$PWD/.hadolint.yaml:/.hadolint.yaml" hadolint/hadolint:v2.15.1 < apps/server/Dockerfile`
- **AND** el resultado manda: corregir el Dockerfile o registrar `# hadolint ignore=DLxxxx` con justificación inline (auditable en el diff)

### Requirement: Transición a FASE 2 bloqueante gradual (diferida)

La capa SHALL evolucionar de `advisory` a `blocking` solo tras 2-4 semanas de runs sin falsos positivos, subiendo el umbral a `warning` y añadiendo el job al `needs` de `prebuild-security-complete`; el registro único de la taxonomía SHALL permanecer en `docs/learning/quality-gates.md`.

#### Scenario: Criterio de promoción

- **WHEN** han pasado 2-4 semanas de runs de `containerfile-lint` sin falsos positivos y los hallazgos ruidosos están clasificados en `.hadolint.yaml`
- **THEN** se puede quitar `continue-on-error: true`, fijar `failure-threshold: warning` y añadir `containerfile-lint` al `needs` de `prebuild-security-complete`
- **AND** la fila en `quality-gates.md` §2/§4.4 pasa de `advisory (PR, fase 1)` a `blocking (PR)`

#### Scenario: Retroceso simple

- **WHEN** la FASE 2 produce un falso positivo en un PR
- **THEN** se re-añade `continue-on-error: true` y se retira la línea del `needs` (un solo revert), sin rediseñar el job

### Requirement: Baseline opcional de hallazgos conocidos (fail-on-new)

Si se decide en FASE 2, el repo MAY mantener un baseline de hallazgos conocidos (lista `ignored:` versionada o comparación contra el SARIF de referencia) para que solo fallen los hallazgos nuevos; su ausencia NO SHALL impedir la promoción a blocking cuando el umbral `warning` ya cubra el ruido.

#### Scenario: Baseline adoptado

- **WHEN** el equipo decide aplicar `fail-on-new`
- **THEN** el baseline se versiona en el repo y se consume desde `.hadolint.yaml` o desde el paso de comparación del job
- **AND** los hallazgos ya registrados no bloquean mientras que un hallazgo nuevo sí lo hace

#### Scenario: Baseline no adoptado

- **WHEN** el umbral `warning` + `ignored:` selectivos ya eliminan el ruido
- **THEN** el gate puede ser blocking directo sin baseline adicional
- **AND** la decisión queda registrada en `quality-gates.md`

### Requirement: Separación de capas — sin duplicar Trivy, Checkov ni SAST

La capa de Containerfile lint SHALL complementar, nunca reemplazar, las capas existentes: `security.yml` `dependency-scan` (Trivy, `category: trivy`, scanners `vuln,secret`), `checkov-iac`/`checkov-iac-weekly` (IaC policy con `framework: dockerfile`), `dependency-review` (`deny-licenses`), `lockfile-audit` (CVE en lockfile), `license-compliance`/`scancode-license-audit` (licencias) y SAST (`codeql`/`semgrep`); la taxonomía de capas SHALL quedar documentada (Hadolint = calidad Dockerfile · Trivy = CVE/secretos · Checkov = IaC policy · Semgrep/CodeQL = SAST).

#### Scenario: Archivos protegidos intactos

- **WHEN** se implementa este change
- **THEN** `.github/workflows/security.yml` conserva su job `dependency-scan` con `category: trivy` y su default de scanners `vuln,secret` sin modificar (NO se añade `misconfig`)
- **AND** el job `checkov-iac` (`ci.yml` L1007), `checkov-iac-weekly` y `.checkov.yml` no se tocan
- **AND** `.github/dependabot.yml`, `security-digest.yml` y las claves `deny-licenses`/`allow-licenses` permanecen intactos
- **AND** no se crea ningún `scan-list.txt` (la selección de archivos, si se desea, es opcional con `git diff --name-only --diff-filter=ACMR`)

#### Scenario: Un solo job por capa

- **WHEN** se revisa la definición de jobs en los workflows
- **THEN** existe exactamente un job `containerfile-lint` en `ci.yml` y un job `containerfile-lint-weekly` en `scheduled-security.yml`
- **AND** ningún otro change define o duplica esos jobs (dueño único: este change)
