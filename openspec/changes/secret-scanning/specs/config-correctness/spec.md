# Spec Delta

## ADDED Requirements

### Requirement: Secret scanning gate taxonomy (blocking vs advisory)

Secret scanning SHALL be classified by enforcement level, following `docs/learning/secret-scanning.md` (§5.3, §6) and `docs/learning/quality-gates.md`: the PR-time scan (job `secrets`, `name: Secret Detection` in `.github/workflows/security.yml`) SHALL be a **blocking** gate that fails the check when a secret is found in the PR diff (gitleaks default `--exit-code 1`), and the scheduled full-history scan (job `gitleaks-full-scan` in `.github/workflows/scheduled-security.yml`) SHALL remain **advisory/audit** (`continue-on-error: true` + JSON/SARIF artifacts, findings reported as issues, never blocking merges). `continue-on-error` SHALL NOT be applied to the PR-time gitleaks step, and the licensed `gitleaks/gitleaks-action@v3` step SHALL remain optional (conditional on `GIT_LEAKS` per `docs/CONTEXT-CICD.md` §5.6) — a missing license SHALL produce a `::warning::`, never a failure. The taxonomy table in `docs/learning/quality-gates.md` SHALL include a secret-scanning row.

#### Scenario: New secret in a PR blocks the check

- **WHEN** the `secrets` job scans the PR diff (`git --log-opts="base..head"`) and gitleaks reports a finding
- **THEN** the step SHALL exit non-zero and the `Secret Detection` check SHALL fail, blocking the PR

#### Scenario: PR gate never uses continue-on-error

- **WHEN** `.github/workflows/security.yml` job `secrets` is inspected
- **THEN** no `continue-on-error` SHALL be set on the OSS gitleaks scan step

#### Scenario: Scheduled full-history scan stays advisory

- **WHEN** the weekly full-history scan reports a historical finding
- **THEN** the run SHALL NOT fail because of it: both scan steps SHALL keep `continue-on-error: true` and SHALL upload the JSON/SARIF artifacts anyway

#### Scenario: Taxonomy row documented

- **WHEN** the gate taxonomy table in `docs/learning/quality-gates.md` is read
- **THEN** it SHALL contain a secret-scanning row marking `Secret Detection` (PR) as blocking and `gitleaks-full-scan` as advisory

### Requirement: Gitleaks CLI commands and `.gitleaks.toml` correctness

Scripts SHALL use only non-deprecated gitleaks commands (`detect`/`protect` were deprecated in `v8.19.0` in favor of `git`/`dir`/`stdin`, per `docs/learning/secret-scanning.md` §3.2): `security:secrets` SHALL run `gitleaks git --pre-commit --staged --verbose --redact --config .gitleaks.toml` and `security:secrets:full` SHALL run `gitleaks git --verbose --config .gitleaks.toml`. `.gitleaks.toml` SHALL not silently override default rules: `[extend]` SHALL declare `disabledRules = ["generic-api-key"]` while the custom rule is renamed `custom-api-key` (same regex), each custom rule SHALL declare `keywords` (prefilter before the regex), value-bearing rules SHALL declare `entropy`/`secretGroup` to limit false positives, and test-directory allowlist paths SHALL be anchored regexes `'''(^|/)tests?/'''` instead of bare substrings like `'''tests'''` (a bare substring hides real secrets committed under fixtures). Global allowlist SHALL include `\.vscode/`; `database-url` SHALL allowlist `example|placeholder` matches with `regexTarget = "match"`; the placeholder allowlists for `apps/server/ecosystem.config.js` and the socket training files (`docs/CONTEXT-CICD.md` §13.4) SHALL be preserved. A full scan SHALL complete with exit 0 on a clean tree. **The `secret-scanning` check SHALL be implemented in `.github/workflows/ci.yml` job `secrets` substage 2C, wireado al agregador `prebuild-security-complete.needs`, para bloquear merges via ruleset `required_status_checks`.**

#### Scenario: No deprecated commands in scripts

- **WHEN** `grep -n "gitleaks detect\|gitleaks protect" package.json` is executed
- **THEN** it SHALL return no matches and both `security:secrets` scripts SHALL invoke `gitleaks git`

#### Scenario: Default rule is no longer overridden

- **WHEN** `.gitleaks.toml` is read
- **THEN** `[extend]` SHALL contain `disabledRules = ["generic-api-key"]` and no `[[rules]]` block SHALL declare `id = "generic-api-key"` (the custom rule SHALL be `custom-api-key`)

#### Scenario: Custom rules declare prefilter keywords

- **WHEN** the five custom rules (`custom-api-key`, `jwt-secret-variable`, `generic-secret-variable`, `password-assignment`, `database-url`) are inspected
- **THEN** each SHALL declare a `keywords` array, and value-bearing rules SHALL declare `entropy`/`secretGroup`

