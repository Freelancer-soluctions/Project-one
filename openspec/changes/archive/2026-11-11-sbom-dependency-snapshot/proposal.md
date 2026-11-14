## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` and deep internet research (§8.12 of `docs/research/prebuild-security-stage-analysis.md`) confirm that the repo already generates SBOMs via `anchore/sbom-action` (SPDX format). However, the `dependency-snapshot` option is not enabled, which means transitive dependencies are not uploaded to GitHub's Dependency submission API. Enabling it would improve Dependabot's coverage of transitive dependencies, enhancing SCA capabilities at no additional cost.

This is a small, low-risk change that improves the security posture without adding new jobs or gates.

## What Changes

- Enable `dependency-snapshot: true` in the `anchore/sbom-action` step of `.github/workflows/security.yml` and `.github/workflows/security-digest.yml` (the two workflows that actually use `anchore/sbom-action`). `scheduled-security.yml` is out of scope: its SBOM uses `npm sbom` (no snapshot capability).
- Verify that the `github-token` permission is available for the dependency submission API.
- Update documentation to reflect the improved Dependabot coverage.

## Capabilities

### New Capabilities

- `sbom-dependency-snapshot`: enable dependency submission to GitHub's Dependency API for improved Dependabot transitive dependency coverage.

## Impact

- **Workflows:** `.github/workflows/security.yml` (SBOM job), `.github/workflows/security-digest.yml` (SBOM job). `scheduled-security.yml` is out of scope (uses `npm sbom`, no snapshot capability).
- **Docs:** `docs/CONTEXT-CICD.md` or `docs/learning/quality-gates.md`.
- **Sin cambios en código de aplicación.** Sin cambios de schema ni API.
- **Coordinación:** Independiente de todos los demás changes. Puede aplicarse en cualquier momento.
