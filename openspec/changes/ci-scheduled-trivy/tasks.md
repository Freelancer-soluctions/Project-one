## 1. Extend scheduled-security.yml

- [ ] 1.1 Add `trivy-full-scan` job to `.github/workflows/scheduled-security.yml` with an `actions/checkout@v5` step FIRST (trivy-action does NOT checkout; without it `scan-ref: .` scans an empty workspace → empty SARIF, silent green — mirror `gitleaks-full-scan` and the `npm-audit` job 1.4), then `aquasecurity/trivy-action@0.33.1` with `scan-type: fs`, `scan-ref: .`, `severity: CRITICAL,HIGH`, `format: sarif`, `output: trivy.sarif` (no `exit-code: 1` — audit mode, spec R1)
- [ ] 1.2 Add SARIF upload step to the `trivy-full-scan` job: `github/codeql-action/upload-sarif@v4` with `sarif_file: trivy.sarif` and `category: trivy` (spec R2)
- [ ] 1.3 Add artifact upload step in the `trivy-full-scan` job: `actions/upload-artifact@v4` with `name: trivy-sarif`, `path: trivy.sarif`, `retention-days: 30` (consistent with `gitleaks-report`)
- [ ] 1.4 Add `npm-audit` job to `.github/workflows/scheduled-security.yml`: `actions/checkout@v5` + `actions/setup-node@v4` (`node-version-file: '.nvmrc'`, `cache: 'npm'`) + `run: npm audit --audit-level=high` with `continue-on-error: true` (audit mode, spec R3)
- [ ] 1.5 Confirm the existing `gitleaks-full-scan` job (JSON + SARIF upload) is unchanged and the workflow remains the single owner of the Gitleaks full-history scan (spec R4); regression-check that top-level permissions `contents: read` + `security-events: write` remain intact after the edit (`upload-sarif@v4` hard-requires `security-events: write`)

## 2. Documentation

- [ ] 2.1 Add "Scheduled Trivy full scan + npm audit" section to `docs/security/SECURITY.md`: weekly cadence (Mon 03:00 UTC), how to read findings (Security tab → code scanning → category `trivy`; `npm-audit` job logs), false-positive triage path (dismiss alerts in the Security tab; document the `--ignore-unfixed` decision from the design.md open question), failure-semantics note (trivy-full-scan fails on infra errors; npm-audit `continue-on-error` masks registry-unreachable), and note that event-driven scans (`security.yml`, `ci-enterprise.yml`) are not duplicated

## 3. Verification

- [ ] 3.1 Dry-run Trivy locally: `docker run --rm -v "$PWD:/src" aquasec/trivy:latest fs --severity HIGH,CRITICAL --format sarif --output trivy.sarif /src` and confirm SARIF paths are repo-relative (design D2 risk mitigation)
- [ ] 3.2 Dry-run npm audit locally: `npm audit --audit-level=high` from repo root and confirm exit-code behavior (non-zero on findings ≥ high) matches the `continue-on-error: true` design
- [ ] 3.3 Validate workflow YAML syntax (e.g. `actionlint` or `openspec validate`) for `.github/workflows/scheduled-security.yml`
- [ ] 3.4 Trigger `workflow_dispatch` on `scheduled-security.yml` and verify: `trivy-sarif` artifact exists, SARIF alerts appear in Security tab under category `trivy`, `npm-audit` job logs findings without failing the run
- [ ] 3.5 Confirm no duplication: `security.yml` (Trivy `dependency-scan`) and `ci-enterprise.yml` (`dependency-audit`) are untouched (spec R1/R3 scenarios)
- [ ] 3.6 When syncing delta specs to main specs, amend the parent spec `openspec/specs/ci-scheduled-security-review/spec.md` (line 28 annotation): it claims `scheduled-security.yml` is owned by sibling changes `ci-secret-scanning` and `ci-security-enhance` (both archived 2026-08-07 / 2026-08-06); update to reflect that `scheduled-security.yml` is now owned by `ci-scheduled-trivy` (`security.yml` remains owned by the archived `ci-security-enhance`)
