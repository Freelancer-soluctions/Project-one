## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` includes typosquatting detection (Socket, GuardDog) as one of the nine security jobs in substage 2C. The repo already has a `typosquat-guarddog` job (GuardDog v3.2.0) running advisory in FASE 1, wired to `repo-discovery` and producing SARIF. However, there is no OpenSpec change governing its promotion to blocking, its conditional execution on manifest/lockfile changes, or its false-positive calibration.

Deep internet research (§8.8 of `docs/research/prebuild-security-stage-analysis.md`) confirms that GuardDog has a **known high false-positive rate**: 2.2% on npm (263/12,111 packages) and 6.7% on PyPI (1,002/15,001-30,000). Issue #898 (open, 2026-10) documents bugs in the typosquatting heuristic. Promoting to blocking without calibration would cause excessive noise and developer friction.

This change governs the conditional execution, calibration period, and eventual promotion to blocking, following the PRD's Phase 5 and the established pattern of `containerfile-lint` and `iac-scanning`.

## What Changes

- Condition `typosquat-guarddog` on manifest/lockfile changes via `repo-discovery` outputs (already wired; verify and document).
- Promote to blocking from day one: remove `continue-on-error: true`, add to `prebuild-security-complete.needs`, rename job to drop "advisory"/"FASE 1" labels.
- Condition `typosquat-guarddog` on manifest/lockfile changes via `repo-discovery` outputs.
- Evaluate Socket (commercial) as an alternative if GuardDog's false-positive rate remains unacceptable after calibration.
- Update `docs/learning/quality-gates.md` taxonomy.

## Capabilities

### Modified Capabilities

- `typosquatting-detection`: conditional execution on manifest/lockfile changes, calibration period, promotion to blocking, false-positive tracking.

## Impact

- **Workflow:** `.github/workflows/ci.yml` — `typosquat-guarddog` job (promotion gated on calibration).
- **Docs:** `docs/learning/quality-gates.md`.
- **Sin cambios en código de aplicación.** Sin cambios de schema ni API.
- **Coordinación:** Depende de `prebuild-security-aggregator-strict` (Phase 0) para el wiring. Puede aplicarse en paralelo con `containerfile-lint` y `iac-scanning` (Phase 5).
