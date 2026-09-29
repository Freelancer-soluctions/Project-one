# Proposal

## Why

`project-one` construye imagen desde `apps/server/Dockerfile` (`deploy.yml` L85/L194, `preview.yml` L82) pero no tiene **ninguna** capa de calidad de Containerfile: `grep -rni hadolint .github/workflows/` → **0 matches** (verificado 2026-09-27, `docs/learning/containerfile-lint.md` §1). Trivy en `security.yml` corre `scan-type: fs` con default `vuln,secret` (NO `misconfig`) → no linta el Dockerfile, y `checkov-iac` (ya activo, `framework: dockerfile` vía `.checkov.yml`) cubre _policy de seguridad_ IaC (CKV*DOCKER**), no *higiene/calidad\* (ShellCheck sobre `RUN`, pin de versiones, capas consolidadas, registry allowlist). Gap real = capa de calidad del Dockerfile, hoy cobertura 0 jobs. Investigación completa y referencias oficiales verificadas con fetch HTTP el 2026-09-27 (Hadolint **v2.15.1**, `hadolint-action@v3.1.0`, esquema `.hadolint.yaml`, CLI `--ignore`/`--trusted-registry`/`--format sarif`/`--failure-threshold`).

## What Changes

- **Job PR `containerfile-lint` (advisory FASE 1)** en `.github/workflows/ci.yml`: `hadolint/hadolint-action@v3.1.0` sobre `apps/server/Dockerfile`, `format: sarif`, política `.hadolint.yaml` vía input `config`, `continue-on-error: true` a nivel job, `needs: repo-discovery`, `timeout-minutes: 5`, en paralelo a `dependency-review`/`lockfile-audit`/`checkov-iac` (sin dependencia de `build`); artifact `hadolint-report-pr` con `retention-days: 14` + SARIF `category: hadolint`; **NO** entra al `needs` de `prebuild-security-complete` (L1465) en FASE 1.
- **Job semanal `containerfile-lint-weekly` (advisory)** en `.github/workflows/scheduled-security.yml` (cron `0 3 * * 1` ya existente): `continue-on-error: true`, artifact **90d**, SARIF `category: hadolint-weekly`, sin ruta blocking y sin agregador.
- **`.hadolint.yaml` — política como código** versionada en la raíz (`failure-threshold`, `format`, `ignored:` selectivos documentados por regla, `override`, `trustedRegistries: [docker.io, ghcr.io]` → activa `DL3026`); los jobs la referencian explícita (`config:`), nunca flags de regla dispersos en workflows.
- **Pre-commit advisory**: paso `hadolint -c .hadolint.yaml --failure-threshold warning apps/server/Dockerfile` en `.husky/pre-commit`, **fuera** de la cadena `set -e` y protegido con `||` (nunca bloquea el commit).
- **Validación local (D6)**: `hadolint --version` esperado `v2.15.1` + `hadolint --format sarif --output hadolint.sarif apps/server/Dockerfile`; con Hadolint fuera de PATH, alternativa documentada `docker pull hadolint/hadolint:v2.15.1` y `docker run --rm -i -v "$PWD/.hadolint.yaml:/.hadolint.yaml" hadolint/hadolint:v2.15.1 < apps/server/Dockerfile`.
- **FASE 2 (diferida, no en este change de implementación)**: subir `failure-threshold: warning`, quitar `continue-on-error: true` y añadir `containerfile-lint` al `needs` de `prebuild-security-complete` **solo tras 2-4 semanas sin falsos positivos**; opcionalmente registrar baseline de hallazgos conocidos (`ignored:` versionada o comparación SARIF) para `fail-on-new` si se decide.
- **Documentación**: filas `containerfile-lint` (`advisory (PR, fase 1)` → `blocking (PR)`) y `containerfile-lint-weekly` (`advisory (scheduled)`) en `docs/learning/quality-gates.md` §2 y resumen §4.4; capa de calidad Containerfile en `docs/learning/license-policy.md` §6; estado en `docs/learning/containerfile-lint.md` §8 y nota de separación de capas en `docs/learning/iac-scanning.md`.
- **Separación de capas (hallazgo de la investigación)**: `checkov-iac` **ya cubre** Dockerfile como infra (`framework: dockerfile`, PR advisory 14d + weekly 90d, category `checkov-iac`) → este change **no duplica** eso; aporta solo la capa de _calidad_ con Hadolint. Taxonomía documentada: **Hadolint = calidad Dockerfile · Trivy = CVE/secretos · Checkov = IaC policy · Semgrep/CodeQL = SAST**.

