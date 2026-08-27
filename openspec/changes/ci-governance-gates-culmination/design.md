# Design: Governance Gates Culmination — Enterprise-Grade CI/CD Enforcement

> **Change**: `ci-governance-gates-culmination` | **Status**: proposed
> **Stack**: dependency-review + ruleset-expansion + deploy-gating + rollback-strategy + audit-streaming
> **Decision log**: 2026-08-25 (verified enterprise practices)

---

## Context

**Repository Classification**: project-one is an **internal repository** (personal simulation for enterprise learning). DCO is required (enterprise provenance control, implemented in ci-pr-metadata-governance). Signed commits are optional (enforced for practice). PR Title Lint is optional (cosmetic, will be blocking in Phase 2 of rollout). PR Template is optional (not enforceable).

Current governance maturity is ~55-60%. Levels 2-3 are partially blocked by two admin actions (Admin-2 ruleset PUT, Admin-1 squash setting), and Levels 4-5 are unstarted. This design closes those gaps toward ~95% maturity for SOC2/ISO27001. It is grounded in verified practices from Google, Meta, Microsoft, Netflix, Swissquote, and GitHub, with corrections applied after verification (see D7).

## Goals / Non-Goals

**Goals:**

- Reach Level 2 (PR dependency gate) and Level 3 (merge gates) — fully implementable.
- Document Level 4 (post-merge deploy gating + rollback) and Level 5 (audit streaming) — conditional on deploy target + Enterprise tier.
- Provide enforceable, auditable controls mapped to SOC2/ISO27001 (repo-level, ~75-80% maturity).

**Non-Goals:**

- PR Title Lint as a governance gate in this change (cosmetic — optional in Phase 1, blocking in Phase 2 of rollout per ci-pr-metadata-governance D7).
- PR Template as a compliance control (not enforceable — see D7).
- Org-wide signed commits (selective/regulated only — see D7).

## Decisions

### D1: Ruleset Architecture — Org Baseline + Repo Layers

**Decision**: Use an org-level baseline ruleset plus repo-level layers; the most restrictive rule wins.
**Rationale**: Mirrors Google/Meta layered enforcement; avoids a single monolithic ruleset that is hard to evolve. Repo-level ruleset 21227644 is the enforcement point for this repo.
**Alternatives**: Single org-wide ruleset (rejected — too rigid, blocks repo-specific needs).

### D2: Fan-in Gate Pattern — ci-complete

**Decision**: `ci-complete` is the **single aggregate gate** for CI jobs via `needs`. Other required checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO) remain separately required in the ruleset.
**Rationale**: ci-complete aggregates CI jobs ADD-only; the other 4 checks are independent governance controls from ci-pr-metadata-governance. All 5 are required status checks in ruleset 21227644.
**Alternatives**: List every job as a required check (rejected — high maintenance, easy to desync).

### D3: Deploy Gating — GitHub Environments + Required Reviewers

**Decision**: Use GitHub Environments (`staging`, `production`) with required reviewers on `production`.
**Rationale**: Native GitHub control, no extra tooling; matches Netflix/Microsoft deploy-gate patterns.
**Alternatives**: External deploy controller (rejected — adds operational surface).

### D4: Rollback Layers — kill-switch → traffic shift → git revert → DB expand/contract

**Decision**: Define precedence: feature-flag kill-switch first, then traffic shift, then git revert, then DB migration reversal.
**Rationale**: Fastest, least-blast-radius containment first (Swissquote/Google SRE practice).
**Alternatives**: Always git revert (rejected — slower, larger blast radius for flaggable features).

### D5: Audit Architecture — GitHub Audit Log → Streaming → SIEM

**Decision**: Stream GitHub audit logs to an external store (SIEM) and document evidence collection.
**Rationale**: SOC2 CC7.2 / ISO A.8.16 require retained, tamper-evident audit trails outside the source system.
**Alternatives**: Rely on GitHub UI export (rejected — manual, not continuous, not tamper-evident).

