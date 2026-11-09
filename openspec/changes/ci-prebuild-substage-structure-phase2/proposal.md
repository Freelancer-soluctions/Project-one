# Proposal

## Why

Phase 1 of `ci-prebuild-substage-structure` introduced 4 aggregator jobs and activated knip dead-code detection with `continue-on-error: true` (non-blocking). After 1 sprint of calibration, it's time to harden the pipeline: remove the continue-on-error safety valve, document baseline knip metrics, and verify all aggregator behaviors work correctly under both CI_MINIMAL=true and CI_MINIMAL=false paths. This Phase 2 change transitions dead-code detection from advisory to blocking and validates the full substage architecture end-to-end.

## What Changes

- **Remove `continue-on-error: true`** from `client-dead-code` and `server-dead-code` jobs, making knip dead-code findings blocking quality gates (same pattern as pr-title-lint/dco).
- **Document baseline knip metrics** — false positive counts, required ignores, and per-workspace calibration status for the Phase 2 decision gate.
- **Verify all 4 aggregator jobs** (`prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete`) report correctly in a test PR.
- **Verify `ci-complete`** depends on aggregators and passes when `CI_MINIMAL=true` (skipped aggregators treated as passing).
- **Verify knip dead-code jobs** run in the pipeline but don't block the merge (current Phase 1 behavior) — this is the baseline before removing continue-on-error.
- **Verify no regressions** in the existing 4 ruleset status checks (`verify-signatures`, `commit-lint`, `pr-title-lint`, `dco`).

## Capabilities

### New Capabilities

_(none — this is a hardening/validation change on existing capabilities)_

### Modified Capabilities

- `ci-prebuild-substage-structure`: Requirement 8 (dead-code jobs with `continue-on-error`) transitions from non-blocking to blocking. Requirement 9 (remove `continue-on-error` after calibration) is now satisfied. New verification scenarios added for aggregator reporting and ci-complete behavior under CI_MINIMAL.

## Impact

- **CI workflow**: `.github/workflows/ci.yml` — remove `continue-on-error: true` from `client-dead-code` and `server-dead-code`.
- **knip configuration**: `apps/client/knip.json`, `apps/server/knip.json` — may need ignore list updates based on baseline metrics.
- **CI behavior**: knip dead-code failures will now block PR merges (breaking change for teams that relied on advisory-only knip output).
- **No API or runtime changes** — CI pipeline only.
