## 1. Disable strict silent-exit detection (ALREADY APPLIED this session)

- [x] 1.1 Disable the Layer-2 plugin in `opencode.jsonc` (comment out line 6: `"./.opencode/plugins/output-contracts.ts",`) and add the `// Disabled 2026-08-02 ...` comment block referencing this change
- [x] 1.2 Soften detection in `docs/opencode/prompts/orchestrator.md` (lines 399-401): wrap the missing-envelope OR-criterion in an HTML comment (`<!-- DISABLED 2026-08-02 ... -->`) and add the `MISSING_ENVELOPE` soft-failure fallback paragraph (no retry, preserve subagent text, report to user)

## 2. Verify the disabled behavior

- [ ] 2.1 Verify with a real delegation that envelope-less outputs no longer trigger retry (subagent text is preserved as the deliverable, reported as `MISSING_ENVELOPE`)
- [ ] 2.2 Verify empty `<task_result>` body STILL triggers retry (regression test — TRUE silent exit must still be caught)

## 3. Update documentation

- [ ] 3.1 Update `docs/opencode/output-contracts.md` "Subagent Silent Exit Audit" section to note the current disabled state and reference this change

## 4. Commit

- [ ] 4.1 Commit with message: `refactor(orchestrator): disable silent-exit envelope-retry, document re-enable procedure`

## 5. Future / Review (NOT part of this change's implementation)

- [ ] 5.1 (FUTURE/REVIEW) Investigate Fix B (reinforce subagent system prompts to embed contract requirement natively)
- [ ] 5.2 (FUTURE/REVIEW) Investigate Fix C (accept JSON envelope alternative format)
- [ ] 5.3 (FUTURE/REVIEW) Investigate Fix D (use plugin's `metadata.contractValidation` signal for granular detection)