### D6: Compliance Mapping

**Decision**: Map gates to controls (verified against AICPA 2017 Trust Services Criteria and ISO 27001:2022):

- SOC2 CC6.3 (logical access — least privilege) → required reviews, CODEOWNERS (segregation of duties)
- SOC2 CC7.1 (vulnerability detection) → dependency-review (SCA), future SAST/DAST
- SOC2 CC7.2 (monitoring) → audit log streaming documentation, post-deploy smoke tests
- SOC2 CC8.1 (change management/approval) → required reviews, linear history, ci-complete, rollback strategy, fix-forward
- ISO A.5.19 (supplier relationships) → dependency-review (also A.8.7)
- ISO A.5.29 (security during disruption) → rollback strategy
- ISO A.5.33 (protection of records) → audit log streaming documentation (needs retention policy)
- ISO A.5.34 (privacy in SDLC) → required reviews, CODEOWNERS (weak mapping — no PII handling)
- ISO A.8.7 (protection against malware) → dependency-review (supply-chain vulnerability blocking)
- ISO A.8.16 (monitoring activities) → audit log streaming documentation, post-deploy smoke tests
  **Rationale**: Direct traceability for auditors. **NOTE**: CC8.2 does NOT exist in AICPA 2017 Trust Services Criteria; change approval lives in CC8.1 only. CC6.1 (logical access — credential management) is NOT mapped here; identity-layer controls (SSO/MFA) are out of scope for this change.

### D7: Enterprise Verification Corrections

**Decision**: Apply verified corrections:

- PR Title Lint → **already required (blocking)** from ci-pr-metadata-governance; this change preserves it. Classified optional only as a compliance control (cosmetic, not mapped to SOC2/ISO)
- PR Template → **not enforceable** (GitHub cannot enforce body content; documentation only)
- Signed commits → **selective** (regulated repositories only, not org-wide)
- DCO → **required** (enterprise provenance control, implemented in ci-pr-metadata-governance)
  **Rationale**: Verification against Google/Meta/Microsoft/Netflix/Swissquote/GitHub showed PR Template was over-scoped. DCO and PR Title Lint are confirmed as enterprise controls from ci-pr-metadata-governance. Removing non-enforceable items from compliance scope reduces friction without reducing real assurance.

## Risks / Trade-offs

| Risk                                              | Mitigation                                                |
| ------------------------------------------------- | --------------------------------------------------------- |
| Ruleset PUT partial update deletes existing rules | GET → modify → PUT full replace (Admin-2)                 |
| ci-complete desync                                | ADD-only to needs array; validate job names match ruleset |
| Deploy gate blocks legitimate releases            | Required reviewers + documented exception path            |
| Audit streaming gaps                              | Quarterly review cadence (audit-streaming REQ-003)        |
| Kill-switch misuse                                | Documented ownership + change approval for flag toggles   |

## Integration Points

| System               | Integration                         | Direction         |
| -------------------- | ----------------------------------- | ----------------- |
| ci.yml / ci-complete | dependency-review added to needs    | → ci-complete     |
| ruleset 21227644     | required checks + reviews + history | → GitHub          |
| GitHub Environments  | staging/production + reviewers      | → deploy-gating   |
| SIEM                 | audit log streaming                 | → audit-streaming |
| CONTRIBUTING.md      | governance gates documentation      | → contributors    |

## Migration Plan

1. Create dependency-review.yml (Task 1), wire to ci-complete.
2. Admin-2 PUT ruleset 21227644 (Task 3); Admin-1 squash settings (Task 4).
3. Create deploy-gating.yml + smoke-test.yml (Tasks 5-6).
4. Document rollback + fix-forward runbooks (Tasks 7-8).
5. Document audit log streaming configuration (Task 9).
6. Update CONTRIBUTING.md with governance gates documentation (Task 10).
7. Archive after verification.

## Open Questions

None that change the specs or task breakdown.
