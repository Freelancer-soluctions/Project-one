# sca-lockfile-compliance Specification

## Purpose

Define la gobernanza de la **auditoría de vulnerabilidades (CVE) sobre el lockfile resuelto** de `project-one`: 3 capas de lockfile (pre-commit local advisory, job PR-time `lockfile-audit` con `npm audit --audit-level=moderate` y artifact 14d, job semanal `lockfile-audit-weekly` con `npm audit` + `npm sbom` y artifact 90d — sin duplicar el escaneo Trivy semanal que ya ejecuta `security.yml`), más la capa IaC advisory (`checkov-iac` en `ci.yml`, `checkov-iac-weekly` en `scheduled-security.yml` y Policy as Code `.checkov.yml`), ajuste del `dependabot.yml` existente como prevención, transición FASE 1 advisory → FASE 2 bloqueante (incluyendo `prebuild-security-complete`), taxonomía `blocking`/`advisory` en los docs de quality gates y la separación explícita frente a `license-compliance` (licencia) y `dependency-review` (manifest), dejando claro que `deny-licenses` no aplica porque esta capa detecta CVE, no licencias.

## Requirements

### Requirement: Job de auditoría de lockfile en PR (capa PR-time)

El workflow `ci.yml` SHALL ejecutar un job `lockfile-audit` en cada `pull_request` que ejecute `npm audit --audit-level=moderate --json` directamente sobre el `package-lock.json` commiteado (sin `npm ci`), conservando el reporte como artifact con retención de 14 días.

#### Scenario: Job presente y disparado solo por PR

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `lockfile-audit` con condición `if: github.event_name == 'pull_request'`
- **AND** declara `needs: repo-discovery` y un `timeout-minutes` acotado

#### Scenario: Umbral y salida del audit

- **WHEN** el job ejecuta el audit
- **THEN** el comando es `npm audit --audit-level=moderate --json` y su salida se redirige a `audit-report.json`
- **AND** NO declara `npm ci` como requisito: el audit lee el lockfile directamente y una instalación completa añade 1-3 min por PR sin valor para el audit (solo si un paso futuro necesitara el árbol instalado se añadiría `npm ci` explícitamente)

#### Scenario: Evidencia PR retenida 14 días

- **WHEN** el audit termina (con o sin hallazgos)
- **THEN** `audit-report.json` se sube vía `actions/upload-artifact` con nombre `lockfile-audit-pr`
- **AND** `retention-days` es `14`
- **AND** el upload corre con `if: always()` e `if-no-files-found: warn`

#### Scenario: FASE 1 advisory (continue-on-error)

- **WHEN** el audit encuentra vulnerabilidades `>= moderate` mientras rige la FASE 1
- **THEN** el paso declara `continue-on-error: true` y el job no bloquea el merge
- **AND** ninguna entrada de `required_status_checks` depende de `lockfile-audit` en FASE 1
- **AND** el artifact con los hallazgos queda disponible para revisión

#### Scenario: FASE 2 bloqueante gradual

- **WHEN** el job acumula 2-4 semanas de runs con hallazgos triados y sin falsos positivos
- **THEN** la remoción de `continue-on-error` convierte el check en blocking de forma gradual (un check por PR a la vez)
- **AND** `lockfile-audit` se agrega al bloque `needs` del agregador `prebuild-security-complete` en `ci.yml` (anclado por nombre de job)
- **AND** `docs/learning/quality-gates.md` refleja el cambio de fase (`advisory (PR, fase 1)` → `blocking (PR)`)

#### Scenario: `deny-licenses` no aplica a esta capa

- **WHEN** se configura el job `lockfile-audit`
- **THEN** no se declaran `allow-licenses` ni `deny-licenses` ni se modifica `fail-on-severity`
- **AND** la documentación explica que esta capa detecta CVE/vulnerabilidades, no licencias, y que la deny-list vive en la clave `deny-licenses` del job `dependency-review` en `ci.yml` bajo responsabilidad de `license-compliance`

### Requirement: Auditoría semanal de lockfile con evidencia retenida (capa semanal)

