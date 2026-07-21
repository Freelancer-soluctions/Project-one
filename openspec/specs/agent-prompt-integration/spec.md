## ADDED Requirements

### Requirement: Output Contract section in all agent prompts
Every agent prompt file (developer.md, spec-manager.md, git-manager.md, reviewer.md, research.md, project-manager.md, planner.md, orchestrator.md) SHALL include an `## Output Contract` section that defines the agent's response format.

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

### Requirement: Response format templates per agent
Each agent's prompt SHALL include exact JSON template examples for both success and failure response payloads, reflecting the agent-specific fields.

#### Scenario: Success template in prompt
- **WHEN** the agent prompt's Output Contract section is reviewed
- **THEN** it SHALL contain a `**Success Response**` subsection
- **AND** the subsection SHALL include a code-fenced JSON example
- **AND** the example SHALL include all required fields from the agent's schema

#### Scenario: Failure template in prompt
- **WHEN** the agent prompt's Output Contract section is reviewed
- **THEN** it SHALL contain a `**Failure Response**` subsection
- **AND** the subsection SHALL include a code-fenced JSON example
- **AND** the example SHALL include the `error` object with `code` and `message`

### Requirement: Consistent section placement
The `## Output Contract` section SHALL appear as the penultimate section in every agent prompt, immediately before the `## Tools` or `## Execution Rules` section (whichever is last).

#### Scenario: Section order maintained
- **WHEN** an agent prompt is read
- **THEN** the `## Output Contract` section SHALL be positioned as the second-to-last section

### Requirement: Planner Response Examples
The planner agent prompt SHALL include specific response examples demonstrating both success and failure payloads, including the caveman mode compression behavior.

#### Scenario: Success response example
- **WHEN** the planner prompt's Output Contract section is reviewed
- **THEN** it SHALL contain a success response JSON example with the following fields:
  - `verdict` — string ("APPROVED", "NEEDS CHANGES", or "NEEDS CLARIFICATION")
  - `criticalIssues` — array of objects listing blocking concerns (each with `issue`, `impact`, `recommendation`)
  - `suggestions` — array of objects with improvement recommendations (each with `suggestion`, `rationale`)
  - `taskAmendments` — array of task modification objects (each with `taskId`, `change`, `reason`)

#### Scenario: Success response JSON template
```json
{
  "responseType": "success",
  "verdict": "APPROVED",
  "criticalIssues": [],
  "suggestions": [{ "suggestion": "Consider adding input validation for edge cases", "rationale": "Prevents injection attacks" }],
  "taskAmendments": [
    { "taskId": "3.4", "change": "Add rate limiting to the endpoint", "reason": "Prevents brute-force attacks" }
  ]
}
```

#### Scenario: Failure response example
- **WHEN** the planner prompt's Output Contract section is reviewed
- **THEN** it SHALL contain a failure response JSON example
- **AND** the example SHALL include an `error` object with `code` and `message`

#### Scenario: Failure response JSON template
```json
{
  "responseType": "failure",
  "error": {
    "code": "INVALID_PLAN_SCOPE",
    "message": "The proposed change scope overlaps with active change 'add-events-pagination'. Please resolve conflicts before submitting."
  }
}
```

#### Scenario: Caveman mode response
- **WHEN** the planner is delegated to in `/caveman` mode
- **THEN** the planner SHALL respond with the XML envelope intact (envelope tags not compressed)
- **AND** the JSON field names inside the payload MAY use compressed field names (e.g., `v` for verdict, `ci` for criticalIssues, `ta` for taskAmendments)
- **AND** the surrounding natural language text SHALL be compressed per caveman protocol
