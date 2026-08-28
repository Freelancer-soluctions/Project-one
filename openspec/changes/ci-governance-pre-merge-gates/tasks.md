## 1. Level 2 — PR Dependency Gate

- [x] 1.1 ~~Create `.github/workflows/dependency-review.yml`~~ → **OUT OF SCOPE**. `dependency-review` is a **pre-existing SECURITY control** (implemented in `ci-security-enhance` commit 39972c9, hardened to `@v5` in `ci-security-hardening` commit 7873cc6). Lives in `security.yml`. This change only enforces it as REQUIRED via `ci-complete` fan-in + ruleset `required_status_checks`. **NOT a governance deliverable**. Spec relocated to `specs/OUT-OF-SCOPE/dependency-review/`. **Esfuerzo: 0h (not a task of this change)**
  > **Reference**: The control exists in `.github/workflows/security.yml` (job `dependency-review`) and is wired to `ci-complete.needs` in `.github/workflows/ci.yml`. GHAS requirement applies (security domain concern).
- [x] 1.2 Verify PR Title Lint exists with `continue-on-error: true` — will become blocking in Phase 2 of rollout (per ci-pr-metadata-governance D7). **Esfuerzo: 0h (verify only)**
  > **Verified**: Job `pr-title-lint` exists in `.github/workflows/ci.yml` with `name: PR Title Lint` and `continue-on-error: true` (line 368)

## 2. Level 3 — Merge Gates (Admin Actions — COMBINED)

- [ ] 2.1 Prepare COMBINED PUT payload for Admin-2. **Steps**:
  1. **GET** current ruleset: `GET /repos/{owner}/{repo}/rulesets/21227644`
  2. **Verify** which rules exist (especially `required_signatures` — do NOT assume it exists)
  3. **Merge** new rules into returned body: `pull_request` (≥1 review, dismiss stale, last push — params: `required_approving_review_count`, `dismiss_stale_reviews_on_push`, `require_last_push_approval`, `require_code_owner_review`), `required_linear_history`, `non_fast_forward`
  4. **Preserve** all existing `required_status_checks` from ci-pr-metadata-governance: Verify Commit Signatures, Commit Lint, PR Title Lint, DCO, ci-complete
  5. **PUT** full body: `PUT /repos/{owner}/{repo}/rulesets/21227644`
  - **CRITICAL**: PUT is full replace — ALL rules must be in ONE payload
  - **CRITICAL**: Do NOT assume `required_signatures` exists — verify via GET first
  - **PR Title Lint**: Already required from ci-pr-metadata-governance — this change preserves it (does NOT change its status)
  - Document handoff as blocked-until-admin. **Esfuerzo: 3-4h**
    > CORRECCIÓN API (2026-08-26, research): los strings de tipo en el payload deben ser: `pull_request` (con params: required_approving_review_count, dismiss_stale_reviews_on_push, require_last_push_approval, require_code_owner_review), `non_fast_forward` (NO block_force_pushes), `required_linear_history`, `required_signatures`, `required_status_checks`. Usar strings incorrectos → HTTP 422. Ver D8.
    > **Handoff Document Created**: `openspec/changes/ci-governance-pre-merge-gates/ADMIN-2-HANDOFF.md` — contains full COMBINED PUT payload with correct API type strings, all 5 required status checks, and bypass_actors: []
    > **Status**: Blocked until Admin-2 applies payload. Task remains `- [ ]` until applied.
- [ ] 2.2 Document Admin-1 `squash_merge_commit_title` settings: change to `PR_TITLE` + `COMMIT_MESSAGES` (consistent with ci-pr-metadata-governance D3). Document handoff as blocked-until-admin. **Esfuerzo: 0.5h**
  > **Handoff Document Created**: `openspec/changes/ci-governance-pre-merge-gates/ADMIN-1-HANDOFF.md` — documents both settings with rationale (preserves DCO trailers, consistent with ci-pr-metadata-governance D3)
  > **Status**: Blocked until Admin-1 applies settings. Task remains `- [ ]` until applied.

## 3. Post-Merge Governance (OUT OF SCOPE — future change)

> **Nota de alcance (2026-08-27)**: Este change cubre SOLO governance pre-PR/merge (Levels 2-3). Las capacidades post-merge/deploy siguientes están documentadas en el design pero se implementan en un change futuro separado. Se registran aquí como referencia, no como tasks activos.

