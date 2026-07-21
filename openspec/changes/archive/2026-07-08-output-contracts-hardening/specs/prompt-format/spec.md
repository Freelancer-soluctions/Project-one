# Prompt Format

## Purpose
Define structural requirements for agent prompt files in `docs/opencode/prompts/`. This capability ensures consistent section ordering, heading levels, and example payload validatability across all agent prompts.

## Requirements

### Requirement: OUTPUT CONTRACT section must exist before REMEMBER
Every agent prompt SHALL contain a `## OUTPUT CONTRACT` section positioned BEFORE the `## REMEMBER` section.

#### Scenario: OUTPUT CONTRACT present before REMEMBER
- **WHEN** reviewing an agent prompt file at `docs/opencode/prompts/<agent>.md`
- **THEN** it MUST contain a `## OUTPUT CONTRACT` section and its line number MUST be less than the `## REMEMBER` line number

#### Scenario: Missing OUTPUT CONTRACT section
- **WHEN** an agent prompt has no `## OUTPUT CONTRACT` heading
- **THEN** the coverage gate reports a violation

#### Scenario: OUTPUT CONTRACT after REMEMBER
- **WHEN** `## OUTPUT CONTRACT` appears after `## REMEMBER`
- **THEN** the coverage gate reports an ordering violation

### Requirement: REMEMBER heading must be h2
Every agent prompt SHALL use `## REMEMBER` (level-2 heading) rather than `# REMEMBER` (level-1 heading) to maintain structural consistency.

#### Scenario: Correct h2 REMEMBER heading
- **WHEN** an agent prompt uses `## REMEMBER`
- **THEN** the heading level check passes

#### Scenario: Wrong h1 REMEMBER heading
- **WHEN** an agent prompt uses `# REMEMBER` instead of `## REMEMBER`
- **THEN** the coverage gate reports a heading level violation

#### Scenario: All three affected files identified
- **WHEN** checking `spec-manager.md`, `project-manager.md`, and `git-manager.md`
- **THEN** all three are found to have `# REMEMBER` (h1) instead of `## REMEMBER` (h2)
- **AND** the fix changes `# REMEMBER` to `## REMEMBER` in each file

### Requirement: Example payload validatability
Every agent prompt's `## OUTPUT CONTRACT` section SHALL contain at least one JSON example payload that, when extracted and validated against the corresponding schema, returns `{valid: true}`.

#### Scenario: Example payload extracts correctly
- **WHEN** extracting the JSON block after "**Valid Example (Success):**" in any agent prompt
- **THEN** the extracted text is valid JSON with all required fields

#### Scenario: Example payload validates successfully
- **WHEN** the extracted example payload is fed to `validateContract` with the matching `agentName`
- **THEN** it returns `{valid: true}` (or `{valid: true, degraded: true}` if no schema file exists)

#### Scenario: Example payload with error block
- **WHEN** the "**Valid Example (Failure):**" JSON block contains an `error` object with `code`, `message`, and optional `details`
- **THEN** the payload is valid against the failure schema (nested object validation passes)

#### Scenario: Example payload passes envelope parse
- **WHEN** the example JSON is extracted from within an XML envelope in the prompt
- **THEN** the envelope regex parses it correctly and extracts `agent`, `version` attributes

### Requirement: Section ordering integrity
The agent prompt sections SHALL follow a consistent structural order.

#### Scenario: Sections in correct order
- **WHEN** an agent prompt has multiple sections
- **THEN** `## OUTPUT CONTRACT` MUST precede `## REMEMBER`
- **AND** no other `##` heading appears between them that would structurally separate the contract from the reminder

#### Scenario: Envelope template before examples
- **WHEN** a prompt has both an envelope template and example payloads
- **THEN** the envelope template appears before any JSON example block

### Requirement: Coverage gate automation
The system SHALL support automated verification of prompt hygiene rules.

#### Scenario: Coverage gate checks all prompt files
- **WHEN** the coverage gate runs
- **THEN** it checks EVERY `.md` file in `docs/opencode/prompts/` (excluding subdirectory files unless specified)

#### Scenario: Coverage gate produces report
- **WHEN** the coverage gate finds violations
- **THEN** it produces a report listing each violation by file, line number, and rule name

#### Scenario: Coverage gate returns zero violations after fix
- **WHEN** all prompts have `## REMEMBER` (h2) and `## OUTPUT CONTRACT` before it
- **THEN** the coverage gate returns zero violations
