# Design: Governance Pre-Merge Gates — Enterprise-Grade CI/CD Enforcement

> **Change**: `ci-governance-pre-merge-gates` | **Status**: proposed
> **Stack**: dependency-review + ruleset-expansion
> **Decision log**: 2026-08-25 (verified enterprise practices)
> **Scope**: Pre-PR/merge ONLY (Levels 2-3). Post-merge capabilities documented as reference for future changes.

---

## Context

**Repository Classification**: project-one is an **internal repository** (personal simulation for enterprise learning). DCO is required (enterprise provenance control, implemented in ci-pr-metadata-governance). Signed commits are optional (enforced for practice). PR Title Lint is optional (cosmetic, will be blocking in Phase 2 of rollout). PR Template is optional (not enforceable).

Current governance maturity is ~55-60%. Levels 2-3 are partially blocked by two admin actions (Admin-2 ruleset PUT, Admin-1 squash setting), and Levels 4-5 are unstarted. This design closes those gaps toward ~95% maturity for SOC2/ISO27001. It is grounded in verified practices from Google, Meta, Microsoft, Netflix, Swissquote, and GitHub, with corrections applied after verification (see D7).

## Security Controls Scope

> **Note**: Secret scanning (Gitleaks), SAST (Semgrep/CodeQL), SCA (Dependabot/Snyk), SBOM generation (Syft/Trivy), and License compliance (FOSSA) are ALREADY implemented in the prebuild stage (§23.3 of `docs/ci-cd-pipeline-empresarial.md`). This change does NOT duplicate those controls.

This change focuses on:

1. **PR-specific gates**: `dependency-review` is a **pre-existing SECURITY control** (from `ci-security-enhance`/`ci-security-hardening`), NOT a new governance capability. This change only enforces it as REQUIRED via `ci-complete` fan-in + ruleset `required_status_checks`. The control itself lives in `security.yml` (Security domain, OUT OF SCOPE for governance).
   > **Distinción vs SCA**: `dependency-review` es un PR gate para dependencias NUEVAS; SCA (Dependabot/Snyk) es un scan de lockfile para dependencias EXISTENTES. Son complementarios, no duplicados. Ver D9.
2. **Enforcement layer**: Ruleset expansion (wiring prebuild jobs as `required_status_checks`)

**OUT OF SCOPE (future changes — documented as reference in D3/D4/D5/D10)**: 3. ~~**Deploy governance**: GitHub Environments with required reviewers~~ → `ci-deploy-gating` 4. ~~**Post-merge governance**: Rollback/fix-forward strategy documentation~~ → `ci-rollback-strategy` 5. ~~**Audit**: Audit log streaming (GHEC-conditional)~~ → `ci-audit-streaming`

**OUT OF SCOPE (Security control — not a governance capability)**:

- `dependency-review`: Pre-existing SECURITY control (from `ci-security-enhance` commit 39972c9, hardened in `ci-security-hardening` commit 7873cc6). Lives in `security.yml`. This change only enforces it as REQUIRED via `ci-complete` + ruleset. The spec was relocated to `specs/OUT-OF-SCOPE/dependency-review/`.

The prebuild stage provides the security scanning; this change provides the governance enforcement that makes those scans mandatory for merge.

## What Changes

- **Security gates**: `dependency-review` is a **pre-existing SECURITY control** (implemented in `ci-security-enhance`, hardened in `ci-security-hardening`). This change makes it REQUIRED via `ci-complete` fan-in + ruleset `required_status_checks` — it does NOT create it. The control lives in `security.yml` (Security domain, OUT OF SCOPE for governance).
- **Ruleset expansion**: required_status_checks for ci-complete fan-in gate
- ~~**Deploy gating**: GitHub Environments with required reviewers on production~~ → OUT OF SCOPE (`ci-deploy-gating`)
- ~~**Post-merge governance**: rollback/fix-forward strategy documentation~~ → OUT OF SCOPE (`ci-rollback-strategy`)
- ~~**Audit**: audit log streaming (GHEC-conditional)~~ → OUT OF SCOPE (`ci-audit-streaming`)

### Pre-existing Security Controls (NOT in scope — already in prebuild)

The following controls are implemented in the prebuild stage and will be wired as required checks via the ruleset expansion (Task 2.1):

