# typosquatting-detection

## Purpose

Definir la gobernanza de la **capa de detección de typosquatting / dependency confusion (GuardDog v3.2.0)** en `project-one`: capa local pre-commit advisory, job PR advisory, job semanal de auditoría con evidencia 90d, política como código en el wrapper `scripts/guarddog-verify.sh` (GuardDog no soporta ficheros de configuración), validación local pre-merge y transición gradual `advisory` → `blocking`, complementaria a Trivy (CVE/secretos), `dependency-review` (manifiesto PR) y `lockfile-audit` (CVE lockfile) sin duplicar ninguna capa existente.

## ADDED Requirements

### Requirement: Capa local pre-commit advisory (L1)

El repo SHALL proveer una capa local de typosquatting en `.husky/pre-commit` que ejecute el wrapper versionado `scripts/guarddog-verify.sh` (que a su vez ejecuta `uvx guarddog==3.2.0 npm verify package.json --output-format sarif > .tmp/guarddog.sarif`) como paso **no bloqueante**, fuera de la cadena `set -e` del hook y protegido con `|| true` (o `|| echo`), NUNCA escalando a blocking.

#### Scenario: Paso advisory presente sin romper commits (R1-L1)

- **WHEN** un desarrollador ejecuta `git commit`
- **THEN** el hook intenta el escaneo typosquat vía el wrapper `scripts/guarddog-verify.sh` (GuardDog pinneado a `3.2.0`) y solo informa de los hallazgos o de la ausencia de `uv`/`uvx`
- **AND** un hallazgo de deuda histórica o un `uvx` fuera de PATH NO interrumpen el commit (sin `exit 1` nuevo introducido por esta capa)
- **AND** el reporte se escribe en `.tmp/guarddog.sarif` para visibilidad local
- **AND** en máquinas Windows el paso se degrada a advisory silencioso (GuardDog v3.2.0 solo soporta Windows vía Docker: el sandbox Landlock/Seatbelt no existe ahí); la cobertura real está en macOS/Linux y en los jobs de CI

#### Scenario: Fuera de la cadena bloqueante

- **WHEN** se inspecciona `.husky/pre-commit`
- **THEN** el paso de GuardDog aparece en el bloque advisory, **después** del gate bloqueante y **fuera** de la cadena `set -e` (junto a `npm audit`, `checkov`, `hadolint`, `actionlint` y `zizmor`, tras ellos)
- **AND** el resumen final advisory del hook menciona también la capa de typosquatting
- **AND** la capa permanece advisory en todas las fases (nunca se convierte en gate de commit)

### Requirement: Job PR-time `typosquat-guarddog` advisory (L2, FASE 1)

El workflow `ci.yml` SHALL ejecutar en cada `pull_request` un job `typosquat-guarddog` que verifique `package.json` con `uvx guarddog==3.2.0 npm verify ... --output-format sarif`, con `needs: repo-discovery`, `continue-on-error: true` a nivel job, `permissions` de job `contents: read` + `security-events: write`, subida SARIF con `category: guarddog` (única) y artifact de evidencia de 14 días; en FASE 1 dicho job NO SHALL formar parte del `needs` del agregador `prebuild-security-complete`.

#### Scenario: Ejecución advisory en PR (R2-L2)

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `typosquat-guarddog` con `needs: repo-discovery`, en paralelo a `dependency-review`, `lockfile-audit` y `checkov-iac` (sin dependencia de `build`)
- **AND** instala `uv` con `astral-sh/setup-uv` **SHA-pinned** (`b75a909f75acd358c2196fb9a5f1299a9a8868a4`, v6.7.0 — nunca `@main`/`@v*`, mismo criterio que los jobs zizmor hermanos) y ejecuta `uvx guarddog==3.2.0` (versión pinneada, nunca `latest`) tras verificarla (`guarddog --version` contiene `3.2.0`; si difiere → fallo del paso)
- **AND** genera `guarddog.sarif` vía el wrapper (`|| true` en el step de scan, `test -s` y `jq -e .` antes de subirlo) y lo sube vía `github/codeql-action/upload-sarif@v4` con `category: guarddog` bajo `if: always() && hashFiles('guarddog.sarif') != ''` (sin colisionar con `trivy`, `codeql`, `semgrep`, `gitleaks`, `checkov-iac`, `hadolint[-weekly]`, `actionlint` ni `zizmor[-weekly]`)
- **AND** publica el artifact `guarddog-report-pr` con `retention-days: 14`, `if: always()` e `if-no-files-found: warn`
- **AND** el job termina en éxito aunque haya hallazgos (advisory vía `continue-on-error: true`)

#### Scenario: Sin bloqueo en FASE 1

