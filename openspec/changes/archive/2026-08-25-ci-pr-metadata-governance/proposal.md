# Proposal: PR Metadata Governance

## Why

Enterprise compliance requires traceability, consistent reviews, and IP chain-of-custody on every change. Current governance covers commit format (commitlint) and signing (SSH/GPG), but lacks PR-level metadata enforcement — title validation, DCO sign-off, and structured body templates.

## What

Add three layers of PR metadata governance to the CI pipeline:

1. **PR Title Lint** (P1): Validate PR title follows Conventional Commits via `amannn/action-semantic-pull-request@v6`. Closes the squash-message gap — with `squash_merge_commit_title=PR_TITLE`, the PR title becomes the final commit message on main.

2. **DCO Sign-off** (P1.5): Validate `Signed-off-by` trailers on all commits in the PR via `KineticCafe/actions-dco@v3.2.0`. Whitelist dependabot via `well-known` policy. Required check in ruleset 21227644.

3. **PR Template + Guidelines** (P2): Structured PR body template (.github/PULL_REQUEST_TEMPLATE.md) with summary, type/scope, related issue, testing evidence, screenshots, and pre-merge checklist. Optionally add CODEOWNERS.

## Design Decisions

- **DCO tool**: KineticCafe/actions-dco@v3.2.0 (richest bot config, TOML, well-known policy)
- **Squash setting**: change `squash_merge_commit_title` from `COMMIT_OR_PR_TITLE` → `PR_TITLE` for consistency
- **Body enforcement**: template + review culture (no automation — GitHub cannot enforce body content natively)
- **CI pattern**: parallel jobs, no needs, ADD-only per CI_MINIMAL, ci-complete gate
- **Ruleset**: add `DCO` + `PR Title Lint` to ruleset 21227644 as required checks

## Scope

- Affects: `.github/workflows/ci.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `CONTRIBUTING.md`
- Admin action needed: repo squash_merge_commit_title setting (user must do manually)
- Does NOT affect: existing commitlint, commit signing, or other workflows
