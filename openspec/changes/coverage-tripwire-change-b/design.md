# Design

## Context

See `proposal.md` (Why) and Change A's archived design (`openspec/changes/archive/2026-10-30-coverage-tripwire-phase3-gates/design.md`)
for the enforcement, critical-path and ratchet baseline machinery this change builds on. This change does not
restate that machinery; it adds five orthogonal capabilities on top of it.

Current state relevant to this change (verified, not assumed):

- No mutation testing tooling exists anywhere in the repo (0 deps in root/client/server/e2e) — Change A's
  D5 deferred it explicitly.
- No scheduled workflow proposes floor raises; `coverage:ratchet` is a manual local command only.
- `coverage.exclude` and istanbul-ignore markers are untracked; the ratchet spec already requires tracking but
  only as a contract.
- The guard `scripts/ci/check-coverage.mjs` evaluates a single threshold set per workspace; there is no
  concept of an aspirational objective nor of a test type.
- Vitest configs declare one threshold block per workspace.

## Goals / Non-Goals

**Goals:**

- Implement Stryker mutation testing on critical paths with a declared score threshold, named surviving mutants,
  nightly cadence, regression-based blocking, and a recorded baseline on first run.
- Implement a monthly scheduled ratchet that proposes (via PR) floor raises, never autoUpdate in a blocking job.
- Implement an exclusion budget: track `coverage.exclude` + istanbul-ignore count, advisory then blocking, with
  auditable exceptions.
- Separate an aspirational **objective** (display-only) from the enforced **floor**.
- Separate **unit** vs **integration** threshold sets, evaluated independently by the guard.

**Non-Goals (design-level):**

- No changes to Change A's `coverage-full-gate`, critical-path floors, baseline ratchet, or D18.
- No absolute-score blocking on the first mutation run (baseline recording only).
- No autoUpdate of thresholds on `main` or in blocking jobs. A scheduled bot-branch PR that proposes floor
  raises is permitted (it is a proposal, not a rewrite), but no job rewrites threshold configuration on `main`
  directly. Redefines the existing prohibition accordingly.
- No SonarQube changes (`if: false` stays).
- No rewrites of test suites for critical modules (Non-Goal inherited from Change A).

## Decisions

### D1 — Mutation testing uses Stryker, scoped to critical paths, nightly cadence

**Elegido:** Stryker (`@stryker-mutator/core` + framework plugins) configured to mutate only the files on the
critical paths declared in `coverage-critical-paths.mjs`. A nightly cron workflow (not per-PR, due to cost) runs
it. The first run records a baseline mutation score in a versioned `stryker-baseline.json` (updated via PR, never
direct commit to `main`); subsequent runs fail only on **regression** against that baseline. A declared absolute
threshold is reported but is not the blocking condition on first run.

**Baseline storage and lifecycle:** the baseline lives as a versioned file (`stryker-baseline.json`) in the repo,
updated through a PR (never direct commit, to satisfy `required_signatures`). If the baseline file is missing
(first run or deleted), the run records the current score as the baseline and exits 0 (advisory). If the
baseline file exists but is corrupt or unreadable, the run fails with a distinct "baseline missing/corrupt"
verdict (not treated as a regression or a tool failure).

**Por qué versioned file and not cache:** `actions/cache` expires (14 days in existing workflows) and cannot be
audited. A versioned file is auditable, reviewable, and survives cache eviction.

**Por qué nightly and not per-PR:** mutation testing is expensive; running it on every PR would dominate CI
time. Nightly cadence keeps the feedback loop async while still catching regressions within a day.

**Por qué regression-based blocking:** an absolute threshold on first run would fail immediately (baseline score
is unknown). Recording the baseline first and blocking on regression mirrors the ratchet's "floor only rises"
philosophy and avoids false reds.

**Surviving mutants by name:** the report lists each surviving mutant's id, file, location and mutated operator,
in both the workflow summary and an uploaded artifact, so a regression is actionable.

**Local reproduction:** a root script (`mutation:test`) mirrors the nightly invocation for local debugging.

**Alternativa considerada:** running Stryker in the PR pipeline on changed files only. Descartada: mutation
testing needs the full test suite to be meaningful, and partial runs produce misleading scores. Nightly full
runs are the honest signal.

### D2 — Scheduled ratchet proposes via PR, never autoUpdate in blocking jobs

**Elegido:** a monthly cron workflow measures full-suite coverage for both workspaces, computes candidate floor
raises (per metric, per workspace) using the same guard logic, and opens a PR with the before/after values when at
least one floor can be raised. The workflow does **not** enable Vitest `autoUpdate` on `main` and does not rewrite
threshold configuration in any blocking job; the PR is the only mutation path and it still passes the ratchet
baseline gate. The job **may** write to a bot branch and open a PR, but never to `main` and never in a blocking job.

**Por qué PR and not direct commit:** a direct commit would bypass review and the baseline gate. A PR keeps the
human in the loop and lets CODEOWNERS review the raise.

**Por qué no autoUpdate in CI:** autoUpdate in CI would silently rewrite thresholds on `main`, violating the
existing prohibition (local-coverage-tripwire: "no CI process rewrites threshold configuration"). The scheduled
workflow is CI; it must only propose. Redefinition: "no CI process rewrites threshold configuration on `main` or
in a blocking job" — a bot-branch PR is a proposal, not a rewrite.

**Token and signing strategy:** the workflow authenticates with the GitHub App token (`APP_ID` + `APP_PRIVATE_KEY`,
as in `release.yml`), which produces signed commits satisfying `required_signatures`. The bot commit is
identifiable and auditable. The PR is labeled `coverage-ratchet` and assigned to the workspace owners.

**No-op when nothing to raise:** if no floor can be raised, no PR is opened and the run is green.