El workflow `scheduled-security.yml` SHALL ejecutar un job `lockfile-audit-weekly` en el cron semanal existente que produzca evidencia de vulnerabilidades de lockfile y SBOM, retenida 90 días y en modo advisory, sin duplicar el escaneo Trivy semanal de `security.yml`.

#### Scenario: Job semanal presente y disparado

- **WHEN** corre el cron `0 3 * * 1` (lunes 03:00 UTC) de `scheduled-security.yml`
- **THEN** existe el job `lockfile-audit-weekly` que ejecuta `npm audit --audit-level=moderate --json` sobre el lockfile commiteado (sin `npm ci`)
- **AND** el mismo job corre si se dispara vía `workflow_dispatch`

#### Scenario: Evidencia `npm audit` retenida 90 días

- **WHEN** el audit semanal termina (con o sin hallazgos)
- **THEN** el reporte JSON (`audit-weekly.json`) se sube vía `actions/upload-artifact` con `retention-days: 90`
- **AND** el upload corre con `if: always()` e `if-no-files-found: warn`

#### Scenario: Sin duplicación del escaneo Trivy semanal

- **WHEN** se define la evidencia del job `lockfile-audit-weekly`
- **THEN** el job produce evidencia propia de lockfile (JSON de `npm audit` + SBOM) sin ejecutar un nuevo escaneo Trivy
- **AND** la documentación aclara que `npm audit` no emite SARIF nativamente, que el CVE de filesystem semanal ya corre en `security.yml` (job `dependency-scan`, mismo cron, SARIF `category: trivy`) y que no se duplica
- **AND** si se necesitara SARIF propio de `npm audit`, requeriría un transformador JSON→SARIF propio (no implementado, opción futura)

#### Scenario: SBOM de evidencia

- **WHEN** el job genera el SBOM
- **THEN** produce un SBOM del árbol de dependencias resuelto por lockfile con `npm sbom`
- **AND** lo sube como artifact con `retention-days: 90`
- **AND** la documentación lo distingue del SBOM CycloneDX de `anchore/sbom-action` que ya producen `security.yml` (job `sbom`) y `security-digest.yml`

#### Scenario: Sin bloqueo de merge ni release

- **WHEN** el audit semanal encuentra una vulnerabilidad
- **THEN** el paso declara `continue-on-error: true` y el job termina en éxito (audit mode)
- **AND** ningún `required_status_checks` ni `needs` de un agregador de `ci.yml` depende de este job

### Requirement: Capa IaC (Checkov)

El repo SHALL ejecutar la capa de Policy as Code para IaC con `checkov`: un job `checkov-iac` advisory en `ci.yml` en cada PR, un job `checkov-iac-weekly` advisory en `scheduled-security.yml` y la política versionada en `.checkov.yml`, complementaria a `dependency-review` (manifest) y a `lockfile-audit` (CVE en lockfile).

#### Scenario: Job PR advisory

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `checkov-iac` en paralelo a `dependency-review` (substage 2C SECURITY, sin dependencia de `build`, `timeout-minutes: 10`)
- **AND** usa `bridgecrewio/checkov-action` con `soft_fail: true` y publica los artefactos SARIF/JSON como `checkov-report-pr` con `retention-days: 14`
- **AND** en FASE 1 no entra al bloque `needs` de `prebuild-security-complete` (advisory; la ruta D5 `soft_fail` → `hard-fail` aplica solo a `checkov-iac` PR-time y a `lockfile-audit`)

#### Scenario: Schedule advisory 90d

- **WHEN** corre `scheduled-security.yml` por el cron `0 3 * * 1` (lunes 03:00 UTC) o vía `workflow_dispatch`
- **THEN** existe el job `checkov-iac-weekly` con `continue-on-error: true` (taxonomía `advisory (scheduled)`, sin ruta blocking)
- **AND** sube el SARIF vía `github/codeql-action/upload-sarif@v4` con `category: checkov-iac` (sin colisionar con `category: trivy` del job `dependency-scan` de `security.yml`)
- **AND** publica el artifact `checkov-iac-weekly` con `retention-days: 90`, `if: always()` e `if-no-files-found: warn`
- **AND** ningún `required_status_checks` ni agregador de `ci.yml` depende de este job

