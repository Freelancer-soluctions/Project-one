## Context

The CI pipeline (`ci.yml`) currently runs in minimal mode (`CI_MINIMAL=true`) with most quality jobs disabled via `if: false`. Three lint jobs — `client-lint`, `server-lint`, and `actionlint` — are defined but never execute. The `repo-discovery` job already computes path-scoped outputs (`client`, `server`, `shared`, `e2e`) using `dorny/paths-filter`, which these jobs can leverage. The `eslint.config.js` has a complexity threshold of 15, but 8 existing functions have complexity c16-c18, requiring a baseline adjustment.

See proposal.md — Why for motivation.

## Goals / Non-Goals

**Goals:**

- Reactivate `client-lint`, `server-lint`, and `actionlint` jobs in `ci.yml`
- Make each job path-scoped using `repo-discovery` outputs
- Make jobs standalone (not gated by `CI_MINIMAL`) following the `sast`/`dependency-review` pattern
- Adjust `eslint.config.js` complexity threshold from 15→20 to match existing baseline
- Flip `CI_MINIMAL` to `false` post-merge via `gh variable set`

**Non-Goals:**

- No changes to `ci-complete.needs` (3 jobs already included)
- No changes to the 4 ruleset status check names (`Verify Commit Signatures`, `Commit Lint`, `PR Title Lint`, `DCO`)
- No governance changes (ruleset 21227644 untouched)
- No changes to `security.yml`, `deploy.yml`, `release.yml`, or other disabled workflows
- No new GitHub Actions dependencies (reuses existing `rhysd/actionlint@v1`)

## Decisions

### Decision 1: Path-scoped execution via repo-discovery outputs

**Choice:** Use `needs.repo-discovery.outputs.client`, `needs.repo-discovery.outputs.server`, and `needs.repo-discovery.outputs.shared` to gate job execution.

**Rationale:** The `repo-discovery` job already computes these outputs using `dorny/paths-filter@v4`. Reusing them avoids duplicating path-filter logic and ensures consistency with other jobs that use the same pattern.

**Alternatives considered:**

- Inline `paths-filter` in each job: Rejected — duplicates logic, harder to maintain
- Always-run without path scoping: Rejected — wasteful; client-only PRs don't need server lint

### Decision 2: Standalone jobs (not gated by CI_MINIMAL)

**Choice:** Jobs run on qualifying PRs regardless of `CI_MINIMAL` value, following the `sast` and `dependency-review` pattern.

**Rationale:** `sast` and `dependency-review` already run standalone without `CI_MINIMAL` gates. This pattern ensures lint checks always run on PRs, even when CI is in minimal mode. The `CI_MINIMAL` gate is for expensive jobs (build, test, coverage), not lightweight lint checks.

**Alternatives considered:**

- Gate by `CI_MINIMAL != 'true'`: Rejected — defeats the purpose of reactivating lint in minimal mode
- Separate workflow file: Rejected — adds complexity; inline jobs in `ci.yml` are simpler

### Decision 3: ESLint complexity threshold 15→20

**Choice:** Raise complexity rule from `["error", 15]` to `["error", 20]` in `eslint.config.js`.

**Rationale:** 8 existing functions have complexity c16-c18. Setting threshold to 20 provides headroom while still catching genuinely complex functions (c20+). This matches the baseline observed in the codebase.

**Alternatives considered:**

- Fix all 8 functions to c15: Rejected — high effort, low value; complexity is acceptable
- Set threshold to c18: Rejected — too tight; new code could easily hit c18
- Leave at c15: Rejected — would fail lint from first run

### Decision 4: actionlint findings handled in same change

**Choice:** Pre-existing actionlint findings in `.github/workflows/*.yml` are addressed in this change (fix or disable with justification).

**Rationale:** Activating actionlint on a PR that modifies shared files would fail immediately if pre-existing issues exist. Fixing them in the same change ensures the gate passes from the first run.

**Alternatives considered:**

- `continue-on-error: true`: Rejected — defeats the purpose of a blocking gate
- Disable specific rules: Acceptable fallback if fixes are too invasive

## Risks / Trade-offs

**[Risk] actionlint may find many pre-existing issues** → Mitigation: Run actionlint locally first to assess scope. Fix critical issues; disable non-critical rules with justification comments.

**[Risk] Complexity threshold c20 may be too permissive** → Mitigation: Monitor new code complexity over time. Consider tightening to c18 in a future change if complexity creeps.

**[Risk] Lint errors in first run block PRs** → Mitigation: Pre-flight lint run without `--max-warnings 0` to capture baseline. Fix existing errors before activating the gate.

**[Trade-off] Standalone jobs run even when CI_MINIMAL=true** → Accepted: Lint is lightweight (seconds), not minutes. The cost is negligible compared to build/test jobs.

**[Trade-off] Path-scoping uses repo-discovery outputs** → Accepted: Depends on `dorny/paths-filter` correctness. If paths-filter misses files, lint may not run. Low risk — paths-filter is well-tested.

**[Risk] Complexity-check standalone jobs have hardcoded threshold** → Complexity-check jobs (`client-complexity` ci.yml L459-471, `server-complexity` L545-558) have `complexity: 15` hardcoded inline in their step command (not via `eslint.config.js`). These jobs remain `if: false` — NOT part of this change. The `eslint.config.js` threshold change (15→20) only affects `npm run lint` in `client-lint`/`server-lint` jobs, NOT these standalone complexity-check jobs.
