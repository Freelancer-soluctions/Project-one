# empty-response-guard Delta

## MODIFIED Requirements

### Requirement: Anti-empty-output guard in all agent prompts

Every agent prompt file in `docs/opencode/prompts/` SHALL include a `## CRITICAL RULES` section within the first ~15 lines of the file, containing the guard text "Empty responses are NOT acceptable." The current prompt set is `main.md`, `reviewer.md`, `researcher.md`, and `project-manager.md` (the `spec-manager`, `git-manager`, `orchestrator`, `developer`, and `planner` prompts were retired by their respective changes).

#### Scenario: main.md is the reference pattern

- **WHEN** checking `docs/opencode/prompts/main.md`
- **THEN** it SHALL contain a `## CRITICAL RULES` section (top-of-file) that includes "- **Empty responses are NOT acceptable.**"
- **AND** SHALL serve as the reference pattern for the other prompts

#### Scenario: surviving prompts conform

- **WHEN** checking `docs/opencode/prompts/reviewer.md`, `docs/opencode/prompts/researcher.md`, and `docs/opencode/prompts/project-manager.md`
- **THEN** each SHALL contain `## CRITICAL RULES` at the top of the file with the anti-empty-output guard

#### Scenario: Guard wording is exact

- **WHEN** any agent prompt contains the anti-empty-output guard
- **THEN** the guard SHALL contain the literal text "Empty responses are NOT acceptable" (case-insensitive match acceptable)
- **AND** SHALL appear within a `## CRITICAL RULES` section in the first ~15 lines of the file

#### Scenario: No legacy # CRITICAL RULES h1 remains

- **WHEN** checking any agent prompt file
- **THEN** the file SHALL NOT contain a `# CRITICAL RULES` h1 heading (only top-of-file `## CRITICAL RULES` and renamed `## Behavioral Rules` for legacy numbered blocks)
- **AND** the legacy behavioral rules of every prompt that has such a block SHALL remain intact under `## Behavioral Rules`
