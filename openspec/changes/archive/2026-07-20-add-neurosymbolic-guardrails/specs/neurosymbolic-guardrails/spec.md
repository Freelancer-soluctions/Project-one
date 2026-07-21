## ADDED Requirements

### Requirement: Rule interface and registry

The system SHALL define a `Rule` interface with `name`, `description`, `tool`, and `validate` function. The system SHALL maintain a `TOOL_RULES` registry that maps tool names to arrays of applicable rules.

#### Scenario: Rule interface shape
- **WHEN** a new rule is defined
- **THEN** it SHALL conform to `{ name: string, description: string, tool: string, validate: (args: unknown, context: RuleContext) => ValidationResult }`

#### Scenario: TOOL_RULES registry
- **WHEN** the module loads
- **THEN** `TOOL_RULES` SHALL be a `Record<string, Rule[]>` where each key is a tool name and each value is the array of rules for that tool

#### Scenario: Empty rules for unknown tools
- **WHEN** a tool has no registered rules
- **THEN** `TOOL_RULES[toolName]` SHALL return `undefined` and no validation occurs

### Requirement: validateRules() pure function

The system SHALL provide a `validateRules()` function that accepts an array of rules and tool arguments, evaluates each rule's `validate()` method, and returns a `ValidationResult` with `{ allowed: boolean, violations: string[] }`.

#### Scenario: All rules pass
- **WHEN** `validateRules()` is called with rules whose `validate()` all return `{ allowed: true }`
- **THEN** the result SHALL have `allowed: true` and an empty `violations` array

#### Scenario: One rule fails
- **WHEN** `validateRules()` is called with rules where at least one `validate()` returns `{ allowed: false, message: "reason" }`
- **THEN** the result SHALL have `allowed: false` and `violations` containing `["reason"]`

#### Scenario: Multiple rules fail
- **WHEN** `validateRules()` is called with multiple failing rules
- **THEN** the result SHALL have `allowed: false` and `violations` containing ALL failure messages

#### Scenario: validateRules is deterministic
- **WHEN** `validateRules()` is called with the same rules and args
- **THEN** it SHALL always return the same result (no randomness, no side effects)

### Requirement: buildContext() function

The system SHALL provide a `buildContext()` function that extracts relevant context from a tool call input for rule evaluation.

#### Scenario: Recognized tool provides full context
- **WHEN** `buildContext()` is called with a recognized tool name and valid input
- **THEN** the result SHALL contain `tool`, `args`, `sessionId`, and `callId` fields

#### Scenario: Unrecognized tool returns minimal context
- **WHEN** `buildContext()` is called with an unrecognized tool name
- **THEN** the result SHALL contain at minimum `tool` and `args` fields

#### Scenario: Parse error returns null
- **WHEN** `buildContext()` encounters a parse error on input
- **THEN** it SHALL return `null` (execution proceeds — fail-safe)

### Requirement: tool.execute.before hook

The system SHALL register a `tool.execute.before` hook that intercepts every tool call, evaluates applicable rules, and either allows or blocks execution.

#### Scenario: Tool with no rules — passes through
- **WHEN** a tool call has no registered rules in `TOOL_RULES`
- **THEN** the hook SHALL NOT throw and execution proceeds normally

#### Scenario: Tool with all-passing rules — passes through
- **WHEN** all applicable rules return `{ allowed: true }`
- **THEN** the hook SHALL NOT throw and execution proceeds normally

#### Scenario: Tool with failing rule — blocked
- **WHEN** any applicable rule returns `{ allowed: false }`
- **THEN** the hook SHALL throw a `GuardrailBlockedError` with a descriptive message containing the violation reasons

#### Scenario: Multiple failing rules — all violations reported
- **WHEN** multiple rules fail for the same tool call
- **THEN** the thrown Error SHALL contain ALL violation messages

### Requirement: GuardrailBlockedError

The system SHALL define a `GuardrailBlockedError` class extending `Error` that is thrown when a guardrail blocks a tool call.

#### Scenario: Error has descriptive message
- **WHEN** a `GuardrailBlockedError` is thrown
- **THEN** its `message` SHALL start with `"GUARDRAIL_BLOCKED: "` followed by violation reasons

#### Scenario: Error is instanceof Error
- **WHEN** a `GuardrailBlockedError` is caught
- **THEN** `error instanceof GuardrailBlockedError` SHALL be `true`

### Requirement: Audit log entries

The system SHALL write a JSONL entry to `.opencode/logs/guardrails-audit.jsonl` for every blocked tool call.

#### Scenario: Blocked call creates audit entry
- **WHEN** a guardrail blocks a tool call
- **THEN** a JSONL entry SHALL be appended containing `timestamp`, `tool`, `sessionId`, `callId`, `violations` array, and `args`

#### Scenario: Audit log is valid JSONL
- **WHEN** audit entries are written
- **THEN** each line SHALL be valid JSON, one entry per line, no trailing comma

#### Scenario: Audit directory created lazily
- **WHEN** the first audit entry is written
- **THEN** `.opencode/logs/` SHALL be created if it does not exist (via `mkdirSync` with `recursive: true`)

### Requirement: Graceful error handling

The system SHALL handle unexpected errors in the hook without blocking tool execution.

#### Scenario: Unexpected error in hook — execution proceeds
- **WHEN** the hook encounters an unexpected error (TypeError, ReferenceError, etc.) that is NOT a `GuardrailBlockedError`
- **THEN** the error SHALL be logged to the audit log
- **AND** the hook SHALL NOT re-throw (execution proceeds)

#### Scenario: GuardrailBlockedError is always re-thrown
- **WHEN** a `GuardrailBlockedError` is caught in the try/catch
- **THEN** it SHALL be re-thrown (execution is cancelled)

### Requirement: Coexistence with output-contracts.ts

The new plugin SHALL load independently alongside the existing `output-contracts.ts` plugin without shared state or ordering dependencies.

#### Scenario: Both plugins registered
- **WHEN** both plugins are in the `opencode.jsonc` `plugin` array
- **THEN** both SHALL load and register their hooks without errors

#### Scenario: No shared state
- **WHEN** either plugin executes
- **THEN** it SHALL NOT read or write to the other plugin's variables, audit log, or configuration

#### Scenario: Independent failure
- **WHEN** one plugin throws during initialization
- **THEN** the other plugin SHALL continue to function normally

### Requirement: Demo rules (minimum 3)

The system SHALL include at least 3 demo rules demonstrating the guardrail pattern.

#### Scenario: No-execute zone rule
- **WHEN** a tool call matches a tool name in a configured no-execute zone
- **THEN** the rule SHALL return `{ allowed: false }` with message indicating the tool is restricted in that zone

#### Scenario: Restricted argument rule
- **WHEN** a tool call contains arguments matching a restricted pattern
- **THEN** the rule SHALL return `{ allowed: false }` with message indicating which argument is restricted

#### Scenario: Approval gate rule
- **WHEN** a tool call requires approval (e.g., deleting resources)
- **THEN** the rule SHALL return `{ allowed: false }` with message indicating approval is required
