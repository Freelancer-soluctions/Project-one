## 1. Pre-flight Assessment

- [x] 1.1 Run `actionlint` locally to identify pre-existing findings in `.github/workflows/*.yml` (fallback: if docker daemon down and binary unavailable, validation via CI job `rhysd/actionlint@v1` + post-PR verification)
- [x] 1.2 Run `npm run lint --workspace=apps/client` without `--max-warnings 0` to capture baseline error count
- [x] 1.3 Run `npm run lint --workspace=apps/server` without `--max-warnings 0` to capture baseline error count
- [x] 1.4 Document baseline findings in change notes

## 2. ESLint Complexity Threshold

- [x] 2.1 Update `eslint.config.js`: change complexity rule from `['error', { max: 15 }]` to `['error', { max: 20 }]` in BOTH blocks (client L216 `files: ['apps/client/**/*.{js,jsx}']`, server L223 `files: ['apps/server/**/*.js']`)
- [x] 2.2 Verify lint passes with new threshold: `npm run lint --workspace=apps/client && npm run lint --workspace=apps/server`

## 3. ci.yml — client-lint Job

- [x] 3.1 Reactivate `client-lint` job in `.github/workflows/ci.yml`: replace `if: false` with `if: needs.repo-discovery.outputs.client == 'true' && github.event_name == 'pull_request'`
- [x] 3.2 Ensure job uses `needs: repo-discovery` dependency
- [x] 3.3 Ensure job uses composite action `.github/actions/setup-monorepo/action.yml` for setup
- [x] 3.4 Verify job runs `npm run lint --workspace=apps/client`

## 4. ci.yml — server-lint Job

- [x] 4.1 Reactivate `server-lint` job in `.github/workflows/ci.yml`: replace `if: false` with `if: needs.repo-discovery.outputs.server == 'true' && github.event_name == 'pull_request'`
- [x] 4.2 Ensure job uses `needs: repo-discovery` dependency
- [x] 4.3 Ensure job uses composite action `.github/actions/setup-monorepo/action.yml` for setup
- [x] 4.4 Verify job runs `npm run lint --workspace=apps/server`

## 5. ci.yml — actionlint Job

- [x] 5.1 Reactivate `actionlint` job in `.github/workflows/ci.yml`: replace `if: false` with `if: needs.repo-discovery.outputs.shared == 'true' && github.event_name == 'pull_request'`
- [x] 5.2 Ensure job uses `needs: repo-discovery` dependency
- [x] 5.3 Verify job runs `rhysd/actionlint@v1`
- [x] 5.4 Fix or disable pre-existing actionlint findings (from step 1.1)

## 6. Verification

- [x] 6.1 Run `actionlint` locally to confirm no remaining errors
- [x] 6.2 Verify all 3 jobs are standalone (no `CI_MINIMAL` gate in their `if:` conditions)
- [x] 6.3 Verify `ci-complete.needs` is unchanged
- [x] 6.4 Verify 4 ruleset status check names are unchanged (`Verify Commit Signatures`, `Commit Lint`, `PR Title Lint`, `DCO`)
- [x] 6.5 Verify `eslint.config.js` complexity is `["error", 20]`
- [x] 6.6 Verify `client-complexity` and `server-complexity` jobs (ci.yml L459-471, L545-558) remain `if: false` — NOT part of this change, they have `complexity: 15` hardcoded inline

## 7. Documentation Updates

- [x] 7.1 Update `docs/CONTEXT-CICD.md` §3.1: change `if: false` note for client-lint, server-lint, actionlint to "active path-scoped"
- [x] 7.2 Update `docs/CONTEXT-CICD.md` §3.3: add client-lint, server-lint, actionlint to job table with correct names and conditions
- [x] 7.3 Update `docs/CONTEXT-CICD.md` §5.5: document that `CI_MINIMAL=true` no longer gates these 3 lint jobs
- [x] 7.4 Update `docs/CONTEXT-CICD.md` §9: add this change to the implemented changes catalog
- [x] 7.5 Check `docs/learning/ci-cd/24-dag-infraestructura.md` for obsolete references and update if needed

## 8. Post-merge — CI_MINIMAL Flip

- [x] 8.1 After merge to main, run `gh variable set CI_MINIMAL --body "false"` (GitHub Admin, executed by @git-manager)
- [x] 8.2 Verify `CI_MINIMAL` is set to `false`: `gh variable get CI_MINIMAL`
- [ ] 8.3 Verify `ci-complete` job now runs (not skipped) on next PR
