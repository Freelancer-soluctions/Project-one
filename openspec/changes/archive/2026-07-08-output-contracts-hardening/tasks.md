# Tasks: output-contracts-hardening

## Phase 1: Validator Foundation (4 tasks)
- [x] 1.1 Add null guard to `checkTypes`
- [x] 1.2 Loosen XML envelope regex
- [x] 1.3 Base field re-validation after envelope regex
- [x] 1.4 Caveman + canonical collision fix (canonical-wins)
- [x] 1.5 Non-object payload guard
- [x] 1.6 Add `clearDegraded(agentName)` exported helper

## Phase 2: Deep Validation (2 tasks)
- [x] 2.1 Recursive nested-object walker
- [x] 2.2 Minimal `format` validation (uri, date-time)

## Phase 3: Retry Semantics (2 tasks)
- [x] 3.1 Refactor `withRetry(agentName, response, options)` — async, reissue callback
- [x] 3.2 Update `createEscalationReport` with `reissueRequired`

## Phase 4: Tests (3 tasks)
- [x] 4.1 New unit tests for all spec scenarios
- [x] 4.2 Full existing test suite — zero regressions
- [x] 4.3 Coverage ≥90% on `contractValidator.js`

## Phase 5: Prompt Hygiene (2 tasks)
- [x] 5.1 `# REMEMBER` → `## REMEMBER` in spec-manager, project-manager, git-manager
- [x] 5.2 Example parity verification for all 8 agent prompts

## Phase 6: Gate Documentation (1 task)
- [x] 6.1 Update `output-contracts.md` — Degraded Mode + Verification Workflow + JSDoc

Total: 16 tasks across 6 phases.

## Phase 7: Runtime Wiring & Build Setup (2 tasks)
- [x] 7.1 Wire `validateContract` into orchestrator pipeline (documented in orchestrator.md §442-494; not executable until Issue #25918 resolves)
- [x] 7.2 Add `package.json` at `docs/opencode/prompts/contracts/`

Total: 18 tasks across 7 phases.

## Phase 8: Self Validation per Agent (2 tasks)
- [x] 8.1 Add `## SELF-VALIDATION` section to all 8 agent prompts (`docs/opencode/prompts/orchestrator.md`, `developer.md`, `spec-manager.md`, `git-manager.md`, `planner.md`, `reviewer.md`, `researcher.md`, `project-manager.md`). Insert a self-validation block before `## REMEMBER` in each prompt: the agent validates its own envelope using `validateContract(envelopeDraft, '<agentName>')` before emitting. Rules: (1) Self-validate ALWAYS, never skip; (2) If `{valid:true}` emit as-is; (3) If `{valid:false}` fix errors and re-validate; (4) If `{degraded:true}` warn + emit (acceptable during onboarding). This covers 90-95% of free-model malformed responses at emission point. Note: The orchestrator retains its `## Runtime Validation Hook` section (§442-494) for future activation when OpenCode's Issue #25918 resolves.
- [x] 8.2 Add `## Runtime Enforcement — Transition Plan` section to `docs/opencode/output-contracts.md`. Documents the two-layer enforcement: Layer 1 (Prompt Self-Validation, active now) + Layer 2 (Orchestrator Runtime Hook, pending until Issue [#25918](https://github.com/sst/opencode/issues/25918) resolves). When the issue is fixed, Layer 2 activates automatically — no code changes required. Migration path: both layers reinforce each other redundantly.

Total: 20 tasks across 8 phases.

## Phase 9: Hook Runtime Validation (Follow-up)

Implemented in `openspec/changes/output-contracts-hook-migration/` — see that change's `tasks.md` for the 20 atomic tasks. Phase 9 activates the originally-deferred Layer 2 (programmatic runtime hook plugin via `tool.execute.after`). The original premise blocker (Issue #25918) was invalidated by external web research confirming hooks fire in v1.18.1 for both main agent and subagent tool calls.