#### Scenario: Policy as Code versionada

- **WHEN** se configura y revisa `checkov`
- **THEN** existe `.checkov.yml` en la raíz commiteado al repo (soft-fail, compact, quiet, frameworks `dockerfile terraform kubernetes`) con `skip-check` documentados
- **AND** los jobs `checkov-iac` y `checkov-iac-weekly` leen la política desde `.checkov.yml` (input `config_file` explícito en `checkov-action`; la CLI de checkov además auto-lee el archivo del working directory) en lugar de ocultarla en flags del workflow
- **AND** `.husky/pre-commit` ejecuta `checkov -d . --soft-fail` fuera de la cadena `set -e` (advisory local)

### Requirement: Capa local pre-commit advisory

El repo SHALL proveer una capa local de auditoría de lockfile advisory en `.husky/pre-commit` que informe al desarrollador sin bloquear el commit.

#### Scenario: Paso advisory presente

- **WHEN** se lee `.husky/pre-commit`
- **THEN** existe un paso que ejecuta `npm audit --audit-level=moderate`
- **AND** el paso está protegido contra fallo (p. ej. `|| true`) de modo que un hallazgo no interrumpe la cadena de ejecución existente (lint-staged + SAST + secrets)

#### Scenario: No bloquea commits

- **WHEN** `npm audit` reporta vulnerabilidades `>= moderate` en local
- **THEN** el commit se completa igualmente
- **AND** el desarrollador ve el hallazgo en la salida del hook como advisory

#### Scenario: Reporte local no versionado

- **WHEN** el paso genera un reporte local (p. ej. `.tmp/audit-local.json`)
- **THEN** la ruta está ignorada por `.gitignore`
- **AND** no se sube como artifact (esa responsabilidad es de las capas de PR y semanal)

### Requirement: Prevención mediante ajuste del `dependabot.yml` existente

El repo SHALL ajustar el archivo `.github/dependabot.yml` ya existente para reforzar la prevención de vulnerabilidades, sin crear un archivo nuevo y sin convertirlo en gate de merge.

#### Scenario: El archivo se ajusta, no se crea

- **WHEN** se revisa el cambio sobre `.github/dependabot.yml`
- **THEN** el archivo ya existente conserva su configuración actual (`package-ecosystem` npm/github-actions/docker, `schedule` `weekly` lunes 03:00 UTC, `groups.dev-dependencies`, `open-pull-requests-limit: 10`)
- **AND** no se crea una segunda definición de updates ni se duplica el archivo

#### Scenario: Grupo de parches de seguridad añadido

- **WHEN** se lee la sección de updates de npm
- **THEN** existe un grupo `security-patches` con `applies-to: security-updates` que agrupa actualizaciones de tipo `patch`
- **AND** el grupo no solapa con `groups.dev-dependencies` (que gestiona los version-updates de las devDependencies)
- **AND** la config declara `cooldown`/`default-days` para reducir ruido

#### Scenario: Es prevención, no gate

- **WHEN** se documenta la capa de `dependabot`
- **THEN** la documentación indica que Dependabot actualiza y genera alertas, pero no bloquea merges por un CVE existente
- **AND** se le asigna taxonomía de prevención, distinta de `blocking (PR)` y de `advisory`

### Requirement: Separación de capas frente a `license-compliance` y `dependency-review`

La documentación SHALL explicar que `sca-lockfile-compliance` cubre CVE/vulnerabilidades en lockfiles, que `license-compliance` cubre licencia de archivo y deny-list, y que `dependency-review` cubre el manifest en PR — sin duplicación de trabajo.

#### Scenario: Alcance de cada capa explícito

- **WHEN** se lee `docs/learning/sca-dependency-lockfile-scan.md` y `docs/learning/license-compliance.md`
- **THEN** ambos declaran la separación: lockfile/CVE (este change) vs licencia por archivo + deny-list (`license-compliance`) vs manifest PR-time (`dependency-review`)
- **AND** concluyen que las capas son complementarias y que ninguna se elimina

