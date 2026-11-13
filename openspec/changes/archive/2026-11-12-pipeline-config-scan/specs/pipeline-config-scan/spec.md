# pipeline-config-scan

## Purpose

Definir la gobernanza de la capa de **escaneo de configuración de pipelines de GitHub Actions** en `project-one`: capas advisory complementarias de `actionlint` (SARIF 14d) y `zizmor` (SARIF 14d PR + 90d semanal, cubre `unpinned-uses`), política `.github/zizmor.yml` (fichero mínimo obligatorio), capa local pre-commit advisory y validación local pre-merge — sin tocar el job `actionlint` bloqueante existente y sin duplicar Trivy, Checkov, Hadolint ni SAST. La transición a FASE 2 blocking exige gating explícito del SARIF de `zizmor` (exit 0 siempre) y scope de bloqueo limitado al step lint.

## ADDED Requirements

### Requirement: Job PR-time `actionlint-advisory` (FASE 1 advisory)

El workflow `ci.yml` SHALL ejecutar en cada `pull_request` un job `actionlint-advisory` que ejecute `actionlint` v1.7.12 (download-script pinned, misma instalación que el job bloqueante) sobre `.github/workflows/` en modo advisory (`continue-on-error: true` a nivel job), con `needs: repo-discovery`, `timeout-minutes: 5`, sin dependencia de `build`, generación de SARIF con la plantilla oficial **versionada** en `.github/actionlint-sarif.tmpl` (su **contenido** se pasa como `-format`; la pseudo-plantilla inline `{{template "sarif" .}}` no existe y produce salida vacía con exit 0 — verificado en v1.7.12) y artefacto de evidencia con retención de 14 días; en FASE 1 dicho job NO SHALL formar parte del `needs` de `prebuild-quality-complete` ni de `prebuild-security-complete`.

#### Scenario: Ejecución advisory en PR

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `actionlint-advisory` con `needs: repo-discovery`, en paralelo a `dependency-review`, `lockfile-audit`, `checkov-iac` y `containerfile-lint`, sin dependencia de `build`
- **AND** descarga `actionlint` vía download-script pinned a `1.7.12` (misma versión y mecanismo que el job bloqueante `actionlint`) y lo ejecuta sobre `.github/workflows/`
- **AND** genera `actionlint.sarif` con la plantilla SARIF versionada `.github/actionlint-sarif.tmpl` (contenido de `testdata/format/sarif_template.txt` pasado como `-format`; no existe plantilla inline) y declara `permissions` de job con `security-events: write`
- **AND** el step de scan es tolerante al exit 1 por hallazgos (`|| true` o equivalente) para que la evidencia SARIF se genere siempre; el carácter advisory en FASE 1 lo aporta el `continue-on-error: true` a nivel job
- **AND** sube el SARIF con `category: actionlint` (única; no colisiona con `trivy`, `codeql`, `semgrep`, `gitleaks`, `checkov-iac` ni `hadolint`) bajo `if: always()`
- **AND** publica el artefacto `actionlint-report-pr` con `retention-days: 14`, `if: always()` e `if-no-files-found: warn`
- **AND** el job termina en éxito aunque haya hallazgos (advisory vía `continue-on-error: true`)

#### Scenario: Job bloqueante `actionlint` original intacto

- **WHEN** se inspecciona `.github/workflows/ci.yml`
- **THEN** el job bloqueante `actionlint` conserva su definición exacta (download-script `1.7.12`, `./actionlint -color`, `if: needs.repo-discovery.outputs.shared == 'true' && github.event_name == 'pull_request'`), anclado por nombre de job
- **AND** `actionlint` permanece en el `needs` de `prebuild-quality-complete` como gate bloqueante
- **AND** `.github/actionlint.yaml` no se modifica (política vigente del gate bloqueante)
- **AND** `actionlint-advisory` es un job distinto con nombre único (`grep -c "actionlint-advisory:" ci.yml == 1`)

