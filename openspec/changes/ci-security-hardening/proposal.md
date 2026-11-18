## Why

GitHub is removing the Node 20 runtime from hosted runners on **2026-09-16**, which will break every GitHub Action still running on `node20`. A live web-verified audit (Aug 2026) found the 8 active workflows use multiple node20-runtime actions (`setup-node@v4` x6, `checkout@v4` x1, `gitleaks-action@v2`, plus deprecated artifact actions and unverified third-party majors), along with enterprise-security gaps: deprecated `upload-artifact`/`download-artifact` majors without security patches, error-masking (`continue-on-error` on scan jobs), a suppressed typecheck step, over-privileged workflow permissions, missing `timeout-minutes` and `concurrency` controls, unpinned action versions, and no failure alerting for scheduled cron scans. `ci-enterprise.yml` is a preserved zombie workflow and is explicitly out of scope.

## What Changes

- **Block 1 — CRITICAL (Node 20 removal deadline 2026-09-16):** migrate node20-runtime actions to node24-runtime majors across all 8 workflows + the `setup-monorepo` composite:
  - `actions/setup-node@v4` → `v5` (6 usages: `deploy.yml:73`, `preview.yml:70`, `quality.yml:28`, `release.yml:19`, `security.yml:23`, `setup-monorepo/action.yml:7`)
  - `actions/checkout@v4` → `v6` (`release.yml:15`; the rest of the repo is already on `@v5`/node24)
  - `gitleaks/gitleaks-action@v2` → `v3` (`security.yml:83`)
  - `actions/upload-artifact@v4` → `v5` (`scheduled-security.yml:29`, `security-digest.yml:29,47,103`, `security.yml:125`) and `actions/download-artifact@v4.2.1` → `v5` (`security-digest.yml:61,66,89`)
  - `changesets/action@v1` → `v2` (`release.yml:29`); `aws-actions/configure-aws-credentials@v4` → `v6.x` (`deploy.yml:177,216,333`) + `role-session-name: gha-${{ github.run_id }}` + `role-duration-seconds: 900`
  - Verify-before-touch prerequisite for third-party majors: `dorny/paths-filter@v3`, `dorny/test-reporter@v3`, `peter-evans/find-comment@v3`, `peter-evans/create-or-update-comment@v4`, `actions/cache@v4`, `actions/github-script@v7` — if the current major still runs node20, plan the corresponding major bump. `.nvmrc` (22.23.1) is the project's _local_ Node version and is independent of the actions runtime (documented in design).
- **Block 2 — HIGH:** `upload-artifact`/`download-artifact` to `v5` (above); Trivy `0.33.1` → `0.36.0` with `exit-code: '1'`, `format: sarif`, `output`, `ignore-unfixed: true` and SARIF upload via `codeql-action/upload-sarif` (`security.yml` dependency-scan job); `google/osv-scanner-action@v2.3.8` → `v2.5.0` (`security-digest.yml:42`).
- **Block 3 — MEDIUM/LOW general hardening:**
  - Third-party actions versionado por tag; Dependabot (`github-actions` ecosystem, already configured) gestiona updates (decisión 2026-08-11: sin SHA pinning).
  - Least-privilege `permissions:`: `ci.yml:3-6` — drop workflow-level `pull-requests: write`, move `checks: write` to the jobs that run `dorny/test-reporter`; `security.yml` `sbom` job — drop `actions: write`, keep `contents: read`.
  - `timeout-minutes` on jobs without it: `quality` (quality.yml), `release` (release.yml), `gitleaks-full-scan` (scheduled-security.yml), all 3 jobs (security-digest.yml), all 5 jobs (security.yml), `changes` (ci.yml).
  - `concurrency` in `release.yml` (`group: release`, `cancel-in-progress: false`) and `security.yml` (`group: security-${{ github.ref }}`, `cancel-in-progress: true`).
  - Remove typecheck suppression (`quality.yml:62-63` `|| echo "Typecheck skipped"`).
  - Remove `continue-on-error` masking: `scheduled-security.yml:16` (gitleaks job) and `security-digest.yml:45` (OSV step); scan reports/SARIF still uploaded via `if: always()` on the upload steps so visibility is preserved (fail-closed scans, fail-open reporting).
  - Cron failure notification job (GitHub issue via `github-script`) for `scheduled-security.yml` and `security-digest.yml`.
  - CodeQL `language: actions` (`security.yml:50-52`) so the workflows themselves are scanned.
  - Harden-Runner (step-security) evaluated in design; applied at least to `deploy.yml` OIDC jobs.
  - **Optional LOW:** parametrize hardcoded `us-east-1` (`deploy.yml:180,188-189,254,370`) via repo `vars`.
