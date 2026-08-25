## 1. Level 2 — PR Dependency Gate

- [ ] 1.1 Create `.github/workflows/dependency-review.yml` running `actions/dependency-review-action` on `pull_request`, failing on new moderate+ vulnerabilities. Wire to ci-complete gate. **Esfuerzo: 2-3h**
- [ ] 1.2 Keep PR Title Lint as optional (continue-on-error: true) — NOT a governance gate per enterprise verification. No changes needed. **Esfuerzo: 0h (verify existing)**

## 2. Level 3 — Merge Gates (Admin Actions)

- [ ] 2.1 Prepare full PUT payload for Admin-2: `PUT /repos/{owner}/{repo}/rulesets/21227644` with required reviews (≥1, dismiss stale, last push), required linear history, block force pushes, required status checks (ci-complete ONLY — DCO excluded, internal repo), CODEOWNERS enforcement. Document handoff as blocked-until-admin. **Esfuerzo: 2-3h**
- [ ] 2.2 Document Admin-1 `squash_merge_commit_title` settings: change to `PR_TITLE` + `COMMIT_MESSAGES` to enforce linear history and preserve conventional commit format. Document handoff as blocked-until-admin. **Esfuerzo: 0.5h**

## 3. Level 4 — Post-Merge Deploy Gating

- [ ] 3.1 Create `.github/workflows/deploy-gating.yml` orchestrating staging/production GitHub Environments with required reviewers. **Note**: deployment target and health-check endpoint must be defined before implementation (currently undefined — document as future). **Esfuerzo: 4-8h (when deploy target defined)**
- [ ] 3.2 Create `.github/workflows/smoke-test.yml` probing the health-check endpoint post-deploy and failing on unhealthy response. **Note**: requires health-check endpoint URL (currently undefined — document as future). **Esfuerzo: 4-8h (when endpoint defined)**

## 4. Rollback Strategy

- [ ] 4.1 Create `docs/runbooks/rollback.md` documenting layered rollback procedure (kill-switch < traffic shift < git revert < DB expand/contract). **Note**: documents procedure assuming existing infrastructure; does NOT implement feature-flag system. **Esfuerzo: 2-4h**
- [ ] 4.2 Create `docs/runbooks/fix-forward.md` documenting when fix-forward is preferred over rollback. **Esfuerzo: 2-4h**

## 5. Level 5 — Audit Streaming

- [ ] 5.1 Document org/enterprise audit-log streaming configuration (SIEM integration) and compliance evidence-collection process. **Note**: audit streaming is org-level feature (GHEC/GHES), not a repo workflow. This task documents the procedure, not a workflow file. **Esfuerzo: 2-4h**

## 6. Documentation

- [ ] 6.1 Update `CONTRIBUTING.md` with governance gates documentation (Levels 2-5, verification corrections from D7, repository classification). **Esfuerzo: 1-2h**

---

## Summary

| Task | Level |     Status      | Blocked By      |
| ---- | :---: | :-------------: | --------------- |
| 1.1  |  L2   |  Implementable  | —               |
| 1.2  |  L2   |   Verify only   | —               |
| 2.1  |  L3   | Prepare payload | Admin-2         |
| 2.2  |  L3   |    Document     | Admin-1         |
| 3.1  |  L4   |     Future      | Deploy target   |
| 3.2  |  L4   |     Future      | Health endpoint |
| 4.1  |  L4   |  Implementable  | —               |
| 4.2  |  L5   |  Implementable  | —               |
| 5.1  |  L5   |    Document     | —               |
| 6.1  |  Doc  |  Implementable  | —               |

**Implementable now**: 1.1, 4.1, 4.2, 5.1, 6.1 (5 tasks)
**Blocked by admin**: 2.1, 2.2 (2 tasks)
**Blocked by infra**: 3.1, 3.2 (2 tasks)
**Verify only**: 1.2 (1 task)
