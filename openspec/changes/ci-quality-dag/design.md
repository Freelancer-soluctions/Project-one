## Context

Current state (see proposal.md — Why for motivation):

- `.github/workflows/ci.yml` has 9 flat jobs: `changes`, `quality` (workflow_call), `test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`, `build`, `e2e`, `zombie-workflow-guard`. All depend only on `changes`; there is no tiered dependency graph.
- `.github/workflows/quality.yml` is a single job with `if: inputs.run-client/run-server` step conditionals — zero parallelism, zero failure isolation. A client lint failure masks server format check results.
- `.github/actions/setup-monorepo` composite action exists (setup-node with `.nvmrc` + `npm ci` + Vitest cache) and is the established setup pattern.
- Reference architecture: `docs/ci-cd-pipeline-empresarial.md` §23.3 defines the 5-stage enterprise pipeline (init → pre-build quality → build → post-build quality → aggregator).
- The project is currently JavaScript (no TypeScript); TS migration is anticipated but not scheduled.

## Goals / Non-Goals

**Goals:**

- Single YAML file (`ci.yml`) containing the full quality DAG — no `workflow_call` indirection for quality gates.
- Parallel pre-build quality jobs with per-job failure isolation (each job = one check, one signal).
- Strict ordering: pre-build quality → build (artifact upload) → post-build quality.
- Single `ci-complete` aggregator check for branch protection (eliminates the "pending check" trap).
- All jobs resolve Node version from `.nvmrc` via `setup-monorepo` — no hardcoded versions.
- Tooling ready for future TS migration (typecheck jobs exist as no-ops today).

**Non-Goals:**

- Other pipeline stages (deploy, preview, security, scheduled scans) — out of scope, they remain in their existing workflows.
- Actual TypeScript migration — only the CI scaffolding anticipates it.
- SonarQube server provisioning — only the CI job wiring; assumes `SONAR_TOKEN`/`SONAR_HOST_URL` secrets exist.
- Test jobs (unit/integration/smoke/e2e) restructuring — they are re-wired into the DAG only where needed for ordering, not redesigned.

## Decisions

### D1: Single YAML file (inline quality jobs into ci.yml)

**Decision**: Inline all quality jobs into `.github/workflows/ci.yml`; delete `.github/workflows/quality.yml`.

**Rationale**: `workflow_call` adds indirection, makes `needs` graphs harder to read, and prevents the aggregator from depending on individual quality jobs. Enterprise pattern (SonarSource, GitLab) uses one pipeline definition with a `needs` DAG.

**Alternatives considered**:

- Keep `quality.yml` as reusable workflow with per-job outputs — rejected: reusable workflows cannot express fine-grained `needs` between their internal jobs and caller jobs; the aggregator would still depend on a single opaque check.
- Two YAML files (pre-build + post-build) — rejected: splits the DAG across files, reintroducing the coordination problem.

### D2: `needs: build` for post-build jobs

**Decision**: Post-build quality jobs declare `needs: [client-build, server-build]` (or the relevant build job), guaranteeing sequential: build → artifact upload → post-build analysis.

**Rationale**: SonarQube full analysis, coverage enforcement, and contract validation require compiled output. `needs` is the only mechanism that guarantees artifact availability without polling.

### D3: `if: always()` on `ci-complete` aggregator

**Decision**: `ci-complete` has `needs: [all pre-build, all build, all post-build]` and `if: always()`, then exits non-zero if any upstream failed (via `${{ contains(needs.*.result, 'failure') }}` check or `!cancelled()` + failure detection).

**Rationale**: A single required check in branch protection. Without `if: always()`, a failing upstream job makes `ci-complete` "skipped" — GitHub branch protection treats skipped as pending forever (the "pending check" trap).

**Alternative considered**: Per-job required checks in branch protection — rejected: N checks to maintain, and skipped jobs (path-filtered) create the same pending trap.

### D4: No hardcoded Node version

**Decision**: Every job uses `actions/checkout@v5` (fetch-depth: 0) + `./.github/actions/setup-monorepo` which reads `.nvmrc` via `node-version-file`.

**Rationale**: Single source of truth for Node version; matches existing convention in test jobs.

### D5: JavaScript now, TypeScript later

**Decision**: `*-typecheck` jobs exist and run `npx tsc --noEmit` but are configured to pass (no-op) until TS migration. `*-dead-code` uses `npx knip` (JS-compatible); switch to `ts-prune` post-migration.

**Rationale**: The DAG shape is the deliverable; tooling swaps are one-line changes per job.

### D6: Enterprise quality tooling

