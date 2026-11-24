# Calidad y Gates — Implementación Profesional (Quality Gates)

## 1. Contexto y estado actual

El proyecto `project-one` usa un pipeline CI/CD con substage 2B (`prebuild-quality-complete`) que agrega jobs de calidad (`lint`, `format-check`, `complexity-check`, `dead-code`, `import-bounds`, `typecheck`, etc.) bajo un agregador (`needs`) y un paso de `prebuild-quality-complete` que evalúa `contains(needs.*.result, 'failure')`. El `ci-complete` (required check) es el único bloque del merge gate. Según `docs/CONTEXT-CICD.md` (§13.4) y `docs/ci-cd/pre-merge-gates-governance.md`, no todos los jobs de calidad son bloqueantes (`if: false` o `continue-on-error: true`); el objetivo es que `quality-gates.md` documente qué jobs son `gate` (bloquean merge si fallan), cuáles son `advisory` (informan, permiten `continue-on-error`), y cómo lograr que `ci-complete` refleje la salud real.

Referencia: `.github/workflows/ci.yml`; `docs/CONTEXT-CICD.md`; `docs/ci-cd/pre-merge-gates-governance.md`; `docs/learning/import-boundaries.md` (§4.2 CI, §5 pipeline); `docs/learning/knip-configuration.md`; `docs/learning/eslint-complexity-configuration.md`; `docs/learning/prettier-configuration.md`; `docs/learning/typescript-strict-check.md`; `docs/learning/docs-changelog-validation.md`; `docs/learning/license-policy.md` (fuente canónica de la política de licencias). Estado de cambio: `docs-changelog-validation` (propuesta activa) y `typescript-strict-check` (nuevo, `tsconfig.json` + `strict` gradual).

## 2. Taxonomía de gates (definición de referencia)

Basado en patrones oficiales de GitHub (`docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`, `docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context`, `docs.github.com/en/actions/learn-cicd/understanding-github-actions`) y patrones enterprise (`Mixpanel` / `prebuild-quality-complete`):