- **WHEN** se inspecciona el bloque `needs` de `prebuild-security-complete` (anclado por nombre de job)
- **THEN** `typosquat-guarddog` no aparece en ese `needs`
- **AND** los jobs `dependency-review`, `secrets` y `scancode-license-pr-diff` permanecen intactos
- **AND** ningún `required_status_checks` depende de `typosquat-guarddog` en FASE 1

### Requirement: Job semanal `guarddog-weekly` (L3)

El workflow `scheduled-security.yml` SHALL ejecutar un job `guarddog-weekly` advisory (`continue-on-error: true`) en el cron existente (y `workflow_dispatch`), con la misma instalación fijada que el job PR (setup-uv SHA-pinned + verificación de versión de GuardDog), salida SARIF `category: guarddog-weekly`, artifact de evidencia de 90 días y sin ruta blocking; su cadencia semanal SHALL aportar re-evaluación periódica de la superficie de dependencias con datos frescos de top-packages (los runners son efímeros: cada ejecución los descarga de nuevo).

#### Scenario: Auditoría semanal 90d (R3-L3)

- **WHEN** corre `scheduled-security.yml` por `schedule` o `workflow_dispatch`
- **THEN** existe el job `guarddog-weekly` con `continue-on-error: true` (taxonomía `advisory (scheduled)`)
- **AND** sube el SARIF vía `github/codeql-action/upload-sarif@v4` con `category: guarddog-weekly` bajo `if: always() && hashFiles('guarddog-weekly.sarif') != ''` (única, sin colisionar con `checkov-iac`, `hadolint-weekly`, `gitleaks`, `trivy`, `actionlint` ni `zizmor`)
- **AND** publica el artifact `guarddog-weekly` con `retention-days: 90`, `if: always()` e `if-no-files-found: warn`
- **AND** los jobs `gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly`, `containerfile-lint-weekly` y `notify-failure` permanecen intactos

#### Scenario: Sin dependencia de agregadores y re-evaluación semanal

- **WHEN** se revisa el job `guarddog-weekly`
- **THEN** ningún agregador de `ci.yml` ni `required_status_checks` depende de él
- **AND** la ejecución semanal re-evalúa la superficie de dependencias con datos frescos de top-packages descargados en cada run (los runners de GitHub son efímeros y no conservan cache entre ejecuciones); la cadencia aporta re-evaluación periódica, no refresco de un cache persistente
- **AND** su cadencia no duplica la capa de licencias (`scancode-license-audit`) ni la de CVE (`lockfile-audit-weekly`)

### Requirement: Política como código — wrapper `scripts/guarddog-verify.sh` (D5)

El repo SHALL mantener la política de GuardDog como único punto de configuración versionado y auditable — el wrapper `scripts/guarddog-verify.sh` — porque GuardDog NO soporta ficheros de configuración (la configuración oficial son variables de entorno y flags CLI; p. ej. `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES`, `--exclude-rules`); el wrapper fija la política (devDeps excluidas, exclusiones de reglas selectivas con justificación por regla) y los workflows, el pre-commit y la validación local SHALL invocarlo en lugar de dispersar flags que anulen en silencio la política.

#### Scenario: Wrapper commiteado y consumido por los tres consumidores (R4-D5)

- **WHEN** se consulta la configuración de GuardDog
- **THEN** existe `scripts/guarddog-verify.sh` versionado y ejecutable, con `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false` y cualquier `--exclude-rules` justificado en comentarios (qué regla, por qué, hasta cuándo)
- **AND** los jobs `typosquat-guarddog` y `guarddog-weekly`, el paso pre-commit y la validación local invocan el wrapper (sin duplicar ni contradecir sus flags)
- **AND** devDependencies quedan excluidas por defecto vía la env var (o incluidas explícitamente cambiando el wrapper vía PR si el equipo lo decide)

#### Scenario: Cambios de política vía PR

- **WHEN** se modifica una exclusión o una env var de política en `scripts/guarddog-verify.sh`
- **THEN** el cambio viaja en un PR normal (auditable, con review y CODEOWNERS sobre el script), sin editar los workflows para cambiar la política
- **AND** la exclusión lleva justificación versionada (qué regla, por qué y hasta cuándo)
- **AND** ningún consumidor pasa flags que anulen en silencio la política del wrapper

### Requirement: Validación local antes de merge (D6)

La documentación SHALL exigir ejecutar GuardDog localmente antes de merge sobre `package.json` con salida SARIF y comprobar que no haya hallazgos nuevos (`jq -e '.runs[0].results | length == 0'`), sin `--no-fail` ni forzar el merge sin revisión.

