## MODIFIED Requirements

### Requirement: Silent exit detection
The orchestrator SHALL parse the `<task_result>` output after every `task` tool call and SHALL classify the delegation as a silent exit ONLY when the output is empty/whitespace. Output that contains text but lacks an `<output-contract>` envelope SHALL be treated as a soft `MISSING_ENVELOPE` failure, NOT a silent exit.

#### Scenario: Empty task_result triggers detection (UNCHANGED)
- **WHEN** the orchestrator receives a `task` tool result whose `<task_result>` body is empty or whitespace-only
- **THEN** the orchestrator SHALL classify it as a silent exit
- **AND** SHALL trigger the retry protocol

#### Scenario: Missing envelope is a soft failure, NOT a silent exit (CHANGED)
- **WHEN** the `task` tool result contains text but no `<output-contract>` envelope
- **THEN** the orchestrator SHALL classify it as a soft `MISSING_ENVELOPE` failure
- **AND** SHALL NOT trigger the retry protocol
- **AND** SHALL preserve the subagent's text as the deliverable
- **AND** SHALL report to the user with `responseType: "failure"` and `error.code: "MISSING_ENVELOPE"`

#### Scenario: Valid envelope passes through (UNCHANGED)
- **WHEN** the `task` tool result contains a well-formed `<output-contract>` envelope with JSON payload
- **THEN** the orchestrator SHALL process it normally and SHALL NOT trigger the retry protocol