#### Scenario: Sin duplicación de artifacts ni jobs

- **WHEN** se revisan `.github/workflows/ci.yml` y `.github/workflows/scheduled-security.yml`
- **THEN** los jobs de este change (`lockfile-audit`, `lockfile-audit-weekly`) no reproducen el trabajo de `scancode-license-pr-diff` ni de `scancode-license-audit`
- **AND** las filas nuevas de `quality-gates.md` no duplican las filas `dependency-review` y `scancode-license-audit`

### Requirement: Taxonomía de calidad documentada

`docs/learning/quality-gates.md` §2 SHALL registrar las capas de auditoría de lockfile con su taxonomía vigente, y `docs/learning/license-policy.md` SHALL registrar la capa de CVE como complementaria a las capas de licencia.

#### Scenario: Fila PR-time presente

- **WHEN** se revisa la tabla §2 de `quality-gates.md`
- **THEN** existe una fila `lockfile-audit` con ubicación `ci.yml` y taxonomía acorde a la fase vigente (`advisory (PR, fase 1)` inicialmente)
- **AND** menciona el umbral `moderate` y el artifact de 14 días

#### Scenario: Fila semanal presente

- **WHEN** se revisa la misma tabla
- **THEN** existe una fila `lockfile-audit-weekly` con ubicación `scheduled-security.yml` y taxonomía `advisory (scheduled)`
- **AND** menciona la retención de evidencia de 90 días

#### Scenario: Capa registrada en la política de licencias sin mezclar alcances

- **WHEN** se lee la sección §6 (capas de cumplimiento) de `docs/learning/license-policy.md`
- **THEN** la capa de lockfile/CVE se lista como complementaria y se aclara que **no** aporta reglas de `deny-licenses`

### Requirement: Validación local obligatoria antes de merge

La documentación SHALL exigir que `npm audit --audit-level=moderate` se ejecute localmente sobre el lockfile commiteado y pase sin hallazgos `>= moderate` antes de merge, sin automatizar remediación forzada.

#### Scenario: Comando de validación documentado

- **WHEN** se lee la sección de validación local de la doc de la capa
- **THEN** documenta `npm audit --audit-level=moderate` como paso previo al merge (con `npm ci` opcional para validar desde un estado limpio)
- **AND** indica que ante un fallo se debe corregir `package-lock.json` (remediación o actualización)

#### Scenario: Sin `npm audit fix --force` automático

- **WHEN** se describe la remediación
- **THEN** prohíbe usar `npm audit fix --force` sin revisión humana
- **AND** documenta `npm audit fix --dry-run` como preview

### Requirement: Bloqueos de validación local confirmados y documentados

La documentación y los tasks de este change SHALL registrar los tres bloqueos confirmados el 2026-09-26 y sus mitigaciones, sin requerir su resolución para la escritura de los artifacts.

#### Scenario: `scancode` fuera de PATH

- **WHEN** se documenta la validación de la capa de licencias
- **THEN** se registra que `scancode` no está instalado en PATH (`scancode: command not found`)
- **AND** la mitigación es la imagen Docker pinnada `aboutcode/scancode-toolkit:32.5.0` (requiere `docker pull`), usada por `license-compliance` y no por este change

#### Scenario: `scan-list.txt` no existe

- **WHEN** se documenta la generación de la lista de escaneo PR-diff
- **THEN** se registra que `scan-list.txt` no existe en el repo (0 matches) y no se crea
- **AND** la lista se genera en runtime con `git diff --name-only --diff-filter=ACMR`

#### Scenario: `npm audit` sin SARIF nativo

- **WHEN** se documenta la evidencia SARIF
- **THEN** se registra que `npm audit` no emite SARIF
- **AND** el JSON de `npm audit` se conserva como artifact y la evidencia SARIF de CVE filesystem ya existe vía el Trivy semanal de `security.yml` (`category: trivy`), sin duplicarla; un transformador JSON→SARIF propio queda como opción futura