Fuera de alcance: **NO** se toca `.github/workflows/security.yml` (`category: trivy` intacto, sin añadir `--scanners misconfig`, que duplicaría a Checkov); **NO** se modifica el job `checkov-iac`/`checkov-iac-weekly` ni `.checkov.yml`; **NO** se reemplazan `dependency-review`, `lockfile-audit` ni `scancode-license-pr-diff`; **NO** se crea `scan-list.txt`; **NO** se modifican `deny-licenses`/`allow-licenses` ni listas de licencias (Hadolint no es una capa de licencias); **NO** se toca `dependabot.yml` ni `security-digest.yml`; **NO** se usa Dockle (`goodwithtech/dockle`, requiere imagen construida → descartado FASE 1); **NO** se modifica `apps/server/Dockerfile` salvo remediación explícita de findings en FASE 2.

## Capabilities

### New Capabilities

- `containerfile-lint`: gobernanza de la **capa de calidad de Containerfile (Hadolint)** — job PR `containerfile-lint` advisory (`continue-on-error: true`, artifact 14d, SARIF `category: hadolint`, paralelo a `dependency-review`/`lockfile-audit`/`checkov-iac`, fuera de `prebuild-security-complete` en FASE 1), job semanal `containerfile-lint-weekly` advisory (artifact 90d, `category: hadolint-weekly`), política `.hadolint.yaml` versionada como código auditable, capa local pre-commit advisory fuera de la cadena `set -e`, validación local pre-merge (binario `v2.15.1` o `docker pull hadolint/hadolint:v2.15.1`), transición FASE 1 advisory → FASE 2 blocking gradual (`failure-threshold: warning` + `needs` en el agregador + baseline opcional `fail-on-new`), y separación de capas frente a Trivy (`security.yml`, CVE/secretos), Checkov (`checkov-iac`, IaC policy) y SAST (CodeQL/Semgrep).

### Modified Capabilities

<!-- none — `ci-supply-chain-security`, `ci-scheduled-security-review`, `sast-governance-gate`, `license-compliance` y `iac-scanning`-related contracts no cambian de requisito: este change añade un job de calidad de Dockerfile sin alterar esos contratos. `checkov-iac` ya cubre Dockerfile como IaC (separación de capas documentada, no duplicación). -->

## Impact

- `.github/workflows/ci.yml`: job nuevo `containerfile-lint` (banda pre-build SECURITY, `needs: repo-discovery`, junto a `lockfile-audit` L956 y `checkov-iac` L1007); en FASE 2 se añade a `needs` de `prebuild-security-complete` (L1465, hoy `[dependency-review, secrets, scancode-license-pr-diff]`). Requiere `permissions: security-events: write` a nivel job para `upload-sarif` (patrón de `dependency-review` L770-773).
- `.github/workflows/scheduled-security.yml`: job nuevo `containerfile-lint-weekly` (audit-mode, `continue-on-error: true`, SARIF + artifact 90d); `gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly` y `notify-failure` intactos.
- `.hadolint.yaml` (nuevo, raíz): política como código; consumido por CI, pre-commit y validación local.
- `.husky/pre-commit`: paso advisory tras los existentes (`lockfile`, `checkov`), protegido con `||`.
- `docs/learning/quality-gates.md` §2/§4.4, `docs/learning/license-policy.md` §6: filas/capas nuevas **sin duplicar** `checkov-iac` ni `lockfile-audit`.
- `docs/learning/containerfile-lint.md` §8 (estado: implementado) y `docs/learning/iac-scanning.md` (nota de separación de capas Hadolint vs Checkov).
- **Sin cambios** en `security.yml`, `security-digest.yml`, `.checkov.yml`, `dependabot.yml`, listas de licencias ni código de aplicación.
- Desarrolladores: findings de calidad advisory en PR y en `git commit`; equipo: evidencia auditable SARIF 14d/90d (OWASP A05 Security Misconfiguration, CIS Docker Benchmark afín).
