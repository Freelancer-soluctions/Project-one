## ADDED Requirements

### Requirement: Refined silent-exit detection semantics
The orchestrator SHALL distinguish a TRUE silent exit (empty `<task_result>` body) from a soft `MISSING_ENVELOPE` failure (text present but no `<output-contract>` envelope). Only the TRUE silent exit SHALL trigger the retry protocol.

#### Scenario: Empty task_result body is a TRUE silent exit
- **WHEN** the orchestrator receives a `task` tool result whose `<task_result>` body is empty or whitespace-only
- **THEN** the orchestrator SHALL classify it as a TRUE silent exit
- **AND** SHALL trigger the retry protocol (unchanged behavior)

#### Scenario: Envelope-less but non-empty body is a soft failure
- **WHEN** the `task` tool result contains text but no `<output-contract>` envelope
- **THEN** the orchestrator SHALL classify it as a soft `MISSING_ENVELOPE` failure
- **AND** SHALL NOT trigger the retry protocol
- **AND** SHALL preserve the subagent's text as the deliverable (the text is the source of truth; the envelope is a wrapper, not the content)
- **AND** SHALL report the failure to the user with `responseType: "failure"` and `error.code: "MISSING_ENVELOPE"`

#### Scenario: Valid envelope passes through
- **WHEN** the `task` tool result contains a well-formed `<output-contract>` envelope with JSON payload
- **THEN** the orchestrator SHALL process it normally and SHALL NOT trigger the retry protocol

### Requirement: No token-wasteful retry on envelope-less output
The orchestrator SHALL NOT re-delegate a subagent solely because its output lacked the `<output-contract>` envelope, when the output contained valid deliverable text.

#### Scenario: Envelope-less output does not re-run subagent reasoning
- **WHEN** a subagent returns valid deliverable text without an `<output-contract>` envelope
- **THEN** the orchestrator SHALL NOT re-delegate the subagent
- **AND** SHALL NOT re-run the subagent's full reasoning (which would double token consumption)
- **AND** SHALL use the returned text as the deliverable
