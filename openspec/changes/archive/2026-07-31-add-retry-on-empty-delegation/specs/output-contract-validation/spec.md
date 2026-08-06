## ADDED Requirements

### Requirement: Silent-exit candidate audit logging
The plugin SHALL append a JSONL entry with `eventType: "silent_exit_candidate"` to `.opencode/logs/contract-audit.jsonl` when the task result extraction returns `null` (empty `<task_result>` output), in addition to the existing `console.warn`, so silent exits become measurable.

#### Scenario: Null extraction logs silent_exit_candidate
- **WHEN** the Layer-2 hook processes a `task` tool result and `extractTaskResult` returns `null` (empty or unparseable `<task_result>`)
- **THEN** a JSONL entry SHALL be appended to `.opencode/logs/contract-audit.jsonl`
- **AND** the entry SHALL contain `eventType: "silent_exit_candidate"`
- **AND** the entry SHALL contain `timestamp` (ISO 8601), `agent` (subagent_type), `sessionId`, `task` (output.title or "(unknown task)"), and `retryCount` (0 from the hook, since Layer 2 is observe-only)
- **AND** the existing `console.warn` SHALL still be emitted

#### Scenario: Valid contract does not log silent_exit_candidate
- **WHEN** `extractTaskResult` returns a valid `<task_result>` with a well-formed envelope
- **THEN** no `silent_exit_candidate` entry SHALL be written

#### Scenario: Invalid envelope does not log silent_exit_candidate
- **WHEN** the task result parses but fails contract validation (`{ valid: false }`)
- **THEN** the entry SHALL use the existing failure path (`validationErrors` present) and SHALL NOT be marked `silent_exit_candidate`

#### Scenario: Envelope-less responses do NOT log silent_exit_candidate
- **WHEN** the task tool output contains text but lacks an `<output-contract>` envelope
- **THEN** the validator SHALL emit a "contract-validation" entry (existing behavior)
- **AND** SHALL NOT emit a "silent_exit_candidate" entry (candidate = null extraction ONLY)
- **AND** the orchestrator SHALL treat envelope-less responses as silent exit per the orchestrator-retry-protocol spec

#### Scenario: Audit write failure is non-fatal
- **WHEN** `fs.appendFileSync` throws while writing the `silent_exit_candidate` entry
- **THEN** the error SHALL be caught and logged via `console.error`
- **AND** the session SHALL continue without crashing

### Requirement: Subagent silent exit telemetry documentation
The system SHALL document the `subagent.silent_exit` telemetry event in `docs/opencode/output-contracts.md` under a new "Subagent Silent Exit Audit" section.

#### Scenario: Documentation section exists
- **WHEN** a developer reads `docs/opencode/output-contracts.md`
- **THEN** it SHALL contain a "Subagent Silent Exit Audit" section
- **AND** the section SHALL describe the `subagent.silent_exit` event emitted by the orchestrator to `.opencode/logs/subagent-silent-exit-audit.jsonl`
- **AND** the section SHALL describe the `silent_exit_candidate` entry written by the Layer-2 plugin to `.opencode/logs/contract-audit.jsonl`
- **AND** the section SHALL explain the relationship: the plugin marks candidates, the orchestrator performs recovery

#### Scenario: Documentation fields listed
- **WHEN** a developer reads the "Subagent Silent Exit Audit" section
- **THEN** it SHALL list the audit fields (`timestamp`, `agent`, `retryCount`, `delegation` summary for the orchestrator log; `timestamp`, `agent`, `sessionId`, `task`, `retryCount` for the plugin log)