### D3 — Exclusion budget: advisory then blocking, with auditable exceptions

**Elegido:** a new script `scripts/ci/coverage-exclusion-budget.mjs` counts, per workspace:

- entries in `coverage.exclude` (Vitest config)
- occurrences of `/* istanbul ignore */` (and equivalent `/* c8 ignore */`) markers in source/test files

and compares against a versioned baseline. Phase 1 (advisory): reports growth, exits 0. Phase 2 (blocking):
growth beyond the baseline without an auditable exception fails. Exceptions use the same `{reason, owner, date}`
shape as the ratchet baseline, so a single audit trail covers both.

**Por qué advisory first:** the baseline must be established from a real count before it can gate; blocking on
day one with an uncalibrated baseline would red every PR.

**Por qué count markers and not just exclude entries:** `coverage.exclude` is the coarse knob; istanbul-ignore
markers are the fine-grained escape hatch. Tracking only one would let the other grow silently.

### D4 — Objective (display-only) vs floor (enforced)

**Elegido:** each workspace config declares an `objective` block **outside** `coverage.thresholds` — as a named
export from the vitest config (e.g. `export const coverageObjective = { ... }`) or as a separate policy file
(e.g. `.coverage-objectives.json`). It carries the same four metrics. The objective is **reported** in CI
summaries, the guard's output, and the canonical doc, but never enforced: a run between floor and objective is
green. The guard validates that `objective >= floor` per metric (fail-closed); an objective below the floor is a
configuration error.

**Por qué fuera de `coverage.thresholds`:** Vitest interpreta cualquier clave no-métrica bajo
`coverage.thresholds` como un glob con su propio umbral. Si `objective` viviera ahí, Vitest lo **enforcería**
como un glob (violando "display-only") y el guard lo trataría como "no files matched" (fail-closed). La
separación física es lo que hace la distinción mecánicamente verificable.

**Por qué separate fields and not a single threshold with a flag:** conflation is the current defect. Two named
fields make the distinction machine-readable and auditable.

**Por qué objective cannot be lower than floor:** an aspirational target below the enforced floor is nonsensical
and would let a "target met" report mask a floor failure.

### D5 — Per-type thresholds (unit vs integration)

**Elegido:** the guard accepts a `--type` selector (`unit` | `integration`) and loads the corresponding threshold
set from a **named export** or separate policy file (e.g. `coverageThresholds.unit` / `coverageThresholds.integration`
in the vitest config, or `.coverage-thresholds.json`), falling back to the existing flat `coverage.thresholds`
as `unit` for backward compatibility. Each enforcement point declares which type it evaluates and the guard names
the type in its verdict. A unit run is never compared against integration thresholds.

**Por qué fuera de `coverage.thresholds`:** igual que D4 — Vitest interpreta `unit`/`integration` como globs y los
enforcería. La separación física evita que el piso de un tipo se confunda con un patrón de rutas.

**Por qué a selector and not two guards:** one guard, one verdict format, one audit trail — consistent with
Change A's D6 ("un guard, una entrada, un veredicto").

**Backward compatibility:** workspaces without per-type blocks keep working; the flat thresholds are treated as
the `unit` set, so no existing config breaks.

### D6 — Capabilities modified vs added

**Elegido:** `coverage-mutation-testing` and `coverage-ratchet-governance` are MODIFIED (their deferred contracts
are now implemented). `coverage-objective-targets` and `coverage-per-type-thresholds` are NEW. Exclusion budget
lives inside the `coverage-ratchet-governance` modification (it already declared the requirement).

## Risks / Trade-offs

- **Stryker adds a heavy devDependency and a nightly runtime cost** → Mitigation: scoped to critical paths only;
  nightly cadence; artifact retention limited.
- **Monthly ratchet PRs could accumulate if not merged** → Mitigation: the workflow checks for an open ratchet PR
  before opening a duplicate; closes/updates the existing one.
- **Exclusion budget baseline could be noisy initially** -> Mitigation: advisory phase first; baseline established from
  real counts before blocking.
- **Objective vs floor could be confused by readers** -> Mitigation: explicit naming in config and docs; guard
  validates objective >= floor fail-closed.
- **Per-type thresholds multiply configuration surface** -> Mitigation: backward-compatible flat fallback; only
  workspaces that opt in declare per-type blocks.

## Migration Plan

1. **Objective and per-type config schema.** Add `objective` and per-type threshold blocks to both workspace
   configs (with flat fallback). No behavioral change yet; guard ignores them until D4/D5 land.
2. **Exclusion budget baseline.** Create the baseline file from current counts; wire the script in advisory mode.
3. **Mutation testing tooling.** Add Stryker devDependency, config scoped to critical paths, nightly workflow
   with baseline recording. Advisory only on first run.
4. **Scheduled ratchet.** Add monthly cron workflow that proposes PRs; depends on baseline + guard from Change A.
5. **Flip exclusion budget to blocking.** After advisory period, make growth without exception fail.
6. **Mutation regression blocking.** After baseline is recorded, enable regression-based blocking.

**Rollback:** each step is reversible independently. Steps 1-2 touch only config/schema; steps 3-4 add new
workflows/scripts that can be removed without affecting existing gates.

## Open Questions

- **Stryker version and plugins:** exact version and framework plugins (Vitest, TypeScript) to be determined during
  implementation. Depends on the TS migration state of apps/server.
- **Exclusion budget threshold:** what percentage growth is acceptable before blocking? Needs calibration from
  advisory data.
- **Per-type integration thresholds:** integration tests need a live DB; whether the integration threshold is
  measured in CI (with DB) or locally only. Depends on test infrastructure.
- **Objective default values:** should the objective default to a fixed aspirational number (e.g., 80%) or be
  measured-and-frozen like floors? Needs decision before D4 implementation.
