## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` requires that third-party actions be pinned to full-length commit SHAs (G8: "actions de terceros fijadas por SHA"). Deep internet research (§8.7 of `docs/research/prebuild-security-stage-analysis.md`) confirms that:

- GitHub supports enforcing SHA pinning at enterprise/org/repo level via allowed-actions policy.
- Dependabot's github-actions ecosystem can keep SHAs updated automatically.
- Workflow dependency lockfiles (newer) supersede SHA pinning for full transitive pinning.
- OWASP 2026 and GitHub docs both recommend SHA pinning as the most reliable immutable reference.

The repo already pins most actions (setup-uv, gitleaks, etc.) but several remain tag-pinned: `dependency-review-action@v5`, `checkov-action@v12`, `sbom-action@v0.24.0`, `hadolint-action@v3.1.0`. These are supply chain risks: a compromised tag can redirect to malicious code (as happened with `tj-actions/changed-files` in March 2025 and `aquasecurity/trivy-action` in March 2026).

## What Changes

- SHA-pin all remaining tag-pinned third-party actions in `.github/workflows/ci.yml`, `.github/workflows/security.yml`, and `.github/workflows/scheduled-security.yml`.
- Add version comments next to each SHA for traceability.
- Verify that Dependabot's github-actions ecosystem is configured to keep SHAs updated.
- Enforce SHA pinning at the repo level via allowed-actions policy (documentation step).

## Capabilities

### New Capabilities

- `sha-pinning-remaining-actions`: pin all third-party actions to full-length commit SHAs with version comments and Dependabot automation.

## Impact

- **Workflows:** `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `.github/workflows/scheduled-security.yml`.
- **Repo config:** `.github/dependabot.yml` (verify github-actions ecosystem is configured).
- **Sin cambios en código de aplicación.** Sin cambios de schema ni API.
- **Coordinación:** Puede aplicarse en paralelo con cualquier otro change. No depende de Phase 0.