#### Scenario: No bloqueo en FASE 1

- **WHEN** se revisan los bloques `needs` de los agregadores
- **THEN** `actionlint-advisory` y `zizmor-advisory` no aparecen en el `needs` de `prebuild-security-complete` (sigue siendo `[dependency-review, secrets, scancode-license-pr-diff]`)
- **AND** tampoco aparecen en el `needs` de `prebuild-quality-complete`
- **AND** ningún `required_status_checks` depende de ellos en FASE 1

### Requirement: Job PR-time `zizmor-advisory` (FASE 1 advisory, gap `unpinned-uses`)

El workflow `ci.yml` SHALL ejecutar en cada `pull_request` un job `zizmor-advisory` que ejecute `zizmor` v1.30.1 sobre `.github/workflows/` en modo advisory (`continue-on-error: true`), con `needs: repo-discovery`, `timeout-minutes: 5`, política `-c .github/zizmor.yml` (fichero mínimo obligatorio, ver requirement de política), instalación fijada (ver escenario), salida `--format=sarif` redirigida a fichero y artefacto de evidencia de 14 días, para cubrir los audits que `actionlint` no detecta (`unpinned-uses`, `unpinned-images`, `unpinned-tools`, `typosquat-uses`); en FASE 1 NO SHALL formar parte de ningún agregador blocking.

#### Scenario: Ejecución advisory en PR

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `zizmor-advisory` con `needs: repo-discovery`, en paralelo a `actionlint-advisory` y `checkov-iac`
- **AND** fija la instalación con `astral-sh/setup-uv` **SHA-pinned** (nunca `@main`/`@v*`; `ubuntu-latest` no garantiza `uv`) y ejecuta `uvx zizmor@1.30.1` (versión exacta, no latest)
- **AND** verifica la versión antes del scan (`zizmor --version` contiene `1.30.1`; si difiere → fallo del paso)
- **AND** redirige la salida a fichero (`--format=sarif -c .github/zizmor.yml .github/workflows/ > zizmor.sarif`) y verifica que `zizmor.sarif` no está vacío y es parseable (`test -s` + `jq -e .`) antes de subirlo
- **AND** declara `permissions` de job con `security-events: write` y sube el SARIF con `category: zizmor` bajo `if: always()` (guard `hashFiles('zizmor.sarif') != ''`)
- **AND** publica el artefacto `zizmor-report-pr` con `retention-days: 14`, `if: always()` e `if-no-files-found: warn`
- **AND** el job termina en éxito aunque haya hallazgos (advisory): `--format=sarif` fuerza exit 0 y el job declara `continue-on-error: true`

#### Scenario: Detección del gap `unpinned-uses`

- **WHEN** un workflow usa una acción con `@master`, `@main` o sin SHA fijo cubierto por las policies
- **THEN** `zizmor-advisory` reporta el hallazgo en el SARIF del PR (artefacto 14d)
- **AND** `actionlint` bloqueante NO lo reporta (limitación documentada: `actionlint` no detecta acciones unpinned)
- **AND** el hallazgo queda visible en la Security tab con `category: zizmor` sin bloquear el merge en FASE 1

### Requirement: Job semanal `zizmor-weekly` advisory (evidencia 90d)

El workflow `scheduled-security.yml` SHALL ejecutar un job `zizmor-weekly` advisory (`continue-on-error: true`) en el cron semanal existente (y `workflow_dispatch`), con la misma instalación fijada que el job PR (`astral-sh/setup-uv` SHA-pinned + `uvx zizmor@1.30.1` + verificación de versión), política `-c .github/zizmor.yml`, salida `--format=sarif` redirigida a `zizmor-weekly.sarif` y verificada no vacía, `category: zizmor-weekly`, artefacto de evidencia de 90 días y sin ruta blocking.

#### Scenario: Auditoría semanal 90d

