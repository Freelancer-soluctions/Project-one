# Prebuild Security Stage — Analysis, Gap Report, and Adoption Plan

**Date:** 2026-11-10 (repo date context)
**Repository:** project-one (monorepo: Node/Express backend + React client + Playwright E2E)
**Scope:** Prebuild substage 2C (ci.yml) + `security.yml` + `scheduled-security.yml` + aggregator `prebuild-security-complete`
**Reference:** `PRDS/Análisis-del-stage-SECURITY-estrategias-y-gates.md` (target = maturity level 3 enterprise)

## 1. Executive summary

- The prebuild security substage (2C) contains **9 jobs in ci.yml** plus jobs in `security.yml` and `scheduled-security.yml`. Of the 9 in 2C, only **3 are blocking** (`dependency-review`, `secrets`, `scancode-license-pr-diff` is advisory-flagged but listed in aggregator needs) — the rest are FASE 1 advisory (`continue-on-error: true`, not in aggregator `needs`).
- The aggregator `prebuild-security-complete` currently `needs: [dependency-review, secrets, scancode-license-pr-diff]`. Anti-skip only checks `secrets` on PRs.
- `security.yml` and `scheduled-security.yml` were re-enabled 2026-09-25 but run advisory/audit mode (L3 audit) with `continue-on-error: true` on scan steps.
- Gap vs the PRD's level-3 target: ~14 of the 16 "Definition of Done" checkboxes are unmet (exceptions file missing, SLA undefined, runbooks missing, metrics missing, aggregator not strict enough, scheduled scans advisory).
- Internet research corroborates most PRD recommendations; several are **not directly implementable** (see §5).

## 2. Inventory — prebuild security stage jobs

### 2.1 ci.yml — SUBSTAGE 2C (PR-time)

| #   | Job id                     | Name                                                  | Trigger           | Blocking?         | continue-on-error                   | needs          | Tool / version                                                                            | Notes                                                                                                                                      |
| --- | -------------------------- | ----------------------------------------------------- | ----------------- | ----------------- | ----------------------------------- | -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `dependency-review`        | Security: Dependency Review                           | PR                | YES               | false (default)                     | repo-discovery | `actions/dependency-review-action@v5`                                                     | fail-on-severity moderate; vulnerability-check + license-check; config-file `.github/license-policy.yml`; comment-summary-in-pr on-failure |
| 2   | `secrets`                  | Security: Secret Detection                            | PR or merge_group | YES               | false (default) (licensed step COE) | —              | gitleaks docker `zricethezav/gitleaks:v8.30.1` + `gitleaks/gitleaks-action@v3` (optional) | scans PR diff; licensed action COE (token optional). Anti-skip in aggregator                                                               |
| 3   | `scancode-license-pr-diff` | Security: ScanCode License PR-Diff (advisory, FASE 1) | PR                | Advisory (FASE 1) | true                                | —              | `aboutcode/scancode-toolkit:32.5.0`                                                       | ACMR diff; deny-list from license-policy.yml; retention 14d                                                                                |
| 4   | `lockfile-audit`           | Security: Lockfile Audit (advisory, FASE 1)           | PR                | Advisory          | true                                | repo-discovery | `npm audit --audit-level=moderate`                                                        | reads lockfile directly; no npm ci                                                                                                         |
| 5   | `checkov-iac`              | Security: Checkov IaC (advisory, FASE 1)              | PR                | Advisory          | true                                | repo-discovery | `bridgecrewio/checkov-action@v12`                                                         | soft_fail: true; frameworks dockerfile/terraform/kubernetes                                                                                |
| 6   | `containerfile-lint`       | Security: Containerfile Lint (advisory, FASE 1)       | PR                | Advisory          | true                                | repo-discovery | `hadolint/hadolint-action@v3.1.0`                                                         | failure-threshold: info; Dockerfile apps/server/Dockerfile                                                                                 |
| 7   | `actionlint-advisory`      | Security: ActionLint Advisory (SARIF, FASE 1)         | PR                | Advisory          | true                                | repo-discovery | `rhysd/actionlint:1.7.12` docker                                                          | SARIF; upload to Code Scanning                                                                                                             |
| 8   | `zizmor-advisory`          | Security: Zizmor Advisory (unpinned-uses, FASE 1)     | PR                | Advisory          | true                                | repo-discovery | `uvx zizmor@1.30.1`                                                                       | SHA-pinned setup-uv; policy `.github/zizmor.yml`                                                                                           |
| 9   | `typosquat-guarddog`       | Security: Typosquat GuardDog (advisory, FASE 1)       | PR                | Advisory          | true                                | repo-discovery | GuardDog v3.2.0 via `scripts/guarddog-verify.sh`                                          | requires network; devDeps excluded                                                                                                         |

