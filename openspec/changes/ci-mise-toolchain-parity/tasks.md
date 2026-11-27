# Tasks: ci-mise-toolchain-parity

## 1. Toolchain declaration

- [x] 1.1 Create `mise.toml` in repo root with node/python/uv and lint/security tools (aqua + pipx). Align Node/Python scope with design Non-Goals: declare Node for parity but keep `.nvmrc` as SSOT during migration.
- [ ] 1.2 Generate `mise.lock` with `mise lock --platform linux-x64,linux-arm64,macos-x64,macos-arm64,windows-x64`
- [ ] 1.3 Commit `mise.lock` and verify with `mise install --locked` on Windows + Linux
- [x] 1.4 Mark `.tool-versions` as deprecated (add header comment pointing to `mise.toml`)
- [x] 1.5 Reconcile hard-coded version constants in `scripts/sast-diff.mjs`, `scripts/guarddog-verify.sh`, `security/semgrep.ps1` with `mise.toml`

## 2. CI integration

- [ ] 2.1 Install Mise on runners via SHA-pinned `jdx/mise-action` with `locked: true` (before `mise install --locked`)
- [ ] 2.2 Add `mise install --locked` step to `ci.yml` (before pre-build jobs) with cache of `downloads-cas`
- [ ] 2.3 Add `mise install --locked` to `scheduled-security.yml` and `security.yml`
- [ ] 2.4 Add `toolchain-verify` job: `mise ls --locked` + `mise doctor` + version check
- [ ] 2.5 Add `MISE_LOCKED=1` env to all CI jobs using Mise
- [ ] 2.6 Migrate per-tool CI invocations: `docker://` (gitleaks, semgrep, actionlint, hadolint), `*-action@SHA` (checkov, hadolint), `uvx` (zizmor) to Mise-resolved binaries OR cross-check image tag/action version == `mise.lock` version; preserve SARIF categories, artifacts, and enforcement blocks
- [ ] 2.7 Add gitleaks migration task for `release.yml` (line 46) and a workflow audit task (grep-based) covering all workflows
- [ ] 2.8 Add `mise lock --check` to CI (drift detection)

## 3. Hooks (shifting left)

- [ ] 3.1 Update `.husky/pre-commit` to use `mise exec` for checkov, hadolint, actionlint, zizmor, gitleaks, guarddog
- [ ] 3.2 Update `.husky/pre-push` to use `mise exec` for typecheck, boundaries, SAST (semgrep), tests scoped
- [ ] 3.3 Ensure fail-open policy only for optional tools; fail-closed in CI
- [ ] 3.4 Add version check in pre-push: `mise ls --locked` or `mise doctor`

## 4. Scripts & onboarding

- [ ] 4.1 Replace `scripts/install-lint-tools.sh` with `mise install` (keep as wrapper/deprecated)
- [ ] 4.2 Create `scripts/mise-bootstrap.sh` for air-gapped (pre-seed cache)
- [ ] 4.3 Document onboarding in `docs/learning/ci-cd/` (install mise, `mise install --locked`, troubleshooting)
- [ ] 4.4 Document air-gapped mirror setup (Nexus/Artifactory/Harbor)

## 5. Governance & docs

- [ ] 5.1 Add `mise.toml` and `mise.lock` to CODEOWNERS
- [ ] 5.2 Update `docs/CONTEXT-CICD.md` with Mise as SSOT (versiones, lockfile, cache, air-gapped)
- [ ] 5.3 Update `AGENTS.md` / `cicd-context` skill with Mise onboarding and parity rules
- [ ] 5.4 Add `toolchain-verify` to required checks (ruleset) after validation
- [ ] 5.5 Document `enable_backends` policy (core, aqua, pipx) and trust model (normal/paranoid)
- [ ] 5.6 Document air-gapped mirror setup (Nexus/Artifactory/Harbor) and `MISE_OFFLINE=1`
- [ ] 5.7 Document Windows/macOS/Linux paths and troubleshooting (`mise doctor`)

## 6. Enterprise reproducibility

- [ ] 6.1 Add cache step for `downloads-cas` (not `installs`) in all workflows using Mise
- [ ] 6.2 Set `MISE_LOCKED=1` and `locked_require_checksum = true` in CI env
- [ ] 6.3 Generate lockfile with all platforms: `mise lock --platform linux-x64,linux-arm64,macos-x64,macos-arm64,windows-x64`
- [ ] 6.4 Verify aqua `supported_envs` for each tool (hadolint, actionlint, zizmor, gitleaks)
- [ ] 6.5 Add `mise lock --check` to CI (drift detection)

## 7. Validation & rollback

- [ ] 7.1 Test on Windows + Linux + macOS (or CI matrix)
- [ ] 7.2 Test air-gapped mode (`MISE_OFFLINE=1`)
- [ ] 7.3 Verify hook parity (local vs CI) with a test commit
- [ ] 7.4 Rollback plan: revert PR; `.tool-versions` fallback remains
- [ ] 7.5 Remove deprecated files after 2 weeks of stable operation
