# Tasks

> **Estado (2026-09-25): implementado.** 12/14 tareas verificadas localmente; 5.1/5.2 requieren el `workflow_dispatch` de prueba post-merge (el run de verdad no puede dispararse desde el árbol de trabajo sin push). Hallazgo clave 1.1/1.2: **NO se ejecutó `gh workflow enable`** — ambos workflows ya estaban `active` (rehabilitados por `secret-scanning` el 2026-09-25), condición "SOLO si `disabled_manually`" no cumplida.

## 1. Rehabilitación de workflows

- [x] 1.1 Verificar SOLO por API el estado de `.github/workflows/security.yml` (`gh workflow view security.yml --json state`); habilitar (`gh workflow enable security.yml`) ÚNICAMENTE si el estado es `disabled_manually`. Si ya está `active`, NO hacer nada y registrar el hallazgo (change secret-scanning ya lo habilitó 2026-09-25) — ✅ **hallazgo: `state: active`** (API `actions/workflows`); nada que hacer, registrado aquí.
- [x] 1.2 Verificar SOLO por API el estado de `.github/workflows/scheduled-security.yml`; habilitar ÚNICAMENTE si `disabled_manually`. Si ya está `active`, NO hacer nada y registrar el hallazgo — ✅ **hallazgo: `state: active`** (API); nada que hacer. Nota: `gh workflow view --json` no existe en esta CLI (flag rechazado) → verificación vía `gh api .../actions/workflows --jq`.

## 2. Schedule y triggers (D2)

- [x] 2.1 Añadir triggers `schedule` (cron `0 3 * * 1`, lunes 03:00 UTC) + `workflow_dispatch` + `merge_group` al workflow `security.yml` y verificar con `actionlint`/`action-validator` que el YAML es válido — ✅ triggers = `workflow_call, pull_request, push, merge_group, schedule, workflow_dispatch` (verificado con js-yaml; la npm actionlint del repo es stub wasm — validación estructural, el job `actionlint` de CI es la barrera real).
- [x] 2.2 Verificar que `scheduled-security.yml` conserva cron `0 3 * * 1` + `workflow_dispatch` y añadir `merge_group` si aplica, validando el YAML — ✅ cron + dispatch conservados; `merge_group` añadido; YAML parse OK.
- [x] 2.3 Añadir job Semgrep full scan semanal (sin `--baseline-commit`, configs `.semgrep/rules` + `p/owasp-top-ten` + `p/security-audit`, `--sarif-output semgrep.sarif`, JSON report) con `continue-on-error: true` — ✅ job `semgrep-full-scan` en `security.yml`: pasos JSON (`--json-output semgrep-report.json`) y SARIF (`--sarif-output semgrep.sarif`), ambos `continue-on-error: true` + outcomes exportados; SIN `--baseline-commit` (full tree); Docker pin `semgrep/semgrep:1.176.1` (mismo pin que el job L2 de `ci.yml`); excludes idénticos al L2.
- [x] 2.4 Añadir `continue-on-error: true` a los steps de Trivy (exit-code: 1 en hallazgos) y a CodeQL Analyze en `security.yml`; verificar con grep que ambos steps lo tienen — ✅ Trivy (`id: scan-sarif`) y CodeQL (`id: analyze`) con `continue-on-error: true`; verificación estructural: 4 steps con continue-on-error (`scan-sarif`, `analyze`, `scan-json`, `scan-sarif`).

## 3. SARIF upload (§3.3)

- [x] 3.1 Para CodeQL usar la subida integrada: `category: codeql` como input de `analyze@v4` (SIN paso `upload-sarif` separado). Mantener `upload-sarif@v4` con `category` única (`semgrep`, `trivy`, `gitleaks`) en ambos workflows y verificar unicidad — ✅ categorías: `trivy` (dependency-scan), `codeql` (sast analyze integrado), `semgrep` (semgrep-full-scan), `gitleaks` (scheduled-security.yml, preexistente) — script de verificación: `unique: YES`.
- [x] 3.2 Confirmar permisos `security-events: write` a nivel workflow en `security.yml` y `scheduled-security.yml` — ✅ presente en ambos (preexistente, conservado).
- [x] 3.3 Añadir `permissions: issues: write` a nivel job en `notify-failure` de `security.yml`; verificar que el permiso está declarado — ✅ `{"issues":"write"}` en el job (verificado por parse).

## 4. notify-failure (D1)

- [x] 4.1 Propagar el patrón `outputs: scan-*-outcome` + job `notify-failure` con `if: always()` y condición sobre `steps.*.outcome` a `security.yml` (CodeQL/Trivy/Semgrep full), verificando que no se usa `needs.*.result` como señal de falla — ✅ outputs `scan-sarif-outcome`/`sast-outcome`/`scan-json-outcome`/`scan-sarif-outcome`; condición SOLO sobre `needs.<job>.outputs.*-outcome` (grep: cero `needs.*.result` en condiciones).
- [x] 4.2 Verificar en `scheduled-security.yml` que `notify-failure` crea issue solo cuando algún `scan-*-outcome == 'failure'` (leer condición del `if:` del paso github-script) — ✅ condición `scan-json-outcome == 'failure' || scan-sarif-outcome == 'failure'` (patrón ya corregido por secret-scanning; conservado).

## 5. Validación de artifacts y run de prueba

- [x] 5.0 En `security.yml` crear uploads de artifacts — SARIF con `retention-days: 90` y JSON con `retention-days: 30`, ambos con `if: always()`; añadir `if: always()` al upload SBOM existente (`retention-days: 365`) — ✅ verificación estructural: trivy-results-sarif 90d/always, semgrep-report 30d/always, semgrep-sarif 90d/always, sbom 365d/always (`if-no-files-found: error` en SBOM; `warn` en SARIF/JSON de Semgrep para no romper evidencia si un scan sin hallazgos no escribe el archivo).
- [ ] 5.1 Ejecutar `workflow_dispatch` en ambos workflows y verificar artifacts: JSON `retention-days: 30`, SARIF `retention-days: 90`, SBOM `retention-days: 365` con `if-no-files-found: error` — ⏳ **post-merge**: requiere el workflow pusheado a GitHub (un `gh workflow run` con el archivo local sin push dispararía la versión de `main`).
- [ ] 5.2 Verificar que los SARIF subidos aparecen en Security → Code scanning alerts y que los runs quedan en verde (audit mode) aunque haya hallazgos — ⏳ **post-merge**: mismo motivo; checklist en §6.3 del doc de learning.

## 6. Gobernanza advisory (D3) y docs

- [x] 6.1 Verificar que ningún check `scheduled-scanning` figura como required en el ruleset 21227644 (GET ruleset → `required_status_checks` sin esa entrada): el criterio de éxito es la AUSENCIA en `required_status_checks` — ✅ API: required = solo los 4 governance checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO); grep jq de `scheduled-scanning` → **0 coincidencias**; además no existe regla `code_scanning` en el ruleset.
- [x] 6.2 Actualizar `docs/learning/sast-implementation.md` §4.1/§6.2 (estado de gaps: workflows habilitados, SARIF Semgrep, notify-failure) y documentar el proceso de triaje semanal — ✅ §4.1 items 1/3 marcados implementados; §6.2 items 2/3/7 RESUELTOS + nueva subsección "Triaje semanal (security champions)" con el proceso de 5 pasos; §6.3 actualizado.