**Decision**: Post-build quality uses SonarQube (`SonarSource/sonarqube-scan-action`), coverage enforcement (threshold comparison), `depcheck` (unused/missing deps), and `swagger-cli validate` (OpenAPI contract — deferred, see D9). Pre-build uses eslint, prettier, tsc, complexity rule, knip, dependency-cruiser.

**Rationale**: Matches §23.3 QUALITY Grupo A (source) and Grupo B (artifact) taxonomy. Tools are dev-time only — no runtime dependency impact.

### D7: Path-filtering preserved via `repo-discovery`

**Decision**: Keep `dorny/paths-filter` as the first job (`repo-discovery`), emitting `client`/`server`/`shared`/`e2e` outputs. Pre-build jobs use `if: needs.repo-discovery.outputs.client == 'true' || needs.repo-discovery.outputs.shared == 'true'` (and server equivalent) so unchanged workspaces skip quality jobs — but `ci-complete` still aggregates with `if: always()`.

**Rationale**: Preserves the existing optimization (skip unaffected workspaces) while keeping the DAG structure and single required check.

### D8: Server post-build = source-level (no artifact)

**Decision**: `server-build` is an echo no-op that exists solely for DAG ordering — it produces no compiled output and uploads no artifact. Server post-build jobs (`server-sonarqube`, `server-coverage`, `server-depcheck`) analyze source directly and download only the coverage artifact uploaded by `test-unit-server`; they never download a `server-dist` artifact.

**Rationale**: The server workspace is plain JavaScript executed directly — there is no `dist/` output to analyze. Uploading a synthetic/empty artifact adds cost and confusion; source + coverage is sufficient for SonarQube source-level analysis and coverage enforcement.

### D9: Contract validation deferred

**Decision**: `client-contract-val`/`server-contract-val` are marked deferred (tasks 3.7/3.8). No static OpenAPI file exists in the repo, so `swagger-cli validate` would fail permanently. The jobs are documented in the DAG but not implemented; `swagger-cli` is not added to dev dependencies until an OpenAPI spec is introduced.

**Rationale**: A gate that always fails is worse than no gate — it trains developers to ignore red. Deferring keeps the DAG shape visible while avoiding a broken check. Resolves the open question about which OpenAPI spec to validate.

### D10: actionlint self-validation

**Decision**: Add an `actionlint` pre-build job (task 1.15) that validates all `.github/workflows/*.yml` for syntax errors and known anti-patterns, plus a pinned install method (rhysd/actionlint@v1 GitHub Action in CI; pinned go install or version-pinned wrapper locally) (tasks 7.5/7.6) so the same check runs locally pre-commit.

**Rationale**: The DAG restructure rewrites every workflow file; actionlint catches YAML/schema errors at CI time instead of a hard workflow-file parse failure. Self-validation extends the `zombie-workflow-guard` anti-regression pattern to the workflow files themselves.

## Risks / Trade-offs

- [Skipped jobs make `ci-complete` the only reliable signal] → `if: always()` + explicit failure detection on `needs.*.result`; skipped upstream jobs are treated as success for aggregation purposes.
- [SonarQube secrets missing → post-build jobs fail] → Jobs fail fast with clear message; document secret setup in tasks; consider `if: env.SONAR_TOKEN != ''` guard with explicit skip note (decided: fail-closed, secrets are a prerequisite).
- [12 pre-build jobs × npm ci = slower wall-clock than single job] → Parallelism offsets install cost; `setup-monorepo` caches npm + Vitest; jobs share the same cache key.
- [knip/dependency-cruiser/depcheck may report false positives on monorepo workspaces] → Config files per workspace; initial run may require allow-list entries — budgeted in tasks.
- [Deleting quality.yml breaks the `quality` job reference in ci.yml] → ci.yml is rewritten in the same change; `zombie-workflow-guard` extended to assert quality.yml absence (anti-regression).
- [Branch protection must be updated to the single `ci-complete` check] → Documented in tasks; until updated, old checks remain but `ci-complete` is additive.

## Migration Plan

1. Add new DAG jobs to `ci.yml` alongside existing jobs (additive phase) — verify DAG renders and jobs run.
2. Rewire existing test/build jobs into the DAG tiers (`needs` updates).
3. Remove `quality` workflow_call job; delete `quality.yml`; extend `zombie-workflow-guard` to assert its absence.
4. Update branch protection: single required check `ci-complete`.
5. Update `docs/cicd-plan-implementacion.md` architecture section.

**Rollback**: Revert the `ci.yml`/`quality.yml` changes (git revert) — workflow files are declarative, no data migration. Branch protection change is the only external state; revert it in GitHub settings.

## Open Questions

- SonarQube server URL and project keys per workspace — needed at implementation time; job wiring is agnostic to the values (secrets/config).
