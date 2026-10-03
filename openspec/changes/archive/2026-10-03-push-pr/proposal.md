# Proposal

## Why

Developers currently push branches and open PRs manually, with ad-hoc PR titles that frequently fail the CI `pr-title-lint` job (Conventional Commits type + lowercase subject). There is no guided command that enforces the repo's Trunk-Based Development rules (never on `main`, never with 0 commits ahead, never with a dirty working dir) before pushing and opening a PR, and no automated detection of an already-open PR for the branch.

## What Changes

- Add a new slash command `/push-pr` (target file: `.opencode/command/push-pr.md`) that pushes the current branch and opens a PR to `main`.
- The command does NOT create commits — it assumes commits already exist (creation stays in `/commit-all`).
- Inspection runs `git fetch origin main` (refreshing `refs/remotes/origin/main`, NOT local `main`) BEFORE computing the range `origin/main..HEAD` (never `main..HEAD`), so the zero-commits abort and title derivation reflect the remote state regardless of a stale or absent local `main`; if the fetch fails (`origin` unreachable), the command aborts at inspection with the fetch error verbatim and never pushes.
- Abort conditions enforced before any push or PR-creating side effect: currently on `main`, zero commits in `origin/main..HEAD`, dirty working directory (`git status --short` non-empty).
- Existing-PR detection via `gh pr view --json url,state` (runs BEFORE the push, doubling as the `gh` availability gate): only an `open` PR blocks creation (push + report its URL, skipping steps 4-7 and reporting at step 8); a `closed`/`merged` PR for the branch falls through to steps 4-7 (push, derive title, validate title, then create a NEW PR — never created inline before title validation); any `gh` failure other than combined stdout+stderr containing `no pull requests found for branch` plus the current branch name (uninstalled, unauthenticated, network) → abort with an actionable error (via `gh auth status`) BEFORE pushing, never treated as "no PR exists".
- Push with `git push -u origin HEAD`; on push failure (non-fast-forward or unreachable `origin`) stop, print the error verbatim, create no PR, and NEVER force-push.
- PR title derivation: `$ARGUMENTS` if non-empty, otherwise the subject of the MOST RECENT commit in `origin/main..HEAD` (first line of `git log --oneline origin/main..HEAD`, newest-first, leading short hash stripped: `<short-hash> <subject>` → subject only); validate with `npm run pr:title-check -- "<title>"` run from the repository root (monorepo — the script exists only in the root `package.json`) and abort on failure.
- PR body composed from `.github/PULL_REQUEST_TEMPLATE.md` plus the list of new commits (hash + subject from `origin/main..HEAD`), passed to `gh pr create --base main --title "<title>" --body-file "<path>"` with the path quoted (win32 paths may contain spaces).
- Inherits `/commit-all` safety rules: `--no-verify` forbidden, amend forbidden, force-push forbidden, hooks bypass forbidden, `description:` frontmatter required.

## Capabilities

### New Capabilities

- `local-push-pr`: the `/push-pr` slash command's push + PR-creation behavior — branch/commit/dirty-tree preconditions over the `origin/main..HEAD` range, `gh` availability gating, existing-PR idempotency (open → push + report only; closed/merged → steps 4-7 with title validation before any `gh pr create`), Conventional Commits title derivation and validation, template-based PR body, push-failure stop, and reporting.

### Modified Capabilities

<!-- None: existing capabilities keep their requirements. -->

## Impact

- **New file**: `.opencode/command/push-pr.md` (slash command definition).
- **Existing infra reused (no changes)**: `scripts/hooks/pr-title-check.js`, `scripts/hooks/pr-create.js`, `package.json` scripts `pr:title-check` / `pr:create`, `.github/PULL_REQUEST_TEMPLATE.md`.
- **External dependencies**: `gh` CLI authenticated, `origin` remote reachable (the range base is `origin/main`; a local `main` branch is NOT required).
- **Docs (optional follow-up)**: `CONTRIBUTING.md` §PR Title Format, `docs/CONTEXT-CICD.md` §10.4 cross-references.
- **No application code, API, or CI workflow changes.**
