# Proposal

## Why

`security.yml` y `scheduled-security.yml` YA están habilitados: el change `secret-scanning` los rehabilitó el 2026-09-25 (verificado por API → estado `active`, no `disabled_manually`). El gap NO es de enablement, sino de cobertura: falta el full SAST semanal (Semgrep full sin `--baseline-commit`), no hay subida de SARIF a Code Scanning con categorías por herramienta, faltan artifacts con retención diferenciada (SARIF 90d / JSON 30d) y `continue-on-error` en los steps que fallan con hallazgos, y no existe `notify-failure` con `issues: write` ni evidencia de auditoría semanal → sin deuda histórica visible ni evidencia SARIF para compliance (SOC 2 / ISO 27001, §2 Capa L3). L1 pre-commit + Semgrep diff advisory en `ci.yml` cubren solo diff de PR.

## What Changes

- Rehabilitar `.github/workflows/security.yml` y `.github/workflows/scheduled-security.yml` (`gh workflow enable`) → vuelven a correr CodeQL + Trivy + SBOM + Gitleaks full-history.
- Añadir **Semgrep full scan** (sin `--baseline-commit`, full history) al schedule semanal con `--sarif-output` + `github/codeql-action/upload-sarif@v4`.
- Consolidar triggers D2: `schedule` cron semanal (lunes 03:00 UTC, ya presente en `scheduled-security.yml`) + `workflow_dispatch` + `merge_group` en los workflows SAST.
- Mantener/adecuar modo **audit/advisory**: `continue-on-error: true` en scan steps; job `notify-failure` con `if: always()` basado en `steps.*.outcome` (via job outputs — `needs.*.result` es dead path con continue-on-error, documentado en `scheduled-security.yml` líneas 17-24).
- Subir SARIF a GitHub Code Scanning (`upload-sarif@v4`, category única por herramienta: `semgrep`, `codeql`, `trivy`, `gitleaks`) → alerts visibles en pestaña Security.
- Artifact retention: JSON 30d, SARIF 90d, SBOM 365d (ya 365d en `security.yml`).
- Taxonomía advisory: findings L3 generan issue + alerts, NUNCA bloquean release/merge.
- Documentar estado y proceso de triaje semanal en docs.

## Capabilities

### New Capabilities

- `ci-sast-weekly-scan`: Full-history SAST semanal advisory — schedule de Semgrep full + CodeQL + Gitleaks full + Trivy/SBOM, subida SARIF a Code Scanning, artifacts con retención diferenciada, notify-failure por `steps.*.outcome`, taxonomy advisory (nunca bloqueante) y wiring opcional `scheduled-scanning` en ruleset (no required).

### Modified Capabilities

<!-- Ninguna: `sast-governance-gate` (diff-scoped PR, ci.yml) y `ci-secret-scanning`
     (Gitleaks full-history en scheduled-security.yml) no cambian de requisitos;
     este change rehabilita config/estado, no altera sus requirements. -->

## Impact

- **Workflows**: `.github/workflows/security.yml` (jobs `sast` CodeQL, `dependency-scan` Trivy, `sbom`), `.github/workflows/scheduled-security.yml` (Gitleaks full + notify-failure); triggers (schedule/dispatch/merge_group).
- **Permisos**: `security-events: write` (upload SARIF), `issues: write` (notify-failure) — ya declarados.
- **Docs**: `docs/learning/sast-implementation.md` §4.1/§6.2 (estado), docs de seguridad/triaje.
- **Ruleset**: solo wiring opcional `scheduled-scanning` NO required (auditoría de gobernanza, `ruleset-expansion` intacto).
- **Riesgo**: runs semanales consumen Actions minutes; findings históricos generan ruido inicial → triaje por security champions (§4.2 "Mejorar notebooks de remediación").

**Refs oficiales** (§5, verificadas 2026-09-25): docs.semgrep.dev (cli-reference, configuring-blocking-and-errors-in-ci, upload-ci-findings-to-github), docs.github.com code-scanning (uploading-a-sarif-file, customizing advanced setup, merge protection), raw.githubusercontent.com/github/codeql-action/main/README.md, github.com/gitleaks/gitleaks README.
