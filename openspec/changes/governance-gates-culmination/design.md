# Design: Governance Gates Culmination — Enterprise-Grade CI/CD Enforcement

> **Change**: `governance-gates-culmination` | **Status**: proposed
> **Stack**: dependency-review + ruleset-expansion + deploy-gating + rollback-strategy + audit-streaming
> **Decision log**: 2026-08-25 (verified enterprise practices)

---

## Context

**Repository Classification**: project-one is an **internal repository** (personal simulation for enterprise learning). DCO is required (enterprise provenance control, implemented in pr-metadata-governance). Signed commits are optional (enforced for practice). PR Title Lint is optional (cosmetic, will be blocking in Phase 2 of rollout). PR Template is optional (not enforceable).

Current governance maturity is ~55-60%. Levels 2-3 are partially blocked by two admin actions (Admin-2 ruleset PUT, Admin-1 squash setting), and Levels 4-5 are unstarted. This design closes those gaps toward ~95% maturity for SOC2/ISO27001. It is grounded in verified practices from Google, Meta, Microsoft, Netflix, Swissquote, and GitHub, with corrections applied after verification (see D7).

## Goals / Non-Goals

**Goals:**

- Reach Level 2 (PR dependency gate), Level 3 (merge gates), Level 4 (post-merge deploy gating + rollback), Level 5 (audit streaming).
- Provide enforceable, auditable controls mapped to SOC2/ISO27001.

**Non-Goals:**

- PR Title Lint as a governance gate in this change (cosmetic — optional in Phase 1, blocking in Phase 2 of rollout per pr-metadata-governance D7).
- PR Template as a compliance control (not enforceable — see D7).
- Org-wide signed commits (selective/regulated only — see D7).

## Decisions

### D1: Ruleset Architecture — Org Baseline + Repo Layers

**Decision**: Use an org-level baseline ruleset plus repo-level layers; the most restrictive rule wins.
**Rationale**: Mirrors Google/Meta layered enforcement; avoids a single monolithic ruleset that is hard to evolve. Repo-level ruleset 21227644 is the enforcement point for this repo.
**Alternatives**: Single org-wide ruleset (rejected — too rigid, blocks repo-specific needs).

### D2: Fan-in Gate Pattern — ci-complete

**Decision**: `ci-complete` is the **single required check** aggregating all jobs via `needs`.
**Rationale**: One required check in the ruleset reduces drift; jobs are added ADD-only. dependency-review joins the `needs` array. DCO is included (enterprise provenance control, implemented in pr-metadata-governance).
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

**Decision**: Map gates to controls:

- SOC2 CC6.1 (logical access) → required reviews, CODEOWNERS
- SOC2 CC7.1 (vulnerability detection) → dependency-review
- SOC2 CC7.2 (monitoring) → audit log streaming, post-deploy smoke tests
- SOC2 CC8.1 (change management) → required reviews, linear history, ci-complete
- SOC2 CC8.2 (change approval) → rollback strategy, fix-forward
- ISO A.5.19 (info sec in SDLC) → dependency-review
- ISO A.5.29 (security in dev) → rollback strategy
- ISO A.5.33 (protection of records) → audit log streaming
- ISO A.5.34 (privacy in SDLC) → required reviews, CODEOWNERS
- ISO A.8.7 (protection against malware) → dependency-review (supply-chain vulnerability blocking)
- ISO A.8.16 (monitoring activities) → audit log streaming, post-deploy smoke tests
  **Rationale**: Direct traceability for auditors.

### D7: Enterprise Verification Corrections

**Decision**: Apply verified corrections:

- PR Title Lint → **optional in Phase 1** (cosmetic, not a compliance control; will be blocking in Phase 2 of rollout per pr-metadata-governance D7)
- PR Template → **not enforceable** (GitHub cannot enforce body content; documentation only)
- Signed commits → **selective** (regulated repositories only, not org-wide)
- DCO → **required** (enterprise provenance control, implemented in pr-metadata-governance)
  **Rationale**: Verification against Google/Meta/Microsoft/Netflix/Swissquote/GitHub showed PR Title Lint and PR Template were over-scoped. DCO is confirmed as enterprise provenance control. Removing non-enforceable items from compliance scope reduces friction without reducing real assurance.

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
