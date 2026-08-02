## Purpose

Requires every agent prompt in `docs/opencode/prompts/` to contain an explicit anti-empty-output guard ("Empty responses are NOT acceptable") in a top-of-file `## CRITICAL RULES` section, so no agent — including the orchestrator — is allowed to complete a delegation or a response with a silent or envelope-less output. Legacy `# CRITICAL RULES` h1 blocks are renamed to `## Behavioral Rules` to keep a single guard variant.

## ADDED Requirements

### Requirement: Anti-empty-output guard in all 8 agent prompts
Every agent prompt file in `docs/opencode/prompts/` (developer, spec-manager, git-manager, project-manager, planner, reviewer, researcher, orchestrator) SHALL include a `## CRITICAL RULES` section within the first ~15 lines of the file, containing the guard text "Empty responses are NOT acceptable."

#### Scenario: developer.md is the reference pattern
- **WHEN** checking `docs/opencode/prompts/developer.md`
- **THEN** it SHALL contain a `## CRITICAL RULES` section (lines 5-11) that includes "- **Empty responses are NOT acceptable.**"
- **AND** SHALL serve as the reference pattern for the other prompts
- **AND** the pattern SHALL be: the note line plus 3 bullets (`<output-contract>` envelope XML obligatorio, "Empty responses are NOT acceptable.", "Do NOT end without emitting the structured deliverable.")

#### Scenario: spec-manager.md gets a top-of-file CRITICAL RULES block
- **WHEN** checking `docs/opencode/prompts/spec-manager.md`
- **THEN** it SHALL contain a new `## CRITICAL RULES` section placed between line 3 (`# SPEC-MANAGER SYSTEM PROMPT`) and `## YOUR IDENTITY` — top-of-file, NOT mid-file (the first `---` after line 78 `# EXECUTION RULES` is at line 90 and is NOT the insertion point)
- **AND** the section SHALL replicate the `developer.md:3-11` pattern: the note line plus the 3 bullets, with the envelope bullet bound to `agent="spec-manager"`
- **AND** the guard SHALL NOT be added as a numbered item inside any legacy block

#### Scenario: git-manager.md sandwich + rename
- **WHEN** checking `docs/opencode/prompts/git-manager.md`
- **THEN** it SHALL contain a new top-of-file `## CRITICAL RULES` section (after the `# GIT-MANAGER SYSTEM PROMPT` h1, before `## YOUR IDENTITY`) with the 3 bullets of the `developer.md:5-11` pattern
- **AND** its legacy `# CRITICAL RULES` block (line 71, numbered items 1-9) SHALL be renamed to `## Behavioral Rules` with items intact
- **AND** NO numbered guard item SHALL be added to the renamed block

#### Scenario: project-manager.md sandwich + rename
- **WHEN** checking `docs/opencode/prompts/project-manager.md`
- **THEN** it SHALL contain a new top-of-file `## CRITICAL RULES` section with the 3 bullets of the `developer.md:5-11` pattern
- **AND** its legacy `# CRITICAL RULES` block (line 146, numbered items 1-8) SHALL be renamed to `## Behavioral Rules` with items intact
- **AND** NO numbered guard item SHALL be added to the renamed block

#### Scenario: orchestrator.md sandwich + rename
- **WHEN** checking `docs/opencode/prompts/orchestrator.md`
- **THEN** it SHALL contain a new top-of-file `## CRITICAL RULES` section (after the `# ORCHESTRATOR SYSTEM PROMPT` h1, before `## YOUR IDENTITY`) with the 3 bullets of the `developer.md:5-11` pattern — the orchestrator's own final responses are NOT hook-validated, so the prompt-level guard is its only anti-empty protection
- **AND** its legacy `# CRITICAL RULES` block (line 354, 26 items) SHALL be renamed to `## Behavioral Rules` with items intact

#### Scenario: planner, reviewer, researcher already conform
- **WHEN** checking `docs/opencode/prompts/planner.md`, `docs/opencode/prompts/reviewer.md`, and `docs/opencode/prompts/researcher.md`
- **THEN** each SHALL already contain `## CRITICAL RULES` at lines 5-11 with the 3 bullets — no change required

#### Scenario: Guard wording is exact
- **WHEN** any agent prompt contains the anti-empty-output guard
- **THEN** the guard SHALL contain the literal text "Empty responses are NOT acceptable" (case-insensitive match acceptable)
- **AND** SHALL appear within a `## CRITICAL RULES` section in the first ~15 lines of the file

#### Scenario: No legacy # CRITICAL RULES h1 remains
- **WHEN** checking any of the 8 prompt files
- **THEN** the file SHALL NOT contain a `# CRITICAL RULES` h1 heading (only top-of-file `## CRITICAL RULES` and renamed `## Behavioral Rules` for legacy numbered blocks)
- **AND** the 43 legacy behavioral rules (orchestrator 26 + git-manager 9 + project-manager 8) SHALL remain intact under `## Behavioral Rules`

### Requirement: Guard applies to every delegation output
The anti-empty-output guard SHALL be understood as applying to every response the agent emits, including failure cases.

#### Scenario: Failure still requires a response
- **WHEN** an agent cannot complete a delegated task
- **THEN** it SHALL still emit a response containing an output-contract envelope with `status: "failed"` and an explanatory `details` field
- **AND** SHALL NOT emit an empty response
