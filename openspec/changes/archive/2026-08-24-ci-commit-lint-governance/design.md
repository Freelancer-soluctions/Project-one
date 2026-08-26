## Context

- `.github/workflows/ci.yml` is the main CI workflow, triggered on `pull_request` to main + `merge_group`
- `verify-signatures` job already validates GPG signing via REST API (parallel pattern to follow)
- `.husky/commit-msg` exists but has bug: `commitlint --edit $1` missing `npx --no --` prefix
- `commitlint.config.js` exists with `@commitlint/config-conventional` (ESM export)
- `@commitlint/cli` v20.3.1 and `@commitlint/config-conventional` v20.3.1 already in devDependencies
- `.nvmrc` specifies Node 22.23.1; job uses `actions/setup-node@v4` with `node-version-file` (setup-monorepo composite action is absent from repo — planner verified)

## Goals / Non-Goals

**Goals:**

- Add a `commit-lint` job to `ci.yml` that validates PR commit messages against Conventional Commits
- Handle both `pull_request` and `merge_group` events
- Fix `.husky/commit-msg` bug (add `npx --no --` prefix)
- Register commit-lint as a required status check in GitHub ruleset

**Non-Goals:**

- Early-abort rewiring (making other jobs depend on commit-lint) — deferred to separate change
- PR title validation — deferred to separate change
- SHA pinning of actions — deferred to separate change
- lint-staged configuration changes — already working

## Decisions

### Decision 1: Raw npx commitlint (official pattern) vs third-party action

**Choice**: Raw `npx commitlint` following the official commitlint CI guide (commitlint.js.org/guides/ci-setup.html)

**Rationale** (validated by research, ago 2026):

- Exact version control: lockfile-pinned `@commitlint/cli` v20.3.1 runs — no bundled version drift
- Reads `commitlint.config.js` natively — no silent config ignore
- No third-party Docker action: npm integrity hashes, no external image pull (supply-chain auditable)

**Alternatives considered and rejected**:

- `wagoid/commitlint-github-action@v6`: Docker image bundles commitlint v19 (ignores pinned v20.3.1 unless NODE_PATH workaround); default `configFile` is `.mjs` while repo has `.js` (silent config ignore); stale ~19 months
- `step-security/commitlint-github-action`: hardened fork, same embedded-v19/config bugs without workarounds
- `amannn/action-semantic-pull-request`: PR-title-only, own parser (rule-drift risk) — potential future complement, not replacement

### Decision 2: Job placement in CI pipeline

**Choice**: Standalone job, parallel with build/test, no `needs:` dependency

**Rationale**:

- commit-lint inspects commit metadata, not code — no dependency on repo-discovery/change-detection
- Lightweight job (<30s) — parallel execution doesn't waste resources
- As a required check, its failure blocks merge without blocking other jobs from reporting

### Decision 3: Event handling strategy

**Choice**: Both `pull_request` and `merge_group` events with per-event commitlint invocation

**Rationale**:

- pull_request: `npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose`
- merge_group: `npx commitlint --last --verbose` (squash commit — PR commits were already validated)
- GitHub merge queue requires a pull_request workflow with a job of the SAME NAME for merge_group recognition — single job name satisfies both

### Decision 4: Failure behavior

**Choice**: Hard fail — nonzero exit code of `npx commitlint` fails the step and job (no suppression flags)

**Rationale**:

- Enterprise standard: required check that blocks merge
- Defense-in-depth over bypassable local hook
- nonzero exit code of `npx commitlint` fails the step and job natively — no suppression flags needed

## Risks / Trade-offs

- **[Risk]** Squash-merge: PR-range linting does not cover the final squash title → **Mitigation**: merge_group step validates the squash commit via `commitlint --last`
- **[Risk]** `merge_group` requires a `pull_request` workflow with same job name → **Mitigation**: single workflow file, one job name handles both events
- **[Risk]** Required check registration requires GitHub UI action → **Mitigation**: register + document in tasks.md
- **[Trade-off]** Raw npx owns ~15 extra YAML lines vs turnkey action → **Mitigation**: exact version control + native config reading outweigh maintenance cost
- **[Trade-off]** Actions pinned by tag (v5/v4) pending SHA pinning → **Mitigation**: deferred to separate change (Non-Goals); Dependabot digest pinning as follow-up
