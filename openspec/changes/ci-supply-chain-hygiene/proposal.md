# Proposal

## Why

Dos debilidades de supply chain en los jobs activos de los substages 2B (quality) y 2C (security) de `ci.yml`, identificadas en el análisis externo del pipeline (2026-09-30) y verificadas contra el repo y la documentación oficial:

1. El job `actionlint-advisory` (2C) ejecuta `bash <(curl …raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.12` — el binario está fijado a 1.7.12, pero el **script instalador apunta a `main`**, no a un tag ni SHA. Si ese script cambia (comprometido o no), el próximo PR lo ejecuta sin aviso. Además, la spec `ci-prebuild-lint` declara que el job "SHALL execute `rhysd/actionlint@v1`", lo que ya no refleja la implementación real (instalador bash), una desincronización existente que este change corrige de paso.

2. El job `scancode-license-pr-diff` (2C) obtiene la deny-list de licencias **scrapeando el propio YAML de `ci.yml` con grep/sed** (`grep -E '^\s*deny-licenses:' … | head -1`), un parseo frágil que un cambio de indentación rompe silenciosamente. Además, la doc oficial de `dependency-review-action` marca `deny-licenses` como **deprecated** (issue #938, posible removal en la próxima major), por lo que la fuente única hoy vive en una clave con fecha de caducidad.

## What Changes

- **actionlint vía imagen Docker pinneada**: `actionlint-advisory` (2C) ejecuta `docker://rhysd/actionlint:1.7.12` (tag existente en Docker Hub, verificado; convención del repo: imágenes pinneadas a versión exacta, sin `:latest`). Se elimina el patrón `curl | bash` y con él la ejecución de scripts remotos en runtime. Los flags y la salida SARIF/artifact del job se conservan idénticos.
- **Consolidación del gate actionlint (decisión del usuario 2026-09-30, post-edición concurrente)**: el job bloqueante `actionlint` (2B) es **removido** — su cobertura de lint queda en el job advisory de 2C (SARIF + Code Scanning) y en zizmor advisory; el agregador `prebuild-quality-complete` pasa de 15 a 14 jobs (removiendo `actionlint` de su `needs`). Trade-off consciente y documentado: los hallazgos de actionlint dejan de bloquear el PR (el job de 2C es `continue-on-error: true`); la política del bloqueo se preserva como contenido del SARIF en Code Scanning.
- **Política de licencias externalizada**: nueva fuente de verdad versionada `.github/license-policy.yml` con la deny-list (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `CC-BY-NC-4.0`). El job `dependency-review` la consume vía input `config-file` (mecanismo oficial soportado por `dependency-review-action`), reemplazando la clave inline `deny-licenses` (deprecated). El job `scancode-license-pr-diff` lee la lista del mismo archivo con `node -e` (sin grep sobre ci.yml, sin dependencia de jq).
- **Coherencia de las tres fuentes preservada**: `LICENSE_DENY_LIST` en `scripts/security/generate-security-digest.mjs` sigue siendo superconjunto documentado; `docs/learning/license-policy.md` sigue siendo la política narrativa y ahora referencia el archivo de config como fuente ejecutable.
- No se mueve ningún job de substage, no cambian `name:` de jobs existentes ni permisos.

## Capabilities

### New Capabilities

- `license-policy-config`: el archivo `.github/license-policy.yml` como única fuente de verdad ejecutable de la deny-list de licencias, consumida por `dependency-review` (vía `config-file`) y `scancode-license-pr-diff` (vía lectura directa), con validación de parseo obligatoria en el consumidor bash.

### Modified Capabilities

- `ci-prebuild-lint`: el requirement del job `actionlint` bloqueante queda **REMOVED** (job consolidado por decisión del usuario; el comentario del header 2B ya no lo lista); se conserva el job `actionlint-advisory` de 2C, cuyo mecanismo pasa a imagen Docker pinneada `rhysd/actionlint:1.7.12` con escenario nuevo que prohíbe la descarga de scripts remotos en runtime.
- `license-compliance`: los requirements "Coherencia entre deny-list de config y documentación" y "Escaneo de licencias PR-diff sobre archivos cambiados (dual job)" cambian la fuente de la deny-list — de "la clave `deny-licenses` del bloque `with:` en ci.yml" a `.github/license-policy.yml` consumida vía `config-file`/lectura directa. La coherencia tres-vías (config ↔ `license-policy.md` ↔ superconjunto del digest) y la taxonomía de fases se preservan.
- `ci-prebuild-substage-structure`: el aggregator `prebuild-quality-complete` pasa de 15 a 14 jobs (sale `actionlint`) y el header visual 2B deja de listar `actionlint`.

## Impact

- **Código**: `.github/workflows/ci.yml` (4 ediciones: job `actionlint-advisory` a Docker, needs del agregador quality, header 2B, `dependency-review` + `scancode-license-pr-diff` a policy file). Ningún `name:` de job existente cambia.
- **Archivos nuevos**: `.github/license-policy.yml`.
- **Specs**: deltas sobre `ci-prebuild-lint` (REMOVED+ADDED), `license-compliance` (2 MODIFIED), `ci-prebuild-substage-structure` (2 MODIFIED) + nueva capability `license-policy-config`.
- **Docs**: `docs/learning/license-policy.md`, `docs/learning/license-compliance.md`, `docs/learning/dependency-review.md`, `docs/learning/pipeline-config-scan.md` (nota de eliminación del curl|bash y de la consolidación).
- **Reglas / Governance**: el check `Quality: ActionLint` (blocking) desaparece del PR; verificar que el ruleset no lo tenga en `required_status_checks` (si lo tiene, actualizar el ruleset post-merge o el PR queda bloqueado). `ci-complete` no cambia (consume agregadores, no el job directo).
- **Riesgo principal**: `config-file` de dependency-review cambia el modo de fallo ante config inválida (la acción valida SPDX al arranque igual que con inline); mitigado con validación local del YAML y primer run observado antes de merge.
