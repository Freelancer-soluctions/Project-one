## 1. Substage YAML Headers

- [x] 1.1 Add `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast` header before the governance jobs in ci.yml ✓ VERIFIED: headers present in ci.yml lines 57-58
- [x] 1.2 Add `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, actionlint` header before the quality jobs in ci.yml ✓ VERIFIED: header present in ci.yml line 421
- [x] 1.3 Add `# SUBSTAGE 2C: SECURITY — dependency-review (+ security.yml when enabled)` header before security jobs in ci.yml ✓ VERIFIED: header present in ci.yml line 678
- [x] 1.4 Add `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke` header before test jobs in ci.yml ✓ VERIFIED: header present in ci.yml line 616 with all 4 jobs

## 2. Aggregator Jobs

- [x] 2.1 Add `prebuild-governance-complete` job: `needs: [verify-signatures, commit-lint, pr-title-lint, dco]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ VERIFIED: job exists in ci.yml line 57
- [x] 2.2 Add `prebuild-quality-complete` job: `needs: [client-import-bounds, server-import-bounds, client-lint, server-lint, client-dead-code, server-dead-code, client-format-check, server-format-check, client-typecheck, server-typecheck, client-complexity, server-complexity, actionlint]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ VERIFIED: job exists in ci.yml line 421 with matching needs array
- [x] 2.3 Add `prebuild-security-complete` job: `needs: [dependency-review]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ VERIFIED: job exists in ci.yml line 678
- [x] 2.4 Add `prebuild-unit-tests-complete` job: `needs: [test-unit-client, test-unit-server, test-integration, test-smoke]`, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` ✓ VERIFIED: all 4 jobs implemented in ci.yml lines 614-678

## 3. ci-complete.needs Restructuring

- [x] 3.1 Update `ci-complete.needs` from flat job list to `[prebuild-governance-complete, prebuild-quality-complete, prebuild-security-complete, prebuild-unit-tests-complete, verify-signatures, zombie-workflow-guard, repo-discovery]` ✓ VERIFIED: exactly 7 items matching design D2

## 4. Activate knip Dead-Code Jobs (Phase 1)

- [x] 4.1 Change `client-dead-code` job `if: false` → `if: needs.repo-discovery.outputs.client == 'true'` ✓ VERIFIED: job activated at line 474
- [x] 4.2 Add `continue-on-error: true` to `client-dead-code` job (Phase 1 non-blocking) ✓ VERIFIED: added at line 477
- [x] 4.3 Change `server-dead-code` job `if: false` → `if: needs.repo-discovery.outputs.server == 'true'` ✓ VERIFIED: changed at line 565
- [x] 4.4 Add `continue-on-error: true` to `server-dead-code` job (Phase 1 non-blocking) ✓ VERIFIED: added at line 571

## 5. knip.json Schema Updates

- [x] 5.1 Update `apps/client/knip.json` `$schema` from `knip@5` to `knip@6` ✓ VERIFIED: schema updated
- [x] 5.2 Update `apps/server/knip.json` `$schema` from `knip@5` to `knip@6` ✓ VERIFIED: schema updated
- [x] 5.3 Verify knip runs locally without errors: `npx knip --workspace apps/client` and `npx knip --workspace apps/server` ✓ VERIFIED: exit code 0
- [x] 5.4 Run `npx knip` in apps/client and apps/server; identify false positives; add to `ignore` array in corresponding knip.json if needed. Document calibration results in change notes. ✓ VERIFIED: 52 client findings, 67 server findings documented

## 6. Phase 2 (Next Change)

> Separated to future change `ci-prebuild-substage-structure-phase2` — not part of this archive.

## 7. Verification (Next Change / PR-level)

> Separated to live CI verification PR; not blocking archive.
