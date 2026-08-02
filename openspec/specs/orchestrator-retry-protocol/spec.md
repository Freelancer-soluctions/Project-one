# Orchestrator Retry Protocol

## Purpose

Defines the Layer-3 orchestrator retry protocol that detects silent subagent exits (empty `<task_result>` or missing output-contract envelope) and recovers by re-delegating with a resume suffix, bounded retries, best-effort backoff, and telemetry. This protocol lives entirely in the orchestrator prompt and plugin layer — no OpenCode core changes required.

## Requirements

### Requirement: Silent exit detection
The orchestrator SHALL parse the `<task_result>` output after every `task` tool call and SHALL classify the delegation as a silent exit when the output is empty/whitespace or contains no `<output-contract>` envelope.

#### Scenario: Empty task_result triggers detection
- **WHEN** the orchestrator receives a `task` tool result whose `<task_result>` body is empty or whitespace-only
- **THEN** the orchestrator SHALL classify it as a silent exit
- **AND** SHALL trigger the retry protocol

#### Scenario: Missing envelope triggers detection
- **WHEN** the `task` tool result contains text but no `<output-contract>` envelope
- **THEN** the orchestrator SHALL classify it as a silent exit (undeliverable response)
- **AND** SHALL trigger the retry protocol

#### Scenario: Valid envelope passes through
- **WHEN** the `task` tool result contains a well-formed `<output-contract>` envelope with JSON payload
- **THEN** the orchestrator SHALL process it normally and SHALL NOT trigger the retry protocol

### Requirement: Re-delegation with resume suffix
When a silent exit is detected, the orchestrator SHALL re-delegate to the same subagent using the original delegation plus a resume message that references the `task_id`, states the retry number, and instructs the subagent to emit its deliverable.

#### Scenario: Resume suffix content
- **WHEN** the orchestrator re-delegates after a silent exit
- **THEN** the new delegation message SHALL include the `task_id` of the original delegation
- **AND** SHALL include the text "Your previous attempt produced NO output. Retry N/3:" where N is the current retry count
- **AND** SHALL include the full original delegation content

#### Scenario: Original delegation appended
- **WHEN** the orchestrator re-delegates after a silent exit
- **THEN** the re-delegation SHALL contain the original delegation text (not a summary) so the subagent has full context

#### Scenario: DELEGATION SUFFIX preserved on retry
- **WHEN** the orchestrator re-delegates after a silent exit
- **THEN** the message SHALL still end with the DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR) block
- **AND** no instruction SHALL appear after the suffix

#### Scenario: task_id is correlation text, not a tool argument
- **WHEN** the orchestrator re-delegates after a silent exit
- **THEN** the `task_id` SHALL be referenced as correlation text inside the resume message (soft resume = full context replay)
- **AND** it SHALL NOT be passed as a `task_id` argument to the task tool
- **AND** the subagent SHALL start a fresh session with the original delegation + retry notice appended
- **AND** the rationale SHALL be determinism + framework-independence: the opencode `task` tool DOES accept `task_id` for session resume, so "the subagent cannot access prior message contents" is NOT the reason; the restriction exists because every retry MUST replay the identical full delegation (comparable, self-contained outcomes) and MUST NOT depend on the framework's session-resurrection behavior, which is not guaranteed across retries

### Requirement: Bounded retries with best-effort backoff
The orchestrator SHALL retry a silent exit at most 3 times per delegation, with best-effort incremental backoff between attempts, then escalate to the user.

#### Scenario: Max three retries
- **WHEN** a delegation produces silent exits repeatedly
- **THEN** the orchestrator SHALL re-delegate up to 3 times (retryCount 1..3)
- **AND** SHALL NOT re-delegate a fourth time

#### Scenario: Success stops the retry loop
- **WHEN** a re-delegation produces a valid envelope with content
- **THEN** the orchestrator SHALL stop retrying and process the result normally