- **WHEN** corre `scheduled-security.yml` por `schedule` o `workflow_dispatch`
- **THEN** existe el job `zizmor-weekly` con `continue-on-error: true` (taxonomía `advisory (scheduled)`)
- **AND** sube el SARIF vía `github/codeql-action/upload-sarif` con `category: zizmor-weekly` (sin colisionar con `checkov-iac`, `trivy`, `gitleaks` ni `hadolint-weekly`)
- **AND** publica el artefacto `zizmor-weekly` con `retention-days: 90`, `if: always()` e `if-no-files-found: warn`
- **AND** el SARIF se inspecciona tras cada run (el exit code no basta: `--format=sarif` fuerza exit 0)

#### Scenario: Sin dependencia de agregadores

- **WHEN** se revisa el job `zizmor-weekly`
- **THEN** ningún agregador de `ci.yml` ni `required_status_checks` depende de él
- **AND** los jobs `gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly` y `notify-failure` permanecen intactos

### Requirement: Política como código `.github/zizmor.yml` (mínimo obligatorio)

El repo SHALL mantener `.github/zizmor.yml` como política versionada y auditable de `zizmor` desde la implementación del change, en su mínima expresión **válida según el esquema oficial** (`support/zizmor.schema.json`, patrón `.checkov.yml`): `rules.unpinned-uses.config.policies` como **mapa** `patrón → ref-pin|hash-pin` (p. ej. `"*": ref-pin` en FASE 1); los audits restantes (`unpinned-images`, `unpinned-tools`, `typosquat-uses`) están activos por defecto y no llevan claves `enabled:` (inexistentes en el esquema), y el formato/severidad mínima se pasan por CLI (la clave `output:` no existe), ampliable ajustando el mapa `policies` (p. ej. `"actions/*": hash-pin`) según el ruido observado; los **tres consumidores** (job PR, job semanal, pre-commit/validación local) SHALL referenciarla **incondicionalmente** vía `-c .github/zizmor.yml` (sin guards `[ -f ... ]`: el fichero existe tras cualquier checkout y su ausencia es error de implementación); `.github/actionlint.yaml` SHALL permanecer intacto como la política del gate bloqueante.

#### Scenario: Archivo commiteado y consumido

- **WHEN** el equipo decide afinar el ruido de `zizmor` (p. ej. pasar `"actions/*"` de `ref-pin` a `hash-pin`)
- **THEN** el ajuste se versiona en `.github/zizmor.yml` y viaja en un PR normal (auditable), sin editar los workflows para cambiar la política
- **AND** los tres consumidores (job PR, job semanal, pre-commit/validación local) lo referencian vía `-c .github/zizmor.yml`
- **AND** `.github/actionlint.yaml` no se modifica

#### Scenario: Archivo mínimo obligatorio y consumido sin guards

- **WHEN** se implementa el change (los jobs ya referencian `-c .github/zizmor.yml`)
- **THEN** `.github/zizmor.yml` existe commiteado en el mismo PR que los jobs, con contenido mínimo válido según el esquema oficial (`rules.unpinned-uses.config.policies` como mapa; sin claves inexistentes `output:`/`enabled:`)
- **AND** no existe ningún camino de ejecución sin política: los tres consumidores usan `-c` incondicionalmente (sin `[ -f ... ]` guard, sin modo "por defecto de zizmor")
- **AND** `.github/actionlint.yaml` no se modifica

### Requirement: Capa local pre-commit advisory (ambas herramientas)

El repo SHALL proveer en `.husky/pre-commit` una capa advisory de pipeline config scan que ejecute `actionlint` (con la política `.github/actionlint.yaml`) y `zizmor` (con la política `.github/zizmor.yml`) sobre `.github/workflows/` como pasos **no bloqueantes**, fuera de la cadena `set -e` del hook y protegidos con `||`.

#### Scenario: Paso advisory presente sin romper commits

