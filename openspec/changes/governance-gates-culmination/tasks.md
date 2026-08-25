## 1. Level 2 — PR Dependency Gate

- [ ] 1.1 Create `.github/workflows/dependency-review.yml` running `actions/dependency-review-action` on `pull_request`, failing on new moderate+ vulnerabilities (Task 1)
- [ ] 1.2 Keep PR Title Lint as optional (continue-on-error: true) — NOT a governance gate per enterprise verification (Task 2)

## 2. Level 3 — Merge Gates (Admin Actions)

- [ ] 2.1 Document Ruleset PUT requirements for Admin-2: full `PUT /repos/{owner}/{repo}/rulesets/21227644` with required reviews, linear history, no force push, required checks (DCO, ci-complete), CODEOWNERS enforcement (Task 3)
- [ ] 2.2 Document Admin-1 `squash_merge_commit_title` settings (PR_TITLE + COMMIT_MESSAGES) to enforce linear history (Task 4)

## 3. Level 4 — Post-Merge Deploy Gating

- [ ] 3.1 Create `.github/workflows/deploy-gating.yml` orchestrating staging/production GitHub Environments with required reviewers (Task 5)
- [ ] 3.2 Create `.github/workflows/smoke-test.yml` probing the health-check endpoint post-deploy and failing on unhealthy response (Task 6)

## 4. Rollback Strategy

- [ ] 4.1 Create `docs/runbooks/rollback.md` documenting layered rollback (kill-switch < traffic shift < git revert < DB expand/contract) (Task 7)
- [ ] 4.2 Create `docs/runbooks/fix-forward.md` documenting when fix-forward is preferred over rollback (Task 8)

## 5. Level 5 — Audit Streaming

- [ ] 5.1 Create `.github/workflows/audit-log-streaming.yml` (or document SIEM integration) to stream GitHub audit logs to external store (Task 9)

## 6. Documentation

- [ ] 6.1 Update `CONTRIBUTING.md` with governance gates documentation (Levels 2-5, verification corrections from D7) (Task 10)
