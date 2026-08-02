## ADDED Requirements

### Requirement: Orchestrator delegation suffix rule
The system SHALL register a rule named `orchestrator-delegation-suffix-required` in the `TOOL_RULES` registry for the `task` tool, which blocks delegation calls whose prompt omits the "DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)" block at the end.

#### Scenario: Rule registered for task tool
- **WHEN** `TOOL_RULES` is inspected for the `task` tool
- **THEN** it SHALL include a rule with `name: "orchestrator-delegation-suffix-required"` and `tool: "task"`
- **AND** the rule SHALL follow the same shape as the existing 12 rules (`{ name, description, tool, validate }`)

#### Scenario: Suffix present — call allowed
- **WHEN** a `task` tool call's prompt ends with the DELEGATION SUFFIX block (contains "DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)")
- **THEN** the rule SHALL return `{ allowed: true }` and execution proceeds normally

#### Scenario: Suffix missing — call blocked
- **WHEN** a `task` tool call's prompt does NOT contain the "DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR)" marker
- **THEN** the rule SHALL return `{ allowed: false }` with a message indicating the delegation suffix is required
- **AND** the blocked error message SHALL start with "GUARDRAIL_BLOCKED: " followed by the violation reason
- **AND** the message SHALL include a retry hint telling the orchestrator to append the DELEGATION SUFFIX block before retrying

#### Scenario: Rule fails open when prompt field is unextractable
- **WHEN** the `task` tool is invoked AND the args contain no extractable prompt string (e.g., args shape change, missing prompt field)
- **THEN** the rule SHALL return `{ allowed: true }` with a `console.warn` note "[guardrails] orchestrator-delegation-suffix-required: prompt unextractable, failing open"
- **AND** the task tool call SHALL proceed normally
- **AND** no GUARDRAIL_BLOCKED error SHALL be raised

#### Scenario: Rule enforcement is global by design
- **WHEN** a subagent (non-orchestrator) invokes the `task` tool with a prompt that intentionally has no suffix
- **THEN** the rule SHALL still block the call (the suffix is required on every delegation, and the orchestrator is the only agent that delegates)

#### Scenario: Rule test coverage
- **WHEN** the guardrails test suite runs
- **THEN** tests SHALL cover: suffix present passes, suffix missing blocks with GUARDRAIL_BLOCKED prefix, and retry hint present in the violation message
