# Proposal: Governance Gates Culmination — Enterprise-Grade CI/CD Enforcement

## Repository Classification

**project-one** is an **internal repository** (personal simulation for enterprise learning).

| Control           | Applicability | Reason                                   |
| ----------------- | :-----------: | ---------------------------------------- |
| DCO               |   ❌ Exempt   | Internal repo, not OSS                   |
| Signed commits    |  ⚠️ Optional  | Learning purposes, enforced for practice |
| PR Title Lint     |  ⚠️ Optional  | Cosmetic, not compliance                 |
| PR Template       |  ⚠️ Optional  | Not enforceable by GitHub                |
| Dependency review |  ✅ Required  | Supply-chain control, universal          |
| Required reviews  |  ✅ Required  | Universal enterprise gate                |
| Rulesets          |  ✅ Required  | Universal enforcement layer              |

## Why

Current enterprise governance posture is ~55-60% maturity. Two admin actions block Level 2/3 enforcement, and Levels 4-5 (post-merge deploy gating, rollback, audit streaming) are unstarted. We must close these gaps to reach ~95% enterprise governance maturity and satisfy SOC2/ISO27001 compliance evidence requirements.

This change is grounded in VERIFIED enterprise practices from Google, Meta, Microsoft, Netflix, Swissquote, and GitHub. Corrections were applied after verification: PR Title Lint is demoted to optional (cosmetic, not a compliance control), PR Template is removed from compliance scope (not enforceable by GitHub), signed commits are scoped to regulated repositories only (selective, not org-wide), and DCO is scoped to OSS repositories only (project-one is internal, therefore DCO exempt).

## What Changes

- **Level 2 — PR gates**: Add a `dependency-review` workflow that fails on new vulnerabilities (severity >= moderate) and blocks merge via the `ci-complete` fan-in gate.
- **Level 3 — Merge gates**: Expand ruleset `21227644` (full PUT replace) with required reviews (>=1 approval, dismiss stale, require last push), required linear history, force-push blocking, required status checks (ci-complete only), and CODEOWNERS review enforcement. **DCO is excluded** (internal repo, not OSS).
- **Level 4 — Post-Merge**: Configure GitHub Environments for staging/production with required reviewers, post-deploy smoke tests (health-check endpoint), and a deploy verification workflow.
- **Level 5 — Audit**: Document audit log streaming configuration (org/enterprise-level, not repo workflow) and compliance evidence collection process with a quarterly review cadence.
- **Rollback**: Document a layered rollback strategy (kill-switch < traffic shift < git revert < DB expand/contract) with runbooks and fix-forward documentation.

### Enterprise Verification Corrections (applied)

- PR Title Lint → **optional** (cosmetic, not a compliance control)
- PR Template → **not enforceable** (removed from compliance scope)
- Signed commits → **selective** (regulated repositories only, not org-wide)
- DCO → **OSS-only** (project-one is internal, therefore exempt)

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