### 2.2 security.yml (PR-time, re-enabled)

| Job                 | Name                             | Blocking?                 | Tool                          | Notes                                                            |
| ------------------- | -------------------------------- | ------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `dependency-scan`   | SAST/SCA?                        | Advisory (scan steps COE) | (file read partial)           | `continue-on-error` on analyze steps; outputs scan-sarif-outcome |
| `sast`              | SAST Semgrep                     | Advisory                  | Semgrep (docker)              | `--baseline-commit` diff-scoped; L2                              |
| `semgrep-full-scan` | Semgrep Full Scan (Weekly Audit) | Advisory (audit mode)     | `semgrep/semgrep:1.176.1`     | JSON + SARIF; `--error`                                          |
| `sbom`              | Generate SBOM                    | —                         | `anchore/sbom-action@v0.24.0` | CycloneDX JSON; retention 365d                                   |
| `notify-failure`    | Notify on Failure                | —                         | github-script                 | dedupes weekly issue `[weekly-security-scan]`                    |

### 2.3 scheduled-security.yml (weekly cron)

| Job                         | Name                        | Blocking?          | Tool                        | Notes              |
| --------------------------- | --------------------------- | ------------------ | --------------------------- | ------------------ | --- | ----- |
| `dependency-scan`           | (weekly)                    | Advisory           | (various)                   | weekly SCA         |
| `sast`                      | SAST full?                  | Advisory           | Semgrep                     | full scan          |
| `semgrep-full-scan`         | Semgrep Full Scan           | Advisory           | Semgrep 1.176.1             | weekly audit       |
| `sbom`                      | SBOM                        | —                  | anchore                     | weekly             |
| `checkov-iac-weekly`        | Checkov IaC Weekly          | Advisory           | `bridgecrew/checkov:3`      | `                  |     | true` |
| `containerfile-lint-weekly` | Containerfile Lint Weekly   | Advisory (job COE) | `hadolint/hadolint:v2.15.1` | advisory scheduled |
| `zizmor-weekly`             | Pipeline Config Scan Weekly | Advisory           | `uvx zizmor@1.30.1`         | advisory scheduled |
| `guarddog-weekly`           | Typosquat GuardDog Weekly   | Advisory           | GuardDog v3.2.0             | advisory scheduled |
| `notify-failure`            | Notify on Failure           | —                  | github-script               | issue dedup        |

### 2.4 Aggregator

`prebuild-security-complete` (ci.yml ~3028): `if: vars.CI_MINIMAL != 'true' && always()`; `needs: [dependency-review, secrets, scancode-license-pr-diff]`; anti-skip only for `secrets` on PR.

## 3. Gap analysis vs PRD target (level 3 enterprise)

| PRD "Definition of Done" item                                                                 | Status                     | Gap                                                                                                                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `security-complete` exists & fails on non-success                                             | Partial                    | needs list excludes 6 advisory jobs; strict anti-skip only secrets                                                                                        |
| Ruleset requires `ci-complete` + `security-complete` only by name                             | Unknown/needs verification | ruleset 21227644 binds `Governance: PR Body Lint` + `Prebuild Governance Complete` per ci.yml comment — security-complete may NOT be a required check yet |
| Secrets: pre-commit + push protection + PR + scheduled history, all blocking                  | Partial                    | PR (Gitleaks) blocking; pre-commit exists (`pre-commit-secret-gate` spec); push protection status unverified; scheduled history advisory                  |
| SAST: fail-on-new blocking w/ baseline + weekly full                                          | Partial                    | L2 (`sast`) graduated to blocking in governance aggregator; full weekly advisory                                                                          |
| SCA: lockfile mandatory, reproducible install, PR verification blocking, scheduled monitoring | Advisory                   | lockfile-audit advisory; no OSV-Scanner/Snyk verifier; no scheduled SCA gate                                                                              |
| Dependabot w/ grouping, cooldown, 3 ecosystems                                                | Unknown                    | need to read `.github/dependabot.yml`                                                                                                                     |
| Licenses: deny-list by distribution model + unknown rule                                      | Partial                    | deny-list exists; `unknown` never blocks (by design); distribution model decision pending                                                                 |
| zizmor + actionlint blocking; third-party actions SHA-pinned                                  | Partial                    | actionlint/zizmor advisory FASE 1; most actions SHA-pinned (setup-uv, etc.) but some use tags (checkov-action@v12, dependency-review@v5)                  |
| `security/exceptions.yml` w/ owner+expiry + job that fails on expiry                          | MISSING                    | no file, no job                                                                                                                                           |
| SLA defined & measured                                                                        | MISSING                    | no SLA doc                                                                                                                                                |
| Reports w/ retention by type + redacted secrets                                               | Partial                    | retention varies 14/30/90/365; redaction in gitleaks `--redact` only                                                                                      |
| Runbooks written & tested                                                                     | Partial                    | `docs/runbooks/` exists? unverified                                                                                                                       |
| Framework mapping reviewed                                                                    | Partial                    | doc has mapping                                                                                                                                           |
| Monthly metrics review recorded                                                               | MISSING                    | no automation                                                                                                                                             |

