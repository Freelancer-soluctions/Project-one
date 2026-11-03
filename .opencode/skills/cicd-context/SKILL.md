---
name: cicd-context
description: >
  CI/CD context for Project One — GitHub Actions workflows, ruleset, gates,
  CI_MINIMAL, and repository governance. Use when working on CI/CD, GitHub
  Actions workflows, repository governance, or debugging pipeline status.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# CI/CD Context — Project One

On-demand CI/CD context. Full detail lives in `docs/CONTEXT-CICD.md`
(1737 lines); read it when deep detail is needed. This skill gives the
quick facts and where to look.

## Quick Facts

- **Repo:** public, default branch `main`, ruleset `21227644` "Require signed commits".
- **Workflows enabled (GitHub):** `ci.yml`, `opencode-review.yml`, plus `security.yml`/`scheduled-security.yml` (re-enabled 2026-09-25). `release.yml`, `preview.yml`, `deploy.yml`, `security-digest.yml` are `disabled_manually`.
- **Required status checks (ruleset):** `Governance: PR Body Lint` and `Prebuild Governance Complete`. `Verify Commit Signatures`, `Commit Lint`, `DCO` block only via the aggregator. `CI Complete` is NOT a required check.
- **CI_MINIMAL:** `false` since 2026-09-17. `ci-complete` runs.
- **Node version:** `.nvmrc` = `22.23.1` (single source of truth).
- **Secrets (5):** `APP_ID`, `APP_PRIVATE_KEY`, `APP_SSH_KEY`, `APP_SSH_PUB`, `GIT_LEAKS`. AWS secrets not provisioned (Phase 2 skipped).
- **GHAS / secret scanning / dependabot security updates:** DISABLED.

## Key Gates

- Commits MUST be signed (`git commit -S`, ED25519) and carry DCO `Signed-off-by`.
- Conventional Commits enforced by `commit-lint` + PR title lint.
- `pre-push` hook: fetch origin/main + signature gate (against versioned `allowed_signers`) + SAST diff-scoped + scoped tests.
- `pre-commit` hook: lint-staged + Gitleaks staged + 6 advisory layers.

## Where to Look

- Full CI/CD doc: `docs/CONTEXT-CICD.md`
- Workflow files: `.github/workflows/`
- Governance doc: `docs/learning/quality-gates.md`
- Commit signing: `docs/learning/ci-cd/05b-commit-signing.md`
- DCO: `docs/learning/dco.md`

## Active Changes

OpenSpec changes touching CI/CD live under `openspec/changes/`. Check `openspec list` for current state before assuming something is live.