#### Scenario: Exhausted retries escalate
- **WHEN** retryCount reaches 3 and the delegation is still silent
- **THEN** the orchestrator SHALL escalate to the user with a summary of the failure including the agent name, task, and retry count
- **AND** SHALL record the escalation in the silent-exit audit log

#### Scenario: Best-effort incremental backoff between attempts
- **WHEN** the orchestrator schedules retry attempts
- **THEN** the orchestrator SHOULD apply best-effort backoff between retries: 2s before retry 1, 5s before retry 2, 10s before retry 3 (max 30s total) to avoid hammering the model provider
- **AND** the backoff SHALL NOT be rigidly enforced: if the orchestrator cannot pause within the turn, it MAY retry immediately — the plugin/guardrail layer supplies the real retry value (SHOULD, not SHALL, per user Phase-0 decision 3 and @planner Issue 4)

### Requirement: Silent-exit telemetry
The orchestrator SHALL record a `subagent.silent_exit` event for every silent exit (first occurrence or retry) by appending a single-line JSON payload to `.opencode/logs/subagent-silent-exit-audit.jsonl` using the bash `echo >>` mechanism with `mkdir -p` (the orchestrator has bash in its tool policy).

#### Scenario: Audit entry written on silent exit
- **WHEN** the orchestrator detects a silent exit (first occurrence or retry)
- **THEN** the orchestrator SHALL execute the exact mechanism:
  ```bash
  mkdir -p .opencode/logs && echo '{"eventType":"subagent.silent_exit","timestamp":"<ISO-8601>","session_id":"<session-id>","delegatedAgent":"<agent>","retryCount":<N>,"failureReason":"<reason>"}' >> .opencode/logs/subagent-silent-exit-audit.jsonl
  ```
- **AND** the JSON payload SHALL contain: `eventType: "subagent.silent_exit"`, `timestamp` (ISO 8601), `session_id`, `delegatedAgent` (subagent type), `retryCount` (integer 0..3), `failureReason` (`"empty_task_result"` | `"missing_envelope"`)
- **AND** placeholders SHALL be substituted with real values at write time (the single-quoted echo body keeps the payload shell-safe)

#### Scenario: Audit log directory created with mkdir -p
- **WHEN** the first silent-exit audit entry is written
- **THEN** the `mkdir -p .opencode/logs` step SHALL create the directory if it does not exist (recursive)

#### Scenario: Audit entries are valid JSONL
- **WHEN** silent-exit audit entries are written
- **THEN** each line SHALL be valid JSON, one entry per line, no trailing comma
- **AND** string values SHALL use double quotes, and newlines/double quotes inside values SHALL be escaped (`\n`, `\"`) — no markdown code fences inside the payload

#### Scenario: Echo write failure is non-fatal
- **WHEN** the `echo >>` append fails (e.g., permission error)
- **THEN** the orchestrator SHALL continue the retry protocol (the failure SHALL be noted in the escalation summary but SHALL NOT abort the re-delegation)

### Requirement: Schema reuse for retry results
The orchestrator SHALL reuse the existing `orchestrator.schema.json` fields (`retryCount` integer and `result: 'retry'` enum) when reporting retry outcomes, without schema file changes.

#### Scenario: Retry outcome reported with existing schema
- **WHEN** the orchestrator reports a retry outcome in its output contract
- **THEN** it SHALL use the existing `retryCount` field and `result: 'retry'` enum value from `orchestrator.schema.json`
- **AND** no schema file modification SHALL be required

#### Scenario: Retry outcome envelope includes the required error object
- **WHEN** the orchestrator emits a retry result
- **THEN** the envelope SHALL use `responseType: "failure"`, `result: "retry"`, `retryCount: N`, AND an `error` object with `code: "SILENT_EXIT"`, `message: "Subagent returned empty output, retrying delegation"`, and `details: "<delegation summary>"`
- **AND** validation SHALL pass (no contract-audit.jsonl entry)
