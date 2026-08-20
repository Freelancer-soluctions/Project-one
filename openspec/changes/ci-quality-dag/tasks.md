## 1. Pre-build Quality Jobs (Stage 2)

- [ ] 1.1 Add `repo-discovery` job to `ci.yml` (dorny/paths-filter emitting `client`, `server`, `e2e`, `shared` outputs — **keep the `e2e` path filter and output**) — replaces current `changes` job
- [ ] 1.2 Add `client-lint` job: `needs: repo-discovery`, `if: client || shared`, runs `npm run lint --workspace=apps/client`
- [ ] 1.3 Add `client-format-check` job: `needs: repo-discovery`, `if: client || shared`, runs `npm run format:check --workspace=apps/client`
- [ ] 1.4 Add `client-typecheck` job: `needs: repo-discovery`, `if: client || shared`, runs `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op until TS migration"`
- [ ] 1.5 Add `client-complexity` job: `needs: repo-discovery`, `if: client || shared`, runs eslint complexity rule (or complexity-report)
- [ ] 1.6 Add `client-dead-code` job: `needs: repo-discovery`, `if: client || shared`, runs `npx knip` with workspace config
- [ ] 1.7 Add `client-import-bounds` job: `needs: repo-discovery`, `if: client || shared`, runs `npx dependency-cruiser` with config
- [ ] 1.8 Add `server-lint` job: `needs: repo-discovery`, `if: server || shared`, runs `npm run lint --workspace=apps/server`
- [ ] 1.9 Add `server-format-check` job: `needs: repo-discovery`, `if: server || shared`, runs `npm run format:check --workspace=apps/server`
- [ ] 1.10 Add `server-typecheck` job: `needs: repo-discovery`, `if: server || shared`, runs `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op until TS migration"`
- [ ] 1.11 Add `server-complexity` job: `needs: repo-discovery`, `if: server || shared`, runs eslint complexity rule
- [ ] 1.12 Add `server-dead-code` job: `needs: repo-discovery`, `if: server || shared`, runs `npx knip` with workspace config
- [ ] 1.13 Add `server-import-bounds` job: `needs: repo-discovery`, `if: server || shared`, runs `npx dependency-cruiser` with config
- [ ] 1.14 All pre-build jobs use `actions/checkout@v5` (fetch-depth: 0) + `./.github/actions/setup-monorepo` (no hardcoded Node version)
- [ ] 1.15 Add `actionlint` pre-build job (D10): `needs: repo-discovery`, runs the pinned `rhysd/actionlint@v1` GitHub Action (no unpinned local binary) against all `.github/workflows/*.yml` — the pipeline validates its own workflow files (self-validation)

## 2. Build Jobs (Stage 3)

- [ ] 2.1 Add `client-build` job: `needs: [client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds]`, runs `npm run build --workspace=apps/client`
- [ ] 2.2 Add `client-build` artifact upload: `actions/upload-artifact@v4` with `name: client-dist`, `path: apps/client/dist/`
- [ ] 2.3 Add `server-build` job (D8): `needs: [server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds]`, runs `echo "server-build: no-op (source-level)"` — exists solely for DAG ordering; produces NO compiled output
- [ ] 2.4 ~~Add `server-build` artifact upload: `actions/upload-artifact@v4` with `name: server-dist`, `path: apps/server/dist/`~~ — **REMOVED (D8)**: server build is a no-op with no `dist/` artifact; nothing to upload or download

## 3. Post-build Quality Jobs (Stage 4)

- [ ] 3.1 Add `client-sonarqube` job: `needs: [client-build, test-unit-client]`, `permissions: pull-requests: write` (PR decoration), `actions/download-artifact@v4` for `client-dist` + `coverage-client` (uploaded by `test-unit-client`), uses `SonarSource/sonarqube-scan-action`, `SONAR_TOKEN` + `SONAR_HOST_URL` secrets, client projectKey; **fork-PR gate**: `if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository` (fork PRs have no `SONAR_TOKEN`/`SONAR_HOST_URL` secrets)
- [ ] 3.2 Add `server-sonarqube` job: `needs: [server-build, test-unit-server]`, `permissions: pull-requests: write` (PR decoration), source-level analysis (NO dist artifact download — D8), `actions/download-artifact@v4` for `coverage-server` (uploaded by `test-unit-server` from `apps/server/tests/coverage/`), uses `SonarSource/sonarqube-scan-action`, server projectKey; **fork-PR gate**: `if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository` (fork PRs have no secrets)
- [ ] 3.3 Add `client-coverage` job: `needs: [client-build, test-unit-client]`, `actions/download-artifact@v4` for `client-dist` + `coverage-client`, enforces coverage delta against thresholds read from `apps/client/vitest.config.js` (statements 84%, branches 49%, functions 63%, lines 85%), fails below threshold
- [ ] 3.4 Add `server-coverage` job: `needs: [server-build, test-unit-server]`, source-level (NO dist artifact download — D8), `actions/download-artifact@v4` for `coverage-server` from `apps/server/tests/coverage/`, enforces coverage delta against thresholds read from `apps/server/vitest.config.js` (statements 39%, branches 18%, functions 7%, lines 39%), fails below threshold
- [ ] 3.5 Add `client-depcheck` job: `needs: client-build`, `actions/download-artifact@v4` for `client-dist`, runs `npx depcheck apps/client` (unused/missing deps)
- [ ] 3.6 Add `server-depcheck` job: `needs: server-build`, source-level (NO artifact download — D8), runs `npx depcheck apps/server` (unused/missing deps)
- [ ] 3.7 Add `client-contract-val` job — **DEFERRED (D9)**: no static OpenAPI file exists, so `npx swagger-cli validate` would permanently fail. Do NOT implement until an OpenAPI spec is introduced
- [ ] 3.8 Add `server-contract-val` job — **DEFERRED (D9)**: same as 3.7; re-open together with the OpenAPI spec work

