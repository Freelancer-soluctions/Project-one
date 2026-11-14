## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` defines SCA (Software Composition Analysis) as one of the nine security jobs in substage 2C, with the lockfile as the source of truth. The repo already has a `lockfile-audit` job (`npm audit --audit-level=moderate`) running advisory in FASE 1, wired to `repo-discovery`. However, there is no OpenSpec change governing its promotion to blocking, its conditional execution on lockfile changes, or the addition of an OSV-Scanner step for broader ecosystem coverage.

Deep internet research (§8.3 of `docs/research/prebuild-security-stage-analysis.md`) confirms that:

- `npm audit` reads the lockfile and is suitable for CVE gating.
- OSV-Scanner (free, Apache-2.0) reads npm/yarn/pnpm/bun lockfiles and queries OSV DB (30+ sources), but does NOT compute EPSS or KEV natively (only CVSS). Full triage requires Snyk (commercial) or manual enrichment.
- The PRD's "explotabilidad (EPSS/KEV/reachability)" claim is only partially implementable with free tools.

This change governs the promotion of `lockfile-audit` to blocking and the optional addition of OSV-Scanner, following the PRD's Phase 3 and the established pattern of `containerfile-lint` and `typosquatting-detection`.

## What Changes

- Promote `lockfile-audit` to blocking from day one: remove `continue-on-error: true`, wire to `prebuild-security-complete.needs`, rename job to drop "advisory"/"FASE 1" labels.
- Add lockfile-mandatory verification step (custom, not a built-in GitHub feature).
- Add OSV-Scanner step as an optional enhancement for broader ecosystem coverage (npm/yarn/pnpm/bun), gated on lockfile changes (step-level gating, advisory).
- Update `docs/learning/quality-gates.md` taxonomy.

## Capabilities

### Modified Capabilities

- `sca-lockfile-compliance`: promotion to blocking, conditional execution, OSV-Scanner step, calibration period.

## Impact

- **Workflow:** `.github/workflows/ci.yml` — `lockfile-audit` job (promotion gated on calibration).
- **Docs:** `docs/learning/quality-gates.md`.
- **Sin cambios en código de aplicación.** Sin cambios de schema ni API.
- **Coordinación:** Depende de `prebuild-security-aggregator-strict` (Phase 0) para el wiring. Puede aplicarse en paralelo con otros Phase 5 changes.
