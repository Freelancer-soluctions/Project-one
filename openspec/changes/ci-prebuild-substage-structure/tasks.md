## 1. Substage YAML Headers

- [x] 1.1 Add `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast` header before the governance jobs in ci.yml ✓ (already present)
- [x] 1.2 Add `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, actionlint` header before the quality jobs in ci.yml ✓ (updated)
- [x] 1.3 Add `# SUBSTAGE 2C: SECURITY — dependency-review (+ security.yml when enabled)` header before security jobs in ci.yml ✓ (updated)
- [x] 1.4 Add `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server` header before test jobs in ci.yml ✓ (already present)

## 2. Aggregator Jobs

- [x] 2.1 Add `prebuild-governance-complete` job: `needs: [verify-signatures, commit-lint, pr-title-lint, dco]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ (already present)
- [x] 2.2 Add `prebuild-quality-complete` job: `needs: [client-import-bounds, server-import-bounds, client-lint, server-lint, client-dead-code, server-dead-code, client-format-check, server-format-check, client-typecheck, server-typecheck, client-complexity, server-complexity, actionlint]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ (updated needs array)
- [x] 2.3 Add `prebuild-security-complete` job: `needs: [dependency-review]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ (already present)
- [x] 2.4 Add `prebuild-unit-tests-complete` job: `needs: [test-unit-client, test-unit-server, test-integration, test-smoke]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ (4 real unit test jobs; test-e2e and coverage do NOT exist as jobs — coverage = client-coverage/server-coverage, separate from substage 2D)

## 3. ci-complete.needs Restructuring

- [x] 3.1 Update `ci-complete.needs` from flat job list to `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete, prebuild-unit-tests-complete, verify-signatures, zombie-workflow-guard, repo-discovery]` ✓ (already present, intact)

## 4. Activate knip Dead-Code Jobs (Phase 1)

- [ ] 4.1 Change `client-dead-code` job `if: false` → `if: needs.repo-discovery.outputs.client == 'true'`
- [ ] 4.2 Add `continue-on-error: true` to `client-dead-code` job (Phase 1 non-blocking)
- [ ] 4.3 Change `server-dead-code` job `if: false` → `if: needs.repo-discovery.outputs.server == 'true'`
- [ ] 4.4 Add `continue-on-error: true` to `server-dead-code` job (Phase 1 non-blocking)

## 5. knip.json Schema Updates

- [ ] 5.1 Update `apps/client/knip.json` `$schema` from `knip@5` to `knip@6`
- [ ] 5.2 Update `apps/server/knip.json` `$schema` from `knip@5` to `knip@6`
- [ ] 5.3 Verify knip runs locally without errors: `npx knip --workspace apps/client` and `npx knip --workspace apps/server`
- [ ] 5.4 Run `npx knip` in apps/client and apps/server; identify false positives; add to `ignore` array in corresponding knip.json if needed. Document calibration results in change notes.

## 6. Phase 2 Documentation (Future)

- [ ] 6.1 Document Phase 2 follow-up task: remove `continue-on-error` from `client-dead-code` and `server-dead-code` after 1 sprint calibration
- [ ] 6.2 Document baseline knip metrics (false positives, ignores needed) for Phase 2 decision

## 7. Verification

- [ ] 7.1 Open a test PR to verify all 4 aggregator jobs report correctly
- [ ] 7.2 Verify `ci-complete` depends on aggregators and passes when CI_MINIMAL=true
- [ ] 7.3 Verify knip dead-code jobs run but don't block (continue-on-error: true)
- [ ] 7.4 Verify no regressions in existing 4 ruleset status checks (Verify Commit Signatures, Commit Lint, PR Title Lint, DCO)