- **WHEN** un desarrollador ejecuta `git commit`
- **THEN** el hook intenta ambas ejecuciones y solo informa de hallazgos o de la ausencia de los binarios (`|| echo "⚠️ ... advisory, no bloquea ..."`)

- **AND** un hallazgo de deuda histórica o un binario fuera de PATH NO interrumpen el commit (sin `exit 1` nuevo introducido por esta capa)
- **AND** los pasos nuevos residen tras los pasos advisory existentes (`lockfile`, `checkov`, `hadolint`), nunca en la cadena bloqueante (lint-staged + SAST + secrets)

#### Scenario: Herramientas ausentes en local

- **WHEN** `actionlint` o `zizmor` no están en PATH del desarrollador
- **THEN** el paso imprime el mensaje advisory de "no disponible" y el commit continúa
- **AND** el stub npm `actionlint@2.0.6` (WASM, no valida de verdad) queda documentado como no equivalente al binario real `v1.7.12` que corre el job bloqueante de CI

### Requirement: Validación local antes de merge (D6)

La documentación SHALL exigir ejecutar ambas herramientas localmente antes de merge sobre `.github/workflows/`: `actionlint -config-file .github/actionlint.yaml .github/workflows/` y `zizmor -c .github/zizmor.yml .github/workflows/`; ante un exit code distinto de 0 (o un SARIF con hallazgos) SHALL exigir corregir antes de merge, sin `--no-fail` ni forzar la revisión.

#### Scenario: Comando local documentado

- **WHEN** se lee la sección de validación local de la doc de la capa
- **THEN** documenta la ejecución en cascada `actionlint ... && zizmor ...` con sus versiones esperadas (`actionlint v1.7.12`, `zizmor v1.30.1`)
- **AND** documenta que `--format=sarif` en `zizmor` fuerza exit 0 → inspeccionar el SARIF generado, no confiar solo en el exit code
- **AND** el resultado manda: corregir el workflow o registrar el hallazgo como deuda con justificación antes de merge

### Requirement: Transición FASE 1 advisory → FASE 2 blocking gradual (diferida)

La capa SHALL evolucionar de `advisory` a `blocking` solo tras 2-4 semanas de runs sin falsos positivos y con **gating explícito**, añadiendo `actionlint-advisory` y/o `zizmor-advisory` al `needs` de `prebuild-security-complete` (anclado por nombre de job) y retirando `continue-on-error: true` a nivel job, bajo estas dos condiciones:

- **(a) `zizmor-advisory`** — como `--format=sarif` fuerza exit 0, el paso bloqueante SHALL parsear `zizmor.sarif` con `jq` y fallar si contiene hallazgos (`jq -e '.runs[0].results | length == 0' zizmor.sarif`) O SHALL ejecutar un run dual (`--format=sarif` para evidencia + `--format plain --min-severity medium` como gate); el estado del job NUNCA SHALL derivar del exit code del scan SARIF.
- **(b) `actionlint-advisory`** — el scope de bloqueo SHALL residir solo en el step lint: los steps `upload-sarif` y `upload-artifact` SHALL conservar `continue-on-error: true` **a nivel step**, de modo que un fallo de permisos (fork PR / Security tab) no marque el job.

El registro único de la taxonomía SHALL permanecer en `docs/learning/quality-gates.md`. El job `actionlint` bloqueante original SHALL permanecer blocking durante todo el proceso.

#### Scenario: Criterio de promoción

- **WHEN** han pasado 2-4 semanas de runs advisory sin falsos positivos, el ruido (`unpinned-uses` con `@v*` sin SHA exacto) está clasificado en `.github/zizmor.yml` y el gating está instalado
- **THEN** se retira `continue-on-error: true` a nivel job (con el gating de (a) y el scope de (b) ya presentes) y se añade el job al `needs` de `prebuild-security-complete`
- **AND** la fila en `quality-gates.md` §2/§4.4 pasa de `advisory (PR, fase 1)` a `blocking (PR)`
- **AND** el `actionlint` bloqueante original no cambia de estado

