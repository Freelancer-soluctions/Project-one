# ci-prebuild-lint Delta

## REMOVED Requirements

### Requirement: actionlint job runs on PRs modifying shared/workflow files

**Reason**: el job bloqueante `actionlint` (2B) fue consolidado por decisión del usuario (2026-09-30) — su cobertura de lint de workflows queda cubierta por el job `actionlint-advisory` (2C, SARIF + Code Scanning) y por `zizmor-advisory`. Mantener dos jobs que descargan y ejecutan el mismo binario por separado en cada PR duplicaba checkout + instalación (hallazgo #7 del análisis del pipeline).

**Migration**: la cobertura migrada al job advisory de 2C conserva los mismos archivos escaneados (`.github/workflows/*.y*ml`) y la misma config (`.github/actionlint.yaml`); los hallazgos son visibles en Code Scanning (SARIF, categoría `actionlint`) y en el artifact del PR. Trade-off consciente: los hallazgos dejan de bloquear el merge mientras el job de 2C permanezca en `continue-on-error: true` (FASE 1); la graduación a blocking de ese job (FASE 2 de `pipeline-config-scan`) restablece el gate. Verificar que el ruleset de `main` no tenga el check `Quality: ActionLint` en `required_status_checks` antes del merge (si lo tiene, removerlo del ruleset en el mismo ciclo).

## ADDED Requirements

### Requirement: actionlint-advisory job runs via pinned Docker image without remote scripts

The `actionlint-advisory` job in `ci.yml` SHALL execute the pinned Docker image `rhysd/actionlint:1.7.12` on pull requests that modify shared files or GitHub Actions workflows, without downloading remote scripts at runtime.

#### Scenario: PR modifies shared/workflow files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `shared == 'true'`
- **THEN** the `actionlint-advisory` job runs the pinned Docker image `rhysd/actionlint:1.7.12`
- **AND** the job scans all `.github/workflows/*.y*ml` files with the same config (`.github/actionlint.yaml`) and SARIF template as before the consolidation

#### Scenario: PR does not modify shared/workflow files

- **WHEN** a pull request targets `main` AND the `repo-discovery` job outputs `shared == 'false'`
- **THEN** the `actionlint-advisory` job is skipped

#### Scenario: Sin ejecución de scripts remotos en runtime

- **WHEN** se inspeccionan los steps del job `actionlint-advisory` en `.github/workflows/ci.yml`
- **THEN** ninguno descarga ni ejecuta scripts remotos (no existe el patrón `curl | bash` ni su equivalente con `wget`)
- **AND** la única referencia de versión de actionlint es el tag de la imagen Docker `rhysd/actionlint:1.7.12`
- **AND** la salida SARIF y el artifact del job se conservan con los mismos flags, categoría y retención que tenía la implementación por instalador bash
