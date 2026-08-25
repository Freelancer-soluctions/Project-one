# Proposal: Governance Gates Culmination — Enterprise-Grade CI/CD Enforcement

## Repository Classification

**project-one** is an **internal repository** (personal simulation for enterprise learning).

| Control           | Applicability | Reason                                                                |
| ----------------- | :-----------: | --------------------------------------------------------------------- |
| DCO               |  ✅ Required  | Enterprise provenance control (implemented in pr-metadata-governance) |
| Signed commits    |  ⚠️ Optional  | Learning purposes, enforced for practice                              |
| PR Title Lint     |  ⚠️ Optional  | Cosmetic, not compliance                                              |
| PR Template       |  ⚠️ Optional  | Not enforceable by GitHub                                             |
| Dependency review |  ✅ Required  | Supply-chain control, universal                                       |
| Required reviews  |  ✅ Required  | Universal enterprise gate                                             |
| Rulesets          |  ✅ Required  | Universal enforcement layer                                           |

## Why

Current enterprise governance posture is ~55-60% maturity. Two admin actions block Level 2/3 enforcement, and Levels 4-5 (post-merge deploy gating, rollback, audit streaming) are unstarted. We must close these gaps to reach ~95% enterprise governance maturity and satisfy SOC2/ISO27001 compliance evidence requirements.

This change is grounded in VERIFIED enterprise practices from Google, Meta, Microsoft, Netflix, Swissquote, and GitHub. Corrections were applied after verification: PR Title Lint is demoted to optional (cosmetic, not a compliance control), PR Template is removed from compliance scope (not enforceable by GitHub), signed commits are scoped to regulated repositories only (selective, not org-wide). DCO is confirmed as an enterprise provenance control and is REQUIRED (already implemented in pr-metadata-governance change).

## What Changes

- **Level 2 — PR gates**: Add a `dependency-review` workflow that fails on new vulnerabilities (severity >= moderate) and blocks merge via the `ci-complete` fan-in gate.
- **Level 3 — Merge gates**: Expand ruleset `21227644` (full PUT replace) with required reviews (>=1 approval, dismiss stale, require last push), required linear history, force-push blocking, required status checks (DCO + ci-complete), and CODEOWNERS review enforcement. **DCO is REQUIRED** (enterprise provenance control, already implemented in pr-metadata-governance).
- **Level 4 — Post-Merge**: Configure GitHub Environments for staging/production with required reviewers, post-deploy smoke tests (health-check endpoint), and a deploy verification workflow.
- **Level 5 — Audit**: Document audit log streaming configuration (org/enterprise-level, not repo workflow) and compliance evidence collection process with a quarterly review cadence.
- **Rollback**: Document a layered rollback strategy (kill-switch < traffic shift < git revert < DB expand/contract) with runbooks and fix-forward documentation.

### Enterprise Verification Corrections (applied)

- PR Title Lint → **optional in Phase 1** (cosmetic, not a compliance control; will be blocking in Phase 2 of rollout per pr-metadata-governance D7)
- PR Template → **not enforceable** (removed from compliance scope)
- Signed commits → **selective** (regulated repositories only, not org-wide)
- DCO → **required** (enterprise provenance control, implemented in pr-metadata-governance)

### Conflict Resolution with pr-metadata-governance

This change is COMBINED with pr-metadata-governance for Admin-2 ruleset PUT:

- **Single PUT** to ruleset 21227644 with ALL required checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO, ci-complete)
- **Single documentation** of Admin-1 squash settings (PR_TITLE + COMMIT_MESSAGES)
- **PR Title Lint** will be blocking in Phase 2 of rollout (not in this change)

## Capabilities

### New Capabilities

- `dependency-review`: PR-level dependency vulnerability review that blocks merge on new moderate+ severity issues.
- `ruleset-expansion`: Expanded merge-boundary ruleset (reviews, linear history, no force push, required checks, CODEOWNERS).
- `deploy-gating`: GitHub Environments with required reviewers and post-deploy smoke verification.
- `rollback-strategy`: Layered rollback and fix-forward strategy with runbooks.
- `audit-streaming`: Audit log streaming to external store and compliance evidence process.

### Modified Capabilities

<!-- none -->

## Impact

- Affects: `.github/workflows/dependency-review.yml`, `.github/workflows/deploy-gating.yml`, `.github/workflows/smoke-test.yml`, `.github/workflows/audit-log-streaming.yml`, ruleset `21227644` (Admin-2 PUT), repo `squash_merge_commit_title` setting (Admin-1), `docs/runbooks/rollback.md`, `docs/runbooks/fix-forward.md`, `CONTRIBUTING.md`.
- Admin actions required: Admin-2 ruleset PUT (full replace), Admin-1 squash_merge_commit_title settings.
- Does NOT affect: existing commitlint, commit signing, or other existing workflows (ADD-only principle).