| Tipo                                     | Job                                   | Significado                                                                                                                                                                                                                                                                                                                                                                           | Estado en `ci.yml` (change `quality-gates`, 2026-09-26)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `continue-on-error`                                                                                                                                                                                                    | `if: false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --- | --- | ---------------------------------------------- |
| **blocking**                             | `lint` (client/server)                | Fallo bloquea PR                                                                                                                                                                                                                                                                                                                                                                      | `client-lint` / `server-lint` activos (path-scoped, `pull_request`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `needs` del agregador requiere éxito                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **blocking**                             | `format-check` (client/server/e2e)    | Fallo bloquea PR                                                                                                                                                                                                                                                                                                                                                                      | `client-format-check`, `server-format-check` (ACTIVADO 2026-11-12, change `ci-format-check-blocking`) y `e2e-format-check` (NUEVO) — CI solo `--check`, auto-fix en lint-staged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Separa `prettier` de `lint`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **blocking**                             | `typecheck` (client/server)           | Fallo de `tsc --noEmit` bloquea PR                                                                                                                                                                                                                                                                                                                                                    | **ACTIVADOS** (change `quality-gates`): sin `if: false` y sin máscara de exit code (el "or-echo" fue eliminado); tsconfigs mínimos `apps/{client,server}/tsconfig.json` (allowJs, checkJs off) + script `type-check`; strict llega con `typescript-strict-check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sin tsconfig el fallback era inválido (help + exit 1) — por eso existen los tsconfigs mínimos                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **blocking**                             | `complexity` (client/server)          | Umbral `complexity` de `eslint.config.js` (15 core / 10 utils / off tests)                                                                                                                                                                                                                                                                                                            | **ACTIVADOS** (change `quality-gates`): sin `--rule` CLI override ni `if: false` (client ya lo estaba)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Redundancia aceptada con `lint` (misma regla subyacente) — documentada en design D2                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **blocking**                             | `import-bounds` (client/server)       | Cross-workspace/capas internas vía dependency-cruiser                                                                                                                                                                                                                                                                                                                                 | Ambos activos (change `import-boundaries`); baseline `.dependency-cruiser-known-violations.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Gate + report `err-html` con artefacto                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                                                                                                                                                                                                                                                                                                                                                                                                | **blocking**                                                                                                                                                                                                                                                                                                                                 | `e2e-lint`, `openspec-validate` | Fallo bloquea PR. `openspec-validate` además corre `npm run test:scripts` (suite de `scripts/ci/**`, incl. el lockstep plantilla↔política del PR body — change `pr-metadata-workflow`) | Activos (`e2e-lint` path-scoped; `openspec-validate` en todo `pull_request`) | No  | No  | En `prebuild-quality-complete.needs` (16 jobs) |
| **blocking (PR)**                        | `root-manifest-guard`                 | Higiene del `package.json` raíz: `dependencies` ⊆ requisitos directos (workspaces/devDeps raíz) ∪ allowlist con `reason` (spec `root-manifest-hygiene`)                                                                                                                                                                                                                               | **NUEVO** (change `root-manifest-cleanup`, 2026-09-29): corre `scripts/check-root-manifest.mjs` (Node puro, sin red) cuando el PR toca `package.json`/`package-lock.json` raíz; bloquea re-aplanación del manifest (causa raíz de FPs de typosquatting y dependency confusion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | En `prebuild-quality-complete.needs` (16 jobs); script npm local: `npm run check:manifest`; advisory pre-commit en `.husky/pre-commit`                                                                                                                                                                                                                                                                                                                                                                          |
| **blocking (required check)**            | `pr-body-lint` (en `pr-metadata.yml`) | Gate de la DESCRIPCIÓN del PR: política reducida en `scripts/ci/pr-body-lint.mjs` desde 2026-10-23 (change `simplify-pr-body-lint-template`): `EMPTY_BODY` · R2a `Summary` con contenido · R2b `Related Issue` con contenido · R2c tests con contenido o casilla marcada · R3 `Closes #` sin número. **Sin mínimos de longitud y sin reglas de advertencia** (R1, R4 y R5 eliminadas) | **NUEVO** (change `pr-metadata-workflow`, 2026-10-20): blocking desde el 1er commit — el usuario omitió la ventana de calibración (design D8). La política se lee del BASE ref y el lockstep con la plantilla corre en `openspec-validate` (`npm run test:scripts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Required check del ruleset 21227644 desde 2026-10-22 (FASE 3 completada: GET → modify → PUT; 5º contexto, `integration_id=15368`). Exención por AUTOR bot (nunca por actor); sin bypass por label; owner `devops-team` vía `.github/CODEOWNERS`                                                                                                                                                                                                                                                                 |
| **advisory**                             | `dead-code` (client/server)           | knip informa, NO bloquea                                                                                                                                                                                                                                                                                                                                                              | Activos con `continue-on-error: true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | **Sí**                                                                                                                                                                                                                 | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `needs` recibe `success` aunque falle (`actions/toolkit#581`)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **advisory**                             | `docs-validation` (fase 1)            | markdownlint sobre `docs/`; reporte en step summary                                                                                                                                                                                                                                                                                                                                   | **NUEVO** (change `quality-gates`: `continue-on-error: true` + publication del reporte); **NO** está en `needs` del agregador bloqueante; vale llega en fase 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | **Sí**                                                                                                                                                                                                                 | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Fase 2 (blocking en `needs`) solo cuando docs/ pase limpio                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **blocking (PR) / advisory (scheduled)** | `secrets` / `gitleaks-full-scan`      | Secret Detection bloquea el PR si gitleaks halla un secreto en el diff; full-history semanal = audit                                                                                                                                                                                                                                                                                  | `secrets` en `ci.yml` substage 2C (wireado a `prebuild-security-complete.needs`); `gitleaks-full-scan` en `scheduled-security.yml` con `continue-on-error: true` (change `secret-scanning`, 2026-09-25)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No (PR) / **Sí** (scheduled)                                                                                                                                                                                           | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `notify-failure` del scheduled usa `needs.*.outputs.*-outcome` (steps con `continue-on-error` dejan el job en success)                                                                                                                                                                                                                                                                                                                                                                                          |
| **advisory (PR)**                        | `dependency-review`                   | SCA del diff del PR: reporta vulnerabilidades `>= moderate` y licencias en deny-list (advisory, no bloquea el merge)                                                                                                                                                                                                                                                                  | Activo en `ci.yml` substage 2C; **advisory** (job-level `continue-on-error: true` y excluido de `prebuild-security-complete.needs`); corre solo en `pull_request` (change `dependency-review`, 2026-09-25); check propio + comentario en el PR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Política de licencias `deny-licenses` + `comment-summary-in-pr: on-failure`; doc canónico `docs/learning/dependency-review.md`                                                                                                                                                                                                                                                                                                                                                                                  |
| **blocking (PR, fase 2)**                | `scancode-license-pr-diff`            | Licencia/copyright por archivo (ScanCode 32.5.0) sobre el diff ACMR del PR; cierra el gap de manifiesto de `dependency-review`                                                                                                                                                                                                                                                        | Activo en `ci.yml` (change `license-compliance`, FASE 1, 2026-09-26; **FASE 2 blocking ACTIVA 2026-11-10**, change `scancode-license`): sin job-COE ni step-COE; **FIX crítico** — la imagen `aboutcode/scancode-toolkit:32.5.0` NO existe en Docker Hub (el job era un no-op verde permanente desde su creación: pull exit 125 enmascarado por COE); ahora instala vía `setup-uv` SHA-pinned + `uv tool install --python 3.12 scancode-toolkit==32.5.0` con version check; artifact `pr-license-report.json` con `retention-days: 14` + `if: always()` + `if-no-files-found: warn`; deny-list leída en runtime de `.github/license-policy.yml` (fuente única ejecutable, sin duplicar lista); evaluate fail-closed (report ausente → exit 1) | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | En `prebuild-security-complete.needs` (10 jobs, incl. `security-exceptions-check`), blocking desde 2026-11-10; licencia de deny-list → `::error::` + exit 1; `LicenseRef-scancode-unknown*` = warning + ticket obligatorio (SLA 30 días, `security/SLA.md` §2, plantilla `unknown-license.yml`), escalada a bloqueo SOLO si existe excepción vencida (`expires < hoy`) en `security/exceptions.yml` con `tool: scancode` + `scope` del path; rollback = revert único (§7.4); dual job con el audit semanal (D4) |
| **blocking (PR)**                        | `lockfile-audit`                      | CVE del lockfile resuelto (`scripts/audit-gate.mjs`: critical siempre, high solo con fix; moderate/low advisory); detecta CVE, no licencias                                                                                                                                                                                                                                           | Activo en `ci.yml` (change `sca-lockfile-compliance`): **FASE 2 blocking ACTIVA (2026-11-10) — sin job-COE**: `npm audit --json ...                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                                        | true`y`scripts/audit-gate.mjs`deciden el veredicto (critical siempre, high solo con fix; moderate/low advisory; fail-closed si falta el reporte), artifact`lockfile-audit-pr`con`retention-days: 14`+`if: always()`+`if-no-files-found: warn`; **sin `npm ci`** (el audit lee `package-lock.json`directamente); step OSV-Scanner blocking cuando cambia el lockfile (sin COE) (SARIF`category: osv-scanner`, sin EPSS/KEV; ventana de calibración 2026-11-10 → 2026-11-24 documentada en `sca-dependency-lockfile-scan.md` §11) y guard de lockfile obligatorio (`package.json`sin`package-lock.json` falla) | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | No                                                                                                                                                                                                                                                                                                                                                                                                             | Cableado a `prebuild-security-complete.needs` desde Phase 0 (change `prebuild-security-aggregator-strict`); blocking desde 2026-11-10; política de severidad: critical siempre, high con fix, moderate/low advisory (fuente distinta: CVE lockfile resuelto vs manifiesto); un fallo de red/registro del audit también bloquea (fail-closed) |
| **advisory (scheduled)**                 | `scancode-license-audit`              | Audit de licencia/copyright por archivo (ScanCode) sobre el repo completo; hallazgos no bloquean                                                                                                                                                                                                                                                                                      | Activo en `scheduled-security.yml` (cron lunes 03:00 UTC, change `license-compliance`, 2026-09-25; **FIX 2026-11-10**, change `scancode-license`: la imagen Docker `aboutcode/scancode-toolkit:32.5.0` NO existe — mismo no-op verde que el job PR; ahora instala vía `setup-uv` SHA-pinned + `uv tool install --python 3.12 scancode-toolkit==32.5.0` con version check): `continue-on-error: true` en el scan step (sigue advisory), artifact `scancode-report.json` con `retention-days: 90` + `if: always()`; sin `needs` de agregadores ni `required_status_checks`                                                                                                                                                                      | **Sí**                                                                                                                                                                                                                 | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Evidencia por artifact; findings → issues manuales; también vigila la edad de los tickets de unknown licenses (job PR es stateless, `license-policy.md` §3.1); política: `docs/learning/license-policy.md`; complementario a `dependency-review` (manifiesto PR) y Trivy (CVE filesystem)                                                                                                                                                                                                                       |
| **inactivo (sin credenciales)**          | `sonarqube` (client/server)           | Quality Gate de Sonar (D2 diferido)                                                                                                                                                                                                                                                                                                                                                   | `if: false` con comentario "sin credenciales". Decision D2 = mantener inactivo (2026-11-12), registrada en quality-policy.md sec 4.2. Al activar: action SonarSource/sonar-quality-gate-check sin continue-on-error (required directo), no advisory+COE.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | -                                                                                                                                                                                                                      | Si                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Ver quality-policy.md sec 4.2 (D2 diferido)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **blocking (PR, fase 2)**                | `checkov-iac`                         | IaC Policy as Code (Checkov) sobre Dockerfile/terraform/kubernetes                                                                                                                                                                                                                                                                                                                    | Activo en `ci.yml` (change `sca-lockfile-compliance`; **FASE 2 blocking ACTIVA 2026-11-10**): sin job-COE y `soft_fail: false`, política `.checkov.yml` vía input `config_file`, artifact `checkov-report-pr` con `retention-days: 14`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **Sí**                                                                                                                                                                                                                 | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Cableado a `prebuild-security-complete.needs` desde Phase 0 (change `prebuild-security-aggregator-strict`); **blocking desde 2026-11-10** (sin job-COE, `soft_fail: false`); baseline `.checkov.baseline` (fail-on-new) pendiente; complementaria a SAST (código) y SCA (dependencias) — configura infraestructura, no analiza licencias ni CVE                                                                                                                                                                 |
| **blocking (PR, fase 2)**                | `containerfile-lint`                  | Calidad del Containerfile (Hadolint): ShellCheck sobre `RUN`, pin de versiones, capas, registry allowlist — NO IaC policy                                                                                                                                                                                                                                                             | Activo en `ci.yml` (change `containerfile-lint`; **FASE 2 blocking ACTIVA 2026-11-10**): sin job-COE y `failure-threshold: warning`, política `.hadolint.yaml` vía input `config`, `format: sarif`, artifact `hadolint-report-pr` con `retention-days: 14` + SARIF `category: hadolint`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Sí**                                                                                                                                                                                                                 | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Cableado a `prebuild-security-complete.needs` desde Phase 0 (change `prebuild-security-aggregator-strict`); **blocking desde 2026-11-10** (sin job-COE, `failure-threshold: warning`); capa COMPLEMENTARIA a `checkov-iac` (calidad Dockerfile ≠ policy IaC; solape CKV_DOCKER_2/4 ≈ DL3006/DL3057 aceptado)                                                                                                                                                                                                    |
| **blocking (PR, fase 2)**                | `actionlint-advisory`                 | Pipeline config scan (actionlint v1.7.12): sintaxis/semántica de workflows con salida SARIF                                                                                                                                                                                                                                                                                           | Activo en `ci.yml` bloque security 2C (reubicación `ci-security-substage-alignment`, 2026-09-30; change `pipeline-config-scan`, FASE 2 blocking 2026-11-10: sin job-COE (gate `jq` sobre el SARIF; uploads step-COE), imagen Docker pinneada `rhysd/actionlint:1.7.12` vía `docker run` (2026-09-30: sin curl                                                                                                                                                                                                                                                                                                                                                                                                                                 | bash; único job actionlint por PR — el bloqueante de 2B fue consolidado aquí), plantilla SARIF versionada `.github/actionlint-sarif.tmpl` como `-format`, artifact `actionlint-report-pr` 14d + `category: actionlint` | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Cableado a `prebuild-security-complete.needs` desde Phase 0 (change `prebuild-security-aggregator-strict`); el gate bloqueante `actionlint` fue removido de 2B (2026-09-30, consolidación aquí — la cobertura de lint queda en SARIF/Code Scanning y `zizmor-advisory`); FASE 2 ACTIVA (2026-11-10): sin job-COE, bloqueo solo en el step lint (uploads step-COE) — restablece el gate bloqueante de workflows |
| **blocking (PR, fase 2)**                | `zizmor-advisory`                     | Pipeline config scan (zizmor v1.30.1): `unpinned-uses` y audits que actionlint no cubre                                                                                                                                                                                                                                                                                               | Activo en `ci.yml` bloque security 2C (reubicación `ci-security-substage-alignment`, 2026-09-30; change `pipeline-config-scan`, FASE 1, 2026-09-28): sin job-COE (FASE 2 blocking 2026-11-10), instalación fijada (`setup-uv` SHA-pinned + `uvx zizmor@1.30.1` + version check), política `.github/zizmor.yml` incondicional, SARIF `category: zizmor` + artifact 14d. PRIMER RUN REAL: 90 hallazgos, exit 0 (SARIF siempre exit 0 — validar el fichero, nunca el exit code)                                                                                                                                                                                                                                                                  | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Cableado a `prebuild-security-complete.needs` desde Phase 0 (change `prebuild-security-aggregator-strict`); FASE 2 ACTIVA (2026-11-10): gate bloqueante sobre TODAS las reglas (`results                                                                                                                                                                                                                                                                                                                        | length == 0`, sin job-COE) con deuda remediada en origen; política `"\*": hash-pin`desde 2026-11-10 (change`sha-pinning-remaining-actions`) → cualquier `uses: owner/action@vX` rompe CI, y la única forma de pasar es SHA completo (mantenido por Dependabot)                                                                                                                                                 |
| **blocking (PR)**                        | `typosquat-guarddog`                  | Typosquatting / dependency confusion (GuardDog v3.2.0): metadatos + YARA sobre `package.json` — 0-day sin CVE, exclusiva; condicionado a cambios en manifiestos/lockfiles via `repo-discovery.outputs.manifests`                                                                                                                                                                      | Activo en `ci.yml` bloque security 2C (reubicación `ci-security-substage-alignment`, 2026-09-30; change `typosquatting-detection`, **blocking desde 2026-11-10**): sin job-COE; gate `jq` sobre el SARIF (bloquea si hay CUALQUIER hallazgo, no solo typosquatting); wrapper versionado `scripts/guarddog-verify.sh` (única política: pin `3.2.0` + verificación de versión, devDeps excluidas vía `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false`, sandbox obligatorio — nunca `--no-sandbox`), `setup-uv` SHA-pinned v6.7.0, SARIF `category: guarddog` + artifact 14d con guards (`\|\| true` + `test -s` + `jq -e .` + `hashFiles`); condicionado a `needs.repo-discovery.outputs.manifests == 'true'`                                      | **No**                                                                                                                                                                                                                 | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Cableado a `prebuild-security-complete.needs` desde Phase 0 (change `prebuild-security-aggregator-strict`); blocking desde día uno (sin job-COE); complementaria a Trivy/dependency-review/lockfile-audit (GuardDog = malicious-package metadata+YARA, no CVE ni licencias); Windows: solo Docker (L1 degrada silencioso)                                                                                                                                                                                       |
| **blocking (PR, fase 2)**                | `sast`                                | SAST diff-scoped (Semgrep) sobre el diff del PR: un hallazgo ERROR nuevo **deja el job y el agregador de governance en rojo** desde FASE 2 (enforcement duro del merge exige bindear el agregador al ruleset 21227644 — fuera de alcance; ver §7.2)                                                                                                                                   | Activo en `ci.yml` (change `sast-shift-left-hooks-parity`; FASE 1 desde 2026-10-19, **graduado a FASE 2 el 2026-10-20**, §7.2): el job **delega en `scripts/sast-diff.mjs`** con `SAST_MODE=ci` (mismo script, versión pineada, packs y exclusiones que el hook `pre-push` — paridad por construcción, sin `docker run` inline), **sin `continue-on-error`**, artifact `sast-report` (`.tmp/sast-report.json` con findings/modo/baseline, `retention-days: 14` + `if: always()` + `if-no-files-found: warn`)                                                                                                                                                                                                                                  | **Sí**                                                                                                                                                                                                                 | Sí                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Está en `prebuild-governance-complete.needs` (de 4 a 5 entradas) desde la graduación a FASE 2 (2026-10-20, §7.2) y NO en `ci-complete.needs`; el ruleset 21227644 y `ci-complete.needs` NO se tocan — `CI Complete` solo fallaría de forma transitiva, por diseño; gate local equivalente: etapa SAST del hook `pre-push` (fail-open ante herramienta rota)                                                                                                                                                     |
| **blocking (PR, fase 2)**                | `coverage` (client/server)            | Fallo si cobertura < umbral (tripwire `check-coverage.mjs`)                                                                                                                                                                                                                                                                                                                           | **FASE 2 ACTIVA** (change `ci-testing-gate-promotion`, 2026-10-29): sin `continue-on-error`; guard strict verde sobre coverage fresca en ambos workspaces y `check-coverage.mjs` como único enforcer per-file (todos los globs matchean archivos instrumentados). **Gate post-merge** (change `coverage-merge-gate`, 2026-10-13): descarga por patrón `coverage-<ws>-shard-*` + `merge-multiple`, validación de blobs y summary, `vitest --merge-reports --coverage` y **entonces** `check-coverage.mjs`                                                                                                                                                                                                                                      | No                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `client-coverage` / `server-coverage` siguen entre los 5 `needs` de `prebuild-tests-complete`, con ids y `name:` sin cambios (Regla 8); un rojo tiñe el agregador y `ci-complete`. Rollback: reponer el flag por job con causa registrada (design D9)                                                                                                                                                                                                                                                           |

> **Agregador estricto del substage 2C — Phase 0 (change `prebuild-security-aggregator-strict`, 2026-11-10):**
> `prebuild-security-complete` depende de **9 de los 10** jobs de security (todos menos `dependency-review`, advisory) y falla ante `failure`, `cancelled` o `skipped`
> no autorizado (`if: always()` + jq sobre `toJSON(needs)` pasado por `env`, nunca interpolado en el script). El skip
> se autoriza por tipo de evento (`merge_group`/`workflow_dispatch`: los 8 jobs PR-only no tienen diff que escanear) y,
> en `pull_request`, solo para los siete jobs condicionales cuando el path que los dispara NO está en el diff (detección
> `git diff` dentro del step del agregador, sin job extra en `needs` para preservar el contrato "exactly 9"). `secrets` y
> `security-exceptions-check` deben correr siempre en un PR, y `secrets` (que sí corre en `merge_group`) tampoco puede saltarse
> allí. Ninguno de los 9 jobs cableados conserva job-COE; solo `dependency-review` (advisory, fuera de `needs`) mantiene `continue-on-error: true`, así que su `failure` normaliza a `success` en `needs.*.result` (actions/toolkit#581).

Referencia oficial `github/workflows/ci.yml`: jobs `client-*`, `server-*`, `e2e-*`; agregadores `prebuild-quality-complete` (lineas 716, 733, 1099-1105); `ci-complete` (required check único, línea ~1091+); `needs: repo-discovery`; `if: ${{ ... }}` con `always()` para agregador; `continue-on-error: true` para jobs advisory (`dead-code`, potencial `docs-validation` fase 1).

## 3. Semántica oficial de `needs.*.result`, `always()`, `!cancelled()`, `continue-on-error`

Según `docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions` y `docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`:

- `needs.<job_id>.result` ∈ `{success, failure, cancelled, skipped}`.
- `always()` = ejecutar siempre (incluso si `failure` o `cancelled`). Recomendado para agregadores (`quality-gate`, `prebuild-quality-complete`, `ci-complete`) porque deben evaluarse independientemente del estado de los jobs subyacentes.
- `!cancelled()` = ejecutar siempre EXCEPTO si el job fue cancelado (por cancelación manual o timeout). Usado para steps dentro de un job (ej. `upload-artifact` en reporte) pero NO para agregadores de `needs`, porque `cancelled` debe ser tratado como `failure` en gates.
- `continue-on-error: true` (a nivel JOB): si el job falla (`failure`), `needs.<job>.result` = `success` (!!!) según `actions/toolkit#581` (bug documentado, comportamiento oficial). Esto explica por qué `dead-code` con `continue-on-error: true` NO bloquea `prebuild-quality-complete`: el agregador ve `success` aunque `knip` falló.
- Solución para advisory (`dead-code`, `docs-validation` fase 1): (a) mantener `continue-on-error: true` a nivel JOB para no romper CI; (b) agregar un paso `step` dentro del agregador que evalúe `needs.<dead-code>.result == 'failure'` y escriba una advertencia/SARIF; (c) si se quiere bloqueo, quitar `continue-on-error: true` y establecer `severity: error`. Esto es consistente con el diseño recomendado en este documento.
- `if: always()` en agregador + `contains(needs.*.result, 'failure')` = bloquea si cualquier `needs` falló; `contains(needs.*.result, 'cancelled')` debe incluirse para no pasar merges con CI interrumpido.

Referencia oficial: `docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions` y `docs.github.com/en/enterprise-server@3.22/pull-requests/how-to-merge-close-pr/troubleshooting-required-status-checkes`.

## 4. Evaluación de los gates actuales (estado del repo)

### 4.1 Activos (`lint`, `format-check`, `build` — bloquean PR)

- `client-lint`: `npm run lint` sobre `apps/client`; `eslint.config.js`; `max-warnings: 0`; bloquea si errores.
- `client-format-check`: `npm run format:check`; bloquea si `prettier --check` falla.
- `client-build`: `npm run build --workspace=apps/client` (Vite); path-scoped (`repo-discovery.client || shared`) + verdict de los 4 prebuild; alimenta `build-complete` estricto. Bloquea si el bundle falla. Ver §9 (G1).
- `server-lint`: `npm run lint`; `eslint.config.js`; bloquea.
- `server-build`: `npx tsc -p apps/server/tsconfig.build.json` (emisión JS real — change `ci-build-gates`, el no-op D8 quedó obsoleto tras la migración TS); path-scoped (`server || shared`) + verdict de los 4 prebuild; alimenta `build-complete`. Bloquea si la compilación falla. Ver §9 (G1).
- `e2e`: bloquea (si `repo-discovery` activa).
- `actionlint`: bloquea por `actionlint.yaml`.
- `client-dead-code`: `continue-on-error: true`; resultado `success` para agregador aunque falle; **advisory**.

### 4.2 Inactivos (`if: false`) — requieren activación

- `client-typecheck`: `if: false` + `|| echo no-op`. No bloquea. **Corrijo**: debe ser `npm run type-check` real, quitar `if: false`, quitar `|| echo`, y agregar `ts` a `lint-staged`.
- `server-typecheck`: `if: false` + `|| echo no-op`. Igual.
- `client-complexity`: `if: false`. Redundante con `lint` (misma regla `complexity` en `eslint.config.js`). Recomendación: eliminar job (evitar duplicación) o hacer `if: false` permanente y documentar `lint` como único gate de complejidad.
- `server-complexity`: `if: false`. Igual.
- `client-dead-code`: activo (`if` no false, `continue-on-error: true`). OK.
- `server-dead-code`: activo (`if` no false, `continue-on-error: true`). OK.
- `client-import-bounds`: activo (`if` no false, `continue-on-error` no definido, asume `false` = bloquea si `error`). OK (regla `no-cross-workspace-imports` activa).
- `server-import-bounds`: `if: false`. **Activar** (cambio `import-boundaries` recomienda quitar `if: false` tras baseline).
- `server-format-check`: **ACTIVADO** el 2026-11-12 (change `ci-format-check-blocking`): la deuda era de artefactos generados, no de código trackeado; `.prettierignore` por workspace lo resuelve. `e2e-format-check` añadido como job espejo.
- `docs-validation`: NO existe. **Crear** via `docs-changelog-validation` change (tareas 7.1/7.2/8.1).
- `client-sonarqube` / `server-sonarqube`: `if: false`. Falta `SonarSource/sonar-quality-gate-check` action. Recomendación: agregar `continue-on-error: true` + step de Quality Gate o eliminar si no hay licencia/plan.
- `client-coverage` / `server-coverage`: **FASE 2 ACTIVA, blocking** (change `ci-testing-gate-promotion`, 2026-10-29): `needs` = exactamente su test job (`[test-unit-client]` / `[test-unit-server]`); coverage strict fresca verde en ambos workspaces y sin job-level `continue-on-error` (prerrequisito `test-integration`/`test-smoke` verde cerrado en CI). Los dos jobs están entre los 5 `needs` de `prebuild-tests-complete`.
- `client-coverage` / `server-coverage` son desde 2026-10-13 el **puente del Coverage Merge Gate** (change `coverage-merge-gate`); con la promoción a FASE 2 sus fallos bloquean el agregador visible.
  - `if: ${{ !cancelled() && needs.test-unit-<ws>.result != 'skipped' }}`: la propagación de skip del upstream se mantiene (el `if:` explícito con `needs.repo-discovery.outputs` sin declarar el need NO es viable — GHA solo expone el contexto `needs` de jobs declarados; actionlint lo rechaza —, así que se resuelve vía `result`), y además corre cuando una shard falla, pero **no** tras una cancelación explícita del usuario.
  - Orden canónico: descarga por patrón `coverage-<ws>-shard-*` + `merge-multiple: true` → validación de presencia (`.vitest-reports/` no vacío = entrada del merge; `coverage-summary.json` = entrada del gate, con mensajes `::error::` distintos) → `vitest --merge-reports --coverage` (`working-directory: apps/<ws>`, sin `--reporter=blob`) → `check-coverage.mjs` → `Propagate shard failure`.
  - D18 intacto: `full` ⇒ bloqueante, `changed` ⇒ `--advisory` + `exit 0`.
- `test-unit-client` / `test-unit-server`: **FASE 2 ACTIVA, blocking** (change `ci-testing-gate-promotion`, 2026-10-29): scoping `repo-discovery` (`<ws> == 'true' || shared == 'true'`), JUnit para `dorny/test-reporter`, sin job-level `continue-on-error`. Los fallos llegan a `prebuild-tests-complete` y, transitivamente, a `ci-complete`.
- `property-tests`: **FASE 2 ACTIVA, blocking** (mismo change, misma fecha): PBT de ambos workspaces en un job propio, sin job-level `continue-on-error`; 5.º `needs` de `prebuild-tests-complete`.
- `test-integration` / `test-smoke`: **Activo** (`if:` sobre repo-discovery) pero **NO advisory** — ejecutan su lógica condicional en PRs path-scoped, pero **sin** `continue-on-error: true`. Su fallo propaga a `postbuild-tests-complete` de forma real (no soft-fail). FASE 2: mantener `if:` y evaluar promoción a bloqueante si se justifica el costo.

### 4.3 Diseño profesional recomendado (porque el snippet del usuario sugiere un diseño)

Según los hallazgos de `@researcher` (`dependency-cruiser` config, `prettier` config, `knip` config, `eslint` config, `typescript-strict-check` doc) y el esquema de `docs/CONTEXT-CICD.md` (§3.3, §13.4) y `docs/ci-cd/pre-merge-gates-governance.md` (sección de ruleset):

```yaml
# Calidad gates (substage 2B, dentro de ci.yml)
# Todo bloqueado por `repo-discovery` + `pull_request`
# Agregador `prebuild-quality-complete` con `if: always()` + `needs` correctos
quality-gates:
  needs: [
      repo-discovery,
      lint,
      format-check,
      compile-check,
      dead-code-detection,
      import-boundaries,
      docs-validation,
    ] # NO sonar/coverage hasta fase 2
  if: always()
  continue-on-error: false # NULL — si falla un gate, bloquea (no `continue-on-error` en agregador, solo en jobs advisory)
  steps:
    - name: Quality Gate Aggregate
      run: |
        # Usa `contains(needs.*.result, 'failure')` o `contains(needs.*.result, 'cancelled')` para bloquear
        # NO incluir `docs-validation` como bloqueante aún (fase 1 advisory)
        # No usar `|| echo`; usar `exit 1` con mensaje claro
        if [[ "${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
          echo "Quality gate blocked: one or more required checks failed or were cancelled"
          exit 1
        fi
```

Nota: el snippet del usuario incluía `|| echo` con `docs-validation` excluido del `needs`; la versión correcta para bloqueante es `contains(needs.*.result, 'failure')` (y opcionalmente `cancelled`) sin `|| echo`. Si `docs-validation` debe ser informativo, NO va en `needs` del agregador bloqueante; va por separado con `upload-artifact`.

### 4.4 Tabla resumen (estado tras `quality-gates`, 2026-09-26)

| Gate                        | Estado actual                                                                                                                                                                                                                                                                     | Tipo                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `lint` (client/server)      | Activo                                                                                                                                                                                                                                                                            | blocking                                  |
| `format-check`              | Client, server y e2e activos (2026-11-12, change `ci-format-check-blocking`); `.prettierignore` por workspace excluye artefactos generados                                                                                                                                        | blocking                                  |
| `typecheck`                 | **Activado** (tsconfigs mínimos + script `type-check`, sin máscara de exit code)                                                                                                                                                                                                  | blocking                                  |
| `complexity`                | **Activado** sin `--rule` (client ya lo estaba); umbrales desde `eslint.config.js`                                                                                                                                                                                                | blocking                                  |
| `import-bounds`             | Activo en ambos workspaces (change `import-boundaries`) con baseline                                                                                                                                                                                                              | blocking                                  |
| `dead-code`                 | Activo con `continue-on-error: true`                                                                                                                                                                                                                                              | advisory                                  |
| `docs-validation`           | **Nuevo**: `continue-on-error: true` + reporte en step summary; fuera de `needs`                                                                                                                                                                                                  | advisory                                  |
| `secrets`                   | Activo en `ci.yml` 2C, wireado a `prebuild-security-complete` (change `secret-scanning`)                                                                                                                                                                                          | blocking                                  |
| `dependency-review`         | Activo en `ci.yml` 2C; **advisory** (job-COE, fuera de `prebuild-security-complete.needs`) con `deny-licenses` + `comment-summary-in-pr: on-failure` (change `dependency-review`, 2026-09-25)                                                                                     | advisory (PR)                             |
| `scancode-license-pr-diff`  | Activo en `ci.yml` 2C, **FASE 2 blocking ACTIVA (2026-11-10, change `scancode-license`)**: sin COE, fix instalación (`uv tool install scancode-toolkit==32.5.0` — la imagen Docker no existía), evaluate fail-closed, unknown = warning + SLA 30d, artifact 14d                   | **blocking (PR)** desde 2026-11-10 (§7.4) |
| `scancode-license-audit`    | Activo en `scheduled-security.yml` (cron semanal, change `license-compliance`; FIX 2026-11-10 docker→uv, sigue advisory), artifact 90d, audit mode                                                                                                                                | advisory (scheduled)                      |
| `lockfile-audit`            | Activo en `ci.yml` 2C, **blocking desde 2026-11-10** (sin job-COE ni step-COE), artifact 14d (npm JSON + SARIF OSV), guard de lockfile obligatorio + OSV blocking cuando cambia el lockfile (change `sca-lockfile-compliance`)                                                    | blocking (PR)                             |
| `lockfile-audit-weekly`     | Activo en `scheduled-security.yml`, audit mode, artifacts 90d (npm audit JSON + SBOM) (change `sca-lockfile-compliance`)                                                                                                                                                          | advisory (scheduled)                      |
| `checkov-iac`               | Activo en `ci.yml` 2C, **blocking desde 2026-11-10** (sin job-COE; `soft_fail: false`), política `.checkov.yml`, artifact 14d (change `sca-lockfile-compliance`)                                                                                                                  | blocking (PR)                             |
| `checkov-iac-weekly`        | Activo en `scheduled-security.yml`, audit mode, SARIF `category: checkov-iac` + artifact 90d (change `sca-lockfile-compliance`)                                                                                                                                                   | advisory (scheduled), sin ruta blocking   |
| `containerfile-lint`        | Activo en `ci.yml` 2C, **blocking desde 2026-11-10** (sin job-COE; `failure-threshold: warning`), política `.hadolint.yaml`, artifact 14d (change `containerfile-lint`)                                                                                                           | blocking (PR)                             |
| `containerfile-lint-weekly` | Activo en `scheduled-security.yml`, audit mode, SARIF `category: hadolint-weekly` + artifact 90d (change `containerfile-lint`)                                                                                                                                                    | advisory (scheduled), sin ruta blocking   |
| `actionlint-advisory`       | Activo en `ci.yml` bloque security 2C (reubicación 2026-09-30), FASE 2 blocking (sin job-COE; uploads step-COE), plantilla `.github/actionlint-sarif.tmpl`, artifact 14d (change `pipeline-config-scan`)                                                                          | blocking (PR)                             |
| `zizmor-advisory`           | Activo en `ci.yml` bloque security 2C (reubicación 2026-09-30), **blocking desde 2026-11-10 en TODAS las reglas** (sin job-COE; uploads step-COE), deuda remediada y `self-repository` ignorado por fichero en `.github/zizmor.yml`, artifact 14d (change `pipeline-config-scan`) | blocking (PR)                             |
| `zizmor-weekly`             | Activo en `scheduled-security.yml`, audit mode, SARIF `category: zizmor-weekly` + artifact 90d (change `pipeline-config-scan`)                                                                                                                                                    | advisory (scheduled), sin ruta blocking   |
| `typosquat-guarddog`        | Activo en `ci.yml` bloque security 2C (reubicación 2026-09-30), **blocking desde 2026-11-10** (sin job-COE; gate `jq` sobre el SARIF), wrapper `scripts/guarddog-verify.sh`, artifact 14d (change `typosquatting-detection`)                                                      | blocking (PR)                             |
| `security-exceptions-check` | Activo en `ci.yml` 2C (change `security-exceptions-policy`), blocking desde día uno (sin job-COE), cableado a `prebuild-security-complete.needs` (10 jobs); valida `security/exceptions.yml` (schema, ids únicos, 90 días, vencidas)                                              | blocking (PR) desde día uno               |
| `guarddog-weekly`           | Activo en `scheduled-security.yml`, audit mode, SARIF `category: guarddog-weekly` + artifact 90d (change `typosquatting-detection`)                                                                                                                                               | advisory (scheduled), sin ruta blocking   |
| `.github/dependabot.yml`    | Activo (ajustado por change `sca-lockfile-compliance`: grupo `security-patches` + cooldown)                                                                                                                                                                                       | prevención (no gate)                      |
| `gitleaks-full-scan`        | `scheduled-security.yml` activo, audit mode (change `secret-scanning`)                                                                                                                                                                                                            | advisory                                  |
| `sonarqube`                 | `if: false` — sin credenciales (`SONAR_TOKEN` no existe en el repo, verificado por API)                                                                                                                                                                                           | inactivo                                  |
| `coverage`                  | `if: false` (lo reclama `coverage-baselines`)                                                                                                                                                                                                                                     | inactivo                                  |

La tabla de la sección 2 es la única canónica; esta sección es un resumen operativo con fecha.

## 5. Doc creado (referencia para usuario/implementador)

- `docs/learning/quality-gates.md` (ES; referencias oficiales: `docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`, `docs.sonarsource.com/sonarqube-server/2026/`, `www.typescriptlang.org/docs/handbook/compiler-options.html#strict` / `tsconfig.json`/`noEmit`).

Referencia a documentación de este doc creado en el proyecto: creado en `docs/learning/quality-gates.md`.

## 6. Referencias oficiales (citas comprobables)

- `docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`: definición de `if`, `needs`, `always()`.
- `docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions`: `contains(needs.*.result, 'failure')`, `cancelled`.
- `docs.sonarsource.com/sonarqube-server/2026/`: Sonar Quality Gate Check (`SonarSource/sonar-quality-gate-check`).
- `www.typescriptlang.org/docs/handbook/compiler-options.html`: `strict`, `noEmit`, `noUncheckedIndexedAccess`.
- `dependency-cruiser.org`: reglas `import-boundaries` (propiedad de `dependency-cruiser`, no `eslint-plugin-import`).

## 7. Ventana de calibración (FASE 1 → FASE 2)

**Ventana ÚNICA**, abierta el **2026-10-03** por el change `ci-testing-gate-promotion` (su task
1.1; los bloqueantes 0.x/0bis.x se cerraron el mismo día): 2-4 semanas de runs reales sobre
`ci.yml` antes de tocar ningún `continue-on-error`. Los changes que aportan evidencia a la misma
ventana — p. ej. `tia-hardening` — **NO abren una segunda ventana**: editan esta misma sección en
lockstep. La tabla de evidencia de gates (duración/fallos por job) vive en
`openspec/changes/ci-testing-gate-promotion/tasks.md` (task 1.3).

### 7.1 Calibración TIA (shadow metric) — change `tia-hardening`

Rellenar en CADA corrida con la métrica del step summary **Resolve TIA shadow metric**
(`scripts/ci/tia-metric.mjs`, advisory por contrato):

| fecha / run | % suite seleccionado (N/T) | inyectados (M) | coverage map | fallbacks D7 | duración unit-client | duración unit-server | integration scoped vs full |
| ----------- | -------------------------- | -------------- | ------------ | ------------ | -------------------- | -------------------- | -------------------------- |
| 2026-10-15  | 21/114 (18%)               | 0              | hit          | 0s           | 1.999s               | -                    | scope=full (excl. average) |
| _pendiente_ |                            |                |              |              |                      |                      |                            |

Columnas: `% seleccionado` = N/T del step summary (solo `scope=changed`; `scope=full` se etiqueta
aparte para excluirlo de los promedios) · `inyectados` = M distinguido de diff=N (task 4.5) ·
`map=hit/miss` (task 7.3) · `fallbacks D7` = veces que `numTotalTests=0` forzó full-suite ·
`duración` por job (tasks 1.2/1.4) · `integration scoped vs full` = evidencia para decidir si
integration se queda scoped (task 6.3).

**Decisión provisional sobre integration (task 6.3, 2026-10-16):** integration se queda
**scoped** — step `Resolve TIA scope` + rama `test:integration:changed` en el job
`test-integration` (task 6.1). Criterios de reversión documentados: se vuelve a **full** si
cualquiera de estos se cumple durante la ventana de calibración:

1. La duración del job con `scope=changed` ≥ ~70% de la duración del job full (el scoping no
   ahorra tiempo real).
2. El guard D7 (0 tests seleccionados ⇒ full suite) se dispara en >50% de las corridas (el diff
   rara vez selecciona integración y el fallback full anula el ahorro).

La confirmación final (mantener scoped / revertir a full) se toma al cerrar la ventana (task
12.1 de `tia-hardening`), rellenando la columna `integration scoped vs full` con datos reales.

**Reparto de propiedad (design D8, task 3.2):** quitar `continue-on-error: true` de los 6 jobs es
responsabilidad de `ci-testing-gate-promotion` (su task 3.1); `tia-hardening` SOLO produce y
registra esta evidencia. Verificado al implementar (2026-10-06):
`grep -c continue-on-error .github/workflows/ci.yml` = **33, idéntico a `main`** — ningún safety
net fue editado. La promoción no puede ejecutarse hasta que esta sección tenga la ventana
completa rellena, y después de promover, el nocturno, el full-suite en rutas shared y el guard
D7 siguen intactos.

### 7.2 Calibración SAST (diff-scoped) — change `sast-shift-left-hooks-parity`

**Estado: GRADUADO a FASE 2 el 2026-10-20.** El job `sast` ya no lleva `continue-on-error: true` y
está en `prebuild-governance-complete.needs` (5ª entrada): un hallazgo ERROR nuevo **deja el job en rojo
y hace fallar el agregador de governance**.

**Alcance exacto del bloqueo (importante, no confundir):** el agregador `prebuild-governance-complete`
**no** es status check del ruleset 21227644 — solo lo son los 4 de `docs/CONTEXT-CICD.md` §3.2 — así que
un rojo de `sast` es **visible y hace fallar `CI Complete` de forma transitiva**, pero GitHub no impide el
merge por sí solo: el enforcement duro exige bindear el agregador (o el propio check) al ruleset, y eso
es un change de gobernanza fuera de alcance (spec `sast-governance-gate`, F2). La ventana se cerró con un
único hallazgo, triado como falso positivo y remediado en el propio archivo, así que el criterio 2 se
cumple sin excepciones ni exclusiones globales.

Criterio de graduación FASE 1 → FASE 2 del job `sast` (RF-CI-03), escrito **también como
comentario del propio job en `.github/workflows/ci.yml`** en lockstep con esta sección — misma
ventana ÚNICA (abierta 2026-10-03), sin abrir una segunda:

1. ≥2 semanas de corridas reales del job sobre PRs;
2. ningún hallazgo ERROR sin triar (todo hallazgo clasificado como true positive corregido, o
   false positive justificado y remediado — p. ej. con `nosemgrep:` o una exclusión versionada);
3. evidencia registrada en el artifact `sast-report` (retención 14 días).

Al cumplirse: quitar `continue-on-error: true` y añadir `sast` a
`prebuild-governance-complete.needs` (de 4 a 5 entradas). El ruleset 21227644 y
`ci-complete.needs` NO se tocan. Rollback: revertir esas dos líneas.

| fecha / run                                                       | hallazgos ERROR | FP triados | motivo de cada triaje                                                                                                                                                                                                                                                                                                                                                                                                                                                   | artifact `sast-report`                           |
| ----------------------------------------------------------------- | --------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 2026-10-20 · run `39508915508` (PR #141) + medición local pareada | 1               | 1          | `semgrep.rules.prototype-pollution` @ `apps/server/src/middleware/validatePathParam.ts:67`: el sink `Object.assign` recibe un objeto **literal** con clave fija `id` y valor `Number` ya validado (`isSafeInteger` && `> 0`); no hay claves controladas por el usuario → `__proto__`/`constructor` inalcanzables. Remediado con `nosemgrep: prototype-pollution` + justificación en el archivo (verificado: 0 findings con `--config .semgrep/rules` sobre ese archivo) | artifact 14 d (ID `12304089221`, corrida FASE 1) |

### 7.3 Calibración GuardDog (typosquatting) — change `typosquatting-detection`

**Estado: GRADUADO a FASE 2 el 2026-11-10.** El job `typosquat-guarddog` ya no lleva
`continue-on-error: true`: el bloqueo vive en el step `Enforce GuardDog findings`, que parsea el
SARIF con `jq` y falla con cualquier `result` (el scan lleva `|| true` porque `verify` requiere red
y puede morir a medias — su exit code no es señal). Está en `prebuild-security-complete.needs`
(9ª entrada, anclado por nombre de job). `guarddog-weekly` sigue `advisory (scheduled)` de forma
permanente — sin ruta blocking ni agregador.

**Periodo advisory (evidencia de la ventana):** FASE 1 activa desde 2026-09-28 (change archivado
`2026-11-08-typosquatting-detection`) hasta la promoción el 2026-11-10 — >4 semanas de runs reales,
por encima del mínimo de 2-4 semanas que exige la spec. Tasas de FP de referencia (investigación web
2026-11-10, §10.8.8 de este documento): **2.2% en npm**
(263/12.111 paquetes) y **6.7% en PyPI**; issue #898 (abierto, 2026-10) documenta bugs en la
heurística de typosquatting (confused forms matching anywhere in term).

| fecha / run                                                                                                          | hallazgos GuardDog | FP triados | motivo de cada triaje                                                                                                                                                                                                                                                                                                                                                               | artifact `guarddog-report-pr` |
| -------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 2026-09-29 · run CI del PR #133                                                                                      | 5                  | 5          | `ERROR: Package/Version X not on NPM` (`client-react`, `e2e`, `string-width-cjs`, `strip-ansi-cjs`, `wrap-ansi-cjs`). **No es FP de la heurística**: causa raíz en el manifest raíz de `main`, aplanado con ~700 entradas que incluían nombres internos de workspaces (paquetes `private` inexistentes en el registro) y aliases de `@isaacs/cliui`. Remediado en el propio PR #133 | 14 d (corrida FASE 1)         |
| 2026-11-09 · runs `42576367623` / `42576339550` / `42575160236` (PRs dependabot con `package-lock.json` → scan real) | 0                  | 0          | Todos los steps `success` (el scan no fue enmascarado por COE: el step de verify terminó limpio)                                                                                                                                                                                                                                                                                    | 14 d                          |
| 2026-11-10 · run `42781229033` (PR `test/secret-detection-probe`)                                                    | 0                  | 0          | Steps `success`; job verde en rama de pruebas                                                                                                                                                                                                                                                                                                                                       | 14 d                          |

**Alcance (2026-11-12):** el wrapper escanea solo los manifiestos de **producto** (raíz +
workspaces declarados en `package.json`): monta un espejo temporal con esos `package.json` y ejecuta
`npm verify` ahí, porque GuardDog no tiene flag de exclusión y recorría también `.opencode/**` y
`docs/opencode/**` (tooling de agentes). Sus paquetes (plugins/SDK) disparan heurísticas
`capability-*` (`network-outbound`, `process-spawn`, `filesystem-read`) que describen capacidades
del paquete, no typosquatting, y bloqueaban el gate sin hallazgo real de la capa. Las URIs del SARIF
siguen siendo repo-relativas (el espejo conserva la forma del árbol). Si un manifiesto de agente
pasa a ser dependencia de producto, basta con declararlo como workspace.

**Reglas bloqueantes (2026-11-12):** el wrapper ejecuta `verify` con `--rules` limitado a los
detectores de cadena de suministro npm (`typosquatting`, `threat-npm-dependency-confusion`,
`deceptive_author`, `unclaimed_maintainer_email_domain`, `potentially_compromised_email_domain`,
`direct_url_dependency`, `threat-npm-http-dependency`, `threat-npm-preinstall-script`,
`threat-setup-network-in-install`). Sin ese filtro, las 63 reglas incluyen heurísticas de código
fuente (`capability-*`, `threat-runtime-*`, `metadata_mismatch`, `provenance_regression`,
`risky_new_dependency`, `bundled_binary`) que disparan 144 hallazgos sobre paquetes legítimos
pinnados (`@reduxjs/toolkit`, `@tanstack/react-table`, tiptap, `bcrypt`…) y bloqueaban el gate sin
señal de typosquatting. Esas heurísticas quedan para análisis ad hoc con
`guarddog npm scan <paquete>` sobre un paquete concreto.

**Decisión (2026-11-10): promover GuardDog a blocking SIN evaluar Socket** — scenario de la spec
"GuardDog promovido sin Socket": la tasa de FP observada en el periodo advisory es aceptable (único
incidente con causa raíz en datos del manifest, no en la heurística de typosquatting; 0 hallazgos en
todos los runs posteriores a la remediación de PR #133). Socket (comercial, 70+ señales) solo se
re-evaluará si los FP bloqueantes se vuelven recurrentes en FASE 2.

**Exclusiones en `scripts/guarddog-verify.sh`: NINGUNA** (cero `--exclude-rules`). Si una regla
resulta recurrentemente ruidosa, se clasifica en el wrapper (qué regla, por qué, hasta cuándo) vía
PR auditable con review de CODEOWNERS — nunca flags dispersos en workflows.

**Rollback (scenario "Retroceso simple"):** un solo revert — re-añadir `continue-on-error: true` a
nivel job (o eliminar el step `Enforce GuardDog findings`) y retirar `typosquat-guarddog` de
`prebuild-security-complete.needs`. La regresión se anota en esta sección antes de re-promover.

### 7.4 Calibración ScanCode (license compliance) — change `scancode-license`

**Ventana ÚNICA de calibración (caso excepcional):** el change `license-compliance` (2026-09-25)
definió la capa L2b `scancode-license-pr-diff` como FASE 1 advisory con promoción tras 2-4 semanas
de runs limpios. La calibración resultó **inviable de facto**: el job usaba la imagen Docker
`aboutcode/scancode-toolkit:32.5.0`, que **NO existe en Docker Hub** (ScanCode no publica imagen
oficial; la doc recomienda construirla desde el Dockerfile del repo). El `docker pull` fallaba con
exit 125 en cada run, el `continue-on-error: true` del scan step enmascaraba el fallo y el evaluate
step imprimía "Report not produced… nothing to evaluate" con exit 0 → **el job fue un no-op verde
permanente desde su creación** (0 runs con evidencia real de escaneo). Verificado 2026-11-10 vía
API de Docker Hub (`object not found`) y logs de runs históricos (`gh run view --job <id> --log`).

**Fix (2026-11-10):** instalación pineada en ambos jobs (PR y semanal) con `setup-uv` SHA-pinned
(v6.7.0) + `uv tool install --python 3.12 "scancode-toolkit==32.5.0"` + version check en el step
(ruedas puras cp310–cp314 en PyPI, `requires_python >= 3.10`). El scan conserva `--json-pp` (nunca
`--csv`, deprecado scancode-toolkit#3043) y `--only-findings`. La primera ejecución construye el
índice de licencias (~1 min extra por run).

**Confirmación de la deny-list:** el modelo de distribución del ERP se confirmó como **SaaS (acceso
por red)** — la deny-list de 4 entradas (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `CC-BY-NC-4.0`) queda
CONFIRMADA sin cambios (AGPL es el riesgo máximo bajo SaaS por su §13; GPL-3.0 se mantiene como
negación conservadora ante un posible cambio de modelo). Justificación completa por licencia en
`license-policy.md` §1.1.

**Decisión del owner (2026-11-10): promover a blocking YA**, omitiendo la ventana advisory de 4
semanas (misma vía rápida que `pr-body-lint` en su día, design D8 de `pr-metadata-workflow`).
Racional: la ventana advisory no puede aportar evidencia si la herramienta nunca llegó a ejecutarse;
el evaluate step se validó por simulación local de 6 casos contra fixtures (report ausente → exit 1
fail-closed; limpio → 0; `AGPL-3.0-or-later` → 1; unknown sin excepción → warning + 0; unknown con
excepción vencida → escalado + 1; unknown con excepción vigente → 0). La observación post-promoción
sustituye a la calibración pre-promoción: los primeros PRs con diff ACMR son la evidencia real.

**Regla de `unknown` (permanente, no bloqueante por sí misma):** `LicenseRef-scancode-unknown*` =
`::warning::` + ticket obligatorio (plantilla `.github/ISSUE_TEMPLATE/unknown-license.yml`, label
`security`) con clock-start en la PRIMERA detección (run ID + fecha), SLA 30 días
(`security/SLA.md` §2). La extensión del plazo es SOLO vía entrada vigente en
`security/exceptions.yml` (`tool: scancode`, `scope: <path>`, `expires ≤ created + 90`); el
evaluate step escala a bloqueo (`exit 1`) cuando una excepción **vencida** sigue matcheando un
unknown presente. El job es stateless: la vigilancia de la edad de los tickets vive en
`SLA.md` §3 + el audit semanal (`scancode-license-audit`, que sigue advisory).

**Rollback (scenario "Retroceso simple"):** un solo revert — re-añadir `continue-on-error: true`
a nivel job y en el scan step, y restaurar el evaluate step advisory (exit 0 en deny-list). El job
NO se retira de `prebuild-security-complete.needs` (el agregador exige exactly 9 y tolera
`success` con COE, actions/toolkit#581). La regresión se anota en esta sección antes de re-promover.

## 8. Runbook de operación (change `ci-quality-gates-blocking-hardening`)

Acciones **inmediatas** (desbloquear) y de **fondo** (causa raíz) para cada
situación. Regla general: el gate no se apaga con un interruptor sin PR
revisado; primero se revierte, después se diagnostica. Registro de estado y
excepciones: `docs/learning/quality-policy.md` y `docs/learning/quality-exceptions.md`.

### 8.1 `main` en rojo

```bash
# 1) Ver el último run de main y el job rojo
gh run list --branch main --limit 5
gh run view <run-id> --log-failed
# 2) Revertir el commit culpable (PR de revert, firmado y con DCO)
git revert <sha> && git commit -S -s --amend --no-edit && git push
# 3) Confirmar el verde y abrir issue de causa raíz
gh run watch <run-id-revert>
```

Inmediato: revertir primero. De fondo: reproducir local con el script del gate
(`npm run lint`, `npm run depcruise:ci`, `npm run typecheck`, `npm run check:manifest`).
No se desactiva el job; si hace falta tiempo, se abre una excepción EX-3 con
caducidad.

### 8.2 Herramienta rota tras una actualización

```bash
# Reproducir con la versión fijada del lockfile
npm ci --ignore-scripts
npx eslint --version && npm run lint
# Si la versión nueva cambió el formato/salida, ver el job concreto
gh run view <run-id> --job <job-id> --log
```

Inmediato: revertir el PR de herramientas (nunca el código de producto). De
fondo: ejecutar la versión nueva en un job advisory paralelo, regenerar baseline
en el PR de herramientas y anotarlo en `quality-exceptions.md`.

### 8.3 Falso positivo bloqueante

```bash
# Ver la regla y el fichero exactos
npm run lint 2>&1 | head -40
npx eslint --print-config apps/client/src/<fichero>.jsx | head -40
# Acotar por config (files/ignores), no por --rule en CI
git diff eslint.config.js
```

Inmediato: desbloquear con la supresión **mínima y documentada**
(`// eslint-disable-next-line <regla> -- motivo`), en un PR separado (EX-2).
De fondo: ajustar la regla en `eslint.config.js` (bajo CODEOWNERS), añadir la
entrada EX-3 con caducidad y podar la supresión al corregir.

### 8.4 Vuelta a advisory (rollback de promoción)

1. Re-añadir `continue-on-error: true` **al job concreto** (no al agregador) y
   dejar constancia en el PR + `quality-policy.md` (estado y fecha).
2. Mantener el job en `prebuild-quality-complete.needs`: con COE su `failure`
   normaliza a `success` en `needs.*.result` (actions/toolkit#581).
3. Abrir issue con criterio de salida (2-4 semanas sin FP / deuda a cero) y
   fecha de re-promoción.

```bash
git revert <sha-de-promocion>
gh run watch <run-id>
```

### 8.5 Supresiones sin podar

```bash
# Una directiva que ya no suprime nada falla el lint (reportUnusedDisableDirectives: error)
npm run lint
# Localizar y borrar la directiva obsoleta
grep -rn "eslint-disable" apps/ e2e/ | head -50
```

De fondo: podar el baseline de dependency-cruiser
(`npx depcruise apps/client/src apps/server/src e2e/tests --config .dependency-cruiser.cjs --output-type err`) y
revisar `quality-exceptions.md` para eliminar entradas vencidas.

### 8.6 Caché sospechosa (resultados que no cuadran)

```bash
# Invalidar caché local de ESLint (content-hash: cambiar un fichero basta en CI)
rm -rf apps/client/.cache apps/server/.cache e2e/.cache
npm run lint
```

En CI: re-ejecutar el job con `gh run rerun <run-id> --failed`; si persiste,
borrar la entrada de caché desde la UI/API (`gh api -X DELETE
repos/{owner}/{repo}/actions/caches?key=eslint-...`) y volver a correr. La
caché es una optimización, nunca la fuente de verdad.

### 8.7 Check requerido en `Pending`

`Pending` significa que el workflow no se ejecutó (filtro de paths/rama) o que el
job quedó esperando `needs`. Un job **omitido por condición** reporta `Success`;
un workflow **omitido por filtro** queda `Pending` y bloquea el merge.

```bash
gh pr checks <pr>
gh run list --branch <rama> --limit 10
# Si es el agregador: comprobar el veredicto estricto
gh run view <run-id> --job <prebuild-quality-complete-job-id> --log
```

Inmediato: `gh run rerun <run-id> --failed`. De fondo: revisar el `if:` del
workflow/job (el agregador ya distingue skipped autorizado por `repo-discovery`).

### 8.8 Fallo de infraestructura (red, runner, service container)

```bash
gh run view <run-id> --log-failed | grep -Ei "timeout|ECONNRESET|rate limit|docker"
gh run rerun <run-id> --failed
```

Inmediato: re-ejecutar el job. De fondo: si es recurrente, subir `timeout-minutes`
o fijar la acción/imagen por SHA; un fallo de red del audit SCA es fail-closed a
propósito (se reintenta, no se enmascara).

### 8.9 Fallo determinista (el mismo error siempre)

```bash
# Reproducir exactamente lo que corre CI (desde la raíz)
npm ci --ignore-scripts
npx prisma generate --schema apps/server/prisma/schema.prisma
npm run typecheck && npm run deps:boundaries && npm run lint
npm run test:scripts
```

Inmediato: no re-ejecutar en bucle; leer el primer error del log. De fondo:
corregir la causa, añadir/ajustar el test que lo cubra y anotar la lección en
esta sección si el diagnóstico fue costoso.

## 9. Gates del stage BUILD (G1-G7) — change `ci-build-gates`

> Fuente: PRD §Gates (tabla G1-G7 + "Comportamiento ante fallo" + "Check
> obligatorio"). Implementación: `.github/workflows/ci.yml` (tier de compilación
>
> - agregador estricto `build-complete`) y `.github/workflows/build.yml` (tier de
>   imagen, change `ci-build-workflow`). Última revisión: 2026-11-13.

### 9.1 Topología: dos workflows, un solo required check de build

El stage BUILD se reparte en dos workflows porque GHA **no permite `needs` entre
workflows distintos** (desviación documentada en `ci-build-workflow` task 2.3):

- **`ci.yml` — tier de compilación (G1).** `client-build` (Vite bundle,
  [ci.yml:3009](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3009))
  y `server-build` (emisión `tsc`,
  [ci.yml:3040](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3040))
  alimentan el agregador estricto `build-complete`
  ([ci.yml:3787](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3787)),
  cuyo `name:` **congelado** `Build Complete` es el contexto que se bindeará al
  ruleset (§9.7). `build-complete` → `postbuild-tests-complete` → `ci-complete`.
- **`build.yml` — tier de imagen (G2-G7).** `build` → `image` → {`trivy`,
  `validate`}. Este workflow **todavía no es required check** del ruleset: sus
  gates son bloqueantes _dentro_ de su grafo de jobs (un `image` rojo falla el
  run), pero a nivel de merge son advisory hasta que `build.yml` se vincule como
  required check (paso posterior a este change, que solo bindea `Build Complete`).

Consecuencia práctica: hoy el único gate de build **bloqueante en el merge** es
G1 vía `Build Complete` (tras el binding de §9.7). G2-G7 se ejecutan y reportan,
pero su promoción a merge-blocking es un paso de gobernanza separado.

### 9.2 Tabla G1-G7 (criterio · señal · consecuencia · nivel inicial)

| Gate                          | Criterio                                                                  | Job / workflow                                                          | Señal (exit code / `needs.*.result`)                                                  | Consecuencia si falla                                       | Nivel inicial            |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------ |
| **G1** Compilación            | `tsc` del server emite JS sin error; Vite del client produce bundle       | `server-build` / `client-build` (ci.yml) + `build` (build.yml)          | exit 0 del compile → `result: success`; error → `failure`                             | `image` no corre (`needs: build`); `build-complete` rojo    | **blocking**             |
| **G2** Construcción de imagen | `docker build` de `apps/server/Dockerfile` termina sin error              | `image` (build.yml)                                                     | build-push exit 0 → `success`; fallo → `failure`                                      | sin imagen no hay `trivy` ni `validate` (`needs: image`)    | **blocking**             |
| **G3** Atestaciones           | SBOM + provenance (`mode=max`) generados; atestación por digest publicada | `image` (build.yml), steps `Build and push` + `Attest build provenance` | attest exit 0 (solo `push` a main) → `success`                                        | imagen sin cadena de suministro verificable; no se promueve | **blocking**             |
| **G4** Escaneo                | Trivy: CRITICAL+HIGH **con fix** → fail; resto inventario advisory        | `trivy` (build.yml)                                                     | step bloqueante `exit-code: 1` → `failure`; advisory `exit-code: 0` + COE             | CVE con fix bloquea (tras promoción); SARIF a Security tab  | **advisory 2-4 semanas** |
| **G5** Arranque               | `/health` responde 200\|503 en ≤60 s + smoke tests verdes                 | `validate` (build.yml)                                                  | health loop exit 0 + `npm run test:smoke` exit 0 → `success`                          | imagen que no arranca no se promueve                        | **advisory**             |
| **G6** Presupuesto de tiempo  | Duración del build/validate bajo un umbral **pendiente de medir** (§9.8)  | `build`/`image`/`validate` (build.yml)                                  | hoy solo techo duro `timeout-minutes` (15/30/20); sin gate de duración explícito      | Timeout → `failure`; umbral fino TBD                        | **advisory hasta medir** |
| **G7** Tamaño                 | Tamaño de la imagen bajo un umbral **pendiente de medir** (§9.8)          | `image` (build.yml)                                                     | sin step de medición aún; se medirá con `docker image inspect` / salida de build-push | imagen sobredimensionada se revisa; umbral TBD              | **advisory hasta medir** |

Notas:

- G3 se atesta **solo en `push` a main** (no en `merge_group`): la atestación
  vincula el commit que aterrizó en main, no el efímero de la cola (que puede ser
  eyectado). `subject-name` sin tag; `subject-digest` de la salida de build-push.
- G4 tiene dos pasadas: la bloqueante (`severity: CRITICAL,HIGH`,
  `ignore-unfixed: true`, `exit-code: 1`) y la advisory (todas las severidades,
  `exit-code: 0`, `continue-on-error: true`). El inventario completo nunca falla
  el job; solo la pasante bloqueante decide el verdict.
- En PRs (incluidos forks) la imagen se construye pero **no se publica, atesta ni
  escanea** (`push: github.event_name != 'pull_request'`); G2-G7 solo se ejercitan
  en `push` a main / `merge_group`.

### 9.3 Regla de skip autorizado (task 1.2)

`build-complete` usa `if: ${{ always() }}` y evalúa `toJSON(needs)` con `jq`
(patrón canónico de `prebuild-security-complete`; `needs` pasa por `env`, nunca se
interpola en el script — PRD regla #5). Un resultado `skipped` **solo se acepta**
si una salida de detección de cambios (`repo-discovery`) lo autoriza:

- `client-build` saltado ⇔ autorizado si `repo-discovery.outputs.client != 'true'`
  **y** `shared != 'true'` (el path que lo dispara no está en el diff).
- `server-build` saltado ⇔ autorizado si `server != 'true'` **y** `shared != 'true'`.
- **Fail-closed:** un output ausente/nulo cuenta como **en-ámbito** (`in_scope($v):
if $v == null then true else $v == "true" end`). En `merge_group` /
  `workflow_dispatch` `repo-discovery` resuelve todos los scopes a `true` (suite
  completa), así que ningún skip de build está autorizado allí.
- `failure` y `cancelled` **siempre** tiñen el agregador de rojo, sin excepción.
- Un skip **no autorizado** (p. ej. el path sí está en el diff pero el job saltó
  porque un prebuild falló) → rojo. El verde "succeeded or skipped" anterior era
  un verde vacío: un job saltado sin autorización pasaba en verde.

El programa jq se verificó localmente con jq 1.8.2 contra 11 escenarios de
veredicto (all-success, failure, cancelled, docs-only PR, client/server PR mixto,
prebuild-rojo con skip no autorizado, merge_group, outputs ausentes fail-closed,
repo-discovery failure, shared=true): 11/11 verdes/rojos esperados.

### 9.4 Semántica del check obligatorio: Pending vs job omitido por `if` (task 4.5)

Dos omisiones con consecuencias opuestas (PRD §Gates "Check obligatorio"; ver
también §8.7):

- **Workflow omitido por filtro de paths/rama** → el check queda en **Pending** y
  **bloquea** el merge (GitHub espera un reporte que nunca llega). Por eso
  `ci.yml` y `build.yml` declaran `merge_group` (task 2.1): sin ese trigger los
  checks obligatorios quedarían pending en la cola.
- **Job omitido por su `if:`** → se reporta como **Success** (un skip no es un
  fallo para GitHub). Por eso el agregador **no puede** confiar en el verde
  implícito: usa `if: always()` y evalúa cada `needs.*.result` explícitamente,
  distinguiendo el skip autorizado (§9.3) del que no lo está.

`if: always()` garantiza que `build-complete` corre **aunque sus needs fallen o se
salten**, y sea él quien emita el veredicto rojo/verde — nunca un verde vacío por
omisión.

### 9.5 Comportamiento ante fallo — 3 reglas (task 4.4, PRD §Gates)

1. **Orden de ejecución: `build` (G1) antes de `image` (G2-G5).** Si no compila,
   no se construye ni escanea la imagen (`image: needs: build`; `trivy`/`validate:
needs: image`). Un fallo de compilación corta la cadena aguas arriba.
2. **Sin reintentos automáticos que oculten fallos reales.** El pipeline no
   reintenta un job rojo para "ver si pasa". El reintento es **manual** y solo
   para infraestructura (`gh run rerun <run-id> --failed`, §8.8); un fallo
   determinista se corrige en la causa (§8.9), no se enmascara con re-ejecuciones.
3. **Publicar ≠ promover.** Una imagen puede existir en GHCR con atestaciones
   (G3) pero escaneo pendiente (G4) bajo un tag provisional (`type=sha`). La
   **promoción** a un tag de release exige G3 **+** G4 en verde (y, cuando se
   promuevan, G5/G7). Publicar no implica que la imagen sea apta para producción.

### 9.6 Proceso de excepciones (task 4.3)

Una vulnerabilidad aceptada (G4) o cualquier supresión de un gate de build entra
por el registro canónico, **nunca** como un `|| echo` o un `continue-on-error`
silencioso:

- **Registro de seguridad:** `security/exceptions.yml` (schema
  `id/tool/finding/scope/reason/owner/created/expires/ticket`). Para Trivy,
  `tool: trivy`; `expires <= created + 90 días`. Lo valida el job
  `security-exceptions-check` (`scripts/ci/security-exceptions.mjs`). Hoy
  `exceptions: []`.
- **Allowlist de CVEs de imagen:** `.trivyignore` (o `trivyignores` en el step)
  para CVEs concretos con justificación. **Cableado pendiente de la promoción de
  G4** a bloqueante: mientras G4 sea advisory, el inventario completo ya queda en
  el SARIF advisory y la excepción se documenta en el registro EX-3; al promover
  G4 se conecta `.trivyignore` al step bloqueante y se exige entrada EX-3 por cada
  CVE ignorado.
- **Registro EX-3:** [docs/learning/quality-exceptions.md](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/docs/learning/quality-exceptions.md)
  — una fila por excepción con **motivo, responsable y caducidad** (fecha real,
  ≤90 días para seguridad), issue vinculado y plan de salida. Una excepción por
  PR (EX-2). Al vencer: se poda la supresión o el gate falla. El owner poda su
  entrada al resolver la causa raíz; nunca se renueva por inercia.

### 9.7 Binding al ruleset y rollback (tasks 3.1/3.2/3.3/5.3)

**Contexto a bindear:** el `name:` del job, **`CI Complete`** (no el id
`ci-complete`). Los required checks se ligan por nombre de job; renombrarlo
rompe el binding. Ruleset **21227644** (`main`), `integration_id` **15368**
(GitHub Actions). Contextos actuales (verificado via API 2026-11-17):
`Governance: PR Body Lint`, `CI Complete`.

**Diseno (actualizado 2026-11-17):** el ruleset requiere UNICAMENTE `CI Complete`
(agregador raiz) en lugar de multiples sub-agregadores individuales. `CI Complete`
depende transitivamente de TODOS los sub-agregadores (`Prebuild Governance Complete`,
`Prebuild Quality Complete`, `Prebuild Security Complete`, `Prebuild Tests Complete`,
`Build Complete`, `Postbuild Tests Complete`, `Postbuild Analysis Complete`,
`zombie-workflow-guard`, `repo-discovery`). Si cualquiera falla, `CI Complete` falla
-> merge bloqueado. Los sub-agregadores individuales NO estan vinculados al ruleset.

`Governance: PR Body Lint` (emitido por `pr-metadata.yml`) se mantiene como required
check independiente (no esta en `ci.yml`, por lo que no puede agregarse a `CI Complete`).

> **NOTA:** El change `ci-build-gates` fue archivado con las tasks de binding marcadas
> como canceladas por cambio de diseno (se usa `CI Complete` en lugar de `Build Complete`).

### 9.8 Umbrales G6/G7 pendientes de medición (task 4.2 — BLOQUEADO)

Los umbrales de **duración (G6)** y **tamaño de imagen (G7)** no se fijan a ojo:
se definen **tras medir** en el primer build real con Docker daemon.

- ⏳ **BLOQUEADO:** el daemon Docker no está disponible en este entorno y no hay
  aún un run real de `build.yml`. Sin medición, cualquier umbral sería arbitrario.
- **Dónde se medirá:** G7 con `docker image inspect <digest> --format '{{.Size}}'`
  (o la salida de build-push) en el job `image`; G6 con la duración de los jobs
  `build`/`validate` (techo duro actual: `timeout-minutes` 15/30/20). Tras reunir
  una línea base (p. ej. mediana de N builds), se fija el umbral y se documenta
  aquí, promoviendo G6/G7 de advisory a blocking si se justifica.

---

## 10. Security stage — análisis, gaps y plan de adopción

> Análisis fusionado desde el antiguo `docs/research/prebuild-security-stage-analysis.md`. **Sincronizado el 2026-11-23** contra `.github/workflows/ci.yml`, `security.yml` y `scheduled-security.yml`: inventario, agregador, gaps y estado de adopción reflejan el repo actual. La investigación de §10.4, §10.5 y §10.8 se conserva tal como se verificó el 2026-11-10.

**Analysis date:** 2026-11-10 · **Last sync:** 2026-11-23
**Repository:** project-one (monorepo: Node/Express backend + React client + Playwright E2E)
**Scope:** Prebuild substage 2C (ci.yml) + `security.yml` + `scheduled-security.yml` + aggregator `prebuild-security-complete`
**Reference:** `PRDS/Análisis-del-stage-SECURITY-estrategias-y-gates.md` (target = maturity level 3 enterprise)

### 10.1 Executive summary

- The prebuild security substage (2C) contains **10 jobs in `ci.yml`**: nine are wired into `prebuild-security-complete.needs`; the tenth, `dependency-review`, is deliberately **advisory** (job-level `continue-on-error: true`, excluded from the aggregator) so license/vulnerability findings do not tint the gate.
- The nine wired jobs have **no job-level `continue-on-error`**: `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog` and `security-exceptions-check`. “Blocking” here means the aggregator fails on `failure`, `cancelled` or unauthorized `skipped`; required-check status still depends on the ruleset (§10.3).
- The aggregator `prebuild-security-complete` (`ci.yml:3710`) `needs` those nine jobs. Anti-skip is **fail-closed**: on `pull_request` a skip is authorized only for path-scoped jobs whose triggering diff is absent; `secrets` and `security-exceptions-check` are never skippable, and `merge_group`/`workflow_dispatch` skips are pre-authorized by event (except `secrets` on `merge_group`).
- `security.yml` runs six jobs (`dependency-scan`, `trufflehog`, `sast` = CodeQL, `semgrep-full-scan`, `sbom`, `notify-failure`) on PR/push to `main`, `merge_group`, weekly schedule and `workflow_dispatch`. Scans stay in audit mode with step-level COE, except TruffleHog credential verification (`--fail`). The blocking SAST is the diff-scoped `sast` job in 2A governance, not this workflow.
- `scheduled-security.yml` runs eight jobs (`gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly`, `containerfile-lint-weekly`, `zizmor-weekly`, `guarddog-weekly`, `notify-failure`), all advisory by design.
- Gap vs the PRD's level-3 target is now narrow: exceptions policy, SLA, runbooks and monthly metrics exist. Remaining gaps are ruleset binding of `Prebuild Security Complete`, push protection (GHAS/plan), the license distribution model, retention/redaction policy and deferred post-build image scanning.
- Internet research (§10.4–§10.8) still holds; recommendations that were pending on 2026-11-10 are marked as implemented in §10.6.

### 10.2 Inventory — prebuild security stage jobs

#### 10.2.1 ci.yml — SUBSTAGE 2C (PR-time)

All 2C jobs run on `pull_request`; `secrets` also runs on `merge_group`. “Blocking?” here means wired to `prebuild-security-complete`; it does not assert required-check status.

| #   | Job id                      | Name                                        | Trigger         | Blocking?         | continue-on-error      | needs          | Tool / version                                     | Notes                                                                                                                                                                     |
| --- | --------------------------- | ------------------------------------------- | --------------- | ----------------- | ---------------------- | -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `dependency-review`         | Prebuild Security: Dependency Review        | PR              | **No** (advisory) | `true` (job)           | —              | `actions/dependency-review-action` v5 (SHA)        | `fail-on-severity: moderate`; excluded from the aggregator by design; reports as its own check + PR comment                                                               |
| 2   | `secrets`                   | Prebuild Security: Secret Detection         | PR, merge_group | **Yes**           | No (licensed step COE) | —              | gitleaks `v8.30.1` + `gitleaks/gitleaks-action` v3 | Scans the PR diff; anti-skip never authorized on PR/merge_group                                                                                                           |
| 3   | `scancode-license-pr-diff`  | Prebuild Security: ScanCode License PR-Diff | PR              | **Yes** (FASE 2)  | No (job or step)       | —              | ScanCode `32.5.0` via `uv tool install`            | ACMR diff; deny-list from `.github/license-policy.yml`; skip authorized only when no ACMR/license-relevant diff                                                           |
| 4   | `lockfile-audit`            | Prebuild Security: Lockfile Audit           | PR              | **Yes** (FASE 2)  | No (job or step)       | repo-discovery | `scripts/audit-gate.mjs` + OSV-Scanner `v2.5.0`    | No `npm ci`; audit gate: critical always, high only with fix, moderate/low advisory; OSV blocking when lockfile changed; skip authorized without lockfile/manifest change |
| 5   | `checkov-iac`               | Prebuild Security: Checkov IaC              | PR              | **Yes** (FASE 2)  | No (job or step)       | repo-discovery | `bridgecrewio/checkov-action` v12 (SHA)            | `soft_fail: false`; frameworks dockerfile/terraform/kubernetes; skip authorized when no Dockerfile/IaC                                                                    |
| 6   | `containerfile-lint`        | Prebuild Security: Containerfile Lint       | PR              | **Yes** (FASE 2)  | No (job or step)       | repo-discovery | `hadolint/hadolint-action` v3.1.0 (SHA)            | `failure-threshold: warning`; skip authorized when no Containerfile changes                                                                                               |
| 7   | `actionlint-advisory`       | Prebuild Security: ActionLint (SARIF)       | PR              | **Yes** (FASE 2)  | No (upload steps only) | repo-discovery | `rhysd/actionlint:1.7.12` (docker)                 | SARIF `jq` gate on all results; skip authorized when no workflow changes                                                                                                  |
| 8   | `zizmor-advisory`           | Prebuild Security: Zizmor (unpinned-uses)   | PR              | **Yes** (FASE 2)  | No (upload steps only) | repo-discovery | `uvx zizmor@1.30.1`                                | SARIF `jq` gate on **all** rules; skip authorized when no workflow changes                                                                                                |
| 9   | `typosquat-guarddog`        | Prebuild Security: Typosquat GuardDog       | PR (manifests)  | **Yes** (FASE 2)  | No (upload steps only) | repo-discovery | GuardDog `3.2.0` via `scripts/guarddog-verify.sh`  | Manifest-scoped (`repo-discovery.outputs.manifests`); SARIF `jq` gate; devDeps excluded                                                                                   |
| 10  | `security-exceptions-check` | Prebuild Security: Exceptions Policy        | PR              | **Yes**           | No                     | repo-discovery | `scripts/ci/security-exceptions.mjs`               | Validates owner + `expires` in `security/exceptions.yml`; never skip-authorized                                                                                           |

Job ids `actionlint-advisory` and `zizmor-advisory` keep their historical names although both gates are blocking. Renaming them changes check contexts and is tracked as cosmetic debt in §10.7.

#### 10.2.2 security.yml (PR, push, merge_group, weekly)

`security.yml` is a separate workflow (never part of `prebuild-security-complete`). It runs on `pull_request`/`push` to `main`, `merge_group`, weekly `schedule` (Monday 03:00 UTC) and `workflow_dispatch`.

| Job                 | Name                                    | Blocking?                                                               | Tool                                        | Notes                                                           |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| `dependency-scan`   | Dependency Scan (SCA)                   | Advisory (Trivy step COE)                                               | Trivy filesystem scan                       | Step COE; publishes `scan-sarif-outcome`                        |
| `trufflehog`        | Secret Verification (TruffleHog)        | Fails this workflow on verified secrets; not wired to the ci aggregator | `ghcr.io/trufflesecurity/trufflehog:3.99.4` | Full history (`fetch-depth: 0`), `--results=verified`, `--fail` |
| `sast`              | SAST — CodeQL                           | Advisory (analyze step COE)                                             | `github/codeql-action` v4                   | CodeQL, not Semgrep; the blocking diff SAST is `sast` in 2A     |
| `semgrep-full-scan` | SAST — Semgrep Full Scan (Weekly Audit) | Advisory (scan steps COE)                                               | `semgrep/semgrep:1.176.1`                   | Full repo; JSON + SARIF artifacts                               |
| `sbom`              | Generate SBOM                           | —                                                                       | `anchore/sbom-action` v0.24.0               | CycloneDX JSON; `dependency-snapshot: true`; retention 365d     |
| `notify-failure`    | Notify on Failure                       | —                                                                       | `actions/github-script`                     | Dedupes the `[weekly-security-scan]` issue                      |

#### 10.2.3 scheduled-security.yml (weekly cron)

All scheduled jobs are **advisory** (audit mode); `notify-failure` opens or updates one deduplicated issue.

| Job                         | Name                        | Blocking?           | Tool                                    | Notes                   |
| --------------------------- | --------------------------- | ------------------- | --------------------------------------- | ----------------------- |
| `gitleaks-full-scan`        | Gitleaks Full Scan          | Advisory (step COE) | gitleaks `v8.30.1`                      | Full history            |
| `scancode-license-audit`    | ScanCode License Audit      | Advisory (step COE) | ScanCode `32.5.0` via `uv tool install` | Full repo; artifact 90d |
| `lockfile-audit-weekly`     | Lockfile Audit Weekly       | Advisory (step COE) | `npm audit` + `npm sbom`                | Weekly SCA + SBOM       |
| `checkov-iac-weekly`        | Checkov IaC Weekly          | Advisory (step COE) | Checkov `3`                             | Dockerfile/IaC          |
| `containerfile-lint-weekly` | Containerfile Lint Weekly   | Advisory (job COE)  | `hadolint/hadolint:v2.15.1`             | Containerfile hygiene   |
| `zizmor-weekly`             | Pipeline Config Scan Weekly | Advisory (job COE)  | `uvx zizmor@1.30.1`                     | Workflow audits         |
| `guarddog-weekly`           | Typosquat GuardDog Weekly   | Advisory (job COE)  | GuardDog `3.2.0`                        | Manifest typosquatting  |
| `notify-failure`            | Notify on Failure           | —                   | `actions/github-script`                 | Issue dedup             |

#### 10.2.4 Aggregator

`prebuild-security-complete` (`ci.yml:3710`): `if: vars.CI_MINIMAL != 'true' && always()`.

- **`needs` (9):** `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`, `security-exceptions-check`.
- **Excluded by design:** `dependency-review` (job-level COE; advisory so a license/vulnerability finding does not fail the gate).
- **Anti-skip (fail-closed):** on `pull_request`, only path-scoped jobs may skip, and only when their triggering diff is absent (ACMR, lockfile/manifest, Dockerfile/IaC, Containerfile, workflows, manifests). `secrets` and `security-exceptions-check` are never skippable. On `merge_group`/`workflow_dispatch`, skips are pre-authorized by event (except `secrets` on `merge_group`). Any `failure`, `cancelled` or unauthorized `skipped` fails the aggregator.

### 10.3 Gap analysis vs PRD target (level 3 enterprise)

| PRD "Definition of Done" item                                                                 | Status                         | Gap / evidence                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `security-complete` exists & fails on non-success                                             | **Implemented**                | 10 jobs in 2C; 9 wired to `needs`; fail-closed anti-skip by event/path. `dependency-review` is excluded on purpose (advisory).                                                                      |
| Ruleset requires `ci-complete` + `security-complete` only by name                             | Unknown / needs verification   | Ruleset 21227644 binds `Governance: PR Body Lint` + `Prebuild Governance Complete`; `Prebuild Security Complete` is **not verified** as a required check.                                           |
| Secrets: pre-commit + push protection + PR + scheduled history, all blocking                  | Partial                        | PR (Gitleaks) blocking; pre-commit gate in `.husky/pre-commit`; scheduled history advisory; TruffleHog verification in `security.yml` (not wired to the ci aggregator); push protection unverified. |
| SAST: fail-on-new blocking w/ baseline + weekly full                                          | Partial                        | Diff-scoped `sast` blocking in 2A governance; CodeQL (`sast` in `security.yml`) and Semgrep full scan remain advisory.                                                                              |
| SCA: lockfile mandatory, reproducible install, PR verification blocking, scheduled monitoring | **Implemented (PR)**           | `lockfile-audit` blocking since 2026-11-10; OSV-Scanner `v2.5.0` blocking when the lockfile changes; `lockfile-audit-weekly` remains advisory.                                                      |
| Dependabot w/ grouping, cooldown, 3 ecosystems                                                | **Implemented**                | `.github/dependabot.yml`: npm + github-actions + docker, weekly, 7-day cooldown, grouped updates.                                                                                                   |
| Licenses: deny-list by distribution model + unknown rule                                      | **Implemented (PR) / Partial** | Deny-list checked by `dependency-review` (advisory) and enforced by ScanCode; `unknown` = warning + 30-day ticket (SLA §2); distribution model (SaaS vs on-prem) still pending.                     |
| zizmor + actionlint blocking; third-party actions SHA-pinned                                  | **Implemented**                | Both blocking since 2026-11-10 via SARIF `jq` gates; all actions used by 2C are SHA-pinned.                                                                                                         |
| `security/exceptions.yml` w/ owner+expiry + job that fails on expiry                          | **Implemented**                | `security/exceptions.yml` + blocking `security-exceptions-check` (`scripts/ci/security-exceptions.mjs`).                                                                                            |
| SLA defined & measured                                                                        | **Implemented**                | `security/SLA.md`: 7/30/90/best-effort; 24–72 h for active exploitation; monthly metrics.                                                                                                           |
| Reports w/ retention by type + redacted secrets                                               | Partial                        | Retention 14/30/90/365 days by artifact; redaction only via gitleaks `--redact`.                                                                                                                    |
| Runbooks written & tested                                                                     | **Implemented**                | `docs/runbooks/security/cve-triage.md` and `exception-expiry.md`.                                                                                                                                   |
| Framework mapping reviewed                                                                    | **Implemented**                | Mapping documented in this section.                                                                                                                                                                 |
| Monthly metrics review recorded                                                               | **Implemented**                | `.github/workflows/security-metrics.yml` (monthly cron + issue) and `security-digest.yml` (weekly).                                                                                                 |

**Still open:** ruleset binding of `Prebuild Security Complete`, push protection (GHAS/plan), license distribution model, retention/redaction policy, post-build image scanning (out of scope).

### 10.4 Internet-researched validation (verified via live web search 2026-11-10)

The following claims from the reference doc and the inventory were verified against primary sources:

- **Gitleaks v8.30.1** (docker image) — stable, widely used; `--redact` supported. Licensed action v3 requires license token. ✅ implementable.
- **Dependency Review Action v5** — supports `config-file` (YAML) and `comment-summary-in-pr`. Verified against GitHub docs: `config-file` accepts local/external paths. ✅ implementable; note `deny-licenses` deprecated in favor of config file (already done). **Current state:** advisory in this repo (job-level COE, excluded from `prebuild-security-complete`).
- **ScanCode 32.5.0** — `--json-pp` supported; `--csv` deprecated (#3043) as doc says. ✅ implementable but slow (30-min timeout justified).
- **Checkov** — `soft_fail` input supported; baseline fail-on-new requires `.checkov.baseline` (verified: `--baseline` and `--create-baseline` flags exist). ✅ implementable.
- **Hadolint** — `failure-threshold` supports info/warning/error. ✅
- **zizmor 1.30.1** — **VERIFIED**: `--format=sarif` always exits 0 even with findings; exit codes 11+ only in plain mode. Source: zizmor docs "Exit codes" + integrations page. This is why the repo's pipeline-config-scan spec uses `jq -e '.runs[0].results | length == 0'` as the gate. ✅ implementable with explicit SARIF parsing.
- **GuardDog 3.2.0** — requires network; no config file (wrapper needed). ✅
- **OSV-Scanner** (PRD recommendation for SCA verifier) — open source, reads lockfiles (npm/yarn/pnpm/bun), queries OSV DB. **VERIFIED: does NOT compute EPSS or KEV natively** (only CVSS); EPSS/KEV require joining against FIRST EPSS feed + CISA KEV catalog. ✅ implementable as CVE gate only; full triage needs enrichment. **Current state:** integrated in `lockfile-audit` (`v2.5.0`, checksum-pinned) and blocking when the lockfile changes.
- **Snyk** — commercial; requires account/token. ⚠️ not free; PRD marks decision open.
- **Push protection (GitHub secret scanning)** — **VERIFIED**: available free on public repos; on private repos requires GitHub Advanced Security (paid license). Repo visibility/plan must be confirmed before promising push protection. ✅ conditionally implementable.
- **Rulesets requiring `security-complete`** — GitHub rulesets support required status checks by context name. ✅ implementable, but the check name must match exactly (`Prebuild Security Complete`).
- **Dependabot `cooldown`** — **VERIFIED**: supported in dependabot.yml v2 (default 3-day cooldown even without config). ✅ implementable.
- **GitHub Code Scanning / SARIF upload** — `github/codeql-action/upload-sarif@v4` supports third-party SARIF. ✅ (already used).
- **TruffleHog** for history scanning with credential verification — ✅ implementable but adds runtime; PRD suggests using alongside Gitleaks in different layers. **Current state:** implemented in `security.yml` (`3.99.4`, full history, `--results=verified`).

### 10.5 Items in the PRD that are NOT (directly) implementable

1. **"Secretos: pre-commit, push protection, PR y historial programado activos y bloqueantes"** — Push protection on private repos requires GitHub Advanced Security (paid). If the repo is private without GHAS, push protection is unavailable; must rely on pre-commit + PR scan. Verify plan.
2. **"SCA: OSV-Scanner o Snyk como verificador bloqueante"** — OSV-Scanner needs a lockfile and network; for npm, `osv-scanner --lockfile=package-lock.json` works. But the PRD's "explotabilidad (EPSS/KEV/reachability)" — OSV-Scanner does NOT compute EPSS or reachability natively; only Snyk/Dependabot insights provide reachability. Implementable as CVE gate only; full triage requires commercial tooling or manual.
3. **"Lockfile obligatorio (PR que cambia package.json sin lockfile falla)"** — GitHub does not natively enforce lockfile presence; requires a custom check (e.g., `npm ci` fails if lockfile missing, or a script). Implementable via a job step, not a built-in. ✅ implemented in `lockfile-audit` (manifest changed without lockfile → exit 1).
4. **"Job que falla si una excepción venció"** — Requires building a custom script/parser for `security/exceptions.yml` and a CI job. Implementable but not a built-in GitHub feature. ✅ implemented as `security-exceptions-check` (blocking).
5. **"Métricas con revisión mensual"** — No built-in; requires custom workflow + issue creation. Implementable but operational overhead. ✅ implemented as `security-metrics.yml`.
6. **"actions de terceros fijadas por SHA"** — ✅ implemented: every action used by 2C is SHA-pinned (`dependency-review-action`, `checkov-action`, `hadolint-action`, `upload-artifact`/`upload-sarif`, `checkout`, `setup-uv`). Dependabot's github-actions ecosystem keeps them updated.
7. **"Ruleset exige security-complete y nada más por nombre de job"** — The ruleset currently (per ci.yml comments) binds `Governance: PR Body Lint` + `Prebuild Governance Complete`. Adding `Prebuild Security Complete` requires ruleset edit; must confirm the exact check context name matches the job's `name:` field (`Prebuild Security Complete`).
8. **"Hadolint pre-commit"** — Hadolint is a binary; running in pre-commit requires installing it locally or via docker. Implementable but adds local setup friction.
9. **"IaC (Checkov/tfsec/KICS)"** — Only useful if Terraform/K8s files exist. The repo is Node/React/Express with a Dockerfile; no Terraform/K8s detected. ✅ Checkov runs blocking for the Dockerfile and is path-scoped; Terraform/K8s frameworks stay inert until those files exist (PRD observation #7).

### 10.6 Adoption status (plan original de 2026-11-10)

| Phase | Scope                      | Status                                                                                                                                  |
| ----- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Aggregator strictness      | **Implemented:** 9 jobs in `needs`; fail-closed anti-skip by event/path; `dependency-review` intentionally advisory.                    |
| 1     | Secrets + pipeline config  | **Implemented:** gitleaks blocking; actionlint and zizmor blocking since 2026-11-10 via SARIF `jq` gates.                               |
| 2     | SAST                       | **Partially implemented:** diff-scoped `sast` blocking in governance; weekly full scans (CodeQL, Semgrep) remain advisory.              |
| 3     | Dependency Review + SCA    | **Implemented:** `lockfile-audit` blocking; OSV-Scanner `v2.5.0` blocking when the lockfile changes.                                    |
| 4     | Licenses                   | **Implemented:** `scancode-license-pr-diff` blocking since 2026-11-10; `unknown` = warning + 30-day ticket; distribution model open.    |
| 5     | Hadolint / IaC / typosquat | **Implemented:** Checkov (`soft_fail: false`) and Hadolint (`failure-threshold: warning`) blocking; GuardDog blocking since 2026-11-10. |

**Artifacts created:** `security/exceptions.yml` + `security-exceptions-check`, `security/SLA.md`, `security-metrics.yml`, `security-digest.yml`, `docs/runbooks/security/`.

**Still open:** bind `Prebuild Security Complete` in ruleset 21227644; verify repo plan for push protection; decide license distribution model; define retention/redaction policy; post-build image scanning (out of scope).

### 10.7 Top recommendations (open items as of 2026-11-23)

1. **Bind `Prebuild Security Complete` to the ruleset** — confirm the exact check-run name (`Prebuild Security Complete`) and add it as a required check; today this is unverified.
2. **Verify repo visibility/plan** before promising push protection (GitHub Advanced Security requirement).
3. **Decide the license distribution model** (SaaS vs on-prem) to close the `dependency-review`/ScanCode deny-list decision.
4. **Decide whether `dependency-review` stays advisory** — it is the only 2C job outside the aggregator. Promoting it means removing the job-level COE and adding it to `needs`, accepting that license/vulnerability findings block merges.
5. **Define a retention/redaction policy** — artifacts currently use 14/30/90/365 days and only gitleaks applies `--redact`.
6. **Rename promoted jobs** (`actionlint-advisory`, `zizmor-advisory`) when convenient; the labels are stale but renaming changes check contexts, so do it in a dedicated change.
7. **Keep image scanning post-build** — Trivy/Grype on the built image belongs to the post-build stage, not 2C.

---

---

### 10.8 Deep internet research — detailed findings by control area

This section deepens the corroboration in §10.4 with primary sources, implementation caveats, and enterprise patterns verified via live web search on 2026-11-10.

#### 10.8.1 Secrets — Gitleaks, TruffleHog, and GitHub native

**Three-layer model (validated by industry).** The PRD's four layers (pre-commit / push protection / PR / scheduled history) map to the industry-standard three-gate model documented by KeyDrift and SecRails:

- Pre-commit (local hook): scans staged files in milliseconds; `gitleaks protect --staged --redact`. Cheapest, but bypassable with `--no-verify` (E2 shift-left as feedback).
- Push protection (server-side): blocks push before it reaches the repo; only partners patterns + custom patterns + generic patterns (private keys, DB connection strings). Only reliable for partnered patterns.
- CI (build job): full checkout + history; runs after the leak already entered history — backstop, not prevention.
- Scheduled (weekly full history): detects what entered before controls existed and new rules applied to old code.

**Gitleaks specifics (verified):**

- `--redact` supported; redacts secret values in output so artifacts aren't a second leak.
- Baseline file supported (`gitleaks detect --baseline-path`) — essential for legacy repos with hundreds of false positives.
- Custom rules via `.gitleaks.toml` with `keywords` (prefilter), `entropy`, `secretGroup` — matches the repo's secret-scanning spec.
- `generic-api-key` rule is noisy; disabling it (as the repo does) and renaming to `custom-api-key` is a documented pattern.

**TruffleHog vs Gitleaks (verified, SecRails 2026-06):** TruffleHog verifies whether a credential is still active against the provider (reduces false positives); Gitleaks is faster and rule-tunable. Mature posture uses Gitleaks pre-commit + TruffleHog in CI + GitHub native as backstop. The PRD's "use both in different layers" is corroborated.

**GitHub native secret scanning (verified):**

- Public repos: secret scanning + push protection free.
- Private repos: requires GitHub Secret Protection (paid, part of GHAS). Push protection for private repos requires the paid license.
- Native scanning only covers default branch + open PRs by default; full history needs explicit config.
- Partner program auto-notifies 200+ providers (AWS, Stripe, etc.) for auto-revocation — unique to native.
- Custom patterns supported but more limited than Gitleaks TOML.

**Conclusion for the repo:** The repo's gitleaks-based PR gate is correct and free; push protection availability depends on repo visibility/plan (must verify). Native scanning should be enabled as a backstop if the plan allows.

#### 10.8.2 SAST — Semgrep vs CodeQL

**Semgrep (verified, Safeguard 2026-05 + LinkedIn InfoQ 2026-02):**

- Lightweight pattern matching (YAML rules); anyone who reads the language can author rules.
- `--baseline-commit` reports only findings not in the baseline commit → fail-on-new.
- SARIF output via `--sarif-output`; runs in container `semgrep/semgrep`.
- Diff-aware scanning; PR comments; sub-5-minute PR gating feasible.
- Community Edition (LGPL-2.1) needs no account; `semgrep ci` needs token.
- CodeQL needs DB build (expensive on large monorepos); better for nightly deep scans.
- Many large orgs run both: CodeQL for deep dataflow on Java/C++, Semgrep for breadth + custom rules.

**CodeQL (verified):**

- Default setup toggle vs advanced setup workflow file; v3 deprecated Dec 2026, v4 on Node 24.
- Default setup and advanced setup cannot mix.
- For private repos, code scanning needs a GitHub Code Security license.

**Conclusion for the repo (updated 2026-11-23):** The repo's Semgrep L2 (diff, fail-on-new) + L3 (weekly full) is a sound enterprise pattern. CodeQL is already present as an **advisory** `sast` job in `security.yml`; the blocking diff gate remains Semgrep in 2A. CodeQL for private repos still requires a GitHub Code Security license.

#### 10.8.3 SCA and Dependency Review

**Dependency Review Action (verified, GitHub docs):**

- `config-file` input accepts local (`.github/dependency-review-config.yml`) or external repo paths.
- Supports `fail-on-severity`, `fail-on-scopes`, `allow-licenses`/`deny-licenses`, `allow-ghsas`.
- Runs on PRs; compares manifest/lockfile changes.
- **Current state:** advisory in this repo (job-level COE, excluded from `prebuild-security-complete`).

**OSV-Scanner (verified, Google docs + GeekWala 2026-07 + AppSecSanta 2026-02):**

- Free, Apache-2.0, single static binary, no account.
- Reads npm/yarn/pnpm/bun lockfiles; 19+ lockfile formats across 11+ ecosystems.
- V2 added guided remediation (npm/Maven) with ROI-based upgrade ranking.
- Container image scanning (layer-aware, Debian/Ubuntu/Alpine).
- **Does NOT compute EPSS or KEV natively** — only CVSS. EPSS/KEV require joining against FIRST EPSS feed + CISA KEV catalog manually.
- Grype has EPSS/KEV natively; Snyk offers dashboard + auto-fix PRs + continuous monitoring.

**npm audit (repo's current lockfile-audit):** reads the lockfile and runs `scripts/audit-gate.mjs`: critical always blocks, high blocks only when a fix is available, moderate/low are advisory. Fail-closed if the report is missing. No reachability/EPSS.

**Conclusion for the repo (updated 2026-11-23):** `lockfile-audit` is blocking since 2026-11-10 with the severity policy above; OSV-Scanner `v2.5.0` adds multi-ecosystem coverage and blocks when the lockfile changes. Full triage (EPSS/KEV/reachability) still needs Snyk or manual enrichment; the PRD's "explotabilidad" claim is only partially implementable with free tools.

#### 10.8.4 Licenses

**ScanCode (verified):** `--json-pp` supported; `--csv` deprecated (#3043) as the PRD says. Slow (30-min timeout justified). ACMR diff for PR-time; full repo weekly.

**License policy depends on distribution model (PRD observation):** GPL activates on distribution; AGPL also on network service. SaaS vs on-prem vs image delivery changes risk. The repo's deny-list (GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0) is a reasonable default but must be confirmed against the ERP's distribution model.

**`unknown` licenses:** The PRD's "warning that nobody reviews becomes noise" is corroborated. Define a triage SLA and block after 4 clean weeks. **Current state:** ScanCode PR-diff is blocking since 2026-11-10; `unknown` = warning + mandatory 30-day ticket (`security/SLA.md` §2), escalating to a block only when an expired exception matches (`security/exceptions.yml`). Distribution model still pending.

#### 10.8.5 IaC scanning

**Checkov (verified, checkov.io CLI ref):**

- `soft_fail` input (advisory), `--baseline`/`--create-baseline` for fail-on-new.
- `--hard-fail-on`/`--soft-fail-on` for severity-based gating.
- Frameworks: terraform, kubernetes, dockerfile, github_actions, etc.
- Only useful if IaC files exist. The repo has a Dockerfile but no Terraform/K8s detected; Checkov is now **blocking** for the Dockerfile and stays path-scoped, while the Terraform/K8s frameworks remain inert until those files exist (PRD observation #7).

**tfsec/KICS:** alternatives; KICS has broader framework support. Not needed unless IaC files appear.

#### 10.8.6 Container image scanning (post-build, out of scope for this stage)

**Trivy vs Grype (verified, systemshardening 2026-05):**

- Trivy: most widely deployed; scans OS packages + language deps + K8s manifests in one binary; `exit-code: 1` to fail; `ignore-unfixed: true` to skip no-fix CVEs; SARIF upload.
- Grype (Anchore): separates SBOM generation (Syft) from vulnerability matching; enables re-scanning an existing SBOM against new vuln DB without rebuild.
- Best practice: scan base image separately from app image to attribute CVEs; `ignore-unfixed` to reduce noise.

**Conclusion:** The PRD correctly defers image scanning to post-build. The repo's SBOM job (anchore/sbom-action) is a good foundation.

#### 10.8.7 Pipeline security (zizmor, actionlint, Hadolint)

**zizmor (verified, docs.zizmor.sh):**

- SARIF mode (`--format=sarif`) always exits 0 even with findings (by design — SARIF consumers expect semantic results in the file).
- Plain mode exits 11-14 by severity. The repo's pipeline-config-scan spec correctly uses `jq -e '.runs[0].results | length == 0'` as the gate.
- Detects expression injection, excessive permissions, unpinned actions, persisted credentials (artipacked).
- zizmor.yml config file required (minimum).

**actionlint (verified):** syntax validation, expression errors, shell script errors. Blocking on `.github/` changes is appropriate.

**Hadolint (verified):** `failure-threshold` supports info/warning/error. Error blocks, style warns. Dockerfile best practices (pinned base, non-root user, layer hygiene). Pre-commit requires local binary install or docker — friction.

**SHA pinning (verified, OWASP 2026 + GitHub docs):**

- Pin to full-length commit SHA + version comment. Dependabot github-actions ecosystem keeps SHAs updated.
- GitHub supports enforcing SHA pinning at enterprise/org/repo level via allowed-actions policy.
- Workflow dependency lockfiles (newer) supersede SHA pinning for full transitive pinning.
- **Current state (2026-11-23):** every action used by 2C is already SHA-pinned (including `dependency-review-action`, `checkov-action` and `hadolint-action`); Dependabot's github-actions ecosystem keeps the SHAs updated.

#### 10.8.8 Typosquatting (GuardDog, Socket)

**GuardDog (verified, OpenSSF + GitHub issue #898):**

- Metadata scanners (typosquatting, binary executables) + Semgrep rules + YARA rules.
- Supports npm, PyPI, Go.
- **Known false positive problem:** on 12,111 npm packages, 263 flagged (2.2%); on PyPI ranks 15,001-30,000, 1,002 flagged (6.7%). False positives grow with target list; detection plateaus at ~4,000 targets.
- GuardDog's typosquatting heuristic has bugs (confused forms matching anywhere in term). Issue #898 open (2026-10).
- Condition on manifest/lockfile changes (PRD observation #6) is correct.

**Socket (verified, socket.dev):**

- Commercial; static analysis + metadata + maintainer behavior; 70+ signals.
- Typosquat defined as Levenshtein distance 1-2 from a popular package with 1000x download ratio.
- Socket CLI wraps npm install and blocks before writing to disk.

**Conclusion for the repo (updated 2026-11-23):** GuardDog graduated to **blocking on 2026-11-10** (§7.3): job without COE, SARIF `jq` gate, manifest-scoped, wrapper pinned to `3.2.0`. The original 2026-11-10 recommendation to keep it advisory is superseded; rollback is a single revert that re-adds `continue-on-error: true` to the job (same pattern documented in §7.4). Consider Socket as a commercial alternative if budget allows.

#### 10.8.9 GitHub rulesets and required status checks

**Verified (GitHub docs + troubleshooting):**

- Required check context name must match the actual check-run name published (not the "workflow / job" display format). Common pitfall: ruleset lists `"Workflow Name / job-name"` but GitHub publishes `"job-name"`.
- `skipped` and `neutral` count as success for required checks. This is why the aggregator must explicitly fail on `skipped` (the repo's secret-scanning-history-governance change does this for `secrets`).
- `merge_group` trigger required if using merge queues — otherwise required checks never report and block merge.
- Status checks must have run successfully in the past 7 days to be selectable.
- Rulesets can pin an expected source app (integration_id 15368 for github-actions) to prevent spoofing.
- Strict mode requires branch up-to-date; loose mode doesn't (fewer builds, risk of post-merge failures).

**Conclusion for the repo:** The ruleset must bind `Prebuild Security Complete` (exact job `name:`) as a required check, with github-actions as the expected source. Currently (per ci.yml comments) only governance checks are bound — this is a gap (PRD DoD item #2).

#### 10.8.10 Security exceptions policy (E6)

**Industry pattern (verified, Cloudaware + GitLab + vulnerability management policy template):**

- Versioned file in repo (`security/exceptions.yml`) with: id, tool, finding, scope, reason, owner, created, expires, ticket.
- Every suppression (inline or file) references an exception id.
- CI job fails if any exception is expired → renewal is an explicit decision.
- Max expiry short (90 days proposed; GitLab uses 30/60/90/365 by severity).
- Changing the file requires CODEOWNERS review (same as workflows).
- Aggregator reports count of active exceptions and earliest expiry.
- GitLab pattern: permanent exceptions only for false positives, time-based preferred.

**Conclusion for the repo (updated 2026-11-23):** Implemented — `security/exceptions.yml` exists and the blocking `security-exceptions-check` job validates owner + `expires` on every PR (wired to `prebuild-security-complete`).

#### 10.8.11 SLA for vulnerability remediation

**Industry standard (verified, multiple sources):**

- Critical/KEV/exploit known: 7 days.
- High: 30 days.
- Medium: 90 days.
- Low: best effort.
- GitLab uses priority-based (P1-P4) with 30/60/90/365-day exceptions.
- SLA clock starts at detection; reassignment doesn't restart; pending exception doesn't pause clock.
- Evidence of active exploitation → accelerated deadline + immediate risk reassessment.

**Conclusion for the repo (updated 2026-11-23):** The PRD's SLA table (7/30/90/best-effort, 24–72 h for active exploitation) is documented in `security/SLA.md` and measured monthly by `security-metrics.yml`.

#### 10.8.12 SBOM generation

**Verified (anchore docs):**

- `anchore/sbom-action` generates SPDX or CycloneDX (default spdx-json); Syft under the hood.
- `dependency-snapshot: true` uploads to GitHub Dependency submission API (enables Dependabot alerts on transitive deps).
- Retention configurable; release assets auto-attached.
- Two industry standards: SPDX (ISO/IEC 5962) and CycloneDX (OWASP). Both supported.

**Conclusion for the repo (updated 2026-11-23):** The SBOM job is sound and already sets `dependency-snapshot: true` (CycloneDX JSON), so Dependabot sees transitive dependencies.

#### 10.8.13 Pre-commit hooks

**Verified (thevibesecurity.com 2026-09 + KeyDrift):**

- `pre-commit` framework with gitleaks hook (rev pinned).
- `gitleaks protect --staged --redact` scans only staged changes.
- Husky alternative for Node projects (`npm i -D husky && npx husky init`).
- The repo already has husky hooks (commit-msg, prepare-commit-msg, pre-push) and runs gitleaks on staged content in `.husky/pre-commit`; that is the shift-left layer described above.

#### 10.8.14 NIST 800-53 RA-5 and SSDF mapping

**RA-5 (verified, NIST 5.2.0, updated 2026-05-11):**

- (a) Monitor and scan at organization-defined frequency + when new vulns reported.
- (b) Tools facilitating interoperability (SCAP, CVE, OVAL, CWE, CVSS).
- (c) Analyze scan reports.
- (d) Remediate within organization-defined response times.
- (e) Share info with defined personnel/roles.
- (f) Tools readily updatable.

**SSDF (SP 800-218):** RV.1 (identify vulns continuously), PW.4 (verify third-party components), PW.7 (analyze code), PS.1 (protect code).

**Conclusion for the repo:** The PRD's framework mapping is accurate. The repo's scheduled scans (weekly SAST/SCA/secrets/licenses) satisfy RA-5(a) frequency requirement. SLA table satisfies (d). CODEOWNERS satisfies sharing (e).

#### 10.8.15 Dependabot configuration

**Verified (GitHub docs):**

- `cooldown` supported for npm, github-actions, docker (all in PRD example).
- Default 3-day cooldown even without explicit config (reduces supply chain risk from freshly published compromised packages).
- `groups` for minor/patch reduces PR noise.
- `open-pull-requests-limit` caps open PRs.
- Security updates separate from version updates (cooldown doesn't apply to security updates).

**Conclusion for the repo (updated 2026-11-23):** The PRD's `dependabot.yml` example is accurate. The repo's `.github/dependabot.yml` exists and matches: npm + github-actions + docker, weekly, 7-day cooldown and grouped updates.

#### 10.8.16 Summary of PRD items and current status

| #   | PRD item                                          | Status                  | Reason                                                                                                                      |
| --- | ------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Push protection on private repos                  | ⚠️ Conditional          | Requires GitHub Secret Protection (paid). Free on public repos only.                                                        |
| 2   | OSV-Scanner with EPSS/KEV/reachability            | ⚠️ Partial              | OSV-Scanner only outputs CVSS. EPSS/KEV need manual join. Reachability only in Snyk/Dependabot insights.                    |
| 3   | Lockfile mandatory (PR without lockfile fails)    | ✅ Implemented          | `lockfile-audit` fails when `package.json` changed without `package-lock.json` (custom step, no native GitHub feature).     |
| 4   | Job that fails on expired exceptions              | ✅ Implemented          | `security-exceptions-check` (custom parser + job), blocking and wired to the aggregator.                                    |
| 5   | Monthly metrics review                            | ✅ Implemented          | `security-metrics.yml` (monthly cron + issue) + `security-digest.yml` weekly.                                               |
| 6   | SHA-pinning all third-party actions               | ✅ Implemented          | All actions in 2C are SHA-pinned; Dependabot github-actions keeps them updated.                                             |
| 7   | Ruleset requires `security-complete` only by name | ⚠️ Config               | Requires ruleset edit; exact check-run name must match job `name:` field. Currently only governance checks bound.           |
| 8   | Hadolint pre-commit                               | ⚠️ Friction             | Requires local binary install or docker. Implementable but adds setup friction.                                             |
| 9   | IaC (Checkov/tfsec/KICS)                          | ✅ Implemented (scoped) | Checkov blocks for the existing Dockerfile and is path-scoped; Terraform/K8s frameworks stay inert until those files exist. |
| 10  | Image scanning (Trivy/Grype)                      | ✅ Deferred             | Correctly deferred to post-build stage (not this stage).                                                                    |

#### 10.8.17 Consolidated recommendations (deepened)

1. **Phase 0 implemented**: `prebuild-security-complete` is strict (`if: always()`, fail-closed anti-skip) and `needs` 9 of the 10 2C jobs; `dependency-review` is intentionally advisory.
2. **Bind `Prebuild Security Complete` to the ruleset** as a required check with github-actions as expected source (exact name match).
3. **Verify repo visibility/plan** before promising push protection (GHAS requirement).
4. **`security/exceptions.yml` + expiry-check job implemented** — `security-exceptions-check` is blocking and wired to the aggregator.
5. **SLA and monthly metrics implemented** — `security/SLA.md` (7/30/90/best-effort) and `security-metrics.yml` (monthly issue); `security-digest.yml` weekly.
6. **SHA-pinning implemented in 2C** — all actions used by the security substage are SHA-pinned; Dependabot github-actions keeps them updated.
7. **GuardDog graduated to blocking on 2026-11-10** (see §7.3); the earlier “keep advisory” recommendation is historical (2.2% npm / 6.7% PyPI false-positive rate was the calibration input).
8. **Checkov is blocking** on the existing Dockerfile (`soft_fail: false`); keep it path-scoped so it skips when no IaC/Dockerfile changes.
9. **`dependency-snapshot: true` implemented** on the SBOM job for better Dependabot transitive coverage.
10. **Add gitleaks pre-commit hook** via existing husky infrastructure (cheapest shift-left).
11. **TruffleHog implemented** in `security.yml` (3.99.4, full history, `--results=verified`, `--fail`); not wired to the 2C aggregator.
12. **CodeQL implemented** as an advisory `sast` job in `security.yml`; Semgrep remains the blocking diff gate in 2A.

---

_Original research deliverable (2026-11-10). §10.1–§10.3, §10.5–§10.7 and the consolidated recommendations were synchronized with the workflows on 2026-11-23; the deep research in §10.4 and §10.8 remains as verified on 2026-11-10 (GitHub docs, tool docs, NIST, OWASP, industry blogs)._