- Secret scanning (Gitleaks) — `security:secrets` job
- SAST (Semgrep) — `sast:semgrep` job
- SCA (Dependabot/Snyk) — dependency analysis
- License compliance — FOSSA/ScanCode
- SBOM generation — Syft/Trivy sbom (Stage 3 build-time)

These are NOT new capabilities — they are existing controls that become ENFORCED via the ruleset.

## Goals / Non-Goals

**Goals:**

- Reach Level 2 (PR dependency gate) and Level 3 (merge gates) — fully implementable.
- Provide enforceable, auditable controls mapped to SOC2/ISO27001 (repo-level, pre-PR/merge, ~70-75% maturity).

**Non-Goals:**

- PR Title Lint as a governance gate in this change (cosmetic — optional in Phase 1, blocking in Phase 2 of rollout per ci-pr-metadata-governance D7).
- PR Template as a compliance control (not enforceable — see D7).
- Org-wide signed commits (selective/regulated only — see D7).
- Deploy gating (Level 4) — OUT OF SCOPE, future `ci-deploy-gating`.
- Rollback/fix-forward (Level 4) — OUT OF SCOPE, future `ci-rollback-strategy` (documented in D4).
- Audit log streaming (Level 5) — OUT OF SCOPE, future `ci-audit-streaming` (documented in D5).

## Decisions

### D1: Ruleset Architecture — Org Baseline + Repo Layers

**Decision**: Use an org-level baseline ruleset plus repo-level layers; the most restrictive rule wins.
**Rationale**: Mirrors Google/Meta layered enforcement; avoids a single monolithic ruleset that is hard to evolve. Repo-level ruleset 21227644 is the enforcement point for this repo.
**Alternatives**: Single org-wide ruleset (rejected — too rigid, blocks repo-specific needs).

### D2: Fan-in Gate Pattern — ci-complete

**Decision**: `ci-complete` is the **single aggregate gate** for CI jobs via `needs`. Other required checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO) remain separately required in the ruleset.
**Rationale**: ci-complete aggregates CI jobs ADD-only; the other 4 checks are independent governance controls from ci-pr-metadata-governance. All 5 are required status checks in ruleset 21227644.
**Alternatives**: List every job as a required check (rejected — high maintenance, easy to desync).

**Wiring (2026-08-26):** The prebuild stage jobs (secret scanning, SAST, SCA, license compliance, unit tests, lint, type-check) will be aggregated into `ci-complete` fan-in gate. The ruleset will require `ci-complete` as a status check, ensuring ALL prebuild checks must pass before merge. Individual prebuild job names should NOT be listed as separate required checks (high maintenance, easy to desync).

### D3: Deploy Gating — GitHub Environments + Required Reviewers (OUT OF SCOPE — reference for `ci-deploy-gating`)

**Decision**: Use GitHub Environments (`staging`, `production`) with required reviewers on `production`.
**Rationale**: Native GitHub control, no extra tooling; matches Netflix/Microsoft deploy-gate patterns.
**Alternatives**: External deploy controller (rejected — adds operational surface).
**Status**: Documentation only — implementation deferred to future change `ci-deploy-gating`.

### D4: Rollback Layers — kill-switch → traffic shift → git revert → DB expand/contract (OUT OF SCOPE — reference for `ci-rollback-strategy`)

**Decision**: Define precedence: feature-flag kill-switch first, then traffic shift, then git revert, then DB migration reversal.
**Rationale**: Fastest, least-blast-radius containment first (Swissquote/Google SRE practice).
**Alternatives**: Always git revert (rejected — slower, larger blast radius for flaggable features).
**Status**: Documentation only — implementation deferred to future change `ci-rollback-strategy`.

### D5: Audit Architecture — GitHub Audit Log → Streaming → SIEM (OUT OF SCOPE — reference for `ci-audit-streaming`)

**Decision**: Stream GitHub audit logs to an external store (SIEM) and document evidence collection.
**Rationale**: SOC2 CC7.2 / ISO A.8.16 require retained, tamper-evident audit trails outside the source system.
**Alternatives**: Rely on GitHub UI export (rejected — manual, not continuous, not tamper-evident).
**Status**: Documentation only — implementation deferred to future change `ci-audit-streaming`.

