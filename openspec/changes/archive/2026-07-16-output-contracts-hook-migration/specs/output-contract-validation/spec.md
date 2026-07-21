# ADDED Requirements — Output Contract Validation (Hook Plugin Delta)

This delta spec defines 7 new requirements (17 scenarios) added by the `output-contracts-hook-migration` change. These augment the existing main spec at `openspec/specs/output-contract-validation/spec.md` with Layer 2 (hook runtime validation) behavior.

---

## ADDED Requirements

### Requirement: Plugin Hook Registration
The system SHALL register an OpenCode plugin at `.opencode/plugins/output-contracts.ts` that hooks into `tool.execute.after` to validate subagent output contracts programmatically.

#### Scenario: Plugin loads at OpenCode startup
- **WHEN** OpenCode starts and `.opencode/plugins/output-contracts.ts` exists
- **THEN** the plugin registers a `tool.execute.after` hook
- **AND** no console error is emitted unless the plugin file is malformed

#### Scenario: Validator import failure is non-fatal
- **WHEN** the dynamic import of `contractValidator.js` fails (file moved, ajv missing, etc.)
- **THEN** the plugin logs `console.error` with FATAL prefix and the failing path
- **AND** returns a no-op validator that always reports `{ valid: true, degraded: true }`
- **AND** no session crashes as a result

### Requirement: Subagent Completion Hook Firing
The hook SHALL fire only for `tool.execute.after` events where `input.tool === "task"` and ignore all other tool invocations.

#### Scenario: Hook fires for task tool
- **WHEN** a subagent completes via the `task` tool
- **THEN** the hook is invoked with `input.tool === "task"`, `input.args.subagent_type` set to the agent name, `output.output` containing the subagent final message wrapped in `<task_result>...</task_result>`

#### Scenario: Hook ignores non-task tools
- **WHEN** tools such as bash, read, write, edit, glob, grep fire their `tool.execute.after`
- **THEN** the plugin returns immediately without running validation

#### Scenario: Task_result format change causes graceful fallback
- **WHEN** `output.output` does not match the expected `<task_result>...</task_result>` format (e.g., OpenCode format changed upstream)
- **THEN** the plugin logs a `console.warn` with the unrecognized format
- **AND** falls back to no-validation mode (no audit log entry, no metadata annotation)
- **AND** the session continues without crash

### Requirement: Valid Contract Handling
When the subagent's envelope passes validation, the plugin SHALL NOT log or annotate.

#### Scenario: Valid contract
- **WHEN** `validateContract(subagentMessage, agentName)` returns `{ valid: true, degraded: false }`
- **THEN** no entry is written to `.opencode/logs/contract-audit.jsonl`
- **AND** `output.metadata.contractValidation` is NOT set
- **AND** in-memory telemetry counter for the agent's `total` is incremented by 1
- **AND** `failed` counter is NOT incremented

#### Scenario: Degraded contract (schema file missing)
- **WHEN** `validateContract(...)` returns `{ valid: true, degraded: true }`
- **THEN** no audit log entry is written (degraded is not failure)
- **AND** `output.metadata` is NOT annotated
- **AND** in-memory telemetry `total` increments, `failed` does not

### Requirement: Invalid Contract Audit Logging
When the subagent's envelope fails validation, the plugin SHALL write a JSONL entry to `.opencode/logs/contract-audit.jsonl` and increment telemetry counters.

#### Scenario: Audit log entry written
- **WHEN** `validateContract(...)` returns `{ valid: false, errors: [...] }`
- **THEN** a JSONL line is appended to `.opencode/logs/contract-audit.jsonl` with fields:
  - `timestamp`: ISO 8601 string
  - `agent`: the subagent_type string
  - `task`: the output.title or "(unknown task)"
  - `sessionId`: the input.sessionID
  - `callId`: the input.callID
  - `validationErrors`: array of {field, message} from verdict.errors
  - `retryCount`: 0 (no retry from hook)
  - `degraded`: false
