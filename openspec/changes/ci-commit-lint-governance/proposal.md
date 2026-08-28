## Why

Local Husky `commit-msg` hook is bypassable via `git commit --no-verify`. Enterprise defense-in-depth requires a non-bypassable CI gate that validates commit messages against Conventional Commits format. The existing `verify-signatures` job validates GPG signing but NOT commit message format. Additionally, the current `.husky/commit-msg` hook has a bug: it runs `commitlint --edit $1` without the `npx --no --` prefix, which fails when commitlint is not on PATH.

## What Changes

- **Fix** `.husky/commit-msg` hook: add `npx --no --` prefix to commitlint invocation
- **Add** `commit-lint` job to `.github/workflows/ci.yml`: validates all PR commit messages against Conventional Commits using commitlint
- **Handle** both `pull_request` (lint full range `base.sha..head.sha`) and `merge_group` (lint only `--last` squash commit) events
- **Register** commit-lint as a required status check in GitHub branch protection ruleset

## Capabilities

### New Capabilities

- `ci-commit-lint-governance`: CI validation gate that enforces Conventional Commits format on all PR commits, complementing the local Husky hook with a non-bypassable server-side check

### Modified Capabilities

(none — no existing spec-level behavior changes)

## Impact

- **Files**: `.github/workflows/ci.yml` (add job), `.husky/commit-msg` (fix bug)
- **Dependencies**: `wagoid/commitlint-github-action@v6` (new GitHub Action)
- **Existing jobs**: commit-lint runs in parallel with build/test (no `needs:` dependency), no impact on existing job execution
- **Ruleset**: requires manual configuration in GitHub UI to register commit-lint as required check
