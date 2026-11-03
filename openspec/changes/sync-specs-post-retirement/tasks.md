# Tasks: sync-specs-post-retirement

## 1. Locate drift

- [ ] 1.1 Run `grep -rn "git-manager\|spec-manager" openspec/specs/` and record every match; confirm inventory matches design §Context (5 specs: local-commit-all-dco ×3, empty-response-guard ×6, agent-prompt-integration ×1, output-contract-validation ×1, prompt-format ×1)

## 2. Re-point specs

- [ ] 2.1 `local-commit-all-dco/spec.md` — replace the 3 `@git-manager` actors (Purpose + 2 scenarios) with "the primary agent" per design D1; verify grep shows no `@git-manager`; verify SHALL statements unchanged
- [ ] 2.2 `empty-response-guard/spec.md` — rewrite the requirement enumeration to the current prompt set (main, reviewer, researcher, project-manager) per D2; delete the scenarios whose subject files are deleted (spec-manager.md CRITICAL RULES scenario, git-manager.md sandwich scenario, orchestrator.md sandwich scenario, developer.md-as-reference if deleted); replace the "43 rules (26+9+8)" count with the count-neutral invariant per D3; verify no `spec-manager`/`git-manager` residual
- [ ] 2.3 `agent-prompt-integration/spec.md` (`spec.md:11`) — rewrite the 8-file enumeration to the current 4-prompt set per D2; verify no residual
- [ ] 2.4 `output-contract-validation/spec.md` (`spec.md:577`) — replace the illustrative agent list with current agents per D4; verify no residual
- [ ] 2.5 `prompt-format/spec.md` (`spec.md:66`) — drop `spec-manager.md`/`git-manager.md` from the checked-files scenario (keep surviving prompts) per D2; verify no residual

## 3. Verification

- [ ] 3.1 `grep -rn "@git-manager\|@spec-manager\|spec-manager.md\|git-manager.md" openspec/specs/` → **zero matches**
- [ ] 3.2 Confirm every edited requirement still has valid `### Requirement:` + `#### Scenario:` structure (headings unbroken)
- [ ] 3.3 Intent preservation review: DCO/-S -s rules, empty-response guard, output-contract section, and prompt-format rules are semantically unchanged — only actors/enumerations/counts changed
- [ ] 3.4 Run the prompt-hygiene/contract test suites (`cd docs/opencode/prompts/contracts && npx vitest run`) to confirm no spec text is asserted by tests that I broke (expected 44/44)
