## Context

The CI pipeline in `.github/workflows/ci.yml` contains ~30 jobs organized in a flat structure. The `ci-complete` aggregator depends on a manually-curated list of all jobs with no hierarchical grouping. Jobs created in `ci-quality-dag` (`client-dead-code`, `server-dead-code`) exist with `if: false` and have never been activated. The `sast` job (SAST Semgrep, diff-scoped via `--baseline-commit`) runs independently with `continue-on-error: true` but is not classified within any substage. The pipeline uses `vars.CI_MINIMAL=true` to gate all quality/build/test jobs (incremental CI design — §3.1 of CONTEXT-CICD.md).

## Goals / Non-Goals

**Goals:**

- Delimit STAGE 2 (PRE-BUILD — VALIDATE) into 4 named substages with aggregator jobs
- Activate knip dead-code detection as the first quality job (Phase 1: non-blocking)
- Classify existing `sast` job within substage 2A Governance
- Establish the substage pattern for future quality gate activation

**Non-Goals:**

- Activating other quality jobs (lint, format-check, typecheck, complexity, import-bounds, actionlint)
- Activating test or coverage jobs
- Enabling `security.yml` (separate change)
- Modifying the 4 ruleset status checks or their job names
- Implementing knip root from `ci-shifting-left` task A5 (deferred)
- Changing `CI_MINIMAL` value or `ci-complete` aggregator logic (only `ci-complete.needs` is restructured)

## Decisions

### D1: Aggregator Job Pattern — `needs` + `if: always()` per substage

**Decision:** Create 4 aggregator jobs (`prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete`) each using `needs: [<jobs-in-substage>]` and `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`.

**Needs arrays (verified by grep on ci.yml):**

- `prebuild-governance-complete.needs`: `[verify-signatures, commit-lint, pr-title-lint, dco]` (4 jobs; sast excluded, standalone per D5)
- `prebuild-quality-complete.needs`: `[client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, actionlint]` (13 jobs — Substage 2B CODE QUALITY)
- `prebuild-security-complete.needs`: `[dependency-review]` (1 job — Substage 2C SECURITY)
- `prebuild-unit-tests-complete.needs`: `[test-unit-client, test-unit-server, test-integration, test-smoke]` (4 jobs — Substage 2D UNIT TESTING; note: `test-e2e` and `coverage` do NOT exist as job names; coverage = `client-coverage`/`server-coverage`, separate jobs outside substage 2D)

**Rationale:** This follows the same pattern as `ci-complete` (§9.3.7 of CONTEXT-CICD.md). The `always()` ensures the aggregator runs even when upstream jobs are skipped (due to `if: false` or `CI_MINIMAL`). Each aggregator produces a single visible check per substage, making it easy to identify which substage failed.

**Alternatives considered:**

- _Single flat `ci-complete` with all jobs:_ current approach, but doesn't scale and obscures which substage failed
- _GitHub Actions job groups (matrix):_ adds complexity without solving the visibility problem
- _Separate workflow files per substage:_ breaks the single-file convention and complicates `ci-complete.needs`

### D2: ci-complete.needs Restructuring — depend on aggregators, not individual jobs

**Decision:** Change `ci-complete.needs` from the flat list of ~30 jobs to: `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete, prebuild-unit-tests-complete, verify-signatures, zombie-workflow-guard, repo-discovery]`.

**Rationale:** The aggregators already depend on their substage jobs (13 quality, 4 unit-tests, 1 security, 4 governance — total 22 jobs routed through 4 aggregators). `ci-complete` only needs the aggregators (plus `verify-signatures` which is a required ruleset check and should not be hidden behind an aggregator, `zombie-workflow-guard` which is standalone, and `repo-discovery` for parity with ci.yml L781). This makes `ci-complete.needs` stable — adding a job to a substage only requires updating the substage aggregator, not `ci-complete`.

> **Inventory note:** The real job inventory was verified by grep on `.github/workflows/ci.yml`. The initial version of this design omitted `format-check`, `typecheck`, `complexity`, and `actionlint` from the 2B quality list, and referenced `test-e2e`/`coverage` which do not exist as job names in ci.yml (coverage is `client-coverage`/`server-coverage`). This revision corrects all lists to match the actual workflow.

**Alternatives considered:**

- _Keep flat list:_ works but fragile; every new job requires editing two places (substage header + ci-complete.needs)
- _Depend on all aggregators only (no verify-signatures/repo-discovery/zombie-workflow-guard):_ risky — `verify-signatures` is a required ruleset check, `repo-discovery` and `zombie-workflow-guard` are standalone jobs; hiding them behind aggregators could mask failures

### D3: knip Activation — Phase 1 non-blocking, Phase 2 blocking

**Decision:** Activate `client-dead-code` and `server-dead-code` in two phases:

- **Phase 1 (this change):** `if: needs.repo-discovery.outputs.client == 'true'` (or server), `continue-on-error: true` → non-blocking, reports but doesn't fail the build
- **Phase 2 (future, 1 sprint later):** Remove `continue-on-error` → blocking quality gate

**Rationale:** knip 6.32.2 is installed but has never run against the codebase. Phase 1 allows calibration — identifying false positives, tuning `knip.json` ignores, and establishing baseline metrics. Phase 2 promotes to blocking once the team is confident in the signal quality. This matches the incremental CI design philosophy (§3.1).

**Alternatives considered:**

- _Activate directly as blocking:_ risks blocking merges on false positives from uncalibrated knip config
- _Only Phase 1 (never block):_ defeats the purpose of quality gates

### D4: knip.json Schema Version — bump knip@5 → knip@6 per-workspace

**Decision:** Update `$schema` in `apps/client/knip.json` and `apps/server/knip.json` from `knip@5` to `knip@6` to match the installed version (6.32.2). No root `knip.json` (deferred to `ci-shifting-left` A5).

**Rationale:** The installed knip binary is 6.32.2 but the schema references version 5. This mismatch could cause incorrect validation or missing features. Updating per-workspace keeps the schema in sync with the binary. Root knip.json is explicitly out of scope per `ci-shifting-left` A5 trazability.

**Alternatives considered:**

- _Create root knip.json:_ conflicts with `ci-shifting-left` A5 which is a separate change
- _Leave schema at v5:_ may cause validation issues with knip 6 features

### D5: Substage Classification — sast in 2A Governance (asymmetric)

**Decision:** Classify the existing `sast` job within substage 2A (Governance) via YAML header comment only. `sast` is **NOT** included in `prebuild-governance-complete.needs` — it remains standalone per §9.3.9. The header comment `# SUBSTAGE 2A: GOVERNANCE` lists sast for visual grouping, but the aggregator dependency is `[verify-signatures, commit-lint, pr-title-lint, dco]`.

**Rationale:** The `sast` job is a governance layer (§9.3.9 of CONTEXT-CICD.md) — it validates code quality via static analysis. It already runs on every PR to main regardless of `CI_MINIMAL` and uses `--baseline-commit` for diff-scoping. However, including it in `prebuild-governance-complete.needs` would break semantics: when `CI_MINIMAL=true`, the aggregator skips (via its `if` gate) but `sast` still runs — making sast failures invisible to the aggregator. This is the same pattern as `ci-complete` which also does NOT depend on sast. The sast job is intentionally standalone (no upstream aggregator dependency) to preserve its always-run behavior.

**Asymmetry note (GitHub UI):** When `CI_MINIMAL=true`, the GitHub Actions UI will show `sast` as the only visible job in the 2A section (the other 4 governance jobs are skipped by CI_MINIMAL, and the aggregator is also skipped). This asymmetry is accepted by design — sast's standalone nature means it provides governance value even in minimal CI mode.

**Alternatives considered:**

- _Add sast to prebuild-governance-complete.needs:_ rejected — breaks semantics (aggregator skips but sast runs, making failures invisible)
- _Classify in 2B Code Quality:_ misalignment — SAST is governance (security policy), not quality (linting/formatting)
- _Leave unclassified:_ loses the substage structure benefit

## Risks / Trade-offs

- **[Risk] Aggregator job failure masking** → Mitigation: `always()` ensures aggregators run; `needs` propagation means upstream failures are visible in the aggregator's dependency graph
- **[Risk] knip false positives block merges (Phase 2)** → Mitigation: Phase 1 calibration period (1 sprint); tune `knip.json` ignores based on real output
- **[Risk] ci-complete.needs restructuring breaks existing CI** → Mitigation: test in a PR first; the change is additive (new aggregators) + restructure (ci-complete.needs), not destructive
- **[Trade-off] 4 aggregator jobs add ~4 min CI time** → Acceptable: aggregators are lightweight (no commands, just `needs` resolution); the visibility benefit outweighs the marginal cost
- **[Trade-off] Phase 1 non-blocking may be ignored** → Mitigation: team约定 to review knip output in PR comments; promote to Phase 2 once baseline is established

## Migration Plan

1. Create all 4 aggregator jobs in `ci.yml` with `if: false` initially (don't activate yet)
2. Activate aggregators: set `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`
3. Update `ci-complete.needs` to depend on aggregators
4. Activate `client-dead-code` and `server-dead-code` with `continue-on-error: true`
5. Update `knip.json` schema versions
6. Add YAML headers for substage delimitation
7. Verify in a test PR that aggregators report correctly
8. After 1 sprint, create follow-up change to remove `continue-on-error` from dead-code jobs

**Rollback:** Revert `ci-complete.needs` to flat list; set dead-code jobs back to `if: false`; remove aggregator jobs. All changes are in `.github/workflows/ci.yml` — single file revert.

## Open Questions

None — all design decisions are resolved with the context provided.