Other gaps: lockfile integrity verification, Dependabot cooldown verification, image scanning (post-build, out of scope), exception policy.

## 4. Internet-researched validation (verified via live web search 2026-11-10)

The following claims from the reference doc and the inventory were verified against primary sources:

- **Gitleaks v8.30.1** (docker image) — stable, widely used; `--redact` supported. Licensed action v3 requires license token. ✅ implementable.
- **Dependency Review Action v5** — supports `config-file` (YAML) and `comment-summary-in-pr`. Verified against GitHub docs: `config-file` accepts local/external paths. ✅ implementable; note `deny-licenses` deprecated in favor of config file (already done).
- **ScanCode 32.5.0** — `--json-pp` supported; `--csv` deprecated (#3043) as doc says. ✅ implementable but slow (30-min timeout justified).
- **Checkov** — `soft_fail` input supported; baseline fail-on-new requires `.checkov.baseline` (verified: `--baseline` and `--create-baseline` flags exist). ✅ implementable.
- **Hadolint** — `failure-threshold` supports info/warning/error. ✅
- **zizmor 1.30.1** — **VERIFIED**: `--format=sarif` always exits 0 even with findings; exit codes 11+ only in plain mode. Source: zizmor docs "Exit codes" + integrations page. This is why the repo's pipeline-config-scan spec uses `jq -e '.runs[0].results | length == 0'` as the gate. ✅ implementable with explicit SARIF parsing.
- **GuardDog 3.2.0** — requires network; no config file (wrapper needed). ✅
- **OSV-Scanner** (PRD recommendation for SCA verifier) — open source, reads lockfiles (npm/yarn/pnpm/bun), queries OSV DB. **VERIFIED: does NOT compute EPSS or KEV natively** (only CVSS); EPSS/KEV require joining against FIRST EPSS feed + CISA KEV catalog. ✅ implementable as CVE gate only; full triage needs enrichment.
- **Snyk** — commercial; requires account/token. ⚠️ not free; PRD marks decision open.
- **Push protection (GitHub secret scanning)** — **VERIFIED**: available free on public repos; on private repos requires GitHub Advanced Security (paid license). Repo visibility/plan must be confirmed before promising push protection. ✅ conditionally implementable.
- **Rulesets requiring `security-complete`** — GitHub rulesets support required status checks by context name. ✅ implementable, but the check name must match exactly (`Prebuild Security Complete`).
- **Dependabot `cooldown`** — **VERIFIED**: supported in dependabot.yml v2 (default 3-day cooldown even without config). ✅ implementable.
- **GitHub Code Scanning / SARIF upload** — `github/codeql-action/upload-sarif@v4` supports third-party SARIF. ✅ (already used).
- **TruffleHog** for history scanning with credential verification — ✅ implementable but adds runtime; PRD suggests using alongside Gitleaks in different layers.

## 5. Items in the PRD that are NOT (directly) implementable

1. **"Secretos: pre-commit, push protection, PR y historial programado activos y bloqueantes"** — Push protection on private repos requires GitHub Advanced Security (paid). If the repo is private without GHAS, push protection is unavailable; must rely on pre-commit + PR scan. Verify plan.
2. **"SCA: OSV-Scanner o Snyk como verificador bloqueante"** — OSV-Scanner needs a lockfile and network; for npm, `osv-scanner --lockfile=package-lock.json` works. But the PRD's "explotabilidad (EPSS/KEV/reachability)" — OSV-Scanner does NOT compute EPSS or reachability natively; only Snyk/Dependabot insights provide reachability. Implementable as CVE gate only; full triage requires commercial tooling or manual.
3. **"Lockfile obligatorio (PR que cambia package.json sin lockfile falla)"** — GitHub does not natively enforce lockfile presence; requires a custom check (e.g., `npm ci` fails if lockfile missing, or a script). Implementable via a job step, not a built-in.
4. **"Job que falla si una excepción venció"** — Requires building a custom script/parser for `security/exceptions.yml` and a CI job. Implementable but not a built-in GitHub feature.
5. **"Métricas con revisión mensual"** — No built-in; requires custom workflow + issue creation. Implementable but operational overhead.
6. **"actions de terceros fijadas por SHA"** — Some actions in use are tag-pinned (`dependency-review-action@v5`, `checkov-action@v12`, `sbom-action@v0.24.0`, `hadolint-action@v3.1.0`). Pinning all to SHA is implementable but increases maintenance; Dependabot github-actions ecosystem can keep SHAs updated (as PRD notes).
7. **"Ruleset exige security-complete y nada más por nombre de job"** — The ruleset currently (per ci.yml comments) binds `Governance: PR Body Lint` + `Prebuild Governance Complete`. Adding `Prebuild Security Complete` requires ruleset edit; must confirm the exact check context name matches the job's `name:` field (`Prebuild Security Complete`).
8. **"Hadolint pre-commit"** — Hadolint is a binary; running in pre-commit requires installing it locally or via docker. Implementable but adds local setup friction.
9. **"IaC (Checkov/tfsec/KICS)"** — Only useful if Terraform/K8s files exist. The repo is Node/React/Express with a Dockerfile; no Terraform/K8s detected. Implementing Checkov on dockerfile-only is low value; should be conditioned on file presence (as PRD observation #7).

## 6. Recommended adoption order (concrete changes to make every job blocking)

Following PRD's phased plan, adapted to current repo state:

**Phase 0 — Aggregator strictness (do first):**

- Add all 9 security jobs to `prebuild-security-complete.needs`.
- Add anti-skip checks for jobs that must run on PR (at minimum secrets, dependency-review; scancode only if PR has ACMR changes).
- Ensure `if: always()` + `contains(..., 'failure')` + `contains(..., 'cancelled')` + `contains(..., 'skipped')` for required ones.

**Phase 1 — Secrets + pipeline config blocking:**

- Remove `continue-on-error` from `zizmor-advisory` and `actionlint-advisory` (rename to drop "advisory"), gate on `jq -e '.runs[0].results | length == 0'`.
- Keep gitleaks blocking (already).

**Phase 2 — SAST:**

- Already graduated `sast` (diff, fail-on-new) to blocking in governance aggregator. Add weekly full scan to scheduled with issue-on-failure (already notify-failure exists but advisory).

**Phase 3 — Dependency Review + SCA (2-4 weeks advisory → blocking):**

- Promote `lockfile-audit` to blocking (remove COE), add to aggregator needs.
- Add OSV-Scanner step (optional enhancement) for reachability-independent CVE gate.

**Phase 4 — Licenses:**

- Decide distribution model (SaaS vs on-prem) to confirm deny-list.
- Promote `scancode-license-pr-diff` to blocking after 4 clean weeks; define `unknown` triage SLA.

**Phase 5 — Hadolint, IaC, typosquatting:**

- Promote `containerfile-lint` to blocking (failure-threshold warning) after 2-4 clean weeks.
- Condition `typosquat-guarddog` on manifest/lockfile changes.
- Keep Checkov advisory unless IaC files exist.

**New artifacts to create:**

- `security/exceptions.yml` + CI job that fails on expired exceptions.
- `security/license-policy.md` (narrative) — already referenced.
- SLA doc + monthly metrics workflow.
- Runbooks under `docs/runbooks/security/`.

## 7. Top recommendations

1. **Make the aggregator strict first** — without it, no later blocking change protects anything (PRD Fase 0 / G7).
2. **Rename advisory jobs** when promoting (drop "advisory"/"FASE 1" from names) to avoid stale labels.
3. **Verify repo visibility/plan** before promising push protection (GHAS requirement).
4. **Confirm ruleset** actually requires `Prebuild Security Complete` (current comments suggest it may not).
5. **Add `security/exceptions.yml`** — single highest-value missing control for level 3.
6. **Pin remaining tag-pinned third-party actions to SHA** via Dependabot github-actions ecosystem.

---

---

## 8. Deep internet research — detailed findings by control area

This section deepens the corroboration in §4 with primary sources, implementation caveats, and enterprise patterns verified via live web search on 2026-11-10.

### 8.1 Secrets — Gitleaks, TruffleHog, and GitHub native

**Three-layer model (validated by industry).** The PRD's four layers (pre-commit / push protection / PR / scheduled history) map to the industry-standard three-gate model documented by KeyDrift and SecRails:

- Pre-commit (local hook): scans staged files in milliseconds; `gitleaks protect --staged --redact`. Cheapest, but bypassable with `--no-verify` (E2 shift-left as feedback).
- Push protection (server-side): blocks push before it reaches the repo; only partners patterns + custom patterns + generic patterns (private keys, DB connection strings). Only reliable for partnered patterns.
- CI (build job): full checkout + history; runs after the leak already entered history — backstop, not prevention.
- Scheduled (weekly full history): detects what entered before controls existed and new rules applied to old code.

**Gitleaks specifics (verified):**

- `--redact` supported; redacts secret values in output so artifacts aren't a second leak.
- Baseline file supported (`gitleaks detect --baseline-path`) — essential for legacy repos with hundreds of false positives.
- Custom rules via `.gitleaks.toml` with `keywords` (prefilter), `entropy`, `secretGroup` — matches the repo's secret-scanning spec.
- `generic-api-key` rule is noisy; disabling it (as the repo does) and renaming to `custom-api-key` is a documented pattern.

**TruffleHog vs Gitleaks (verified, SecRails 2026-06):** TruffleHog verifies whether a credential is still active against the provider (reduces false positives); Gitleaks is faster and rule-tunable. Mature posture uses Gitleaks pre-commit + TruffleHog in CI + GitHub native as backstop. The PRD's "use both in different layers" is corroborated.

**GitHub native secret scanning (verified):**

- Public repos: secret scanning + push protection free.
- Private repos: requires GitHub Secret Protection (paid, part of GHAS). Push protection for private repos requires the paid license.
- Native scanning only covers default branch + open PRs by default; full history needs explicit config.
- Partner program auto-notifies 200+ providers (AWS, Stripe, etc.) for auto-revocation — unique to native.
- Custom patterns supported but more limited than Gitleaks TOML.

**Conclusion for the repo:** The repo's gitleaks-based PR gate is correct and free; push protection availability depends on repo visibility/plan (must verify). Native scanning should be enabled as a backstop if the plan allows.

### 8.2 SAST — Semgrep vs CodeQL

**Semgrep (verified, Safeguard 2026-05 + LinkedIn InfoQ 2026-02):**

- Lightweight pattern matching (YAML rules); anyone who reads the language can author rules.
- `--baseline-commit` reports only findings not in the baseline commit → fail-on-new.
- SARIF output via `--sarif-output`; runs in container `semgrep/semgrep`.
- Diff-aware scanning; PR comments; sub-5-minute PR gating feasible.
- Community Edition (LGPL-2.1) needs no account; `semgrep ci` needs token.
- CodeQL needs DB build (expensive on large monorepos); better for nightly deep scans.
- Many large orgs run both: CodeQL for deep dataflow on Java/C++, Semgrep for breadth + custom rules.

**CodeQL (verified):**

- Default setup toggle vs advanced setup workflow file; v3 deprecated Dec 2026, v4 on Node 24.
- Default setup and advanced setup cannot mix.
- For private repos, code scanning needs a GitHub Code Security license.

**Conclusion for the repo:** The repo's Semgrep L2 (diff, fail-on-new) + L3 (weekly full) is a sound enterprise pattern. Adding CodeQL is optional and would require a license for private repos. The repo correctly uses `--baseline-commit` for fail-on-new.

### 8.3 SCA and Dependency Review

**Dependency Review Action (verified, GitHub docs):**

- `config-file` input accepts local (`.github/dependency-review-config.yml`) or external repo paths.
- Supports `fail-on-severity`, `fail-on-scopes`, `allow-licenses`/`deny-licenses`, `allow-ghsas`.
- Runs on PRs; compares manifest/lockfile changes.

**OSV-Scanner (verified, Google docs + GeekWala 2026-07 + AppSecSanta 2026-02):**

- Free, Apache-2.0, single static binary, no account.
- Reads npm/yarn/pnpm/bun lockfiles; 19+ lockfile formats across 11+ ecosystems.
- V2 added guided remediation (npm/Maven) with ROI-based upgrade ranking.
- Container image scanning (layer-aware, Debian/Ubuntu/Alpine).
- **Does NOT compute EPSS or KEV natively** — only CVSS. EPSS/KEV require joining against FIRST EPSS feed + CISA KEV catalog manually.
- Grype has EPSS/KEV natively; Snyk offers dashboard + auto-fix PRs + continuous monitoring.

**npm audit (repo's current lockfile-audit):** reads lockfile, `--audit-level=moderate`. Advisory-only in FASE 1. No reachability/EPSS.

**Conclusion for the repo:** Promoting `lockfile-audit` to blocking is fine for CVE gating. Full triage (EPSS/KEV/reachability) needs either Snyk (commercial) or manual enrichment. The PRD's "explotabilidad" claim is only partially implementable with free tools.

### 8.4 Licenses

**ScanCode (verified):** `--json-pp` supported; `--csv` deprecated (#3043) as the PRD says. Slow (30-min timeout justified). ACMR diff for PR-time; full repo weekly.

**License policy depends on distribution model (PRD observation):** GPL activates on distribution; AGPL also on network service. SaaS vs on-prem vs image delivery changes risk. The repo's deny-list (GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0) is a reasonable default but must be confirmed against the ERP's distribution model.

**`unknown` licenses:** The PRD's "warning that nobody reviews becomes noise" is corroborated. Define a triage SLA and block after 4 clean weeks.

### 8.5 IaC scanning

**Checkov (verified, checkov.io CLI ref):**

- `soft_fail` input (advisory), `--baseline`/`--create-baseline` for fail-on-new.
- `--hard-fail-on`/`--soft-fail-on` for severity-based gating.
- Frameworks: terraform, kubernetes, dockerfile, github_actions, etc.
- Only useful if IaC files exist. The repo has a Dockerfile but no Terraform/K8s detected → Checkov on dockerfile-only is low value. Keep advisory or condition on file presence (PRD observation #7).

**tfsec/KICS:** alternatives; KICS has broader framework support. Not needed unless IaC files appear.

### 8.6 Container image scanning (post-build, out of scope for this stage)

**Trivy vs Grype (verified, systemshardening 2026-05):**

- Trivy: most widely deployed; scans OS packages + language deps + K8s manifests in one binary; `exit-code: 1` to fail; `ignore-unfixed: true` to skip no-fix CVEs; SARIF upload.
- Grype (Anchore): separates SBOM generation (Syft) from vulnerability matching; enables re-scanning an existing SBOM against new vuln DB without rebuild.
- Best practice: scan base image separately from app image to attribute CVEs; `ignore-unfixed` to reduce noise.

**Conclusion:** The PRD correctly defers image scanning to post-build. The repo's SBOM job (anchore/sbom-action) is a good foundation.

### 8.7 Pipeline security (zizmor, actionlint, Hadolint)

**zizmor (verified, docs.zizmor.sh):**

- SARIF mode (`--format=sarif`) always exits 0 even with findings (by design — SARIF consumers expect semantic results in the file).
- Plain mode exits 11-14 by severity. The repo's pipeline-config-scan spec correctly uses `jq -e '.runs[0].results | length == 0'` as the gate.
- Detects expression injection, excessive permissions, unpinned actions, persisted credentials (artipacked).
- zizmor.yml config file required (minimum).

**actionlint (verified):** syntax validation, expression errors, shell script errors. Blocking on `.github/` changes is appropriate.

**Hadolint (verified):** `failure-threshold` supports info/warning/error. Error blocks, style warns. Dockerfile best practices (pinned base, non-root user, layer hygiene). Pre-commit requires local binary install or docker — friction.

**SHA pinning (verified, OWASP 2026 + GitHub docs):**

- Pin to full-length commit SHA + version comment. Dependabot github-actions ecosystem keeps SHAs updated.
- GitHub supports enforcing SHA pinning at enterprise/org/repo level via allowed-actions policy.
- Workflow dependency lockfiles (newer) supersede SHA pinning for full transitive pinning.
- The repo's tag-pinned actions (`dependency-review-action@v5`, `checkov-action@v12`, etc.) should be SHA-pinned; Dependabot can automate.

### 8.8 Typosquatting (GuardDog, Socket)

**GuardDog (verified, OpenSSF + GitHub issue #898):**

- Metadata scanners (typosquatting, binary executables) + Semgrep rules + YARA rules.
- Supports npm, PyPI, Go.
- **Known false positive problem:** on 12,111 npm packages, 263 flagged (2.2%); on PyPI ranks 15,001-30,000, 1,002 flagged (6.7%). False positives grow with target list; detection plateaus at ~4,000 targets.
- GuardDog's typosquatting heuristic has bugs (confused forms matching anywhere in term). Issue #898 open (2026-10).
- Condition on manifest/lockfile changes (PRD observation #6) is correct.

**Socket (verified, socket.dev):**

- Commercial; static analysis + metadata + maintainer behavior; 70+ signals.
- Typosquat defined as Levenshtein distance 1-2 from a popular package with 1000x download ratio.
- Socket CLI wraps npm install and blocks before writing to disk.

**Conclusion for the repo:** Keep GuardDog advisory (FASE 1) until 2-4 clean weeks; the false-positive rate is too high for immediate blocking. Consider Socket as a commercial alternative if budget allows.

### 8.9 GitHub rulesets and required status checks

**Verified (GitHub docs + troubleshooting):**

- Required check context name must match the actual check-run name published (not the "workflow / job" display format). Common pitfall: ruleset lists `"Workflow Name / job-name"` but GitHub publishes `"job-name"`.
- `skipped` and `neutral` count as success for required checks. This is why the aggregator must explicitly fail on `skipped` (the repo's secret-scanning-history-governance change does this for `secrets`).
- `merge_group` trigger required if using merge queues — otherwise required checks never report and block merge.
- Status checks must have run successfully in the past 7 days to be selectable.
- Rulesets can pin an expected source app (integration_id 15368 for github-actions) to prevent spoofing.
- Strict mode requires branch up-to-date; loose mode doesn't (fewer builds, risk of post-merge failures).

**Conclusion for the repo:** The ruleset must bind `Prebuild Security Complete` (exact job `name:`) as a required check, with github-actions as the expected source. Currently (per ci.yml comments) only governance checks are bound — this is a gap (PRD DoD item #2).

### 8.10 Security exceptions policy (E6)

**Industry pattern (verified, Cloudaware + GitLab + vulnerability management policy template):**

- Versioned file in repo (`security/exceptions.yml`) with: id, tool, finding, scope, reason, owner, created, expires, ticket.
- Every suppression (inline or file) references an exception id.
- CI job fails if any exception is expired → renewal is an explicit decision.
- Max expiry short (90 days proposed; GitLab uses 30/60/90/365 by severity).
- Changing the file requires CODEOWNERS review (same as workflows).
- Aggregator reports count of active exceptions and earliest expiry.
- GitLab pattern: permanent exceptions only for false positives, time-based preferred.

**Conclusion for the repo:** This is the single highest-value missing control for level 3. The repo has no `security/exceptions.yml` and no expiry-check job. Must create both.

### 8.11 SLA for vulnerability remediation

**Industry standard (verified, multiple sources):**

- Critical/KEV/exploit known: 7 days.
- High: 30 days.
- Medium: 90 days.
- Low: best effort.
- GitLab uses priority-based (P1-P4) with 30/60/90/365-day exceptions.
- SLA clock starts at detection; reassignment doesn't restart; pending exception doesn't pause clock.
- Evidence of active exploitation → accelerated deadline + immediate risk reassessment.

**Conclusion for the repo:** The PRD's SLA table (7/30/90/best-effort) is corroborated by industry. Must document and measure.

### 8.12 SBOM generation

**Verified (anchore docs):**

- `anchore/sbom-action` generates SPDX or CycloneDX (default spdx-json); Syft under the hood.
- `dependency-snapshot: true` uploads to GitHub Dependency submission API (enables Dependabot alerts on transitive deps).
- Retention configurable; release assets auto-attached.
- Two industry standards: SPDX (ISO/IEC 5962) and CycloneDX (OWASP). Both supported.

**Conclusion for the repo:** The repo's SBOM job is sound. Consider enabling `dependency-snapshot: true` for better Dependabot coverage.

### 8.13 Pre-commit hooks

**Verified (thevibesecurity.com 2026-09 + KeyDrift):**

- `pre-commit` framework with gitleaks hook (rev pinned).
- `gitleaks protect --staged --redact` scans only staged changes.
- Husky alternative for Node projects (`npm i -D husky && npx husky init`).
- The repo already has husky hooks (commit-msg, prepare-commit-msg, pre-push). Adding a gitleaks pre-commit hook fits the existing infrastructure.

### 8.14 NIST 800-53 RA-5 and SSDF mapping

**RA-5 (verified, NIST 5.2.0, updated 2026-05-11):**

- (a) Monitor and scan at organization-defined frequency + when new vulns reported.
- (b) Tools facilitating interoperability (SCAP, CVE, OVAL, CWE, CVSS).
- (c) Analyze scan reports.
- (d) Remediate within organization-defined response times.
- (e) Share info with defined personnel/roles.
- (f) Tools readily updatable.

**SSDF (SP 800-218):** RV.1 (identify vulns continuously), PW.4 (verify third-party components), PW.7 (analyze code), PS.1 (protect code).

**Conclusion for the repo:** The PRD's framework mapping is accurate. The repo's scheduled scans (weekly SAST/SCA/secrets/licenses) satisfy RA-5(a) frequency requirement. SLA table satisfies (d). CODEOWNERS satisfies sharing (e).

### 8.15 Dependabot configuration

**Verified (GitHub docs):**

- `cooldown` supported for npm, github-actions, docker (all in PRD example).
- Default 3-day cooldown even without explicit config (reduces supply chain risk from freshly published compromised packages).
- `groups` for minor/patch reduces PR noise.
- `open-pull-requests-limit` caps open PRs.
- Security updates separate from version updates (cooldown doesn't apply to security updates).

**Conclusion for the repo:** The PRD's dependabot.yml example is accurate and implementable. Must verify the repo's actual `.github/dependabot.yml` exists and matches.

### 8.16 Summary of non-implementable items (updated with web verification)

| #   | PRD item                                          | Status           | Reason                                                                                                                |
| --- | ------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Push protection on private repos                  | ⚠️ Conditional   | Requires GitHub Secret Protection (paid). Free on public repos only.                                                  |
| 2   | OSV-Scanner with EPSS/KEV/reachability            | ⚠️ Partial       | OSV-Scanner only outputs CVSS. EPSS/KEV need manual join. Reachability only in Snyk/Dependabot insights.              |
| 3   | Lockfile mandatory (PR without lockfile fails)    | ⚠️ Custom        | No native GitHub enforcement; requires a job step (e.g., `npm ci` fails if lockfile missing, or a script).            |
| 4   | Job that fails on expired exceptions              | ⚠️ Custom        | Requires building a parser for `security/exceptions.yml` + a CI job. Not a built-in feature.                          |
| 5   | Monthly metrics review                            | ⚠️ Custom        | No built-in; requires custom workflow + issue creation + human review.                                                |
| 6   | SHA-pinning all third-party actions               | ✅ Implementable | But increases maintenance; Dependabot github-actions ecosystem automates. Some actions (checkov-action@v12) use tags. |
| 7   | Ruleset requires `security-complete` only by name | ⚠️ Config        | Requires ruleset edit; exact check-run name must match job `name:` field. Currently only governance checks bound.     |
| 8   | Hadolint pre-commit                               | ⚠️ Friction      | Requires local binary install or docker. Implementable but adds setup friction.                                       |
| 9   | IaC (Checkov/tfsec/KICS)                          | ⚠️ Conditional   | Only valuable if Terraform/K8s files exist. Repo has Dockerfile only. Keep advisory or condition on file presence.    |
| 10  | Image scanning (Trivy/Grype)                      | ✅ Deferred      | Correctly deferred to post-build stage (not this stage).                                                              |

### 8.17 Consolidated recommendations (deepened)

1. **Phase 0 first** (PRD + web corroborated): Make `prebuild-security-complete` strict (`if: always()`, fail on failure/cancelled/skipped for required jobs). Without this, no later blocking change protects anything.
2. **Bind `Prebuild Security Complete` to the ruleset** as a required check with github-actions as expected source (exact name match).
3. **Verify repo visibility/plan** before promising push protection (GHAS requirement).
4. **Create `security/exceptions.yml` + expiry-check job** — highest-value missing control for level 3.
5. **Document SLA** (7/30/90/best-effort) and add monthly metrics workflow.
6. **SHA-pin remaining tag-pinned actions** via Dependabot github-actions ecosystem.
7. **Keep GuardDog advisory** until 2-4 clean weeks (2.2% npm / 6.7% PyPI false positive rate).
8. **Keep Checkov advisory** unless IaC files exist.
9. **Enable `dependency-snapshot: true`** on the SBOM job for better Dependabot transitive coverage.
10. **Add gitleaks pre-commit hook** via existing husky infrastructure (cheapest shift-left).
11. **Consider TruffleHog in CI** for credential verification (complements Gitleaks).
12. **Consider CodeQL** only if budget allows (license for private repos); Semgrep is sufficient for the repo's needs.

---

_Research-only deliverable. No code modified. Deep internet research completed 2026-11-10 with live web searches against primary sources (GitHub docs, tool docs, NIST, OWASP, industry blogs)._