- **AND** in-memory telemetry `total++ failed++` for the agent
- **AND** `console.warn` is emitted with summary "[output-contracts] FAILED: @${agent} returned malformed output contract. N error(s). Task: '...'. See .opencode/logs/contract-audit.jsonl"

#### Scenario: Audit log write failure is non-fatal
- **WHEN** `fs.appendFileSync` throws (permission denied, disk full, etc.)
- **THEN** the error is caught and logged via `console.error`
- **AND** the session continues without crash
- **AND** telemetry counters are still incremented (audit logic runs before disk write attempt)

### Requirement: Metadata Annotation for Layer 3
The plugin SHALL set `output.metadata.contractValidation` when validation fails, enabling Layer 3 (orchestrator.md) to programmatically detect and escalate.

#### Scenario: Metadata set on failure
- **WHEN** `validateContract(...)` returns `{ valid: false }`
- **THEN** `output.metadata.contractValidation` is set to:
  ```json
  {
    "valid": false,
    "agent": "<agent_name>",
    "version": <envelope_version>,
    "errors": [{"field": "...", "message": "..."}],
    "degraded": false
  }
  ```
- **IF** `output.metadata` was previously null/undefined, it is initialized to `{}`
- **IF** metadata propagation to parent agent context fails (tested separately), the plugin falls back to JSONL-only mode — the audit log entry is still written regardless

#### Scenario: Metadata propagation fallback mode
- **WHEN** `output.metadata.contractValidation` does not reach the parent agent's context (e.g., an OpenCode version regression introduces MCP-shape behavior for the `task` tool, removing metadata propagation)
- **THEN** the plugin continues to write JSONL audit log entries (these are guaranteed by direct `fs.appendFileSync` calls, independent of metadata propagation)
- **AND** `console.warn` is still emitted on validation failures
- **AND** the Layer 3 (orchestrator escalation) route is documented as degraded but not broken (orchestrator can still parse the audit log if configured to do so)
- **AND** Task 3.2 documents the specific failure mode observed (e.g., "metadata not propagated; falling back to JSONL-only mode")

### Requirement: Output Non-Mutation
The plugin SHALL NOT mutate `output.output` regardless of validation result. Layer 2 is observe-only.

#### Scenario: Valid contract — output unchanged
- **WHEN** validation passes
- **THEN** `output.output` string is identical to its pre-hook value

#### Scenario: Invalid contract — output unchanged
- **WHEN** validation fails
- **THEN** `output.output` string is identical to its pre-hook value
- **AND** the audit log entry and metadata annotation are the only side effects

#### Scenario: Rationale documented in plugin source
- **WHEN** a developer reads `.opencode/plugins/output-contracts.ts` source
- **THEN** they find a comment block explaining: (1) validator reports what's wrong but not the correct value, (2) `<task_result>` wrapper must be preserved for parent-agent parsing, (3) Layer 1 self-validation handles correction via retry, (4) Layer 3 orchestrator can re-delegate on metadata.contractValidation signal

### Requirement: Telemetry Counters
The plugin SHALL maintain in-memory telemetry counters per agent name, providing observability of contract validation failure rates.

#### Scenario: Telemetry counters increment per task tool invocation
- **WHEN** the `task` tool completes for a given `subagent_type`
- **THEN** `telemetry[subagent_type].total` increments by 1
- **IF** validation fails, `telemetry[subagent_type].failed` also increments by 1

#### Scenario: Telemetry counters are in-memory (no persistence)
- **WHEN** OpenCode restarts or plugin is reloaded
- **THEN** all telemetry counters reset to empty state (`{}`)
- **AND** the JSONL audit log remains the persistent record (not reset)

#### Scenario: Concurrent delegations are thread-safe
- **WHEN** multiple `task` tool calls complete in quick succession across different agents (e.g., developer, researcher, git-manager)
- **THEN** telemetry counters for each agent are independent
- **AND** `fs.appendFileSync` calls serialize safely on Node.js (single-threaded event loop, atomic for small writes)
