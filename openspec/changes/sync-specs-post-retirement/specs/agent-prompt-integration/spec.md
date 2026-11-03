# agent-prompt-integration Delta

## MODIFIED Requirements

### Requirement: Output Contract section in all agent prompts

Every agent prompt file in `docs/opencode/prompts/` SHALL include an `## Output Contract` section that defines the agent's response format. The current prompt set is `main.md`, `reviewer.md`, `researcher.md`, and `project-manager.md` (retired prompts — `spec-manager`, `git-manager`, `orchestrator`, `developer`, `planner` — no longer exist and are out of scope).

#### Scenario: Prompt contains Output Contract section

- **WHEN** an agent prompt file is read
- **THEN** it SHALL contain `## Output Contract` as a top-level heading
- **AND** the section SHALL include the XML envelope template specific to that agent
- **AND** the section SHALL include a link or reference to the agent's schema file at `docs/opencode/prompts/contracts/<agent>.schema.json`
- **AND** the section SHALL include success and failure response format examples

#### Scenario: Agent instructed to use envelope

- **WHEN** an agent prompt includes the Output Contract section
- **THEN** the agent SHALL wrap every response in the specified XML envelope format
- **AND** the agent SHALL populate the JSON payload according to its schema