#### Scenario: Test allowlist is anchored, not a substring

- **WHEN** the test allowlist entry is evaluated against a path such as `apps/server/tests/helpers/auth.js`
- **THEN** it SHALL match `'''(^|/)tests?/'''`-style anchored regexes and SHALL NOT use the bare substring `'''tests'''` (which would match any path containing "tests")

#### Scenario: Scan is clean on the current tree

- **WHEN** `gitleaks git --config .gitleaks.toml --redact --no-banner` runs over the repository
- **THEN** the config SHALL parse without errors and the command SHALL exit 0 on a clean tree (finding-exit still applies to real findings)

### Requirement: Workflow enablement and `secret-scanning` required status check

Both secret-scanning workflows SHALL be operational at GitHub level: `security.yml` and `scheduled-security.yml` SHALL have `state = active` in the Actions API (no longer `disabled_manually`, per `docs/CONTEXT-CICD.md` §3.4/§5.9). After at least one successful run has revealed the exact check name, the `main` ruleset `required_status_checks` SHALL include the secret-scanning check — the job `name: Secret Detection` of job `secrets` in `.github/workflows/ci.yml`, substage 2C, wireado al agregador `prebuild-security-complete.needs` — referenced as the `secret-scanning` check — so a red or missing secret scan blocks merges (currently only 4 governance checks are required). The job SHALL keep `name: Secret Detection`, because renaming breaks the check binding (`CONTEXT-CICD.md` §3.5 rules 7/8). This requirement covers enablement by `gh workflow enable` / GitHub UI; enabling GitHub-native `secret_scanning` + push protection (§5.7) stays a documented follow-up.

#### Scenario: Workflows are active

- **WHEN** `gh api repos/<owner>/<repo>/actions/workflows` is queried
- **THEN** `security.yml` and `scheduled-security.yml` SHALL report `state: active`

#### Scenario: PR reports the secret-scanning check

- **WHEN** a pull request targets `main`
- **THEN** the `Secret Detection` check SHALL be reported on the PR head commit

#### Scenario: Check is required by the ruleset

- **WHEN** the `main` ruleset `required_status_checks` is read
- **THEN** it SHALL include `Secret Detection` (strict) alongside the existing governance checks, and a merge SHALL be blocked while that check is failing or pending

#### Scenario: Exact check name is preserved

- **WHEN** the `secrets` job of `security.yml` is edited
- **THEN** its `name:` SHALL remain exactly `Secret Detection` so the ruleset binding does not break

### Requirement: `notify-failure` reacts to step outcome and docs reflect state

In `.github/workflows/scheduled-security.yml`, the `notify-failure` job SHALL NOT rely on the job-level `failure()` condition, because its scan steps use `continue-on-error: true` and therefore leave the job in `success` — a dead path (per `docs/learning/secret-scanning.md` §5.3 and `quality-gates.md` §3 semantics). The job SHALL use `if: always()` combined with a step-level outcome check (`steps.<scan-id>.outcome == 'failure'` for the JSON and SARIF scan steps, which SHALL carry explicit `id:`s) so an issue is created exactly when a scan step failed, and skipped when both succeed. Documentation SHALL reflect the implemented state: `docs/learning/secret-scanning.md` (commands, config fixes, enablement, notify fix) and `docs/CONTEXT-CICD.md` §13.4 (`security:secrets` no longer deprecated), §5.6 (`GIT_LEAKS` optional) and §5.7 (native secret scanning status).

#### Scenario: Condition uses step outcome, not job failure

- **WHEN** `.github/workflows/scheduled-security.yml` is read
- **THEN** `notify-failure` SHALL have no `if: failure()` condition and SHALL evaluate `steps.<scan-id>.outcome == 'failure'` under `if: always()`, and both scan steps SHALL declare explicit `id:` values

#### Scenario: Issue created when a scan step fails

- **WHEN** either scan step finishes with `outcome == "failure"` (findings or tool error)
- **THEN** `notify-failure` SHALL run and create a GitHub issue linking the workflow run

#### Scenario: No issue on a clean run

- **WHEN** both scan steps succeed
- **THEN** `notify-failure` SHALL be skipped and no issue SHALL be created

#### Scenario: Documentation matches implemented state

- **WHEN** `docs/learning/secret-scanning.md` and `docs/CONTEXT-CICD.md` (§13.4/§5.6/§5.7) are read after the change
- **THEN** they SHALL describe the current commands (`gitleaks git`), the corrected `.gitleaks.toml`, the `active` workflow states, the required `Secret Detection` check and the `steps.*.outcome` notification logic