## 4. CI-Complete Aggregator (Stage 5)

- [ ] 4.1 Add `ci-complete` job: `needs: [repo-discovery, actionlint, client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, client-build, server-build, client-sonarqube, server-sonarqube, client-coverage, server-coverage, client-depcheck, server-depcheck, test-unit-client, test-unit-server, test-integration, test-smoke, e2e, zombie-workflow-guard]`, `if: always()` — aggregates ALL pre-build, build, post-build AND test/e2e/guard jobs
- [ ] 4.2 Implement failure detection in `ci-complete`: exit non-zero if any upstream job result is `failure` (via `needs.*.result` check)
- [ ] 4.3 Treat `skipped` upstream results as success (path-filtered jobs). Treat `cancelled` upstream results as NOT success: gate `ci-complete` with `if: always() && !contains(needs.*.result, 'cancelled')` so a cancelled upstream propagates cancellation instead of reporting green. **Cancelled-run behavior**: a cancelled run makes `ci-complete` **skipped** (not failed) — acceptable, because `cancel-in-progress: true` (4.4) ensures the superseding run reports the real result
- [ ] 4.4 Add workflow `concurrency` group with `cancel-in-progress: true` (superseded runs cancel in-progress jobs); document failure/cancelled/skipped aggregation behavior in the job

## 5. Quality.yml Refactor & Cleanup

- [ ] 5.1 Remove `quality` workflow_call job from `ci.yml` (replaced by inline DAG jobs)
- [ ] 5.2 Delete `.github/workflows/quality.yml`
- [ ] 5.3 Extend `zombie-workflow-guard` in `ci.yml` to assert `quality.yml` absence (anti-regression)
- [ ] 5.4 Verify no remaining references to `quality.yml` in `.github/workflows/` or docs

## 6. Existing Jobs Re-wiring

- [ ] 6.1 Re-wire `test-unit-client` to `needs: repo-discovery` (was `changes`)
- [ ] 6.2 Re-wire `test-unit-server`, `test-integration`, `test-smoke` to `needs: repo-discovery` (was `changes`)
- [ ] 6.3 Re-wire `e2e` job to `needs: repo-discovery`, gated on the new `e2e` output (was `changes`)
- [ ] 6.4 Re-wire `build` job into Stage 3 tier or remove if superseded by `client-build`/`server-build`
- [ ] 6.5 Update `zombie-workflow-guard` to `needs: repo-discovery` — runs **unconditionally** (no path filter) to assert `quality.yml` absence (see 5.3)
- [ ] 6.6 Add coverage artifact upload to `test-unit-client` and `test-unit-server` — **coverage must be generated first**: `vitest run` alone produces NO coverage report (no `coverage.enabled` in vitest configs), so use the existing `test:coverage` scripts: `npm run test:coverage --workspace=apps/client` and `npm run test:coverage --workspace=apps/server` (both run `vitest run --coverage`). Upload with `actions/upload-artifact@v4`: `coverage-client` → `apps/client/coverage/` (vitest default), `coverage-server` → `apps/server/tests/coverage/` (per `coverage.reportsDirectory: './tests/coverage'` in `apps/server/vitest.config.js`). Add `if-no-files-found: warn` on BOTH uploads (defensive). Consumed by Stage 4 coverage/SonarQube jobs
- [ ] 6.7 Standardize workspace references across ALL DAG jobs (existing + new): `npm run <script> --workspace=apps/<ws>` everywhere — no bare `apps/<ws>` paths or `cd`-into-workspace

## 7. Tooling Configuration

- [ ] 7.1 Add `knip` config per workspace (allow-list initial false positives)
- [ ] 7.2 Add `dependency-cruiser` config per workspace (import boundary rules)
- [ ] 7.3 Add `depcheck` config per workspace if needed
- [ ] 7.4 Add eslint complexity rule config (threshold per workspace)
- [ ] 7.5 Add dev dependencies to root/workspace `package.json`: `knip`, `dependency-cruiser`, `depcheck` (dev-time only). `swagger-cli` is NOT added — deferred with contract validation (D9). `actionlint` is NOT added as an unpinned npm wrapper — **pin the install method**: use the `rhysd/actionlint@v1` GitHub Action directly in CI (job 1.15); for local runs use a pinned install (e.g. `go install github.com/rhysd/actionlint/cmd/actionlint@v1.x.x` or a version-pinned npm wrapper)
- [ ] 7.6 Add `actionlint` setup (D10): config/install so local runs match the 1.15 job (pre-commit self-validation)

## 8. Documentation & Branch Protection

- [ ] 8.1 Update `docs/cicd-plan-implementacion.md` with the new 5-stage DAG architecture
- [ ] 8.2 Update `docs/learning/ci-cd/06-ci-yml-walkthrough.md` to reflect the new DAG structure
- [ ] 8.3 Document branch protection change: single required check `ci-complete` (replaces per-job checks)
- [ ] 8.4 Document required secrets: `SONAR_TOKEN`, `SONAR_HOST_URL` in repo settings
- [ ] 8.5 Update `docs/cicd-estado-actual.md` to reflect the implemented 5-stage DAG state
- [ ] 8.6 Update `docs/learning/ci-cd/07-quality-yml-reusable.md`: document that the reusable `quality.yml` pattern is superseded by the inline DAG (D1) and the file is deleted
- [ ] 8.7 Update `docs/nivel-experiencia-analisis.md` to reflect the new CI quality DAG architecture and tooling
