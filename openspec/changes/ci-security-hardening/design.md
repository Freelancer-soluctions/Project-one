## Context

See `proposal.md` — Why. The 8 active workflows (`ci`, `deploy`, `preview`, `quality`, `release`, `scheduled-security`, `security-digest`, `security`) plus the local composite `.github/actions/setup-monorepo/action.yml` reference multiple Node 20-runtime actions that GitHub removes from hosted runners on **2026-09-16**, deprecated artifact actions without security patches, and have enterprise hardening gaps (permissions, timeouts, concurrency, pinning, error masking, alerting). `ci-enterprise.yml` is a preserved zombie and is NOT touched. `docs/cicd-estado-actual.md` and `docs/workflows-mantenimiento-guia.md` document the current pipeline and must be kept truthful after the change.

## Goals / Non-Goals

**Goals:**

- Land a Node 24-runtime migration ahead of the 2026-09-16 Node 20 removal, as the critical path.
- Fail closed on security findings while preserving report artifacts (visibility is not sacrificed).
- Apply least-privilege, bounded runtimes, concurrency, and cron alerting across the 8 workflows.
- Keep the change reviewable by grouping work in severity-ordered, independently mergeable units.

**Non-Goals:**

- Touching `ci-enterprise.yml` (preserved zombie).
- Verifying/repairing the AWS OIDC trust policy (requires the user's AWS console access).
- Migrating the project's local Node toolchain to 24 (`.nvmrc` stays 22.23.1).
- Migrating `peter-evans` / `dorny` / `cache` / `github-script` majors unless verification proves their current major runs Node 20 (they get verified, not blindly bumped).
- Removing intentional best-effort `continue-on-error` on notification/comment steps in `preview.yml` (those do not mask security findings).

## Decisions

### D1. Node major choices (Block 1)

| Action                                  | From                | To                 | Rationale                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------- | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions/setup-node`                    | v4 (node20)         | **v5**             | First node24 major after v4; minimal-diff upgrade across 6 call sites incl. the composite action. v7 is also node24 but is 2 majors ahead — defer to Dependabot-driven migration; avoid regression surface.                                                                                                                                                                        |
| `actions/checkout`                      | v4 (release.yml:15) | **v6**             | Per the live audit, v6 is the current node24 major; the other 7 workflows already use `checkout@v5` (node24) and stay on v5. Decision noted: release.yml on v6 while the rest is v5 creates a 1-major skew — acceptable, flagged as follow-up to standardize repo-wide. Alternative (bump release to v5 for consistency) rejected to follow the auditor's verified recommendation. |
| `gitleaks/gitleaks-action`              | v2                  | **v3**             | node24 major per audit.                                                                                                                                                                                                                                                                                                                                                            |
| `actions/upload-artifact`               | v4 / v4.6.2         | **v5**             | v4 is deprecated with no security patches. All 5 usages (scheduled-security.yml:29, security-digest.yml:29,47,103, security.yml:125). **Deadline-binding (node20)**: moved to PR A.                                                                                                                                                                                                |
| `actions/download-artifact`             | v4.2.1              | **v5**             | Same deprecation. All 3 usages (security-digest.yml:61,66,89 — audit listed 2; repo has 3, covered). **Deadline-binding (node20)**: moved to PR A.                                                                                                                                                                                                                                 |
| `changesets/action`                     | v1                  | **v2**             | **NOT deadline-binding** — live verification (2026-08-11, action.yml raw) confirms `v1` already resolves to v1.9.0 (2026-06-03) running **node24**. Bump to v2.0.0 is maintenance/support-driven (v1 in maintenance branch), ships in PR C.                                                                                                                                        |
| `aws-actions/configure-aws-credentials` | v4                  | **v6.x**           | node20 → node24 (deploy.yml:177,216,333). **Deadline-binding**: version bump moved to PR A; the `role-session-name: gha-${{ github.run_id }}` + `role-duration-seconds: 900` flags ship in PR C (3.10).                                                                                                                                                                            |
| `anchore/sbom-action`                   | v0.17.2             | first node24 major | **node20 confirmed** (security-digest.yml:24, security.yml:119) — deadline-binding, PR A. Exact target major verified in P0 task 1.1.                                                                                                                                                                                                                                              |
| `actions/dependency-review-action`      | v4                  | first node24 major | **node20 confirmed** (security.yml:147) — deadline-binding, PR A. Exact target major verified in P0 task 1.1.                                                                                                                                                                                                                                                                      |
| `google/osv-scanner-action`             | v2.3.8              | **v2.5.0**         | Explicit audit recommendation (security-digest.yml:42).                                                                                                                                                                                                                                                                                                                            |
| `aquasecurity/trivy-action`             | 0.33.1              | **0.36.0**         | Explicit audit recommendation (security.yml:33).                                                                                                                                                                                                                                                                                                                                   |

**Prerequisite (before any bump is merged):** verify node24 status of `dorny/paths-filter@v3`, `dorny/test-reporter@v3`, `peter-evans/find-comment@v3`, `peter-evans/create-or-update-comment@v4`, `actions/cache@v4`, `actions/github-script@v7`, `anchore/sbom-action@v0.17.2`, `actions/dependency-review-action@v4`, `aws-actions/amazon-ecr-login@v2` (release notes / action.yml `runs.using`). Live verification already confirms: `amazon-ecr-login@v2` = node24 (no bump needed, verify only), `sbom-action@v0.17.2` = node20 (bump), `dependency-review-action@v4` = node20 (bump). If a current major still runs node20, bump to its first node24 major (e.g. `github-script@v8` if v7 is node20). This is a **P0 prerequisite task**, not a blind bump.

### D2. `.nvmrc` independence

`.nvmrc` (22.23.1) selects the local Node for `npm ci` / test tooling via `node-version-file` and is **independent** of the actions' own runtime. The migration only changes `uses:` references; `.nvmrc`, the Dockerfiles, and the app runtime stay on 22.23.1. Documented here and in `docs/workflows-mantenimiento-guia.md` to prevent future conflation.

### D3. Fail-closed scans with preserved reports (Block 3)

- Remove `continue-on-error: true` from `scheduled-security.yml:16` (job-level) and `security-digest.yml:45` (OSV step).
- Preserve visibility by adding `if: always()` to the **report upload steps only**: scheduled-security.yml upload-JSON / scan-SARIF / upload-SARIF steps; security-digest.yml OSV report upload step. The run still fails (fail-closed) but artifacts remain downloadable.
- `security-digest.yml` `digest` job already has `needs: [sbom, vulnerability-review]` + `if: always() && !cancelled()`, so it continues producing the digest even when `vulnerability-review` fails.
- Alternative considered: keeping audit mode (fail-open) — rejected: it lets leaks/vulns pass silently, which is exactly the enterprise weakness this change removes. Specs `ci-secret-scanning` and `ci-scheduled-security-review` are modified accordingly (MODIFIED/REMOVED/ADDED deltas).

### D4. Trivy hardening (Block 2)

`dependency-scan` job in `security.yml`: `aquasecurity/trivy-action@0.36.0` with `exit-code: '1'`, `format: sarif`, `output: trivy-results.sarif`, `ignore-unfixed: true`, keeping `scan-type: fs`, `scan-ref: .`, `severity: CRITICAL,HIGH`. Follow with `github/codeql-action/upload-sarif@v4` (already in use repo-wide, node24) `sarif_file: trivy-results.sarif`, `category: trivy`. `ignore-unfixed: true` keeps the gate actionable (only fixable CRITICAL/HIGH fail the run); unfixed findings stay visible in the uploaded SARIF.

### D5. Least-privilege permissions (Block 3)

- `ci.yml`: workflow-level becomes `contents: read` only. The 5 jobs running `dorny/test-reporter` (test-unit-client, test-unit-server, test-integration, test-smoke, e2e) get job-level `checks: write` + `contents: read`. `pull-requests: write` is dropped at workflow level. `changes`, `build`, `zombie-workflow-guard` jobs stay on the workflow default (`contents: read`).
- `security.yml` `sbom` job: drop `actions: write`, keep `contents: read` (SBOM upload needs only artifact write, which needs no explicit permission).
- `release.yml` deliberately keeps `contents: write` + `pull-requests: write` (changesets publishes packages and opens version PRs — required); not reduced.
- `preview.yml` keeps its `pull-requests: write` (PR comment via create-or-update-comment — required).

### D6. Timeouts (Block 3)

`ci.yml:changes` 5; `quality.yml:quality` 15; `release.yml:release` 10; `scheduled-security.yml:gitleaks-full-scan` 15; `security-digest.yml` sbom 10 / vulnerability-review 10 / digest 10; `security.yml` dependency-scan 15 / sast 15 / secrets 10 / sbom 10 / dependency-review 10. All minutes, aligned with existing job durations.

### D7. Concurrency (Block 3)

- `release.yml`: `concurrency: group: release, cancel-in-progress: false` — releases queue, never cancel (a canceled publish could corrupt the npm/git state).
- `security.yml`: `concurrency: group: security-${{ github.ref }}, cancel-in-progress: true` — per-ref, latest wins (matches ci.yml pattern).

### D8. SHA pinning (REMOVED)

**D8 (REMOVED):** SHA pinning eliminado por decisión del usuario (2026-08-11) — se mantienen tags versionados; Dependabot (github-actions, weekly) gestiona updates. Riesgo residual aceptado: tags móviles.

### D9. Cron failure notification (Block 3)

New `notify-failure` job in `scheduled-security.yml` and `security-digest.yml`: `needs: [<all jobs>]`, `if: failure()`, `runs-on: ubuntu-latest`, with job-level `permissions: issues: write`, using `actions/github-script` (the node24-verified major from D1) to create a GitHub issue (or equivalent) titled with the workflow name and run date (e.g. `[scheduled-security] cron run failed on <date>`) and linking the failed run. Because the fail-closed policy now intentionally fails the run on scan findings, this job turns that red run into a tracked, actionable issue instead of a silent failure. Alternative considered: external notifications (Slack/email webhook) — rejected: the repo has no notification infrastructure, and a GitHub issue keeps the alert inside GitHub where the failed run and logs are linked. `if: failure()` deliberately covers failures caused by scan findings as well as infra failures.

### D10. CodeQL scans the workflows themselves (Block 3)

`security.yml` `sast` job (lines 50-52): add `actions` to the `codeql-action/init` `languages` input → `languages: actions, javascript`, so CodeQL analyzes `.github/workflows/**` for insecure workflow patterns (dangerous script injection, `pull_request_target` misuse, secrets in args) alongside the JS codebase. Alternative considered: a dedicated CodeQL workflow targeting workflows only — rejected: reuses the existing `sast` job and avoids a second scheduled analysis with its own runner cost.

### D11. Harden-Runner on OIDC jobs (Block 3)

`step-security/harden-runner` becomes the first step of the three `deploy.yml` jobs that assume AWS roles via OIDC (`ecr-push`, `deploy-staging`, `deploy-production`). Start with `egress-policy: audit` to observe and record egress without enforcement, then promote to `block` (allowlist mode) after a review period of green runs. **Trade-off:** `audit` gives visibility but no enforcement (a compromised job can still egress to the network); `block` enforces the allowlist but risks breaking deploys if a required endpoint is missing (npm registry for install, ECR, STS, CloudWatch logs) — if `block` regresses deploys, stay on `audit` and document the endpoints that must be allowlisted before retrying `block`. Alternative: no hardening — rejected: OIDC jobs are the highest-value target, since a compromised job can mint AWS credentials.

### D12. AWS region parametrization (Optional, LOW)

Replace hardcoded `us-east-1` in `deploy.yml` with `${{ vars.AWS_REGION }}` (repo variable) at the `aws-region` inputs (lines ~180/219/336), the ECR tag/push URIs (lines 188-191), and the `awslogs-region` fields (lines ~254/371). Optional and LOW: it touches docker tag/push string interpolation and ECS task definitions, so it ships only if the repo var is added cheaply; skipping it does not block the change.

## Risks / Trade-offs

- [Fail-closed scans can break runs on scanner false positives] → Mitigation: Trivy uses `ignore-unfixed: true` so the gate only fails on fixable CRITICAL/HIGH; Gitleaks and OSV findings are actionable by nature; SARIF/JSON reports are still uploaded via `if: always()`, so a failed run never loses visibility and findings can be triaged from the artifacts.
- [Node major bumps (setup-node v4→v5, checkout v4→v6, gitleaks v2→v3) can change behavior subtly] → Mitigation: the P0 prerequisite verifies node24 status of every touched major before merging; Block 1 lands as its own PR ahead of the 2026-09-16 deadline; post-merge runs are monitored and rollback is a single-revert.
- [release.yml checkout@v6 while the rest of the repo is @v5 creates a 1-major skew] → Accepted; flagged as a follow-up to standardize repo-wide. Both majors are node24, so the deadline is unaffected.
- [Third-party action tags are mutable (supply-chain tampering risk)] → Accepted by user decision (2026-08-11, D8 REMOVED): SHA pinning removed; tags versionados mantenidos; Dependabot (`github-actions`, weekly) gestiona updates; mutable-tag risk accepted.
- [Harden-Runner `egress-policy: block` can break deploys (npm, ECR, STS, CloudWatch)] → Mitigation: start in `audit`, promote to `block` only after a green-run review period; fall back to documented `audit` if deploys regress.
- [osv-scanner 2.5.0 / trivy 0.36.0 version bumps can change report output] → Mitigation: reports are consumed by existing upload/digest steps; PR review verifies the artifact formats after the bump before the block is considered done.
- [Cron notification issues can become noise if a cron keeps failing] → Mitigation: the issue title carries the run date so it is self-describing; maintainers can close/annotate; optional dedupe of open issues can be added to the `github-script` step later.

## Migration Plan

- **PR A — Block 1 (CRITICAL, must land before 2026-09-16):** P0 prerequisite verification of the 9 third-party majors, then the node24 migration across `deploy.yml`, `preview.yml`, `quality.yml`, `release.yml`, `security.yml`, `scheduled-security.yml`, `security-digest.yml` and `setup-monorepo/action.yml` — **all deadline-binding (node20-confirmed)**: setup-node→v5 (6 sites), checkout→v6 (release.yml:15), gitleaks→v3, upload-artifact→v5 (5 usages), download-artifact→v5 (3 usages), configure-aws-credentials→v6.x (3 usages), sbom-action→first node24 major (2 usages), dependency-review-action→first node24 major. `changesets→v2` is NOT in PR A (v1 already node24). Rollback: revert the single PR; the change is confined to `uses:` lines.
- **PR B — Block 2 (HIGH):** Trivy 0.36.0 fail-closed SARIF (`security.yml`), `osv-scanner-action` 2.5.0 (`security-digest.yml`). (upload/download-artifact→v5 moved to PR A — node20 deadline-binding.) Rollback: revert the PR; runs return to prior versions.
- **PR C — Block 3 (hardening):** permissions, timeouts, concurrency, typecheck un-suppression, `continue-on-error` removal with `if: always()` uploads, cron notification jobs, CodeQL `actions` language, changesets→v2 (maintenance, v1 already node24), aws-creds role flags (migration already in PR A), harden-runner, optional region var, docs updates. Rollback: revert the PR; hardening is additive with no data migration.
- Docs (`cicd-estado-actual.md`, `workflows-mantenimiento-guia.md`) are updated in the same PR that changes what they describe, so the pipeline documentation never drifts from the code.

## Open Questions

- None blocking. The optional LOW region parametrization (D12) depends on whether `vars.AWS_REGION` is added to the repo — deferrable without changing specs, approach, or task structure.
