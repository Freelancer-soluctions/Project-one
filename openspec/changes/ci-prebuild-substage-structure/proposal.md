## Why

The current CI pipeline in `ci.yml` has ~30 quality/build/test jobs but no structural delimitation between substage groups. The `ci-complete` aggregator depends on a flat list of jobs with no hierarchy — making it impossible to reason about which substage failed or to add/remove jobs from a group without editing `ci-complete.needs` manually. Additionally, the `client-dead-code` and `server-dead-code` jobs (knip-based dead code detection) were created in `ci-quality-dag` with `if: false` but never activated. Knip 6.32.2 is already installed in devDependencies; activating it as the first quality job provides immediate value (detect unused exports/dependencies) while establishing the substage pattern for future quality gates. The existing `sast` job (SAST Semgrep, diff-scoped, non-blocking) runs outside the substage structure — classifying it within substage 2A (Governance) provides a single check per substage without modifying the job itself.

## What Changes

- **Add 4 aggregator jobs** to `.github/workflows/ci.yml` — one per substage of STAGE 2 (PRE-BUILD — VALIDATE):
  - `prebuild-governance-complete`: depends on verify-signatures, commit-lint, pr-title-lint, dco (sast classified in substage 2A via YAML header but remains standalone — not in aggregator needs, per D5)
  - `prebuild-quality-complete`: depends on client/server-lint, format-check, typecheck, complexity, dead-code, import-bounds, actionlint
  - `prebuild-security-complete`: depends on dependency-review (+ security.yml jobs if ever enabled)
  - `prebuild-unit-tests-complete`: depends on test-unit-client, test-unit-server
  - All use `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` (same pattern as ci-complete)
- **Update `ci-complete.needs`** to depend on the 4 aggregator jobs + verify-signatures + zombie-workflow-guard + repo-discovery (instead of flat 30-job list)
- **Activate `client-dead-code` and `server-dead-code`** (knip): change `if: false` → `if: needs.repo-discovery.outputs.client == 'true'` (or server equivalent), with **Phase 1: `continue-on-error: true`** (non-blocking, 1 sprint calibration)
- **Add YAML headers** (`# SUBSTAGE 2A: GOVERNANCE — ...`, etc.) to delimit each substage in the workflow file
- **Update `apps/client/knip.json` and `apps/server/knip.json`** — change `$schema` from `knip@5` to `knip@6` (matches installed version 6.32.2); calibrate ignores if baseline fails
- **Document Phase 2** (future): remove `continue-on-error` from dead-code jobs → blocking quality gate

## Capabilities

### New Capabilities

None — this is a pure CI/CD tooling change. No application behavior changes (`skip_specs: true`).

### Modified Capabilities

None — existing CI specs (`ci-clean-manifest`, `ci-commit-lint-governance`, `ci-pr-metadata-governance`, etc.) describe application-level behavior and are unaffected by substage structure changes.

## Impact

- **`.github/workflows/ci.yml`** — 4 new aggregator jobs + ci-complete.needs restructured; dead-code jobs activated (if condition change); YAML headers added for substage delimitation
- **`apps/client/knip.json`** — `$schema` version bump knip@5 → knip@6
- **`apps/server/knip.json`** — `$schema` version bump knip@5 → knip@6
- **Branch protection** — no changes (the 4 ruleset status checks are unchanged; aggregators are informational until ci-complete is added to ruleset)
- **`docs/CONTEXT-CICD.md`** — §9.3.9 sast classification updated to reflect substage 2A Governance membership
- **Related changes (trazability)**: `ci-quality-dag` (created the if:false jobs — not modified here), `ci-shifting-left` A5 (knip root — NOT implemented here, only documented as deferred)
  OUT-OF-SCOPE: NOT activating other quality jobs (lint/format/typecheck/complexity/import-bounds/actionlint), NOT activating test/coverage jobs, NOT enabling security.yml, NOT touching CI_MINIMAL value, NOT renaming ruleset jobs, NOT touching merge queue, NOT implementing knip root from ci-shifting-left A5.