#### Scenario: Gating explícito de `zizmor` en FASE 2 (exit 0 del SARIF)

- **WHEN** se promueve `zizmor-advisory` a blocking
- **THEN** el paso bloqueante parsea `zizmor.sarif` con `jq -e '.runs[0].results | length == 0'` y falla si `runs[].results[]` contiene hallazgos (alternativa válida: run dual `--format plain --min-severity medium` como gate + `--format=sarif` como evidencia)
- **AND** el estado del job NUNCA deriva del exit code de `zizmor --format=sarif` (que siempre es 0)
- **AND** un PR de prueba con un hallazgo `medium+` hace fallar el job (verificación obligatoria de la promoción)

#### Scenario: Scope de bloqueo solo step lint (`actionlint-advisory` FASE 2)

- **WHEN** se promueve `actionlint-advisory` a blocking
- **THEN** el step lint es el único cuyo fallo marca el job
- **AND** `upload-sarif` y `upload-artifact` conservan `continue-on-error: true` a nivel step: un fallo de permisos (fork PR / Security tab) no bloquea el merge
- **AND** no se reintroduce `continue-on-error: true` a nivel job (eso re-abriría el bloqueo por uploads en FASE 2)

#### Scenario: Retroceso simple

- **WHEN** la FASE 2 produce un falso positivo en un PR
- **THEN** se re-añade `continue-on-error: true` y se retira la línea del `needs` (un solo revert), sin rediseñar el job

### Requirement: Documentación de la capa (quality-gates, license-policy, pipeline-config-scan)

La documentación SHALL dejar constancia de la capa en `docs/learning/quality-gates.md` (§2 filas `actionlint-advisory` y `zizmor-advisory` con taxonomía `advisory (PR, fase 1)` → `blocking (PR)` en FASE 2, y §4.4 filas `actionlint-advisory`, `zizmor-advisory` y `zizmor-weekly`), en `docs/learning/license-policy.md` §6 (capa de pipeline config scan — configuración de workflows, no licencias ni CVE) y en `docs/learning/pipeline-config-scan.md` (§5.1/§5.2/§5.3/§5.4/§5.5/§5.6 corregidos según enmiendas A5-A7 y §9 con el estado implementado). El doc SHALL documentar los comandos canónicos de validación local y pre-merge (`actionlint -config-file .github/actionlint.yaml .github/workflows/` y `zizmor -c .github/zizmor.yml .github/workflows/`), la mecánica SARIF de actionlint (plantilla versionada pasada como contenido de `-format`; la pseudo-plantilla inline `{{template "sarif" .}}` produce salida vacía) y el esquema válido de `.github/zizmor.yml` (mapa `policies`); la taxonomía SHALL registrar las categorías únicas `actionlint`, `zizmor` y `zizmor-weekly` y el stub npm `actionlint@2.0.6` (WASM) como no equivalente al binario real v1.7.12, y ningún registro SHALL duplicar los de las capas ya documentadas (Trivy, Checkov, Hadolint).

#### Scenario: Filas y comandos documentados sin duplicar capas

- **WHEN** se actualiza cualquiera de los tres documentos de la capa
- **THEN** las filas nuevas en `quality-gates.md` §2/§4.4 no duplican las existentes (`actionlint` bloqueante, `dependency-review`, `checkov-iac`, `containerfile-lint`, ...) y las referencias a jobs están ancladas por nombre
- **AND** la fila de cada job advisory refleja su modo actual (`advisory (PR, fase 1)` → `blocking (PR)` en FASE 2; `advisory (scheduled)` para `zizmor-weekly`)
- **AND** la tabla de `license-policy.md` §6 registra la capa sin introducirla como gate de licencias (`deny-licenses` permitido)
