## Why

The current CI quality pipeline has zero parallelism and zero failure isolation. `quality.yml` is a single job with `if` step conditionals — if client lint fails, server format check never runs, and a single failure masks all other quality signals. The flat 9-job structure in `ci.yml` has no tiered dependency graph, so there is no guarantee that quality gates run before build, or that post-build analysis (SonarQube, coverage enforcement, depcheck, contract validation) runs against a compiled artifact. Enterprise CI patterns (SonarSource, GitLab, GitHub Well-Architected) confirm that a single YAML with a `needs` DAG — pre-build quality → build → post-build quality → aggregator — is the correct structure for parallel, isolated, fail-fast quality gates.

## What Changes

- **Restructure `.github/workflows/ci.yml`** from the current flat 9-job structure into a 5-stage enterprise pipeline:
  - **Stage 1 — Init**: `repo-discovery` (paths-filter) → `setup-monorepo` (composite action)
  - **Stage 2 — Pre-build quality** (parallel, `needs: repo-discovery` — `setup-monorepo` is a composite action, not a job): `client-lint`, `client-format-check`, `client-typecheck`, `client-complexity`, `client-dead-code`, `client-import-bounds` + server equivalents
  - **Stage 3 — Build** (`needs: [all pre-build jobs]`): `client-build` + `server-build`, each uploading artifacts via `actions/upload-artifact@v4`
  - **Stage 4 — Post-build quality** (parallel, `needs: build`): `client-sonarqube`, `client-coverage`, `client-depcheck`, `client-contract-val` + server equivalents
  - **Stage 5 — Aggregator**: `ci-complete` with `needs: [pre-build, build, post-build, test (unit/integration/smoke), e2e, zombie-workflow-guard, actionlint]` (matching task 4.1) and `if: always()` — a single required check in branch protection
- **Refactor `.github/workflows/quality.yml`** from the single-job-with-conditionals anti-pattern to separate parallel jobs (or inline into `ci.yml` per the single-YAML decision)
- **Update `docs/cicd-plan-implementacion.md`** with the new DAG architecture
- **No application behavior changes** — this is pipeline orchestration only (pure tooling), hence `skip_specs: true`

## Capabilities

### New Capabilities

None — this is a pure CI/CD tooling change. No application behavior changes, so no spec-level requirements are introduced or modified (`skip_specs: true` in `.openspec.yaml`).

### Modified Capabilities

None — existing specs (`ci-clean-manifest`, `ci-floci-dev-emulation`, etc.) describe application behavior and are unaffected by pipeline orchestration changes.

## Impact

- **`.github/workflows/ci.yml`** — full restructure into 5-stage DAG; existing test jobs (unit, integration, smoke, e2e) remain but are re-wired into the DAG tiers
- **`.github/workflows/quality.yml`** — refactored from single-job conditionals to parallel jobs, or removed if inlined into `ci.yml`
- **`.github/actions/setup-monorepo`** — reused by all jobs; no hardcoded Node version (`.nvmrc` via `node-version-file`)
- **`docs/cicd-plan-implementacion.md`** — architecture section updated
- **Branch protection** — required check changes from multiple checks to the single `ci-complete` aggregator
- **New tooling dependencies** (dev-time only, no runtime impact): `knip`, `dependency-cruiser`, `depcheck`, SonarQube scanner. `swagger-cli` is NOT added — contract validation deferred (D9); `actionlint` runs via pinned `rhysd/actionlint@v1` GitHub Action (D10)
- **Secrets**: `SONAR_TOKEN`, `SONAR_HOST_URL` required for SonarQube jobs