### D6: Compliance Mapping

**Decision**: Map gates to controls (verified against AICPA 2017 Trust Services Criteria and ISO 27001:2022):

- SOC2 CC6.3 (logical access — least privilege) → required reviews, CODEOWNERS (segregation of duties)
- SOC2 CC7.1 (vulnerability detection) → **pre-existing SECURITY control**: dependency-review (SCA), future SAST/DAST. _Governance enforces this control via ruleset; does not create it._
- SOC2 CC7.2 (monitoring) → audit log streaming documentation, post-deploy smoke tests
- SOC2 CC8.1 (change management/approval) → required reviews, linear history, ci-complete, rollback strategy, fix-forward
- ISO A.5.19 (supplier relationships) → **pre-existing SECURITY control**: dependency-review (also A.8.7). _Governance enforces via ruleset._
- ISO A.5.29 (security during disruption) → rollback strategy
- ISO A.5.33 (protection of records) → audit log streaming documentation (needs retention policy)
- ISO A.5.34 (privacy in SDLC) → required reviews, CODEOWNERS (weak mapping — no PII handling)
- ISO A.8.7 (protection against malware) → **pre-existing SECURITY control**: dependency-review (supply-chain vulnerability blocking). _Governance enforces via ruleset._
- ISO A.8.16 (monitoring activities) → audit log streaming documentation, post-deploy smoke tests
- ISO A.8.32 (change management) → required reviews, linear history, ci-complete, rollback strategy, fix-forward (PRIMARY control for change approval — maps to SOC2 CC8.1)
- ISO A.8.25 (secure SDLC) → **pre-existing SECURITY control**: dependency-review, required reviews, CODEOWNERS (optional, supporting). _Governance enforces dependency-review via ruleset._
- ISO A.8.31 (dev/test/prod separation) → environments with branch restrictions, deploy-gating (optional, supporting)
  **Rationale**: Direct traceability for auditors. **NOTE**: CC8.2 does NOT exist in AICPA 2017 Trust Services Criteria; change approval lives in CC8.1 only. CC6.1 (logical access — credential management) is NOT mapped here; identity-layer controls (SSO/MFA) are out of scope for this change.
  **Scope note**: `dependency-review` mappings reflect enforcement of a **pre-existing SECURITY control** (from `ci-security-enhance`/`ci-security-hardening`), not a new governance capability. The control itself is Security domain; governance only makes it REQUIRED via `ci-complete` + ruleset.

### D7: Enterprise Verification Corrections

**Decision**: Apply verified corrections:

- PR Title Lint → **already required (blocking)** from ci-pr-metadata-governance; this change preserves it. Classified optional only as a compliance control (cosmetic, not mapped to SOC2/ISO)
- PR Template → **not enforceable** (GitHub cannot enforce body content; documentation only)
- Signed commits → **selective** (regulated repositories only, not org-wide)
- DCO → **required** (enterprise provenance control, implemented in ci-pr-metadata-governance)
  **Rationale**: Verification against Google/Meta/Microsoft/Netflix/Swissquote/GitHub showed PR Template was over-scoped. DCO and PR Title Lint are confirmed as enterprise controls from ci-pr-metadata-governance. Removing non-enforceable items from compliance scope reduces friction without reducing real assurance.

### D8: Ruleset API Type Strings (Research Correction 2026-08-26)

**Decision**: Use correct GitHub Rulesets REST API type strings in the Admin-2 PUT payload.

**Correct types**:

- `pull_request` (NOT `required_pull_request`) — with parameters: `required_approving_review_count`, `dismiss_stale_reviews_on_push` (NOT `dismiss_stale_reviews`), `require_last_push_approval`, `require_code_owner_review`
- `non_fast_forward` (NOT `block_force_pushes`)
- `required_linear_history` (correct in plan)
- `required_signatures` (correct in plan)
- `required_status_checks` (correct in plan)

**Rationale**: GitHub Rulesets REST API uses specific enum values. Using incorrect strings returns HTTP 422. Verified against https://docs.github.com/en/rest/repos/rules and https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.

**Risk**: Literal wrong type strings in the PUT payload cause silent failure. The GET→PUT full-replace pattern (existing mitigation) is correct and should be preserved.

