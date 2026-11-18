# Design

## Context

Phase 1 of `ci-prebuild-substage-structure` introduced 4 aggregator jobs and activated knip dead-code detection with `continue-on-error: true`. After 1 sprint of calibration, the pipeline needs hardening: removing the continue-on-error safety valve, documenting baseline metrics, and verifying aggregator behavior end-to-end.

Current state (`.github/workflows/ci.yml`):

- `client-dead-code` (line 480) and `server-dead-code` (line 568) both have `continue-on-error: true`
- 4 aggregator jobs exist: `prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-unit-tests-complete`
- `ci-complete` depends on aggregators + 3 standalone jobs (`verify-signatures`, `zombie-workflow-guard`, `repo-discovery`)
- 4 ruleset checks: `verify-signatures`, `commit-lint`, `pr-title-lint`, `dco`

Constraints:

- CI_MINIMAL=true path must remain functional (skipped jobs treated as passing)
- No runtime/API changes — CI pipeline only
- Breaking change: teams must address dead code before merging

## Goals / Non-Goals

**Goals:**

- Remove `continue-on-error: true` from `client-dead-code` and `server-dead-code` jobs
- Document baseline knip metrics (findings count, false positives, ignores) for each workspace
- Verify all 4 aggregator jobs report correctly under both CI paths
- Verify `ci-complete` passes when CI_MINIMAL=true (skipped aggregators = passing)
- Verify no regressions in the 4 existing ruleset status checks

**Non-Goals:**

- Changing knip configuration beyond baseline calibration ignores
- Modifying aggregator job composition or dependency structure
- Adding new CI jobs or stages
- Optimizing knip performance or run time

## Decisions

### D1: Single-file CI edit

**Decision**: Remove `continue-on-error: true` from lines 486 and 574 of `.github/workflows/ci.yml` only. No other workflow files are modified.

**Rationale**: The dead-code jobs are the only jobs in this change with the continue-on-error flag. All other continue-on-error usages (e.g., in `preview.yml`, `security-digest.yml`) are unrelated to this change.

**Alternative considered**: Add an intermediate step with a warning annotation before making blocking — rejected because the calibration period (Phase 1) already provided the advisory window.

### D2: Baseline metrics as task output

**Decision**: Record knip baseline metrics as structured output in the tasks artifact, not as a separate CI step or dashboard.

**Rationale**: Metrics are a one-time snapshot for the Phase 2 decision gate. They don't need to be re-run or automated — the team reviews them once before merging the change. A task output keeps the artifacts self-contained.

**Alternative considered**: Automated knip metrics collection via CI — rejected as over-engineering for a one-time calibration gate.

### D3: Verification via test PR

**Decision**: Verify aggregator and ruleset behavior via a test PR with both CI_MINIMAL=true and CI_MINIMAL=false paths, rather than dry-run or simulation.

**Rationale**: GitHub Actions status checks can only be validated against actual GitHub infrastructure. Dry-runs don't exercise the aggregator→ci-complete→required-check chain.

**Alternative considered**: Local `act` runner simulation — rejected because `act` doesn't replicate GitHub's required status check evaluation.

### D4: Ruleset verification as separate task

**Decision**: Ruleset regression checks are a dedicated verification task, not merged into aggregator verification.

**Rationale**: Ruleset checks (`verify-signatures`, `commit-lint`, `pr-title-lint`, `dco`) are independent of the substage architecture. Keeping verification separate ensures each concern is validated independently and failures are diagnosable.

## Risks / Trade-offs

- **[Risk] knip finds new dead code in PRs after promotion** → Mitigation: Baseline metrics document current state; teams address findings in existing PRs before merge. The calibration period (Phase 1) was designed for this.
- **[Risk] CI_MINIMAL=true path breaks if aggregator skip logic is wrong** → Mitigation: Dedicated verification task tests both paths; `ci-complete` depends on aggregators with `always()` condition.
- **[Risk] False positives block legitimate PRs** → Mitigation: Baseline metrics document required ignores; knip.json ignore lists are updated before promotion.
- **[Trade-off] Blocking knip may slow velocity temporarily** → Accepted: Teams must clear dead code backlog. This is the intended behavior of shifting left.

## Notes — Baseline Knip Metrics (Task 3.1; re-verified Task 1.1, 2026-09-22, knip 6.32.2)

Source: `npx knip --workspace=apps/<name> --no-progress` from repo root
(human-readable + `--reporter json` outputs agree). Gate count = unused files +
unused deps + unused devDeps + unused exports (`duplicates` rule is `off` →
hints only, excluded; no `Unlisted binaries` / `Configuration hints` sections
emitted with the `--workspace` flag → 0). Full breakdown in
`docs/ci-prebuild-substage-structure-phase2-baseline.md`.

### apps/client — 112 gate findings (FAIL/blocking after promotion)

