# Proposal: Governance Pre-Merge Gates — Enterprise-Grade CI/CD Enforcement

## Repository Classification

**project-one** is an **internal repository** (personal simulation for enterprise learning).

| Control           | Applicability | Reason                                                                                       |
| ----------------- | :-----------: | -------------------------------------------------------------------------------------------- |
| DCO               |  ✅ Required  | Enterprise provenance control (implemented in ci-pr-metadata-governance)                     |
| Signed commits    |  ⚠️ Optional  | Learning purposes, enforced for practice                                                     |
| PR Title Lint     |  ⚠️ Optional  | Cosmetic, not compliance                                                                     |
| PR Template       |  ⚠️ Optional  | Not enforceable by GitHub                                                                    |
| Dependency review |  ✅ Required  | Supply-chain control, universal (control SECURITY preexistente — OUT OF SCOPE de governance) |
| Required reviews  |  ✅ Required  | Universal enterprise gate                                                                    |
| Rulesets          |  ✅ Required  | Universal enforcement layer                                                                  |

## Why

Current enterprise governance posture is ~55-60% maturity. Two admin actions block Level 2/3 enforcement. This change closes Levels 2-3 (pre-PR/merge) to reach ~70-75% repo-level maturity (GitHub Enterprise).

> **Scope note (2026-08-27)**: This change covers governance BEFORE the PR/merge ONLY (Levels 2-3). Post-merge capabilities (deploy gating, rollback, audit streaming — Levels 4-5) are OUT OF SCOPE and deferred to future changes (`ci-deploy-gating`, `ci-rollback-strategy`, `ci-audit-streaming`). The design documents them as reference (D3/D4/D5) but they are NOT implemented here.

This change is grounded in VERIFIED enterprise practices from Google, Meta, Microsoft, Netflix, Swissquote, and GitHub. Corrections were applied after verification: PR Title Lint is already required from ci-pr-metadata-governance (preserved here). PR Template is removed from compliance scope (not enforceable by GitHub). Signed commits are scoped to regulated repositories only (selective, not org-wide). DCO is confirmed as an enterprise provenance control and is REQUIRED (already implemented in ci-pr-metadata-governance change). SOC2 mapping verified: CC8.2 does NOT exist in AICPA 2017 criteria; change approval lives in CC8.1 only.

## What Changes

- **Level 2 — PR gates**: `dependency-review` is a **pre-existing SECURITY control** (implemented in `ci-security-enhance`, hardened in `ci-security-hardening`), wired as required via `ci-complete` fan-in gate. NOT a new governance capability — OUT OF SCOPE for this change. This change only enforces it via ruleset `required_status_checks`.
- **Level 3 — Merge gates**: Expand ruleset `21227644` (full PUT replace) with required reviews (>=1 approval, dismiss stale, require last push), required linear history, force-push blocking, required status checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO, ci-complete), and CODEOWNERS review enforcement. PR Title Lint and DCO are inherited from ci-pr-metadata-governance (already implemented, preserved in this change).
- ~~**Level 4 — Post-Merge**: OUT OF SCOPE — future `ci-deploy-gating`~~ (documented as reference in design D3/D10)
- ~~**Level 5 — Audit**: OUT OF SCOPE — future `ci-audit-streaming`~~ (documented as reference in design D5)
- ~~**Rollback**: OUT OF SCOPE — future `ci-rollback-strategy`~~ (documented as reference in design D4)

### Enterprise Verification Corrections (applied)

- PR Title Lint → **already required (blocking)** from ci-pr-metadata-governance; this change preserves it. Classified optional only as a compliance control (cosmetic, not mapped to SOC2/ISO)
- PR Template → **not enforceable** (removed from compliance scope)
- Signed commits → **selective** (regulated repositories only, not org-wide)
- DCO → **required** (enterprise provenance control, implemented in ci-pr-metadata-governance)

### Conflict Resolution with ci-pr-metadata-governance

This change is COMBINED with ci-pr-metadata-governance for Admin-2 ruleset PUT:

- **Single PUT** to ruleset 21227644 with ALL required checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO, ci-complete)
- **Single documentation** of Admin-1 squash settings (PR_TITLE + COMMIT_MESSAGES)
- **PR Title Lint** is already required from ci-pr-metadata-governance — this change preserves it

## Capabilities

### New Capabilities

- `ruleset-expansion`: Expanded merge-boundary ruleset (reviews, linear history, no force push, required checks, CODEOWNERS).

### Pre-existing Security Controls (OUT OF SCOPE — enforced via governance, not created)

- `dependency-review`: PR-level dependency vulnerability review (implemented in `ci-security-enhance` commit 39972c9, hardened to `@v5` in `ci-security-hardening` commit 7873cc6). Lives in `security.yml` as a SECURITY control. This change makes it REQUIRED via `ci-complete` fan-in + ruleset `required_status_checks` — it does NOT create it.

### Documented-Only Capabilities (OUT OF SCOPE — designed, deferred to future changes)

- `deploy-gating`: GitHub Environments with required reviewers and post-deploy smoke verification. → `ci-deploy-gating`
- `rollback-strategy`: Layered rollback and fix-forward strategy with runbooks. → `ci-rollback-strategy`
- `audit-streaming`: Audit log streaming to external store and compliance evidence process. → `ci-audit-streaming`

### Modified Capabilities

<!-- none -->

## Impact

- Affects: ruleset `21227644` (Admin-2 PUT), repo `squash_merge_commit_title` setting (Admin-1). **Does NOT create `.github/workflows/dependency-review.yml`** — dependency-review is a pre-existing SECURITY control in `security.yml` (wired to `ci-complete` via `ci-complete.needs`).
- Admin actions required: Admin-2 ruleset PUT (full replace), Admin-1 squash_merge_commit_title settings.
- Does NOT affect: existing commitlint, commit signing, or other existing workflows (ADD-only principle).
- Future (OUT OF SCOPE): `.github/workflows/deploy-gating.yml`, `.github/workflows/smoke-test.yml`, `docs/runbooks/rollback.md`, `docs/runbooks/fix-forward.md`, audit streaming, `CONTRIBUTING.md` — deferred to future changes.

## Spec Relocation Note (2026-08-27)

Per @planner verdict (Opción B), the change was renamed from `ci-governance-gates-culmination` to `ci-governance-pre-merge-gates` to accurately reflect its reduced scope (pre-PR/merge governance only, Levels 2-3). The three out-of-scope specs — `deploy-gating`, `rollback-strategy`, and `audit-streaming` — were physically relocated from `specs/` to `specs/OUT-OF-SCOPE/` within this change. They are preserved as reference but are NOT active ADDED Requirements of this change (they violated atomicity by implying post-merge coverage). Each is deferred to its own future change: `ci-deploy-gating`, `ci-rollback-strategy`, `ci-audit-streaming`.

**Dependency-review spec relocation (2026-08-27)**: The `dependency-review` spec was moved from `specs/dependency-review/` to `specs/OUT-OF-SCOPE/dependency-review/`. It is a **pre-existing SECURITY control** (from `ci-security-enhance`/`ci-security-hardening`), NOT a governance capability. This change only enforces it via `ci-complete` + ruleset — it does not create it. The spec is preserved as reference for the security control's behavior.