- **Docs:** verify/correct `docs/cicd-estado-actual.md` claims about which workflows use the `setup-monorepo` composite; update action-version tables in `docs/workflows-mantenimiento-guia.md` (`setup-node@v4`, `cache@v4`, `configure-aws-credentials@v4`, `find-comment@v3`, `create-or-update-comment@v4`, artifact actions) after the bumps.

## Capabilities

### New Capabilities

- `ci-actions-node24-runtime`: all GitHub Actions used by the 8 active workflows (and the `setup-monorepo` composite) run on Node 24+ runtimes (or a verified node24 major) ahead of the 2026-09-16 Node 20 removal; version bumps for deprecated/old majors (upload/download-artifact, osv-scanner, changesets, configure-aws-credentials, trivy-action) land in the same change.
- `ci-workflow-hardening`: least-privilege workflow/job permissions, `timeout-minutes` on all jobs, `concurrency` controls on release/security, no error suppression (typecheck, scan masking), CodeQL `actions` language coverage, cron failure notification, and harden-runner on OIDC jobs.

### Modified Capabilities

- `ci-secret-scanning`: the scheduled full-history Gitleaks scan changes from audit-mode (fail-open) to fail-closed on findings while still uploading JSON + SARIF reports; licensed `gitleaks-action@v2` → `v3`; scan job gets `timeout-minutes` and a cron failure notification job.
- `ci-scheduled-security-review`: the OSV vulnerability review changes from fail-open to fail-closed while still uploading the report; `osv-scanner-action` 2.3.8 → 2.5.0; `upload-artifact`/`download-artifact` → v5; jobs get `timeout-minutes` and a cron failure notification job.
- `ci-supply-chain-security`: Trivy filesystem scan becomes fail-closed (exit-code 1) with SARIF output uploaded to the Security tab and `ignore-unfixed: true`; SBOM artifact upload moves `upload-artifact@v4` → `v5`; the `sbom` job drops `actions: write` (least privilege).

## Impact

- **Workflows (8 active):** `ci.yml`, `deploy.yml`, `preview.yml`, `quality.yml`, `release.yml`, `scheduled-security.yml`, `security-digest.yml`, `security.yml`. Excluded: `ci-enterprise.yml` (preserved zombie).
- **Composite action:** `.github/actions/setup-monorepo/action.yml` (`setup-node@v4` → `v5`).
- **Action majors bumped:** setup-node, checkout, gitleaks-action, upload-artifact, download-artifact, changesets, configure-aws-credentials, trivy-action, osv-scanner-action; verified-and-bumped-if-needed: paths-filter, test-reporter, find-comment, create-or-update-comment, cache, github-script.
- **Docs:** `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md` (version tables).
- **No app-code or API impact:** backend (Express/Prisma), frontend (React/Vite) and e2e (Playwright) workspaces are untouched; `.nvmrc` unchanged.
- **Dependabot:** already configured for `github-actions`; continues to manage version-tag updates.
- **Out of scope:** `ci-enterprise.yml`, AWS OIDC trust-policy verification (requires user's AWS access), migrating local Node to 24 (`.nvmrc` stays 22.23.1).