### D9: Dependency-Review vs SCA — Complementary Controls (Research 2026-08-26)

**Decision**: `dependency-review` and SCA (Dependabot/Snyk) are complementary, not duplicative.

**Distinction**:

- **SCA (Dependabot/Snyk/OSV-Scanner)**: Scans the lockfile for known vulnerabilities in ALL dependencies (existing + new). Runs on every push. Part of prebuild stage (§23.3 Stage 2 — SECURITY).
- **dependency-review**: Specifically checks NEW dependencies introduced in the PR against the GitHub Advisory Database. Blocks merge if new moderate+ severity vulnerabilities are introduced. **This is a pre-existing SECURITY control** (implemented in `ci-security-enhance` commit 39972c9, hardened to `@v5` in `ci-security-hardening` commit 7873cc6), living in `security.yml`. It is NOT a governance capability — it is a Security domain control. Governance (this change) only enforces it as REQUIRED via `ci-complete` fan-in + ruleset `required_status_checks`.

**Why both are needed**:

- SCA catches vulnerabilities in existing dependencies (retroactive)
- dependency-review catches vulnerabilities in NEW dependencies (proactive gate)
- They complement each other — SCA runs in prebuild, dependency-review runs as PR gate (in security.yml)

**Source**: GitHub docs on dependency-review-action; OWASP A06 (Vulnerable and Outdated Components).
**Scope note**: `dependency-review` is OUT OF SCOPE as a governance capability. It is a Security control that governance enforces.

### D10: Smoke-Test vs E2E — Complementary Post-Deploy Controls (Research 2026-08-26)

**Decision**: `smoke-test` and E2E (Playwright) are complementary, not duplicative.

**Distinction**:

- **E2E (Playwright)**: Full functional testing of the application (login, navigation, workflows). Runs post-deploy in staging. Part of Stage 4 (Post-Build — TESTING).
- **smoke-test**: Lightweight health check (liveness/readiness probes) post-deploy. Verifies the deployment is alive and responsive. Part of Post-deploy Governance (§23.3.1 step 5).

**Why both are needed**:

- E2E validates functional correctness (does the app work?)
- smoke-test validates deployment health (is the app alive?)
- smoke-test is faster (< 1 min) and catches infrastructure issues (failed deploy, unhealthy container)
- E2E is slower (5-15 min) and catches application bugs (broken logic, regressions)

**Source**: Microsoft SRE playbook (smoke testing); Fowler Test Pyramid; §23.3 pipeline stages.

## Risks / Trade-offs

| Risk                                              | Mitigation                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Ruleset PUT partial update deletes existing rules | GET → modify → PUT full replace (Admin-2)                                      |
| ci-complete desync                                | ADD-only to needs array; validate job names match ruleset                      |
| Deploy gate blocks legitimate releases            | Required reviewers + documented exception path                                 |
| Audit streaming gaps                              | Quarterly review cadence (audit-streaming REQ-003)                             |
| Kill-switch misuse                                | Documented ownership + change approval for flag toggles                        |
| Security controls duplicated                      | ✅ ELIMINATED — prebuild already covers; this change only enforces via ruleset |

## Integration Points

| System               | Integration                                                                                                                                     | Direction     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| ruleset 21227644     | required checks + reviews + history                                                                                                             | → GitHub      |
| ci.yml / ci-complete | governance gates (verify-signatures, commit-lint, pr-title-lint) + pre-existing SECURITY controls (e.g. dependency-review) aggregated via needs | → ci-complete |

> **Scope note (2026-08-27)**: dependency-review, deploy-gating, rollback-strategy y audit-streaming están OUT OF SCOPE (ver specs/OUT-OF-SCOPE/). La tabla de integración refleja solo el alcance real de governance: ruleset-expansion + commit/metadata gates.

## Migration Plan

1. Admin-2 PUT ruleset 21227644 (task 2.1) — full replace, combinado con required checks existentes.
2. Admin-1 squash_merge_commit_title=PR_TITLE + message=COMMIT_MESSAGES (task 2.2).
3. Verificar pr-title-lint existente (task 1.2) — ya verificado, non-blocking.
4. Archive after verification.

## Open Questions

None that change the specs or task breakdown.
