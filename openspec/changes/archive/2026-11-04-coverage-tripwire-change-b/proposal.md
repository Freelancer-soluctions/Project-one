# Proposal

## Why

Change A (`openspec/changes/archive/2026-10-30-coverage-tripwire-phase3-gates/`) closed the enforcement gap for
full-suite coverage (a blocking `coverage-full-gate`), declared critical-path floors, and made the ratchet a
mechanically verified property. It deliberately deferred five capabilities to a separate change so that the
coverage gate's blast radius stayed bounded:

1. **Mutation testing** — coverage measures execution, not assertion strength; a 100% floor is satisfiable
   with `assert(result)`. The contract exists (`coverage-mutation-testing`) but no tool, config, cadence or
   gate exists yet.
2. **Scheduled ratchet** — floors are raised only by hand today; a monthly proposal flow was sketched as a
   deferred scenario in `coverage-ratchet-governance` but not implemented.
3. **Exclusion budget** — `coverage.exclude` and `/* istanbul ignore */` counts are untracked; the ratchet
   spec already requires tracking, but only as a contract with no advisory/blocking wiring.
4. **Objective vs floor separation** — the enforced floor and any aspirational target are conflated; there is
   no display-only objective distinct from the enforced floor.
5. **Per-type thresholds** — a single threshold set is applied regardless of whether the run is a unit run
   or an integration run; unit and integration coverage cannot be gated independently.

This change implements those five deferred capabilities without touching Change A's enforcement, critical-path
floors, or baseline machinery.

## What Changes

**1. Mutation testing (Stryker) — `coverage-mutation-testing` (MODIFIED).**

- Add Stryker as a devDependency with a configuration scoped to critical business paths (the paths declared
  in `coverage-critical-paths.mjs`), with a declared mutation score threshold per critical path.
- A nightly (non-PR) workflow runs mutation testing on critical paths; blocking is by **regression against a
  recorded baseline**, not by an absolute score on the first run; the first run records the baseline.
- Surviving mutants are reported by name (mutant id + file + location + mutated operator) in the workflow
  summary and as an artifact.
- A local command mirrors the nightly run for reproduction.

**2. Scheduled ratchet — `coverage-ratchet-governance` (MODIFIED).**

- A monthly cron workflow measures full-suite coverage for both workspaces, computes which floors could be
  raised, and opens a pull request with the before/after values (per metric, per workspace) when at least one
  floor can be raised.
- The workflow never enables `autoUpdate` in any blocking job; it only proposes changes via PR, which still
  passes the normal ratchet/baseline gates.
- No PR is opened when no floor can be raised.

**3. Exclusion budget — `coverage-ratchet-governance` (MODIFIED).**

- Track the set of `coverage.exclude` entries and the count of `/* istanbul ignore */` (and equivalent) markers
  per workspace against a versioned baseline.
- Advisory first (reports growth, does not fail), then blocking once the baseline is stable: growth beyond the
  baseline without an auditable exception fails.
- Exceptions record reason + owner, consistent with the ratchet exception format.

**4. Objective vs floor separation — `coverage-objective-targets` (NEW).**

- A display-only **objective** (aspirational target) is declared per workspace/metric, distinct from the
  enforced **floor**.
- The objective is shown in reports, CI summaries and the canonical doc, but never enforced: a run below the
  objective but above the floor is green.
- The objective is allowed to be higher than the floor; it cannot be lower than the floor (fail-closed).

**5. Per-type thresholds — `coverage-per-type-thresholds` (NEW).**

- Separate threshold sets for **unit** vs **integration** coverage, evaluated independently by the guard.
- Each enforcement point declares which test type it evaluates; a unit run is never compared against
  integration thresholds and vice versa.
- The guard reports which test type a verdict corresponds to.

## Capabilities

### New Capabilities

- `coverage-objective-targets`: a display-only aspirational objective distinct from the enforced floor,
  reported but never enforced, and constrained to be >= the floor.
- `coverage-per-type-thresholds`: independent threshold sets for unit vs integration coverage, evaluated
  separately by the guard with the test type named in the verdict.

### Modified Capabilities

- `coverage-mutation-testing`: implement the contract that Change A left as a deferred capability — Stryker
  tooling, nightly cadence on critical paths, declared score threshold, surviving mutants by name, blocking by
  regression against a recorded baseline, and a local reproduction command.
- `coverage-ratchet-governance`: implement the deferred scheduled ratchet (monthly cron proposing a PR to
  raise floors, never autoUpdate in a blocking job) and turn the exclusion-budget contract into an
  advisory-then-blocking control with auditable exceptions.

## Impact

- `package.json` (root) + `apps/client/package.json` + `apps/server/package.json` — add `@stryker-mutator/core`
  (and framework plugins) as devDependencies.
- `stryker.config.mjs` (or per-workspace config) — scoped to critical paths, threshold, baseline file.
- `.github/workflows/coverage-mutation-nightly.yml` (new) — nightly cron, artifact + summary, blocking by
  regression.
- `.github/workflows/coverage-ratchet-monthly.yml` (new) — monthly cron, proposes PR with before/after values.
- `scripts/ci/check-coverage.mjs` — add objective reporting (display-only), per-type threshold selection, and
  exclusion-budget evaluation.
- `scripts/ci/coverage-exclusion-budget.mjs` (new) — counts `coverage.exclude` + istanbul-ignore markers
  against a versioned baseline.
- `scripts/ci/coverage-objective-check.mjs` (new, optional) — validates objective >= floor.
- `apps/client/vitest.config.js`, `apps/server/vitest.config.ts` — add objective targets and per-type
  threshold sets.
- `docs/learning/coverage-tripwire-floor-ratchet.md` — document objective vs floor, per-type thresholds,
  exclusion budget and mutation testing cadence.
- **No changes** to Change A's `coverage-full-gate`, critical-path floors, baseline ratchet, or D18.
