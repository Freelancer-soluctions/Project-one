# prompt-format Delta

## MODIFIED Requirements

### Requirement: Legacy h1 REMEMBER heading is normalized

_(Scenario-scoped delta — only the drifted scenario is restated; the requirement's other scenarios are unchanged.)_

#### Scenario: All affected files identified

- **WHEN** checking the surviving agent prompts (`main.md`, `project-manager.md`, `reviewer.md`, `researcher.md`)
- **THEN** any file still using `# REMEMBER` (h1) instead of `## REMEMBER` (h2) is identified for normalization
- **AND** the fix changes `# REMEMBER` to `## REMEMBER` in each such file

> The original scenario named `spec-manager.md` and `git-manager.md`, whose prompts were retired by `retire-command-wrapper-agents`; those files no longer exist and cannot be checked.