- Unused files (24): `ui/{carousel,collapsible}.jsx`, `hooks/useGetTranslation.js`,
  `clientOrder/utils/{index,schema}.js`, `events/utils/helpers.jsx`,
  `expenses/schema.test.js`, `tiptap/MentionList.test.jsx`,
  `home/components/{Content,index,UpcomingEvents}`, `notes/constant/enums/enums.js`,
  `providerOrder/{api/clientOrderApi.js,pages/ClientOrder.jsx}`,
  `settings/components/{SettingsProfile,SettingsTabs}.jsx`,
  `services/{api,axiosService}.js`, `utils/{helpers,objectToFormData,utils}.js`,
  `tests/setup/{i18n-mock,setupTest.unit,test-utils}.js`
- Unused dependencies (10): `@radix-ui/react-collapsible`, `@tanstack/react-query{,-devtools}`,
  `add`, `command`, `date-fns-tz`, `embla-carousel-autoplay`, `embla-carousel-react`,
  `quill`, `shadcn-ui`
- Unused devDependencies (4): `@chromatic-com/storybook`, `@storybook/addon-docs`,
  `globals`, `why-is-node-running`
- Unused exports (74): 28 shadcn/ui re-exports + 46 app-code exports (module API
  hooks, enums, schemas, socket events, utils)
- Excluded from gate count: duplicate exports 3 (hints only), unlisted binaries 0,
  configuration hints 0
- Ignores applied (`apps/client/knip.json`): stories/test/spec patterns, `fieldLimits.js`,
  `inventoryMovementAPI.js`, `socketService.js`; `ignoreDependencies` for storybook/msw stack;
  `ignoreBinaries: [storybook]`; `ignoreExportsUsedInFile: true`
- Status: FAIL (exit 1) — blocking after Phase 2 promotion; false-positive triage
  (test/setup files flagged despite ignore patterns; storybook devDeps flagged despite
  `ignoreDependencies`) deferred to Task 1.3

### apps/server — 95 gate findings (FAIL/blocking after promotion)

- Unused files (35): `ecosystem.config.js`, `config/aws/secrets.js`, `docs/schemas.js`,
  `clientOrder/{controller,dao,routes,service}.js`,
  `providerOrder/{controller,dao,routes,service,schemas/providerOrder.joi}.js`,
  `users/constants/users.js`, socket `levels/level-*.js` (10 learning files),
  `utils/{cloudinary/cloudinary,joiSchemas/joi,prisma-dinamic-service/service,responses&Errors/globalErrorResponse}.js`,
  `test-sanitize.{js,mjs}`, orphan/smoke/manual test files (5)
- Unused dependencies (4): `cloudinary`, `knex`, `socket.io-client`, `vite`
- Unused devDependencies (2): `@prisma/language-server`, `why-is-node-running`
- Unused exports (54): middleware variants, module service/dao/schema exports, socket
  helpers, prisma/role/enum utils, test helpers
- Excluded from gate count: duplicate exports 2 (hints only), unlisted binaries 0,
  configuration hints 0
- Ignores applied (`apps/server/knip.json`): test/spec/docs/socket-levels/tests patterns;
  `ignoreDependencies` for `@prisma/language-server`, `@vitest/ui`, `nodemon`, `why-is-node-running`;
  `ignoreBinaries: [prisma, nodemon]`; `ignoreExportsUsedInFile: true`
- Status: FAIL (exit 1) — blocking after Phase 2 promotion; calibration of ignores
  deferred to Task 1.3
- Re-verified Task 1.2 (2026-09-22, knip 6.32.2, `--workspace` from root):
  human-readable + `--reporter json` agree exactly (35/4/2/54, duplicates 2,
  unlisted/binaries/types 0; gate 95), exit 1. No drift; no ignore changes.
  False-positive candidates for Task 1.3: `src/socket/levels/**` (10 files),
  `src/docs/schemas.js`, and `tests/**` (5 files + `createRequest` export) still
  reported despite matching `ignore` globs; `@prisma/language-server` +
  `why-is-node-running` flagged despite `ignoreDependencies` listing — likely a
  `--workspace`-from-root scope artifact in ignore-glob resolution.

Historical note: the earlier in-workspace snapshot (`npx knip --no-progress` run inside
each workspace dir: 52 client / 67 server incl. unlisted binaries 2/3 and config hints
17/9) is superseded by the `--workspace` scope above — same underlying dead code,
different reporter scope, plus dependency drift since that snapshot.

## Migration Plan

1. Record baseline knip metrics for client and server workspaces
2. Update knip.json ignore lists if new false positives discovered
3. Remove `continue-on-error: true` from `client-dead-code` and `server-dead-code` in ci.yml
4. Open test PR to verify:
   - All 4 aggregators report correctly (CI_MINIMAL=false path)
   - Aggregators skip cleanly (CI_MINIMAL=true path)
   - `ci-complete` passes in both paths
   - All 4 ruleset checks pass/fail correctly
5. Merge after verification passes