#### Scenario: Comando local documentado (R5-D6)

- **WHEN** se lee la sección de validación local de la doc de la capa
- **THEN** documenta `bash scripts/guarddog-verify.sh > .tmp/guarddog.sarif` (el wrapper ejecuta `uvx guarddog==3.2.0 npm verify package.json --output-format sarif`) y la comprobación con `jq`
- **AND** documenta el requisito de red (acceso al registry npm) y el comportamiento por defecto del sandbox (sin `--no-sandbox`)
- **AND** indica que un exit distinto de cero se revisa y corrige antes de merge

#### Scenario: Triage de hallazgos con justificación versionada

- **WHEN** la validación local reporta un hallazgo
- **THEN** se remedia el manifiesto (quito/corrección del paquete sospechoso) o se excluye la regla de forma justificada en `scripts/guarddog-verify.sh` (comentario: qué, por qué, hasta cuándo)
- **AND** la decisión queda registrada en el diff (auditable) antes de merge
- **AND** no se usa el merge para saltarse el hallazgo

### Requirement: Transición FASE 1 → FASE 2 bloqueante gradual (diferida)

La capa SHALL evolucionar de `advisory` a `blocking` solo tras 2-4 semanas de runs sin falsos positivos, momento en el que se quitará `continue-on-error: true`, se añadirá `typosquat-guarddog` al `needs` de `prebuild-security-complete` y se actualizará la fila en `docs/learning/quality-gates.md` (registro único de la taxonomía).

#### Scenario: Criterio de promoción (R6-FASE1/2)

- **WHEN** han pasado 2-4 semanas de runs de `typosquat-guarddog` sin falsos positivos y los ruidosos están clasificados en `scripts/guarddog-verify.sh`
- **THEN** se puede quitar `continue-on-error: true` y añadir `typosquat-guarddog` al `needs` de `prebuild-security-complete` (anclado por nombre de job)
- **AND** la fila en `quality-gates.md` pasa de `advisory (PR, fase 1)` a `blocking (PR)` y se añade/actualiza la fila del job semanal

#### Scenario: Retroceso simple

- **WHEN** la FASE 2 produce un falso positivo en un PR
- **THEN** se re-añade `continue-on-error: true` y se retira la línea del `needs` (un solo revert), sin rediseñar el job
- **AND** la regresión queda anotada en `quality-gates.md` para revisar la política antes de re-promover

### Requirement: Separación de capas — sin duplicar Trivy, dependency-review ni lockfile-audit (D1)

La capa de typosquatting SHALL complementar, nunca reemplazar, las capas existentes: `security.yml` `dependency-scan` (Trivy, `category: trivy`, CVE/secretos), `dependency-review` (manifiesto PR: vulnerabilidad + licencia), `lockfile-audit`/`lockfile-audit-weekly` (CVE en lockfile vía npm audit), `checkov-iac`, `hadolint`/`containerfile-lint-weekly`, `actionlint`/`zizmor` y `scancode-license-audit`; la taxonomía de capas SHALL quedar documentada (GuardDog = typosquat/malicious package (metadata + YARA) · Trivy = CVE/secretos · dependency-review = manifiesto PR · lockfile-audit = CVE lockfile · Checkov = IaC policy · Hadolint = calidad Dockerfile · Semgrep/CodeQL = SAST).

#### Scenario: Archivos protegidos intactos (R7-D1)

- **WHEN** se implementa este change
- **THEN** `.github/workflows/security.yml` conserva su job `dependency-scan` con `category: trivy` sin modificar (no se le añaden scanners de typosquat)
- **AND** la taxonomía de reglas referenciada usa identificadores reales de GuardDog v3.2.0 (`threat.metadata.typosquatting`, `threat-npm-dependency-confusion`, `threat-runtime-obfuscation-unicode`, `threat-npm-preinstall-script`, `deceptive_author`; no existe `new_install_script` en v3.2.0)
- **AND** `dependency-review`, `lockfile-audit`, `checkov-iac`, `hadolint` y `scancode-license-pr-diff` no se tocan
- **AND** `.github/dependabot.yml` y `package.json` permanecen intactos (sin dependencias nuevas de GuardDog/Socket)
- **AND** no se crea ningún `scan-list.txt`

#### Scenario: Un solo job por capa

- **WHEN** se revisa la definición de jobs en los workflows
- **THEN** existe exactamente un job `typosquat-guarddog` en `ci.yml` y un job `guarddog-weekly` en `scheduled-security.yml`
- **AND** ningún otro change define o duplica esos jobs (dueño único: este change)
- **AND** las categorías SARIF `guarddog` y `guarddog-weekly` son únicas en el repo
