## 1. Level 2 — PR Dependency Gate

- [ ] 1.1 Create `.github/workflows/dependency-review.yml` running `actions/dependency-review-action` on `pull_request`, failing on new moderate+ vulnerabilities. Add job name `dependency-review` to `ci-complete.needs` array. **Job name MUST match the ruleset required-check name exactly** (per pr-metadata-governance D4 job-name-matching risk). **Esfuerzo: 2-3h**
- [ ] 1.2 Verify PR Title Lint exists with `continue-on-error: true` — will become blocking in Phase 2 of rollout (per pr-metadata-governance D7). **Esfuerzo: 0h (verify only)**

## 2. Level 3 — Merge Gates (Admin Actions — COMBINED)

- [ ] 2.1 Prepare COMBINED PUT payload for Admin-2. **Steps**:
  1. **GET** current ruleset: `GET /repos/{owner}/{repo}/rulesets/21227644`
  2. **Verify** which rules exist (especially `required_signatures` — do NOT assume it exists)
  3. **Merge** new rules into returned body: `required_pull_request` (≥1 review, dismiss stale, last push), `required_linear_history`, `block_force_pushes`, `require_code_owner_reviews`
  4. **Preserve** all existing `required_status_checks` from pr-metadata-governance: Verify Commit Signatures, Commit Lint, PR Title Lint, DCO, ci-complete
  5. **PUT** full body: `PUT /repos/{owner}/{repo}/rulesets/21227644`
  - **CRITICAL**: PUT is full replace — ALL rules must be in ONE payload
  - **CRITICAL**: Do NOT assume `required_signatures` exists — verify via GET first
  - **PR Title Lint**: Already required from pr-metadata-governance — this change preserves it (does NOT change its status)
  - Document handoff as blocked-until-admin. **Esfuerzo: 3-4h**
- [ ] 2.2 Document Admin-1 `squash_merge_commit_title` settings: change to `PR_TITLE` + `COMMIT_MESSAGES` (consistent with pr-metadata-governance D3). Document handoff as blocked-until-admin. **Esfuerzo: 0.5h**

## 3. Level 4 — Post-Merge Deploy Gating

- [ ] 3.1 Create `.github/workflows/deploy-gating.yml` orchestrating staging/production GitHub Environments with required reviewers. **Note**: deployment target and health-check endpoint must be defined before implementation (currently undefined — document as future). **Esfuerzo: 4-8h (when deploy target defined)**
- [ ] 3.2 Create `.github/workflows/smoke-test.yml` probing the health-check endpoint post-deploy and failing on unhealthy response. **Note**: requires health-check endpoint URL (currently undefined — document as future). **Esfuerzo: 4-8h (when endpoint defined)**

## 4. Rollback Strategy

- [ ] 4.1 Create `docs/runbooks/rollback.md` documenting layered rollback procedure (kill-switch < traffic shift < git revert < DB expand/contract). **Note**: documents the feature-flag kill-switch APPROACH (assumes feature-flag system is implemented separately, out of scope). Does NOT implement feature-flag system. **Esfuerzo: 2-4h**
- [ ] 4.2 Create `docs/runbooks/fix-forward.md` documenting when fix-forward is preferred over rollback. **Esfuerzo: 2-4h**

## 5. Level 5 — Audit Streaming

- [ ] 5.1 Document org/enterprise audit-log streaming configuration procedure (SIEM integration) and compliance evidence-collection process. **Note**: audit streaming is org-level feature (GHEC/GHES), not a repo workflow. This task documents the CONFIGURATION PROCEDURE, not a workflow file. **Esfuerzo: 2-4h**

## 6. Documentation

- [ ] 6.1 Update `CONTRIBUTING.md` with governance gates documentation (Levels 2-5, verification corrections from D7, repository classification). **Esfuerzo: 1-2h**

---

## Summary

| Task | Level |     Status      | Blocked By      | Notes                                                |
| ---- | :---: | :-------------: | --------------- | ---------------------------------------------------- |
| 1.1  |  L2   |  Implementable  | —               | Job name must match ruleset check exactly            |
| 1.2  |  L2   |   Verify only   | —               | PR Title Lint future blocking (Phase 2)              |
| 2.1  |  L3   | Prepare payload | Admin-2         | COMBINED PUT — GET first, verify required_signatures |
| 2.2  |  L3   |    Document     | Admin-1         | Consistent with pr-metadata-governance D3            |
| 3.1  |  L4   |     Future      | Deploy target   | —                                                    |
| 3.2  |  L4   |     Future      | Health endpoint | —                                                    |
| 4.1  |  L4   |  Implementable  | —               | Documents approach, not implementation               |
| 4.2  |  L5   |  Implementable  | —               | —                                                    |
| 5.1  |  L5   |    Document     | —               | Documents config procedure, not workflow             |
| 6.1  |  Doc  |  Implementable  | —               | —                                                    |

**Implementable now**: 1.1, 4.1, 4.2, 5.1, 6.1 (5 tasks)
**Blocked by admin**: 2.1, 2.2 (2 tasks — COMBINED with pr-metadata-governance)
**Blocked by infra**: 3.1, 3.2 (2 tasks)
**Verify only**: 1.2 (1 task)

---

## Conflict Resolution Notes

| Conflict                           | Resolution                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| DCO excluded from ruleset          | ✅ PRESERVED from pr-metadata-governance (already required there)                   |
| PR Title Lint optional vs blocking | ✅ CLARIFIED — Already required from pr-metadata-governance; preserved, not changed |
| Admin-2 PUT double modification    | ✅ COMBINED — Single PUT with all rules from both changes                           |
| Admin-1 duplication                | ✅ ELIMINATED — Documented once, consistent with D3                                 |
| required_signatures assumption     | ✅ FIXED — GET-first approach, verify before including                              |
| rollback-spec over-promises        | ✅ FIXED — "Document approach" not "provide"                                        |
| audit-spec over-promises           | ✅ FIXED — "Document configuration" not "configure"                                 |