- [x] ~~3.1 Create `.github/workflows/deploy-gating.yml`~~ → FUTURE CHANGE `ci-deploy-gating`
- [x] ~~3.2 Create `.github/workflows/smoke-test.yml`~~ → FUTURE CHANGE `ci-deploy-gating`
- [x] ~~4.1 Create `docs/runbooks/rollback.md`~~ → FUTURE CHANGE `ci-rollback-strategy`
- [x] ~~4.2 Create `docs/runbooks/fix-forward.md`~~ → FUTURE CHANGE `ci-rollback-strategy`
- [x] ~~5.1 Document audit-log streaming~~ → FUTURE CHANGE `ci-audit-streaming`
- [x] ~~6.1 Update `CONTRIBUTING.md` governance docs~~ → FUTURE CHANGE `ci-contributing-governance`

**Diseño de referencia** (D3, D4, D5, D10 en design.md) documenta estas capacidades para el change futuro.

---

## Summary

| Task    |  Level  |      Status      | Blocked By          | Notes                                                                                                              |
| ------- | :-----: | :--------------: | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1.1     |   L2    | **OUT OF SCOPE** | —                   | Pre-existing SECURITY control (ci-security-enhance/hardening). NOT a governance deliverable. Spec in OUT-OF-SCOPE. |
| 1.2     |   L2    |   ✅ Verified    | —                   | PR Title Lint exists with `continue-on-error: true`                                                                |
| 2.1     |   L3    |  Handoff ready   | Admin-2             | COMBINED PUT payload documented in ADMIN-2-HANDOFF.md                                                              |
| 2.2     |   L3    |  Handoff ready   | Admin-1             | Squash settings documented in ADMIN-1-HANDOFF.md                                                                   |
| ~~3.1~~ | ~~L4~~  |    ~~Future~~    | ~~Deploy target~~   | OUT OF SCOPE → `ci-deploy-gating`                                                                                  |
| ~~3.2~~ | ~~L4~~  |    ~~Future~~    | ~~Health endpoint~~ | OUT OF SCOPE → `ci-deploy-gating`                                                                                  |
| ~~4.1~~ | ~~L4~~  |    ~~Future~~    | —                   | OUT OF SCOPE → `ci-rollback-strategy`                                                                              |
| ~~4.2~~ | ~~L5~~  |    ~~Future~~    | —                   | OUT OF SCOPE → `ci-rollback-strategy`                                                                              |
| ~~5.1~~ | ~~L5~~  |   ~~Document~~   | —                   | OUT OF SCOPE → `ci-audit-streaming`                                                                                |
| ~~6.1~~ | ~~Doc~~ |    ~~Future~~    | —                   | OUT OF SCOPE → `ci-contributing-governance`                                                                        |

**Completed**: 1.2 (1 task — 1.1 is OUT OF SCOPE, not a governance task)
**Blocked by admin**: 2.1, 2.2 (2 tasks — handoff docs created, awaiting admin action)
**OUT OF SCOPE (post-merge, future)**: 3.1, 3.2, 4.1, 4.2, 5.1, 6.1 (6 tasks → 4 future changes)
**OUT OF SCOPE (security control, not governance)**: 1.1 (1 task → reference only)

---

## Conflict Resolution Notes

| Conflict                           | Resolution                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| DCO excluded from ruleset          | ✅ PRESERVED from ci-pr-metadata-governance (already required there)                   |
| PR Title Lint optional vs blocking | ✅ CLARIFIED — Already required from ci-pr-metadata-governance; preserved, not changed |
| Admin-2 PUT double modification    | ✅ COMBINED — Single PUT with all rules from both changes                              |
| Admin-1 duplication                | ✅ ELIMINATED — Documented once, consistent with D3                                    |
| required_signatures assumption     | ✅ FIXED — GET-first approach, verify before including                                 |
| rollback-spec over-promises        | ✅ FIXED — "Document approach" not "provide"                                           |
| audit-spec over-promises           | ✅ FIXED — "Document configuration" not "configure"                                    |
| SCOPE pre-PR/merge (2026-08-27)    | ✅ CUT — Deploy gating, rollback, audit, smoke-test moved to future changes            |

> **Relocation (2026-08-27)**: The spec directories `deploy-gating`, `rollback-strategy`, `audit-streaming`, and `dependency-review` were physically moved to `specs/OUT-OF-SCOPE/` within this change. `deploy-gating`, `rollback-strategy`, and `audit-streaming` are post-merge capabilities deferred to future changes. `dependency-review` is a **pre-existing SECURITY control** (from `ci-security-enhance`/`ci-security-hardening`), NOT a governance capability — its spec is preserved as reference only. None are active requirements of `ci-governance-pre-merge-gates`.

---

## Blockers

| Task | Blocker | Impact | Recommendation                                                                                                                                                                       |
| ---- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| —    | —       | —      | No active blockers for governance tasks. GHAS blocker for dependency-review is a **Security domain concern** (pre-existing control in `security.yml`), not a governance deliverable. |
