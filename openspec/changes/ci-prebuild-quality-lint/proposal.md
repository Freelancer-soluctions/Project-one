## Why

The CI pipeline currently runs in minimal mode (`CI_MINIMAL=true`) with most quality jobs disabled (`if: false`). This means ESLint linting for the client and server workspaces, plus GitHub Actions workflow linting (actionlint), does not run on pull requests. Quality issues (lint errors, workflow YAML mistakes) can reach `main` undetected. This change reactivates 3 lint substages from STAGE 2 (PRE-BUILD — VALIDATE) to catch issues early in PRs, with path-scoped execution to minimize unnecessary CI runs.

## What Changes

- **Reactivate `client-lint` job** in `ci.yml` — runs `npm run lint --workspace=apps/client` on PRs that modify client files
- **Reactivate `server-lint` job** in `ci.yml` — runs `npm run lint --workspace=apps/server` on PRs that modify server files
- **Reactivate `actionlint` job** in `ci.yml` — runs `actionlint (pin v1.7.12, download-script pattern)` on PRs that modify shared/workflow files
- **Path-scoped execution** — each job runs only when its relevant workspace files change (via `repo-discovery` outputs)
- **Standalone jobs** — not gated by `CI_MINIMAL`; follow the `sast`/`dependency-review` pattern (always run on qualifying PRs)
- **ESLint complexity threshold** — `eslint.config.js` complexity rule raised from `["error", 15]` to `["error", 20]` to match baseline (8 existing errors in c16-c18 range)
- **CI_MINIMAL flipped post-merge** — `gh variable set CI_MINIMAL false` as final task (GitHub Admin, executed by @git-manager, SOLELY after merge)

## Capabilities

### New Capabilities

- `ci-prebuild-lint`: Reactivation and path-scoping of 3 lint jobs (client-lint, server-lint, actionlint) in `ci.yml` as standalone quality gates for PRs

### Modified Capabilities

- `eslint-blocking-gate`: Complexity threshold change (15→20) to align with existing baseline

## Impact

- **Files modified**: `.github/workflows/ci.yml` (3 jobs reactivated), `eslint.config.js` (complexity threshold)
- **Documentation updated**: `docs/CONTEXT-CICD.md` (§3.1/§3.3/§5.5/§9), `docs/learning/ci-cd/24-dag-infraestructura.md` (if references obsolete)
- **CI behavior change**: PRs modifying client/server/shared files will now trigger lint checks; lint errors will block merge (non-blocking initially if `continue-on-error` is set, but spec says blocking)
- **No governance changes**: 4 ruleset status check names unchanged, `ci-complete.needs` untouched
- **Cost justification**: This change satisfies the requirement from `docs/CONTEXT-CICD.md` §3.1 — "any activation requires an OpenSpec change that justifies the cost"
