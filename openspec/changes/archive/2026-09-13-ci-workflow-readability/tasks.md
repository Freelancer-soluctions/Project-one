## 1. Preparation

- [x] 1.1 Read current `.github/workflows/ci.yml` fully and confirm line numbers of all job blocks (repo-discovery, verify-signatures, commit-lint, pr-title-lint, dco, dependency-review, sast, ci-complete, zombie-workflow-guard, and all `if: false` jobs)
- [x] 1.2 Confirm the 4 ruleset-bound job `name:` values are exactly: `Verify Commit Signatures`, `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`
- [x] 1.3 Confirm `ci-complete.needs` does NOT include `sast`

## 2. Section Header Rename

- [x] 2.1 Rename L17-19 header `STAGE 1: INICIACIÓN` → `ENTRY — Detect Changes (path-filtered)`
- [x] 2.2 Rename L47-49 header `STAGE 2: PRE-BUILD QUALITY` → `STAGE 2: PRE-BUILD — VALIDATE (source code, 0 dependencia de build)`
- [x] 2.3 Rename L774-776 header `STAGE 5: CI-COMPLETE` → `AGGREGATOR — CI Complete`

## 3. Move SAST Block

- [x] 3.1 Move the entire `sast` job block (L757-772) from its current position to immediately after the `dco` job block, within the STAGE 2 section
- [x] 3.2 Verify the moved block preserves its `continue-on-error: true`, `needs: repo-discovery`, `if: github.event_name == 'pull_request'` unchanged
- [x] 3.3 Verify the comment `# NOT in ci-complete.needs — SAST is a standalone gate` travels with the block

## 4. Add Placeholder Sections for Stages 5–11

- [x] 4.1 Add commented block after ci-complete: `# ═══ STAGE 5: ARTIFACT & SIGN (empaquetado, firma, publicación) ═══` (exact §23.3 L2926, tilde included) with note that it lives in `security.yml` / `deploy.yml` (both `disabled_manually`)
- [x] 4.2 Add commented block: `# ═══ STAGE 6: DEPLOY STAGING (entorno de validación) ═══` (exact §23.3 L2955, tilde included) — same note about deploy.yml
- [x] 4.3 Add commented block: `# ═══ STAGE 7: POST-DEPLOY — ACCEPT (app desplegada corriendo) ═══` (exact §23.3 L2985) — same note
- [x] 4.4 Add commented block: `# ═══ STAGE 8: PERFORMANCE (stability + performance gated) ═══` (exact §23.3 L3021) — same note
- [x] 4.5 Add commented block: `# ═══ STAGE 9: APPROVAL & GOVERNANCE (human gate + compliance) ═══` (exact §23.3 L3040) — same note
- [x] 4.6 Add commented block: `# ═══ STAGE 10: DEPLOY PRODUCTION (release) ═══` (exact §23.3 L3070) — same note
- [x] 4.7 Add commented block: `# ═══ STAGE 11: MONITOR & CLEANUP (observability + limpieza) ═══` (exact §23.3 L3104) — same note

## 5. Final Physical Order Verification

- [x] 5.1 Verify ci.yml job blocks appear in this exact order: repo-discovery → verify-signatures → commit-lint → pr-title-lint → dco → sast → (if:false quality jobs) → test-unit-client → test-unit-server → dependency-review → client-build → server-build → (if:false sonarqube/coverage/depcheck) → test-integration → test-smoke → e2e → ci-complete → zombie-workflow-guard. NOTE: the old header `# EXISTING TEST JOBS (re-wired to repo-discovery)` (L828-830) must be ELIMINATED in the reorder — test-unit-\* move to STAGE 2, test-integration/test-smoke/e2e move to STAGE 4, so the old grouping header disappears (no orphan header left behind).
- [x] 5.2 Verify every section header uses the exact name from §23.3 of `docs/ci-cd-pipeline-empresarial.md`
- [x] 5.3 Verify the 4 ruleset-bound `name:` values are UNCHANGED
- [x] 5.4 Verify `ci-complete.needs` array is UNCHANGED (sast NOT present)

## 6. Behavior Preservation Check

- [x] 6.1 Run `git diff .github/workflows/ci.yml` and confirm the diff shows ONLY line moves and comment renames — zero changes to `name:`, `needs:`, `if:`, `continue-on-error:`, or `steps:` content
- [x] 6.2 Spot-check: `verify-signatures.name` == `Verify Commit Signatures` (ruleset-bound)
- [x] 6.3 Spot-check: `commit-lint.name` == `Commit Lint (Conventional Commits)` (ruleset-bound)
- [x] 6.4 Spot-check: `pr-title-lint.name` == `PR Title Lint` (ruleset-bound)
- [x] 6.5 Spot-check: `dco.name` == `DCO` (ruleset-bound)
- [x] 6.6 Spot-check: `sast.name` == `SAST (Semgrep)` (NOT ruleset-bound, but must not change)
- [x] 6.7 Spot-check: `ci-complete.needs` does NOT contain `sast`
- [x] 6.8 Spot-check: `ci-complete.name` == `CI Complete` (candidate for future ruleset binding)
- [x] 6.9 Verify no `if: false` jobs were activated
- [x] 6.10 Verify no `CI_MINIMAL` references were modified

## 7. Documentation Update Assessment

- [x] 7.1 Read `docs/learning/ci-cd/24-dag-infraestructura.md` and determine if it references ci.yml section headers or job positions that need updating after the reorder
- [x] 7.2 If yes, update the affected references in that doc to match the new header names
